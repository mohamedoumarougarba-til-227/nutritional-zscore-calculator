'use strict';
// Fictitious inputs only. These tests are independent of .local and the private suite.
// Expected domains/method: pinned WHO Anthro/AnthroPlus sources in tools/reference.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {ClinicalEngine}=require('../../src/js/services/clinical-engine.js');global.ClinicalEngine=ClinicalEngine;
const {GrowthEngine}=require('../../src/js/services/growth-engine.js');
const {HistoryManager}=require('../../src/js/services/history-manager.js');global.HistoryManager=HistoryManager;
const {TransferManager}=require('../../src/js/services/transfer-manager.js');
const {EncryptedBackup}=require('../../src/js/services/encrypted-backup.js');
const {CSVManager}=require('../../src/js/services/csv-manager.js');
const {PDFManager}=require('../../src/js/services/pdf-manager.js');
const {WorkspaceApp}=require('../../src/js/workspace-app.js');
const {SupplementaryGrowth}=require('../../src/js/services/supplementary-growth.js');
const {LotAnalysis}=require('../../src/js/components/lot-analysis.js');
const json=file=>JSON.parse(fs.readFileSync(path.join(__dirname,'../..',file),'utf8'));
const engine=new GrowthEngine(json('src/data/who-official.json'),json('src/data/who-2007.json'),json('src/data/who-additional.json'));
const translations=json('src/data/interface-translations.json');
const example=extra=>({name:'FICTIF-PUBLIC',caseId:'FICTIF-PUBLIC',measurementDate:'2026-10-26',ageMode:'days',ageDays:365,gender:'M',weight:8500,height:75,position:'L',oedema:'n',...extra});
const workspace=entry=>({version:1,mode:'single',draft:entry.child,batchDraft:{},single:entry,batch:[],paste:'',stale:false});
global.localStorage=Object.create(null);
Object.defineProperties(global.localStorage,{getItem:{value:key=>global.localStorage[key]??null},setItem:{value:(key,value)=>{global.localStorage[key]=String(value);}}});
class MemoryHistory {
    constructor(){this.records=HistoryManager.emptyArchive();}
    async addArchive(records){for(const store of TransferManager.stores)this.records[store].push(...structuredClone(records[store]));}
    async readArchive(){return structuredClone(this.records);}
    async visitArchive(visit){for(const store of TransferManager.stores)for(const record of this.records[store])visit(store,structuredClone(record));}
}

test('WHO reference selection respects the 60-month boundary and rejects the outer age domain',()=>{
    assert.equal(engine.calculate(example({ageDays:1826})).result.referenceFamily,'WHO2006');
    assert.equal(engine.calculate(example({ageDays:1827,position:'H'})).result.referenceFamily,'WHO2007');
    assert.throws(()=>engine.calculate(example({ageMode:'months',ageYears:19,ageMonths:1})),/ageInvalid/);
});
test('WHO 2007 has no WHZ and WAZ stops at 121 months, without extrapolation',()=>{
    const result=engine.calculate(example({ageMode:'months',ageYears:11,ageMonths:0,position:'H',height:140,weight:32000})).result;
    assert.equal(result.weightForHeight.zscore,null);assert.equal(result.weightForHeight.notApplicable,true);
    assert.equal(result.weightForAge.zscore,null);assert.equal(result.weightForAge.error,'weightAgeLimit2007');
    assert.ok(ClinicalEngine.applicable('WHO2007',120.999).includes('weightForAge'));
    assert.ok(!ClinicalEngine.applicable('WHO2007',121).includes('weightForAge'));
    assert.equal(engine.calculate(example({height:120})).result.weightForHeight.error,'outsideReference');
});
test('LMS logarithmic case and categorisation use the unrounded score',()=>{
    assert.equal(ClinicalEngine.lms(10,[1,10,.1]),0);
    assert.ok(Math.abs(ClinicalEngine.lms(10*Math.exp(.2),[0,10,.1],false)-2)<1e-12);
    assert.equal(Math.round(-2.0001*100)/100,-2);
    assert.equal(ClinicalEngine.category('weightForAge',-2.0001),'underweightModerate');
    assert.equal(ClinicalEngine.category('weightForAge',-2),'withinReference');
});
test('measurement position uses 0.7 cm correction and conservatively suspends standing infants',()=>{
    const standing=engine.calculate(example({position:'H'})).result;
    assert.equal(standing.correctedHeight,75.7);
    const infant=engine.calculate(example({ageDays:90,position:'H'})).result;
    assert.equal(infant.heightForAge.error,'infantPosition');
    const older=engine.calculate(example({ageMode:'months',ageYears:6,ageMonths:0})).result;
    assert.equal(older.heightForAge.error,'standingRequired2007');
});
test('exact dates and estimated years/months remain distinguishable',()=>{
    const exact=engine.calculate(example({ageMode:'dates',birthDate:'2025-10-26'}));
    const estimated=engine.calculate(example({ageMode:'months',ageYears:1,ageMonths:0}));
    assert.equal(exact.child.ageDays,365);assert.ok(!exact.result.warnings.includes('estimatedAge'));
    assert.ok(estimated.result.warnings.includes('estimatedAge'));
    assert.throws(()=>engine.calculate(example({ageMode:'dates',birthDate:'2025-02-30'})),/dateInvalid/);
});
test('unknown oedema is not assumed absent and present oedema suspends weight-related scores',()=>{
    assert.throws(()=>engine.calculate(example({oedema:''})),/oedemaInvalid/);
    const swollen=engine.calculate(example({oedema:'y'})).result;
    assert.equal(swollen.weightForAge.zscore,null);assert.equal(swollen.bmiForAge.zscore,null);
    assert.ok(Number.isFinite(swollen.heightForAge.zscore));
});
test('absolute MUAC uses strict 115/125 mm thresholds within its intended age band',()=>{
    for(const [muac,expected] of [[114.9,'muacSevere'],[115,'muacModerate'],[124.9,'muacModerate'],[125,'muacNotLow']])assert.equal(engine.calculate(example({muac})).result.nutrition.muac,expected);
    assert.equal(engine.calculate(example({ageDays:90,muac:110})).result.nutrition.muac,'muacAgeUnsupported');
});
test('optional WHO indicators preserve the base assessment and enforce their separate age domains',()=>{
    const base=engine.calculate(example({muac:130})),extra=engine.calculate(example({muac:130,headCircumference:46,tricepsSkinfold:8,subscapularSkinfold:6}));
    assert.deepEqual(extra.result.nutrition,base.result.nutrition);
    assert.equal(Object.keys(extra.result.additionalGrowth.indicators).length,4);
    assert.equal(engine.calculate(example({ageDays:90,muac:130})).result.additionalGrowth.indicators.armCircumferenceForAge.error,'additionalAgeDomain');
    assert.throws(()=>engine.calculate(example({headCircumference:true})),/additionalMeasureInvalid/);
});
test('CSV output escapes formulas while numeric negative scores remain numeric; malformed input is refused',()=>{
    for(const text of ['=1+1','@SUM(A1)',' +42','-formula'])assert.ok(CSVManager.cell(text).startsWith('"\''));
    assert.equal(CSVManager.cell(-1.15),'"-1.15"');
    assert.throws(()=>CSVManager.parse('weight,height,gender,position,oedema,ageDays\n8500,75,M,L,n,"365'),/csvInvalid/);
    const csv=CSVManager.results([engine.calculate(example({name:'=FICTIF'}))]);assert.ok(csv.includes("'=FICTIF"));
});
test('history snapshots remain immutable and unchanged autosaves do not create duplicate versions',async()=>{
    const store=new MemoryHistory(),history=new HistoryManager(store),work=workspace(engine.calculate(example()));
    await history.save(work);await history.save(work);work.draft.name='FICTIF-VERSION-2';await history.save(work);
    assert.equal(store.records.sessions.length,2);
    assert.equal(store.records.sessions[0].metadata.workspace.draft.name,'FICTIF-PUBLIC');
    assert.equal(store.records.sessions[1].metadata.workspace.draft.name,'FICTIF-VERSION-2');
});
test('backup export is accepted by the actual import protocol validator and restoration remaps a copy',async()=>{
    const store=new MemoryHistory(),history=new HistoryManager(store),entry=engine.calculate(example({headCircumference:46}));
    await history.save(workspace(entry));
    const file=await new TransferManager(store).export({language:'fr'}),verified=await TransferManager.inspect(file);
    assert.equal(verified.validator.counts.sessions,1);assert.equal(verified.validator.children.size,1);
    const saved=store.records.sessions[0],before=JSON.stringify(saved),copy=TransferManager.remapper('fictitious-import')('sessions',saved);
    assert.notEqual(copy.id,saved.id);assert.notEqual(copy.metadata.workspace.single.child.id,entry.child.id);
    assert.equal(copy.metadata.workspace.single.child.visitId,entry.child.visitId);
    HistoryManager.checkWorkspace(copy.metadata.workspace);assert.equal(JSON.stringify(saved),before);
});
test('corruption, truncation and unsupported backup versions fail before import',async()=>{
    const store=new MemoryHistory(),history=new HistoryManager(store);await history.save(workspace(engine.calculate(example())));
    const text=await(await new TransferManager(store).export({language:'fr'})).text();
    await assert.rejects(TransferManager.inspect(new Blob([text.replace('FICTIF-PUBLIC','FICTIF-CHANGE')])),/importChecksum/);
    await assert.rejects(TransferManager.inspect(new Blob([text.split('\n').slice(0,-2).join('\n')])),/importChecksum/);
    await assert.rejects(TransferManager.inspect(new Blob([text.replace('"version":1','"version":999')])),/importVersion/);
    assert.equal(store.records.sessions.length,1);
});
test('synthetic encrypted backup round-trips bytes and refuses wrong passwords or modified ciphertext',async()=>{
    const plain=new Blob(['FICTIF-PUBLIC: no patient data']),password='fictitious-public-test-only';
    const cipher=await EncryptedBackup.encrypt(plain,password);
    assert.equal(await(await EncryptedBackup.decrypt(cipher,password)).text(),await plain.text());
    await assert.rejects(EncryptedBackup.decrypt(cipher,'wrong-fictitious-password'),/encryptedAuthenticationFailed/);
    const bytes=new Uint8Array(await cipher.arrayBuffer());bytes[bytes.length-1]^=1;
    await assert.rejects(EncryptedBackup.decrypt(new Blob([bytes]),password),/encryptedAuthenticationFailed/);
});
test('FR/EN/AR optional results and PDF notes retain labels and escape fictitious markup',()=>{
    const entry=engine.calculate(example({name:'<FICTIF>',headCircumference:46,muac:130}));
    const keys=Object.keys(translations.fr).sort();
    for(const language of ['fr','en','ar']){
        assert.deepEqual(Object.keys(translations[language]).sort(),keys);
        const ui=Object.assign(Object.create(WorkspaceApp.prototype),{prefs:{language},translations});
        const html=ui.resultsHTML(entry,false,true);assert.ok(!html.includes('<FICTIF>'));assert.ok(html.includes('&lt;FICTIF&gt;'));
        assert.ok(html.includes(translations[language].headCircumferenceForAge));
        assert.ok(PDFManager.model([entry],{language,translations}).rows[0].notes.some(note=>note.includes(translations[language].headCircumferenceForAge)));
    }
});
test('distributed reference bytes match all three pinned table manifests',()=>{
    for(const family of ['who','who-2007','who-additional']){
        const name=family==='who'?'who-manifest.json':family+'-manifest.json',manifest=json('src/data/'+name);
        const bytes=fs.readFileSync(path.join(__dirname,'../../src/data',manifest.file||(family==='who-2007'?'who-2007.json':'')));
        assert.equal(bytes.length,manifest.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),manifest.sha256);
    }
    assert.equal(Object.keys(SupplementaryGrowth.definitions).length,4);
});
test('the public runner refuses a missing or empty suite',()=>{
    const runner=require('../scripts/test-public.cjs'),directory=path.join(__dirname,'does-not-exist');
    let message='';assert.deepEqual(runner.discover(directory),[]);
    assert.equal(runner.run(directory,{stdout:{write:()=>{}},stderr:{write:s=>{message+=s;}}}),1);
    assert.match(message,/empty green suite/);
});
test('release source canonicalization is stable before and after integrity injection',()=>{
    const {canonicalHTML}=require('../scripts/build-source-archive.cjs');
    const {renderIntegrity}=require('../scripts/build-release.cjs');
    const html='<head><script src="new.js"></script><link rel="stylesheet" href="new.css"></head>';
    const assets={'new.js':'a'.repeat(64),'new.css':'b'.repeat(64)};
    for(const file of [...['data/interface-translations.json','data/who-manifest.json','data/who-official.json','data/who-2007.json','data/who-2007-manifest.json','data/LICENSE-anthroplus.txt','data/who-additional.json','data/who-additional-manifest.json','data/cdc-growth.json','data/cdc-growth-manifest.json'],...PDFManager.fontPaths])assets[file]='c'.repeat(64);
    const generated=renderIntegrity(html,assets);
    assert.equal(canonicalHTML(html),canonicalHTML(generated));
    assert.equal(canonicalHTML(generated),canonicalHTML(canonicalHTML(generated)));
});
test('optional lot summaries keep their own reference and count visits without population inference',()=>{
    const valid=engine.calculate(example({muac:130,headCircumference:46,tricepsSkinfold:8,subscapularSkinfold:6}));
    const missing=engine.calculate(example({})),outside=engine.calculate(example({ageDays:60,muac:130}));
    const foreign=structuredClone(valid);foreign.result.additionalGrowth.referenceVersion='foreign-reference';
    const entries=[valid,structuredClone(valid),missing,outside,foreign],saved=JSON.stringify(entries);
    const reference=engine.additional.data.referenceVersion;
    const model=LotAnalysis.build(entries,valid.result.referenceVersion,{additionalReference:reference});
    const arm=model.indicators.find(item=>item.key==='armCircumferenceForAge');
    assert.deepEqual([arm.usable,arm.missing,arm.suspended,arm.unverified],[2,1,1,1]);
    assert.equal(model.identifiedCases,1);assert.equal(model.total,5);
    assert.equal(arm.categories.reduce((sum,c)=>sum+c.count,0),2);
    assert.ok(arm.categories.every(c=>c.denominator===2));
    assert.ok(LotAnalysis.csvRows(model).filter(row=>row[1]==='armCircumferenceForAge').every(row=>row[6]===reference));
    assert.equal(JSON.stringify(entries),saved);
    for(const language of ['fr','en','ar']){
        const ui=Object.assign(Object.create(WorkspaceApp.prototype),{translations,prefs:{language}});
        const html=LotAnalysis.html(model,ui,{exportButton:false});
        assert.ok(html.includes(ui.esc(translations[language].additionalResultHelp)));
        assert.ok(html.includes(reference));
    }
});
test('source archive context cannot exempt active resources or silently replace Git checks',()=>{
    const {checkPublic}=require('../scripts/check-public-files.cjs');
    const {excludedFiles}=require('../scripts/build-source-archive.cjs');
    assert.deepEqual(excludedFiles,['src/vendor/pdf/jspdf-4.2.1.umd.min.js']);
    assert.throws(()=>checkPublic({sourceArchive:true,tracked:true}),/one distribution context/);
    assert.throws(()=>checkPublic({sourceArchive:true,base:path.join(__dirname,'nonexistent-archive')}),/Missing source archive marker/);
});

test('optional history chart tables display centiles from their own indicators in FR/EN/AR without recalculation',()=>{
    const {GrowthChart}=require('../../src/js/components/growth-chart.js');
    const entry=engine.calculate(example({muac:130,headCircumference:46,tricepsSkinfold:8,subscapularSkinfold:6}));
    const saved=JSON.stringify(entry),reference=entry.result.additionalGrowth.referenceVersion;
    for(const language of ['fr','en','ar']){
        const calls=[],ui=Object.assign(Object.create(WorkspaceApp.prototype),{translations,prefs:{language}});
        ui.percentileHTML=function(value,result){calls.push(value);return WorkspaceApp.prototype.percentileHTML.call(this,value,result);};
        const html=GrowthChart.html([entry],reference,ui);
        for(const value of Object.values(entry.result.additionalGrowth.indicators))assert.ok(calls.includes(value));
        assert.ok(!calls.includes(undefined));assert.match(html,/class="centile"/);
        assert.ok(html.includes(ui.esc(reference)));
    }
    assert.equal(JSON.stringify(entry),saved);
});

// Synthetic service-worker lifecycle; no browser data or private fixtures.
// First-load documents are initially uncontrolled because the worker never claims tabs.
test('an immediate update after first-load install offers reload instead of a false failure',async t=>{
    const original=Object.getOwnPropertyDescriptor(global,'navigator');
    const worker=()=>({state:'installing',listeners:[],addEventListener(name,fn){this.listeners.push(fn);},emit(state){this.state=state;this.listeners.forEach(fn=>fn());}});
    const first=worker(),registration={active:null,installing:first,waiting:null,addEventListener(name,fn){this.onUpdate=fn;}};
    Object.defineProperty(global,'navigator',{configurable:true,value:{serviceWorker:{controller:null,register:async()=>registration,addEventListener(){}}}});
    t.after(()=>{if(original)Object.defineProperty(global,'navigator',original);else delete global.navigator;});
    const app=Object.assign(Object.create(WorkspaceApp.prototype),{reloadAvailable:false,updateOfflineStatus(){},updateUpdateStatus(){}});
    await app.registerOffline();registration.active=first;first.emit('installed');first.emit('activated');
    assert.equal(app.reloadAvailable,false);assert.equal(app.updateError,null);
    const next=worker();registration.installing=next;registration.onUpdate();next.emit('installed');
    registration.active=next;registration.installing=null;first.emit('redundant');next.emit('activated');
    assert.equal(app.updateError,null);assert.equal(app.reloadAvailable,true);assert.equal(app.offlineState,'offlineReady');
});

test('a rejected installation still reports failure while preserving the active offline release',async t=>{
    const original=Object.getOwnPropertyDescriptor(global,'navigator');let listener;
    const next={state:'installing',addEventListener(name,fn){listener=fn;}};
    const active={state:'activated'},registration={active,installing:next,waiting:null,addEventListener(){}};
    Object.defineProperty(global,'navigator',{configurable:true,value:{serviceWorker:{controller:active,register:async()=>registration,addEventListener(){}}}});
    t.after(()=>{if(original)Object.defineProperty(global,'navigator',original);else delete global.navigator;});
    const app=Object.assign(Object.create(WorkspaceApp.prototype),{reloadAvailable:false,updateOfflineStatus(){},updateUpdateStatus(){}});
    await app.registerOffline();registration.installing=null;next.state='redundant';listener();
    assert.equal(app.updateError,'updateFailedHelp');assert.equal(app.offlineState,'offlineReady');
    assert.equal(app.reloadAvailable,false);assert.equal(registration.active,active);
});


test('history previews distinguish an unknown MUAC from a measured value in FR EN AR',()=>{
    const missing=engine.calculate(example()),measured=engine.calculate(example({muac:114}));
    for(const language of ['fr','en','ar']){
        const app=Object.assign(Object.create(WorkspaceApp.prototype),{prefs:{language},translations,engine});
        const unknown=app.tableHTML([missing]);
        assert.ok(unknown.includes(app.t('muac')+' : '+app.t('unknown')));
        assert.ok(!unknown.includes(app.t('muac')+' :  mm'));
        const known=app.tableHTML([measured]);
        assert.ok(known.includes(app.t('muac')+' : '+app.number(114,1)+' mm'));
    }
});

test('PDF notes retain distinct warnings and provenance while removing exact repetitions',()=>{
    const input=engine.calculate(example()),before=JSON.stringify(input);
    input.result.warnings=['estimatedAge','estimatedAge'];
    for(const language of ['fr','en','ar']){
        const model=PDFManager.model([input],{language,translations}),notes=model.rows[0].notes;
        assert.equal(notes.length,new Set(notes).size);
        assert.equal(notes.filter(n=>n===translations[language].estimatedAge).length,1);
        assert.ok(notes.includes(translations[language][input.result.nutrition.category]));
        assert.ok(notes.some(n=>n.includes(input.result.nutrition.reference)));
        assert.equal(model.provenances[0][0],input.result.referenceVersion);
        assert.equal(model.rows[0].scores[0].split('\n')[0],'Z = -1.15');
    }
    assert.equal(input.result.warnings.length,2,'reporting never rewrites the archived input');
    assert.ok(before.includes('FICTIF-PUBLIC'));
});

test('PDF continuation markers use the original lot row in LTR and RTL and ignore ordinary rows',()=>{
    const raw=['6','FICTIF','stored measurements','notes'],before=JSON.stringify(raw);
    assert.equal(PDFManager.continuedRowIndex({section:'body',row:{index:-1,raw}}),'6');
    assert.equal(PDFManager.continuedRowIndex({section:'body',row:{index:-1,raw:[...raw].reverse()}},true),'6');
    for(const data of [null,{}, {section:'head',row:{index:-1,raw}}, {section:'body',row:{index:5,raw}},
        {section:'body',row:{index:-1,raw:['<FICTIF>']}}, {section:'body',row:{index:-1,raw:{}}}])assert.equal(PDFManager.continuedRowIndex(data),null);
    assert.equal(JSON.stringify(raw),before);
    for(const language of ['fr','en','ar'])assert.ok(translations[language].pdfRowContinuation.replace('{number}','6').includes('6'));
});
