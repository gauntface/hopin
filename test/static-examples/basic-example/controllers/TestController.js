class TestController {
  index() {
    return 'basic-example:test';
  }

  action() {
    return 'basic-example:test:action';
  }

  basicview() {
    return {
      styles: {
        async: ['/styles/async.css'],
      },
      scripts: {
        async: ['/scripts/async.js'],
      },
      templatePath: 'templates/view.tmpl',
      views: [
        {
          templatePath: 'templates/view-1.tmpl',
          views: [
            {
              templatePath: 'templates/view-2.tmpl',
            },
          ],
        },
        {
          templatePath: 'templates/view-3.tmpl',
          data: {
            oh: 'hai',
          },
        },
      ],
    };
  }
}

module.exports = new TestController();
