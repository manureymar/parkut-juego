import {Vector3,MathUtils} from 'three';
import {LEVEL} from './level.js';
const point=(id,[x,y,z])=>{const b=LEVEL.find(b=>b.id===id);return new Vector3(b.offsetX+x*b.scale,b.y+y*b.scale,b.z+z*b.scale);};
// Surveyed against the supplied meshes. Only the stair tread corridors are smoothed;
// the roof edges, holes and railings keep their original collision geometry.
const ramp=(id,a,b,width)=>({id:id+'-stairs',a:point(id,a),b:point(id,b),width:width*LEVEL.find(b=>b.id===id).scale});
export const STAIRS=[
 ramp('roof-01',[.102,.767,-.018],[.102,.834,-.128],.041),
 ramp('roof-02',[-.05,.685,-.117],[-.05,.763,-.200],.037),
 ramp('roof-06',[.18,.761,.030],[.18,.844,-.087],.042),
 ramp('roof-07',[-.113,.517,.12],[.003,.628,.12],.068),
 ramp('roof-07',[.143,.628,.164],[.143,.742,.009],.030),
];
export const LADDERS=[{
 id:'tank',base:point('roof-02',[-.025,.763,-.192]),top:point('roof-02',[-.025,.933,-.214]),exit:point('roof-02',[-.057,.942,-.254]),facing:new Vector3(0,0,-1),width:.90,
}];
export function stairSurface(x,z){
 for(const r of STAIRS){const dx=r.b.x-r.a.x,dz=r.b.z-r.a.z,l2=dx*dx+dz*dz,t=((x-r.a.x)*dx+(z-r.a.z)*dz)/l2;
  if(t<-.09||t>1.16)continue;
  const lateral=Math.abs((x-r.a.x)*dz-(z-r.a.z)*dx)/Math.sqrt(l2);if(lateral>r.width/2)continue;
  return {y:MathUtils.lerp(r.a.y,r.b.y,MathUtils.clamp(t,0,1))+.035,r,t};
 }return null;
}
export class Traversal {
 constructor(physics){this.physics=physics;this.active=null;this.cooldown=0;this.last=null;this.history=[];this.rollTime=0;this.rollDuration=.95;this.fallTop=0;this.fallSpeed=0;this.autoJumpCooldown=0;}
 reset(){this.active=null;this.cooldown=.35;this.rollTime=0;this.fallTop=this.physics.position.y;this.fallSpeed=0;this.autoJumpCooldown=0;}
 record(type){this.last=type;if(!this.history.includes(type))this.history.push(type);}
 tryAttach(input){
  const p=this.physics.position,intent=new Vector3(input.x,0,input.z);if(intent.length()<.25||this.cooldown>0||this.rollTime>0)return false;
  intent.normalize();
  for(const l of LADDERS){
   const atBase=Math.hypot(p.x-l.base.x,p.z-l.base.z)<1&&Math.abs(p.y-l.base.y)<.65&&intent.dot(l.facing)>.4;
   const atTop=p.distanceTo(l.exit)<1.0&&intent.dot(l.facing)<-.4;
   if(atBase||atTop){this.active={type:'ladder',ladder:l,t:atTop?1:0,phase:0,enter:p.clone(),blend:0,descending:atTop};this.physics.velocity.set(0,0,0);this.record('ladder');return true;}
  }
  const stair=stairSurface(p.x+intent.x*.4,p.z+intent.z*.4);if(stair&&Math.abs(stair.y-p.y)<.7)return false;
  const target=this.physics.mantleTarget(intent);
  if(target&&this.physics.grounded){this.active={type:'mantle',start:p.clone(),end:target.end,dir:intent,elapsed:0,duration:1.3};this.physics.velocity.set(0,0,0);this.record('climb');return true;}
  return false;
 }
 step(dt,input){
  const p=this.physics;this.cooldown=Math.max(0,this.cooldown-dt);this.autoJumpCooldown=Math.max(0,this.autoJumpCooldown-dt);
  if(this.active){const a=this.active;
   if(a.type==='ladder'){
    const l=a.ladder,axis=input.x*l.facing.x+input.z*l.facing.z;
    const movement=Math.abs(axis)>.18?Math.sign(axis):0;a.t=MathUtils.clamp(a.t+movement*dt*1.35/l.base.distanceTo(l.top),0,1);a.phase+=Math.abs(movement)*dt;a.blend=Math.min(1,a.blend+dt*5);
    const at=l.base.clone().lerp(l.top,a.t);p.position.copy(a.enter).lerp(at,a.blend);p.velocity.set(0,0,0);p.grounded=false;p.sync();
    if(a.t>=1&&movement>0){this.active={type:'exit',start:p.position.clone(),end:l.exit.clone(),dir:l.facing,elapsed:0,duration:.65};}
    else if(a.t<=0&&movement<0){p.position.copy(l.base).addScaledVector(l.facing,-.55);p.sync();this.active=null;this.cooldown=1;}
   }else{
    a.elapsed+=dt;const t=Math.min(1,a.elapsed/a.duration),f=MathUtils.smoothstep(t,.12,1),v=MathUtils.smoothstep(t,0,.62);
    p.position.copy(a.start).lerp(a.end,f);p.position.y=MathUtils.lerp(a.start.y,a.end.y,v)+Math.sin(t*Math.PI)*.16;p.velocity.set(0,0,0);p.grounded=false;p.sync();
    if(t>=1){this.active=null;this.cooldown=.65;p.position.copy(a.end);p.velocity.set(0,0,0);p.sync();}
   }
   return {action:this.active?.type||null,landed:false};
  }
  // Only the six authored roof-to-roof gaps qualify. A missing ray on a
  // skylight or grate is not evidence of a gap and must never cause a jump.
  if(p.grounded&&input.z<-.45&&this.autoJumpCooldown===0){
   const i=LEVEL.findIndex((b,i)=>i<LEVEL.length-1&&p.position.z-b.exitZ<1.4&&p.position.z-b.exitZ>-.35);
   if(i>=0){const next=LEVEL[i+1],landing=p.ground(p.position.x,next.entryZ-.8,p.position.y+1.2,2.6);
    if(landing&&Math.abs(landing.position.y-p.position.y)<1.3){p.requestJump();p.velocity.z=-6.4;this.autoJumpCooldown=1.4;this.record('jump');}
   }
  }
  if(p.jumpBuffer<=0&&this.tryAttach(input))return {landed:false};
  const speed=Math.hypot(p.velocity.x,p.velocity.z);
  const rolling=this.rollTime>0;if(rolling)this.rollTime=Math.max(0,this.rollTime-dt);
  let motion=input;if(rolling){const d=this.rollDirection||new Vector3(0,0,-1),ahead=p.position.clone().addScaledVector(d,.8);if(p.ground(ahead.x,ahead.z,p.position.y+.4,.9))motion={x:d.x*.65,z:d.z*.65};}
  const r=p.step(dt,motion,rolling?3.0:6.4);
  if(!p.grounded){this.fallTop=Math.max(this.fallTop,p.position.y);this.fallSpeed=Math.max(this.fallSpeed,-p.velocity.y);}
  if(r.landed){const drop=this.fallTop-p.position.y;if((r.impact<-8||drop>1.7)&&this.cooldown===0){this.rollTime=this.rollDuration;this.rollDirection=new Vector3(p.velocity.x,0,p.velocity.z);if(this.rollDirection.length()<.2)this.rollDirection.set(0,0,-1);else this.rollDirection.normalize();this.record('dive');}this.fallTop=p.position.y;this.fallSpeed=0;}
  if(p.grounded&&!r.landed)this.fallTop=p.position.y;
  if(p.onStairs&&speed>.2)this.record('stairs');
  return r;
 }
 get animation(){const a=this.active;if(a?.type==='ladder')return {mode:'ladder',phase:a.phase,progress:a.t};if(a)return {mode:'climb',progress:a.elapsed/a.duration};if(this.rollTime>0)return {mode:'roll',progress:1-this.rollTime/this.rollDuration};return null;}
}
