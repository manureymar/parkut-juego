import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup, prune, weld, simplify, resample, textureCompress} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
import sharp from 'sharp';

const root=path.resolve(import.meta.dirname,'../..');
const source=path.resolve(process.argv[2]||path.join(root,'assets-originales/peatones/restaurados'));
const out=path.join(root,'nivel-01/web/assets/pedestrians');
const archive=path.join(root,'assets-originales/peatones');
await fs.mkdir(out,{recursive:true});await fs.mkdir(archive,{recursive:true});
const files=['woman+character+3d+model.glb','person+3d+model.glb','woman+3d+model (1).glb','female+model+3d+model.glb','female+human+3d+model.glb','woman+3d+model.glb','adult+human+3d+model.glb'];
const heights=[1.65,1.76,1.70,1.72,1.68,1.66,1.79];
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);await MeshoptSimplifier.ready;
const manifest=[],originals=[];
for(const [index,file] of files.entries()){
 const id='citizen-'+String(index+1).padStart(2,'0'),bytes=await fs.readFile(path.join(source,file));
 const packed=zlib.gzipSync(bytes,{level:9}),parts=[];
 for(let offset=0;offset<packed.length;offset+=2400000){const part=id+'.glb.gz.part'+String(parts.length+1).padStart(2,'0');await fs.writeFile(path.join(archive,part),packed.subarray(offset,offset+2400000));parts.push(part);}
 originals.push({id,file,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),encoding:'gzip',parts});
 const doc=await io.readBinary(bytes),nodes=doc.getRoot().listNodes(),hips=nodes.find(n=>/hips$/i.test(n.getName()));
 if(!hips||doc.getRoot().listSkins()[0]?.listJoints().length!==65)throw new Error('Unexpected rig '+file);
 const count=()=>doc.getRoot().listMeshes().flatMap(m=>m.listPrimitives()).reduce((s,p)=>s+(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3,0);
 const originalTriangles=count(),rest=hips.getTranslation();
 const clips=doc.getRoot().listAnimations().map(animation=>{
  const channel=animation.listChannels().find(c=>c.getTargetNode()===hips&&c.getTargetPath()==='translation');
  const sampler=channel?.getSampler(),times=Array.from(sampler?.getInput().getArray()||[0]),values=sampler?.getOutput().getArray();
  const duration=Math.max(...animation.listSamplers().map(s=>s.getInput().getArray().at(-1)));
  const name=animation.getName(),z=times.map((_,i)=>values?.[i*3+2]??0),distance=Math.max(0,z.at(-1)-z[0]);
  const locomotion=distance>.5;
  const loop=['walk','swagger'].includes(name);
  const category=name==='warm_up'?'exercise':name==='make_a_call_02'?'phone':name==='sob'?'emotion':locomotion?'travel':/wave|greet|agree/.test(name)?'greeting':'idle';
  // Preserve the source motion curve, including walk-and-stop and walking greetings.
  // Runtime locomotion consumes this distance once; the skeleton is animated in place.
  const motion=[];let last=0;
  for(let t=0;t<duration;t+=1/24){let hi=times.findIndex(x=>x>=t);if(hi<0)hi=times.length-1;const lo=Math.max(0,hi-1),f=(t-times[lo])/(times[hi]-times[lo]||1);last=Math.max(last,locomotion?(z[lo]+(z[hi]-z[lo])*f-z[0]):0);motion.push([+t.toFixed(6),+last.toFixed(6)]);}
  motion.push([duration,Math.max(last,locomotion?distance:0)]);
  return {name,duration,category,locomotion,loop,distance:motion.at(-1)[1],motion};
 });
 await doc.transform(dedup(),weld(),simplify({simplifier:MeshoptSimplifier,ratio:Math.min(1,8000/originalTriangles),error:.003}),resample({tolerance:1e-5}),textureCompress({encoder:sharp,targetFormat:'webp',resize:[768,768],quality:85}),prune());
 await io.write(path.join(out,id+'.glb'),doc);
 const entry={id,source:file,height:heights[index],restHips:rest,joints:65,originalTriangles,triangles:count(),bytes:(await fs.stat(path.join(out,id+'.glb'))).size,clips};manifest.push(entry);
 console.log(JSON.stringify({id,triangles:entry.triangles,bytes:entry.bytes,clips:clips.map(c=>({name:c.name,category:c.category,distance:c.distance}))}));
}
await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await fs.writeFile(path.join(archive,'manifest.json'),JSON.stringify(originals,null,2)+'\n');
await fs.writeFile(path.join(root,'docs/pedestrian-assets-audit.json'),JSON.stringify(manifest.map(({clips,...entry})=>({...entry,clips:clips.map(({motion,...clip})=>clip)})),null,2)+'\n');
