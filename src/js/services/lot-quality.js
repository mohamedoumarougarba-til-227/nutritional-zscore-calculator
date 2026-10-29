'use strict';
/** Non-destructive review of local measurement rows. Signals are candidates
 * for human checking, never a diagnosis, deduplication or survey inference. */
class LotQuality {
    static version=1;
    static codes=['qualityNoCaseId','qualityEstimatedAge','qualityPmaOnly','qualityUnknownOedema',
        'qualityMissingDate','qualityInvalidDate','qualityInvalidSex','qualityAgeUnusable','qualityInvalidMeasure','qualityNotCalculated',
        'qualityImported','qualityUnavailableScore','qualityFlaggedScore','qualityOutsidePrintedChart','qualityReferenceMismatch',
        'qualityIdentityConflict','qualityRepeatedDate','qualityDuplicateMeasures'];
    static measures=['weight','height','muac','headCircumference','tricepsSkinfold','subscapularSkinfold'];
    static indicators=['weightForAge','heightForAge','weightForHeight','bmiForAge',
        'headCircumferenceForAge','armCircumferenceForAge','tricepsForAge','subscapularForAge'];
    static present(v){return v!==undefined&&v!==null&&v!=='';}
    static validDate(v){
        if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;
        const time=Date.parse(v+'T00:00:00Z');
        return Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===v;
    }
    static key(c){return typeof c.caseId==='string'?c.caseId.trim():'';}
    static profile(c){return c.growthProfile||'who';}
    static score(result,key){return result?.additionalGrowth?.indicators?.[key]??result?.[key];}
    static reference(result,key){return Object.hasOwn(result?.additionalGrowth?.indicators||{},key)?result.additionalGrowth.referenceVersion:result?.referenceVersion;}
    static add(map,key,index){if(!map.has(key))map.set(key,[]);map.get(key).push(index);}
    static build(entries){
        if(!Array.isArray(entries)||entries.length>5000||entries.some(e=>!e||!e.child||typeof e.child!=='object'||Array.isArray(e.child)))throw Error('qualityInvalid');
        const rows=entries.map((_,index)=>({index:index+1,codes:[]}));
        const identities=new Map(),dates=new Map(),duplicates=new Map();
        const signal=(index,code)=>{if(!rows[index].codes.includes(code))rows[index].codes.push(code);};
        entries.forEach(({child:c,result:r},index)=>{
            const id=this.key(c),date=this.validDate(c.measurementDate);
            if(!id)signal(index,'qualityNoCaseId');else this.add(identities,id,index);
            if(c.ageMode==='months')signal(index,'qualityEstimatedAge');
            if(this.profile(c)==='intergrowth'&&c.ageMode==='pma')signal(index,'qualityPmaOnly');
            if(!['n','y'].includes(c.oedema))signal(index,'qualityUnknownOedema');
            if(!this.present(c.measurementDate))signal(index,'qualityMissingDate');else if(!date)signal(index,'qualityInvalidDate');
            if(this.present(c.birthDate)&&!this.validDate(c.birthDate))signal(index,'qualityInvalidDate');
            if(!['M','F'].includes(c.gender))signal(index,'qualityInvalidSex');
            const usableAge=c.ageMode==='pma'?this.profile(c)==='intergrowth'&&Number.isInteger(c.postmenstrualDays)&&c.postmenstrualDays>=189&&c.postmenstrualDays<=448:
                c.ageMode==='months'?Number.isInteger(c.ageYears)&&c.ageYears>=0&&Number.isInteger(c.ageMonths)&&c.ageMonths>=0&&c.ageMonths<12:
                ['days','dates'].includes(c.ageMode)&&Number.isInteger(c.ageDays)&&c.ageDays>=0&&(c.ageMode!=='dates'||date&&this.validDate(c.birthDate));
            if(!usableAge)signal(index,'qualityAgeUnusable');
            if(this.measures.some(k=>this.present(c[k])&&(!Number.isFinite(c[k])||c[k]<=0)))signal(index,'qualityInvalidMeasure');
            if(!r)signal(index,'qualityNotCalculated');else{
                if(r.imported)signal(index,'qualityImported');
                const keys=[...(r.applicableIndicators||['weightForAge','heightForAge','weightForHeight','bmiForAge']),...Object.keys(r.additionalGrowth?.indicators||{})];
                for(const key of new Set(keys)){
                    const v=this.score(r,key);if(v?.notApplicable)continue;
                    if(!v||!Number.isFinite(v.zscore)||v.error)signal(index,'qualityUnavailableScore');
                    if(v?.flagged===true)signal(index,'qualityFlaggedScore');
                    if(v?.chartRange==='outsidePrintedChart')signal(index,'qualityOutsidePrintedChart');
                    if(Number.isFinite(v?.zscore)&&v.reference!==this.reference(r,key))signal(index,'qualityReferenceMismatch');
                }
            }
            if(id&&date){
                this.add(dates,JSON.stringify([id,c.measurementDate]),index);
                // Identity/date plus all entered age/measurement/clinical fields.
                // IDs, timestamps and calculated scores intentionally excluded.
                const fields=['gender','birthDate','ageMode','ageDays','ageYears','ageMonths','totalAgeMonths',
                    'gestationalAgeWeeks','gestationalAgeDays','postmenstrualDays','position','oedema',
                    ...this.measures,'cannotDrink','vomitsEverything','convulsions','lethargy',
                    'acuteProblem','appetite','oedemaGrade','furtherAssessment'];
                this.add(duplicates,JSON.stringify([id,c.measurementDate,this.profile(c),...fields.map(k=>c[k]??'')]),index);
            }
        });
        let identityGroups=0,dateGroups=0,duplicateGroups=0;
        for(const indexes of identities.values()){
            const sexes=new Set(),births=new Set(),gestations=new Set();
            for(const i of indexes){const c=entries[i].child;
                if(['M','F'].includes(c.gender))sexes.add(c.gender);
                if(this.validDate(c.birthDate))births.add(c.birthDate);
                if(this.profile(c)==='intergrowth'&&Number.isInteger(c.gestationalAgeWeeks)&&Number.isInteger(c.gestationalAgeDays))gestations.add(c.gestationalAgeWeeks*7+c.gestationalAgeDays);
            }
            if(sexes.size>1||births.size>1||gestations.size>1){identityGroups++;for(const i of indexes)signal(i,'qualityIdentityConflict');}
        }
        for(const indexes of dates.values())if(indexes.length>1){dateGroups++;for(const i of indexes)signal(i,'qualityRepeatedDate');}
        for(const indexes of duplicates.values())if(indexes.length>1){duplicateGroups++;for(const i of indexes)signal(i,'qualityDuplicateMeasures');}
        const counts=Object.fromEntries(this.codes.map(code=>[code,0]));
        for(const row of rows){row.codes.sort((a,b)=>this.codes.indexOf(a)-this.codes.indexOf(b));for(const code of row.codes)counts[code]++;}
        return {format:'zscore-lot-quality',version:this.version,unit:'measurement-rows',total:entries.length,
            signalledRows:rows.filter(r=>r.codes.length).length,counts,groups:{identity:identityGroups,repeatedDate:dateGroups,duplicateMeasures:duplicateGroups},rows};
    }
    static reviewRows(entries){
        return [['format','version','unit','record_index','review_codes'],...this.build(entries).rows.map(r=>['zscore-lot-quality',this.version,'measurement-rows',r.index,r.codes.join('|')])];
    }
    static analysisRows(entries){
        const quality=this.build(entries),finite=v=>Number.isFinite(v)?v:'',present=v=>this.present(v)?v:'';
        const columns=['format','version','unit','sampling_design','record_index','review_codes',
            'growth_profile','reference_family','reference','engine_version','imported_result','measurement_month',
            'age_input_mode','age_precision','age_days','reported_age_months','calculation_age_months','gestation_birth_days','postmenstrual_days','sex',
            'weight_g','length_height_cm','harmonized_height_cm','bmi_kg_m2','position','oedema','muac_mm','head_circumference_cm','triceps_mm','subscapular_mm',
            ...this.indicators.flatMap(k=>[k+'_zscore_raw',k+'_zscore',k+'_percentile',k+'_flagged',k+'_error',k+'_reference',k+'_method',k+'_biological_plausibility_assessed',k+'_chart_range']),
            'sampling_cluster','sampling_stratum','sampling_weight'];
        const rows=entries.map(({child:c,result:r},i)=>[
            'zscore-analysis-preparation',this.version,'measurement-rows','not-provided',i+1,quality.rows[i].codes.join('|'),
            this.profile(c),r?.referenceFamily||'',r?.referenceVersion||'',r?.engineVersion||'',r?.imported===true,
            this.validDate(c.measurementDate)?c.measurementDate.slice(0,7):'',
            present(c.ageMode),r?.profileContext?.agePrecision||r?.intergrowthContext?.age.precision||(c.ageMode==='months'?'estimatedMonths':c.ageMode==='pma'?'postmenstrualOnly':['days','dates'].includes(c.ageMode)?'exact':'unknown'),finite(c.ageDays),finite(c.totalAgeMonths),finite(r?.ageInMonths),
            finite(r?.intergrowthContext?.age.birthGestationDays),finite(c.postmenstrualDays),present(c.gender),
            ...['weight','height'].map(k=>finite(c[k])),finite(r?.correctedHeight),finite(r?.bmi),present(c.position),present(c.oedema),
            ...['muac','headCircumference','tricepsSkinfold','subscapularSkinfold'].map(k=>finite(c[k])),
            ...this.indicators.flatMap(k=>{const v=this.score(r,k);return [finite(v?.zscoreRaw),finite(v?.zscore),finite(v?.percentile),
                typeof v?.flagged==='boolean'?v.flagged:'',v?.error||'',v?.reference||'',v?.method||'',
                typeof v?.biologicalPlausibilityAssessed==='boolean'?v.biologicalPlausibilityAssessed:'',v?.chartRange||''];}),
            '','','']);
        return [columns,...rows];
    }
}
if(typeof module!=='undefined'&&module.exports)module.exports={LotQuality};else window.LotQuality=LotQuality;
