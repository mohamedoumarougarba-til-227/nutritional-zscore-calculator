'use strict';
// Fictitious records. Real stream validator/crypto, no private fixtures or browser dependency.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {ClinicalEngine}=require('../../src/js/services/clinical-engine.js');global.ClinicalEngine=ClinicalEngine;
const {HistoryManager}=require('../../src/js/services/history-manager.js');global.HistoryManager=HistoryManager;
const {TransferManager}=require('../../src/js/services/transfer-manager.js');
const {EncryptedBackup}=require('../../src/js/services/encrypted-backup.js');
const {WorkspaceApp}=require('../../src/js/workspace-app.js');
const translations=JSON.parse(fs.readFileSync(path.join(__dirname,'../../src/data/interface-translations.json')));
const workspace=name=>({version:1,mode:'batch',draft:{},batchDraft:{caseId:name,name},single:null,batch:[],paste:'FICTITIOUS UNIMPORTED INPUT',stale:false});
const snapshot=(state,id)=>({...new HistoryManager({}).makeSnapshot(state,'beforeExport'),id});
const original=snapshot(workspace('FICTITIOUS-SAVED'),'FICTITIOUS-ORIGINAL');
function storage(records=[original]){return {writes:0,async addArchive(){this.writes++;throw new DOMException('FICTITIOUS quota','QuotaExceededError');},async visitArchive(visit){for(const r of records)visit('sessions',structuredClone(r));}};}
async function sessions(file){const found=[];await TransferManager.inspect(file,(_,line)=>{const e=JSON.parse(line);if(e.store==='sessions')found.push(e.record);});return found;}
function environment(t){const previous={localStorage:global.localStorage,document:global.document};global.localStorage={getItem:()=>null};global.document={querySelectorAll:()=>[]};t.after(()=>{for(const key of Object.keys(previous))if(previous[key]===undefined)delete global[key];else global[key]=previous[key];});}
function app(store,state){const history=new HistoryManager(store),transfer=new TransferManager(store);return Object.assign(Object.create(WorkspaceApp.prototype),{state,page:'batch',prefs:{language:'fr'},translations,history,saveState:'unsaved',readForms(){},transferStatus(){},transfers:()=>transfer,saveImmediate:()=>store.addArchive({}),download(blob,name){this.downloaded={blob,name};},toast(key,error){this.notice={key,error};}});}

test('rescue stream includes current memory without writes, preserving archived bytes and the current format',async t=>{
 environment(t);const store=storage(),live=snapshot(workspace('FICTITIOUS-UNSAVED'),'FICTITIOUS-RESCUE'),before=JSON.stringify(original);
 const file=await new TransferManager(store).export({language:'fr'},()=>{},live),records=await sessions(file);
 assert.equal(records.length,2);assert.deepEqual(records.find(r=>r.id===original.id),original);assert.deepEqual(records.find(r=>r.id===live.id),live);
 assert.equal(JSON.stringify(original),before);assert.equal(store.writes,0);assert.match(await file.text(),/"format":"zscore-niger-stream","version":1/);
});

test('rescue snapshot is captured before asynchronous reads and deduplicates archived or journaled workspaces',async t=>{
 environment(t);const live=snapshot(workspace('FICTITIOUS-CAPTURE'),'FICTITIOUS-LIVE'),store=storage();
 const pending=new TransferManager(store).export({},()=>{},live);live.metadata.workspace.batchDraft.name='FICTITIOUS-LATER';
 const records=await sessions(await pending);assert.equal(records.find(r=>r.id===live.id).metadata.workspace.batchDraft.name,'FICTITIOUS-CAPTURE');
 const same=snapshot(original.metadata.workspace,'FICTITIOUS-SAME');assert.equal((await sessions(await new TransferManager(store).export({},()=>{},same))).length,1);
 global.localStorage={'zscore-work-v5-fictitious':'present',getItem:()=>JSON.stringify(same)};
 assert.equal((await sessions(await new TransferManager(storage([])).export({},()=>{},same))).length,1);
});

test('invalid in-memory work and unreadable archives do not yield an incomplete rescue file',async t=>{
 environment(t);const invalid=snapshot(workspace('FICTITIOUS-INVALID'),'FICTITIOUS-INVALID');invalid.metadata.workspace.version=999;
 await assert.rejects(new TransferManager(storage()).export({},()=>{},invalid),/importVersion|importInvalid/);
 const store=storage();store.visitArchive=async visit=>{visit('sessions',original);throw Error('historyReadFailed');};
 await assert.rejects(new TransferManager(store).export({},()=>{},snapshot(workspace('FICTITIOUS-CURRENT'),'FICTITIOUS-CURRENT')),/historyReadFailed/);
});

test('failed local saving still downloads a verified rescue copy and retains unsaved status in FR EN AR',async t=>{
 environment(t);for(const language of ['fr','en','ar']){
  const store=storage(),ui=app(store,workspace('FICTITIOUS-'+language));ui.prefs.language=language;
  await ui.exportBackup();assert.equal(store.writes,1);assert.equal(ui.saveState,'unsaved');assert.equal(ui.transferBusy,false);
  assert.match(ui.downloaded.name,/\.zscore$/);assert.equal(ui.notice.key,'exportUnsaved');assert.equal(ui.notice.error,true);assert.notEqual(ui.t(ui.notice.key),ui.notice.key);
  const records=await sessions(ui.downloaded.blob);assert.ok(records.some(r=>r.metadata.workspace.batchDraft.name==='FICTITIOUS-'+language));assert.ok(records.some(r=>r.id===original.id));
 }
});

test('encrypted rescue copy authenticates the same unsaved data without a local write or format change',async t=>{
 environment(t);const ui=app(storage(),workspace('FICTITIOUS-ENCRYPTED')),password='FICTITIOUS-PUBLIC-RESCUE';
 await ui.exportBackup(password);assert.match(ui.downloaded.name,/\.zscore\.enc$/);assert.equal(ui.saveState,'unsaved');assert.equal(ui.notice.key,'exportUnsaved');
 const file=await EncryptedBackup.decrypt(ui.downloaded.blob,password);assert.ok((await sessions(file)).some(r=>r.metadata.workspace.batchDraft.caseId==='FICTITIOUS-ENCRYPTED'));
 await assert.rejects(EncryptedBackup.decrypt(ui.downloaded.blob,'FICTITIOUS-WRONG-PASSWORD'),/encryptedAuthenticationFailed/);
});

test('a successful save uses the normal export; a failed archive read never reports success or downloads',async t=>{
 environment(t);const ui=app(storage(),workspace('FICTITIOUS-NORMAL'));ui.saveImmediate=async()=>{ui.saveState='saved';};
 await ui.exportBackup();assert.equal(ui.notice.key,'exportSensitive');assert.equal((await sessions(ui.downloaded.blob)).length,1);
 const broken=app(storage(),workspace('FICTITIOUS-FAILED-READ'));broken.transfers=()=>({export:async()=>{throw Error('historyReadFailed');}});
 await assert.rejects(broken.exportBackup(),/historyReadFailed/);assert.equal(broken.downloaded,undefined);assert.equal(broken.transferBusy,false);assert.notEqual(broken.notice?.key,'exportUnsaved');
});
