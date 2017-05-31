const mustache = require('mustache');

const View = require('./View');

class ViewGroup extends View {
  constructor(input) {
    super(input);
    this._input = input;
    this._views = input.views;
  }

  getViewDetails() {
    return Promise.all(
      this._views.map((view) => view.getViewDetails())
    )
    .then((viewDetails) => {
      return viewDetails.filter((viewDetail) => {
        return viewDetail ? true : false;
      });
    })
    .then((childViewDetails) => {
      return super.getViewDetails()
      .then((currentViewDetails) => {
        if (!currentViewDetails) {
          return '';
        }

        return this._generateRenderData(childViewDetails, currentViewDetails)
        .then((renderData) => {
          const renderedContent = mustache.render(
            currentViewDetails.template,
            renderData,
            currentViewDetails.partials);
          return {
            template: renderedContent,
            styles: renderData.getUsedStyles(),
            scripts: renderData.getUsedScripts(),
          };
        });
      });
    });
  }

  render() {
    return this.getViewDetails()
    .then((viewDetails) => {
      return viewDetails.template;
    });
  }

  _generateRenderData(childViewDetails, currentView) {
    let stylesToInclude = currentView.styles;
    let scriptsToInclude = currentView.scripts;
    const renderData = {
      data: currentView.data,
      styles: stylesToInclude,
      scripts: scriptsToInclude,
      getUsedStyles: () => {
        return stylesToInclude;
      },
      getUsedScripts: () => {
        return scriptsToInclude;
      },
    };

    renderData['content'] = () => {
      if (!childViewDetails) {
        return '';
      }

      let contentString = '';
      childViewDetails.forEach((details) => {
        stylesToInclude.inline =
          stylesToInclude.inline.concat(details.styles.inline);
        stylesToInclude.async =
          stylesToInclude.async.concat(details.styles.async);

        scriptsToInclude.sync =
          scriptsToInclude.sync.concat(details.scripts.sync);
        scriptsToInclude.async =
          scriptsToInclude.async.concat(details.scripts.async);

        contentString += mustache.render(details.template, {
          data: details.data,
        }, details.partials);
      });

      return contentString;
    };

    const copyGroups = {
      'styles': ['inline', 'async'],
      'scripts': ['sync', 'async'],
    };

    childViewDetails.forEach((childViewDetail) => {
      Object.keys(copyGroups).forEach((key) => {
        const values = copyGroups[key];
        values.forEach((value) => {
          renderData[key][value] = renderData[key][value].concat(
            childViewDetail[key][value]
          );
        });
      });
    });

    return Promise.resolve(renderData);
  }
}

module.exports = ViewGroup;
