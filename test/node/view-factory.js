const path = require('path');
const expect = require('chai').expect;

const ViewFactory = require('../../src/factory/view-factory.js');

describe('ViewFactory', function() {
  it('should collapse a full tree with nest partials, styles, scripts etc.', function() {
    return ViewFactory._generateCollapsedView(path.join(__dirname, '../static-examples/view-examples/nested/view.tmpl'))
    .then((collapsedView) => {
      expect(collapsedView).to.deep.equal({
        content: 'contents::view-example-1. {{> ./partials/example-1.tmpl}} {{> ./partials/example-2.tmpl}} {{ data.hello }}',
        partialContents: {
          './partials/example-1.tmpl': 'content::partials-example-1.',
          './partials/example-2.tmpl': 'content::partials-example-2.{{> example-3.tmpl}}',
          'example-3.tmpl': 'content::partials-example-3.{{> ./example-4.tmpl}}',
          './example-4.tmpl': 'content::partials-example-4.',
        },
        styles: {
          inline: [
            './styles/example-1.css',
            './styles/example-2.css',
            '../styles/example-3.css',
            '../styles/example-4.css',
            '../styles/example-5.css',
            '../styles/example-6.css',
            '../styles/example-7.css',
          ],
          sync: [
            '/styles/example-1.css',
            '/styles/example-2.css',
            '/styles/example-3.css',
            '/styles/example-4.css',
            '/styles/example-5.css',
            '/styles/example-6.css',
            '/styles/example-7.css',
          ],
          async: [
            '/styles/example-1.css',
            '/styles/example-2.css',
            '/styles/example-3.css',
            '/styles/example-4.css',
            '/styles/example-5.css',
            '/styles/example-6.css',
            '/styles/example-7.css',
          ],
        },
        scripts: {
          inline: [
            './scripts/example-1.js',
            './scripts/example-2.js',
            '../scripts/example-3.js',
            '../scripts/example-4.js',
            '../scripts/example-5.js',
            '../scripts/example-6.js',
            '../scripts/example-7.js',
          ],
          sync: [
            '/scripts/example-1.js',
            '/scripts/example-2.js',
            '/scripts/example-3.js',
            '/scripts/example-4.js',
            '/scripts/example-5.js',
            '/scripts/example-6.js',
            '/scripts/example-7.js',
          ],
          async: [
            '/scripts/example-1.js',
            '/scripts/example-2.js',
            '/scripts/example-3.js',
            '/scripts/example-4.js',
            '/scripts/example-5.js',
            '/scripts/example-6.js',
            '/scripts/example-7.js',
          ],
        },
      });
    });
  });

  it('should render a full nested example', function() {
    const viewPath = path.join(__dirname, '../static-examples/view-examples/nested/view.tmpl');
    const data = {
      hello: 'world',
    };
    return ViewFactory.renderView(viewPath, data)
    .then((renderedView) => {
      expect(renderedView).to.equal(`contents::view-example-1. content::partials-example-1. content::partials-example-2.content::partials-example-3.content::partials-example-4. world`);
    });
  });

  // TODO: Test Partial Linking Loop

  it('should handle duplicate partial names', function() {
    return ViewFactory._generateCollapsedView(path.join(__dirname, '../static-examples/view-examples/duplicate-partial-names/view.tmpl'))
    .then(() => {
      throw new Error('Expected the generateView call to fail due to two partials having the same name. Promise did not reject.');
    }, (err) => {
      expect(err.name).to.equal('duplicate-partial-name');
      expect(err.message.indexOf('./same-name.tmpl')).to.not.equal(-1);
    });
  });

  it('should be able to collapse a view with child views', function() {
    const examplePath = path.join(__dirname, '../static-examples/view-examples/nested');
    const viewPath = path.join(examplePath, 'view-group-primary.tmpl');
    const childViews = [
      {
        templatePath: path.join(examplePath, 'views/sub-view-1.tmpl'),
        data: {
          hello: 'something',
        },
      }, {
        templatePath: path.join(examplePath, 'views/sub-view-2.tmpl'),
        data: {
          hello: 'else',
        },
      },
    ];
    return ViewFactory._generateCollapsedViewGroup(viewPath, childViews)
    .then(({collapsedParentView, renderedChildViews}) => {
      console.log(collapsedParentView);
      expect(collapsedParentView).to.deep.equal({
        content: 'contents::view-group-primary.\n{{> ./partials/example-4.tmpl}}\n\n{{{content}}}\n{{ data.hello }}',
        partialContents: {
          './partials/example-4.tmpl': 'content::partials-example-4.',
        },
        styles: {
          inline: [
            './styles/example-1.css',
            './styles/example-2.css',
            './styles/example-3.css',
            '../styles/example-6.css',
            '../styles/example-7.css',
            '../styles/example-5.css',
            './../styles/example-4.css',
          ],
          sync: [
            '/styles/example-1.css',
            '/styles/example-2.css',
            '/styles/example-6.css',
            '/styles/example-7.css',
            '/styles/example-5.css',
            '/styles/example-3.css',
            '/styles/example-4.css',
          ],
          async: [
            '/styles/example-1.css',
            '/styles/example-2.css',
            '/styles/example-6.css',
            '/styles/example-7.css',
            '/styles/example-5.css',
            '/styles/example-3.css',
            '/styles/example-4.css',
          ],
        },
        scripts: {
          inline: [
            './scripts/example-1.js',
            './scripts/example-2.js',
            './scripts/example-4.js',
            '../scripts/example-6.js',
            '../scripts/example-7.js',
            '../scripts/example-5.js',
            './../scripts/example-3.js',
          ],
          sync: [
            '/scripts/example-1.js',
            '/scripts/example-2.js',
            '/scripts/example-6.js',
            '/scripts/example-7.js',
            '/scripts/example-5.js',
            '/scripts/example-3.js',
            '/scripts/example-4.js',
          ],
          async: [
            '/scripts/example-1.js',
            '/scripts/example-2.js',
            '/scripts/example-6.js',
            '/scripts/example-7.js',
            '/scripts/example-5.js',
            '/scripts/example-3.js',
            '/scripts/example-4.js',
          ],
        },
      });

      expect(renderedChildViews).to.deep.equal([
        'contents::views/sub-view-1. content::partials-example-3.content::partials-example-4. something',
        'contents::views/sub-view-2. content::partials-example-4. else',
      ]);
    });
  });

  it('should be able to render a view with child views', function() {
    const examplePath = path.join(__dirname, '../static-examples/view-examples/nested');
    const viewPath = path.join(examplePath, 'view-group-primary.tmpl');
    const childViews = [
      {
        templatePath: path.join(examplePath, 'views/sub-view-1.tmpl'),
        data: {
          hello: 'something',
        },
      }, {
        templatePath: path.join(examplePath, 'views/sub-view-2.tmpl'),
        data: {
          hello: 'else',
        },
      },
    ];
    const data = {
      hello: 'world',
    };
    return ViewFactory.renderViewGroup(viewPath, childViews, data)
    .then((renderedView) => {
      expect(renderedView).to.equal(`contents::view-group-primary.
content::partials-example-4.
contents::views/sub-view-1. content::partials-example-3.content::partials-example-4. somethingcontents::views/sub-view-2. content::partials-example-4. else
world`);
    });
  });
});
