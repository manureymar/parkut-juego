import {Vector3,Ray,MathUtils} from 'three';
import {Traversal} from './traversal.js';
const V=Vector3,advanced=new Set(['monkey','pole','net','ledge','wall','flip']);
export class AdvancedTraversal extends Traversal{
 constructor(physics){super(physics);this.zones=[];this.course=null;this.wallLock=0;this.edgeBalance=false;this.ray=new Ray();this.lastAirJump=false;}
 configure(course){this.course=course;this.zones=course.zones;this.physics.ramps=course.ramps;}
 reset(){super.reset();this.wallLock=0;this.edgeBalance=false;}
 attach(zone){
  const p=this.physics;this.active={type:zone.type,zone,dir:zone.dir.clone(),distance:0,phase:0,elapsed:0,entry:p.position.clone()};p.velocity.set(0,0,0);p.jumpBuffer=0;p.grounded=false;this.record(zone.type);return true;
 }
 nearby(input){
  if(this.cooldown>0||Math.hypot(input.x,input.z)<.25)return false;
  const p=this.physics.position,intent=new V(input.x,0,input.z);
  for(const z of this.zones){if(['jump','ledge','wall'].includes(z.type))continue;
   if(Math.hypot(p.x-z.start.x,p.z-z.start.z)<(z.type==='pole'?.75:1.45)&&Math.abs(p.y-z.start.y)<1.15&&intent.dot(z.dir)>.12)return this.attach(z);
  }
  for(const z of this.zones.filter(z=>z.type==='jump'))if(this.physics.grounded&&p.distanceTo(z.start)<1.3&&intent.dot(z.dir)>.4){this.physics.requestJump();return false;}
  return false;
 }
 tryAttach(input){return this.nearby(input)||super.tryAttach(input);}
 requestJump(){
  const a=this.active,p=this.physics;
  if(a?.type==='ledge'){
   const end=p.position.clone().addScaledVector(a.dir,1.0),h=p.ground(end.x,end.z,a.handY+.5,1.1);if(h){end.y=h.position.y+.025;this.exit(end);return true;}return false;
  }
  if(a&&advanced.has(a.type)&&a.type!=='flip'){this.active=null;this.cooldown=.8;p.velocity.copy(a.dir).multiplyScalar(-2.0);p.velocity.y=5.5;p.grounded=false;p.sync();return true;}
  if(!a)p.requestJump();return !a;
 }
 flip(){const p=this.physics;if(this.active||!p.grounded)return false;p.requestJump();this.active={type:'flip',elapsed:0,dir:new V(p.velocity.x,0,p.velocity.z).normalize()};this.record('backflip');return true;}
 exit(end){const a=this.active;this.active={type:'exit',start:this.physics.position.clone(),end:end.clone().add(new V(0,.025,0)),dir:a.dir.clone(),elapsed:0,duration:.6};this.cooldown=1;}
 detectLedge(input){
  const p=this.physics;if(p.grounded||this.cooldown>0||Math.hypot(input.x,input.z)<.25)return false;
  const facing=new V(input.x,0,input.z).normalize();this.ray.origin.copy(p.position).y+=1.15;this.ray.direction.copy(facing);const hit=p.world.rayIntersect(this.ray);if(!hit||hit.distance>.75)return false;
  const inside=hit.position.clone().addScaledVector(facing,.25),top=p.ground(inside.x,inside.z,p.position.y+2.55,1.25);if(!top)return false;
  const rise=top.position.y-p.position.y;if(rise<1.35||rise>2.35)return false;
  const normal=hit.triangle.getNormal(new V());normal.y=0;normal.normalize();if(normal.dot(facing)>0)normal.negate();
  const edge=top.position.clone().addScaledVector(facing,-.25);this.active={type:'ledge',dir:facing,normal,tangent:new V(-normal.z,0,normal.x),edge,handY:top.position.y+.04,elapsed:0,phase:0,entry:p.position.clone(),distance:0};p.velocity.set(0,0,0);p.grounded=false;this.record('ledge_grab');return true;
 }
 detectWall(input){
  const p=this.physics;if(p.grounded||this.cooldown>0||this.wallLock>0||Math.hypot(p.velocity.x,p.velocity.z)<3||p.velocity.y<-8)return false;
  const travel=new V(input.x,0,input.z);if(travel.length()<.4)return false;travel.normalize();
  for(const sign of [-1,1]){const toward=new V(-travel.z*sign,0,travel.x*sign);this.ray.origin.copy(p.position).y+=.9;this.ray.direction.copy(toward);const hit=p.world.rayIntersect(this.ray);if(!hit||hit.distance>.65)continue;
   const normal=hit.triangle.getNormal(new V());if(Math.abs(normal.y)>.15)continue;if(normal.dot(toward)>0)normal.negate();normal.y=0;normal.normalize();
   const tangent=travel.clone().addScaledVector(normal,-travel.dot(normal)).normalize();if(tangent.length()<.5)continue;
   this.active={type:'wall',dir:tangent,normal,elapsed:0,phase:0,side:sign,wallPoint:hit.position.clone()};p.velocity.y=1.4;this.record('wall_run');return true;
  }return false;
 }
 step(dt,input){
  this.wallLock=Math.max(0,this.wallLock-dt);const p=this.physics;let a=this.active;
  if(!a){if(this.nearby(input))a=this.active;else if(this.detectLedge(input))a=this.active;else if(this.detectWall(input))a=this.active;}
  if(!a||!advanced.has(a.type)){
   const result=super.step(dt,input);this.edgeBalance=false;
   if(p.grounded&&!this.active&&Math.hypot(input.x,input.z)>.2){const dir=new V(input.x,0,input.z).normalize(),q=p.position.clone().addScaledVector(dir,.7);this.edgeBalance=!p.ground(q.x,q.z,p.position.y+.2,1.1);}
   return result;
  }
  this.cooldown=Math.max(0,this.cooldown-dt);a.elapsed+=dt;
  if(a.type==='flip'){
   const result=p.step(dt,input,6.4);a.progress=Math.min(1,a.elapsed/.95);if(a.elapsed>=.95||result.landed){this.active=null;this.cooldown=.4;}return result;
  }
  if(a.type==='wall'){
   p.velocity.y=Math.max(p.velocity.y,-.75);const result=p.step(dt,{x:a.dir.x,z:a.dir.z},5.8);p.velocity.y=Math.max(p.velocity.y,-.75);a.phase+=dt;
   if(a.elapsed>.85||Math.hypot(input.x,input.z)<.15||p.grounded){this.active=null;this.wallLock=1.5;this.cooldown=.45;if(Math.hypot(input.x,input.z)>.15){p.velocity.addScaledVector(a.normal,3.6);if(p.grounded)p.requestJump();else p.velocity.y=10.4;this.active={type:'flip',elapsed:0,dir:a.dir.clone()};this.record('wall_dismount');}}return result;
  }
  if(a.type==='ledge'){
   const lateral=input.x*a.tangent.x+input.z*a.tangent.z,away=input.x*a.normal.x+input.z*a.normal.z;
   if(away>.65){this.active=null;this.cooldown=.8;p.velocity.copy(a.normal).multiplyScalar(1.5);p.velocity.y=-1;return {landed:false};}
   if(Math.abs(lateral)>.15){const next=a.edge.clone().addScaledVector(a.tangent,lateral*dt*.95),inside=next.clone().addScaledVector(a.dir,.3),h=p.ground(inside.x,inside.z,a.handY+.3,.65);if(h&&Math.abs(h.position.y-a.handY)<.25){a.edge.copy(next);a.phase+=Math.abs(lateral)*dt;a.distance+=lateral*dt*.95;this.record('ledge_shimmy');}}
   const target=a.edge.clone().addScaledVector(a.normal,.36);target.y=a.handY-2.02;p.position.copy(a.entry).lerp(target,Math.min(1,a.elapsed*6));p.velocity.set(0,0,0);p.grounded=false;p.sync();return {landed:false};
  }
  const z=a.zone,axis=input.x*z.dir.x+input.z*z.dir.z,raw=Math.abs(axis)>.12?MathUtils.clamp(axis,-1,1):0,move=a.type==='pole'&&a.distance>0?Math.max(0,raw):raw;
  a.distance=MathUtils.clamp(a.distance+(a.type!=='pole'||a.elapsed>.25?move*z.speed*dt:0),0,z.length);a.phase+=Math.abs(move)*dt;
  const t=a.distance/z.length,target=new V();
  if(a.type==='monkey'){target.copy(z.start).lerp(z.end,t);target.y=z.handY-2.02;}
  if(a.type==='pole'){target.set(z.pole.x-.20,z.start.y-a.distance,z.pole.z);}
  if(a.type==='net'){target.set(z.planeX+.28,z.start.y+a.distance,z.start.z);}
  p.position.copy(a.entry).lerp(target,Math.min(1,a.elapsed*5));p.velocity.set(0,0,0);p.grounded=false;p.sync();
  if(a.distance>=z.length-.001&&move>0)this.exit(z.end);
  else if(a.distance===0&&move<0&&a.elapsed>.4){this.exit(z.start.clone().addScaledVector(z.dir,-.75));}
  return {landed:false};
 }
 get animation(){
  const a=this.active;if(a&&advanced.has(a.type))return {mode:a.type,...a,progress:a.type==='flip'?Math.min(1,a.elapsed/.95):a.zone?a.distance/a.zone.length:0};
  const base=super.animation;if(base?.mode==='roll')return {...base,mode:'land'};
  if(this.edgeBalance)return {mode:'balance',phase:0};return base;
 }
}
