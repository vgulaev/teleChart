class TeleChart20 {
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

  static rect(x, y, width, height, options = {}) {
    let element = TeleChart.createSVG('rect');
    TeleChart.setAttribute(element, Object.assign({'x': x, 'y': y, 'width': width, 'height': height}, options));
    return element;
  }

  static path(options = {}) {
    let element = TeleChart.createSVG('path');
    TeleChart.setAttribute(element, options);
    return element;
  }

  static circle(cx, cy, r, options = {}) {
    let element = TeleChart.createSVG('circle');
    TeleChart.setAttribute(element, Object.assign({'cx': cx, 'cy': cy, 'r': r}, options));
    return element;
  }

  constructor(tagID, data, options = {}) {
    let width = options['width'];

    if (true == options['widthToPage']) {
      width = document.body.clientWidth - 10 + 'px';
    }

    this.divRoot = document.getElementById(tagID);
    this.divRoot.innerHTML = '';
    this.divRoot.style.width = width;

    this.svgRoot = TeleChart.createSVG('svg');
    TeleChart.setAttribute(this.svgRoot, {height: options['height'], width: width});

    this.divRoot.append(this.svgRoot);

    this.width = this.svgRoot.width.animVal.value;
    this.animationStack = new Set();
    this.render();
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

  *moveCircle() {
    let startTime = performance.now();
    let x = this.c.getBBox().x;
    console.log(this.width);
    yield 'start';
    while (true) {
    // for (let i = 0; i < 200; i++) {
      let dx = (this.animationTime - startTime) / 1000 * 150;
      // console.log(dx);
      this.c.setAttributeNS(null, 'cx', (x + dx) % this.width);
      yield true;
      // setTimeou(200, () => );
    }
  }

  doAnimation(animation) {
    if (animation != undefined) {
      this.animationStack.add(animation);
      animation.next();
    }

    requestAnimationFrame(() => this.animationStep());
  }


  render() {
    this.c = TeleChart20.circle(100, 100, 20, {'fill': '#E8AF14'});
    this.svgPanel.append(this.c);

    let a = this.moveCircle();
    this.doAnimation(a);
    console.log('Hello');
  }
}

// alert('TeleChart20 here');
