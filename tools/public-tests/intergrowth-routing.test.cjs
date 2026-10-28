'use strict';
// Synthetic postnatal cases only. Numerical provenance/90 Decimal expectations
// are checked in intergrowth.test.cjs; these cases exercise the actual workspace.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),json=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const {ClinicalEngine}=require('../../src/js/services/clinical-engine.js');global.ClinicalEngine=ClinicalEngine;
const {GrowthEngine}=require('../../src/js/services/growth-engine.js');
const {HistoryManager}=require('../../src/js/services/history-manager.js');global.HistoryManager=HistoryManager;
const {TransferManager}=require('../../src/js/services/transfer-manager.js');
const {EncryptedBackup}=require('../../src/js/services/encrypted-backup.js');
const {CSVManager}=require('../../src/js/services/csv-manager.js');global.CSVManager=CSVManager;
const {GrowthChart}=require('../../src/js/components/growth-chart.js');global.GrowthChart=GrowthChart;
const {LotAnalysis}=require('../../src/js/components/lot-analysis.js');global.LotAnalysis=LotAnalysis;
const {ReportingExport}=require('../../src/js/services/reporting-export.js');
const {PDFManager}=require('../../src/js/services/pdf-manager.js');
const {WorkspaceApp}=require('../../src/js/workspace-app.js');
const engine=new GrowthEngine(...['who-official','who-2007','who-additional','cdc-growth'].map(n=>json('src/data/'+n+'.json')));
const translations=json('src/data/interface-translations.json');
const raw=extra=>({name:'FICTIF-PRETERM',caseId:'FICTIF-PRETERM',growthProfile:'intergrowth',gender:'M',
    ageMode:'days',ageDays:14,gestationalAgeWeeks:30,gestationalAgeDays:0,weight:1600,height:42,headCircumference:29,
    oedema:'n',position:'L',measurementDate:'2026-10-28',...extra});
const validate=e=>{HistoryManager.checkChild(e.child);HistoryManager.checkResult(e.result,new Set([e.child.id]));HistoryManager.checkPair(e.child,e.result);};
const workspace=entry=>({version:1,mode:'single',draft:entry.child,batchDraft:{},single:entry,batch:[],paste:'',stale:false});
global.localStorage=Object.create(null);
Object.defineProperties(global.localStorage,{getItem:{value:k=>global.localStorage[k]??null},setItem:{value:(k,v)=>global.localStorage[k]=String(v)}});

test('explicit INTERGROWTH routes by PMA, preserves three ages and never substitutes WHO BMI/WHZ or categories',()=>{
    const entry=engine.calculate(raw());validate(entry);
    assert.equal(entry.result.referenceFamily,'INTERGROWTH2015');assert.equal(entry.result.engineVersion,GrowthEngine.version);
    assert.equal(entry.child.ageDays,14);assert.equal(entry.child.postmenstrualDays,224);
    assert.equal(entry.result.intergrowthContext.age.birthGestationDays,210);
    assert.equal(entry.result.weightForAge.zscore,0.02);
    for(const key of ['weightForAge','heightForAge'])assert.equal(entry.result[key].classification,undefined);
    for(const key of ['weightForHeight','bmiForAge'])assert.equal(entry.result[key].notApplicable,true);
    assert.equal(entry.result.bmi,null);assert.equal(entry.result.correctedHeight,42);
    assert.equal(entry.result.nutrition.category,'intergrowthNoScreening');
    const direct=engine.calculate(raw({ageMode:'pma',postmenstrualDays:224,ageDays:'',gestationalAgeWeeks:'',gestationalAgeDays:''}));validate(direct);
    assert.equal(direct.child.totalAgeMonths,null);assert.equal(direct.child.ageDays,null);
    assert.equal(direct.result.weightForAge.zscoreRaw,entry.result.weightForAge.zscoreRaw);
    const defaultWHO=engine.calculate({gender:'M',ageMode:'days',ageDays:365,weight:8500,height:75,position:'L',oedema:'n'});
    assert.equal(defaultWHO.result.referenceFamily,'WHO2006');assert.equal(defaultWHO.result.weightForAge.zscore,-1.15);validate(defaultWHO);
});

test('INTERGROWTH normalization accepts partial/small measures and rejects conflicts without silently discarding them',()=>{
    const head=engine.calculate(raw({weight:'',height:'',headCircumference:23,position:'',oedema:''}));validate(head);
    assert.ok(Number.isFinite(head.result.additionalGrowth.indicators.headCircumferenceForAge.zscoreRaw));
    assert.equal(head.result.weightForAge.error,'measureMissing');assert.equal(head.child.weight,'');
    for(const extra of [{ageMode:'months',ageYears:0,ageMonths:1},{position:'H'},{oedema:'invalid'},
        {gestationalAgeWeeks:37},{postmenstrualDays:225},{tricepsSkinfold:6},{subscapularSkinfold:5},
        {measurementDate:'2026-02-30'},{weight:0}])assert.throws(()=>engine.calculate(raw(extra)));
    for(const oedema of ['','y']){
        const e=engine.calculate(raw({oedema}));validate(e);assert.equal(e.result.weightForAge.zscore,null);
        assert.ok(Number.isFinite(e.result.heightForAge.zscoreRaw));
    }
});

test('INTERGROWTH archive checks reject mixed ages, transplanted reference/category and broken result mirrors',()=>{
    const original=engine.calculate(raw()),before=JSON.stringify(original);HistoryManager.checkWorkspace(workspace(original));
    for(const mutate of [e=>e.child.postmenstrualDays++,e=>e.child.ageDays++,e=>e.child.weight='1600',
        e=>e.result.profileContext.profile='us',e=>e.result.referenceFamily='WHO2006',
        e=>e.result.heightForAge.classification='withinReference',e=>e.result.intergrowthContext.age.postmenstrualDays++,
        e=>e.result.additionalGrowth.referenceVersion='WHO-child-additional-fake',e=>e.result.weightForHeight.zscore=0,
        e=>e.result.nutrition.category='nutritionNoCriteria',e=>e.result.nutrition.orientation='orientationOutpatientReview']){
        const changed=structuredClone(original);mutate(changed);assert.throws(()=>HistoryManager.checkWorkspace(workspace(changed)));
    }
    assert.equal(JSON.stringify(original),before);
});

test('INTERGROWTH CSV input supports direct or derived PMA and partial measures with explicit units',()=>{
    const direct=CSVManager.parse('growthProfile,ageMode,postmenstrualDays,headCircumference,gender\nintergrowth,pma,224,29,M',{extended:true})[0];
    assert.equal(direct.ageDays,null);assert.equal(direct.headCircumference,29);
    const row=CSVManager.parse('growthProfile,ageMode,ageDays,gestationalAgeWeeks,gestationalAgeDays,weight,height,headCircumference,gender,position,oedema\nintergrowth,days,14,30,0,1.6,42,29,M,L,n',{extended:true,weightUnit:'kg'})[0];
    assert.equal(row.postmenstrualDays,224);assert.equal(row.weight,1600);
    const e=engine.calculate(row),rows=[...CSVManager.rows(CSVManager.results([e]))],map=Object.fromEntries(rows[0].map((k,i)=>[k,rows[1][i]]));
    assert.equal(map.growth_profile,'intergrowth');assert.equal(map.postmenstrual_days,'224');assert.equal(map.gestational_age_weeks,'30');
    assert.equal(map.weightForAge_method,'INTERGROWTH2015-log-normal');
    assert.equal(map.headCircumferenceForAge_method,'INTERGROWTH2015-normal');
    assert.equal(map.weightForAge_flag,'');assert.equal(map.weightForAge_biological_plausibility_assessed,'false');assert.equal(map.intergrowth_clinical_eligibility_assessed,'false');
    assert.throws(()=>CSVManager.parse('growthProfile,ageMode,postmenstrualDays,headCircumference,gender\nintergrowth,pma,449,29,M',{extended:true}));
    // Relaxing header presence for partial preterm measures never bypasses WHO row validation.
    assert.throws(()=>CSVManager.parse('gender,ageDays,weight\nM,365,8500',{extended:true}));
});

test('INTERGROWTH FR/EN/AR forms and PDF models identify PMA, methods and non-screening context',()=>{
    const e=engine.calculate(raw({name:'<FICTIF-PRETERM>'}));
    for(const language of ['fr','en','ar']){
        const ui=Object.assign(Object.create(WorkspaceApp.prototype),{prefs:{language,growthProfile:'intergrowth'},translations});
        const form=ui.formHTML('single',e.child),html=ui.resultsHTML(e,false,true),pdf=PDFManager.model([e],{language,translations});
        assert.ok(form.includes('name="postmenstrualDays"'));assert.ok(form.includes('name="gestationalAgeWeeks"'));
        assert.equal((form.match(/name="headCircumference"/g)||[]).length,1);
        assert.ok(html.includes('&lt;FICTIF-PRETERM&gt;'));assert.ok(!html.includes('undefined'));
        assert.ok(html.includes(translations[language].postmenstrualDays));
        assert.ok(pdf.rows[0].notes.some(n=>n.includes(translations[language].intergrowthNoScreening)));
        assert.ok(JSON.stringify(pdf).includes(translations[language].postmenstrualDays));
        assert.ok(!JSON.stringify(pdf).includes(translations[language].profileUS));
        const table=ui.tableHTML([e],{compact:true});assert.ok(table.includes(translations[language].intergrowthNoScreeningShort));assert.ok(table.includes(translations[language].intergrowthClinicalReviewShort));assert.ok(!table.includes('intergrowthNoScreeningShort'));assert.ok(table.includes(translations[language].intergrowthDescriptive));
        assert.equal(ui.number(null),'—');assert.equal(ui.number(''),'—');
    }
});

test('INTERGROWTH curves use stored PMA and correct kg/cm; reference families never share trajectories',()=>{
    const entry=engine.calculate(raw()),reference=entry.result.referenceVersion;
    const model=GrowthChart.referenceModel([entry],{data:{referenceVersion:reference}});
    assert.equal(model.ig,true);assert.equal(model.panels.length,3);
    assert.equal(model.panels[0].xMin,189);assert.equal(model.panels[0].xMax,448);
    assert.equal(model.panels[0].points[0].day,224);assert.equal(model.panels[0].points[0].value,1.6);
    assert.equal(model.panels[1].points[0].value,42);assert.equal(model.panels[2].points[0].value,29);
    assert.ok(model.panels.every(p=>p.curves.every(c=>c.segments[0].length===260)));
    const other=engine.calculate({gender:'M',ageMode:'days',ageDays:365,weight:8500,height:75,position:'L',oedema:'n',measurementDate:'2026-10-28'});
    const history=GrowthChart.build([entry,other],reference);
    assert.deepEqual(history.panels.map(p=>p.key),['weightForAge','heightForAge','headCircumferenceForAge']);
    assert.ok(history.panels.every(p=>p.points.length===1&&!p.connect));
    const ui=Object.assign(Object.create(WorkspaceApp.prototype),{prefs:{language:'fr'},translations});
    const html=GrowthChart.referenceHTML([entry],{data:{referenceVersion:reference}},ui);
    assert.ok(html.includes(translations.fr.intergrowthPmaWeeks));assert.ok(html.includes(translations.fr.postmenstrualDays));
    assert.ok(!html.includes('undefined'));assert.ok(html.includes('224'));
});

test('explicit draft policy/age changes retain measurements without converting estimated months or conflating age inputs',()=>{
    const source={...raw(),ageMode:'months',ageYears:'0',ageMonths:'1',postmenstrualDays:224},before=JSON.stringify(source);
    const ig=WorkspaceApp.draftForProfile(source,'intergrowth');assert.equal(ig.ageMode,'days');
    assert.equal(ig.weight,1600);assert.equal(ig.ageYears,'0');assert.equal(ig.ageMonths,'1');
    const direct=WorkspaceApp.draftForAgeMode(ig,'pma');assert.equal(direct.ageDays,'');assert.equal(direct.gestationalAgeWeeks,'');
    assert.equal(direct.height,42);assert.equal(direct.postmenstrualDays,224);
    const derived=WorkspaceApp.draftForAgeMode(direct,'dates');assert.equal(derived.postmenstrualDays,'');
    assert.equal(WorkspaceApp.draftForProfile(direct,'who').ageMode,'days');
    assert.equal(JSON.stringify(source),before);
});

test('INTERGROWTH lot summaries remain descriptive; WHO MUAC/WHZ screening aggregates exclude this profile',()=>{
    const e=engine.calculate(raw({ageDays:190,gestationalAgeWeeks:30,muac:114}));validate(e);
    assert.equal(e.child.postmenstrualDays,400);assert.ok(e.child.totalAgeMonths>=6);
    const model=LotAnalysis.build([e],e.result.referenceVersion,{family:'INTERGROWTH2015'});
    assert.equal(model.total,1);assert.equal(model.ages.pma27to64,1);
    assert.equal(model.indicators.length,3);assert.ok(model.indicators.every(v=>v.usable===1&&v.categories.length===0));
    const report=ReportingExport.aggregate([e],'202610');
    assert.equal(report.counts.rows,1);assert.equal(report.counts.eligible6to59,0);assert.equal(report.counts.muacSevere,0);
    assert.equal(e.result.nutrition.muac,'muacAgeUnsupported');
    const ui=Object.assign(Object.create(WorkspaceApp.prototype),{prefs:{language:'fr'},translations});
    const html=LotAnalysis.html(model,ui,{exportButton:false});assert.ok(html.includes(translations.fr.pma27to64));assert.ok(html.includes(translations.fr.intergrowthDescriptive));assert.ok(!html.includes(translations.fr.lotAge6to23));
});

test('INTERGROWTH round-trips the current backup and encrypted envelope, retaining originals and reference context',async()=>{
    class MemoryHistory{
        constructor(){this.records=HistoryManager.emptyArchive();}
        async addArchive(records){for(const store of TransferManager.stores)this.records[store].push(...structuredClone(records[store]));}
        async readArchive(){return structuredClone(this.records);}
        async visitArchive(visit){for(const store of TransferManager.stores)for(const record of this.records[store])visit(store,structuredClone(record));}
    }
    const store=new MemoryHistory(),entry=engine.calculate(raw()),before=JSON.stringify(entry);
    await new HistoryManager(store).save(workspace(entry));
    const file=await new TransferManager(store).export({language:'fr'}),p='synthetic-intergrowth-only';
    const cipher=await EncryptedBackup.encrypt(file,p),clear=await EncryptedBackup.decrypt(cipher,p);
    const prepared=await TransferManager.inspect(clear);
    const session=store.records.sessions[0],copy=TransferManager.remapper('public-fictitious')('sessions',session);
    assert.equal(prepared.validator.counts.sessions,1);
    HistoryManager.checkWorkspace(copy.metadata.workspace);
    assert.notEqual(copy.metadata.workspace.single.child.id,entry.child.id);
    assert.deepEqual(copy.metadata.workspace.single.result.intergrowthContext,entry.result.intergrowthContext);
    assert.equal(copy.metadata.workspace.single.result.imported,true);assert.equal(JSON.stringify(entry),before);
    await assert.rejects(TransferManager.inspect(new Blob([(await clear.text()).replace('FICTIF-PRETERM','ALTERED')])),/importChecksum/);
});

test('classic-browser service order loads INTERGROWTH without CommonJS, extra network or undeclared globals',()=>{
    const context={crypto,console,Date};context.window=context;context.globalThis=context;vm.createContext(context);
    const html=fs.readFileSync(path.join(root,'src/index.html'),'utf8');
    for(const match of html.matchAll(/<script src="(js\/services\/[^"]+)"/g))vm.runInContext(fs.readFileSync(path.join(root,'src',match[1]),'utf8'),context,{filename:match[1]});
    context.raw=raw();
    const result=vm.runInContext('const e=Object.create(GrowthEngine.prototype).calculate(raw);HistoryManager.checkWorkspace({version:1,batch:[],single:e});e.result',context);
    assert.equal(result.referenceFamily,'INTERGROWTH2015');assert.equal(result.intergrowthContext.age.postmenstrualDays,224);
});
