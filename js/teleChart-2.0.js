class TC20 {

  *animateCircleInButton(target, duration, direction) {
    let startTime = performance.now();
    if (1 == direction) target.style.display = 'inline';
    yield 'start';
    while (true) {
      if (startTime + duration > this.animationTime) {
        let progres = direction * (-0.5 + (this.animationTime - startTime) / duration) + 0.5;
        target.setAttributeNS(null, 'r', 12 * progres);
        yield performance.now()- startTime;
      } else {
        if (-1 == direction) target.style.display = 'none';
        yield undefined;
        break;
      }
    }
  }

  *animateXLabelRemove(target, duration, direction) {
    let startTime = performance.now();
    yield 'start';
    while (true) {
      if (startTime + duration > this.animationTime) {
        let progres = direction * (-0.5 + (this.animationTime - startTime) / duration) + 0.5;
        target.text.setAttributeNS(null, 'opacity',  progres);
        yield performance.now()- startTime;
      } else {
        break;
      }
    }
  }

  *anyCounter(from, to, steps, callBack) {
    if (from == to) {
      yield from;
      return;
    }
    let delta = (to - from) / steps;
    let curent = from;
    for (let i = 0; i < steps - 1; i++) {
      curent += delta;
      if (undefined != callBack) callBack.call(this, curent);
      yield curent;
    }
    if (undefined != callBack) callBack.call(this, to);
    yield to;
  }

  *smothDrawLineChart(obj) {
    let c = {};
    yield 'start';
    while (true) {
      for (let g of Object.keys(obj.transition)) {
        let v = obj.transition[g].next();
        if (v.done) {
          delete obj.transition[g];
        }
      }
      if (0 == Object.keys(obj.transition).length) break;
      let [a, b] = this.getABfromScroll();
      if (obj == this.panel) {
        a = 0; b = this.data.length - 1;
      }
      c = {min: obj.min, max: obj.max};
      this.drawChart(a, b, c, obj);
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
      this.removePointer();
    });

    this.svgRoot.addEventListener('mousemove', e => {
      this.onMoveGraph(Math.round(e.pageX), Math.round(e.pageY), Math.round(e.clientY));
    });

    this.svgRoot.addEventListener('touchmove', (e) => {
      this.onMoveGraph(Math.round(e.touches[0].pageX), Math.round(e.touches[0].pageY), Math.round(e.touches[0].clientY));
    });

    this.svgRoot.addEventListener('mouseleave', (e) => {
      this.removePointer();
    });

    this.svgRoot.addEventListener('click', (e) => {
      this.clickZoom();
    });

    this.divTips.addEventListener('click', (e) => {
      this.clickZoom();
    });

    this.divTips.addEventListener('touchstart', (e) => {
      this.clickZoom();
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

  button(name) {
    let c = this.data.raw.colors[name];
    return `<button id="${name}Button" style="border-radius: 40px; border: 2px solid ${c}; background-color: ${c}; margin-right: 10px; color: white; padding-right: 20px;">
      <svg width="15px" height="30px" style=" display: inline-block; vertical-align: middle;">
      <path class="mark" d="M 0,15 l7,7 l7,-12 l-4,0 l-3,7 l-3,-3 z" stroke-width="2" fill="white">
        </path>
      <circle class="whiteCircle" cy="20" cx="20" r="1" fill="white" style="display: none;"/>
      </svg>
      <span><b>${this.data.raw.names[name]}</b></span>
    </button>`;
  }

  static circle(cx, cy, r, o = {}) {
    let e = TeleChart.createSVG('circle');
    TC20.setA(e, Object.assign({'cx': cx, 'cy': cy, 'r': r}, o));
    return e;
  }

  clickZoom() {
    if (true != this.zoomMode) {
      this.zoomMode = true;
      this.zoomOutButton.style.display = 'inline-block';
      this.captionTag.style.display = 'none';
      let d = this.data.x[this.pointer.curX];
      let path = `${this.zoomPath}/${d.getFullYear()}-${this.l0(d.getMonth() + 1)}/${this.l0(d.getDate())}.json`;
      this.httpGetAsync(path)
        .then((data) => {
          this.zoom(JSON.parse(data));
        });
    }
  }

  constructor(tagID, data, o = {}) {
    TC20.monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    TC20.monthShort = ['Jan', 'Feb', 'Mar','Apr', 'May', 'Jun', 'Jul','Aug', 'Sep', 'Oct','Nov', 'Dec'];
    TC20.dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let width = o['width'];
    if (true == o['widthToPage']) {
      width = document.body.clientWidth - 10;
    }
    this.zoomData = data;
    this.width = width;
    this.zoomPath = o['zoomPath'];
    this.animationStack = new Set();
    this.semafors = {};

    this.statusTag = document.getElementById('Status');
    this.divRoot = document.getElementById(tagID);
    this.divRoot.innerHTML = '';
    this.divRoot.style.width = width;

    this.divTips = document.createElement('div');
    this.divTips.setAttribute('style', `display: none; position: absolute; background-color: white; left: 800px; top: 100px; border: 1px solid ${this.axisColor}; border-radius: 5px; white-space: nowrap; font-size: 12px;`);
    this.divRoot.append(this.divTips);

    this.prepareData(data);
    this.initInternalObjects(o);
    this.createHeader();
    this.initSVG(o, width);
    this.createFooter();

    this.height = this.svgRoot.height.animVal.value;

    this.initPathForGraphAndPanel();
    this.render();
    this.count = 0;
  }

  createFooter() {
    if (this.allItems.size > 1) {
      this.footer = document.createElement('div');
      this.divRoot.append(this.footer);

      for (let element of this.allItems) {
        this.footer.innerHTML += this.button(element);
      };

      for (let element of this.allItems) {
        let b = this.footer.querySelector(`#${element}Button`);
        b.addEventListener('click', eventData => {
          this.reCheck(b, element);
        });
      };
    };

    // let dayNight = document.createElement('div');
    // dayNight.style['text-align'] = 'center';
    // dayNight.innerHTML = `<button style="background-color: white; border: none; font-size: 18px; color: #108be3">${this.themeLabel()}</button>`;
    // this.divRoot.append(dayNight);
    // dayNight.querySelector('button').addEventListener('click', (eventData) => this.swithTheme(eventData));
  }

  createHeader() {
    let r = [];
    this.header = document.createElement('div');
    r.push(`<h4 id='captionTag' style='display: inline-block; margin: 0;'>${this.data.raw.caption}</h4>`);
    r.push(`<button id='zoomTag' style='display: none; background-color: white; border: none; font-size: 16px; color: #0083e1;'><img style='height: auto; width: 15%; vertical-align: middle; margin-right: 5px;' src="zoom.png"><b>Zoom Out</b></button>`);
    r.push(`<h5 id='dateRange' style='float: right; display: inline-block; margin: 0; user-select: none;'></h5>`);
    this.header.innerHTML = r.join('');
    this.divRoot.append(this.header);
    this.dateRange = this.header.querySelector('#dateRange');
    this.captionTag = this.header.querySelector('#captionTag');
    this.zoomOutButton = this.header.querySelector('#zoomTag');
    this.zoomOutButton.addEventListener('click', () => this.zoomOut());
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
    style = {'d': '', 'stroke-width': s.w1 / 4, 'stroke': 'white', 'fill': 'none'};
    s.leftLine = TC20.path(style);
    s.rightLine = TC20.path(style);
    ['leftMask', 'rightMask', 'top', 'leftBox', 'rightBox', 'bottom', 'leftLine', 'rightLine']
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
    let p = {}, vy = {};
    let y = this.data.y, h = s.height - 2 * s.yb;
    let dx = this.width / (b - a);
    l.forEach(e => {p[e] = new Array(b - a + 1); vy[e] = new Array(b - a + 1)});
    for (let i = a; i <= b; i++) {
      t = 0;
      for (let e of l) {
        t += y[e][i] * this.data.factor[e];
      }
      c = 0;
      for (let e of l) {
        p[e][i - a] = y[e][i] * this.data.factor[e] / t * 100;
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
    s.p = p;
  }

  drawBarChart(a, b, mm, s) {
    let dx = this.width / (b - a + 1);
    let sy = (s.height - 2 * s.yb) / mm.max;
    let y = Math.floor(s.height - this.data.y['y0'][a] * sy);
    let dy = 0, yy = s.yb;
    let d = `M0,${y}H` + dx;
    for (let i = a + 1; i <= b; i++) {
      yy = Math.floor(s.height - this.data.y['y0'][i] * sy);
      dy = yy - y;
      d += `v${dy}H` + Math.floor(dx * (i - a + 1));
      y = yy;
    }
    d += `L${this.width},${s.height - s.yb}L${0},${s.height - s.yb}z`;
    TC20.setA(s['y0'], {d: d});
  }

  drawBarPoiner() {
    let p = this.pointer;
    let sx = Math.floor((p.curX - p.a) * p.dx).toFixed(2);
    let scaleY = this.height / (this.graph.max - this.graph.min);
    for (let e of this.allItems) {
      let y = Math.floor(this.height - scaleY * this.data.y[e][p.curX]);
      TC20.setA(this.graph[e], {opacity: 0.5});
      let path = TC20.path({'d': `M${sx},${this.height}H${Math.floor(p.dx * (p.k + 1))}V${y}H${sx}`, 'stroke-width': 0, 'fill': this.data.raw.colors[e]});
      this.pointer.g.append(path);
    }
  }

  drawChart(a, b, c, s) {
    let display = (0 == this.viewItems.size ? 'none' : 'block');
    for (let e of this.allItems) {
      this.graph[e].style.display = display;
      this.panel[e].style.display = display;
    }
    if (0 == this.viewItems.size) return;
    s.min = c.min;
    s.max = c.max;
    if ('bar' == this.type && undefined == this.data.raw.stacked) {
      this.drawBarChart(a, b, c, s);
    } else if ('bar' == this.type && true == this.data.raw.stacked) {
      this.drawStackedBarChart(a, b, c, s);
    } else if ('line' == this.type) {
      this.drawLineChart(a, b, c, s);
    } else if ('area' == this.type) {
      this.drawAreaChart(a, b, s);
    }
    if (s == this.graph) {
      this.scaleXAxis();
      if (true == this.data.raw.y_scaled) {
        for (let e of Array.from(this.allItems).sort()) {
          this.scaleYAxis(this.graph.mm[e]);
          break;
        }
      } else {
        this.scaleYAxis(c);
      }
    }
  }

  drawChartOnPanel() {
    this.drawChart(0, this.data.length - 1, this.YAxis.mmOriginal, this.panel);
  }

  drawLineChart(a, b, mm, s) {
    let c = mm;
    for (let i of this.allItems) {
      if (true == this.data.raw.y_scaled) c = s.mm[i];
      TC20.setA(s[i], {d: this.getD(0, 2 * s.yb, this.width, s.height - 3 * s.yb, s.height, c.min, c.max, this.data.y[i], a, b + 1), opacity: this.data.factor[i]});
    }
  }

  drawLinePoiner() {
    let p = this.pointer;
    let viewX = p.dx * p.k;
    let scaleY = this.height / (this.graph.max - this.graph.min);

    let path = TC20.path({d: `M${viewX},${0}L${viewX},${this.height}`, 'stroke-width': 2, 'stroke': this.YAxis.gridColor, 'fill': 'none', opacity: 0.1});
    p.g.append(path);
    if ('area' == this.type) return;
    for (let e of this.viewItems) {
      let min = this.graph.min;
      if (true == this.data.raw.y_scaled) {
        scaleY = this.height / (this.graph.mm[e].max - this.graph.mm[e].min);
        min = this.graph.mm[e].min;
      }
      let y = this.height - scaleY * (this.data.y[e][p.curX] - min);
      let circle = TC20.circle(viewX, y, 5, {'class': 'point', 'fill': 'white', 'stroke': this.data.raw.colors[e], 'stroke-width': 2});
      p.g.append(circle);
    }
  }

  drawPanel() {
    this.drawChartOnPanel();
    this.createScrollElement();
    this.drawScroll();
    this.addEventListenerToPanel();
  }

  drawPointer() {
    if (undefined == this.pointer.status) return;
    if (0 == this.viewItems.size) return;

    let [a, b] = this.getABfromScroll();
    if (-1 != ['line', 'area'].indexOf(this.type)) {
      this.pointer.dx = this.width / (b - a);
    } else {
      this.pointer.dx = this.width / (b - a + 1);
    }
    let x = this.pointer.x;
    if (-1 != ['line', 'area'].indexOf(this.type)) x -= this.pointer.dx / 2;
    let coord = this.svgRoot.getBoundingClientRect();
    let localX = x - coord.x;
    let k = Math.ceil(localX / this.pointer.dx);
    if ('bar' == this.type) k = Math.floor(localX / this.pointer.dx);
    if (this.pointer.curX == a + k) return;
    this.pointer.a = a;
    this.pointer.k = k;
    this.pointer.curX = a + k;
    this.pointer.g.innerHTML = '';

    if ('bar' == this.type && undefined == this.data.raw.stacked) {
      this.drawBarPoiner();
    } else if ('bar' == this.type && true == this.data.raw.stacked) {
      this.drawStackedBarPoiner();
    } else if ('line' == this.type) {
      this.drawLinePoiner();
    } else if ('area' == this.type) {
      this.drawLinePoiner();
    }
    this.drawTips();
  }

  drawScroll() {
    let s = this.panel.scrollBox, h2 = this.panel.height / 3;
    let x1 = s.x + s.w1, x2 = s.x + s.width - s.w1, h1 = s.h1;
    TC20.setA(s.leftBox, {d: this.panelBracket(x1, 1)});
    TC20.setA(s.rightBox, {d: this.panelBracket(x2, -1)});
    TC20.setA(s.top, {x: x1, y: 0, width: x2 - x1, height: s.h1});
    TC20.setA(s.bottom, {x: x1, y: this.panel.height - s.h1, width: x2 - x1, height: s.h1});
    TC20.setA(s.leftMask, {x:0, y: h1, width: x1, height: this.panel.height - 2 * h1});
    TC20.setA(s.rightMask, {x: x2, y: h1, width: this.panel.width - x2, height: this.panel.height - 2 * h1});
    TC20.setA(s.leftLine, {d: `M${s.x + s.w1 / 2},${(this.panel.height - h2) / 2}v${h2}`});
    TC20.setA(s.rightLine, {d: `M${s.x + s.width - s.w1 / 2},${(this.panel.height - h2) / 2}v${h2}`});
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
        p[e][i - a] = y[e][i] * this.data.factor[e];
        c += p[e][i - a];
        vy[e][i - a] = s.height - Math.round(c * dy) - s.yb;
      }
    }
    let f = [], m = vy[l[0]].length;
    for (let e = 0; e < l.length; e++) {
      let q = '', r = '';
      for (let i = 0; i < m; i++) {
        let xx = Math.floor(dx*i);
        q += `L${xx},${vy[l[e]][i]}H${Math.floor(dx * (i + 1))}`;
        r += `L${Math.floor(dx*(m - i))},${vy[l[e]][m - i - 1]}H${Math.floor(this.width - dx * (i + 1))}`
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
    s.y = vy;
  }

  drawStackedBarPoiner() {
    let l = Array.from(this.allItems).sort();
    let p = this.pointer;
    let sx = Math.floor((p.curX - p.a) * p.dx);
    let y = this.height;
    for (let e of l) {
      TC20.setA(this.graph[e], {opacity: 0.5});
      let path = TC20.path({'d': `M${sx},${y}H${Math.floor(p.dx * (p.k + 1))}V${this.graph.y[e][p.k]}H${sx}`, 'stroke-width': 0, 'fill': this.data.raw.colors[e]});
      this.pointer.g.append(path);
      y = this.graph.y[e][p.k];
    }
  }

  drawTips() {
    this.divTips.innerHTML = this.innerTips();
    this.divTips.style.display = 'block'
    let svg = this.svgRoot.getBoundingClientRect();
    if (this.pointer.x + 25 + this.divTips.offsetWidth > document.body.clientWidth ) {
      this.divTips.style.left = this.pointer.x - this.divTips.offsetWidth - 25 + 'px';
    } else {
      this.divTips.style.left = this.pointer.x + 25 + 'px';
    }
    if (this.pointer.clientY + this.divTips.offsetHeight > svg.bottom) {
      this.divTips.style.top = (this.pointer.y - this.pointer.clientY) + svg.bottom - this.divTips.offsetHeight + 'px';
    } else {
      this.divTips.style.top = this.pointer.y + 'px';
    }
  }

  drawXAxis() {
    this.svgXAxis.innerHTML = '';
    this.XAxis.points = this.getXAxisPoints().map(x => this.drawXLabel(x));
  }

  drawXLabel(x) {
    let obj = {
      x: x,
      visible: 1,
      viewX: this.getViewX(x),
      innerHTML: true == this.zoomMode ? this.mmDDhh(this.data.x[x]) : this.mmDD(this.data.x[x])
    };
    obj.text = TC20.text({x: obj.viewX, y: 10, innerHTML: obj.innerHTML, fill: '#252529', style: 'font-size: 10px', opacity: 1});
    this.svgXAxis.append(obj.text);
    obj.coord = obj.text.getBBox();
    TC20.setA(obj.text, {x: obj.viewX - obj.coord.width, y: 10});
    return obj;
  }

  drawYLabel(y, viewY) {
    let obj = {
      y: y,
      viewY: viewY,
      text: TC20.text({x: 5, y: viewY - this.YAxis.textShift, innerHTML: this.yFormat(y), fill: '#252529', style: 'font-size: 10px', opacity: 1}),
      line: TC20.path({d: `M0,${viewY}L${this.width},${viewY}`, 'stroke-width': 2, 'stroke': this.YAxis.gridColor, 'fill': 'none', opacity: 0.1})
    };
    if (true == this.data.raw.y_scaled) {
      let [y1, y2] = Array.from(this.allItems).sort();
      let mm = this.graph.mm;
      let yy = (y - mm[y1].min) / (mm[y1].max - mm[y1].min) * (mm[y2].max - mm[y2].min) + mm[y2].min;
      TC20.setA(obj.text, {fill: this.data.raw.colors[y1]});
      obj.second = TC20.text({x: this.width + 20, y: viewY - this.YAxis.textShift, innerHTML: this.yFormat(yy), fill: this.data.raw.colors[y2], style: 'font-size: 10px', opacity: 1});
      this.svgRoot.append(obj.second);
      let coord = obj.second.getBBox();
      TC20.setA(obj.second, {x: this.width - coord.width - 5});
    }
    this.svgRoot.append(obj.text);
    this.svgRoot.append(obj.line);
    return obj;
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
    if (0 == this.viewItems.size) return {min: this.graph.min, max: this.graph.max};
    let r;
    if ('bar' == this.type) {
      r = this.getMinMaxForStackedBar(a, b);
    } else if ('area' == this.type) {
      r = {min: 0, max: 100};
    } else {
      r = this.getMinMaxElse(a, b);
    }
    return r;
  }

  getMinMaxElse(a, b) {
    let min = Infinity, max = -Infinity;
    for (let item of this.viewItems) {
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
        s += this.data.y[e][i] * this.data.factor[e];
      }
      if (s > max) max = s;
    }
    return {min: 0, max: max};
  }

  getMinMaxYscaled(a, b, e) {
    let min = Infinity, max = -Infinity;
    for (let i = Math.ceil(a); i <= b; i++) {
      let j = this.data.y[e][i];
      if (j < min) min = j;
      if (j > max) max = j;
    }
    return {min: min, max: max};
  }

  getTime(callBack) {
    let s = performance.now();
    callBack.call(this);
    let e = performance.now();
    console.log(callBack.name, 'time is: ', e - s);
  }

  getViewX(x) {
    let [a, b] = this.getABfromScroll();
    let scaleX = this.width / (b - a);
    return scaleX * (x - a);
  }

  getXAxisPoints() {
    let cur = this.data.length - 1;
    let points = [cur];
    let dx = Math.floor(this.panel.scrollBox.minWidth / this.width * this.data.length / 5.3);
    while ((cur -= dx) > 0) {
      if (Math.ceil(cur) == points[points.length - 1]) {
        cur = Math.floor(cur);
      } else {
        cur = Math.ceil(cur);
      }
      if (cur == points[points.length - 1]) break;
      points.push(cur);
    }
    return points;
  }

  hideTips() {
    this.divTips.style.display = 'none';
  }

  httpGetAsync(theUrl) {
    return new Promise((resolve, reject) => {
      var xmlHttp = new XMLHttpRequest();
      xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) resolve(xmlHttp.responseText);
      }
      xmlHttp.open("GET", theUrl, true);
      xmlHttp.send(null);
    });
  }

  initInternalObjects(o) {
    let h1 = Math.floor(o['heightPanel'] * 0.03);
    this.panel = {
      transition: {}, yb: h1, min: 0, max: 0, mm: {},
      width: this.width,
      height: o['heightPanel'],
      radius: Math.floor(o['heightPanel'] * 0.1),
      g: TC20.createSVG('g'),
      scrollBox: {
        width: Math.round(this.width * 0.25),
        minWidth: Math.round(this.width * 0.25),
        x: this.width - Math.round(this.width * 0.25),
        // Math.floor(width * 0.2),
        h1: h1,
        w1: Math.min(Math.floor(this.width * 0.04), 30)
      }
    };
    this.graph = {
      transition: {}, yb: 0, y: {}, min: 0, max: 0, mm: {},
      g: TC20.createSVG('g'),
      height: o['height']
    };
    this.XAxis = {
      sieve: 0
    };
    let mm = this.getMinMax(0, this.data.length - 1);
    this.YAxis = {
      point: [],
      mmOriginal: mm,
      dMax: mm.max - mm.min,
      textShift: 5,
      gridColor: '#182D3B'
    };
    this.pointer = {g: TC20.createSVG('g')};
  }

  initPathForGraphAndPanel() {
    this.graph.g.innerHTML = '';
    this.panel.g.innerHTML = '';

    for (let i of this.allItems){
      let o = {'d': '', 'stroke-width': 2, 'stroke': this.data.raw.colors[i], 'fill': 'none'};
      if ('area' == this.type || 'bar' == this.type){
        o = {'d': '', 'stroke-width': 0, 'fill': this.data.raw.colors[i]};
      }
      this.graph[i] = TC20.path(o);
      this.graph.g.append(this.graph[i]);
      this.panel[i] = TC20.path(o);
      this.panel.g.append(this.panel[i]);
    }
  }

  initSVG(o, width) {
    let style = [
      {height: o['height'] + 'px', width: width + 'px', style: 'display: block;'},
      {height: '15px', width: width + 'px', style: 'display: block;'},
      {height: o['heightPanel'] + 'px', width: width + 'px', 'style': `border-radius: ${this.panel.radius}px; display: block;`}
    ];
    ['svgRoot', 'svgXAxis', 'svgPanel'].forEach((e, i) => {
      this[e] = TC20.createSVG('svg');
      TC20.setA(this[e], style[i]);
      this.divRoot.append(this[e]);
    });

    this.svgRoot.append(this.graph.g);
    this.svgRoot.append(this.pointer.g);
    this.svgPanel.append(this.panel.g)
  }

  innerTips() {
    let r, s = 0;
    let d = true == this.zoomMode ? this.wwDDmmHH(this.data.x[this.pointer.curX]) : this.wwDDmmYY(this.data.x[this.pointer.curX]);
    if ('area' == this.type) {
      r = [`<td colspan=2><b>${d}</b></td><td style='text-align: right; color: #D2D5D7'>&gt;</td>`];
      for (let e of this.viewItems) {
        s += this.data.y[e][this.pointer.curX];
        r.push(`<td style='text-align: right;'><b>${this.graph.p[e][this.pointer.k].toFixed(1)}%</b></td><td>${this.data.raw.names[e]}</td><td style='text-align: right; color:${this.data.raw.colors[e]}'><b>${this.labelFormat(this.data.y[e][this.pointer.curX])}</b></td>`);
      }
    } else {
      r = [`<td><b>${d}</b></td><td style='text-align: right; color: #D2D5D7'>&gt;</td>`];
      for (let e of this.viewItems) {
        s += this.data.y[e][this.pointer.curX];
        r.push(`<td>${this.data.raw.names[e]}</td><td style='text-align: right; color:${this.data.raw.colors[e]}'><b>${this.labelFormat(this.data.y[e][this.pointer.curX])}</b></td>`);
      }
      if ('line' != this.type && this.viewItems.size > 1) r.push(`<td>All</td><td style='text-align: right;'><b>${this.labelFormat(s)}</b></td>`);
    }
    return `<table style='margin: 5px;'>${r.map(e => `<tr>${e}</tr>`).join('')}</table>`;
  }

  l0(n) {
    if (n < 10) return '0' + n;
    return n;
  }

  labelFormat(n) {
    var abs = Math.abs(n);
    if (abs > 1) {
      var s = abs.toFixed(0);
      var formatted = n < 0 ? '-' : '';
      for (var i = 0; i < s.length; i++) {
          formatted += s.charAt(i);
          if ((s.length - 1 - i) % 3 === 0) formatted += ' ';
      }
      return formatted;
    }
    return n.toString()
  }

  mmDD(date) {
    return TC20.monthShort[date.getMonth()] + ' ' + date.getDate().toString();
  }

  mmDDhh(d) {
    return this.l0(d.getHours()) + ':' + this.l0(d.getMinutes());
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
          s.target = undefined;
        } else if (s.x < 0) {
          s.x = 0;
          s.target = undefined;
        }
      } else if ('right' == s.target) {
        s.width = s.reper + dx;
        if (s.x + s.width > w) {
          s.width = w - s.x;
          s.target = undefined;
        } else if (s.width < mw) {
          s.width = mw;
          s.target = undefined;
        }
      } else if ('left' == s.target) {
        s.width = s.reper.w - dx;
        s.x = s.reper.x + dx;
        if (s.x < 0) {
          s.x = 0;
          s.width = s.reper.w + s.reper.x;
          s.target = undefined;
        } else if (s.width < mw) {
          s.width = mw;
          s.x = s.reper.x + s.reper.w - s.width
          s.target = undefined;
        }
      }
      requestAnimationFrame(() => this.onMoveRender());
    }
  }

  onMoveGraph(x, y, clientY) {
    this.pointer.status = 'draw';
    this.pointer.x = x;
    this.pointer.y = y;
    this.pointer.clientY = clientY;

    requestAnimationFrame(() => {
      this.drawPointer();
    });
  }

  onMoveRender() {
    let t = {};
    if (true == this.data.raw.y_scaled) {
      let [a,b] = this.getABfromScroll();
      for (let e of this.allItems) {
        let mm = this.getMinMaxYscaled(a, b, e);
        // console.log(this.graph.mm[e].min, mm.min);
        t['min' + e] = this.anyCounter(this.graph.mm[e].min, mm.min, 25, (x) => this.graph.mm[e].min = x);
        t['max' + e] = this.anyCounter(this.graph.mm[e].max, mm.max, 25, (x) => this.graph.mm[e].max = x);
      }
    } else {
      let [a,b] = this.getABfromScroll();
      let mm = this.getMinMax(a, b);
      t = {
        min: this.anyCounter(this.graph.min, mm.min, 25, (x) => this.graph.min = x),
        max: this.anyCounter(this.graph.max, mm.max, 25, (x) => this.graph.max = x)
      };
    }
    this.hideTips();
    this.requestExec(this.drawScroll);
    this.requestDrawGraph(t, this.graph);
    this.updateDateRange();
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
    this.data = {x : [], y: {}, raw: data, buffer: {}, factor: {}};
    this.allItems = new Set(Object.keys(data.names));
    if (undefined == this.viewItems) {
      this.viewItems = new Set(Object.keys(data.names));
    }
    for (let col of data.columns) {
      if ('x' == col[0]) {
        for (let i = 1; i < col.length; i++) {
          this.data.x.push(new Date(col[i]));
        }
      } else {
        let n = col[0];
        this.data.y[n] = col.slice(1);
        this.data.factor[n] = 1;
      }
    }
    this.data.length = this.data.x.length;
    this.type = data.types['y0'];
  }

  reCheck(button, element) {
    let whiteCircle = button.querySelector('.whiteCircle');
    let direction = 1;
    let factor = 0;
    this.hideTips();
    if (this.viewItems.has(element)) {
      this.viewItems.delete(element);
      button.style['background-color'] = 'white';
      button.style['color'] = this.data.raw.colors[element];
    } else {
      direction = -1;
      factor = 1;
      this.viewItems.add(element);
      button.style['background-color'] = this.data.raw.colors[element];
      button.style['color'] = 'white';
    }
    // let a = this.animateCircleInButton(whiteCircle, 200, direction);
    // this.doAnimation(a);
    let graph = {}, panel = {};
    this.setReCheckTransition(graph, panel, element, factor);
    requestAnimationFrame(() => {
      this.requestDrawGraph(graph, this.graph);
      this.requestDrawGraph(panel, this.panel);
    });
  }

  recreateYALabel(c) {
    for (let e of this.YAxis.point) {
      e.text.remove();
      e.line.remove();
      if (true == this.data.raw.y_scaled) e.second.remove();
    }
    this.YAxis.points = [];
    let dy = this.height / (c.max - c.min);
    let yLevel = this.YAxis.from;
    while (yLevel < c.max + this.YAxis.step) {
      this.YAxis.point.push(this.drawYLabel(yLevel, Math.floor(this.height - (yLevel - c.min) * dy)));
      yLevel += this.YAxis.step;
    }
  }

  static rect(x, y, w, h, o = {}) {
    let e = TC20.createSVG('rect');
    TC20.setA(e, Object.assign({'x': x, 'y': y, 'width': w, 'height': h}, o));
    return e;
  }

  removePointer() {
    this.pointer.status = undefined;
    for (let i of this.viewItems) {
      TC20.setA(this.graph[i], {opacity: 1});
    }
    this.pointer.g.innerHTML = '';
  }

  render() {
    // this.getTime(() => {
    //   for (let i = 0; i < 1000; i++) {
    //   this.getMinMax(0, this.data.length - 1)
    //   }
    // });
    let [a, b] = this.getABfromScroll();
    let mm = this.getMinMax(a, b);
    if (true == this.data.raw.y_scaled) {
      for (let e of this.allItems) {
        this.graph.mm[e] = this.getMinMaxYscaled(a, b, e);
        this.panel.mm[e] = this.getMinMaxYscaled(0, this.data.length - 1, e);
      }
    }
    this.drawXAxis();
    this.drawPanel();
    this.updateDateRange();
    this.drawChart(a, b, mm, this.graph);
  }

  requestDrawGraph(transition, obj) {
    let startAnimation = (Object.keys(obj.transition) == 0);
    Object.assign(obj.transition, transition);
    if (startAnimation) {
      let n = this.smothDrawLineChart(obj);
      this.doAnimation(n);
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

  requestZoomAnimation() {
    if (true == this.zoomMode) {
      this.panel.scrollBox.width = this.panel.scrollBox.minWidth;
      this.panel.scrollBox.x = (this.width - this.panel.scrollBox.width) / 2;
    }

    this.data.length = this.data.x.length;
    if (true == this.data.raw.y_scaled) {
      for (let e of this.allItems) {
        this.panel.mm[e] = this.getMinMaxYscaled(0, this.data.length - 1, e);
      }
    } else {
      this.YAxis.mmOriginal = this.getMinMax(0, this.data.length - 1);
    }
    this.removePointer();
    this.hideTips();
    this.onMoveRender();
    this.drawChartOnPanel();
    this.drawXAxis();
  }

  scaleXAxis() {
    let visibleCount = 0;
    let count = 0;
    let s = this.XAxis.sieve;
    for (let item of this.XAxis.points) {
      item.viewX = this.getViewX(item.x);
      TeleChart.setAttribute(item.text, {x: item.viewX - item.coord.width});
      if (0 != count % (2 ** s) && 1 == item.visible) {
        // let a = this.animateLabelRemove(item, 400, -1);
        // this.doAnimation(a);
        item.text.style.display = 'none';
        item.visible = 0;
      } else if (0 == count % (2 ** s) && 0 == item.visible) {
        // let a = this.animateLabelRemove(item, 400, 1);
        // this.doAnimation(a);
        item.text.style.display = 'inline';
        item.visible = 1;
      }
      count += 1;
    }

    visibleCount = this.width / (this.XAxis.points[0].viewX - this.XAxis.points[2 ** s].viewX);

    if (visibleCount > 8) {
      this.XAxis.sieve += 1;
      this.requestExec(this.scaleXAxis);
    } else if (visibleCount < 4 && s > 0)  {
      this.XAxis.sieve -= 1;
      this.requestExec(this.scaleXAxis);
    }
  }

  scaleYAxis(c) {
    let step = (c.max - c.min) / 5.1;
    step = 1.2 ** Math.floor(Math.log(step) / Math.log(1.2));
    let p = 10 ** (Math.floor(Math.log10(step)) - 1);
    step = Math.floor(step / p) * p;
    let t1 = Math.floor(this.YAxis.mmOriginal.min / step) * step;
    let from = Math.floor((c.min - t1) / step) * step + t1;
    if (this.YAxis.step != step || this.YAxis.from != from || true == this.data.raw.y_scaled) {
      this.YAxis.from = from;
      this.YAxis.step = step;
      this.recreateYALabel(c);
    } else {
      let dy = this.height / (c.max - c.min);
      for (let e of this.YAxis.point) {
        let viewY = Math.floor(this.height - (e.y - c.min) * dy);
        TC20.setA(e.text, {y: viewY - this.YAxis.textShift});
        TC20.setA(e.line, {d: `M0,${viewY}L${this.width},${viewY}`});
        if (true == this.data.raw.y_scaled) TC20.setA(e.second, {y: viewY - this.YAxis.textShift});
      }
    }
  }

  static setA(e, a) {
    Object.keys(a).map(k => {
      e.setAttributeNS(null, k, a[k]);
    });
  }

  setReCheckTransition(graph, panel, name, factor) {
    if (-1 != ['area', 'bar'].indexOf(this.type)) {
      graph[name] = this.anyCounter(this.data.factor[name], factor, 25, (x) => {
        this.data.factor[name] = x;
        let [a, b] = this.getABfromScroll();
        let mm = this.getMinMax(a, b);
        this.graph.min = mm.min;
        this.graph.max = mm.max;
      });
      panel[name] = this.anyCounter(this.data.factor[name], factor, 25, (x) => {
        this.data.factor[name] = x;
        let mm = this.getMinMax(0, this.data.length - 1);
        this.panel.min = mm.min;
        this.panel.max = mm.max;
      });
    } else if ('line' == this.type) {
      let [a,b] = this.getABfromScroll();
      let mm = this.getMinMax(a, b);
      graph.min = this.anyCounter(this.graph.min, mm.min, 25, (x) => this.graph.min = x);
      graph.max = this.anyCounter(this.graph.max, mm.max, 25, (x) => this.graph.max = x);
      graph[name] = this.anyCounter(this.data.factor[name], factor, 25, (x) => this.data.factor[name] = x);
      panel[name] = this.anyCounter(this.data.factor[name], factor, 25, (x) => {});
    }
  }

  static text(o) {
    let e = TC20.createSVG('text');
    TC20.setA(e, o);
    if ('innerHTML' in o) {
      e.innerHTML = o.innerHTML;
    }
    return e;
  }

  updateDateRange() {
    let [a, b] = this.getABfromScroll();
    this.dateRange.innerHTML = this.wMMDD(this.data.x[a]) + ' - ' + this.wMMDD(this.data.x[b]);
  }

  wMMDD(d) {
    return [d.getDate(), TC20.monthShort[d.getMonth()], d.getFullYear()].join(' ');
  }

  wwDDmmHH(d) {
    return [TC20.dayNames[d.getDay()] + ',', d.getDate(), TC20.monthShort[d.getMonth()], this.l0(d.getHours()) + ':' + this.l0(d.getMinutes())].join(' ');
  }

  wwDDmmYY(date) {
    return [TC20.dayNames[date.getDay()] + ',', date.getDate(), TC20.monthShort[date.getMonth()], date.getFullYear()].join(' ');
  }

  static get xmlns() {
    return "http://www.w3.org/2000/svg";
  }

  yFormat(n) {
    var abs = Math.abs(n);
    if (abs > 1000000000) return (n / 1000000000).toFixed(2) + 'B';
    if (abs > 1000000) return (n / 1000000).toFixed(2) + 'M';
    if (abs > 1000) return (n / 1000).toFixed(1) + 'K';
    if (abs > 99) return n.toFixed(0);
    if (abs > 9) return n.toFixed(1);
    if (n == 0) return 0;

    let p = Math.floor(Math.log10(abs));
    let s = n < 0 ? '-' : '';
    if (p < -2) {
      s += Math.floor(n * (10 ** (Math.abs(p) + 2))) / 100 + `E${p}`;
      return s;
    }

    if (Math.floor(n) == n) return n.toString();

    return n.toFixed(3);
    }

  zoom(data) {
    this.zoomMode = true;
    this.cache = {
      XAxis: {
        sieve: this.XAxis.sieve
      },
      scrollBox: {
        x: this.panel.scrollBox.x,
        width: this.panel.scrollBox.width
      },
      viewItems: new Set(this.viewItems)
    };

    let initPath = (1 == this.allItems.size);

    let t = Object.assign({}, this.data.factor);
    this.prepareData(data);
    // if (this.allItems.size > 1) this.viewItems = new Set(this.cache.viewItems);
    this.data.factor = t;
    this.XAxis.sieve = 0;

    if (initPath) {
      this.initPathForGraphAndPanel();
      this.viewItems = new Set(this.allItems);
      this.createFooter();
    }

    requestAnimationFrame(() => this.requestZoomAnimation());
  }

  zoomOut() {
    this.zoomMode = undefined;
    this.zoomOutButton.style.display = 'none';
    this.captionTag.style.display = 'inline-block';

    this.XAxis.sieve = this.cache.XAxis.sieve;
    this.panel.scrollBox.x = this.cache.scrollBox.x;
    this.panel.scrollBox.width = this.cache.scrollBox.width;

    let t = Object.assign({}, this.data.factor);
    this.prepareData(this.zoomData);
    if (this.allItems.size > 1) this.data.factor = t;

    if (1 == this.allItems.size) {
      this.initPathForGraphAndPanel();
      this.viewItems = new Set(this.allItems);
      this.footer.remove();
    }

    this.initPathForGraphAndPanel();

    requestAnimationFrame(() => this.requestZoomAnimation());
  }

}
