window.addEventListener('load', async function( event ) {
  // TeleChart.getUrl('logs/tmp/chart_data.json');
  // let data = chartData[5];
  let data = chartData[1];
  let chart = new TeleChart('anyChart', data, {widthToPage: true, heightPanel: 100});
  // alert('Hello');
});
