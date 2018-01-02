const Docker = require('dockerode');
const fs = require('mz/fs');
const { exec } = require('child_process');
const { URL } = require('url');
const Promise = require('bluebird');

function extractText(str) {
  var ret = '';

  if (/"/.test(str)) {
    ret = str.match(/"(.*?)"/)[1];
  } else {
    ret = str;
  }

  return ret;
}

function getMachine(name) {
  return new Promise((resolve, reject) => {
    exec(`docker-machine env ${name}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        reject(error);
      } else if (stderr) {
        reject(stderr);
      } else {
        const arr = stdout.split('export');
        const url = extractText(arr[2].split('=')[1].trim());
        const homePath = extractText(arr[3].split('=')[1].trim());
        const { hostname, port } = new URL(url);
        resolve({ hostname, port, homePath });
      }
    });
  });
}

exports.getContainers = async function ({ name }) {
  const { hostname, port, homePath } = await getMachine(name);
  console.log(' hostName, port, homePath --', hostname, port, homePath);

  const files = await Promise.all([
    await fs.readFile(`${homePath}/ca.pem`),
    await fs.readFile(`${homePath}/cert.pem`),
    await fs.readFile(`${homePath}/key.pem`)
  ]);

  var docker = new Docker({
    host: hostname,
    port,
    ca: files[0],
    cert: files[1],
    key: files[2]
  });
  return docker.listContainers({ all: true });
};
