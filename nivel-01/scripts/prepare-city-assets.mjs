import fs from 'node:fs/promises';
import path from 'node:path';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup,prune,weld,simplify,textureCompress} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
import sharp from 'sharp';

const root=path.resolve(import.meta.dirname,'../..');
const source=path.resolve(process.argv.slice(2).find(a=>!a.startsWith('--'))||path.join(root,'assets-originales/ciudad-modelos/restaurados'));
const out=path.join(root,'nivel-01/web/assets');
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);await MeshoptSimplifier.ready;
const models=[
 ['street road segment 3d model.glb','city-road',18000,1024],
 ['street intersection 3d model.glb','city-intersection',20000,1024],
 ['red car 3d model.glb','traffic-compact',4200,512],
 ['yellow taxi car 3d model.glb','traffic-taxi',4200,512],
 ['blue pickup truck 3d model.glb','traffic-pickup',4800,512],
 ['white cargo van 3d model.glb','traffic-van',4200,512],
];
const report=[];
for(const [file,id,target,textureSize] of (process.argv.includes('--animations-only')?[]:models)){
 const doc=await io.read(path.join(source,file));
 const count=()=>doc.getRoot().listMeshes().flatMap(m=>m.listPrimitives()).reduce((s,p)=>s+(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3,0);
 const original=count();
 await doc.transform(dedup(),weld(),simplify({simplifier:MeshoptSimplifier,ratio:target/original,error:.008}),textureCompress({encoder:sharp,targetFormat:'webp',resize:[textureSize,textureSize],quality:84}),prune());
 await io.write(path.join(out,id+'.glb'),doc);
 const result={file,id,originalTriangles:original,triangles:count(),textureSize,bytes:(await fs.stat(path.join(out,id+'.glb'))).size};report.push(result);console.log(JSON.stringify(result));
}
// Transfer only the supplied animation channels onto the existing identical rig.
// This retains the original character mesh/material and all previous maneuvers.
const runner=await io.read(path.join(out,'runner.glb'));
const nodes=new Map(runner.getRoot().listNodes().map(n=>[n.getName(),n]));
const buffer=runner.getRoot().listBuffers()[0];
for(const [file,name] of [['human+character+3d+model+reposo.glb','idle'],['human+character+3d+model+salto+parcourt.glb','jump']]){
 const input=await io.read(path.join(source,file)),clip=input.getRoot().listAnimations()[0];
 for(const old of runner.getRoot().listAnimations().filter(a=>a.getName()===name))old.dispose();
 const animation=runner.createAnimation(name),accessors=new Map(),samplers=new Map();
 const accessor=a=>{if(!accessors.has(a))accessors.set(a,runner.createAccessor().setType(a.getType()).setArray(a.getArray().slice()).setNormalized(a.getNormalized()).setBuffer(buffer));return accessors.get(a);};
 for(const channel of clip.listChannels()){
  const target=nodes.get(channel.getTargetNode().getName());if(!target)throw new Error('Missing bone '+channel.getTargetNode().getName());
  // Verify identical rest transforms before sharing the channel values.
  for(const key of ['getTranslation','getRotation','getScale'])if(target[key]().some((v,i)=>Math.abs(v-channel.getTargetNode()[key]()[i])>1e-4))throw new Error('Incompatible bind pose '+target.getName());
  const s=channel.getSampler();if(!samplers.has(s)){const next=runner.createAnimationSampler().setInput(accessor(s.getInput())).setOutput(accessor(s.getOutput())).setInterpolation(s.getInterpolation());samplers.set(s,next);animation.addSampler(next);}
  animation.addChannel(runner.createAnimationChannel().setTargetNode(target).setTargetPath(channel.getTargetPath()).setSampler(samplers.get(s)));
 }
 report.push({file,id:name,channels:animation.listChannels().length});console.log('Imported',name,animation.listChannels().length,'channels');
}
await runner.transform(dedup(),prune());await io.write(path.join(out,'runner.glb'),runner);
const auditPath=path.join(root,'docs/city-assets-audit.json');
if(process.argv.includes('--animations-only')){const old=JSON.parse(await fs.readFile(auditPath));report.unshift(...old.filter(a=>a.triangles));}
await fs.writeFile(auditPath,JSON.stringify(report,null,2)+'\n');
