'use strict';
// Prepared reference core, not a claim of application integration or CDC endorsement.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {CDCReference}=require('../../src/js/services/reference-cdc.js');
const root=path.resolve(__dirname,'../..'),json=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const data=json('src/data/cdc-growth.json'),manifest=json('src/data/cdc-growth-manifest.json'),cdc=new CDCReference(data);
const close=(a,b,tolerance=2e-10)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<tolerance,`${a} differs from ${b}`);

test('CDC source bytes and converted domains are pinned; damaged or incomplete tables are rejected',()=>{
    for(const source of manifest.sources){
        const bytes=fs.readFileSync(path.join(root,'tools/reference',source.file));
        assert.equal(bytes.length,source.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),source.sha256);
    }
    const bytes=fs.readFileSync(path.join(root,'src/data',manifest.file));
    assert.equal(bytes.length,manifest.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),manifest.sha256);
    const broken=structuredClone(data);delete broken.tables.bmiForAge.M['24.5'];assert.throws(()=>new CDCReference(broken),/referenceInvalid/);
    assert.equal(CDCReference.ages.length,218);assert.ok(!Object.hasOwn(data.tables.bmiForAge.M,'240.5'));
});

test('CDC uses [24,240) months, interpolation and an explicit completed-month precision',()=>{
    for(const age of [23.999,240,240.5,NaN])assert.equal(cdc.params('weightForAge','M',age),null);
    assert.ok(cdc.params('weightForAge','M',239.999));
    assert.equal(CDCReference.effectiveAge(24,'completedMonths'),24.5);
    assert.equal(CDCReference.effectiveAge(24.25,'completedMonths'),null);
    const a=cdc.params('heightForAge','F',24),b=cdc.params('heightForAge','F',24.5),mid=cdc.params('heightForAge','F',24.25);
    a.forEach((v,i)=>close(mid[i],(v+b[i])/2));
    const out=cdc.compute({sex:'F',ageInMonths:24,agePrecision:'completedMonths',weightKg:12,heightCm:85});
    assert.equal(out.reportedAgeInMonths,24);assert.equal(out.ageInMonths,24.5);
    assert.equal(out.scores.weightForHeight.notApplicable,true);assert.equal(out.scores.weightForHeight.zscore,null);
});

test('CDC position correction is 0.8 cm; unknown oedema is rejected and present oedema suspends weight-based scores',()=>{
    const input={sex:'M',ageInMonths:24,weightKg:12,heightCm:85,position:'L'};
    const out=cdc.compute(input);close(out.correctedHeight,84.2);close(out.bmi,12/(.842**2));
    assert.equal(out.heightAdjustmentCm,-.8);
    assert.throws(()=>cdc.compute({...input,oedema:''}),/oedemaInvalid/);
    const swollen=cdc.compute({...input,oedema:'y'});
    assert.equal(swollen.scores.weightForAge.error,'oedemaWarning');assert.equal(swollen.scores.bmiForAge.error,'oedemaWarning');
    assert.ok(Number.isFinite(swollen.scores.heightForAge.zscore));
});

test('CDC BMI categories use their own 5/85/95 percentiles and severe-obesity criteria, not WHO Z cutoffs',()=>{
    const p=cdc.params('bmiForAge','F',114.5),at=prob=>CDCReference.measurement(CDCReference.inverseSurvival(1-prob),p);
    assert.equal(CDCReference.bmiCategory(at(.05)*(1-1e-8),p),'cdcUnderweight');
    assert.equal(CDCReference.bmiCategory(at(.05)*(1+1e-8),p),'cdcHealthyWeight');
    assert.equal(CDCReference.bmiCategory(at(.85)*(1+1e-8),p),'cdcOverweight');
    assert.equal(CDCReference.bmiCategory(at(.95)*(1+1e-8),p),'cdcObesity');
    const thresholds=CDCReference.thresholds(p);
    assert.equal(CDCReference.bmiCategory(thresholds.p95*1.2,p),'cdcSevereObesity');
    assert.equal(CDCReference.bmiCategory(thresholds.p95*1.2*(1-1e-8),p),'cdcObesity');
    assert.equal(CDCReference.bmiCategory(thresholds.p95,p),'cdcObesity');
    assert.equal(CDCReference.bmiCategory(35,cdc.params('bmiForAge','F',239.5)),'cdcSevereObesity');
    const p95=at(.95),base=cdc.score('bmiForAge',p95*(1-1e-8),'F',114.5),extended=cdc.score('bmiForAge',p95*(1+1e-8),'F',114.5);
    assert.equal(base.method,'CDC2000-LMS');assert.equal(extended.method,'CDC2022-extended-BMI');
    close(extended.zscoreRaw,base.zscoreRaw,1e-6);
});

test('CDC modified Z controls plausibility separately from raw LMS and extended BMI Z',()=>{
    for(const [key,[lower,upper]] of Object.entries(CDCReference.bounds)){
        const p=cdc.params(key,'M',50.5),m=p[1],low=m-CDCReference.measurement(-2,p),high=CDCReference.measurement(2,p)-m;
        const badLow=m+(lower-.01)*low/2,badHigh=m+(upper+.01)*high/2;
        if(badLow>0)assert.equal(cdc.score(key,badLow,'M',50.5).flagged,true);
        assert.equal(cdc.score(key,badHigh,'M',50.5).flagged,true);
        assert.equal(cdc.score(key,m,'M',50.5).flagged,false);
    }
    close(CDCReference.lms(10*Math.exp(.2),[0,10,.1]),2);
});

test('CDC calculations match independent Decimal and libm-erfc fixtures, including published examples and extended tails',()=>{
    const oracle=json('tools/verification/cdc-decimal.json');assert.equal(oracle.fixtures.length,254);
    for(const row of oracle.fixtures){
        const out=cdc.score(row.key,row.measure,row.sex,row.age),want=row.expected;
        close(out.zscoreRaw,want.zscoreRaw);close(out.modifiedZscore,want.modifiedZscore);
        assert.equal(out.method,want.method);assert.equal(out.flagged,want.flagged);
        if(row.key==='bmiForAge'){close(out.originalZscoreRaw,want.originalZscoreRaw);close(out.p95,want.p95);close(out.sigma,want.sigma);}
        if(out.percentile!==null)close(out.percentile,want.percentileRaw,5.01e-7);
    }
    for(const {z,survival} of oracle.normalTail){
        const got=CDCReference.survival(z);assert.ok(Math.abs(got-survival)<Math.max(2e-15,survival*2e-13));
        if(z>=0&&survival>0&&survival<1)close(CDCReference.inverseSurvival(survival),z,3e-12);
    }
    assert.equal(oracle.referenceCurves.length,120);
    for(const row of oracle.referenceCurves){
        const value=cdc.valueAtZ(row.key,row.sex,row.age,row.z);
        if(row.measure===null){assert.equal(value,null);continue;}
        close(value,row.measure,2e-8);
        close(cdc.score(row.key,value,row.sex,row.age).zscoreRaw,row.z,2e-10);
    }
    assert.equal(cdc.valueAtZ('bmiForAge','M',240,2),null);
    // Preserve representable tails rather than inventing a finite cap when CDF rounds to 1.
    close(CDCReference.inverseSurvival(1e-25),10.420452200803098,2e-11);
    assert.ok(Number.isNaN(CDCReference.inverseSurvival(0)));
});
