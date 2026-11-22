const { validateLogs } = require("./validate-logs")
const { getConfiguration } = require("./config")

class JestReporterLogValidator {
  constructor(globalConfig, options) {
    this._options = options
    this._logMessages = []
    this._verbose = globalConfig.verbose === true
    this._consoleMessagesAvailable = false
  }

  onTestResult(_, testResult) {
    if (!testResult.console) {
      return
    }
    this._consoleMessagesAvailable = true
    for (const logObj of testResult.console) {
      this._logMessages.push(logObj.message)
    }
  }

  getLastError() {
    /**
     * Older Jest versions don't provide console messages to reporters in
     * verbose mode. Newer versions do, so only skip validation when verbose
     * mode is enabled and no console output was provided.
     */
    if (this._verbose && !this._consoleMessagesAvailable) {
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
