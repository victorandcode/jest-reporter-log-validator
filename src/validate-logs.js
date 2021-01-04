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
    const { failIfUnknownWarningsFound = false, logsWithoutLimit = [] } = logsRestrictions
    if (failIfUnknownWarningsFound) {
      const unknownWarnings = findUnknownLogMessages(logsWithLimit, logsWithoutLimit, logMessages)
      if (unknownWarnings.length) {
        printUnknownLogMessages(unknownWarnings)
        throw new Error("Unknown warnings were found. See above for more details.")
      }
    }

  } catch (err) {
    console.error("There was an error while processing warning restrictions", err)
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

function processLogs(logsWithLimit, warningLines) {
  // This represents if there are less warnings than expected
  const currentRestrictionsCount = Array(logsWithLimit.length).fill(0)
  const failedRestrictionsIndexes = new Set()
  for (const warningLine of warningLines) {
    for (const [restrictionIndex, restriction] of logsWithLimit.entries()) {
      if (matchesRestriction(warningLine, restriction)) {
        currentRestrictionsCount[restrictionIndex] += 1
        if (currentRestrictionsCount[restrictionIndex] > restriction.max) {
          failedRestrictionsIndexes.add(restrictionIndex)
        }
      }
    }
  }

  return {failedRestrictionsIndexes, currentRestrictionsCount}
}

function matchesRestriction(warning, restriction) {
  for (const pattern of restriction.patterns) {
    if (warning.includes(pattern)) {
      return true
    }
  }
  return false
}

function printMaxLimitExceeded(logsWithLimit, failedRestrictionsIndexes, currentRestrictionsCount) {
  console.log("The following warning violations were found:")
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
  console.log("You have less warnings than what is declared in your configuration file. Please adjust it according to this:")
  for (const index of outdatedRestrictionsIndexes) {
    const currentCount = currentRestrictionsCount[index]
    const maximumAllowed = logsWithLimit[index].max
    const patterns = logsWithLimit[index].patterns.join(",")
    console.log(`- For pattern(s) "${patterns}", the maximum allowed is ${maximumAllowed} but it should be ${currentCount}`)
  }
}

function findUnknownLogMessages(logsWithLimit, logsWithoutLimit, logMessages) {
  const unknownLogMessages = []
  for (const warningLine of logMessages) {
    let hasMatchingPattern = false
    // Check if it has limit
    for (const restriction of logsWithLimit) {
      if (matchesRestriction(warningLine, restriction)) {
        hasMatchingPattern = true
        break
      }
    }
    if (!hasMatchingPattern) {
      let hasNoLimit = false
      // Check if it's in the no limit list
      for (const restriction of logsWithoutLimit) {
        if (matchesRestriction(warningLine, restriction)) {
          hasNoLimit = true
        }
      }
      if (!hasNoLimit) {
        unknownLogMessages.push(warningLine)
      }
    }
  }
  return unknownLogMessages
}

function printUnknownLogMessages(unknownLogMessages) {
  console.log("Unknown warnings are not allowed. Please use the configuration of this reporter to validate how many times the following messages can appear:")
  for (const message of unknownLogMessages) {
    console.log(`- ${message}`)
  }
}

module.exports = { validateLogs }
