const { italic } = require('chalk')
const { schemaIsValid } = require('./schema')

beforeEach(() => {
  console.error = jest.fn()
})

describe("schemaIsValid", () => {
  it("Fails when schema is invalid", () => {
    const objToValidate = {
      logValidations: [
        {
          max: 10
        },
        {
          patterns: []
        }
      ],
    }
    const { valid, errors } = schemaIsValid(objToValidate)
    expect(valid).toBe(false)
    expect(errors.length).not.toBe(0)
  })
})