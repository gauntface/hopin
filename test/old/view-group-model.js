const proxyquire = require('proxyquire');
require('chai').should();

const getViewOptions = (name) => {
  return {
    relativePath: `.`,
    templateDir: `template-dir/${name}/`,
    templatePath: `template-dir/${name}/example/view/template.tmpl`,
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

describe('View Group Model', function() {
  it('should be able to merge view + child view details', function() {
    const View = proxyquire('../../src/models/View', {
      'fs-promise': {
        readFile: (fullPath) => {
          if (fullPath === 'template-dir/view-1/example/view/template.tmpl') {
            return Promise.resolve(new Buffer('view-1-template-content. '));
          } else if(fullPath === 'template-dir/view-2/example/view/template.tmpl') {
            return Promise.resolve(new Buffer('view-2-template-content. '));
          } else if(fullPath === 'styles/view-1-inline.css') {
            return Promise.resolve(new Buffer('CONTENT::view-1-inline-styles'));
          } else if(fullPath === 'styles/view-2-inline.css') {
            return Promise.resolve(new Buffer('CONTENT::view-2-inline-styles'));
          } else if(fullPath === 'template-dir/example/view/template.tmpl') {
            return Promise.resolve(new Buffer('template-contents. {{data.example}}. {{data.hello}}. {{{content}}}'));
          } else if(fullPath === 'styles/2-inline.css') {
            return Promise.resolve(new Buffer('CONTENT::static-dir-styles-2-inline.css'));
          }
          return Promise.reject(new Error('Unknown template path: ' + fullPath));
        },
      },
    });
    const ViewGroup = proxyquire('../../src/models/ViewGroup', {
      './View': View,
    });

    const view1 = new View(getViewOptions('view-1'));
    const view2 = new View(getViewOptions('view-2'));

    const exampleViewGroup = new ViewGroup({
      relativePath: `.`,
      templateDir: 'template-dir/',
      templatePath: 'template-dir/example/view/template.tmpl',
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

  it('should render with styles for nested view groups', function() {
    const View = proxyquire('../../src/models/View', {
      'fs-promise': {
        readFile: (fullPath) => {
          if (fullPath === 'template-dir/vg-1-view-1/example/view/template.tmpl') {
            return Promise.resolve(new Buffer('vg-1-view-1-template-content. '));
          } else if(fullPath === 'template-dir/vg-1-view-2/example/view/template.tmpl') {
            return Promise.resolve(new Buffer('vg-1-view-2-template-content. '));
          } else if(fullPath === 'styles/vg-1-view-1-inline.css') {
            return Promise.resolve(new Buffer('CONTENT::vg-1-view-1-inline-styles'));
          } else if(fullPath === 'styles/vg-1-view-2-inline.css') {
            return Promise.resolve(new Buffer('CONTENT::vg-1-view-2-inline-styles'));
          } else if(fullPath === 'template-dir/example/view/vg-1-template.tmpl') {
            return Promise.resolve(new Buffer('vg-1-template-contents. {{data.example}}. {{data.hello}}. {{{content}}}'));
          } else if(fullPath === 'styles/vg-1-2-inline.css') {
            return Promise.resolve(new Buffer('CONTENT::vg-1-static-dir-styles-2-inline.css'));
          } else if(fullPath === 'template-dir/example/view/vg-2-template.tmpl') {
            return Promise.resolve(new Buffer('vg-2-template-contents. {{data.example}}. {{data.hello}}. {{{content}}}'));
          } else if(fullPath === 'styles/vg-2-view-1-inline.css') {
            return Promise.resolve(new Buffer('CONTENT::vg-2-view-1-inline-styles'));
          } else if(fullPath === 'styles/vg-2-view-2-inline.css') {
            return Promise.resolve(new Buffer('CONTENT::vg-2-view-2-inline-styles'));
          } else if(fullPath === 'styles/vg-2-2-inline.css') {
            return Promise.resolve(new Buffer('CONTENT::vg-2-static-dir-styles-2-inline.css'));
          }
          return Promise.reject(new Error('Unknown template path: ' + fullPath));
        },
      },
    });
    const ViewGroup = proxyquire('../../src/models/ViewGroup', {
      './View': View,
    });

    const view1 = new View(getViewOptions('vg-1-view-1'));
    const view2 = new View(getViewOptions('vg-1-view-2'));

    const exampleViewGroup1 = new ViewGroup({
      relativePath: `.`,
      templateDir: 'template-dir/',
      templatePath: 'template-dir/example/view/vg-1-template.tmpl',
      views: [
        view1,
        view2,
      ],
      partials: {
        'template-dir/example-template-1': 'example-template-1-content',
        'template-dir/example-template-2': 'example-template-2-content',
      },
      styles: [
        'styles/vg-1-1.css',
        'styles/vg-1-2-inline.css',
      ],
      scripts: [
        'scripts/vg-1-1.js',
        'scripts/vg-1-2-sync.js',
      ],
      data: {
        example: 'data-vg-1',
        hello: 'world-vg-1',
      },
    });

    const exampleViewGroup2 = new ViewGroup({
      relativePath: `.`,
      templateDir: 'template-dir/',
      templatePath: 'template-dir/example/view/vg-2-template.tmpl',
      views: [
        exampleViewGroup1,
      ],
      partials: {
        'template-dir/example-template-1': 'example-template-1-content',
        'template-dir/example-template-2': 'example-template-2-content',
      },
      styles: [
        'styles/vg-2-1.css',
        'styles/vg-2-2-inline.css',
      ],
      scripts: [
        'scripts/vg-2-1.js',
        'scripts/vg-2-2-sync.js',
      ],
      data: {
        example: 'data-vg-2',
        hello: 'world-vg-2',
      },
    });

    return exampleViewGroup2.getViewDetails()
    .then((viewDetails) => {
      viewDetails.should.deep.equal({
        scripts: {
          async: [
            'scripts/vg-2-1.js',
            'scripts/vg-1-1.js',
            '/scripts/vg-1-view-1-1.js',
            '/scripts/vg-1-view-2-1.js',
          ],
          sync: [
            'scripts/vg-2-2-sync.js',
            'scripts/vg-1-2-sync.js',
            '/scripts/vg-1-view-1-2-sync.js',
            '/scripts/vg-1-view-2-2-sync.js',
          ],
        },
        styles: {
          inline: [
            'CONTENT::vg-2-static-dir-styles-2-inline.css',
            'CONTENT::vg-1-static-dir-styles-2-inline.css',
            'CONTENT::vg-1-view-1-inline-styles',
            'CONTENT::vg-1-view-2-inline-styles',
          ],
          async: [
            'styles/vg-2-1.css',
            'styles/vg-1-1.css',
            '/styles/vg-1-view-1.css',
            '/styles/vg-1-view-2.css',
          ],
        },
        template: 'vg-2-template-contents. data-vg-2. world-vg-2. vg-1-template-contents. data-vg-1. world-vg-1. vg-1-view-1-template-content. vg-1-view-2-template-content. ',
      }
      );
    });
  });
});
