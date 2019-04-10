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
  httpGetAsync('contest/3/overview.json')
    .then(data => {
      let d = JSON.parse(data);
      // d.columns = d.columns.map(e => e.slice(0, 100));
      d.caption = c[3];
      new TC20('chart0', d, {
            width: 500,
            height: 300,
            widthToPage: document.getElementById('widthToPage').checked,
            heightPanel: 120
          });
    });
  [1, 4, 5].forEach(i => {
    httpGetAsync(`contest/${i}/overview.json`)
      .then(data => {
        let d = JSON.parse(data);
        d.caption = c[i];
        c0 = new TC20(`chart${i}`, d, {
              width: 500,
              height: 300,
              widthToPage: document.getElementById('widthToPage').checked,
              heightPanel: 120
            });
      });
  });
  // let dur = parseInt(document.getElementById('animationDuration').value);

  // document.querySelectorAll('.chart').forEach((el, index) =>
  //   craths.push(new TC20(el.id, chartData[index + 2], {
  //     width: 500,
  //     height: 300,
  //     widthToPage: document.getElementById('widthToPage').checked,
  //     heightPanel: 120
  //   }))
  //   );
  // new TeleChart('chart1', chartData[2], {
  //       width: '500px',
  //       height: '300px',
  //       widthToPage: document.getElementById('widthToPage').checked,
  //       heightPanel: '120px',
  //       animationDuration: dur
  //     });

  // c = new TC20('chart0', chartData[2], {
  //       width: 500,
  //       height: 300,
  //       widthToPage: document.getElementById('widthToPage').checked,
  //       heightPanel: 120,
  //       animationDuration: dur
  //     });
  // c.msg("TeleChart20 I'm work");
}

window.addEventListener('load', async function( event ) {
  drawCharts();
});
