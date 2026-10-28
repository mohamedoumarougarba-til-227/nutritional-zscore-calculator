/** Local reports of stored results. Never recalculate, write history or parse patient text as HTML. */
const SupplementaryPDF=typeof module!=='undefined'&&module.exports?require('./supplementary-growth.js').SupplementaryGrowth:SupplementaryGrowth;
class PDFManager {
    static fontPaths = ['vendor/pdf/Amiri-Regular.ttf', 'vendor/pdf/Amiri-Bold.ttf'];
    static async loadFonts(fetcher = fetch, pins = JSON.parse(document.querySelector('meta[name="zscore-data-integrity"]')?.content || '{}')) {
        const responses = await Promise.all(this.fontPaths.map(path => fetcher(path)));
        const bytes = await Promise.all(responses.map(async (response, i) => {
            if (!response.ok) throw new Error('pdfUnavailable');
            const value = await response.arrayBuffer(), expected = pins[this.fontPaths[i]];
            if (!/^[a-f0-9]{64}$/.test(expected || '') || value.byteLength > 1_000_000 || await ReleaseGuard.digest(value) !== expected) throw new Error('pdfUnavailable');
            return value;
        }));
        return bytes.map(buffer => {
            let text = ''; const data = new Uint8Array(buffer);
            for (let i = 0; i < data.length; i += 8192) text += String.fromCharCode(...data.subarray(i, i + 8192));
            return btoa(text);
        });
    }
    static clean(value) {
        const text = String(value ?? '');
        if (text.length > 6000) throw new Error('pdfInvalid');
        return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '').replace(/\r\n?/g, '\n');
    }
    static model(entries, { language = 'fr', translations, stale = false } = {}) {
        if (!Array.isArray(entries) || !entries.length || entries.length > 5000 || !['fr', 'en', 'ar'].includes(language) || !translations?.[language]) throw new Error('pdfInvalid');
        const t = key => {const own=table=>table&&Object.hasOwn(table,key)&&typeof table[key]==='string'?table[key]:'';return this.clean(own(translations[language])||own(translations.fr)||key);};
        const number = (value, digits) => typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : t('unknown');
        const indicators = ['weightForAge','heightForAge','weightForHeight','bmiForAge'].filter(key=>entries.some(e=>(e.result?.applicableIndicators||['weightForAge','heightForAge','weightForHeight','bmiForAge']).includes(key)));
        const provenances=[];
        const rows = entries.map((entry, i) => {
            if (!entry?.child || typeof entry.child !== 'object') throw new Error('pdfInvalid');
            const {child: c, result: r} = entry;
            if(r&&r.schemaVersion!==4)throw new Error('importVersion');
            const field = (label, value) => t(label) + ' : ' + this.clean(value === undefined || value === '' ? t('unknown') : value);
            const identity = [field('name', c.name), field('caseId', c.caseId), field('measurementDate', c.measurementDate)];
            const age = [field('ageDays', number(c.ageDays, 0)), field('ageMode', t(c.ageMode || 'unknown'))];
            if (c.ageMode === 'months') age.push(field('ageYears', c.ageYears), field('ageMonths', c.ageMonths), t('approximateAge'));
            if (c.ageMode === 'dates') age.push(field('birthDate', c.birthDate));
            const measures = [...age, field('weight', number(c.weight, 0)), field('height', number(c.height, 1)),
                field('gender', t(c.gender === 'M' ? 'male' : c.gender === 'F' ? 'female' : 'unknown')),
                field('position', t(c.position === 'L' ? 'lying' : c.position === 'H' ? 'standing' : 'unknown')),
                field('oedema', t(c.oedema === 'y' ? 'yes' : c.oedema === 'n' ? 'no' : 'unknown'))];
            if (typeof r?.correctedHeight === 'number') measures.push(field('adjustedHeight', number(r.correctedHeight, 1) + ' ' + t('unitCm')));
            if (r?.schemaVersion===4 && typeof r.bmi==='number' && Number.isFinite(r.bmi)) measures.push(field('bmi',number(r.bmi,2)+' kg/m²'));
            const notes = [];
            for(const key of SupplementaryPDF.fields)if(SupplementaryPDF.present(c[key]))measures.push(field(key,number(c[key],1)));
            if(r?.additionalGrowth){notes.push(t('additionalResults')+' · '+r.additionalGrowth.referenceVersion);for(const [key,v] of Object.entries(r.additionalGrowth.indicators)){const score=Number.isFinite(v.zscore)?'Z = '+number(v.zscore,2)+(typeof v.percentile==='number'?' | P '+number(v.percentile,1):'')+' | '+t(v.classification||'intergrowthDescriptive'):t(v.error);notes.push(t(key)+' : '+number(v.measure,1)+' '+v.unit+' | '+score+(v.flagged?' | '+t('flagged'):''));}}
            if(c.muac!==undefined&&c.muac!=='')measures.push(field('muac',number(c.muac,1)+' mm'));
            if(r?.nutrition)notes.push(t(r.nutrition.category),...(r.nutrition.criteria||[]).map(t),t(r.nutrition.muac),t(r.nutrition.orientation),...r.nutrition.reasons.map(t),t('clinicalReference')+' : '+r.nutrition.reference+' v'+r.nutrition.version,...(r.nutrition.missing.length?[t('assessmentMissing')+' : '+r.nutrition.missing.map(t).join(', ')]:[]));
            let provenance=null;
            if (!r) notes.push(t('pdfUncalculated'));
            else {
                if (r.schemaVersion===4) notes.push(t(r.referenceFamily==='INTERGROWTH2015'?'intergrowthDescriptive':r.referenceFamily==='CDC2000'?'cdcCoverage':'bmiReportHelp'));
                if(r.intergrowthContext){
                    const a=r.intergrowthContext.age;measures.push(field('growthProfile',t('profileINTERGROWTH')),field('postmenstrualDays',number(a.postmenstrualDays,0)),field('birthGestationDays',number(a.birthGestationDays,0)));
                    notes.push(t('intergrowthNoScreening'),field('postmenstrualDays',number(a.postmenstrualDays,0))+' | '+field('birthGestationDays',number(a.birthGestationDays,0)));
                    for(const [key,v] of Object.entries(r.intergrowthContext.scores))if(v.method)notes.push(t(key==='lengthForAge'?'heightForAge':key)+' | '+v.method);
                }else if(r.profileContext){
                    measures.push(field('growthProfile',t('profileUS')),field('reportedAgeMonths',number(r.profileContext.reportedAgeInMonths,3)),field('calculationAgeMonths',number(r.ageInMonths,3)),field('agePrecision',t(r.profileContext.agePrecision)));
                    notes.push(t('profileUS')+' | '+t('reportedAgeMonths')+' : '+number(r.profileContext.reportedAgeInMonths,3)+' | '+t('calculationAgeMonths')+' : '+number(r.ageInMonths,3)+' | '+t(r.profileContext.agePrecision));
                }
                if(r.referenceFamily==='CDC2000'){
                    notes.push(t('cdcInterpretation'));
                    for(const key of ['weightForAge','heightForAge','bmiForAge'])if(r[key]?.method)notes.push(t(key)+' | '+r[key].method+' | '+t('modifiedZscore')+' : '+number(r[key].modifiedZscore,3));
                    if(Number.isFinite(r.bmiForAge?.percentOfP95))notes.push(t('percentOfP95')+' : '+number(r.bmiForAge.percentOfP95,1)+' %');
                }
                if(r.schemaVersion===4&&r.referenceFamily==='WHO2007')notes.push(t('coverage2007'));
                if (r.imported) notes.push(t('importedResult'));
                notes.push(...(Array.isArray(r.warnings) ? r.warnings.map(t) : []));
                const value=[this.clean(r.referenceVersion || 'unknown'),this.clean(r.engineVersion || t('unknown'))];
                let p=provenances.findIndex(pair=>pair[0]===value[0]&&pair[1]===value[1]);
                if(p<0){p=provenances.length;provenances.push(value);}provenance='R'+(p+1);
            }
            const scores = indicators.map(key => {
                const v = r?.[key], valid = typeof v?.zscore === 'number' && Number.isFinite(v.zscore);
                const lines = [valid ? 'Z = ' + v.zscore.toFixed(2) : t('notCalculated')];
                if (valid) lines.push(t(v.classification || (r.referenceFamily==='INTERGROWTH2015'?'intergrowthDescriptive':'unknown')));
                if (v?.flagged) lines.push(t('flagged'));
                if (v?.error) lines.push(t(v.error));
                return lines.join('\n');
            });
            const percentiles=indicators.map(key=>{
                const v=r?.[key];
                if(r?.schemaVersion!==4||r.percentileVersion!==1||!Number.isFinite(v?.zscore))return '';
                return typeof v.percentile==='number'&&Number.isFinite(v.percentile)&&v.percentile>0&&v.percentile<100&&!v.flagged?'P '+v.percentile.toFixed(1):'P --';
            });
            const compactMeasures=[...(r?.intergrowthContext?[field('postmenstrualDays',number(r.intergrowthContext.age.postmenstrualDays,0))]:[]),field('ageDays',number(c.ageDays,0)),field('weight',number(c.weight,0)),field('height',number(c.height,1)),
                t(c.gender==='M'?'male':c.gender==='F'?'female':'unknown')+' | '+t(c.position==='L'?'lying':c.position==='H'?'standing':'unknown'),
                t('pdfOedema')+' : '+t(c.oedema==='y'?'yes':c.oedema==='n'?'no':'unknown')];
            if(c.ageMode==='months')compactMeasures.push(field('ageYears',c.ageYears)+' | '+field('ageMonths',c.ageMonths),t('approximateAge'));
            if(c.ageMode==='dates')compactMeasures.push(field('birthDate',c.birthDate));
            if(typeof r?.correctedHeight==='number')compactMeasures.push(field('adjustedHeight',number(r.correctedHeight,1)+' '+t('unitCm')));
            if(r?.schemaVersion===4 && typeof r.bmi==='number' && Number.isFinite(r.bmi))compactMeasures.push(field('bmi',number(r.bmi,2)+' kg/m²'));
            const heightPair=number(c.height,1)+(typeof r?.correctedHeight==='number'?' / '+number(r.correctedHeight,1):'');
            const briefMeasures=[number(c.weight,0)+' g | '+heightPair+' cm',number(c.ageDays,0)+' '+t('pdfDaysUnit')+' ('+t(c.ageMode||'unknown')+') | '+this.clean(c.gender||t('unknown'))+' | '+this.clean(c.position||t('unknown')),t('pdfOedema')+' : '+t(c.oedema==='y'?'yes':c.oedema==='n'?'no':'unknown')];
            if(r?.intergrowthContext)briefMeasures.unshift(field('postmenstrualDays',number(r.intergrowthContext.age.postmenstrualDays,0)));
            if(c.ageMode==='months')briefMeasures.push(field('ageYears',c.ageYears)+' | '+field('ageMonths',c.ageMonths),t('approximateAge'));
            if(c.ageMode==='dates')briefMeasures.push(field('birthDate',c.birthDate));
            if(r?.schemaVersion===4 && typeof r.bmi==='number' && Number.isFinite(r.bmi))briefMeasures.push(field('bmi',number(r.bmi,2)+' kg/m²'));
            if(c.muac!==undefined&&c.muac!==''){const pb=field('muac',number(c.muac,1)+' mm');compactMeasures.push(pb);briefMeasures.push(pb);}
            return {index:i+1,identity,measures,compactMeasures,briefMeasures,briefIdentity:[this.clean(c.name||t('unknown')),this.clean(c.caseId||t('unknown'))],measurementDate:this.clean(c.measurementDate||t('unknown')),scores,percentiles,notes,provenance,calculatedAt:this.clean(r?.calculatedAt||t('unknown'))};
        });
        return {language, t, indicators, rows, stale, provenances,keys:['pdfNumber','pdfIdentity','pdfMeasures',...indicators,'pdfNotes']};
    }
    static compact(model) {
        const categories=[],notes=[];
        const code=(values,text,prefix)=>{if(!text)return '';let index=values.indexOf(text);if(index<0){index=values.length;values.push(text);}return prefix+(index+1);};
        const body=model.rows.map(row=>[String(row.index),row.briefIdentity.join('\n'),row.measurementDate,row.briefMeasures.join('\n'),
            ...row.scores.map((score,i)=>{const lines=score.split('\n'),numeric=lines[0].startsWith('Z = ');return (numeric?lines[0].slice(4):'--')+'\n'+code(categories,(numeric?lines.slice(1):lines).join('\n'),'C')+(row.percentiles[i]?'\n'+row.percentiles[i]:'');}),
            [row.provenance||'',row.calculatedAt,code(notes,row.notes.join('\n'),'N')].filter(Boolean).join('\n')]);
        return {body,legend:[...categories.map((text,i)=>['C'+(i+1),text]),...notes.map((text,i)=>['N'+(i+1),text])]};
    }
    static scoreWithPercentile(row,index) {
        const score=row.scores[index],p=row.percentiles[index];
        if(!p)return score;
        const newline=score.indexOf('\n');
        return newline<0?score+' | '+p:score.slice(0,newline)+' | '+p+score.slice(newline);
    }
    static build(entries, options, { jsPDF, autoTable, fonts, now = new Date() }) {
        if (!jsPDF || !autoTable || !fonts?.[0] || !fonts?.[1]) throw new Error('pdfUnavailable');
        if(options.layout!==undefined&&!['compact','detailed'].includes(options.layout))throw new Error('pdfInvalid');
        const model = this.model(entries, options), {t, language, rows} = model;
        const batch = rows.length > 1 || options.mode === 'batch', rtl = language === 'ar';
        const doc = new jsPDF({orientation:batch?'landscape':'portrait',unit:'mm',format:'a4',compress:true,putOnlyUsedFonts:true});
        for (const [i, style] of ['normal','bold'].entries()) {
            const name = 'Amiri-' + style + '.ttf'; doc.addFileToVFS(name, fonts[i]); doc.addFont(name, 'Amiri', style);
        }
        doc.setFont('Amiri','normal'); doc.setLineHeightFactor(1.15);
        // Stored strings are logical Unicode. AutoTable must use the same Bidi options as headings.
        const drawText=doc.text.bind(doc),bidi=new jsPDF.__bidiEngine__({isInputVisual:false,isOutputVisual:true,isOutputRtl:false,isSymmetricSwapping:true});
        const visual=value=>bidi.doBidiReorder(doc.processArabic(value)).replace(/\u200E/g,'');
        doc.text=(value,x,y,options={})=>drawText(Array.isArray(value)?value.map(visual):visual(value),x,y,{...options,isInputVisual:true,isOutputVisual:true,isOutputRtl:false});
        // Display unsupported characters explicitly rather than silently losing identity text.
        const glyph = doc.getFont().metadata.characterToGlyph.bind(doc.getFont().metadata);
        const safe = value => Array.from(this.clean(value), char => char === '\n' || glyph(char.codePointAt(0)) ? char : ({'≥':'>=','≤':'<='}[char] || '[U+' + char.codePointAt(0).toString(16).toUpperCase() + ']')).join('')
            .replace(/\b\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)?\b/g, value => '\u200E'+value+'\u200E');
        const width = doc.internal.pageSize.getWidth(), height = doc.internal.pageSize.getHeight(), margin = 12;
        const compact=batch&&options.layout==='compact';
        const title = t(compact?'pdfCompactTitle':batch?'pdfBatchTitle':'pdfSingleTitle'), issued = now.toISOString();
        doc.setProperties({title:t('brand')+' - '+title,subject:t('pdfStoredOnly'),author:t('brand'),creator:'Z-score Niger local PDF'});
        doc.setLanguage(language); doc.setCreationDate(now);
        const text = (value, y, size = 10, bold = false) => {
            doc.setFont('Amiri',bold?'bold':'normal');doc.setFontSize(size);
            const lines = doc.splitTextToSize(safe(value),width-2*margin);
            doc.text(lines,rtl?width-margin:margin,y,{align:rtl?'right':'left'});
            return y + lines.length * size / doc.internal.scaleFactor * 1.15 + 2;
        };
        const headed=new Set();
        const header = () => {
            const page=doc.internal.getCurrentPageInfo().pageNumber;if(headed.has(page))return;headed.add(page);
            doc.setTextColor(23,99,72); text(t('brand')+' - '+title,12,15,true);
            doc.setTextColor(35); text(t('pdfStoredOnly')+' | '+issued,20,9);
            doc.setDrawColor(190); doc.line(margin,25,width-margin,25);
        };
        header();let y=29;
        y=text(t('appUsageNotice'),y,10);
        if(rows.some(r=>r.percentiles.some(Boolean)))y=text(t('percentileReportHelp'),y,9);
        if(model.stale) y=text(t('stale'),y,10,true);
        const base = {theme:'grid',margin:{top:29,bottom:compact?24:19,left:margin,right:margin},startY:y,
            styles:{font:'Amiri',fontStyle:'normal',fontSize:11,textColor:25,lineColor:210,lineWidth:.15,cellPadding:2,overflow:'linebreak',halign:rtl?'right':'left',valign:'top'},
            headStyles:{fontStyle:'bold',fillColor:[23,99,72],textColor:255},alternateRowStyles:{fillColor:[247,250,248]},
            rowPageBreak:'avoid',showHead:'everyPage',willDrawPage:()=>header(),
            didParseCell:data=>{data.cell.text=data.cell.text.map(safe);}};
        if(batch){
            if(model.provenances.length){
                autoTable(doc,{...base,head:[[t('referenceVersion')+' / '+t('engineVersion')]],body:model.provenances.map((p,i)=>['R'+(i+1)+' | '+p[0]+' | '+p[1]]),styles:{...base.styles,fontSize:9,cellPadding:1.5}});
                y=doc.lastAutoTable.finalY+3;
            }
            let widths,head,body;
            if(compact){
                const reduced=this.compact(model);
                autoTable(doc,{...base,startY:y,head:[[t('pdfCompactLegend')]],body:[[t('pdfCompactHelp')]],styles:{...base.styles,fontSize:10,cellPadding:1.5}});y=doc.lastAutoTable.finalY+3;
                let legendHead=[t('pdfCompactCode'),t('pdfCompactMeaning')],legend=reduced.legend;
                if(rtl){legendHead.reverse();legend=legend.map(row=>[...row].reverse());}
                autoTable(doc,{...base,startY:y,head:[legendHead],body:legend,styles:{...base.styles,fontSize:10,cellPadding:1.5}});y=doc.lastAutoTable.finalY+3;
                widths=model.indicators.length===4?[8,35,22,57,20,20,20,20,71]:model.indicators.length===2?[8,42,25,62,31.5,31.5,73]:[8,42,25,62,21,21,21,73];
                head=['pdfNumber','pdfCompactIdentity','measurementDate','pdfMeasures',...model.indicators,'pdfNotes'].map(t);body=reduced.body;
            }else{
                widths=model.indicators.length===4?[9,40,48,29,29,29,29,60]:model.indicators.length===2?[9,45,56,51,51,61]:[9,45,56,34,34,34,61];head=model.keys.map(t);body=rows.map(r=>[String(r.index),r.identity.join('\n'),r.compactMeasures.join('\n'),...r.scores.map((s,i)=>this.scoreWithPercentile(r,i)),[r.provenance||'',r.calculatedAt,...r.notes].join('\n')]);
            }
            if(rtl){head.reverse();body=body.map(r=>r.reverse());widths.reverse();}
            autoTable(doc,{...base,startY:y,styles:{...base.styles,fontSize:compact?9:10,cellPadding:compact?1:1.5},head:[head],body,columnStyles:Object.fromEntries(widths.map((cellWidth,i)=>[i,{cellWidth}]))});
        }else{
            const row=rows[0],values=[...row.identity,...row.measures];
            autoTable(doc,{...base,head:[[t('pdfMeasures')]],body:values.map(v=>[v])});
            const scoreHead=[t('pdfIndicator'),t('pdfScore')];
            let scoreBody=model.indicators.map((key,i)=>[t(key),this.scoreWithPercentile(row,i)]);
            if(rtl){scoreHead.reverse();scoreBody=scoreBody.map(r=>r.reverse());}
            autoTable(doc,{...base,startY:doc.lastAutoTable.finalY+5,head:[scoreHead],body:scoreBody});
            const provenance=model.provenances[0];
            const noteRows=[row.notes.join('\n'),...(provenance?[[t('referenceVersion')+' : '+provenance[0],t('engineVersion')+' : '+provenance[1],t('calculatedAt')+' : '+row.calculatedAt].join('\n')]:[])].filter(Boolean);
            autoTable(doc,{...base,startY:doc.lastAutoTable.finalY+4,pageBreak:'avoid',head:[[t('pdfNotes')]],body:noteRows.map(n=>[n]),styles:{...base.styles,fontSize:9.5,cellPadding:1.2}});
        }
        const pages=doc.getNumberOfPages();
        for(let i=1;i<=pages;i++){
            doc.setPage(i);doc.setTextColor(60);doc.setFont('Amiri','normal');doc.setFontSize(9);
            doc.setDrawColor(190);doc.line(margin,height-(compact?20:15),width-margin,height-(compact?20:15));
            if(compact)doc.text(safe(t('pdfCompactSeeLegend')),rtl?width-margin:margin,height-15,{align:rtl?'right':'left'});
            doc.text(safe(t('pdfSensitive')),rtl?width-margin:margin,height-10,{align:rtl?'right':'left'});
            doc.text(String(i)+' / '+String(pages),rtl?margin:width-margin,height-10,{align:rtl?'left':'right'});
        }
        return {bytes:doc.output('arraybuffer'),pages,entries:rows.length};
    }
}
if(typeof module!=='undefined'&&module.exports)module.exports={PDFManager};
