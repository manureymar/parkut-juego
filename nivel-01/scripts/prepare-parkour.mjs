import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup,prune,weld,simplify,resample,textureCompress,getBounds,mergeDocuments,unpartition} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
import sharp from 'sharp';
const root=path.resolve(import.meta.dirname,'../..'),source=path.resolve(process.argv[2]||path.join(root,'assets-originales/parkour/restaurados')),out=path.join(root,'nivel-01/web/assets/parkour');
await fs.mkdir(out,{recursive:true});await MeshoptSimplifier.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),audit=[];
const files=[['barrier','concrete barrier 3d model.glb'],['monkey-bars','industrial metal frame 3d model.glb'],['platform','industrial platform 3d model.glb'],['rope-net','obstacle rope net 3d model.glb'],['walkway','industrial metal walkway 3d model.glb'],['pole','metal post 3d model.glb'],['pipe-rail','industrial pipe railing 3d model.glb'],['ramp','loading ramp 3d model.glb']];
const count=d=>d.getRoot().listMeshes().flatMap(m=>m.listPrimitives()).reduce((s,p)=>s+(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3,0);
for(const [id,file] of files){
 const doc=await io.read(path.join(source,file)),before=count(doc),bounds=getBounds(doc.getRoot().listScenes()[0]);
 if(process.argv.includes('--reuse')){const saved=await io.read(path.join(out,id+'.glb'));audit.push({id,source:file,originalTriangles:before,triangles:count(saved),bounds,bytes:(await fs.stat(path.join(out,id+'.glb'))).size});continue;}
 for(const e of doc.getRoot().listExtensionsUsed())if(e.extensionName==='KHR_materials_volume')e.dispose();
 await doc.transform(dedup(),weld(),simplify({simplifier:MeshoptSimplifier,ratio:18000/before,error:.002}),textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],quality:88}),prune());
 await io.write(path.join(out,id+'.glb'),doc);
 audit.push({id,source:file,originalTriangles:before,triangles:count(doc),bounds,bytes:(await fs.stat(path.join(out,id+'.glb'))).size});console.log(JSON.stringify(audit.at(-1)));
}
for(const {id} of audit){
 const doc=await io.read(path.join(out,id+'.glb'));
 for(const m of doc.getRoot().listMeshes())for(const p of m.listPrimitives()){p.setMaterial(null);for(const semantic of p.listSemantics())if(semantic!=='POSITION')p.setAttribute(semantic,null);}
 for(const e of doc.getRoot().listExtensionsUsed())e.dispose();
 await doc.transform(prune(),weld(),simplify({simplifier:MeshoptSimplifier,ratio:.08,error:.006}),dedup(),prune());await io.write(path.join(out,id+'-collider.glb'),doc);
}
const sourceFile='human+character+3d+model (1).glb',newRig=await io.read(path.join(source,sourceFile)),runnerPath=path.join(root,'nivel-01/web/assets/runner.glb'),runner=await io.read(runnerPath);
const existing=runner.getRoot().listNodes(),byName=new Map(existing.map(n=>[n.getName(),n]));
const aliases=['pole_slide','ledge_shimmy','monkey_bar','ledge_grab'];
const boneDifferences=[];
for(const n of newRig.getRoot().listSkins()[0].listJoints()){
 const target=byName.get(n.getName());if(!target)throw Error('Missing bone '+n.getName());
 for(const property of ['Translation','Rotation','Scale'])if(n['get'+property]().some((v,i)=>Math.abs(v-target['get'+property]()[i])>1e-5))boneDifferences.push(n.getName()+':'+property);
}
if(boneDifferences.length)throw Error('Rig needs retargeting: '+boneDifferences.join(','));
const mapping=mergeDocuments(runner,newRig),newClips=newRig.getRoot().listAnimations().map((a,i)=>({source:a.getName(),name:aliases[i],duration:Math.max(...a.listSamplers().map(s=>s.getInput().getArray().at(-1)))}));
for(const [index,a] of newRig.getRoot().listAnimations().entries()){
 const clip=mapping.get(a);clip.setName(aliases[index]);for(const c of clip.listChannels())c.setTargetNode(byName.get(c.getTargetNode().getName()));
}
for(const s of newRig.getRoot().listScenes())mapping.get(s).dispose();
for(const n of newRig.getRoot().listNodes())mapping.get(n).dispose();
await runner.transform(prune(),resample({tolerance:1e-5}),unpartition());
await io.write(path.join(out,'runner-traversal.glb'),runner);
await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(audit,null,2)+'\n');
const hashes=await Promise.all(['human+character+3d+model (1).glb','human+character+3d+model (1)(1).glb'].map(async file=>({file,sha256:crypto.createHash('sha256').update(await fs.readFile(path.join(source,file))).digest('hex')})));
await fs.writeFile(path.join(root,'docs/parkour-assets-audit.json'),JSON.stringify({objects:audit,characters:hashes,duplicatePacks:hashes[0].sha256===hashes[1].sha256,newClips,boneDifferences,allClips:runner.getRoot().listAnimations().map(a=>a.getName()),missingRequestedClip:'Parkour Jump',jumpFallback:'Existing approved jump retained; jump_down and dive will not be selected.'},null,2)+'\n');
console.log('Merged runner:',newClips);
