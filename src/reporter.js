const { validateLogs } = require('./validate-logs')

class JestReporterLogValidator {
  constructor(globalConfig, options) {
    if (globalConfig.verbose === true) {
      throw Error("Invalid configuration. Verbose must be false when using jest-reporter-log-validator. Otherwise, console messages won't be available to the reporter.")
    }
    this._logMessages = []
  }

  onTestStart(test) { }

  onTestResult(_, testResult) {
    if (testResult.console) {
      for (const logObj of testResult.console) {
        this._logMessages.push(logObj.message)
      }
    }
  }

  onRunStart(results) { }

  onRunComplete(contexts, results) {
    validateLogs(this._logMessages)
  }
}

module.exports = JestReporterLogValidator;

