var rnd = Math.random();

[
'logs/tmp/chart_data.js?v=' + rnd,
'js/teleChart.js?v=' + rnd,
'js/index.js?v=' + rnd
].forEach(function(src) {
  var script = document.createElement('script');
  script.src = src;
  script.async = false;
  document.head.appendChild(script);
});
