'use strict';
// Publication needs a recorded rights decision. A technical success is not that decision.
const fs=require('node:fs'),path=require('node:path');
const {preparePublic}=require('./prepare-public.cjs');
const {auditLicenses}=require('./audit-licenses.cjs');
function build({directory=path.resolve(__dirname,'../../dist'),requireRights=true}={}){
    if(requireRights&&!auditLicenses().legalReady)throw new Error('Publication suspended: resolve WHO resource distribution rights before deployment. See docs/references/AUDIT_DROITS_DISTRIBUTION.md');
    if(fs.existsSync(directory))throw new Error('Output already exists; nothing overwritten');
    const result=preparePublic();
    fs.cpSync(result.output,directory,{recursive:true,errorOnExist:true,force:false});
    return {...result,output:directory,published:false};
}
if(require.main===module){try{console.log(JSON.stringify(build(),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={build};
