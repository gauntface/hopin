const fs = require('fs-promise');
const path = require('path');
const yamlFront = require('yaml-front-matter');

const HopinError = require('../models/HopinError');

class View {
  constructor(input) {
    this._templatePath = input.templatePath;
  }

  render() {
    return this._readTemplate()
    .then((templateDetails) => {
      // This is the template with yaml front matter parsed out
      // Template content will be in '__content'
      return {
        content: templateDetails.__content,
        styles: {
          inline: [],
          remote: [],
        },
        scripts: [],
      };
    });
  }

  _readTemplate() {
    return fs.readFile(this._templatePath)
    .then((fileContentBuffer) => fileContentBuffer.toString())
    .then((fileContent) => {
      return yamlFront.loadFront(fileContent);
    });
  }
}

module.exports = View;
