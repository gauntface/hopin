const View = require('./View');

class ViewGroup extends View {
  constructor(input) {
    super(input);

    this._views = input.views;
  }

  render() {
    return Promise.all(
      this._views.map((view) => view.render())
    )
    .then((viewRenders) => {
      console.log('viewRenders: ', viewRenders);
    });
  }
}

module.exports = ViewGroup;
