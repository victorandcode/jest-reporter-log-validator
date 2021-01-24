const { printTitle, printOrderedListItem, printTable, dangerText, successText } = require("./stdout")
const { matchesPatterns } = require("./utils")
const { schemaIsValid } = require("./schema")

function validateLogs(logsValidationsConfig, logMessages) {
  // Validate configuration
  const { valid, errors } = schemaIsValid(logsValidationsConfig)
  if (!valid) {
    printInvalidConfig(errors)
    throw Error("Invalid configuration")
  }

  const { logValidations } = logsValidationsConfig
  let success = true

  // Check for max limit exceeded
  const { failedValidationsIndexes, currentLogMessagesCount } = processLogValidations(logValidations, logMessages)
  if (failedValidationsIndexes.length) {
    printMaxLimitExceeded(logValidations, failedValidationsIndexes, currentLogMessagesCount)
    success = false
  }
  
  // Check for outdated log validations
  const { failIfLogValidationsOutdated = false } = logsValidationsConfig
  if (failIfLogValidationsOutdated) {
    const outdatedLogValidationsIndexes = findOutdatedLogValidations(logValidations, currentLogMessagesCount)
    if (outdatedLogValidationsIndexes.length) {
      printOutdatedLogValidations(logValidations, outdatedLogValidationsIndexes, currentLogMessagesCount)
      success = false
    }
  }

  // Validate unknown log messages
  const { failIfUnknownLogsFound = false, exemptLogs = [] } = logsValidationsConfig
  if (failIfUnknownLogsFound) {
    const unknownLogMessages = findUnknownLogMessages(logValidations, exemptLogs, logMessages)
    if (unknownLogMessages.length) {
      printUnknownLogMessages(unknownLogMessages)
      success = false
    }
  }
  return success
}

function printInvalidConfig(errors) {
  printTitle("The provided configuration is invalid. See below for more details:")
  errors.forEach((error, index) => {
    printOrderedListItem(index + 1, error)
  })
}

function processLogValidations(logValidations, logMessages) {
  // This represents if there are less log messages with a certain pattern than expected
  const currentLogMessagesCount = Array(logValidations.length).fill(0)
  const failedValidationsIndexesSet = new Set()
  for (const message of logMessages) {
    for (const [validationIndex, validation] of logValidations.entries()) {
      if (matchesPatterns(message, validation.patterns)) {
        currentLogMessagesCount[validationIndex] += 1
        if (currentLogMessagesCount[validationIndex] > validation.max) {
          failedValidationsIndexesSet.add(validationIndex)
        }
      }
    }
  }

  return {failedValidationsIndexes: Array.from(failedValidationsIndexesSet), currentLogMessagesCount}
}

function printMaxLimitExceeded(logValidations, failedValidationsIndexes, currentLogMessagesCount) {
  printTitle("The following log validations failed. Please adjust the values in your configuration file:")
  const tableCells = [
    ["Pattern(s)", "Maximum allowed", "Times it appeared"]
  ]
  for (const index of failedValidationsIndexes) {
    const expectedCount = logValidations[index].max
    const currentCount = currentLogMessagesCount[index]
    const patterns = logValidations[index].patterns.map(pattern => `"${pattern}"`).join(", ")
    tableCells.push([`[${patterns}]`, expectedCount, dangerText(currentCount)])
  }
  printTable({ cells: tableCells })
}

function findOutdatedLogValidations(logValidations, currentLogMessagesCount) {
  const outdatedLogValidationsIndexes = []
  for (const [index, logWithValidations] of logValidations.entries()) {
    if (logWithValidations.max > currentLogMessagesCount[index]) {
      outdatedLogValidationsIndexes.push(index)
    }
  }
  return outdatedLogValidationsIndexes
}

function printOutdatedLogValidations(logValidations, outdatedLogValidationsIndexes, currentLogMessagesCount) {
  printTitle("Some warnings have decreased. Please adjust your config file accordingly. See details here:")
  const tableCells = [
    ["Pattern(s)", "Current maximum", "Expected maximum"]
  ]
  for (const index of outdatedLogValidationsIndexes) {
    const currentCount = currentLogMessagesCount[index]
    const maximumAllowed = logValidations[index].max
    const patterns = logValidations[index].patterns.map(pattern => `"${pattern}"`).join(", ")
    tableCells.push([
      `[${patterns}]`,
      dangerText(maximumAllowed),
      successText(currentCount)
    ])
  }
  printTable({
     cells: tableCells
  })
}

function findUnknownLogMessages(logValidations, exemptLogs, logMessages) {
  const unknownLogMessages = new Set([])
  for (const message of logMessages) {
    let hasMatchingPattern = false
    // Check if it has limit
    for (const validation of logValidations) {
      if (matchesPatterns(message, validation.patterns)) {
        hasMatchingPattern = true
        break
      }
    }
    if (!hasMatchingPattern) {
      let hasNoLimit = false
      // Check if it's in the no limit list
      for (const validation of exemptLogs) {
        if (matchesPatterns(message, validation.patterns)) {
          hasNoLimit = true
        }
      }
      if (!hasNoLimit) {
        unknownLogMessages.add(message)
      }
    }
  }
  return Array.from(unknownLogMessages)
}

function printUnknownLogMessages(unknownLogMessages) {
  printTitle("Unknown log messages are not allowed. Please use the configuration of this reporter to validate how many times the following messages can appear through \"logValidations\" or \"exemptLogs\":")
  let counter = 1
  for (const message of unknownLogMessages) {
    printOrderedListItem(counter, message)
    counter += 1
  }
}

module.exports = { validateLogs }
