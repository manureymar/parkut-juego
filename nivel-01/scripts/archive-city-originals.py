"""Lossless, chunked archive of the supplied city models and new jump."""
from pathlib import Path
import gzip,hashlib,json,sys
root=Path(__file__).resolve().parents[2]
source=Path(sys.argv[1])
out=root/'assets-originales/ciudad-modelos';out.mkdir(parents=True,exist_ok=True)
names=['street road segment 3d model.glb','street intersection 3d model.glb','red car 3d model.glb','yellow taxi car 3d model.glb','blue pickup truck 3d model.glb','white cargo van 3d model.glb','human+character+3d+model+salto+parcourt.glb']
manifest=[]
for i,name in enumerate(names):
 data=(source/name).read_bytes();compressed=gzip.compress(data,compresslevel=6,mtime=0);parts=[]
 for j,start in enumerate(range(0,len(compressed),8*1024*1024)):
  part=f'{i+1:02d}.glb.gz.part{j+1:02d}';raw=compressed[start:start+8*1024*1024];(out/part).write_bytes(raw);parts.append({'file':part,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
 manifest.append({'original':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'gzip_bytes':len(compressed),'parts':parts});print(name,len(compressed),'bytes compressed',flush=True)
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
