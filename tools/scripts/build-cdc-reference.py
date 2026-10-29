"""Convert pinned CDC 2000 LMS CSVs; no download, dependency or clinical decision.

The CDC 2022 extended BMI method uses the published continuous-age sigma
equations, rather than a rounded monthly sigma table. Originals stay unchanged.
"""
import csv
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROVENANCE = json.loads((ROOT / 'tools/reference/additional-references.json').read_text(encoding='utf-8'))
originals = {Path(item['file']).name: item for item in PROVENANCE['files'] if item['file'].startswith('cdc/')}
tables, sources = {}, []
expected = {24.0, 240.0, *(month + 0.5 for month in range(24, 240))}
for key, name in [('weightForAge', 'wtage.csv'), ('heightForAge', 'statage.csv'), ('bmiForAge', 'bmiagerev.csv')]:
    raw = (ROOT / 'tools/reference/cdc' / name).read_bytes()
    item = originals[name]
    assert len(raw) == item['bytes'] and hashlib.sha256(raw).hexdigest() == item['sha256']
    table = {'M': {}, 'F': {}}
    ignored = []
    for row in csv.DictReader(raw.decode('utf-8-sig').splitlines()):
        if row['Sex'] == 'Sex':
            ignored.append('repeated CSV header')
            continue
        assert row['Sex'] in ['1', '2']
        age = float(row['Agemos'])
        if age > 240:
            assert name == 'bmiagerev.csv' and age == 240.5
            ignored.append('240.5-month BMI row outside the supported <240-month domain')
            continue
        sex = 'M' if row['Sex'] == '1' else 'F'
        index = str(int(age)) if age.is_integer() else str(age)
        assert index not in table[sex]
        table[sex][index] = [float(row[p]) for p in ('L', 'M', 'S')]
    for rows in table.values():
        assert {float(age) for age in rows} == expected
        assert all(p[1] > 0 and p[2] > 0 for p in rows.values())
    tables[key] = table
    sources.append({**item, 'ignoredRows': ignored})

identity = hashlib.sha256(''.join(s['sha256'] for s in sources).encode()).hexdigest()
data = {
    'schemaVersion': 1,
    'referenceVersion': 'CDC-2000-2022-' + identity[:12],
    'ageDomainMonths': [24, 240],
    'upperAgeExclusive': True,
    'sourceAttribution': 'Source: Centers for Disease Control and Prevention (CDC), National Center for Health Statistics.',
    'endorsement': 'Use of CDC materials does not imply endorsement by CDC, HHS or the United States Government of this application or its publisher.',
    'rightsSource': 'https://www.cdc.gov/Other/imagereuse.html',
    'methods': {
        'lms': 'https://www.cdc.gov/growthcharts/cdc-data-files.htm',
        'extendedBMI': 'https://www.cdc.gov/growthcharts/extended-bmi-data-files.htm',
        'agePositionAndFlags': 'https://www.cdc.gov/growth-chart-training/hcp/computer-programs/sas.html',
        'categories': 'https://www.cdc.gov/growth-chart-training/hcp/using-bmi/summary.html',
        'reviewedRCommit': '47a3a34897c27ee1bae80f7397b7cdb526822121',
        'sigmaPolynomialYears': {'M': [0.3728, 0.5196, -0.0091], 'F': [0.8334, 0.3712, -0.0011]},
        'sigmaRoundingDigits': 8,
        'bivModifiedZBounds': {'weightForAge': [-5, 8], 'heightForAge': [-5, 4], 'bmiForAge': [-4, 8]},
        'recumbentToStandingCm': -0.8,
    },
    'sources': sources,
    'tables': tables,
}
target = ROOT / 'src/data/cdc-growth.json'
target.write_text(json.dumps(data, separators=(',', ':')) + '\n', encoding='utf-8', newline='\n')
manifest = {'file': target.name, 'referenceVersion': data['referenceVersion'], 'bytes': target.stat().st_size,
            'sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'sources': sources,
            'status': 'Explicit US profile in application 5.5.0; offline data, separate reference categories and recorded visit context.'}
(target.parent / 'cdc-growth-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8', newline='\n')
print(json.dumps({'bytes': target.stat().st_size, 'referenceVersion': data['referenceVersion'], 'rowsPerSexAndIndicator': len(expected)}))
