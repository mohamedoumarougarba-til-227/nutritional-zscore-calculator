"""Synthetic Decimal oracle for the prepared INTERGROWTH postnatal equations.

Python standard library only; does not execute GIGS R or the official app.
No clinical classification, patient data or copied official tables.
"""
from decimal import Decimal as D, getcontext
from pathlib import Path
import hashlib
import json

getcontext().prec = 60
ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'tools/reference/intergrowth'
provenance = json.loads((SOURCE / 'provenance.json').read_text(encoding='utf-8'))
for source in provenance['sources']:
    raw = (SOURCE / source['file']).read_bytes()
    if len(raw) != source['bytes'] or hashlib.sha256(raw).hexdigest() != source['sha256']:
        raise ValueError('Changed pinned GIGS source: ' + source['file'])

def parameters(key, sex, days):
    x = D(days) / 7
    male = D(int(sex == 'M'))
    if key == 'weightForAge':
        mu = D('2.591277')-D('.01155')*x.sqrt()-D('2201.705')/(x*x)+D('.0911639')*male
        sigma = D('.1470258')+D('505.92394')/(x*x)-D('140.0576')/(x*x)*x.ln()
    elif key == 'lengthForAge':
        mu = D('4.136244')-D('547.0018')/(x*x)+D('.0026066')*x+D('.0314961')*male
        sigma = D('.050489')+D('310.44761')/(x*x)-D('90.0742')/(x*x)*x.ln()
    else:
        mu = D('55.53617')-D('852.0059')/x+D('.7957903')*male
        sigma = D('3.0582292')+D('3910.05')/(x*x)-D('180.5625')/x
    return mu, sigma

cases = []
for key in ['weightForAge', 'lengthForAge', 'headCircumferenceForAge']:
    logarithmic = key != 'headCircumferenceForAge'
    for sex in ['M', 'F']:
        for days in [189, 190, 224, 281, 448]:
            mu, sigma = parameters(key, sex, days)
            for z in [-3, 0, 3]:
                linear = mu + sigma * z
                measure = linear.exp() if logarithmic else linear
                # Expected score corresponds to the serialized synthetic input.
                entered = D(str(float(measure)))
                score = ((entered.ln() if logarithmic else entered)-mu)/sigma
                cases.append(dict(key=key, sex=sex, pmaDays=days, z=z,
                                  measure=float(measure), expectedZ=float(score),
                                  mu=float(mu), sigma=float(sigma)))
output = dict(format=1, reference=provenance['reference'], precision=60,
              scope='Independent Decimal arithmetic; GIGS R and official app not executed; no clinical validation.',
              fixtures=cases)
target = ROOT / 'tools/verification/intergrowth-decimal.json'
target.write_text(json.dumps(output, indent=2, ensure_ascii=False)+'\n', encoding='utf-8', newline='\n')
print(json.dumps(dict(fixtures=len(cases), bytes=target.stat().st_size,
                      sha256=hashlib.sha256(target.read_bytes()).hexdigest())))
