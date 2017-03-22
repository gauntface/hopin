const chalk = require('chalk');

/* eslint-disable no-console */
class LogHelper {
  log(...args) {
    console.log(chalk.dim('[Log]: '), ...args);
  }

  warn(...args) {
    console.warn(chalk.yellow('[Warn]: '), ...args);
  }

  error(...args) {
    console.error(chalk.red('[Error]: '), ...args);
  }
}

module.exports = new LogHelper();
