const yup = require("yup")

const schema = yup.object().shape({
  logValidations: yup.array().of(yup.object().shape({
    patterns: yup.array().of(yup.string()).required(),
    max: yup.number().required()
  })),
  exemptLogs: yup.array().of(yup.object().shape({
    patterns: yup.array().of(yup.string()).required()
  })),
  failIfUnknownLogsFound: yup.bool(),
  failIfLogValidationsOutdated: yup.bool(),
}).strict().noUnknown()

function schemaIsValid(objectToValidate) {
  let valid = false
  let errors = []
  try {
    schema.validateSync(objectToValidate, { abortEarly: false })
    valid = true
  } catch(err) {
    errors = err.errors || []
  }
  return {
    valid,
    errors
  }
}

module.exports = {
  schemaIsValid
}
