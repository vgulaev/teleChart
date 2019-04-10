class TC20 {

  *smothDrawLineChart() {
    let f = this.graph.scales[0], t = this.graph.scales[1];
    let c = {min: f.min, max: f.max}, s = 25;
    if ('area' == this.type) s = 1;
    let dn = (t.min - f.min) / s, dx = (t.max - f.max) / s;
    yield 'start';
    while (2 == this.graph.scales.length) {
      let l = this.graph.scales[1];
      if (t.min != l.min || t.max != l.max) {
        t = l;
        dn = (t.min - c.min) / s;
        dx = (t.max - c.max) / s;
      }
      c.min += dn;
      c.max += dx;
      if (Math.abs(c.min - t.min) < 2 * Math.abs(dn)) {
        dn = 0;
        c.min = t.min;
      }
      if (Math.abs(c.max - t.max) < 2 * Math.abs(dx)) {
        dx = 0;
        c.max = t.max;
      }
      let [a, b] = this.getABfromScroll();
      this.drawChart(a, b, c, this.graph);
      if (dx == 0 && dn == 0) {
        this.graph.scales.shift();
        break;
      }
      yield true;
    }
  }

  addEventListenerToPanel() {
    let s = this.panel.scrollBox, p = this.svgPanel;

    p.addEventListener('mousedown', (e) => {
      this.onStart(e.pageX, 0);
    });

    p.addEventListener('touchstart', (e) => {
      this.onStart(Math.round(e.touches[0].pageX), 0.1);
    });

    p.addEventListener('mousemove', (e) => {
      this.onMove(Math.round(e.pageX));
    });

    p.addEventListener('touchmove', (e) => {
      this.onMove(Math.round(e.touches[0].pageX));
    });

    p.addEventListener('mouseup', (e) => {
      s.target = undefined;
    });

    p.addEventListener('mouseleave', (e) => {
      s.target = undefined;
    });

    document.addEventListener('touchend', (e) => {
      s.target = undefined;
    });
  }

  animationStep() {
    this.animationTime = performance.now();
    let c = false;
    if (this.animationStack.size > 0) {
      c = true;
      for (let [k, v] of this.animationStack.entries()) {
        let n = k.next();
        if (undefined == n.value) this.animationStack.delete(k);
      }
    }

    if (c) {
      requestAnimationFrame(() => this.animationStep())
    };
  }

  static circle(cx, cy, r, o = {}) {
    let e = TeleChart.createSVG('circle');
    TC20.setA(e, Object.assign({'cx': cx, 'cy': cy, 'r': r}, o));
    return e;
  }

  constructor(tagID, data, o = {}) {
    TC20.monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    TC20.monthShort = ['Jan', 'Feb', 'Mar','Apr', 'May', 'Jun', 'Jul','Aug', 'Sep', 'Oct','Nov', 'Dec'];
    TC20.dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let width = o['width'];
    if (true == o['widthToPage']) {
      width = document.body.clientWidth - 10;
    }

    this.statusTag = document.getElementById('Status');
    this.divRoot = document.getElementById(tagID);
    this.divRoot.innerHTML = '';
    this.divRoot.style.width = width;

    let h1 = Math.floor(o['heightPanel'] * 0.03);
    this.panel = {
      width: width,
      height: o['heightPanel'],
      yb: h1,
      radius: Math.floor(o['heightPanel'] * 0.1),
      scrollBox: {
        width: Math.floor(width * 0.25),
        x: 0,
        // Math.floor(width * 0.2),
        h1: h1,
        w1: Math.min(Math.floor(width * 0.03), 30)
      }
    };
    this.graph = {
      scales: [], yb: 0,
      height: o['height']
    };

    this.prepareData(data);
    this.createHeader();
    this.svgRoot = TC20.createSVG('svg');
    TC20.setA(this.svgRoot, {height: o['height'] + 'px', width: width + 'px'});
    this.divRoot.append(this.svgRoot);

    this.svgPanel = TC20.createSVG('svg');
    TC20.setA(this.svgPanel, {height: o['heightPanel'] + 'px', width: width + 'px', 'style': `border-radius: ${this.panel.radius}px;`});

    this.divRoot.append(this.svgPanel);

    this.width = this.svgPanel.width.animVal.value;
    this.height = this.svgRoot.height.animVal.value;
    this.animationStack = new Set();
    this.semafors = {};

    for (let i of this.allItems){
      let o = {'d': '', 'stroke-width': 2, 'stroke': this.data.raw.colors[i], 'fill': 'none'};
      if ('area' == this.type || 'bar' == this.type){
      // || 'bar' == this.type
        o = {'d': '', 'stroke-width': 0, 'fill': this.data.raw.colors[i]};
      }
      this.graph[i] = TC20.path(o);
      this.svgRoot.append(this.graph[i]);
      this.panel[i] = TC20.path(o);
      this.svgPanel.append(this.panel[i]);
    }
    this.render();
    this.count = 0;
  }

  createHeader() {
    this.header = document.createElement('div');
    this.header.innerHTML = `<h3 style='display: inline-block; margin: 0;'>${this.data.raw.caption}</h3><h5 id='dateRange' style='float: right; display: inline-block; margin: 0;'></h5>`;
    this.divRoot.append(this.header);
    this.dateRange = this.header.querySelector('#dateRange');
  }

  static createSVG(tag) {
    return document.createElementNS(TeleChart.xmlns, tag);
  }

  createScrollElement() {
    let style = {'stroke-width': 0, 'fill': '#C0D1E1', 'opacity': '0.9'};
    let s = this.panel.scrollBox;
    s.leftBox = TC20.path(style);
    s.rightBox = TC20.path(style);
    s.top = TC20.rect(0, 0, 0, 0, style);
    s.bottom = TC20.rect(0, 0, 0, 0, style);
    style = {'stroke-width': 0, 'fill': '#e2eef9', 'opacity': '0.6'};
    s.leftMask = TC20.rect(0, 0, 0, 0, style);
    s.rightMask = TC20.rect(0, 0, 0, 0, style);
    ['leftMask', 'rightMask', 'top', 'leftBox', 'rightBox', 'bottom']
      .forEach(item => this.svgPanel.append(s[item]));
    }

  doAnimation(a) {
    if (a != undefined) {
      this.animationStack.add(a);
      a.next();
    }

    requestAnimationFrame(() => this.animationStep());
  }

  drawAreaChart(a, b, s) {
    let l = Array.from(this.allItems).sort();
    let t = 0, c = 0;
    let d = {}, p = {}, vy = {};
    let y = this.data.y, h = s.height - 2 * s.yb;
    let dx = this.width / (b - a);
    l.forEach(e => {p[e] = new Array(b - a + 1); d[e] = ''; vy[e] = new Array(b - a + 1)});
    for (let i = a; i <= b; i++) {
      t = 0;
      for (let e of l) {
        t += y[e][i];
      }
      c = 0;
      for (let e of l) {
        p[e][i - a] = Math.round(y[e][i] / t * 100);
        c += p[e][i - a];
        vy[e][i - a] = Math.round(h * c / 100) + s.yb;
      }
    }
    let f = [], m = vy[l[0]].length;
    for (let e = 0; e < l.length; e++) {
      let q = '', r = '';
      for (let i = 0; i < m; i++) {
        q += `L${Math.round(dx*i)},${vy[l[e]][i]}`;
        r += `L${Math.round(dx*(m - i - 1))},${vy[l[e]][m - i - 1]}`
      }
      f.push([q, r]);
      if (0 == e) {
        q = `M0,${s.yb}L${this.width},${s.yb}` + r;
      } else if (l.length - 1 == e) {
        q = f.shift()[0] + `L${this.width},${s.height-s.yb}L0,${s.height-s.yb}`;
      } else {
        q = f.shift()[0] + r;
      }
      q += 'z';
      TC20.setA(s[l[e]], {d: 'M' + q.substring(1)});
    }
  }

  drawBarChart(a, b, mm, s) {
    let dx = 'h' + (this.width / (b - a + 1)).toFixed(2);
    let sy = (s.height - 2 * s.yb) / mm.max;
    let y = Math.floor(s.height - this.data.y['y0'][a] * sy);
    let dy = 0, yy = s.yb;
    let d = `M0,${y}` + dx;
    for (let i = a + 1; i <= b; i++) {
      yy = Math.floor(s.height - this.data.y['y0'][i] * sy);
      dy = yy - y;
      d += (`v${dy}` + dx);
      y = yy;
    }
    d += `L${this.width},${s.height - s.yb}L${0},${s.height - s.yb}z`;
    TC20.setA(s['y0'], {d: d});
  }

  drawChart(a, b, c, s) {
    if ('bar' == this.type && undefined == this.data.raw.stacked) {
      this.drawBarChart(a, b, c, s);
    } else if ('bar' == this.type && true == this.data.raw.stacked) {
      this.drawStackedBarChart(a, b, c, s);
    } else if ('line' == this.type) {
      this.drawLineChart(a, b, c, s);
    } else if ('area' == this.type) {
      this.drawAreaChart(a, b, s);
    }
  }

  drawChartOnPanel() {
    let m = this.data.length - 1;
    this.drawChart(0, m, this.getMinMax(0, m), this.panel);
  }

  drawLineChart(a, b, mm, s) {
    for (let i of this.allItems) {
      TC20.setA(s[i], {d: this.getD(0, 2 * s.yb, this.width, s.height - 3 * s.yb, s.height, mm.min, mm.max, this.data.y[i], a, b + 1)});
    }
  }

  drawPanel() {
    this.drawChartOnPanel();
    this.createScrollElement();
    this.drawScroll();
    this.addEventListenerToPanel();
  }

    drawScroll() {
    let s = this.panel.scrollBox;
    let x1 = s.x + s.w1, x2 = s.x + s.width - s.w1, h1 = s.h1;
    TC20.setA(s.leftBox, {d: this.panelBracket(x1, 1)});
    TC20.setA(s.rightBox, {d: this.panelBracket(x2, -1)});
    TC20.setA(s.top, {x: x1, y: 0, width: x2 - x1, height: s.h1});
    TC20.setA(s.bottom, {x: x1, y: this.panel.height - s.h1, width: x2 - x1, height: s.h1});
    TC20.setA(s.leftMask, {x:0, y: h1, width: x1, height: this.panel.height - 2 * h1});
    TC20.setA(s.rightMask, {x: x2, y: h1, width: this.panel.width - x2, height: this.panel.height - 2 * h1});
  }

  drawStackedBarChart(a, b, mm, s) {
    let l = Array.from(this.allItems).sort();
    let t = 0, c = 0;
    let d = {}, p = {}, vy = {};
    let y = this.data.y, h = s.height - 2 * s.yb;
    let dy = h / mm.max;
    let dx = this.width / (b - a + 1);
    l.forEach(e => {p[e] = new Array(b - a + 1); d[e] = ''; vy[e] = new Array(b - a + 1)});
    for (let i = a; i <= b; i++) {
      c = 0;
      for (let e of l) {
        p[e][i - a] = y[e][i];
        c += p[e][i - a];
        vy[e][i - a] = s.height - Math.round(c * dy) - s.yb;
      }
    }
    let f = [], m = vy[l[0]].length;
    for (let e = 0; e < l.length; e++) {
      let q = '', r = '';
      for (let i = 0; i < m; i++) {
        let xx = Math.round(dx*i);
        q += `L${xx},${vy[l[e]][i]}h${dx}`;
        r += `L${Math.round(dx*(m - i))},${vy[l[e]][m - i - 1]}h${-dx}`
      }
      f.push([q, r]);
      if (0 == e) {
        q = q + `L${this.width},${s.height - s.yb}L0,${s.height - s.yb}`;
      } else {
        q = f.shift()[0] + r;
      }
      q += 'z';
      TC20.setA(s[l[e]], {d: 'M' + q.substring(1)});
    }
  }

  getABfromScroll() {
    let s = this.panel.scrollBox;
    let a = Math.ceil(s.x / this.width * (this.data.length - 1));
    let b = Math.floor((s.x + s.width) / this.width * (this.data.length - 1));
    return [a, b];
  }

  getD(x0, y0, dx, dy, h, minY, maxY, d, a, b) {
    let scaleX = dx / (b - a - 1);
    let scaleY = dy / (maxY - minY);
    let x = x0;
    let y = h - y0 - (d[a] - minY) * scaleY;
    let res = `M${x},${y} `;
    for (let i = a + 1; i < b; i++){
      x = Math.floor(x0 + scaleX * (i - a));
      y = Math.floor(h - y0 - (d[i] - minY) * scaleY);
      res += `L${x},${y} `
    }
    return res;
  }

  getMinMax(a, b) {
    let r;
    if ('bar' == this.type && true == this.data.raw.stacked) {
      r = this.getMinMaxForStackedBar(a, b);
    } else {
      r = this.getMinMaxElse(a, b);
    }
    return r;
  }

  getMinMaxElse(a, b) {
    let min = Infinity, max = -Infinity;
    for (let item of this.allItems) {
      for (let i = Math.ceil(a); i <= b; i++) {
        let j = this.data.y[item][i];
        if (j < min) min = j;
        if (j > max) max = j;
      }
    }
    return {min: min, max: max};
  }

  getMinMaxForStackedBar(a, b) {
    let max = -Infinity, s = 0;
    for (let i = Math.ceil(a); i <= b; i++) {
      s = 0;
      for (let e of this.allItems) {
        s += this.data.y[e][i];
      }
      if (s > max) max = s;
    }
    return {min: 0, max: max};
  }

  getTime(callBack) {
    let s = performance.now();
    callBack.call(this);
    let e = performance.now();
    console.log(callBack.name, 'time is: ', e - s);
  }

  msg(text) {
    this.statusTag.innerHTML = text;
  }

  onMove(x) {
    let s = this.panel.scrollBox, w = this.panel.width;
    if (undefined != s.target) {
      let dx = x - s.mouseXStart;
      let mw = Math.floor(w * 0.25);
      if ('mid' == s.target) {
        s.x = s.reper + dx;
        if (s.x + s.width > w) {
          s.x = w - s.width;
        } else if (s.x < 0) {
          s.x = 0;
        }
      } else if ('right' == s.target) {
        s.width = s.reper + dx;
        if (s.x + s.width > w) {
          s.width = w - s.x;
        } else if (s.width < mw) {
          s.width = mw;
        }
      } else if ('left' == s.target) {
        s.width = s.reper.w - dx;
        s.x = s.reper.x + dx;
        if (s.x < 0) {
          s.x = 0;
          s.width = s.reper.w + s.reper.x;
        } else if (s.width < mw) {
          s.width = mw;
          s.x = s.reper.x + s.reper.w - s.width
        }
      }
      requestAnimationFrame(() => {
        this.requestExec(this.drawScroll);
        this.requestDrawGraph();
        this.updateDateRange();
      });
    }
  }

  onStart(x, k) {
    let s = this.panel.scrollBox;
    let r = s.rightBox.getBoundingClientRect();
    let l = s.leftBox.getBoundingClientRect();
    let dw = s.width * k;
    let rlx = r.left - dw;
    let rx = r.right + dw;
    if (rlx < x && x < rx) {
      s.mouseXStart = x;
      s.reper = s.width;
      s.target = 'right';
    }
    let lx = l.left - dw;
    let lrx = l.right + dw;
    if (lx < x && x < lrx) {
      s.mouseXStart = x;
      s.reper = {x: s.x, w: s.width};
      s.target = 'left';
    }
    if (lrx < x && x < rlx) {
      s.mouseXStart = x;
      s.reper = s.x;
      s.target = 'mid';
    }
  }

  panelBracket(x, k) {
    let h1 = this.panel.height, r1 = this.panel.radius, dx1 = this.panel.scrollBox.w1 - r1;
    return `M${x},0 h${-dx1 * k} a${r1},${r1},0,0,${1 == k ? 0 : 1},${-r1 * k},${r1} l0,${h1 - 2 * r1} a${r1},${r1},0,0,${1 == k ? 0 : 1},${r1 * k},${r1} h${dx1 * k} z`;
  }

  static path(o = {}) {
    let e = TeleChart.createSVG('path');
    TC20.setA(e, o);
    return e;
  }

  prepareData(data) {
    this.data = {x : [], y: {}, raw: data};
    this.allItems = new Set(Object.keys(data.names));
    for (let col of data.columns) {
      if ('x' == col[0]) {
        for (let i = 1; i < col.length; i++) {
          this.data.x.push(new Date(col[i]));
        }
      } else {
        let n = col[0];
        this.data.y[n] = col.slice(1);
      }
    }
    this.data.length = this.data.x.length;
    this.type = data.types['y0'];
    delete this.data.raw.columns
  }

  static rect(x, y, w, h, o = {}) {
    let e = TC20.createSVG('rect');
    TC20.setA(e, Object.assign({'x': x, 'y': y, 'width': w, 'height': h}, o));
    return e;
  }

  render() {
    // this.getTime(() => {
    //   for (let i = 0; i < 1000; i++) {
    //   this.getMinMax(0, this.data.length - 1)
    //   }
    // });
    this.drawPanel();
    let [a, b] = this.getABfromScroll();
    let mm = this.getMinMax(a, b);
    this.graph.scales.push(mm);
    this.updateDateRange();
    this.drawChart(a, b, mm, this.graph);
  }

  requestDrawGraph() {
    let [a, b] = this.getABfromScroll();
    let mm = this.getMinMax(a, b);
    if (2 == this.graph.scales.length) {
      this.graph.scales[1] = mm;
    } else {
      this.graph.scales.push(mm);
      let a = this.smothDrawLineChart();
      this.doAnimation(a);
    }
  }

  requestExec(call) {
    let n = call.name;
    if ('recall' == this.semafors[n]) return;
    if ('work' == this.semafors[n]) {
      this.semafors[n] = 'recall';
      this.count += 1;
      this.msg(this.count);
    } else {
      this.semafors[n] = 'work';
      new Promise((resolve, reject) => {
        call.call(this);
        resolve();
      })
        .then(() => {
          this.semafors[n] = '';
          if ('recall' == this.semafors[n]) this.requestExec(call);
        });
    }
  }

  static setA(e, a) {
    Object.keys(a).map(k => {
      e.setAttributeNS(null, k, a[k]);
    });
  }

  updateDateRange() {
    let [a, b] = this.getABfromScroll();
    this.dateRange.innerHTML = this.wMMDD(this.data.x[a]) + ' - ' + this.wMMDD(this.data.x[b]);
  }

  wMMDD(d) {
    return [d.getDate(), TC20.monthNames[d.getMonth()], d.getFullYear()].join(' ');
    // return TC20.monthNames[date.getDay()] + ', ' + this.mmDD(date);
  }

  static get xmlns() {
    return "http://www.w3.org/2000/svg";
  }

}
