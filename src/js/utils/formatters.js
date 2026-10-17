/**
 * Formatting utilities for the Nutritional Z-Score Calculator
 * Provides consistent formatting for display values
 */

class Formatters {
    /**
     * Format age for display
     * @param {number} years - Age in years
     * @param {number} months - Age in months
     * @returns {string} Formatted age string
     */
    static formatAge(years, months) {
        if (years === 0) {
            return `${months} mois`;
        } else if (months === 0) {
            return `${years} an${years > 1 ? 's' : ''}`;
        } else {
            return `${years} an${years > 1 ? 's' : ''} et ${months} mois`;
        }
    }

    /**
     * Format weight for display
     * @param {number} weightGrams - Weight in grams
     * @returns {string} Formatted weight string
     */
    static formatWeight(weightGrams) {
        if (weightGrams >= 1000) {
            const kg = weightGrams / 1000;
            return `${kg.toFixed(2)} kg`;
        } else {
            return `${weightGrams} g`;
        }
    }

    /**
     * Format height for display
     * @param {number} heightCm - Height in centimeters
     * @returns {string} Formatted height string
     */
    static formatHeight(heightCm) {
        return `${heightCm} cm`;
    }

    /**
     * Format gender for display
     * @param {string} gender - Gender code ('M' or 'F')
     * @returns {string} Formatted gender string
     */
    static formatGender(gender) {
        return gender === 'M' ? 'Masculin' : 'Féminin';
    }

    /**
     * Format date for display
     * @param {Date} date - Date object
     * @returns {string} Formatted date string
     */
    static formatDate(date) {
        return date.toLocaleDateString('fr-FR');
    }

    /**
     * Format Z-score for display
     * @param {number} zscore - Z-score value
     * @returns {string} Formatted Z-score string
     */
    static formatZScore(zscore) {
        return zscore.toFixed(2);
    }

    /**
     * Format percentile for display
     * @param {number} percentile - Percentile value (0-100)
     * @returns {string} Formatted percentile string
     */
    static formatPercentile(percentile) {
        return `${percentile.toFixed(1)}%`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Formatters };
} else {
    window.Formatters = Formatters;
}