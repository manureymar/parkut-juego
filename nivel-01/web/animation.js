import * as THREE from 'three';
export class RunnerAnimation {
 constructor(model,clips){
  this.model=model;this.mixer=new THREE.AnimationMixer(model);this.actions={};this.current=null;this.time=0;this.airTime=0;this.used=new Set();this.meshes=[];this.samples=[];this.soleClearance=0;
  let hips;model.traverse(n=>{if(n.isBone&&n.name.toLowerCase().endsWith('hips'))hips=n;if(n.isSkinnedMesh)this.meshes.push(n);});this.hips=hips;this.rest=hips.position.clone();
  for(const original of clips){const clip=original.clone();for(const t of clip.tracks)if(t.name===`${hips.name}.position`){for(let i=0;i<t.values.length;i+=3){t.values[i]=this.rest.x;t.values[i+1]=this.rest.y;t.values[i+2]=this.rest.z;}}this.actions[clip.name]=this.mixer.clipAction(clip);}
  // The final standing pose is present in jump_down; the supplied walk starts
  // mid-stride, so freezing walk made an unstable-looking one-foot idle.
  const source=this.actions.jump_down.getClip(),idle=source.clone();idle.name='idle';idle.duration=4;
  idle.tracks=source.tracks.map(t=>{const c=t.clone(),n=t.getValueSize(),v=Array.from(t.createInterpolant().evaluate(3.60));c.times=new Float32Array([0,4]);c.values=new Float32Array([...v,...v]);return c;});this.actions.idle=this.mixer.clipAction(idle);
  // Skin-space support vertices include all shoes and extremities of each
  // weighted bone, so support also works on hands/back during the supplied roll.
  for(const mesh of this.meshes){const pos=mesh.geometry.attributes.position,skin=mesh.geometry.attributes.skinIndex,weights=mesh.geometry.attributes.skinWeight,ids=new Set(),extremes=new Map();
   for(let i=0;i<pos.count;i++){
    if(i%Math.max(1,Math.floor(pos.count/320))===0)ids.add(i);
    for(let j=0;j<4;j++){const bi=skin.getComponent(i,j),w=weights.getComponent(i,j);if(w<.25)continue;
     if(/foot|toe/i.test(mesh.skeleton.bones[bi].name))ids.add(i);
     let e=extremes.get(bi);if(!e){e=Array.from({length:6},()=>({v:Infinity,i}));extremes.set(bi,e);}
     for(let axis=0;axis<3;axis++){const v=pos.getComponent(i,axis);for(const sign of [-1,1]){const k=axis*2+(sign===1?1:0);if(v*sign<e[k].v)e[k]={v:v*sign,i};}}
    }
   }
   for(const e of extremes.values())for(const item of e)ids.add(item.i);this.samples.push({mesh,ids:[...ids]});
  }
  this.vertex=new THREE.Vector3();this.play('idle',0);this.update(0,{speed:0,grounded:true});
 }
 play(name,fade=.13){const a=this.actions[name];if(!a||this.current===name)return;a.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).setLoop(THREE.LoopRepeat,Infinity);a.paused=false;a.play();if(this.current)this.actions[this.current].fadeOut(fade);a.fadeIn(fade);this.current=name;this.used.add(name);}
 update(dt,{speed=0,grounded=true,stairs=false,verticalSpeed=0,action=null}){
  this.time+=dt;this.airTime=grounded?0:this.airTime+dt;let name,manual=null;
  if(action?.mode==='ladder'){name='subir escalera recta hacia arriba';manual=1.15+(action.phase*1.15)%3.2;}
  else if(action?.mode==='climb'){name='climb';manual=.35+Math.min(1,action.progress)*2.95;}
  else if(action?.mode==='roll'){name='dive';manual=1.16+Math.min(1,action.progress)*1.52;}
  else if(!grounded&&this.airTime>.04){name='jump_down';manual=verticalSpeed>1?Math.min(1.55,.95+this.airTime*1.4):1.72;}
  else if(speed>.18){name=stairs?'subir escalera':speed<2.6?'walk':'run';}
  else name='idle';
  this.play(name,action?.mode==='roll' ? .065 : .14);const a=this.actions[name];
  a.paused=manual!==null;
  if(manual!==null)a.time=manual;else a.timeScale=name==='run'?Math.max(.7,speed/4.45):name==='walk'?Math.max(.45,speed/1.25):name==='subir escalera'?Math.max(.8,speed/1.5):1;
  this.mixer.update(dt);
  // Stop finished fades; inactive clips must not keep modifying the rig.
  for(const [key,old] of Object.entries(this.actions))if(key!==name&&old.isRunning()&&old.getEffectiveWeight()<.0001)old.stop();
  this.placeOnSupport();
 }
 placeOnSupport(){
  this.model.position.y=0;(this.model.parent||this.model).updateMatrixWorld(true);let min=Infinity;
  for(const {mesh,ids} of this.samples){mesh.skeleton.update();for(const i of ids){mesh.getVertexPosition(i,this.vertex).applyMatrix4(mesh.matrixWorld);min=Math.min(min,this.vertex.y);}}
  const base=this.model.parent?.getWorldPosition(this.vertex).y??0;
  this.model.position.y=base-min+.018;this.soleClearance=.018;(this.model.parent||this.model).updateMatrixWorld(true);
 }
}
