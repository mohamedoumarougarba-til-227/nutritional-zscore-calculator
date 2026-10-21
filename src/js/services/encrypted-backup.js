/** Portable authenticated encryption using the platform Web Crypto implementation.
 * Chunked to avoid a whole-archive ArrayBuffer. No key or password persistence.
 */
class EncryptedBackup {
    static magic = 'ZSCOREENC1\n';
    static chunkSize = 1048576;
    static maxBytes = 1024 ** 3;
    static iterations = 600000;
    static bytes(text) { return new TextEncoder().encode(text); }
    static hex(bytes) { return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join(''); }
    static unhex(text,length) {
        if(typeof text!=='string'||text.length!==length*2||!/^[0-9a-f]+$/.test(text))throw new Error('encryptedInvalid');
        return Uint8Array.from(text.match(/../g),v=>parseInt(v,16));
    }
    static async key(password,salt) {
        if(!globalThis.crypto?.subtle)throw new Error('cryptoUnavailable');
        const bytes=this.bytes(password);
        if(typeof password!=='string'||password.length<12||bytes.length>1024)throw new Error('backupPasswordInvalid');
        try {
            const material=await crypto.subtle.importKey('raw',bytes,'PBKDF2',false,['deriveKey']);
            return await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:this.iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
        } finally { bytes.fill(0); }
    }
    static parameters(header,index,prefix) {
        const iv=new Uint8Array(12);iv.set(prefix);new DataView(iv.buffer).setUint32(8,index);
        const aad=new Uint8Array(header.length+4);aad.set(header);new DataView(aad.buffer).setUint32(header.length,index);
        return {name:'AES-GCM',iv,additionalData:aad,tagLength:128};
    }
    static async isEncrypted(file) { return await file.slice(0,this.magic.length).text()===this.magic; }
    static async encrypt(file,password,onProgress=()=>{}) {
        if(!Number.isSafeInteger(file.size)||file.size<1||file.size>this.maxBytes)throw new Error('encryptedTooLarge');
        if(!globalThis.crypto?.subtle)throw new Error('cryptoUnavailable');
        const salt=crypto.getRandomValues(new Uint8Array(16)),prefix=crypto.getRandomValues(new Uint8Array(8));
        const key=await this.key(password,salt);
        const raw=this.bytes(JSON.stringify({version:1,algorithm:'AES-256-GCM',kdf:'PBKDF2-SHA256',iterations:this.iterations,salt:this.hex(salt),ivPrefix:this.hex(prefix),chunkSize:this.chunkSize,bytes:file.size}));
        const length=new Uint8Array(4);new DataView(length.buffer).setUint32(0,raw.length);
        const header=this.bytes(this.magic),parts=[header,length,raw];
        const authenticated=new Uint8Array(header.length+4+raw.length);authenticated.set(header);authenticated.set(length,header.length);authenticated.set(raw,header.length+4);
        for(let index=0,offset=0;offset<file.size;index++,offset+=this.chunkSize){
            const plain=new Uint8Array(await file.slice(offset,offset+this.chunkSize).arrayBuffer());
            try{parts.push(await crypto.subtle.encrypt(this.parameters(authenticated,index,prefix),key,plain));}
            finally{plain.fill(0);}
            onProgress(Math.min(offset+this.chunkSize,file.size));
        }
        return new Blob(parts,{type:'application/octet-stream'});
    }
    static async decrypt(file,password,onProgress=()=>{}) {
        if(!await this.isEncrypted(file))throw new Error('encryptedInvalid');
        const offset=this.magic.length;
        if(file.size<offset+5)throw new Error('encryptedInvalid');
        const size=new DataView(await file.slice(offset,offset+4).arrayBuffer()).getUint32(0);
        if(size<1||size>1024||file.size<offset+4+size)throw new Error('encryptedInvalid');
        const start=offset+4+size,authenticated=new Uint8Array(await file.slice(0,start).arrayBuffer());
        let h;try{h=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(authenticated.slice(offset+4)));}catch(_){throw new Error('encryptedInvalid');}
        if(!h||h.version!==1||h.algorithm!=='AES-256-GCM'||h.kdf!=='PBKDF2-SHA256'||h.iterations!==this.iterations||h.chunkSize!==this.chunkSize||!Number.isSafeInteger(h.bytes)||h.bytes<1||h.bytes>this.maxBytes)throw new Error('encryptedInvalid');
        const chunks=Math.ceil(h.bytes/this.chunkSize);
        if(file.size!==start+h.bytes+16*chunks)throw new Error('encryptedInvalid');
        const salt=this.unhex(h.salt,16),prefix=this.unhex(h.ivPrefix,8),key=await this.key(password,salt),parts=[];
        for(let index=0,pos=start;index<chunks;index++){
            const count=Math.min(this.chunkSize,h.bytes-index*this.chunkSize)+16;
            try{parts.push(await crypto.subtle.decrypt(this.parameters(authenticated,index,prefix),key,await file.slice(pos,pos+count).arrayBuffer()));}
            catch(_){throw new Error('encryptedAuthenticationFailed');}
            pos+=count;onProgress(Math.min((index+1)*this.chunkSize,h.bytes));
        }
        // No data is offered to the archive importer until every chunk authenticates.
        return new Blob(parts,{type:'application/x-ndjson'});
    }
}
if(typeof module!=='undefined'&&module.exports)module.exports={EncryptedBackup};else window.EncryptedBackup=EncryptedBackup;
