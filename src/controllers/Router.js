const path = require('path');
const fs = require('fs-extra');
const express = require('express');
const pathToRegex = require('path-to-regexp');
const minifyHTML = require('html-minifier').minify;

const ViewFactory = require('../factory/view-factory');
const HopinError = require('../models/HopinError');
const parseUrl = require('../utils/parse-url');
const toTitleCase = require('../utils/title-case');

const DEFAULT_TYPES = {
  html: 'text/html',
  js: 'application/javascript',
  json: 'application/json',
  xml: 'application/xml',
};

class Router {
  constructor({relativePath, publicPath}) {
    this._relativePath = relativePath;
    this._publicPath = publicPath;
    this._customRoutes = this._getCustomRoutes(this._relativePath);
    this._customTypes = this._getCustomTypes(this._relativePath);

    /* eslint-disable new-cap */
    this._expressRouter = express.Router();
    /* eslint-enable new-cap */

    this._configureExpressRoutes();
  }

  _getCustomRoutes(relativePath) {
    const customRoutes = this._getCustomConfig(relativePath, 'routes.js');
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

  _getCustomTypes(relativePath) {
    return this._getCustomConfig(relativePath, 'types.js');
  }

  _getCustomConfig(relativePath, fileName) {
    let configContents = null;
    try {
      configContents = require(
        path.join(relativePath, 'config', fileName));
    } catch (err) {
      configContents = {};
    }

    if (typeof configContents !== 'object' || configContents instanceof Array) {
      throw new HopinError('bad-config-routes');
    }

    return configContents;
  }

  route(requestUrl, request, response) {
    const filteredUrl = this._handleCustomRoutes(requestUrl);
    const parsedUrl = parseUrl(filteredUrl);

    const controller = parsedUrl.controller || 'Home';
    const action = parsedUrl.action || 'index';
    const type = parsedUrl.type || 'html';
    const urlSegments = parsedUrl.args || {};

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

          return matchingController['index']({
            request,
            response,
            type,
            urlSegments,
          });
        });
      }
      return matchingController[action]({
        request,
        response,
        type,
        urlSegments,
      });
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
    this._addDefaultRoutes();
  }

  _addDefaultRoutes() {
    this._expressRouter.all('*', (req, res, next) => {
      return this.route(req.url, req, res)
      .then((args) => {
        const controllerResponse = args.controllerResponse;

        let contentPromise;
        if (typeof controllerResponse === 'string') {
          contentPromise = Promise.resolve(controllerResponse);
        } else if (controllerResponse.content) {
          contentPromise = Promise.resolve(controllerResponse.content);
        } else {
          contentPromise = ViewFactory.renderViewGroup(
            this._relativePath,
            this._publicPath,
            controllerResponse.templatePath,
            controllerResponse.views,
            controllerResponse);
        }

        return contentPromise.then((content) => {
          return {
            content,
            type: args.controllerResponse.type || args.responseInfo.type,
          };
        });
      })
      .then((renderedContent) => {
        if (this._customTypes[renderedContent.type]) {
          res.set('Content-Type', this._customTypes[renderedContent.type]);
        } else if (DEFAULT_TYPES[renderedContent.type]) {
          res.set('Content-Type', DEFAULT_TYPES[renderedContent.type]);
        }
        if (renderedContent.type === 'html') {
          try {
            renderedContent.content = minifyHTML(renderedContent.content, {
              collapseWhitespace: true,
              removeComments: true,
            });
          } catch (err) {
            // NOOP
          }
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
