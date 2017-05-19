const fs = require('fs-promise');
const path = require('path');
const yamlFront = require('yaml-front-matter');

// const HopinError = require('../models/HopinError');

class View {
  constructor(input) {
    this._templateDir = input.templateDir;
    this._templatePath = input.templatePath;
    this._staticPath = input.staticPath;
    this._additionalStyles = input.styles;
    this._additionalScripts = input.scripts;
    this._additionalPartials = input.partials;
    this._data = input.data;
  }

  getViewDetails() {
    return this._readTemplate(this._templatePath)
    .then((templateDetails) => {
      if (!templateDetails) {
        return null;
      }

      if (this._additionalStyles) {
        this._additionalStyles.forEach((stylesheet) => {
          const stylesheetPath = path.parse(stylesheet);
          if (stylesheetPath.name.endsWith('-inline')) {
            templateDetails.styles.inline.push(stylesheet);
          } else {
            templateDetails.styles.async.push(stylesheet);
          }
        });
      }

      if (this._additionalScripts) {
        this._additionalScripts.forEach((script) => {
          const scriptPath = path.parse(script);
          if (scriptPath.name.endsWith('-sync')) {
            templateDetails.scripts.sync.push(script);
          } else {
            templateDetails.scripts.async.push(script);
          }
        });
      }

      if (this._additionalPartials) {
        Object.keys(this._additionalPartials).forEach((key) => {
          templateDetails.partials[key] = this._additionalPartials[key];
        });
      }

      return this._readInlineCSSFiles(templateDetails.styles.inline)
      .then((inlineStyles) => {
        templateDetails.styles.inline = inlineStyles;
        return templateDetails;
      });
    });
  }

  _readTemplate(templatePath) {
    if (!templatePath) {
      return Promise.resolve({
          template: '{{{content}}}',
          partials: {},
          styles: {
            inline: [],
            async: [],
          },
          scripts: {
            sync: [],
            async: [],
          },
          data: null,
        }
      );
    }

    return fs.readFile(templatePath)
    .then((fileContentBuffer) => fileContentBuffer.toString())
    .then((fileContent) => {
      return yamlFront.loadFront(fileContent);
    })
    .then((templateDetails) => {
      if (!templateDetails) {
        templateDetails = {};
      }

      let inlineStyles = [];
      let asyncStyles = [];

      if (templateDetails.styles) {
        templateDetails.styles.forEach((stylesheet) => {
          const stylesheetPath = path.parse(stylesheet);
          if (stylesheetPath.name.endsWith('-inline')) {
            inlineStyles.push(stylesheet);
          } else {
            asyncStyles.push(stylesheet);
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

      return this._readPartialFiles(templateDetails.partials)
      .then((partialDetails) => {
        let partialObject = {};
        partialDetails.forEach((partialDetail) => {
          partialObject[partialDetail.path] =
            partialDetail.templateDetails.template;

          // Include nested partials.
          const partialKeys = Object.keys(
            partialDetail.templateDetails.partials);
          partialKeys.forEach((partialKey) => {
            const pTemplate = partialDetail.templateDetails;
            partialObject[partialKey] = pTemplate.partials[partialKey];
            inlineStyles = inlineStyles.concat(pTemplate.styles.inline);
            asyncStyles = asyncStyles.concat(pTemplate.styles.async);
          });
        });

        // This is the template with yaml front matter parsed out
        // Template content will be in '__content'
        return {
          template: templateDetails.__content || '{{{content}}}',
          partials: partialObject,
          styles: {
            inline: inlineStyles,
            async: asyncStyles,
          },
          scripts: {
            sync: syncScripts,
            async: asyncScripts,
          },
          data: this._data,
        };
      });
    });
  }

  _readInlineCSSFiles(inlineStyles) {
    const cssFileReads = inlineStyles.map((inlineStyle) => {
      return fs.readFile(path.join(this._staticPath, inlineStyle))
      .then((fileBuffer) => {
        return fileBuffer.toString();
      });
    });

    return Promise.all(cssFileReads);
  }

  _readPartialFiles(partials) {
    const partialPaths = partials || [];
    const partialFileReads = partialPaths.map((partialPath) => {
      return this._readTemplate(path.join(this._templateDir, partialPath))
      .then((templateDetails) => {
        return {
          path: partialPath,
          templateDetails: templateDetails,
        };
      });
      /** return fs.readFile(path.join(this._templateDir, partialPath))
      .then((fileBuffer) => {
        return yamlFront.loadFront(fileBuffer.toString());
      })
      .then((templateDetails) => {
        return {
          path: partialPath,
          content: templateDetails.__content,
          styles: [],
          scripts: [],
        };
      });**/
    });

    return Promise.all(partialFileReads);
  }
}

module.exports = View;
