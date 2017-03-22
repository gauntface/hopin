const HopinError = require('../../src/models/HopinError');

describe('Test HopinError Generation', function() {
  it('should be able to generate error with unknown id', function() {
    const error = new HopinError('aaa123');
    error.stack.should.be.defined;
    error.name.should.equal('unknown-error');
    error.message.should.equal('An unknown error was thrown with name: \'aaa123\'.');
  });

  it('should work without an errorCode', function() {
    const error = new HopinError();
    error.name.should.equal('unknown-error');
    error.message.should.equal('An unknown error was thrown with name: \'undefined\'.');
  });

  it('should be able to add info from an additional error', function() {
    const additionalErrorDetails = new Error('What a mess.');
    const error = new HopinError('aaa123', {
      error: additionalErrorDetails,
    });
    error.name.should.equal('unknown-error');
    error.message.should.equal('An unknown error was thrown with name: \'aaa123\'.');
    error.extra.error.should.equal(additionalErrorDetails);
  });
});
