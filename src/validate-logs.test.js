const stripAnsi = require('strip-ansi')
const { validateLogs } = require("./validate-logs")

// Serializes calls to a console so they can be used in snapshots
function getCallsToConsoleFn(consoleMockObj) {
  return consoleMockObj.mock.calls.map((params) => {
    return params.map(param => stripAnsi(param))
  }).join("\n")
}

function getConfig(overrides) {
  return {
    "logValidations": [
      {
        "patterns": [
          "Each child in a list should have a unique"
        ],
        "max": 2
      },
      {
        "patterns": [
          "`wait` has been deprecated and replaced by `waitFor` instead."
        ],
        "max": 1
      }
    ],
    "failIfLogValidationsOutdated": false,
    "failIfUnknownLogsFound": false,
    "exemptLogs": [],
    ...overrides
  }
}

beforeEach(() => {
  console.log = jest.fn()
})

describe("validateLogs", () => {
  it("fails if log message appears more times than allowed", () => {
    const logs = [
      'Warning: Each child in a list should have a unique "key" prop',
      "`wait` has been deprecated and replaced by `waitFor` instead.",
      'Warning: Each child in a list should have a unique "key" prop',
      'Warning: Each child in a list should have a unique "key" prop',
    ]
    expect(() => validateLogs(getConfig(), logs)).toThrow(new Error("Error while checking log validations. See above for detailed report."))
    expect(getCallsToConsoleFn(console.log)).toMatchSnapshot()
  })

  it("succeeds if log message appears less times than allowed", () => {
    const logs = [
      'Warning: Each child in a list should have a unique "key" prop',
      "`wait` has been deprecated and replaced by `waitFor` instead.",
      'Warning: Each child in a list should have a unique "key" prop',
    ]
    expect(() => validateLogs(getConfig(), logs)).not.toThrow()
  })

  it("succeeds if log message doesn't match all validation patterns", () => {
    const logs = [
      'Warning: Each child in a list should have a unique "key" prop',
      'Warning: Each child in a list should have a unique "key" prop',
    ]
    expect(() => validateLogs(getConfig({
      "logValidations": [
        {
          "patterns": [
            "Warning: Each child in a list should have a unique",
            // The following string does not appear in the messages
            "\"name\" prop"
          ],
          "max": 0
        },
      ],
    }), logs)).not.toThrow()
  })

  it("fails if failIfLogValidationsOutdated is set to true and log max has decrased", () => {
    const logs = [ 
      'Warning: Each child in a list should have a unique "key" prop',
      "`wait` has been deprecated and replaced by `waitFor` instead.",
    ]
    expect(() => validateLogs(getConfig({ failIfLogValidationsOutdated: true }), logs)).toThrow(new Error("Log validations are outdated. See above for detailed report."))
    expect(getCallsToConsoleFn(console.log)).toMatchSnapshot()
  })

  it.skip("throws if schema doesn't have the correct structure", () => {
    const invalidConfig = {
      "logsWithValidations": [
        {
          "patterns": [
            "Each child in a list should have a unique"
          ],
          // max is missing
        }
      ]
    }
    const logs = [ 
      'Warning: Each child in a list should have a unique "key" prop',
      "`wait` has been deprecated and replaced by `waitFor` instead.",
    ]
    expect(() => { validateLogs(invalidConfig, logs) }).toThrow()
  })

  it("fails if \"failIfUnknownLogsFound\" is set to true and unknown warning is found", () => {
    const logs = [ 
      'Warning: Each child in a list should have a unique "key" prop',
      // The following warning does not exist in the configuration
      "Warning: React.createFactory() is deprecated and will be removed in a future major release. Consider using JSX or use React.createElement() directly instead.",
    ]
    expect(() => { validateLogs(getConfig({ failIfUnknownLogsFound: true }), logs) }).toThrow(new Error("Unknown log messages aren't allowed. See above for more details."))
    expect(getCallsToConsoleFn(console.log)).toMatchSnapshot()
  })

  it("if \"failIfUnknownLogsFound\" is set to true and unknown warnings are found, then each unique message is only logged once", () => {
    const logs = [ 
      "Warning: React.createFactory() is deprecated and will be removed in a future major release. Consider using JSX or use React.createElement() directly instead.",
      "Warning: React.createFactory() is deprecated and will be removed in a future major release. Consider using JSX or use React.createElement() directly instead.",
      "Warning: toBeEmpty has been deprecated and will be removed in future updates. Please use instead toBeEmptyDOMElement for finding empty nodes in the DOM."
    ]
    expect(() => { validateLogs(getConfig({ failIfUnknownLogsFound: true }), logs) }).toThrow()
    expect(getCallsToConsoleFn(console.log)).toMatchSnapshot()
  })

  it("succeeds if \"failIfUnknownLogsFound\" is true and warning is inside \"exemptLogs\"", () => {
    const config = getConfig({
      failIfUnknownLogsFound: true,
      exemptLogs: [
        {
          "patterns": ["Error: Uncaught [TypeError: Cannot read property 'then' of undefined]"]
        }
      ],
    })
    const logs = [
      "Error: Uncaught [TypeError: Cannot read property 'then' of undefined]",
    ]
    expect(() => { validateLogs(config, logs) }).not.toThrow()
  })
})
