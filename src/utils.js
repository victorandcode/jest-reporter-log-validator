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


module.exports = { matchesPatterns }