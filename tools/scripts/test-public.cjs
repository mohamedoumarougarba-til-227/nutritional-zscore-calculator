'use strict';
// Public default; the optional private suite never participates in public CI.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
function discover(directory){
    if(!fs.existsSync(directory))return [];
    return fs.readdirSync(directory,{withFileTypes:true}).filter(f=>f.isFile()&&!f.isSymbolicLink()&&f.name.endsWith('.test.cjs')).map(f=>path.join(directory,f.name)).sort();
}
function run(directory,output=process){
    const files=discover(directory);
    if(!files.length){output.stderr.write('No test files discovered. Refusing an empty green suite.\n');return 1;}
    const result=spawnSync(process.execPath,['--test','--test-reporter=tap',...files],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
    output.stdout.write(result.stdout||'');output.stderr.write(result.stderr||'');
    if(result.error){output.stderr.write(result.error.message+'\n');return 1;}
    if(result.status!==0)return result.status||1;
    if(!/^# tests [1-9]\d*\s*$/m.test(result.stdout||'')){output.stderr.write('No non-empty test summary. Refusing success.\n');return 1;}
    return 0;
}
if(require.main===module){
    const args=process.argv.slice(2);
    if(args.length>1||args.some(arg=>arg!=='--private')){console.error('Usage: node tools/scripts/test-public.cjs [--private]');process.exitCode=1;}
    else process.exitCode=run(path.join(root,args.includes('--private')?'tools/tests':'tools/public-tests'));
}
module.exports={discover,run};
