class TestController {
  index() {
    return 'basic-example:test';
  }

  action() {
    return 'basic-example:test:action';
  }

  basicview() {
    return {
      path: 'templates/view.tmpl',
    };
  }
}

module.exports = new TestController();
