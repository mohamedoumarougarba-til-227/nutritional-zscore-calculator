'use strict';
// Rebuilds a pinned third-party subset. No install, download or package-manager execution.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),reference=path.join(root,'tools/reference/pdf-report');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function buildPDFReport(builderPath=process.env.ZSCORE_ESBUILD_PATH){
    if(!builderPath)throw Error('Set ZSCORE_ESBUILD_PATH to an existing esbuild 0.27.2 module; nothing will be installed');
    const esbuild=require(path.resolve(builderPath));if(esbuild.version!=='0.27.2')throw Error('Unexpected builder version');
    const rawManifest=fs.readFileSync(path.join(reference,'sources.json')),manifest=JSON.parse(rawManifest);
    for(const item of manifest.files){
        if(!/^[\w./-]+$/.test(item.path)||item.path.split('/').includes('..'))throw Error('Unsafe source path');
        const b=fs.readFileSync(path.join(reference,'sources',item.path));
        if(b.length!==item.bytes||sha(b)!==item.sha256)throw Error('Changed PDF source: '+item.path);
    }
    const result=await esbuild.build({absWorkingDir:reference,entryPoints:['entry.js'],bundle:true,write:false,format:'cjs',platform:'browser',target:'es2020',minify:true,legalComments:'inline',metafile:true,plugins:[{name:'report-only',setup(build){
        build.onResolve({filter:/pdfsecurity\.js$/},()=>({path:path.join(reference,'security.js')}));
        build.onResolve({filter:/rgbcolor\.js$/},()=>({path:path.join(reference,'color.js')}));
        build.onResolve({filter:/^fflate$/},()=>({path:path.join(reference,'sources/fflate/esm/browser.js')}));
        build.onLoad({filter:/jspdf\.js$/},args=>({contents:fs.readFileSync(args.path,'utf8').replace(/^[ \t]*\/\/ @if MODULE_FORMAT='cjs'[\s\S]*?^[ \t]*\/\/ @endif/gm,''),loader:'js'}));
    }}]});
    const inputs=Object.keys(result.metafile.inputs).sort();
    if(inputs.some(p=>/md5|rgbcolor|pdfsecurity|gif_support|html\.js|webp_support/.test(p)))throw Error('Excluded code entered the report build');
    const preamble=`/* Z-score report build 1 from jsPDF 4.2.1 (${manifest.jspdfCommit}).\n * Modified by Tout Informatique Lazaret on 2026-10-20: report-only module selection;\n * original color adapter; encryption, image decoders and HTML plugins excluded.\n * jsPDF and fflate retain their own licences; TIL adapters retain their separate terms.\n */\n`;
    const bundle=preamble+'(function(root,factory){if(typeof module==="object"&&module.exports)module.exports=factory();else root.jspdf=factory();})(typeof globalThis==="object"?globalThis:this,function(){var module={exports:{}};var exports=module.exports;\n'+result.outputFiles[0].text+'\nreturn module.exports;});\n';
    const notices=[preamble,'TIL original adapters: see data/LICENSE-TIL.txt.\nThe following upstream notices remain applicable to their respective components.\n',fs.readFileSync(path.join(reference,'sources/LICENSE'),'utf8'),fs.readFileSync(path.join(reference,'sources/fflate/LICENSE'),'utf8')];
    for(const input of inputs){const text=fs.readFileSync(path.join(reference,input),'utf8');for(const match of text.matchAll(/\/\*[\s\S]*?\*\//g))if(/@license|copyright\s*(?:\(c\)|©)/i.test(match[0]))notices.push('\nSource: '+input+'\n'+match[0]);}
    const records={'vendor/pdf/jspdf-4.2.1-til1.umd.min.js':Buffer.from(bundle),'vendor/pdf/NOTICE-report.txt':Buffer.from(notices.join('\n\n')+'\n')};
    const localInputs=Object.fromEntries(['entry.js','color.js','security.js'].map(f=>[f,sha(fs.readFileSync(path.join(reference,f)))]));
    const provenance={format:1,upstream:'jsPDF',version:'4.2.1',variant:'TIL report 1',upstreamCommit:manifest.jspdfCommit,sourceManifestSHA256:sha(rawManifest),builder:{name:'esbuild',version:esbuild.version,target:'es2020'},localInputs,inputs,excluded:['Joseph Myers MD5','upstream RGBColor parser','PDF encryption implementation','HTML and image plugins'],selected:Object.entries(records).map(([p,b])=>({path:p,bytes:b.length,sha256:sha(b)}))};
    for(const [file,b]of Object.entries(records))fs.writeFileSync(path.join(root,'src',file),b);
    fs.writeFileSync(path.join(root,'src/vendor/pdf/report-provenance.json'),JSON.stringify(provenance,null,2)+'\n');
    return {bytes:Buffer.byteLength(bundle),inputs:inputs.length,selected:provenance.selected};
}
if(require.main===module)buildPDFReport().then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={buildPDFReport};
