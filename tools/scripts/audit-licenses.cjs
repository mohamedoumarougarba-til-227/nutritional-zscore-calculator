'use strict';
// Read-only provenance and notice checks. A green result does not grant publication rights.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname, '../..');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const vendorFiles=['jspdf-4.2.1.umd.min.js','jspdf-4.2.1.umd.min.js.LICENSE.txt','autotable-5.0.8.min.js','autotable-5.0.8.min.js.LICENSE.txt','Amiri-Regular.ttf','Amiri-Bold.ttf','OFL.txt','METADATA.pb'].map(file=>'vendor/pdf/'+file);
function auditLicenses(options={}){
    const read=options.readFile??(file=>fs.readFileSync(path.join(root,file)));
    const json=file=>JSON.parse(read(file).toString('utf8'));
    const provenance=json('src/vendor/pdf/provenance.json'),offline=json('tools/scripts/offline-assets.json');
    const inventory=[];
    function verify(file,expected,published=true){
        const bytes=read(file),actual=sha(bytes);
        if(bytes.length!==expected.bytes||actual!==expected.sha256)throw new Error('Changed pinned resource: '+file);
        if(published&&!offline.includes(file.replace(/^src\//,'')))throw new Error('Missing distributed notice/resource: '+file);
        const item={file,bytes:bytes.length,sha256:actual,published};inventory.push(item);return item;
    }
    if(!Array.isArray(provenance.selected)||provenance.selected.length!==vendorFiles.length)throw new Error('Unexpected PDF provenance inventory');
    for(const file of vendorFiles){const matches=provenance.selected.filter(item=>item.path===file);if(matches.length!==1)throw new Error('Missing PDF provenance: '+file);verify('src/'+file,matches[0]);}
    const downloads=json('tools/reference/who/downloads.json');
    const licenses=downloads.files.filter(item=>item.path==='LICENSE.md');
    if(licenses.length!==1)throw new Error('Missing Anthro licence provenance');
    verify('src/data/LICENSE-anthro.txt',licenses[0]);
    verify('tools/reference/who/LICENSE.md',licenses[0],false);
    const manifest=json('src/data/who-manifest.json'),who=json('src/data/who-official.json');
    const tableNames=['weianthro.txt','lenanthro.txt','wflanthro.txt','wfhanthro.txt','bmianthro.txt'];
    if(!Array.isArray(manifest.sources)||JSON.stringify(manifest.sources.map(item=>item.file).sort())!==JSON.stringify(tableNames.sort()))throw new Error('Missing WHO source inventory');
    if(downloads.commit!==who.sourceCommit)throw new Error('Anthro source commit mismatch');
    verify('src/data/who-official.json',manifest);
    for(const source of manifest.sources){const original=downloads.files.find(item=>item.path==='data-raw/growthstandards/'+source.file);if(!original||original.sha256!==source.sha256||original.bytes!==source.bytes)throw new Error('WHO source provenance mismatch');verify('tools/reference/who/data-raw__growthstandards__'+source.file,source,false);}
    const plusDownloads=json('tools/reference/who2007/downloads.json'),plusManifest=json('src/data/who-2007-manifest.json');
    verify('src/data/who-2007.json',plusManifest);const plusData=json('src/data/who-2007.json');
    if(plusDownloads.commit!==plusData.sourceCommit||plusManifest.sourceCommit!==plusData.sourceCommit||plusManifest.referenceVersion!==plusData.referenceVersion||plusManifest.sources.length!==3)throw new Error('WHO 2007 provenance mismatch');
    const plusLicense=plusDownloads.files.find(x=>x.localFile==='LICENSE.md');if(!plusLicense)throw new Error('Missing WHO 2007 licence');
    verify('src/data/LICENSE-anthroplus.txt',plusLicense);verify('tools/reference/who2007/LICENSE.md',plusLicense,false);
    for(const source of plusManifest.sources){const original=plusDownloads.files.find(x=>x.localFile===source.localFile);if(!original||original.sha256!==source.sha256||original.bytes!==source.bytes)throw new Error('WHO 2007 source mismatch');verify('tools/reference/who2007/'+source.localFile,source,false);}
    return {technicalPassed:true,legalReady:false,noticeFamilies:[
        {component:'WHO Anthro source/data',declaredLicense:'GPL-3',sourceCommit:downloads.commit,notice:'src/data/LICENSE-anthro.txt',scopeDecision:'Unresolved for converted data and combined distribution'},
        {component:'WHO AnthroPlus source/data',declaredLicense:'GPL-3-or-later',sourceCommit:plusDownloads.commit,notice:'src/data/LICENSE-anthroplus.txt',scopeDecision:'Unresolved for converted data and combined distribution'},
        {component:'jsPDF 4.2.1',declaredLicense:'MIT',notice:'src/vendor/pdf/jspdf-4.2.1.umd.min.js.LICENSE.txt'},
        {component:'AutoTable 5.0.8',declaredLicense:'MIT',notice:'src/vendor/pdf/autotable-5.0.8.min.js.LICENSE.txt'},
        {component:'Amiri Regular/Bold',declaredLicense:'OFL-1.1',notice:'src/vendor/pdf/OFL.txt'}
    ],inventory,distributionReview:{date:'2026-10-20',preferredModel:'proprietary-if-compatible',wholePackageExclusive:false,report:'docs/references/AUDIT_DROITS_DISTRIBUTION.md',issues:['WHO-derived table distribution scope unresolved','jsPDF embedded MD5 notice lacks a particular licence declaration','Vercel Hobby commercial-use restriction; model-training preference unverified']},remaining:['Record original code ownership and distribution terms; do not relicense third-party resources','Resolve scope and source obligations for Anthro-derived resources before public distribution','Clarify embedded jsPDF licence notice before asserting fully cleared rights','Use hosting terms and plan compatible with intended commercial use; verify model-training preference']};
}
if(require.main===module){try{console.log(JSON.stringify(auditLicenses(),null,2));}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={auditLicenses};
