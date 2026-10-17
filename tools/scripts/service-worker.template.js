/** Verified release cache. Earlier caches, journals and patient archives are never deleted. */
const STATIC_CACHE_NAME = 'zscore-release-' + RELEASE.id + '-' + self.registration.scope;
const STATIC_ASSETS = Object.keys(RELEASE.assets);
const assetURLs = STATIC_ASSETS.map(asset => new URL(asset, self.registration.scope).href);
const hashes = new Map(STATIC_ASSETS.map((asset,i)=>[assetURLs[i],RELEASE.assets[asset]]));
async function verifiedResponse(url) {
    const response = await fetch(new Request(url,{cache:'reload',credentials:'same-origin'}));
    if (!response.ok) throw new Error('Release resource unavailable: '+url);
    const digest = await crypto.subtle.digest('SHA-256',await response.clone().arrayBuffer());
    const actual = Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
    if (actual !== hashes.get(url)) throw new Error('Release resource mismatch: '+url);
    return response;
}
self.addEventListener('install', event => {
    event.waitUntil((async()=>{
        // Validate the entire set before writing. A rejected install leaves the active release alone.
        const responses = await Promise.all(assetURLs.map(verifiedResponse));
        const cache = await caches.open(STATIC_CACHE_NAME);
        await Promise.all(assetURLs.map((url,i)=>cache.put(url,responses[i])));
        // No automatic skipWaiting: open work stays on its current release.
    })());
});
self.addEventListener('activate', event => {
    // Do not claim uncontrolled documents or erase historical caches/data.
    event.waitUntil(Promise.resolve());
});
self.addEventListener('fetch', event => {
    const request=event.request,url=new URL(request.url);
    if(request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
    event.respondWith((async()=>{
        const cache=await caches.open(STATIC_CACHE_NAME),canonical=url.origin+url.pathname;
        const target=request.mode==='navigate'?new URL('index.html',self.registration.scope).href:canonical;
        if(hashes.has(target)){
            const cached=await cache.match(target);if(cached)return cached;
            try{const response=await verifiedResponse(target);await cache.put(target,response.clone());return response;}
            catch(_){return new Response('Ressource indisponible hors ligne',{status:503});}
        }
        try{return await fetch(request);}catch(_){return new Response('Ressource indisponible hors ligne',{status:503});}
    })());
});
self.addEventListener('message',event=>{
    if(event.data?.type!=='ACTIVATE_UPDATE'||!event.ports?.[0])return;
    event.waitUntil((async()=>{
        const port=event.ports[0],source=event.source;
        if(!source?.id||!source.url.startsWith(self.registration.scope)){port.postMessage({error:'updateFailed'});return;}
        const clients=(await self.clients.matchAll({type:'window',includeUncontrolled:true})).filter(c=>c.url.startsWith(self.registration.scope));
        // Never force a reload over another tab's uncommitted work.
        if(clients.some(c=>c.id!==source.id)){port.postMessage({error:'updateOtherTabs'});return;}
        await self.skipWaiting();port.postMessage({status:'activating'});
    })().catch(()=>event.ports[0].postMessage({error:'updateFailed'})));
});
