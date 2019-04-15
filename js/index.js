function httpGetAsync(theUrl) {
  return new Promise((resolve, reject) => {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200) resolve(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true);
    xmlHttp.send(null);
  });
}

function drawCharts() {
  let c = ['Followers', 'Interactions', 'Messages', 'Views', 'Apps'];
  let i = 5;
  httpGetAsync(`contest/${i}/overview.json`)
  // httpGetAsync('contest/2/2018-04/07.json')
    .then(data => {
      let d = JSON.parse(data);
      //d.columns = d.columns.map(e => 'x' == e[0] ? e : e.map((e, i) => ((i < 50 || (250 < i && i < 280)) && i != 0 ? i * 100 : e)));
      // d.columns = d.columns.map(e => 'x' == e[0] ? e : e.map((e, i) => i > 363 ? 2 : e));
      // d.columns = d.columns.map(e => e.slice(0, 8).map((e, i, a) => i > 0 && a[0] != 'x' ? Math.random() * 100 : e));
      d.columns = d.columns.map(e => e.slice(0, 8));

      // for (let i = 1; i < d.columns[0].length; i++) {
      //   let s = 0;
      //   for (let e of d.columns) {
      //     if ('x' == e[0]) continue;
      //     s += e[i];
      //   }
      //   for (let e of d.columns) {
      //     if ('x' == e[0]) continue;
      //     e[i] = e[i] / s * 100;
      //   }
      // }

      Object.keys(d.types).map(e => d.types[e] = 'x' == d.types[e] ? 'x' : 'pie');

      d.caption = c[2];
      t = new TC20('chart0', d, {
            width: 500,
            height: 300,
            widthToPage: document.getElementById('widthToPage').checked,
            heightPanel: 100,
            zoomPath: `contest/${i}`
          });
    });
  // [1, 2, 3, 4, 5].forEach((e, i) => {
  //   httpGetAsync(`contest/${e}/overview.json`)
  //     .then(data => {
  //       let d = JSON.parse(data);
  //       d.caption = c[e - 1];
  //       c0 = new TC20(`chart${i + 1}`, d, {
  //             width: 500,
  //             height: 300,
  //             widthToPage: document.getElementById('widthToPage').checked,
  //             heightPanel: 100,
  //             zoomPath: `contest/${e}`
  //           });
  //     });
  // });
  // let dur = parseInt(document.getElementById('animationDuration').value);
  // craths = [];
  // document.querySelectorAll('.chart').forEach((el, index) =>
  //   craths.push(new TC20(el.id, chartData[index + 1], {
  //     width: 500,
  //     height: 300,
  //     widthToPage: document.getElementById('widthToPage').checked,
  //     heightPanel: 120
  //   }))
  //   );
}

window.addEventListener('load', async function( event ) {
  drawCharts();
});
