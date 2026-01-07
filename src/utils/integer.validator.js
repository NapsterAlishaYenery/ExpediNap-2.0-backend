
// Validar que solo sea entero numero entero
const integerValidator = {
    validator: value => {
    return Number.isInteger(value);
  },
  message: 'Value must be an integer'
}

module.exports = integerValidator