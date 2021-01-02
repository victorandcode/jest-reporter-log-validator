const fs = require("fs")

const CONFIG_FILE_NAME = '.jest-logs-restrictions.json'

function validateLogs(logMessages) {
  try {
    // Check for max limit exceeded
    const logsRestrictions = getLatestWarningsRestrictions()
    const { failedRestrictionsIndexes, currentRestrictionsCount } = processLogs(logsRestrictions, logMessages)
    if (failedRestrictionsIndexes.size) {
      printMaxLimitExceeded(logsRestrictions.logsWithLimit, failedRestrictionsIndexes, currentRestrictionsCount)
      throw new Error("Error while validating log restrictions. See above for detailed report.")
    }
    
    // Validate outdated restrictions
    const { failIfLogRestrictionsOutdated } = logsRestrictions
    if (failIfLogRestrictionsOutdated) {
      const outdatedRestrictionsIndexes = findOutdatedLogRestrictions(logsRestrictions.logsWithLimit, currentRestrictionsCount)
      if (outdatedRestrictionsIndexes.length) {
        printOutdatedRestrictions(logsRestrictions.logsWithLimit, outdatedRestrictionsIndexes, currentRestrictionsCount)
        throw new Error("Log restrictions are outdated. See above for detailed report.")
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
function getLatestWarningsRestrictions() {
  const configObj = JSON.parse(fs.readFileSync(CONFIG_FILE_NAME))
  // Validate schema
  if (typeof configObj.logsWithLimit !== "object" || configObj.logsWithLimit.length === undefined) {
    throw new Error("Invalid configuration, logsWithLimit should be an array")
  }
  return configObj
}

function processLogs(logRestrictions, warningLines) {
  const { logsWithLimit } = logRestrictions
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
  console.error("The following warning violations were found:")
  for (const index of failedRestrictionsIndexes) {
    const expectedCount = logsWithLimit[index].max
    const currentCount = currentRestrictionsCount[index]
    const patterns = logsWithLimit[index].patterns.join(",")
    console.error(`- For patterns "${patterns}", the expected is ${expectedCount}, actual is ${currentCount}`)
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
    console.log(`- For pattern "${patterns}, the maximum allowed is ${maximumAllowed} but it should be ${currentCount}"`)
  }
}

module.exports = { validateLogs }
