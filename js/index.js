window.addEventListener('load', async function( event ) {
  let data = chartData[1];
  chart0 = new TeleChart('chart0', data, {
      width: '500px',
      height: '200px',
      widthToPage: true,
      heightPanel: '100px',
      animationDuration: 5000
    });
  let chart1 = new TeleChart('chart1', chartData[2], {
      width: '500px',
      height: '200px',
      widthToPage: true,
      heightPanel: '100px',
      animationDuration: 1000
    });
  let chart2 = new TeleChart('chart2', chartData[6], {
      width: '500px',
      height: '200px',
      widthToPage: true,
      heightPanel: '100px',
      animationDuration: 1000
    });
});
