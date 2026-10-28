/** Combined WHO references. Stored results are never recalculated by reading them. */
const GrowthClinicalCore=typeof module!=='undefined'&&module.exports?require('./clinical-engine.js').ClinicalEngine:ClinicalEngine;
const GrowthOlderCore=typeof module!=='undefined'&&module.exports?require('./reference-2007.js').WHO2007Reference:WHO2007Reference;
const NutritionGrowth=typeof module!=='undefined'&&module.exports?require('./nutrition-assessment.js').NutritionAssessment:NutritionAssessment;
const SupplementaryEngine=typeof module!=='undefined'&&module.exports?require('./supplementary-growth.js').SupplementaryGrowth:SupplementaryGrowth;
const GrowthPolicy=typeof module!=='undefined'&&module.exports?require('./growth-profile.js').GrowthProfile:GrowthProfile;
const GrowthCDC=typeof module!=='undefined'&&module.exports?require('./reference-cdc.js').CDCReference:globalThis.CDCReference;
class GrowthEngine {
    static version='4.3.0';
    constructor(young,older,additional,cdc){this.young=new GrowthClinicalCore(young);this.older=new GrowthOlderCore(older);this.data=young;if(additional)this.additional=new SupplementaryEngine(additional);if(cdc)this.cdc=new GrowthCDC(cdc);}
    static normalize(raw){return GrowthClinicalCore.normalize(raw,{extended:true});}
    static applicable(family,age){return GrowthClinicalCore.applicable(family,age);}
    static unavailable(error,notApplicable=false){return {zscore:null,error,zscoreRaw:null,percentile:null,percentileStatus:'percentileUnavailable',...(notApplicable?{notApplicable:true}:{})};}
    calculate(raw){
        if(!this.additional&&SupplementaryEngine.fields.some(k=>SupplementaryEngine.present(raw[k])))throw Error('referenceInvalid');
        const child=GrowthEngine.normalize(raw),age=GrowthPolicy.calculationAge(child),family=GrowthPolicy.family(child);
        let result;
        if(family==='WHO2006')result=this.young.calculateNormalized(child).result;
        else if(family==='CDC2000'){
            if(!this.cdc)throw Error('referenceInvalid');
            const computed=this.cdc.compute({sex:child.gender,ageInMonths:child.totalAgeMonths,agePrecision:child.ageMode==='months'?'completedMonths':'exact',weightKg:child.weight/1000,heightCm:child.height,position:child.position,oedema:child.oedema});
            const scores=Object.fromEntries(GrowthClinicalCore.indicators.map(key=>{const value=computed.scores[key];return [key,value.zscore===null?GrowthEngine.unavailable(value.error,key==='weightForHeight'):value];}));
            result={id:'result_'+crypto.randomUUID(),childId:child.id,childName:child.name,calculatedAt:new Date().toISOString(),referenceVersion:computed.referenceVersion,correctedHeight:computed.correctedHeight,bmi:scores.bmiForAge.zscore===null?null:computed.bmi,warnings:[...(child.ageMode==='months'?['estimatedAge','cdcCompletedMonths']:[]),...(child.oedema==='y'?['oedemaWarning']:[])],...scores};
        }else{
            const computed=this.older.compute({sex:child.gender,ageInMonths:age,weightKg:child.weight/1000,heightCm:child.height,oedema:child.oedema});
            const scores={};
            for(const key of ['weightForAge','heightForAge','bmiForAge']){
                const value=computed.scores[key];scores[key]=value.zscore===null?GrowthEngine.unavailable(key==='weightForAge'&&age>=121?'weightAgeLimit2007':value.error,key==='weightForAge'&&age>=121):value;
            }
            scores.weightForHeight=GrowthEngine.unavailable('noWeightForHeight2007',true);
            if(child.position!=='H')for(const key of ['heightForAge','bmiForAge'])scores[key]=GrowthEngine.unavailable('standingRequired2007');
            const warnings=[...(child.ageMode==='months'?['estimatedAge']:[]),...(child.oedema==='y'?['oedemaWarning']:[]),...(child.position!=='H'?['standingRequired2007']:[])];
            result={id:'result_'+crypto.randomUUID(),childId:child.id,childName:child.name,calculatedAt:new Date().toISOString(),referenceVersion:computed.referenceVersion,correctedHeight:child.height,bmi:scores.bmiForAge.zscore===null?null:computed.bmi,warnings,...scores};
        }
        Object.assign(result,{schemaVersion:4,percentileVersion:1,engineVersion:GrowthEngine.version,referenceFamily:family,ageInMonths:age,applicableIndicators:GrowthEngine.applicable(family,age)});
        const context=GrowthPolicy.context(child);if(context)result.profileContext=context;
        const values=result.applicableIndicators.map(k=>result[k]);result.status=values.some(v=>v.zscore===null)?'incomplete':values.some(v=>v.flagged)?'checkMeasures':'complete';
        result.nutrition=NutritionGrowth.assess(child,result);
        if(this.additional){const extra=this.additional.calculate(child,GrowthClinicalCore);if(extra)result.additionalGrowth=extra;}
        return {child,result};
    }
}
if(typeof module!=='undefined'&&module.exports)module.exports={GrowthEngine};else window.GrowthEngine=GrowthEngine;
