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
  pieces.push('}\n');
  fs.writeFileSync(fileOut, pieces.join(_spliter));
}

function truncSpace(content) {
  return content
    .split('\n')
    .map(e => e.trim())
    .filter(e => '//' != e.substring(0, 2))
    .filter(e => 'console.log(' != e.substring(0, 12))
    .filter(e =>  0 != e.length)
    .join(' ')
    .replace(/  /g, ' ')
    .replace(/ }/g, '}')
    .replace(/ \/ /g, '/')
    .replace(/\) /g, ')')
    .replace(/} /g, '}')
    .replace(/ = /g, '=')
    .replace(/; /g, ';')
    .replace(/\, /g, ',')
    .replace(/ \+ /g, '+')
    .replace(/ \* /g, '*')
    .replace(/ => /g, '=>')
    .replace(/ \./g, '.')
    .replace(/: /g, ':')
    .replace(/ \{/g, '{')
    .replace(/ - /g, '-')
    .replace(/ == /g, '==')
    .replace(/ < /g, '<')
    .replace(/ > /g, '>')
    .replace(/ && /g, '&&')
    .replace(/ != /g, '!=')
    .replace(/ \(/g, '(')
    .replace(/\{ /g, '{');
}

// function findValues(content) {
//   return content
//   .split('\n')
//   .filter(e => -1 != e.indexOf('let'))
//   .map(e => e.split('let')[1].);
// }

// function replaceLetVal(content) {
//   console.log(findValues(content));
//   return content;
// }

function min(fileOut) {
  let pieces = ['class TeleChart20 {'];
  fs.readdirSync(rootPath).forEach(item => {
    let content = fs.readFileSync(`${rootPath}/${item}`, 'utf-8');
    pieces.push(content);
  });
  pieces.push('}');
  fs.writeFileSync(fileOut, truncSpace(pieces.join('')));
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
  } else if ('min' == process.argv[2]) {
    min('teleChart-2.0.min.js');
  }
} else {
  startWatch();
}

// min('teleChart-2.0.min.js');
