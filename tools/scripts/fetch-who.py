"""Fetch a pinned WHO reference, preserve source bytes and record actual download size."""
import datetime, hashlib, json, pathlib, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
PIN = 'b776d8a12b1c97369c748b561159fd2ec4f4db58'
OUT = ROOT / '.local' / 'audit' / 'imports-who'
FILES = ['data-raw/growthstandards/' + f for f in ('weianthro.txt', 'lenanthro.txt', 'wfhanthro.txt', 'wflanthro.txt', 'bmianthro.txt')]
FILES += ['R/z-score-helper.R', 'R/z-score-weight-for-lenhei.R', 'R/z-score-length-for-age.R', 'R/z-score-weight-for-age.R', 'R/z-score.R', 'tests/testthat/test-zscore-weight-for-age.R', 'tests/testthat/test-zscore-length-for-age.R', 'tests/testthat/test-zscores.R', 'tests/testthat/test-zscore-weight-for-lenhei.R', 'LICENSE.md']
OUT.mkdir(parents=True, exist_ok=True)
manifest = []
for name in FILES:
    url = f'https://raw.githubusercontent.com/WorldHealthOrganization/anthro/{PIN}/{name}'
    target = OUT / name.replace('/', '__')
    downloaded = 0
    if target.exists():
        content = target.read_bytes()
    else:
        with urllib.request.urlopen(url, timeout=30) as response:
            content = response.read(2_000_001)
        if len(content) > 2_000_000:
            raise RuntimeError('Unexpected reference size')
        target.write_bytes(content)
        downloaded = len(content)
    manifest.append(dict(path=name, url=url, bytes=len(content), downloadedBytes=downloaded, sha256=hashlib.sha256(content).hexdigest()))
run = dict(commit=PIN, files=manifest, downloadedBytes=sum(r['downloadedBytes'] for r in manifest))
# Preserve previous evidence. A cache-only run is not a cumulative network measurement.
stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
(OUT / ('downloads-' + stamp + '.json')).write_text(json.dumps(run, indent=2), encoding='utf-8')
print(json.dumps(dict(commit=PIN, downloadedBytes=sum(r['downloadedBytes'] for r in manifest), files=len(manifest))))
