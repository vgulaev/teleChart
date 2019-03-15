window.addEventListener('load', async function( event ) {
  let data = chartData[0];
  let chart = new TeleChart('anyChart', data, {widthToPage: true, heightPanel: 100,  animationTime: 1000});
});
