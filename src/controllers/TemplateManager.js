const path = require('path');
const fs = require('fs-promise');
const mustache = require('mustache');
const yamlFront = require('yaml-front-matter');
const glob = require('glob');

const View = require('../models/View');
const ViewGroup = require('../models/ViewGroup');
const HopinError = require('../models/HopinError');

const DEFAULT_DOCUMENT = 'documents/html.tmpl';

class TemplateManager {
  constructor({relativePath}) {
    if (!relativePath) {
      throw new HopinError('no-relative-path');
    }

    this._relativePath = relativePath;
    this._templatePath = path.join(relativePath, 'templates');

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

  render(renderInput) {
    if (!renderInput) {
      throw new HopinError('render-data-required');
    }

    return this._getStaticAssets()
    .then((staticAssetPartials) => {
      const documentName = path.join(this._templatePath,
      (renderInput.document || DEFAULT_DOCUMENT));
    const shellName = renderInput.shell ?
      path.join(this._templatePath, renderInput.shell) : null;
    const viewObjects = renderInput.views || [];

    const parsedViews = viewObjects.map((viewObj) => {
      viewObj.relativePath = this._relativePath;
      viewObj.templateDir = this._templatePath;
      viewObj.templatePath = path.join(
        this._templatePath, viewObj.templatePath);
      viewObj.partials = staticAssetPartials;
      return new View(viewObj);
    });
    const shellViewGroup = new ViewGroup({
      relativePath: this._relativePath,
      templateDir: this._templatePath,
      templatePath: shellName,
      views: parsedViews,
      partials: staticAssetPartials,
    });

    const documentViewGroup = new ViewGroup({
      relativePath: this._relativePath,
      templateDir: this._templatePath,
      templatePath: documentName,
      views: [shellViewGroup],
      partials: staticAssetPartials,
      styles: renderInput.styles,
      scripts: renderInput.scripts,
      data: renderInput.data,
    });

    return documentViewGroup.render();
    });
  }

  renderTemplate(templatePath, data) {
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
        return this.renderTemplate(viewInfo.templatePath, viewInfo.data);
      })
    );
  }

  _getPartialDetails(templateDetails) {
    return Promise.all(
      templateDetails.partials.map((partialPath) => {
        return this.renderTemplate(partialPath)
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
    const globPattern = path.join(this._relativePath, '**', '*.*');
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
