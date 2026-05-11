// src/hooks/useFormValidation.js
import { useState, useCallback } from 'react';

export const useFormValidation = (initialValues, validationRules) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    const validate = useCallback((name, value) => {
        const rules = validationRules[name];
        if (!rules) return '';

        if (rules.required && !value) {
            return `${name} is required`;
        }

        if (rules.minLength && value.length < rules.minLength) {
            return `${name} must be at least ${rules.minLength} characters`;
        }

        if (rules.maxLength && value.length > rules.maxLength) {
            return `${name} must be less than ${rules.maxLength} characters`;
        }

        if (rules.pattern && !rules.pattern.test(value)) {
            return rules.message || `${name} is invalid`;
        }

        if (rules.match && value !== values[rules.match]) {
            return `${name} does not match`;
        }

        if (rules.validate) {
            return rules.validate(value, values);
        }

        return '';
    }, [values, validationRules]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setValues(prev => ({ ...prev, [name]: value }));
        
        if (touched[name]) {
            const error = validate(name, value);
            setErrors(prev => ({ ...prev, [name]: error }));
        }
    }, [touched, validate]);

    const handleBlur = useCallback((e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validate(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    }, [validate]);

    const isValid = useCallback(() => {
        const newErrors = {};
        Object.keys(validationRules).forEach(key => {
            const error = validate(key, values[key]);
            if (error) newErrors[key] = error;
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [values, validate, validationRules]);

    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
    }, [initialValues]);

    return {
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        isValid,
        resetForm,
        setValues
    };
};