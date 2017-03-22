const path = require('path');
const fs = require('fs-promise');
const mustache = require('mustache');
const yamlFront = require('yaml-front-matter');
const glob = require('glob');

const HopinError = require('../models/HopinError');

class TemplateManager {
  constructor({relativePath}) {
    if (!relativePath) {
      throw new HopinError('no-relative-path');
    }

    this._relativePath = relativePath;
    this._templatePath = path.join(relativePath, 'templates');
    this._staticPath = path.join(relativePath, 'static');

    this._templates = {};
  }

  readTemplate(templatePath) {
    return fs.readFile(path.join(this._templatePath, templatePath))
    .then((fileContentBuffer) => fileContentBuffer.toString())
    .then((fileContent) => {
      const yamlDetails = yamlFront.loadFront(fileContent);
      return {
        path: templatePath,
        content: yamlDetails.__content,
        styles: yamlDetails.styles ? yamlDetails.styles : [],
        scripts: yamlDetails.scripts ? yamlDetails.scripts : [],
        partials: yamlDetails.partials ? yamlDetails.partials : [],
      };
    });
  }

  renderHTML(data) {
    if (!data || !data.shell) {
      throw new HopinError('shell-required');
    }
    return this.render(
      data.shell,
      data
    )
    .then((shellDetails) => {
      const documentTemplatePath = 'documents/html.tmpl';
      return this.readTemplate(documentTemplatePath)
      .then((templateDetails) => {
        if (!templateDetails) {
          throw new HopinError('template-not-found', {documentTemplatePath});
        }

        const seperatedStyles = {
          inline: [],
          async: [],
        };
        shellDetails.styles.forEach((stylesheet) => {
          const stylesheetPath = path.parse(stylesheet);
          if (stylesheetPath.name.endsWith('-inline')) {
            seperatedStyles.inline.push(stylesheet);
          } else {
            seperatedStyles.async.push(stylesheet);
          }
        });
        templateDetails.styles.forEach((stylesheet) => {
          const stylesheetPath = path.parse(stylesheet);
          if (stylesheetPath.name.endsWith('-inline')) {
            seperatedStyles.inline.push(stylesheet);
          } else {
            seperatedStyles.async.push(stylesheet);
          }
        });

        return Promise.all(seperatedStyles.inline.map((inlineStyle) => {
          return fs.readFile(path.join(this._staticPath, inlineStyle))
          .then((fileBuffer) => {
            return fileBuffer.toString();
          });
        }))
        .then((inlineStyles) => {
          return {
            templateDetails,
            asyncStyles: seperatedStyles.async,
            inlineStyles: inlineStyles,
          };
        });
      })
      .then(({templateDetails, asyncStyles, inlineStyles}) => {
        const allScripts = templateDetails.scripts.concat(shellDetails.scripts);
        return mustache.render(
          templateDetails.content, {
            data,
            content: shellDetails.content,
            styles: {
              inline: inlineStyles,
              async: asyncStyles,
            },
            scripts: allScripts,
          });
      });
    });
  }

  render(templatePath, data) {
    return this._renderSubViews(data)
    .then((subviews) => {
      return this.readTemplate(templatePath)
      .then((templateDetails) => {
        return {subviews, templateDetails};
      });
    })
    .then(({subviews, templateDetails}) => {
      if (!templateDetails) {
        throw new HopinError('template-not-found', {templatePath});
      }

      return this._getPartialDetails(templateDetails)
      .then((partialDetails) => {
        return {subviews, templateDetails, partialDetails};
      });
    })
    .then(({subviews, templateDetails, partialDetails}) => {
      return this._getStaticAssets()
      .then((staticAssets) => {
        return {
          subviews,
          templateDetails,
          partialDetails,
          staticAssets,
        };
      });
    })
    .then(({subviews, templateDetails, partialDetails, staticAssets}) => {
      let collectedStyles = templateDetails.styles
        .concat(partialDetails.styles);
      let collectedScripts = templateDetails.scripts
        .concat(partialDetails.scripts);

      const renderData = {
        data,
      };

      // This is called by Mustache whenever {{{content}}} is found in a
      // template.
      renderData.content = () => {
        let initialObject = {
          content: '',
          styles: [],
          scripts: [],
        };
        const mergedDetails = subviews.reduce((details, subview) => {
          details.content += subview.content;
          details.styles = details.styles.concat(subview.styles);
          details.scripts = details.scripts.concat(subview.scripts);
          return details;
        }, initialObject);

        collectedStyles = collectedStyles.concat(mergedDetails.styles);
        collectedScripts = collectedScripts.concat(mergedDetails.scripts);

        return mergedDetails.content;
      };

      for (let i = 0; i < subviews.length; i++) {
        renderData[`content-${i}`] = () => {
          collectedStyles = collectedStyles.concat(subviews[i].styles);
          collectedScripts = collectedScripts.concat(subviews[i].scripts);

          return subviews[i].content;
        };
      }

      let allPartials = {};
      allPartials = Object.assign(allPartials, partialDetails.partialContents);
      allPartials = Object.assign(allPartials, staticAssets);

      const renderedContent = mustache.render(
        templateDetails.content, renderData, allPartials);

      // Sets here are used to remove duplicates.
      return {
        content: renderedContent,
        styles: [...new Set(collectedStyles)],
        scripts: [...new Set(collectedScripts)],
      };
    });
  }

  _renderSubViews(data) {
    if (!data || !data.views || data.views.length === 0) {
      return Promise.resolve([]);
    }

    return Promise.all(
      data.views.map((viewInfo) => {
        return this.render(viewInfo.templatePath, viewInfo.data);
      })
    );
  }

  _getPartialDetails(templateDetails) {
    return Promise.all(
      templateDetails.partials.map((partialPath) => {
        return this.render(partialPath)
        .then((partialDetails) => {
          partialDetails.path = partialPath;
          return partialDetails;
        });
      })
    )
    .then((allPartialDetails) => {
      const partialsInfo = {
        styles: [],
        scripts: [],
        partialContents: {},
      };

      allPartialDetails.forEach((partialDetails) => {
        partialsInfo.styles = partialsInfo.styles
          .concat(partialDetails.styles);
        partialsInfo.scripts = partialsInfo.scripts
          .concat(partialDetails.scripts);

        partialsInfo.partialContents[partialDetails.path] =
          partialDetails.content;
      });

      return partialsInfo;
    });
  }

  _getStaticAssets() {
    const globPattern = path.join(this._staticPath, '**', '*.*');
    return new Promise((resolve, reject) => {
      glob(globPattern, (err, files) => {
        if (err) {
          return reject(err);
        }
        resolve(files);
      });
    })
    .then((files) => {
      const readPromises = files.map((file) => {
        return fs.stat(file)
        .then((stats) => {
          if (!stats.isFile()) {
            return null;
          }

          return fs.readFile(file)
          .then((fileBuffer) => {
            return {
              name: path.relative(this._relativePath, file),
              contents: fileBuffer.toString(),
            };
          });
        });
      });

      return Promise.all(readPromises);
    })
    .then((fileNameContents) => {
      return fileNameContents.filter((value) => value !== null);
    })
    .then((fileNameContents) => {
      const formattedFiles = {};
      fileNameContents.forEach((fileInfo) => {
        formattedFiles[fileInfo.name] = fileInfo.contents;
      });
      return formattedFiles;
    });
  }
}

module.exports = TemplateManager;
