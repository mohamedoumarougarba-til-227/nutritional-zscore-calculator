'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const {IntergrowthPostnatal: IG} = require('../reference/intergrowth/postnatal.cjs');
const root = path.resolve(__dirname, '../..');
const read = name => fs.readFileSync(path.join(root, name));
const json = name => JSON.parse(read(name));
const close = (actual, expected, tolerance = 2e-12) =>
    assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);

test('INTERGROWTH prepared equations retain pinned GPL code, attribution and source bytes', () => {
    const p = json('tools/reference/intergrowth/provenance.json');
    assert.equal(p.reference, IG.reference);
    assert.equal(p.commit, 'fb58fe6596d4b289d5362c5efe00f882984d3186');
    assert.equal(p.declaredLicense, 'GPL-3.0-or-later');
    assert.equal(p.sources.length, 3);
    for (const source of p.sources) {
        const bytes = read('tools/reference/intergrowth/' + source.file);
        assert.equal(bytes.length, source.bytes);
        assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), source.sha256);
    }
    assert.match(read('tools/reference/intergrowth/DESCRIPTION').toString(), /License: GPL \(>= 3\)/);
});

test('INTERGROWTH uses inclusive PMA 189..448 whole days, exact sex and explicit units, without extrapolation', () => {
    for (const days of [188, 449, 189.1, 27, '189', null, undefined, NaN, Infinity])
        assert.equal(IG.params('weightForAge', 'M', days), null);
    for (const sex of ['m', 'male', 1, '', undefined]) assert.equal(IG.params('weightForAge', sex, 280), null);
    for (const key of ['weightForHeight', 'bmiForAge', '', undefined]) assert.equal(IG.params(key, 'M', 280), null);
    for (const days of [189, 190, 447, 448]) for (const key of IG.keys) {
        const p = IG.params(key, 'F', days);
        assert.ok(p.sigma > 0);
        assert.equal(p.unit, key === 'weightForAge' ? 'kg' : 'cm');
        assert.equal(p.logarithmic, key !== 'headCircumferenceForAge');
    }
    for (const value of [0, -1, '', '3', null, undefined, NaN, Infinity])
        assert.equal(IG.zscore('weightForAge', 'M', 280, value), null);
    for (const z of ['0', null, undefined, NaN, Infinity])
        assert.equal(IG.measurement('weightForAge', 'M', 280, z), null);
    assert.equal(IG.measurement('weightForAge', 'M', 280, 1e308), null);
    assert.equal(IG.measurement('weightForAge', 'M', 280, -1e308), null);
    assert.equal(IG.measurement('headCircumferenceForAge', 'M', 280, -1e5), null);
});

test('INTERGROWTH matches 90 independently generated Decimal synthetic cases, including fractional weeks', () => {
    const oracle = json('tools/verification/intergrowth-decimal.json');
    assert.equal(oracle.reference, IG.reference);
    assert.equal(oracle.precision, 60);
    assert.equal(oracle.fixtures.length, 90);
    for (const row of oracle.fixtures) {
        const p = IG.params(row.key, row.sex, row.pmaDays);
        close(p.mu, row.mu); close(p.sigma, row.sigma);
        close(IG.measurement(row.key, row.sex, row.pmaDays, row.z), row.measure);
        close(IG.zscore(row.key, row.sex, row.pmaDays, row.measure), row.expectedZ);
    }
});

test('INTERGROWTH retains unrounded equations; a known printed-table rounding discrepancy is not hidden', () => {
    // Official boys weight table, 55 weeks / -3 Z: 4.40 kg (two decimals).
    // Pinned published coefficients give 4.405026478... kg. Do not retune them
    // to force this one rounded cell to match; see INTERGROWTH.md.
    close(IG.measurement('weightForAge', 'M', 385, -3), 4.405026478034957);
    const weight = IG.measurement('weightForAge', 'M', 281, 4);
    close(IG.zscore('weightForAge', 'M', 281, weight), 4);
    // No WHO +/-3 SD linear extension or premature clinical category added.
    const p = IG.params('lengthForAge', 'F', 281);
    close(IG.measurement('lengthForAge', 'F', 281, 4), Math.exp(p.mu + p.sigma * 4));
});

test('INTERGROWTH is explicitly selected with an offline core, not a clinical classifier', () => {
    const assets=json('tools/scripts/offline-assets.json');
    assert.ok(assets.includes('js/services/reference-intergrowth.js'));
    assert.match(read('src/index.html').toString(), /reference-intergrowth/);
    assert.equal(IG.classify,undefined);assert.equal(IG.correctedAge,undefined);assert.equal(IG.percentile,undefined);
    const {GrowthProfile}=require('../../src/js/services/growth-profile.js');
    assert.equal(GrowthProfile.read({growthProfile:'intergrowth'}),'intergrowth');
    assert.equal(GrowthProfile.read({}),'who');
    assert.throws(()=>GrowthProfile.read({growthProfile:'guessed-preterm'}),/growthProfileInvalid/);
});
