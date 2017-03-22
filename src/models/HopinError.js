const getErrorDetails = require('../utils/error-details');

class HopinError extends Error {
  constructor(errorCode, extra) {
    super();

    Error.captureStackTrace(this, this.constructor);

    const errorDetails = getErrorDetails(errorCode, extra);
    this.name = errorDetails.name;
    this.message = errorDetails.message;
    if (extra) {
      this.extra = extra;
    }
  }
}

module.exports = HopinError;
