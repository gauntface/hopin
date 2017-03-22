const path = require('path');
const fs = require('mz/fs');
const express = require('express');
const pathToRegex = require('path-to-regexp');

const TemplateManager = require('./TemplateManager');
const HopinError = require('../models/HopinError');
const parseUrl = require('../utils/parse-url');
const toTitleCase = require('../utils/title-case');

class Router {
  constructor({relativePath}) {
    this._relativePath = relativePath;
    this._templateManager = new TemplateManager({relativePath});
    this._customRoutes = this._getCustomRoutes(this._relativePath);

    /* eslint-disable new-cap */
    this._expressRouter = express.Router();
    /* eslint-enable new-cap */

    this._configureExpressRoutes();
  }

  _getCustomRoutes(relativePath) {
    let customRoutes = null;
    try {
      customRoutes = require(
        path.join(relativePath, 'config', 'routes.js'));
    } catch (err) {
      customRoutes = {};
    }

    if (typeof customRoutes !== 'object' || customRoutes instanceof Array) {
      throw new HopinError('bad-config-routes');
    }

    Object.keys(customRoutes).forEach((routeKey) => {
      const controllerInfo = customRoutes[routeKey];
      if (typeof controllerInfo !== 'string') {
        throw new HopinError('bad-config-route-redirect', {
          badKey: routeKey,
          badValue: controllerInfo,
        });
      }
    });

    return customRoutes;
  }

  route(requestUrl, request) {
    const filteredUrl = this._handleCustomRoutes(requestUrl);

    const parsedUrl = parseUrl(filteredUrl);

    const controller = parsedUrl.controller || 'Home';
    const action = parsedUrl.action || 'index';
    const type = parsedUrl.type || 'html';


    return this._findController(controller)
    .then((matchingController) => {
      if (!matchingController) {
        return this._findController('Error')
        .then((matchingController) => {
          if (!matchingController) {
            return Promise.reject(new HopinError('no-controller-found', {
              url: requestUrl,
            }));
          }

          return matchingController['index']({request, type});
        });
      }

      return matchingController[action]({request, type});
    })
    .then((controllerResponse) => {
      return {
        controllerResponse,
        responseInfo: {
          controller,
          action,
          type,
        },
      };
    });
  }

  _findController(controllerName) {
    const expectedController = `${toTitleCase(controllerName)}Controller.js`;
    const controllerPath = path.join(
      this._relativePath, 'controllers', expectedController);
    return fs.exists(controllerPath)
    .then((exists) => {
      if (!exists) {
        return null;
      }
      return require(controllerPath);
    });
  }

  _handleCustomRoutes(originalUrl) {
    let currentUrl = originalUrl;

    Object.keys(this._customRoutes).forEach((customRouteKey) => {
      const customRouteValue = this._customRoutes[customRouteKey];
      const regexKeys = [];
      const regex = pathToRegex(customRouteKey, regexKeys);
      const result = regex.exec(currentUrl);
      if (!result) {
        return;
      }

      const parsedResult = {};
      regexKeys.forEach((keyInfo, index) => {
        parsedResult[keyInfo.name] = result[1 + index];
      });

      const toPath = pathToRegex.compile(customRouteValue);
      currentUrl = toPath(parsedResult);
    });

    return currentUrl;
  }

  _configureExpressRoutes() {
    // this._addHopinDataRoute();
    // this._addCustomRoutes();
    this._addDefaultRoutes();

    // this._expressRouter.all('*', (req, res, next) => {
    //   console.log(req._hopin);
    //   next();
    // });

    // TODO: Find way to manually throw things at our custom Router / express
    // combo.....i.e. expressRouter.route('/home/index.html');
  }

  /** _addHopinDataRoute() {
    this._expressRouter.use((req, res, next) => {
      req._hopin = {
        originalUrl: req.url,
        matches: [],
      };
      next();
    });
  }

  _addCustomRoutes() {
    const customRoutes = this._getCustomRoutes(this._relativePath);

    Object.keys(customRoutes).forEach((customRouteKey) => {
      const customRouteValue = customRoutes[customRouteKey];
      this._expressRouter.all(customRouteKey, (req, res, next) => {
        req._hopin.matches.push({
          originalMatch: customRouteKey,
          redirectedRoute: customRouteValue,
        });

        // TODO: Make express convert regex to full URL -> params....?
        // req.url = express.exec(customRouteValue, req.params);

        next();
      });
    });
  }**/

  _addDefaultRoutes() {
    this._expressRouter.all('/', (req, res, next) => {
      return this.route(req.url, req)
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
    });
  }

  get routes() {
    return this._expressRouter;
  }
}

module.exports = Router;
