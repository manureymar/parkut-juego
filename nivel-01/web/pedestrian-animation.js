import * as T from 'three';

// Each citizen owns a mixer and skeleton. Geometry, textures and source clips are shared.
export class PedestrianAnimation {
 constructor(model,clips,profile){
  this.model=model;this.profile=profile;this.mixer=new T.AnimationMixer(model);this.actions=new Map();this.meshes=[];this.samples=[];this.vertex=new T.Vector3();this.current=null;this.previous=null;this.blend=1;
  let hips;model.traverse(n=>{if(n.isBone&&/hips$/i.test(n.name))hips=n;if(n.isSkinnedMesh)this.meshes.push(n);});
  const rest=hips.position.clone();
  for(const original of clips){
   const clip=original.clone(),meta=profile.clips.find(c=>c.name===clip.name);
   for(const track of clip.tracks)if(track.name===hips.name+'.position'){
    const x0=track.values[0],z0=track.values[2];
    for(let i=0;i<track.values.length;i+=3){track.values[i]=rest.x+T.MathUtils.clamp(track.values[i]-x0,-.12,.12);track.values[i+2]=rest.z+(meta.locomotion?0:T.MathUtils.clamp(track.values[i+2]-z0,-.12,.12));}
   }
   const action=this.mixer.clipAction(clip);action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.paused=true;this.actions.set(clip.name,action);
  }
  for(const mesh of this.meshes){
   const p=mesh.geometry.attributes.position,indices=mesh.geometry.attributes.skinIndex,weights=mesh.geometry.attributes.skinWeight,byBone=new Map(),ids=new Set();
   for(let i=0;i<p.count;i++)for(let k=0;k<4;k++){
    const bone=indices.getComponent(i,k);if(weights.getComponent(i,k)<.2||!/Foot|Toe/i.test(mesh.skeleton.bones[bone].name))continue;
    if(!byBone.has(bone))byBone.set(bone,[]);byBone.get(bone).push(i);
   }
   for(const candidates of byBone.values()){
    for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){let best=candidates[0];for(const i of candidates)if(p.getComponent(i,axis)*sign<p.getComponent(best,axis)*sign)best=i;ids.add(best);}
    for(let i=0;i<candidates.length;i+=Math.max(1,Math.floor(candidates.length/16)))ids.add(candidates[i]);
   }
   this.samples.push({mesh,ids:[...ids]});
  }
 }
 pose(name,time,dt=0,immediate=false){
  if(this.current!==name){
   if(this.previous&&this.previous!==this.current)this.actions.get(this.previous).stop();
   this.previous=this.current;this.current=name;this.blend=immediate?1:0;
   const action=this.actions.get(name);action.reset();action.paused=true;action.enabled=true;action.play();
  }
  this.blend=Math.min(1,this.blend+dt/.28);const weight=this.blend*this.blend*(3-2*this.blend);
  const current=this.actions.get(name);current.time=Math.min(time,current.getClip().duration-1e-6);current.setEffectiveWeight(this.previous?weight:1);
  if(this.previous){const old=this.actions.get(this.previous);old.setEffectiveWeight(1-weight);if(weight===1){old.stop();this.previous=null;}}
  this.mixer.update(0);this.placeOnGround();
 }
 placeOnGround(){
  this.model.position.y=0;(this.model.parent||this.model).updateMatrixWorld(true);let min=Infinity;
  for(const {mesh,ids} of this.samples){mesh.skeleton.update();for(const i of ids){mesh.getVertexPosition(i,this.vertex).applyMatrix4(mesh.matrixWorld);min=Math.min(min,this.vertex.y);}}
  const ground=this.model.parent?.getWorldPosition(this.vertex).y??0;
  this.model.position.y=ground-min+.018;this.model.updateMatrixWorld(true);
 }
 dispose(){this.mixer.stopAllAction();this.mixer.uncacheRoot(this.model);}
}
