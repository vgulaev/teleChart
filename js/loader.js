function getUrl(url) {
  return new Promise( resolve => {
    var myRequest = new XMLHttpRequest();
    myRequest.open("get", url);
    myRequest.onload = function (data) {
      resolve(myRequest.responseText);
    };
    myRequest.send();
  });
}

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

// getUrl(d)
//   .then((data) => {
//     eval(data);
//     return getUrl();
//   })
//   .then((data) => {
//     eval(data);
//     return getUrl();
//   })
//   .then((data) => {
//     eval(data);
//     eval('console.log("GGGGG")');
//   })

