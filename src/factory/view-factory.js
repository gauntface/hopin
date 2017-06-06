const path = require('path');
const fsExtra = require('fs-extra');
const yamlFront = require('yaml-front-matter');
const mustache = require('mustache');

const HopinError = require('../models/HopinError');

class TempView {
  constructor(fullPath) {
    this._fullPath = fullPath;
    this._content = null;
    this._partialPaths = [];
    this._partialContents = {};
    this._dataSets = {
      'styles-inline': {
        dataStructure: ['styles', 'inline'],
        set: new Set(),
        transform: (tempView, newValue) => {
          if (!path.isAbsolute(newValue)) {
            return path.join(path.dirname(tempView.fullPath), newValue);
          }
          return newValue;
        },
      },
      'styles-sync': {
        dataStructure: ['styles', 'sync'],
        set: new Set(),
      },
      'styles-async': {
        dataStructure: ['styles', 'async'],
        set: new Set(),
      },
      'scripts-inline': {
        dataStructure: ['scripts', 'inline'],
        set: new Set(),
        transform: (tempView, newValue) => {
          if (!path.isAbsolute(newValue)) {
            return path.join(path.dirname(tempView.fullPath), newValue);
          }
          return newValue;
        },
      },
      'scripts-sync': {
        dataStructure: ['scripts', 'sync'],
        set: new Set(),
      },
      'scripts-async': {
        dataStructure: ['scripts', 'async'],
        set: new Set(),
      },
    };
  }

  setContent(content) {
    if (!content) {
      return;
    }

    this._content = content;
  }

  addPartialPaths(paths) {
    if (!paths) {
      return;
    }

    this._partialPaths = this._partialPaths.concat(paths);
  }

  readDataIntoSets(newData) {
    Object.keys(this._dataSets).forEach((dataSetKey) => {
      const dataSet = this._dataSets[dataSetKey];
      const dataStructure = dataSet.dataStructure;
      const relevantData = dataStructure.reduce((currentObject, nextKey) => {
        if (currentObject && currentObject[nextKey]) {
          return currentObject[nextKey];
        }
        return null;
      }, newData);

      if (!relevantData) {
        return;
      }

      relevantData.forEach((newValue) => {
        if (dataSet.transform) {
          dataSet.set.add(dataSet.transform(this, newValue));
        } else {
          dataSet.set.add(newValue);
        }
      });
    });
  }

  addPartial(partialPath, partialTempView) {
    if (this._partialContents[partialPath]) {
      throw new HopinError('duplicate-partial-name', {partialPath});
    }
    this._partialContents[partialPath] = partialTempView.content;

    Object.keys(partialTempView.partialContents).forEach((innerPartialPath) => {
      if (this._partialContents[innerPartialPath]) {
        throw new HopinError('duplicate-partial-name', {
          partialPath: innerPartialPath,
        });
      }
      const innerPartialContent =
        partialTempView.partialContents[innerPartialPath];
      this._partialContents[innerPartialPath] = innerPartialContent;
    });

    this.mergeData(partialTempView);
  }

  mergeData(tempView) {
    Object.keys(this._dataSets).forEach((dataSetKey) => {
      const dataSet = this._dataSets[dataSetKey];
      const relevantData = tempView.dataSets[dataSetKey].set;
      for (let newValue of relevantData) {
        if (dataSet.transform) {
          dataSet.set.add(dataSet.transform(tempView, newValue));
        } else {
          dataSet.set.add(newValue);
        }
      }
    });
  }

  collapse() {
    const collapsedObject = {};
    collapsedObject.content = this.content;
    collapsedObject.partialContents = this._partialContents;

    Object.keys(this.dataSets).forEach((dataSetKey) => {
      const dataSet = this.dataSets[dataSetKey];
      const structure = dataSet.dataStructure;
      const set = dataSet.set;
      structure.reduce((objectToAlter, structureSegment, index) => {
        if (index === (structure.length - 1)) {
          if (!objectToAlter[structureSegment]) {
            objectToAlter[structureSegment] = [];
          }
          objectToAlter[structureSegment] = objectToAlter[structureSegment]
            .concat(...set);
        } else if (!objectToAlter[structureSegment]) {
          objectToAlter[structureSegment] = {};
        }

        return objectToAlter[structureSegment];
      }, collapsedObject);
    });

    return collapsedObject;
  }

  get content() {
    return this._content;
  }

  get fullPath() {
    return this._fullPath;
  }

  get partialPaths() {
    return this._partialPaths;
  }

  get partialContents() {
    return this._partialContents;
  }

  get dataSets() {
    return this._dataSets;
  }
}

class ViewFactory {
  static _handlePartials(parentTempView) {
    return parentTempView.partialPaths.reduce((promiseChain, partialPath) => {
      const origViewPath = path.dirname(parentTempView.fullPath);
      const relativePath = path.join(origViewPath, partialPath);

      return promiseChain.then(() => {
        return ViewFactory._createTempView(relativePath);
      })
      .then((partialTempView) => {
        parentTempView.addPartial(partialPath, partialTempView);
      });
    }, Promise.resolve())
    .then(() => {
      return parentTempView;
    });
  }

  static _createTempView(viewPath) {
    return fsExtra.readFile(viewPath)
    .then((fileContentsBuffer) => {
      return fileContentsBuffer.toString();
    })
    .then((fileContents) => {
      return yamlFront.loadFront(fileContents);
    })
    .then((parsedYamlData) => {
      const tempView = new TempView(viewPath);
      tempView.setContent(parsedYamlData.__content.trim());
      tempView.addPartialPaths(parsedYamlData.partials);
      tempView.readDataIntoSets(parsedYamlData);

      return ViewFactory._handlePartials(tempView);
    });
  }

  static _generateCollapsedView(viewPath) {
    return ViewFactory._createTempView(viewPath)
    .then((finalTempView) => {
      return finalTempView.collapse();
    });
  }

  static _renderCollapsedView(collapsedView, data) {
    return new Promise((resolve, reject) => {
      try {
        const contentString = mustache.render(
        collapsedView.content,
        data,
        collapsedView.partialContents
      );
      resolve(contentString);
      } catch (err) {
        reject(err);
      }
    });
  }

  static renderView(viewPath, data) {
    return ViewFactory._generateCollapsedView(viewPath)
    .then((collapsedView) => {
      return ViewFactory._renderCollapsedView(collapsedView, {data});
    });
  }

  static _generateCollapsedViewGroup(viewPath, childViews) {
    return ViewFactory._createTempView(viewPath)
    .then((parentTempView) => {
      return Promise.all(childViews.map((childView) => {
        return ViewFactory._createTempView(childView.templatePath)
        .then((tempChildView) => {
          parentTempView.mergeData(tempChildView);


          return ViewFactory._renderCollapsedView(tempChildView.collapse(), {
            data: childView.data,
          });
        });
      }))
      .then((renderedChildViews) => {
        const collapsedParentView = parentTempView.collapse();
        return {
          collapsedParentView,
          renderedChildViews,
        };
      });
    });
  }

  static renderViewGroup(viewPath, childViews, data) {
    return ViewFactory._generateCollapsedViewGroup(viewPath, childViews)
    .then(({collapsedParentView, renderedChildViews}) => {
      return ViewFactory._renderCollapsedView(collapsedParentView, {
        content: () => {
          return renderedChildViews.reduce(
            (contentString, renderedChildView) => {
              return contentString += renderedChildView;
            }, '');
        },
        data,
      });
    });
  }
}

module.exports = ViewFactory;
