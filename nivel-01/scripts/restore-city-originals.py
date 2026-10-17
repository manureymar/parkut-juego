from pathlib import Path
import gzip,hashlib,json,shutil
root=Path(__file__).resolve().parents[2]
base=root/'assets-originales/ciudad-modelos';out=base/'restaurados';out.mkdir(parents=True,exist_ok=True)
for item in json.loads((base/'manifest.json').read_text()):
 chunks=[]
 for part in item['parts']:
  data=(base/part['file']).read_bytes();assert hashlib.sha256(data).hexdigest()==part['sha256'];chunks.append(data)
 data=gzip.decompress(b''.join(chunks));assert hashlib.sha256(data).hexdigest()==item['sha256'];(out/item['original']).write_bytes(data)
idle=gzip.decompress((root/'assets-originales/pendientes/human+character+3d+model+reposo.glb.gz').read_bytes())
idle_manifest=json.loads((root/'assets-originales/pendientes/reposo.json').read_text())
assert hashlib.sha256(idle).hexdigest()==idle_manifest['sha256_original']
(out/'human+character+3d+model+reposo.glb').write_bytes(idle)
print('Originales recuperados y verificados en',out)
