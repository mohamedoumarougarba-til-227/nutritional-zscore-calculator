"""Independent Decimal evaluation of published WHO LMS equations, not an R oracle."""
from decimal import Decimal, localcontext
from pathlib import Path
import csv
import json
import hashlib

ROOT = Path(__file__).resolve().parents[2]
specs = [('headCircumferenceForAge','hcanthro.txt',25,64,1,False),('armCircumferenceForAge','acanthro.txt',50,400,10,True),('tricepsForAge','tsanthro.txt',1.8,40,1,True),('subscapularForAge','ssanthro.txt',1.8,40,1,True)]
fixtures=[]
with localcontext() as ctx:
    ctx.prec=60
    for key,name,minimum,maximum,scale,adjust in specs:
        rows=csv.DictReader((ROOT/'tools/reference/who-additional'/name).read_text().splitlines(),delimiter='\t')
        for row in rows:
            if int(row['age']) not in [0,90,91,92,182,365,730,731,1000,1500,1826]:continue
            l,m,s=[Decimal(row[k]) for k in ['l','m','s']]
            def sd(z):
                value=1+l*s*z
                return m*(value.ln()/l).exp() if l else m*(s*z).exp()
            for target in ['-7','-5.1','-3.1','-3','-2.001','-2','0','2','2.001','3','3.1','5.1','7']:
                z=Decimal(target)
                if l and 1+l*s*z<=0:continue
                measure=(sd(z)*scale).quantize(Decimal('0.00000001'))
                if not Decimal(str(minimum))<=measure<=Decimal(str(maximum)):continue
                y=measure/scale
                actual=((l*(y/m).ln()).exp()-1)/(l*s) if l else (y/m).ln()/s
                if adjust and actual>3:actual=3+(y-sd(3))/(sd(3)-sd(2))
                if adjust and actual<-3:actual=-3+(y-sd(-3))/(sd(-2)-sd(-3))
                fixtures.append({'key':key,'sex':'M' if row['sex']=='1' else 'F','day':int(row['age']),'measure':float(measure),'expectedRaw':float(actual)})
data={'method':'Python Decimal 60-digit evaluation of published WHO LMS equations, read directly from original TSV; not execution of WHO R software.','fixtures':fixtures}
target=ROOT/'tools/verification/who-additional-decimal.json'
target.write_text(json.dumps(data,separators=(',',':'))+'\n',encoding='utf-8',newline='\n')
p=ROOT/'tools/verification/provenance.json';provenance=json.loads(p.read_text(encoding='utf-8'))
provenance['expectedAdditionalDecimalCases']=len(fixtures)
provenance['additionalMethod']=data['method']
provenance['files']=[f for f in provenance['files'] if f['file']!=target.name]+[{'file':target.name,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}]
p.write_text(json.dumps(provenance,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps({'cases':len(fixtures),'bytes':target.stat().st_size}))
