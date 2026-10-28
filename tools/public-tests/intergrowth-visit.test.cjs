'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const {IntergrowthVisit: Visit} = require('../reference/intergrowth/visit.cjs');
const {IntergrowthPostnatal: Reference} = require('../reference/intergrowth/postnatal.cjs');
const {GrowthProfile} = require('../../src/js/services/growth-profile.js');
const {HistoryManager} = require('../../src/js/services/history-manager.js');
const {ClinicalEngine} = require('../../src/js/services/clinical-engine.js');
global.ClinicalEngine = ClinicalEngine;
const time = '2026-10-28T12:00:00.000Z';
const input = extra => ({gender: 'M', ageMode: 'days', ageDays: 14,
    gestationalAgeWeeks: 30, gestationalAgeDays: 0,
    weight: 1600, height: 42, headCircumference: 29, position: 'L', oedema: 'n', ...extra});
const calculate = extra => Visit.calculate(input(extra), time);
const close = (a, b, tolerance = 2e-12) => assert.ok(Number.isFinite(a) && Math.abs(a - b) < tolerance, `${a} != ${b}`);

test('INTERGROWTH visit distinguishes birth gestation, chronological age and exact postmenstrual age', () => {
    const record = calculate();
    assert.equal(record.age.birthGestationDays, 210);
    assert.equal(record.age.chronologicalDays, 14);
    assert.equal(record.age.postmenstrualDays, 224);
    assert.equal(record.age.precision, 'wholeDays');
    assert.equal(record.clinicalEligibilityAssessed, false);
    assert.equal(record.scores.weightForAge.measure, 1.6);
    assert.equal(record.scores.lengthForAge.measure, 42);
    assert.equal(record.scores.headCircumferenceForAge.measure, 29);
    close(record.scores.weightForAge.zscoreRaw, Reference.zscore('weightForAge', 'M', 224, 1.6));
    assert.equal(Visit.check(record), true);
    assert.equal(Visit.check(JSON.parse(JSON.stringify(record))), true);
    const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, '../verification/intergrowth-decimal.json')));
    for (const row of fixture.fixtures) {
        const def = Visit.definitions[row.key];
        const r = calculate({gender: row.sex, gestationalAgeWeeks: 26, ageDays: row.pmaDays - 182,
            weight: '', height: '', headCircumference: '', [def.field]: row.measure / def.scale});
        close(r.scores[row.key].zscoreRaw, row.expectedZ);
        assert.equal(Visit.check(r), true);
    }
});

test('INTERGROWTH exact-day/date inputs include leap days and reject completed months, conflicts and bounds', () => {
    const leap = calculate({ageMode: 'dates', birthDate: '2024-02-28', measurementDate: '2024-03-01'});
    assert.equal(leap.age.chronologicalDays, 2); assert.equal(leap.age.postmenstrualDays, 212);
    assert.equal(Visit.check(leap), true);
    for (const extra of [
        {ageMode: 'months', ageYears: 0, ageMonths: 1}, {ageDays: 14.5},
        {ageDays: -1}, {ageDays: ''}, {postmenstrualDays: 448}, {gestationalAgeWeeks: 25},
        {gestationalAgeWeeks: 37}, {gestationalAgeWeeks: 30.5},
        {gestationalAgeDays: 7}, {gestationalAgeDays: ''},
        {gestationalAgeWeeks: 26, ageDays: 6}, {gestationalAgeWeeks: 36, ageDays: 197},
        {ageMode: 'dates', birthDate: '2023-02-29', measurementDate: '2023-03-10'},
        {ageMode: 'dates', birthDate: '2024-03-02', measurementDate: '2024-03-01'},
        {ageMode: 'dates', birthDate: '2024-01-01', measurementDate: '2099-01-01'}
    ]) assert.throws(() => calculate(extra), /intergrowth|date/);
    assert.equal(calculate({gestationalAgeWeeks: 26, ageDays: 7}).age.postmenstrualDays, 189);
    assert.equal(calculate({gestationalAgeWeeks: 36, gestationalAgeDays: 6, ageDays: 190}).age.postmenstrualDays, 448);
    // Input ordering, numeric strings and unrelated optional properties cannot
    // change which age is fed to the reference equations.
    assert.deepEqual(calculate({ageDays: '14', gestationalAgeWeeks: '30', gestationalAgeDays: '0', postmenstrualDays: 224}).age, calculate().age);
});

test('INTERGROWTH supports partial measurements, requires recumbent length and suspends weight for oedema/unknown', () => {
    const head = calculate({weight: '', height: '', position: '', oedema: ''});
    assert.equal(head.scores.weightForAge.error, 'measureMissing');
    assert.equal(head.scores.lengthForAge.error, 'measureMissing');
    assert.ok(Number.isFinite(head.scores.headCircumferenceForAge.zscoreRaw));
    assert.equal(Visit.check(head), true);
    for (const [oedema, expected] of [['y', 'oedemaWarning'], ['', 'intergrowthOedemaUnknown']]) {
        const r = calculate({oedema});
        assert.equal(r.scores.weightForAge.error, expected);
        assert.equal(r.scores.weightForAge.zscoreRaw, null);
        assert.ok(Number.isFinite(r.scores.lengthForAge.zscoreRaw));
        assert.ok(Number.isFinite(r.scores.headCircumferenceForAge.zscoreRaw));
        assert.equal(Visit.check(r), true);
    }
    for (const extra of [{position: 'H'}, {height: 0}, {weight: -1}, {headCircumference: Infinity}, {gender: 'm'},
        {weight: '', height: '', headCircumference: ''}, {oedema: 'unknown'}])
        assert.throws(() => calculate(extra), /intergrowth|calculationInvalid|oedema|sexInvalid/);
    assert.throws(() => calculate({gender: '', height: '', headCircumference: '', oedema: 'y'}), /sexInvalid/);
    assert.throws(() => calculate({headCircumference: 1e308}), /calculationInvalid/);
    const smallHead = calculate({headCircumference: 23});
    assert.equal(smallHead.scores.headCircumferenceForAge.measure, 23);
    // No silent standing-height correction of 0.7 or 0.8 cm.
    assert.equal(calculate().scores.lengthForAge.measure, 42);
});

test('INTERGROWTH centiles are normal positions, with chart extent and early/birth context separate from diagnosis', () => {
    const at = z => calculate({weight: Reference.measurement('weightForAge', 'M', 224, z) * 1000});
    close(at(0).scores.weightForAge.percentile, 50);
    close(at(1).scores.weightForAge.percentile, 84.134475, 5.01e-7);
    close(at(-1).scores.weightForAge.percentile, 15.865525, 5.01e-7);
    const extreme = at(8);
    assert.equal(extreme.scores.weightForAge.percentile, null);
    assert.equal(extreme.scores.weightForAge.percentileStatus, 'percentileExtreme');
    assert.equal(extreme.scores.weightForAge.chartRange, 'outsidePrintedChart');
    assert.equal(extreme.scores.weightForAge.biologicalPlausibilityAssessed, false);
    assert.equal(extreme.scores.weightForAge.classification, undefined);
    assert.equal(Visit.check(extreme), true);
    assert.ok(!calculate().warnings.includes('intergrowthBefore32Weeks'));
    assert.ok(calculate({ageDays: 13}).warnings.includes('intergrowthBefore32Weeks'));
    assert.ok(calculate({ageDays: 0}).warnings.includes('intergrowthBirthAssessmentSeparate'));
    assert.ok(calculate().warnings.includes('intergrowthNeonatalWeightContext'));
});

test('INTERGROWTH stored contract rejects altered age, unit, centile, suspension or method without rewriting input', () => {
    const original = calculate(), saved = JSON.stringify(original);
    for (const mutate of [
        r => r.age.postmenstrualDays++, r => r.age.birthGestationDays++, r => r.age.chronologicalDays++,
        r => r.age.precision = 'estimatedMonths', r => r.sex = 'male',
        r => r.scores.weightForAge.unit = 'g', r => r.scores.weightForAge.measure *= 1000,
        r => r.scores.weightForAge.percentile = 50, r => r.scores.weightForAge.zscore += 1,
        r => r.scores.weightForAge.classification = 'withinReference',
        r => r.scores.weightForAge.method = 'WHO-LMS',
        r => r.scores.weightForAge.chartRange = 'normal',
        r => r.observations.oedema = 'y', r => r.observations.values.weight = '1600',
        r => r.reference = 'WHO2006', r => r.warnings = [], r => delete r.scores.lengthForAge,
        r => r.treatment = 'not permitted', r => r.scores.weightForAge.unknown = {anything: true},
        r => r.clinicalEligibilityAssessed = true
    ]) { const changed = structuredClone(original); mutate(changed); assert.throws(() => Visit.check(changed), /importInvalid/); }
    for (const extra of [{height: ''}, {weight: ''}, {oedema: 'y'}, {oedema: ''}]) {
        const changed = calculate(extra), key = extra.height === '' ? 'lengthForAge' : 'weightForAge';
        changed.scores[key].percentile = 50;
        assert.throws(() => Visit.check(changed), /importInvalid/);
    }
    assert.equal(JSON.stringify(original), saved);
    // This check deliberately does not certify a measurement or recalculate Z
    // against a table: structurally valid data are not clinically verified.
    const consistent = structuredClone(original);
    consistent.observations.values.weight = 1700; consistent.scores.weightForAge.measure = 1.7;
    assert.equal(Visit.check(consistent), true);
});

test('INTERGROWTH prepared contract cannot enter current patient profiles or backups by accidental routing', () => {
    assert.throws(() => GrowthProfile.read({growthProfile: 'intergrowth'}), /growthProfileInvalid/);
    assert.throws(() => HistoryManager.checkWorkspace(calculate()), /importInvalid/);
    const assets = JSON.parse(fs.readFileSync(path.join(__dirname, '../scripts/offline-assets.json')));
    assert.ok(!assets.some(file => /intergrowth/i.test(file)));
});
