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
    this.width = this.svgRoot.width.animVal.value;
    this.height = this.svgRoot.height.animVal.value;
    if (options.heightPanel < 1) {
      this.heightPanel = Math.ceil(this.height * options.heightPanel);
    } else {
      this.heightPanel = options.heightPanel;
    }
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

  animationStep() {
    let curTime = performance.now();
    let rightProgres = (curTime - TeleChart.startTime) / TeleChart.animationTime;
    let leftProgres = 1 - rightProgres;
    for (let item of this.data.viewItems) {
      let panel = this.data.y[item].panel;
      let tempPoints = panel.newViewCoord.map((xy, index) => [
        xy[0],
        xy[1] - panel.deltaY[index] * leftProgres
        ]);
      panel.curViewCoord = tempPoints;
      this.data.y[item].path.setAttributeNS(null, 'd', this.pointsToD(tempPoints));
    }

    if (curTime < TeleChart.finishTime) {
      requestAnimationFrame(() => this.animationStep());
    } else {
      for (let item of this.data.viewItems) {
        this.data.y[item].panel.curViewCoord = this.data.y[item].panel.newViewCoord;
        this.data.y[item].path.setAttributeNS(null, 'd', this.pointsToD(this.data.y[item].panel.curViewCoord));
      }
    }
  }

  animatePanel() {
    TeleChart.startTime = performance.now();
    TeleChart.animationTime = 2000;
    TeleChart.finishTime = TeleChart.startTime + TeleChart.animationTime;

    if (!this.updateMinMax()) return;

    for (let item of this.data.viewItems) {
      let panel = this.data.y[item].panel;
      panel.newViewCoord = this.fastCalcLineCoord(item, 'panel');
      panel.deltaY = panel.curViewCoord.map((xy, index) => panel.newViewCoord[index][1] - panel.curViewCoord[index][1]);
    }

    requestAnimationFrame(() => this.animationStep());

  }

  reCheck(button, name) {
    if (this.data.viewItems.has(name)) {
      this.data.viewItems.delete(name);
      this.data.y[name].path.style.display = 'none';
    } else {
      this.data.viewItems.add(name);
      this.data.y[name].path.style.display = 'inline';
    }
    this.animatePanel();
  }

  createHeader() {
    let keys = Object.keys(this.data.raw.names);
    this.header = document.getElementById('Header');

    keys.forEach(element => {
      this.header.innerHTML += this.button(element);
    });
    keys.forEach(element => {
      let b = document.getElementById(`${element}Button`);
      b.addEventListener('click', eventData => {
        this.reCheck(b, element);
      });
    });
  }

  pointsToD(points) {
    let strArray = [];
    strArray.push(`M ${points[0].join(',')}`);
    strArray.push('L');

    for (let i = 1; i < this.xLength; i++) {
      strArray.push(points[i].join(','));
    }
    return strArray.join(' ');
  }

  calcLineCoord(fromX, fromY, dx, dy, element) {
    let data = this.data.y[element].coord;
    let points = [];
    let scaleX = dx / (this.xLength - 1);
    let heightY = this.maxy - this.miny;
    for (let i = 0; i < this.xLength; i++) {
      let x = fromX + scaleX * i;
      let y = fromY - (data[i] - this.miny) / heightY * dy;
      points.push([x, y]);
    }

    return points;
  }

  fastCalcLineCoord(element, type) {
    if ('panel' == type) {
      return this.calcLineCoord(2, this.height - 2, this.width - 4, this.heightPanel - 4, element);
    } else {
      return this.calcLineCoord(2, this.height - 2, this.width - 4, this.width - this.heightPanel - 4, element);
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
    if (this.miny != miny || this.maxy != maxy) {
      this.miny = miny;
      this.maxy = maxy;
      return true;
    } else {
      return false;
    }
  }

  createMiniMap() {
    this.updateMinMax();
    let names = this.data.raw.names;
    this.xLength = this.data.x.length;
    this.gMiniMap = TeleChart.createSVG('g');
    TeleChart.setAttribute(this.gMiniMap, {'id': 'gMiniMap'});
    Object.keys(names).forEach(element => {
      this.data.y[element].panel.curViewCoord = this.fastCalcLineCoord(element, 'panel');
      let d = this.pointsToD(this.data.y[element].panel.curViewCoord);
      let path = TeleChart.path({'d': d, 'stroke-width': 2, 'stroke': this.data.raw.colors[element], 'fill': 'none'});
      this.data.y[element].path = path;
      this.gMiniMap.append(path);
    });
    this.svgRoot.append(this.gMiniMap);
  }

  render() {
    let element = TeleChart.line(0, 0, this.width, this.height - this.heightPanel, {'stroke-width': 2, 'stroke': 'black'});
    this.svgRoot.append(element);
    element = TeleChart.line(0, this.height - this.heightPanel, this.width, 0, {'stroke-width': 2, 'stroke': 'black'});
    this.svgRoot.append(element);
    element = TeleChart.rect(1, this.height - this.heightPanel, this.width - 2, this.heightPanel, {
      'stroke-width': 2,
      'stroke': 'black',
      'fill': 'none',
      'cursor': 'col-resize'
    });
    this.svgRoot.append(element);
    this.createHeader();
    this.createMiniMap();
  }
}
