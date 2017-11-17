const { send } = require('micro');
const Errorhandler = (app) => fn => async (req, res) => {
  try {
    return await fn(req, res);
  } catch (err) {
    console.log('err-handler', err);
    let error = new Error();
    if (err.status) {
      switch (err.status) {
        case 401:
          error.message = 'Resource service key is not configured.';
          error.statusCode = 401;
          error.code = 'SERVICE_KEY_NOT_CONFIGURED';
          break;
        case 404:
          error.message = 'Resource not found';
          error.statusCode = 404;
          error.code = 'RESOURCE_NOT_FOUND';
          break;
        case 400:
          error.message = 'Remote bad request';
          error.statusCode = 400;
          error.code = 'REMOTE_BAD_REQUEST';
          break;
        default:
          error.message = 'Remote error';
          error.statusCode = 500;
          error.code = 'REMOTE_ERROR';
          break;
      }
    } else if (err.statusCode && err.code) {
      error = err;
    } else {
      error.message = 'Remote error';
      error.code = 'REMOTE_ERROR';
    }
    send(res, error.statusCode || 500, { error });
  }
};

module.exports = Errorhandler;
