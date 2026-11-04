'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {ReportingExport:R}=require('../../src/js/services/reporting-export.js');
const profile=()=>({format:'zscore-dhis2-mapping',version:1,unit:'measurement-rows',orgUnit:'A0000000001',dataSet:'A0000000002',mappings:[{metric:'rows',dataElement:'A0000000003',categoryOptionCombo:'A0000000004'}]});
const visit=extra=>({child:{name:'FICTIF-PUBLIC',caseId:'FICTIF-MEME-DOSSIER',measurementDate:'2024-02-29',totalAgeMonths:12},result:{nutrition:{version:1,muac:'muacSevere',category:'nutritionSevere',reasons:[]}},...extra});

test('aggregate counts visits including repeated dossier IDs, excludes invalid dates and never exports individual identity',()=>{
    const first=visit(),second=visit(),other=visit();other.child.measurementDate='2024-03-01';
    const bad=visit();bad.child.measurementDate='2024-02-30';
    const missing=visit({result:null});
    const entries=[first,second,other,bad,missing],before=JSON.stringify(entries),report=R.aggregate(entries,'202402');
    assert.equal(report.counts.rows,3);assert.equal(report.counts.eligible6to59,3);
    assert.equal(report.counts.muacSevere,2);assert.equal(report.counts.muacMissing,1);
    assert.equal(report.counts.nutritionSevere,2);assert.equal(report.counts.nutritionIncomplete,1);
    assert.equal(report.excluded,2);assert.equal(report.unassessed,1);
    assert.equal(R.checkReport(report),true);assert.equal(JSON.stringify(entries),before);
    assert.doesNotMatch(JSON.stringify(report),/FICTIF|caseId|childId|name/);
    assert.deepEqual(R.dhis2(report,profile()),{dataSet:'A0000000002',period:'202402',orgUnit:'A0000000001',dataValues:[{dataElement:'A0000000003',categoryOptionCombo:'A0000000004',value:'3'}]});
    for(const period of [202402,null,'202400','202413','2024-02',''])assert.throws(()=>R.aggregate([],period),/reportPeriodInvalid/);
});

test('DHIS2 refuses a report relabelled as unique children or admissions, unsupported schema and impossible counts',()=>{
    const original=R.aggregate([visit()],'202402');
    for(const mutate of [
        r=>r.unit='unique-children',r=>r.unit='admissions',r=>delete r.unit,
        r=>r.version=2,r=>r.format='different',r=>r.period='202413',r=>r.period=202402,
        r=>r.counts.rows=-1,r=>r.counts.rows='1',r=>r.counts.rows=1.5,
        r=>r.counts.rows=Number.MAX_SAFE_INTEGER+1,r=>r.counts.rows=NaN,
        r=>r.counts.eligible6to59=2,r=>r.counts.dangerPresent=2,r=>r.unassessed=2,
        r=>r.excluded=-1,r=>r.counts.muacModerate=1,r=>r.counts.nutritionIncomplete=1,
        r=>delete r.counts.muacMissing,r=>r.counts.patients=1
    ]){const changed=structuredClone(original);mutate(changed);assert.throws(()=>R.dhis2(changed,profile()),/reportAggregateInvalid/);}
    const empty=R.aggregate([],'202402');assert.equal(R.checkReport(empty),true);
    assert.equal(R.dhis2(empty,profile()).dataValues[0].value,'0');
});

test('DHIS2 mapping refuses duplicate coordinates, malformed codes and unsupported units without rewriting the report',()=>{
    const report=R.aggregate([visit()],'202402'),before=JSON.stringify(report);
    for(const mutate of [p=>p.unit='admissions',p=>p.orgUnit='invalid',p=>p.mappings[0].metric='name',
        p=>p.mappings.push({...p.mappings[0]}),p=>p.mappings.push({...p.mappings[0],metric:'muacSevere'}),
        p=>p.mappings[0].categoryOptionCombo='https://example.test']){
        const changed=profile();mutate(changed);assert.throws(()=>R.dhis2(report,changed),/reportMappingInvalid/);
    }
    assert.equal(JSON.stringify(report),before);
});
