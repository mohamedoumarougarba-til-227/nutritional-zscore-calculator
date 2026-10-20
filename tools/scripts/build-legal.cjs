'use strict';
const fs=require('node:fs'),path=require('node:path');
const {publisher,content}=require('./legal-content.cjs');
const root=path.resolve(__dirname,'../..');
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pages={fr:'legal.html',en:'legal-en.html',ar:'legal-ar.html'};
function legalPages(){
    const links=[['Z-score · GPLv3','data/LICENSE-TIL.txt'],['Z-score · Source ZIP','data/zscore-sources.zip'],['Source ZIP · SHA-256','data/zscore-sources.json'],['WHO · Data source ZIP','data/who-data-sources.zip'],['WHO 2006','https://www.who.int/tools/child-growth-standards'],['WHO 2007','https://www.who.int/tools/growth-reference-data-for-5to19-years'],
        ['Anthro · b776d8a12b1c','https://github.com/WorldHealthOrganization/anthro/tree/b776d8a12b1c97369c748b561159fd2ec4f4db58'],
        ['AnthroPlus · 7cfcdb39026e','https://github.com/WorldHealthOrganization/anthroplus/tree/7cfcdb39026e9a55de55732bc3cf14c82261bcf7'],
        ['GPL · Anthro','data/LICENSE-anthro.txt'],['GPL · AnthroPlus','data/LICENSE-anthroplus.txt'],['MIT · jsPDF','vendor/pdf/jspdf-4.2.1.umd.min.js.LICENSE.txt'],
        ['MIT · AutoTable','vendor/pdf/autotable-5.0.8.min.js.LICENSE.txt'],['PDF · Notices','vendor/pdf/NOTICE-report.txt'],['OFL · Amiri','vendor/pdf/OFL.txt'],
        ['HAPDP · Niger','https://www.hapdp.ne/legislation-nationale'],['Vercel · Privacy','https://vercel.com/legal/privacy-notice'],['TIL',publisher.website]];
    return Object.fromEntries(Object.entries(content).map(([lang,c])=>{
        const para=text=>escape(text).replace(/\{(\w+)\}/g,(_,key)=>'<bdi>'+escape(publisher[key])+'</bdi>');
        const html=`<!doctype html>
<html lang="${lang}" dir="${lang==='ar'?'rtl':'ltr'}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer">
<title>${escape(c.title)} · Z-score Niger</title><link rel="stylesheet" href="css/workspace.css"><link rel="stylesheet" href="css/legal.css"></head>
<body class="legal-page"><a class="skip" href="#content">${escape(c.title)}</a>
<header class="legal-header"><a class="brand" href="./"><span class="brand-mark">Z</span><span>Z-score Niger</span></a>
<nav aria-label="Language">${Object.entries(pages).map(([code,file])=>`<a href="${file}" lang="${code}" hreflang="${code}"${code===lang?' aria-current="page"':''}>${{fr:'Français',en:'English',ar:'العربية'}[code]}</a>`).join('')}</nav></header>
<main id="content"><a href="./">${escape(c.back)}</a><h1>${escape(c.title)}</h1><p class="muted">${escape(c.updated)}</p><p>${escape(c.intro)}</p>
<nav class="legal-toc" aria-label="${escape(c.title)}">${c.sections.map(([id,title])=>`<a href="#${id}">${escape(title)}</a>`).join('')}</nav>
${c.sections.map(([id,title,paragraphs])=>`<section id="${id}" class="card"><h2>${escape(title)}</h2>${paragraphs.map(p=>`<p>${para(p)}</p>`).join('')}</section>`).join('\n')}
<section class="card"><h2>${escape(c.links)}</h2><ul class="legal-links">${links.map(([label,url])=>`<li><a href="${escape(url)}"${url.startsWith('https:')?' target="_blank" rel="noopener noreferrer"':''}>${escape(label)}</a></li>`).join('')}</ul></section>
<footer><span>© 2026 Tout Informatique Lazaret</span><a href="mailto:${publisher.email}">${escape(c.contact)}</a></footer></main></body></html>\n`;
        return [pages[lang],html];
    }));
}
if(require.main===module)for(const [file,html]of Object.entries(legalPages()))fs.writeFileSync(path.join(root,'src',file),html);
module.exports={legalPages,pages};
