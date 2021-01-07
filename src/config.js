const fs = require("fs")
const path = require('path');

const DEFAULT_CONFIG = {
  "logValidations": [],
  "failIfLogValidationsOutdated": true,
  "failIfUnknownLogsFound": false,
  "exemptLogs": [],
}
const PACKAGE_JSON_CONFIG_KEY = "jest-reporter-log-validator"
const CONFIG_FILE_NAME = ".jest-reporter-log-validator-config.json"

function getConfiguration(pathToResolve, reporterOptions = {}) {
  return Object.assign(
    {},
    DEFAULT_CONFIG, 
    getFromPackageJson(pathToResolve),
    reporterOptions,
    getFromConfigFile(pathToResolve)
  )
}

// Copied from https://github.com/jest-community/jest-junit/blob/master/utils/getOptions.js
function getFromPackageJson(pathToResolve) {
  let traversing = true;

  // Find nearest package.json by traversing up directories until /
  while(traversing) {
    traversing = pathToResolve !== path.sep;

    const pkgpath = path.join(pathToResolve, 'package.json');

    if (fs.existsSync(pkgpath)) {
      let options = (require(pkgpath) || {})[PACKAGE_JSON_CONFIG_KEY];

      if (Object.prototype.toString.call(options) !== '[object Object]') {
        options = {};
      }

      return options;
    } else {
      pathToResolve = path.dirname(pathToResolve);
    }
  }

  return {};
}

function getFromConfigFile(pathToResolve) {
  const pkgPath = path.join(pathToResolve, CONFIG_FILE_NAME)
  if (fs.existsSync(pkgPath)) {
    const configFile = fs.readFileSync(pkgPath, "utf8")
    if (configFile) {
      return JSON.parse(configFile)
    }
  }
  return {}
}

module.exports = { getConfiguration, DEFAULT_CONFIG, PACKAGE_JSON_CONFIG_KEY }