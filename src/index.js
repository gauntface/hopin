const express = require('express');
const path = require('path');

const Router = require('./controllers/Router');
const logHelper = require('./utils/log-helper');

class Hopin {
  constructor({relativePath}) {
    this._relativePath = relativePath;

    this._app = express();

    this._router = new Router({relativePath});
  }

  startServer(port) {
    this._app.use(express.static(path.join(this._relativePath, 'static')));

    // TODO: Make the router expose routes
    this._app.use('/', this._router.routes);

    /** this._app.get('*', (request, res) => {
      return this._router.route(request.url, request)
      .then((args) => {
        let contentPromise;
        if (typeof args.controllerResponse === 'string') {
          contentPromise = Promise.resolve(args.controllerResponse);
        } else {
          contentPromise = this._templateManager.renderHTML(
            args.controllerResponse
          );
        }

        return contentPromise.then((content) => {
          return {
            content,
            type: args.responseInfo.type,
          };
        });
      })
      .then((renderedContent) => {
        switch(renderedContent.type) {
          case 'js':
            res.set('Content-Type', 'application/javascript');
            break;
          default:
            // NOOP
            break;
        }
        res.send(renderedContent.content);
      })
      .catch((err) => {
        res.status(404).send(err.message);
      });
    });**/

    this._app.listen(port, () => {
      logHelper.log(`Example app listening on port ${port}!`);
    });
  }
}

module.exports = Hopin;
