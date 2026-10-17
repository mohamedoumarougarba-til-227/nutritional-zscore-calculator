/**
 * UserSettings Model Class
 * Manages user preferences and personalization settings
 */

class UserSettings {
    /**
     * Create a new UserSettings instance
     * @param {Object} [data] - Settings data
     */
    constructor(data = {}) {
        // Theme settings
        this.theme = this._validateTheme(data.theme);
        this.fontSize = this._validateFontSize(data.fontSize);
        this.fontFamily = this._validateFontFamily(data.fontFamily);
        this.highContrast = this._validateBoolean(data.highContrast, false);
        
        // Language and localization
        this.language = this._validateLanguage(data.language);
        
        // Interface preferences
        this.animations = this._validateBoolean(data.animations, true);
        this.soundEnabled = this._validateBoolean(data.soundEnabled, false);
        this.reducedMotion = this._validateBoolean(data.reducedMotion, false);
        
        // Application behavior
        this.autoSave = this._validateBoolean(data.autoSave, true);
        this.autoSaveInterval = this._validateNumber(data.autoSaveInterval, 30, 5, 300); // seconds
        this.defaultBatchSize = this._validateNumber(data.defaultBatchSize, 10, 1, 100);
        this.showWelcomeMessage = this._validateBoolean(data.showWelcomeMessage, true);
        
        // Data preferences
        this.defaultUnits = this._validateUnits(data.defaultUnits);
        this.decimalPlaces = this._validateNumber(data.decimalPlaces, 2, 0, 4);
        this.showPercentiles = this._validateBoolean(data.showPercentiles, true);
        this.showRecommendations = this._validateBoolean(data.showRecommendations, true);
        
        // Export preferences
        this.defaultExportFormat = this._validateExportFormat(data.defaultExportFormat);
        this.includeMetadataInExport = this._validateBoolean(data.includeMetadataInExport, true);
        this.pdfPageSize = this._validatePdfPageSize(data.pdfPageSize);
        
        // Privacy and security
        this.rememberLastSession = this._validateBoolean(data.rememberLastSession, true);
        this.clearDataOnExit = this._validateBoolean(data.clearDataOnExit, false);
        
        // Metadata
        this.version = '1.0.0';
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = new Date();
        
        Object.seal(this);
    }

    /**
     * Validate theme setting
     * @private
     * @param {string} theme - Theme value
     * @returns {string} Validated theme
     */
    _validateTheme(theme) {
        const validThemes = ['light', 'dark', 'auto', 'high-contrast'];
        return validThemes.includes(theme) ? theme : 'light';
    }

    /**
     * Validate font size setting
     * @private
     * @param {string} fontSize - Font size value
     * @returns {string} Validated font size
     */
    _validateFontSize(fontSize) {
        const validSizes = ['small', 'medium', 'large', 'xlarge'];
        return validSizes.includes(fontSize) ? fontSize : 'medium';
    }

    /**
     * Validate font family setting
     * @private
     * @param {string} fontFamily - Font family value
     * @returns {string} Validated font family
     */
    _validateFontFamily(fontFamily) {
        const validFamilies = ['system', 'arial', 'roboto'];
        return validFamilies.includes(fontFamily) ? fontFamily : 'system';
    }

    /**
     * Validate language setting
     * @private
     * @param {string} language - Language code
     * @returns {string} Validated language
     */
    _validateLanguage(language) {
        const validLanguages = ['fr', 'en', 'ar'];
        return validLanguages.includes(language) ? language : 'fr';
    }

    /**
     * Validate units setting
     * @private
     * @param {Object} units - Units configuration
     * @returns {Object} Validated units
     */
    _validateUnits(units = {}) {
        return {
            weight: ['grams', 'kilograms'].includes(units.weight) ? units.weight : 'grams',
            height: ['centimeters', 'meters'].includes(units.height) ? units.height : 'centimeters',
            age: ['months', 'years_months'].includes(units.age) ? units.age : 'years_months'
        };
    }

    /**
     * Validate export format setting
     * @private
     * @param {string} format - Export format
     * @returns {string} Validated format
     */
    _validateExportFormat(format) {
        const validFormats = ['json', 'csv', 'excel', 'pdf'];
        return validFormats.includes(format) ? format : 'json';
    }

    /**
     * Validate PDF page size setting
     * @private
     * @param {string} pageSize - PDF page size
     * @returns {string} Validated page size
     */
    _validatePdfPageSize(pageSize) {
        const validSizes = ['a4', 'letter', 'legal'];
        return validSizes.includes(pageSize) ? pageSize : 'a4';
    }

    /**
     * Validate boolean setting
     * @private
     * @param {*} value - Value to validate
     * @param {boolean} defaultValue - Default value if invalid
     * @returns {boolean} Validated boolean
     */
    _validateBoolean(value, defaultValue) {
        return typeof value === 'boolean' ? value : defaultValue;
    }

    /**
     * Validate numeric setting
     * @private
     * @param {*} value - Value to validate
     * @param {number} defaultValue - Default value
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Validated number
     */
    _validateNumber(value, defaultValue, min, max) {
        const num = Number(value);
        if (isNaN(num) || num < min || num > max) {
            return defaultValue;
        }
        return num;
    }

    /**
     * Update settings
     * @param {Object} updates - Settings to update
     * @returns {UserSettings} Updated settings instance
     */
    update(updates) {
        const newData = { ...this.toJSON(), ...updates };
        
        // Re-validate all settings
        Object.assign(this, new UserSettings(newData));
        this.updatedAt = new Date();
        
        return this;
    }

    /**
     * Reset to default settings
     * @returns {UserSettings} Reset settings instance
     */
    reset() {
        const defaultSettings = UserSettings.getDefaults();
        Object.assign(this, new UserSettings(defaultSettings));
        this.updatedAt = new Date();
        
        return this;
    }

    /**
     * Apply settings to the application
     */
    apply() {
        // Apply theme
        document.documentElement.setAttribute('data-theme', this.theme);
        
        // Apply font settings
        document.documentElement.setAttribute('data-font-size', this.fontSize);
        document.documentElement.setAttribute('data-font-family', this.fontFamily);
        
        // Apply language and direction
        document.documentElement.setAttribute('lang', this.language);
        if (this.language === 'ar') {
            document.documentElement.setAttribute('dir', 'rtl');
            const rtlStyles = document.getElementById('rtl-styles');
            if (rtlStyles) rtlStyles.disabled = false;
        } else {
            document.documentElement.setAttribute('dir', 'ltr');
            const rtlStyles = document.getElementById('rtl-styles');
            if (rtlStyles) rtlStyles.disabled = true;
        }
        
        // Apply animations
        document.documentElement.setAttribute('data-animations', this.animations);
        
        // Apply high contrast
        if (this.highContrast) {
            document.documentElement.setAttribute('data-theme', 'high-contrast');
        }
        
        // Apply reduced motion
        if (this.reducedMotion) {
            document.documentElement.style.setProperty('--transition-fast', '0ms');
            document.documentElement.style.setProperty('--transition-normal', '0ms');
            document.documentElement.style.setProperty('--transition-slow', '0ms');
        }
    }

    /**
     * Get settings for specific category
     * @param {string} category - Settings category
     * @returns {Object} Category settings
     */
    getCategory(category) {
        const categories = {
            theme: {
                theme: this.theme,
                fontSize: this.fontSize,
                fontFamily: this.fontFamily,
                highContrast: this.highContrast
            },
            language: {
                language: this.language
            },
            interface: {
                animations: this.animations,
                soundEnabled: this.soundEnabled,
                reducedMotion: this.reducedMotion
            },
            behavior: {
                autoSave: this.autoSave,
                autoSaveInterval: this.autoSaveInterval,
                defaultBatchSize: this.defaultBatchSize,
                showWelcomeMessage: this.showWelcomeMessage
            },
            data: {
                defaultUnits: this.defaultUnits,
                decimalPlaces: this.decimalPlaces,
                showPercentiles: this.showPercentiles,
                showRecommendations: this.showRecommendations
            },
            export: {
                defaultExportFormat: this.defaultExportFormat,
                includeMetadataInExport: this.includeMetadataInExport,
                pdfPageSize: this.pdfPageSize
            },
            privacy: {
                rememberLastSession: this.rememberLastSession,
                clearDataOnExit: this.clearDataOnExit
            }
        };
        
        return categories[category] || {};
    }

    /**
     * Check if settings are at default values
     * @returns {boolean} True if all settings are default
     */
    isDefault() {
        const defaults = UserSettings.getDefaults();
        const current = this.toJSON();
        
        // Compare all settings except metadata
        const settingsKeys = Object.keys(defaults);
        return settingsKeys.every(key => 
            JSON.stringify(current[key]) === JSON.stringify(defaults[key])
        );
    }

    /**
     * Get changed settings compared to defaults
     * @returns {Object} Changed settings
     */
    getChangedSettings() {
        const defaults = UserSettings.getDefaults();
        const current = this.toJSON();
        const changed = {};
        
        Object.keys(defaults).forEach(key => {
            if (JSON.stringify(current[key]) !== JSON.stringify(defaults[key])) {
                changed[key] = current[key];
            }
        });
        
        return changed;
    }

    /**
     * Validate current settings
     * @returns {Object} Validation result
     */
    validate() {
        const errors = [];
        
        // Check for any invalid combinations
        if (this.highContrast && this.theme !== 'high-contrast') {
            errors.push('High contrast mode requires high-contrast theme');
        }
        
        if (this.language === 'ar' && this.fontFamily === 'roboto') {
            errors.push('Roboto font may not display Arabic text properly');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Convert to JSON for serialization
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            theme: this.theme,
            fontSize: this.fontSize,
            fontFamily: this.fontFamily,
            highContrast: this.highContrast,
            language: this.language,
            animations: this.animations,
            soundEnabled: this.soundEnabled,
            reducedMotion: this.reducedMotion,
            autoSave: this.autoSave,
            autoSaveInterval: this.autoSaveInterval,
            defaultBatchSize: this.defaultBatchSize,
            showWelcomeMessage: this.showWelcomeMessage,
            defaultUnits: this.defaultUnits,
            decimalPlaces: this.decimalPlaces,
            showPercentiles: this.showPercentiles,
            showRecommendations: this.showRecommendations,
            defaultExportFormat: this.defaultExportFormat,
            includeMetadataInExport: this.includeMetadataInExport,
            pdfPageSize: this.pdfPageSize,
            rememberLastSession: this.rememberLastSession,
            clearDataOnExit: this.clearDataOnExit,
            version: this.version,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString()
        };
    }

    /**
     * Convert to display object
     * @returns {Object} Display-friendly object
     */
    toDisplayObject() {
        return {
            theme: this.theme,
            language: this.language,
            fontSize: this.fontSize,
            animations: this.animations ? 'Activées' : 'Désactivées',
            autoSave: this.autoSave ? 'Activé' : 'Désactivé',
            lastUpdated: Formatters.formatDate(this.updatedAt)
        };
    }

    /**
     * Get summary string
     * @returns {string} Summary string
     */
    toString() {
        return `Paramètres utilisateur (${this.language}, ${this.theme}, ${this.fontSize})`;
    }

    /**
     * Create UserSettings from JSON
     * @static
     * @param {Object} json - JSON object
     * @returns {UserSettings} UserSettings instance
     */
    static fromJSON(json) {
        const data = {
            ...json,
            createdAt: json.createdAt ? new Date(json.createdAt) : undefined,
            updatedAt: json.updatedAt ? new Date(json.updatedAt) : undefined
        };
        
        return new UserSettings(data);
    }

    /**
     * Get default settings
     * @static
     * @returns {Object} Default settings object
     */
    static getDefaults() {
        return {
            theme: 'light',
            fontSize: 'medium',
            fontFamily: 'system',
            highContrast: false,
            language: 'fr',
            animations: true,
            soundEnabled: false,
            reducedMotion: false,
            autoSave: true,
            autoSaveInterval: 30,
            defaultBatchSize: 10,
            showWelcomeMessage: true,
            defaultUnits: {
                weight: 'grams',
                height: 'centimeters',
                age: 'years_months'
            },
            decimalPlaces: 2,
            showPercentiles: true,
            showRecommendations: true,
            defaultExportFormat: 'json',
            includeMetadataInExport: true,
            pdfPageSize: 'a4',
            rememberLastSession: true,
            clearDataOnExit: false
        };
    }

    /**
     * Create settings from system preferences
     * @static
     * @returns {UserSettings} Settings based on system preferences
     */
    static fromSystemPreferences() {
        const defaults = UserSettings.getDefaults();
        
        // Detect system theme preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            defaults.theme = 'dark';
        }
        
        // Detect reduced motion preference
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            defaults.reducedMotion = true;
            defaults.animations = false;
        }
        
        // Detect high contrast preference
        if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
            defaults.highContrast = true;
        }
        
        // Detect language from browser
        const browserLang = navigator.language.substring(0, 2);
        if (['fr', 'en', 'ar'].includes(browserLang)) {
            defaults.language = browserLang;
        }
        
        return new UserSettings(defaults);
    }

    /**
     * Merge settings with another settings object
     * @static
     * @param {UserSettings} base - Base settings
     * @param {UserSettings} override - Override settings
     * @returns {UserSettings} Merged settings
     */
    static merge(base, override) {
        const baseData = base.toJSON();
        const overrideData = override.toJSON();
        
        return new UserSettings({ ...baseData, ...overrideData });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UserSettings };
} else {
    window.UserSettings = UserSettings;
}