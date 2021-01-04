const { validateLogs } = require("./validate-logs")
const fs = require('fs')

jest.mock("fs")

const validConfig = {
  "logsWithLimit": [
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
  "failIfUnknownWarningsFound": false,
  "failIfLogRestrictionsOutdated": false
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
    fs.readFileSync.mockImplementationOnce(() => JSON.stringify(validConfig))
    expect(() => validateLogs(logs)).toThrow(new Error("Error while validating log restrictions. See above for detailed report."))
  })

  it("succeeds if no log max is exceeded", () => {
    const logs = [
      'Warning: Each child in a list should have a unique "key" prop',
      "`wait` has been deprecated and replaced by `waitFor` instead.",
      'Warning: Each child in a list should have a unique "key" prop',
    ]
    fs.readFileSync.mockImplementationOnce(() => JSON.stringify(validConfig))
    expect(() => validateLogs(logs)).not.toThrow()
  })

  it("throws if config file isn't present", () => {
    const logs = ['Warning: Each child in a list should have a unique "key" prop']
    fs.readFileSync.mockImplementationOnce(() => { throw Error("File not found") })
    expect(() => validateLogs(logs)).toThrow(new Error("File not found"))
  })

  it("fails if failIfLogRestrictionsOutdated is set to true and log max has decrased", () => {
    const config = {
      ...validConfig,
      failIfLogRestrictionsOutdated: true
    }
    const logs = [ 
      'Warning: Each child in a list should have a unique "key" prop',
      "`wait` has been deprecated and replaced by `waitFor` instead.",
    ]
    fs.readFileSync.mockImplementationOnce(() => JSON.stringify(config))
    expect(() => validateLogs(logs)).toThrow(new Error("Log restrictions are outdated. See above for detailed report."))
  })

  it.skip("throws if schema doesn't have the correct structure", () => {
    const invalidConfig = {
      "logsWithLimit": [
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

  it("fails if \"failIfUnknownWarningsFound\" is set to true and unknown warning is found", () => {
    const config = {
      ...validConfig,
      failIfUnknownWarningsFound: true
    }
    const logs = [ 
      'Warning: Each child in a list should have a unique "key" prop',
      // The following warning does not exist in the configuration
      "Warning: React.createFactory() is deprecated and will be removed in a future major release. Consider using JSX or use React.createElement() directly instead.",
    ]
    fs.readFileSync.mockImplementationOnce(() => JSON.stringify(config))
    expect(() => { validateLogs(logs) }).toThrow(new Error("Unknown warnings were found. See above for more details."))
  })

  it.todo("it succeed if warning without limit is found")
})
