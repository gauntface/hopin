const fs = require('fs-promise');
const path = require('path');
const yamlFront = require('yaml-front-matter');

// const HopinError = require('../models/HopinError');

class View {
  constructor(input) {
    this._templatePath = input.templatePath;
    this._staticPath = input.staticPath;
  }

  getViewDetails() {
    return this._readTemplate()
    .then((templateDetails) => {
      if (!templateDetails) {
        return null;
      }

      const inlineStyles = [];
      const remoteStyles = [];

      if (templateDetails.styles) {
        templateDetails.styles.forEach((stylesheet) => {
          const stylesheetPath = path.parse(stylesheet);
          if (stylesheetPath.name.endsWith('-inline')) {
            inlineStyles.push(stylesheet);
          } else {
            remoteStyles.push(stylesheet);
          }
        });
      }

      const asyncScripts = [];
      const syncScripts = [];

      if (templateDetails.scripts) {
        templateDetails.scripts.forEach((script) => {
          const scriptPath = path.parse(script);
          if (scriptPath.name.endsWith('-sync')) {
            syncScripts.push(script);
          } else {
            asyncScripts.push(script);
          }
        });
      }

      return Promise.all(inlineStyles.map((inlineStyle) => {
        return fs.readFile(path.join(this._staticPath, inlineStyle))
        .then((fileBuffer) => {
          return fileBuffer.toString();
        });
      }))
      .then((inlineStyles) => {
        // This is the template with yaml front matter parsed out
        // Template content will be in '__content'
        return {
          template: templateDetails.__content,
          styles: {
            inline: inlineStyles,
            remote: remoteStyles,
          },
          scripts: {
            sync: syncScripts,
            async: asyncScripts,
          },
        };
      });
    });
  }

  _readTemplate() {
    if (!this._templatePath) {
      return Promise.resolve(null);
    }

    return fs.readFile(this._templatePath)
    .then((fileContentBuffer) => fileContentBuffer.toString())
    .then((fileContent) => {
      return yamlFront.loadFront(fileContent);
    });
  }
}

module.exports = View;
