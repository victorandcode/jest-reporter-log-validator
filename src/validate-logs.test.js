const { validateLogs } = require("./validate-logs")
const fs = require('fs')

jest.mock("fs")

// Serializes calls to a console so they can be used in snapshots
function getCallsToConsoleFn(consoleMockObj) {
  return consoleMockObj.mock.calls.join("\n")
}

const baseConfig = {
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
    fs.readFileSync.mockImplementationOnce(() => JSON.stringify(baseConfig))
    expect(() => validateLogs(logs)).toThrow(new Error("Error while validating log restrictions. See above for detailed report."))
    expect(getCallsToConsoleFn(console.log)).toMatchSnapshot()
  })

  it("succeeds if no log max is exceeded", () => {
    const logs = [
      'Warning: Each child in a list should have a unique "key" prop',
      "`wait` has been deprecated and replaced by `waitFor` instead.",
      'Warning: Each child in a list should have a unique "key" prop',
    ]
    fs.readFileSync.mockImplementationOnce(() => JSON.stringify(baseConfig))
    expect(() => validateLogs(logs)).not.toThrow()
  })

  it("throws if config file isn't present", () => {
    const logs = ['Warning: Each child in a list should have a unique "key" prop']
    fs.readFileSync.mockImplementationOnce(() => { throw Error("File not found") })
    expect(() => validateLogs(logs)).toThrow(new Error("File not found"))
  })

  it("fails if failIfLogValidationsOutdated is set to true and log max has decrased", () => {
    const config = {
      ...baseConfig,
      failIfLogValidationsOutdated: true
    }
    const logs = [ 
      'Warning: Each child in a list should have a unique "key" prop',
      "`wait` has been deprecated and replaced by `waitFor` instead.",
    ]
    fs.readFileSync.mockImplementationOnce(() => JSON.stringify(config))
    expect(() => validateLogs(logs)).toThrow(new Error("Log restrictions are outdated. See above for detailed report."))
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
    fs.readFileSync.mockImplementationOnce(() => JSON.stringify(invalidConfig))
    expect(() => { validateLogs(logs) }).toThrow()
  })

  it("fails if \"failIfUnknownLogsFound\" is set to true and unknown warning is found", () => {
    const config = {
      ...baseConfig,
      failIfUnknownLogsFound: true
    }
    const logs = [ 
      'Warning: Each child in a list should have a unique "key" prop',
      // The following warning does not exist in the configuration
      "Warning: React.createFactory() is deprecated and will be removed in a future major release. Consider using JSX or use React.createElement() directly instead.",
    ]
    fs.readFileSync.mockImplementationOnce(() => JSON.stringify(config))
    expect(() => { validateLogs(logs) }).toThrow(new Error("Unknown log messages aren't allowed. See above for more details."))
    expect(getCallsToConsoleFn(console.log)).toMatchSnapshot()
  })

  it("succeeds if \"failIfUnknownLogsFound\" is true and warning is inside \"exemptLogs\"", () => {
    const config = {
      ...baseConfig,
      failIfUnknownLogsFound: true,
      exemptLogs: [
        {
          "patterns": ["Error: Uncaught [TypeError: Cannot read property 'then' of undefined]"]
        }
      ],
    }
    const logs = [
      "Error: Uncaught [TypeError: Cannot read property 'then' of undefined]",
    ]
    fs.readFileSync.mockImplementationOnce(() => JSON.stringify(config))
    expect(() => { validateLogs(logs) }).not.toThrow()
  })
})
