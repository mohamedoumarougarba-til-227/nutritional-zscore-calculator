'use strict';
/** Prepared per-visit contract. NOT connected to the application's profiles or
 * backup importer. No patient lookup, clinical category, admission or treatment.
 * Original TIL code GPL-3.0-only; equations and upstream notices in this folder.
 */
const {IntergrowthPostnatal: Reference} = require('./postnatal.cjs');
const {ClinicalEngine: Input} = require('../../../src/js/services/clinical-engine.js');
const {CDCReference: Normal} = require('../../../src/js/services/reference-cdc.js');

class IntergrowthVisit {
    static version = 1;
    static definitions = Object.freeze({
        weightForAge: {field: 'weight', unit: 'kg', scale: 0.001},
        lengthForAge: {field: 'height', unit: 'cm', scale: 1},
        headCircumferenceForAge: {field: 'headCircumference', unit: 'cm', scale: 1}
    });
    static present(value) { return value !== undefined && value !== null && value !== ''; }
    static integer(value, min, max, error) {
        const number = Input.numeric(value, min, max, error);
        if (!Number.isInteger(number)) throw Error(error);
        return number;
    }
    static age(raw) {
        // This first prepared clinical-context contract is deliberately scoped
        // to the 26..<37 week birth cohort in Villar 2015. This is not the
        // numerical model's age domain, or a claim about all other preterms.
        const weeks = this.integer(raw.gestationalAgeWeeks, 26, 36, 'intergrowthBirthAgeInvalid');
        const days = this.integer(raw.gestationalAgeDays, 0, 6, 'intergrowthBirthAgeInvalid');
        let chronologicalDays, dates;
        if (raw.ageMode === 'days') {
            chronologicalDays = this.integer(raw.ageDays, 0, 448, 'intergrowthExactAgeRequired');
        } else if (raw.ageMode === 'dates') {
            const measured = Input.dateDays(raw.measurementDate), born = Input.dateDays(raw.birthDate);
            if (measured > Input.dateDays(Input.today())) throw Error('dateFuture');
            chronologicalDays = measured - born;
            if (chronologicalDays < 0 || chronologicalDays > 448) throw Error('intergrowthExactAgeRequired');
            dates = {birthDate: raw.birthDate, measurementDate: raw.measurementDate};
        } else throw Error('intergrowthExactAgeRequired');
        const birthGestationDays = weeks * 7 + days, postmenstrualDays = birthGestationDays + chronologicalDays;
        if (postmenstrualDays < 189 || postmenstrualDays > 448) throw Error('intergrowthPmaOutsideReference');
        if (this.present(raw.postmenstrualDays) &&
            this.integer(raw.postmenstrualDays, 189, 448, 'intergrowthAgeConflict') !== postmenstrualDays) throw Error('intergrowthAgeConflict');
        return {version: 1, ageMode: raw.ageMode, gestationalAgeWeeks: weeks, gestationalAgeDays: days,
            birthGestationDays, chronologicalDays, postmenstrualDays, precision: 'wholeDays', ...dates};
    }
    static observations(raw) {
        const values = {};
        for (const {field, scale} of Object.values(this.definitions)) {
            if (!this.present(raw[field])) continue;
            values[field] = Input.numeric(raw[field], Number.MIN_VALUE, Number.MAX_VALUE, 'intergrowthMeasureInvalid');
            if (!(values[field] > 0)) throw Error('intergrowthMeasureInvalid');
            if (!(values[field] * scale > 0)) throw Error('intergrowthMeasureInvalid');
        }
        if (!Object.keys(values).length) throw Error('intergrowthMeasureMissing');
        // Length is measured recumbent, not a standing height transformed using
        // the WHO/CDC correction for a different population/reference.
        if (Object.hasOwn(values, 'height') && raw.position !== 'L') throw Error('intergrowthLengthRequired');
        const oedema = raw.oedema ?? '';
        if (!['', 'n', 'y'].includes(oedema)) throw Error('oedemaInvalid');
        return {values, position: Object.hasOwn(values, 'height') ? 'L' : null, oedema};
    }
    static warnings(age, observations) {
        return ['intergrowthPostnatalOnly',
            ...(age.postmenstrualDays < 224 ? ['intergrowthBefore32Weeks'] : []),
            ...(age.chronologicalDays === 0 ? ['intergrowthBirthAssessmentSeparate'] : []),
            ...(Object.hasOwn(observations.values, 'weight') ? ['intergrowthNeonatalWeightContext'] : [])];
    }
    static calculate(raw, calculatedAt = new Date().toISOString()) {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !['M', 'F'].includes(raw.gender)) throw Error('sexInvalid');
        const age = this.age(raw), observations = this.observations(raw), scores = {};
        if (typeof calculatedAt !== 'string' || !Number.isFinite(Date.parse(calculatedAt))) throw Error('dateInvalid');
        for (const [key, def] of Object.entries(this.definitions)) {
            const missing = !Object.hasOwn(observations.values, def.field);
            const measure = missing ? null : observations.values[def.field] * def.scale;
            const error = missing ? 'measureMissing' : key === 'weightForAge' && observations.oedema !== 'n'
                ? observations.oedema === 'y' ? 'oedemaWarning' : 'intergrowthOedemaUnknown' : null;
            const base = {measure, unit: def.unit, reference: Reference.reference};
            if (error) { scores[key] = {...base, zscoreRaw: null, zscore: null, percentile: null, percentileStatus: 'percentileUnavailable', error}; continue; }
            const z = Reference.zscore(key, raw.gender, age.postmenstrualDays, measure);
            if (z === null) throw Error('calculationInvalid');
            const rounded = Math.round(z * 100) / 100;
            if (!Number.isFinite(rounded)) throw Error('calculationInvalid');
            scores[key] = {...base, ...Normal.percentileFields(z), zscore: Object.is(rounded, -0) ? 0 : rounded,
                method: key === 'headCircumferenceForAge' ? 'INTERGROWTH2015-normal' : 'INTERGROWTH2015-log-normal',
                chartRange: Math.abs(z) <= 3 ? 'withinPrintedChart' : 'outsidePrintedChart',
                biologicalPlausibilityAssessed: false};
        }
        return {version: this.version, reference: Reference.reference, coreVersion: Reference.version,
            calculatedAt, sex: raw.gender, age, observations, scores, clinicalEligibilityAssessed: false,
            warnings: this.warnings(age, observations)};
    }
    static sameKeys(a, b) {
        return !!a && typeof a === 'object' && !Array.isArray(a) &&
            JSON.stringify(Object.keys(a).sort()) === JSON.stringify(Object.keys(b).sort());
    }
    static check(record) {
        const fail = () => { throw Error('importInvalid'); };
        if (!record || record.version !== this.version || record.reference !== Reference.reference ||
            record.coreVersion !== Reference.version || !['M', 'F'].includes(record.sex) ||
            typeof record.calculatedAt !== 'string' || !Number.isFinite(Date.parse(record.calculatedAt))) fail();
        if (!this.sameKeys(record, {version: 1, reference: 1, coreVersion: 1, calculatedAt: 1,
            sex: 1, age: 1, observations: 1, scores: 1, warnings: 1, clinicalEligibilityAssessed: 1}) ||
            record.clinicalEligibilityAssessed !== false) fail();
        const a = record.age, o = record.observations;
        if (!a || !o || !o.values || !['', 'n', 'y'].includes(o.oedema)) fail();
        let expectedAge, expectedObservations;
        try {
            const raw = {ageMode: a.ageMode, ageDays: a.chronologicalDays, gestationalAgeWeeks: a.gestationalAgeWeeks,
                gestationalAgeDays: a.gestationalAgeDays, birthDate: a.birthDate, measurementDate: a.measurementDate};
            expectedAge = this.age(raw);
            expectedObservations = this.observations({...o.values, position: o.position, oedema: o.oedema});
        } catch (_) { fail(); }
        if (!this.sameKeys(a, expectedAge) || Object.entries(expectedAge).some(([key, value]) => a[key] !== value) ||
            !this.sameKeys(o, expectedObservations) || !this.sameKeys(o.values, expectedObservations.values) ||
            Object.entries(expectedObservations.values).some(([key, value]) => o.values[key] !== value) ||
            o.position !== expectedObservations.position || !this.sameKeys(record.scores, this.definitions) ||
            JSON.stringify(record.warnings) !== JSON.stringify(this.warnings(a, o))) fail();
        for (const [key, def] of Object.entries(this.definitions)) {
            const v = record.scores[key], missing = !Object.hasOwn(o.values, def.field);
            if (!v || typeof v !== 'object' || Array.isArray(v) || v.reference !== Reference.reference || v.unit !== def.unit ||
                v.measure !== (missing ? null : o.values[def.field] * def.scale)) fail();
            const error = missing ? 'measureMissing' : key === 'weightForAge' && o.oedema !== 'n'
                ? o.oedema === 'y' ? 'oedemaWarning' : 'intergrowthOedemaUnknown' : null;
            if (error) {
                const expected = {measure: v.measure, unit: def.unit, reference: Reference.reference,
                    zscoreRaw: null, zscore: null, percentile: null, percentileStatus: 'percentileUnavailable', error};
                if (!this.sameKeys(v, expected) || Object.entries(expected).some(([field, value]) => v[field] !== value)) fail();
                continue;
            }
            if (!Number.isFinite(v.zscoreRaw) || !Number.isFinite(v.zscore) ||
                v.zscore !== Math.round(v.zscoreRaw * 100) / 100 || v.error !== undefined || v.classification !== undefined ||
                v.biologicalPlausibilityAssessed !== false || v.chartRange !== (Math.abs(v.zscoreRaw) <= 3 ? 'withinPrintedChart' : 'outsidePrintedChart') ||
                v.method !== (key === 'headCircumferenceForAge' ? 'INTERGROWTH2015-normal' : 'INTERGROWTH2015-log-normal')) fail();
            if (!this.sameKeys(v, {measure: 1, unit: 1, reference: 1, zscoreRaw: 1, zscore: 1,
                percentile: 1, percentileStatus: 1, method: 1, chartRange: 1, biologicalPlausibilityAssessed: 1})) fail();
            const p = Normal.percentileFields(v.zscoreRaw);
            if (v.percentile !== p.percentile || v.percentileStatus !== p.percentileStatus) fail();
        }
        // Intentionally no lookup/recalculation of the clinical measurements.
        // Internal consistency does not certify the medical truth of an import.
        return true;
    }
}
module.exports = {IntergrowthVisit};
