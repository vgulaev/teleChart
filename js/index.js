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
  new TeleChart('chart0', chartData[0], {
        width: '500px',
        height: '200px',
        widthToPage: document.getElementById('widthToPage').checked,
        heightPanel: '100px',
        animationDuration: dur
      });

  new TeleChart20('chart1', chartData[0], {
        width: '500px',
        height: '200px',
        widthToPage: document.getElementById('widthToPage').checked,
        heightPanel: '100px',
        animationDuration: dur
      });
}

window.addEventListener('load', async function( event ) {
  drawCharts();
});
