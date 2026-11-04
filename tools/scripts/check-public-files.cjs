'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
function checkPublic({tracked=false,sourceArchive=false,base=root}={}){
    if(sourceArchive&&tracked)throw Error('Source archives have no Git tracking requirement; use one distribution context at a time');
    if(sourceArchive){const marker=path.join(base,'SOURCE-README.txt');if(!fs.existsSync(marker)||!fs.lstatSync(marker).isFile()||fs.lstatSync(marker).isSymbolicLink())throw Error('Missing source archive marker: SOURCE-README.txt');}
    const excluded=sourceArchive?require('./build-source-archive.cjs').excludedFiles:[];
    const list=JSON.parse(fs.readFileSync(path.join(base,'tools/git-sync-allowlist.json'),'utf8')).files;
    if(!Array.isArray(list)||!list.length||new Set(list).size!==list.length)throw Error('Public file list is empty or contains duplicates');
    const required=['CONTRIBUTING.md','SECURITY.md','.github/workflows/public-checks.yml','tools/scripts/test-public.cjs','tools/public-tests/public.test.cjs','tools/verification/verify.cjs','tools/verification/who-additional-decimal.json'];
    for(const file of required)if(!list.includes(file))throw Error('Missing public entry: '+file);
    for(const file of list){
        if(!/^[\w./-]+$/.test(file)||file.split('/').includes('..')||/(^|\/)(\.local|node_modules|audit|tests)(\/|$)|\.(sqlite|db|zscore|enc|log|env)$/i.test(file))throw Error('Forbidden public entry: '+file);
        if(excluded.includes(file))continue;
        let target=base;for(const part of file.split('/')){target=path.join(target,part);if(fs.lstatSync(target).isSymbolicLink())throw Error('Symbolic public entry: '+file);}
        if(!fs.statSync(target).isFile())throw Error('Missing public file: '+file);
        if(tracked&&spawnSync('git',['ls-files','--error-unmatch','--',file],{cwd:base,stdio:'ignore'}).status!==0)throw Error('File is not tracked by Git: '+file);
    }
    return {files:list.length-excluded.filter(file=>list.includes(file)).length,trackedChecked:tracked,distribution:sourceArchive?'source-archive':'repository'};
}
if(require.main===module){try{if(process.argv.slice(2).some(a=>!['--tracked','--source-archive'].includes(a)))throw Error('Usage: check-public-files.cjs [--tracked | --source-archive]');console.log(JSON.stringify(checkPublic({tracked:process.argv.includes('--tracked'),sourceArchive:process.argv.includes('--source-archive')})));}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={checkPublic};
