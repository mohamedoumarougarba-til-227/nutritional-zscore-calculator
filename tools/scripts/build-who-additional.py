"""Encode unmodified pinned WHO daily LMS tables for optional measurements."""
import csv
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
source = ROOT / 'tools/reference/who-additional'
provenance = json.loads((ROOT / 'tools/reference/additional-references.json').read_text(encoding='utf-8'))
files = {Path(item['file']).name: item for item in provenance['files']}
tables, sources = {}, []
for key, name, minimum in [('headCircumferenceForAge', 'hcanthro.txt', 0), ('armCircumferenceForAge', 'acanthro.txt', 91), ('tricepsForAge', 'tsanthro.txt', 91), ('subscapularForAge', 'ssanthro.txt', 91)]:
    raw = (source / name).read_bytes()
    origin = files[name]
    assert hashlib.sha256(raw).hexdigest() == origin['sha256'] and len(raw) == origin['bytes']
    table = {'M': {}, 'F': {}}
    for row in csv.DictReader(raw.decode('utf-8').splitlines(), delimiter='\t'):
        table['M' if row['sex'] == '1' else 'F'][row['age']] = [float(row[p]) for p in ('l', 'm', 's')]
    for sex in table:
        assert set(table[sex]) == {str(day) for day in range(minimum, 1827)}
    tables[key] = table
    sources.append({'file': name, 'url': origin['url'], 'sha256': origin['sha256'], 'bytes': len(raw)})
data = {'schemaVersion': 1, 'referenceVersion': 'WHO-child-additional-' + provenance['whoCommit'][:12], 'sourceCommit': provenance['whoCommit'], 'license': 'GPL-3.0; see LICENSE-anthro.txt', 'sources': sources, 'tables': tables}
target = ROOT / 'src/data/who-additional.json'
target.write_text(json.dumps(data, separators=(',', ':')), encoding='utf-8', newline='\n')
manifest = {'file': target.name, 'referenceVersion': data['referenceVersion'], 'sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'bytes': target.stat().st_size, 'sources': sources}
(target.parent / 'who-additional-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8', newline='\n')
print(json.dumps({'bytes': target.stat().st_size, 'tables': list(tables)}))
