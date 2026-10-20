'use strict';
// Complete editable data and notices, without application code or any patient record.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^(crc&1?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function zipRecords(names){
    const records=Object.entries(names).sort(([a],[b])=>a<b?-1:a>b?1:0);let offset=0;const blocks=[],central=[];
    for(const [name,b]of records){
        const n=Buffer.from(name),crc=crc32(b),header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x0800,6);header.writeUInt16LE(33,12);header.writeUInt32LE(crc,14);header.writeUInt32LE(b.length,18);header.writeUInt32LE(b.length,22);header.writeUInt16LE(n.length,26);blocks.push(header,n,b);
        const entry=Buffer.alloc(46);entry.writeUInt32LE(0x02014b50);entry.writeUInt16LE(20,4);entry.writeUInt16LE(20,6);entry.writeUInt16LE(0x0800,8);entry.writeUInt16LE(33,14);entry.writeUInt32LE(crc,16);entry.writeUInt32LE(b.length,20);entry.writeUInt32LE(b.length,24);entry.writeUInt16LE(n.length,28);entry.writeUInt32LE(offset,42);central.push(entry,n);offset+=header.length+n.length+b.length;
    }
    const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(records.length,8);end.writeUInt16LE(records.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
    return Buffer.concat([...blocks,directory,end]);
}
function sourcePackage(){
    const names={};
    for(const family of ['who','who2007']){
        const prefix=family==='who'?'WHO2006':'WHO2007',folder='tools/reference/'+family+'/',downloads=JSON.parse(fs.readFileSync(path.join(root,folder,'downloads.json')));
        for(const item of downloads.files){
            const file=family==='who'?item.path.replaceAll('/','__'):item.localFile;
            if(!/\.txt$|^LICENSE\.md$/.test(file))continue;
            const source=folder+file,b=fs.readFileSync(path.join(root,source));
            if(b.length!==item.bytes||sha(b)!==item.sha256)throw Error('Changed data source '+source);
            names[prefix+'/'+(file==='LICENSE.md'?'LICENSE.txt':'originals/'+file.replace('data-raw__growthstandards__',''))]=b;
        }
        names[prefix+'/upstream-provenance.json']=fs.readFileSync(path.join(root,folder,'downloads.json'));
    }
    for(const [family,data,manifest]of [['WHO2006','who-official.json','who-manifest.json'],['WHO2007','who-2007.json','who-2007-manifest.json']]){
        const bytes=fs.readFileSync(path.join(root,'src/data',data)),m=JSON.parse(fs.readFileSync(path.join(root,'src/data',manifest)));
        if(bytes.length!==m.bytes||sha(bytes)!==m.sha256)throw Error('Changed converted table '+data);
        names[family+'/converted/'+data]=bytes;names[family+'/converted/'+manifest]=Buffer.from(JSON.stringify(m,null,2)+'\n');
    }
    names['README.txt']=Buffer.from('WHO growth reference data - editable source package\n\nWHO2006: WHO Anthro b776d8a12b1c97369c748b561159fd2ec4f4db58 (GPL version 3).\nWHO2007: WHO AnthroPlus 7cfcdb39026e9a55de55732bc3cf14c82261bcf7 (GPL version 3 or later).\n\nThe originals folders contain the unchanged, editable upstream LMS tables.\nThe converted folders contain the exact readable JSON data distributed with Z-score Niger and their manifests.\nChanges by Tout Informatique Lazaret: tabular columns encoded as JSON, keys renamed for the local data interface; numeric reference values unchanged.\nFor WHO2007, the last duplicate upstream month is retained for interpolation.\nSex 1 corresponds to M; sex 2 to F. Each table entry records L, M and S.\n\nThe full upstream licences and provenance are included. Preserve their notices and the rights granted by those licences.\nThis package contains reference data and explanatory metadata only, no application code and no patient records.\nThe TIL copyright over its original application code does not restrict these data licences.\nThis note may be redistributed with the data package. No WHO endorsement is claimed.\n');
    const zip=zipRecords(names);
    const records=Object.entries(names).sort(([a],[b])=>a<b?-1:a>b?1:0);
    const manifest={format:1,file:'who-data-sources.zip',bytes:zip.length,sha256:sha(zip),purpose:'Editable WHO reference data and upstream licences; no original application code or patient records',files:records.map(([file,b])=>({file,bytes:b.length,sha256:sha(b)}))};
    return {zip,manifest,metadata:Buffer.from(JSON.stringify(manifest,null,2)+'\n')};
}
if(require.main===module){const p=sourcePackage();fs.writeFileSync(path.join(root,'src/data/who-data-sources.zip'),p.zip);fs.writeFileSync(path.join(root,'src/data/who-data-sources.json'),p.metadata);console.log(JSON.stringify({files:p.manifest.files.length,bytes:p.zip.length,sha256:p.manifest.sha256}));}
module.exports={sourcePackage,zipRecords};
