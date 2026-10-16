import fs from 'node:fs/promises';
import path from 'node:path';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup,weld,simplify,prune} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
await MeshoptSimplifier.ready;
const root=path.resolve(import.meta.dirname,'../..');
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
for(let i=1;i<=7;i++){
 const id=`roof-0${i}`,doc=await io.read(path.join(root,'nivel-01/web/assets',`${id}.glb`));
 for(const m of doc.getRoot().listMeshes())for(const p of m.listPrimitives()){p.setMaterial(null);for(const s of p.listSemantics())if(s!=='POSITION')p.setAttribute(s,null);}
 for(const e of doc.getRoot().listExtensionsUsed())e.dispose();
 await doc.transform(prune(),weld(),simplify({simplifier:MeshoptSimplifier,ratio:.035,error:.004}),dedup(),prune());
 await io.write(path.join(root,'nivel-01/web/assets',`${id}-collider.glb`),doc);
 console.log(id,doc.getRoot().listMeshes().flatMap(m=>m.listPrimitives()).map(p=>p.getIndices().getCount()/3));
}
