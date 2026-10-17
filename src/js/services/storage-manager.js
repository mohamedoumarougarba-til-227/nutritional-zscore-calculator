/**
 * Storage Manager Service
 * Manages local data persistence using IndexedDB and localStorage
 */

class StorageManager {
    constructor() {
        this.dbName = 'ZScoreCalculatorDB';
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

    /**
     * Save session data
     * @param {Object} sessionData - Session data to save
     * @returns {Promise<string>} Session ID
     */
    async saveSession(sessionData) {
        const session = {
            id: sessionData.id || this._generateId('session'),
            name: sessionData.name || `Session ${new Date().toLocaleDateString()}`,
            children: sessionData.children || [],
            results: sessionData.results || [],
            createdAt: sessionData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: sessionData.metadata || {}
        };

        try {
            if (this.db) {
                await this._saveToIndexedDB(this.stores.sessions, session);
            } else {
                await this._saveToLocalStorage(`session_${session.id}`, session);
            }

            console.log(`Session saved: ${session.id}`);
            return session.id;

        } catch (error) {
            throw new Error(`Failed to save session: ${error.message}`);
        }
    }

    /**
     * Load session data
     * @param {string} sessionId - Session ID to load
     * @returns {Promise<Object|null>} Session data or null if not found
     */
    async loadSession(sessionId) {
        try {
            let session;
            
            if (this.db) {
                session = await this._loadFromIndexedDB(this.stores.sessions, sessionId);
            } else {
                session = await this._loadFromLocalStorage(`session_${sessionId}`);
            }

            if (session) {
                console.log(`Session loaded: ${sessionId}`);
            }

            return session;

        } catch (error) {
            console.error(`Failed to load session ${sessionId}:`, error);
            return null;
        }
    }

    /**
     * Get all sessions
     * @returns {Promise<Array>} Array of session summaries
     */
    async getAllSessions() {
        try {
            let sessions;
            
            if (this.db) {
                sessions = await this._getAllFromIndexedDB(this.stores.sessions);
            } else {
                sessions = await this._getAllSessionsFromLocalStorage();
            }

            // Return summary information only
            return sessions.map(session => ({
                id: session.id,
                name: session.name,
                childrenCount: session.children?.length || 0,
                resultsCount: session.results?.length || 0,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt
            }));

        } catch (error) {
            console.error('Failed to get all sessions:', error);
            return [];
        }
    }

    /**
     * Delete session
     * @param {string} sessionId - Session ID to delete
     * @returns {Promise<boolean>} True if deleted successfully
     */
    async deleteSession(sessionId) {
        try {
            if (this.db) {
                await this._deleteFromIndexedDB(this.stores.sessions, sessionId);
                // Also delete related children and results
                await this._deleteByIndex(this.stores.children, 'sessionId', sessionId);
                await this._deleteByIndex(this.stores.results, 'sessionId', sessionId);
            } else {
                await this._deleteFromLocalStorage(`session_${sessionId}`);
            }

            console.log(`Session deleted: ${sessionId}`);
            return true;

        } catch (error) {
            console.error(`Failed to delete session ${sessionId}:`, error);
            return false;
        }
    }

    /**
     * Save child data
     * @param {Child} child - Child instance to save
     * @param {string} [sessionId] - Associated session ID
     * @returns {Promise<string>} Child ID
     */
    async saveChild(child, sessionId = null) {
        const childData = {
            ...child.toJSON(),
            sessionId: sessionId
        };

        try {
            if (this.db) {
                await this._saveToIndexedDB(this.stores.children, childData);
            } else {
                await this._saveToLocalStorage(`child_${child.id}`, childData);
            }

            console.log(`Child saved: ${child.id}`);
            return child.id;

        } catch (error) {
            throw new Error(`Failed to save child: ${error.message}`);
        }
    }

    /**
     * Load child data
     * @param {string} childId - Child ID to load
     * @returns {Promise<Child|null>} Child instance or null if not found
     */
    async loadChild(childId) {
        try {
            let childData;
            
            if (this.db) {
                childData = await this._loadFromIndexedDB(this.stores.children, childId);
            } else {
                childData = await this._loadFromLocalStorage(`child_${childId}`);
            }

            if (childData) {
                return Child.fromJSON(childData);
            }

            return null;

        } catch (error) {
            console.error(`Failed to load child ${childId}:`, error);
            return null;
        }
    }

    /**
     * Save Z-score result
     * @param {ZScoreResult} result - Result instance to save
     * @param {string} [sessionId] - Associated session ID
     * @returns {Promise<string>} Result ID
     */
    async saveResult(result, sessionId = null) {
        const resultData = {
            ...result.toJSON(),
            sessionId: sessionId
        };

        try {
            if (this.db) {
                await this._saveToIndexedDB(this.stores.results, resultData);
            } else {
                await this._saveToLocalStorage(`result_${result.id}`, resultData);
            }

            console.log(`Result saved: ${result.id}`);
            return result.id;

        } catch (error) {
            throw new Error(`Failed to save result: ${error.message}`);
        }
    }

    /**
     * Load Z-score result
     * @param {string} resultId - Result ID to load
     * @returns {Promise<ZScoreResult|null>} Result instance or null if not found
     */
    async loadResult(resultId) {
        try {
            let resultData;
            
            if (this.db) {
                resultData = await this._loadFromIndexedDB(this.stores.results, resultId);
            } else {
                resultData = await this._loadFromLocalStorage(`result_${resultId}`);
            }

            if (resultData) {
                return ZScoreResult.fromJSON(resultData);
            }

            return null;

        } catch (error) {
            console.error(`Failed to load result ${resultId}:`, error);
            return null;
        }
    }

    /**
     * Save user settings
     * @param {UserSettings} settings - Settings instance to save
     * @returns {Promise<boolean>} True if saved successfully
     */
    async saveSettings(settings) {
        const settingsData = {
            key: 'userSettings',
            value: settings.toJSON(),
            updatedAt: new Date().toISOString()
        };

        try {
            if (this.db) {
                await this._saveToIndexedDB(this.stores.settings, settingsData);
            } else {
                await this._saveToLocalStorage('userSettings', settingsData.value);
            }

            console.log('User settings saved');
            return true;

        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    /**
     * Load user settings
     * @returns {Promise<UserSettings|null>} Settings instance or null if not found
     */
    async loadSettings() {
        try {
            let settingsData;
            
            if (this.db) {
                const record = await this._loadFromIndexedDB(this.stores.settings, 'userSettings');
                settingsData = record?.value;
            } else {
                settingsData = await this._loadFromLocalStorage('userSettings');
            }

            if (settingsData) {
                return UserSettings.fromJSON(settingsData);
            }

            return null;

        } catch (error) {
            console.error('Failed to load settings:', error);
            return null;
        }
    }

    /**
     * Export session data to JSON
     * @param {string} sessionId - Session ID to export
     * @returns {Promise<string>} JSON string
     */
    async exportSession(sessionId) {
        const session = await this.loadSession(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        // Load all related children and results
        const children = [];
        const results = [];

        for (const childId of session.children) {
            const child = await this.loadChild(childId);
            if (child) {
                children.push(child.toJSON());
            }
        }

        for (const resultId of session.results) {
            const result = await this.loadResult(resultId);
            if (result) {
                results.push(result.toJSON());
            }
        }

        const exportData = {
            session: session,
            children: children,
            results: results,
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Import session data from JSON
     * @param {string} jsonData - JSON string to import
     * @returns {Promise<string>} Imported session ID
     */
    async importSession(jsonData) {
        try {
            const importData = JSON.parse(jsonData);
            
            // Validate import data structure
            if (!importData.session || !importData.children || !importData.results) {
                throw new Error('Invalid import data structure');
            }

            // Generate new IDs to avoid conflicts
            const newSessionId = this._generateId('session');
            const session = {
                ...importData.session,
                id: newSessionId,
                name: `${importData.session.name} (Imported)`,
                importedAt: new Date().toISOString()
            };

            // Import children with new IDs
            const childIdMap = new Map();
            for (const childData of importData.children) {
                const newChildId = this._generateId('child');
                childIdMap.set(childData.id, newChildId);
                
                const child = Child.fromJSON({
                    ...childData,
                    id: newChildId
                });
                
                await this.saveChild(child, newSessionId);
            }

            // Import results with updated child IDs
            const resultIds = [];
            for (const resultData of importData.results) {
                const newResultId = this._generateId('result');
                const newChildId = childIdMap.get(resultData.childId);
                
                if (newChildId) {
                    const result = ZScoreResult.fromJSON({
                        ...resultData,
                        id: newResultId,
                        childId: newChildId
                    });
                    
                    await this.saveResult(result, newSessionId);
                    resultIds.push(newResultId);
                }
            }

            // Update session with new child and result IDs
            session.children = Array.from(childIdMap.values());
            session.results = resultIds;

            await this.saveSession(session);

            console.log(`Session imported: ${newSessionId}`);
            return newSessionId;

        } catch (error) {
            throw new Error(`Failed to import session: ${error.message}`);
        }
    }

    /**
     * Clear all data
     * @returns {Promise<boolean>} True if cleared successfully
     */
    async clearAllData() {
        try {
            if (this.db) {
                const stores = Object.values(this.stores);
                for (const storeName of stores) {
                    await this._clearStore(storeName);
                }
            } else {
                // Clear localStorage
                const keys = Object.keys(localStorage);
                for (const key of keys) {
                    if (key.startsWith('zscore-') || 
                        key.startsWith('session_') || 
                        key.startsWith('child_') || 
                        key.startsWith('result_') ||
                        key === 'userSettings') {
                        localStorage.removeItem(key);
                    }
                }
            }

            console.log('All data cleared');
            return true;

        } catch (error) {
            console.error('Failed to clear data:', error);
            return false;
        }
    }

    /**
     * Get storage statistics
     * @returns {Promise<Object>} Storage statistics
     */
    async getStorageStats() {
        const stats = {
            type: this.db ? 'IndexedDB' : 'localStorage',
            sessions: 0,
            children: 0,
            results: 0,
            totalSize: 0
        };

        try {
            if (this.db) {
                stats.sessions = await this._getStoreCount(this.stores.sessions);
                stats.children = await this._getStoreCount(this.stores.children);
                stats.results = await this._getStoreCount(this.stores.results);
            } else {
                // Count localStorage items
                const keys = Object.keys(localStorage);
                for (const key of keys) {
                    if (key.startsWith('session_')) stats.sessions++;
                    if (key.startsWith('child_')) stats.children++;
                    if (key.startsWith('result_')) stats.results++;
                    
                    stats.totalSize += localStorage.getItem(key).length;
                }
            }

            return stats;

        } catch (error) {
            console.error('Failed to get storage stats:', error);
            return stats;
        }
    }

    // Private helper methods for IndexedDB operations

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
                const name = key.startsWith('session_') ? 'sessions' : key.startsWith('child_') ? 'children' : key.startsWith('result_') ? 'results' : null;
                if (name) records[name].push(JSON.parse(localStorage.getItem(key)));
            }
            const settings = localStorage.getItem('userSettings');
            if (settings) records.settings.push({ key: 'userSettings', value: JSON.parse(settings) });
        }
        // Each fallback import is committed as one JSON item, so a quota failure cannot partially import it.
        for (const key of Object.keys(localStorage)) {
            if (!key.startsWith('zscore-archive-add-')) continue;
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
            const name=key.startsWith('session_')?'sessions':key.startsWith('child_')?'children':key.startsWith('result_')?'results':key==='userSettings'?'settings':null;
            if(name){const value=JSON.parse(localStorage.getItem(key));visitor(name,name==='settings'?{key:'userSettings',value}:value);}
        }
        for(const key of Object.keys(localStorage))if(key.startsWith('zscore-archive-add-')){
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
        for(const key of Object.keys(localStorage))if(key.startsWith('zscore-archive-add-'))for(const record of JSON.parse(localStorage.getItem(key)).settings||[])visit(record);
        return fingerprints;
    }

    /** Project workspace versions as each cursor yields them; no schema change or write. */
    async scanHistory(project) {
        const names=Object.values(this.stores),legacy=Object.fromEntries(names.map(name=>[name,[]]));
        const rows=[],origins=new Map(),linkedChildren=new Set(),stats={records:0,compactBytes:0,backupBytes:2048};let sessionOrder=0;
        const consume=(name,record,origin)=>{
            const size=this.recordSize(record);stats.records++;stats.compactBytes+=size.compact;stats.backupBytes+=size.backup+2;
            if(name===this.stores.sessions){
                origin.order=sessionOrder++;
                for(const id of Array.isArray(record.children)?record.children:record.children?[record.children]:[])linkedChildren.add(id);
                origins.set(record.id,origin);
                if(record.metadata?.workspace){const row=project(record,origin);if(row)rows.push(row);}
                else legacy.sessions.push(record);
            }else if(name!==this.stores.settings)legacy[name].push(record);
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
                const name=key.startsWith('session_')?'sessions':key.startsWith('child_')?'children':key.startsWith('result_')?'results':null;
                if(name)consume(name,JSON.parse(localStorage.getItem(key)),{kind:'stored',key});
            }
            const settings=localStorage.getItem('userSettings');if(settings)consume('settings',{key:'userSettings',value:JSON.parse(settings)},{kind:'stored'});
        }
        for(const key of Object.keys(localStorage)){
            if(!key.startsWith('zscore-archive-add-'))continue;
            const extra=JSON.parse(localStorage.getItem(key));
            for(const name of names)for(const record of extra[name]||[])consume(name,record,{kind:'stored',key,group:true});
        }
        return {rows,legacy,origins,linkedChildren,stats};
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
                const prefix={sessions:'session_',children:'child_',results:'result_'}[name],raw=localStorage.getItem(prefix+id);
                if(raw)found[name].set(id,JSON.parse(raw));
            }
        }
        const keys=origin?.group&&wanted.sessions?.length&&!wanted.children?.length&&!wanted.results?.length?[origin.key]:Object.keys(localStorage).filter(key=>key.startsWith('zscore-archive-add-'));
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
            const key = 'zscore-archive-add-' + crypto.randomUUID();
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

    async _saveToIndexedDB(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            // A successful request may still be rolled back by a failed transaction.
            transaction.oncomplete = () => resolve();
            transaction.onabort = () => reject(new Error('IndexedDB transaction aborted'));
            transaction.onerror = () => reject(new Error('IndexedDB transaction failed'));
            request.onerror = () => reject(new Error('IndexedDB save failed'));
        });
    }

    async _loadFromIndexedDB(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('IndexedDB load failed'));
        });
    }

    async _getAllFromIndexedDB(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('IndexedDB getAll failed'));
        });
    }

    async _deleteFromIndexedDB(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('IndexedDB delete failed'));
        });
    }

    async _deleteByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.openCursor(IDBKeyRange.only(value));

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };

            request.onerror = () => reject(new Error('IndexedDB delete by index failed'));
        });
    }

    async _clearStore(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('IndexedDB clear failed'));
        });
    }

    async _getStoreCount(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('IndexedDB count failed'));
        });
    }

    // Private helper methods for localStorage operations

    async _saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            throw new Error(`localStorage save failed: ${error.message}`);
        }
    }

    async _loadFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`localStorage load failed for ${key}:`, error);
            return null;
        }
    }

    async _deleteFromLocalStorage(key) {
        localStorage.removeItem(key);
    }

    async _getAllSessionsFromLocalStorage() {
        const sessions = [];
        const keys = Object.keys(localStorage);
        
        for (const key of keys) {
            if (key.startsWith('session_')) {
                try {
                    const session = JSON.parse(localStorage.getItem(key));
                    sessions.push(session);
                } catch (error) {
                    console.error(`Failed to parse session ${key}:`, error);
                }
            }
        }
        
        return sessions;
    }

    /**
     * Generate unique ID
     * @private
     * @param {string} prefix - ID prefix
     * @returns {string} Unique ID
     */
    _generateId(prefix) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `${prefix}_${timestamp}_${random}`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageManager };
} else {
    window.StorageManager = StorageManager;
}
