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

  static text(options) {
    let element = TeleChart.createSVG('text');
    TeleChart.setAttribute(element, options);
    if ('innerHTML' in options) {
      element.innerHTML = options.innerHTML;
    }
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
    this.axisColor = '#96a2aa';
    this.divRoot = document.getElementById(tagID);
    this.divRoot.style.width = options['width'];
    this.svgRoot = TeleChart.createSVG('svg');
    TeleChart.setAttribute(this.svgRoot, {height: options['height'], width: options['width']})
    this.divRoot.append(this.svgRoot);

    this.divTile = document.createElement('div');
    this.divTile.setAttribute('style', `display: none; position: absolute; background-color: white; left: 800px; top: 100px; border: 1px solid ${this.axisColor}; border-radius: 5px; white-space: nowrap;`);
    this.divRoot.append(this.divTile);

    this.svgPanel = TeleChart.createSVG('svg');
    TeleChart.setAttribute(this.svgPanel, {height: options['heightPanel'], width: options['width']})
    this.divRoot.append(this.svgPanel);

    this.statusTag = document.getElementById('Status');
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
      },
      svg: {}
    };
    this.YAxis = {
      versions: [],
      gs: {},
      garbage: []
    };
    this.XAxis = {};
    this.tile = {};
    this.range.window.left = this.width - this.range.window.width;
    // this.range.window.left = 180;
    this.heightPanel = this.svgPanel.height.animVal.value;
    this.animationDuration = options.animationDuration;
    this.animationLayers = new Set();
    this.animationStack = new Set();
    this.sieve = 0;
    this.semafors = {};
    this.updateMinMaxInRange();
    this.render();
  }

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
        yield false;
        break;
      }
    }
  }

  button(name) {
    return `<button id="${name}Button" style="border-radius: 40px; border: 1px solid ${this.axisColor}; background-color: white; margin-right: 10px;">
      <svg width="40px" height="40px" style=" display: inline-block; vertical-align: middle;">
        <circle cy="20" cx="20" r="15" fill="${this.data.raw.colors[name]}"/>
      <path class="mark" d="M 13,20 l7,7 l7,-12 l-4,0 l-3,7 l-3,-3 z" stroke-width="2" fill="white">
        </path>
      <circle class="whiteCircle" cy="20" cx="20" r="1" fill="white" style="display: none;"/>
      </svg>
      <span>${name}</span>
    </button>`;
  }

  animationStepPanel(curTime, rightProgres, leftProgres) {
    for (let item of this.data.allItems) {
      let panel = this.data.y[item].panel;
      let tempPoints = panel.newViewCoord.map((xy, index) => [
        xy[0],
        Math.floor(xy[1] - panel.deltaY[index] * leftProgres)
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

  *animateYBlink(y, duration, direction) {
    let startTime = performance.now();
    yield 'start';
    while (true) {
      if (startTime + duration > this.animationTime) {
        let progres = direction * (-0.5 + (this.animationTime - startTime) / duration) + 0.5;
        y.g.setAttributeNS(null, 'opacity',  progres);
        yield performance.now()- startTime;
      } else {
        break;
      }
    }
    if (-1 == direction) {
      y.g.remove()
      if ((undefined != y.remove) && (undefined != this.YAxis.gs[y.remove]) && (y.remove == this.YAxis.gs[y.remove].remove)) {
        delete this.YAxis.gs[y.remove];
      }
    } else {
      y.g.setAttributeNS(null, 'opacity',  1);
    }
  }

  scaleYAxis() {
    let last = this.YAxis.versions[this.YAxis.versions.length - 1];
    let v = this.getYSieve();
    this.YAxis.versions.push(v);
    for (let y of v.points) {
      if (!(y in this.YAxis.gs)) {
        this.drawYLine(y, last, 0);
        this.YAxis.gs[y].newViewY = this.getViewY(y, this.range);
        this.YAxis.gs[y].delta = this.YAxis.gs[y].newViewY - this.YAxis.gs[y].viewY;
        let a = this.animateYBlink(this.YAxis.gs[y], this.animationDuration, 1);
        this.doAnimation(a);
      }
    }
    for (let y of last.points) {
      if (!v.points.has(y) && (y in this.YAxis.gs)) {
        this.YAxis.gs[y].newViewY = this.getViewY(y, this.range);
        this.YAxis.gs[y].delta = this.YAxis.gs[y].newViewY - this.YAxis.gs[y].viewY;
        this.YAxis.gs[y].remove = y;
        let a = this.animateYBlink(this.YAxis.gs[y], this.animationDuration, -1);
        this.doAnimation(a);
      }
    }
    if (this.YAxis.versions.length > 2) this.YAxis.versions.shift();

    if ('recall' == this.semafors['scaleYAxis']) {
      this.semafors['scaleYAxis'] = 'work';
      this.animationLayers.add('graph');
      setTimeout(() => this.scaleYAxis());
    } else {
      this.semafors['scaleYAxis'] = '';
    }
  }

  animationStepGraph(curTime, rightProgres, leftProgres) {
    for (let item of this.data.allItems) {
      let graph = this.data.y[item].graph;
      let tempPoints = graph.newViewCoord.map((xy, index) => [
        xy[0],
        Math.floor(xy[1] - graph.deltaY[index] * leftProgres)
        ]);
      graph.curViewCoord = tempPoints;
      this.data.y[item].graph.path.setAttributeNS(null, 'd', this.pointsToD(tempPoints));
    }

    let count = 0;
    let last = this.YAxis.versions[this.YAxis.versions.length - 1];
    for (let [y, g] of Object.entries(this.YAxis.gs)) {
      g.viewY = g.newViewY - g.delta * leftProgres;
      g.line.setAttributeNS(null, 'd', this.pointsToD([[0, g.viewY], [this.width, g.viewY]]));
      g.text.setAttributeNS(null, 'y', g.viewY - 3);
      if (0 < g.viewY && g.viewY < this.height && last.points.has(parseInt(y))) {
        count += 1;
      }
    }

    if (count != 6 && Object.keys(this.YAxis.gs).length < 15) {
      this.requestScaleYAxis();
    }

    if (curTime < this.finishTime) {
      return true;
    } else {
      this.requestScaleYAxis();
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

    for (let item of this.data.allItems) {
      let panel = this.data.y[item].panel;
      panel.newViewCoord = this.fastCalcLineCoord(item, 'panel');
      panel.deltaY = panel.curViewCoord.map((xy, index) => panel.newViewCoord[index][1] - panel.curViewCoord[index][1]);
    }
  }

  animateGraph() {
    this.updateMinMaxInRange();
    for (let item of this.data.allItems) {
      let graph = this.data.y[item].graph;
      graph.newViewCoord = this.fastCalcLineCoord(this.data.y[item].coord, 'graph');
      graph.deltaY = graph.curViewCoord.map((xy, index) => graph.newViewCoord[index][1] - graph.curViewCoord[index][1]);
    }

    for (let [y, g] of Object.entries(this.YAxis.gs)) {
      g.newViewY = this.getViewY(y, this.range);
      g.delta = g.newViewY - g.viewY;
    }
  }

  animationStep() {
    this.animationTime = performance.now();
    let rightProgres = (this.animationTime - this.startTime) / this.animationDuration;
    let leftProgres = 1 - rightProgres;
    let callNextStep = false;

    if (this.animationLayers.has('panel')) {
      callNextStep = this.animationStepPanel(this.animationTime, rightProgres, leftProgres);
    }

    if (this.animationLayers.has('graph')) {
      callNextStep |=  this.animationStepGraph(this.animationTime, rightProgres, leftProgres);
    }

    if (this.animationStack.size > 0) {
      callNextStep = true;
      for (let [key, value] of this.animationStack.entries()) {
        let cont = key.next();
        if (undefined == cont.value) this.animationStack.delete(key);
      }
    }

    if (callNextStep) {
      requestAnimationFrame(() => this.animationStep())
    } else {
      for (let item of this.data.allItems) {
        if (!this.data.viewItems.has(item)) {
          this.data.y[item].panel.path.style.display = 'none';
          this.data.y[item].graph.path.style.display = 'none';
        }
      }
    };
  }

  doAnimation(animation) {
    this.startTime = performance.now();
    this.finishTime = this.startTime + this.animationDuration;

    if (this.animationLayers.has('panel')) this.animatePanel();
    if (this.animationLayers.has('graph')) this.animateGraph();
    if (animation != undefined) {
      this.animationStack.add(animation);
      animation.next();
    }

    requestAnimationFrame(() => this.animationStep());
  }

  reCheck(button, name) {
    let whiteCircle = button.querySelector('.whiteCircle');
    let direction = 1;
    this.hidePointer();
    if (this.data.viewItems.has(name)) {
      this.data.viewItems.delete(name);
    } else {
      this.data.viewItems.add(name);
      this.data.y[name].panel.path.style.display = 'inline';
      this.data.y[name].graph.path.style.display = 'inline';
      direction = -1;
    }
    let a = this.animateCircleInButton(whiteCircle, 200, direction);

    this.animationLayers.add('panel');
    this.animationLayers.add('graph');
    this.doAnimation(a);
  }

  createHeader() {
    this.header = document.createElement('div');
    this.divRoot.append(this.header);

    for (let element of this.data.allItems) {
      this.header.innerHTML += this.button(element);
    };

    for (let element of this.data.allItems) {
      let b = this.header.querySelector(`#${element}Button`);
      b.addEventListener('click', eventData => {
        this.reCheck(b, element);
      });
    };
  }

  pointsToD(points) {
    let res = `M ${points[0].join(',')} L `;
    for (let i = 1; i < points.length; i++) {
      res += ' ' + points[i].join(',');
    }
    return res;
  }

  calcLineCoord(fromX, fromY, dx, dy, element) {
    let data = this.data.y[element].coord;
    let points = [];
    let scaleX = dx / (this.xLength - 1);
    let heightY = this.maxy - this.miny;
    for (let i = 0; i < data.length; i++) {
      let x = fromX + scaleX * i;
      let y = dy - (data[i] - this.miny) / heightY * dy;
      points.push([x, y]);
    }

    return points;
  }

  getViewY(y, v) {
    return Math.round(this.height - (y - v.miny) / v.delta * this.height);
  }

  getViewX(x) {
    let scaleX = this.width / (this.range.right - this.range.left);
    return scaleX * (x - this.range.left)
  }


  calcGraphLineCoord(fromX, fromY, dx, dy, data) {
    let points = [];
    let scaleX = dx / (this.range.right - this.range.left);
    let heightY = this.range.maxy - this.range.miny;
    let yOffset = this.height - fromY;
    let fromI = Math.floor(this.range.left - fromX / scaleX);
    fromI = 0;
    for (let i = fromI; i < data.length; i++) {
      let x = Math.round(fromX + scaleX * (i - this.range.left));
      let y = Math.round(yOffset - (data[i] - this.range.miny) / heightY * dy);
      points.push([x, y]);
    }
    return points;
  }

  fastCalcLineCoord(element, type) {
    if ('panel' == type) {
      return this.calcLineCoord(2, 2, this.width - 4, this.heightPanel - 4, element);
    } else {
      return this.calcGraphLineCoord(0, 0, this.width, this.height, element);
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
    miny = miny - delta * 0.05;
    maxy = maxy + delta * 0.05;
    if (this.miny != miny || this.maxy != maxy) {
      this.miny = miny;
      this.maxy = maxy;
      return true;
    } else {
      return false;
    }
  }

  getYSieve() {
    let obj = {
      points: new Set,
      delta: this.range.maxy - this.range.miny,
      miny: this.range.miny
    };
    let roundFactor = 10 ** ( Math.ceil(Math.log10(obj.delta / 7)) - 2 );
    let step = Math.ceil(obj.delta / 7 / roundFactor) * roundFactor;
    let y = Math.ceil(this.rawMiny / roundFactor) * roundFactor - step;
    for (let i = 0; i < 8; i++) {
      obj.points.add(Math.round(y * 100) / 100);
      y += step;
    }
    return obj;
  }

  updateMinMaxInRange() {
    let a = [];
    let miny = Infinity;
    let maxy = -Infinity;

    this.range.left = (this.xLength -1 ) * this.range.window.left / this.width;
    this.range.right = (this.xLength - 1) * (this.range.window.left + this.range.window.width) / this.width;

    for (let item of this.data.viewItems) {
      let y = this.data.y[item].coord.slice(Math.floor(this.range.left), Math.ceil(this.range.right) + 1);
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
    this.rawMiny = miny;
    miny = miny - delta * 0.07;
    maxy = maxy + delta * 0.05;

    if (this.range.miny != miny || this.range.maxy != maxy) {
      this.range.delta = delta;
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
      let path = TeleChart.path({'d': d, 'stroke-width': 2, 'stroke': this.data.raw.colors[element], 'fill': 'none'});
      this.data.y[element].panel.path = path;
      this.svgPanel.append(path);
    };
  }

  drawGraph() {
    this.updateMinMaxInRange();
    for (let element of this.data.allItems) {
      this.data.y[element].graph.curViewCoord = this.fastCalcLineCoord(this.data.y[element].coord, 'graph');
      let d = this.pointsToD(this.data.y[element].graph.curViewCoord);
      let path = TeleChart.path({'d': d, 'stroke-width': 2,
        'stroke': this.data.raw.colors[element],
        'fill': 'none'});
      this.data.y[element].graph.path = path;
      this.svgRoot.append(path);
    };
  }

  msg(text) {
    this.statusTag.innerHTML = text;
  }

  midMoveXAxis() {
    for (let obj of this.XAxis.points) {
      obj.viewX = this.getViewX(obj.x);
      TeleChart.setAttribute(obj.text, {x: obj.viewX - obj.coord.width});
    }
  }

  *animateLabelRemove(target, duration, direction) {
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

  requestScaleYAxis() {
    if ('recall' == this.semafors['scaleYAxis']) return;
    if ('work' == this.semafors['scaleYAxis']) {
      this.semafors['scaleYAxis'] = 'recall';
    } else {
      this.semafors['scaleYAxis'] = 'work';
      setTimeout(() => this.scaleYAxis());
    }
  }

  requestScaleXAxis() {
    if ('recall' == this.semafors['scaleXAxis']) return;
    if ('work' == this.semafors['scaleXAxis']) {
      this.semafors['scaleXAxis'] = 'recall';
    } else {
      this.semafors['scaleXAxis'] = 'work';
      setTimeout(() => this.scaleXAxis());
    }
  }

  scaleXAxis() {
    this.updateMinMaxInRange();
    let visibleCount = 0;
    let count = 0;

    for (let item of this.XAxis.points) {
      item.viewX = this.getViewX(item.x);
      TeleChart.setAttribute(item.text, {x: item.viewX - item.coord.width});
      if (0 != count % (2 ** this.sieve) && 1 == item.visible) {
        let a = this.animateLabelRemove(item, 400, -1);
        this.doAnimation(a);
        item.visible = 0;
      } else if (0 == count % (2 ** this.sieve) && 0 == item.visible) {
        let a = this.animateLabelRemove(item, 400, 1);
        this.doAnimation(a);
        item.visible = 1;
      }
      count += 1;
    }

    visibleCount = this.width / (this.XAxis.points[0].viewX - this.XAxis.points[2 ** this.sieve].viewX);

    if (visibleCount > 8) {
      this.sieve += 1;
      this.requestScaleXAxis();
    } else if (visibleCount < 4 && this.sieve > 0)  {
      this.sieve -= 1;
      this.requestScaleXAxis();
    }

    if ('recall' == this.semafors['scaleXAxis']) {
      this.semafors['scaleXAxis'] = 'work';
      setTimeout(() => this.scaleXAxis());
    } else {
      this.semafors['scaleXAxis'] = '';
    }
  }

  onMove(clientX) {
    let svg = this.range.svg;
    if (svg.target != undefined) {
      let delta = clientX - svg.mouseXStart;
      this.hidePointer();
      if ('right' == svg.target) {
        this.range.window.width = svg.reper + delta;
        if (this.range.window.width + this.range.window.left > this.width) {
          this.range.window.width = this.width - this.range.window.left;
          svg.target = undefined;
        } else if (this.range.window.width < Math.round(this.width * 0.25)) {
          this.range.window.width = Math.round(this.width * 0.25);
          svg.target = undefined;
        }
        svg.rightBox.setAttributeNS(null, 'x', this.range.window.left + this.range.window.width);
        svg.rightBox.setAttributeNS(null, 'width', this.width - this.range.window.left - this.range.window.width);
        svg.right.setAttributeNS(null, 'x', this.range.window.left + this.range.window.width - svg.wBorder);
        svg.top.setAttributeNS(null, 'width', this.range.window.width - 2 * svg.wBorder);
        svg.bottom.setAttributeNS(null, 'width', this.range.window.width - 2 * svg.wBorder);
        this.requestScaleXAxis();

      } else if ('left' == svg.target) {
        this.range.window.left = svg.reper['left'] + delta;
        this.range.window.width = svg.reper['total'] - this.range.window.left;
        if (this.range.window.left < 0) {
          this.range.window.left = 0;
          this.range.window.width = svg.reper['total'] - this.range.window.left;
          svg.target = undefined;
        } else if (this.range.window.width < Math.round(this.width * 0.25)) {
          this.range.window.width = Math.round(this.width * 0.25);
          this.range.window.left = svg.reper['total'] - this.range.window.width;
          svg.target = undefined;
        }
        svg.leftBox.setAttributeNS(null, 'width', this.range.window.left);
        svg.left.setAttributeNS(null, 'x', this.range.window.left);
        svg.top.setAttributeNS(null, 'x', this.range.window.left + svg.wBorder);
        svg.top.setAttributeNS(null, 'width', this.range.window.width - 2 * svg.wBorder);
        TeleChart.setAttribute(svg.bottom, {'x': this.range.window.left + svg.wBorder, 'width': this.range.window.width - 2 * svg.wBorder})
        this.requestScaleXAxis();
      } else if ('mid' == svg.target) {
        this.range.window.left = svg.reper + delta;
        if (this.range.window.left < 0) {
          this.range.window.left = 0;
          svg.target = undefined;
          this.updateMinMaxInRange();
        } else if (this.range.window.left + this.range.window.width > this.width) {
          this.range.window.left = this.width - this.range.window.width;
          svg.target = undefined;
          this.updateMinMaxInRange();
        }
        svg.leftBox.setAttributeNS(null, 'width', this.range.window.left);
        svg.rightBox.setAttributeNS(null, 'width', this.width - this.range.window.width - this.range.window.left);
        svg.rightBox.setAttributeNS(null, 'x', this.range.window.width + this.range.window.left);
        svg.left.setAttributeNS(null, 'x', this.range.window.left);
        svg.right.setAttributeNS(null, 'x', this.range.window.left + this.range.window.width - svg.wBorder);
        svg.top.setAttributeNS(null, 'x', this.range.window.left + svg.wBorder);
        svg.bottom.setAttributeNS(null, 'x', this.range.window.left + svg.wBorder);
        this.midMoveXAxis();
      }
      this.animationLayers.add('graph');
      this.doAnimation();
      // this.msg(JSON.stringify(this.range.window));
      this.msg(this.range.left.toString() + ' ' + this.range.right.toString());
    }
  }

  drawWindow() {
    let svg = this.range.svg;
    svg.wBorder = 10;
    svg.hBorder = Math.round(svg.wBorder * 0.25);

    let windowStyle = {'stroke-width': 0, 'fill': 'black', 'opacity': '0.15'};

    svg.top = TeleChart.rect(this.range.window.left + svg.wBorder, 0, this.range.window.width - 2 * svg.wBorder, svg.hBorder, windowStyle);
    svg.bottom = TeleChart.rect(this.range.window.left + svg.wBorder, this.heightPanel - svg.hBorder, this.range.window.width - 2 * svg.wBorder, svg.hBorder, windowStyle);

    windowStyle['cursor'] = 'col-resize';

    svg.right = TeleChart.rect(this.range.window.left + this.range.window.width - 10, 0, 10, this.heightPanel, windowStyle);
    svg.left = TeleChart.rect(this.range.window.left, 0, 10, this.heightPanel, windowStyle);

    windowStyle = { 'stroke-width': 0, 'fill': 'black', 'opacity': '0.3'};
    svg.rightBox = TeleChart.rect(this.range.window.left + this.range.window.width, 0, this.width - this.range.window.left - this.range.window.width, this.heightPanel, windowStyle);
    svg.leftBox = TeleChart.rect(0, 0, this.range.window.left, this.heightPanel, windowStyle);

    svg.right.addEventListener('mousedown', (eventData) => {
      svg.mouseXStart = eventData.clientX;
      svg.reper = this.range.window.width;
      svg.target = 'right';
    });

    svg.left.addEventListener('mousedown', (eventData) => {
      svg.mouseXStart = eventData.clientX;
      svg.reper = {'total': this.range.window.left + this.range.window.width, 'left': this.range.window.left};
      svg.target = 'left';
    });

    this.svgPanel.addEventListener('mousedown', (eventData) => {
      let right = svg.right.getBoundingClientRect();
      let left = svg.left.getBoundingClientRect();
      if (right.top < eventData.clientY && eventData.clientY < right.bottom) {
        if (left.right < eventData.pageX && eventData.pageX < right.left) {
          svg.mouseXStart = eventData.clientX;
          svg.reper = this.range.window.left;
          svg.target = 'mid';
        }
      }
    });

    this.svgPanel.addEventListener('touchstart', (eventData) => {
      let right = svg.right.getBoundingClientRect();
      let left = svg.left.getBoundingClientRect();

      if (right.top < eventData.touches[0].clientY && eventData.touches[0].clientY < right.bottom) {
        let tx = Math.round(eventData.touches[0].pageX);
        let rlx = right.left - this.range.window.width * 0.1;
        let rx = right.right + this.range.window.width * 0.1;
        if (rlx < eventData.touches[0].pageX && eventData.touches[0].pageX < rx) {
          svg.mouseXStart = tx;
          svg.reper = this.range.window.width;
          svg.target = 'right';
        }
        let lx = left.left - this.range.window.width * 0.1;
        let lrx = left.right + this.range.window.width * 0.1;
        if (lx < eventData.touches[0].pageX && eventData.touches[0].pageX < lrx) {
          svg.mouseXStart = tx;
          svg.reper = {'total': this.range.window.left + this.range.window.width, 'left': this.range.window.left};
          svg.target = 'left';
        }
        if (lrx < eventData.touches[0].pageX && eventData.touches[0].pageX < rlx) {
          svg.mouseXStart = tx;
          svg.reper = this.range.window.left;
          svg.target = 'mid';
        }
      }
    });

    document.addEventListener('touchmove', (eventData) => {
      this.onMove(Math.round(eventData.touches[0].pageX));
    });

    document.addEventListener('mousemove', (eventData) => {
      this.onMove(Math.round(eventData.pageX));
    });

    document.addEventListener('touchend', (eventData) => {
      svg.target = undefined;
    });

    this.svgPanel.addEventListener('mouseup', (eventData) => {
      svg.target = undefined;
    });

    [svg.right, svg.left, svg.top, svg.bottom, svg.rightBox, svg.leftBox].forEach(element => this.svgPanel.append(element));
  }

  drawYLine(y, v, opacity = 1) {
    let viewY = this.getViewY(y, v);
    let g = {
      viewY: viewY,
      g: TeleChart.createSVG('g'),
      line: TeleChart.path({d: this.pointsToD([[0, viewY], [this.width, viewY]]),'fill': this.axisColor, 'stroke-width': 2, 'stroke': this.axisColor}),
      text: TeleChart.text({x: 4, y: viewY - 3, innerHTML: y, fill: this.axisColor, style: 'font-size: 10px'})
    }
    g.g.setAttributeNS(null, 'opacity', opacity);
    g.g.append(g.text);
    g.g.append(g.line);
    this.YAxis.gs[y] = g;
    this.YAxis.g.append(g.g);
  }

  drawYAxis() {
    let ys = this.getYSieve();
    this.YAxis.versions.push(ys);
    for (let y of ys.points) {
      this.drawYLine(y, ys);
    }
  }

  mmDD(date) {
    return TeleChart.monthNames[date.getMonth()] + ' ' + date.getDate().toString();
  }

  wwMMDD(date) {
    return TeleChart.monthNames[date.getDay()] + ', ' + this.mmDD(date);
  }

  drawLabel(x, i) {
    let obj = {
      x: x,
      visible: 1,
      viewX: this.getViewX(x),
      innerHTML: this.mmDD(this.data.x[x])
    };
    obj.text = TeleChart.text({x: obj.viewX, y: this.height + 100, innerHTML: obj.innerHTML, fill: this.axisColor, style: 'font-size: 10px'});
    this.svgRoot.append(obj.text);
    obj.coord = obj.text.getBBox();
    TeleChart.setAttribute(obj.text, {x: obj.viewX - obj.coord.width, y: this.height - 2});
    return obj;
  }

  getXAxisPoints() {
    let cur = this.xLength - 1;
    let points = [cur];
    let dx = (this.range.right - this.range.left) / 5.3;
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

  drawXAxis() {
    this.XAxis.points = this.getXAxisPoints().map((x, i) => this.drawLabel(x, i));
  }

  hidePointer() {
    this.svgRoot.querySelectorAll('.point').forEach(el => el.remove());
    this.targetLine.setAttributeNS(null, 'd', this.pointsToD([[0, 0], [0, 0]]));
    this.divTile.style.display = 'none';
  }

  innerTile() {
    let d = this.data.x[this.tile.pointedX];
    let res = `<div style="margin: 5px;">${this.wwMMDD(d)}</div>`;
    res += [...this.data.viewItems].map(item => {
      return `<div style="display: inline-block; margin: 5px; color: ${this.data.raw.colors[item]}">
      <div style="font-weight: bold;">${this.data.y[item].coord[this.tile.pointedX]}</div>
      <div>${item}</div>
    </div>`;
    }).join('');
    return res;
  }

  drawTile(clientX, clientY) {
    this.targetLine.setAttributeNS(null, 'd', this.pointsToD([[this.tile.viewX, 0], [this.tile.viewX, this.height - 10]]));
    this.svgRoot.querySelectorAll('.point').forEach(el => el.remove());
    for (let item of this.data.viewItems) {
      let y = this.data.y[item].graph.curViewCoord[this.tile.pointedX][1];
      let circle = TeleChart.circle(this.tile.viewX, y, 5, {'class': 'point', 'fill': 'white', 'stroke': this.data.raw.colors[item], 'stroke-width': 2});
      this.svgRoot.append(circle);
    }

    this.divTile.innerHTML = this.innerTile();
    let coord = this.divTile.getBoundingClientRect();
    if (clientX + 25 + coord.width > document.body.clientWidth ) {
      this.divTile.style.left = clientX - coord.width - 25 + 'px';
    } else {
      this.divTile.style.left = clientX + 25 + 'px';
    }
    this.divTile.style.top = clientY + 'px';
    this.divTile.top = clientY;

    this.divTile.style.display = 'block';

    let text = this.divTile;
  }

  moveOnRoot(clientX, clientY) {
    let rect = this.svgRoot.getBoundingClientRect();
    let xSVG = clientX - rect.x;
    let xPerPoint = this.width / (this.range.right - this.range.left);
    let pointedX = Math.round(xSVG / xPerPoint + this.range.left);
    let newViewX = Math.round((pointedX - this.range.left) * xPerPoint);
    if (this.tile.x != newViewX) {
      this.tile.viewX = newViewX;
      this.tile.pointedX = pointedX;
      this.drawTile(clientX, clientY);
    }
  }

  render() {
    let element;
    this.YAxis.g = TeleChart.createSVG('g');
    this.svgRoot.append(this.YAxis.g);
    this.svgRoot.setAttributeNS(null, 'id', 'sss');
    this.targetLine = TeleChart.path({'fill': this.axisColor, 'stroke-width': 2, 'stroke': this.axisColor});
    this.svgRoot.append(this.targetLine);

    this.drawGraph();
    this.drawWindow();
    this.drawMiniMap();
    this.drawXAxis();
    this.drawYAxis();
    this.createHeader();

    this.svgRoot.addEventListener('mousemove', (eventData) => {
      this.moveOnRoot(eventData.clientX, eventData.pageY);
    });

    this.svgRoot.addEventListener('touchstart', (eventData) => {
      this.moveOnRoot(eventData.touches[0].pageX, eventData.touches[0].pageY);
    });

    this.svgRoot.addEventListener('touchmove', (eventData) => {
      this.moveOnRoot(eventData.touches[0].pageX, eventData.touches[0].pageY);
    });
  }
}

TeleChart.monthNames = ['Jan', 'Feb', 'Mar','Apr', 'May', 'Jun', 'Jul','Aug', 'Sep', 'Oct','Nov', 'Dec'];
TeleChart.dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
