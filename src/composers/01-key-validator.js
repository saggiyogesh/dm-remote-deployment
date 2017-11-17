const { KEY = '' } = process.env;

// validate configured key, length must be greater than 8 chars
if (KEY.length < 8) {
  throw new Error('Service Key Invalid length');
}

const auth = (app) => fn => async (req, res) => {
  console.log('in key.js', req.url);
  if (req.url === '/deploy/') {
    res.setHeader('Content-Type', 'text/html');
    return await fn(req, res);
  }
  
  const token = req.headers.authorization;
  let e;
  if (!token || token !== KEY) {
    e = new Error('KEY_NOT_CONFIGURED');
    e.status = 401;
    throw e;
  }
  return await fn(req, res);
};

module.exports = auth;
