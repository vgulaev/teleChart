window.addEventListener('load', async function( event ) {
  let data = chartData[6];
  let chart = new TeleChart('anyChart', data, {
      width: '500px',
      height: '500px',
      widthToPage: true,
      heightPanel: 100,
      animationTime: 1000
    });
});
