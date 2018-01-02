const WebSocket = require('ws');
const { URL } = require('url');

const { Boot } = require('micro-fame');
const { KEY = '', ADMIN_KEY = '' } = process.env;
const KEYS = [ADMIN_KEY, KEY];

const { getTerm, getLogs, del, destroyTerm } = require('./lib/terminal');

(async function () {
  try {
    const { server } = await Boot({ rootDir: __dirname });
    const wss = new WebSocket.Server({ server });

    wss.on('error', function () {
      console.log('errrr---', arguments);
    });

    wss.on('connection', (ws, req) => {
      console.log('a user connected', req.url);
      const url = new URL(`ws://localhost:7777${req.url}`);

      console.log('urlll', url);
      const termId = parseInt(url.pathname.split('/')[1]);
      const term = getTerm(termId);

      if (!KEYS.includes(url.searchParams.get('token'))) {
        console.log('Closing ws connection: KEY_NOT_CONFIGURED');
        ws.close(1000, 'KEY_NOT_CONFIGURED');
        destroyTerm(termId);
        return;
      }

      console.log('Connected to terminal ' + term.pid);
      ws.send(getLogs(term.pid));

      ws.on('disconnect', () => {
        console.log('user disconnected');
      });

      term.on('data', function (data) {
        try {
          ws.send(data);
        } catch (ex) {
          // The WebSocket is not open, ignore
          console.log('term send data err', ex);
        }
      });

      term.on('exit', function () {
        console.log('term exit', term.pid);
        ws.close(1000, 'TERM_CLOSED');
      });

      ws.on('message', function (msg) {
        term.write(msg);
      });

      ws.on('close', function () {
        console.log('ws closings');
        term.kill();
        console.log('Closed terminal ' + term.pid);
        // Clean things up
        del(termId);
      });

      ws.on('error', function () {
        console.log('websocket err', arguments);
      });
    });
  } catch (err) {
    console.log('Error on boot', err);
  }
})();
