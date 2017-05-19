const proxyquire = require('proxyquire');

describe('View Group Model', function() {
  it('should be able to merge view + child view details', function() {
    const View = proxyquire('../../src/models/View', {
      'fs-promise': {
        readFile: (fullPath) => {
          if (fullPath === 'template-dir/view-1/example/view/template.tmpl') {
            return Promise.resolve(new Buffer('view-1-template-content. '));
          } else if(fullPath === 'template-dir/view-2/example/view/template.tmpl') {
            return Promise.resolve(new Buffer('view-2-template-content. '));
          } else if(fullPath === 'static-dir/view-1/styles/view-1-inline.css') {
            return Promise.resolve(new Buffer('CONTENT::view-1-inline-styles'));
          } else if(fullPath === 'static-dir/view-2/styles/view-2-inline.css') {
            return Promise.resolve(new Buffer('CONTENT::view-2-inline-styles'));
          } else if(fullPath === 'template-dir/example/view/template.tmpl') {
            return Promise.resolve(new Buffer('template-contents. {{data.example}}. {{data.hello}}. {{{content}}}'));
          } else if(fullPath === 'static-dir/styles/2-inline.css') {
            return Promise.resolve(new Buffer('CONTENT::static-dir-styles-2-inline.css'));
          }
          return Promise.reject(new Error('Unknown template path: ' + fullPath));
        },
      },
    });
    const ViewGroup = proxyquire('../../src/models/ViewGroup', {
      './View': View,
    });

    const getViewOptions = (name) => {
      return {
        templateDir: `template-dir/${name}/`,
        templatePath: `template-dir/${name}/example/view/template.tmpl`,
        staticPath: `static-dir/${name}/`,
        partials: {
          'template-dir/example-template-1':
            `example-template-1-content-${name}`,
          'template-dir/example-template-2':
            `example-template-2-content-${name}`,
        },
        styles: [
          `/styles/${name}.css`,
          `/styles/${name}-inline.css`,
        ],
        scripts: [
          `/scripts/${name}-1.js`,
          `/scripts/${name}-2-sync.js`,
        ],
        data: {
          example: `data-${name}`,
          hello: `world-${name}`,
        },
      };
    };

    const view1 = new View(getViewOptions('view-1'));
    const view2 = new View(getViewOptions('view-2'));

    const exampleViewGroup = new ViewGroup({
      templateDir: 'template-dir/',
      templatePath: 'template-dir/example/view/template.tmpl',
      staticPath: 'static-dir/',
      views: [
        view1,
        view2,
      ],
      partials: {
        'template-dir/example-template-1': 'example-template-1-content',
        'template-dir/example-template-2': 'example-template-2-content',
      },
      styles: [
        'styles/1.css',
        'styles/2-inline.css',
      ],
      scripts: [
        'scripts/1.js',
        'scripts/2-sync.js',
      ],
      data: {
        example: 'data',
        hello: 'world',
      },
    });

    return exampleViewGroup.getViewDetails()
    .then((viewDetails) => {
      viewDetails.should.deep.equal({
        scripts: {
          async: [
            'scripts/1.js',
            '/scripts/view-1-1.js',
            '/scripts/view-2-1.js',
          ],
          sync: [
            'scripts/2-sync.js',
            '/scripts/view-1-2-sync.js',
            '/scripts/view-2-2-sync.js',
          ],
        },
        styles: {
          inline: [
            'CONTENT::static-dir-styles-2-inline.css',
            'CONTENT::view-1-inline-styles',
            'CONTENT::view-2-inline-styles',
          ],
          async: [
            'styles/1.css',
            '/styles/view-1.css',
            '/styles/view-2.css',
          ],
        },
        template: 'template-contents. data. world. view-1-template-content. view-2-template-content. ',
      }
      );
    });
  });
});
