/** Presentation of stored centiles only. Never round a finite tail to 0 or 100. */
class PercentileDisplay {
    static text(value, number = n => n.toFixed(1)) {
        const p = value?.percentile;
        if (!Number.isFinite(value?.zscore) || value.flagged || typeof p !== 'number' || !Number.isFinite(p) || p <= 0 || p >= 100) return null;
        if (p < 0.1) return '< ' + number(0.1);
        if (p > 99.9) return '> ' + number(99.9);
        return number(p);
    }
}
if (typeof module !== 'undefined' && module.exports) module.exports = {PercentileDisplay}; else window.PercentileDisplay = PercentileDisplay;
