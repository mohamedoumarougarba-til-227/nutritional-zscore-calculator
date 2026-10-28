const NutritionCSV=typeof module!=='undefined'&&module.exports?require('./nutrition-assessment.js').NutritionAssessment:NutritionAssessment;
const SupplementaryCSV=typeof module!=='undefined'&&module.exports?require('./supplementary-growth.js').SupplementaryGrowth:SupplementaryGrowth;
class CSVManager {
    static maxBytes = 50 * 1024 * 1024;
    static maxRows = 50000;
    static batchSize = 5000;
    static fields = ['name', 'caseId', 'ageYears', 'ageMonths', 'ageDays', 'ageMode', 'birthDate', 'measurementDate', 'weight', 'height', 'gender', 'position', 'oedema', 'growthProfile','postmenstrualDays','gestationalAgeWeeks','gestationalAgeDays', ...NutritionCSV.inputFields,...SupplementaryCSV.fields];
    static aliases = {name:['nom','nomprenom','nompseudo','pseudonyme'],caseId:['dossier','identifiant','identifiantdossier','id'],ageYears:['annees','ageannees','years'],ageMonths:['mois','agemois','months'],ageDays:['jours','agejours','days'],ageMode:['modeage'],birthDate:['datedenaissance','datenaissance','naissance','dob'],measurementDate:['datedemesure','datemesure','date'],weight:['poids','poidsg','poidskg','weightg','weightkg'],height:['taille','longueur','taillecm','heightcm'],gender:['sexe','sex'],position:['positiondemesure','mesureposition'],oedema:['oedeme','oedemes','oedemesbilateraux','edema'],muac:['pb','pbmm','pbcm','muacmm','muaccm'],headCircumference:['perimetrecranien','perimetrecraniencm','headc','headcircumferencecm'],tricepsSkinfold:['plitricipital','plitricipitalmm','triskin','tricepsmm'],subscapularSkinfold:['plisousscapulaire','plisousscapulairemm','subskin','subscapularmm']};
    static headerKey(value) { return String(value).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/œ/g,'oe').replace(/[^a-z0-9]/g,''); }
    static separator(text) {
        const counts={',':0,';':0,'\t':0};let quoted=false;
        for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"')i++;else quoted=!quoted;}else if(!quoted){if(c==='\r'||c==='\n')break;if(Object.hasOwn(counts,c))counts[c]++;}}
        return Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0];
    }
    static *rows(text) {
        text=String(text).replace(/^\uFEFF/,'');
        const separator=this.separator(text);
        let row=[],field='',quoted=false,afterQuote=false;
        for(let i=0;i<=text.length;i++){
            const c=text[i];
            if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;afterQuote=true;}}else if(c===undefined)throw Error('csvInvalid');else field+=c;continue;}
            if(c==='"'&&field===''&&!afterQuote){quoted=true;continue;}
            if(c===separator||c==='\n'||c==='\r'||c===undefined){row.push(field);field='';afterQuote=false;if(c!==separator){if(row.some(v=>v.trim()))yield row;row=[];if(c==='\r'&&text[i+1]==='\n')i++;}}
            else{if(afterQuote||c==='"')throw Error('csvInvalid');field+=c;}
        }
    }
    static inspect(text) {
        if(new TextEncoder().encode(text).length>this.maxBytes)throw Error('csvTooLarge');
        const iterator=this.rows(text),headers=iterator.next().value?.map(v=>v.trim());
        if(!headers?.length||headers.length>256||headers.some(h=>!h||h.length>200)||new Set(headers).size!==headers.length)throw Error('csvInvalid');
        const mapping={},ambiguous=[];
        for(const field of this.fields){const candidates=headers.filter(h=>this.headerKey(h)===this.headerKey(field)||(this.aliases[field]||[]).includes(this.headerKey(h)));if(candidates.length===1)mapping[field]=candidates[0];else if(candidates.length>1)ambiguous.push(field);}
        const sample=[];for(let i=0;i<3;i++){const next=iterator.next();if(next.done)break;sample.push(next.value);}
        if(!sample.length)throw Error('csvInvalid');
        return {headers,mapping,ambiguous,sample,needsMapping:ambiguous.length>0||headers.some(h=>!this.fields.includes(h)),weightUnit:/kg/i.test(mapping.weight||'')?'kg':/^(weight|weightg|poidsg)$/i.test(this.headerKey(mapping.weight||''))?'g':'',muacUnit:/cm/i.test(mapping.muac||'')?'cm':'mm'};
    }
    static options(text,options={}) {
        const info=this.inspect(text),mapping=options.mapping||Object.fromEntries(info.headers.filter(h=>this.fields.includes(h)).map(h=>[h,h]));
        const selected=Object.values(mapping).filter(Boolean);
        if(Object.keys(mapping).some(k=>!this.fields.includes(k))||selected.some(h=>!info.headers.includes(h))||new Set(selected).size!==selected.length||['gender'].some(k=>!mapping[k]))throw Error('csvMappingInvalid');
        if(!options.mapping&&info.headers.some(h=>!this.fields.includes(h)))throw Error('csvMappingInvalid');
        const units={weightUnit:options.weightUnit??'g',heightUnit:options.heightUnit??'cm',muacUnit:options.muacUnit??'mm',dateFormat:options.dateFormat??'iso',oedemaCodes:options.oedemaCodes??'text'};
        if(!['g','kg'].includes(units.weightUnit)||!['cm','m','mm'].includes(units.heightUnit)||!['mm','cm'].includes(units.muacUnit)||!['iso','dmy','mdy'].includes(units.dateFormat)||!['text','who12','zeroone'].includes(units.oedemaCodes))throw Error('csvMappingInvalid');
        return {...options,...units,mapping,headers:info.headers};
    }
    static child(values,options,line) {
        try{
            if(values.length!==options.headers.length)throw Error('csvInvalid');
            const raw=Object.fromEntries(Object.entries(options.mapping).filter(([,h])=>h).map(([k,h])=>[k,values[options.headers.indexOf(h)].trim()]));
            // A row can explicitly select its reference policy. Never infer it from language or units.
            raw.growthProfile=raw.growthProfile||options.growthProfile||'who';
            const numeric=value=>{const v=String(value).replace(/[\s\u00a0\u202f]/g,'').replace(',','.');if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(v))throw Error('csvInvalid');return Number(v);};
            for(const k of ['weight','height','muac','ageYears','ageMonths','ageDays','postmenstrualDays','gestationalAgeWeeks','gestationalAgeDays',...SupplementaryCSV.fields])if(raw[k]!==undefined&&raw[k]!=='')raw[k]=numeric(raw[k]);
            if(raw.weight!==undefined&&raw.weight!=='')raw.weight*=options.weightUnit==='kg'?1000:1;if(raw.height!==undefined&&raw.height!=='')raw.height*=options.heightUnit==='m'?100:options.heightUnit==='mm'?.1:1;
            if(raw.muac!==undefined&&raw.muac!=='')raw.muac*=options.muacUnit==='cm'?10:1;
            const key=v=>this.headerKey(v||'');
            raw.gender=({m:'M',male:'M',masculin:'M',garcon:'M',homme:'M','1':'M',f:'F',female:'F',feminin:'F',fille:'F',femme:'F','2':'F'})[key(raw.gender)]||raw.gender;
            raw.position=({l:'L',lying:'L',supine:'L',couche:'L',longueur:'L',h:'H',standing:'H',debout:'H',taille:'H'})[key(raw.position)]||raw.position;
            raw.oedema=(options.oedemaCodes==='who12'?{'1':'y','2':'n'}:options.oedemaCodes==='zeroone'?{'0':'n','1':'y'}:{n:'n',non:'n',no:'n',y:'y',oui:'y',yes:'y'})[key(raw.oedema)]||raw.oedema;
            for(const k of ['birthDate','measurementDate'])if(raw[k]&&options.dateFormat!=='iso'){const a=raw[k].match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);if(!a)throw Error('dateInvalid');raw[k]=`${a[3]}-${(options.dateFormat==='dmy'?a[2]:a[1]).padStart(2,'0')}-${(options.dateFormat==='dmy'?a[1]:a[2]).padStart(2,'0')}`;}
            if(!raw.ageMode)raw.ageMode=raw.growthProfile==='intergrowth'&&raw.postmenstrualDays!==undefined?'pma':raw.birthDate?'dates':raw.ageDays!==undefined?'days':'months';
            return ClinicalEngine.normalize(raw,{extended:!!options.extended});
        }catch(error){error.csvLine=line;throw error;}
    }
    static summary(model) {
        return '\uFEFF'+LotAnalysis.csvRows(model).map(row=>row.map(CSVManager.cell).join(',')).join('\r\n');
    }
    static parse(text, config={}) {
        const options=this.options(text,config),iterator=this.rows(text);iterator.next();const children=[];
        for(const values of iterator){if(children.length>=this.maxRows)throw Error('csvRowsLimit');children.push(this.child(values,options,children.length+2));}return children;
    }
    static async parseAsync(text,options={}) {
        const config=this.options(text,options),iterator=this.rows(text);iterator.next();const children=[];
        for(const values of iterator){if(children.length>=this.maxRows)throw Error('csvRowsLimit');if(options.cancelled?.())throw Error('csvCancelled');children.push(this.child(values,config,children.length+2));if(children.length%500===0){options.progress?.(children.length);await new Promise(resolve=>setTimeout(resolve,0));}}
        if(options.cancelled?.())throw Error('csvCancelled');return children;
    }
    static cell(value) {
        if (typeof value !== 'number' && /^\s*[=+@\-\t\r]/.test(String(value ?? ''))) value = "'" + value;
        return '"' + String(value ?? '').replace(/"/g, '""') + '"';
    }
    static results(entries) {
        const keys = ['weightForAge', 'heightForAge', 'weightForHeight'];
        const percentileKeys=[...keys,'bmiForAge'];
        const additionalKeys=Object.keys(SupplementaryCSV.definitions),additionalColumns=['zscore','zscoreRaw','percentile','percentileStatus','flagged','error','reference'];
        const header = ['name', 'caseId', 'visitId', 'ageMode', 'ageDays', 'measurementDate', 'weight_g', 'height_cm', 'gender', 'position', 'oedema', ...keys, ...keys.map(k => k + '_flag'), 'status', 'reference', 'engineVersion', 'calculatedAt', 'bmi_kg_m2', 'bmiForAge', 'bmiForAge_flag', 'bmiForAge_error',...percentileKeys.map(k=>k+'_zscore_raw'),...percentileKeys.map(k=>k+'_percentile'),...percentileKeys.map(k=>k+'_percentile_status'),'reference_family','age_in_months',...percentileKeys.map(k=>k+'_not_applicable'),...NutritionCSV.inputFields,'nutrition_category','nutrition_orientation','nutrition_reference','nutrition_version','nutrition_missing','nutrition_criteria',...SupplementaryCSV.fields,...additionalKeys.flatMap(k=>additionalColumns.map(c=>k+'_'+c))];
        const rows = entries.map(({child:c, result:r}) => [c.name, c.caseId, c.visitId, c.ageMode, c.ageDays, c.measurementDate, c.weight, c.height, c.gender, c.position, c.oedema,
            ...keys.map(k => r?.[k]?.zscore), ...keys.map(k => r?.referenceFamily==='INTERGROWTH2015'?'':r?.[k]?.flagged ? 1 : 0), r?.status || 'not-calculated', r?.referenceVersion || 'unknown', r?.engineVersion || '', r?.calculatedAt,
            r?.schemaVersion===4?r.bmi:'',r?.schemaVersion===4?r.bmiForAge?.zscore:'',r?.schemaVersion===4&&typeof r.bmiForAge?.zscore==='number'?(r.bmiForAge.flagged?1:0):'',r?.schemaVersion===4?r.bmiForAge?.error:'',
            ...percentileKeys.map(k=>r?.percentileVersion===1?r[k]?.zscoreRaw:''),...percentileKeys.map(k=>r?.percentileVersion===1?r[k]?.percentile:''),...percentileKeys.map(k=>r?.percentileVersion===1?r[k]?.percentileStatus:''),r?.referenceFamily||'',r?.ageInMonths??'',...percentileKeys.map(k=>r?.schemaVersion===4?(r[k]?.notApplicable?1:0):''),...NutritionCSV.inputFields.map(k=>c[k]??''),r?.nutrition?.category,r?.nutrition?.orientation,r?.nutrition?.reference,r?.nutrition?.version,r?.nutrition?.missing.join('|'),r?.nutrition?.criteria?.join('|'),...SupplementaryCSV.fields.map(k=>c[k]??''),...additionalKeys.flatMap(k=>additionalColumns.map(field=>r?.additionalGrowth?.indicators?.[k]?.[field]??''))]);
        const contextColumns=['growth_profile','reported_age_months','age_precision','age_years','age_months',...percentileKeys.flatMap(k=>[k+'_method',k+'_modified_zscore']),...['p5','p85','p95','percentOfP95','originalZscoreRaw','sigma'].map(k=>'bmiForAge_'+k)];
        header.push(...contextColumns,'postmenstrual_days','gestational_age_weeks','gestational_age_days','birth_gestation_days','intergrowth_core_version','headCircumferenceForAge_method','headCircumferenceForAge_chart_range','intergrowth_clinical_eligibility_assessed',...['weightForAge','heightForAge','headCircumferenceForAge'].map(k=>k+'_biological_plausibility_assessed'));
        entries.forEach(({child:c,result:r},i)=>rows[i].push(c.growthProfile||'who',r?.profileContext?.reportedAgeInMonths??c.totalAgeMonths??'',r?.profileContext?.agePrecision||(c.ageMode==='months'?'completedMonths':'exact'),c.ageYears??'',c.ageMonths??'',...percentileKeys.flatMap(k=>[r?.[k]?.method??'',r?.[k]?.modifiedZscore??'']),...['p5','p85','p95','percentOfP95','originalZscoreRaw','sigma'].map(k=>r?.bmiForAge?.[k]??'')));
        entries.forEach(({child:c,result:r},i)=>rows[i].push(c.postmenstrualDays??'',c.gestationalAgeWeeks??'',c.gestationalAgeDays??'',r?.intergrowthContext?.age.birthGestationDays??'',r?.intergrowthContext?.coreVersion??'',r?.additionalGrowth?.indicators.headCircumferenceForAge?.method??'',r?.additionalGrowth?.indicators.headCircumferenceForAge?.chartRange??'',r?.intergrowthContext?.clinicalEligibilityAssessed??'',...['weightForAge','heightForAge','headCircumferenceForAge'].map(k=>(k==='headCircumferenceForAge'?r?.additionalGrowth?.indicators[k]:r?.[k])?.biologicalPlausibilityAssessed??'')));
        return '\uFEFF' + [header, ...rows].map(row => row.map(CSVManager.cell).join(',')).join('\r\n');
    }
}
if (typeof module !== 'undefined' && module.exports) module.exports = { CSVManager };
else window.CSVManager = CSVManager;
