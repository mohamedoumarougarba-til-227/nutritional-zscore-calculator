/** Independent implementation of the published WHO LMS method. Reference data are read-only. */
const NutritionCore=typeof module!=='undefined'&&module.exports?require('./nutrition-assessment.js').NutritionAssessment:NutritionAssessment;
const SupplementaryCore=typeof module!=='undefined'&&module.exports?require('./supplementary-growth.js').SupplementaryGrowth:SupplementaryGrowth;
const ProfileCore=typeof module!=='undefined'&&module.exports?require('./growth-profile.js').GrowthProfile:GrowthProfile;
class ClinicalEngine {
    static version = '4.1.0';
    static indicators = ['weightForAge', 'heightForAge', 'weightForHeight', 'bmiForAge'];
    static resultIndicators(result) { return this.indicators.slice(); }
    static applicable(family,age) { if(family==='INTERGROWTH2015')return ['weightForAge','heightForAge'];return family==='WHO2006'?this.indicators.slice():family==='CDC2000'||age<121?['weightForAge','heightForAge','bmiForAge']:['heightForAge','bmiForAge']; }
    constructor(data) {
        if (data?.schemaVersion !== 1 || !data.referenceVersion) throw new Error('referenceInvalid');
        for (const key of ['weightForAge', 'heightForAge', 'weightForLength', 'weightForHeight', 'bmiForAge']) {
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

    static beforeFifthBirthday(birthDays, measurementDays) {
        const anniversary = new Date(birthDays * 86400000);
        // UTC calendar arithmetic, not an average month. Feb 29 rolls to March 1
        // in a non-leap year, consistently for date and exact-day input modes.
        anniversary.setUTCFullYear(anniversary.getUTCFullYear() + 5);
        return measurementDays < anniversary.getTime() / 86400000;
    }

    static normalize(raw, { forArchive = false, extended = false } = {}) {
        if(raw?.growthProfile==='intergrowth'){const adapter=typeof module!=='undefined'&&module.exports?require('./intergrowth-result.js').IntergrowthResult:IntergrowthResult;return adapter.normalize(raw);}
        const profile=ProfileCore.read(raw),maximumMonths=extended?(profile==='us'?240:229):60;
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
            ageDays = this.numeric(raw.ageDays, 0, extended ? Math.ceil(maximumMonths*30.4375)-1 : 1826, 'ageInvalid');
            if (!Number.isInteger(ageDays)) throw new Error('ageInvalid');
            ageMonths = ageDays / 30.4375;
        } else if (ageMode === 'months') {
            const years = this.numeric(raw.ageYears, 0, extended ? 19 : 4, 'ageInvalid');
            const months = this.numeric(raw.ageMonths, 0, 11, 'ageInvalid');
            if (!Number.isInteger(years) || !Number.isInteger(months)) throw new Error('ageInvalid');
            ageMonths = years * 12 + months;
            ageDays = Math.floor(ageMonths * 30.4375 + 0.5);
        } else throw new Error('ageInvalid');
        if (ageMonths < 0 || ageMonths >= maximumMonths || ageDays < 0) throw new Error('ageInvalid');
        // Archive validation retains the previous accepted domain without
        // recalculating a stored result. New calculations/CSV use the strict rule.
        if (!extended && !forArchive && ageMode === 'dates' && !this.beforeFifthBirthday(this.dateDays(raw.birthDate), this.dateDays(raw.measurementDate))) throw new Error('ageInvalid');
        if (!extended && !forArchive && ageMode === 'days' && ageDays === 1826) {
            if (!raw.measurementDate) throw new Error('ageBoundaryDateRequired');
            const measurementDays = this.dateDays(raw.measurementDate);
            if (!this.beforeFifthBirthday(measurementDays - ageDays, measurementDays)) throw new Error('ageInvalid');
        }
        if (!['M', 'F'].includes(raw.gender)) throw new Error('sexInvalid');
        if (!['L', 'H'].includes(raw.position)) throw new Error('positionInvalid');
        if (!['n', 'y'].includes(raw.oedema)) throw new Error('oedemaInvalid');
        const weight = this.numeric(raw.weight, 50, extended ? 300000 : 100000, 'weightInvalid');
        const height = this.numeric(raw.height, 30, extended ? 250 : 150, 'heightInvalid');
        if (['name','caseId'].some(key => raw[key] !== undefined && typeof raw[key] !== 'string')) throw new Error('nameInvalid');
        if (raw.visitId !== undefined && (typeof raw.visitId !== 'string' || !raw.visitId || raw.visitId.length > 200)) throw new Error('importInvalid');
        const name = (raw.name || '').trim();
        const caseId = (raw.caseId || '').trim();
        if (name.length > 100 || caseId.length > 100) throw new Error('nameInvalid');
        const clinical = {...NutritionCore.normalize(raw),...SupplementaryCore.normalize(raw)};
        const child = { ...raw, ...clinical, id: raw.id || 'child_' + crypto.randomUUID(), visitId: raw.visitId || 'visit_' + crypto.randomUUID(), name, caseId, ageMode, ageDays, totalAgeMonths: ageMonths, weight, height, createdAt: raw.createdAt || new Date().toISOString() };
        child.ageDomainVersion=profile==='us'?3:2;
        if(profile==='us')child.growthProfile='us';else delete child.growthProfile;
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
        if (key === 'bmiForAge') return z < -3 ? 'bmiBelow3' : z < -2 ? 'bmiBelow2' : z > 3 ? 'bmiAbove3' : z > 2 ? 'bmiAbove2' : z > 1 ? 'bmiAbove1' : 'bmiWithin';
        return z < -3 ? 'wastingSevere' : z < -2 ? 'wastingModerate' : z > 3 ? 'obesity' : z > 2 ? 'overweight' : z > 1 ? 'riskOverweight' : 'withinReference';
    }

    static percentile(z) {
        if (typeof z !== 'number' || !Number.isFinite(z) || Math.abs(z) > 3) return null;
        // Integrate exp(-t²/2) by its convergent power series on [-3,3].
        // No external library, lookup approximation or extrapolated tail.
        let term = z, sum = z;
        for (let n = 1; n <= 80; n++) {
            term *= -z * z * (2 * n - 1) / (2 * n * (2 * n + 1));
            sum += term;
            if (Math.abs(term) < 1e-16) break;
        }
        return 100 * (0.5 + sum / Math.sqrt(2 * Math.PI));
    }

    static percentileFields(z) {
        const value = this.percentile(z);
        return { zscoreRaw:z, percentile:value === null ? null : Math.round(value * 1e6) / 1e6, percentileStatus:value === null ? 'percentileExtreme' : 'percentileCalculated' };
    }

    calculate(raw) {
        const child = ClinicalEngine.normalize(raw);
        return this.calculateNormalized(child);
    }

    calculateNormalized(child) {
        const warnings = [];
        if (child.ageMode === 'months') warnings.push('estimatedAge');
        let correctedHeight = child.height;
        const incorrectInfantPosition = child.totalAgeMonths < 9 && child.position === 'H';
        if (incorrectInfantPosition) warnings.push('infantPosition');
        else if (child.ageDays < 731 && child.position === 'H') { correctedHeight += 0.7; warnings.push('heightAdjusted'); }
        else if (child.ageDays >= 731 && child.position === 'L') { correctedHeight -= 0.7; warnings.push('heightAdjusted'); }
        if (child.oedema === 'y') warnings.push('oedemaWarning');
        const indicators = {};
        const bmi = child.weight / 1000 / Math.pow(correctedHeight / 100, 2);
        for (const key of ClinicalEngine.indicators) {
            let error = null;
            if (child.oedema === 'y' && key !== 'heightForAge') error = 'oedemaWarning';
            if (incorrectInfantPosition && key !== 'weightForAge') error = 'infantPosition';
            try {
                if (error) throw new Error(error);
                const tableKey = key === 'weightForHeight' ? (child.ageDays < 731 ? 'weightForLength' : 'weightForHeight') : key;
                const axis = key === 'weightForHeight' ? correctedHeight : child.ageDays;
                const value = key === 'heightForAge' ? correctedHeight : key === 'bmiForAge' ? bmi : child.weight / 1000;
                const zRaw = ClinicalEngine.lms(value, this.params(tableKey, child.gender, axis), key !== 'heightForAge');
                const rounded = Math.round(zRaw * 100) / 100;
                const zscore = Object.is(rounded, -0) ? 0 : rounded;
                const flagged = key === 'weightForAge' ? zscore < -6 || zscore > 5 : Math.abs(zscore) > (key === 'heightForAge' ? 6 : 5);
                indicators[key] = { zscore, classification: ClinicalEngine.category(key, zRaw), flagged, reference: this.data.referenceVersion, ...ClinicalEngine.percentileFields(zRaw) };
            } catch (failure) { indicators[key] = { zscore: null, error: failure.message, zscoreRaw:null, percentile:null, percentileStatus:'percentileUnavailable' }; }
        }
        const status = Object.values(indicators).some(v => v.zscore === null) ? 'incomplete' : Object.values(indicators).some(v => v.flagged) ? 'checkMeasures' : 'complete';
        const result = { id: 'result_' + crypto.randomUUID(), childId: child.id, childName: child.name, schemaVersion: 4, referenceFamily: 'WHO2006', ageInMonths:child.totalAgeMonths, applicableIndicators:ClinicalEngine.indicators.slice(), percentileVersion:1, calculatedAt: new Date().toISOString(), referenceVersion: this.data.referenceVersion, engineVersion: ClinicalEngine.version, correctedHeight, bmi: indicators.bmiForAge.zscore === null ? null : bmi, status, warnings, ...indicators };
        result.nutrition=NutritionCore.assess(child,result);
        return {child,result};
    }
}
if (typeof module !== 'undefined' && module.exports) module.exports = { ClinicalEngine };
else window.ClinicalEngine = ClinicalEngine;
