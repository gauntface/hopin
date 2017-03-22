const parseUrl = require('../../src/utils/parse-url');

require('chai').should();

describe('Parse URL [Utils]', function() {
  it(`should parse '/'`, function() {
    const result = parseUrl('/');
    (typeof result.controller).should.deep.equal('undefined');
    (typeof result.action).should.equal('undefined');
    (result.type === null).should.equal(true);
  });

  it(`should parse '/example'`, function() {
    const result = parseUrl('/example');
    result.controller.should.equal('example');
    (typeof result.action).should.equal('undefined');
    (result.type === null).should.equal(true);
  });

  it(`should parse '/example/'`, function() {
    const result = parseUrl('/example/');
    result.controller.should.equal('example');
    (typeof result.action).should.equal('undefined');
    (result.type === null).should.equal(true);
  });

  it(`should parse '/example.json'`, function() {
    const result = parseUrl('/example.json');
    result.controller.should.equal('example');
    (typeof result.action).should.equal('undefined');
    result.type.should.equal('json');
  });

  it(`should parse '/example/demo'`, function() {
    const result = parseUrl('/example/demo');
    result.controller.should.equal('example');
    result.action.should.equal('demo');
    (result.type === null).should.equal(true);
  });

  it(`should parse '/example/demo/'`, function() {
    const result = parseUrl('/example/demo/');
    result.controller.should.equal('example');
    result.action.should.equal('demo');
    (result.type === null).should.equal(true);
  });

  it(`should parse '/example/demo.json'`, function() {
    const result = parseUrl('/example/demo.json');
    result.controller.should.equal('example');
    result.action.should.equal('demo');
    result.type.should.equal('json');
  });

  it(`should parse '/example/demo/depth/testing'`, function() {
    const result = parseUrl('/example/demo/depth/testing');
    result.controller.should.equal('example');
    result.action.should.equal('demo');
    result.args.should.deep.equal(['depth', 'testing']);
    (result.type === null).should.equal(true);
  });

  it(`should parse '/example/demo/depth/testing/'`, function() {
    const result = parseUrl('/example/demo/depth/testing/');
    result.controller.should.equal('example');
    result.action.should.equal('demo');
    result.args.should.deep.equal(['depth', 'testing']);
    (result.type === null).should.equal(true);
  });

  it(`should parse '/example/demo/depth/testing.json'`, function() {
    const result = parseUrl('/example/demo/depth/testing.json');
    result.controller.should.equal('example');
    result.action.should.equal('demo');
    result.args.should.deep.equal(['depth', 'testing']);
    result.type.should.equal('json');
  });
});
