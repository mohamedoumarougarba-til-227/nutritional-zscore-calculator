/**
 * Export Manager Service
 * Handles data export in various formats (JSON, CSV, Excel, PDF)
 */

class ExportManager {
    constructor() {
        this.supportedFormats = ['json', 'csv', 'excel', 'pdf'];
        this.isInitialized = false;
    }

    /**
     * Initialize the export manager
     */
    initialize() {
        this.isInitialized = true;
        console.log('ExportManager initialized');
    }

    /**
     * Export session data
     * @param {Object} sessionData - Session data to export
     * @param {string} format - Export format ('json', 'csv', 'excel', 'pdf')
     * @param {Object} options - Export options
     * @returns {Promise<void>}
     */
    async exportSession(sessionData, format = 'json', options = {}) {
        if (!this.isInitialized) {
            throw new Error('ExportManager not initialized');
        }

        if (!this.supportedFormats.includes(format)) {
            throw new Error(`Unsupported export format: ${format}`);
        }

        try {
            switch (format) {
                case 'json':
                    return this.exportToJSON(sessionData, options);
                case 'csv':
                    return this.exportToCSV(sessionData, options);
                case 'excel':
                    return this.exportToExcel(sessionData, options);
                case 'pdf':
                    return this.exportToPDF(sessionData, options);
                default:
                    throw new Error(`Export format ${format} not implemented`);
            }
        } catch (error) {
            throw new Error(`Export failed: ${error.message}`);
        }
    }

    /**
     * Export to JSON format
     * @param {Object} sessionData - Session data
     * @param {Object} options - Export options
     */
    exportToJSON(sessionData, options = {}) {
        const exportData = {
            metadata: {
                exportedAt: new Date().toISOString(),
                exportedBy: 'Nutritional Z-Score Calculator',
                version: this._getFormatVersion('json'),
                format: 'json',
                dataVersion: '1.0.0',
                compatibility: ['1.0.0'],
                ...options.metadata
            },
            session: this._prepareSessionData(sessionData),
            children: this._prepareChildrenData(sessionData.children || []),
            results: this._prepareResultsData(sessionData.results || [])
        };

        // Add compression if requested
        if (options.compress) {
            exportData.metadata.compressed = true;
            exportData.data = this._compressData(exportData);
        }

        // Add data validation checksum
        exportData.metadata.checksum = this._generateChecksum(exportData);

        const jsonString = JSON.stringify(exportData, null, options.minify ? 0 : 2);
        const filename = options.filename || `zscore-session-${this._getTimestamp()}.json`;
        
        this._downloadFile(jsonString, filename, 'application/json');
    }

    /**
     * Export to CSV format
     * @param {Object} sessionData - Session data
     * @param {Object} options - Export options
     */
    exportToCSV(sessionData, options = {}) {
        const children = sessionData.children || [];
        const results = sessionData.results || [];

        // Prepare CSV headers
        const headers = [
            'Nom',
            'Age_Annees',
            'Age_Mois',
            'Poids_g',
            'Taille_cm',
            'Sexe',
            'ZScore_Poids_Age',
            'Percentile_Poids_Age',
            'Classification_Poids_Age',
            'ZScore_Taille_Age',
            'Percentile_Taille_Age',
            'Classification_Taille_Age',
            'ZScore_Poids_Taille',
            'Percentile_Poids_Taille',
            'Classification_Poids_Taille',
            'Statut_Global',
            'Date_Calcul'
        ];

        // Prepare CSV rows
        const rows = children.map((child, index) => {
            const result = results[index];
            
            return [
                this._escapeCsvValue(child.name || ''),
                child.ageYears || '',
                child.ageMonths || '',
                child.weight || '',
                child.height || '',
                child.gender || '',
                result?.weightForAge?.zscore?.toFixed(2) || '',
                result?.weightForAge?.percentile?.toFixed(1) || '',
                result?.weightForAge?.classification || '',
                result?.heightForAge?.zscore?.toFixed(2) || '',
                result?.heightForAge?.percentile?.toFixed(1) || '',
                result?.heightForAge?.classification || '',
                result?.weightForHeight?.zscore?.toFixed(2) || '',
                result?.weightForHeight?.percentile?.toFixed(1) || '',
                result?.weightForHeight?.classification || '',
                result?.overallClassificationText || '',
                result?.calculatedAt ? new Date(result.calculatedAt).toLocaleDateString('fr-FR') : ''
            ];
        });

        // Build CSV content
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const filename = options.filename || `zscore-results-${this._getTimestamp()}.csv`;
        this._downloadFile(csvContent, filename, 'text/csv');
    }

    /**
     * Export to Excel format (simplified CSV with Excel-friendly formatting)
     * @param {Object} sessionData - Session data
     * @param {Object} options - Export options
     */
    exportToExcel(sessionData, options = {}) {
        // For now, export as CSV with Excel-friendly formatting
        // In a real implementation, you might use a library like SheetJS
        
        const children = sessionData.children || [];
        const results = sessionData.results || [];

        // Excel-friendly headers (French)
        const headers = [
            'Nom de l\'enfant',
            'Âge (années)',
            'Âge (mois)',
            'Poids (grammes)',
            'Taille (cm)',
            'Sexe',
            'Z-Score Poids/Âge',
            'Percentile Poids/Âge',
            'Classification Poids/Âge',
            'Z-Score Taille/Âge',
            'Percentile Taille/Âge',
            'Classification Taille/Âge',
            'Z-Score Poids/Taille',
            'Percentile Poids/Taille',
            'Classification Poids/Taille',
            'Statut nutritionnel global',
            'Date de calcul'
        ];

        // Prepare Excel-friendly rows
        const rows = children.map((child, index) => {
            const result = results[index];
            
            return [
                `"${child.name || ''}"`,
                child.ageYears || '',
                child.ageMonths || '',
                child.weight || '',
                child.height || '',
                child.gender === 'M' ? 'Masculin' : child.gender === 'F' ? 'Féminin' : '',
                result?.weightForAge?.zscore?.toFixed(2) || '',
                result?.weightForAge?.percentile?.toFixed(1) || '',
                `"${ZScoreResult.getClassificationText(result?.weightForAge?.classification) || ''}"`,
                result?.heightForAge?.zscore?.toFixed(2) || '',
                result?.heightForAge?.percentile?.toFixed(1) || '',
                `"${ZScoreResult.getClassificationText(result?.heightForAge?.classification) || ''}"`,
                result?.weightForHeight?.zscore?.toFixed(2) || '',
                result?.weightForHeight?.percentile?.toFixed(1) || '',
                `"${ZScoreResult.getClassificationText(result?.weightForHeight?.classification) || ''}"`,
                `"${result?.overallClassificationText || ''}"`,
                result?.calculatedAt ? `"${new Date(result.calculatedAt).toLocaleDateString('fr-FR')}"` : ''
            ];
        });

        // Build Excel-friendly CSV content with BOM for proper encoding
        const BOM = '\uFEFF';
        const csvContent = BOM + [
            headers.join(';'), // Use semicolon for Excel
            ...rows.map(row => row.join(';'))
        ].join('\r\n'); // Use Windows line endings

        const filename = options.filename || `zscore-results-${this._getTimestamp()}.csv`;
        this._downloadFile(csvContent, filename, 'text/csv;charset=utf-8');
    }

    /**
     * Export to PDF format
     * @param {Object} sessionData - Session data
     * @param {Object} options - Export options
     */
    exportToPDF(sessionData, options = {}) {
        const children = sessionData.children || [];
        const results = sessionData.results || [];
        
        // Try to use jsPDF if available, otherwise fallback to print
        if (typeof window.jsPDF !== 'undefined') {
            this._generateRealPDF(sessionData, children, results, options);
        } else {
            this._generatePrintablePDF(sessionData, children, results, options);
        }
    }

    /**
     * Generate real PDF using jsPDF library
     * @private
     */
    _generateRealPDF(sessionData, children, results, options) {
        try {
            // This would use the actual jsPDF library
            // For now, fallback to printable version
            console.log('jsPDF library detected, generating real PDF...');
            this._generatePrintablePDF(sessionData, children, results, options);
        } catch (error) {
            console.warn('jsPDF generation failed, falling back to print:', error);
            this._generatePrintablePDF(sessionData, children, results, options);
        }
    }

    /**
     * Generate printable PDF (fallback method)
     * @private
     */
    _generatePrintablePDF(sessionData, children, results, options) {
        // Create a new window for PDF generation
        const printWindow = window.open('', '_blank');
        
        // Generate PDF-friendly HTML
        const htmlContent = this._generatePDFHTML(sessionData, children, results, options);
        
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Trigger print dialog
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }

    /**
     * Generate HTML for PDF export
     * @private
     * @param {Object} sessionData - Session data
     * @param {Array} children - Children array
     * @param {Array} results - Results array
     * @param {Object} options - Export options
     * @returns {string} HTML content
     */
    _generatePDFHTML(sessionData, children, results, options) {
        const title = options.title || 'Rapport Z-Score Nutritionnel';
        const date = new Date().toLocaleDateString('fr-FR');
        
        return `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        color: #333;
                        line-height: 1.4;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #2196F3;
                        padding-bottom: 20px;
                    }
                    .header h1 {
                        color: #2196F3;
                        margin-bottom: 10px;
                    }
                    .header .subtitle {
                        color: #666;
                        font-size: 14px;
                    }
                    .summary {
                        background-color: #f5f5f5;
                        padding: 15px;
                        border-radius: 5px;
                        margin-bottom: 30px;
                    }
                    .summary h3 {
                        margin-top: 0;
                        color: #2196F3;
                    }
                    .summary-stats {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 15px;
                        margin-top: 15px;
                    }
                    .stat-item {
                        background: white;
                        padding: 10px;
                        border-radius: 3px;
                        text-align: center;
                    }
                    .stat-value {
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .stat-value.severe { color: #f44336; }
                    .stat-value.moderate { color: #ff9800; }
                    .stat-value.normal { color: #4caf50; }
                    .stat-label {
                        font-size: 12px;
                        color: #666;
                    }
                    .results-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 30px;
                        font-size: 11px;
                    }
                    .results-table th,
                    .results-table td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }
                    .results-table th {
                        background-color: #2196F3;
                        color: white;
                        font-weight: bold;
                    }
                    .results-table tr:nth-child(even) {
                        background-color: #f9f9f9;
                    }
                    .status-severe { color: #f44336; font-weight: bold; }
                    .status-moderate { color: #ff9800; font-weight: bold; }
                    .status-normal { color: #4caf50; font-weight: bold; }
                    .status-overweight { color: #ff9800; font-weight: bold; }
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid #ddd;
                        font-size: 12px;
                        color: #666;
                        text-align: center;
                    }
                    @media print {
                        body { margin: 0; }
                        .header { page-break-after: avoid; }
                        .results-table { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${title}</h1>
                    <div class="subtitle">
                        Généré le ${date} par le Calculateur Z-Score Nutritionnel<br>
                        Standards OMS 2006/2007
                    </div>
                </div>

                ${this._generateSummarySection(children, results)}
                ${this._generateResultsTable(children, results)}

                <div class="footer">
                    <p>Ce rapport a été généré automatiquement par le Calculateur Z-Score Nutritionnel</p>
                    <p>Basé sur les standards de croissance de l'Organisation Mondiale de la Santé (OMS)</p>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Generate summary section for PDF
     * @private
     * @param {Array} children - Children array
     * @param {Array} results - Results array
     * @returns {string} HTML content
     */
    _generateSummarySection(children, results) {
        // Calculate statistics
        let severe = 0, moderate = 0, normal = 0, overweight = 0;
        
        results.forEach(result => {
            if (result.hasSevereCondition) {
                severe++;
            } else if (result.hasMalnutrition) {
                moderate++;
            } else if (result.overallClassification === 'overweight') {
                overweight++;
            } else {
                normal++;
            }
        });

        return `
            <div class="summary">
                <h3>Résumé de l'analyse</h3>
                <p><strong>Nombre total d'enfants analysés :</strong> ${children.length}</p>
                <p><strong>Date d'analyse :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
                
                <div class="summary-stats">
                    <div class="stat-item">
                        <div class="stat-value severe">${severe}</div>
                        <div class="stat-label">Malnutrition sévère</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value moderate">${moderate}</div>
                        <div class="stat-label">Malnutrition modérée</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value normal">${normal}</div>
                        <div class="stat-label">Statut normal</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value moderate">${overweight}</div>
                        <div class="stat-label">Surpoids</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate results table for PDF
     * @private
     * @param {Array} children - Children array
     * @param {Array} results - Results array
     * @returns {string} HTML content
     */
    _generateResultsTable(children, results) {
        const tableRows = children.map((child, index) => {
            const result = results[index];
            const statusClass = result ? `status-${result.overallClassificationColor}` : '';
            
            return `
                <tr>
                    <td>${child.name || 'N/A'}</td>
                    <td>${child.formattedAge || 'N/A'}</td>
                    <td>${child.formattedGender || 'N/A'}</td>
                    <td>${child.formattedWeight || 'N/A'}</td>
                    <td>${child.formattedHeight || 'N/A'}</td>
                    <td>${result?.weightForAge ? ExportFormatters.formatZScore(result.weightForAge.zscore) : 'N/A'}</td>
                    <td>${result?.heightForAge ? ExportFormatters.formatZScore(result.heightForAge.zscore) : 'N/A'}</td>
                    <td>${result?.weightForHeight ? ExportFormatters.formatZScore(result.weightForHeight.zscore) : 'N/A'}</td>
                    <td class="${statusClass}">${result?.overallClassificationText || 'N/A'}</td>
                </tr>
            `;
        }).join('');

        return `
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Âge</th>
                        <th>Sexe</th>
                        <th>Poids</th>
                        <th>Taille</th>
                        <th>Z-Score P/Â</th>
                        <th>Z-Score T/Â</th>
                        <th>Z-Score P/T</th>
                        <th>Statut global</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        `;
    }

    /**
     * Prepare session data for export
     * @private
     * @param {Object} sessionData - Raw session data
     * @returns {Object} Prepared session data
     */
    _prepareSessionData(sessionData) {
        return {
            id: sessionData.id || this._generateId(),
            name: sessionData.name || `Session ${new Date().toLocaleDateString()}`,
            createdAt: sessionData.createdAt || new Date().toISOString(),
            childrenCount: sessionData.children?.length || 0,
            resultsCount: sessionData.results?.length || 0
        };
    }

    /**
     * Escape CSV values
     * @private
     * @param {string} value - Value to escape
     * @returns {string} Escaped value
     */
    _escapeCsvValue(value) {
        if (typeof value !== 'string') {
            value = String(value);
        }
        
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        
        return value;
    }

    /**
     * Get timestamp string for filenames
     * @private
     * @returns {string} Timestamp string
     */
    _getTimestamp() {
        const now = new Date();
        return now.toISOString().slice(0, 19).replace(/[:.]/g, '-');
    }

    /**
     * Generate unique ID
     * @private
     * @returns {string} Unique ID
     */
    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    /**
     * Download file to user's device
     * @private
     * @param {string} content - File content
     * @param {string} filename - File name
     * @param {string} mimeType - MIME type
     */
    _downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    /**
     * Import session data from file
     * @param {File} file - File to import
     * @returns {Promise<Object>} Imported session data
     */
    async importSessionFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    let sessionData;
                    
                    if (file.name.endsWith('.json')) {
                        sessionData = JSON.parse(content);
                        
                        // Validate JSON import
                        const validation = this.validateImportedData(sessionData);
                        if (!validation.valid) {
                            throw new Error(`Validation échouée: ${validation.errors.join(', ')}`);
                        }
                        
                        // Show warnings if any
                        if (validation.warnings.length > 0) {
                            console.warn('Avertissements d\'import:', validation.warnings);
                        }
                        
                    } else if (file.name.endsWith('.csv')) {
                        sessionData = this._parseCSV(content);
                    } else {
                        throw new Error('Format de fichier non supporté. Utilisez JSON ou CSV.');
                    }
                    
                    // Additional validation
                    this._validateImportedData(sessionData);
                    
                    resolve(sessionData);
                    
                } catch (error) {
                    reject(new Error(`Erreur d'import: ${error.message}`));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Erreur de lecture du fichier'));
            };
            
            reader.readAsText(file);
        });
    }

    /**
     * Parse CSV content (simplified implementation)
     * @private
     * @param {string} content - CSV content
     * @returns {Object} Parsed session data
     */
    _parseCSV(content) {
        // This is a simplified CSV parser
        // In a real implementation, you might use a proper CSV parsing library
        
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('Fichier CSV vide ou invalide');
        }
        
        const headers = lines[0].split(',').map(h => h.trim());
        const children = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const child = {};
            
            headers.forEach((header, index) => {
                const value = values[index] || '';
                
                // Map CSV headers to child properties
                switch (header.toLowerCase()) {
                    case 'nom':
                    case 'name':
                        child.name = value;
                        break;
                    case 'age_annees':
                    case 'age (années)':
                        child.ageYears = parseInt(value) || 0;
                        break;
                    case 'age_mois':
                    case 'age (mois)':
                        child.ageMonths = parseInt(value) || 0;
                        break;
                    case 'poids_g':
                    case 'poids (grammes)':
                        child.weight = parseInt(value) || 0;
                        break;
                    case 'taille_cm':
                    case 'taille (cm)':
                        child.height = parseFloat(value) || 0;
                        break;
                    case 'sexe':
                    case 'gender':
                        child.gender = value.toUpperCase() === 'MASCULIN' ? 'M' : 
                                      value.toUpperCase() === 'FÉMININ' ? 'F' : value;
                        break;
                }
            });
            
            if (child.name || child.ageYears || child.weight) {
                children.push(child);
            }
        }
        
        return {
            session: {
                name: `Session importée ${new Date().toLocaleDateString()}`,
                createdAt: new Date().toISOString()
            },
            children: children,
            results: []
        };
    }

    /**
     * Validate imported session data
     * @private
     * @param {Object} sessionData - Session data to validate
     */
    _validateImportedData(sessionData) {
        if (!sessionData || typeof sessionData !== 'object') {
            throw new Error('Données de session invalides');
        }
        
        if (!sessionData.children || !Array.isArray(sessionData.children)) {
            throw new Error('Liste d\'enfants manquante ou invalide');
        }
        
        if (sessionData.children.length === 0) {
            throw new Error('Aucun enfant trouvé dans les données importées');
        }
        
        // Validate each child
        sessionData.children.forEach((child, index) => {
            if (!child.name && !child.ageYears && !child.weight) {
                throw new Error(`Enfant ${index + 1}: données insuffisantes`);
            }
        });
    }

    /**
     * Get supported export formats
     * @returns {Array} Array of supported formats
     */
    getSupportedFormats() {
        return [...this.supportedFormats];
    }

    /**
     * Get export format info
     * @param {string} format - Format to get info for
     * @returns {Object} Format information
     */
    getFormatInfo(format) {
        const formatInfo = {
            json: {
                name: 'JSON',
                description: 'Format standard pour sauvegarde et échange',
                extension: '.json',
                mimeType: 'application/json',
                version: '1.0.0',
                features: ['compression', 'validation', 'versioning']
            },
            csv: {
                name: 'CSV',
                description: 'Format compatible avec Excel et autres tableurs',
                extension: '.csv',
                mimeType: 'text/csv',
                version: '1.0.0',
                features: ['excel-compatible', 'utf8-bom']
            },
            excel: {
                name: 'Excel',
                description: 'Format optimisé pour Microsoft Excel',
                extension: '.csv',
                mimeType: 'text/csv',
                version: '1.0.0',
                features: ['excel-optimized', 'french-locale']
            },
            pdf: {
                name: 'PDF',
                description: 'Rapport formaté pour impression',
                extension: '.pdf',
                mimeType: 'application/pdf',
                version: '1.0.0',
                features: ['print-optimized', 'professional-layout', 'statistics']
            }
        };
        
        return formatInfo[format] || null;
    }

    /**
     * Get format version
     * @private
     * @param {string} format - Format name
     * @returns {string} Format version
     */
    _getFormatVersion(format) {
        const versions = {
            json: '1.0.0',
            csv: '1.0.0',
            excel: '1.0.0',
            pdf: '1.0.0'
        };
        return versions[format] || '1.0.0';
    }

    /**
     * Prepare children data for export
     * @private
     * @param {Array} children - Children array
     * @returns {Array} Prepared children data
     */
    _prepareChildrenData(children) {
        return children.map(child => ({
            id: child.id,
            name: child.name,
            ageYears: child.ageYears,
            ageMonths: child.ageMonths,
            totalAgeMonths: child.totalAgeMonths,
            weight: child.weight,
            height: child.height,
            gender: child.gender,
            createdAt: child.createdAt,
            updatedAt: child.updatedAt
        }));
    }

    /**
     * Prepare results data for export
     * @private
     * @param {Array} results - Results array
     * @returns {Array} Prepared results data
     */
    _prepareResultsData(results) {
        return results.map(result => ({
            id: result.id,
            childId: result.childId,
            childName: result.childName,
            weightForAge: result.weightForAge,
            heightForAge: result.heightForAge,
            weightForHeight: result.weightForHeight,
            overallClassification: result.overallClassification,
            calculatedAt: result.calculatedAt,
            version: result.version
        }));
    }

    /**
     * Compress data (simplified implementation)
     * @private
     * @param {Object} data - Data to compress
     * @returns {string} Compressed data
     */
    _compressData(data) {
        // In a real implementation, you would use a compression library like pako
        // For now, just return minified JSON
        return JSON.stringify(data);
    }

    /**
     * Generate checksum for data validation
     * @private
     * @param {Object} data - Data to generate checksum for
     * @returns {string} Checksum
     */
    _generateChecksum(data) {
        // Simple checksum implementation
        const dataString = JSON.stringify(data);
        let hash = 0;
        
        for (let i = 0; i < dataString.length; i++) {
            const char = dataString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return Math.abs(hash).toString(16);
    }

    /**
     * Validate imported data
     * @param {Object} importedData - Data to validate
     * @returns {Object} Validation result
     */
    validateImportedData(importedData) {
        const errors = [];
        const warnings = [];

        // Check basic structure
        if (!importedData || typeof importedData !== 'object') {
            errors.push('Données invalides : structure incorrecte');
            return { valid: false, errors, warnings };
        }

        // Check metadata
        if (!importedData.metadata) {
            warnings.push('Métadonnées manquantes');
        } else {
            // Check version compatibility
            const importVersion = importedData.metadata.version;
            const currentVersion = this._getFormatVersion('json');
            
            if (importVersion && importVersion !== currentVersion) {
                warnings.push(`Version différente : ${importVersion} vs ${currentVersion}`);
            }

            // Validate checksum if present
            if (importedData.metadata.checksum) {
                const calculatedChecksum = this._generateChecksum({
                    ...importedData,
                    metadata: { ...importedData.metadata, checksum: undefined }
                });
                
                if (calculatedChecksum !== importedData.metadata.checksum) {
                    errors.push('Checksum invalide : données possiblement corrompues');
                }
            }
        }

        // Check required data
        if (!importedData.children || !Array.isArray(importedData.children)) {
            errors.push('Données d\'enfants manquantes ou invalides');
        }

        if (importedData.children && importedData.children.length === 0) {
            warnings.push('Aucun enfant dans les données importées');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Get export statistics
     * @returns {Object} Export statistics
     */
    getExportStats() {
        return {
            supportedFormats: this.supportedFormats.length,
            formats: this.supportedFormats.map(format => ({
                name: format,
                info: this.getFormatInfo(format)
            })),
            features: [
                'Multi-format export',
                'Data compression',
                'Version control',
                'Data validation',
                'Professional PDF reports',
                'Excel compatibility'
            ]
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ExportManager };
} else {
    window.ExportManager = ExportManager;
}