const { spawn } = require('child_process');

module.exports = function (baseDir, log) {
  console.log('---log', log);
  const { logArr } = log;
  try {
    const { env } = require(baseDir + '/conf');
    console.log('env', env);
    const cmd = spawn('sh', [baseDir + '/deploy.sh'], {
      cwd: baseDir
    });

    cmd.stdout.on('data', (data) => {
      // console.log(`stdout: ${data}`);
      logArr.push(data + '');
    });

    cmd.stderr.on('data', (data) => {
      // console.log(`stderr: ${data}`);
      logArr.push(data + '');
    });

    cmd.on('close', (code) => {
      // console.log(`child process exited with code ${code}`);
      log.state = 1;
    });
  } catch (err) {
    console.log('exec err', err);
    logArr.push(err);
  }
};
