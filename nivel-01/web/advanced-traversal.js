import {Vector3,Ray,MathUtils} from 'three';
import {Traversal} from './traversal.js';
const V=Vector3,advanced=new Set(['monkey','pole','net','ledge','wall','flip','vault','window-transfer']);
export class AdvancedTraversal extends Traversal{
 constructor(physics){super(physics);this.zones=[];this.course=null;this.wallLock=0;this.edgeBalance=false;this.ray=new Ray();this.lastAirJump=false;}
 configure(course){this.course=course;this.zones=course.zones;this.physics.ramps=course.ramps;}
 reset(){super.reset();this.wallLock=0;this.edgeBalance=false;}
 attach(zone,fromEnd=false,automatic=false){
  const p=this.physics,dir=zone.dir.clone();if(zone.type==='pole'&&fromEnd)dir.negate();
  this.active={type:zone.type,zone,dir,distance:fromEnd?zone.length:0,phase:0,elapsed:0,entry:p.position.clone(),travelSign:fromEnd?-1:1,automatic};p.velocity.set(0,0,0);p.jumpBuffer=0;p.grounded=false;this.record(zone.type+(fromEnd?'_up':''));return true;
 }
 candidate(){
  if(this.active||this.cooldown>0)return null;const p=this.physics.position;
  for(const z of this.zones){if(!['monkey','pole','net'].includes(z.type))continue;
   for(const end of [false,true]){const target=end?z.end:z.start;if(Math.hypot(p.x-target.x,p.z-target.z)<(z.type==='pole'?1.5:1.55)&&Math.abs(p.y-target.y)<1.1)return {zone:z,fromEnd:end,label:z.type==='pole'?(end?'ESCALAR TUBO':'DESLIZARSE'):z.type==='net'?(end?'BAJAR RED':'ESCALAR RED'):'AGARRAR BARRAS'};}
  }return null;
 }
 context(){const a=this.active;if(a&&['pole','net','monkey'].includes(a.type))return {label:a.automatic?'DETENER':'CONTINUAR'};if(a?.type==='ledge')return {label:a.window?.next?'SUBIR VENTANA':'SUBIR AL BORDE'};return this.candidate();}
 interact(){const a=this.active;if(a&&['pole','net','monkey'].includes(a.type)){a.automatic=!a.automatic;return true;}if(a?.type==='ledge')return this.requestJump();const c=this.candidate();return c?this.attach(c.zone,c.fromEnd,true):false;}
 nearby(input){
  if(this.cooldown>0||Math.hypot(input.x,input.z)<.25)return false;
  const p=this.physics.position,intent=new V(input.x,0,input.z),c=this.candidate();
  if(c){const approach=c.fromEnd?c.zone.dir.clone().negate():c.zone.dir;if(intent.dot(approach)>.30)return this.attach(c.zone,c.fromEnd);}
  for(const z of this.zones.filter(z=>z.type==='jump'))if(this.physics.grounded&&p.distanceTo(z.start)<1.3&&intent.dot(z.dir)>.4){this.physics.requestJump();return false;}
  return false;
 }
 tryAttach(input){
  if(this.nearby(input))return true;
  if(this.cooldown<=0&&this.physics.grounded&&Math.hypot(input.x,input.z)>.35){const dir=new V(input.x,0,input.z).normalize(),v=this.physics.vaultTarget(dir);if(v){this.active={type:'vault',start:this.physics.position.clone(),...v,elapsed:0,duration:.90};this.physics.velocity.set(0,0,0);this.record('vault');return true;}}
  return super.tryAttach(input);
 }
 requestJump(){
  const a=this.active,p=this.physics;
  if(a?.type==='ledge'){
   if(a.window?.next){const next=this.zones.find(z=>z.id===a.window.next);if(next&&next.handY-a.handY<1.65){this.active={type:'window-transfer',start:p.position.clone(),end:next.edge.clone().addScaledVector(next.normal,.42).setY(next.handY-1.98),dir:a.dir,window:next,elapsed:0,duration:.62,previous:a};p.velocity.set(0,0,0);this.record('window_climb');return true;}}
   if(a.window?.exit&&p.clearanceAt(a.window.exit)){this.exit(a.window.exit);return true;}
   const end=p.position.clone().addScaledVector(a.dir,1.0),h=p.ground(end.x,end.z,a.handY+.5,1.1);if(h){end.y=h.position.y+.025;if(p.clearanceAt(end)){this.exit(end);return true;}}return false;
  }
  if(a&&advanced.has(a.type)&&a.type!=='flip'){this.active=null;this.cooldown=.8;p.velocity.copy(a.dir).multiplyScalar(-2.0);p.velocity.y=5.5;p.grounded=false;p.sync();return true;}
  if(!a)p.requestJump();return !a;
 }
 flip(){const p=this.physics;if(this.active||!p.grounded)return false;p.requestJump();this.active={type:'flip',elapsed:0,dir:new V(p.velocity.x,0,p.velocity.z).normalize()};this.record('backflip');return true;}
 exit(end){const a=this.active;this.active={type:'exit',start:this.physics.position.clone(),end:end.clone().add(new V(0,.025,0)),dir:a.dir.clone(),elapsed:0,duration:.6};this.cooldown=1;}
 hangWindow(w){const p=this.physics;this.active={type:'ledge',window:w,dir:w.dir.clone(),normal:w.normal.clone(),tangent:w.tangent.clone(),edge:w.edge.clone(),handY:w.handY,elapsed:0,phase:0,entry:p.position.clone(),distance:0};p.velocity.set(0,0,0);p.grounded=false;this.record('window_grab');return true;}
 detectLedge(input){
  const p=this.physics;if(p.grounded||this.cooldown>0||Math.hypot(input.x,input.z)<.25)return false;
  const facing=new V(input.x,0,input.z).normalize();
  for(const w of this.zones.filter(z=>z.type==='window')){const d=p.position.clone().sub(w.edge),rise=w.handY-p.position.y;if(rise>1.4&&rise<2.4&&Math.abs(d.dot(w.tangent))<w.width/2-.22&&d.dot(w.normal)>.05&&d.dot(w.normal)<.95&&facing.dot(w.dir)>.45)return this.hangWindow(w);}
  this.ray.origin.copy(p.position).y+=1.15;this.ray.direction.copy(facing);const hit=p.world.rayIntersect(this.ray);if(!hit||hit.distance>.75)return false;
  const inside=hit.position.clone().addScaledVector(facing,.25),top=p.ground(inside.x,inside.z,p.position.y+2.55,1.25);if(!top)return false;
  const rise=top.position.y-p.position.y;if(rise<1.35||rise>2.35)return false;
  const normal=hit.triangle.getNormal(new V());normal.y=0;normal.normalize();if(normal.dot(facing)>0)normal.negate();
  const edge=top.position.clone().addScaledVector(facing,-.25);this.active={type:'ledge',dir:facing,normal,tangent:new V(-normal.z,0,normal.x),edge,handY:top.position.y+.04,elapsed:0,phase:0,entry:p.position.clone(),distance:0};p.velocity.set(0,0,0);p.grounded=false;this.record('ledge_grab');return true;
 }
 detectWall(input){
  const p=this.physics;if(p.grounded||this.cooldown>0||this.wallLock>0||Math.hypot(p.velocity.x,p.velocity.z)<3||p.velocity.y<-8)return false;
  const below=p.ground(p.position.x,p.position.z,p.position.y+.05,.65);if(below&&p.position.y-below.position.y<.45)return false;
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
  if(a.type==='vault'){
   const t=Math.min(1,a.elapsed/a.duration);
   if(t<.22){p.position.copy(a.start).lerp(a.pre,MathUtils.smoothstep(t,0,.22));}
   else{p.position.copy(a.pre).lerp(a.end,MathUtils.smoothstep(t,.50,.80));p.position.y=t<.50?MathUtils.lerp(a.start.y,a.peak,MathUtils.smoothstep(t,.22,.50)):MathUtils.lerp(a.peak,a.end.y,MathUtils.smoothstep(t,.80,1));}
   p.velocity.set(0,0,0);p.grounded=false;p.sync();a.progress=t;
   if(t>=1){this.active=null;this.cooldown=.35;p.grounded=true;}return {landed:false};
  }
  if(a.type==='window-transfer'){
   const t=Math.min(1,a.elapsed/a.duration);p.position.copy(a.start).lerp(a.end,MathUtils.smootherstep(t,0,1));p.velocity.set(0,0,0);p.grounded=false;p.sync();a.progress=t;if(t>=1)this.hangWindow(a.window);return {landed:false};
  }
  if(a.type==='flip'){
   const result=p.step(dt,input,6.4);a.progress=Math.min(1,a.elapsed/.95);if(a.elapsed>=.95||result.landed){this.active=null;this.cooldown=.4;}return result;
  }
  if(a.type==='wall'){
   this.ray.origin.copy(p.position).y+=.9;this.ray.direction.copy(a.normal).negate();const support=p.world.rayIntersect(this.ray);if(!support||support.distance>.85){this.active=null;this.wallLock=1.5;this.cooldown=.4;return p.step(dt,input);}
   p.velocity.y=Math.max(p.velocity.y,-.75);const result=p.step(dt,{x:a.dir.x,z:a.dir.z},5.8);p.velocity.y=Math.max(p.velocity.y,-.75);a.phase+=dt;
   if(a.elapsed>.85||Math.hypot(input.x,input.z)<.15||p.grounded){this.active=null;this.wallLock=1.5;this.cooldown=.45;if(Math.hypot(input.x,input.z)>.15){p.velocity.addScaledVector(a.normal,3.6);if(p.grounded)p.requestJump();else p.velocity.y=10.4;this.active={type:'flip',elapsed:0,dir:a.dir.clone()};this.record('wall_dismount');}}return result;
  }
  if(a.type==='ledge'){
   const lateral=input.x*a.tangent.x+input.z*a.tangent.z,away=input.x*a.normal.x+input.z*a.normal.z;
   if(away>.65){this.active=null;this.cooldown=.8;p.velocity.copy(a.normal).multiplyScalar(1.5);p.velocity.y=-1;return {landed:false};}
   if(Math.abs(lateral)>.15){const next=a.edge.clone().addScaledVector(a.tangent,lateral*dt*.95),inside=next.clone().addScaledVector(a.dir,.3),h=p.ground(inside.x,inside.z,a.handY+.3,.65);if((a.window?Math.abs(next.clone().sub(a.window.edge).dot(a.tangent))<a.window.width/2-.25:h&&Math.abs(h.position.y-a.handY)<.25)){a.edge.copy(next);a.phase+=Math.abs(lateral)*dt;a.distance+=lateral*dt*.95;this.record('ledge_shimmy');}}
   const target=a.edge.clone().addScaledVector(a.normal,.42);target.y=a.handY-1.98;p.position.copy(a.entry).lerp(target,Math.min(1,a.elapsed*6));p.velocity.set(0,0,0);p.grounded=false;p.sync();return {landed:false};
  }
  const z=a.zone,axis=input.x*z.dir.x+input.z*z.dir.z;
  let move=Math.abs(axis)>.12?MathUtils.clamp(axis,-1,1):a.automatic?a.travelSign:0;
  if(Math.abs(axis)>.12)a.automatic=false;
  const desired=move*(a.type==='pole'?(move<0?1.15:z.speed):z.speed);
  a.speed=MathUtils.damp(a.speed||0,desired,9,dt);if(move===0&&Math.abs(a.speed)<.01)a.speed=0;
  a.distance=MathUtils.clamp(a.distance+(a.elapsed>.25?a.speed*dt:0),0,z.length);a.phase+=Math.abs(a.speed)*dt;a.motion=a.speed;
  const t=a.distance/z.length,target=new V();
  if(a.type==='monkey'){target.copy(z.start).lerp(z.end,t);target.y=z.handY-1.98;}
  if(a.type==='pole'){target.set(z.pole.x-a.dir.x*.38,z.start.y-a.distance,z.pole.z-a.dir.z*.38);}
  if(a.type==='net'){target.set(z.planeX+.42,z.start.y+a.distance,z.start.z);}
  p.position.copy(a.entry).lerp(target,MathUtils.smoothstep(a.elapsed,0,.35));p.velocity.set(0,0,0);p.grounded=false;p.sync();
  if(a.distance>=z.length-.001&&move>0)this.exit(z.end);
  else if(a.distance<=.001&&move<0&&a.elapsed>.4)this.exit(z.start);

  return {landed:false};
 }
 get animation(){
  const a=this.active;if(a&&advanced.has(a.type))return {mode:a.type,...a,progress:a.progress??(a.type==='flip'?Math.min(1,a.elapsed/.95):a.zone?a.distance/a.zone.length:0)};
  const base=super.animation;if(base?.mode==='roll')return {...base,mode:'land'};
  if(this.edgeBalance)return {mode:'balance',phase:0};return base;
 }
}
