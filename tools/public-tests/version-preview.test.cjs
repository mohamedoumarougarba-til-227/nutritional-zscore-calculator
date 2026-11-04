'use strict';
// Synthetic saved records; no .local, clinical audit, browser or dependency required.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {ClinicalEngine}=require('../../src/js/services/clinical-engine.js');global.ClinicalEngine=ClinicalEngine;
const {WorkspaceApp}=require('../../src/js/workspace-app.js');
const translations=JSON.parse(fs.readFileSync(path.join(__dirname,'../../src/data/interface-translations.json'),'utf8'));
const entry=i=>({child:{id:'FICTIF-'+i,caseId:'FICTIF-'+i,name:'FICTIF '+i,weight:8500,height:75},result:null});
const session=(n=5000,single=null)=>({id:'FICTIF-SESSION',createdAt:'2026-11-03T10:00:00Z',metadata:{workspace:{version:1,mode:'batch',draft:{},batchDraft:{},single,batch:Array.from({length:n},(_,i)=>entry(i)),paste:'',stale:false}}});
const ui=s=>Object.assign(Object.create(WorkspaceApp.prototype),{previewedVersion:s,prefs:{language:'fr'},translations});

test('saved preview visits all 5001 entries once, eight per page, without changing the stored workspace',()=>{
    const s=session(5000,entry('SINGLE')),before=JSON.stringify(s),app=ui(s),seen=[];
    for(let page=0;page<626;page++){app.previewPage=page;const v=app.versionPreviewView();assert.equal(v.current,page);assert.equal(v.pages,626);assert.equal(v.total,5001);assert.ok(v.entries.length<=8);seen.push(...v.entries.map(e=>e.child.id));}
    assert.equal(seen.length,5001);assert.equal(new Set(seen).size,5001);assert.equal(seen[0],'FICTIF-SINGLE');assert.equal(seen.at(-1),'FICTIF-4999');assert.equal(JSON.stringify(s),before);
    app.previewPage=9999;assert.equal(app.versionPreviewView().current,625);app.previewPage=-1;assert.equal(app.versionPreviewView().current,0);
    app.previewPage=NaN;assert.equal(app.versionPreviewView().current,0);app.previewedVersion=null;assert.deepEqual(app.versionPreviewView().entries,[]);
});

test('FR EN AR previews render only their page, translated navigation and the original restore action without correction controls',()=>{
    for(const language of ['fr','en','ar']){
        const s=session(),before=JSON.stringify(s),app=ui(s),sizes=[];app.prefs.language=language;app.previewPage=624;
        const table=app.tableHTML;app.tableHTML=function(entries){sizes.push(entries.length);return table.call(this,entries);};
        app.date=()=> '2026-11-03';app.previewDraft=()=>'';app.dialog=(title,body,footer)=>{app.html={title,body,footer};};app.focusPagination=key=>{app.focusKey=key;};
        app.renderVersionPreview(true);assert.deepEqual(sizes,[8]);assert.equal(app.html.title,'preview');assert.ok(app.html.body.includes(translations[language].previewPages));
        assert.ok(app.html.body.includes('FICTIF-4999'));assert.ok(!app.html.body.includes('FICTIF-0<'));assert.ok(!app.html.body.includes('batch-correct'));assert.ok(app.html.body.includes('data-action="preview-page"'));
        assert.ok(app.html.footer.includes('data-id="FICTIF-SESSION"'));assert.equal(app.focusKey,'preview-page');assert.equal(JSON.stringify(s),before);
    }
});

test('hydrating another saved version starts at page one and a late request never replaces a newer preview',async()=>{
    const old=session(9),fresh={...session(1),id:'FICTIF-FRESH'},app=ui(old);let resolve;
    app.renderEpoch=1;app.previewPage=1;app.history={version:row=>row.id==='FICTIF-DELAYED'?new Promise(r=>{resolve=r;}):Promise.resolve(fresh)};
    app.renderVersionPreview=()=>{app.rendered=app.previewedVersion.id;};
    const pending=app.previewSession({id:'FICTIF-DELAYED'});await app.previewSession({id:'FICTIF-FRESH'});resolve(old);await pending;
    assert.equal(app.previewedVersion,fresh);assert.equal(app.previewPage,0);assert.equal(app.rendered,'FICTIF-FRESH');
});

test('empty previews and optional single-result details remain available without a spurious table',()=>{
    const s=session(0),app=ui(s);app.date=()=>'';app.previewDraft=()=>'';app.dialog=(title,body,footer)=>{app.html={body,footer};};app.renderVersionPreview();
    assert.ok(!app.html.body.includes('results-table'));assert.ok(!app.html.body.includes('preview-page'));assert.ok(app.html.footer.includes('data-action="restore"'));
    s.metadata.workspace.single=entry('SINGLE');app.resultsHTML=(e,stale,readonly)=>{assert.equal(readonly,true);return 'FICTIF-SINGLE-DETAILS';};app.renderVersionPreview();
    assert.ok(app.html.body.includes('FICTIF-SINGLE-DETAILS'));assert.equal(app.versionPreviewView().total,1);
});

test('preview navigation cannot change the version restored or reduce it to the visible page',async()=>{
    const s=session(),app=ui(s);app.readForms=()=>{};app.renderVersionPreview=focus=>{app.focused=focus;};app.restore=async value=>{app.restored=value;};
    for(const page of ['invalid','-1','1.5']){await app.action('preview-page',{dataset:{page}});assert.equal(app.previewPage,undefined);}
    await app.action('preview-page',{dataset:{page:'624'}});assert.equal(app.previewPage,624);assert.equal(app.focused,true);
    await app.action('restore',{dataset:{id:s.id}});assert.equal(app.restored,s);assert.equal(app.restored.metadata.workspace.batch.length,5000);
    assert.equal(app.previewedVersion,s);assert.equal(app.versionPreviewView().entries.length,8);
});
