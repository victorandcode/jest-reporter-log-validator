const fs = require("fs")

const CONFIG_FILE_NAME = '.jest-logs-validations-config.json'

function validateLogs(logMessages) {
  try {
    const logsRestrictions = getLogMessagesRestrictions()
    const { logValidations } = logsRestrictions

    // Check for max limit exceeded
    const { failedRestrictionsIndexes, currentRestrictionsCount } = processLogs(logValidations, logMessages)
    if (failedRestrictionsIndexes.length) {
      printMaxLimitExceeded(logValidations, failedRestrictionsIndexes, currentRestrictionsCount)
      throw new Error("Error while validating log restrictions. See above for detailed report.")
    }
    
    // Validate outdated restrictions
    const { failIfLogValidationsOutdated = false } = logsRestrictions
    if (failIfLogValidationsOutdated) {
      const outdatedRestrictionsIndexes = findOutdatedLogRestrictions(logValidations, currentRestrictionsCount)
      if (outdatedRestrictionsIndexes.length) {
        printOutdatedRestrictions(logValidations, outdatedRestrictionsIndexes, currentRestrictionsCount)
        throw new Error("Log restrictions are outdated. See above for detailed report.")
      }
    }

    // Validate unknown log messages
    const { failIfUnknownLogsFound = false, exemptLogs = [] } = logsRestrictions
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

/**
 * Parse config file's content
 */
function getLogMessagesRestrictions() {
  const configObj = JSON.parse(fs.readFileSync(CONFIG_FILE_NAME))
  // Validate schema
  if (typeof configObj.logValidations !== "object" || configObj.logValidations.length === undefined) {
    throw new Error("Invalid configuration, logValidations should be an array")
  }
  return configObj
}

function processLogs(logValidations, logMessages) {
  // This represents if there are less log messages with a certain pattern than expected
  const currentRestrictionsCount = Array(logValidations.length).fill(0)
  const failedValidationsIndexesSet = new Set()
  for (const message of logMessages) {
    for (const [restrictionIndex, restriction] of logValidations.entries()) {
      if (matchesRestriction(message, restriction)) {
        currentRestrictionsCount[restrictionIndex] += 1
        if (currentRestrictionsCount[restrictionIndex] > restriction.max) {
          failedValidationsIndexesSet.add(restrictionIndex)
        }
      }
    }
  }

  return {failedRestrictionsIndexes: Array.from(failedValidationsIndexesSet), currentRestrictionsCount}
}

function matchesRestriction(logMessage, restriction) {
  for (const pattern of restriction.patterns) {
    if (logMessage.includes(pattern)) {
      return true
    }
  }
  return false
}

function printMaxLimitExceeded(logValidations, failedRestrictionsIndexes, currentRestrictionsCount) {
  console.log("The following log message validations failed:")
  for (const index of failedRestrictionsIndexes) {
    const expectedCount = logValidations[index].max
    const currentCount = currentRestrictionsCount[index]
    const patterns = logValidations[index].patterns.join(",")
    console.log(`- For pattern(s) "${patterns}", the expected is ${expectedCount}, actual is ${currentCount}`)
  }
}

function findOutdatedLogRestrictions(logValidations, currentRestrictionsCount) {
  const outdatedLogRestrictionsIndexes = []
  for (const [index, logWithValidations] of logValidations.entries()) {
    if (logWithValidations.max > currentRestrictionsCount[index]) {
      outdatedLogRestrictionsIndexes.push(index)
    }
  }
  return outdatedLogRestrictionsIndexes
}

function printOutdatedRestrictions(logValidations, outdatedRestrictionsIndexes, currentRestrictionsCount) {
  console.log("You must lower the number of allowed log messages matching certain patterns. Please adjust your config file according to the following:")
  for (const index of outdatedRestrictionsIndexes) {
    const currentCount = currentRestrictionsCount[index]
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
    for (const restriction of logValidations) {
      if (matchesRestriction(message, restriction)) {
        hasMatchingPattern = true
        break
      }
    }
    if (!hasMatchingPattern) {
      let hasNoLimit = false
      // Check if it's in the no limit list
      for (const restriction of exemptLogs) {
        if (matchesRestriction(message, restriction)) {
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
