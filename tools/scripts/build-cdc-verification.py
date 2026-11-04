"""Independent Decimal/libm numerical fixtures from pinned CDC CSV originals.

No execution of CDC SAS/R; no patient data. This checks the JS arithmetic,
interpolation, extended BMI and flags, not the clinical appropriateness of use.
"""
import csv
import hashlib
import json
import math
from decimal import Decimal as D, getcontext, ROUND_HALF_UP
from pathlib import Path
from statistics import NormalDist

getcontext().prec = 60
ROOT = Path(__file__).resolve().parents[2]
origin = json.loads((ROOT / 'tools/reference/additional-references.json').read_text(encoding='utf-8'))
files = {Path(s['file']).name: s for s in origin['files'] if s['file'].startswith('cdc/')}
tables = {}
for key, name in [('weightForAge', 'wtage.csv'), ('heightForAge', 'statage.csv'), ('bmiForAge', 'bmiagerev.csv')]:
    raw = (ROOT / 'tools/reference/cdc' / name).read_bytes()
    assert hashlib.sha256(raw).hexdigest() == files[name]['sha256']
    tables[key] = {'M': {}, 'F': {}}
    for row in csv.DictReader(raw.decode('utf-8-sig').splitlines()):
        if row['Sex'] not in ['1', '2'] or D(row['Agemos']) > 240:
            continue
        tables[key]['M' if row['Sex'] == '1' else 'F'][D(row['Agemos'])] = [D(row[k]) for k in ['L', 'M', 'S']]

def params(key, sex, age):
    table = tables[key][sex]
    if age in table:
        return table[age]
    low, high = max(x for x in table if x < age), min(x for x in table if x > age)
    return [a + (age-low)/(high-low)*(b-a) for a, b in zip(table[low], table[high])]

def measure(z, p):
    l, m, s = p
    return m * (s*z).exp() if l == 0 else m * ((1+l*s*z).ln()/l).exp()

def inverse_tail(q):
    # libm erfc, independent of the JS regularized-gamma implementation.
    low, high = 0.0, 40.0
    for _ in range(100):
        mid = (low+high)/2
        if math.erfc(mid/math.sqrt(2))/2 > q:
            low = mid
        else:
            high = mid
    return (low+high)/2

def expected(key, sex, age, value):
    p = params(key, sex, age)
    l, m, s = p
    raw = (value/m).ln()/s if l == 0 else (((value/m).ln()*l).exp()-1)/(l*s)
    modified = 2*(value-m)/(m-measure(D(-2), p) if value < m else measure(D(2), p)-m)
    bounds = {'weightForAge': [-5, 8], 'heightForAge': [-5, 4], 'bmiForAge': [-4, 8]}[key]
    answer = {'originalZscoreRaw': float(raw), 'modifiedZscore': float(modified), 'flagged': modified < bounds[0] or modified > bounds[1], 'method': 'CDC2000-LMS'}
    z = float(raw)
    tail = math.erfc(z/math.sqrt(2))/2
    if key == 'bmiForAge':
        p95 = measure(D(str(NormalDist().inv_cdf(0.95))), p)
        year = age/12
        sigma = (D('.3728')+D('.5196')*year-D('.0091')*year*year if sex == 'M' else D('.8334')+D('.3712')*year-D('.0011')*year*year).quantize(D('.00000001'), rounding=ROUND_HALF_UP)
        answer.update(p95=float(p95), sigma=float(sigma))
        if value > p95:
            tail = 0.1*math.erfc(float((value-p95)/sigma)/math.sqrt(2))/2
            z = inverse_tail(tail)
            answer['method'] = 'CDC2022-extended-BMI'
    percentile = 100*(1-tail) if z >= 0 else 50*math.erfc(-z/math.sqrt(2))
    answer.update(zscoreRaw=z, percentileRaw=percentile)
    return answer

cases = []
for key in tables:
    for sex in ['M', 'F']:
        for age in map(D, ['24', '24.25', '24.5', '50.5', '114.5', '184.5', '239.75']):
            for ratio in map(D, ['.4', '.7', '1', '1.2', '1.7', '2.2']):
                value = params(key, sex, age)[1]*ratio
                cases.append({'key': key, 'sex': sex, 'age': float(age), 'measure': float(value), 'expected': expected(key, sex, age, value)})
for sex, age, bmi in [('F', D('114.5'), D('21.2')), ('M', D('50.5'), D('22.6'))]:
    cases.append({'key': 'bmiForAge', 'sex': sex, 'age': float(age), 'measure': float(bmi), 'publishedCDCExample': True, 'expected': expected('bmiForAge', sex, age, bmi)})
normals = [{'z': z/8, 'survival': math.erfc((z/8)/math.sqrt(2))/2} for z in range(-80, 81)]
curves = []
for key in tables:
    for sex in ['M', 'F']:
        for age in map(D, ['24', '50.5', '114.5', '239.75']):
            p = params(key, sex, age)
            for z in [-2, 0, 2, 3, 5]:
                if key == 'bmiForAge' and z > NormalDist().inv_cdf(0.95):
                    p95 = measure(D(str(NormalDist().inv_cdf(0.95))), p)
                    year = age/12
                    sigma = (D('.3728')+D('.5196')*year-D('.0091')*year*year if sex == 'M' else D('.8334')+D('.3712')*year-D('.0011')*year*year).quantize(D('.00000001'), rounding=ROUND_HALF_UP)
                    q = math.erfc(z/math.sqrt(2))/2/0.1
                    value = p95 + sigma*D(str(NormalDist().inv_cdf(1-q)))
                elif 1+p[0]*p[2]*z > 0:
                    value = measure(D(z), p)
                else:
                    curves.append({'key': key, 'sex': sex, 'age': float(age), 'z': z, 'measure': None})
                    continue
                curves.append({'key': key, 'sex': sex, 'age': float(age), 'z': z, 'measure': float(value)})
output = {'format': 1, 'scope': 'Independent arithmetic oracle; CDC SAS/R not executed; not clinical validation.', 'sources': list(files.values()), 'fixtures': cases, 'normalTail': normals, 'referenceCurves': curves}
path = ROOT / 'tools/verification/cdc-decimal.json'
path.write_text(json.dumps(output, separators=(',', ':')) + '\n', encoding='utf-8', newline='\n')
print(json.dumps({'cases': len(cases), 'normalCases': len(normals), 'curveCases': len(curves), 'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}))
