const NutritionCSV=typeof module!=='undefined'&&module.exports?require('./nutrition-assessment.js').NutritionAssessment:NutritionAssessment;
class CSVManager {
    static summary(model) {
        return '\uFEFF'+LotAnalysis.csvRows(model).map(row=>row.map(CSVManager.cell).join(',')).join('\r\n');
    }
    static parse(text, {extended=false}={}) {
        text = String(text).replace(/^\uFEFF/, '');
        if (new TextEncoder().encode(text).length > 2_000_000) throw new Error('csvTooLarge');
        const delimiter = text.split(/\r?\n/, 1)[0].includes(';') ? ';' : ',';
        const rows = []; let row = [], field = '', quoted = false, afterQuote = false;
        for (let i = 0; i <= text.length; i++) {
            const c = text[i];
            if (quoted) {
                if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else { quoted = false; afterQuote = true; } }
                else if (c === undefined) throw new Error('csvInvalid');
                else field += c;
                continue;
            }
            if (c === '"' && field === '' && !afterQuote) { quoted = true; continue; }
            if (c === delimiter || c === '\n' || c === '\r' || c === undefined) {
                row.push(field); field = ''; afterQuote = false;
                if (c !== delimiter) {
                    if (row.some(v => v.trim())) rows.push(row);
                    row = []; if (c === '\r' && text[i + 1] === '\n') i++;
                }
            } else {
                if (afterQuote || c === '"') throw new Error('csvInvalid');
                field += c;
            }
        }
        if (rows.length < 2 || rows.length > 501) throw new Error('csvInvalid');
        const headers = rows.shift().map(v => v.trim());
        const allowed = ['name', 'caseId', 'ageYears', 'ageMonths', 'ageDays', 'ageMode', 'birthDate', 'measurementDate', 'weight', 'height', 'gender', 'position', 'oedema', ...NutritionCSV.inputFields];
        if (new Set(headers).size !== headers.length || headers.some(k => !allowed.includes(k)) || ['weight', 'height', 'gender', 'position', 'oedema'].some(k => !headers.includes(k))) throw new Error('csvInvalid');
        // Validate the entire file before returning any child for addition.
        return rows.map(values => {
            if (values.length !== headers.length) throw new Error('csvInvalid');
            const raw = Object.fromEntries(headers.map((k, i) => [k, values[i].trim()]));
            return ClinicalEngine.normalize(raw,{extended});
        });
    }
    static cell(value) {
        if (typeof value !== 'number' && /^\s*[=+@\-\t\r]/.test(String(value ?? ''))) value = "'" + value;
        return '"' + String(value ?? '').replace(/"/g, '""') + '"';
    }
    static results(entries) {
        const keys = ['weightForAge', 'heightForAge', 'weightForHeight'];
        const percentileKeys=[...keys,'bmiForAge'];
        const header = ['name', 'caseId', 'visitId', 'ageMode', 'ageDays', 'measurementDate', 'weight_g', 'height_cm', 'gender', 'position', 'oedema', ...keys, ...keys.map(k => k + '_flag'), 'status', 'reference', 'engineVersion', 'calculatedAt', 'bmi_kg_m2', 'bmiForAge', 'bmiForAge_flag', 'bmiForAge_error',...percentileKeys.map(k=>k+'_zscore_raw'),...percentileKeys.map(k=>k+'_percentile'),...percentileKeys.map(k=>k+'_percentile_status'),'reference_family','age_in_months',...percentileKeys.map(k=>k+'_not_applicable'),...NutritionCSV.inputFields,'nutrition_category','nutrition_orientation','nutrition_reference','nutrition_version','nutrition_missing','nutrition_criteria'];
        const rows = entries.map(({child:c, result:r}) => [c.name, c.caseId, c.visitId, c.ageMode, c.ageDays, c.measurementDate, c.weight, c.height, c.gender, c.position, c.oedema,
            ...keys.map(k => r?.[k]?.zscore), ...keys.map(k => r?.[k]?.flagged ? 1 : 0), r?.status || 'not-calculated', r?.referenceVersion || 'unknown', r?.engineVersion || '', r?.calculatedAt,
            r?.schemaVersion===4?r.bmi:'',r?.schemaVersion===4?r.bmiForAge?.zscore:'',r?.schemaVersion===4&&typeof r.bmiForAge?.zscore==='number'?(r.bmiForAge.flagged?1:0):'',r?.schemaVersion===4?r.bmiForAge?.error:'',
            ...percentileKeys.map(k=>r?.percentileVersion===1?r[k]?.zscoreRaw:''),...percentileKeys.map(k=>r?.percentileVersion===1?r[k]?.percentile:''),...percentileKeys.map(k=>r?.percentileVersion===1?r[k]?.percentileStatus:''),r?.referenceFamily||'',r?.ageInMonths??'',...percentileKeys.map(k=>r?.schemaVersion===4?(r[k]?.notApplicable?1:0):''),...NutritionCSV.inputFields.map(k=>c[k]??''),r?.nutrition?.category,r?.nutrition?.orientation,r?.nutrition?.reference,r?.nutrition?.version,r?.nutrition?.missing.join('|'),r?.nutrition?.criteria?.join('|')]);
        return '\uFEFF' + [header, ...rows].map(row => row.map(CSVManager.cell).join(',')).join('\r\n');
    }
}
if (typeof module !== 'undefined' && module.exports) module.exports = { CSVManager };
else window.CSVManager = CSVManager;
