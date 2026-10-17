/** Independent implementation of the published WHO LMS method. Reference data are read-only. */
class ClinicalEngine {
    constructor(data) {
        if (data?.schemaVersion !== 1 || !data.referenceVersion) throw new Error('referenceInvalid');
        for (const key of ['weightForAge', 'heightForAge', 'weightForLength', 'weightForHeight']) {
            for (const sex of ['M', 'F']) {
                const rows = data.tables?.[key]?.[sex];
                const expected = key.includes('Age') ? 1827 : key === 'weightForLength' ? 651 : 551;
                if (!rows || Object.keys(rows).length !== expected) throw new Error('referenceInvalid');
                const start = key.includes('Age') ? 0 : key === 'weightForLength' ? 45 : 65;
                const step = key.includes('Age') ? 1 : 0.1;
                for (let i = 0; i < expected; i++) {
                    if (!Object.hasOwn(rows, String(Math.round((start + i * step) * 10) / 10))) throw new Error('referenceInvalid');
                }
                for (const [index, params] of Object.entries(rows)) {
                    if (!Number.isFinite(Number(index)) || params.length !== 3 || !params.every(Number.isFinite) || params[1] <= 0 || params[2] <= 0) throw new Error('referenceInvalid');
                }
            }
        }
        this.data = data;
    }

    static numeric(value, min, max, error) {
        if (!['number','string'].includes(typeof value) || typeof value === 'string' && !value.trim() || !Number.isFinite(Number(value)) || Number(value) < min || Number(value) > max) throw new Error(error);
        return Number(value);
    }

    static dateDays(value) {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('dateInvalid');
        const time = Date.parse(value + 'T00:00:00Z');
        if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) throw new Error('dateInvalid');
        return time / 86400000;
    }

    static normalize(raw) {
        const ageMode = raw.ageMode || 'months';
        if (raw.measurementDate !== undefined && raw.measurementDate !== '') {
            if (this.dateDays(raw.measurementDate) > this.dateDays(this.today())) throw new Error('dateFuture');
        }
        let ageDays, ageMonths;
        if (ageMode === 'dates') {
            ageDays = this.dateDays(raw.measurementDate) - this.dateDays(raw.birthDate);
            if (this.dateDays(raw.measurementDate) > this.dateDays(this.today())) throw new Error('dateFuture');
            ageMonths = ageDays / 30.4375;
        } else if (ageMode === 'days') {
            ageDays = this.numeric(raw.ageDays, 0, 1826, 'ageInvalid');
            if (!Number.isInteger(ageDays)) throw new Error('ageInvalid');
            ageMonths = ageDays / 30.4375;
        } else if (ageMode === 'months') {
            const years = this.numeric(raw.ageYears, 0, 4, 'ageInvalid');
            const months = this.numeric(raw.ageMonths, 0, 11, 'ageInvalid');
            if (!Number.isInteger(years) || !Number.isInteger(months)) throw new Error('ageInvalid');
            ageMonths = years * 12 + months;
            ageDays = Math.floor(ageMonths * 30.4375 + 0.5);
        } else throw new Error('ageInvalid');
        if (ageMonths < 0 || ageMonths >= 60 || ageDays < 0) throw new Error('ageInvalid');
        if (!['M', 'F'].includes(raw.gender)) throw new Error('sexInvalid');
        if (!['L', 'H'].includes(raw.position)) throw new Error('positionInvalid');
        if (!['n', 'y'].includes(raw.oedema)) throw new Error('oedemaInvalid');
        const weight = this.numeric(raw.weight, 50, 100000, 'weightInvalid');
        const height = this.numeric(raw.height, 30, 150, 'heightInvalid');
        if (['name','caseId'].some(key => raw[key] !== undefined && typeof raw[key] !== 'string')) throw new Error('nameInvalid');
        if (raw.visitId !== undefined && (typeof raw.visitId !== 'string' || !raw.visitId || raw.visitId.length > 200)) throw new Error('importInvalid');
        const name = (raw.name || '').trim();
        const caseId = (raw.caseId || '').trim();
        if (name.length > 100 || caseId.length > 100) throw new Error('nameInvalid');
        const child = { ...raw, id: raw.id || 'child_' + crypto.randomUUID(), visitId: raw.visitId || 'visit_' + crypto.randomUUID(), name, caseId, ageMode, ageDays, totalAgeMonths: ageMonths, weight, height, createdAt: raw.createdAt || new Date().toISOString() };
        if (ageMode !== 'months') {
            child.ageYears = Math.floor(ageMonths / 12);
            child.ageMonths = Math.floor(ageMonths % 12);
        }
        return child;
    }

    static today() {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    static lms(value, [l, m, s], adjust = true) {
        let z = l === 0 ? Math.log(value / m) / s : Math.expm1(l * Math.log(value / m)) / (l * s);
        const sd = n => l === 0 ? m * Math.exp(n * s) : m * Math.pow(1 + l * s * n, 1 / l);
        if (adjust && z > 3) z = 3 + (value - sd(3)) / (sd(3) - sd(2));
        if (adjust && z < -3) z = -3 + (value - sd(-3)) / (sd(-2) - sd(-3));
        if (!Number.isFinite(z)) throw new Error('calculationInvalid');
        return z;
    }

    params(key, sex, value) {
        const table = this.data.tables[key][sex];
        if (key.includes('Age')) {
            const found = table[String(Math.floor(value + 0.5))];
            if (!found) throw new Error('outsideReference');
            return found;
        }
        const min = key === 'weightForLength' ? 45 : 65;
        const max = key === 'weightForLength' ? 110 : 120;
        if (value < min || value > max) throw new Error('outsideReference');
        const lower = Math.floor(value * 10 + 1e-8) / 10;
        const ratio = (value - lower) * 10;
        const a = table[String(lower)];
        if (Math.abs(ratio) < 1e-8) return a;
        const b = table[String(Math.round((lower + 0.1) * 10) / 10)];
        if (!a || !b) throw new Error('outsideReference');
        return a.map((v, i) => v + ratio * (b[i] - v));
    }

    static category(key, z) {
        if (key === 'weightForAge') return z < -3 ? 'underweightSevere' : z < -2 ? 'underweightModerate' : 'withinReference';
        if (key === 'heightForAge') return z < -3 ? 'stuntingSevere' : z < -2 ? 'stuntingModerate' : 'withinReference';
        return z < -3 ? 'wastingSevere' : z < -2 ? 'wastingModerate' : z > 3 ? 'obesity' : z > 2 ? 'overweight' : z > 1 ? 'riskOverweight' : 'withinReference';
    }

    calculate(raw) {
        const child = ClinicalEngine.normalize(raw);
        const warnings = [];
        if (child.ageMode === 'months') warnings.push('estimatedAge');
        let correctedHeight = child.height;
        const incorrectInfantPosition = child.totalAgeMonths < 9 && child.position === 'H';
        if (incorrectInfantPosition) warnings.push('infantPosition');
        else if (child.ageDays < 731 && child.position === 'H') { correctedHeight += 0.7; warnings.push('heightAdjusted'); }
        else if (child.ageDays >= 731 && child.position === 'L') { correctedHeight -= 0.7; warnings.push('heightAdjusted'); }
        if (child.oedema === 'y') warnings.push('oedemaWarning');
        const indicators = {};
        for (const key of ['weightForAge', 'heightForAge', 'weightForHeight']) {
            let error = null;
            if (child.oedema === 'y' && key !== 'heightForAge') error = 'oedemaWarning';
            if (incorrectInfantPosition && key !== 'weightForAge') error = 'infantPosition';
            try {
                if (error) throw new Error(error);
                const tableKey = key === 'weightForHeight' ? (child.ageDays < 731 ? 'weightForLength' : 'weightForHeight') : key;
                const axis = key === 'weightForHeight' ? correctedHeight : child.ageDays;
                const value = key === 'heightForAge' ? correctedHeight : child.weight / 1000;
                const zRaw = ClinicalEngine.lms(value, this.params(tableKey, child.gender, axis), key !== 'heightForAge');
                const rounded = Math.round(zRaw * 100) / 100;
                const zscore = Object.is(rounded, -0) ? 0 : rounded;
                const flagged = key === 'weightForAge' ? zscore < -6 || zscore > 5 : Math.abs(zscore) > (key === 'heightForAge' ? 6 : 5);
                indicators[key] = { zscore, classification: ClinicalEngine.category(key, zRaw), flagged, reference: this.data.referenceVersion };
            } catch (failure) { indicators[key] = { zscore: null, error: failure.message }; }
        }
        const status = Object.values(indicators).some(v => v.zscore === null) ? 'incomplete' : Object.values(indicators).some(v => v.flagged) ? 'checkMeasures' : 'complete';
        return { child, result: { id: 'result_' + crypto.randomUUID(), childId: child.id, childName: child.name, schemaVersion: 2, calculatedAt: new Date().toISOString(), referenceVersion: this.data.referenceVersion, engineVersion: '2.0.0', correctedHeight, status, warnings, ...indicators } };
    }
}
if (typeof module !== 'undefined' && module.exports) module.exports = { ClinicalEngine };
else window.ClinicalEngine = ClinicalEngine;
