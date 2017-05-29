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
    const renderData = {
      data: currentView.data,
      styles: currentView.styles,
      scripts: currentView.scripts,
      getUsedStyles: () => {
        return renderData['styles'];
      },
      getUsedScripts: () => {
        return renderData['scripts'];
      },
    };
    renderData['content'] = () => {
      if (!childViewDetails) {
        return '';
      }

      let contentString = '';
      childViewDetails.forEach((details) => {
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
