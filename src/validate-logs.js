function validateLogs(logsValidationsConfig, logMessages) {
  try {
    const { logValidations } = logsValidationsConfig

    // Check for max limit exceeded
    const { failedValidationsIndexes, currentLogMessagesCount } = processLogValidations(logValidations, logMessages)
    if (failedValidationsIndexes.length) {
      printMaxLimitExceeded(logValidations, failedValidationsIndexes, currentLogMessagesCount)
      throw new Error("Error while checking log validations. See above for detailed report.")
    }
    
    // Check for outdated log validations
    const { failIfLogValidationsOutdated = false } = logsValidationsConfig
    if (failIfLogValidationsOutdated) {
      const outdatedLogValidationsIndexes = findOutdatedLogValidations(logValidations, currentLogMessagesCount)
      if (outdatedLogValidationsIndexes.length) {
        printOutdatedLogValidations(logValidations, outdatedLogValidationsIndexes, currentLogMessagesCount)
        throw new Error("Log validations are outdated. See above for detailed report.")
      }
    }

    // Validate unknown log messages
    const { failIfUnknownLogsFound = false, exemptLogs = [] } = logsValidationsConfig
    if (failIfUnknownLogsFound) {
      const unknownLogMessages = findUnknownLogMessages(logValidations, exemptLogs, logMessages)
      if (unknownLogMessages.length) {
        printUnknownLogMessages(unknownLogMessages)
        throw new Error("Unknown log messages aren't allowed. See above for more details.")
      }
    }

  } catch (err) {
    console.error("There was an error while processing log messages", err)
    throw err
  }
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

/**
 * Returns true if message matches all patterns and patterns has at least one element
 */
function matchesPatterns(logMessage, patterns) {
  let matchingPatterns = 0
  for (const pattern of patterns) {
    if (logMessage.includes(pattern)) {
      matchingPatterns += 1
    }
  }
  return matchingPatterns === 0 ? false : patterns.length === matchingPatterns
}

function printMaxLimitExceeded(logValidations, failedValidationsIndexes, currentLogMessagesCount) {
  console.log("The following log message validations failed:")
  for (const index of failedValidationsIndexes) {
    const expectedCount = logValidations[index].max
    const currentCount = currentLogMessagesCount[index]
    const patterns = logValidations[index].patterns.join(",")
    console.log(`- For pattern(s) "${patterns}", the expected is ${expectedCount}, actual is ${currentCount}`)
  }
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
  console.log("You must lower the number of allowed log messages matching certain patterns. Please adjust your config file according to the following:")
  for (const index of outdatedLogValidationsIndexes) {
    const currentCount = currentLogMessagesCount[index]
    const maximumAllowed = logValidations[index].max
    const patterns = logValidations[index].patterns.join(",")
    console.log(`- For pattern(s) "${patterns}", the maximum allowed is ${maximumAllowed} but it should be ${currentCount}`)
  }
}

function findUnknownLogMessages(logValidations, exemptLogs, logMessages) {
  const unknownLogMessages = []
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
        unknownLogMessages.push(message)
      }
    }
  }
  return unknownLogMessages
}

function printUnknownLogMessages(unknownLogMessages) {
  console.log("Unknown log messages are not allowed. Please use the configuration of this reporter to validate how many times the following messages can appear:")
  for (const message of unknownLogMessages) {
    console.log(`- ${message}`)
  }
}

module.exports = { validateLogs }
