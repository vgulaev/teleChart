class TeleChart {
  static getUrl(url) {
    return new Promise( resolve => {
      var myRequest = new XMLHttpRequest();
      myRequest.open("get", url);
      myRequest.onload = function () {
        resolve("Ok");
      };
      myRequest.send();
    });
  }

  static get xmlns() {
    return "http://www.w3.org/2000/svg";
  }

  static createSVG(tag) {
    return document.createElementNS(TeleChart.xmlns, tag);
  }

  static setAttribute(element, atts) {
    Object.keys(atts).map(key => {
      element.setAttributeNS(null, key, atts[key]);
    });
  }

  static line(x1, y1, x2, y2, options = {}) {
    let element = TeleChart.createSVG('line');
    TeleChart.setAttribute(element, {'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2});
    TeleChart.setAttribute(element, options);
    return element;
  }

  static rect(x, y, width, height, options = {}) {
    let element = TeleChart.createSVG('rect');
    TeleChart.setAttribute(element, {'x': x, 'y': y, 'width': width, 'height': height});
    TeleChart.setAttribute(element, options);
    return element;
  }

  static path(options = {}) {
    let element = TeleChart.createSVG('path');
    TeleChart.setAttribute(element, options);
    return element;
  }

  static animate(options = {}) {
    let element = TeleChart.createSVG('animate');
    TeleChart.setAttribute(element, options);
    return element;
  }

  static circle(cx, cy, r, options = {}) {
    let element = TeleChart.createSVG('circle');
    TeleChart.setAttribute(element, {'cx': cx, 'cy': cy, 'r': r});
    TeleChart.setAttribute(element, options);
    return element;
  }

  makeWellStructuredData() {
    this.data.raw.columns.forEach((element, index) => {
      this.data.nameByIndex[element[0]] = index;
    });

    for (const [name, _type] of Object.entries(this.data.raw.types)) {
      let a = this.data.raw.columns[this.data.nameByIndex[name]];
      if ('x' == _type) {
        for (let i = 1; i < a.length; i++) {
          this.data.x.push(new Date(a[i]));
        }
      } else if ('line' == _type) {
        this.data.y[name] = {
          coord: [],
          panel: {},
          graph: {}
        };
        for (let i = 1; i < a.length; i++) {
          this.data.y[name].coord.push(a[i]);
        }
        this.data.y[name].max = Math.max(...this.data.y[name].coord);
        this.data.y[name].min = Math.min(...this.data.y[name].coord);
      }
    }
  }

  constructor(tagID, data, options = {}) {
    this.svgRoot = document.getElementById(tagID);
    this.data = {
      raw: data,
      x: [],
      y: {
      },
      viewItems: new Set(Object.keys(data.names)),
      allItems: new Set(Object.keys(data.names)),
      nameByIndex: {}
    };
    this.makeWellStructuredData();
    this.xLength = this.data.x.length;
    this.width = this.svgRoot.width.animVal.value;
    this.height = this.svgRoot.height.animVal.value;
    this.range = {
      left: 0,
      right: this.xLength - 1,
      window: {
        width: Math.round(this.width * 0.25)
      }
    };
    this.range.window.left = this.width - this.range.window.width;

    if (options.heightPanel < 1) {
      this.heightPanel = Math.ceil(this.height * options.heightPanel);
    } else {
      this.heightPanel = options.heightPanel;
    }
    this.animationTime = options.animationTime;
    this.animationLayers = new Set();
    this.render();
    // alert('TeleChart ready');
  }

  button(name) {
    return `<button id="${name}Button" style="border-radius: 40px; border: 0;">
      <svg width="40px" height="40px" style=" display: inline-block; vertical-align: middle;">
      <path d="M 5, 20 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 15,15 h 10 v 10 h -10 z" stroke-width="2" stroke="${this.data.raw.colors[name]}" fill="${this.data.raw.colors[name]}">
        </path>
      </svg>
      <span>${name}</span>
    </button>`;
  }

  animationStepPanel(curTime, rightProgres, leftProgres) {
    for (let item of this.data.viewItems) {
      let panel = this.data.y[item].panel;
      let tempPoints = panel.newViewCoord.map((xy, index) => [
        xy[0],
        xy[1] - panel.deltaY[index] * leftProgres
        ]);
      panel.curViewCoord = tempPoints;
      this.data.y[item].panel.path.setAttributeNS(null, 'd', this.pointsToD(tempPoints));
    }

    if (curTime < this.finishTime) {
      return true;
    } else {
      for (let item of this.data.viewItems) {
        this.data.y[item].panel.curViewCoord = this.data.y[item].panel.newViewCoord;
        this.data.y[item].panel.path.setAttributeNS(null, 'd', this.pointsToD(this.data.y[item].panel.curViewCoord));
      }
      this.animationLayers.delete('panel');
      return false;
    }
  }

  animationStepGraph(curTime, rightProgres, leftProgres) {
    for (let item of this.data.viewItems) {
      let graph = this.data.y[item].graph;
      let tempPoints = graph.newViewCoord.map((xy, index) => [
        xy[0],
        xy[1] - graph.deltaY[index] * leftProgres
        ]);
      graph.curViewCoord = tempPoints;
      this.data.y[item].graph.path.setAttributeNS(null, 'd', this.pointsToD(tempPoints));
    }

    if (curTime < this.finishTime) {
      return true;
    } else {
      for (let item of this.data.viewItems) {
        this.data.y[item].graph.curViewCoord = this.data.y[item].graph.newViewCoord;
        this.data.y[item].graph.path.setAttributeNS(null, 'd', this.pointsToD(this.data.y[item].graph.curViewCoord));
      }
      this.animationLayers.delete('graph');
      return false;
    }
  }

  animatePanel() {
    this.updateMinMax();

    for (let item of this.data.viewItems) {
      let panel = this.data.y[item].panel;
      panel.newViewCoord = this.fastCalcLineCoord(item, 'panel');
      panel.deltaY = panel.curViewCoord.map((xy, index) => panel.newViewCoord[index][1] - panel.curViewCoord[index][1]);
    }
  }

  animateGraph() {
    this.updateMinMaxInRange();
    for (let item of this.data.viewItems) {
      let graph = this.data.y[item].graph;
      graph.newViewCoord = this.fastCalcLineCoord(item, 'graph');
      graph.deltaY = graph.curViewCoord.map((xy, index) => graph.newViewCoord[index][1] - graph.curViewCoord[index][1]);
    }
  }

  animationStep() {
    let curTime = performance.now();
    let rightProgres = (curTime - this.startTime) / this.animationTime;
    let leftProgres = 1 - rightProgres;
    let callNextStep = false;

    if (this.animationLayers.has('panel')) {
      callNextStep = this.animationStepPanel(curTime, rightProgres, leftProgres);
    }

    if (this.animationLayers.has('graph')) {
      callNextStep |=  this.animationStepGraph(curTime, rightProgres, leftProgres);
    }

    if (callNextStep) requestAnimationFrame(() => this.animationStep());
  }

  doAnimation(layers) {
    this.startTime = performance.now();
    this.finishTime = this.startTime + this.animationTime;

    if (this.animationLayers.has('panel')) this.animatePanel();
    if (this.animationLayers.has('graph')) this.animateGraph();

    requestAnimationFrame(() => this.animationStep());
  }

  reCheck(button, name) {
    if (this.data.viewItems.has(name)) {
      this.data.viewItems.delete(name);
      this.data.y[name].panel.path.style.display = 'none';
      this.data.y[name].graph.path.style.display = 'none';
    } else {
      this.data.viewItems.add(name);
      this.data.y[name].panel.path.style.display = 'inline';
      this.data.y[name].graph.path.style.display = 'inline';
    }
    this.animationLayers.add('panel');
    this.animationLayers.add('graph');
    this.doAnimation();
  }

  createHeader() {
    this.header = document.getElementById('Header');

    for (let element of this.data.allItems) {
      this.header.innerHTML += this.button(element);
    };

    for (let element of this.data.allItems) {
      let b = document.getElementById(`${element}Button`);
      b.addEventListener('click', eventData => {
        this.reCheck(b, element);
      });
    };
  }

  pointsToD(points) {
    let strArray = [];
    strArray.push(`M ${points[0].join(',')}`);
    strArray.push('L');

    for (let i = 1; i < points.length; i++) {
      strArray.push(points[i].join(','));
    }
    return strArray.join(' ');
  }

  calcLineCoord(fromX, fromY, dx, dy, element) {
    let data = this.data.y[element].coord;
    let points = [];
    let scaleX = dx / (this.xLength - 1);
    let heightY = this.maxy - this.miny;
    for (let i = 0; i < data.length; i++) {
      let x = fromX + scaleX * i;
      let y = fromY - (data[i] - this.miny) / heightY * dy;
      points.push([x, y]);
    }

    return points;
  }

  calcGraphLineCoord(fromX, fromY, dx, dy, element) {
    this.range.left = this.xLength * this.range.window.left / this.width;
    this.range.right = this.xLength * (this.range.window.left + this.range.window.width) / this.width;
    let data = this.data.y[element].coord;
    let points = [];
    let scaleX = dx / (this.range.right - this.range.left);
    let heightY = this.range.maxy - this.range.miny;
    let yOffset = this.height - fromY;
    for (let i = 0; i < data.length; i++) {
      let x = fromX + scaleX * (i - this.range.left);
      let y = yOffset - (data[i] - this.range.miny) / heightY * dy;
      points.push([x, y]);
    }
    return points;
  }

  fastCalcLineCoord(element, type) {
    if ('panel' == type) {
      return this.calcLineCoord(2, this.height - 2, this.width - 4, this.heightPanel - 4, element);
      // return [[0,0], [200, 100], [300, 400], [350, 500]];
    } else {
      return this.calcGraphLineCoord(0, this.heightPanel, this.width, this.height - this.heightPanel, element);
    }
  }

  updateMinMax() {
    let a = [];
    for (let item of this.data.viewItems) {
      a.push(this.data.y[item].min);
      a.push(this.data.y[item].max);
    }
    let miny = Math.min(...a);
    let maxy = Math.max(...a);
    let delta;
    if (miny == maxy) {
      if (0 == miny) {
        delta = 10;
      } else {
        delta = Math.abs(maxy) * 0.1;
      }
    } else {
      delta = Math.abs(maxy - miny);
    }
    miny = miny - delta * 0.1;
    maxy = maxy + delta * 0.1;
    if (this.miny != miny || this.maxy != maxy) {
      this.miny = miny;
      this.maxy = maxy;
      return true;
    } else {
      return false;
    }
  }

  updateMinMaxInRange() {
    let a = [];
    let miny = Infinity;
    let maxy = -Infinity;

    for (let item of this.data.viewItems) {
      let y = this.data.y[item].coord.slice(this.range.left, this.range.right + 1);
      miny = Math.min(miny, ...y);
      maxy = Math.max(maxy, ...y);
    }
    let delta;
    if (miny == maxy) {
      if (0 == miny) {
        delta = 10;
      } else {
        delta = Math.abs(maxy) * 0.1;
      }
    } else {
      delta = Math.abs(maxy - miny);
    }
    miny = miny - delta * 0.1;
    maxy = maxy + delta * 0.1;
    if (this.range.miny != miny || this.range.maxy != maxy) {
      this.range.miny = miny;
      this.range.maxy = maxy;
      return true;
    } else {
      return false;
    }
  }

  drawMiniMap() {
    this.updateMinMax();
    for (let element of this.data.allItems) {
      this.data.y[element].panel.curViewCoord = this.fastCalcLineCoord(element, 'panel');
      let d = this.pointsToD(this.data.y[element].panel.curViewCoord);
      let path = TeleChart.path({'d': d, 'stroke-width': 2,
        'stroke': this.data.raw.colors[element],
        'fill': 'none',
        'render-order': 0});
      this.data.y[element].panel.path = path;
      this.svgRoot.append(path);
    };
  }

  drawGraph() {
    this.updateMinMaxInRange();
    for (let element of this.data.allItems) {
      this.data.y[element].graph.curViewCoord = this.fastCalcLineCoord(element, 'graph');
      let d = this.pointsToD(this.data.y[element].graph.curViewCoord);
      let path = TeleChart.path({'d': d, 'stroke-width': 2,
        'stroke': this.data.raw.colors[element],
        'fill': 'none'});
      this.data.y[element].graph.path = path;
      this.svgRoot.append(path);
    };
  }

  drawWindow() {
    let wBorder = 10;
    let hBorder = Math.round(wBorder * 0.25);
    console.log(this.range.window.left, this.range.window.width);
    this.range.window.left = 100;
    // let base = TeleChart.rect(this.range.window.left, this.height - this.heightPanel, this.range.window.width, this.heightPanel, {
    //   'stroke-width': 1,
    //   'stroke': 'black',
    //   'fill': 'black',
    //   'cursor': 'col-resize',
    //   'opacity': '0.2',
    // });
    let right = TeleChart.rect(this.range.window.left + this.range.window.width - 10, this.height - this.heightPanel, 10, this.heightPanel, {
      'stroke-width': 0,
      'stroke': 'black',
      'fill': 'black',
      'cursor': 'col-resize',
      'opacity': '0.2',
    });
    let left = TeleChart.rect(this.range.window.left, this.height - this.heightPanel, 10, this.heightPanel, {
      'stroke-width': 0,
      'stroke': 'black',
      'fill': 'black',
      'cursor': 'col-resize',
      'opacity': '0.2',
    });
    let top = TeleChart.rect(this.range.window.left + wBorder, this.height - this.heightPanel, this.range.window.width - 2 * wBorder, hBorder, {
      'stroke-width': 0,
      'stroke': 'black',
      'fill': 'black',
      'opacity': '0.2',
    });
    let bottom = TeleChart.rect(this.range.window.left + wBorder, this.height - hBorder, this.range.window.width - 2 * wBorder, hBorder, {
      'stroke-width': 0,
      'stroke': 'black',
      'fill': 'black',
      'opacity': '0.2',
    });

    this.svgRoot.append(right);
    this.svgRoot.append(left);
    this.svgRoot.append(top);
    this.svgRoot.append(bottom);
    // this.svgRoot.append(base);
  }

  render() {
    let element;
    // let element = TeleChart.line(0, 0, this.width, this.height - this.heightPanel, {'stroke-width': 2, 'stroke': 'black'});
    // this.svgRoot.append(element);
    // element = TeleChart.line(0, this.height - this.heightPanel, this.width, 0, {'stroke-width': 2, 'stroke': 'black'});
    // this.svgRoot.append(element);
    this.drawMiniMap();
    this.drawWindow();
    this.createHeader();
    this.drawGraph();
  }
}
