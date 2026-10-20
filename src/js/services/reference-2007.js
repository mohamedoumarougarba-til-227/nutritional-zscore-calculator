'use strict';
// WHO 2007 core. Input units are explicit; no dates or positions inferred.
const ClinicalCore2007=typeof module!=='undefined'&&module.exports?require('./clinical-engine.js').ClinicalEngine:ClinicalEngine;
class WHO2007Reference {
    constructor(data){
        if(data?.schemaVersion!==1||typeof data.referenceVersion!=='string'||!data.referenceVersion.startsWith('WHO-2007-anthroplus-'))throw Error('referenceInvalid');
        for(const [key,max] of [['weightForAge',121],['heightForAge',229],['bmiForAge',229]])for(const sex of ['M','F']){
            const rows=data.tables?.[key]?.[sex];if(!rows||Object.keys(rows).length!==max-59)throw Error('referenceInvalid');
            for(let age=60;age<=max;age++){
                const p=rows[age];if(!Array.isArray(p)||p.length!==3||!p.every(Number.isFinite)||p[1]<=0||p[2]<=0)throw Error('referenceInvalid');
            }
            if(rows[max].some((v,i)=>v!==rows[max-1][i]))throw Error('referenceInvalid');
        }
        this.data=data;
    }
    params(key,sex,age){
        const upper=key==='weightForAge'?121:229;
        if(!['weightForAge','heightForAge','bmiForAge'].includes(key)||!['M','F'].includes(sex)||typeof age!=='number'||!Number.isFinite(age)||age<60||age>=upper)return null;
        const low=Math.floor(age),fraction=age-low,table=this.data.tables[key][sex],a=table[low];
        if(fraction===0)return a.slice();
        const b=table[low+1];return a.map((v,i)=>v+fraction*(b[i]-v));
    }
    compute({sex,ageInMonths,weightKg,heightCm,oedema='n'}){
        if(!['n','y'].includes(oedema))throw Error('oedemaInvalid');
        const positive=v=>typeof v==='number'&&Number.isFinite(v)&&v>0;
        const bmi=positive(weightKg)&&positive(heightCm)?weightKg/(heightCm/100)**2:null;
        const values={weightForAge:weightKg,heightForAge:heightCm,bmiForAge:bmi},scores={};
        for(const key of Object.keys(values)){
            const params=this.params(key,sex,ageInMonths),error=!params?'ageOutsideReference':oedema==='y'&&key!=='heightForAge'?'oedemaWarning':!positive(values[key])?'measureMissing':null;
            if(error){scores[key]={zscore:null,zscoreRaw:null,flagged:null,error,percentile:null,percentileStatus:'percentileUnavailable'};continue;}
            const raw=ClinicalCore2007.lms(values[key],params,key!=='heightForAge');
            const z=Math.round(raw*100)/100,zscore=Object.is(z,-0)?0:z;
            const flagged=key==='weightForAge'?zscore < -6||zscore > 5:Math.abs(zscore)>(key==='heightForAge'?6:5);
            scores[key]={zscore,flagged,reference:this.data.referenceVersion,classification:ClinicalCore2007.category(key,raw),...ClinicalCore2007.percentileFields(raw)};
        }
        return {referenceVersion:this.data.referenceVersion,ageInMonths,bmi,scores};
    }
}
if(typeof module!=='undefined'&&module.exports)module.exports={WHO2007Reference};else window.WHO2007Reference=WHO2007Reference;
