'use strict';
const SavedCDCCore=typeof module!=='undefined'&&module.exports?require('./reference-cdc.js').CDCReference:CDCReference;
const SavedCDCProfile=typeof module!=='undefined'&&module.exports?require('./growth-profile.js').GrowthProfile:GrowthProfile;
/** Check saved CDC result consistency without looking up/recalculating a visit.
 * This validates structure and internal arithmetic, not the medical truth of imports.
 */
class CDCResultValidation {
    static near(a,b) {return Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(a),Math.abs(b));}
    static check(result) {
        const fail=()=>{throw Error('importInvalid');};
        if(SavedCDCProfile.checkContext(result)!=='us'||result.referenceFamily!=='CDC2000'||result.ageInMonths<24||result.ageInMonths>=240||!/^CDC-2000-2022-[a-f0-9]{12}$/.test(result.referenceVersion||'')||result.percentileVersion!==1)fail();
        if(JSON.stringify(result.applicableIndicators)!==JSON.stringify(SavedCDCCore.keys))fail();
        if(!Object.hasOwn(result,'bmi')||result.bmi!==null&&!(Number.isFinite(result.bmi)&&result.bmi>0))fail();
        const absent=result.weightForHeight;
        if(!absent||absent.notApplicable!==true||absent.zscore!==null||absent.zscoreRaw!==null||absent.error!=='noWeightForHeightCDC'||absent.percentile!==null||absent.percentileStatus!=='percentileUnavailable')fail();
        for(const key of SavedCDCCore.keys){
            const value=result[key];if(!value||typeof value!=='object'||Array.isArray(value)||value.notApplicable===true)fail();
            if(value.zscore===null){
                if(!['oedemaWarning','measureMissing','calculationInvalid','cdcTailUnrepresentable'].includes(value.error)||value.zscoreRaw!==null||value.percentile!==null||value.percentileStatus!=='percentileUnavailable'||value.classification!==undefined||value.flagged!==undefined)fail();
                continue;
            }
            if(!Number.isFinite(value.zscore)||!Number.isFinite(value.zscoreRaw)||Math.round(value.zscoreRaw*100)/100!==value.zscore||!Number.isFinite(value.modifiedZscore)||value.reference!==result.referenceVersion||value.error!==undefined)fail();
            const [low,high]=SavedCDCCore.bounds[key];if(value.flagged!==(value.modifiedZscore<low||value.modifiedZscore>high))fail();
            const percentiles=SavedCDCCore.percentileFields(value.zscoreRaw);
            if(value.percentile!==percentiles.percentile||value.percentileStatus!==percentiles.percentileStatus)fail();
            if(key!=='bmiForAge'){
                if(value.method!=='CDC2000-LMS'||value.classification!==SavedCDCCore.positionCategory(value.zscoreRaw))fail();
                continue;
            }
            if(!Number.isFinite(result.bmi)||!['p5','p85','p95','sigma'].every(k=>Number.isFinite(value[k])&&value[k]>0)||!(value.p5<value.p85&&value.p85<value.p95)||!Number.isFinite(value.originalZscoreRaw)||!this.near(value.percentOfP95,100*result.bmi/value.p95))fail();
            if(value.classification!==SavedCDCCore.bmiCategoryFromThresholds(result.bmi,value))fail();
            const extended=result.bmi>value.p95;
            if(value.method!==(extended?'CDC2022-extended-BMI':'CDC2000-LMS'))fail();
            const expected=extended?SavedCDCCore.inverseSurvival(0.1*SavedCDCCore.survival((result.bmi-value.p95)/value.sigma)):value.originalZscoreRaw;
            if(!this.near(value.zscoreRaw,expected))fail();
        }
        if(result.bmiForAge.zscore===null?result.bmi!==null:result.bmi===null)fail();
        const scores=SavedCDCCore.keys.map(k=>result[k]),status=scores.some(v=>v.zscore===null)?'incomplete':scores.some(v=>v.flagged)?'checkMeasures':'complete';
        if(result.status!==status)fail();
    }
    static checkPair(child,result) {
        if(!this.near(result.correctedHeight,child.height-(child.position==='L'?0.8:0)))throw Error('importInvalid');
        if(result.bmi!==null&&!this.near(result.bmi,(child.weight/1000)/(result.correctedHeight/100)**2))throw Error('importInvalid');
        const bmi=result.bmiForAge;
        if(bmi.zscore!==null&&bmi.sigma!==SavedCDCCore.sigma(child.gender,result.ageInMonths))throw Error('importInvalid');
        if(child.oedema==='y'&&['weightForAge','bmiForAge'].some(k=>result[k].zscore!==null||result[k].error!=='oedemaWarning'))throw Error('importInvalid');
    }
}
if(typeof module!=='undefined'&&module.exports)module.exports={CDCResultValidation};else window.CDCResultValidation=CDCResultValidation;
