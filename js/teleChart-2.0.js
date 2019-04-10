class TC20 {

  *moveCircle() {
    let startTime = performance.now();
    let x = 100;
    yield 'start';
    while (true) {
      let dx = (this.animationTime - startTime) / 1000 * 150;
      this.panel.scrollBox.leftBox.setAttributeNS(null, 'd', this.panelBracket((x + dx) % this.width, 1));
      yield true;
    }
  }

  *smothDrawLineChart() {
    let f = this.graph.scales[0]
    let t = this.graph.scales[1];
    let s = 25;
    if ('area' == this.type) s = 1;
    let dn = (t.min - f.min) / s;
    let dx = (t.max - f.max) / s;
    let c = {min: f.min, max: f.max};
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
    let s = this.panel.scrollBox;

    this.svgPanel.addEventListener('mousedown', (eventData) => {
      this.onStart(eventData.pageX, 0);
    });

    this.svgPanel.addEventListener('touchstart', (eventData) => {
      this.onStart(Math.round(eventData.touches[0].pageX), 0.1);
    });

    this.svgPanel.addEventListener('mousemove', (eventData) => {
      this.onMove(Math.round(eventData.pageX));
    });

    this.svgPanel.addEventListener('touchmove', (eventData) => {
      this.onMove(Math.round(eventData.touches[0].pageX));
    });

    this.svgPanel.addEventListener('mouseup', (eventData) => {
      s.target = undefined;
    });

    this.svgPanel.addEventListener('mouseleave', (eventData) => {
      s.target = undefined;
    });

    document.addEventListener('touchend', (eventData) => {
      s.target = undefined;
    });
  }

  animationStep() {
    this.animationTime = performance.now();
    let callNextStep = false;
    if (this.animationStack.size > 0) {
      callNextStep = true;
      for (let [key, value] of this.animationStack.entries()) {
        let cont = key.next();
        if (undefined == cont.value) this.animationStack.delete(key);
      }
    }

    if (callNextStep) {
      requestAnimationFrame(() => this.animationStep())
    };
  }

  static circle(cx, cy, r, options = {}) {
    let element = TeleChart.createSVG('circle');
    TC20.setA(element, Object.assign({'cx': cx, 'cy': cy, 'r': r}, options));
    return element;
  }

  constructor(tagID, data, options = {}) {
    let width = options['width'];
    if (true == options['widthToPage']) {
      width = document.body.clientWidth - 10;
    }

    this.statusTag = document.getElementById('Status');
    this.divRoot = document.getElementById(tagID);
    this.divRoot.innerHTML = '';
    this.divRoot.style.width = width;

    let h1 = Math.floor(options['heightPanel'] * 0.03);
    this.panel = {
      width: width,
      height: options['heightPanel'],
      yb: h1,
      radius: Math.floor(options['heightPanel'] * 0.1),
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
      height: options['height']
    };

    this.svgRoot = TC20.createSVG('svg');
    TC20.setA(this.svgRoot, {height: options['height'] + 'px', width: width + 'px'});
    this.divRoot.append(this.svgRoot);

    this.svgPanel = TC20.createSVG('svg');
    TC20.setA(this.svgPanel, {height: options['heightPanel'] + 'px', width: width + 'px', 'style': `border-radius: ${this.panel.radius}px;`});

    this.divRoot.append(this.svgPanel);

    this.width = this.svgPanel.width.animVal.value;
    this.height = this.svgRoot.height.animVal.value;
    this.animationStack = new Set();
    this.semafors = {};
    this.prepareData(data);

    for (let i of this.allItems) {
      let o = {'d': '', 'stroke-width': 2, 'stroke': this.data.raw.colors[i], 'fill': 'none'};
      if ('area' == this.type) {
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

  static createSVG(tag) {
    return document.createElementNS(TeleChart.xmlns, tag);
  }

  createScrollElement() {
    let style = {'stroke-width': 0, 'fill': '#C0D1E1', 'opacity': '0.9'};
    this.panel.scrollBox.leftBox = TC20.path(style);
    this.panel.scrollBox.rightBox = TC20.path(style);
    this.panel.scrollBox.top = TC20.rect(0, 0, 0, 0, style);
    this.panel.scrollBox.bottom = TC20.rect(0, 0, 0, 0, style);
    style = {'stroke-width': 0, 'fill': '#e2eef9', 'opacity': '0.6'};
    this.panel.scrollBox.leftMask = TC20.rect(0, 0, 0, 0, style);
    this.panel.scrollBox.rightMask = TC20.rect(0, 0, 0, 0, style);
    ['leftMask', 'rightMask', 'top', 'leftBox', 'rightBox', 'bottom']
      .forEach(item => this.svgPanel.append(this.panel.scrollBox[item]));
    }

  doAnimation(animation) {
    if (animation != undefined) {
      this.animationStack.add(animation);
      animation.next();
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
    let d = `M0,${y}` + dx
    for (let i = a + 1; i <= b; i++) {
      yy = Math.floor(s.height - this.data.y['y0'][i] * sy);
      dy = yy - y;
      d += (`v${dy}` + dx);
      y = yy;
    }
    TC20.setA(s['y0'], {d: d});
  }

  drawChart(a, b, c, s) {
    if ('bar' == this.type) {
      this.drawBarChart(a, b, c, s);
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
    let x1 = s.x + s.w1;
    let x2 = s.x + s.width - s.w1;
    let h1 = s.h1;
    TC20.setA(s.leftBox, {d: this.panelBracket(x1, 1)});
    TC20.setA(s.rightBox, {d: this.panelBracket(x2, -1)});
    TC20.setA(s.top, {x: x1, y: 0, width: x2 - x1, height: s.h1});
    TC20.setA(s.bottom, {x: x1, y: this.panel.height - s.h1, width: x2 - x1, height: s.h1});
    TC20.setA(s.leftMask, {x:0, y: h1, width: x1, height: this.panel.height - 2 * h1});
    TC20.setA(s.rightMask, {x: x2, y: h1, width: this.panel.width - x2, height: this.panel.height - 2 * h1});
  }

  getABfromScroll() {
    let s = this.panel.scrollBox;
    let a = Math.ceil(s.x / this.width * (this.data.length - 1));
    let b = Math.floor((s.x + s.width) / this.width * (this.data.length - 1));
    return [a, b];
  }

  getD(x0, y0, dx, dy, height, minY, maxY, data, a, b) {
    let scaleX = dx / (b - a - 1);
    let scaleY = dy / (maxY - minY);
    let x = x0;
    let y = height - y0 - (data[a] - minY) * scaleY;
    let res = `M${x},${y} `;
    for (let i = a + 1; i < b; i++){
      x = Math.floor(x0 + scaleX * (i - a));
      y = Math.floor(height - y0 - (data[i] - minY) * scaleY);
      res += `L${x},${y} `
    }
    return res;
  }

  getMinMax(a, b) {
    let min = Infinity;
    let max = -Infinity;

    for (let item of this.allItems) {
      for (let i = Math.ceil(a); i <= b; i++) {
        let j = this.data.y[item][i];
        if (j < min) min = j;
        if (j > max) max = j;
      }
    }
    return {min: min, max: max};
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
    let s = this.panel.scrollBox;
    if (undefined != s.target) {
      let dx = x - s.mouseXStart;
      let mw = Math.floor(this.panel.width * 0.25);
      if ('mid' == s.target) {
        s.x = s.reper + dx;
        if (s.x + s.width > this.panel.width) {
          s.x = this.panel.width - s.width;
        } else if (s.x < 0) {
          s.x = 0;
        }
      } else if ('right' == s.target) {
        s.width = s.reper + dx;
        if (s.x + s.width > this.panel.width) {
          s.width = this.panel.width - s.x;
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

  static path(options = {}) {
    let element = TeleChart.createSVG('path');
    TC20.setA(element, options);
    return element;
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

  static rect(x, y, width, height, options = {}) {
    let element = TC20.createSVG('rect');
    TC20.setA(element, Object.assign({'x': x, 'y': y, 'width': width, 'height': height}, options));
    return element;
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

  static setA(element, atts) {
    Object.keys(atts).map(key => {
      element.setAttributeNS(null, key, atts[key]);
    });
  }

  static get xmlns() {
    return "http://www.w3.org/2000/svg";
  }

}
