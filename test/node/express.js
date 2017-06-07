const path = require('path');
const fetch = require('node-fetch');
const clearRequire = require('clear-require');

require('chai').should();

const testRoute = (route, expectedText) => {
  return fetch(route)
  .then((result) => {
    // if(!result.ok) {
    //   throw new Error(`Result not OK - '${route}'`);
    // }

    return result.text()
    .then((responseText) => {
      responseText.should.equal(expectedText);
    });
  });
};

const testContentType = (route, expectedType) => {
  return fetch(route)
  .then((result) => {
    result.headers.get('Content-Type').indexOf(expectedType).should.equal(0);
  });
};

describe('Test Express Usage', function() {
  let server;
  let serverUrl;
  const testContentUrls = [
    {
      url: `/`,
      expectedResult: 'basic-example:home',
    }, {
      url: `/test`,
      expectedResult: 'basic-example:test',
    }, {
      url: `/test/action`,
      expectedResult: 'basic-example:test:action',
    }, {
      url: `/test/basicview`,
      expectedResult: `'/styles/async.css',
'/scripts/async.js',
content::view content::view-1 content::view-2content::view-3 hai`,
    },
  ];
  const testTypeUrls = [
    {
      url: `/contenttype/`,
      expectedResult: 'text/html',
    }, {
      url: `/contenttype/json`,
      expectedResult: 'application/json',
    }, {
      url: `/contenttype/custom`,
      expectedResult: 'text/madeup',
    },
  ];

  before(function() {
    clearRequire('../../src/index');
    const Hopin = require('../../src/index');
    server = new Hopin({
      relativePath: path.join(__dirname, '..', 'static-examples', 'basic-example'),
    });
    serverUrl = `http://localhost:${3000}`;

    return server.startServer(3000);
  });

  after(function() {
    return server.stopServer();
  });

  testContentUrls.forEach((singleEntry) => {
    it(`should be able to route ${singleEntry.url}`, function() {
      return testRoute(`${serverUrl}${singleEntry.url}`, singleEntry.expectedResult);
    });
  });

  testTypeUrls.forEach((singleEntry) => {
    it(`should be able to get correct response type ${singleEntry.url}`, function() {
      return testContentType(`${serverUrl}${singleEntry.url}`, singleEntry.expectedResult);
    });
  });
});
