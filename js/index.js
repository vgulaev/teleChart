window.addEventListener('load', async function( event ) {
  // TeleChart.getUrl('logs/tmp/chart_data.json');
  // let data = chartData[5];
  let data = chartData[5];
  let chart = new TeleChart('anyChart', data, {widthToPage: true, heightPanel: 100});

//   let a = ['y0Button', 'y1Button'];

//   a.forEach(element => {
//     let b = document.getElementById(element);
//     b.addEventListener('click', eventData => {
//       console.log('Hello!' + element);
//     });
// })

  // b = document.getElementById(`${a[1]}`);
  // b.addEventListener('click', eventData => {
  //   console.log('Hello!');
  // });  // alert('Hello');
});
