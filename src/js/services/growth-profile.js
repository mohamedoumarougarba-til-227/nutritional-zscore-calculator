'use strict';
/** Explicit per-visit reference policy. Language/country/IP never select it. */
class GrowthProfile {
    static read(raw) {
        const profile = raw?.growthProfile ?? 'who';
        if (!['who', 'us'].includes(profile)) throw Error('growthProfileInvalid');
        return profile;
    }
    static family(child) {
        if (this.read(child) === 'us' && child.totalAgeMonths >= 24) return 'CDC2000';
        return child.totalAgeMonths < 60 ? 'WHO2006' : 'WHO2007';
    }
    static calculationAge(child) {
        return child.totalAgeMonths + (this.family(child) === 'CDC2000' && child.ageMode === 'months' ? 0.5 : 0);
    }
    static context(child) {
        return this.read(child) === 'who' ? undefined : {version: 1, profile: 'us', reportedAgeInMonths: child.totalAgeMonths, agePrecision: child.ageMode === 'months' ? 'completedMonths' : 'exact'};
    }
    static checkContext(result) {
        const ctx = result.profileContext;
        if (ctx === undefined) {if (result.referenceFamily === 'CDC2000') throw Error('importInvalid'); return 'who';}
        if (!ctx || ctx.version !== 1 || ctx.profile !== 'us' || !['exact', 'completedMonths'].includes(ctx.agePrecision) || !Number.isFinite(ctx.reportedAgeInMonths) || ctx.reportedAgeInMonths < 0 || ctx.reportedAgeInMonths >= 240 || ctx.agePrecision === 'completedMonths' && !Number.isInteger(ctx.reportedAgeInMonths)) throw Error('importInvalid');
        const cdc = ctx.reportedAgeInMonths >= 24, age = ctx.reportedAgeInMonths + (cdc && ctx.agePrecision === 'completedMonths' ? 0.5 : 0);
        if (age >= 240 || result.ageInMonths !== age || result.referenceFamily !== (cdc ? 'CDC2000' : 'WHO2006')) throw Error('importInvalid');
        return 'us';
    }
}
if (typeof module !== 'undefined' && module.exports) module.exports = {GrowthProfile}; else window.GrowthProfile = GrowthProfile;
