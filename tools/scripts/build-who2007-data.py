"""Rebuild pinned WHO 2007 data using only the Python standard library."""
from pathlib import Path
import csv,json,hashlib,math
root=Path(__file__).resolve().parents[2];raw=root/'tools/reference/who2007';meta=json.loads((raw/'downloads.json').read_text(encoding='utf-8'));sources=[];tables={}
for item in meta['files']:
 b=(raw/item['localFile']).read_bytes()
 if len(b)!=item['bytes'] or hashlib.sha256(b).hexdigest()!=item['sha256']:raise ValueError('Changed pinned source '+item['localFile'])
for key,name,maximum in [('weightForAge','wfawho2007.txt',121),('heightForAge','hfawho2007.txt',229),('bmiForAge','bfawho2007.txt',229)]:
 item=next(x for x in meta['files'] if x['localFile']==name);sources.append(item)
 with (raw/name).open(newline='') as f:rows=list(csv.DictReader(f,delimiter='\t'))
 table={'M':{},'F':{}}
 for row in rows:
  if row['sex'] not in ['1','2']:raise ValueError('Unknown sex')
  sex='M' if row['sex']=='1' else 'F';age=int(row['age']);p=[float(row[k]) for k in ['l','m','s']]
  if not all(math.isfinite(v) for v in p) or p[1]<=0 or p[2]<=0 or str(age) in table[sex]:raise ValueError('Invalid LMS')
  table[sex][str(age)]=p
 for sex in table:
  if set(table[sex])!={str(a) for a in range(60,maximum+1)} or table[sex][str(maximum)]!=table[sex][str(maximum-1)]:raise ValueError('Invalid domain')
 tables[key]=table
data={'schemaVersion':1,'referenceVersion':'WHO-2007-anthroplus-'+meta['commit'][:12],'sourceCommit':meta['commit'],'ageInMonths':{'minimum':60,'heightAndBmiMaximumExclusive':229,'weightMaximumExclusive':121},'tables':tables}
b=(json.dumps(data,separators=(',',':'))+'\n').encode();(root/'src/data/who-2007.json').write_bytes(b)
license=next(x for x in meta['files'] if x['localFile']=='LICENSE.md')
manifest={'referenceVersion':data['referenceVersion'],'sourceCommit':meta['commit'],'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'sources':sources,'license':license}
(root/'src/data/who-2007-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps({'reference':data['referenceVersion'],'bytes':len(b),'sha256':manifest['sha256']}))
