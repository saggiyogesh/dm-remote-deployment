var pty = require('node-pty');
const terminals = {}, logs = {};

exports.newTerm = function ({ cols = 150, rows = 24, cmd = '', baseDir, env = {} }) {
  const term = pty.spawn(process.platform === 'win32' ? 'cmd.exe' : 'bash', [], {
    name: 'xterm-color',
    cols: parseInt(cols),
    rows: parseInt(rows),
    cwd: baseDir,
    env: Object.assign({}, process.env, env)
  });

  if (cmd) {
    term.write(cmd);
  }
  console.log('Created terminal with PID: ' + term.pid);
  terminals[term.pid] = term;
  logs[term.pid] = '';
  term.on('data', function (data) {
    console.log('-----------', data);
    logs[term.pid] += data;
  });

  return term;
};

exports.getTerm = termId => terminals[termId];

exports.getLogs = termId => logs[termId];

exports.del = termId => {
  delete terminals[termId];
  delete logs[termId];
};

exports.destroyTerm = function (termId) {
  const term = exports.getTerm(termId);
  term && term.destroy();
};
