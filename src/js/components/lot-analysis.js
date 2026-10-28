/** Descriptive counts of saved rows only. No survey inference, deduplication or recalculation. */
const SupplementaryLot=typeof module!=='undefined'&&module.exports?require('../services/supplementary-growth.js').SupplementaryGrowth:globalThis.SupplementaryGrowth;
class LotAnalysis {
    static categories={
        weightForAge:['underweightSevere','underweightModerate','withinReference'],
        heightForAge:['stuntingSevere','stuntingModerate','withinReference'],
        weightForHeight:['wastingSevere','wastingModerate','withinReference','riskOverweight','overweight','obesity'],
        bmiForAge:['bmiBelow3','bmiBelow2','bmiWithin','bmiAbove1','bmiAbove2','bmiAbove3']
    };
    static build(entries,reference,{family='WHO2006',additionalReference=null}={}) {
        const older=family==='WHO2007',cdc=family==='CDC2000';
        const model={reference,family,total:entries.length,identifiedCases:0,withoutCaseId:0,repeatedCaseRows:0,imported:0,estimated:0,sex:{M:0,F:0,unknown:0},ages:older||cdc?{...(cdc?{from2to4:0}:{}),from5to9:0,from10to14:0,from15to19:0,unknown:0}:{under6:0,from6to23:0,from24to59:0,unknown:0},indicators:[]};
        const cases=new Set(),ageEligible=new Set();let identifiedRows=0;
        for(const entry of entries){
            const {child:c={},result:r}=entry;
            const id=typeof c.caseId==='string'?c.caseId.trim():'';
            if(id){cases.add(id);identifiedRows++;}else model.withoutCaseId++;
            model.sex[['M','F'].includes(c.gender)?c.gender:'unknown']++;
            if(r?.imported)model.imported++;if(c.ageMode==='months')model.estimated++;
            const d=c.ageDays;let usableAge=Number.isInteger(d)&&d>=0&&d<=1826;
            if(usableAge&&c.ageDomainVersion!==2&&(c.ageMode==='dates'||d===1826)){
                try{const date=ClinicalEngine.dateDays(c.measurementDate),birth=c.ageMode==='dates'?ClinicalEngine.dateDays(c.birthDate):date-d;usableAge=ClinicalEngine.beforeFifthBirthday(birth,date);}catch(_){usableAge=false;}
            }
            if(older||cdc){const age=c.totalAgeMonths;usableAge=typeof age==='number'&&Number.isFinite(age)&&age>=(cdc?24:60)&&age<(cdc?240:229);model.ages[!usableAge?'unknown':age<60?'from2to4':age<120?'from5to9':age<180?'from10to14':'from15to19']++;}
            else{if(c.ageDomainVersion===2)usableAge=usableAge&&c.totalAgeMonths<60;model.ages[!usableAge?'unknown':d<183?'under6':d<731?'from6to23':'from24to59']++;}
            if(usableAge)ageEligible.add(entry);
        }
        model.identifiedCases=cases.size;model.repeatedCaseRows=identifiedRows-cases.size;
        const categories=cdc?{weightForAge:['cdcBelow3','cdcBetween3And97','cdcAbove97'],heightForAge:['cdcBelow3','cdcBetween3And97','cdcAbove97'],bmiForAge:['cdcUnderweight','cdcHealthyWeight','cdcOverweight','cdcObesity','cdcSevereObesity']}:this.categories;
        const definitions=Object.entries(categories).map(([key,categories])=>({key,categories}));
        if(!older&&additionalReference&&entries.some(e=>e.result?.additionalGrowth))for(const key of Object.keys(SupplementaryLot.definitions))definitions.push({key,categories:['additionalBelow2','additionalWithin','additionalAbove2'],additional:true});
        model.indicators=definitions.map(({key,categories,additional=false})=>{
            const item={key,usable:0,missing:0,suspended:0,flagged:0,unverified:0,notApplicable:0,imported:0,mean:null,min:null,max:null,categories:categories.map(key=>({key,count:0,denominator:0,percent:null}))};
            if(additional)item.reference=additionalReference;
            let sum=0;
            for(const entry of entries){
                const {result:r}=entry;
                if(!r || key==='bmiForAge'&&r.schemaVersion!==4){item.missing++;continue;}
                const value=additional?r.additionalGrowth?.indicators?.[key]:r[key];
                if(r.schemaVersion!==4||!reference||r.referenceVersion!==reference||cdc&&r.referenceFamily!=='CDC2000'||!ageEligible.has(entry)){item.unverified++;continue;}
                if(!value){item.missing++;continue;}
                if(additional&&(r.additionalGrowth.version!==1||r.additionalGrowth.referenceVersion!==additionalReference)){item.unverified++;continue;}
                if(r.schemaVersion===4&&value.notApplicable===true){item.notApplicable++;continue;}
                if(value.error){item.suspended++;continue;}
                if(value.flagged){item.flagged++;continue;}
                const category=item.categories.find(c=>c.key===value.classification);
                if(!Number.isFinite(value.zscore)||value.reference!==(additional?additionalReference:reference)||!category){item.unverified++;continue;}
                item.usable++;category.count++;sum+=value.zscore;
                item.min=item.min===null?value.zscore:Math.min(item.min,value.zscore);item.max=item.max===null?value.zscore:Math.max(item.max,value.zscore);
                if(r.imported)item.imported++;
            }
            if(item.usable)item.mean=sum/item.usable;
            for(const category of item.categories){category.denominator=item.usable;category.percent=item.usable?category.count/item.usable*100:null;}
            return item;
        });
        return model;
    }
    static csvRows(model) {
        const rows=[['section','indicator','item','count_or_value','denominator','percent','reference'],['scope','','saved_rows_only',model.total,'','',model.reference]];
        for(const key of ['total','identifiedCases','withoutCaseId','repeatedCaseRows','estimated','imported'])rows.push(['overview','',key,model[key],'','',model.reference]);
        for(const group of ['sex','ages'])for(const [key,value] of Object.entries(model[group]))rows.push([group,'',key,value,model.total,model.total?value/model.total*100:'',model.reference]);
        for(const item of model.indicators){
            const reference=item.reference||model.reference;
            for(const key of ['usable','missing','suspended','flagged','unverified','notApplicable','imported','mean','min','max'])rows.push(['indicator',item.key,key,item[key]??'',key==='imported'?item.usable:['mean','min','max'].includes(key)?'':model.total,'',reference]);
            for(const category of item.categories)rows.push(['category',item.key,category.key,category.count,category.denominator,category.percent??'',reference]);
        }
        return rows;
    }
    static html(model,ui,{open=false,exportButton=true}={}) {
        const e=v=>ui.esc(v),t=k=>ui.t(k),n=(v,d=0)=>ui.number(v,d),datum=(key,value)=>`<div><dt>${e(t(key))}</dt><dd>${e(n(value))}</dd></div>`;
        const overview=[['lotRows',model.total],['lotCases',model.identifiedCases],['lotNoId',model.withoutCaseId],['lotRepeated',model.repeatedCaseRows],['lotImported',model.imported],['lotEstimated',model.estimated]];
        const population=[['male',model.sex.M],['female',model.sex.F],['lotUnknownSex',model.sex.unknown],...(model.family==='CDC2000'?[['lotAge2to4',model.ages.from2to4]]:[]),...(['WHO2007','CDC2000'].includes(model.family)?[['lotAge5to9',model.ages.from5to9],['lotAge10to14',model.ages.from10to14],['lotAge15to19',model.ages.from15to19]]:[['lotAgeUnder6',model.ages.under6],['lotAge6to23',model.ages.from6to23],['lotAge24to59',model.ages.from24to59]]),['lotUnknownAge',model.ages.unknown]];
        const ratio=c=>`${n(c.count)} / ${n(c.denominator)}${c.percent===null?' · —':' · '+n(c.percent,1)+' %'}`;
        const cards=model.indicators.map(item=>`<section class="lot-indicator"><h3>${e(t(item.key))}</h3>${item.reference?`<p class="hint">${e(t('additionalResultHelp'))}</p><p class="meta">${e(item.reference)}</p>`:''}<dl class="lot-metrics">${['usable','missing','suspended','flagged','unverified','notApplicable'].map(key=>datum('lot'+key[0].toUpperCase()+key.slice(1),item[key])).join('')}</dl><p class="hint">${e(t('lotMean'))} : <bdi dir="ltr">${item.mean===null?'—':e(n(item.mean,2))}</bdi> · ${e(t('lotRange'))} : <bdi dir="ltr">${item.min===null?'—':e(n(item.min,2))+' / '+e(n(item.max,2))}</bdi></p><table><caption class="sr-only">${e(t('lotCategories')+' · '+t(item.key))}</caption><thead><tr><th scope="col">${e(t('lotCategories'))}</th><th scope="col">${e(t('lotProportion'))}</th></tr></thead><tbody>${item.categories.map(c=>`<tr><th scope="row">${e(t(c.key))}</th><td><bdi dir="ltr">${e(ratio(c))}</bdi></td></tr>`).join('')}</tbody></table></section>`).join('');
        return `<details class="lot-analysis"${open?' open':''}><summary>${e(t('lotSummary')+(model.family==='CDC2000'?' · CDC 2000 / 2022':model.family==='WHO2007'?' · OMS 2007':''))}</summary><p class="hint">${e(t('lotScope'))}</p><p class="meta">${e(model.reference||t('unknown'))}</p>${exportButton?`<div class="toolbar compact-toolbar">${ui.toolButton('reportTitle','csv','reporting',{showLabel:true})}${ui.toolButton(model.family==='WHO2007'?'lotExportOlder':'lotExport','csv','export-summary',{showLabel:true,attrs:'data-family="'+e(model.family)+'"'})}</div>`:''}<dl class="lot-overview">${overview.map(([k,v])=>datum(k,v)).join('')}</dl><p class="hint">${e(t('lotIdentifiers'))}</p><dl class="lot-overview">${population.map(([k,v])=>datum(k,v)).join('')}</dl><p class="hint">${e(t(model.family==='CDC2000'?'cdcLotRules':model.family==='WHO2007'?'lotRulesOlder':'lotRules'))}</p><div class="lot-indicators">${cards}</div></details>`;
    }
}
if(typeof module!=='undefined'&&module.exports)module.exports={LotAnalysis};
else window.LotAnalysis=LotAnalysis;
