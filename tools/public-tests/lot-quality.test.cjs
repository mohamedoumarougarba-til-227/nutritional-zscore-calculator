'use strict';
// Independent synthetic review cases. No patient or private validation fixtures.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),json=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const {LotQuality:Q}=require('../../src/js/services/lot-quality.js');
const {GrowthEngine}=require('../../src/js/services/growth-engine.js');
const {ClinicalEngine}=require('../../src/js/services/clinical-engine.js');global.ClinicalEngine=ClinicalEngine;
const {CSVManager}=require('../../src/js/services/csv-manager.js');global.CSVManager=CSVManager;
const {ReportingExport}=require('../../src/js/services/reporting-export.js');
const {WorkspaceApp}=require('../../src/js/workspace-app.js');
const engine=new GrowthEngine(...['who-official','who-2007','who-additional','cdc-growth'].map(n=>json('src/data/'+n+'.json')));
const entry=extra=>engine.calculate({caseId:'FICTIF-ID-NE-PAS-EXPORTER',name:'FICTIF-NOM-NE-PAS-EXPORTER',gender:'M',ageMode:'days',ageDays:365,
    measurementDate:'2026-10-28',weight:8500,height:75,position:'L',oedema:'n',...extra});
const translations=json('src/data/interface-translations.json');
const mapping=rows=>rows.slice(1).map(row=>Object.fromEntries(rows[0].map((key,i)=>[key,row[i]])));

test('lot review counts candidate rows/groups separately without deduplicating repeated legitimate visits',()=>{
    const a=entry(),b=entry(),c=entry({gender:'F',measurementDate:'2026-10-27'}),other=entry({caseId:'OTHER'});
    const entries=[a,b,c,other],before=JSON.stringify(entries),report=Q.build(entries);
    assert.equal(report.total,4);assert.equal(report.signalledRows,3);
    assert.equal(report.groups.identity,1);assert.equal(report.counts.qualityIdentityConflict,3);
    assert.equal(report.groups.repeatedDate,1);assert.equal(report.counts.qualityRepeatedDate,2);
    assert.equal(report.groups.duplicateMeasures,1);assert.equal(report.counts.qualityDuplicateMeasures,2);
    assert.equal(report.rows[3].codes.length,0);assert.equal(JSON.stringify(entries),before);
    const aggregate=ReportingExport.aggregate(entries,'202610');
    assert.equal(aggregate.counts.rows,4,'review must not change the aggregate denominator');
    assert.equal(aggregate.counts.eligible6to59,4);
});

test('missing identifiers never turn identical anonymous measurements into a presumed identity or duplicate',()=>{
    const entries=[entry({caseId:''}),entry({caseId:''})],report=Q.build(entries);
    assert.equal(report.counts.qualityNoCaseId,2);
    assert.equal(report.groups.duplicateMeasures,0);assert.equal(report.groups.identity,0);assert.equal(report.groups.repeatedDate,0);
    assert.ok(report.rows.every(r=>r.codes.includes('qualityNoCaseId')));
    assert.doesNotMatch(JSON.stringify(report),/FICTIF|childId|visitId|birthDate|caseId|name/);
});

test('known conflicting birth dates or gestation are review candidates; an unknown value is not invented',()=>{
    const a=entry({ageMode:'dates',birthDate:'2025-10-28'}),b=entry({ageMode:'dates',birthDate:'2025-10-27'});
    assert.equal(Q.build([a,b]).counts.qualityIdentityConflict,2);
    const preterm=extra=>entry({growthProfile:'intergrowth',ageMode:'days',ageDays:14,gestationalAgeWeeks:30,gestationalAgeDays:0,weight:1600,height:42,headCircumference:29,...extra});
    const first=preterm(),second=preterm({gestationalAgeWeeks:31});
    assert.equal(Q.build([first,second]).counts.qualityIdentityConflict,2);
    const unknown=preterm({ageMode:'pma',ageDays:'',gestationalAgeWeeks:'',gestationalAgeDays:'',postmenstrualDays:224});
    assert.equal(Q.build([first,unknown]).counts.qualityIdentityConflict,0);
});

test('technical review keeps unavailable, imported, extreme and inconsistent-reference signals distinct',()=>{
    const a=entry(),b=entry(),c=entry(),d=entry();
    a.result.imported=true;b.result.weightForAge.flagged=true;b.result.heightForAge.reference='OTHER';
    c.result.weightForAge={zscore:null,error:'outsideReference'};
    d.result.additionalGrowth={referenceVersion:'EXPECTED',indicators:{headCircumferenceForAge:{zscore:0,reference:'OTHER'}}};
    const report=Q.build([a,b,c,d]);
    assert.equal(report.counts.qualityImported,1);assert.equal(report.counts.qualityFlaggedScore,1);
    assert.equal(report.counts.qualityUnavailableScore,1);assert.equal(report.counts.qualityReferenceMismatch,2);
    const malformed=entry();malformed.child.measurementDate='2026-02-30';malformed.child.weight='8500';malformed.child.gender='unknown';malformed.child.ageDays=null;
    const signals=Q.build([malformed]).rows[0].codes;
    for(const code of ['qualityInvalidDate','qualityInvalidMeasure','qualityInvalidSex','qualityAgeUnusable'])assert.ok(signals.includes(code));
    const uncomputed=entry();uncomputed.result=null;delete uncomputed.child.measurementDate;
    assert.ok(Q.build([uncomputed]).rows[0].codes.includes('qualityNotCalculated'));
    assert.ok(Q.build([uncomputed]).rows[0].codes.includes('qualityMissingDate'));
    const postnatal=entry({growthProfile:'intergrowth',ageMode:'pma',ageDays:'',postmenstrualDays:224,headCircumference:45,weight:'',height:'',position:''});
    const extreme=Q.build([postnatal]);assert.equal(extreme.counts.qualityOutsidePrintedChart,1);assert.equal(extreme.counts.qualityFlaggedScore,0);
});

test('analysis preparation retains stored raw scores, explicit units and age methods without names or a fabricated sampling design',()=>{
    const who=entry({ageMode:'months',ageYears:1,ageMonths:0}),cdc=entry({growthProfile:'us',ageMode:'months',ageYears:3,ageMonths:0,weight:14000,height:95,position:'H'});
    const ig=entry({growthProfile:'intergrowth',ageMode:'pma',ageDays:'',postmenstrualDays:224,weight:1600,height:42,headCircumference:29});
    who.result.weightForAge.zscoreRaw=-2.0001;who.result.weightForAge.zscore=-2;
    const entries=[who,cdc,ig],before=JSON.stringify(entries),rows=Q.analysisRows(entries),records=mapping(rows);
    assert.equal(new Set(rows[0]).size,rows[0].length);assert.ok(rows.every(r=>r.length===rows[0].length));
    assert.equal(records[0].weightForAge_zscore_raw,-2.0001);assert.equal(records[0].weightForAge_zscore,-2);
    assert.equal(records[0].age_precision,'estimatedMonths');assert.equal(records[0].weight_g,8500);
    assert.equal(records[1].reported_age_months,36);assert.equal(records[1].calculation_age_months,36.5);
    assert.equal(records[1].age_input_mode,'months');assert.equal(records[1].age_precision,'completedMonths');
    assert.equal(records[1].reference_family,'CDC2000');
    assert.equal(records[2].postmenstrual_days,224);assert.equal(records[2].age_days,'');assert.equal(records[2].gestation_birth_days,'');
    assert.equal(records[2].age_input_mode,'pma');assert.equal(records[2].age_precision,'wholeDays');
    assert.equal(records[2].weightForAge_flagged,'');assert.equal(records[2].weightForAge_biological_plausibility_assessed,false);
    for(const r of records){assert.equal(r.unit,'measurement-rows');assert.equal(r.sampling_design,'not-provided');for(const k of ['sampling_cluster','sampling_stratum','sampling_weight'])assert.equal(r[k],'');}
    const output=JSON.stringify(rows);
    assert.doesNotMatch(output,/FICTIF-NOM-NE-PAS-EXPORTER|FICTIF-ID-NE-PAS-EXPORTER|visitId|childId|birthDate|2026-10-28/);
    assert.equal(JSON.stringify(entries),before);
});

test('review and analysis CSV use formula escaping while retaining signed numeric scores',()=>{
    const e=entry();e.child.gender='=SYNTHETIC()';e.result.weightForAge.zscore=-2.01;
    const app=Object.assign(Object.create(WorkspaceApp.prototype),{state:{batch:[e]},download:(content,name,type)=>{app.saved={content,name,type};}});
    app.downloadQuality(true);
    assert.ok(app.saved.content.includes("'=SYNTHETIC()"));assert.ok(app.saved.content.includes('"-2.01"'));
    assert.ok(!app.saved.content.includes('FICTIF-NOM-NE-PAS-EXPORTER'));
    app.downloadQuality(false);const records=[...CSVManager.rows(app.saved.content)];
    assert.deepEqual(records[0],['format','version','unit','record_index','review_codes']);assert.equal(records.length,2);
    assert.equal(app.saved.type,'text/csv');
});

test('FR/EN/AR review is collapsible and paginated at eight rows, with explicit read-only/export scope',async()=>{
    const entries=Array.from({length:9},(_,i)=>entry({caseId:'FICTIF-'+i}));for(const e of entries)e.result.imported=true;
    const before=JSON.stringify(entries);
    for(const language of ['fr','en','ar']){
        const app=Object.assign(Object.create(WorkspaceApp.prototype),{state:{batch:entries},prefs:{language},translations,qualityPage:0});
        const html=app.qualityHTML();
        assert.equal((html.match(/data-action="quality-view"/g)||[]).length,8);
        assert.ok(html.includes(translations[language].qualityHelp));assert.ok(html.includes(translations[language].analysisPreparationHelp));
        assert.ok(html.includes('data-action="quality-next"'));assert.ok(!html.includes('<details class="lot-analysis quality-review" open>'));
        app.qualityPage=1;const last=app.qualityHTML({open:true});assert.equal((last.match(/data-action="quality-view"/g)||[]).length,1);
        app.qualityPage=999;app.qualityHTML();assert.equal(app.qualityPage,1);
        assert.ok(!last.includes('undefined'));assert.ok(!last.includes('FICTIF-'));
        app.readForms=()=>{};app.dialog=(title,content)=>{app.preview={title,content};};
        await app.action('quality-view',{dataset:{index:'0'}});
        assert.equal(app.preview.title,'qualityRecord');assert.ok(app.preview.content.includes(translations[language].qualityReadOnly));
        const shown=app.preview;await app.action('quality-view',{dataset:{index:'-1'}});assert.equal(app.preview,shown);
        app.renderQuality=()=>app.qualityHTML({open:true});
        await app.action('quality-page',{dataset:{page:'0'}});assert.equal(app.qualityPage,0);
        await app.action('quality-next',{dataset:{}});assert.equal(app.qualityPage,1);
        await app.action('quality-previous',{dataset:{}});assert.equal(app.qualityPage,0);
    }
    assert.equal(JSON.stringify(entries),before);
});

test('review handles the full active lot and refuses invalid shapes or a larger workspace without changing the CSV input limit',()=>{
    const e=entry(),many=Array.from({length:5000},()=>e),report=Q.build(many);
    assert.equal(report.total,5000);assert.equal(report.counts.qualityDuplicateMeasures,5000);
    assert.equal(report.groups.duplicateMeasures,1);
    for(const bad of [null,{},[{}],[{child:null}],Array(5001).fill(e)])assert.throws(()=>Q.build(bad),/qualityInvalid/);
    assert.equal(CSVManager.maxRows,50000);assert.equal(Q.build([]).total,0);
});
