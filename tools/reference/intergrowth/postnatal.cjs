'use strict';
/** Prepared numerical core, NOT loaded by the application.
 * Adapted from rOpenSci/GIGS R/ig_png.R, pinned in provenance.json.
 * Copyright London School of Hygiene & Tropical Medicine and GIGS authors;
 * upstream GPL >= 3; TIL adaptation GPL-3.0-only. Notices in LICENSE.md.
 * See docs/references/INTERGROWTH.md for scope and clinical limitations.
 */
class IntergrowthPostnatal {
    static version = '0.1.0';
    static reference = 'INTERGROWTH2015-postnatal-gigs-fb58fe6596d4';
    static keys = Object.freeze(['weightForAge', 'lengthForAge', 'headCircumferenceForAge']);

    // PMA is gestational age at birth + chronological age, in whole DAYS.
    // It is not chronological age or a number of completed weeks/months.
    static params(key, sex, pmaDays) {
        if (!this.keys.includes(key) || !['M', 'F'].includes(sex) ||
            !Number.isInteger(pmaDays) || pmaDays < 189 || pmaDays > 448) return null;
        const x = pmaDays / 7, square = x * x, male = sex === 'M' ? 1 : 0;
        let mu, sigma, logarithmic;
        if (key === 'weightForAge') {
            mu = 2.591277 - 0.01155 * Math.sqrt(x) - 2201.705 / square + 0.0911639 * male;
            sigma = 0.1470258 + 505.92394 / square - 140.0576 / square * Math.log(x);
            logarithmic = true;
        } else if (key === 'lengthForAge') {
            mu = 4.136244 - 547.0018 / square + 0.0026066 * x + 0.0314961 * male;
            sigma = 0.050489 + 310.44761 / square - 90.0742 / square * Math.log(x);
            logarithmic = true;
        } else {
            mu = 55.53617 - 852.0059 / x + 0.7957903 * male;
            sigma = 3.0582292 + 3910.05 / square - 180.5625 / x;
            logarithmic = false;
        }
        if (!Number.isFinite(mu) || !Number.isFinite(sigma) || sigma <= 0) return null;
        return {mu, sigma, logarithmic, unit: key === 'weightForAge' ? 'kg' : 'cm'};
    }

    static zscore(key, sex, pmaDays, measure) {
        const p = this.params(key, sex, pmaDays);
        if (!p || !Number.isFinite(measure) || measure <= 0) return null;
        const z = ((p.logarithmic ? Math.log(measure) : measure) - p.mu) / p.sigma;
        return Number.isFinite(z) ? z : null;
    }

    static measurement(key, sex, pmaDays, z) {
        const p = this.params(key, sex, pmaDays);
        if (!p || !Number.isFinite(z)) return null;
        const linear = p.mu + p.sigma * z, value = p.logarithmic ? Math.exp(linear) : linear;
        return Number.isFinite(value) && value > 0 ? value : null;
    }
}
module.exports = {IntergrowthPostnatal};
