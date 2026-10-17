/**
 * Child Model Class
 * Represents a child with anthropometric data for Z-score calculation
 */

class Child {
    /**
     * Create a new Child instance
     * @param {Object} data - Child data
     * @param {string} [data.id] - Unique identifier
     * @param {string} [data.name] - Child's name (optional)
     * @param {number} data.ageYears - Age in years (0-5)
     * @param {number} data.ageMonths - Age in months (0-11)
     * @param {number} data.weight - Weight in grams
     * @param {number} data.height - Height in centimeters
     * @param {string} data.gender - Gender ('M' or 'F')
     * @param {Date} [data.createdAt] - Creation timestamp
     */
    constructor(data = {}) {
        // Validate and set properties
        this._validateAndSetData(data);
        
        // Set metadata
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = new Date();
        
        // Freeze the object to prevent accidental modifications
        Object.seal(this);
    }

    /**
     * Validate and set child data
     * @private
     * @param {Object} data - Raw child data
     */
    _validateAndSetData(data) {
        try {
            // Validate all data using the Validators utility
            const validated = Validators.validateChildData(data);
            
            // Set validated properties
            this.id = data.id || this._generateId();
            this.name = validated.name || `Individu n°${this._extractNumberFromId()}`;
            this.ageYears = validated.ageYears;
            this.ageMonths = validated.ageMonths;
            this.weight = validated.weight;
            this.height = validated.height;
            this.gender = validated.gender;
            
        } catch (error) {
            if (error.errors) {
                // Multiple validation errors
                throw new ValidationError(
                    `Erreurs de validation pour l'enfant: ${error.errors.map(e => e.message).join(', ')}`,
                    'child',
                    'MULTIPLE_VALIDATION_ERRORS'
                );
            } else {
                // Single validation error
                throw error;
            }
        }
    }

    /**
     * Generate a unique ID for the child
     * @private
     * @returns {string} Unique identifier
     */
    _generateId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `child_${timestamp}_${random}`;
    }

    /**
     * Extract number from ID for default naming
     * @private
     * @returns {string} Number for default name
     */
    _extractNumberFromId() {
        const match = this.id.match(/\d+/);
        return match ? match[0].substring(-3) : Math.floor(Math.random() * 999).toString().padStart(3, '0');
    }

    /**
     * Get total age in months
     * @returns {number} Total age in months
     */
    get totalAgeMonths() {
        return (this.ageYears * 12) + this.ageMonths;
    }

    /**
     * Get weight in kilograms
     * @returns {number} Weight in kg
     */
    get weightKg() {
        return this.weight / 1000;
    }

    /**
     * Get height in meters
     * @returns {number} Height in meters
     */
    get heightM() {
        return this.height / 100;
    }

    /**
     * Calculate basic BMI (for reference, not Z-score)
     * @returns {number} BMI value
     */
    get bmi() {
        return this.weightKg / (this.heightM * this.heightM);
    }

    /**
     * Get formatted age string
     * @returns {string} Formatted age
     */
    get formattedAge() {
        return Formatters.formatAge(this.ageYears, this.ageMonths);
    }

    /**
     * Get formatted weight string
     * @returns {string} Formatted weight
     */
    get formattedWeight() {
        return Formatters.formatWeight(this.weight);
    }

    /**
     * Get formatted height string
     * @returns {string} Formatted height
     */
    get formattedHeight() {
        return Formatters.formatHeight(this.height);
    }

    /**
     * Get formatted gender string
     * @returns {string} Formatted gender
     */
    get formattedGender() {
        return Formatters.formatGender(this.gender);
    }

    /**
     * Validate the current child data
     * @returns {boolean} True if valid
     * @throws {ValidationError} If validation fails
     */
    validate() {
        try {
            Validators.validateChildData({
                name: this.name,
                ageYears: this.ageYears,
                ageMonths: this.ageMonths,
                weight: this.weight,
                height: this.height,
                gender: this.gender
            });
            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update child data
     * @param {Object} updates - Data to update
     * @returns {Child} Updated child instance
     */
    update(updates) {
        const newData = {
            id: this.id,
            name: updates.name !== undefined ? updates.name : this.name,
            ageYears: updates.ageYears !== undefined ? updates.ageYears : this.ageYears,
            ageMonths: updates.ageMonths !== undefined ? updates.ageMonths : this.ageMonths,
            weight: updates.weight !== undefined ? updates.weight : this.weight,
            height: updates.height !== undefined ? updates.height : this.height,
            gender: updates.gender !== undefined ? updates.gender : this.gender,
            createdAt: this.createdAt
        };

        // Validate updated data
        this._validateAndSetData(newData);
        this.updatedAt = new Date();
        
        return this;
    }

    /**
     * Clone the child with optional modifications
     * @param {Object} [modifications] - Optional modifications to apply
     * @returns {Child} New child instance
     */
    clone(modifications = {}) {
        const data = {
            name: this.name,
            ageYears: this.ageYears,
            ageMonths: this.ageMonths,
            weight: this.weight,
            height: this.height,
            gender: this.gender,
            ...modifications
        };
        
        return new Child(data);
    }

    /**
     * Convert child to plain object for serialization
     * @returns {Object} Plain object representation
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            ageYears: this.ageYears,
            ageMonths: this.ageMonths,
            totalAgeMonths: this.totalAgeMonths,
            weight: this.weight,
            height: this.height,
            gender: this.gender,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString()
        };
    }

    /**
     * Convert child to object for display
     * @returns {Object} Display-friendly object
     */
    toDisplayObject() {
        return {
            id: this.id,
            name: this.name,
            age: this.formattedAge,
            weight: this.formattedWeight,
            height: this.formattedHeight,
            gender: this.formattedGender,
            totalAgeMonths: this.totalAgeMonths,
            bmi: this.bmi.toFixed(1),
            createdAt: Formatters.formatDate(this.createdAt)
        };
    }

    /**
     * Get summary string for the child
     * @returns {string} Summary string
     */
    toString() {
        return `${this.name} (${this.formattedAge}, ${this.formattedGender}, ${this.formattedWeight}, ${this.formattedHeight})`;
    }

    /**
     * Check if child data is suitable for Z-score calculation
     * @returns {Object} Suitability check result
     */
    checkZScoreSuitability() {
        const issues = [];
        
        // Check age range (WHO standards are for 0-60 months)
        if (this.totalAgeMonths > 60) {
            issues.push('Âge supérieur à 60 mois (limite des standards OMS)');
        }
        
        // Check for extreme values that might indicate data entry errors
        if (this.bmi < 10) {
            issues.push('IMC très faible, vérifier les données');
        }
        
        if (this.bmi > 35) {
            issues.push('IMC très élevé, vérifier les données');
        }
        
        return {
            suitable: issues.length === 0,
            issues: issues,
            warnings: issues.length > 0 ? ['Données inhabituelles détectées'] : []
        };
    }

    /**
     * Create Child instance from JSON
     * @static
     * @param {Object} json - JSON object
     * @returns {Child} Child instance
     */
    static fromJSON(json) {
        const data = {
            id: json.id,
            name: json.name,
            ageYears: json.ageYears,
            ageMonths: json.ageMonths,
            weight: json.weight,
            height: json.height,
            gender: json.gender,
            createdAt: json.createdAt ? new Date(json.createdAt) : undefined
        };
        
        return new Child(data);
    }

    /**
     * Create multiple Child instances from array
     * @static
     * @param {Array} dataArray - Array of child data objects
     * @returns {Array<Child>} Array of Child instances
     */
    static fromArray(dataArray) {
        return dataArray.map(data => new Child(data));
    }

    /**
     * Validate child data without creating instance
     * @static
     * @param {Object} data - Child data to validate
     * @returns {Object} Validation result
     */
    static validateData(data) {
        try {
            Validators.validateChildData(data);
            return { valid: true, errors: [] };
        } catch (error) {
            return {
                valid: false,
                errors: error.errors || [Validators.formatError(error)]
            };
        }
    }

    /**
     * Get default child data template
     * @static
     * @returns {Object} Default child data template
     */
    static getDefaultData() {
        return {
            name: '',
            ageYears: 0,
            ageMonths: 0,
            weight: 3000, // 3kg default
            height: 50,   // 50cm default
            gender: 'M'
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Child };
} else {
    window.Child = Child;
}