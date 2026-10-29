'use strict';
/** Independent implementation of published CDC equations. See docs/references/CDC.md.
 * Explicit US profile; per-visit reference context, offline data and separate
 * charts/categories. Numerical checks do not constitute clinical validation.
 */
class CDCReference {
    static version = '1.0.0';
    static keys = ['weightForAge', 'heightForAge', 'bmiForAge'];
    static bounds = {weightForAge: [-5, 8], heightForAge: [-5, 4], bmiForAge: [-4, 8]};
    static ages = [24, ...Array.from({length: 216}, (_, i) => 24.5 + i), 240];
    constructor(data) {
        if (data?.schemaVersion !== 1 || !/^CDC-2000-2022-[a-f0-9]{12}$/.test(data.referenceVersion || '')) throw Error('referenceInvalid');
        for (const key of CDCReference.keys) for (const sex of ['M', 'F']) {
            const table = data.tables?.[key]?.[sex];
            if (!table || Object.keys(table).length !== CDCReference.ages.length) throw Error('referenceInvalid');
            for (const age of CDCReference.ages) {
                const p = table[age];
                if (!Array.isArray(p) || p.length !== 3 || !p.every(Number.isFinite) || p[1] <= 0 || p[2] <= 0) throw Error('referenceInvalid');
            }
        }
        this.data = data;
    }
    static effectiveAge(age, precision = 'exact') {
        if (!Number.isFinite(age) || !['exact', 'completedMonths'].includes(precision) || precision === 'completedMonths' && !Number.isInteger(age)) return null;
        const effective = age + (precision === 'completedMonths' ? 0.5 : 0);
        return effective >= 24 && effective < 240 ? effective : null;
    }
    params(key, sex, age) {
        if (!CDCReference.keys.includes(key) || !['M', 'F'].includes(sex) || CDCReference.effectiveAge(age) === null) return null;
        const table = this.data.tables[key][sex];
        if (Object.hasOwn(table, age)) return table[age].slice();
        let low = 0, high = CDCReference.ages.length - 1;
        while (high - low > 1) {
            const middle = (low + high) >> 1;
            if (CDCReference.ages[middle] <= age) low = middle; else high = middle;
        }
        const a = CDCReference.ages[low], b = CDCReference.ages[high], fraction = (age - a) / (b - a);
        return table[a].map((v, i) => v + fraction * (table[b][i] - v));
    }
    static lms(value, [l, m, s]) {
        if (!(value > 0) || !Number.isFinite(value)) return NaN;
        return l === 0 ? Math.log(value / m) / s : Math.expm1(l * Math.log(value / m)) / (l * s);
    }
    static measurement(z, [l, m, s]) {
        return l === 0 ? m * Math.exp(s * z) : 1 + l * s * z > 0 ? m * Math.exp(Math.log1p(l * s * z) / l) : NaN;
    }
    // Normal upper tail via regularized gamma Q(1/2,z²/2). A continued
    // fraction avoids cancellation for the extended BMI upper tail.
    static survival(z) {
        if (!Number.isFinite(z)) return NaN;
        if (z < 0) return 1 - this.survival(-z);
        if (z === 0) return 0.5;
        const x = z * z / 2, factor = Math.exp(-x + 0.5 * Math.log(x) - 0.5723649429247001);
        if (x < 1.5) {
            let term = 2, sum = term;
            for (let n = 1; n <= 200; n++) {term *= x / (n + 0.5); sum += term; if (Math.abs(term) < Math.abs(sum) * 2e-16) break;}
            return (1 - factor * sum) / 2;
        }
        let b = x + 0.5, c = 1e300, d = 1 / b, h = d;
        for (let i = 1; i <= 1000; i++) {
            const a = -i * (i - 0.5); b += 2;
            d = a * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
            c = b + a / c; if (Math.abs(c) < 1e-300) c = 1e-300;
            d = 1 / d; const delta = d * c; h *= delta;
            if (Math.abs(delta - 1) < 3e-15) break;
        }
        return factor * h / 2;
    }
    static inverseSurvival(q) {
        if (!(q > 0 && q < 1)) return NaN;
        if (q > 0.5) return -this.inverseSurvival(1 - q);
        if (q === 0.5) return 0;
        let low = 0, high = 40;
        for (let i = 0; i < 90; i++) {const mid = (low + high) / 2; if (this.survival(mid) > q) low = mid; else high = mid;}
        return (low + high) / 2;
    }
    static sigma(sex, age) {
        const years = age / 12;
        const value = sex === 'M' ? 0.3728 + 0.5196 * years - 0.0091 * years ** 2 : 0.8334 + 0.3712 * years - 0.0011 * years ** 2;
        return Math.round(value * 1e8) / 1e8;
    }
    static unavailable(error) {return {zscore: null, zscoreRaw: null, percentile: null, percentileStatus: 'percentileUnavailable', flagged: null, error};}
    static percentileFields(z) {
        const raw = z < 0 ? 100 * this.survival(-z) : 100 * (1 - this.survival(z));
        const rounded = Math.round(raw * 1e6) / 1e6, percentile = rounded > 0 && rounded < 100 ? rounded : null;
        return {zscoreRaw: z, percentile, percentileStatus: percentile === null ? 'percentileExtreme' : 'percentileCalculated'};
    }
    static positionCategory(z) {
        const p = z < 0 ? 100 * this.survival(-z) : 100 * (1 - this.survival(z));
        return p < 3 ? 'cdcBelow3' : p > 97 ? 'cdcAbove97' : 'cdcBetween3And97';
    }
    static thresholds(params) {
        // Fixed normal quantiles are calculated once; no repeated inverse search per visit.
        this._thresholdsZ ||= Object.freeze({p5: this.inverseSurvival(0.95), p85: this.inverseSurvival(0.15), p95: this.inverseSurvival(0.05)});
        return Object.fromEntries(Object.entries(this._thresholdsZ).map(([key,z]) => [key,this.measurement(z,params)]));
    }
    static bmiCategoryFromThresholds(bmi, {p5,p85,p95}) {
        return bmi >= 1.2*p95 || bmi >= 35 ? 'cdcSevereObesity' : bmi >= p95 ? 'cdcObesity' : bmi >= p85 ? 'cdcOverweight' : bmi < p5 ? 'cdcUnderweight' : 'cdcHealthyWeight';
    }
    static bmiCategory(bmi, params) {
        return this.bmiCategoryFromThresholds(bmi,this.thresholds(params));
    }
    valueAtZ(key, sex, age, z) {
        const params = this.params(key, sex, age);
        if (!params || !Number.isFinite(z)) return null;
        let value = CDCReference.measurement(z, params);
        if (key === 'bmiForAge' && z > CDCReference.inverseSurvival(0.05)) {
            const p95 = CDCReference.measurement(CDCReference.inverseSurvival(0.05), params);
            value = p95 + CDCReference.sigma(sex, age) * CDCReference.inverseSurvival(CDCReference.survival(z) / 0.1);
        }
        return Number.isFinite(value) && value > 0 ? value : null;
    }
    score(key, value, sex, age) {
        const params = this.params(key, sex, age);
        if (!params) return CDCReference.unavailable('ageOutsideReference');
        if (!(value > 0) || !Number.isFinite(value)) return CDCReference.unavailable('measureMissing');
        const originalZ = CDCReference.lms(value, params), median = params[1];
        const delta = value < median ? median - CDCReference.measurement(-2, params) : CDCReference.measurement(2, params) - median;
        const modifiedZ = 2 * (value - median) / delta;
        if (!Number.isFinite(originalZ) || !Number.isFinite(modifiedZ)) return CDCReference.unavailable('calculationInvalid');
        const [lower, upper] = CDCReference.bounds[key];
        const flagged = modifiedZ < lower || modifiedZ > upper;
        let z = originalZ, tail = CDCReference.survival(z), method = 'CDC2000-LMS', extra = {};
        if (key === 'bmiForAge') {
            const thresholds = CDCReference.thresholds(params), p95=thresholds.p95, sigma = CDCReference.sigma(sex, age);
            extra = {...thresholds, percentOfP95: 100 * value / p95, sigma, originalZscoreRaw: originalZ};
            if (value > p95) {
                tail = 0.1 * CDCReference.survival((value - p95) / sigma);
                z = CDCReference.inverseSurvival(tail); method = 'CDC2022-extended-BMI';
            }
        }
        if (!Number.isFinite(z)) return {...CDCReference.unavailable('cdcTailUnrepresentable'), modifiedZscore: modifiedZ, flagged, ...extra};
        const classification = key === 'bmiForAge' ? CDCReference.bmiCategoryFromThresholds(value,extra) : CDCReference.positionCategory(z);
        const score = Math.round(z * 100) / 100;
        return {zscore: Object.is(score, -0) ? 0 : score, ...CDCReference.percentileFields(z), modifiedZscore: modifiedZ, flagged, classification, reference: this.data.referenceVersion, method, ...extra};
    }
    compute({sex, ageInMonths, weightKg, heightCm, position = 'H', oedema = 'n', agePrecision = 'exact'}) {
        if (!['M', 'F'].includes(sex)) throw Error('sexInvalid');
        if (!['H', 'L'].includes(position)) throw Error('positionInvalid');
        if (!['n', 'y'].includes(oedema)) throw Error('oedemaInvalid');
        const age = CDCReference.effectiveAge(ageInMonths, agePrecision);
        const adjustedHeight = typeof heightCm === 'number' && Number.isFinite(heightCm) && heightCm > 0.8 ? heightCm - (position === 'L' ? 0.8 : 0) : null;
        const bmi = Number.isFinite(weightKg) && weightKg > 0 && adjustedHeight !== null ? weightKg / (adjustedHeight / 100) ** 2 : null;
        const values = {weightForAge: weightKg, heightForAge: adjustedHeight, bmiForAge: bmi}, scores = {};
        for (const key of CDCReference.keys) scores[key] = age === null ? CDCReference.unavailable('ageOutsideReference') : oedema === 'y' && key !== 'heightForAge' ? CDCReference.unavailable('oedemaWarning') : this.score(key, values[key], sex, age);
        scores.weightForHeight = {...CDCReference.unavailable('noWeightForHeightCDC'), notApplicable: true};
        return {referenceVersion: this.data.referenceVersion, engineVersion: CDCReference.version, referenceFamily: 'CDC2000', ageInMonths: age, reportedAgeInMonths: ageInMonths, agePrecision, correctedHeight: adjustedHeight, heightAdjustmentCm: position === 'L' ? -0.8 : 0, bmi, scores};
    }
}
if (typeof module !== 'undefined' && module.exports) module.exports = {CDCReference}; else window.CDCReference = CDCReference;
