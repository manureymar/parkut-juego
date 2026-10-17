import * as T from 'three';
import {clone} from './vendor/examples/jsm/utils/SkeletonUtils.js';
import {PedestrianAnimation} from './pedestrian-animation.js';
import {PedestrianSimulation,routePosition} from './pedestrian-simulation.js';

export async function createPedestrians(group,loader,landscape,progress=()=>{}){
 const response=await fetch('./assets/pedestrians/manifest.json');if(!response.ok)throw new Error('Pedestrian manifest');const profiles=await response.json(),assets=[];
 for(const [i,p] of profiles.entries()){const g=await loader.loadAsync('./assets/pedestrians/'+p.id+'.glb');assets.push(g);progress(i+1,profiles.length);}
 const seed=new URLSearchParams(location.search).has('test')?424242:crypto.getRandomValues(new Uint32Array(1))[0];
 const simulation=new PedestrianSimulation(profiles,landscape.routes,{seed,count:28}),actors=[];
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;const context=shadowCanvas.getContext('2d'),gradient=context.createRadialGradient(32,32,3,32,32,31);gradient.addColorStop(0,'rgba(20,32,28,.28)');gradient.addColorStop(1,'rgba(20,32,28,0)');context.fillStyle=gradient;context.fillRect(0,0,64,64);
 const shadowGeo=new T.PlaneGeometry(.85,.62),shadowMat=new T.MeshBasicMaterial({map:new T.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false});
 for(const person of simulation.people){
  const profile=profiles[person.model],asset=assets[person.model],pivot=new T.Group(),model=clone(asset.scene);pivot.name='Peatón '+person.id;group.add(pivot);pivot.add(model);
  const box=new T.Box3().setFromObject(model,true),sourceHeight=box.max.y-box.min.y;model.scale.setScalar(profile.height/sourceHeight);person.scale=profile.height/sourceHeight;
  model.traverse(n=>{if(n.isMesh){n.frustumCulled=false;n.castShadow=false;n.receiveShadow=true;n.material.envMapIntensity=.38;n.material.roughness=Math.max(.7,n.material.roughness);n.material.normalScale?.set(.45,.45);}});
  const animation=new PedestrianAnimation(model,asset.animations,profile),shadow=new T.Mesh(shadowGeo,shadowMat);shadow.rotation.x=-Math.PI/2;shadow.position.y=.007;pivot.add(shadow);
  // The supplied phone animation has no separate phone mesh. Attach a small prop to the hand.
  let phone;model.traverse(n=>{if(n.isBone&&/RightHand$/.test(n.name)){phone=new T.Mesh(new T.BoxGeometry(.035,.075,.007),new T.MeshStandardMaterial({color:0x19252b,roughness:.4,metalness:.15}));phone.name='Teléfono';phone.position.set(.012,.025,0);phone.visible=false;n.add(phone);}});
  actors.push({pivot,model,animation,phone,person,accumulator:1,lastRevision:-1});
 }
 let visible=0,quality='high';
 const update=(dt,anchor)=>{
  simulation.update(dt);visible=0;
  for(const actor of actors){const p=actor.person,pos=routePosition(simulation.routes[p.route],p.s),distance=Math.hypot(pos.x-anchor.x,pos.z-anchor.z);actor.pivot.visible=distance<(quality==='high'?145:95);actor.accumulator+=dt;
   if(!actor.pivot.visible)continue;visible++;actor.pivot.position.set(pos.x,landscape.pedestrianHeight(pos.x,pos.z),pos.z);
   const old=actor.pivot.rotation.y,delta=Math.atan2(Math.sin(pos.yaw-old),Math.cos(pos.yaw-old));actor.pivot.rotation.y+=delta*(dt===0?1:1-Math.exp(-dt*9));
   const interval=distance<55?1/(quality==='high'?30:20):1/12;
   if(actor.accumulator>=interval||p.revision!==actor.lastRevision){
    const waiting=p.blocked?profiles[p.model].clips.find(c=>c.name==='idle'||c.name==='wait'||c.name==='standing_relax'):null;
    actor.animation.pose(waiting?.name||p.clip.name,waiting?(simulation.time+p.id*.71)%waiting.duration:p.clipTime,actor.accumulator,actor.lastRevision<0);actor.accumulator=0;actor.lastRevision=p.revision;
   }
   if(actor.phone)actor.phone.visible=p.clip.category==='phone';
  }
 };
 update(0,new T.Vector3());
 return {update,simulation,actors,setQuality:q=>{quality=q;},get state(){return {total:simulation.people.length,visible,models:profiles.length,sourceAnimations:profiles.reduce((n,p)=>n+p.clips.length,0),activities:[...new Set(simulation.people.map(p=>p.clip.name))]};},debug:()=>simulation.snapshot()};
}
