const express = require('express');
const path = require('path');

const Router = require('./controllers/Router');

class Hopin {
  constructor({relativePath}) {
    this._relativePath = relativePath;

    this._app = express();
    this._server = null;

    this._router = new Router({relativePath});
  }

  startServer(port) {
    this._app.use(express.static(path.join(this._relativePath, 'public')));

    this._app.use('/', this._router.routes);

    return new Promise((resolve, reject) => {
      this._server = this._app.listen(port, () => {
        resolve(this._server.address());
      });
    });
  }

  stopServer() {
    return new Promise((resolve) => this._server.close(resolve));
  }
}

module.exports = Hopin;
