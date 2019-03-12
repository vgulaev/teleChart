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

  static circle(cx, cy, r, options = {}) {
    let element = TeleChart.createSVG('circle');
    TeleChart.setAttribute(element, {'cx': cx, 'cy': cy, 'r': r});
    TeleChart.setAttribute(element, options);
    return element;
  }

  static text(innerText, options = {}) {
    let element = TeleChart.createSVG('text');
    TeleChart.setAttribute(element, options);
    element.innerHTML = innerText;
    return element;
  }

  makeWellStructuredData() {
    this.data.raw.columns.forEach((element, index) => {
      this.data.nameByIndex[element[0]] = index;
    });

    for (const [name, _type] of Object.entries(this.data.raw.types)) {
      let a = this.data.raw.columns[this.data.nameByIndex[name]];
      if ('x' == _type) {
        for (let i = 1; i < a.length - 1; i++) {
          this.data.x.push(new Date(a[i]));
        }
      } else if ('line' == _type) {
        this.data.y[name] = {
          coord: []
        };
        for (let i = 1; i < a.length - 1; i++) {
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
      y: {},
      nameByIndex: {}
    };
    this.makeWellStructuredData();
    this.width = this.svgRoot.width.animVal.value;
    this.height = this.svgRoot.height.animVal.value;
    if (options.panelHeight < 1) {
      this.heightPanel = Math.ceil(this.height * options.panelHeight);
    } else {
      this.heightPanel = options.panelHeight;
    }

    this.render();
    // alert('TeleChart ready');
  }

  createHeader() {
  }

  calcLineCoord(fromX, fromY, dx, dy, data) {

  }

  createMiniMap() {
    let a = [];
    let xLength = this.data.x.length;
    Object.keys(this.data.raw.names).forEach(element => {
      a.push(this.data.y[element].min);
      a.push(this.data.y[element].max);
    });
    let miny = Math.min(...a);
    let maxy = Math.max(...a);
    for (let i = 0; i < xLength; i++) {
      console.log(this.data.x[i]);
    }
    let path = TeleChart.path({'d': 'M 10,10 L 20,30 40,60 100,200 400,100 0,300 400,400', 'stroke-width': 2, 'stroke': 'black', 'fill': 'none'});
    this.svgRoot.append(path);
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
