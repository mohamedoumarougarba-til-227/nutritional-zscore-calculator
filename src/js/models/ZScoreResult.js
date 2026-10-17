/**
 * ZScoreResult Model Class
 * Represents the results of Z-score calculations for a child
 */

class ZScoreResult {
    /**
     * Create a new ZScoreResult instance
     * @param {Object} data - Result data
     * @param {string} data.childId - Reference to child ID
     * @param {string} data.childName - Child's name for display
     * @param {Object} [data.weightForAge] - Weight-for-age Z-score data
     * @param {Object} [data.heightForAge] - Height-for-age Z-score data
     * @param {Object} [data.weightForHeight] - Weight-for-height Z-score data
     * @param {Date} [data.calculatedAt] - Calculation timestamp
     */
    constructor(data = {}) {
        this.id = data.id || this._generateId();
        this.childId = data.childId;
        this.childName = data.childName || 'Enfant sans nom';
        
        // Z-score results for different indicators
        this.weightForAge = this._validateZScoreData(data.weightForAge);
        this.heightForAge = this._validateZScoreData(data.heightForAge);
        this.weightForHeight = this._validateZScoreData(data.weightForHeight);
        
        // Overall classification
        this.overallClassification = this._determineOverallClassification();
        
        // Metadata
        this.calculatedAt = data.calculatedAt || new Date();
        this.version = '1.0.0'; // For future compatibility
        
        Object.seal(this);
    }

    /**
     * Generate unique ID for the result
     * @private
     * @returns {string} Unique identifier
     */
    _generateId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `result_${timestamp}_${random}`;
    }

    /**
     * Validate Z-score data structure
     * @private
     * @param {Object} zscoreData - Z-score data to validate
     * @returns {Object|null} Validated Z-score data or null
     */
    _validateZScoreData(zscoreData) {
        if (!zscoreData) return null;
        
        const validated = {
            zscore: this._validateNumber(zscoreData.zscore, 'Z-score'),
            percentile: this._validatePercentile(zscoreData.percentile),
            classification: this._validateClassification(zscoreData.classification),
            indicator: zscoreData.indicator || 'unknown',
            reference: zscoreData.reference || 'WHO 2006/2007'
        };
        
        return validated;
    }

    /**
     * Validate numeric values
     * @private
     * @param {number} value - Value to validate
     * @param {string} fieldName - Field name for error messages
     * @returns {number} Validated number
     */
    _validateNumber(value, fieldName) {
        if (value === null || value === undefined) {
            throw new ValidationError(`${fieldName} est requis`, fieldName.toLowerCase(), 'REQUIRED');
        }
        
        const num = Number(value);
        if (!Number.isFinite(num)) {
            throw new ValidationError(`${fieldName} doit être un nombre`, fieldName.toLowerCase(), 'INVALID_TYPE');
        }
        
        // Reasonable bounds for Z-scores (-6 to +6)
        if (Math.abs(num) > 6) {
            console.warn(`${fieldName} value ${num} is outside typical range (-6 to +6)`);
        }
        
        return num;
    }

    /**
     * Validate percentile values
     * @private
     * @param {number} percentile - Percentile to validate
     * @returns {number} Validated percentile
     */
    _validatePercentile(percentile) {
        if (percentile === null || percentile === undefined) {
            throw new ValidationError('Percentile est requis', 'percentile', 'REQUIRED');
        }
        
        const num = Number(percentile);
        if (isNaN(num)) {
            throw new ValidationError('Percentile doit être un nombre', 'percentile', 'INVALID_TYPE');
        }
        
        if (num < 0 || num > 100) {
            throw new ValidationError('Percentile doit être entre 0 et 100', 'percentile', 'OUT_OF_RANGE');
        }
        
        return num;
    }

    /**
     * Validate classification values
     * @private
     * @param {string} classification - Classification to validate
     * @returns {string} Validated classification
     */
    _validateClassification(classification) {
        const validClassifications = [
            'malnutrition_severe',
            'malnutrition_moderate', 
            'normal',
            'overweight',
            'obesity',
            'stunting_severe',
            'stunting_moderate',
            'wasting_severe',
            'wasting_moderate'
        ];
        
        if (!classification) {
            throw new ValidationError('Classification est requise', 'classification', 'REQUIRED');
        }
        
        if (!validClassifications.includes(classification)) {
            throw new ValidationError(
                `Classification invalide: ${classification}`, 
                'classification', 
                'INVALID_VALUE'
            );
        }
        
        return classification;
    }

    /**
     * Determine overall nutritional classification
     * @private
     * @returns {string} Overall classification
     */
    _determineOverallClassification() {
        const classifications = [];
        
        if (this.weightForAge?.classification) {
            classifications.push(this.weightForAge.classification);
        }
        
        if (this.heightForAge?.classification) {
            classifications.push(this.heightForAge.classification);
        }
        
        if (this.weightForHeight?.classification) {
            classifications.push(this.weightForHeight.classification);
        }
        
        // Priority order: severe conditions first
        const severePriority = [
            'malnutrition_severe',
            'stunting_severe', 
            'wasting_severe'
        ];
        
        const moderatePriority = [
            'malnutrition_moderate',
            'stunting_moderate',
            'wasting_moderate'
        ];
        
        // Check for severe conditions first
        for (const severe of severePriority) {
            if (classifications.includes(severe)) {
                return severe;
            }
        }
        
        // Check for moderate conditions
        for (const moderate of moderatePriority) {
            if (classifications.includes(moderate)) {
                return moderate;
            }
        }
        
        // Check for overweight/obesity
        if (classifications.includes('obesity')) {
            return 'obesity';
        }
        
        if (classifications.includes('overweight')) {
            return 'overweight';
        }
        
        // Default to normal if no concerning classifications
        return 'normal';
    }

    /**
     * Get human-readable classification text
     * @param {string} classification - Classification code
     * @returns {string} Human-readable text
     */
    static getClassificationText(classification) {
        const texts = {
            'malnutrition_severe': 'Malnutrition sévère',
            'malnutrition_moderate': 'Malnutrition modérée',
            'normal': 'Normal',
            'overweight': 'Surpoids',
            'obesity': 'Obésité',
            'stunting_severe': 'Retard de croissance sévère',
            'stunting_moderate': 'Retard de croissance modéré',
            'wasting_severe': 'Émaciation sévère',
            'wasting_moderate': 'Émaciation modérée'
        };
        
        return texts[classification] || 'Classification inconnue';
    }

    /**
     * Get classification color for UI display
     * @param {string} classification - Classification code
     * @returns {string} CSS color class
     */
    static getClassificationColor(classification) {
        const colors = {
            'malnutrition_severe': 'severe',
            'malnutrition_moderate': 'moderate',
            'normal': 'normal',
            'overweight': 'overweight',
            'obesity': 'severe',
            'stunting_severe': 'severe',
            'stunting_moderate': 'moderate',
            'wasting_severe': 'severe',
            'wasting_moderate': 'moderate'
        };
        
        return colors[classification] || 'normal';
    }

    /**
     * Get formatted Z-score text
     * @param {Object} zscoreData - Z-score data
     * @returns {string} Formatted text
     */
    static formatZScoreText(zscoreData) {
        if (!zscoreData) return 'Non calculé';
        
        const zscore = Formatters.formatZScore(zscoreData.zscore);
        const percentile = Formatters.formatPercentile(zscoreData.percentile);
        const classification = ZScoreResult.getClassificationText(zscoreData.classification);
        
        return `Z-score: ${zscore} (${percentile}) - ${classification}`;
    }

    /**
     * Get overall classification text
     * @returns {string} Overall classification text
     */
    get overallClassificationText() {
        return ZScoreResult.getClassificationText(this.overallClassification);
    }

    /**
     * Get overall classification color
     * @returns {string} Overall classification color class
     */
    get overallClassificationColor() {
        return ZScoreResult.getClassificationColor(this.overallClassification);
    }

    /**
     * Check if any results indicate malnutrition
     * @returns {boolean} True if malnutrition detected
     */
    get hasMalnutrition() {
        return this.overallClassification.includes('malnutrition') ||
               this.overallClassification.includes('stunting') ||
               this.overallClassification.includes('wasting');
    }

    /**
     * Check if results indicate severe condition
     * @returns {boolean} True if severe condition detected
     */
    get hasSevereCondition() {
        return this.overallClassification.includes('severe');
    }

    /**
     * Get summary of all available indicators
     * @returns {Array} Array of indicator summaries
     */
    get indicatorSummaries() {
        const summaries = [];
        
        if (this.weightForAge) {
            summaries.push({
                name: 'Poids-pour-âge',
                code: 'weightForAge',
                ...this.weightForAge,
                text: ZScoreResult.formatZScoreText(this.weightForAge),
                color: ZScoreResult.getClassificationColor(this.weightForAge.classification)
            });
        }
        
        if (this.heightForAge) {
            summaries.push({
                name: 'Taille-pour-âge',
                code: 'heightForAge',
                ...this.heightForAge,
                text: ZScoreResult.formatZScoreText(this.heightForAge),
                color: ZScoreResult.getClassificationColor(this.heightForAge.classification)
            });
        }
        
        if (this.weightForHeight) {
            summaries.push({
                name: 'Poids-pour-taille',
                code: 'weightForHeight',
                ...this.weightForHeight,
                text: ZScoreResult.formatZScoreText(this.weightForHeight),
                color: ZScoreResult.getClassificationColor(this.weightForHeight.classification)
            });
        }
        
        return summaries;
    }

    /**
     * Get recommendations based on results
     * @returns {Array} Array of recommendation strings
     */
    get recommendations() {
        const recommendations = [];
        
        if (this.hasSevereCondition) {
            recommendations.push('Consultation médicale urgente recommandée');
            recommendations.push('Suivi nutritionnel spécialisé nécessaire');
        } else if (this.hasMalnutrition) {
            recommendations.push('Consultation médicale recommandée');
            recommendations.push('Évaluation nutritionnelle approfondie');
        } else if (this.overallClassification === 'overweight') {
            recommendations.push('Surveillance du poids recommandée');
            recommendations.push('Conseils nutritionnels appropriés');
        } else {
            recommendations.push('Croissance normale, continuer le suivi régulier');
        }
        
        return recommendations;
    }

    /**
     * Convert to JSON for serialization
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            id: this.id,
            childId: this.childId,
            childName: this.childName,
            weightForAge: this.weightForAge,
            heightForAge: this.heightForAge,
            weightForHeight: this.weightForHeight,
            overallClassification: this.overallClassification,
            calculatedAt: this.calculatedAt.toISOString(),
            version: this.version
        };
    }

    /**
     * Convert to display object
     * @returns {Object} Display-friendly object
     */
    toDisplayObject() {
        return {
            id: this.id,
            childName: this.childName,
            overallClassification: this.overallClassificationText,
            overallColor: this.overallClassificationColor,
            hasMalnutrition: this.hasMalnutrition,
            hasSevereCondition: this.hasSevereCondition,
            indicators: this.indicatorSummaries,
            recommendations: this.recommendations,
            calculatedAt: Formatters.formatDate(this.calculatedAt)
        };
    }

    /**
     * Get summary string
     * @returns {string} Summary string
     */
    toString() {
        return `${this.childName}: ${this.overallClassificationText} (${Formatters.formatDate(this.calculatedAt)})`;
    }

    /**
     * Create ZScoreResult from JSON
     * @static
     * @param {Object} json - JSON object
     * @returns {ZScoreResult} ZScoreResult instance
     */
    static fromJSON(json) {
        const data = {
            ...json,
            calculatedAt: json.calculatedAt ? new Date(json.calculatedAt) : undefined
        };
        
        return new ZScoreResult(data);
    }

    /**
     * Create empty result template
     * @static
     * @param {string} childId - Child ID
     * @param {string} childName - Child name
     * @returns {ZScoreResult} Empty result template
     */
    static createEmpty(childId, childName) {
        return new ZScoreResult({
            childId,
            childName,
            weightForAge: null,
            heightForAge: null,
            weightForHeight: null
        });
    }

    /**
     * Merge multiple partial results
     * @static
     * @param {string} childId - Child ID
     * @param {string} childName - Child name
     * @param {Object} partialResults - Partial results to merge
     * @returns {ZScoreResult} Merged result
     */
    static merge(childId, childName, partialResults) {
        return new ZScoreResult({
            childId,
            childName,
            weightForAge: partialResults.weightForAge || null,
            heightForAge: partialResults.heightForAge || null,
            weightForHeight: partialResults.weightForHeight || null
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ZScoreResult };
} else {
    window.ZScoreResult = ZScoreResult;
}
