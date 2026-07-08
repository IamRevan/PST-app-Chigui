export const required = (value) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return 'Este campo es requerido';
  }
  return null;
};

export const isEmail = (value) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(value)) return 'Correo inválido';
  return null;
};

export const isPhone = (value) => {
  const re = /^[\d\s\-+()]{7,15}$/;
  if (!re.test(value)) return 'Teléfono inválido';
  return null;
};

export const isCedula = (value) => {
  const re = /^[VEJPG]\d{4,10}$/i;
  if (!re.test(value)) return 'Cédula inválida (ej: V12345678)';
  return null;
};

export const minLength = (min) => (value) => {
  if (value && value.length < min) return `Mínimo ${min} caracteres`;
  return null;
};

export const isPositiveNumber = (value) => {
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) return 'Debe ser un número positivo';
  return null;
};

export const validate = (values, rules) => {
  const errors = {};
  for (const [field, fieldRules] of Object.entries(rules)) {
    for (const rule of fieldRules) {
      const error = rule(values[field]);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  }
  return errors;
};
