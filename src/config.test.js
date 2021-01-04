const fs = require("fs")
const { getConfiguration, DEFAULT_CONFIG, PACKAGE_JSON_CONFIG_KEY } = require("./config")

jest.mock('fs', () => {
  return Object.assign(
    {},
    jest.requireActual('fs'),
    {
      existsSync: jest.fn().mockReturnValue(true),
      readFileSync: jest.fn().mockReturnValue(""),
    }
  )
});

// Mock return of require('/package.json')
// Virtual because it doesn't actually exist
jest.mock('/package.json', () => {
  return {
    name: 'foo',
    version: '1.0.0',
    "jest-reporter-log-validator": {
      "logValidations": [
        {
          "patterns": ["warning defined in package.json"],
          "max": 1
        }
      ],
    }
  }
}, {virtual: true});

describe("getConfiguration", () => {
  it("extends defaults with values from package.json", () => {
    expect(getConfiguration("/")).toEqual({
      ...DEFAULT_CONFIG,
      "logValidations": [
        {
          "patterns": ["warning defined in package.json"],
          "max": 1
        }
      ],
    })
  })

  it("extends config based on config file", () => {
    fs.readFileSync.mockImplementationOnce(() => JSON.stringify({
      "exemptLogs": [
        {
          "patterns": ["warning defined by config file"]
        }
      ]
    }))
    expect(getConfiguration("/")).toEqual({
      ...DEFAULT_CONFIG,
      "logValidations": [
        {
          "patterns": ["warning defined in package.json"],
          "max": 1
        }
      ],
      "exemptLogs": [
        {
          "patterns": ["warning defined by config file"]
        }
      ],
    })
  })
})