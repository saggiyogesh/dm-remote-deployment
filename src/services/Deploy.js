const { RestService, Remote } = require('micro-fame');
const fs = require('mz/fs');
const path = require('path');
const map = require('lodash.map');
const find = require('lodash.find');
const yaml = require('js-yaml');
const { BASE_DEPLOYMENT_DIR } = process.env;
const { readFileSync } = require('fs');
const indexHTML = readFileSync(path.resolve(__dirname, '../html/index.html'));

const { newTerm, destroyTerm } = require('../lib/terminal');
const { getContainers } = require('../lib/docker');
console.log('BASE_DEPLOYMENT_DIR', BASE_DEPLOYMENT_DIR);

const config = yaml.safeLoad(readFileSync(`${BASE_DEPLOYMENT_DIR}/config.yml`, 'utf8'));
console.log('config', config);

const SCRIPTS_DIR = path.resolve(__dirname, '../scripts');

function getDeploymentDirPath(deployment) {
  const dObj = find(config.deployments, { name: deployment });
  const deploymentDir = dObj.dir || deployment;
  return `${BASE_DEPLOYMENT_DIR}/${deploymentDir}`;
}

@RestService()
class Deploy {
  @Remote({ path: '/' })
  async index() {
    // serve html
    return indexHTML;
  }

  @Remote({ path: '/getDeployments' })
  async getDeployments() {
    return map(config.deployments, 'name');
  }

  @Remote({
    path: '/getTerminal/:cols/:rows',
    args: {
      deployment: ({ query: { deployment } }) => deployment,
      cmd: ({ query: { cmd } }) => cmd,
      containerId: ({ query: { containerId } }) => containerId,
      isAdmin: ({ isAdmin }) => isAdmin
    }
  })
  async getTerminal(cols, rows, deployment, cmd, containerId, isAdmin) {
    console.log('in terminal', cols, rows, deployment, cmd);
    let env = {};
    let baseDir = deployment && getDeploymentDirPath(deployment);
    switch (cmd) {
      case 'deploy':
        cmd = 'sh deploy.sh && exit\r';
        break;
      case 'showContainerLogs':
        cmd = `sh ${SCRIPTS_DIR}/logs.sh && exit\r`;
        env = {
          DM: deployment,
          CID: containerId
        };
        break;

      case 'containerTerminal':
        cmd = `sh ${SCRIPTS_DIR}/exec.sh && exit\r`;
        env = {
          DM: deployment,
          CID: containerId
        };
        break;

      case 'containerStats':
        cmd = `sh ${SCRIPTS_DIR}/stats.sh && exit\r`;
        env = {
          DM: deployment,
          CID: containerId
        };
        break;

      case 'adminTerm':
        if (!isAdmin) {
          throw new Error('Admin is permitted for adminTerm');
        }
        baseDir = BASE_DEPLOYMENT_DIR;
        break;

      default:
        break;
    }

    const term = newTerm({ cols, rows, baseDir, cmd, env });
    return term.pid.toString();
  }

  @Remote({ path: '/destroyTerm/:termId' })
  async destroyTerm(termId) {
    console.log('destroyTerm', termId);
    destroyTerm(termId);
    return { status: true };
  }

  @Remote({
    path: '/getTerminal/:deployment'
  })
  async getContainers(deployment) {
    console.log('getcontainer', deployment);
    return await getContainers({ name: deployment });
  }

  @Remote({
    path: '/getComposeFile/:deployment'
  })
  async getComposeFile(deployment) {
    console.log('getComposeFile', deployment);
    return await fs.readFile(`${getDeploymentDirPath(deployment)}/docker-compose.yml`, 'utf-8');
  }

  @Remote({
    path: '/saveComposeFile/:deployment',
    method: 'post',
    args: {
      content: ({ body: { content } }) => content
    }
  })
  async saveComposeFile(deployment, content) {
    console.log('saveComposeFile', deployment);
    await fs.writeFile(`${getDeploymentDirPath(deployment)}/docker-compose.yml`, content, 'utf8');
    return { deployment };
  }

  @Remote({
    path: '/isAdmin',
    args: {
      isAdmin: ({ isAdmin }) => isAdmin
    }
  })
  async isAdmin(isAdmin) {
    return { isAdmin };
  }
};

module.exports = Deploy;
