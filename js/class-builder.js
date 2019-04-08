const fs = require('fs');

let rootPath = './teleChart-2.0';
let spliter = '//********//\n';

function compile(items, fileOut, text) {
  let _spliter = text;
  if (text == undefined) _spliter = spliter;
  let pieces = ['class TeleChart20 {\n'];
  if (items == undefined) {
    fs.readdirSync(rootPath).forEach(item => {
      let content = fs.readFileSync(`${rootPath}/${item}`, 'utf-8');
      pieces.push(content);
    });
  }
  pieces.push('}');
  fs.writeFileSync(fileOut, pieces.join(_spliter));
}

function getTitle(content) {
  let first = content
    .split('\n')[0]
    .split('(')[0]
    .split(' ')
    .pop();

  return first;
}

function split() {
  let items = fs.readFileSync('teleChart-2.0.edit.js', 'utf-8').split(spliter);
  items.shift();
  items.pop();
  items.forEach((content) => {
    let title = getTitle(content);
    fs.writeFileSync(`${rootPath}/${title}.function`, content);
    console.log(title);
  });
}

function startWatch() {
  fs.watch('teleChart-2.0.edit.js', { encoding: 'utf-8' }, (eventType, filename) => {
    split();
    compile(undefined, 'teleChart-2.0.js', '\n');
  });
}

if (3 == process.argv.length) {
  if ('init' == process.argv[2]) {
      compile(undefined, 'teleChart-2.0.edit.js', spliter);
  } else {
    startWatch();
  }
}
