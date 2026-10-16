import {Vector3,Ray} from 'three';
import {Capsule} from './vendor/examples/jsm/math/Capsule.js';
import {stairSurface} from './traversal.js';
const SKIN=.025;
export class RunnerPhysics {
 constructor(octree){this.world=octree;this.position=new Vector3();this.velocity=new Vector3();this.radius=.27;this.height=1.70;this.capsule=new Capsule(new Vector3(),new Vector3(),this.radius);this.grounded=false;this.coyote=0;this.jumpBuffer=0;this.landed=false;this.stepHeight=0;this.onStairs=false;this.ray=new Ray();this.tmp=new Vector3();this.target=new Vector3();}
 sync(bodyOnly=false){this.capsule.start.copy(this.position).y+=this.radius+(bodyOnly ? .23 : 0);this.capsule.end.copy(this.position).y+=this.height-this.radius;}
 teleport(p){this.position.copy(p);this.velocity.set(0,0,0);this.grounded=false;this.coyote=0;this.jumpBuffer=0;this.sync();}
 ground(x,z,top,maxDistance=100){
  this.ray.origin.set(x,top,z);this.ray.direction.set(0,-1,0);let h=this.world.rayIntersect(this.ray);
  if(!h||h.distance>=maxDistance||h.triangle.getNormal(this.tmp).y<.40)h=null;
  const s=stairSurface(x,z);if(s&&s.y<=top&&top-s.y<maxDistance&&(!h||Math.abs(h.position.y-s.y)<.55))return {position:new Vector3(x,s.y,z),distance:top-s.y,stairs:true};
  return h;
 }
 requestJump(){this.jumpBuffer=.16;}
 step(dt,input,speed=6.4){
  this.landed=false;this.stepHeight=0;this.jumpBuffer-=dt;
  if(this.grounded)this.coyote=.12;else this.coyote-=dt;
  const wasGrounded=this.grounded,oldY=this.position.y;
  this.target.set(input.x,0,input.z);if(this.target.length()>1)this.target.normalize();this.target.multiplyScalar(speed);
  const blend=1-Math.exp(-(this.grounded?20:6)*dt);this.velocity.x+=(this.target.x-this.velocity.x)*blend;this.velocity.z+=(this.target.z-this.velocity.z)*blend;
  // A resting capsule has a stable support: gravity must not slide it across the
  // tiny triangles in a reconstructed grate or repeatedly kick it up/down.
  if(this.grounded&&this.target.lengthSq()<.0001&&Math.hypot(this.velocity.x,this.velocity.z)<.035&&this.jumpBuffer<=0){this.velocity.set(0,0,0);return {landed:false,impact:0,stepHeight:0};}
  if(this.jumpBuffer>0&&this.coyote>0){this.velocity.y=10.4;this.grounded=false;this.coyote=0;this.jumpBuffer=0;}
  if(!this.grounded)this.velocity.y-=22*dt;else this.velocity.y=0;
  const impact=this.velocity.y;
  this.position.x+=this.velocity.x*dt;this.position.z+=this.velocity.z*dt;this.position.y+=this.velocity.y*dt;
  const stair=stairSurface(this.position.x,this.position.z);this.onStairs=!!stair&&wasGrounded&&Math.abs(stair.y-oldY)<.55&&this.velocity.y<=0;
  let support=this.ground(this.position.x,this.position.z,Math.max(oldY,this.position.y)+.48,Math.max(.8,oldY-this.position.y+.7));
  if(wasGrounded&&this.velocity.y<=0){
   // Step up risers before their vertical face reaches the capsule.
   const horizontal=Math.hypot(this.velocity.x,this.velocity.z);
   if(horizontal>.1&&!this.onStairs){const h=this.ground(this.position.x+this.velocity.x/horizontal*.26,this.position.z+this.velocity.z/horizontal*.26,oldY+.46,.70);
    if(h&&h.position.y>this.position.y+.015&&h.position.y-oldY<.44){this.stepHeight=h.position.y-oldY;this.position.y=h.position.y+SKIN;}}
   if(this.onStairs){this.position.y=stair.y+SKIN;this.velocity.y=0;}
  }
  // Ground is resolved by a swept vertical support query, walls by the capsule.
  // Excluding the sole while supported avoids converting slope noise into drift.
  this.sync(wasGrounded&&this.velocity.y<=0);this.grounded=false;
  if(!this.onStairs)for(let i=0;i<4;i++){
   const h=this.world.capsuleIntersect(this.capsule);if(!h)break;
   if(h.normal.y>.45){if(this.velocity.y<=0){this.position.y+=h.normal.y*h.depth+SKIN;this.velocity.y=0;this.grounded=true;}this.sync(true);break;}
   const n=h.normal.clone();if(wasGrounded&&n.y>0)n.y=0;n.normalize();
   const dot=this.velocity.dot(n);if(dot<0)this.velocity.addScaledVector(n,-dot);
   this.tmp.copy(n).multiplyScalar(h.depth+.001);this.position.add(this.tmp);this.capsule.translate(this.tmp);
  }
  support=this.ground(this.position.x,this.position.z,Math.max(oldY,this.position.y)+.12,Math.max(.8,oldY-this.position.y+.8));
  if(this.velocity.y<=0&&support){const gap=this.position.y-support.position.y;
   if(gap<= (wasGrounded ? .38 : .08)&&support.position.y<=oldY+.45){this.position.y=support.position.y+SKIN;this.velocity.y=0;this.grounded=true;this.onStairs=!!support.stairs;}
  }
  if(!this.grounded&&wasGrounded&&this.velocity.y===0)this.velocity.y=-22*dt;
  this.sync();this.landed=this.grounded&&!wasGrounded&&impact<-2;
  return {landed:this.landed,impact,stepHeight:this.stepHeight};
 }
 mantleTarget(direction){
  const dir=direction.clone().setY(0).normalize();if(dir.lengthSq()<.5)return null;
  this.ray.origin.copy(this.position).y+=.85;this.ray.direction.copy(dir);const wall=this.world.rayIntersect(this.ray);if(!wall||wall.distance>.80)return null;
  const p=wall.position.clone().addScaledVector(dir,.65),h=this.ground(p.x,p.z,this.position.y+3.05,3.3);if(!h)return null;
  const rise=h.position.y-this.position.y;if(rise<.50||rise>2.85)return null;
  p.y=h.position.y+SKIN;
  const test=new Capsule(p.clone().add(new Vector3(0,.35,0)),p.clone().add(new Vector3(0,1.43,0)),.25),hit=this.world.capsuleIntersect(test);
  if(hit&&hit.depth>.10)return null;return {end:p,rise};
 }
}
