const proxyquire = require('proxyquire').noCallThru();
const path = require('path');

describe('View', function() {
  it('should be able to reade a view template', function() {
    const TEMPLATE_PATH = 'example/template/path';
    const EXAMPLE_TEMPLATE = 'Hello.';

    const View = proxyquire('../../src/models/View', {
      'fs-promise': {
        readFile: (readPath) => {
          if (readPath === TEMPLATE_PATH) {
            return Promise.resolve(new Buffer(EXAMPLE_TEMPLATE));
          }
          return Promise.reject(new Error('Injected error.'));
        },
      },
    });

    const view = new View({
      templatePath: TEMPLATE_PATH,
    });
    return view._readTemplate()
    .then((yamlData) => {
      yamlData.__content.should.equal(EXAMPLE_TEMPLATE);
    });
  });

  it('should remove yaml frontmatter', function() {
    const FRONT_MATTER = '---\ntest: yaml\n---';
    const EXAMPLE_TEMPLATE = 'Hello.';
    const TEMPLATE_PATH = 'example/template/path';
    const View = proxyquire('../../src/models/View', {
      'fs-promise': {
        readFile: (readPath) => {
          if (readPath === TEMPLATE_PATH) {
            return Promise.resolve(new Buffer(FRONT_MATTER + EXAMPLE_TEMPLATE));
          }
          return Promise.reject(new Error('Injected error.'));
        },
      },
    });
    const view = new View({
      templatePath: TEMPLATE_PATH,
    });
    return view._readTemplate()
    .then((yamlData) => {
      yamlData.__content.should.equal(EXAMPLE_TEMPLATE);
      yamlData.test.should.deep.equal('yaml');
    });
  });

  it('should provide styles and scripts from front matter', function() {
    const FRONT_MATTER = '---\nscripts:\n - /scripts/example.js\nstyles:\n - /styles/example.css\n---';
    const EXAMPLE_TEMPLATE = 'Hello.';
    const TEMPLATE_PATH = 'example/template/path';
    const View = proxyquire('../../src/models/View', {
      'fs-promise': {
        readFile: (readPath) => {
          if (readPath === TEMPLATE_PATH) {
            return Promise.resolve(new Buffer(FRONT_MATTER + EXAMPLE_TEMPLATE));
          }
          return Promise.reject(new Error('Injected error.'));
        },
      },
    });
    const view = new View({
      templatePath: TEMPLATE_PATH,
    });
    return view._readTemplate()
    .then((yamlData) => {
      yamlData.__content.should.equal(EXAMPLE_TEMPLATE);
      yamlData.styles.should.deep.equal(['/styles/example.css']);
      yamlData.scripts.should.deep.equal(['/scripts/example.js']);
    });
  });

  it('should be able to render a basic view', function() {
    const EXAMPLE_TEMPLATE = 'Hello.';
    const TEMPLATE_PATH = 'example/template/path';
    const View = proxyquire('../../src/models/View', {
      'fs-promise': {
        readFile: (readPath) => {
          if (readPath === TEMPLATE_PATH) {
            return Promise.resolve(new Buffer(EXAMPLE_TEMPLATE));
          }
          return Promise.reject(new Error('Injected error.'));
        },
      },
    });

    const view = new View({
      templatePath: TEMPLATE_PATH,
    });
    return view.getViewDetails()
    .then((renderResult) => {
      renderResult.template.should.equal(EXAMPLE_TEMPLATE);
      renderResult.styles.should.deep.equal({
        inline: [],
        remote: [],
      });
      renderResult.scripts.should.deep.equal({
        sync: [],
        async: [],
      });
    });
  });

  it('should be able to render a view with styles and scripts', function() {
    const FRONT_MATTER = '---\nscripts:\n - /scripts/example.js\n - /scripts/sync-example.js\n - /scripts/example-sync.js\nstyles:\n - /styles/example.css\n - /styles/inline-example.css\n - /styles/example-inline.css\n---';
    const EXAMPLE_TEMPLATE = 'Hello.';
    const TEMPLATE_PATH = 'example/template/path';
    const STATIC_PATH = 'example/static/path';
    const View = proxyquire('../../src/models/View', {
      'fs-promise': {
        readFile: (readPath) => {
          if (readPath === TEMPLATE_PATH) {
            return Promise.resolve(new Buffer(FRONT_MATTER + EXAMPLE_TEMPLATE));
          } else if (readPath === path.join(STATIC_PATH, 'styles/example-inline.css')) {
            return Promise.resolve(new Buffer('inlined-styles-from-example-inline.css'));
          }
          return Promise.reject(new Error('Injected error.'));
        },
      },
    });
    const view = new View({
      staticPath: STATIC_PATH,
      templatePath: TEMPLATE_PATH,
    });
    return view.getViewDetails()
    .then((renderResult) => {
      renderResult.template.should.equal(EXAMPLE_TEMPLATE);
      renderResult.styles.should.deep.equal({
        inline: [
          'inlined-styles-from-example-inline.css',
        ],
        remote: [
          '/styles/example.css',
          '/styles/inline-example.css',
        ],
      });
      renderResult.scripts.should.deep.equal({
        async: [
          '/scripts/example.js',
          '/scripts/sync-example.js',
        ],
        sync: [
          '/scripts/example-sync.js',
        ],
      });
    });
  });

  it('should be able to render a view with data', function() {
    const EXAMPLE_TEMPLATE = 'Hello, {{data.exampleName}}.';
    const EXAMPLE_DATA = {
      exampleName: 'World',
    };
    const TEMPLATE_PATH = 'example/template/path';
    const View = proxyquire('../../src/models/View', {
      'fs-promise': {
        readFile: (readPath) => {
          if (readPath === TEMPLATE_PATH) {
            return Promise.resolve(new Buffer(EXAMPLE_TEMPLATE));
          }
          return Promise.reject(new Error('Injected error.'));
        },
      },
    });
    const view = new View({
      templatePath: TEMPLATE_PATH,
      data: EXAMPLE_DATA,
    });
    return view.getViewDetails()
    .then((renderResult) => {
      renderResult.data.should.equal(EXAMPLE_DATA);
    });
  });
});
