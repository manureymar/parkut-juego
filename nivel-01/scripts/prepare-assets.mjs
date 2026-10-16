import fs from 'node:fs/promises';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, simplify, textureCompress } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '../..');
const originals = path.join(root, 'assets-originales');
const out = path.join(root, 'nivel-01/web/assets');
await fs.mkdir(out, {recursive:true});
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const models = [
  ['human+character+3d+model.glb','runner'],
  ['concrete office building 3d model.glb','roof-01'],
  ['industrial rooftop 3d model.glb','roof-02'],
  ['industrial warehouse 3d model.glb','roof-03'],
  ['concrete building 3d model.glb','roof-04'],
  ['modern office building 3d model.glb','roof-05'],
  ['brick building 3d model.glb','roof-06'],
  ['office building 3d model.glb','roof-07'],
];
const audit=[];
for(const [input,id] of models){
  const doc=await io.read(path.join(originals,input));
  const count=()=>doc.getRoot().listMeshes().flatMap(m=>m.listPrimitives()).reduce((s,p)=>s+(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3,0);
  const before=count();
  if(id!=='runner') await doc.transform(dedup(),weld(),simplify({simplifier:MeshoptSimplifier,ratio:0.085,error:0.0015}));
  await doc.transform(textureCompress({encoder:sharp,targetFormat:'webp',resize:[2048,2048],quality:88}),prune());
  await io.write(path.join(out,`${id}.glb`),doc);
  const row={id,source:input,trianglesOriginal:before,triangles:count(),bytes:(await fs.stat(path.join(out,`${id}.glb`))).size,animations:doc.getRoot().listAnimations().map(a=>a.getName()),joints:doc.getRoot().listSkins().map(s=>s.listJoints().length)};
  audit.push(row); console.log(JSON.stringify(row));
}
await sharp(path.join(originals,'city-panorama.png')).webp({quality:94}).toFile(path.join(out,'city-panorama.webp'));
await fs.writeFile(path.join(root,'docs/assets-audit.json'),JSON.stringify(audit,null,2));

