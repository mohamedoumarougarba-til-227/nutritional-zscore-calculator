/** Offline aggregate interchange. Counts measurement rows, never admissions or unique people.
 * DHIS2 metadata must come from the receiving organisation. No remote requests.
 */
class ReportingExport {
    static metrics=['rows','eligible6to59','muacMissing','muacSevere','muacModerate','muacNotLow','nutritionSevere','nutritionModerateCriteria','nutritionIncomplete','dangerPresent'];
    static aggregate(entries,period) {
        if(!/^\d{4}(0[1-9]|1[0-2])$/.test(period))throw new Error('reportPeriodInvalid');
        const counts=Object.fromEntries(this.metrics.map(k=>[k,0]));
        let excluded=0,unassessed=0;
        for(const {child:c,result:r}of entries){
            if(!/^\d{4}-\d{2}-\d{2}$/.test(c?.measurementDate||'')||c.measurementDate.slice(0,7).replace('-','')!==period){excluded++;continue;}
            counts.rows++;
            const eligible=Number.isFinite(c.totalAgeMonths)&&c.totalAgeMonths>=6&&c.totalAgeMonths<60;
            if(eligible)counts.eligible6to59++;
            const n=r?.nutrition;
            if(n?.version!==1){unassessed++;if(eligible){counts.nutritionIncomplete++;if(c.muac===undefined||c.muac==='')counts.muacMissing++;}continue;}
            if(n.reasons.includes('dangerPresent'))counts.dangerPresent++;
            if(!eligible)continue;
            if(['muacMissing','muacSevere','muacModerate','muacNotLow'].includes(n.muac))counts[n.muac]++;
            if(['nutritionSevere','nutritionModerateCriteria','nutritionIncomplete'].includes(n.category))counts[n.category]++;
        }
        return {format:'zscore-measurement-aggregate',version:1,period,unit:'measurement-rows',counts,excluded,unassessed};
    }
    static dhis2(report,profile) {
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
