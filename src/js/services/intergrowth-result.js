'use strict';
/** Adapter for the existing local workspace/result format. No WHO/CDC age or
 * classification is substituted for the explicitly selected postnatal model. */
const IGVisit=typeof module!=='undefined'&&module.exports?require('./intergrowth-visit.js').IntergrowthVisit:IntergrowthVisit;
const IGInput=typeof module!=='undefined'&&module.exports?require('./clinical-engine.js').ClinicalEngine:ClinicalEngine;
const IGNutrition=typeof module!=='undefined'&&module.exports?require('./nutrition-assessment.js').NutritionAssessment:NutritionAssessment;
class IntergrowthResult {
    static reference='INTERGROWTH2015-postnatal-gigs-fb58fe6596d4';
    static normalize(raw) {
        if(raw.growthProfile!=='intergrowth')throw Error('growthProfileInvalid');
        if(['name','caseId'].some(k=>raw[k]!==undefined&&typeof raw[k]!=='string'))throw Error('nameInvalid');
        const name=(raw.name||'').trim(),caseId=(raw.caseId||'').trim();
        if(name.length>100||caseId.length>100)throw Error('nameInvalid');
        for(const key of ['id','visitId'])if(raw[key]!==undefined&&(typeof raw[key]!=='string'||!raw[key]||raw[key].length>200))throw Error('importInvalid');
        if(raw.measurementDate&&IGInput.dateDays(raw.measurementDate)>IGInput.dateDays(IGInput.today()))throw Error('dateFuture');
        if(['tricepsSkinfold','subscapularSkinfold'].some(k=>IGVisit.present(raw[k])))throw Error('intergrowthUnsupportedMeasures');
        if(!['M','F'].includes(raw.gender))throw Error('sexInvalid');
        const age=IGVisit.age(raw),observations=IGVisit.observations(raw),clinical=IGNutrition.normalize(raw);
        const child={...raw,...clinical,...observations.values,name,caseId,growthProfile:'intergrowth',ageDomainVersion:4,
            id:raw.id||'child_'+crypto.randomUUID(),visitId:raw.visitId||'visit_'+crypto.randomUUID(),
            createdAt:raw.createdAt||new Date().toISOString(),ageDays:age.chronologicalDays,
            totalAgeMonths:age.chronologicalDays===null?null:age.chronologicalDays/30.4375,
            postmenstrualDays:age.postmenstrualDays,position:observations.position||'',oedema:observations.oedema};
        for(const key of ['weight','height','headCircumference'])if(!Object.hasOwn(observations.values,key))child[key]='';
        if(raw.ageMode==='pma'){child.gestationalAgeWeeks='';child.gestationalAgeDays='';child.ageDays=null;}
        else{child.gestationalAgeWeeks=age.gestationalAgeWeeks;child.gestationalAgeDays=age.gestationalAgeDays;}
        return child;
    }
    static absent() {return {zscore:null,zscoreRaw:null,percentile:null,percentileStatus:'percentileUnavailable',error:'intergrowthIndicatorUnsupported',notApplicable:true};}
    static calculate(raw,engineVersion) {
        const child=this.normalize(raw),record=IGVisit.calculate(child),s=record.scores;
        const result={id:'result_'+crypto.randomUUID(),childId:child.id,childName:child.name,calculatedAt:record.calculatedAt,
            schemaVersion:4,percentileVersion:1,engineVersion,referenceFamily:'INTERGROWTH2015',referenceVersion:this.reference,
            ageInMonths:child.totalAgeMonths,applicableIndicators:['weightForAge','heightForAge'],
            profileContext:{version:1,profile:'intergrowth',postmenstrualDays:record.age.postmenstrualDays},
            intergrowthContext:record,weightForAge:s.weightForAge,heightForAge:s.lengthForAge,
            weightForHeight:this.absent(),bmiForAge:this.absent(),bmi:null,correctedHeight:child.height||null,
            additionalGrowth:{version:1,referenceVersion:this.reference,indicators:{headCircumferenceForAge:s.headCircumferenceForAge}},
            warnings:record.warnings,status:Object.values(s).some(v=>v.zscore===null)?'incomplete':'complete'};
        result.nutrition=IGNutrition.assess(child,result);
        return {child,result};
    }
    static equal(a,b){return JSON.stringify(a)===JSON.stringify(b);}
    static checkChild(child) {
        const normalized=this.normalize(child);
        if(child.ageDomainVersion!==4||['weight','height','headCircumference','ageDays','totalAgeMonths','postmenstrualDays','gestationalAgeWeeks','gestationalAgeDays','position','oedema'].some(k=>!this.equal(child[k],normalized[k])))throw Error('importInvalid');
    }
    static check(r) {
        const fail=()=>{throw Error('importInvalid');};
        IGVisit.check(r.intergrowthContext);
        const v=r.intergrowthContext,a=v.age;
        if(r.schemaVersion!==4||r.percentileVersion!==1||r.referenceFamily!=='INTERGROWTH2015'||r.referenceVersion!==this.reference||
            r.calculatedAt!==v.calculatedAt||!r.engineVersion||r.bmi!==null||r.correctedHeight!==(v.observations.values.height??null)||
            r.ageInMonths!==(a.chronologicalDays===null?null:a.chronologicalDays/30.4375)||
            !this.equal(r.profileContext,{version:1,profile:'intergrowth',postmenstrualDays:a.postmenstrualDays})||
            !this.equal(r.applicableIndicators,['weightForAge','heightForAge'])||
            !this.equal(r.weightForAge,v.scores.weightForAge)||!this.equal(r.heightForAge,v.scores.lengthForAge)||
            !this.equal(r.weightForHeight,this.absent())||!this.equal(r.bmiForAge,this.absent())||
            !this.equal(r.additionalGrowth,{version:1,referenceVersion:this.reference,indicators:{headCircumferenceForAge:v.scores.headCircumferenceForAge}})||
            !this.equal(r.warnings,v.warnings)||r.status!==(Object.values(v.scores).some(x=>x.zscore===null)?'incomplete':'complete'))fail();
        const n=r.nutrition;
        if(!n||n.version!==1||n.category!=='intergrowthNoScreening'||
            n.muacMm!==null&&(!Number.isFinite(n.muacMm)||n.muacMm<50||n.muacMm>400)||
            !this.equal(n,IGNutrition.assess({growthProfile:'intergrowth',muac:n.muacMm===null?undefined:n.muacMm,
                cannotDrink:n.reasons?.includes('dangerPresent')?'y':''},r)))fail();
        return true;
    }
    static checkPair(child,result) {
        if(child.growthProfile!=='intergrowth')throw Error('importInvalid');
        this.checkChild(child);if(!result)return;
        this.check(result);
        const v=result.intergrowthContext;
        if(v.sex!==child.gender||!this.equal(v.age,IGVisit.age(child))||!this.equal(v.observations,IGVisit.observations(child)))throw Error('importInvalid');
        IGNutrition.check(child,result);
    }
}
if(typeof module!=='undefined'&&module.exports)module.exports={IntergrowthResult};else window.IntergrowthResult=IntergrowthResult;
