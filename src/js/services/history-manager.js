/** Additive local history for the current workspace format only. */
const NutritionHistory=typeof module!=='undefined'&&module.exports?require('./nutrition-assessment.js').NutritionAssessment:NutritionAssessment;
class HistoryManager {
    constructor(storage) {
        this.storage = storage;
        this.tabId = crypto.randomUUID();
        this.journalKey = 'zscore-work-v5-' + this.tabId;
        this.lastSaved = '';
        this.recoveryErrors = [];
    }
    static emptyArchive() { return { sessions: [], children: [], results: [], settings: [] }; }
    static clone(data) { return JSON.parse(JSON.stringify(data)); }
    static hasWork(workspace) {
        const meaningfulDraft = draft => draft && (
            ['caseId', 'name', 'ageYears', 'ageMonths', 'ageDays', 'birthDate', 'weight', 'height', 'gender', 'position'].some(k => draft[k] !== '' && draft[k] !== undefined && draft[k] !== null)
            || NutritionHistory.inputFields.some(k=>draft[k]!==undefined&&draft[k]!==null&&draft[k]!=='') || draft.oedema === 'y' || ['days', 'dates'].includes(draft.ageMode)
            || !!draft.measurementDate && draft.measurementDate !== ClinicalEngine.today()
        );
        return meaningfulDraft(workspace.draft)
            || !!workspace.single || !!workspace.batch?.length || !!workspace.paste?.trim()
            || meaningfulDraft(workspace.batchDraft) || false;
    }
    makeSnapshot(workspace, reason = 'automatic') {
        const now = new Date().toISOString();
        const activeDraft = workspace.mode === 'batch' ? workspace.batchDraft : workspace.draft;
        return { id: 'session_' + crypto.randomUUID(), name: activeDraft?.name || activeDraft?.caseId || workspace.single?.child?.name || workspace.draft?.name || workspace.draft?.caseId || '', children: [], results: [], createdAt: now, updatedAt: now,
            metadata: { kind: 'workspace-v2', reason, tabId: this.tabId, workspace: HistoryManager.clone(workspace) } };
    }
    checkpoint(workspace) {
        if (!HistoryManager.hasWork(workspace)) return;
        const snapshot = this.makeSnapshot(workspace, 'checkpoint');
        localStorage.setItem(this.journalKey, JSON.stringify(snapshot));
    }
    async save(workspace, reason = 'automatic', force = false) {
        if (!HistoryManager.hasWork(workspace) && !force) return null;
        const signature = JSON.stringify(workspace);
        if (signature === this.lastSaved && !force) return null;
        const snapshot = this.makeSnapshot(workspace, reason);
        const records = HistoryManager.emptyArchive(); records.sessions.push(snapshot);
        await this.storage.addArchive(records);
        this.lastSaved = signature;
        return snapshot;
    }
    async archive() {
        const archive = await this.storage.readArchive();
        this.recoveryErrors = [];
        const journals = [];
        for (const key of Object.keys(localStorage)) {
            if (!key.startsWith('zscore-work-v5-')) continue;
            let snapshot;
            try {
                snapshot = JSON.parse(localStorage.getItem(key));
                HistoryManager.checkWorkspace(snapshot?.metadata?.workspace);
            } catch (_) {
                // Preserve the unreadable bytes; one damaged journal must not hide healthy history.
                this.recoveryErrors.push(key);
                continue;
            }
            journals.push(snapshot);
        }
        // Without a readable recovery journal, serializing every saved batch is unnecessary.
        const signatures = journals.length ? new Set(archive.sessions.filter(s => s.metadata?.workspace).map(s => JSON.stringify(s.metadata.workspace))) : new Set();
        for (const snapshot of journals) {
            const signature = JSON.stringify(snapshot.metadata.workspace);
            if (!signatures.has(signature)) { archive.sessions.push(snapshot); signatures.add(signature); }
        }
        return archive;
    }
    async list() { return HistoryManager.sessionsFromArchive(await this.archive()); }
    static sessionsFromArchive(archive) {
        for(const session of archive.sessions)HistoryManager.checkWorkspace(session.metadata?.workspace);
        return archive.sessions.slice().sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    }
    static summary(session,origin) {
        const w=session.metadata?.workspace||{},entries=[...(w.batch||[]),...(w.single?[w.single]:[])],people=[w.draft,w.batchDraft,...entries.map(e=>e.child)];
        const name=session.name||w.draft?.name||w.draft?.caseId||w.batchDraft?.name||w.batchDraft?.caseId||w.single?.child?.caseId||'';
        return {id:session.id,name,createdAt:session.createdAt,metadata:{kind:session.metadata?.kind,reason:session.metadata?.reason,importedAt:session.metadata?.importedAt},
            summary:{count:new Set(entries.map(e=>e.child.id)).size,caseIds:[...new Set(entries.map(e=>e.child.caseId).filter(Boolean))],searchText:`${session.name||''} ${people.map(c=>`${c?.name||''} ${c?.caseId||''}`).join(' ')} ${session.createdAt||''}`.toLocaleLowerCase()},origin};
    }
    async catalog() {
        if(typeof this.storage.scanHistory!=='function')return (await this.list()).map(s=>HistoryManager.summary(s,{kind:'memory',record:s}));
        this.recoveryErrors=[];const journals=[];
        for(const key of Object.keys(localStorage)){
            if(!key.startsWith('zscore-work-v5-'))continue;
            try{const snapshot=HistoryManager.parse(localStorage.getItem(key));HistoryManager.checkWorkspace(snapshot?.metadata?.workspace);journals.push({key,snapshot,signature:JSON.stringify(snapshot.metadata.workspace)});}
            catch(_){this.recoveryErrors.push(key);}
        }
        const signatures=new Set(journals.map(j=>j.signature)),matched=new Set();
        const scanned=await this.storage.scanHistory((session,origin)=>{
            if(signatures.size){const signature=JSON.stringify(session.metadata.workspace);if(signatures.has(signature))matched.add(signature);}
            return HistoryManager.summary(session,origin);
        });
        const rows=scanned.rows;
        for(const journal of journals){
            if(matched.has(journal.signature))continue;matched.add(journal.signature);
            rows.push(HistoryManager.summary(journal.snapshot,{kind:'journal',record:journal.snapshot}));
            const size=this.storage.recordSize(journal.snapshot);scanned.stats.compactBytes+=size.compact;scanned.stats.backupBytes+=size.backup+2;
        }
        this.catalogStats={...scanned.stats,backupBytes:this.recoveryErrors.length?null:scanned.stats.backupBytes,versions:rows.length};
        return rows.sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))||(a.origin.order??Infinity)-(b.origin.order??Infinity));
    }
    async version(row) {
        if(!row)return null;if(row.metadata?.workspace)return row;
        const origin=row.origin;if(!origin)return null;
        if(['journal','memory'].includes(origin.kind))return HistoryManager.clone(origin.record);
        const records=await this.storage.readHistoryRecords({sessions:[row.id]},origin),session=records.sessions[0];
        if(!session)throw new Error('historyReadFailed');
        HistoryManager.checkWorkspace(session.metadata?.workspace);return session;
    }
    static async digest(value) {
        const bytes = new TextEncoder().encode(JSON.stringify(value));
        return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
    }
    static visitKey(entry) {
        if (entry.child.visitId) return entry.child.visitId;
        const c = entry.child, r = entry.result;
        // Copies retain the calculation timestamp. Old records have no stable visit identifier.
        return JSON.stringify([c.caseId,c.gender,c.ageDays,c.ageYears,c.ageMonths,c.weight,c.height,c.position,c.oedema,c.measurementDate,r.calculatedAt,r.referenceVersion]);
    }
    async caseVisits(caseId, gender, birthDate = '') {
        const selected = new Map(); let identityConflict = false;
        for (const row of await this.catalog()) {
            if(!row.summary.caseIds.includes(caseId))continue;
            const session=await this.version(row);
            const w = session.metadata?.workspace;
            for (const entry of [...(w?.batch || []), ...(w?.single ? [w.single] : [])]) {
                if (entry.child.caseId !== caseId || !entry.result) continue;
                if (entry.child.gender !== gender || birthDate && entry.child.birthDate && birthDate !== entry.child.birthDate) { identityConflict = true; continue; }
                const key = HistoryManager.visitKey(entry), previous = selected.get(key);
                if (!previous || String(entry.result.calculatedAt) > String(previous.result.calculatedAt)) selected.set(key, entry);
            }
        }
        return { entries:[...selected.values()].sort((a,b)=>String(b.child.measurementDate || b.result.calculatedAt).localeCompare(String(a.child.measurementDate || a.result.calculatedAt)) || String(b.result.calculatedAt).localeCompare(String(a.result.calculatedAt))), identityConflict };
    }
    static counts(records) {
        const children = new Set(records.children.map(c => c.id)), results = new Set(records.results.map(r => r.id));
        for (const session of records.sessions) {
            const w = session.metadata?.workspace;
            for (const entry of [...(w?.batch || []), ...(w?.single ? [w.single] : [])]) {
                if (entry.child) children.add(entry.child.id);
                if (entry.result) results.add(entry.result.id);
            }
        }
        return { sessions: records.sessions.length, children: children.size, results: results.size };
    }
    static parse(text) {
        if (new TextEncoder().encode(text).length > 50 * 1024 * 1024) throw new Error('fileTooLarge');
        return JSON.parse(text, (key, value) => {
            if (['__proto__', 'prototype', 'constructor'].includes(key)) throw new Error('importInvalid');
            return value;
        });
    }
    static checkChild(child) {
        if (!child || typeof child.id !== 'string' || !child.id || child.id.length > 200 || typeof child.name !== 'string' || child.name.length > 100) throw new Error('importInvalid');
        if(child.ageDomainVersion!==2)throw new Error('importVersion');
        const extended=child.ageDomainVersion===2;
        NutritionHistory.normalize(child);
        if(child.muac!==undefined&&child.muac!==''&&typeof child.muac!=='number')throw new Error('importInvalid');
        for (const [key, min, max] of [['weight', 50, extended?300000:100000], ['height', 30, extended?250:150]]) ClinicalEngine.numeric(child[key], min, max, 'importInvalid');
        if (!['M', 'F'].includes(child.gender)) throw new Error('importInvalid');
        const normalized=ClinicalEngine.normalize(child,{forArchive:true,extended:true});
        if(normalized.ageDays!==child.ageDays||normalized.totalAgeMonths!==child.totalAgeMonths)throw new Error('importInvalid');
    }
    static checkPair(child,result){
        if(result)NutritionHistory.check(child,result);
        if(!result)return;
        if(result.schemaVersion!==4)throw new Error('importVersion');
        if(!result.nutrition||result.nutrition.version!==1)throw new Error('importInvalid');
        if(child.ageDomainVersion!==2||result.ageInMonths!==child.totalAgeMonths||result.referenceFamily!==(child.totalAgeMonths<60?'WHO2006':'WHO2007'))throw new Error('importInvalid');
    }
    static checkResult(result, children) {
        if (!result || typeof result.id !== 'string' || !result.id || result.id.length > 200 || !children.has(result.childId)) throw new Error('importInvalid');
        if (typeof result.calculatedAt !== 'string' || !Number.isFinite(Date.parse(result.calculatedAt))) throw new Error('importInvalid');
        for (const key of ['status','referenceVersion','engineVersion']) if (result[key] !== undefined && (typeof result[key] !== 'string' || result[key].length > 300)) throw new Error('importInvalid');
        if (result.warnings !== undefined && (!Array.isArray(result.warnings) || result.warnings.length > 50 || result.warnings.some(w => typeof w !== 'string' || w.length > 200))) throw new Error('importInvalid');
        if(result.schemaVersion!==4)throw new Error('importVersion');
        if(!result.nutrition||result.nutrition.version!==1)throw new Error('importInvalid');
        if (result.percentileVersion !== undefined && result.percentileVersion !== 1) throw new Error('importVersion');
        if (result.percentileVersion === 1 && result.schemaVersion!==4) throw new Error('importInvalid');
        const keys = ClinicalEngine.resultIndicators(result);
        if(result.schemaVersion===4){
            const age=result.ageInMonths,family=result.referenceFamily;
            if(result.percentileVersion!==1||typeof age!=='number'||!Number.isFinite(age)||age<0||age>=229||family!==(age<60?'WHO2006':'WHO2007')||!result.referenceVersion?.startsWith(family==='WHO2006'?'WHO-2006-':'WHO-2007-'))throw new Error('importInvalid');
            if(JSON.stringify(result.applicableIndicators)!==JSON.stringify(ClinicalEngine.applicable(family,age)))throw new Error('importInvalid');
            for(const key of keys){const excluded=!result.applicableIndicators.includes(key),value=result[key];if(excluded?(value?.notApplicable!==true||value?.zscore!==null||value?.error!==(key==='weightForHeight'?'noWeightForHeight2007':'weightAgeLimit2007')):value?.notApplicable===true)throw new Error('importInvalid');}
        }
        if (result.schemaVersion===4 && (!Object.hasOwn(result,'bmi') || result.bmi !== null && (typeof result.bmi !== 'number' || !Number.isFinite(result.bmi) || result.bmi <= 0))) throw new Error('importInvalid');
        for (const key of keys) {
            const v = result[key];
            if (v !== undefined && v !== null && (typeof v !== 'object' || Array.isArray(v))) throw new Error('importInvalid');
            if (v && v.zscore !== null && (typeof v.zscore !== 'number' || !Number.isFinite(v.zscore))) throw new Error('importInvalid');
            for (const field of ['classification','error','reference']) if (v?.[field] !== undefined && (typeof v[field] !== 'string' || v[field].length > 300)) throw new Error('importInvalid');
            if (v?.flagged !== undefined && typeof v.flagged !== 'boolean') throw new Error('importInvalid');
            if (!v) throw new Error('importInvalid');
            if (v.zscore !== null) {
                const categories = {weightForAge:['underweightSevere','underweightModerate','withinReference'],heightForAge:['stuntingSevere','stuntingModerate','withinReference'],weightForHeight:['wastingSevere','wastingModerate','withinReference','riskOverweight','overweight','obesity'],bmiForAge:['bmiBelow3','bmiBelow2','bmiWithin','bmiAbove1','bmiAbove2','bmiAbove3']};
                const flagged = key === 'weightForAge' ? v.zscore < -6 || v.zscore > 5 : Math.abs(v.zscore) > (key === 'heightForAge' ? 6 : 5);
                if (!categories[key].includes(v.classification) || v.flagged !== flagged || v.reference !== result.referenceVersion) throw new Error('importInvalid');
            }
            if (v.zscore === null && !v.error) throw new Error('importInvalid');
            if (result.percentileVersion === 1) {
                if (v.zscore === null) {
                    if (v.zscoreRaw !== null || v.percentile !== null || v.percentileStatus !== 'percentileUnavailable') throw new Error('importInvalid');
                } else {
                    if (typeof v.zscoreRaw !== 'number' || !Number.isFinite(v.zscoreRaw) || Math.round(v.zscoreRaw * 100) / 100 !== v.zscore || ClinicalEngine.category(key,v.zscoreRaw) !== v.classification) throw new Error('importInvalid');
                    const expected = ClinicalEngine.percentileFields(v.zscoreRaw);
                    if (v.percentile !== expected.percentile || v.percentileStatus !== expected.percentileStatus) throw new Error('importInvalid');
                }
            }
        }
        {
            const indicators = (result.applicableIndicators).map(k => result[k]);
            const expectedStatus = indicators.some(v => v.zscore === null) ? 'incomplete' : indicators.some(v => v.flagged) ? 'checkMeasures' : 'complete';
            if (result.status !== expectedStatus || !result.referenceVersion || !result.engineVersion) throw new Error('importInvalid');
        }
        if (result.schemaVersion===4 && (result.bmiForAge.zscore === null ? result.bmi !== null : result.bmi === null)) throw new Error('importInvalid');
    }
    static checkWorkspace(workspace) {
        if (!workspace || workspace.version !== 1 || !Array.isArray(workspace.batch) || workspace.batch.length > 5000) throw new Error('importInvalid');
        if (workspace.mode !== undefined && !['single','batch'].includes(workspace.mode)) throw new Error('importInvalid');
        for (const draft of [workspace.draft || {}, workspace.batchDraft || {}]) {
            if (typeof draft !== 'object' || Array.isArray(draft)) throw new Error('importInvalid');
            for (const v of Object.values(draft)) if (!['string', 'number', 'boolean'].includes(typeof v) && v !== null) throw new Error('importInvalid');
        }
        if (workspace.paste !== undefined && typeof workspace.paste !== 'string') throw new Error('importInvalid');
        for (const entry of [...workspace.batch, ...(workspace.single ? [workspace.single] : [])]) {
            if (!entry || typeof entry !== 'object' || !entry.child) throw new Error('importInvalid');
            HistoryManager.checkChild(entry.child);
            if (entry.result) HistoryManager.checkResult(entry.result, new Set([entry.child.id]));
            HistoryManager.checkPair(entry.child,entry.result);
        }
    }
}
if (typeof module !== 'undefined' && module.exports) module.exports = { HistoryManager };
else window.HistoryManager = HistoryManager;
