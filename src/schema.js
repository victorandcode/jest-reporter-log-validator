const ALLOWED_KEYS = new Set([
  "exemptLogs",
  "failIfLogValidationsOutdated",
  "failIfUnknownLogsFound",
  "logValidations",
])

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function validatePatterns(value, path, errors) {
  if (value === undefined) {
    errors.push(`${path} is a required field`)
    return
  }
  if (!Array.isArray(value)) {
    errors.push(`${path} must be a \`array\` type`)
    return
  }
  value.forEach((pattern, index) => {
    if (typeof pattern !== "string") {
      errors.push(`${path}[${index}] must be a \`string\` type`)
    }
  })
}

function validateLogValidations(value, errors) {
  if (value === undefined) {
    return
  }
  if (!Array.isArray(value)) {
    errors.push("logValidations must be a `array` type")
    return
  }
  value.forEach((validation, index) => {
    const path = `logValidations[${index}]`
    if (!isObject(validation)) {
      errors.push(`${path} must be a \`object\` type`)
      return
    }
    validatePatterns(validation.patterns, `${path}.patterns`, errors)
    if (validation.max === undefined) {
      errors.push(`${path}.max is a required field`)
    } else if (typeof validation.max !== "number") {
      errors.push(`${path}.max must be a \`number\` type`)
    }
  })
}

function validateExemptLogs(value, errors) {
  if (value === undefined) {
    return
  }
  if (!Array.isArray(value)) {
    errors.push("exemptLogs must be a `array` type")
    return
  }
  value.forEach((exemptLog, index) => {
    const path = `exemptLogs[${index}]`
    if (!isObject(exemptLog)) {
      errors.push(`${path} must be a \`object\` type`)
      return
    }
    validatePatterns(exemptLog.patterns, `${path}.patterns`, errors)
  })
}

function schemaIsValid(objectToValidate) {
  const errors = []
  if (!isObject(objectToValidate)) {
    return {
      valid: false,
      errors: ["configuration must be a `object` type"],
    }
  }

  for (const key of Object.keys(objectToValidate)) {
    if (!ALLOWED_KEYS.has(key)) {
      errors.push(`${key} is not allowed`)
    }
  }

  validateLogValidations(objectToValidate.logValidations, errors)
  validateExemptLogs(objectToValidate.exemptLogs, errors)

  for (const key of ["failIfUnknownLogsFound", "failIfLogValidationsOutdated"]) {
    if (objectToValidate[key] !== undefined && typeof objectToValidate[key] !== "boolean") {
      errors.push(`${key} must be a \`boolean\` type`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

module.exports = {
  schemaIsValid,
}
