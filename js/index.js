window.addEventListener('load', async function( event ) {
  let data = chartData[2];
  let chart = new TeleChart('anyChart', data, {
      width: '500px',
      height: '200px',
      widthToPage: true,
      heightPanel: '100px',
      animationDuration: 1000
    });
});
