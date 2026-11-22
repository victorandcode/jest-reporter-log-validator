const { spawnSync } = require("child_process")
const fs = require("fs")
const os = require("os")
const path = require("path")

const jestBin = require.resolve("jest/bin/jest")
const jestMajor = Number(require("jest/package.json").version.split(".")[0])
const reporterPath = path.resolve(__dirname, "../src/reporter.js")

function runFixture({ warning, options, verbose }) {
  const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "jrlv-integration-"))

  try {
    const config = {
      rootDir: fixtureDir,
      testEnvironment: "node",
      testMatch: ["<rootDir>/*.test.js"],
      reporters: ["default", [reporterPath, options]],
    }

    if (verbose !== undefined) {
      config.verbose = verbose
    }

    fs.writeFileSync(
      path.join(fixtureDir, "jest.config.js"),
      `module.exports = ${JSON.stringify(config, null, 2)}\n`,
    )
    fs.writeFileSync(
      path.join(fixtureDir, "sample.test.js"),
      `test("logs a warning", () => {\n  console.warn(${JSON.stringify(warning)})\n  expect(true).toBe(true)\n})\n`,
    )

    return spawnSync(
      process.execPath,
      [jestBin, "--config", "jest.config.js", "--runInBand", "--no-cache"],
      {
        cwd: fixtureDir,
        encoding: "utf8",
        env: {
          ...process.env,
          CI: "1",
          FORCE_COLOR: "0",
        },
      },
    )
  } finally {
    fs.rmSync(fixtureDir, { force: true, recursive: true })
  }
}

test("fails the Jest run when an unknown log is found", () => {
  const result = runFixture({
    warning: "Integration unknown warning",
    options: {
      logValidations: [],
      failIfUnknownLogsFound: true,
      failIfLogValidationsOutdated: false,
    },
    verbose: false,
  })

  expect(result.status).toBe(1)
  expect(result.stdout).toContain("Unknown log messages are not allowed")
})

test("passes when a log matches its validation", () => {
  const result = runFixture({
    warning: "Integration allowed warning",
    options: {
      logValidations: [{ patterns: ["Integration allowed warning"], max: 1 }],
      failIfUnknownLogsFound: true,
      failIfLogValidationsOutdated: true,
    },
    verbose: false,
  })

  expect(result.status).toBe(0)
})

const testVerbose = jestMajor >= 30 ? test : test.skip

testVerbose("validates in verbose mode when Jest exposes console output", () => {
  const result = runFixture({
    warning: "Integration verbose warning",
    options: {
      logValidations: [],
      failIfUnknownLogsFound: true,
      failIfLogValidationsOutdated: false,
    },
    verbose: true,
  })

  expect(result.status).toBe(1)
  expect(result.stdout).toContain("Unknown log messages are not allowed")
})
