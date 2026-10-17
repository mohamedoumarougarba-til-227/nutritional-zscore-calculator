class CSVManager {
    static parse(text) {
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
        const allowed = ['name', 'caseId', 'ageYears', 'ageMonths', 'ageDays', 'ageMode', 'birthDate', 'measurementDate', 'weight', 'height', 'gender', 'position', 'oedema'];
        if (new Set(headers).size !== headers.length || headers.some(k => !allowed.includes(k)) || ['weight', 'height', 'gender', 'position', 'oedema'].some(k => !headers.includes(k))) throw new Error('csvInvalid');
        // Validate the entire file before returning any child for addition.
        return rows.map(values => {
            if (values.length !== headers.length) throw new Error('csvInvalid');
            const raw = Object.fromEntries(headers.map((k, i) => [k, values[i].trim()]));
            return ClinicalEngine.normalize(raw);
        });
    }
    static cell(value) {
        if (typeof value !== 'number' && /^\s*[=+@\-\t\r]/.test(String(value ?? ''))) value = "'" + value;
        return '"' + String(value ?? '').replace(/"/g, '""') + '"';
    }
    static results(entries) {
        const keys = ['weightForAge', 'heightForAge', 'weightForHeight'];
        const header = ['name', 'caseId', 'visitId', 'ageMode', 'ageDays', 'measurementDate', 'weight_g', 'height_cm', 'gender', 'position', 'oedema', ...keys, ...keys.map(k => k + '_flag'), 'status', 'reference', 'engineVersion', 'calculatedAt'];
        const rows = entries.map(({child:c, result:r}) => [c.name, c.caseId, c.visitId, c.ageMode, c.ageDays, c.measurementDate, c.weight, c.height, c.gender, c.position, c.oedema,
            ...keys.map(k => r?.[k]?.zscore), ...keys.map(k => r?.[k]?.flagged ? 1 : 0), r?.status || (r?'legacy':'not-calculated'), r?.referenceVersion || 'legacy-unverified', r?.engineVersion || '', r?.calculatedAt]);
        return '\uFEFF' + [header, ...rows].map(row => row.map(CSVManager.cell).join(',')).join('\r\n');
    }
}
if (typeof module !== 'undefined' && module.exports) module.exports = { CSVManager };
else window.CSVManager = CSVManager;
