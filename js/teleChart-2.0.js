class TeleChart20 {

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
      console.log('mouseleave');
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
    TeleChart20.setA(element, Object.assign({'cx': cx, 'cy': cy, 'r': r}, options));
    return element;
  }

  constructor(tagID, data, options = {}) {
    let width = options['width'];
    if (true == options['widthToPage']) {
      width = document.body.clientWidth - 10;
    }

    this.divRoot = document.getElementById(tagID);
    this.divRoot.innerHTML = '';
    this.divRoot.style.width = width;

    this.panel = {
      width: width,
      height: options['heightPanel'],
      radius: Math.floor(options['heightPanel'] * 0.1),
      scrollBox: {
        width: Math.floor(width * 0.25),
        x: Math.floor(width * 0.2),
        h1: Math.floor(options['heightPanel'] * 0.03),
        w1: Math.min(Math.floor(width * 0.03), 30)
      }
    };

    this.svgPanel = TeleChart20.createSVG('svg');
    TeleChart20.setA(this.svgPanel, {height: options['heightPanel'] + 'px', width: width + 'px', 'style': `border-radius: ${this.panel.radius}px;`});

    this.divRoot.append(this.svgPanel);

    this.width = this.svgPanel.width.animVal.value;
    this.height = this.svgPanel.height.animVal.value;
    this.animationStack = new Set();
    this.semafors = {};
    this.prepareData(data);
    this.render();
    this.statusTag = document.getElementById('Status');
  }

  static createSVG(tag) {
    return document.createElementNS(TeleChart.xmlns, tag);
  }

  createScrollElement() {
    let style = {'stroke-width': 0, 'fill': '#C0D1E1', 'opacity': '0.9'};
    this.panel.scrollBox.leftBox = TeleChart20.path(style);
    this.panel.scrollBox.rightBox = TeleChart20.path(style);
    this.panel.scrollBox.top = TeleChart20.rect(0, 0, 0, 0, style);
    this.panel.scrollBox.bottom = TeleChart20.rect(0, 0, 0, 0, style);
    style = {'stroke-width': 0, 'fill': '#e2eef9', 'opacity': '0.6'};
    this.panel.scrollBox.leftMask = TeleChart20.rect(0, 0, 0, 0, style);
    this.panel.scrollBox.rightMask = TeleChart20.rect(0, 0, 0, 0, style);
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

  drawLinesOnPanel() {
    let mm = this.getMinMax(0, this.data.length - 1);
    let h1 = this.panel.scrollBox.h1;
    for (let item of this.allItems) {
      let d = this.getD(0, h1 * 2, this.panel.width, this.panel.height - 4 * h1, this.panel.height, mm.min, mm.max, this.data.y[item], 0, this.data.length);
      this.panel[item] = TeleChart20.path({'d': d, 'stroke-width': 2, 'stroke': this.data.raw.colors[item], 'fill': 'none'});
      this.svgPanel.append(this.panel[item]);
    }
  }

  drawPanel() {
    this.drawLinesOnPanel();
    this.createScrollElement();
    this.drawScroll();
    this.addEventListenerToPanel();
  }

  drawScroll() {
    let x1 = this.panel.scrollBox.x + this.panel.scrollBox.w1;
    let x2 = this.panel.scrollBox.x + this.panel.scrollBox.width - this.panel.scrollBox.w1;
    let h1 = this.panel.scrollBox.h1;

    TeleChart20.setA(this.panel.scrollBox.leftBox, {d: this.panelBracket(x1, 1)});
    TeleChart20.setA(this.panel.scrollBox.rightBox, {d: this.panelBracket(x2, -1)});
    TeleChart20.setA(this.panel.scrollBox.top, {x: x1, y: 0, width: x2 - x1, height: this.panel.scrollBox.h1});
    TeleChart20.setA(this.panel.scrollBox.bottom, {x: x1, y: this.height - this.panel.scrollBox.h1, width: x2 - x1, height: this.panel.scrollBox.h1});
    TeleChart20.setA(this.panel.scrollBox.leftMask, {x:0, y: h1, width: x1, height: this.panel.height - 2 * h1});
    TeleChart20.setA(this.panel.scrollBox.rightMask, {x: x2, y: h1, width: this.panel.width - x2, height: this.panel.height - 2 * h1});
  }

  getD(x0, y0, dx, dy, height, minY, maxY, data, a, b) {
    let scaleX = dx / (b - a - 1);
    let scaleY = dy / (maxY - minY);
    let x = x0;
    let y = height - y0 - (data[a] - minY) * scaleY;
    let res = `M${x},${y} `;
    for (let i = a + 1; i < b; i++){
      x = Math.floor(x0 + scaleX * i);
      y = Math.floor(height - y0 - (data[i] - minY) * scaleY);
      res += `L${x},${y} `
    }
    return res;
  }

  getMinMax(a, b) {
    let min = Infinity;
    let max = -Infinity;
    for (let item of this.allItems) {
      for (let i = a; i <= b; i++) {
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
      if ('mid' == s.target) {
        s.x = s.reper + x - s.mouseXStart;
        if (s.x + s.width > this.panel.width) {
          s.x = this.panel.width - s.width;
        } else if (s.x < 0) {
          s.x = 0;
        }
        requestAnimationFrame(() => this.requestExec(this.drawScroll));
      }
    }
    // console.log(x, s.target);
  }

  onStart(x, k) {
    let s = this.panel.scrollBox;
    let right = s.rightBox.getBoundingClientRect();
    let left = s.leftBox.getBoundingClientRect();
    let dw = s.width * k;
    let rlx = right.left - dw;
    let rx = right.right + dw;
    if (rlx < x && x < rx) {
      s.mouseXStart = x;
      // s.reper = this.range.window.width;
      s.target = 'right';
    }
    let lx = left.left - dw;
    let lrx = left.right + dw;
    if (lx < x && x < lrx) {
      s.mouseXStart = x;
      // s.reper = {'total': this.range.window.left + this.range.window.width, 'left': this.range.window.left};
      s.target = 'left';
    }
    if (lrx < x && x < rlx) {
      s.mouseXStart = x;
      s.reper = s.x;
      s.target = 'mid';
    }
  }

  panelBracket(x, k) {
    let h1 = this.panel.height;
    let r1 = this.panel.radius;
    let dx1 = this.panel.scrollBox.w1 - r1;
    return `M${x},0 h${-dx1 * k} a${r1},${r1},0,0,${1 == k ? 0 : 1},${-r1 * k},${r1} l0,${h1 - 2 * r1} a${r1},${r1},0,0,${1 == k ? 0 : 1},${r1 * k},${r1} h${dx1 * k} z`;
  }

  static path(options = {}) {
    let element = TeleChart.createSVG('path');
    TeleChart20.setA(element, options);
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
    delete this.data.raw.columns
  }

  static rect(x, y, width, height, options = {}) {
    let element = TeleChart.createSVG('rect');
    TeleChart20.setA(element, Object.assign({'x': x, 'y': y, 'width': width, 'height': height}, options));
    return element;
  }

  render() {
    // this.getTime(() => {
    //   for (let i = 0; i < 1000; i++) {
    //   this.getMinMax(0, this.data.length - 1)
    //   }
    // });
    this.c = TeleChart20.circle(100, 100, 20, {'fill': '#E8AF14'});
    this.svgPanel.append(this.c);
    this.drawPanel();
    // let a = this.moveCircle();
    // this.doAnimation(a);
  }

  requestExec(call) {
    let n = call.name;
    if ('recall' == this.semafors[n]) return;
    if ('work' == this.semafors[n]) {
      this.semafors[n] = 'recall';
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