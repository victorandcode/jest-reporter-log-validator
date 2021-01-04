const fs = require("fs")

const CONFIG_FILE_NAME = '.jest-logs-restrictions.json'

function validateLogs(logMessages) {
  try {
    const logsRestrictions = getLogMessagesRestrictions()
    const { logsWithValidations } = logsRestrictions

    // Check for max limit exceeded
    const { failedRestrictionsIndexes, currentRestrictionsCount } = processLogs(logsWithValidations, logMessages)
    if (failedRestrictionsIndexes.size) {
      printMaxLimitExceeded(logsWithValidations, failedRestrictionsIndexes, currentRestrictionsCount)
      throw new Error("Error while validating log restrictions. See above for detailed report.")
    }
    
    // Validate outdated restrictions
    const { failIfLogRestrictionsOutdated = false } = logsRestrictions
    if (failIfLogRestrictionsOutdated) {
      const outdatedRestrictionsIndexes = findOutdatedLogRestrictions(logsWithValidations, currentRestrictionsCount)
      if (outdatedRestrictionsIndexes.length) {
        printOutdatedRestrictions(logsWithValidations, outdatedRestrictionsIndexes, currentRestrictionsCount)
        throw new Error("Log restrictions are outdated. See above for detailed report.")
      }
    }

    // Validate unknown log messages
    const { failIfUnknownLogsFound = false, logsWithoutLimit = [] } = logsRestrictions
    if (failIfUnknownLogsFound) {
      const unknownLogMessages = findUnknownLogMessages(logsWithValidations, logsWithoutLimit, logMessages)
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
  if (typeof configObj.logsWithValidations !== "object" || configObj.logsWithValidations.length === undefined) {
    throw new Error("Invalid configuration, logsWithValidations should be an array")
  }
  return configObj
}

function processLogs(logsWithValidations, logMessages) {
  // This represents if there are less log messages with a certain pattern than expected
  const currentRestrictionsCount = Array(logsWithValidations.length).fill(0)
  const failedRestrictionsIndexes = new Set()
  for (const message of logMessages) {
    for (const [restrictionIndex, restriction] of logsWithValidations.entries()) {
      if (matchesRestriction(message, restriction)) {
        currentRestrictionsCount[restrictionIndex] += 1
        if (currentRestrictionsCount[restrictionIndex] > restriction.max) {
          failedRestrictionsIndexes.add(restrictionIndex)
        }
      }
    }
  }

  return {failedRestrictionsIndexes, currentRestrictionsCount}
}

function matchesRestriction(logMessage, restriction) {
  for (const pattern of restriction.patterns) {
    if (logMessage.includes(pattern)) {
      return true
    }
  }
  return false
}

function printMaxLimitExceeded(logsWithValidations, failedRestrictionsIndexes, currentRestrictionsCount) {
  console.log("The following log message validations failed:")
  for (const index of failedRestrictionsIndexes) {
    const expectedCount = logsWithValidations[index].max
    const currentCount = currentRestrictionsCount[index]
    const patterns = logsWithValidations[index].patterns.join(",")
    console.log(`- For pattern(s) "${patterns}", the expected is ${expectedCount}, actual is ${currentCount}`)
  }
}

function findOutdatedLogRestrictions(logsWithValidations, currentRestrictionsCount) {
  const outdatedLogRestrictionsIndexes = []
  for (const [index, logWithValidations] of logsWithValidations.entries()) {
    if (logWithValidations.max > currentRestrictionsCount[index]) {
      outdatedLogRestrictionsIndexes.push(index)
    }
  }
  return outdatedLogRestrictionsIndexes
}

function printOutdatedRestrictions(logsWithValidations, outdatedRestrictionsIndexes, currentRestrictionsCount) {
  console.log("You must lower the number of allowed log messages matching certain patterns. Please adjust your config file according to the following:")
  for (const index of outdatedRestrictionsIndexes) {
    const currentCount = currentRestrictionsCount[index]
    const maximumAllowed = logsWithValidations[index].max
    const patterns = logsWithValidations[index].patterns.join(",")
    console.log(`- For pattern(s) "${patterns}", the maximum allowed is ${maximumAllowed} but it should be ${currentCount}`)
  }
}

function findUnknownLogMessages(logsWithValidations, logsWithoutLimit, logMessages) {
  const unknownLogMessages = []
  for (const message of logMessages) {
    let hasMatchingPattern = false
    // Check if it has limit
    for (const restriction of logsWithValidations) {
      if (matchesRestriction(message, restriction)) {
        hasMatchingPattern = true
        break
      }
    }
    if (!hasMatchingPattern) {
      let hasNoLimit = false
      // Check if it's in the no limit list
      for (const restriction of logsWithoutLimit) {
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
