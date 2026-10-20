/** Local progressive transfer. Existing database schema, records and recovery bytes are preserved. */
class TransferManager {
    static stores=['children','results','sessions','settings'];
    static lineLimit=16*1024*1024;
    static registryKey='zscore-transfer-registry-v1';
    static stageName(name){return typeof name==='string'&&/^ZScoreTransfer-[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(name);}
    constructor(storage){this.storage=storage;this.stages=new WeakMap();}
    static async hash(previous,line){
        const bytes=new TextEncoder().encode(previous+'\n'+line),hash=await crypto.subtle.digest('SHA-256',bytes);
        return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
    }
    static encode(value){const line=JSON.stringify(value);if(new TextEncoder().encode(line).length>this.lineLimit)throw new Error('transferRecordTooLarge');return line;}
    static validator(){
        const counts=Object.fromEntries(this.stores.map(s=>[s,0])),ids=Object.fromEntries(this.stores.map(s=>[s,new Set()])),children=new Set(),results=new Set(),extendedAges=new Map();let phase=-1,recovery=0;
        const remember=(set,id)=>{set.add(id);if(set.size>2000000)throw new Error('transferTooComplex');};
        return {counts,children,results,get recovery(){return recovery;},accept(event){
            if(event.kind==='recovery'){
                phase=4;if(++recovery>50000||typeof event.key!=='string'||typeof event.raw!=='string')throw new Error('importInvalid');return;
            }
            const index=TransferManager.stores.indexOf(event.store),record=event.record;
            if(event.kind!=='record'||index<phase||index<0||!record||typeof record!=='object'||Array.isArray(record))throw new Error('importInvalid');phase=index;
            const key=event.store==='settings'?record.key:record.id;
            if(typeof key!=='string'||!key||event.store!=='settings'&&key.length>200||ids[event.store].has(key)||++counts[event.store]>50000)throw new Error('importInvalid');ids[event.store].add(key);
            if(event.store==='children'){HistoryManager.checkChild(record);if(record.ageDomainVersion===2)extendedAges.set(key,{ageDomainVersion:2,totalAgeMonths:record.totalAgeMonths});remember(children,key);}
            else if(event.store==='results'){HistoryManager.checkResult(record,ids.children);HistoryManager.checkPair(extendedAges.get(record.childId)||{},record);remember(results,key);}
            else if(event.store==='sessions'){
                if(typeof record.name!=='string'||!Number.isFinite(Date.parse(record.createdAt))||!Array.isArray(record.children)||!Array.isArray(record.results)||record.children.some(id=>!ids.children.has(id))||record.results.some(id=>!ids.results.has(id)))throw new Error('importInvalid');
                const w=record.metadata?.workspace;if(w){HistoryManager.checkWorkspace(w);for(const entry of [...w.batch,...(w.single?[w.single]:[])]){remember(children,entry.child.id);if(entry.result)remember(results,entry.result.id);}}
            }
        }};
    }
    async export(preferences,onProgress=()=>{}){
        const groups=Object.fromEntries(TransferManager.stores.map(s=>[s,[]])),journals=[],recovery=[];
        for(const key of Object.keys(localStorage))if(key.startsWith('zscore-draft-v2-')){
            const raw=localStorage.getItem(key);
            try{const snapshot=HistoryManager.parse(raw);HistoryManager.checkWorkspace(snapshot?.metadata?.workspace);journals.push({snapshot,signature:JSON.stringify(snapshot.metadata.workspace)});}
            catch(_){recovery.push({kind:'recovery',key,raw});}
        }
        const signatures=new Set(journals.map(j=>j.signature)),matched=new Set();
        await this.storage.visitArchive((store,record)=>{
            if(store==='sessions'&&record.metadata?.workspace&&signatures.size){const signature=JSON.stringify(record.metadata.workspace);if(signatures.has(signature))matched.add(signature);}
            groups[store].push(new Blob([TransferManager.encode({kind:'record',store,record})+'\n']));
        });
        for(const j of journals)if(!matched.has(j.signature)){matched.add(j.signature);groups.sessions.push(new Blob([TransferManager.encode({kind:'record',store:'sessions',record:j.snapshot})+'\n']));}
        const header={kind:'header',format:'zscore-niger-stream',version:1,exportedAt:new Date().toISOString(),preferences};
        const first=TransferManager.encode(header),blobs=[new Blob([first+'\n'])],validator=TransferManager.validator();let hash=await TransferManager.hash('',first);
        let processed=0;for(const blob of [...TransferManager.stores.flatMap(s=>groups[s]),...recovery.map(r=>new Blob([TransferManager.encode(r)+'\n']))]){
            const line=(await blob.text()).slice(0,-1);validator.accept(HistoryManager.parse(line));hash=await TransferManager.hash(hash,line);blobs.push(blob);
            if(++processed%16===0)onProgress(processed);
        }
        blobs.push(new Blob([TransferManager.encode({kind:'end',counts:validator.counts,recovery:validator.recovery,checksum:hash})+'\n']));
        return new Blob(blobs,{type:'application/x-ndjson;charset=utf-8'});
    }
    static async *lines(file){
        if(!Number.isSafeInteger(file.size)||file.size<=0)throw new Error('importInvalid');
        const decoder=new TextDecoder('utf-8',{fatal:true});let buffer='';
        for(let offset=0;offset<file.size;offset+=65536){
            buffer+=decoder.decode(await file.slice(offset,offset+65536).arrayBuffer(),{stream:true});
            let end;while((end=buffer.indexOf('\n'))!==-1){const line=buffer.slice(0,end).replace(/\r$/,'');buffer=buffer.slice(end+1);if(!line)throw new Error('importInvalid');if(new TextEncoder().encode(line).length>this.lineLimit)throw new Error('transferRecordTooLarge');yield line;}
            if(buffer.length>this.lineLimit)throw new Error('transferRecordTooLarge');
        }
        buffer+=decoder.decode();if(buffer){if(new TextEncoder().encode(buffer).length>this.lineLimit)throw new Error('transferRecordTooLarge');yield buffer;}
    }
    static openStage(){return new Promise((resolve,reject)=>{
        const request=indexedDB.open('ZScoreTransfer-'+crypto.randomUUID(),1);
        request.onupgradeneeded=()=>request.result.createObjectStore('lines',{keyPath:'seq'});
        request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(new Error('transferStorageRequired'));
    });}
    static storeLine(db,seq,line){return new Promise((resolve,reject)=>{
        const tx=db.transaction('lines','readwrite');tx.objectStore('lines').add({seq,line});tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(new Error('importStorageFailed'));
    });}
    static readLine(db,seq){return new Promise((resolve,reject)=>{
        const tx=db.transaction('lines','readonly'),request=tx.objectStore('lines').get(seq);let record;
        request.onsuccess=()=>{record=request.result;};tx.oncomplete=()=>{
            if(typeof record?.line!=='string')return reject(new Error('importInvalid'));
            try{if(new TextEncoder().encode(record.line).length>TransferManager.lineLimit)return reject(new Error('transferRecordTooLarge'));resolve(record.line);}
            catch(_){reject(new Error('importInvalid'));}
        };tx.onerror=tx.onabort=()=>reject(new Error('importStorageFailed'));
    });}
    static registry(){
        const raw=localStorage.getItem(this.registryKey);if(!raw)return [];
        const rows=HistoryManager.parse(raw);if(!Array.isArray(rows)||rows.length>50000||rows.some(r=>!r||!this.stageName(r.name)||!Number.isFinite(Date.parse(r.createdAt))))throw new Error('stageDiscoveryPartial');return rows;
    }
    static remember(name){
        try{const rows=this.registry();if(!rows.some(r=>r.name===name)){rows.push({name,createdAt:new Date().toISOString()});localStorage.setItem(this.registryKey,JSON.stringify(rows));}return true;}
        catch(_){return false;} // An unreadable registry is preserved, never replaced with an empty one.
    }
    static metadata(db,key,info){return new Promise((resolve,reject)=>{
        const tx=db.transaction('lines','readwrite');tx.objectStore('lines').add({seq:'meta-'+key,info});tx.oncomplete=resolve;tx.onabort=tx.onerror=()=>reject(new Error('importStorageFailed'));
    });}
    static describe(db){return new Promise((resolve,reject)=>{
        const tx=db.transaction('lines','readonly'),store=tx.objectStore('lines'),range=IDBKeyRange.bound(0,Number.MAX_SAFE_INTEGER),description={name:db.name};
        const count=store.count(range);count.onsuccess=()=>{description.lines=count.result;};
        const last=store.openCursor(range,'prev');last.onsuccess=()=>{description.last=last.result?.key;};
        for(const key of ['base','ready','imported','failed']){const r=store.get('meta-'+key);r.onsuccess=()=>{description[key]=r.result?.info;};}
        tx.oncomplete=()=>resolve(description);tx.onabort=tx.onerror=()=>reject(new Error('importStorageFailed'));
    });}
    static openExisting(name){return new Promise((resolve,reject)=>{
        if(!this.stageName(name))return reject(new Error('stageUnavailable'));
        const request=indexedDB.open(name);
        request.onupgradeneeded=()=>request.transaction.abort(); // Do not create a missing copy or upgrade its schema.
        request.onerror=()=>reject(new Error('stageUnavailable'));
        request.onsuccess=()=>{const db=request.result;if(db.version!==1||!db.objectStoreNames.contains('lines')){db.close();reject(new Error('stageUnavailable'));}else resolve(db);};
    });}
    async listStages(page=0,size=10){
        let registered=[],directory=[],enumerated=false;try{registered=TransferManager.registry();}catch(_){}
        try{if(typeof indexedDB.databases==='function'){directory=await indexedDB.databases();enumerated=true;}}catch(_){}
        const dates=new Map(registered.map(r=>[r.name,r.createdAt])),names=[...new Set([...registered.map(r=>r.name),...directory.map(r=>r.name).filter(TransferManager.stageName)])];
        names.sort((a,b)=>String(dates.get(b)||'').localeCompare(String(dates.get(a)||''))||a.localeCompare(b));
        size=Math.min(100,Math.max(1,Number.isInteger(size)?size:10));const pages=Math.max(1,Math.ceil(names.length/size));page=Math.min(pages-1,Math.max(0,Number.isInteger(page)?page:0));
        const imported=await this.storage.importFingerprints(),items=[];
        for(const name of names.slice(page*size,(page+1)*size)){
            let db;try{
                db=await TransferManager.openExisting(name);const description=await TransferManager.describe(db);let header,footer;
                try{header=HistoryManager.parse(await TransferManager.readLine(db,0));TransferManager.header(header);}catch(_){}
                try{footer=HistoryManager.parse(await TransferManager.readLine(db,description.last));}catch(_){}
                const base=description.base||{},complete=header&&footer?.kind==='end'&&/^[0-9a-f]{64}$/.test(footer.checksum||'')&&description.lines>=2&&description.last===description.lines-1;
                items.push({name,fileName:typeof base.fileName==='string'?base.fileName.slice(0,260):'',createdAt:typeof base.createdAt==='string'?base.createdAt:header?.exportedAt,bytes:Number.isSafeInteger(base.bytes)&&base.bytes>=0?base.bytes:null,lines:description.lines,source:base.source==='local'?'local':'file',status:!complete?'stageIncomplete':imported.has('stream:'+footer.checksum)?'stageImported':'stageUnverified',available:true});
            }catch(_){items.push({name,fileName:'',status:'stageUnavailable',available:false,bytes:null,lines:0});}
            finally{db?.close();}
        }
        return {items,page,pages,total:names.length,incomplete:!enumerated};
    }
    static previewRow(previews,event,seq){
        if(event.kind!=='record'||event.store!=='sessions')return;
        const s=event.record,w=s.metadata?.workspace;previews.push({seq,id:s.id,name:s.name,createdAt:s.createdAt,count:w?new Set([...w.batch,...(w.single?[w.single]:[])].map(e=>e.child.id)).size:s.children.length});
        previews.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))||a.seq-b.seq);previews.splice(5);
    }
    prepared(db,lines,header,validator,hash,previews=[]){
        const prepared={format:'stream',stageName:db.name,fingerprint:'stream:'+hash,exportedAt:header.exportedAt,previews,counts:{sessions:validator.counts.sessions,children:validator.children.size,results:validator.results.size},recordCounts:{...validator.counts},recoveryJournals:validator.recovery};
        this.stages.set(prepared,{db,lines,view:JSON.stringify(prepared),header});return prepared;
    }
    async resume(name,onProgress=()=>{}){
        if(!this.storage.db)throw new Error('transferStorageRequired');
        const db=await TransferManager.openExisting(name),validator=TransferManager.validator(),previews=[];let hash='',header,ended=false;
        try{
            const description=await TransferManager.describe(db);
            if(!description.lines||description.last!==description.lines-1||description.lines>250002)throw new Error('importInvalid');
            for(let seq=0;seq<description.lines;seq++){
                const line=await TransferManager.readLine(db,seq),event=HistoryManager.parse(line);if(ended)throw new Error('importInvalid');
                if(seq===0){TransferManager.header(event);header=event;hash=await TransferManager.hash('',line);}
                else if(event.kind==='end'){TransferManager.end(event,validator,hash);ended=true;}
                else{validator.accept(event);hash=await TransferManager.hash(hash,line);TransferManager.previewRow(previews,event,seq);}
                if(seq%16===0)onProgress(seq);
            }
            if(!ended)throw new Error('importChecksum');return this.prepared(db,description.lines,header,validator,hash,previews);
        }catch(error){db.close();throw error;}
    }
    async readPreview(prepared,seq,onProgress=()=>{}){
        const stage=this.stages.get(prepared);if(!stage||JSON.stringify(prepared)!==stage.view||!prepared.previews.some(p=>p.seq===seq))throw new Error('importInvalid');
        const selectedLine=await TransferManager.readLine(stage.db,seq),selected=HistoryManager.parse(selectedLine);if(selected.kind!=='record'||selected.store!=='sessions')throw new Error('importInvalid');
        const children=new Set(selected.record.children),results=new Set(selected.record.results),related={sessions:[selected.record],children:[],results:[],settings:[]};
        const validator=TransferManager.validator();let hash='',ended=false;
        for(let i=0;i<stage.lines;i++){
            const line=await TransferManager.readLine(stage.db,i),event=HistoryManager.parse(line);if(ended)throw new Error('importInvalid');if(i===seq&&line!==selectedLine)throw new Error('importChecksum');
            if(i===0){TransferManager.header(event);hash=await TransferManager.hash('',line);}
            else if(event.kind==='end'){TransferManager.end(event,validator,hash);ended=true;}
            else{validator.accept(event);hash=await TransferManager.hash(hash,line);if(event.store==='children'&&children.has(event.record.id))related.children.push(event.record);if(event.store==='results'&&results.has(event.record.id))related.results.push(event.record);}
            if(i%16===0)onProgress(i);
        }
        if(!ended||'stream:'+hash!==prepared.fingerprint)throw new Error('importChecksum');
        return HistoryManager.sessionsFromArchive(related)[0];
    }
    async createLocalCopy(preferences,onProgress=()=>{}){
        const blob=await this.export(preferences,onProgress),prepared=await this.prepare(blob,onProgress,{source:'local',fileName:'zscore-local-'+new Date().toISOString().replace(/[:.]/g,'-')+'.zscore'});
        const name=prepared.stageName;this.release(prepared);return name;
    }
    static header(event){
        if(event.kind!=='header'||event.format!=='zscore-niger-stream')throw new Error('importInvalid');
        if(event.version!==1)throw new Error('importVersion');
        if(!Number.isFinite(Date.parse(event.exportedAt))||!event.preferences||typeof event.preferences!=='object'||Array.isArray(event.preferences))throw new Error('importInvalid');
    }
    static end(event,validator,hash){
        if(event.kind!=='end'||event.checksum!==hash)throw new Error('importChecksum');
        if(JSON.stringify(event.counts)!==JSON.stringify(validator.counts)||event.recovery!==validator.recovery)throw new Error('importInvalid');
    }
    async prepare(file,onProgress=()=>{},options={}){
        if(!this.storage.db)throw new Error('transferStorageRequired');
        const db=await TransferManager.openStage(),validator=TransferManager.validator(),previews=[];let seq=0,hash='',header,ended=false;
        try{
            if(!TransferManager.remember(db.name)){
                try{if(typeof indexedDB.databases!=='function'||!(await indexedDB.databases()).some(r=>r.name===db.name))throw new Error('stageDiscoveryPartial');}
                catch(_){throw new Error('stageDiscoveryPartial');}
            }
            await TransferManager.metadata(db,'base',{fileName:String(options.fileName||file.name||'').slice(0,260),bytes:file.size,createdAt:new Date().toISOString(),source:options.source==='local'?'local':'file'});
            for await(const line of TransferManager.lines(file)){
                const event=HistoryManager.parse(line);if(ended)throw new Error('importInvalid');
                if(seq===0){TransferManager.header(event);header=event;hash=await TransferManager.hash('',line);}
                else if(event.kind==='end'){TransferManager.end(event,validator,hash);ended=true;}
                else{validator.accept(event);hash=await TransferManager.hash(hash,line);TransferManager.previewRow(previews,event,seq);}
                await TransferManager.storeLine(db,seq++,line);
                if(seq%16===0)onProgress(seq-1);
            }
            if(!ended)throw new Error('importChecksum');
            try{await TransferManager.metadata(db,'ready',{fingerprint:'stream:'+hash,lines:seq});}catch(_){}
            return this.prepared(db,seq,header,validator,hash,previews);
        }catch(error){try{await TransferManager.metadata(db,'failed',{at:new Date().toISOString(),lines:seq});}catch(_){}db.close();throw error;}
    }
    release(prepared){const stage=this.stages.get(prepared);if(stage){stage.db.close();this.stages.delete(prepared);}}
    async hasImported(prepared){
        return (await this.storage.importFingerprints()).has(prepared.fingerprint);
    }
    static remapper(namespace){
        const maps={children:new Map(),results:new Map(),sessions:new Map()},at=new Date().toISOString();
        const id=(kind,old)=>{if(!maps[kind].has(old)){if(maps[kind].size>=2000000)throw new Error('transferTooComplex');maps[kind].set(old,kind+'_'+crypto.randomUUID());}return maps[kind].get(old);};
        const entry=item=>{item.child.id=id('children',item.child.id);if(item.result){item.result.id=id('results',item.result.id);item.result.childId=item.child.id;item.result.imported=true;}};
        return (store,value)=>{
            const r=HistoryManager.clone(value);
            if(store==='children'){r.id=id('children',r.id);if(r.sessionId)r.sessionId=id('sessions',r.sessionId);}
            else if(store==='results'){r.id=id('results',r.id);r.childId=id('children',r.childId);r.imported=true;if(r.sessionId)r.sessionId=id('sessions',r.sessionId);}
            else if(store==='sessions'){
                r.id=id('sessions',r.id);r.children=r.children.map(x=>id('children',x));r.results=r.results.map(x=>id('results',x));r.metadata={...r.metadata,importedAt:at};
                const w=r.metadata.workspace;if(w){if(w.single)entry(w.single);w.batch.forEach(entry);for(const draft of [w.draft,w.batchDraft])if(draft?.id)draft.id=id('children',draft.id);}
            }else{r.originalKey=r.key;r.key=namespace+'_'+r.key;}
            return r;
        };
    }
    async commit(prepared){
        const stage=this.stages.get(prepared);if(!stage||JSON.stringify(prepared)!==stage.view)throw new Error('importInvalid');
        if(!this.storage.db)throw new Error('transferStorageRequired');
        const namespace='import_'+crypto.randomUUID(),remap=TransferManager.remapper(namespace),validator=TransferManager.validator();
        await new Promise((resolve,reject)=>{
            const tx=this.storage.db.transaction(TransferManager.stores,'readwrite');let done=false,live=true,failure;const pending=[];
            const enqueue=(store,record)=>new Promise((resolve,reject)=>{if(!live)return reject(new Error('importStorageFailed'));pending.push({store,record,resolve,reject});});
            const fail=error=>{if(!live)return;failure||=new Error(['importInvalid','importChecksum','importVersion','transferTooComplex'].includes(error.message)?error.message:'importStorageFailed');done=true;try{tx.abort();}catch(_){live=false;reject(failure);}};
            tx.oncomplete=()=>{live=false;resolve();};tx.onabort=()=>{live=false;const error=failure||new Error('importStorageFailed');pending.splice(0).forEach(p=>p.reject(error));reject(error);};tx.onerror=()=>{failure||=new Error('importStorageFailed');};
            // Keep the target transaction open while bounded reads/hash checks run in the separate staging database.
            // This GET never changes settings. Interrupted reads or writes abort every queued ADD.
            // ADDs are dispatched only here, in an active request success event; asynchronous continuations only enqueue.
            const keepAlive=()=>{
                if(!live)return;
                for(const item of pending.splice(0)){try{tx.objectStore(item.store).add(item.record);item.resolve();}catch(error){item.reject(new Error('importStorageFailed'));fail(new Error('importStorageFailed'));return;}}
                if(done)return;const request=tx.objectStore('settings').get('__zscore_transfer_keepalive__');request.onsuccess=keepAlive;
            };keepAlive();
            (async()=>{
                let hash='',ended=false,recovery=0;
                for(let seq=0;seq<stage.lines;seq++){
                    if(!live)throw new Error('importStorageFailed');
                    const line=await TransferManager.readLine(stage.db,seq),event=HistoryManager.parse(line);
                    if(ended)throw new Error('importInvalid');
                    if(seq===0){TransferManager.header(event);if(JSON.stringify(event)!==JSON.stringify(stage.header))throw new Error('importInvalid');hash=await TransferManager.hash('',line);}
                    else if(event.kind==='end'){TransferManager.end(event,validator,hash);if('stream:'+hash!==prepared.fingerprint)throw new Error('importChecksum');ended=true;}
                    else{
                        validator.accept(event);hash=await TransferManager.hash(hash,line);
                        if(!live)throw new Error('importStorageFailed');
                        if(event.kind==='record')await enqueue(event.store,remap(event.store,event.record));
                        else await enqueue('settings',{key:namespace+'_recovery_'+recovery++,value:{recoveryJournals:[{key:event.key,raw:event.raw}]}});
                    }
                }
                if(!ended)throw new Error('importChecksum');
                await enqueue('settings',{key:namespace,value:{importFingerprint:prepared.fingerprint,preferences:stage.header.preferences,format:'stream'},updatedAt:new Date().toISOString()});done=true;
            })().catch(fail);
        });
        // The primary transaction has committed. Failure to append this informational marker must not report a failed import.
        try{await TransferManager.metadata(stage.db,'imported',{at:new Date().toISOString(),fingerprint:prepared.fingerprint});}catch(_){}
        this.release(prepared);return prepared.counts;
    }
}
if(typeof module!=='undefined'&&module.exports)module.exports={TransferManager};else window.TransferManager=TransferManager;
