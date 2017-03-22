const ERROR_CODES = require('../models/ErrorCodes');
const UNKNOWN_ERROR_CODE = 'unknown-error';

const getErrorDetails = (errorCode, extraInfo) => {
  const rawDetails = ERROR_CODES[errorCode];
  if (!rawDetails) {
    // This shouldn't ever occur but if it does - we can at least catch it.
    if (errorCode === UNKNOWN_ERROR_CODE) {
      throw new Error('Loop detected in error generation of HopinError.');
    }

    return getErrorDetails(UNKNOWN_ERROR_CODE, {origCode: errorCode});
  }

  if (!extraInfo) {
    extraInfo = {};
  }

  const errorDetails = {
    name: errorCode,
  };

  // Handle the scenario where the template string should be shared
  if (typeof rawDetails.message === 'function') {
    errorDetails.message = rawDetails.message(extraInfo);
  } else {
    errorDetails.message = rawDetails.message;
  }
  return errorDetails;
};

module.exports = getErrorDetails;
