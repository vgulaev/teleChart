window.addEventListener('load', async function( event ) {
  // TeleChart.getUrl('logs/tmp/chart_data.json');
  let data = chartData[4];
  console.log(data);
  let chart = new TeleChart('anyChart', data, {widthToPage: true, panelHeight: 100});
  // alert('Hello');
});
