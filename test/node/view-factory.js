const path = require('path');
const expect = require('chai').expect;

const ViewFactory = require('../../src/factory/view-factory.js');

describe('ViewFactory', function() {
  it('should collapse a full tree with nest partials, styles, scripts etc.', function() {
      const examplePath = path.join(__dirname, '../static-examples/view-examples/nested/');
      return ViewFactory._generateCollapsedViewGroup(examplePath, examplePath, 'view.tmpl', [])
      .then((collapsedParentView) => {
        expect(collapsedParentView).to.deep.equal({
          content: 'contents::view-example-1. {{> ./partials/example-1.tmpl}} {{> ./partials/example-2.tmpl}} {{ data.hello }}',
          partialContents: {
            './partials/example-1.tmpl': 'content::partials-example-1.',
            './partials/example-2.tmpl': 'content::partials-example-2.{{> example-3.tmpl}}',
            'example-3.tmpl': 'content::partials-example-3.{{> ./example-4.tmpl}}',
            './example-4.tmpl': 'content::partials-example-4.',
          },
          styles: {
            raw: [],
            inline: [
              path.join(examplePath, '/styles/example-1.css'),
              path.join(examplePath, '/styles/example-2.css'),
              path.join(examplePath, '/styles/example-3.css'),
              path.join(examplePath, '/styles/example-4.css'),
              path.join(examplePath, '/styles/example-5.css'),
              path.join(examplePath, '/styles/example-6.css'),
              path.join(examplePath, '/styles/example-7.css'),
            ],
            sync: [
              '/styles/example-1.eb75a8ea.css',
              '/styles/example-2.34f87d63.css',
              '/styles/example-3.93312274.css',
              '/styles/example-4.eb870daf.css',
              '/styles/example-5.f33a62eb.css',
              '/styles/example-6.29641e9a.css',
              '/styles/example-7.37abc17f.css',
            ],
            async: [
              '/styles/example-1.eb75a8ea.css',
              '/styles/example-2.34f87d63.css',
              '/styles/example-3.93312274.css',
              '/styles/example-4.eb870daf.css',
              '/styles/example-5.f33a62eb.css',
              '/styles/example-6.29641e9a.css',
              '/styles/example-7.37abc17f.css',
            ],
          },
          scripts: {
            raw: [],
            inline: [
              path.join(examplePath, '/scripts/example-1.js'),
              path.join(examplePath, '/scripts/example-2.js'),
              path.join(examplePath, '/scripts/example-3.js'),
              path.join(examplePath, '/scripts/example-4.js'),
              path.join(examplePath, '/scripts/example-5.js'),
              path.join(examplePath, '/scripts/example-6.js'),
              path.join(examplePath, '/scripts/example-7.js'),
            ],
            sync: [
              '/scripts/example-1.54423a17.js',
              '/scripts/example-2.40c4339b.js',
              '/scripts/example-3.b0c813fe.js',
              '/scripts/example-4.77971205.js',
              '/scripts/example-5.c1137ee4.js',
              '/scripts/example-6.445d43af.js',
              '/scripts/example-7.8d9039ee.js',
            ],
            async: [
              '/scripts/example-1.54423a17.js',
              '/scripts/example-2.40c4339b.js',
              '/scripts/example-3.b0c813fe.js',
              '/scripts/example-4.77971205.js',
              '/scripts/example-5.c1137ee4.js',
              '/scripts/example-6.445d43af.js',
              '/scripts/example-7.8d9039ee.js',
            ],
          },
          views: [],
        });
      });
    });

  it('should render a full nested example', function() {
    const examplePath = path.join(__dirname, '../static-examples/view-examples/nested/');
    const data = {
      hello: 'world',
    };
    return ViewFactory.renderViewGroup(examplePath, examplePath, 'view.tmpl', [], {data})
    .then((renderedView) => {
      expect(renderedView).to.equal(`contents::view-example-1. content::partials-example-1. content::partials-example-2.content::partials-example-3.content::partials-example-4. world`);
    });
  });

  // TODO: Test Partial Linking Loop

  it('should handle duplicate partial names', function() {
    const examplePath = path.join(__dirname, '../static-examples/view-examples/duplicate-partial-names/');
    return ViewFactory._generateCollapsedViewGroup(examplePath, examplePath, 'view.tmpl')
    .then(() => {
      throw new Error('Expected the generateView call to fail due to two partials having the same name. Promise did not reject.');
    }, (err) => {
      expect(err.name).to.equal('duplicate-partial-name');
      expect(err.message.indexOf('./same-name.tmpl')).to.not.equal(-1);
    });
  });

  it('should be able to collapse a view with child views', function() {
    const examplePath = path.join(__dirname, '../static-examples/view-examples/nested');
    const viewPath = 'view-group-1/view-group-primary.tmpl';
    const childViews = [
      {
        templatePath: 'views/sub-view-1.tmpl',
        data: {
          hello: 'something',
        },
      }, {
        templatePath: 'views/sub-view-2.tmpl',
        data: {
          hello: 'else',
        },
      },
    ];
    return ViewFactory._generateCollapsedViewGroup(examplePath, examplePath, viewPath, childViews)
    .then((collapsedParentView) => {
      expect(collapsedParentView).to.deep.equal({
        content: 'contents::view-group-primary.\n{{> ../partials/example-4.tmpl}}\n\n{{{content}}}\n{{ data.hello }}',
        partialContents: {
          '../partials/example-4.tmpl': 'content::partials-example-4.',
        },
        styles: {
          raw: [],
          inline: [
            path.join(examplePath, '/styles/example-1.css'),
            path.join(examplePath, '/styles/example-2.css'),
            path.join(examplePath, '/styles/example-3.css'),
            path.join(examplePath, '/styles/example-6.css'),
            path.join(examplePath, '/styles/example-7.css'),
            path.join(examplePath, '/styles/example-4.css'),
            path.join(examplePath, '/styles/example-5.css'),
          ],
          sync: [
            '/styles/example-1.eb75a8ea.css',
            '/styles/example-2.34f87d63.css',
            '/styles/example-6.29641e9a.css',
            '/styles/example-7.37abc17f.css',
            '/styles/example-3.93312274.css',
            '/styles/example-4.eb870daf.css',
            '/styles/example-5.f33a62eb.css',
          ],
          async: [
            '/styles/example-1.eb75a8ea.css',
            '/styles/example-2.34f87d63.css',
            '/styles/example-6.29641e9a.css',
            '/styles/example-7.37abc17f.css',
            '/styles/example-3.93312274.css',
            '/styles/example-4.eb870daf.css',
            '/styles/example-5.f33a62eb.css',
          ],
        },
        scripts: {
          raw: [],
          inline: [
            path.join(examplePath, '/scripts/example-1.js'),
            path.join(examplePath, '/scripts/example-2.js'),
            path.join(examplePath, '/scripts/example-4.js'),
            path.join(examplePath, '/scripts/example-6.js'),
            path.join(examplePath, '/scripts/example-7.js'),
            path.join(examplePath, '/scripts/example-3.js'),
            path.join(examplePath, '/scripts/example-5.js'),
          ],
          sync: [
            '/scripts/example-1.54423a17.js',
            '/scripts/example-2.40c4339b.js',
            '/scripts/example-6.445d43af.js',
            '/scripts/example-7.8d9039ee.js',
            '/scripts/example-3.b0c813fe.js',
            '/scripts/example-4.77971205.js',
            '/scripts/example-5.c1137ee4.js',
          ],
          async: [
            '/scripts/example-1.54423a17.js',
            '/scripts/example-2.40c4339b.js',
            '/scripts/example-6.445d43af.js',
            '/scripts/example-7.8d9039ee.js',
            '/scripts/example-3.b0c813fe.js',
            '/scripts/example-4.77971205.js',
            '/scripts/example-5.c1137ee4.js',
          ],
        },
        views: [
          {
            content: 'contents::views/sub-view-1. {{> ./../partials/example-3.tmpl}} {{ data.hello }}',
            data: {
              hello: 'something',
            },
            partialContents: {
              './../partials/example-3.tmpl': 'content::partials-example-3.{{> ./example-4.tmpl}}',
              './example-4.tmpl': 'content::partials-example-4.',
            },
            views: [],
          }, {
            content: 'contents::views/sub-view-2. {{> ../partials/example-4.tmpl}} {{ data.hello }}',
            data: {
              hello: 'else',
            },
            partialContents: {
              '../partials/example-4.tmpl': 'content::partials-example-4.',
            },
            views: [],
          },
        ],
      });
    });
  });

  it('should be able to render a view with child views', function() {
    const examplePath = path.join(__dirname, '../static-examples/view-examples/nested');
    const viewPath = 'view-group-1/view-group-primary.tmpl';
    const childViews = [
      {
        templatePath: 'views/sub-view-1.tmpl',
        data: {
          hello: 'something',
        },
      }, {
        templatePath: 'views/sub-view-2.tmpl',
        data: {
          hello: 'else',
        },
      },
    ];
    const data = {
      hello: 'world',
    };
    return ViewFactory.renderViewGroup(examplePath, examplePath, viewPath, childViews, {data})
    .then((renderedView) => {
      expect(renderedView).to.equal(`contents::view-group-primary.
content::partials-example-4.
contents::views/sub-view-1. content::partials-example-3.content::partials-example-4. somethingcontents::views/sub-view-2. content::partials-example-4. else
world`);
    });
  });

  it('should be able to collapse a view with several view groups', function() {
    const examplePath = path.join(__dirname, '../static-examples/view-examples/nested');
    const viewPath = 'view-group-1/view-group-primary.tmpl';
    const childViews = [
      {
        templatePath: 'view-group-2/view-group-secondary.tmpl',
        data: {
          hello: 'second-level',
        },
        views: [
          {
            templatePath: 'views/sub-view-1.tmpl',
            data: {
              hello: 'something',
            },
          }, {
            templatePath: 'views/sub-view-2.tmpl',
            data: {
              hello: 'else',
            },
          },
        ],
      },
    ];
    return ViewFactory._generateCollapsedViewGroup(examplePath, examplePath, viewPath, childViews)
    .then((collapsedParentView) => {
      expect(collapsedParentView).to.deep.equal({
        content: 'contents::view-group-primary.\n{{> ../partials/example-4.tmpl}}\n\n{{{content}}}\n{{ data.hello }}',
        partialContents: {
          '../partials/example-4.tmpl': 'content::partials-example-4.',
        },
        styles: {
          raw: [],
          inline: [
            path.join(examplePath, '/styles/example-1.css'),
            path.join(examplePath, '/styles/example-2.css'),
            path.join(examplePath, '/styles/example-3.css'),
            path.join(examplePath, '/styles/example-6.css'),
            path.join(examplePath, '/styles/example-7.css'),
            path.join(examplePath, '/styles/example-8.css'),
            path.join(examplePath, '/styles/example-9.css'),
            path.join(examplePath, '/styles/example-4.css'),
            path.join(examplePath, '/styles/example-5.css'),
          ],
          sync: [
            '/styles/example-1.eb75a8ea.css',
            '/styles/example-2.34f87d63.css',
            '/styles/example-6.29641e9a.css',
            '/styles/example-7.37abc17f.css',
            '/styles/example-8.2df12fae.css',
            '/styles/example-9.e16984fe.css',
            '/styles/example-3.93312274.css',
            '/styles/example-4.eb870daf.css',
            '/styles/example-5.f33a62eb.css',
          ],
          async: [
            '/styles/example-1.eb75a8ea.css',
            '/styles/example-2.34f87d63.css',
            '/styles/example-6.29641e9a.css',
            '/styles/example-7.37abc17f.css',
            '/styles/example-8.2df12fae.css',
            '/styles/example-9.e16984fe.css',
            '/styles/example-3.93312274.css',
            '/styles/example-4.eb870daf.css',
            '/styles/example-5.f33a62eb.css',
          ],
        },
        scripts: {
          raw: [],
          inline: [
            path.join(examplePath, '/scripts/example-1.js'),
            path.join(examplePath, '/scripts/example-2.js'),
            path.join(examplePath, '/scripts/example-4.js'),
            path.join(examplePath, '/scripts/example-6.js'),
            path.join(examplePath, '/scripts/example-7.js'),
            path.join(examplePath, '/scripts/example-8.js'),
            path.join(examplePath, '/scripts/example-9.js'),
            path.join(examplePath, '/scripts/example-3.js'),
            path.join(examplePath, '/scripts/example-5.js'),
          ],
          sync: [
            '/scripts/example-1.54423a17.js',
            '/scripts/example-2.40c4339b.js',
            '/scripts/example-6.445d43af.js',
            '/scripts/example-7.8d9039ee.js',
            '/scripts/example-8.080eb6fb.js',
            '/scripts/example-9.c84d210b.js',
            '/scripts/example-3.b0c813fe.js',
            '/scripts/example-4.77971205.js',
            '/scripts/example-5.c1137ee4.js',
          ],
          async: [
            '/scripts/example-1.54423a17.js',
            '/scripts/example-2.40c4339b.js',
            '/scripts/example-6.445d43af.js',
            '/scripts/example-7.8d9039ee.js',
            '/scripts/example-8.080eb6fb.js',
            '/scripts/example-9.c84d210b.js',
            '/scripts/example-3.b0c813fe.js',
            '/scripts/example-4.77971205.js',
            '/scripts/example-5.c1137ee4.js',
          ],
        },
        views: [
          {
            content: 'contents::view-group-secondary.\n{{> ../partials/example-5.tmpl}}\n\n{{{content}}}\n{{ data.hello }}',
            data: {
              hello: 'second-level',
            },
            partialContents: {
              '../partials/example-5.tmpl': 'content::partials-example-5.',
            },
            views: [
              {
                content: 'contents::views/sub-view-1. {{> ./../partials/example-3.tmpl}} {{ data.hello }}',
                data: {
                  hello: 'something',
                },
                partialContents: {
                  './../partials/example-3.tmpl': 'content::partials-example-3.{{> ./example-4.tmpl}}',
                  './example-4.tmpl': 'content::partials-example-4.',
                },
                views: [],
              }, {
                content: 'contents::views/sub-view-2. {{> ../partials/example-4.tmpl}} {{ data.hello }}',
                data: {
                  hello: 'else',
                },
                partialContents: {
                  '../partials/example-4.tmpl': 'content::partials-example-4.',
                },
                views: [],
              },
            ],
          },
        ],
      });
    });
  });

  it('should be able to render a view with several view groups', function() {
    const examplePath = path.join(__dirname, '../static-examples/view-examples/nested');
    const viewPath = 'view-group-1/view-group-primary.tmpl';
    const childViews = [
      {
        templatePath: 'view-group-2/view-group-secondary.tmpl',
        data: {
          hello: 'second-level',
        },
        views: [
          {
            templatePath: 'views/sub-view-1.tmpl',
            data: {
              hello: 'something',
            },
          }, {
            templatePath: 'views/sub-view-2.tmpl',
            data: {
              hello: 'else',
            },
          },
        ],
      },
    ];
    const data = {
      hello: 'world',
    };
    return ViewFactory.renderViewGroup(examplePath, examplePath, viewPath, childViews, {data})
    .then((renderedView) => {
      expect(renderedView).to.equal(`contents::view-group-primary.
content::partials-example-4.
contents::view-group-secondary.
content::partials-example-5.
contents::views/sub-view-1. content::partials-example-3.content::partials-example-4. somethingcontents::views/sub-view-2. content::partials-example-4. else
second-level
world`);
    });
  });

  it('should be able to render the styles and scripts', function() {
    const examplePath = path.join(__dirname, '../static-examples/view-examples/document-example/');
    return ViewFactory.renderViewGroup(examplePath, examplePath, 'document.tmpl', null, {
      styles: {
        inline: [
          path.join(examplePath, '/styles/example-direct.css'),
        ],
        async: ['/styles/example-direct.css'],
        sync: ['/styles/example-direct.css'],
      },
      scripts: {
        inline: [
          path.join(examplePath, '/scripts/example-direct.js'),
        ],
        async: ['/scripts/example-direct.js'],
        sync: ['/scripts/example-direct.js'],
      },
    })
    .then((renderedDocument) => {
      expect(renderedDocument).to.equal(
`<style>content::styles/example-direct.css
</style>
<style>content::styles/example-inline.css
</style>
<link src="/styles/example-direct.c03c5abf.css" />
<link src="/styles/example-sync.css" />
'/styles/example-direct.c03c5abf.css',
'/styles/example-async.css',
<script>console.log('example-direct.js');
</script>
<script>console.log('example-inline.js');
</script>
<script src="/scripts/example-direct.5beb9cd2.js"></script>
<script src="/scripts/example-sync.js"></script>
<script src="/scripts/example-direct.5beb9cd2.js" async defer></script>
<script src="/scripts/example-async.js" async defer></script>
`);
    });
  });
});
