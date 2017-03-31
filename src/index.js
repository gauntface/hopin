const express = require('express');
const path = require('path');

const Router = require('./controllers/Router');

class Hopin {
  constructor({relativePath}) {
    this._relativePath = relativePath;

    this._app = express();

    this._router = new Router({relativePath});
  }

  startServer(port) {
    this._app.use(express.static(path.join(this._relativePath, 'static')));

    this._app.use('/', this._router.routes);

    return new Promise((resolve, reject) => {
      const server = this._app.listen(port, () => {
        resolve(server.address());
      });
    });
  }
}

module.exports = Hopin;
