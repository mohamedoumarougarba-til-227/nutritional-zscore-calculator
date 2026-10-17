"""Convert pinned, unmodified WHO TSV reference tables; no interpolation or synthetic data."""
import csv, hashlib, json, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'tools/reference/who'
commit = 'b776d8a12b1c97369c748b561159fd2ec4f4db58'
tables, origins = {}, []
for key, filename, axis in [('weightForAge', 'weianthro.txt', 'age'), ('heightForAge', 'lenanthro.txt', 'age'), ('weightForLength', 'wflanthro.txt', 'length'), ('weightForHeight', 'wfhanthro.txt', 'height')]:
    path = SOURCE / ('data-raw__growthstandards__' + filename)
    rows = list(csv.DictReader(path.read_text().splitlines(), delimiter='\t'))
    table = {'M': {}, 'F': {}}
    for row in rows:
        table['M' if row['sex'] == '1' else 'F'][str(float(row[axis])).removesuffix('.0')] = [float(row[p]) for p in ('l', 'm', 's')]
    tables[key] = table
    origins.append({'file': filename, 'url': f'https://raw.githubusercontent.com/WorldHealthOrganization/anthro/{commit}/data-raw/growthstandards/{filename}', 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'bytes': path.stat().st_size})
data = {'schemaVersion': 1, 'referenceVersion': 'WHO-2006-anthro-' + commit[:12], 'sourceCommit': commit, 'sources': origins, 'license': 'GPL-3.0; see LICENSE-anthro.txt for upstream files', 'tables': tables}
target = ROOT / 'src/data/who-official.json'
target.write_text(json.dumps(data, separators=(',', ':')), encoding='utf-8')
(ROOT / 'src/data/LICENSE-anthro.txt').write_bytes((SOURCE / 'LICENSE.md').read_bytes())
manifest = {'file': 'who-official.json', 'sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'bytes': target.stat().st_size, 'referenceVersion': data['referenceVersion'], 'sources': origins}
(ROOT / 'src/data/who-manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print(json.dumps({'generatedBytes': target.stat().st_size, 'rawSourceBytes': sum(x['bytes'] for x in origins), 'rows': {k: {s: len(v[s]) for s in v} for k, v in tables.items()}}))
