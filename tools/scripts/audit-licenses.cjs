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
    for(const file of vendorFiles){const matches=provenance.selected.filter(item=>item.path===file);if(matches.length!==1)throw new Error('Missing PDF provenance: '+file);if(file!=='vendor/pdf/jspdf-4.2.1.umd.min.js')verify('src/'+file,matches[0]);}
    if(offline.includes('vendor/pdf/jspdf-4.2.1.umd.min.js'))throw Error('Historical PDF bundle must not be distributed');
    const report=json('src/vendor/pdf/report-provenance.json');
    if(report.format!==1||report.upstreamCommit!=='4562ce8aa35bd5ecd98cd5e262e3da2af96476f6'||report.variant!=='TIL report 1'||report.selected.length!==2)throw Error('Unexpected report bundle provenance');
    const sourceManifest=read('tools/reference/pdf-report/sources.json');
    if(sha(sourceManifest)!==report.sourceManifestSHA256)throw Error('Changed PDF source manifest');
    for(const item of JSON.parse(sourceManifest).files)verify('tools/reference/pdf-report/sources/'+item.path,item,false);
    for(const [file,expected]of Object.entries(report.localInputs))if(sha(read('tools/reference/pdf-report/'+file))!==expected)throw Error('Changed PDF adapter source');
    if(report.inputs.some(p=>/md5|rgbcolor|pdfsecurity/.test(p)))throw Error('Excluded PDF module included');
    for(const item of report.selected)verify('src/'+item.path,item);
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
    const gpl=read('COPYING');if(!gpl.equals(read('src/data/LICENSE-anthro.txt')))throw Error('Application GPL text differs');
    const own=read('src/data/LICENSE-TIL.txt');if(!own.includes(gpl)||!own.toString().includes('GNU GPL version 3.'))throw Error('Missing application GPL notice');
    const pack=require('./build-source-archive.cjs').sourceArchive(),dataPack=require('./build-who-source-package.cjs').sourcePackage();
    // Build hosts may rewrite tracked configuration. Identify changed approved paths,
    // without printing their content, before rejecting the corresponding-source archive.
    const recordedPack=json('src/data/zscore-sources.json');
    const recordedFiles=new Map(recordedPack.files.map(item=>[item.file,item.sha256]));
    const changedSources=pack.manifest.files.filter(item=>recordedFiles.get(item.file)!==item.sha256).map(item=>item.file);
    for(const file of recordedFiles.keys())if(!pack.manifest.files.some(item=>item.file===file))changedSources.push(file);
    if(changedSources.length)throw Error('Changed pinned resource: src/data/zscore-sources.zip; corresponding source differs: '+changedSources.join(', '));
    for(const [file,b]of [['data/zscore-sources.zip',pack.zip],['data/zscore-sources.json',pack.metadata],['data/who-data-sources.zip',dataPack.zip],['data/who-data-sources.json',dataPack.metadata]])verify('src/'+file,{bytes:b.length,sha256:sha(b)});
    if(pack.manifest.files.some(x=>/^\.local\/|^(?:audit|node_modules)\//.test(x.file)||x.file==='src/vendor/pdf/jspdf-4.2.1.umd.min.js'))throw Error('Forbidden corresponding source');
    return {technicalPassed:true,licenseDistributionReady:true,legalReady:false,noticeFamilies:[
        {component:'WHO Anthro source/data',declaredLicense:'GPL-3',sourceCommit:downloads.commit,notice:'src/data/LICENSE-anthro.txt',scopeDecision:'Covered source tables and conversions supplied alongside the GPLv3 application'},
        {component:'WHO AnthroPlus source/data',declaredLicense:'GPL-3-or-later',sourceCommit:plusDownloads.commit,notice:'src/data/LICENSE-anthroplus.txt',scopeDecision:'Covered source tables and conversions supplied alongside the GPLv3 application'},
        {component:'jsPDF 4.2.1 TIL report 1',declaredLicense:'MIT upstream; GPL-3.0-only TIL modifications; fflate MIT',notice:'src/vendor/pdf/NOTICE-report.txt'},
        {component:'AutoTable 5.0.8',declaredLicense:'MIT',notice:'src/vendor/pdf/autotable-5.0.8.min.js.LICENSE.txt'},
        {component:'Amiri Regular/Bold',declaredLicense:'OFL-1.1',notice:'src/vendor/pdf/OFL.txt'},
        {component:'Z-score Niger original code',declaredLicense:'GPL-3.0-only',notice:'src/data/LICENSE-TIL.txt',correspondingSource:'src/data/zscore-sources.zip'}
    ],inventory,distributionReview:{date:'2026-10-21',preferredModel:'GPL-3.0-only',wholePackageExclusive:false,report:'docs/references/DISTRIBUTION_GPL.md',sourceArchiveSHA256:pack.manifest.sha256,sourceFiles:pack.manifest.files.length,issues:['Hosting plan and model-training preference require an operational decision']},remaining:['Use hosting terms and plan compatible with the intended use; verify model-training preference. Technical licence checks are not a legal opinion.']};
}
if(require.main===module){try{console.log(JSON.stringify(auditLicenses(),null,2));}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={auditLicenses};
