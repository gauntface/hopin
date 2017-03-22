const proxyquire = require('proxyquire').noCallThru();

const errorDetails = require('../../src/utils/error-details');

describe('Error Details', function() {
  const proxyErrorDetails = proxyquire('../../src/utils/error-details', {
    '../models/ErrorCodes': {
      'plain-msg-error': {
        message: 'Just a plain string.',
      },
    },
  });

  it('should be able to handle non-existant errors', function() {
    const error = errorDetails('aaa123', {
      info: 'Hello, World',
      data: {
        'such-data': 'so wow',
      },
    });

    error.name.should.equal('unknown-error');
    error.message.should.equal('An unknown error was thrown with name: \'aaa123\'.');
  });

  it('should handle requesting error with no details', function() {
    const error = errorDetails('unknown-error');

    error.name.should.equal('unknown-error');
    error.message.should.equal('An unknown error was thrown with name: \'undefined\'.');
  });

  it('should handle requesting error with lots of details', function() {
    const error = errorDetails('unknown-error', {
      origCode: 'hello',
      example: {
        data: {
          nested: [1, 2, 3],
        },
      },
    });

    error.name.should.equal('unknown-error');
    error.message.should.equal('An unknown error was thrown with name: \'hello\'.');
  });

  it('should handle requesting error with a string message', function() {
    const error = proxyErrorDetails('plain-msg-error');
    error.name.should.equal('plain-msg-error');
    error.message.should.equal('Just a plain string.');
  });

  it('should handle requesting non-existant error without an unknown-error fallback.', function() {
    try {
      proxyErrorDetails('nuclear-error');
      throw new Error('Injected Error');
    } catch (err) {
      if (err.message !== 'Loop detected in error generation of HopinError.') {
        throw new Error('Unexpected error thrown: ' + err.message);
      }
    }
  });
});
