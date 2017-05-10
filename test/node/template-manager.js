const path = require('path');
const proxyquire = require('proxyquire').noCallThru();

const errorCodes = require('../../src/models/ErrorCodes');

require('chai').should();

describe('Template Manager', function() {
  it('should throw when no template path', function() {
    const INJECTED_ERROR = new Error('Injected Error');
    const TemplateManager = require('../../src/controllers/TemplateManager');

    try {
      new TemplateManager({});
      throw INJECTED_ERROR;
    } catch(err) {
      if (err === INJECTED_ERROR) {
        throw new Error('Expected error to be thrown.');
      }
    }
  });

  it('should be able to render a view that has a partial', function() {
    const RELATIVE_PATH = 'rel-path';
    const TemplateManager = proxyquire('../../src/controllers/TemplateManager', {
      'fs-promise': {
        readFile: (fullPath) => {
          const relPath = path.relative(RELATIVE_PATH, fullPath);
          switch (relPath) {
            case path.join('templates', 'example/partial'):
              return Promise.resolve(new Buffer('Partial.'));
            case path.join('templates', 'example/main'):
              return Promise.resolve(new Buffer('---\nstyles:\n - /styles/example.css\nscripts:\n - /scripts/example.js\npartials:\n - example/partial\n---Hello.{{> example/partial}}Goodbye.'));
            default:
              return Promise.reject('Unknown template: ' + fullPath);
          }
        },
      },
    });
    const templateManager = new TemplateManager({
      relativePath: RELATIVE_PATH,
    });

    return templateManager.renderTemplate('example/main', {})
    .then((templateDetails) => {
      templateDetails.content.should.equal('Hello.Partial.Goodbye.');
      templateDetails.styles.should.deep.equal([
        '/styles/example.css',
      ]);
      templateDetails.scripts.should.deep.equal([
        '/scripts/example.js',
      ]);
    });
  });

  it('should be able to render a view that uses {{content}}', function() {
    const TEMPLATE_PATH = 'tmpl-path';
    const PATH_1 = 'example/path/1';
    const PATH_1_CONTENT = 'Path 1 Content.';
    const PATH_2 = 'example/path/2';
    const PATH_2_CONTENT = 'Path 2 Content.';
    const TemplateManager = proxyquire('../../src/controllers/TemplateManager', {
      'fs-promise': {
        readFile: (fullPath) => {
          const relPath = path.relative(TEMPLATE_PATH, fullPath);
          switch(relPath) {
            case path.join('templates', PATH_1):
              return Promise.resolve(new Buffer(PATH_1_CONTENT + '{{content}}'));
            case path.join('templates', PATH_2):
              return Promise.resolve(new Buffer(PATH_2_CONTENT));
          }

          return Promise.reject(new Error('Unknown template path: ' + fullPath));
        },
      },
    });
    const templateManager = new TemplateManager({
      relativePath: TEMPLATE_PATH,
    });

    return templateManager.renderTemplate(PATH_1, {
      views: [
        {
          templatePath: PATH_2,
        },
      ],
    })
    .then((templateDetails) => {
      templateDetails.content.should.equal(`${PATH_1_CONTENT}${PATH_2_CONTENT}`);
    });
  });

  it('should be able to render a view that uses {{content-*}}', function() {
    const TEMPLATE_PATH = 'tmpl-path';
    const PATH_1 = 'example/path/1';
    const PATH_1_CONTENT = 'Path 1 Content.';
    const PATH_2 = 'example/path/2';
    const PATH_2_CONTENT = 'Path 2 Content.';
    const PATH_3 = 'example/path/3';
    const PATH_3_CONTENT = 'Path 3 Content.';

    const TemplateManager = proxyquire('../../src/controllers/TemplateManager', {
      'fs-promise': {
        readFile: (fullPath) => {
          const relPath = path.relative(TEMPLATE_PATH, fullPath);
          switch(relPath) {
            case path.join('templates', PATH_1):
              return Promise.resolve(new Buffer(PATH_1_CONTENT + '{{content-1}}' + '{{content-0}}'));
            case path.join('templates', PATH_2):
              return Promise.resolve(new Buffer(PATH_2_CONTENT));
            case path.join('templates', PATH_3):
              return Promise.resolve(new Buffer(PATH_3_CONTENT));
          }

          return Promise.reject(new Error('Unknown template path: ' + fullPath));
        },
      },
    });
    const templateManager = new TemplateManager({
      relativePath: TEMPLATE_PATH,
    });

    return templateManager.renderTemplate(PATH_1, {
      views: [
        {
          templatePath: PATH_2,
        },
        {
          templatePath: PATH_3,
        },
      ],
    })
    .then((templateDetails) => {
      templateDetails.content.should.equal(`${PATH_1_CONTENT}${PATH_3_CONTENT}${PATH_2_CONTENT}`);
    });
  });

  it('should be able to rendered nested {{content}}', function() {
    const TEMPLATE_PATH = 'tmpl-path';
    const PATH_1 = 'example/path/1';
    const PATH_1_CONTENT = 'Path 1 Content.';
    const PATH_2 = 'example/path/2';
    const PATH_2_CONTENT = 'Path 2 Content.';
    const PATH_3 = 'example/path/3';
    const PATH_3_CONTENT = 'Path 3 Content.';

    const TemplateManager = proxyquire('../../src/controllers/TemplateManager', {
      'fs-promise': {
        readFile: (fullPath) => {
          const relPath = path.relative(TEMPLATE_PATH, fullPath);
          switch(relPath) {
            case path.join('templates', PATH_1):
              return Promise.resolve(new Buffer(PATH_1_CONTENT + '{{content}}'));
            case path.join('templates', PATH_2):
              return Promise.resolve(new Buffer(PATH_2_CONTENT + '{{content}}'));
            case path.join('templates', PATH_3):
              return Promise.resolve(new Buffer(PATH_3_CONTENT));
          }

          return Promise.reject(new Error('Unknown template path: ' + fullPath));
        },
      },
    });
    const templateManager = new TemplateManager({
      relativePath: TEMPLATE_PATH,
    });

    return templateManager.renderTemplate(PATH_1, {
      views: [
        {
          templatePath: PATH_2,
          data: {
            views: [
              {
                templatePath: PATH_3,
              },
            ],
          },
        },
      ],
    })
    .then((templateDetails) => {
      templateDetails.content.should.equal(`${PATH_1_CONTENT}${PATH_2_CONTENT}${PATH_3_CONTENT}`);
    });
  });

  it('should be able to return styles and scripts for all sub views used', function() {
    const TEMPLATE_PATH = 'tmpl-path';
    const PATH_1 = 'example/path/1';
    const PATH_2 = 'example/path/2';
    const PATH_3 = 'example/path/3';

    const TemplateManager = proxyquire('../../src/controllers/TemplateManager', {
      'fs-promise': {
        readFile: (fullPath) => {
          const relPath = path.relative(TEMPLATE_PATH, fullPath);
          switch(relPath) {
            case path.join('templates', PATH_1): {
              let content = `---\nscripts:\n - /scripts/1/example.js\nstyles:\n - /styles/1/example.css\n---`;
              content += 'Hello 1.';
              return Promise.resolve(new Buffer(content + '{{content}}'));
            }
            case path.join('templates', PATH_2): {
              let content = `---\nscripts:\n - /scripts/2/example.js\nstyles:\n - /styles/2/example.css\n---`;
              content += 'Hello 2.';
              return Promise.resolve(new Buffer(content + '{{content}}'));
            }
            case path.join('templates', PATH_3): {
              let content = `---\nscripts:\n - /scripts/3/example.js\nstyles:\n - /styles/3/example.css\n---`;
              content += 'Hello 3.';
              return Promise.resolve(new Buffer(content));
            }
          }

          return Promise.reject(new Error('Unknown template path: ' + fullPath));
        },
      },
    });
    const templateManager = new TemplateManager({
      relativePath: TEMPLATE_PATH,
    });

    return templateManager.renderTemplate(PATH_1, {
      views: [
        {
          templatePath: PATH_2,
          data: {
            views: [
              {
                templatePath: PATH_3,
              },
            ],
          },
        },
      ],
    })
    .then((templateDetails) => {
      templateDetails.content.should.equal(`Hello 1.Hello 2.Hello 3.`);
      templateDetails.styles.should.deep.equal([
        '/styles/1/example.css',
        '/styles/2/example.css',
        '/styles/3/example.css',
      ]);
      templateDetails.scripts.should.deep.equal([
        '/scripts/1/example.js',
        '/scripts/2/example.js',
        '/scripts/3/example.js',
      ]);
    });
  });

  it('should dedupe styles and scripts', function() {
    const TEMPLATE_PATH = 'tmpl-path';
    const PATH_1 = 'example/path/1';
    const PATH_2 = 'example/path/2';
    const PATH_3 = 'example/path/3';

    const TemplateManager = proxyquire('../../src/controllers/TemplateManager', {
      'fs-promise': {
        readFile: (fullPath) => {
          const relPath = path.relative(TEMPLATE_PATH, fullPath);
          switch(relPath) {
            case path.join('templates', PATH_1): {
              let content = `---\nscripts:\n - /scripts/1/example.js\nstyles:\n - /styles/1/example.css\n---`;
              content += 'Hello 1.';
              return Promise.resolve(new Buffer(content + '{{content}}'));
            }
            case path.join('templates', PATH_2): {
              let content = `---\nscripts:\n - /scripts/1/example.js\nstyles:\n - /styles/1/example.css\n---`;
              content += 'Hello 2.';
              return Promise.resolve(new Buffer(content + '{{content}}'));
            }
            case path.join('templates', PATH_3): {
              let content = `---\nscripts:\n - /scripts/3/example.js\nstyles:\n - /styles/3/example.css\n---`;
              content += 'Hello 3.';
              return Promise.resolve(new Buffer(content));
            }
          }

          return Promise.reject(new Error('Unknown template path: ' + fullPath));
        },
      },
    });
    const templateManager = new TemplateManager({
      relativePath: TEMPLATE_PATH,
    });

    return templateManager.renderTemplate(PATH_1, {
      views: [
        {
          templatePath: PATH_2,
          data: {
            views: [
              {
                templatePath: PATH_3,
              },
            ],
          },
        },
      ],
    })
    .then((templateDetails) => {
      templateDetails.content.should.equal(`Hello 1.Hello 2.Hello 3.`);
      templateDetails.styles.should.deep.equal([
        '/styles/1/example.css',
        '/styles/3/example.css',
      ]);
      templateDetails.scripts.should.deep.equal([
        '/scripts/1/example.js',
        '/scripts/3/example.js',
      ]);
    });
  });

  it('should be able to return styles and scripts for only sub views used', function() {
    const TEMPLATE_PATH = 'tmpl-path';
    const PATH_1 = 'example/path/1';
    const PATH_2 = 'example/path/2';
    const PATH_3 = 'example/path/3';

    const TemplateManager = proxyquire('../../src/controllers/TemplateManager', {
      'fs-promise': {
        readFile: (fullPath) => {
          const relPath = path.relative(TEMPLATE_PATH, fullPath);
          switch(relPath) {
            case path.join('templates', PATH_1): {
              let content = `---\nscripts:\n - /scripts/1/example.js\nstyles:\n - /styles/1/example.css\n---`;
              content += 'Hello 1.';
              return Promise.resolve(new Buffer(content + '{{content}}'));
            }
            case path.join('templates', PATH_2): {
              let content = `---\nscripts:\n - /scripts/2/example.js\nstyles:\n - /styles/2/example.css\n---`;
              content += 'Hello 2.';
              return Promise.resolve(new Buffer(content));
            }
            case path.join('templates', PATH_3): {
              let content = `---\nscripts:\n - /scripts/3/example.js\nstyles:\n - /styles/3/example.css\n---`;
              content += 'Hello 3.';
              return Promise.resolve(new Buffer(content));
            }
          }

          return Promise.reject(new Error('Unknown template path: ' + fullPath));
        },
      },
    });
    const templateManager = new TemplateManager({
      relativePath: TEMPLATE_PATH,
    });

    return templateManager.renderTemplate(PATH_1, {
      views: [
        {
          templatePath: PATH_2,
          data: {
            views: [
              {
                templatePath: PATH_3,
              },
            ],
          },
        },
      ],
    })
    .then((templateDetails) => {
      templateDetails.content.should.equal(`Hello 1.Hello 2.`);
      templateDetails.styles.should.deep.equal([
        '/styles/1/example.css',
        '/styles/2/example.css',
      ]);
      templateDetails.scripts.should.deep.equal([
        '/scripts/1/example.js',
        '/scripts/2/example.js',
      ]);
    });
  });

  it('should throw when rendering HTML without data', function() {
    const TemplateManager = require('../../src/controllers/TemplateManager');
    try {
      const templateManager = new TemplateManager({
        relativePath: '.',
      });
      templateManager.render();
      throw new Error('Injected Error');
    } catch (err) {
      if (err.message.indexOf(errorCodes['render-data-required'].message) !== 0) {
        throw new Error('Unexpected error thrown: ' + err.message);
      }
    }
  });

  it('should render HTML without any data', function() {
    const TEMPLATE_PATH = 'tmpl-path';
    const DOC_1 = 'documents/html.tmpl';

    const View = proxyquire('../../src/models/View', {
      'fs-promise': {
        readFile: (fullPath) => {
          const relPath = path.relative(TEMPLATE_PATH, fullPath);
          switch(relPath) {
            case path.join('templates', DOC_1): {
              let content = `DocumentTemplate.{{{content}}}`;
              return Promise.resolve(new Buffer(content));
            }
          }

          return Promise.reject(new Error('Unknown template path: ' + fullPath));
        },
      },
    });
    const ViewGroup = proxyquire('../../src/models/ViewGroup', {
      './View': View,
    });
    const TemplateManager = proxyquire('../../src/controllers/TemplateManager', {
      '../models/View': View,
      '../models/ViewGroup': ViewGroup,
    });
    const templateManager = new TemplateManager({
      relativePath: TEMPLATE_PATH,
    });
    return templateManager.render({})
    .then((templateResult) => {
      templateResult.should.equal(`DocumentTemplate.`);
    });
  });

  it('should render HTML with a basic shell', function() {
    const TEMPLATE_PATH = 'tmpl-path';
    const SHELL_1 = 'shells/example/2';
    const DOC_1 = 'documents/html.tmpl';

    const View = proxyquire('../../src/models/View', {
      'fs-promise': {
        readFile: (fullPath) => {
          const relPath = path.relative(TEMPLATE_PATH, fullPath);
          switch(relPath) {
            case path.join('templates', SHELL_1): {
              const content = `Hello Shell. {{{content}}}`;
              return Promise.resolve(new Buffer(content));
            }
            case path.join('templates', DOC_1): {
              const content = `Hello Document. {{{content}}}`;
              return Promise.resolve(new Buffer(content));
            }
          }

          return Promise.reject(new Error('Unknown template path: ' + fullPath));
        },
      },
    });
    const ViewGroup = proxyquire('../../src/models/ViewGroup', {
      './View': View,
    });
    const TemplateManager = proxyquire('../../src/controllers/TemplateManager', {
      '../models/View': View,
      '../models/ViewGroup': ViewGroup,
    });
    const templateManager = new TemplateManager({
      relativePath: TEMPLATE_PATH,
    });
    return templateManager.render({
      shell: SHELL_1,
      views: [],
    })
    .then((templateResult) => {
      templateResult.should.equal(`Hello Document. Hello Shell. `);
    });
  });

  it('should render HTML with a shell and sub view', function() {
    const TEMPLATE_PATH = 'tmpl-path';
    const PATH_1 = 'example/path/1';
    const SHELL_1 = 'shells/example/2';
    const DOC_1 = 'documents/html.tmpl';

    const View = proxyquire('../../src/models/View', {
      'fs-promise': {
        readFile: (fullPath) => {
          const relPath = path.relative(TEMPLATE_PATH, fullPath);
          switch(relPath) {
            case path.join('templates', PATH_1): {
              let content = `Hello View.`;
              return Promise.resolve(new Buffer(content + '{{content}}'));
            }
            case path.join('templates', SHELL_1): {
              let content = `Hello Shell. {{{content}}}`;
              return Promise.resolve(new Buffer(content));
            }
            case path.join('templates', DOC_1): {
              let content = `Hello Document. {{{content}}}`;
              return Promise.resolve(new Buffer(content));
            }
          }

          return Promise.reject(new Error('Unknown template path: ' + fullPath));
        },
      },
    });
    const ViewGroup = proxyquire('../../src/models/ViewGroup', {
      './View': View,
    });
    const TemplateManager = proxyquire('../../src/controllers/TemplateManager', {
      '../models/View': View,
      '../models/ViewGroup': ViewGroup,
    });
    const templateManager = new TemplateManager({
      relativePath: TEMPLATE_PATH,
    });
    return templateManager.render({
      shell: SHELL_1,
      views: [
        {
          templatePath: PATH_1,
        },
      ],
    })
    .then((templateResult) => {
      templateResult.should.equal(`Hello Document. Hello Shell. Hello View.`);
    });
  });

  it('should render HTML with a shell with styles and scripts', function() {
    const TEMPLATE_PATH = 'tmpl-path';
    const PATH_1 = 'example/path/1';
    const SHELL_1 = 'shells/example/2';
    const DOC_1 = 'documents/html.tmpl';

    const getFrontMatter = (name) => {
      return `---\nscripts:\n - /scripts/${name}/example.js\n - /scripts/${name}/example-sync.js\nstyles:\n - /styles/${name}/example.css\n - /styles/${name}/example-inline.css\n---`;
    };

    const View = proxyquire('../../src/models/View', {
      'fs-promise': {
        readFile: (fullPath) => {
          const relPath = path.relative(TEMPLATE_PATH, fullPath);
          switch(relPath) {
            case path.join('templates', PATH_1): {
              let content = getFrontMatter('view');
              content += 'Hello 1.';
              return Promise.resolve(new Buffer(content + '{{content}}'));
            }
            case path.join('templates', SHELL_1): {
              let content = getFrontMatter('shell');
              content += 'Hello Shell. {{{content}}}';
              return Promise.resolve(new Buffer(content));
            }
            case path.join('templates', DOC_1): {
              let content = `${getFrontMatter('document')}\n{{#styles.inline}}{{{.}}}\n{{/styles.inline}}{{#styles.remote}}{{{.}}}\n{{/styles.remote}}{{#scripts.async}}{{{.}}}\n{{/scripts.async}}{{#scripts.sync}}{{{.}}}\n{{/scripts.sync}}Hello Document. {{{content}}}`;
              return Promise.resolve(new Buffer(content));
            }
            case 'static/styles/view/example-inline.css': {
              return Promise.resolve(new Buffer('view-css-here'));
            }
            case 'static/styles/shell/example-inline.css': {
              return Promise.resolve(new Buffer('shell-css-here'));
            }
            case 'static/styles/document/example-inline.css': {
              return Promise.resolve(new Buffer('document-css-here'));
            }
          }

          return Promise.reject(new Error('Unknown template path: ' + fullPath));
        },
      },
    });
    const ViewGroup = proxyquire('../../src/models/ViewGroup', {
      './View': View,
    });
    const TemplateManager = proxyquire('../../src/controllers/TemplateManager', {
      '../models/View': View,
      '../models/ViewGroup': ViewGroup,
    });
    const templateManager = new TemplateManager({
      relativePath: TEMPLATE_PATH,
    });
    return templateManager.render({
      shell: SHELL_1,
      views: [
        {
          templatePath: PATH_1,
        },
      ],
    })
    .then((templateResult) => {
      templateResult.should.equal(`
document-css-here
shell-css-here
view-css-here
/styles/document/example.css
/styles/shell/example.css
/styles/view/example.css
/scripts/document/example.js
/scripts/shell/example.js
/scripts/view/example.js
/scripts/document/example-sync.js
/scripts/shell/example-sync.js
/scripts/view/example-sync.js
Hello Document. Hello Shell. Hello 1.`);
    });
  });

  it('should render HTML with additional styles and scripts', function() {
    const TEMPLATE_PATH = 'tmpl-path';
    const PATH_1 = 'example/path/1';
    const DOC_1 = 'documents/html.tmpl';

    const getFrontMatter = (name) => {
      return `---\nscripts:\n - /scripts/${name}/example.js\n - /scripts/${name}/example-sync.js\nstyles:\n - /styles/${name}/example.css\n - /styles/${name}/example-inline.css\n---`;
    };

    const View = proxyquire('../../src/models/View', {
      'fs-promise': {
        readFile: (fullPath) => {
          const relPath = path.relative(TEMPLATE_PATH, fullPath);
          switch(relPath) {
            case path.join('templates', PATH_1): {
              let content = `Hello View.{{content}}`;
              return Promise.resolve(new Buffer(content));
            }
            case path.join('templates', DOC_1): {
              let content = `${getFrontMatter('document')}{{#styles.inline}}{{{.}}}\n{{/styles.inline}}{{#styles.async}}{{{.}}}\n{{/styles.async}}{{#scripts.sync}}{{{.}}}\n{{/scripts.sync}}{{#scripts.async}}{{{.}}}\n{{/scripts.async}}Hello Document. {{{content}}}`;
              return Promise.resolve(new Buffer(content));
            }
            case 'static/styles/additional-1/example-inline.css': {
              return Promise.resolve(new Buffer('additional-1/example-inline.css'));
            }
            case 'static/styles/additional-2/example-inline.css': {
              return Promise.resolve(new Buffer('additional-2/example-inline.css'));
            }
            case 'static/styles/document/example-inline.css': {
              return Promise.resolve(new Buffer('document/example-inline.css'));
            }
          }

          return Promise.reject(new Error('Unknown template path: ' + fullPath));
        },
      },
    });
    const ViewGroup = proxyquire('../../src/models/ViewGroup', {
      './View': View,
    });
    const TemplateManager = proxyquire('../../src/controllers/TemplateManager', {
      '../models/View': View,
      '../models/ViewGroup': ViewGroup,
    });
    const templateManager = new TemplateManager({
      relativePath: TEMPLATE_PATH,
    });
    return templateManager.render({
      styles: [
        '/styles/additional-1/example-inline.css',
        '/styles/additional-1/example.css',
        '/styles/additional-2/example-inline.css',
        '/styles/additional-2/example.css',
      ],
      scripts: [
        '/scripts/additional-1/example-sync.js',
        '/scripts/additional-1/example.js',
        '/scripts/additional-2/example-sync.js',
        '/scripts/additional-2/example.js',
      ],
      views: [
        {
          templatePath: PATH_1,
        },
      ],
    })
    .then((templateResult) => {
      templateResult.should.equal(`document/example-inline.css
additional-1/example-inline.css
additional-2/example-inline.css
/scripts/document/example-sync.js
/scripts/additional-1/example-sync.js
/scripts/additional-2/example-sync.js
/scripts/document/example.js
/scripts/additional-1/example.js
/scripts/additional-2/example.js
Hello Document. Hello View.`);
    });
  });

  it('should be able to load a static file', function() {
    const RELATIVE_PATH = 'rel-path';
    const PATH_1 = 'example/path/1';
    const STATIC_1 = 'static/example/1';
    const DIRECTORY_PATH = 'static/example/directory.withdot/';

    const TemplateManager = proxyquire('../../src/controllers/TemplateManager', {
      'fs-promise': {
        stat: (filePath) => {
          return Promise.resolve({
            isFile: () => {
              return filePath !== path.join(RELATIVE_PATH, DIRECTORY_PATH);
            },
          });
        },
        readFile: (fullPath) => {
          const relPath = path.relative(RELATIVE_PATH, fullPath);
          switch(relPath) {
            case path.join('templates', PATH_1): {
              let content = `{{> ${ STATIC_1 }}}`;
              return Promise.resolve(new Buffer(content));
            }
            case STATIC_1: {
              let content = `Hello Static.`;
              return Promise.resolve(new Buffer(content));
            }
          }

          return Promise.reject(new Error('Unknown template path: ' + fullPath));
        },
      },
      'glob': (globPattern, cb) => {
        return cb(null, [
          path.join(RELATIVE_PATH, STATIC_1),
          path.join(RELATIVE_PATH, DIRECTORY_PATH),
        ]);
      },
    });
    const templateManager = new TemplateManager({
      relativePath: RELATIVE_PATH,
    });

    return templateManager.renderTemplate(PATH_1)
    .then((templateResult) => {
      templateResult.styles.should.deep.equal([]);
      templateResult.scripts.should.deep.equal([]);
      templateResult.content.should.equal(`Hello Static.`);
    });
  });


  it('should be render with custom html document', function() {
    const TEMPLATE_PATH = 'tmpl-path';
    const PATH_1 = 'example/path/1';
    const SHELL_1 = 'shells/example/2';
    const DOC_1 = 'documents/custom-example.tmpl';

    const getFrontMatter = (name) => {
      return `---\nscripts:\n - /scripts/${name}/example.js\n - /scripts/${name}/example-sync.js\nstyles:\n - /styles/${name}/example.css\n - /styles/${name}/example-inline.css\n---`;
    };

    const View = proxyquire('../../src/models/View', {
      'fs-promise': {
        readFile: (fullPath) => {
          const relPath = path.relative(TEMPLATE_PATH, fullPath);
          switch(relPath) {
            case path.join('templates', PATH_1): {
              let content = `${getFrontMatter('view')}`;
              content += 'Hello 1.';
              return Promise.resolve(new Buffer(content + '{{content}}'));
            }
            case path.join('templates', SHELL_1): {
              let content = `${getFrontMatter('shell')}`;
              content += 'Hello Shell. {{{content}}}';
              return Promise.resolve(new Buffer(content));
            }
            case path.join('templates', DOC_1): {
              let content = `${getFrontMatter('document')}{{#styles.inline}}{{{.}}}\n{{/styles.inline}}{{#styles.async}}{{{.}}}\n{{/styles.async}}{{#scripts.sync}}{{{.}}}\n{{/scripts.sync}}{{#scripts.async}}{{{.}}}\n{{/scripts.async}}Hello Document. {{{content}}}`;
              return Promise.resolve(new Buffer(content));
            }
            case 'static/styles/view/example-inline.css': {
              return Promise.resolve(new Buffer('view/example-inline.css'));
            }
            case 'static/styles/shell/example-inline.css': {
              return Promise.resolve(new Buffer('shell/example-inline.css'));
            }
            case 'static/styles/document/example-inline.css': {
              return Promise.resolve(new Buffer('document/example-inline.css'));
            }
          }

          return Promise.reject(new Error('Unknown template path: ' + fullPath));
        },
      },
    });
    const ViewGroup = proxyquire('../../src/models/ViewGroup', {
      './View': View,
    });
    const TemplateManager = proxyquire('../../src/controllers/TemplateManager', {
      '../models/View': View,
      '../models/ViewGroup': ViewGroup,
    });

    const templateManager = new TemplateManager({
      relativePath: TEMPLATE_PATH,
    });
    return templateManager.render({
      document: DOC_1,
      shell: SHELL_1,
      views: [
        {
          templatePath: PATH_1,
        },
      ],
    })
    .then((templateResult) => {
      templateResult.should.equal(`document/example-inline.css
shell/example-inline.css
view/example-inline.css
/scripts/document/example-sync.js
/scripts/shell/example-sync.js
/scripts/view/example-sync.js
/scripts/document/example.js
/scripts/shell/example.js
/scripts/view/example.js
Hello Document. Hello Shell. Hello 1.`);
    });
  });

  it('should be able render with custom data', function() {
    const TEMPLATE_PATH = 'tmpl-path';
    const PATH_1 = 'example/path/1';
    const DATA = {
      exampleName: 'World',
    };

    const View = proxyquire('../../src/models/View', {
      'fs-promise': {
        readFile: (fullPath) => {
          const relPath = path.relative(TEMPLATE_PATH, fullPath);
          switch(relPath) {
            case path.join('templates', PATH_1): {
              let content = `Hello, {{data.exampleName}}.`;
              return Promise.resolve(new Buffer(content));
            }
            case path.join('templates', 'documents/html.tmpl'): {
              return Promise.resolve(new Buffer('{{{content}}}'));
            }
          }

          return Promise.reject(new Error('Unknown template path: ' + fullPath));
        },
      },
    });
    const ViewGroup = proxyquire('../../src/models/ViewGroup', {
      './View': View,
    });
    const TemplateManager = proxyquire('../../src/controllers/TemplateManager', {
      '../models/View': View,
      '../models/ViewGroup': ViewGroup,
    });

    const templateManager = new TemplateManager({
      relativePath: TEMPLATE_PATH,
    });
    return templateManager.render({
      views: [
        {
          templatePath: PATH_1,
          data: DATA,
        },
      ],
    })
    .then((templateResult) => {
      templateResult.should.equal(`Hello, World.`);
    });
  });

  it('should be able render with partials', function() {
    const TEMPLATE_PATH = 'tmpl-path';
    const PATH_1 = 'example/path/1';

    const View = proxyquire('../../src/models/View', {
      'fs-promise': {
        readFile: (fullPath) => {
          const relPath = path.relative(TEMPLATE_PATH, fullPath);
          switch(relPath) {
            case path.join('templates', PATH_1): {
              let content = `---\npartials:\n - static/example-partial.html\n---Hello, {{> static/example-partial.html}}.`;
              return Promise.resolve(new Buffer(content));
            }
            case path.join('templates', 'documents/html.tmpl'): {
              return Promise.resolve(new Buffer('{{{content}}}'));
            }
            case path.join('templates/example/path/1/static/example-partial.html'): {
              return Promise.resolve(new Buffer('Partial Contents'));
            }
          }

          return Promise.reject(new Error('Unknown template path: ' + fullPath));
        },
      },
    });
    const ViewGroup = proxyquire('../../src/models/ViewGroup', {
      './View': View,
    });
    const TemplateManager = proxyquire('../../src/controllers/TemplateManager', {
      '../models/View': View,
      '../models/ViewGroup': ViewGroup,
    });

    const templateManager = new TemplateManager({
      relativePath: TEMPLATE_PATH,
    });
    return templateManager.render({
      views: [
        {
          templatePath: PATH_1,
        },
      ],
    })
    .then((templateResult) => {
      templateResult.should.equal(`Hello, Partial Contents.`);
    });
  });
});
