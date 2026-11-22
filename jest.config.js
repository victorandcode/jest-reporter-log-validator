/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.test.js", "<rootDir>/test/**/*.test.js"],
  testTimeout: 20000,
}
