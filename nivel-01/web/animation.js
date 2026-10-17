import * as THREE from 'three';
export class RunnerAnimation {
 constructor(model,clips){
  this.model=model;this.mixer=new THREE.AnimationMixer(model);this.actions={};this.current=null;this.time=0;this.airTime=0;this.used=new Set();this.meshes=[];this.samples=[];this.soleClearance=0;this.wasGrounded=true;this.normalJump=false;this.landingTime=0;this.ikErrors=[];this.bones={};this.bindRotations={};
  let hips;model.traverse(n=>{if(n.isBone){this.bones[n.name.replace(/^mixamorig:?/,'')]=n;this.bindRotations[n.name.replace(/^mixamorig:?/,'')]=n.quaternion.clone();if(n.name.toLowerCase().endsWith('hips'))hips=n;}if(n.isSkinnedMesh)this.meshes.push(n);});this.hips=hips;this.rest=hips.position.clone();
  for(const original of clips){const clip=original.clone();for(const t of clip.tracks)if(t.name===`${hips.name}.position`){for(let i=0;i<t.values.length;i+=3){t.values[i]=this.rest.x;t.values[i+1]=this.rest.y;t.values[i+2]=this.rest.z;}}this.actions[clip.name]=this.mixer.clipAction(clip);}
  // The final standing pose is present in jump_down; the supplied walk starts
  // mid-stride, so freezing walk made an unstable-looking one-foot idle.
  if(!this.actions.idle){const source=this.actions.jump_down.getClip(),idle=source.clone();idle.name='idle';idle.duration=4;
  idle.tracks=source.tracks.map(t=>{const c=t.clone(),v=Array.from(t.createInterpolant().evaluate(3.60));c.times=new Float32Array([0,4]);c.values=new Float32Array([...v,...v]);return c;});this.actions.idle=this.mixer.clipAction(idle);}
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
  this.model.rotation.set(0,0,0);
  this.time+=dt;if(this.wasGrounded&&!grounded&&!action)this.normalJump=verticalSpeed>1;
  if(!this.wasGrounded&&grounded&&this.normalJump&&!action)this.landingTime=.20;
  this.wasGrounded=grounded;this.airTime=grounded?0:this.airTime+dt;this.landingTime=Math.max(0,this.landingTime-dt);let name,manual=null;
  if(action?.mode==='pole'){name='pole_slide';manual=1.45+Math.sin(action.phase*2)*.08;}
  else if(action?.mode==='monkey'){name='monkey_bar';manual=1.1+(action.phase%2.8);}
  else if(action?.mode==='ledge'){name='ledge_shimmy';manual=1.25+(action.phase%2.1);}
  else if(action?.mode==='net'){name='subir escalera recta hacia arriba';manual=1.15+(action.phase*1.15)%3.2;}
  else if(action?.mode==='wall'){name='run';manual=(action.phase*1.5)%this.actions.run.getClip().duration;}
  else if(action?.mode==='flip'){name='jump';manual=1.85;}
  else if(action?.mode==='balance'){name='ledge_grab';manual=1.35;}
  else if(action?.mode==='land'){name='jump';manual=2.44+Math.min(1,action.progress)*.48;}
  else if(action?.mode==='ladder'){name='subir escalera recta hacia arriba';manual=1.15+(action.phase*1.15)%3.2;}
  else if(action?.mode==='climb'){name='climb';manual=.35+Math.min(1,action.progress)*2.95;}
  else if(!grounded&&this.airTime>.015){name='jump';manual=verticalSpeed>0?1.18+(1-Math.min(1,verticalSpeed/10.4))*.68:1.86+Math.min(1,-verticalSpeed/10.4)*.58;}
  else if(this.landingTime>0&&this.actions.jump){name='jump';manual=2.44+(1-this.landingTime/.20)*.48;}
  else if(speed>.18){name=stairs?'subir escalera':speed<2.6?'walk':'run';}
  else name='idle';
  this.play(name,action?.mode==='roll' ? .065 : .14);const a=this.actions[name];
  a.paused=manual!==null;
  if(manual!==null)a.time=manual;else a.timeScale=name==='run'?Math.max(.7,speed/4.45):name==='walk'?Math.max(.45,speed/1.25):name==='subir escalera'?Math.max(.8,speed/1.5):1;
  this.mixer.update(dt);
  // Stop finished fades; inactive clips must not keep modifying the rig.
  for(const [key,old] of Object.entries(this.actions))if(key!==name&&old.isRunning()&&old.getEffectiveWeight()<.0001)old.stop();
  this.placeOnSupport();this.ikErrors=[];
  if(['monkey','pole','net','ledge'].includes(action?.mode))this.alignTraversal(action);
  if(action?.mode==='wall'){this.model.rotation.z=action.side*.30;this.model.position.y+=.08;this.model.updateMatrixWorld(true);const side=Math.floor(action.phase*4)%2?'Left':'Right',root=this.model.parent.getWorldPosition(new THREE.Vector3()),foot=root.clone().addScaledVector(action.normal,-.32).addScaledVector(action.dir,.12);foot.y+=.42;this.solveChain([this.bones[side+'UpLeg'],this.bones[side+'Leg'],this.bones[side+'Foot']],foot,.9);}
  if(action?.mode==='flip'){
   // Rotate around the pelvis, never around the soles. The capsule follows
   // the ballistic jump; only the visible rig performs the backward rotation.
   const pivot=this.hips.position.clone().multiply(this.model.scale),q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI*2*THREE.MathUtils.smoothstep(action.progress,.08,.94));
   this.model.quaternion.copy(q);this.model.position.add(pivot).sub(pivot.clone().applyQuaternion(q));this.model.position.y+=Math.sin(Math.PI*action.progress)*.12;
  }
  if(action?.mode==='ladder'&&action.ladder)this.alignToLadder(action);
 }
 alignTraversal(a){
  const V=THREE.Vector3,root=this.model.parent.getWorldPosition(new V()),facing=a.dir.clone(),side=new V(-facing.z,0,facing.x),targets=[];
  if(a.mode==='ledge'||a.mode==='monkey')for(const key of ['Hips','Spine','Spine1','Spine2'])if(this.bones[key])this.bones[key].quaternion.slerp(this.bindRotations[key],.92);
  this.model.position.set(0,0,0);this.model.updateMatrixWorld(true);
  const hips=this.hips.getWorldPosition(new V());this.model.position.y=root.y+1.03-hips.y;this.model.updateMatrixWorld(true);
  if(a.mode==='monkey'){
   const z=a.zone,step=.52,q=a.distance/step,k=Math.floor(q),f=q-k,support=k%2,swing=THREE.MathUtils.smoothstep(f,.15,.90);
   for(let i=0;i<2;i++){const s=i===support?k*step:((k-1)+2*swing)*step,p=z.start.clone().addScaledVector(z.dir,THREE.MathUtils.clamp(s,0,z.length)).addScaledVector(z.side,i===0?-.23:.23);p.y=z.handY-(i===support?0:Math.sin(swing*Math.PI)*.13);targets.push(p);}
  }else if(a.mode==='ledge'){
   const step=.36,origin=a.edge.clone().addScaledVector(a.tangent,-a.distance);
   for(let i=0;i<2;i++){
    const offset=i*.5,q=a.distance/step+offset,k=Math.floor(q),swing=THREE.MathUtils.smoothstep(q-k,.65,.98),grip=(k+swing-offset)*step;
    const p=origin.clone().addScaledVector(a.tangent,grip).addScaledVector(side,i===0?-.24:.24);p.y=a.handY-Math.sin(swing*Math.PI)*.09;targets.push(p);
   }
  }else if(a.mode==='pole'){
   for(let i=0;i<2;i++){const p=new V(a.zone.pole.x,root.y+1.35+i*.15,a.zone.pole.z).addScaledVector(side,i===0?-.045:.045);targets.push(p);}
  }else{
   const z=a.zone,travel=(root.y-z.start.y)/z.rungStep;
   for(let i=0;i<2;i++){const phase=travel+i*.5,k=Math.floor(phase),f=THREE.MathUtils.smoothstep(phase-k,.55,.95),p=new V(z.planeX,z.start.y+(k+3+f)*z.rungStep,z.start.z).addScaledVector(side,i===0?-.29:.29);p.y=Math.min(z.end.y+1.1,p.y);targets.push(p);}
  }
  // Correct the torso against the actual grip plane before solving the arms.
  // This keeps both targets inside the imported rig's short 45 cm arm reach.
  const shoulders=this.bones.LeftArm.getWorldPosition(new V()).add(this.bones.RightArm.getWorldPosition(new V())).multiplyScalar(.5),middle=targets[0].clone().add(targets[1]).multiplyScalar(.5);
  const hanging=a.mode==='monkey'||a.mode==='ledge',desired=middle.clone().addScaledVector(facing,hanging?-.04:-.25);desired.y-=hanging?.32:a.mode==='pole'?.08:.18;
  const shift=desired.sub(shoulders).applyQuaternion(this.model.parent.getWorldQuaternion(new THREE.Quaternion()).invert());this.model.position.add(shift);this.model.updateMatrixWorld(true);
  for(const [i,name] of ['Left','Right'].entries()){
   if(a.mode==='net'){
    const shoulder=this.bones[name+'Arm'].getWorldPosition(new V()),elbow=this.bones[name+'ForeArm'].getWorldPosition(new V()),wrist=this.bones[name+'Hand'].getWorldPosition(new V()),reach=(shoulder.distanceTo(elbow)+elbow.distanceTo(wrist))*.97;
    if(shoulder.distanceTo(targets[i])>reach)targets[i].y+=targets[i].y>shoulder.y?-a.zone.rungStep:a.zone.rungStep;
   }
   this.solveChain([this.bones[name+'Arm'],this.bones[name+'ForeArm'],this.bones[name+'Hand']],targets[i],1);
   if(a.mode==='pole'||a.mode==='net'){
    const foot=a.mode==='pole'?new V(a.zone.pole.x-.10,root.y+.35+(i===0?.12:0),a.zone.pole.z).addScaledVector(side,i===0?-.09:.09):new V(a.zone.planeX+.10,a.zone.start.y+Math.round((this.hips.getWorldPosition(new V()).y-.55+(i===0?.12:-.12)-a.zone.start.y)/a.zone.rungStep)*a.zone.rungStep,a.zone.start.z).addScaledVector(side,i===0?-.24:.24);
    this.solveChain([this.bones[name+'UpLeg'],this.bones[name+'Leg'],this.bones[name+'Foot']],foot,.85);
   }
   for(const finger of ['Index','Middle','Ring','Pinky'])for(const n of [1,2,3]){const b=this.bones[name+'Hand'+finger+n];if(b)b.rotation.z+=(name==='Left'?1:-1)*.30;}
  }
 }
 alignToLadder(action){
  const l=action.ladder,base=new THREE.Vector3(l.base.x,l.base.y,l.base.z),facing=new THREE.Vector3(l.facing.x,0,l.facing.z),right=new THREE.Vector3(-facing.z,0,facing.x);
  const root=this.model.parent.getWorldPosition(new THREE.Vector3()),travel=Math.max(0,root.y-base.y)/l.rungStep,origin=new THREE.Vector3(l.rungOrigin.x,l.rungOrigin.y,l.rungOrigin.z);
  // The capsule stays on the safe platform approach; align the visible torso
  // to the measured rung plane rather than pushing its collider into the rail.
  const bodyOffset=origin.clone().addScaledVector(facing,-.28).sub(root);bodyOffset.y=0;bodyOffset.applyQuaternion(this.model.parent.getWorldQuaternion(new THREE.Quaternion()).invert());this.model.position.x=bodyOffset.x;this.model.position.z=bodyOffset.z;this.model.updateMatrixWorld(true);
  for(const [side,sign,phase] of [['Left',-1,0],['Right',1,.5]]){
   const step=travel+phase,index=Math.floor(step),lift=THREE.MathUtils.smoothstep(step-index,.68,.98);
   const hand=origin.clone().addScaledVector(right,sign*.22);hand.y=Math.min(l.top.y+.85,origin.y+(index+2+lift)*l.rungStep);
   const shoulder=this.bones[side+'Arm'].getWorldPosition(new THREE.Vector3()),elbow=this.bones[side+'ForeArm'].getWorldPosition(new THREE.Vector3()),wrist=this.bones[side+'Hand'].getWorldPosition(new THREE.Vector3()),reach=(shoulder.distanceTo(elbow)+elbow.distanceTo(wrist))*.97;
   // Select an actual reachable rung instead of stretching an arm to a rung
   // above its anatomical reach (the source ladder has unusually tall spacing).
   for(let attempt=0;attempt<2&&shoulder.distanceTo(hand)>reach;attempt++)hand.y+=hand.y>shoulder.y?-l.rungStep:l.rungStep;
   this.solveChain([this.bones[side+'Arm'],this.bones[side+'ForeArm'],this.bones[side+'Hand']],hand,1);
   const foot=origin.clone().addScaledVector(right,sign*.16).addScaledVector(facing,-.09);foot.y=Math.min(l.top.y+.05,origin.y+(index+lift)*l.rungStep);
   this.solveChain([this.bones[side+'UpLeg'],this.bones[side+'Leg'],this.bones[side+'Foot']],foot,.8);
  }
 }
 solveChain(chain,target,weight){
  if(chain.some(b=>!b))return;const [upper,lower,end]=chain,tip=new THREE.Vector3(),origin=new THREE.Vector3(),from=new THREE.Vector3(),to=new THREE.Vector3(),q=new THREE.Quaternion(),worldQ=new THREE.Quaternion(),parentQ=new THREE.Quaternion();
  this.model.updateMatrixWorld(true);const destination=end.getWorldPosition(tip).lerp(target,weight).clone();
  for(let k=0;k<32;k++){for(const bone of [lower,upper]){bone.getWorldPosition(origin);end.getWorldPosition(tip);from.copy(tip).sub(origin).normalize();to.copy(destination).sub(origin).normalize();q.setFromUnitVectors(from,to);bone.getWorldQuaternion(worldQ);bone.parent.getWorldQuaternion(parentQ);bone.quaternion.copy(parentQ.invert().multiply(q.multiply(worldQ)));bone.updateMatrixWorld(true);}if(end.getWorldPosition(tip).distanceTo(destination)<.008)break;}
  this.ikErrors.push({bone:end.name,error:end.getWorldPosition(tip).distanceTo(destination),reach:upper.getWorldPosition(origin).distanceTo(lower.getWorldPosition(from))+from.distanceTo(tip),distance:origin.distanceTo(destination)});
 }
 placeOnSupport(){
  this.model.position.set(0,0,0);(this.model.parent||this.model).updateMatrixWorld(true);let min=Infinity;
  for(const {mesh,ids} of this.samples){mesh.skeleton.update();for(const i of ids){mesh.getVertexPosition(i,this.vertex).applyMatrix4(mesh.matrixWorld);min=Math.min(min,this.vertex.y);}}
  const base=this.model.parent?.getWorldPosition(this.vertex).y??0;
  this.model.position.y=base-min+.018;this.soleClearance=.018;(this.model.parent||this.model).updateMatrixWorld(true);
 }
}
