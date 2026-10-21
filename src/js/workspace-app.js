/** Public, local-first workspace: no administrator credentials and no remote mutation API. */
const NutritionUI=typeof module!=='undefined'&&module.exports?require('./services/nutrition-assessment.js').NutritionAssessment:globalThis.NutritionAssessment;
const SecureBackup=typeof module!=='undefined'&&module.exports?require('./services/encrypted-backup.js').EncryptedBackup:globalThis.EncryptedBackup;
const ReportingUI=typeof module!=='undefined'&&module.exports?require('./services/reporting-export.js').ReportingExport:globalThis.ReportingExport;
class WorkspaceApp {
    static version = '5.2.1';
    static resultIndicators(result) { return result?.applicableIndicators||ClinicalEngine.indicators; }
    percentileHTML(value,result) {
        if (result?.schemaVersion!==4 || result.percentileVersion!==1 || !Number.isFinite(value?.zscore)) return '';
        const numeric=typeof value.percentile==='number'&&Number.isFinite(value.percentile)&&value.percentile>0&&value.percentile<100&&!value.flagged;
        const label=numeric?this.t('percentileLabel')+' : '+this.number(value.percentile,1):this.t('percentileExtreme');
        return `<span class="centile" title="${this.esc(numeric?this.t('centileHelp'):label)}" aria-label="${this.esc(label)}"><bdi dir="ltr">P ${numeric?this.number(value.percentile,1):'—'}</bdi></span>`;
    }
    constructor() {
        this.storage = new StorageManager(); this.history = new HistoryManager(this.storage);
        this.state = this.emptyWorkspace(); this.page = 'single'; this.historyPage = 0; this.search = '';
        this.batchPage = 0; this.singleEditing = false;
        this.sessions = []; this.preparedImport = null; this.saving = Promise.resolve();
        this.saveState = 'ready'; this.translations = null; this.engine = null; this.offlineState = 'offlineLoading';
        let prefs = {};
        try { prefs = JSON.parse(localStorage.getItem('zscore-ui-v2') || '{}'); } catch (_) { /* Keep work independent of optional settings. */ }
        this.prefs = { language: ['fr', 'en', 'ar'].includes(prefs.language) ? prefs.language : localStorage.getItem('zscore-app-language') || 'fr', theme: ['light', 'dark', 'system'].includes(prefs.theme) ? prefs.theme : 'system' };
        if (!['fr', 'en', 'ar'].includes(this.prefs.language)) this.prefs.language = 'fr';
        this.prefs.navCollapsed = prefs.navCollapsed === true;
    }
    emptyDraft() { return { caseId: '', name: '', ageMode: 'months', ageYears: '', ageMonths: '', ageDays: '', birthDate: '', measurementDate: ClinicalEngine.today(), weight: '', height: '', gender: '', position: '', oedema: '' }; }
    emptyWorkspace() { return { version: 1, draft: this.emptyDraft(), batchDraft: this.emptyDraft(), single: null, batch: [], paste: '', mode: 'single', stale: false }; }
    t(key) { const own=table=>table&&Object.hasOwn(table,key)&&typeof table[key]==='string'?table[key]:'';return own(this.translations?.[this.prefs.language])||own(this.translations?.fr)||String(key??''); }
    esc(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
    transfers(){return this.transfer||=new TransferManager(this.storage);}
    transferStatus(done=null){const target=document.getElementById('transfer-status');if(target)target.textContent=done===null?'':typeof done==='number'?this.t('transferProgress').replace('{done}',this.number(done,0)):this.t('transferPreparing');}
    stagesHTML(){
        const info=this.stageInfo,busy=this.stageBusy||this.transferBusy;
        return `<h2 id="stage-copies-title">${this.t('stageTitle')}</h2><p class="hint">${this.t('stageHelp')}</p><div class="toolbar"><button class="btn" data-action="stage-local-copy" ${busy?'disabled':''}>${this.t('stageCreate')}</button><button class="btn" data-action="stage-refresh" ${busy?'disabled':''}>${this.t('stageRefresh')}</button></div>${this.stageBusy?`<p role="status">${this.t('transferPreparing')}</p>`:''}${info?.incomplete?`<p class="notice warn">${this.t('stageDiscoveryPartial')}</p>`:''}${!info?`<p class="meta">${this.t('stageNotLoaded')}</p>`:info.items.length?info.items.map(s=>`<article class="history-item"><div><div class="item-title"><bdi dir="auto">${this.esc(s.fileName||this.t('stageUnnamed'))}</bdi></div><p class="item-sub">${this.t(s.source==='local'?'stageLocal':'stageFile')} · ${this.date(s.createdAt)}<br>${this.t(s.status)} · ${this.formatBytes(s.bytes)}<br><bdi dir="ltr">${this.esc(s.name.slice(-12))}</bdi></p></div><button class="btn" data-action="stage-review" data-name="${this.esc(s.name)}" ${s.available&&!busy?'':'disabled'}>${this.t('stageReview')}</button></article>`).join(''):`<p>${this.t('stageEmpty')}</p>`}${info?`<div class="pagination"><button class="btn" data-action="stage-previous" ${busy||info.page===0?'disabled':''}>${this.t('previous')}</button><span role="status">${this.t('page')} ${info.page+1}/${info.pages} · ${info.total} ${this.t('stageCopies')}</span><button class="btn" data-action="stage-next" ${busy||info.page>=info.pages-1?'disabled':''}>${this.t('next')}</button></div>`:''}`;
    }
    async refreshStages(){
        if(this.stageBusy)return;this.stageBusy=true;const epoch=this.renderEpoch;
        const focus=document.activeElement?.dataset?.action;
        const update=()=>{if(epoch!==this.renderEpoch||this.page!=='history')return;const target=document.getElementById('stage-copies');if(target)target.innerHTML=this.stagesHTML();};update();
        try{this.stageInfo=await this.transfers().listStages(this.stagePage||0);this.stagePage=this.stageInfo.page;}
        catch(_){if(epoch===this.renderEpoch)this.toast('stageListFailed',true);}
        finally{this.stageBusy=false;update();if(['stage-refresh','stage-previous','stage-next'].includes(focus)&&epoch===this.renderEpoch)document.querySelector(`[data-action="${focus}"]`)?.focus();}
    }
    async createLocalCopy(){
        if(this.transferBusy||this.stageBusy)return;this.transferBusy=true;this.transferStatus(true);
        document.querySelectorAll('[data-action="export-backup"],[data-action="password-export"],[data-action="stage-local-copy"]').forEach(b=>{b.disabled=true;});
        try{
            await this.saveImmediate('beforeExport');await this.transfers().createLocalCopy(this.prefs,n=>this.transferStatus(n));this.stagePage=0;
            if(this.page==='history'){this.sessions=await this.history.catalog();this.renderHistoryList();}
            this.toast('stageCreated');
        }catch(_){this.toast('stageCopyFailed',true);}
        finally{this.transferBusy=false;this.transferStatus();document.querySelectorAll('[data-action="export-backup"],[data-action="password-export"],[data-action="stage-local-copy"]').forEach(b=>{b.disabled=false;});if(this.page==='history'){await this.refreshStages();await this.refreshCapacity();}}
    }
    showImportPreview(prepared,name,duplicate){
        this.preparedImport=prepared;this.importOverview={name,duplicate};const r=prepared.counts;
        const previews=prepared.previews||[];
        this.dialog('importPreview',`<p class="lede">${this.t('importHelp')}</p>${duplicate?`<p class="notice warn">${this.t('importDuplicate')}</p>`:''}<p><bdi dir="auto">${this.esc(name)}</bdi></p><div class="preview-grid">${['sessions','children','results'].map(k=>`<div class="card"><div class="stat">${r[k]}</div><div>${this.t(k)}</div></div>`).join('')}</div><p class="hint">${this.t('importCountsHelp')}</p>${previews.length?`<h3>${this.t('stageRecentVersions')}</h3><p class="hint">${this.t('stagePreviewHelp')}</p>${previews.map(p=>`<article class="history-item"><div><div class="item-title"><bdi>${this.esc(p.name||this.t('draft'))}</bdi></div><p class="item-sub">${this.date(p.createdAt)} · ${p.count} ${this.t('count')}</p></div><button class="btn" data-action="stage-preview-session" data-seq="${p.seq}">${this.t('preview')}</button></article>`).join('')}`:''}`,`<button class="btn primary" data-action="commit-import">${this.t('confirmImport')}</button>`);
    }
    async reviewStage(name){
        const epoch=this.renderEpoch,request=this.importRequest=(this.importRequest||0)+1;
        if(this.preparedImport?.format==='stream')this.transfers().release(this.preparedImport);this.preparedImport=null;let prepared;
        try{
            this.transferStatus(true);prepared=await this.transfers().resume(name,n=>{if(epoch!==this.renderEpoch||request!==this.importRequest)throw new Error('stageCancelled');this.transferStatus(n);});
            const duplicate=await this.transfers().hasImported(prepared);
            if(epoch!==this.renderEpoch||request!==this.importRequest){this.transfers().release(prepared);return;}
            const item=this.stageInfo?.items.find(s=>s.name===name);this.showImportPreview(prepared,item?.fileName||this.t('stageUnnamed'),duplicate);
        }catch(error){if(prepared)this.transfers().release(prepared);if(epoch===this.renderEpoch&&request===this.importRequest)this.toast(error.message,true);}
        finally{if(request===this.importRequest)this.transferStatus();}
    }
    async previewStageVersion(seq){
        const prepared=this.preparedImport;if(prepared?.format!=='stream')return;
        try{
            this.stagePreviewSession=await this.transfers().readPreview(prepared,seq,n=>{if(this.preparedImport!==prepared)throw new Error('stageCancelled');this.transferStatus(n);});
            if(this.preparedImport!==prepared)return;this.stagePreviewPage=0;this.renderStagePreview();
        }catch(error){if(this.preparedImport===prepared)this.toast(error.message,true);}
        finally{this.transferStatus();}
    }
    renderStagePreview(){
        const s=this.stagePreviewSession,w=s?.metadata?.workspace;if(!w)return;const entries=[...(w.single?[w.single]:[]),...(w.batch||[])],pages=Math.max(1,Math.ceil(entries.length/50));
        this.stagePreviewPage=Math.min(pages-1,Math.max(0,this.stagePreviewPage||0));const rows=entries.slice(this.stagePreviewPage*50,(this.stagePreviewPage+1)*50),paste=w.paste||'';
        const draft=(value,mode)=>{const html=this.previewDraft(value,mode);return html?`<details><summary>${this.t('draft')} · ${this.t(mode)}</summary>${html}</details>`:'';};
        this.dialog('preview',`<p class="lede">${this.t('stageReadOnly')}</p><p class="meta">${this.date(s.createdAt)}</p>${draft(w.draft,'single')}${draft(w.batchDraft,'batch')}${paste?`<details><summary>CSV</summary><p class="hint">${this.t('stagePastePreview')}</p><pre>${this.esc(paste.slice(0,4000))}</pre></details>`:''}${rows.length?`<div class="table-scroll">${this.tableHTML(rows)}</div>`:''}${w.single?this.resultsHTML(w.single,w.stale,true):''}`,`${this.paginationHTML({current:this.stagePreviewPage,pages,total:entries.length,from:entries.length?this.stagePreviewPage*50+1:0,to:Math.min(entries.length,(this.stagePreviewPage+1)*50)},{action:'stage-detail-page',previousAction:'stage-detail-previous',nextAction:'stage-detail-next'})}<button class="btn primary" data-action="stage-back">${this.t('stageBack')}</button>`);
    }
    date(value) { const date = new Date(value); return Number.isFinite(date.getTime()) ? date.toLocaleString(this.prefs.language, { dateStyle: 'medium', timeStyle: 'short' }) : this.t('unknown'); }
    calendarDate(value) { try { ClinicalEngine.dateDays(value); return new Date(value+'T00:00:00Z').toLocaleDateString(this.prefs.language,{dateStyle:'medium',timeZone:'UTC'}); } catch (_) { return this.t('unknown'); } }
    number(value, digits = 2) { return Number(value).toLocaleString(this.prefs.language, { minimumFractionDigits: digits, maximumFractionDigits: digits }); }
    async init() {
        try {
            const paths=['data/interface-translations.json','data/who-manifest.json','data/who-official.json','data/who-2007-manifest.json','data/who-2007.json'];
            const responses=await Promise.all(paths.map(path=>fetch(path)));
            const {texts,hashes}=await ReleaseGuard.verifyData(paths,responses);
            this.translations=JSON.parse(texts[0]);
            const manifest=JSON.parse(texts[1]),text=texts[2];
            if(hashes[2]!==manifest.sha256)throw new Error('referenceInvalid');
            const olderManifest=JSON.parse(texts[3]);if(hashes[4]!==olderManifest.sha256)throw new Error('referenceInvalid');
            this.engine = new GrowthEngine(JSON.parse(text),JSON.parse(texts[4])); this.manifest = manifest;this.olderManifest=olderManifest;
            await this.storage.initialize(); this.sessions = await this.history.catalog();
            if(ReleaseGuard.failed)throw new Error('releaseInvalid');
            this.applyPreferences(); this.render(); this.events();
            window.addEventListener('online', () => this.updateConnection()); window.addEventListener('offline', () => this.updateConnection());
            window.addEventListener('pagehide', () => this.checkpoint());
            document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { this.checkpoint(); this.queueSave(); } });
            matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (this.prefs.theme === 'system') this.applyPreferences(); });
            await this.registerOffline();
        } catch (error) {
            if(!this.translations||error.message==='releaseInvalid'){ReleaseGuard.fail();console.error('Release verification failed',error);return;}
            const root = document.getElementById('app-root'); root.textContent = this.t(error.message) + ' — ' + this.t('error');
            root.setAttribute('role', 'alert'); console.error('Workspace initialization failed', error);
        }
    }
    applyPreferences() {
        document.documentElement.lang = this.prefs.language; document.documentElement.dir = this.prefs.language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.dataset.theme = this.prefs.theme === 'dark' || this.prefs.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.dataset.navCollapsed = String(!!this.prefs.navCollapsed);
        document.title = this.t('brand');
    }
    persistPreferences() {
        try { localStorage.setItem('zscore-ui-v2', JSON.stringify(this.prefs)); localStorage.setItem('zscore-app-language', this.prefs.language); }
        catch (error) { this.toast('unsaved', true); }
    }
    icon(name) {
        if (name === 'pdf' || name === 'csv') {
            const color = name === 'pdf' ? '#b42318' : '#176448';
            return `<svg class="ui-icon" data-format="${name}" viewBox="0 0 32 36" aria-hidden="true" focusable="false"><path d="M7 1h13l7 7v26H7Z" fill="#fff" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"/><path d="M20 1v8h7" fill="none" stroke="${color}" stroke-width="1.8"/><rect x="1" y="17" width="30" height="14" rx="2" fill="${color}"/><text x="16" y="27.5" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="10" fill="#fff">${name.toUpperCase()}</text></svg>`;
        }
        const paths = {
            settings: '<path d="M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3Z"/><circle cx="12" cy="12" r="3"/>',
            export: '<path d="M12 3v12m-4-4 4 4 4-4M4 15v6h16v-6"/>',
            language: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/>',
            light: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
            dark: '<path d="M20.5 13.5A9 9 0 0 1 10.5 3a9 9 0 1 0 10 10.5Z"/>',
            system: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/><circle cx="12" cy="10.5" r="3"/><path d="M12 7.5v6"/>',
            menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
            check: '<path d="m5 12 4 4L19 6"/>',
            close: '<path d="m6 6 12 12M6 18 18 6"/>',
            edit: '<path d="m16 3 5 5-12 12-6 1 1-6L16 3Z"/><path d="m13 6 5 5"/>',
            save: '<path d="M5 3h12l4 4v14H3V3h2Z"/><path d="M7 3v6h10V3M7 21v-8h10v8"/>',
            run: '<path d="m8 4 12 8-12 8V4Z"/>',
            plus: '<path d="M12 4v16M4 12h16"/>',
            new: '<path d="M14 3H5v18h14V8l-5-5Z"/><path d="M14 3v5h5M12 11v6M9 14h6"/>',
            csv: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18M3 15h18"/>',
            pdf: '<path d="M14 3H5v18h14V8l-5-5Z"/><path d="M14 3v5h5M8 12h8M8 16h5"/>',
            compact: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 9h20M8 9v11M15 9v11M8 14h14"/>',
            print: '<path d="M7 8V3h10v5M7 17H3V8h18v9h-4M7 13h10v8H7zM17 10h1"/>',
            info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
            single: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M14 11h2M8 15h2M14 15h2M8 18h2M14 18h2"/>',
            batch: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
            history: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
            references: '<path d="M12 5C8 2 4 3 3 4v16c3-2 6-2 9 0 3-2 6-2 9 0V4c-3-2-6-2-9 1Zm0 0v15"/>',
            chart: '<path d="M4 3v18h17M8 17v-5M13 17V7M18 17v-8"/>',
            previous: '<path d="m15 5-7 7 7 7"/>',
            next: '<path d="m9 5 7 7-7 7"/>'
        };
        return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name] || ''}</svg>`;
    }
    toolButton(label, icon, action = '', {disabled=false, primary=false, attrs='', submit=false, showLabel=false, labelKey=label} = {}) {
        const name=this.esc(this.t(label));
        return `<button type="${submit?'submit':'button'}" class="icon-button${primary?' primary':''}${showLabel?' action-with-label':''}"${action?` data-action="${action}"`:''} title="${name}" aria-label="${name}" ${disabled?'disabled':''} ${attrs}>${this.icon(icon)}${showLabel?`<span class="action-label" aria-hidden="true">${this.esc(this.t(labelKey))}</span>`:''}</button>`;
    }
    infoButton(key, label, id = 'info-' + key) {
        return `<button type="button" id="${id}" class="field-info" data-action="show-info" data-info="${key}" aria-expanded="false" aria-controls="info-popup" aria-label="${this.esc(this.t('helpAbout')+' '+this.t(label))}">${this.icon('info')}</button>`;
    }
    showInfo(key, opener) {
        if(!['ageHint','weightHint','positionHint','csvHelp','bmiHelp','centileHelp','appInfo','scoreHelp','batchContext'].includes(key))return;
        if(key!=='appInfo'){this.openInfo(key,opener);return;}
        this.closeInfo();this.closeChoice();
        const d=document.getElementById('header-dialog');d.dataset.opener=opener;
        d.classList.add('app-info-dialog');
        const text=key==='appInfo'?['appUsageNotice','free','scopeText','privacyText'].map(k=>`<p>${this.esc(this.t(k))}</p>`).join(''):key==='scoreHelp'?['weightForAge','heightForAge','weightForHeight','bmiForAge','bmiHelp','resultsIntro'].map(k=>`<p>${this.esc(this.t(k))}</p>`).join(''):`<p>${this.esc(this.t(key))}</p>`;
        d.innerHTML=`<div class="dialog-top"><h2 id="header-dialog-title">${this.t('information')}</h2>${this.toolButton('close','close','close-header')}</div><div class="dialog-body">${text}</div>`;
        d.showModal();
    }
    closeInfo(focus=false) {
        const active=this.activeInfo;if(!active)return;this.activeInfo=null;
        const popup=document.getElementById('info-popup');if(popup){if(popup.hidePopover&&popup.matches(':popover-open'))popup.hidePopover();popup.hidden=true;}
        const button=document.getElementById(active.opener);
        if(button){button.setAttribute('aria-expanded','false');if(active.description)button.setAttribute('aria-describedby',active.description);else button.removeAttribute('aria-describedby');if(focus)button.focus({preventScroll:true});}
    }
    openInfo(key,opener) {
        if(this.activeInfo?.opener===opener){this.closeInfo(true);return;}
        this.closeInfo();this.closeChoice();const button=document.getElementById(opener);if(!button)return;
        let popup=document.getElementById('info-popup');
        if(!popup){popup=document.createElement('div');popup.id='info-popup';popup.className='info-popup';popup.hidden=true;popup.setAttribute('popover','manual');popup.setAttribute('role','region');popup.setAttribute('aria-labelledby','info-popup-title');document.body.append(popup);}
        const keys=key==='scoreHelp'?['weightForAge','heightForAge','weightForHeight','bmiForAge','bmiHelp','resultsIntro']:[key];
        const messages=key==='batchContext'?this.batchContextNotes().map(n=>this.t(n.label).replace('{count}',this.number(n.count,0))+' '+this.t(n.key)):keys.map(k=>this.t(k));
        popup.innerHTML=`<div class="info-popup-top"><strong id="info-popup-title">${this.esc(this.t('information'))}</strong>${this.toolButton('close','close','close-info')}</div><div id="info-popup-text">${messages.map(text=>`<p>${this.esc(text)}</p>`).join('')}</div>`;
        popup.dir=document.documentElement.dir||'ltr';this.activeInfo={opener,description:button.getAttribute('aria-describedby')};button.setAttribute('aria-expanded','true');button.setAttribute('aria-describedby','info-popup-text');
        const rect=button.getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=window.innerHeight,width=Math.min(360,Math.max(0,vw-16));
        popup.style.width=width+'px';popup.style.maxHeight=Math.max(40,vh-16)+'px';popup.style.left=Math.max(8,Math.min(popup.dir==='rtl'?rect.right-width:rect.left,vw-width-8))+'px';popup.style.top=Math.max(8,Math.min(rect.bottom+6,vh-48))+'px';
        popup.hidden=false;if(popup.showPopover)popup.showPopover();const height=popup.getBoundingClientRect().height;
        if(rect.bottom+height+14>vh){const above=rect.top-14,below=vh-rect.bottom-14;if(above>below){popup.style.maxHeight=Math.max(40,above)+'px';popup.style.top=Math.max(8,rect.top-Math.min(height,above)-6)+'px';}else popup.style.maxHeight=Math.max(40,below)+'px';}
    }
    batchView() {
        const size=8,total=this.state.batch.length,pages=Math.max(1,Math.ceil(total/size));
        const current=Math.min(pages-1,Math.max(0,Number.isInteger(this.batchPage)?this.batchPage:0));
        return {current,pages,total,start:current*size,from:total?current*size+1:0,to:Math.min(total,(current+1)*size),entries:this.state.batch.slice(current*size,(current+1)*size)};
    }
    batchContextNotes() {
        const batch=this.state.batch,imported=batch.filter(e=>e.result?.imported).length,estimated=batch.filter(e=>e.result?.warnings?.includes('estimatedAge')).length;
        return [{key:'importedResult',label:'importedEntries',count:imported},{key:'estimatedAge',label:'estimatedAgeEntries',count:estimated}].filter(n=>n.count);
    }
    batchPagination(view) {
        if(!view.total)return '';
        return this.paginationHTML(view,{action:'batch-page',label:'batchPages'});
    }
    paginationRange(view) { return this.t('paginationRange').replace('{from}',this.number(view.from,0)).replace('{to}',this.number(view.to,0)).replace('{total}',this.number(view.total,0)); }
    paginationHTML(view,{action,label='pagination',previousAction=action,nextAction=action,busy=false,statusId=''}={}) {
        const windowHTML=compact=>{
            const pages=[...new Set((view.pages<=5&&!compact?Array.from({length:view.pages},(_,i)=>i):[0,...(compact?[]:[view.current-1]),view.current,...(compact?[]:[view.current+1]),view.pages-1]).filter(p=>p>=0&&p<view.pages))].sort((a,b)=>a-b);
            return pages.map((p,i)=>`${i&&p>pages[i-1]+1?'<span class="page-gap" aria-hidden="true">…</span>':''}<button type="button" class="page-number" data-action="${action}" data-page="${p}" ${p===view.current?'aria-current="page"':''} ${busy?'disabled':''} aria-label="${this.esc(this.t('page')+' '+this.number(p+1,0))}">${this.number(p+1,0)}</button>`).join('');
        };
        return `<nav class="list-pagination" aria-label="${this.esc(this.t(label))}"><span ${statusId?`id="${statusId}"`:''} role="status" aria-live="polite" aria-atomic="true">${this.esc(this.paginationRange(view))}</span><div class="page-buttons">${this.toolButton('previous','previous',previousAction,{disabled:busy||view.current===0,attrs:`data-page="${view.current-1}"`})}<div class="page-window pager-wide">${windowHTML(false)}</div><div class="page-window pager-compact">${windowHTML(true)}</div>${this.toolButton('next','next',nextAction,{disabled:busy||view.current===view.pages-1,attrs:`data-page="${view.current+1}"`})}</div></nav>`;
    }
    focusPagination(action) {
        const buttons=document.querySelectorAll?.(`[data-action="${action}"][aria-current="page"]`);
        if(buttons)Array.from(buttons).find(b=>b.getClientRects().length)?.focus({preventScroll:true});
    }
    openHeaderPanel(kind) {
        if (!['language','theme','menu'].includes(kind)) return;
        if(kind!=='menu'){this.openChoice(kind+'-button',kind);return;}
        this.closeInfo();this.closeChoice();
        const d = document.getElementById('header-dialog');
        d.classList.remove('app-info-dialog');
        const names = {fr:'Français',en:'English',ar:'العربية'};
        const options = kind === 'menu' ? ['single','batch','history','references','settings'] : kind === 'language' ? ['fr','en','ar'] : ['system','light','dark'];
        const current = kind === 'menu' ? this.page : this.prefs[kind];
        d.dataset.opener = kind + '-button';
        d.innerHTML = `<div class="dialog-top"><h2 id="header-dialog-title">${this.t(kind)}</h2><button class="icon-button" data-action="close-header" aria-label="${this.esc(this.t('close'))}">${this.icon('close')}</button></div><div class="dialog-body header-options">${options.map(value => `<button class="header-choice" data-action="${kind === 'menu' ? 'header-page' : 'set-preference'}" data-kind="${kind}" data-value="${value}" ${kind === 'menu' ? (current === value ? 'aria-current="page"' : '') : `aria-pressed="${current === value}"`}>${kind === 'theme' ? this.icon(value) : ''}<span class="choice-label"${kind === 'language' ? ` lang="${value}" dir="auto"` : ''}>${kind === 'language' ? names[value] : this.t(value)}</span>${current === value ? this.icon('check') : ''}</button>`).join('')}</div>`;
        document.getElementById(d.dataset.opener)?.setAttribute('aria-expanded','true');
        d.showModal();
        d.querySelector('[aria-pressed="true"],[aria-current="page"]')?.focus();
    }
    setPreference(kind, value) {
        const allowed = {language:['fr','en','ar'],theme:['system','light','dark']};
        if (!Object.hasOwn(allowed,kind) || !allowed[kind].includes(value)) return;
        this.readForms(); this.prefs[kind] = value; this.persistPreferences(); this.applyPreferences();
        document.getElementById('header-dialog').close(); this.render(kind + '-button');
    }
    enhanceSelects() {
        if(typeof document.querySelectorAll!=='function')return;
        for(const select of document.querySelectorAll('#single-form select,#batch-form select')){
            if(select.hidden)continue;
            const label=select.labels?.[0],id=select.id+'-picker',valueId=id+'-value';
            if(label){label.id=select.id+'-label';label.htmlFor=id;}
            const button=document.createElement('button');button.type='button';button.id=id;button.className='choice-trigger';
            button.dataset.action='open-select';button.dataset.select=select.id;button.setAttribute('role','combobox');
            button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-controls','choice-popup');button.setAttribute('aria-expanded','false');
            button.setAttribute('aria-labelledby',[label?.id,valueId].filter(Boolean).join(' '));
            if(select.hasAttribute('aria-describedby'))button.setAttribute('aria-describedby',select.getAttribute('aria-describedby'));
            button.innerHTML=`<span id="${valueId}" class="choice-value">${this.esc(select.selectedOptions[0]?.textContent||'')}</span><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"/></svg>`;
            select.before(button);select.hidden=true;
        }
    }
    choicePopup() {
        let popup=document.getElementById('choice-popup');
        if(!popup){popup=document.createElement('div');popup.id='choice-popup';popup.className='choice-popup';popup.hidden=true;popup.setAttribute('role','listbox');popup.setAttribute('popover','manual');document.body.append(popup);}
        return popup;
    }
    closeChoice(focus=false) {
        const active=this.activeChoice;if(!active)return;
        this.activeChoice=null;
        const popup=document.getElementById('choice-popup');
        if(popup){if(popup.hidePopover&&popup.matches(':popover-open'))popup.hidePopover();popup.hidden=true;}
        const button=document.getElementById(active.buttonId);button?.setAttribute('aria-expanded','false');
        if(focus)button?.focus({preventScroll:true});
    }
    openChoice(buttonId,kind,selectId='') {
        this.closeInfo();
        if(this.activeChoice?.buttonId===buttonId){this.closeChoice(true);return;}
        this.closeChoice();
        const button=document.getElementById(buttonId);if(!button)return;
        const select=selectId?document.getElementById(selectId):null;
        if(!select&&!['language','theme'].includes(kind))return;
        const names={fr:'Français',en:'English',ar:'العربية'};
        const options=select?[...select.options].map(o=>({value:o.value,label:o.textContent,disabled:o.disabled})):(kind==='language'?['fr','en','ar']:['system','light','dark']).map(value=>({value,label:kind==='language'?names[value]:this.t(value)}));
        const current=select?select.value:this.prefs[kind],popup=this.choicePopup();
        popup.dir=document.documentElement.dir||'ltr';popup.setAttribute('aria-label',select?(document.getElementById(select.id+'-label')?.textContent||''):this.t(kind));
        popup.innerHTML=options.map(o=>`<button type="button" role="option" aria-selected="${o.value===current}" tabindex="${o.value===current?'0':'-1'}" data-action="choice-value" data-value="${this.esc(o.value)}" ${o.disabled?'disabled':''}>${kind==='theme'?this.icon(o.value):''}<span${kind==='language'?` lang="${o.value}" dir="auto"`:''}>${this.esc(o.label)}</span>${o.value===current?this.icon('check'):''}</button>`).join('');
        this.activeChoice={buttonId,kind,selectId};button.setAttribute('aria-expanded','true');button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-controls','choice-popup');
        const rect=button.getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=window.innerHeight,width=Math.min(Math.max(rect.width,180),Math.max(0,vw-16));
        popup.style.width=width+'px';popup.style.maxHeight=Math.min(320,vh-16)+'px';
        popup.style.left=Math.max(8,Math.min(popup.dir==='rtl'?rect.right-width:rect.left,vw-width-8))+'px';
        popup.style.top=Math.max(8,Math.min(rect.bottom+4,vh-48))+'px';
        popup.hidden=false;if(popup.showPopover)popup.showPopover();
        const height=popup.getBoundingClientRect().height;
        if(rect.bottom+height+12>vh){
            const below=vh-rect.bottom-12,above=rect.top-12;
            if(above>below){popup.style.maxHeight=Math.max(36,Math.min(320,above))+'px';popup.style.top=Math.max(8,rect.top-Math.min(height,above)-4)+'px';}
            else popup.style.maxHeight=Math.max(36,below)+'px';
        }
        (popup.querySelector('[aria-selected="true"]:not(:disabled)')||popup.querySelector('button:not(:disabled)'))?.focus({preventScroll:true});
    }
    chooseValue(value) {
        const active=this.activeChoice;if(!active)return;
        const select=active.selectId?document.getElementById(active.selectId):null;
        if(select){
            if(![...select.options].some(o=>o.value===value&&!o.disabled))return;
            if(select.value===value){this.closeChoice(true);return;}
            select.value=value;
            const display=document.getElementById(active.buttonId+'-value');if(display)display.textContent=select.selectedOptions[0]?.textContent||'';
            this.closeChoice(true);
            select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));
        }else{this.closeChoice();this.setPreference(active.kind,value);}
    }
    choiceKey(event) {
        const popup=document.getElementById('choice-popup');
        if(this.activeChoice){
            if(event.key==='Escape'){event.preventDefault();this.closeChoice(true);return;}
            if(event.key==='Tab'){this.closeChoice(true);return;}
            if(!popup?.contains(event.target))return;
            const options=[...popup.querySelectorAll('button:not(:disabled)')],index=options.indexOf(document.activeElement);
            let target;
            if(event.key==='ArrowDown')target=options[(index+1)%options.length];
            else if(event.key==='ArrowUp')target=options[(index-1+options.length)%options.length];
            else if(event.key==='Home')target=options[0];else if(event.key==='End')target=options.at(-1);
            else if(event.key.length===1&&event.key!==' '&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
                const now=Date.now();this.choiceSearch=now-(this.choiceSearchTime||0)<700?(this.choiceSearch||'')+event.key:event.key;this.choiceSearchTime=now;
                target=options.find(o=>o.textContent.trim().toLocaleLowerCase().startsWith(this.choiceSearch.toLocaleLowerCase()));
            }
            if(target){event.preventDefault();options.forEach(o=>o.tabIndex=-1);target.tabIndex=0;target.focus();}
        }else if(['ArrowDown','ArrowUp'].includes(event.key)){
            const button=event.target.closest('[data-action="open-select"],[data-action="header-panel"]');
            if(button&&button.dataset.kind!=='menu'){event.preventDefault();this.openChoice(button.id,button.dataset.kind||'field',button.dataset.select||'');}
        }
    }
    render(focusId = '') {
        this.closeChoice();this.closeInfo();
        this.renderEpoch = (this.renderEpoch || 0) + 1;
        document.getElementById('app-root').innerHTML = `
            <a class="skip" href="#main">${this.t('skip')}</a>
            <header class="topbar workspace-topbar"><div class="brand-group"><button id="sidebar-button" class="brand-mark brand-toggle" data-action="toggle-sidebar" aria-controls="main-nav" aria-expanded="${!this.prefs.navCollapsed}" title="${this.esc(this.t(this.prefs.navCollapsed?'expandMenu':'collapseMenu'))}" aria-label="${this.esc(this.t('brand')+' · '+this.t(this.prefs.navCollapsed?'expandMenu':'collapseMenu'))}">Z</button><button id="menu-button" class="brand-mark mobile-menu-button" data-action="header-panel" data-kind="menu" aria-haspopup="dialog" aria-controls="header-dialog" aria-expanded="false" aria-label="${this.esc(this.t('brand')+' · '+this.t('menu'))}">Z</button><div class="workspace-context"><div class="page-title-group"><h1>${this.t(this.page)}</h1>${['single','batch'].includes(this.page)?'<span class="save-state" data-save-state aria-live="polite"></span>':''}</div><span id="connection" class="connection-badge" role="status"></span></div></div><div class="workspace-heading-actions">${['single','batch'].includes(this.page)?`${this.toolButton('resumeWork','history','page',{showLabel:true,attrs:'data-page="history"'})}${this.toolButton('newWork','new','new',{showLabel:true})}`:''}</div></header>
            <div class="shell"><aside class="sidebar"><nav id="main-nav" class="nav" aria-label="${this.t('brand')}">${['single','batch','history','references','settings'].map(p => `<button data-action="page" data-page="${p}" title="${this.esc(this.t(p))}" aria-label="${this.esc(this.t(p))}" ${this.page === p ? 'aria-current="page"' : ''}>${this.icon(p)}<span class="nav-text">${this.t(p)}</span></button>`).join('')}</nav></aside>
            <main id="main" tabindex="-1"><div class="print-header"><h2>${this.t('brand')}</h2><p>${this.t('appUsageNotice')}</p></div>
              <div id="update-notice">${this.updateHTML()}</div>
              <div id="page-content">${this.page === 'single' ? this.singleHTML() : this.page === 'batch' ? this.batchHTML() : this.page === 'history' ? this.historyHTML() : this.page === 'settings' ? this.settingsHTML() : this.referencesHTML()}</div>
              ${this.history.recoveryErrors.length ? `<div class="notice warn" role="alert">${this.t('recoveryDamaged')}</div>` : ''}
              <footer class="compact-footer"><a class="legal-footer-link" href="${this.prefs.language==='ar'?'legal-ar.html':this.prefs.language==='en'?'legal-en.html':'legal.html'}" target="_blank" rel="noopener noreferrer">${this.t('legalNoticeLink')}</a><span>v${WorkspaceApp.version}</span><span data-offline-status>${this.t(this.offlineState)}</span><span class="about-label">${this.t('aboutShort')}</span>${this.toolButton('information','info','show-info',{attrs:'id="app-info-button" data-info="appInfo"'})}</footer>
            </main></div>`;
        this.observeHeader();
        this.updateConnection(); this.updateSaveStatus(); this.updateToast(); this.syncImportNotice();
        if (this.page === 'history') this.renderHistoryList();
        if (this.page === 'history') this.refreshCapacity();
        if (this.page === 'single' && this.state.single?.result) this.renderFollowup().catch(error=>console.warn('Follow-up read failed',error));
        this.enhanceSelects();
        this.updateCSVControls();
        if(focusId)document.getElementById(focusId)?.focus();
    }
    observeHeader() {
        this.headerObserver?.disconnect();
        const header=document.querySelector('.workspace-topbar');
        if(!header)return;
        const measure=()=>document.documentElement.style.setProperty('--workspace-header-height',Math.ceil(header.getBoundingClientRect().height)+'px');
        measure();
        if(typeof ResizeObserver==='function'){this.headerObserver=new ResizeObserver(measure);this.headerObserver.observe(header);}
    }
    settingsHTML() {
        const names={fr:'Français',en:'English',ar:'العربية'};
        return `<section class="card settings-card" aria-label="${this.esc(this.t('settings'))}"><p class="hint">${this.t('settingsHelp')}</p><div class="settings-grid">${['language','theme'].map(kind=>`<div class="setting-row"><label id="${kind}-label" for="${kind}-button">${this.t(kind)}</label><button id="${kind}-button" class="choice-trigger" data-action="header-panel" data-kind="${kind}" aria-haspopup="listbox" aria-controls="choice-popup" aria-expanded="false" aria-labelledby="${kind}-label ${kind}-value">${this.icon(kind==='language'?'language':this.prefs.theme)}<span class="choice-value" id="${kind}-value"${kind==='language'?' dir="auto"':''}>${this.esc(kind==='language'?names[this.prefs.language]:this.t(this.prefs.theme))}</span><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></div>`).join('')}</div></section>`;
    }
    resultHeadingHTML(entry) {
        const child=entry?.child;
        return `<div class="results-heading-group"><h2 id="results-title" class="flow-focus" tabindex="-1">${this.t('resultsTitle')}</h2>${child?`<div class="result-status"><strong><bdi>${this.esc(child.name || child.caseId || this.t('unknown'))}</bdi></strong>${entry.result.status!=='complete'?`<span class="badge">${this.esc(this.t(entry.result.status))}</span>`:''}</div>`:''}</div>`;
    }
    resultActionsHTML(child) {
        const exports=()=>`${this.toolButton('exportPDF','pdf','export-pdf',{disabled:this.pdfBusy,showLabel:true})}${this.toolButton('exportCSV','csv','csv-results',{showLabel:true})}`;
        const editing=!!this.singleEditing;
        return `<div class="toolbar compact-toolbar result-toolbar">${this.toolButton('print','print','print',{showLabel:true})}<div class="exports-inline">${exports()}</div><details class="export-menu"><summary class="btn">${this.icon('export')}<span>${this.t('exportActions')}</span></summary><div class="export-options">${exports()}</div></details>${child.caseId?this.toolButton('newVisit','plus','new-visit',{showLabel:true,labelKey:'newVisitShort'}):''}<button id="single-view-toggle" class="icon-button action-with-label" data-action="${editing?'show-results':'edit-measures'}" aria-controls="measure-card" aria-expanded="${editing}" title="${this.esc(this.t(editing?'showResults':'editMeasures'))}" aria-label="${this.esc(this.t(editing?'showResults':'editMeasures'))}">${this.icon(editing?'chart':'edit')}<span class="action-label" aria-hidden="true">${this.t(editing?'showResults':'editMeasures')}</span></button>${!editing?this.toolButton('saveNow','save','save',{showLabel:true,labelKey:'saveShort'}):''}${this.infoButton('centileHelp','percentileLabel')}</div>`;
    }
    formHTML(prefix, data, batch = false) {
        const labelKey=key=>({caseId:'caseShort',name:'nameShort',oedema:'oedemaShort',ageMode:'ageShort'}[key]||key);
        const label=(key,hint='')=>`<div class="field-label"><label for="${prefix}-${key}">${this.t(labelKey(key))}${['caseId','name'].includes(key)?` <small>(${this.t('optional')})</small>`:''}</label>${hint?this.infoButton(hint,key,`${prefix}-${key}-info`):''}</div>`;
        const field = (key, type = 'text', attrs = '', hint = '') => `<div class="field">${label(key,hint)}<input id="${prefix}-${key}" name="${key}" type="${type}" value="${this.esc(data[key])}" ${attrs}${hint ? ` aria-describedby="${prefix}-${key}-hint"` : ''}>${hint ? `<p id="${prefix}-${key}-hint" class="sr-only">${this.t(hint)}</p>` : ''}</div>`;
        const select = (key, options, hint = '') => `<div class="field">${label(key,hint)}<select id="${prefix}-${key}" name="${key}"${hint ? ` aria-describedby="${prefix}-${key}-hint"` : ''}>${options.map(([value,text]) => `<option value="${value}" ${data[key] === value ? 'selected' : ''}>${this.t(text)}</option>`).join('')}</select>${hint ? `<p id="${prefix}-${key}-hint" class="sr-only">${this.t(hint)}</p>` : ''}</div>`;
        return `<form id="${prefix}-form" novalidate><div class="form-grid">
            ${field('caseId', 'text', 'maxlength="100" autocomplete="off"')}${field('name', 'text', `maxlength="100" autocomplete="off" placeholder="${this.t('namePlaceholder')}"`)}
            <div class="field">${label('ageMode','ageHint')}<select id="${prefix}-ageMode" name="ageMode" aria-describedby="${prefix}-ageMode-hint">${['months','dates','days'].map(mode => `<option value="${mode}" ${data.ageMode === mode ? 'selected' : ''}>${this.t(mode)}</option>`).join('')}</select><p id="${prefix}-ageMode-hint" class="sr-only">${this.t('ageHint')}</p></div>
            <div class="age-fields" data-age="months" ${data.ageMode !== 'months' ? 'hidden' : ''}>${field('ageYears','number','min="0" max="19" step="1" inputmode="numeric"')}${field('ageMonths','number','min="0" max="11" step="1" inputmode="numeric"')}</div>
            <div class="age-fields" data-age="dates" ${data.ageMode !== 'dates' ? 'hidden' : ''}>${field('birthDate','date',`max="${ClinicalEngine.today()}"`)}</div>
            <div class="age-fields" data-age="days" ${data.ageMode !== 'days' ? 'hidden' : ''}>${field('ageDays','number','min="0" max="6970" step="1" inputmode="numeric"')}</div>
            ${field('measurementDate','date',`max="${ClinicalEngine.today()}"`)}
            ${field('weight','number','min="50" max="300000" step="1" inputmode="decimal"','weightHint')}${field('height','number','min="30" max="250" step="0.1" inputmode="decimal"')}
            ${select('gender',[['','choose'],['M','male'],['F','female']])}${select('oedema',[['','unknown'],['n','no'],['y','yes']])}${select('position',[['','choose'],['L','lying'],['H','standing']],'positionHint')}
            </div><details class="clinical-fields"${NutritionUI.inputFields.some(k=>data[k]!==undefined&&data[k]!=='')?' open':''}><summary>${this.t('clinicalSection')}</summary><p class="hint">${this.t('clinicalHelp')}</p><div class="form-grid">${field('muac','number','min="50" max="400" step="0.1" inputmode="decimal"','muacHelp')}${select('oedemaGrade',[['','unknown'],['1','grade1'],['2','grade2'],['3','grade3']])}${NutritionUI.dangerFields.map(key=>select(key,[['','unknown'],['n','no'],['y','yes']])).join('')}${select('acuteProblem',[['','unknown'],['n','no'],['y','yes']])}${select('appetite',[['','unknown'],['good','appetiteGood'],['poor','appetitePoor']])}${select('furtherAssessment',[['','unknown'],['n','assessmentNone'],['y','assessmentNeeded'],['cleared','assessmentCleared']])}</div></details><div id="${prefix}-error" class="notice error" role="alert" tabindex="-1" hidden></div></form>`;
    }
    singleHTML() {
        const hasResult=!!this.state.single?.result, dashboard=hasResult&&!this.singleEditing;
        return `<div class="workspace-grid single-workspace${dashboard?' results-view':''}"><section class="card" id="measure-card"${dashboard?' hidden':''}><div class="card-top"><h2>${this.t('formTitle')}</h2><div class="toolbar compact-toolbar form-top-actions">${this.toolButton('calculate','run','',{primary:true,submit:true,attrs:'form="single-form"',showLabel:true,labelKey:'calculateShort'})}${this.toolButton('saveNow','save','save',{showLabel:true,labelKey:'saveShort'})}</div></div>${this.formHTML('single', this.state.draft)}</section>
            <section class="card" id="results-card"><div id="single-results">${this.resultsHTML(this.state.single, this.state.stale)}</div></section></div>`;
    }
    resultsHTML(entry, stale = false, preview = false) {
        if (!entry?.result) return `${this.resultHeadingHTML()}<div class="empty"><div class="empty-symbol" aria-hidden="true">${this.icon('chart')}</div><h3>${this.t('blank')}</h3><p>${this.t('resultsIntro')}</p></div>`;
        const { child, result } = entry;
        const status=`<div class="result-status"><strong>${this.esc(child.name || child.caseId || this.t('unknown'))}</strong><span class="badge">${this.esc(this.t(result.status))}</span></div>`;
        const notices=`${stale ? `<p class="notice warn" role="status">${this.t('stale')}</p>` : ''}${result.imported ? `<p class="notice warn${preview?'':' import-print-notice'}">${this.t('importedResult')}</p>` : ''}`;
        const indicators=WorkspaceApp.resultIndicators(result).map(key => {
            const v = result[key], hasValue = v && typeof v.zscore === 'number' && Number.isFinite(v.zscore);
            const category = v?.classification;
            const severe = /Severe|severe|obesity|bmiBelow3|bmiAbove3/.test(category || '');
            return `<div class="indicator ${severe ? 'severe' : !['withinReference','bmiWithin'].includes(category) ? 'caution' : ''}"><div><div class="label">${this.t(key)}${key==='bmiForAge'?this.infoButton('bmiHelp','bmiForAge',preview?'preview-bmi-info':'result-bmi-info'):''}</div><div class="category">${this.esc(hasValue ? this.t(category) : this.t('notCalculated'))}</div></div><div class="indicator-values"><div class="score" aria-label="${this.esc(this.t('zscoreLabel')+' : '+(hasValue?this.number(v.zscore):this.t('notCalculated')))}" title="${this.esc(this.t('zscoreHelp'))}"><span class="score-prefix" aria-hidden="true">Z</span> ${hasValue ? this.number(v.zscore) : '—'}</div>${this.percentileHTML(v,result)}</div>${v?.flagged ? `<div class="flag">${this.t('flagged')}</div>` : ''}${v?.error ? `<div class="flag">${this.esc(this.t(v.error))}</div>` : ''}</div>`;
          }).join('');
        const warnings=`${(result.warnings || []).map(w => `<p class="notice warn">${this.esc(this.t(w))}</p>`).join('')}${result.referenceFamily==='WHO2007'?`<p class="hint">${this.t('coverage2007')}</p>`:''}`;
        const measures=`<div class="meta result-measures"><p>${this.t('caseId')} : ${this.esc(child.caseId || this.t('unknown'))} · ${this.t('measurementDate')} : ${this.calendarDate(child.measurementDate)}</p><p>${this.t('ageDays')} : ${this.esc(child.ageDays ?? this.t('unknown'))} · ${this.t('weight')} : ${this.number(child.weight,0)} · ${this.t('height')} : ${this.number(child.height,1)}${result.schemaVersion===4&&Number.isFinite(result.bmi)?` · ${this.t('bmi')} : ${this.number(result.bmi,2)} kg/m²`:''}</p><p>${this.t('gender')} : ${this.t(child.gender === 'M' ? 'male' : child.gender === 'F' ? 'female' : 'unknown')} · ${this.t('position')} : ${this.t(child.position === 'L' ? 'lying' : child.position === 'H' ? 'standing' : 'unknown')} · ${this.t('oedema')} : ${this.t(child.oedema === 'y' ? 'yes' : child.oedema === 'n' ? 'no' : 'unknown')}</p>${result.correctedHeight ? `<p>${this.t('adjustedHeight')} : ${this.number(result.correctedHeight,1)} ${this.t('unitCm')}</p>` : ''}<p>${this.t('calculatedAt')} : ${this.date(result.calculatedAt)}</p><p>${this.t('referenceVersion')} : ${this.esc(result.referenceVersion || 'unknown')} · ${this.t('engineVersion')} : ${this.esc(result.engineVersion || this.t('unknown'))}</p></div>`;
        if(preview)return `${status}${notices}${this.nutritionHTML(child,result)}<h3 class="growth-heading">${this.t('growthResults')}</h3>${indicators}${warnings}${measures}`;
        const value=v=>this.esc(v??this.t('unknown'));
        const pairs=[['measurementDate',this.calendarDate(child.measurementDate)],['ageDays',child.ageDays],['weight',this.number(child.weight,0)],['height',this.number(child.height,1)],['gender',this.t(child.gender==='M'?'male':'female')],['muac',result.nutrition?.muacMm==null?this.t('unknown'):this.number(result.nutrition.muacMm,1)+' mm']];
        return `<div class="dashboard-toolbar">${this.resultHeadingHTML(entry)}${this.resultActionsHTML(child)}</div>${notices}<div class="result-overview"><section class="result-clinical" aria-label="${this.esc(this.t('growthResults'))}">${this.nutritionHTML(child,result)}<h3 class="growth-heading">${this.t('growthResults')}</h3><div class="indicator-grid">${indicators}</div>${warnings}</section><section class="result-record"><div class="record-heading"><h3>${this.t('measurementSummary')}</h3>${child.caseId?`<button class="btn" data-action="view-case" data-case-id="${value(child.caseId)}" title="${this.esc(this.t('viewCaseVersions'))}">${this.icon('history')}<span>${this.t('viewVersionsShort')}</span></button>`:''}</div><dl class="measurement-snapshot">${pairs.map(([key,v])=>`<div><dt>${this.t(key)}</dt><dd>${value(v)}</dd></div>`).join('')}</dl><details class="calculation-details" open><summary>${this.t('calculationDetails')}</summary>${measures}</details><div data-single-visits>${child.caseId?'':`<p class="hint">${this.t('caseWithoutId')}</p>`}</div></section></div><section class="dashboard-charts" aria-label="${this.esc(this.t('chartsDashboard'))}"><h3>${this.t('chartsDashboard')}</h3><div data-single-charts></div></section>`;
    }
    nutritionHTML(child,result) {
        const n=result?.nutrition;if(!n)return '';const label=key=>this.esc(this.t(key));
        return `<section class="nutrition-result ${n.category==='nutritionSevere'||['orientationUrgent','orientationInpatient'].includes(n.orientation)?'clinical-urgent':''}" aria-label="${label('clinicalSection')}"><h3>${label('screeningTitle')}</h3><strong>${label(n.category)}</strong>${n.criteria?.length?`<p>${n.criteria.map(label).join(' · ')}</p>`:''}<p><b>${label('orientationTitle')}</b> — ${label(n.orientation)}</p>${n.reasons.length?`<p>${n.reasons.map(k=>label(k)).join(' · ')}</p>`:''}<details class="screening-details"><summary title="${label('assessmentDetails')}">${label('detailsShort')}</summary><p>${label('muac')} : ${n.muacMm===null?this.t('unknown'):this.number(n.muacMm,1)+' mm'} · ${label(n.muac)}</p><p>${label('clinicalHelp')}</p>${n.missing.length?`<p>${label('assessmentMissing')} : ${n.missing.map(k=>label(k)).join(', ')}</p>`:''}<p>${label('clinicalReference')} : ${this.esc(n.reference)} · v${n.version}</p><a href="https://www.who.int/publications/i/item/9789240082830" target="_blank" rel="noopener noreferrer">OMS 2023</a> · <a href="https://www.who.int/publications/i/item/9789240122840" target="_blank" rel="noopener noreferrer">OMS / UNICEF 2026</a></details></section>`;
    }
    lotModels(){
        if(!this.engine?.older)return [LotAnalysis.build(this.state.batch,this.engine?.data.referenceVersion)];
        const family=e=>e.result?.referenceFamily||(e.child.totalAgeMonths>=60?'WHO2007':'WHO2006');
        return [['WHO2006',this.engine.data.referenceVersion],['WHO2007',this.engine.older.data.referenceVersion]].flatMap(([key,reference])=>{const entries=this.state.batch.filter(e=>family(e)===key);return entries.length?[LotAnalysis.build(entries,reference,{family:key})]:[];});
    }
    lotSummaryHTML(options={}){return this.lotModels().map(model=>LotAnalysis.html(model,this,options)).join('');}
    batchHTML() {
        const view=this.batchView(),disabled=!view.total;
        return `<div class="workspace-grid batch-workspace"><section class="card" id="measure-card"><div class="card-top"><h2>${this.t('formTitle')}</h2><div class="toolbar compact-toolbar form-top-actions">${this.toolButton('addBatch','plus','',{primary:true,submit:true,showLabel:true,attrs:'form="batch-form"'})}</div></div>${this.formHTML('batch',this.state.batchDraft,true)}<section class="csv-tools" aria-labelledby="csv-tools-toggle"><div class="csv-tools-heading"><div class="csv-heading-label"><button type="button" class="csv-tools-toggle" id="csv-tools-toggle" data-action="toggle-csv" aria-expanded="${!!this.state.paste}" aria-controls="csv-tools-body csv-heading-actions"><span>${this.t('csvTools')}</span></button>${this.infoButton('csvHelp','csvTools','csv-help-button')}</div><div id="csv-heading-actions" class="toolbar compact-toolbar csv-heading-actions"${this.state.paste?'':' hidden'}><label class="icon-button action-with-label file-label" title="${this.esc(this.t('importCSV'))}">${this.icon('csv')}<span class="action-label">${this.t('importCSV')}</span><input class="file-input" type="file" id="csv-file" aria-label="${this.esc(this.t('importCSV'))}" accept=".csv,text/csv"></label>${this.toolButton('csvTemplate','csv','csv-template',{showLabel:true,labelKey:'csvTemplateShort'})}</div></div><div id="csv-tools-body" class="csv-tools-body"${this.state.paste?'':' hidden'}><div class="field"><label for="paste-data">${this.t('pasteLabel')}</label><textarea id="paste-data" rows="3">${this.esc(this.state.paste)}</textarea></div><button id="csv-parse-button" class="btn" data-action="parse-csv">${this.t('parseCSV')}</button></div></section></section>
          <section class="card batch-results-card"><div class="card-top"><div class="batch-heading"><h2 id="batch-results-title" class="flow-focus" tabindex="-1">${this.t('batchList')} <span class="batch-count">(${this.number(view.total,0)})</span></h2>${this.batchContextNotes().length?this.infoButton('batchContext','batchList','batch-context-info'):''}</div><div class="toolbar compact-toolbar batch-actions">${this.toolButton('computeBatch','run','calculate-batch',{primary:true,disabled,showLabel:true,labelKey:'calculateShort'})}${this.toolButton('exportCSV','csv','csv-results',{disabled,showLabel:true,labelKey:'csvShort'})}${this.toolButton('exportPDF','pdf','export-pdf',{disabled:disabled||this.pdfBusy,showLabel:true,labelKey:'pdfShort'})}${this.toolButton('exportPDFCompact','compact','export-pdf',{disabled:disabled||this.pdfBusy,attrs:'data-layout="compact"',showLabel:true,labelKey:'pdfCompactShort'})}${this.toolButton('print','print','print',{disabled,showLabel:true})}${this.toolButton('saveNow','save','save',{showLabel:true,labelKey:'saveShort'})}</div></div><div class="batch-browser">${view.total?`<div class="table-scroll">${this.tableHTML(view.entries,{compact:true})}</div>${this.batchPagination(view)}`:`<div class="empty">${this.t('emptyBatch')}</div>`}</div>${view.total?this.lotSummaryHTML():''}</section></div><div id="batch-print" class="print-only"></div>`;
    }
    preparePrint() {
        const target=document.getElementById('batch-print');
        if(target)target.innerHTML=this.page==='batch'?this.lotSummaryHTML({open:true,exportButton:false})+this.tableHTML(this.state.batch):'';
    }
    tableHTML(entries, {compact=false} = {}) {
        const indicators = ClinicalEngine.indicators.filter(key=>entries.some(e=>WorkspaceApp.resultIndicators(e.result).includes(key)));
        const columns = ['name','weight','height',...indicators];
        const number = (value,digits=2) => `<bdi class="score-number" dir="ltr">${this.number(value,digits)}</bdi>`;
        const note = key => `<div class="${compact&&key==='withinReference'?'sr-only':'item-sub'}">${this.esc(this.t(key))}</div>`;
        const cell = (key,value) => `<td role="cell"${indicators.includes(key)?' class="score"':''}><span class="cell-label" aria-hidden="true">${this.esc(this.t(key))}</span><div class="cell-value">${value}</div></td>`;
        return `<table class="results-table" role="table" aria-label="${this.esc(this.t('resultsTitle'))}"><thead role="rowgroup"><tr role="row">${columns.map(key=>`<th role="columnheader" scope="col"><abbr title="${this.esc(this.t(key))}">${this.esc(this.t(compact?({weightForAge:'shortWFA',heightForAge:'shortHFA',weightForHeight:'shortWFH',bmiForAge:'shortBFA',weight:'weightShort',height:'heightShort'}[key]||key):key))}</abbr></th>`).join('')}</tr></thead><tbody role="rowgroup">${entries.map(({child,result})=>{
            const identity=`<bdi dir="auto" class="item-title">${this.esc(child.name||child.caseId||this.t('unknown'))}</bdi><div class="item-sub"><bdi dir="auto">${this.esc(child.name?child.caseId||'':'')}</bdi></div>${child.measurementDate?`<div class="${compact?'sr-only':'item-sub'}">${this.esc(this.t('measurementDate'))} : <bdi>${this.esc(this.calendarDate(child.measurementDate))}</bdi></div>`:''}${result?.nutrition?`<div class="item-sub">${this.t('muac')} : ${this.esc(child.muac??'—')} mm</div>${compact?`<details class="row-assessment ${result.nutrition.category==='nutritionSevere'||['orientationUrgent','orientationInpatient'].includes(result.nutrition.orientation)?'clinical-urgent':''}"><summary>${this.esc(this.t(result.nutrition.category+'Short'))} · ${this.esc(this.t(result.nutrition.orientation+'Short'))}</summary><p>${this.esc(this.t(result.nutrition.category))}</p><p>${this.esc(this.t(result.nutrition.orientation))}</p><p>${(result.nutrition.criteria||[]).map(k=>this.esc(this.t(k))).join(' · ')}</p></details>`:`<div class="item-sub">${this.esc(this.t(result.nutrition.category))} · ${this.esc(this.t(result.nutrition.orientation))}</div>`}`:''}${!result?note('notCalculated'):''}${result?.imported&&!compact?note('importedResult'):''}${(result?.warnings||[]).filter(key=>!compact||key!=='estimatedAge').map(note).join('')}`;
            return `<tr role="row">${cell('name',identity)}${cell('weight',number(child.weight,0))}${cell('height',number(child.height,1))}${indicators.map(key=>{
                const value=key==='bmiForAge'&&result?.schemaVersion!==4?null:result?.[key],hasValue=typeof value?.zscore==='number'&&Number.isFinite(value.zscore);
                const category=value?.classification;
                return cell(key,`${hasValue?number(value.zscore):'<span class="score-number">—</span>'}${this.percentileHTML(value,result)}${note(hasValue?(category||'unknown'):key==='bmiForAge'&&result&&!result.schemaVersion===4?'indicatorNotStored':'notCalculated')}${value?.flagged?note('flagged'):''}${value?.error?note(value.error):''}`);
            }).join('')}</tr>`;
        }).join('')}</tbody></table>`;
    }
    historyHTML() {
        return `<div class="toolbar"><button class="btn primary" data-action="export-backup">${this.t('exportAll')}</button><button class="btn" data-action="password-export">${this.t('exportEncrypted')}</button><label class="btn file-label">${this.t('importBackup')}<input class="file-input" type="file" id="backup-file" accept=".zscore,.enc,application/x-ndjson,application/octet-stream"></label></div><p class="hint">${this.t('exportSensitive')}</p><p class="hint">${this.t('transferHelp')}</p><p id="transfer-status" role="status" aria-live="polite"></p><section id="storage-capacity" class="card capacity" aria-labelledby="storage-capacity-title" aria-live="polite">${this.capacityHTML()}</section><div class="field search"><label for="history-search">${this.t('search')}</label><input type="search" id="history-search" value="${this.esc(this.search)}"></div><div id="history-list" class="list"></div><div id="history-pages"></div><p class="meta">${this.t('allPreserved')}</p>`;
    }
    formatBytes(value) {
        if(!Number.isSafeInteger(value)||value<0)return this.t('storageUnknown');
        const large=value>=1024**3;return `<bdi dir="ltr">${this.number(value/(large?1024**3:1024**2),1)}</bdi> ${this.t(large?'unitGiB':'unitMiB')}`;
    }
    static storageEstimate(value) {
        const valid=number=>Number.isSafeInteger(number)&&number>=0;
        return {usage:valid(value?.usage)?value.usage:null,quota:valid(value?.quota)&&value.quota>0?value.quota:null};
    }
    capacityHTML() {
        const stats=this.history?.catalogStats,estimate=this.capacityInfo||{usage:null,quota:null},size=stats?.backupBytes;
        const near=estimate.quota&&estimate.usage!==null&&estimate.usage>=estimate.quota*.8;
        return `<h2 id="storage-capacity-title">${this.t('storageTitle')}</h2><dl class="capacity-data"><dt>${this.t('versions')}</dt><dd>${stats?this.number(stats.versions,0):this.t('storageUnknown')}</dd><dt>${this.t('storageBackupEstimate')}</dt><dd>${this.formatBytes(size)}</dd><dt>${this.t('storageOriginEstimate')}</dt><dd>${this.formatBytes(estimate.usage)}</dd><dt>${this.t('storageQuotaEstimate')}</dt><dd>${this.formatBytes(estimate.quota)}</dd><dt>${this.t('encryptedLimit')}</dt><dd><bdi dir="ltr">1</bdi> GiB</dd></dl>${near?`<p class="notice warn">${this.t('storageNearFull')}</p>`:''}<p class="hint">${this.t('storageCapacityNote')}</p><div class="toolbar"><button class="btn" data-action="capacity-refresh" ${this.capacityBusy?'disabled':''}>${this.t(this.capacityBusy?'storageCapacityLoading':'storageCapacityRefresh')}</button></div>`;
    }
    async refreshCapacity(provider=()=>navigator.storage?.estimate?.()) {
        if(this.capacityBusy)return;this.capacityBusy=true;
        const restoreFocus=document.activeElement?.dataset?.action==='capacity-refresh';
        const update=()=>{const target=document.getElementById('storage-capacity');if(target)target.innerHTML=this.capacityHTML();};update();
        try{this.capacityInfo=WorkspaceApp.storageEstimate(await provider());}catch(_){this.capacityInfo={usage:null,quota:null};}
        finally{this.capacityBusy=false;update();if(restoreFocus)document.querySelector?.('#storage-capacity [data-action="capacity-refresh"]')?.focus();}
    }
    historyName(session) {
        const w=session.metadata?.workspace;
        return session.name || w?.draft?.name || w?.draft?.caseId || w?.batchDraft?.name || w?.batchDraft?.caseId || w?.single?.child?.caseId || this.t('draft');
    }
    historySearchKey(text) { return String(text??'').normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase(this.prefs.language).trim().replace(/\s+/gu,' '); }
    historySearchText(session) {
        // Saved versions are immutable. A WeakMap avoids retaining discarded catalogs.
        this.historySearchIndex ||= new WeakMap();
        if (!session.summary && !this.historySearchIndex.has(session)) {
            const w = session.metadata?.workspace;
            const people = [w?.draft, w?.batchDraft, w?.single?.child, ...(w?.batch || []).map(e => e.child)];
            this.historySearchIndex.set(session, `${session.name || ''} ${people.map(c => `${c?.name || ''} ${c?.caseId || ''}`).join(' ')} ${session.createdAt || ''}`.toLocaleLowerCase());
        }
        const name=this.historyName(session),aliases=name===this.t('draft')?this.t('draftSearchAliases'):'';
        return this.historySearchKey(`${session.summary?.searchText || this.historySearchIndex.get(session) || ''} ${name} ${aliases}`);
    }
    renderHistoryList() {
        const query = this.historySearchKey(this.search);
        const filtered = query ? this.sessions.filter(s => this.historySearchText(s).includes(query)) : this.sessions;
        const pages = Math.max(1, Math.ceil(filtered.length / 8)); this.historyPage = Math.max(0, Math.min(Number.isFinite(this.historyPage) ? this.historyPage : 0,pages-1));
        const rows = filtered.slice(this.historyPage*8,(this.historyPage+1)*8);
        document.getElementById('history-list').innerHTML = rows.length ? rows.map(s => {
            const w = s.metadata.workspace, count = s.summary?s.summary.count:new Set([...(w?.batch || []).map(e => e.child.id), ...(w?.single ? [w.single.child.id] : [])]).size;
            const reason = s.metadata.importedAt ? 'imported' : s.metadata.reason || 'automatic';
            const name = this.historyName(s);
            const detail = `${this.date(s.createdAt)} · ${this.t(reason)} · ${count} ${this.t('count')}`;
            return `<article class="history-item"><div><div class="item-title">${this.esc(name)}</div><div class="item-sub">${this.esc(detail)}</div></div><button class="btn" data-action="preview" data-id="${this.esc(s.id)}" aria-label="${this.esc(`${this.t('preview')} · ${name} · ${detail}`)}">${this.t('preview')}</button></article>`;
        }).join('') : `<div class="card empty">${this.t('emptyHistory')}</div>`;
        const view={current:this.historyPage,pages,total:filtered.length,from:filtered.length?this.historyPage*8+1:0,to:Math.min(filtered.length,(this.historyPage+1)*8)};
        document.getElementById('history-pages').innerHTML=this.paginationHTML(view,{action:'history-page',previousAction:'history-previous',nextAction:'history-next',statusId:'history-pagination'});
        document.getElementById('history-pagination').textContent = this.paginationRange(view);
        document.querySelector('[data-action="history-previous"]').disabled = this.historyPage === 0;
        document.querySelector('[data-action="history-next"]').disabled = this.historyPage >= pages-1;
    }
    quickGuideHTML() {
        return `<section class="card full quick-guide" aria-labelledby="quick-guide-title"><h2 id="quick-guide-title">${this.t('quickGuideTitle')}</h2>${['Measure','Resume','Transfer','Offline','Reports'].map(topic=>`<details><summary>${this.t('quickGuide'+topic)}</summary><p>${this.t('quickGuide'+topic+'Text')}</p></details>`).join('')}</section>`;
    }
    referencesHTML() {
        const links = [['sourceClinical2023','https://www.who.int/publications/i/item/9789240082830'],['sourceClinical2026','https://www.who.int/publications/i/item/9789240122840'],['sourceWHO','https://www.who.int/tools/child-growth-standards/standards'],['sourceAnthro','https://www.who.int/toolkits/child-growth-standards/software'],['sourceClassification','https://www.who.int/data/nutrition/nlis/info/malnutrition-in-children/'],['sourceCode','https://github.com/WorldHealthOrganization/anthro/tree/'+this.engine.data.sourceCommit+'/data-raw/growthstandards'],['sourceLicense','data/LICENSE-anthro.txt'],['sourceWHO2007','https://www.who.int/tools/growth-reference-data-for-5to19-years'],['sourceLicense2007','data/LICENSE-anthroplus.txt']];
        return `<div class="reference-grid">${this.quickGuideHTML()}<section class="card full"><span class="eyebrow">OMS / WHO · 2006 / 2007</span><h2>${this.t('references')}</h2><div class="source-links">${links.map(([k,url])=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${this.t(k)} ↗</a>`).join('')}</div><p>${this.t('referenceBoth')}</p><p class="meta">${this.esc(this.manifest.referenceVersion)}<br>SHA-256 : ${this.manifest.sha256}</p>${this.olderManifest?`<p class="meta">${this.esc(this.olderManifest.referenceVersion)}<br>SHA-256 : ${this.olderManifest.sha256}</p>`:''}</section>${[['scope','scopeText'],['method','methodText'],['measurementHelp','measurementHelpText'],['privacyTitle','privacyText'],['validationTitle','validationText']].map(([title,text])=>`<section class="card"><h2>${this.t(title)}</h2><p>${this.t(text)}</p></section>`).join('')}<section class="card"><h2>${this.t('updateCurrent').replace('{version}',WorkspaceApp.version)}</h2><button class="btn" data-action="check-update" ${this.offlineRegistration?'':'disabled'}>${this.t('updateCheck')}</button></section></div>`;
    }
    events() {
        this.choicePopup();
        document.addEventListener('keydown',event=>{if(event.key==='Escape'){const menu=document.querySelector('.export-menu[open]');if(menu){event.preventDefault();menu.removeAttribute('open');menu.querySelector('summary')?.focus();return;}}if(this.activeInfo&&event.key==='Escape'){event.preventDefault();this.closeInfo(true);return;}this.choiceKey(event);});
        document.addEventListener('pointerdown',event=>{const menu=document.querySelector('.export-menu[open]');if(menu&&!menu.contains(event.target))menu.removeAttribute('open');if(this.activeChoice&&!document.getElementById('choice-popup')?.contains(event.target)&&!document.getElementById(this.activeChoice.buttonId)?.contains(event.target))this.closeChoice();if(this.activeInfo&&!document.getElementById('info-popup')?.contains(event.target)&&!document.getElementById(this.activeInfo.opener)?.contains(event.target))this.closeInfo();});
        window.addEventListener('resize',()=>{this.closeChoice();this.closeInfo();});
        window.addEventListener('scroll',event=>{if(this.activeChoice&&!document.getElementById('choice-popup')?.contains(event.target))this.closeChoice();if(this.activeInfo&&!document.getElementById('info-popup')?.contains(event.target))this.closeInfo();},true);
        window.addEventListener('beforeprint',()=>this.preparePrint());
        window.addEventListener('afterprint',()=>{const target=document.getElementById('batch-print');if(target)target.textContent='';});
        const header = document.getElementById('header-dialog');
        header.addEventListener('close', () => {
            if (header.open) return;
            const opener = document.getElementById(header.dataset.opener);
            opener?.setAttribute('aria-expanded','false'); opener?.focus({preventScroll:true});
        });
        header.addEventListener('keydown', event => {
            if (event.key !== 'Tab') return;
            const buttons = [...header.querySelectorAll('button:not(:disabled)')];
            const first = buttons[0], last = buttons.at(-1);
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        });
        header.addEventListener('click', event => {
            if (event.target !== header) return;
            const r = header.getBoundingClientRect();
            if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) header.close();
        });
        document.getElementById('workspace-dialog').addEventListener('close',()=>{document.querySelectorAll('#workspace-dialog input[type="password"]').forEach(input=>{input.value='';});this.encryptedPending=null;this.previewRequest=(this.previewRequest||0)+1;this.importRequest=(this.importRequest||0)+1;this.previewedVersion=null;this.stagePreviewSession=null;if(this.preparedImport?.format==='stream'){this.transfers().release(this.preparedImport);this.preparedImport=null;}});
        document.getElementById('app-root').addEventListener('submit', async event => {
            event.preventDefault(); this.readForms();
            try {
                if (event.target.id === 'single-form') { this.state.single = this.engine.calculate(this.state.draft); this.state.draft.visitId = this.state.single.child.visitId; this.state.stale = false; await this.saveImmediate('calculated'); this.singleEditing=false; this.render('results-title'); }
                else if (event.target.id === 'batch-form') {
                    const child = GrowthEngine.normalize(this.state.batchDraft);
                    if (this.state.batch.length >= 500) throw new Error('batchLimit');
                    this.state.batch.push({ child, result: null }); this.batchPage=Math.floor((this.state.batch.length-1)/8);this.state.batchDraft = this.emptyDraft(); await this.saveImmediate('automatic'); this.render('batch-caseId');
                }
            } catch (error) { this.formError(event.target.id.startsWith('batch') ? 'batch' : 'single',error.message); }
        });
        document.getElementById('app-root').addEventListener('input', event => {
            if (event.target.id === 'history-search') { this.search = event.target.value; this.historyPage = 0; this.renderHistoryList(); return; }
            if (event.target.closest('#single-form,#batch-form') || event.target.id === 'paste-data') {
                this.readForms(); if (event.target.closest('#single-form') && this.state.single) { this.state.stale = true; document.getElementById('single-results').innerHTML = this.resultsHTML(this.state.single,true); }
                this.scheduleSave();
            }
        });
        document.getElementById('app-root').addEventListener('change', async event => {
            if (event.target.name === 'ageMode') {
                const form = event.target.closest('form'); form.querySelectorAll('[data-age]').forEach(div => { div.hidden = div.dataset.age !== event.target.value; });
                this.readForms(); this.scheduleSave();
            } else if (event.target.id === 'backup-file') {
                const file = event.target.files[0]; if (file) await this.previewImport(file); event.target.value = '';
            } else if (event.target.id === 'csv-file') {
                const file = event.target.files[0]; if (file) await this.readCSVFile(file); event.target.value = '';
            }
        });
        document.addEventListener('click', event => {
            const button = event.target.closest('[data-action]'); if (!button) return;
            event.preventDefault(); this.action(button.dataset.action,button).catch(error => this.toast(error.message,true));
        });
    }
    readForms() {
        for (const prefix of ['single','batch']) {
            const form = document.getElementById(prefix+'-form'); if (!form) continue;
            const key = prefix === 'single' ? 'draft' : 'batchDraft';
            this.state[key] = {...this.state[key],...Object.fromEntries(new FormData(form))};
        }
        const paste = document.getElementById('paste-data'); if (paste && !this.csvBusy && !this.csvReading) this.state.paste = paste.value;
        this.state.mode = this.page === 'batch' ? 'batch' : this.page === 'single' ? 'single' : this.state.mode;
    }
    checkpoint(captureForm = true) {
        if (captureForm) this.readForms();
        try { this.history.checkpoint(this.state); } catch (error) { this.saveState = 'unsaved'; this.updateSaveStatus(); }
    }
    scheduleSave() { this.saveRevision=(this.saveRevision||0)+1;this.checkpoint(); this.saveState = 'saving'; this.updateSaveStatus(); clearTimeout(this.saveTimer); this.saveTimer = setTimeout(() => this.queueSave(),800); }
    queueSave(reason='automatic',force=false) {
        const source=this.state,revision=this.saveRevision||0,request=this.saveRequest=(this.saveRequest||0)+1;
        const workspace = HistoryManager.clone(this.state);
        const current=()=>this.state===source&&this.saveRequest===request&&(this.saveRevision||0)===revision;
        this.saveState='saving';this.updateSaveStatus();
        this.saving = this.saving.catch(()=>{}).then(async()=>{
            try { await this.history.save(workspace,reason,force); if(current()){this.saveState='saved';this.updateSaveStatus();} }
            catch (error) { if(current()){this.saveState='unsaved';this.updateSaveStatus();}throw error; }
        });
        // The caller can await a durable save; background failures are visible and handled.
        this.saving.catch(error=>console.warn('Local save failed',error));
        return this.saving;
    }
    async saveImmediate(reason='automatic',force=false) { clearTimeout(this.saveTimer); this.checkpoint(false); await this.queueSave(reason,force); }
    updateSaveStatus() { document.querySelectorAll('[data-save-state]').forEach(el=>{ el.textContent=this.t(this.saveState==='saved'?'savedShort':this.saveState);el.title=this.t(this.saveState);el.setAttribute('aria-label',this.t(this.saveState)); el.classList.toggle('error',this.saveState==='unsaved'); }); }
    formError(prefix,key) { const el=document.getElementById(prefix+'-error'); if(el){ el.textContent=this.t(key)===key?this.t('error'):this.t(key); el.hidden=false; el.focus({preventScroll:true}); el.scrollIntoView({block:'nearest'}); } else this.toast(key,true); }
    syncImportNotice() {
        const result=this.page==='single'?this.state.single?.result:null;
        if(!result?.imported){clearTimeout(this.importNoticeTimer);this.importNoticeResult=null;this.importNoticeOpen=false;}
        else if(this.importNoticeResult!==result){
            clearTimeout(this.importNoticeTimer);this.importNoticeResult=result;this.importNoticeOpen=true;
            this.importNoticeTimer=setTimeout(()=>this.dismissImportNotice(),7000);
        }
        this.updateImportNotice();
    }
    updateImportNotice() {
        const notice=document.getElementById('import-toast');if(!notice)return;
        notice.hidden=!this.importNoticeOpen;
        notice.querySelector('[data-import-notice-text]').textContent=this.t('importedResult');
        notice.querySelector('button').title=this.t('close');
    }
    dismissImportNotice() {
        clearTimeout(this.importNoticeTimer);this.importNoticeOpen=false;
        const notice=document.getElementById('import-toast');
        if(notice?.contains(document.activeElement))document.getElementById('results-title')?.focus({preventScroll:true});
        this.updateImportNotice();
    }
    updateToast(){const el=document.getElementById('toast');if(el){el.textContent=this.toastKey?(this.t(this.toastKey)===this.toastKey?this.t('error'):this.t(this.toastKey)):'';el.setAttribute('role',this.toastIsError?'alert':'status');}}
    toast(key,error=false) { this.toastKey=key;this.toastIsError=error;this.updateToast();clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>{this.toastKey=null;this.updateToast();},6500); }
    async action(action,button) {
        this.readForms();
        button.closest?.('.export-menu')?.removeAttribute('open');
        if(action==='dismiss-import-notice')this.dismissImportNotice();
        else if(action==='toggle-sidebar'){this.prefs.navCollapsed=!this.prefs.navCollapsed;this.persistPreferences();this.applyPreferences();this.render('sidebar-button');}
        else if(action==='open-select')this.openChoice(button.id,'field',button.dataset.select);
        else if(action==='choice-value')this.chooseValue(button.dataset.value);
        else if(action==='show-info')this.showInfo(button.dataset.info,button.id);
        else if(action==='close-info')this.closeInfo(true);
        else if(action==='toggle-csv'){
            const open=button.getAttribute('aria-expanded')!=='true';
            button.setAttribute('aria-expanded',String(open));
            for(const id of ['csv-tools-body','csv-heading-actions'])document.getElementById(id).hidden=!open;
        }
        else if(action==='batch-page'){const page=Number(button.dataset.page);if(Number.isInteger(page)){this.batchPage=page;this.render('batch-results-title');}}
        else if(action==='header-panel')this.openHeaderPanel(button.dataset.kind);
        else if(action==='close-header')document.getElementById('header-dialog').close();
        else if(action==='set-preference')this.setPreference(button.dataset.kind,button.dataset.value);
        else if(action==='header-page'){
            if(!['single','batch','history','references','settings'].includes(button.dataset.value))return;
            const d=document.getElementById('header-dialog');d.dataset.opener='';d.close();
            this.page=button.dataset.value;if(this.page==='history')this.sessions=await this.history.catalog();this.render('main');
        }
        else if(action==='apply-update')await this.applyUpdate();
        else if(action==='check-update')await this.checkUpdate();
        else if(action==='capacity-refresh')await this.refreshCapacity();
        else if(action==='stage-refresh')await this.refreshStages();
        else if(action==='stage-previous'||action==='stage-next'){this.stagePage=(this.stagePage||0)+(action==='stage-next'?1:-1);await this.refreshStages();}
        else if(action==='stage-local-copy')await this.createLocalCopy();
        else if(action==='stage-review')await this.reviewStage(button.dataset.name);
        else if(action==='stage-preview-session')await this.previewStageVersion(Number(button.dataset.seq));
        else if(action==='stage-detail-previous'||action==='stage-detail-next'){this.stagePreviewPage+=(action==='stage-detail-next'?1:-1);this.renderStagePreview();this.focusPagination('stage-detail-page');}
        else if(action==='stage-detail-page'){const page=Number(button.dataset.page);if(Number.isInteger(page)&&page>=0){this.stagePreviewPage=page;this.renderStagePreview();this.focusPagination('stage-detail-page');}}
        else if(action==='stage-back'&&this.preparedImport)this.showImportPreview(this.preparedImport,this.importOverview.name,this.importOverview.duplicate);
        else if(action==='page'){ this.page=button.dataset.page; if(this.page==='history')this.sessions=await this.history.catalog(); this.render(); document.getElementById('main').focus({preventScroll:true}); }
        else if(action==='edit-measures'||action==='show-results'){ this.singleEditing=action==='edit-measures'; this.render(this.singleEditing?'single-caseId':'results-title'); }
        else if(action==='save'){ await this.saveImmediate('manual',true); this.toast('manualSaved'); if(this.page==='history'){this.sessions=await this.history.catalog();this.renderHistoryList();await this.refreshCapacity();} }
        else if(action==='new'){ await this.saveImmediate('beforeNew'); this.state=this.emptyWorkspace();this.singleEditing=false;this.state.mode=this.page==='batch'?'batch':'single';this.batchPage=0; this.saveState='ready'; this.render(this.page==='batch'?'batch-caseId':'single-caseId'); }
        else if(action==='new-visit'){
            const child = this.state.single?.child;if(!child?.caseId)return;
            await this.saveImmediate('beforeNew');this.state=this.emptyWorkspace();this.singleEditing=false;
            Object.assign(this.state.draft,{caseId:child.caseId,name:child.name,gender:child.gender,birthDate:child.birthDate || '',ageMode:child.birthDate?'dates':child.ageMode || 'months'});
            this.page='single';await this.saveImmediate('automatic');this.render('single-caseId');
        }
        else if(action==='view-case'){this.search=button.dataset.caseId;this.historyPage=0;this.sessions=await this.history.catalog();this.page='history';this.render('history-search');}
        else if(action==='calculate-batch'){
            button.disabled=true;
            try { const entries=this.state.batch.map(e=>this.engine.calculate(e.child)); this.state.batch=entries; await this.saveImmediate('calculated'); this.render('batch-results-title'); }
            finally {button.disabled=false;}
        }
        else if(action==='parse-csv') await this.addCSV(this.state.paste);
        else if(action==='csv-template')this.download('name,caseId,ageYears,ageMonths,weight,height,gender,position,oedema,muac\r\nExemple fictif,TEST-001,1,0,8500,75,M,L,n,130\r\n','zscore-modele.csv','text/csv');
        else if(action==='reporting')this.reportingDialog();
        else if(action==='download-report')this.downloadReport(false);
        else if(action==='download-dhis2')this.downloadReport(true);
        else if(action==='export-summary'){const models=this.lotModels(),model=models.find(m=>m.family===(button.dataset.family||'WHO2006'))||models[0];if(model)this.download(CSVManager.summary(model),'zscore-resume-lot-'+model.family+'-'+ClinicalEngine.today()+'.csv','text/csv');}
        else if(action==='csv-results'){ const entries=this.page==='batch'?this.state.batch:this.state.single?[this.state.single]:[]; this.download(CSVManager.results(entries),'zscore-resultats.csv','text/csv'); }
        else if(action==='print')window.print();
        else if(action==='export-pdf')await this.exportPDF(button.dataset.layout);
        else if(action==='password-export')this.passwordDialog();
        else if(action==='confirm-encrypted-export')await this.passwordOperation(false,button);
        else if(action==='unlock-backup')await this.passwordOperation(true,button);
        else if(action==='export-backup')await this.exportBackup();
        else if(action==='history-previous'||action==='history-next'){this.historyPage+=action==='history-next'?1:-1;this.renderHistoryList();this.focusPagination('history-page');}
        else if(action==='history-page'){const page=Number(button.dataset.page);if(Number.isInteger(page)&&page>=0){this.historyPage=page;this.renderHistoryList();this.focusPagination('history-page');}}
        else if(action==='preview')await this.previewSession(this.sessions.find(s=>s.id===button.dataset.id));
        else if(action==='close-dialog'){document.querySelectorAll('#workspace-dialog input[type="password"]').forEach(input=>{input.value='';});this.encryptedPending=null;document.getElementById('workspace-dialog').close();}
        else if(action==='restore'){const selected=this.previewedVersion||this.sessions.find(s=>s.id===button.dataset.id);if(selected?.id===button.dataset.id&&selected.metadata?.workspace)await this.restore(selected);else this.toast('historyReadFailed',true);}
        else if(action==='commit-import'){
            if(!this.preparedImport)return;button.disabled=true;
            try{await this.transfers().commit(this.preparedImport);this.preparedImport=null;document.getElementById('workspace-dialog').close();this.sessions=await this.history.catalog();this.page='history';this.render('main');this.toast('importDone');}
            finally{button.disabled=false;}
        }
    }
    download(content,name,type){const url=URL.createObjectURL(new Blob([content],{type:type==='application/pdf'?type:type+';charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
    reportingDialog() {
        this.reportingEntries=HistoryManager.clone(this.state.batch);
        const period=(this.state.batch.find(e=>e.child.measurementDate)?.child.measurementDate||ClinicalEngine.today()).slice(0,7);
        this.dialog('reportTitle',`<p>${this.t('reportHelp')}</p><div class="field"><label for="report-period">${this.t('reportPeriod')}</label><input id="report-period" type="month" value="${this.esc(period)}"></div><details><summary>${this.t('reportMapping')}</summary><p>${this.t('reportMappingHelp')}</p><div class="field"><label for="report-profile">${this.t('reportMapping')}</label><textarea id="report-profile" rows="6" maxlength="20000" spellcheck="false" dir="ltr"></textarea></div></details>`,`<button class="btn" data-action="download-report">${this.t('reportGeneric')}</button><button class="btn" data-action="download-dhis2">${this.t('reportDhis2')}</button>`);
    }
    downloadReport(dhis2) {
        const period=document.getElementById('report-period').value.replace('-','');
        const report=ReportingUI.aggregate(this.reportingEntries,period);
        let output=report;
        if(dhis2){let profile;try{profile=JSON.parse(document.getElementById('report-profile').value);}catch(_){throw new Error('reportMappingInvalid');}output=ReportingUI.dhis2(report,profile);}
        this.download(JSON.stringify(output,null,2),'zscore-'+(dhis2?'dhis2-':'aggregate-')+period+'.json','application/json');
        this.toast('reportExported');
    }
    passwordDialog(file=null) {
        if(this.transferBusy||this.cryptoBusy){this.toast('transferPreparing');return;}
        this.encryptedPending=file;
        this.dialog(file?'unlockBackup':'exportEncrypted',`<p>${this.t('encryptedHelp')}</p><div class="field"><label for="backup-password">${this.t('backupPassword')}</label><input id="backup-password" type="password" minlength="12" maxlength="1024" autocomplete="${file?'current-password':'new-password'}"></div>${file?'':`<div class="field"><label for="backup-password-confirm">${this.t('backupPasswordConfirm')}</label><input id="backup-password-confirm" type="password" minlength="12" maxlength="1024" autocomplete="new-password"></div>`}`,`<button class="btn primary" data-action="${file?'unlock-backup':'confirm-encrypted-export'}">${this.t(file?'unlockBackup':'exportEncrypted')}</button>`);
        document.getElementById('backup-password').focus();
    }
    async passwordOperation(unlock,button) {
        if(this.cryptoBusy||this.transferBusy)return;
        const input=document.getElementById('backup-password'),confirm=document.getElementById('backup-password-confirm');
        let password=input.value;
        if(password.length<12||new TextEncoder().encode(password).length>1024){this.toast('backupPasswordInvalid',true);input.focus();return;}
        if(!unlock&&password!==confirm.value){this.toast('backupPasswordMismatch',true);confirm.focus();return;}
        const file=this.encryptedPending,epoch=this.renderEpoch;this.cryptoBusy=true;
        input.value='';if(confirm)confirm.value='';this.encryptedPending=null;button.disabled=true;
        document.getElementById('workspace-dialog').close();
        try{
            if(unlock){
                const blob=await SecureBackup.decrypt(file,password);
                if(epoch!==this.renderEpoch)return;
                await this.previewImport(new File([blob],(file.name||'backup.zscore.enc').replace(/\.enc$/i,''),{type:'application/x-ndjson'}),{decrypted:true});
            }else await this.exportBackup(password);
        }catch(error){this.toast(error.message,true);}
        finally{password='';this.cryptoBusy=false;button.disabled=false;}
    }
    async exportBackup(password=null){
        if(this.transferBusy)return;this.transferBusy=true;this.transferStatus(true);this.toast('transferPreparing');
        document.querySelectorAll('[data-action="export-backup"],[data-action="password-export"]').forEach(b=>{b.disabled=true;});
        try{
            await this.saveImmediate('beforeExport');
            let content=await this.transfers().export(this.prefs,n=>this.transferStatus(n));
            if(password!==null)content=await SecureBackup.encrypt(content,password);
            this.download(content,'zscore-sauvegarde-'+new Date().toISOString().replace(/[:.]/g,'-')+(password!==null?'.zscore.enc':'.zscore'),password!==null?'application/octet-stream':'application/x-ndjson');this.toast(password!==null?'encryptedReady':'exportSensitive');
            if(this.page==='history'){this.sessions=await this.history.catalog();this.renderHistoryList();await this.refreshCapacity();}
        }finally{this.transferBusy=false;this.transferStatus();document.querySelectorAll('[data-action="export-backup"],[data-action="password-export"]').forEach(b=>{b.disabled=false;});}
    }
    async exportPDF(layout='detailed'){
        if(this.pdfBusy)return;
        const mode=this.page==='batch'?'batch':'single',entries=HistoryManager.clone(mode==='batch'?this.state.batch:this.state.single?[this.state.single]:[]);
        const options={mode,layout,language:this.prefs.language,translations:this.translations,stale:mode==='single'&&this.state.stale};
        if(!entries.length)throw new Error('pdfInvalid');
        this.pdfBusy=true;this.toast('pdfPreparing');
        document.querySelectorAll('[data-action="export-pdf"]').forEach(button=>{button.disabled=true;});
        try{
            const fonts=this.pdfFonts||await PDFManager.loadFonts();this.pdfFonts=fonts;
            const result=PDFManager.build(entries,options,{jsPDF:window.jspdf?.jsPDF,autoTable:window.autoTable,fonts});
            this.download(result.bytes,'zscore-'+mode+(mode==='batch'&&layout==='compact'?'-compact':'')+'-'+options.language+'-'+new Date().toISOString().replace(/[:.]/g,'-')+'.pdf','application/pdf');
            this.toast('pdfReady');
        }catch(error){this.toast(error.message==='pdfInvalid'?'pdfInvalid':'pdfUnavailable',true);}
        finally{this.pdfBusy=false;document.querySelectorAll('[data-action="export-pdf"]').forEach(button=>{button.disabled=this.page==='batch'&&!this.state.batch.length;});}
    }
    updateCSVControls(){
        for(const id of ['csv-file','paste-data','csv-parse-button']){
            const control=document.getElementById(id);if(control)control.disabled=!!(this.csvBusy||this.csvReading);
        }
    }
    async readCSVFile(file){
        if(this.csvBusy||this.csvReading)return;
        if(file.size>2_000_000){this.toast('csvTooLarge',true);return;}
        const workspace=this.state,epoch=this.renderEpoch;
        this.csvReading=true;this.updateCSVControls();let text;
        try{text=await file.text();}
        catch(error){if(this.state===workspace&&this.page==='batch')this.toast('csvReadFailed',true);return;}
        finally{this.csvReading=false;this.updateCSVControls();}
        if(this.state!==workspace||this.page!=='batch'||this.renderEpoch!==epoch){this.toast('csvCancelled');return;}
        await this.addCSV(text);
    }
    async addCSV(text){
        if(this.csvBusy||this.csvReading)return;
        this.readForms();
        let children;
        try{children=CSVManager.parse(text,{extended:!!this.engine?.older});if(this.state.batch.length+children.length>500)throw new Error('batchLimit');}
        catch(error){this.toast(['batchLimit','csvTooLarge'].includes(error.message)?error.message:'csvInvalid',true);return;}
        const workspace=this.state,epoch=this.renderEpoch;
        const current=()=>this.state===workspace&&this.renderEpoch===epoch&&this.page==='batch';
        this.csvBusy=true;this.updateCSVControls();
        this.state.batch.push(...children.map(child=>({child,result:null})));this.batchPage=Math.floor((this.state.batch.length-1)/8);this.state.paste='';
        try{await this.saveImmediate('imported');if(current()){this.render('batch-results-title');this.toast('added');}}
        catch(error){if(current()){this.render('batch-results-title');this.toast('unsaved',true);}}
        finally{this.csvBusy=false;this.updateCSVControls();}
    }
    dialog(title,html,buttons='') {const d=document.getElementById('workspace-dialog');d.innerHTML=`<div class="dialog-top"><h2 id="dialog-title">${this.t(title)}</h2><button class="btn" data-action="close-dialog" aria-label="${this.t('close')}">×</button></div><div class="dialog-body" role="region" aria-labelledby="dialog-title" tabindex="0">${html}</div><div class="toolbar">${buttons}<button class="btn" data-action="close-dialog">${this.t('close')}</button></div>`;if(!d.open)d.showModal();}
    async previewSession(row){
        const epoch=this.renderEpoch,request=this.previewRequest=(this.previewRequest||0)+1;let session;
        try{session=await this.history.version(row);}catch(_){if(request===this.previewRequest)this.toast('historyReadFailed',true);return;}
        if(epoch!==this.renderEpoch||request!==this.previewRequest)return;
        if(!session){this.toast('historyReadFailed',true);return;}
        this.previewedVersion=session;
        if(!session?.metadata?.workspace)return;
        const w=session.metadata.workspace,entries=[...(w.single?[w.single]:[]),...(w.batch||[])];
        this.dialog('preview',`<p class="lede">${this.t('previewHelp')}</p><p class="meta">${this.date(session.createdAt)}</p><p class="meta">${this.t(w.mode === 'batch' ? 'batch' : 'single')}</p>${this.previewDraft(w.draft,'single')}${this.previewDraft(w.batchDraft,'batch')}${w.paste?`<p class="hint">CSV</p><pre>${this.esc(w.paste)}</pre>`:''}${entries.length?`<div class="table-scroll">${this.tableHTML(entries)}</div>`:''}${w.single?this.resultsHTML(w.single,w.stale,true):''}`,`<button class="btn primary" data-action="restore" data-id="${this.esc(session.id)}">${this.t('restore')}</button>`);
    }
    previewDraft(draft, mode) {
        if (!draft || !HistoryManager.hasWork({[mode === 'batch' ? 'batchDraft' : 'draft']:draft})) return '';
        const ageFields = draft.ageMode === 'dates' ? ['birthDate'] : draft.ageMode === 'days' ? ['ageDays'] : ['ageYears','ageMonths'];
        const fields=['caseId','name','ageMode',...ageFields,'measurementDate','weight','height','gender','position','oedema',...NutritionUI.inputFields];
        const labels = { gender:{M:'male',F:'female'}, position:{L:'lying',H:'standing'}, oedema:{n:'no',y:'yes'} };
        const value = key => key === 'ageMode' ? this.t(draft[key]) : labels[key]?.[draft[key]] ? this.t(labels[key][draft[key]]) : draft[key];
        return `<h3>${this.t('draft')} · ${this.t(mode)}</h3><div class="preview-grid">${fields.filter(k=>draft[k]!==''&&draft[k]!==undefined&&draft[k]!==null).map(k=>`<dl><dt>${this.t(k)}</dt><dd>${this.esc(value(k))}</dd></dl>`).join('')}</div>`;
    }
    async restore(session){
        if(!session?.metadata?.workspace)return;
        HistoryManager.checkWorkspace(session.metadata.workspace);
        await this.saveImmediate('beforeRestore');
        const workspace=HistoryManager.clone(session.metadata.workspace), map=new Map();
        for(const entry of [...workspace.batch,...(workspace.single?[workspace.single]:[])]){
            const id=entry.child.id;if(!map.has(id))map.set(id,'child_'+crypto.randomUUID());entry.child.id=map.get(id);
            if(entry.result){entry.result.id='result_'+crypto.randomUUID();entry.result.childId=entry.child.id;}
        }
        if(workspace.single && !Object.keys(workspace.draft||{}).length)workspace.draft={...workspace.single.child};
        workspace.draft={...this.emptyDraft(),...workspace.draft};workspace.batchDraft={...this.emptyDraft(),...workspace.batchDraft};
        if(workspace.single?.child?.visitId && !workspace.draft.visitId)workspace.draft.visitId=workspace.single.child.visitId;
        delete workspace.draft.id;delete workspace.batchDraft.id;
        // Save the restored copy before changing any live fields.
        await this.history.save(workspace,'restoreCopy',true);
        this.state=workspace;this.singleEditing=!!workspace.stale;this.batchPage=0;this.checkpoint(false);this.page=workspace.mode==='batch'?'batch':'single';document.getElementById('workspace-dialog').close();this.render('main');this.toast('restored');
    }
    async previewImport(file,{decrypted=false}={}){
        if(this.transferBusy||this.cryptoBusy&&!decrypted){this.toast('transferPreparing');return;}
        const encryptedEpoch=this.renderEpoch;
        if(await SecureBackup.isEncrypted(file)){
            if(encryptedEpoch===this.renderEpoch)this.passwordDialog(file);
            return;
        }
        const epoch=this.renderEpoch,request=this.importRequest=(this.importRequest||0)+1;
        if(this.preparedImport?.format==='stream')this.transfers().release(this.preparedImport);this.preparedImport=null;
        let prepared;
        try{
            this.toast('transferPreparing');this.transferStatus(true);
            prepared=await this.transfers().prepare(file,n=>{if(request===this.importRequest)this.transferStatus(n);});
            const duplicate=await this.transfers().hasImported(prepared);
            if(epoch!==this.renderEpoch||request!==this.importRequest){this.transfers().release(prepared);return;}
            this.showImportPreview(prepared,file.name,duplicate);
        }catch(error){if(prepared?.format==='stream')this.transfers().release(prepared);if(request!==this.importRequest)return;this.preparedImport=null;this.toast(error instanceof SyntaxError||error instanceof TypeError?'importInvalid':error.message,true);}
        finally{if(request===this.importRequest)this.transferStatus();}
    }
    chartsHTML(entries){let engines=this.engine.older?[this.engine.young,this.engine.older].filter(engine=>entries.some(e=>e.result?.referenceVersion===engine.data.referenceVersion)):[this.engine];if(!engines.length)engines=[this.engine.young||this.engine];return engines.map(engine=>GrowthChart.referenceHTML(entries.filter(e=>e.result?.referenceVersion===engine.data.referenceVersion),engine,this)+GrowthChart.html(entries,engine.data.referenceVersion,this)).join('');}
    async renderFollowup(){
        const entry=this.state.single,child=entry?.child,epoch=this.renderEpoch;if(!entry?.result)return;
        const {entries,identityConflict}=child.caseId?await this.history.caseVisits(child.caseId,child.gender,child.birthDate):{entries:[entry],identityConflict:false};
        if(epoch!==this.renderEpoch || this.page!=='single' || this.state.single!==entry)return;
        const target=document.getElementById('single-results');if(!target)return;
        const visits=target.querySelector('[data-single-visits]'),charts=target.querySelector('[data-single-charts]');
        if(visits&&child.caseId)visits.innerHTML=identityConflict?`<p class="notice warn">${this.t('followupIdentityWarning')}</p>`:'';
        if(charts)charts.innerHTML=this.chartsHTML(entries.length?entries:[entry]);
    }
    updateConnection(){const badge=document.getElementById('connection');if(badge)badge.innerHTML=`<span class="dot" aria-hidden="true"></span>${this.t(navigator.onLine?'online':'offline')}`;}
    updateOfflineStatus(){document.querySelectorAll('[data-offline-status]').forEach(el=>{el.textContent=this.t(this.offlineState);});}
    updateHTML(){
        if(!this.offlineRegistration?.waiting&&!this.reloadAvailable&&!this.updateError)return '';
        const available=!!this.offlineRegistration?.waiting||this.reloadAvailable;
        return `<div class="notice ${this.updateError?'warn':'recovery'}" role="status"><div><strong>${this.t(available?'updateReady':'updateFailed')}</strong><p>${this.t(available?'updateHelp':'updateFailedHelp')}</p>${this.updateError&&(available||this.updateError!=='updateFailedHelp')?`<p>${this.esc(this.t(this.updateError))}</p>`:''}</div><button class="btn" data-action="${available?'apply-update':'check-update'}" ${this.updateApplying?'disabled':''}>${this.t(this.updateApplying?'updateSaving':available?'updateApply':'updateRetry')}</button></div>`;
    }
    updateUpdateStatus(){const el=document.getElementById('update-notice');if(el)el.innerHTML=this.updateHTML();}
    async checkUpdate(){
        if(!this.offlineRegistration){this.toast('offlineFailed',true);return;}
        try{await this.offlineRegistration.update();this.updateError=null;this.updateUpdateStatus();this.toast('updateChecked');}
        catch(_){this.updateError='updateFailedHelp';this.updateUpdateStatus();}
    }
    activateWaitingWorker(worker){
        return new Promise((resolve,reject)=>{
            const channel=new MessageChannel(),sw=navigator.serviceWorker;
            const cleanup=()=>{clearTimeout(timer);sw.removeEventListener('controllerchange',changed);channel.port1.close();};
            const changed=()=>{cleanup();resolve();};
            const timer=setTimeout(()=>{cleanup();reject(new Error('updateFailed'));},10000);
            sw.addEventListener('controllerchange',changed);
            channel.port1.onmessage=event=>{if(event.data?.error){cleanup();reject(new Error(event.data.error));}};
            try{worker.postMessage({type:'ACTIVATE_UPDATE'},[channel.port2]);}catch(_){cleanup();reject(new Error('updateFailed'));}
        });
    }
    async applyUpdate(){
        if(this.updateApplying)return;
        const worker=this.offlineRegistration?.waiting;
        if(!worker&&!this.reloadAvailable)return;
        this.readForms();this.updateApplying=true;this.updateError=null;
        const root=document.getElementById('app-root');root.inert=true;this.updateUpdateStatus();
        try{
            try{await this.saveImmediate('beforeUpdate',true);}catch(_){throw new Error('updateSaveFailed');}
            if(worker)await this.activateWaitingWorker(worker);
            location.reload();
        }catch(error){this.updateError=error.message;this.toast(error.message,true);}
        finally{root.inert=false;this.updateApplying=false;this.updateUpdateStatus();}
    }
    async registerOffline(){
        if(!('serviceWorker' in navigator)){this.offlineState='offlineFailed';this.updateOfflineStatus();return;}
        try{
            const registration=await navigator.serviceWorker.register('sw.js',{updateViaCache:'none'});
            this.offlineRegistration=registration;
            const controlled=!!navigator.serviceWorker.controller;
            navigator.serviceWorker.addEventListener('controllerchange',()=>{this.offlineState='offlineReady';this.reloadAvailable=true;this.updateOfflineStatus();this.updateUpdateStatus();});
            const inspect=()=>{
                if(registration.active){this.offlineState='offlineReady';this.updateOfflineStatus();}
                this.updateUpdateStatus();
            };
            const watch=worker=>{
                if(!worker)return;
                worker.addEventListener('statechange',()=>{
                    if(worker.state==='redundant'){if(!registration.active)this.offlineState='offlineFailed';this.updateError='updateFailedHelp';this.updateOfflineStatus();}
                    if(worker.state==='activated'&&!controlled)this.reloadAvailable=false;
                    inspect();
                });
            };
            registration.addEventListener('updatefound',()=>watch(registration.installing));
            watch(registration.installing);inspect();
        }catch(error){this.offlineState=navigator.serviceWorker.controller?'offlineReady':'offlineFailed';this.updateOfflineStatus();console.warn('Offline setup failed',error);}
    }
}
if (typeof module !== 'undefined' && module.exports) module.exports = { WorkspaceApp };
else {
    if(typeof ReleaseGuard==='undefined'){
        const root=document.getElementById('app-root');root.textContent='Fichiers indisponibles. Aucun calcul ouvert. Réessayez. / Files unavailable. No calculator opened. Try again. / الملفات غير متاحة. لم تُفتح أداة الحساب. أعد المحاولة.';root.setAttribute('role','alert');root.className='startup';
        const retry=document.createElement('button');retry.className='btn';retry.textContent='Réessayer / Try again / أعد المحاولة';retry.addEventListener('click',()=>location.reload());root.append(retry);
    }else try{if(ReleaseGuard.failed)throw new Error('releaseInvalid');const workspaceApp=new WorkspaceApp();workspaceApp.init();}catch(_){ReleaseGuard.fail();}
}
