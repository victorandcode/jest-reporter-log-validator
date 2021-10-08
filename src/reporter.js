const { validateLogs } = require("./validate-logs")
const { getConfiguration } = require("./config")

class JestReporterLogValidator {
  constructor(globalConfig, options) {
    if (globalConfig.verbose === true) {
      /**
       * If we're in verbose mode, the log messages aren't available for reportes
       */
      this._logs_unavailable = true
      return
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
    if (this._logs_unavailable) {
      return
    }

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

module.exports = JestReporterLogValidator
