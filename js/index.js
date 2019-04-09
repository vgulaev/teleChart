function drawCharts() {
  craths = [];
  let dur = parseInt(document.getElementById('animationDuration').value);
  // document.querySelectorAll('.chart').forEach((el, index) =>
  //   craths.push(new TeleChart(el.id, chartData[index], {
  //     width: '500px',
  //     height: '200px',
  //     widthToPage: document.getElementById('widthToPage').checked,
  //     heightPanel: '100px',
  //     animationDuration: dur
  //   }))
  //   );
  // new TeleChart('chart1', chartData[0], {
  //       width: '500px',
  //       height: '200px',
  //       widthToPage: document.getElementById('widthToPage').checked,
  //       heightPanel: '100px',
  //       animationDuration: dur
  //     });

  c = new TC20('chart0', chartData[2], {
        width: 500,
        height: 300,
        widthToPage: document.getElementById('widthToPage').checked,
        heightPanel: 120,
        animationDuration: dur
      });
  c.msg("TeleChart20 I'm work");
}

window.addEventListener('load', async function( event ) {
  drawCharts();
});
