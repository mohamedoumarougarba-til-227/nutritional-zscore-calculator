/** Offline aggregate interchange. Counts measurement rows, never admissions or unique people.
 * DHIS2 metadata must come from the receiving organisation. No remote requests.
 */
class ReportingExport {
    static metrics=['rows','eligible6to59','muacMissing','muacSevere','muacModerate','muacNotLow','nutritionSevere','nutritionModerateCriteria','nutritionIncomplete','dangerPresent'];
    static validPeriod(period) { return typeof period==='string'&&/^\d{4}(0[1-9]|1[0-2])$/.test(period); }
    static measurementPeriod(date) {
        if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return null;
        const time=Date.parse(date+'T00:00:00Z');
        return Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===date?date.slice(0,7).replace('-',''):null;
    }
    static checkReport(report) {
        const fail=()=>{throw new Error('reportAggregateInvalid');};
        if(!report||report.format!=='zscore-measurement-aggregate'||report.version!==1||report.unit!=='measurement-rows'||!this.validPeriod(report.period))fail();
        const counts=report.counts;
        if(!counts||typeof counts!=='object'||Array.isArray(counts)||JSON.stringify(Object.keys(counts).sort())!==JSON.stringify(this.metrics.slice().sort()))fail();
        if([...Object.values(counts),report.excluded,report.unassessed].some(n=>!Number.isSafeInteger(n)||n<0))fail();
        if(counts.eligible6to59>counts.rows||counts.dangerPresent>counts.rows||report.unassessed>counts.rows)fail();
        for(const group of [['muacMissing','muacSevere','muacModerate','muacNotLow'],['nutritionSevere','nutritionModerateCriteria','nutritionIncomplete']]){
            if(group.reduce((sum,key)=>sum+counts[key],0)>counts.eligible6to59)fail();
        }
        return true;
    }
    static aggregate(entries,period) {
        if(!this.validPeriod(period))throw new Error('reportPeriodInvalid');
        const counts=Object.fromEntries(this.metrics.map(k=>[k,0]));
        let excluded=0,unassessed=0;
        for(const {child:c,result:r}of entries){
            if(this.measurementPeriod(c?.measurementDate)!==period){excluded++;continue;}
            counts.rows++;
            const eligible=c.growthProfile!=='intergrowth'&&Number.isFinite(c.totalAgeMonths)&&c.totalAgeMonths>=6&&c.totalAgeMonths<60;
            if(eligible)counts.eligible6to59++;
            const n=r?.nutrition;
            if(n?.version!==1){unassessed++;if(eligible){counts.nutritionIncomplete++;if(c.muac===undefined||c.muac==='')counts.muacMissing++;}continue;}
            if(n.reasons.includes('dangerPresent'))counts.dangerPresent++;
            if(!eligible)continue;
            if(['muacMissing','muacSevere','muacModerate','muacNotLow'].includes(n.muac))counts[n.muac]++;
            if(['nutritionSevere','nutritionModerateCriteria','nutritionIncomplete'].includes(n.category))counts[n.category]++;
        }
        const report={format:'zscore-measurement-aggregate',version:1,period,unit:'measurement-rows',counts,excluded,unassessed};
        this.checkReport(report);return report;
    }
    static dhis2(report,profile) {
        this.checkReport(report);
        const uid=value=>typeof value==='string'&&/^[A-Za-z][A-Za-z0-9]{10}$/.test(value);
        if(!profile||profile.format!=='zscore-dhis2-mapping'||profile.version!==1||profile.unit!=='measurement-rows'||!uid(profile.orgUnit)||!uid(profile.dataSet)||!Array.isArray(profile.mappings)||!profile.mappings.length||profile.mappings.length>this.metrics.length)throw new Error('reportMappingInvalid');
        const seen=new Set(),metrics=new Set();
        const dataValues=profile.mappings.map(m=>{
            if(!this.metrics.includes(m.metric)||!uid(m.dataElement)||!uid(m.categoryOptionCombo)||metrics.has(m.metric))throw new Error('reportMappingInvalid');
            const coordinate=m.dataElement+':'+m.categoryOptionCombo;
            if(seen.has(coordinate))throw new Error('reportMappingInvalid');seen.add(coordinate);metrics.add(m.metric);
            const value=report.counts[m.metric];if(!Number.isSafeInteger(value)||value<0)throw new Error('reportMappingInvalid');
            return {dataElement:m.dataElement,categoryOptionCombo:m.categoryOptionCombo,value:String(value)};
        });
        // Explicit unit opt-in prevents relabelling row counts as patient/admission counts.
        return {dataSet:profile.dataSet,period:report.period,orgUnit:profile.orgUnit,dataValues};
    }
}
if(typeof module!=='undefined'&&module.exports)module.exports={ReportingExport};else window.ReportingExport=ReportingExport;
