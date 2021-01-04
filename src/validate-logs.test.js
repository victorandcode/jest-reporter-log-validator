const { validateLogs } = require("./validate-logs")

// Serializes calls to a console so they can be used in snapshots
function getCallsToConsoleFn(consoleMockObj) {
  return consoleMockObj.mock.calls.join("\n")
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
  console.error = jest.fn()
})

describe("validateLogs", () => {
  it("fails if log max limit is exceeded", () => {
    const logs = [
      'Warning: Each child in a list should have a unique "key" prop',
      "`wait` has been deprecated and replaced by `waitFor` instead.",
      'Warning: Each child in a list should have a unique "key" prop',
      'Warning: Each child in a list should have a unique "key" prop',
    ]
    expect(() => validateLogs(getConfig(), logs)).toThrow(new Error("Error while checking log validations. See above for detailed report."))
    expect(getCallsToConsoleFn(console.log)).toMatchSnapshot()
  })

  it("succeeds if no log max is exceeded", () => {
    const logs = [
      'Warning: Each child in a list should have a unique "key" prop',
      "`wait` has been deprecated and replaced by `waitFor` instead.",
      'Warning: Each child in a list should have a unique "key" prop',
    ]
    expect(() => validateLogs(getConfig(), logs)).not.toThrow()
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
