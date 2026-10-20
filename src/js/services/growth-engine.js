/** Combined WHO references. Stored results are never recalculated by reading them. */
const GrowthClinicalCore=typeof module!=='undefined'&&module.exports?require('./clinical-engine.js').ClinicalEngine:ClinicalEngine;
const GrowthOlderCore=typeof module!=='undefined'&&module.exports?require('./reference-2007.js').WHO2007Reference:WHO2007Reference;
class GrowthEngine {
    static version='4.0.0';
    constructor(young,older){this.young=new GrowthClinicalCore(young);this.older=new GrowthOlderCore(older);this.data=young;}
    static normalize(raw){return GrowthClinicalCore.normalize(raw,{extended:true});}
    static applicable(family,age){return GrowthClinicalCore.applicable(family,age);}
    static unavailable(error,notApplicable=false){return {zscore:null,error,zscoreRaw:null,percentile:null,percentileStatus:'percentileUnavailable',...(notApplicable?{notApplicable:true}:{})};}
    calculate(raw){
        const child=GrowthEngine.normalize(raw),age=child.totalAgeMonths,family=age<60?'WHO2006':'WHO2007';
        let result;
        if(family==='WHO2006')result=this.young.calculateNormalized(child).result;
        else{
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
        const values=result.applicableIndicators.map(k=>result[k]);result.status=values.some(v=>v.zscore===null)?'incomplete':values.some(v=>v.flagged)?'checkMeasures':'complete';
        return {child,result};
    }
}
if(typeof module!=='undefined'&&module.exports)module.exports={GrowthEngine};else window.GrowthEngine=GrowthEngine;
