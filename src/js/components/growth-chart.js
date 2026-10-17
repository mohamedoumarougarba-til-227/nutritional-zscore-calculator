/** Historical plots of stored Z-scores. No recalculation, interpolation or patient transmission. */
class GrowthChart {
    static build(entries, referenceVersion) {
        const dated = entries.map(entry => {
            let day = null;
            try { day = ClinicalEngine.dateDays(entry.child.measurementDate); } catch (_) { /* Unknown dates stay in the table. */ }
            return {entry,day};
        });
        const panels = ['weightForAge','heightForAge','weightForHeight'].map(key => {
            const points = dated.filter(({entry,day}) => {
                const r = entry.result, v = r?.[key];
                return day !== null && r?.schemaVersion === 2 && r.referenceVersion === referenceVersion
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
            if (!panel.points.length) return `<figure class="growth-chart"><figcaption>${e(t(panel.key))}</figcaption><p class="hint">${e(t('chartNoPoints'))}</p></figure>`;
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
            return `<figure class="growth-chart"><figcaption>${e(t(panel.key))}</figcaption><p class="hint">${e(summary)}</p><svg viewBox="0 0 420 180" role="img" aria-label="${e(t(panel.key)+' · '+summary)}">${grid}${labels}${line}${circles}</svg></figure>`;
        };
        const table = `<div class="table-scroll"><table><caption>${e(t('chartData'))}</caption><thead><tr><th scope="col">${e(t('measurementDate'))}</th>${model.panels.map(p=>`<th scope="col">${e(t(p.key))}</th>`).join('')}<th scope="col">${e(t('referenceVersion'))}</th></tr></thead><tbody>${[...entries].reverse().map(entry=>`<tr><th scope="row">${e(ui.calendarDate(entry.child.measurementDate))}</th>${model.panels.map(({key})=>`<td>${Number.isFinite(entry.result?.[key]?.zscore)?e(ui.number(entry.result[key].zscore)):'—'}${entry.result?.[key]?.flagged?`<br>${e(t('flagged'))}`:''}${entry.result?.[key]?.error?`<br>${e(t(entry.result[key].error))}`:''}</td>`).join('')}<td>${e(entry.result?.referenceVersion || 'legacy-unverified')}${entry.result?.imported?`<br>${e(t('imported'))}`:''}</td></tr>`).join('')}</tbody></table></div>`;
        return `<details class="growth-charts"><summary>${e(t('chartTitle'))}</summary><p class="hint">${e(t('chartHelp'))}</p><p class="meta">${e(referenceVersion)}</p>${model.panels.map(panelHTML).join('')}<details><summary>${e(t('chartData'))}</summary>${table}</details></details>`;
    }
}
if (typeof module !== 'undefined' && module.exports) module.exports = {GrowthChart};
else window.GrowthChart = GrowthChart;
