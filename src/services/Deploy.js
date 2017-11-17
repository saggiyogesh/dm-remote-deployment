const { RestService, Remote } = require('micro-fame');
const fs = require('fs');
const path = require('path');
const { BASE_DEPLOYMENT_DIR } = process.env;
const indexHTML = fs.readFileSync(path.resolve(__dirname, '../html/index.html'));
const exec = require('../lib/exec');
console.log('BASE_DEPLOYMENT_DIR', BASE_DEPLOYMENT_DIR);
const _logs = {};

@RestService()
class Deploy {
  @Remote({ path: '/' })
  async index() {
    // serve html
    return indexHTML;
  }

  @Remote({ path: '/getDeployments' })
  async getDeployments() {
    return ['doit-flipbook', 'doit-assessment'];
  }

  @Remote({ path: '/deploy/:project' })
  async buildDeploy(project) {
    console.log('deploy started', project);
    const id = Date.now();
    const log = { state: 0, logArr: [] };
    _logs[id] = log;
    const deploymentDir = path.join(BASE_DEPLOYMENT_DIR, project);
    console.log('deploymentDir', deploymentDir);
    exec(deploymentDir, log);
    return { id, project };
  }

  @Remote({ path: '/getLogs/:project/:id' })
  async getLogs(project, id) {
    const log = _logs[id];
    if (log.state === 1) {
      setTimeout(() => {
        delete _logs[id];
      }, 1000);
    }
    return log;
  }
};

module.exports = Deploy;
