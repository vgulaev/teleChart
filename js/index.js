window.addEventListener('load', async function( event ) {
  craths = [];
  document.querySelectorAll('.chart').forEach((el, index) =>
    craths.push(new TeleChart(el.id, chartData[index + 2], {
      width: '500px',
      height: '200px',
      widthToPage: true,
      heightPanel: '100px',
      animationDuration: 1000
    }))
    );
});
