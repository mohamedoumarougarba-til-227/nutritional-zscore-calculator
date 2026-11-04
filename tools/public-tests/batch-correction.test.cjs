'use strict';
// Synthetic row corrections only. Existing numerical oracles remain separate.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {ClinicalEngine}=require('../../src/js/services/clinical-engine.js');global.ClinicalEngine=ClinicalEngine;
const {HistoryManager}=require('../../src/js/services/history-manager.js');global.HistoryManager=HistoryManager;
const {CSVManager}=require('../../src/js/services/csv-manager.js');global.CSVManager=CSVManager;
const {GrowthEngine}=require('../../src/js/services/growth-engine.js');
const {TransferManager}=require('../../src/js/services/transfer-manager.js');
const {WorkspaceApp}=require('../../src/js/workspace-app.js');
const {LotQuality}=require('../../src/js/services/lot-quality.js');
const json=p=>JSON.parse(fs.readFileSync(path.join(__dirname,'../..',p),'utf8'));
const engine=new GrowthEngine(...['who-official','who-2007','who-additional','cdc-growth'].map(n=>json('src/data/'+n+'.json'))),translations=json('src/data/interface-translations.json');
const input=extra=>({name:'FICTIF-CORRECTION',caseId:'FICTIF-CORRECTION',gender:'M',ageMode:'days',ageDays:365,measurementDate:'2026-10-28',weight:8500,height:75,position:'L',oedema:'n',...extra});
const workspace=entries=>({version:1,mode:'batch',draft:{caseId:'FICTIF-SINGLE-DRAFT'},batchDraft:{caseId:'FICTIF-ADD-DRAFT',weight:'9000'},single:null,batch:entries,paste:'FICTIF CSV waiting',stale:false});
global.localStorage=Object.create(null);
Object.defineProperties(global.localStorage,{getItem:{value:k=>global.localStorage[k]??null},setItem:{value:(k,v)=>{global.localStorage[k]=String(v);}}});
class MemoryHistory {
    constructor(){this.records=HistoryManager.emptyArchive();this.writes=0;}
    async addArchive(records){this.writes++;await this.beforeWrite?.(this.writes);for(const key of TransferManager.stores)this.records[key].push(...structuredClone(records[key]));}
    async readArchive(){return structuredClone(this.records);}
    async visitArchive(visit){for(const key of TransferManager.stores)for(const row of this.records[key])visit(key,structuredClone(row));}
}
function ui(state,draft,store=new MemoryHistory()){
    const app=Object.assign(Object.create(WorkspaceApp.prototype),{state,engine,history:new HistoryManager(store),prefs:{language:'fr'},translations,saving:Promise.resolve(),page:'batch'});
    app.batchCorrection={workspace:state,index:0,entry:state.batch[0],draft};
    const buttons=[{disabled:false}],form={inert:false},progress={textContent:''},dialog={querySelectorAll:()=>buttons,setAttribute(){},removeAttribute(){},close(){app.closed=true;}};
    const before=global.document;global.document={getElementById:id=>({'workspace-dialog':dialog,'correction-form':form,'correction-progress':progress}[id])};
    app.readBatchCorrection=()=>{};app.updateSaveStatus=()=>{};app.checkpoint=()=>{};
    app.formError=(prefix,key)=>{app.error={prefix,key};};app.render=id=>{app.focus=id;};app.toast=(key,error)=>{app.notice={key,error};};
    return {app,store,form,buttons,restore:()=>{global.document=before;}};
}

test('a queued close event cannot clear a reopened correction or import dialog; a real close releases its state',()=>{
    const context={draft:{weight:'9000'}},prepared={format:'stream'},password={value:'FICTIF-PASSWORD'},dialog={open:true},before=global.document,released=[];
    global.document={getElementById:()=>dialog,querySelectorAll:()=>[password]};
    const app=Object.assign(Object.create(WorkspaceApp.prototype),{batchCorrection:context,preparedImport:prepared,encryptedPending:{name:'FICTIF'},transfers:()=>({release:x=>released.push(x)})});
    try{
        app.workspaceDialogClosed();assert.equal(app.batchCorrection,context);assert.equal(app.preparedImport,prepared);assert.equal(password.value,'FICTIF-PASSWORD');assert.equal(released.length,0);
        dialog.open=false;app.workspaceDialogClosed();assert.equal(app.batchCorrection,null);assert.equal(app.preparedImport,null);assert.equal(app.encryptedPending,null);assert.equal(password.value,'');assert.deepEqual(released,[prepared]);
    }finally{global.document=before;}
});

test('dialog Tab and Shift-Tab cycle through visible enabled controls without sending focus into hidden or inert form fields',()=>{
    const first={tabIndex:0,getClientRects:()=>[{}],closest:()=>null,focus(){focused=first;}},last={...first,focus(){focused=last;}};
    const hidden={...first,getClientRects:()=>[]},disabled={...first,disabled:true},inert={...first,closest:()=>({})},negative={...first,tabIndex:-1};
    const dialog={open:true,querySelectorAll:()=>[first,hidden,disabled,inert,negative,last]},before=global.document;let focused,prevented;
    const app=Object.create(WorkspaceApp.prototype);global.document={getElementById:()=>dialog,activeElement:last};
    const event=extra=>({key:'Tab',preventDefault(){prevented=true;},...extra});
    try{
        app.workspaceDialogKey(event());assert.equal(focused,first);assert.equal(prevented,true);
        global.document.activeElement=first;focused=null;prevented=false;app.workspaceDialogKey(event({shiftKey:true}));assert.equal(focused,last);assert.equal(prevented,true);
        focused=null;prevented=false;app.workspaceDialogKey(event());assert.equal(focused,null);assert.equal(prevented,false);
        dialog.open=false;app.workspaceDialogKey(event({shiftKey:true}));assert.equal(focused,null);assert.equal(prevented,false);
    }finally{global.document=before;}
});

test('correction changes one row only, preserves the visit and add draft, and creates a fresh result/version',()=>{
    const first=engine.calculate(input()),other=engine.calculate(input({caseId:'FICTIF-OTHER'}));first.result.imported=true;
    const state=workspace([first,other]),before=JSON.stringify(state),next=WorkspaceApp.correctedBatch(state,0,{...first.child,weight:9000,visitId:'untrusted-replacement'},engine);
    assert.equal(JSON.stringify(state),before);assert.deepEqual(next.batch[1],other);
    for(const key of ['draft','batchDraft','single','paste','mode','stale'])assert.deepEqual(next[key],state[key]);
    assert.equal(next.batch.length,2);assert.equal(next.batch[0].child.weight,9000);
    assert.equal(next.batch[0].child.visitId,first.child.visitId);assert.notEqual(next.batch[0].child.id,first.child.id);assert.notEqual(next.batch[0].result.id,first.result.id);
    assert.equal(next.batch[0].result.imported,undefined);assert.notEqual(next.batch[0].result.weightForAge.zscoreRaw,first.result.weightForAge.zscoreRaw);
    HistoryManager.checkWorkspace(next);assert.equal(next.version,1);
});

test('invalid row indices and invalid measures never mutate a lot or generate a partially corrected result',()=>{
    const state=workspace([engine.calculate(input())]),before=JSON.stringify(state);
    for(const index of [-1,1,0.5,NaN,'0'])assert.throws(()=>WorkspaceApp.correctedBatch(state,index,{},engine),/batchCorrectionChanged/);
    assert.throws(()=>WorkspaceApp.correctedBatch(state,0,{weight:'invalid'},engine),/weightInvalid/);
    assert.equal(JSON.stringify(state),before);
});

test('correction keeps an explicit WHO, CDC or postnatal profile and recomputes its context without assigning unknown ages',()=>{
    const inputs=[input(),input({growthProfile:'us',ageMode:'months',ageYears:3,ageMonths:0,weight:14000,height:95,position:'H'}),
        input({growthProfile:'intergrowth',ageMode:'pma',postmenstrualDays:224,ageDays:'',weight:1600,height:42,headCircumference:29}),
        input({growthProfile:'intergrowth',ageMode:'days',ageDays:14,gestationalAgeWeeks:30,gestationalAgeDays:0,weight:1600,height:42,headCircumference:29})];
    for(const raw of inputs){
        const original=engine.calculate(raw),next=WorkspaceApp.correctedBatch(workspace([original]),0,{...original.child,growthProfile:raw.growthProfile||'who',height:raw.height+1},engine),e=next.batch[0];
        assert.equal(e.result.referenceFamily,original.result.referenceFamily);assert.equal(e.child.visitId,original.child.visitId);HistoryManager.checkWorkspace(next);
        if(raw.ageMode==='pma'){assert.equal(e.child.ageDays,null);assert.equal(e.result.intergrowthContext.age.birthGestationDays,null);}
        if(raw.growthProfile==='intergrowth'){assert.equal(e.result.weightForHeight.zscore,null);assert.equal(e.result.bmi,null);}
    }
});

test('lot review accepts valid completed-month input strings without hiding missing or invalid age parts',()=>{
    const original=engine.calculate(input({growthProfile:'us',ageMode:'months',ageYears:2,ageMonths:0,position:'H',weight:12300,height:87}));
    const corrected=WorkspaceApp.correctedBatch(workspace([original]),0,{ageYears:'2',ageMonths:'0',weight:'12400'},engine).batch[0];
    assert.equal(LotQuality.build([corrected]).counts.qualityAgeUnusable,0);
    for(const ageYears of ['', ' ', null, undefined, false, {}, '-1', '2.5', 'invalid', Infinity]){
        const e=structuredClone(corrected);e.child.ageYears=ageYears;assert.equal(LotQuality.build([e]).counts.qualityAgeUnusable,1);
    }
    for(const ageMonths of ['', ' ', null, false, '12', '-1', '0.5']){
        const e=structuredClone(corrected);e.child.ageMonths=ageMonths;assert.equal(LotQuality.build([e]).counts.qualityAgeUnusable,1);
    }
});

test('validation, pre-save and corrected-save failures keep the live row, other rows and correction draft available',async()=>{
    for(const failure of ['validation','before','after']){
        const state=workspace([engine.calculate(input()),engine.calculate(input({caseId:'FICTIF-OTHER'}))]),before=JSON.stringify(state);
        const h=ui(state,{...state.batch[0].child,weight:failure==='validation'?'invalid':9000});
        h.store.beforeWrite=n=>{if(n===(failure==='before'?1:failure==='after'?2:0))throw Error('storageFull');};
        const warn=console.warn,warnings=[];console.warn=(...args)=>warnings.push(args);
        try{
            await h.app.saveBatchCorrection();assert.equal(JSON.stringify(h.app.state),before);assert.equal(h.app.closed,undefined);assert.ok(h.app.batchCorrection);
            assert.equal(h.app.batchCorrection.draft.weight,failure==='validation'?'invalid':9000);
            assert.equal(h.app.error.prefix,'correction');assert.equal(h.app.error.key,failure==='validation'?'weightInvalid':'storageFull');
            assert.equal(h.form.inert,false);assert.equal(h.buttons[0].disabled,false);
            assert.equal(h.store.records.sessions.length,failure==='after'?1:0);
            if(failure==='after')assert.equal(h.store.records.sessions[0].metadata.workspace.batch[0].child.weight,8500);
            assert.equal(warnings.length,failure==='before'?1:0);if(warnings.length)assert.equal(warnings[0][1].message,'storageFull');
        }finally{console.warn=warn;h.restore();}
    }
});

test('a workspace replacement during the pre-save prevents the correction from touching the new work',async()=>{
    const state=workspace([engine.calculate(input())]),other=workspace([engine.calculate(input({caseId:'FICTIF-NEW-WORK',weight:10000}))]),before=JSON.stringify(other);
    const h=ui(state,{weight:9000});h.store.beforeWrite=n=>{if(n===1)h.app.state=other;};
    try{
        await h.app.saveBatchCorrection();assert.equal(JSON.stringify(h.app.state),before);assert.equal(h.store.records.sessions.length,1);
        assert.equal(h.app.notice.key,'batchCorrectionChanged');assert.equal(h.app.closed,undefined);
    }finally{h.restore();}
});

test('a correction becomes visible only after both durable saves, and repeated clicks cannot duplicate it',async()=>{
    const state=workspace([engine.calculate(input())]),before=JSON.stringify(state),h=ui(state,{...state.batch[0].child,weight:9000});
    let unlock,started;const writing=new Promise(resolve=>{started=resolve;});h.store.beforeWrite=n=>n===2?new Promise(resolve=>{unlock=resolve;started();}):undefined;
    try{
        const pending=h.app.saveBatchCorrection();await writing;
        assert.equal(JSON.stringify(h.app.state),before);assert.equal(h.app.batchCorrection.busy,true);assert.equal(h.form.inert,true);assert.equal(h.buttons[0].disabled,true);
        await h.app.saveBatchCorrection();assert.equal(h.store.writes,2);
        unlock();await pending;
        assert.equal(h.app.state.batch[0].child.weight,9000);assert.equal(h.store.records.sessions.length,2);
        assert.deepEqual(h.store.records.sessions.map(s=>s.metadata.reason),['beforeBatchCorrection','correctedBatch']);
        assert.equal(h.app.batchCorrection,null);assert.equal(h.app.closed,true);assert.equal(h.app.focus,'batch-correct-0');assert.equal(h.app.notice.key,'batchCorrectionSaved');
    }finally{h.restore();}
});

test('historical originals survive correction, follow-up selects the corrected visit once, and current backup round-trips both versions',async()=>{
    const original=engine.calculate(input()),state=workspace([original]),next=WorkspaceApp.correctedBatch(state,0,{weight:9000},engine);
    original.result.calculatedAt='2026-10-28T10:00:00.000Z';next.batch[0].result.calculatedAt='2026-10-28T11:00:00.000Z';
    const store=new MemoryHistory(),history=new HistoryManager(store);await history.save(state,'beforeBatchCorrection',true);await history.save(next,'correctedBatch',true);
    const visits=await history.caseVisits(original.child.caseId,original.child.gender);
    assert.equal(visits.entries.length,1);assert.equal(visits.entries[0].child.weight,9000);assert.equal(store.records.sessions[0].metadata.workspace.batch[0].child.weight,8500);
    const file=await new TransferManager(store).export({language:'fr'}),sessions=[];
    const decoded=await TransferManager.inspect(file,(_,line)=>{const e=HistoryManager.parse(line);if(e.kind==='record'&&e.store==='sessions')sessions.push(e.record);});
    assert.equal(decoded.validator.counts.sessions,2);assert.deepEqual(sessions.map(s=>s.metadata.workspace.batch[0].child.weight),[8500,9000]);
    for(const s of sessions)HistoryManager.checkWorkspace(s.metadata.workspace);
});

test('correction actions use absolute row indices, translated labels and escaped identities, and never enter read-only tables or exports',()=>{
    const e=engine.calculate(input({name:'<FICTIF>'}));
    for(const language of ['fr','en','ar']){
        const app=Object.assign(Object.create(WorkspaceApp.prototype),{prefs:{language},translations});
        const html=app.tableHTML([e],{compact:true,editable:true,offset:8});
        assert.ok(html.includes('id="batch-correct-8"'));assert.ok(html.includes('data-index="8"'));assert.ok(html.includes(translations[language].batchCorrectionEdit));
        assert.ok(!html.includes('<FICTIF>'));assert.ok(html.includes('&lt;FICTIF&gt;'));
        assert.ok(!app.tableHTML([e]).includes('data-action="batch-correct"'));
        for(const key of ['batchCorrectionTitle','batchCorrectionHelp','batchCorrectionApply','batchCorrectionSaved','batchCorrectionChanged','beforeBatchCorrection','correctedBatch'])assert.ok(translations[language][key]);
    }
    assert.ok(!CSVManager.results([e]).includes('batch-correct'));
    const second=engine.calculate(input());assert.equal(LotQuality.build([e,second]).counts.qualityDuplicateMeasures,2);
    const corrected=WorkspaceApp.correctedBatch(workspace([e,second]),0,{weight:9000},engine);assert.equal(LotQuality.build(corrected.batch).counts.qualityDuplicateMeasures,0);
});
