const { validateLogs } = require('./validate-logs')
const { getConfiguration } = require("./config")

class JestReporterLogValidator {
  constructor(globalConfig, options) {
    if (globalConfig.verbose === true) {
      throw Error("Invalid configuration. Verbose must be false when using jest-reporter-log-validator. Otherwise, console messages won't be available to the reporter.")
    }
    this._options = options
    this._logMessages = []
  }

  onTestResult(_, testResult) {
    if (testResult.console) {
      for (const logObj of testResult.console) {
        this._logMessages.push(logObj.message)
      }
    }
  }

  getLastError() {
    try {
      const config = getConfiguration(process.cwd(), this._options)
      const validationsSuccessful = validateLogs(config, this._logMessages)
      if (!validationsSuccessful) {
        return new Error("Errors found while running validations")
      }
    } catch (ex) {
      return ex
    }
  }
}

module.exports = JestReporterLogValidator;
