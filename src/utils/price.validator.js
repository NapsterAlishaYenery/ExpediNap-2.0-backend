
const priceValidator = {
  validator: value => {
    // Si es null, permitimos que pase la validación de formato.
    // La obligación de si puede ser null o no la decide el "required" en el Schema.
    if (value === null) return true;

    return (
      Number.isFinite(value) && 
      /^\d+(\.\d{1,2})?$/.test(value.toString())
    );
  },
  message: 'Price must be a valid number with up to 2 decimal places'
};

module.exports = priceValidator;