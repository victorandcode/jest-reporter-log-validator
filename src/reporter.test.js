const JestReporterLogValidator = require("./reporter")
const { validateLogs } = require("./validate-logs")
const { getConfiguration } = require("./config")

jest.mock("./validate-logs", () => ({
  validateLogs: jest.fn(),
}))

jest.mock("./config", () => ({
  getConfiguration: jest.fn(),
}))

function createReporter({ verbose = false, options = {} } = {}) {
  return new JestReporterLogValidator({ verbose }, options)
}

beforeEach(() => {
  jest.clearAllMocks()
  getConfiguration.mockReturnValue({})
  validateLogs.mockReturnValue(true)
})

describe("JestReporterLogValidator", () => {
  it("validates console messages in verbose mode when they are available", () => {
    const reporter = createReporter({ verbose: true })
    reporter.onTestResult(
      {},
      {
        console: [{ message: "first warning" }, { message: "second warning" }],
      },
    )

    expect(reporter.getLastError()).toBeUndefined()
    expect(validateLogs).toHaveBeenCalledWith({}, ["first warning", "second warning"])
  })

  it("returns an error when validation fails in verbose mode", () => {
    validateLogs.mockReturnValue(false)
    const reporter = createReporter({ verbose: true })
    reporter.onTestResult({}, { console: [{ message: "unknown warning" }] })

    expect(reporter.getLastError()).toBeInstanceOf(Error)
  })

  it("validates when console output is an empty array in verbose mode", () => {
    const reporter = createReporter({ verbose: true })
    reporter.onTestResult({}, { console: [] })

    expect(reporter.getLastError()).toBeUndefined()
    expect(validateLogs).toHaveBeenCalledWith({}, [])
  })

  it("skips validation in verbose mode when console output is not available", () => {
    const reporter = createReporter({ verbose: true })
    reporter.onTestResult({}, {})

    expect(reporter.getLastError()).toBeUndefined()
    expect(getConfiguration).not.toHaveBeenCalled()
    expect(validateLogs).not.toHaveBeenCalled()
  })

  it("validates normally when not in verbose mode", () => {
    const reporter = createReporter({ verbose: false })
    reporter.onTestResult({}, { console: [{ message: "warning" }] })

    expect(reporter.getLastError()).toBeUndefined()
    expect(validateLogs).toHaveBeenCalledWith({}, ["warning"])
  })

  it("returns configuration errors instead of throwing", () => {
    getConfiguration.mockImplementation(() => {
      throw new Error("invalid config")
    })
    const reporter = createReporter()

    expect(reporter.getLastError()).toEqual(new Error("invalid config"))
  })
})
