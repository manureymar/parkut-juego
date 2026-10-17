import fs from 'node:fs/promises';import {NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';import {dedup,weld,simplify,textureCompress,prune} from '@gltf-transform/functions';import {MeshoptSimplifier} from 'meshoptimizer';import sharp from 'sharp';
await MeshoptSimplifier.ready;const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),report=[];
for(const [i,id] of ['roof-01','roof-04','roof-06'].entries()){
 const doc=await io.read('nivel-01/web/assets/'+id+'.glb');const count=()=>doc.getRoot().listMeshes().flatMap(m=>m.listPrimitives()).reduce((s,p)=>s+p.getIndices().getCount()/3,0),before=count();
 await doc.transform(dedup(),weld(),simplify({simplifier:MeshoptSimplifier,ratio:7000/before,error:.012}),textureCompress({encoder:sharp,targetFormat:'webp',resize:[512,512],quality:82}),prune());
 const target=`city-building-${i+1}`;await io.write(`nivel-01/web/assets/${target}.glb`,doc);report.push({source:id,target,triangles:count(),bytes:(await fs.stat(`nivel-01/web/assets/${target}.glb`)).size});console.log(report.at(-1));
}await fs.writeFile('docs/city-buildings-audit.json',JSON.stringify(report,null,2)+'\n');
