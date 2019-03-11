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

  constructor(tagID, data, options = {}) {
    this.svgRoot = document.getElementById(tagID);
    this.data = data;
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
    let g = TeleChart.createSVG('g');
    g.setAttributeNS(null, 'id', 'header');

    let x = 10;
    Object.keys(this.data.names).forEach( key => {
      let text = TeleChart.text(key, {'id': key, 'x': x, 'y': this.width - 10, 'onclick': `alert("${key}");`});
      x += 25;
      g.append(text)
    });
    this.svgRoot.append(g);

    // g.setAttributeNS(null, 'transform', 'translate(100, -800)');
    g.setAttributeNS(null, 'cursor', 'col-resize');
    // console.log(text.getBBox());
    // console.log('Hello');
    // this.data.names.forEach(el => {

    // })
  }

  render() {
    let dy = 30;
    let element = TeleChart.line(0, 0, this.width, this.height - this.heightPanel - dy, {'stroke-width': 2, 'stroke': 'black'});
    this.svgRoot.append(element);
    element = TeleChart.line(0, this.height - this.heightPanel - dy, this.width, 0, {'stroke-width': 2, 'stroke': 'black'});
    this.svgRoot.append(element);
    element = TeleChart.rect(1, this.height - this.heightPanel - dy, this.width - 2, this.heightPanel, {
      'stroke-width': 2,
      'stroke': 'black',
      'fill': 'none',
      'cursor': 'col-resize'
    });
    this.svgRoot.append(element);
    element = TeleChart.rect(1, this.height - dy, this.width - 2, dy, {
      'stroke-width': 2,
      'stroke': 'red',
      'fill': 'none',
      'cursor': 'col-resize'
    });
    this.svgRoot.append(element);
    this.createHeader();
  }
}
