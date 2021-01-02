const { validateLogs } = require('./validate-logs')

class MyCustomReporter {
  constructor(globalConfig, options) {
    // TODO: Validate globalConfig.verbose and fail if it's true
    this._logMessages = []
  }

  onTestStart(test) { }

  onTestResult(test, testResult, aggregatedResult) {
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

module.exports = MyCustomReporter;

