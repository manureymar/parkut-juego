import {Vector3,Ray} from 'three';
import {Capsule} from './vendor/examples/jsm/math/Capsule.js';

export class RunnerPhysics {
 constructor(octree){
  this.world=octree;this.position=new Vector3();this.velocity=new Vector3();
  this.radius=.27;this.height=1.70;this.capsule=new Capsule(new Vector3(),new Vector3(),this.radius);
  this.grounded=false;this.coyote=0;this.jumpBuffer=0;this.landed=false;this.stepHeight=0;
  this.ray=new Ray();this.tmp=new Vector3();this.target=new Vector3();this.timer=0;
 }
 sync(){this.capsule.start.copy(this.position).y+=this.radius;this.capsule.end.copy(this.position).y+=this.height-this.radius;}
 teleport(p){this.position.copy(p);this.velocity.set(0,0,0);this.grounded=false;this.coyote=0;this.jumpBuffer=0;this.sync();}
 ground(x,z,top,maxDistance=100){this.ray.origin.set(x,top,z);this.ray.direction.set(0,-1,0);const h=this.world.rayIntersect(this.ray);return h&&h.distance<maxDistance&&h.triangle.getNormal(this.tmp).y>.40?h:null;}
 requestJump(){this.jumpBuffer=.16;}
 step(dt,input,speed=6.4){
  this.landed=false;this.stepHeight=0;this.timer+=dt;this.jumpBuffer-=dt;
  if(this.grounded)this.coyote=.12;else this.coyote-=dt;
  this.target.set(input.x,0,input.z);if(this.target.length()>1)this.target.normalize();this.target.multiplyScalar(speed);
  const accel=this.grounded?16:5.5,blend=1-Math.exp(-accel*dt);
  this.velocity.x+=(this.target.x-this.velocity.x)*blend;this.velocity.z+=(this.target.z-this.velocity.z)*blend;
  if(this.jumpBuffer>0&&this.coyote>0){this.velocity.y=10.4;this.grounded=false;this.coyote=0;this.jumpBuffer=0;}
  this.velocity.y-=22*dt;
  const wasGrounded=this.grounded,impact=this.velocity.y;
  // Small stairs are stepped onto; taller obstacles require a jump or a mantle.
  if(wasGrounded&&this.velocity.y<=0){
   const horizontal=Math.hypot(this.velocity.x,this.velocity.z),ahead=horizontal>.1?this.radius+.08:0;
   const nextX=this.position.x+this.velocity.x*dt+(horizontal?this.velocity.x/horizontal*ahead:0),nextZ=this.position.z+this.velocity.z*dt+(horizontal?this.velocity.z/horizontal*ahead:0);
   const h=this.ground(nextX,nextZ,this.position.y+.43,.62);
   if(h){const rise=h.position.y-this.position.y;if(rise>.008&&rise<=.40){this.position.y+=rise+.009;this.stepHeight=rise;this.velocity.y=0;}}
  }
  this.position.addScaledVector(this.velocity,dt);this.sync();this.grounded=false;
  for(let i=0;i<4;i++){
   const hit=this.world.capsuleIntersect(this.capsule);if(!hit)break;
   if(hit.normal.y>.48){this.grounded=true;if(this.velocity.y<0)this.velocity.y=0;}
   const dot=this.velocity.dot(hit.normal);if(dot<0)this.velocity.addScaledVector(hit.normal,-dot);
   this.tmp.copy(hit.normal).multiplyScalar(hit.depth+.0005);this.capsule.translate(this.tmp);this.position.add(this.tmp);
  }
  if(!this.grounded&&wasGrounded&&this.velocity.y<=0){
   const h=this.ground(this.position.x,this.position.z,this.position.y+.10,.27);
   if(h&&h.position.y<=this.position.y+.03){this.position.y=h.position.y+.009;this.velocity.y=0;this.grounded=true;this.sync();}
  }
  this.landed=this.grounded&&!wasGrounded&&impact<-2;
  return {landed:this.landed,impact,stepHeight:this.stepHeight};
 }
 mantleTarget(direction){
  const dir=direction.clone().setY(0).normalize();
  // A wall must be present, and its top must be reachable and have standing room.
  this.ray.origin.copy(this.position).y+=.8;this.ray.direction.copy(dir);
  const wall=this.world.rayIntersect(this.ray);if(!wall||wall.distance>1.05)return null;
  const p=wall.position.clone().addScaledVector(dir,.46),h=this.ground(p.x,p.z,this.position.y+2.9,3.1);
  if(!h)return null;const rise=h.position.y-this.position.y;
  if(rise<.45||rise>2.65)return null;
  p.y=h.position.y+.035;
  const test=new Capsule(p.clone().add(new Vector3(0,.28,0)),p.clone().add(new Vector3(0,1.43,0)),.25);
  const collision=this.world.capsuleIntersect(test);if(collision&&collision.depth>.08)return null;
  return {end:p,rise};
 }
}
