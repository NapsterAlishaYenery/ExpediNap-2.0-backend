const stringArrayValidator = ({ allowEmpty = false } = {}) => ({
  validator: value => {
    if (!Array.isArray(value)) return false;

    if (value.length === 0) return allowEmpty;

    const seen = new Set();

    for (const item of value) {
      if (typeof item !== 'string') return false;
      
      const normalized = item.trim().toLowerCase();
      
      // No permitimos strings que solo sean espacios o estén vacíos
      if (normalized === '' || seen.has(normalized)) return false;
      
      seen.add(normalized);
    }

    return true;
  },
  
  message: 'Must be an array of unique, non-empty strings'
});

module.exports = stringArrayValidator