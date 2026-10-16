import * as THREE from 'three';
export class RunnerAnimation {
 constructor(model,clips){
  this.model=model;this.mixer=new THREE.AnimationMixer(model);this.actions={};this.current=null;this.time=0;this.locked=0;
  let hips;model.traverse(n=>{if(n.isBone&&n.name.toLowerCase().endsWith('hips'))hips=n;});this.hips=hips;
  this.rest=hips.position.clone();
  for(const original of clips){
   const clip=original.clone();
   for(const t of clip.tracks){
    if(t.name===`${hips.name}.position`){
     const startY=t.values[1],endY=t.values[t.values.length-2],d=clip.duration;
     for(let i=0;i<t.values.length;i+=3){t.values[i]=this.rest.x;t.values[i+2]=this.rest.z;
      // Eliminate exported root travel; retain the natural vertical bounce in gait.
      if(!['run','walk'].includes(clip.name))t.values[i+1]-=startY-this.rest.y+(endY-startY)*t.times[i/3]/d;
     }
    }
   }
   const a=this.mixer.clipAction(clip);this.actions[clip.name]=a;
  }
  // A calm standing pose is derived from the supplied walk clip, on the same rig.
  const base=clips.find(c=>c.name==='walk').clone();base.name='idle';
  base.tracks=base.tracks.map(t=>{const c=t.clone(),n=t.getValueSize();c.times=new Float32Array([0,4]);c.values=new Float32Array([...t.values.slice(0,n),...t.values.slice(0,n)]);if(c.name===`${hips.name}.position`)c.values=new Float32Array([...this.rest.toArray(),...this.rest.toArray()]);return c;});base.duration=4;
  this.actions.idle=this.mixer.clipAction(base);this.play('idle',0);
 }
 play(name,fade=.16,once=false){const a=this.actions[name];if(!a||this.current===name)return;a.reset().setEffectiveWeight(1).setEffectiveTimeScale(1);a.setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity);a.clampWhenFinished=once;a.play();if(this.current)this.actions[this.current].fadeOut(fade);a.fadeIn(fade);this.current=name;}
 update(dt,{speed,grounded,climbing,stairs,airTime}){
  this.time+=dt;
  if(climbing){this.play('climb',.14,true);this.actions.climb.timeScale=2.2;}
  else if(!grounded&&airTime>.08){this.play('jump_down',.12,true);this.actions.jump_down.timeScale=1.5;}
  else if(speed>.2){const name=stairs?'subir escalera':speed<2.5?'walk':'run';this.play(name);this.actions[name].timeScale=stairs?1.5:name==='run'?speed/4.45:Math.max(.55,speed/1.25);}
  else this.play('idle',.2);
  this.mixer.update(dt);
  if(this.current==='idle')this.hips.position.y+=Math.sin(this.time*1.9)*.0025;
 }
}
