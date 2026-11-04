'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {ClinicalEngine}=require('../../src/js/services/clinical-engine.js');global.ClinicalEngine=ClinicalEngine;
const {GrowthEngine}=require('../../src/js/services/growth-engine.js');
const {GrowthProfile}=require('../../src/js/services/growth-profile.js');
const {HistoryManager}=require('../../src/js/services/history-manager.js');global.HistoryManager=HistoryManager;
const {TransferManager}=require('../../src/js/services/transfer-manager.js');
const {EncryptedBackup}=require('../../src/js/services/encrypted-backup.js');
const {CSVManager}=require('../../src/js/services/csv-manager.js');global.CSVManager=CSVManager;
const {PDFManager}=require('../../src/js/services/pdf-manager.js');
const {LotAnalysis}=require('../../src/js/components/lot-analysis.js');global.LotAnalysis=LotAnalysis;
const {GrowthChart}=require('../../src/js/components/growth-chart.js');global.GrowthChart=GrowthChart;
const {WorkspaceApp}=require('../../src/js/workspace-app.js');
const {ReportingExport}=require('../../src/js/services/reporting-export.js');
const data=name=>JSON.parse(fs.readFileSync(path.join(__dirname,'../../src/data',name),'utf8'));
const engine=new GrowthEngine(data('who-official.json'),data('who-2007.json'),data('who-additional.json'),data('cdc-growth.json'));
const input=extra=>({caseId:'FICTIF-PROFILE',name:'FICTIF-PROFILE',ageMode:'months',ageYears:3,ageMonths:0,weight:14000,height:95,gender:'F',position:'H',oedema:'n',measurementDate:'2026-10-26',...extra});
const validate=entry=>{HistoryManager.checkChild(entry.child);HistoryManager.checkResult(entry.result,new Set([entry.child.id]));HistoryManager.checkPair(entry.child,entry.result);};
global.localStorage=Object.create(null);
Object.defineProperties(global.localStorage,{getItem:{value:key=>global.localStorage[key]??null},setItem:{value:(key,v)=>{global.localStorage[key]=String(v);}}});

test('reference policy is explicit, WHO remains default and US uses WHO before 24 months then CDC to <240',()=>{
    const who=engine.calculate(input());assert.equal(who.result.referenceFamily,'WHO2006');assert.equal(who.child.ageDomainVersion,2);assert.equal(who.result.profileContext,undefined);validate(who);
    const infant=engine.calculate(input({growthProfile:'us',ageYears:1,ageMonths:11,position:'L'}));
    assert.equal(infant.result.referenceFamily,'WHO2006');assert.equal(infant.result.ageInMonths,23);assert.equal(infant.child.ageDomainVersion,3);validate(infant);
    const cdc=engine.calculate(input({growthProfile:'us',ageYears:2,ageMonths:0}));
    assert.equal(cdc.result.referenceFamily,'CDC2000');assert.equal(cdc.child.totalAgeMonths,24);assert.equal(cdc.result.ageInMonths,24.5);validate(cdc);
    const last=engine.calculate(input({growthProfile:'us',ageYears:19,ageMonths:11,weight:65000,height:170}));validate(last);assert.equal(last.result.ageInMonths,239.5);
    assert.throws(()=>engine.calculate(input({ageYears:19,ageMonths:1})),/ageInvalid/);
    assert.throws(()=>engine.calculate(input({growthProfile:'us',ageYears:20})),/ageInvalid/);
    assert.throws(()=>engine.calculate(input({growthProfile:'other'})),/growthProfileInvalid/);
});

test('US exact age is not silently shifted and metadata distinguishes it from completed months',()=>{
    const exact=engine.calculate(input({growthProfile:'us',ageMode:'days',ageDays:731}));validate(exact);
    assert.equal(exact.result.ageInMonths,731/30.4375);assert.equal(exact.result.profileContext.agePrecision,'exact');
    const estimated=engine.calculate(input({growthProfile:'us'}));validate(estimated);
    assert.equal(estimated.result.profileContext.reportedAgeInMonths,36);assert.equal(estimated.result.ageInMonths,36.5);
    assert.equal(estimated.result.profileContext.agePrecision,'completedMonths');assert.ok(estimated.result.warnings.includes('cdcCompletedMonths'));
    assert.equal(estimated.result.weightForHeight.notApplicable,true);
    assert.equal(estimated.result.nutrition.category,'nutritionIncomplete');
    assert.ok(estimated.result.nutrition.missing.includes('weightForHeight'));
});

test('saved WHO 4.2 results and mixed-profile workspace stay readable without rewriting existing visits',()=>{
    const who=engine.calculate(input());who.result.engineVersion='4.2.0';
    const saved=JSON.stringify(who),us=engine.calculate(input({growthProfile:'us'}));
    const workspace={version:1,mode:'batch',draft:{},batchDraft:{},single:null,batch:[who,us],paste:''};
    HistoryManager.checkWorkspace(workspace);assert.equal(JSON.stringify(who),saved);
    const reordered=structuredClone(us);reordered.result.profileContext=Object.fromEntries(Object.entries(reordered.result.profileContext).reverse());validate(reordered);
    assert.equal(GrowthProfile.read(who.child),'who');assert.equal(GrowthProfile.read(us.child),'us');
});

test('saved CDC rejects mismatched age, reference, WHO category, method, centile and inconsistent child/result pairs',()=>{
    const original=engine.calculate(input({growthProfile:'us'}));validate(original);
    for(const mutate of [
        e=>{e.result.profileContext.reportedAgeInMonths++;},
        e=>{e.result.referenceVersion='WHO-2006-unverified';},
        e=>{e.result.bmiForAge.classification='bmiWithin';},
        e=>{e.result.bmiForAge.percentile=50;},
        e=>{e.result.bmiForAge.method='WHO-LMS';},
        e=>{e.result.bmiForAge.sigma+=1;},
        e=>{e.child.ageDomainVersion=2;},
        e=>{delete e.result.profileContext;},
        e=>{e.result.correctedHeight+=.1;},
        e=>{e.result.weightForHeight.error='noWeightForHeight2007';}
    ]){const changed=structuredClone(original);mutate(changed);assert.throws(()=>validate(changed),/importInvalid|importVersion/);}
    const infant=engine.calculate(input({growthProfile:'us',ageYears:1}));
    infant.child=GrowthEngine.normalize({...infant.child,growthProfile:'who'});
    assert.throws(()=>validate(infant),/importInvalid/);
});

test('CDC position, oedema and extended BMI remain bound to saved measurements and source method',()=>{
    const lying=engine.calculate(input({growthProfile:'us',position:'L'}));validate(lying);assert.equal(lying.result.correctedHeight,94.2);
    const swollen=engine.calculate(input({growthProfile:'us',oedema:'y'}));validate(swollen);assert.equal(swollen.result.bmi,null);assert.equal(swollen.result.bmiForAge.error,'oedemaWarning');
    const extended=engine.calculate(input({growthProfile:'us',weight:30000,height:100}));validate(extended);
    assert.equal(extended.result.bmiForAge.method,'CDC2022-extended-BMI');assert.ok(extended.result.bmiForAge.zscoreRaw>1.645);
    const saved=JSON.stringify(extended);engine.calculate(input());assert.equal(JSON.stringify(extended),saved);
});

test('mixed WHO/CDC stream backup and encrypted export preserve each visit context and raw results',async()=>{
    const entries=[engine.calculate(input()),engine.calculate(input({growthProfile:'us'}))];
    const records={children:entries.map(e=>e.child),results:entries.map(e=>e.result),sessions:[],settings:[]};
    const storage={async visitArchive(fn){for(const store of TransferManager.stores)for(const record of records[store])fn(store,structuredClone(record));}};
    const before=JSON.stringify(records),plain=await new TransferManager(storage).export({language:'fr',growthProfile:'us'});
    const verified=await TransferManager.inspect(plain);assert.equal(verified.validator.counts.children,2);assert.equal(verified.validator.counts.results,2);
    const cipher=await EncryptedBackup.encrypt(plain,'fictitious-profile-test-only'),restored=await EncryptedBackup.decrypt(cipher,'fictitious-profile-test-only');
    assert.equal(await restored.text(),await plain.text());await TransferManager.inspect(restored);
    assert.equal(JSON.stringify(records),before);
    const rows=(await restored.text()).trim().split('\n').map(JSON.parse).filter(r=>r.store==='results');
    assert.deepEqual(rows.map(r=>r.record),records.results);
    const remap=TransferManager.remapper('fictitious-profile-copy'),copy={child:remap('children',entries[1].child),result:remap('results',entries[1].result)};
    validate(copy);assert.notEqual(copy.child.id,entries[1].child.id);assert.notEqual(copy.result.id,entries[1].result.id);
    assert.equal(copy.child.visitId,entries[1].child.visitId);assert.equal(copy.result.imported,true);
    assert.deepEqual(copy.result.profileContext,entries[1].result.profileContext);
    assert.equal(JSON.stringify(records),before);
});

test('CSV imports pin a default profile once and explicit row profiles survive mixed export metadata',async()=>{
    const header='name,ageYears,ageMonths,weight,height,gender,position,oedema,measurementDate';
    const csv=header+'\nFICTIF-CSV,19,11,65000,170,M,H,n,2026-10-26';
    assert.throws(()=>CSVManager.parse(csv,{extended:true}),/ageInvalid/);
    const [child]=CSVManager.parse(csv,{extended:true,growthProfile:'us'});assert.equal(child.growthProfile,'us');
    const asyncRows=await CSVManager.parseAsync(csv,{extended:true,growthProfile:'us'});assert.equal(asyncRows[0].totalAgeMonths,239);
    const mixed=header+',growthProfile\nFICTIF-A,3,0,14000,95,F,H,n,2026-10-26,who\nFICTIF-B,3,0,14000,95,F,H,n,2026-10-26,us';
    const entries=CSVManager.parse(mixed,{extended:true,growthProfile:'us'}).map(c=>engine.calculate(c));
    assert.deepEqual(entries.map(e=>e.result.referenceFamily),['WHO2006','CDC2000']);
    const lines=[...CSVManager.rows(CSVManager.results(entries))],columns=lines.shift();
    const cell=(row,key)=>row[columns.indexOf(key)];
    assert.ok(lines.every(row=>row.length===columns.length));
    assert.equal(cell(lines[1],'growth_profile'),'us');assert.equal(cell(lines[1],'reported_age_months'),'36');assert.equal(cell(lines[1],'age_in_months'),'36.5');
    assert.equal(cell(lines[1],'bmiForAge_method'),entries[1].result.bmiForAge.method);
    assert.equal(Number(cell(lines[1],'bmiForAge_p95')),entries[1].result.bmiForAge.p95);
    assert.equal(cell(lines[0],'bmiForAge_method'),'');
    assert.throws(()=>CSVManager.parse(mixed.replace(',us',',unknown'),{extended:true}),/growthProfileInvalid/);
});

test('CDC batch categories and denominators stay separate from WHO and do not become population prevalence',()=>{
    const us=engine.calculate(input({growthProfile:'us'})),who=engine.calculate(input());
    const swollen=engine.calculate(input({growthProfile:'us',oedema:'y'})),flagged=engine.calculate(input({growthProfile:'us',weight:40000}));
    assert.equal(flagged.result.bmiForAge.flagged,true);
    const entries=[us,structuredClone(us),swollen,flagged,who],before=JSON.stringify(entries);
    const model=LotAnalysis.build(entries,engine.cdc.data.referenceVersion,{family:'CDC2000'}),bmi=model.indicators.find(i=>i.key==='bmiForAge');
    assert.equal(model.ages.from2to4,5);assert.equal(model.identifiedCases,1);assert.equal(model.total,5);
    assert.equal(bmi.usable,2);assert.equal(bmi.suspended,1);assert.equal(bmi.flagged,1);assert.equal(bmi.unverified,1);
    assert.ok(bmi.categories.every(c=>c.key.startsWith('cdc')&&c.denominator===2));
    assert.equal(bmi.categories.reduce((n,c)=>n+c.count,0),2);assert.ok(!model.indicators.some(i=>i.key==='weightForHeight'));
    const app=Object.assign(Object.create(WorkspaceApp.prototype),{engine,state:{batch:entries}});
    assert.deepEqual(app.lotModels().map(m=>[m.family,m.total]),[['WHO2006',1],['CDC2000',4]]);
    const report=ReportingExport.aggregate(entries,'202610');assert.equal(report.unit,'measurement-rows');assert.equal(report.counts.rows,5);
    // CDC BMI categories are never treated as WHO acute malnutrition criteria.
    assert.equal(us.result.nutrition.category,'nutritionIncomplete');
    assert.equal(report.counts.nutritionSevere,1); // Only the visit with present oedema.
    assert.equal(JSON.stringify(entries),before);
});

test('CDC curves use the extended BMI inverse, stored effective ages and reference-separated points without changing visits',()=>{
    const entries=[engine.calculate(input({growthProfile:'us'})),engine.calculate(input())],before=JSON.stringify(entries);
    const model=GrowthChart.referenceModel(entries,engine.cdc);assert.equal(model.cdc,true);assert.equal(model.panels.length,3);
    const bmi=model.panels.find(p=>p.key==='bmiForAge'),age=36.5;
    assert.equal(bmi.points.length,1);assert.equal(bmi.points[0].day,age*30.4375);assert.equal(bmi.points[0].estimated,true);assert.equal(bmi.omitted,1);
    const p=bmi.curves.find(c=>c.z===3).segments[0].find(p=>p.day===age*30.4375);
    assert.equal(p.value,engine.cdc.valueAtZ('bmiForAge','F',age,3));
    assert.ok(Math.abs(p.value-require('../../src/js/services/reference-cdc.js').CDCReference.measurement(3,engine.cdc.params('bmiForAge','F',age)))>.1);
    assert.ok(bmi.curves.every(c=>c.segments[0].every(p=>p.day<240*30.4375)));
    const scoreModel=GrowthChart.build(entries,engine.cdc.data.referenceVersion);assert.equal(scoreModel.panels.length,3);assert.ok(scoreModel.panels.every(p=>p.points.length===1&&!p.connect));
    assert.equal(JSON.stringify(entries),before);
});

test('profile settings and new visits preserve existing work and never silently convert a WHO visit to CDC',async t=>{
    const previous=global.document;t.after(()=>{global.document=previous;});global.document={getElementById:()=>({close(){}})};
    const who=engine.calculate(input()),before=JSON.stringify(who);
    const app=Object.assign(Object.create(WorkspaceApp.prototype),{prefs:{language:'fr',theme:'light',growthProfile:'who'},page:'settings',readForms(){},persistPreferences(){},applyPreferences(){},render(){},toast(){},async saveImmediate(){}});
    app.state={...app.emptyWorkspace(),draft:structuredClone(who.child),single:who};
    app.setPreference('growthProfile','us');assert.equal(app.prefs.growthProfile,'us');assert.equal(app.state.draft.growthProfile,undefined);assert.equal(JSON.stringify(who),before);
    assert.equal(app.emptyDraft().growthProfile,'us');assert.equal(app.state.batchDraft.growthProfile,'us');
    app.history={async save(){}};app.checkpoint=()=>{};
    const original={version:1,mode:'single',draft:structuredClone(who.child),batchDraft:{},single:structuredClone(who),batch:[],paste:''};
    await app.restore({metadata:{workspace:original}});
    assert.equal(app.state.draft.growthProfile,'who');assert.equal(engine.calculate(app.state.draft).result.referenceFamily,'WHO2006');assert.equal(JSON.stringify(who),before);
    await app.action('new-visit',{});assert.equal(app.state.draft.growthProfile,'who');assert.equal(app.state.draft.caseId,who.child.caseId);assert.equal(JSON.stringify(who),before);
    app.state.single=engine.calculate(input({growthProfile:'us'}));await app.action('new-visit',{});assert.equal(app.state.draft.growthProfile,'us');
});

test('CDC result views, compact/detailed PDF models and charts explain the actual method in FR/EN/AR',()=>{
    const entry=engine.calculate(input({growthProfile:'us',weight:30000,height:100})),before=JSON.stringify(entry),translations=data('interface-translations.json');
    for(const language of ['fr','en','ar']){
        const ui=Object.assign(Object.create(WorkspaceApp.prototype),{translations,prefs:{language,growthProfile:'us',theme:'light'},engine,state:{batch:[entry]}});
        const html=ui.resultsHTML(entry,false,true),charts=ui.chartsHTML([entry]);
        assert.ok(html.includes(ui.esc(ui.t('cdcSevereObesity'))));assert.ok(html.includes('CDC2022-extended-BMI'));assert.ok(html.includes(ui.esc(ui.t('calculationAgeMonths'))));
        assert.ok(charts.includes(ui.esc(ui.t('cdcChartTitle'))));assert.ok(charts.includes(entry.result.referenceVersion));assert.ok(!charts.includes('WHO-2007-'));
        const model=PDFManager.model([entry],{language,translations}),row=model.rows[0];
        assert.ok(row.notes.some(n=>n.includes('CDC2022-extended-BMI')));assert.ok(row.notes.some(n=>n.includes(ui.t('profileUS'))));assert.ok(row.scores.some(n=>n.includes(ui.t('cdcSevereObesity'))));
        const compact=PDFManager.compact(model);assert.ok(compact.legend.some(r=>r[1].includes(ui.t('cdcInterpretation'))));
        const lot=LotAnalysis.html(LotAnalysis.build([entry],engine.cdc.data.referenceVersion,{family:'CDC2000'}),ui,{exportButton:false});assert.ok(lot.includes(ui.esc(ui.t('cdcLotRules'))));
        assert.ok(ui.settingsHTML().includes(ui.esc(ui.t('profileUS'))));assert.ok(ui.formHTML('single',entry.child).includes('name="growthProfile"'));assert.ok(ui.formHTML('single',entry.child).includes('data-info="usAgeHelp"'));assert.ok(!ui.formHTML('single',entry.child).includes(translations[language].ageHint));
        for(const key of ['growthProfile','profileWHO','profileUS','cdcCoverage','cdcInterpretation','cdcCompletedMonths','cdcSevereObesity'])assert.notEqual(ui.t(key),key);
    }
    assert.equal(JSON.stringify(entry),before);
});
