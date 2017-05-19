const proxyquire = require('proxyquire').noCallThru();
const path = require('path');

const expect = require('chai').expect;

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
    return view.getViewDetails()
    .then((yamlData) => {
      expect(yamlData.template).to.equal(EXAMPLE_TEMPLATE);
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
    return view.getViewDetails()
    .then((yamlData) => {
      expect(yamlData.template).to.equal(EXAMPLE_TEMPLATE);
    });
  });

  it('should provide styles and scripts from front matter', function() {
    const FRONT_MATTER = '---\nscripts:\n - /scripts/example.js\n - /scripts/example-sync.js\nstyles:\n - /styles/example.css\n - /styles/example-inline.css\n---';
    const EXAMPLE_TEMPLATE = 'Hello.';
    const TEMPLATE_PATH = 'example/template/path';
    const STATIC_PATH = 'example/static/path';
    const View = proxyquire('../../src/models/View', {
      'fs-promise': {
        readFile: (readPath) => {
          if (readPath === TEMPLATE_PATH) {
            return Promise.resolve(new Buffer(FRONT_MATTER + EXAMPLE_TEMPLATE));
          } else if (readPath === path.join(STATIC_PATH, 'styles/example-inline.css')) {
            return Promise.resolve(new Buffer('CONTENT::styles/example-inline.css'));
          }
          return Promise.reject(new Error('Injected error: ' + readPath));
        },
      },
    });
    const view = new View({
      templatePath: TEMPLATE_PATH,
      staticPath: STATIC_PATH,
    });
    return view.getViewDetails()
    .then((yamlData) => {
      expect(yamlData.template).to.equal(EXAMPLE_TEMPLATE);
      expect(yamlData.styles.inline).to.deep.equal(['CONTENT::styles/example-inline.css']);
      expect(yamlData.styles.async).to.deep.equal(['/styles/example.css']);
      expect(yamlData.scripts.sync).to.deep.equal(['/scripts/example-sync.js']);
      expect(yamlData.scripts.async).to.deep.equal(['/scripts/example.js']);
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
      expect(renderResult.template).to.equal(EXAMPLE_TEMPLATE);
      expect(renderResult.styles).to.deep.equal({
        inline: [],
        async: [],
      });
      expect(renderResult.scripts).to.deep.equal({
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
      expect(renderResult.template).to.equal(EXAMPLE_TEMPLATE);
      expect(renderResult.styles).to.deep.equal({
        inline: [
          'inlined-styles-from-example-inline.css',
        ],
        async: [
          '/styles/example.css',
          '/styles/inline-example.css',
        ],
      });
      expect(renderResult.scripts).to.deep.equal({
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
      expect(renderResult.data).to.equal(EXAMPLE_DATA);
    });
  });

  it('should be able to render a view with partials', function() {
    const EXAMPLE_TEMPLATE = '---\npartials:\n - static/example-partial.html\n - static/example-partial-2.html\n---Hello, {{> static/example-partial.html}}.';
    const TEMPLATE_DIR = 'example/template-dir/path';
    const TEMPLATE_PATH = 'example/template/path';
    const View = proxyquire('../../src/models/View', {
      'fs-promise': {
        readFile: (readPath) => {
          if (readPath === TEMPLATE_PATH) {
            return Promise.resolve(new Buffer(EXAMPLE_TEMPLATE));
          } else if(readPath === path.join(TEMPLATE_DIR, 'static/example-partial.html')) {
            return Promise.resolve(new Buffer('example-partial-file-contents.'));
          } else if(readPath === path.join(TEMPLATE_DIR, 'static/example-partial-2.html')) {
            return Promise.resolve(new Buffer('example-partial-2-file-contents.'));
          }
          return Promise.reject(new Error('Injected error. ' + readPath));
        },
      },
    });
    const view = new View({
      templateDir: TEMPLATE_DIR,
      templatePath: TEMPLATE_PATH,
    });
    return view.getViewDetails()
    .then((renderResult) => {
      expect(renderResult.partials).to.deep.equal({
        'static/example-partial.html': 'example-partial-file-contents.',
        'static/example-partial-2.html': 'example-partial-2-file-contents.',
      });
    });
  });

  it('should be able to render a view with both partials and static partials', function() {
    const EXAMPLE_TEMPLATE = '---\npartials:\n - static/example-partial.html\n - static/example-partial-2.html\n---Hello, {{> static/example-partial.html}}.';
    const TEMPLATE_DIR = 'example/template-dir/path';
    const TEMPLATE_PATH = 'example/template/path';
    const View = proxyquire('../../src/models/View', {
      'fs-promise': {
        readFile: (readPath) => {
          if (readPath === TEMPLATE_PATH) {
            return Promise.resolve(new Buffer(EXAMPLE_TEMPLATE));
          } else if(readPath === path.join(TEMPLATE_DIR, 'static/example-partial.html')) {
            return Promise.resolve(new Buffer('example-partial-file-contents.'));
          } else if(readPath === path.join(TEMPLATE_DIR, 'static/example-partial-2.html')) {
            return Promise.resolve(new Buffer('example-partial-2-file-contents.'));
          }
          return Promise.reject(new Error('Injected error. ' + readPath));
        },
      },
    });
    const view = new View({
      templateDir: TEMPLATE_DIR,
      templatePath: TEMPLATE_PATH,
      partials: {
        'static/example-partial-3': 'hello-world',
      },
    });
    return view.getViewDetails()
    .then((renderResult) => {
      expect(renderResult.partials).to.deep.equal({
        'static/example-partial.html': 'example-partial-file-contents.',
        'static/example-partial-2.html': 'example-partial-2-file-contents.',
        'static/example-partial-3': 'hello-world',
      });
    });
  });

  it('should be able to render a view with nested partials', function() {
    const EXAMPLE_TEMPLATE = '---\npartials:\n - static/example-partial.html\n---Hello, {{> static/example-partial.html}}.';
    const TEMPLATE_DIR = 'example/template-dir/path';
    const TEMPLATE_PATH = 'example/template/path';
    const View = proxyquire('../../src/models/View', {
      'fs-promise': {
        readFile: (readPath) => {
          if (readPath === TEMPLATE_PATH) {
            return Promise.resolve(new Buffer(EXAMPLE_TEMPLATE));
          } else if(readPath === path.join(TEMPLATE_DIR, 'static/example-partial.html')) {
            return Promise.resolve(new Buffer('---\npartials:\n - static/example-partial-2.html\n---example-partial-file-contents. {{> static/example-partial-2.html}}'));
          } else if(readPath === path.join(TEMPLATE_DIR, 'static/example-partial-2.html')) {
            return Promise.resolve(new Buffer('example-partial-2-file-contents.'));
          }
          return Promise.reject(new Error('Injected error. ' + readPath));
        },
      },
    });
    const view = new View({
      templateDir: TEMPLATE_DIR,
      templatePath: TEMPLATE_PATH,
    });
    return view.getViewDetails()
    .then((renderResult) => {
      expect(renderResult.partials).to.deep.equal({
        'static/example-partial.html': 'example-partial-file-contents. {{> static/example-partial-2.html}}',
        'static/example-partial-2.html': 'example-partial-2-file-contents.',
      });
    });
  });

  it('should be able to merge partials together', function() {
    const getYaml = (id) => {
      return `---\npartials:\n - partials/${id}.html\nstyles:\n - styles/${id}.css\n - styles/${id}-inline.css\nscripts:\n - scripts/${id}.js\n - scripts/${id}-sync.css\n---`;
    };
    const EXAMPLE_TEMPLATE = `${getYaml('top-level-view')}Hello, {{> static/example-partial.html}}.`;
    const TEMPLATE_DIR = 'example/template-dir/path';
    const TEMPLATE_PATH = 'example/template/path';
    const STATIC_DIR = 'example/static/path';
    const View = proxyquire('../../src/models/View', {
      'fs-promise': {
        readFile: (readPath) => {
          if (readPath === TEMPLATE_PATH) {
            return Promise.resolve(new Buffer(EXAMPLE_TEMPLATE));
          } else if(readPath === path.join(TEMPLATE_DIR, 'partials/top-level-view.html')) {
            return Promise.resolve(new Buffer(`${getYaml('partial-1')}top-level-contents. {{> partials/partial-1.html}}`));
          } else if(readPath === path.join(TEMPLATE_DIR, 'partials/partial-1.html')) {
            return Promise.resolve(new Buffer('---\nstyles:\n - styles/partial-1.css\nscripts:\n - scripts/partial-1.js\n---example-partial-1-file-contents.'));
          } else if (readPath === path.join(STATIC_DIR, 'styles/top-level-view-inline.css')) {
            return Promise.resolve(new Buffer('CONTENTS::top-level-view-inline.css'));
          } else if (readPath === path.join(STATIC_DIR, 'styles/partial-1-inline.css')) {
            return Promise.resolve(new Buffer('CONTENTS::partial-1-inline.css'));
          }
          return Promise.reject(new Error('Injected error. ' + readPath));
        },
      },
    });
    const view = new View({
      templateDir: TEMPLATE_DIR,
      templatePath: TEMPLATE_PATH,
      staticPath: STATIC_DIR,
    });
    return view.getViewDetails()
    .then((renderResult) => {
      expect(renderResult.styles).to.deep.equal({
        inline: [
          'CONTENTS::top-level-view-inline.css',
          'CONTENTS::partial-1-inline.css',
        ],
        async: [
          'styles/top-level-view.css',
          'styles/partial-1.css',
        ],
      });
      expect(renderResult.partials).to.deep.equal({
        'partials/top-level-view.html': 'top-level-contents. {{> partials/partial-1.html}}',
        'partials/partial-1.html': 'example-partial-1-file-contents.',
      });
    });
  });
});
