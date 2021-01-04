const fs = require("fs")

const CONFIG_FILE_NAME = '.jest-logs-restrictions.json'

function validateLogs(logMessages) {
  try {
    const logsRestrictions = getLogMessagesRestrictions()
    const { logsWithLimit } = logsRestrictions

    // Check for max limit exceeded
    const { failedRestrictionsIndexes, currentRestrictionsCount } = processLogs(logsWithLimit, logMessages)
    if (failedRestrictionsIndexes.size) {
      printMaxLimitExceeded(logsWithLimit, failedRestrictionsIndexes, currentRestrictionsCount)
      throw new Error("Error while validating log restrictions. See above for detailed report.")
    }
    
    // Validate outdated restrictions
    const { failIfLogRestrictionsOutdated = false } = logsRestrictions
    if (failIfLogRestrictionsOutdated) {
      const outdatedRestrictionsIndexes = findOutdatedLogRestrictions(logsWithLimit, currentRestrictionsCount)
      if (outdatedRestrictionsIndexes.length) {
        printOutdatedRestrictions(logsWithLimit, outdatedRestrictionsIndexes, currentRestrictionsCount)
        throw new Error("Log restrictions are outdated. See above for detailed report.")
      }
    }

    // Validate unknown log messages
    const { failIfUnknownLogsFound = false, logsWithoutLimit = [] } = logsRestrictions
    if (failIfUnknownLogsFound) {
      const unknownLogMessages = findUnknownLogMessages(logsWithLimit, logsWithoutLimit, logMessages)
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
  if (typeof configObj.logsWithLimit !== "object" || configObj.logsWithLimit.length === undefined) {
    throw new Error("Invalid configuration, logsWithLimit should be an array")
  }
  return configObj
}

function processLogs(logsWithLimit, logMessages) {
  // This represents if there are less log messages with a certain pattern than expected
  const currentRestrictionsCount = Array(logsWithLimit.length).fill(0)
  const failedRestrictionsIndexes = new Set()
  for (const message of logMessages) {
    for (const [restrictionIndex, restriction] of logsWithLimit.entries()) {
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

function printMaxLimitExceeded(logsWithLimit, failedRestrictionsIndexes, currentRestrictionsCount) {
  console.log("The following log message validations failed:")
  for (const index of failedRestrictionsIndexes) {
    const expectedCount = logsWithLimit[index].max
    const currentCount = currentRestrictionsCount[index]
    const patterns = logsWithLimit[index].patterns.join(",")
    console.log(`- For pattern(s) "${patterns}", the expected is ${expectedCount}, actual is ${currentCount}`)
  }
}

function findOutdatedLogRestrictions(logsWithLimit, currentRestrictionsCount) {
  const outdatedLogRestrictionsIndexes = []
  for (const [index, logWithLimit] of logsWithLimit.entries()) {
    if (logWithLimit.max > currentRestrictionsCount[index]) {
      outdatedLogRestrictionsIndexes.push(index)
    }
  }
  return outdatedLogRestrictionsIndexes
}

function printOutdatedRestrictions(logsWithLimit, outdatedRestrictionsIndexes, currentRestrictionsCount) {
  console.log("You must lower the number of allowed log messages matching certain patterns. Please adjust your config file according to the following:")
  for (const index of outdatedRestrictionsIndexes) {
    const currentCount = currentRestrictionsCount[index]
    const maximumAllowed = logsWithLimit[index].max
    const patterns = logsWithLimit[index].patterns.join(",")
    console.log(`- For pattern(s) "${patterns}", the maximum allowed is ${maximumAllowed} but it should be ${currentCount}`)
  }
}

function findUnknownLogMessages(logsWithLimit, logsWithoutLimit, logMessages) {
  const unknownLogMessages = []
  for (const message of logMessages) {
    let hasMatchingPattern = false
    // Check if it has limit
    for (const restriction of logsWithLimit) {
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
