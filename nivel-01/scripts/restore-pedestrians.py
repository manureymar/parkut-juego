"""Restore the seven untouched source GLBs, checking their original SHA-256."""
from pathlib import Path
import gzip, hashlib, json
archive=Path(__file__).resolve().parents[2]/'assets-originales'/'peatones'
destination=archive/'restaurados'
destination.mkdir(parents=True,exist_ok=True)
for item in json.loads((archive/'manifest.json').read_text()):
    data=gzip.decompress(b''.join((archive/name).read_bytes() for name in item['parts']))
    assert len(data)==item['bytes'] and hashlib.sha256(data).hexdigest()==item['sha256'], item['file']
    (destination/item['file']).write_bytes(data)
    print(item['file'])
