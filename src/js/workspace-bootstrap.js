/** Loaded before the application; errors never authorize calculations or erase local work. */
class ReleaseGuard {
    static failed = false;
    static async digest(bytes) {
        const hash=await crypto.subtle.digest('SHA-256',bytes);
        return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
    }
    static async verifyData(paths,responses) {
        if(this.failed||paths.length!==responses.length||responses.some(r=>!r.ok))throw new Error('releaseInvalid');
        if([...document.querySelectorAll('link[rel="stylesheet"]')].some(link=>!link.sheet))throw new Error('releaseInvalid');
        let pins;try{pins=JSON.parse(document.querySelector('meta[name="zscore-data-integrity"]')?.content||'{}');}catch(_){throw new Error('releaseInvalid');}
        const bytes=await Promise.all(responses.map(r=>r.arrayBuffer())),hashes=await Promise.all(bytes.map(b=>this.digest(b)));
        if(this.failed||paths.some((path,i)=>!Object.hasOwn(pins,path)||!/^[a-f0-9]{64}$/.test(pins[path])||hashes[i]!==pins[path]))throw new Error('releaseInvalid');
        return {texts:bytes.map(b=>new TextDecoder('utf-8',{fatal:true}).decode(b)),hashes};
    }
    static fail() {
        this.failed=true;
        const root=document.getElementById('app-root');if(!root)return;
        const lang=document.documentElement.lang;
        const messages={fr:['Les fichiers de cette version sont incomplets ou incohérents. Aucun calcul n’a été ouvert. Vos sauvegardes locales restent conservées. Réessayez lorsque la version complète est disponible.','Réessayer'],
            en:['This version has incomplete or inconsistent files. No calculator was opened. Your local backups are kept. Try again when the complete version is available.','Try again'],
            ar:['ملفات هذا الإصدار غير مكتملة أو غير متوافقة. لم تُفتح أداة الحساب. تبقى نسخك المحلية محفوظة. أعد المحاولة عندما يتوفر الإصدار الكامل.','أعد المحاولة']};
        const [message,label]=messages[lang]||messages.fr;
        root.textContent='';root.setAttribute('role','alert');root.className='startup';
        const p=document.createElement('p');p.textContent=message;
        const button=document.createElement('button');button.className='btn';button.textContent=label;button.addEventListener('click',()=>location.reload());
        root.append(p,button);
    }
}
if(typeof module!=='undefined'&&module.exports)module.exports={ReleaseGuard};
else {window.ReleaseGuard=ReleaseGuard;
(() => {
    let prefs = {};
    try { prefs = JSON.parse(localStorage.getItem('zscore-ui-v2') || '{}'); } catch (_) { /* Settings are optional. */ }
    const dark = prefs.theme === 'dark' || (!prefs.theme || prefs.theme === 'system') && matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.documentElement.lang = ['fr', 'en', 'ar'].includes(prefs.language) ? prefs.language : 'fr';
    document.documentElement.dir = document.documentElement.lang === 'ar' ? 'rtl' : 'ltr';
    window.addEventListener('error',event=>{
        if(event.target?.tagName==='SCRIPT'||event.target?.tagName==='LINK'&&event.target.rel==='stylesheet')ReleaseGuard.fail();
    },true);
    document.addEventListener('DOMContentLoaded',()=>{if(ReleaseGuard.failed)ReleaseGuard.fail();});
})();
}
