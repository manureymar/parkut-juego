from pathlib import Path
import gzip, hashlib, json

root = Path(__file__).resolve().parents[2]
archive = root / 'assets-originales/parkour'
target = archive / 'restaurados'
target.mkdir(exist_ok=True)
for item in json.loads((archive / 'manifest.json').read_text()):
    packed = b''.join((archive / part).read_bytes() for part in item['parts'])
    data = gzip.decompress(packed)
    assert hashlib.sha256(data).hexdigest() == item['sha256'], item['file']
    (target / item['file']).write_bytes(data)
    print(item['file'], len(data), 'SHA-256 OK')
