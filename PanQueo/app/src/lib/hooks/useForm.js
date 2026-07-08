import { useState, useCallback } from 'react';
import { validate } from '../utils/validators';

export const useForm = (initialValues, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  }, []);

  const handleBlur = useCallback(
    (field) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      if (validationRules[field]) {
        const fieldErrors = validate(
          { [field]: values[field] },
          { [field]: validationRules[field] }
        );
        setErrors((prev) => ({ ...prev, [field]: fieldErrors[field] || null }));
      }
    },
    [values, validationRules]
  );

  const validateAll = useCallback(() => {
    const allErrors = validate(values, validationRules);
    setErrors(allErrors);
    setTouched(
      Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );
    return Object.keys(allErrors).length === 0;
  }, [values, validationRules]);

  const reset = useCallback((newValues) => {
    setValues(newValues || initialValues);
    setErrors({});
    setTouched({});
  }, []);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    setValues,
  };
};
