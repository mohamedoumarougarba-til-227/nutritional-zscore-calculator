/**
 * Storage Manager Service
 * Manages local data persistence using IndexedDB and localStorage
 */

class StorageManager {
    constructor() {
        this.dbName = 'ZScoreNiger-v5';
        this.dbVersion = 1;
        this.db = null;
        this.isInitialized = false;

        // Store names
        this.stores = {
            sessions: 'sessions',
            children: 'children',
            results: 'results',
            settings: 'settings'
        };
    }

    /**
     * Initialize the storage manager
     * @returns {Promise<boolean>} True if initialized successfully
     */
    async initialize() {
        try {
            if (!this._isIndexedDBSupported()) {
                console.warn('IndexedDB not supported, falling back to localStorage only');
                this.isInitialized = true;
                return true;
            }

            await this._initializeIndexedDB();
            this.isInitialized = true;
            console.log('StorageManager initialized successfully');
            return true;

        } catch (error) {
            console.error('StorageManager initialization failed:', error);
            throw error;
        }
    }

    /**
     * Check if IndexedDB is supported
     * @private
     * @returns {boolean} True if supported
     */
    _isIndexedDBSupported() {
        return 'indexedDB' in window && indexedDB !== null;
    }

    /**
     * Initialize IndexedDB
     * @private
     * @returns {Promise<void>}
     */
    async _initializeIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                reject(new Error('Failed to open IndexedDB'));
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create sessions store
                if (!db.objectStoreNames.contains(this.stores.sessions)) {
                    const sessionsStore = db.createObjectStore(this.stores.sessions, { keyPath: 'id' });
                    sessionsStore.createIndex('timestamp', 'timestamp', { unique: false });
                    sessionsStore.createIndex('name', 'name', { unique: false });
                }

                // Create children store
                if (!db.objectStoreNames.contains(this.stores.children)) {
                    const childrenStore = db.createObjectStore(this.stores.children, { keyPath: 'id' });
                    childrenStore.createIndex('sessionId', 'sessionId', { unique: false });
                    childrenStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                // Create results store
                if (!db.objectStoreNames.contains(this.stores.results)) {
                    const resultsStore = db.createObjectStore(this.stores.results, { keyPath: 'id' });
                    resultsStore.createIndex('childId', 'childId', { unique: false });
                    resultsStore.createIndex('sessionId', 'sessionId', { unique: false });
                    resultsStore.createIndex('calculatedAt', 'calculatedAt', { unique: false });
                }

                // Create settings store
                if (!db.objectStoreNames.contains(this.stores.settings)) {
                    db.createObjectStore(this.stores.settings, { keyPath: 'key' });
                }
            };
        });
    }

    /** Read all user records in one consistent transaction; never include admin credentials. */
    async readArchive() {
        const names = Object.values(this.stores);
        let records = Object.fromEntries(names.map(name => [name, []]));
        if (this.db) {
            records = await new Promise((resolve, reject) => {
                const transaction = this.db.transaction(names, 'readonly');
                for (const name of names) {
                    const request = transaction.objectStore(name).getAll();
                    request.onsuccess = () => { records[name] = request.result; };
                }
                transaction.oncomplete = () => resolve(records);
                transaction.onerror = transaction.onabort = () => reject(new Error('Lecture de la sauvegarde impossible'));
            });
        } else {
            for (const key of Object.keys(localStorage)) {
                const name = key.startsWith('zscore-current-session_') ? 'sessions' : key.startsWith('zscore-current-child_') ? 'children' : key.startsWith('zscore-current-result_') ? 'results' : null;
                if (name) records[name].push(JSON.parse(localStorage.getItem(key)));
            }
            const settings = localStorage.getItem('zscore-current-settings');
            if (settings) records.settings.push({ key: 'userSettings', value: JSON.parse(settings) });
        }
        // Each fallback import is committed as one JSON item, so a quota failure cannot partially import it.
        for (const key of Object.keys(localStorage)) {
            if (!key.startsWith('zscore-current-archive-')) continue;
            const extra = JSON.parse(localStorage.getItem(key));
            for (const name of names) records[name].push(...extra[name]);
        }
        return records;
    }

    recordSize(record) {
        const json=JSON.stringify(record);
        if(json===undefined)throw new TypeError('Record is not JSON serializable');
        const compact=new TextEncoder().encode(json).length;
        // Count exactly the whitespace added by JSON.stringify(..., null, 2),
        // with the record indented six spaces in records/store. No second full
        // serialization, pretty string, newline array or encoded pretty buffer.
        let extra=6,depth=0;
        for(let i=0;i<json.length;i++){
            const code=json.charCodeAt(i);
            if(code===34){
                while(++i<json.length){const ch=json.charCodeAt(i);if(ch===92)i++;else if(ch===34)break;}
            }else if(code===123||code===91){
                depth++;
                if(json.charCodeAt(i+1)!==(code===123?125:93))extra+=7+2*depth;
            }else if(code===125||code===93){
                depth--;
                const previous=json.charCodeAt(i-1);
                if(previous!==123&&previous!==91)extra+=7+2*depth;
            }else if(code===44)extra+=7+2*depth;
            else if(code===58)extra++;
        }
        return {compact,backup:compact+extra};
    }

    /** Synchronous visitor in one readonly transaction: no full archive retained. */
    async visitArchive(visitor) {
        const names=Object.values(this.stores);
        if(this.db)await new Promise((resolve,reject)=>{
            const tx=this.db.transaction(names,'readonly');tx.oncomplete=resolve;
            tx.onabort=tx.onerror=()=>reject(new Error('historyReadFailed'));
            for(const name of names){const request=tx.objectStore(name).openCursor();request.onsuccess=()=>{
                const cursor=request.result;if(!cursor)return;
                try{visitor(name,cursor.value);cursor.continue();}catch(error){tx.abort();reject(error);}
            };}
        });
        else for(const key of Object.keys(localStorage)){
            const name=key.startsWith('zscore-current-session_')?'sessions':key.startsWith('zscore-current-child_')?'children':key.startsWith('zscore-current-result_')?'results':key==='userSettings'?'settings':null;
            if(name){const value=JSON.parse(localStorage.getItem(key));visitor(name,name==='settings'?{key:'userSettings',value}:value);}
        }
        for(const key of Object.keys(localStorage))if(key.startsWith('zscore-current-archive-')){
            const records=JSON.parse(localStorage.getItem(key));for(const name of names)for(const record of records[name]||[])visitor(name,record);
        }
    }

    async importFingerprints(){
        const fingerprints=new Set(),visit=record=>{if(typeof record.value?.importFingerprint==='string')fingerprints.add(record.value.importFingerprint);};
        if(this.db)await new Promise((resolve,reject)=>{
            const tx=this.db.transaction(this.stores.settings,'readonly'),request=tx.objectStore(this.stores.settings).openCursor();
            request.onsuccess=()=>{const cursor=request.result;if(cursor){visit(cursor.value);cursor.continue();}};
            tx.oncomplete=resolve;tx.onabort=tx.onerror=()=>reject(new Error('historyReadFailed'));
        });
        for(const key of Object.keys(localStorage))if(key.startsWith('zscore-current-archive-'))for(const record of JSON.parse(localStorage.getItem(key)).settings||[])visit(record);
        return fingerprints;
    }

    /** Project workspace versions as each cursor yields them; no schema change or write. */
    async scanHistory(project) {
        const names=Object.values(this.stores);
        const rows=[],origins=new Map(),linkedChildren=new Set(),stats={records:0,compactBytes:0,backupBytes:2048};let sessionOrder=0;
        const consume=(name,record,origin)=>{
            const size=this.recordSize(record);stats.records++;stats.compactBytes+=size.compact;stats.backupBytes+=size.backup+2;
            if(name===this.stores.sessions){
                origin.order=sessionOrder++;
                for(const id of Array.isArray(record.children)?record.children:record.children?[record.children]:[])linkedChildren.add(id);
                origins.set(record.id,origin);
                if(record.metadata?.workspace){const row=project(record,origin);if(row)rows.push(row);}
                else throw new Error('importVersion');
            }
        };
        if(this.db){
            await new Promise((resolve,reject)=>{
                const transaction=this.db.transaction(names,'readonly');
                transaction.oncomplete=resolve;
                transaction.onerror=transaction.onabort=()=>reject(new Error('historyReadFailed'));
                for(const name of names){
                    const request=transaction.objectStore(name).openCursor();
                    request.onsuccess=()=>{
                        const cursor=request.result;if(!cursor)return;
                        try{consume(name,cursor.value,{kind:'stored',id:cursor.value.id});cursor.continue();}
                        catch(_){transaction.abort();reject(new Error('historyReadFailed'));}
                    };
                }
            });
        }else{
            for(const key of Object.keys(localStorage)){
                const name=key.startsWith('zscore-current-session_')?'sessions':key.startsWith('zscore-current-child_')?'children':key.startsWith('zscore-current-result_')?'results':null;
                if(name)consume(name,JSON.parse(localStorage.getItem(key)),{kind:'stored',key});
            }
            const settings=localStorage.getItem('zscore-current-settings');if(settings)consume('settings',{key:'userSettings',value:JSON.parse(settings)},{kind:'stored'});
        }
        for(const key of Object.keys(localStorage)){
            if(!key.startsWith('zscore-current-archive-'))continue;
            const extra=JSON.parse(localStorage.getItem(key));
            for(const name of names)for(const record of extra[name]||[])consume(name,record,{kind:'stored',key,group:true});
        }
        return {rows,origins,linkedChildren,stats};
    }

    /** Read only the requested records. Import groups from the fallback remain append-only. */
    async readHistoryRecords(wanted,origin=null) {
        const names=['sessions','children','results'],found=Object.fromEntries(names.map(n=>[n,new Map()]));
        if(this.db){
            await new Promise((resolve,reject)=>{
                const transaction=this.db.transaction(names,'readonly');transaction.oncomplete=resolve;
                transaction.onerror=transaction.onabort=()=>reject(new Error('historyReadFailed'));
                for(const name of names)for(const id of wanted[name]||[]){
                    const request=transaction.objectStore(name).get(id);request.onsuccess=()=>{if(request.result)found[name].set(id,request.result);};
                }
            });
        }else{
            for(const name of names)for(const id of wanted[name]||[]){
                const prefix={sessions:'zscore-current-session_',children:'zscore-current-child_',results:'zscore-current-result_'}[name],raw=localStorage.getItem(prefix+id);
                if(raw)found[name].set(id,JSON.parse(raw));
            }
        }
        const keys=origin?.group&&wanted.sessions?.length&&!wanted.children?.length&&!wanted.results?.length?[origin.key]:Object.keys(localStorage).filter(key=>key.startsWith('zscore-current-archive-'));
        for(const key of keys){
            const raw=localStorage.getItem(key);if(!raw)continue;const extra=JSON.parse(raw);
            for(const name of names)for(const record of extra[name]||[])if((wanted[name]||[]).includes(record.id))found[name].set(record.id,record);
        }
        return Object.fromEntries(names.map(name=>[name,(wanted[name]||[]).map(id=>found[name].get(id)).filter(Boolean)]));
    }

    /** Append only. IndexedDB add (not put) rejects collisions and the transaction rolls back. */
    async addArchive(records) {
        const names = Object.values(this.stores);
        if (!this.db) {
            const key = 'zscore-current-archive-' + crypto.randomUUID();
            localStorage.setItem(key, JSON.stringify(records));
            return;
        }
        await new Promise((resolve, reject) => {
            const transaction = this.db.transaction(names, 'readwrite');
            transaction.oncomplete = () => resolve();
            transaction.onerror = transaction.onabort = () => reject(new Error('Ajout annulé : stockage plein ou identifiant déjà présent'));
            try {
                for (const name of names) {
                    for (const record of records[name] || []) transaction.objectStore(name).add(record);
                }
            } catch (error) {
                transaction.abort();
                reject(error);
            }
        });
    }

}
if(typeof module!=='undefined'&&module.exports)module.exports={StorageManager};else window.StorageManager=StorageManager;
