/** Historical plots of stored Z-scores. No recalculation, interpolation or patient transmission. */
class GrowthChart {
    // Inverse LMS only within the published -3..+3 reference curves. Patient
    // values below are read from their archived snapshot, never recalculated.
    static referenceValue(z, [l,m,s]) {
        if (!Number.isFinite(z) || Math.abs(z)>3 || ![l,m,s].every(Number.isFinite) || m<=0 || s<=0 || l!==0 && 1+l*s*z<=0) return null;
        const value=l===0?m*Math.exp(s*z):m*Math.exp(Math.log1p(l*s*z)/l);
        return Number.isFinite(value)&&value>0?value:null;
    }
    static referenceModel(entries, engine) {
        const sexes=new Set(entries.map(e=>e.child?.gender));
        if(sexes.size!==1 || !['M','F'].includes([...sexes][0]) || !engine?.data?.tables) return null;
        const sex=[...sexes][0],reference=engine.data.referenceVersion,older=reference.startsWith('WHO-2007-'),month=30.4375;
        const panels=['weightForAge','heightForAge','bmiForAge'].map(key=>{
            const upper=key==='weightForAge'?121:229;
            const days=older?[...Array.from({length:upper-60},(_,i)=>(60+i)*month),(upper-1e-8)*month]:[...new Set([0,730,731,1826,...Array.from({length:131},(_,i)=>i*14).filter(d=>d<=1826)])].sort((a,b)=>a-b);
            const segments=older||key==='weightForAge'?[days]:[days.filter(d=>d<731),days.filter(d=>d>=731)];
            const curves=[-3,-2,0,2,3].map(z=>({z,segments:segments.map(segment=>segment.map(day=>({day,value:this.referenceValue(z,older?engine.params(key,sex,day/month):engine.data.tables[key]?.[sex]?.[day]||[])})).filter(p=>p.value!==null))}));
            const points=entries.flatMap((entry,index)=>{
                const child=entry.child,result=entry.result,indicator=result?.[key];
                let dated=false,withinAge=Number.isInteger(child.ageDays)&&child.ageDays>=0&&child.ageDays<=1826;
                try{
                    const measurement=ClinicalEngine.dateDays(child.measurementDate);dated=true;
                    if(older)withinAge=result?.schemaVersion===4&&result.ageInMonths>=60&&result.ageInMonths<upper;
                    else if(child.ageDomainVersion===2)withinAge=withinAge&&child.totalAgeMonths<60;
                    else if(child.ageMode==='dates')withinAge=withinAge&&ClinicalEngine.beforeFifthBirthday(ClinicalEngine.dateDays(child.birthDate),measurement);
                    else if(child.ageDays===1826)withinAge=withinAge&&ClinicalEngine.beforeFifthBirthday(measurement-child.ageDays,measurement);
                }catch(_){dated=false;}
                if(!dated||!withinAge||result?.schemaVersion!==4||result.referenceVersion!==reference||indicator?.reference!==reference||!Number.isFinite(indicator.zscore)||indicator.error||indicator.flagged)return [];
                const value=key==='weightForAge'?child.weight/1000:key==='heightForAge'?result.correctedHeight:result.bmi;
                if(!Number.isFinite(value)||value<=0)return [];
                return [{index,day:older?result.ageInMonths*month:child.ageDays,date:child.measurementDate,value,estimated:child.ageMode==='months',imported:!!result.imported}];
            });
            const values=[...curves.flatMap(c=>c.segments.flatMap(s=>s.map(p=>p.value))),...points.map(p=>p.value)];
            const {low,high}=values.reduce((r,v)=>({low:Math.min(r.low,v),high:Math.max(r.high,v)}),{low:Infinity,high:-Infinity}),pad=Math.max((high-low)*.08,.5);
            return {key,curves,points,omitted:entries.length-points.length,min:Math.max(0,low-pad),max:high+pad,xMin:older?60*month:0,xMax:older?upper*month:60*month,older};
        });
        return {sex,reference,total:entries.length,panels:panels.filter(p=>!older||p.key!=='weightForAge'||entries.some(e=>e.result?.referenceVersion===reference&&e.result.ageInMonths<121)),older};
    }
    static referenceCoordinates(point,panel) {
        return {x:48+(point.day-(panel.xMin||0))/((panel.xMax||60*30.4375)-(panel.xMin||0))*318,y:202-(point.value-panel.min)/(panel.max-panel.min)*176};
    }
    static referenceLabels(panel) {
        const labels=panel.curves.map(curve=>({z:curve.z,actual:this.referenceCoordinates(curve.segments.at(-1).at(-1),panel).y})).sort((a,b)=>a.actual-b.actual);
        labels.forEach((label,i)=>{label.y=Math.max(label.actual,i?labels[i-1].y+18:26);});
        if(labels.at(-1).y>202){labels.at(-1).y=202;for(let i=labels.length-2;i>=0;i--)labels[i].y=Math.min(labels[i].y,labels[i+1].y-18);}
        return labels;
    }
    static referenceHTML(entries,engine,ui) {
        const model=this.referenceModel(entries,engine);if(!model)return '';
        const e=v=>ui.esc(v),t=k=>ui.t(k),n=(v,d=1)=>ui.number(v,d),xy=(p,panel)=>this.referenceCoordinates(p,panel);
        const units={weightForAge:'kg',heightForAge:'cm',bmiForAge:'kg/m²'};
        const panels=model.panels.map(panel=>{
            const unit=units[panel.key],title=t(panel.key)+' · '+unit,summary=t('chartCounts').replace('{count}',panel.points.length).replace('{total}',model.total);
            const grid=Array.from({length:5},(_,i)=>{
                const value=panel.min+(panel.max-panel.min)*i/4,y=xy({day:0,value},panel).y;
                return `<line x1="48" y1="${y}" x2="366" y2="${y}" class="chart-grid"/><text x="42" y="${y+5}" text-anchor="end" class="chart-label">${e(n(value))}</text>`;
            }).join('');
            const ticks=(panel.older?(panel.key==='weightForAge'?[60,72,84,96,108,120]:[60,96,132,168,204,228]):[0,12,24,36,48,60]).map(month=>`<text x="${xy({day:month*30.4375,value:panel.min},panel).x}" y="224" text-anchor="middle" class="chart-label">${e(n(panel.older?month/12:month,0))}</text>`).join('');
            const paths=panel.curves.map(curve=>curve.segments.map(segment=>`<polyline class="reference-line reference-z${Math.abs(curve.z)}" points="${segment.map(p=>{const c=xy(p,panel);return c.x.toFixed(2)+','+c.y.toFixed(2);}).join(' ')}"/>`).join('')).join('')+this.referenceLabels(panel).map(label=>`<line x1="366" y1="${label.actual}" x2="372" y2="${label.y}" class="chart-grid"/><text x="376" y="${label.y+5}" class="chart-label">${label.z>0?'+':''}${label.z}</text>`).join('');
            const points=panel.points.map(p=>{
                const c=xy(p,panel),label=e(ui.calendarDate(p.date)+' · '+n(p.value,2)+' '+unit+(p.estimated?' · '+t('referenceEstimated'):'')+(p.imported?' · '+t('importedResult'):'')),attrs=`class="reference-point ${p.imported?'reference-imported':''}"`;
                return p.estimated?`<rect x="${c.x-4}" y="${c.y-4}" width="8" height="8" ${attrs}><title>${label}</title></rect>`:`<circle cx="${c.x}" cy="${c.y}" r="4.5" ${attrs}><title>${label}</title></circle>`;
            }).join('');
            return `<details class="chart-tile" open><summary>${e(title)}</summary><figure class="growth-chart reference-chart"><figcaption class="sr-only">${e(title)}</figcaption><p class="hint">${e(summary)}</p><svg viewBox="0 0 420 258" role="img" aria-label="${e(title+' · '+summary)}">${grid}${ticks}${paths}${points}<text x="207" y="249" text-anchor="middle" class="chart-label">${e(t(panel.older?'referenceAgeAxisYears':'referenceAgeAxis'))}</text></svg></figure></details>`;
        }).join('');
        const pointIndexes=model.panels.map(panel=>new Map(panel.points.map(p=>[p.index,p])));
        const table=`<div class="table-scroll"><table><caption>${e(t('referenceMeasurements'))}</caption><thead><tr><th scope="col">${e(t('measurementDate'))}</th><th scope="col">${e(t('days'))}</th>${model.panels.map(p=>`<th scope="col">${e(t(p.key)+' · '+units[p.key])}</th>`).join('')}</tr></thead><tbody>${entries.map((entry,index)=>`<tr><th scope="row">${e(ui.calendarDate(entry.child?.measurementDate))}</th><td>${Number.isInteger(entry.child?.ageDays)?e(n(entry.child.ageDays,0)):'—'}</td>${pointIndexes.map(points=>{const point=points.get(index);return `<td>${point?e(n(point.value,2)):'— '+e(t('referenceOmitted'))}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div>`;
        return `<details class="growth-charts reference-charts"><summary>${e(t(model.older?'referenceChartTitleOlder':'referenceChartTitle'))}</summary><p class="hint">${e(t(model.older?'referenceChartHelpOlder':'referenceChartHelp'))}</p><p class="meta">${e(t(model.sex==='M'?'male':'female'))} · ${e(model.reference)}</p><p class="hint">${e(t('referenceChartLegend'))}</p><div class="chart-panels">${panels}</div><details><summary>${e(t('referenceMeasurements'))}</summary>${table}</details></details>`;
    }
    static build(entries, referenceVersion) {
        const dated = entries.map(entry => {
            let day = null;
            try { day = ClinicalEngine.dateDays(entry.child.measurementDate); } catch (_) { /* Unknown dates stay in the table. */ }
            return {entry,day};
        });
        const keys = ['weightForAge','heightForAge','weightForHeight',...(entries.some(e=>e.result?.schemaVersion===4)?['bmiForAge']:[])].filter(key=>entries.some(e=>e.result?.schemaVersion!==4||e.result.applicableIndicators.includes(key)));
        const panels = keys.map(key => {
            const points = dated.filter(({entry,day}) => {
                const r = entry.result, v = r?.[key];
                return day !== null && r?.schemaVersion===4 && r.referenceVersion === referenceVersion
                    && v?.reference === referenceVersion && Number.isFinite(v.zscore) && !v.flagged && Math.abs(v.zscore) <= 6;
            }).map(({entry,day}) => ({day,date:entry.child.measurementDate,zscore:entry.result[key].zscore,imported:!!entry.result.imported}))
                .sort((a,b)=>a.day-b.day);
            const omitted = entries.length - points.length;
            return {key,points,omitted,connect:omitted === 0 && new Set(points.map(p=>p.day)).size === points.length};
        });
        const days = panels.flatMap(panel=>panel.points.map(p=>p.day));
        const domain = days.length ? days.reduce((d,day)=>({min:Math.min(d.min,day),max:Math.max(d.max,day)}),{min:days[0],max:days[0]}) : null;
        return {panels,domain,total:entries.length};
    }
    static coordinates(point, domain) {
        return {x:domain.max === domain.min ? 225 : 52 + (point.day-domain.min)/(domain.max-domain.min)*346,
            y:18 + (6-point.zscore)/12*120};
    }
    static html(entries, referenceVersion, ui) {
        const model = GrowthChart.build(entries,referenceVersion), e=value=>ui.esc(value), t=key=>ui.t(key);
        const iso = day=>new Date(day*86400000).toISOString().slice(0,10);
        const panelHTML = panel => {
            if (!panel.points.length) return `<details class="chart-tile" open><summary>${e(t(panel.key))}</summary><figure class="growth-chart"><figcaption class="sr-only">${e(t(panel.key))}</figcaption><p class="hint">${e(t('chartNoPoints'))}</p></figure></details>`;
            const points = panel.points.map(p=>({...p,...GrowthChart.coordinates(p,model.domain)}));
            const summary = t('chartCounts').replace('{count}',points.length).replace('{total}',model.total);
            const grid = [6,3,0,-3,-6].map(z=>{
                const y=GrowthChart.coordinates({day:model.domain.min,zscore:z},model.domain).y;
                return `<line x1="52" y1="${y}" x2="398" y2="${y}" class="chart-grid ${z===0?'chart-zero':''}"/><text x="42" y="${y+5}" text-anchor="end" class="chart-label">${e(ui.number(z,0))}</text>`;
            }).join('');
            const labels = model.domain.min===model.domain.max
                ? `<text x="225" y="166" text-anchor="middle" class="chart-label">${iso(model.domain.min)}</text>`
                : `<text x="52" y="166" text-anchor="start" class="chart-label">${iso(model.domain.min)}</text><text x="398" y="166" text-anchor="end" class="chart-label">${iso(model.domain.max)}</text>`;
            const line = panel.connect && points.length>1 ? `<polyline points="${points.map(p=>`${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')}" class="chart-series"/>` : '';
            const circles = points.map(p=>`<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="4.5" class="chart-point ${p.imported?'chart-imported':''}"><title>${e(ui.calendarDate(p.date))} : ${e(ui.number(p.zscore))}${p.imported?' · '+e(t('importedResult')):''}</title></circle>`).join('');
            return `<details class="chart-tile" open><summary>${e(t(panel.key))}</summary><figure class="growth-chart"><figcaption class="sr-only">${e(t(panel.key))}</figcaption><p class="hint">${e(summary)}</p><svg viewBox="0 0 420 180" role="img" aria-label="${e(t(panel.key)+' · '+summary)}">${grid}${labels}${line}${circles}</svg></figure></details>`;
        };
        const table = `<div class="table-scroll"><table><caption>${e(t('chartData'))}</caption><thead><tr><th scope="col">${e(t('measurementDate'))}</th>${model.panels.map(p=>`<th scope="col">${e(t(p.key))}</th>`).join('')}<th scope="col">${e(t('referenceVersion'))}</th></tr></thead><tbody>${[...entries].reverse().map(entry=>`<tr><th scope="row">${e(ui.calendarDate(entry.child.measurementDate))}</th>${model.panels.map(({key})=>`<td>${Number.isFinite(entry.result?.[key]?.zscore)?e(ui.number(entry.result[key].zscore)):'—'}${ui.percentileHTML?.(entry.result?.[key],entry.result)||''}${entry.result?.[key]?.flagged?`<br>${e(t('flagged'))}`:''}${entry.result?.[key]?.error?`<br>${e(t(entry.result[key].error))}`:''}</td>`).join('')}<td>${e(entry.result?.referenceVersion || 'unknown')}${entry.result?.imported?`<br>${e(t('imported'))}`:''}</td></tr>`).join('')}</tbody></table></div>`;
        return `<details class="growth-charts"><summary>${e(t('chartTitle'))}</summary><p class="hint">${e(t('chartHelp'))}</p><p class="meta">${e(referenceVersion)}</p><div class="chart-panels">${model.panels.map(panelHTML).join('')}</div><details><summary>${e(t('chartData'))}</summary>${table}</details></details>`;
    }
}
if (typeof module !== 'undefined' && module.exports) module.exports = {GrowthChart};
else window.GrowthChart = GrowthChart;
