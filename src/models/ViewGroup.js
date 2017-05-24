const mustache = require('mustache');

const View = require('./View');

class ViewGroup extends View {
  constructor(input) {
    super(input);
    this._input = input;
    this._views = input.views;
  }

  getViewDetails() {
    console.log('Step 1');
    return Promise.all(
      this._views.map((view) => view.getViewDetails())
    )
    .then((viewDetails) => {
      console.log('Step 2');
      return viewDetails.filter((viewDetail) => {
        return viewDetail ? true : false;
      });
    })
    .then((childViewDetails) => {
      console.log('Step 3');
      return super.getViewDetails()
      .then((currentViewDetails) => {
        console.log('Step 4');
        if (!currentViewDetails) {
          return '';
        }

        console.log('Step 5');
        return this._generateRenderData(childViewDetails, currentViewDetails)
        .then((renderData) => {
          console.log('Step 6');
          const renderedContent = mustache.render(
            currentViewDetails.template,
            renderData,
            currentViewDetails.partials);
          console.log('Step 7');
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
