class TestController {
  index() {
    return 'basic-example:test';
  }

  action() {
    return 'basic-example:test:action';
  }
}

module.exports = new TestController();
