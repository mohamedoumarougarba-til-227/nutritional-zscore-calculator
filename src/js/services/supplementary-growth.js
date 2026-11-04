/** Optional WHO child growth indicators. No diagnosis or change to absolute MUAC screening. */
class SupplementaryGrowth {
    static version = 1;
    static fields = ['headCircumference','tricepsSkinfold','subscapularSkinfold'];
    static definitions = {
        headCircumferenceForAge:{field:'headCircumference',unit:'cm',min:25,max:64,start:0,adjust:false},
        armCircumferenceForAge:{field:'muac',unit:'mm',min:50,max:400,start:91,adjust:true,scale:.1},
        tricepsForAge:{field:'tricepsSkinfold',unit:'mm',min:1.8,max:40,start:91,adjust:true},
        subscapularForAge:{field:'subscapularSkinfold',unit:'mm',min:1.8,max:40,start:91,adjust:true}
    };
    static present(value){return value!==undefined&&value!==null&&value!=='';}
    static normalize(raw){
        const values={};
        for(const {field,min,max} of Object.values(this.definitions)){
            const value=raw[field];if(!this.present(value))continue;
            if(!['number','string'].includes(typeof value)||typeof value==='string'&&!value.trim()||!Number.isFinite(Number(value))||Number(value)<min||Number(value)>max)throw Error('additionalMeasureInvalid');
            values[field]=Number(value);
        }
        return values;
    }
    constructor(data){
        if(data?.schemaVersion!==1||!/^WHO-child-additional-[a-f0-9]{12}$/.test(data.referenceVersion||''))throw Error('referenceInvalid');
        for(const [key,{start}] of Object.entries(SupplementaryGrowth.definitions))for(const sex of ['M','F']){
            const rows=data.tables?.[key]?.[sex];
            if(!rows||Object.keys(rows).length!==1827-start)throw Error('referenceInvalid');
            for(let day=start;day<=1826;day++){const p=rows[day];if(!Array.isArray(p)||p.length!==3||!p.every(Number.isFinite)||p[1]<=0||p[2]<=0)throw Error('referenceInvalid');}
        }
        this.data=data;
    }
    static category(z){return z < -2?'additionalBelow2':z > 2?'additionalAbove2':'additionalWithin';}
    calculate(child,core){
        const values=SupplementaryGrowth.normalize(child),indicators={};
        for(const [key,def] of Object.entries(SupplementaryGrowth.definitions)){
            if(!Object.hasOwn(values,def.field))continue;
            const base={measure:values[def.field],unit:def.unit,reference:this.data.referenceVersion};
            if(child.totalAgeMonths>=60||child.ageDays<def.start||child.ageDays>1826){indicators[key]={...base,zscore:null,error:'additionalAgeDomain',zscoreRaw:null,percentile:null,percentileStatus:'percentileUnavailable'};continue;}
            const z=core.lms(values[def.field]*(def.scale||1),this.data.tables[key][child.gender][child.ageDays],def.adjust);
            const rounded=Math.round(z*100)/100;
            indicators[key]={...base,zscore:Object.is(rounded,-0)?0:rounded,classification:SupplementaryGrowth.category(z),flagged:Math.abs(rounded)>5,...core.percentileFields(z)};
        }
        return Object.keys(indicators).length?{version:1,referenceVersion:this.data.referenceVersion,indicators}:undefined;
    }
    static check(child,value,core){
        const normalized=this.normalize(child);
        if(value===undefined){if(this.fields.some(k=>Object.hasOwn(normalized,k)))throw Error('importInvalid');return;}
        if(value?.version!==1||!/^WHO-child-additional-[a-f0-9]{12}$/.test(value.referenceVersion||'')||!value.indicators||typeof value.indicators!=='object'||Array.isArray(value.indicators))throw Error('importInvalid');
        const keys=Object.entries(this.definitions).filter(([,d])=>Object.hasOwn(normalized,d.field)).map(([key])=>key);
        if(!keys.length||JSON.stringify(Object.keys(value.indicators).sort())!==JSON.stringify(keys.sort()))throw Error('importInvalid');
        for(const key of keys){
            const v=value.indicators[key],d=this.definitions[key],outside=child.totalAgeMonths>=60||child.ageDays<d.start||child.ageDays>1826;
            if(!v||v.measure!==normalized[d.field]||v.unit!==d.unit||v.reference!==value.referenceVersion)throw Error('importInvalid');
            if(outside){if(v.flagged!==undefined||v.classification!==undefined||v.zscore!==null||v.error!=='additionalAgeDomain'||v.zscoreRaw!==null||v.percentile!==null||v.percentileStatus!=='percentileUnavailable')throw Error('importInvalid');continue;}
            if(typeof v.zscore!=='number'||!Number.isFinite(v.zscore)||typeof v.zscoreRaw!=='number'||!Number.isFinite(v.zscoreRaw)||Math.round(v.zscoreRaw*100)/100!==v.zscore||v.classification!==this.category(v.zscoreRaw)||v.flagged!==(Math.abs(v.zscore)>5)||v.error!==undefined)throw Error('importInvalid');
            const expected=core.percentileFields(v.zscoreRaw);
            if(v.percentile!==expected.percentile||v.percentileStatus!==expected.percentileStatus)throw Error('importInvalid');
        }
    }
}
if(typeof module!=='undefined'&&module.exports)module.exports={SupplementaryGrowth};else window.SupplementaryGrowth=SupplementaryGrowth;
