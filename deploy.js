const { execSync } = require('child_process');
const { exec } = require('child_process');

function remote_cmd(cmd, async = false) {
  console.log("cmd: " + cmd);
  var res = {'status': 'async'};
  var rem = `ssh -i config/teleChart.pem root@37.1.220.232 '${cmd}'`;
  if (false == async) {
    try {
      res['result'] = execSync(rem, { stdio: 'pipe' } );
      res['result'] = res['result'].toString();
      res['status'] = 'success';
    } catch (err) {
      res['result'] = err.stderr.toString();
      res['status'] = 'error';
    }
  } else {
    exec(rem);
  }
  return res;
}


function test() {
  [
    'git add .',
    'git commit -m "test"',
    'git push'
  ].forEach((cmd) => {
    console.log(cmd);
    try {
      let res = execSync(cmd, {shell: true});
      console.log(res.toString());
    } catch (err) {
      console.log(err.stdout.toString());
    }
  });
}

function fast_deploy() {
  result = remote_cmd('cd /data/teleChart && git reset HEAD --hard && git clean -f');
  console.log(result);
  result = remote_cmd('cd /data/teleChart && ./teleChart-pull');
  console.log(result);
  result = remote_cmd('cd /data/teleChart && kill -9 "$(< logs/teleChart.pid)"');
  console.log(result);
  result = remote_cmd('cd /data/teleChart && ./teleChart-run');
  console.log(result);
}

if (3 == process.argv.length) {
  if ('fast' == process.argv[2]) {
    fast_deploy();
  } else if ('test' == process.argv[2]) {
    test();
  }
}
// remote_run();
// deploy();
// test();
