/**
 * Validation utilities for the Nutritional Z-Score Calculator
 * Provides comprehensive validation for child data inputs
 */

class ValidationError extends Error {
    constructor(message, field = null, code = null) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
        this.code = code;
    }
}

class Validators {
    /**
     * Validate age in years
     * @param {number} years - Age in years
     * @throws {ValidationError} If age is invalid
     */
    static validateAgeYears(years) {
        if (years === null || years === undefined || years === '') {
            throw new ValidationError('L\'âge en années est requis', 'ageYears', 'REQUIRED');
        }

        const numYears = Number(years);

        if (!Number.isFinite(numYears)) {
            throw new ValidationError('L\'âge en années doit être un nombre', 'ageYears', 'INVALID_TYPE');
        }

        if (numYears < 0) {
            throw new ValidationError('L\'âge ne peut pas être négatif', 'ageYears', 'NEGATIVE_VALUE');
        }

        if (numYears > 5) {
            throw new ValidationError('L\'âge maximum supporté est 5 ans', 'ageYears', 'MAX_EXCEEDED');
        }

        if (!Number.isInteger(numYears)) {
            throw new ValidationError('L\'âge en années doit être un nombre entier', 'ageYears', 'NOT_INTEGER');
        }

        return numYears;
    }

    /**
     * Validate age in months
     * @param {number} months - Age in months
     * @throws {ValidationError} If age is invalid
     */
    static validateAgeMonths(months) {
        if (months === null || months === undefined || months === '') {
            throw new ValidationError('L\'âge en mois est requis', 'ageMonths', 'REQUIRED');
        }

        const numMonths = Number(months);

        if (!Number.isFinite(numMonths)) {
            throw new ValidationError('L\'âge en mois doit être un nombre', 'ageMonths', 'INVALID_TYPE');
        }

        if (numMonths < 0) {
            throw new ValidationError('L\'âge en mois ne peut pas être négatif', 'ageMonths', 'NEGATIVE_VALUE');
        }

        if (numMonths > 11) {
            throw new ValidationError('L\'âge en mois doit être entre 0 et 11', 'ageMonths', 'MAX_EXCEEDED');
        }

        if (!Number.isInteger(numMonths)) {
            throw new ValidationError('L\'âge en mois doit être un nombre entier', 'ageMonths', 'NOT_INTEGER');
        }

        return numMonths;
    }

    /**
     * Validate total age in months (combined years + months)
     * @param {number} totalMonths - Total age in months
     * @throws {ValidationError} If total age is invalid
     */
    static validateTotalAgeMonths(totalMonths) {
        if (totalMonths === null || totalMonths === undefined || totalMonths === '') {
            throw new ValidationError('L’âge total est requis', 'totalAge', 'REQUIRED');
        }
        const numTotalMonths = Number(totalMonths);

        if (!Number.isFinite(numTotalMonths)) {
            throw new ValidationError('L\'âge total doit être un nombre', 'totalAge', 'INVALID_TYPE');
        }

        if (numTotalMonths < 0) {
            throw new ValidationError('L\'âge total ne peut pas être négatif', 'totalAge', 'NEGATIVE_VALUE');
        }

        if (numTotalMonths > 60) {
            throw new ValidationError('L\'âge maximum supporté est 60 mois (5 ans)', 'totalAge', 'MAX_EXCEEDED');
        }

        return numTotalMonths;
    }

    /**
     * Validate weight in grams
     * @param {number} weight - Weight in grams
     * @throws {ValidationError} If weight is invalid
     */
    static validateWeight(weight) {
        if (weight === null || weight === undefined || weight === '') {
            throw new ValidationError('Le poids est requis', 'weight', 'REQUIRED');
        }

        const numWeight = Number(weight);

        if (!Number.isFinite(numWeight)) {
            throw new ValidationError('Le poids doit être un nombre', 'weight', 'INVALID_TYPE');
        }

        if (numWeight <= 0) {
            throw new ValidationError('Le poids doit être positif', 'weight', 'NEGATIVE_OR_ZERO');
        }

        if (numWeight < 50) {
            throw new ValidationError('Le poids minimum réaliste est 50 grammes', 'weight', 'MIN_NOT_REACHED');
        }

        if (numWeight > 50000) {
            throw new ValidationError('Le poids maximum réaliste est 50 kg (50000 grammes)', 'weight', 'MAX_EXCEEDED');
        }

        return numWeight;
    }

    /**
     * Validate height in centimeters
     * @param {number} height - Height in centimeters
     * @throws {ValidationError} If height is invalid
     */
    static validateHeight(height) {
        if (height === null || height === undefined || height === '') {
            throw new ValidationError('La taille est requise', 'height', 'REQUIRED');
        }

        const numHeight = Number(height);

        if (!Number.isFinite(numHeight)) {
            throw new ValidationError('La taille doit être un nombre', 'height', 'INVALID_TYPE');
        }

        if (numHeight <= 0) {
            throw new ValidationError('La taille doit être positive', 'height', 'NEGATIVE_OR_ZERO');
        }

        if (numHeight < 30) {
            throw new ValidationError('La taille minimum réaliste est 30 cm', 'height', 'MIN_NOT_REACHED');
        }

        if (numHeight > 150) {
            throw new ValidationError('La taille maximum réaliste est 150 cm', 'height', 'MAX_EXCEEDED');
        }

        return numHeight;
    }

    /**
     * Validate gender
     * @param {string} gender - Gender ('M' for male, 'F' for female)
     * @throws {ValidationError} If gender is invalid
     */
    static validateGender(gender) {
        if (!gender || gender === '') {
            throw new ValidationError('Le sexe est requis', 'gender', 'REQUIRED');
        }

        const normalizedGender = String(gender).toUpperCase().trim();

        if (normalizedGender !== 'M' && normalizedGender !== 'F') {
            throw new ValidationError('Le sexe doit être "M" (masculin) ou "F" (féminin)', 'gender', 'INVALID_VALUE');
        }

        return normalizedGender;
    }

    /**
     * Validate child name (optional field)
     * @param {string} name - Child name
     * @throws {ValidationError} If name is invalid
     */
    static validateName(name) {
        if (name === null || name === undefined) {
            return ''; // Name is optional
        }

        const strName = String(name).trim();

        if (strName.length > 100) {
            throw new ValidationError('Le nom ne peut pas dépasser 100 caractères', 'name', 'MAX_LENGTH_EXCEEDED');
        }

        // Check for potentially harmful characters
        const dangerousChars = /[<>\"'&]/;
        if (dangerousChars.test(strName)) {
            throw new ValidationError('Le nom contient des caractères non autorisés', 'name', 'INVALID_CHARACTERS');
        }

        return strName;
    }

    /**
     * Validate ID (for internal use)
     * @param {string} id - Unique identifier
     * @throws {ValidationError} If ID is invalid
     */
    static validateId(id) {
        if (!id || id === '') {
            throw new ValidationError('L\'identifiant est requis', 'id', 'REQUIRED');
        }

        const strId = String(id).trim();

        if (strId.length < 1 || strId.length > 50) {
            throw new ValidationError('L\'identifiant doit faire entre 1 et 50 caractères', 'id', 'INVALID_LENGTH');
        }

        // Check for valid ID format (alphanumeric, hyphens, underscores)
        const validIdPattern = /^[a-zA-Z0-9_-]+$/;
        if (!validIdPattern.test(strId)) {
            throw new ValidationError('L\'identifiant ne peut contenir que des lettres, chiffres, tirets et underscores', 'id', 'INVALID_FORMAT');
        }

        return strId;
    }

    /**
     * Validate date
     * @param {Date|string} date - Date to validate
     * @throws {ValidationError} If date is invalid
     */
    static validateDate(date) {
        if (!date) {
            throw new ValidationError('La date est requise', 'date', 'REQUIRED');
        }

        let dateObj;

        if (date instanceof Date) {
            dateObj = date;
        } else {
            dateObj = new Date(date);
        }

        if (isNaN(dateObj.getTime())) {
            throw new ValidationError('Date invalide', 'date', 'INVALID_DATE');
        }

        // Check if date is not in the future
        const now = new Date();
        if (dateObj > now) {
            throw new ValidationError('La date ne peut pas être dans le futur', 'date', 'FUTURE_DATE');
        }

        // Check if date is not too far in the past (more than 10 years)
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

        if (dateObj < tenYearsAgo) {
            throw new ValidationError('La date ne peut pas être antérieure à 10 ans', 'date', 'TOO_OLD');
        }

        return dateObj;
    }

    /**
     * Comprehensive validation for age consistency
     * @param {number} ageYears - Age in years
     * @param {number} ageMonths - Age in months
     * @throws {ValidationError} If ages are inconsistent
     */
    static validateAgeConsistency(ageYears, ageMonths) {
        const validatedYears = this.validateAgeYears(ageYears);
        const validatedMonths = this.validateAgeMonths(ageMonths);

        const totalMonths = (validatedYears * 12) + validatedMonths;

        this.validateTotalAgeMonths(totalMonths);

        return {
            years: validatedYears,
            months: validatedMonths,
            totalMonths: totalMonths
        };
    }

    /**
     * Validate weight-height ratio for basic sanity check
     * @param {number} weight - Weight in grams
     * @param {number} height - Height in cm
     * @throws {ValidationError} If ratio is unrealistic
     */
    static validateWeightHeightRatio(weight, height) {
        const validatedWeight = this.validateWeight(weight);
        const validatedHeight = this.validateHeight(height);

        // Convert weight to kg for ratio calculation
        const weightKg = validatedWeight / 1000;

        // Basic BMI-like check (weight in kg / height in meters squared)
        const heightM = validatedHeight / 100;
        const bmi = weightKg / (heightM * heightM);

        // Very loose bounds for children (BMI between 5 and 40)
        if (bmi < 5) {
            throw new ValidationError('Le rapport poids/taille semble trop faible', 'weightHeight', 'RATIO_TOO_LOW');
        }

        if (bmi > 40) {
            throw new ValidationError('Le rapport poids/taille semble trop élevé', 'weightHeight', 'RATIO_TOO_HIGH');
        }

        return {
            weight: validatedWeight,
            height: validatedHeight,
            bmi: bmi
        };
    }

    /**
     * Sanitize input string
     * @param {string} input - Input to sanitize
     * @returns {string} Sanitized input
     */
    static sanitizeInput(input) {
        if (input === null || input === undefined) {
            return '';
        }

        return String(input)
            .trim()
            .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
            .substring(0, 1000); // Limit length
    }

    /**
     * Format validation errors for user display
     * @param {ValidationError} error - Validation error
     * @returns {Object} Formatted error object
     */
    static formatError(error) {
        return {
            message: error.message,
            field: error.field,
            code: error.code,
            type: 'validation'
        };
    }

    /**
     * Validate all child data at once
     * @param {Object} childData - Child data object
     * @returns {Object} Validated and sanitized data
     * @throws {ValidationError} If any validation fails
     */
    static validateChildData(childData) {
        const errors = [];
        const validated = {};

        try {
            validated.name = this.validateName(childData.name);
        } catch (error) {
            errors.push(this.formatError(error));
        }

        try {
            const ageValidation = this.validateAgeConsistency(childData.ageYears, childData.ageMonths);
            validated.ageYears = ageValidation.years;
            validated.ageMonths = ageValidation.months;
            validated.totalAgeMonths = ageValidation.totalMonths;
        } catch (error) {
            errors.push(this.formatError(error));
        }

        try {
            validated.gender = this.validateGender(childData.gender);
        } catch (error) {
            errors.push(this.formatError(error));
        }

        try {
            const weightHeightValidation = this.validateWeightHeightRatio(childData.weight, childData.height);
            validated.weight = weightHeightValidation.weight;
            validated.height = weightHeightValidation.height;
        } catch (error) {
            errors.push(this.formatError(error));
        }

        if (errors.length > 0) {
            const combinedError = new ValidationError('Erreurs de validation multiples');
            combinedError.errors = errors;
            throw combinedError;
        }

        return validated;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Validators, ValidationError };
} else {
    window.Validators = Validators;
    window.ValidationError = ValidationError;
}
