import {Vector3,Ray,MathUtils} from 'three';

// Orbit is independent of the runner's orientation. Only an explicit recenter
// returns to the route, so looking around never fights an automatic camera.
export class FollowCamera {
 constructor(camera,world){this.camera=camera;this.world=world;this.anchor=new Vector3();this.yaw=0;this.pitch=.43;this.targetYaw=0;this.targetPitch=.43;this.distance=8.5;this.actualDistance=8.5;this.ray=new Ray();this.focus=new Vector3();this.desired=new Vector3();this.direction=new Vector3();}
 drag(dx,dy){this.targetYaw-=dx*.005;this.targetPitch=MathUtils.clamp(this.targetPitch+dy*.004,.10,1.10);}
 recenter(){this.targetYaw=0;this.targetPitch=.43;}
 movement(input){const c=Math.cos(this.yaw),s=Math.sin(this.yaw);return {x:input.x*c+input.z*s,z:-input.x*s+input.z*c};}
 update(dt,p,speed=0,snap=false){
  if(snap){this.anchor.copy(p);this.yaw=this.targetYaw;this.pitch=this.targetPitch;}else{
   this.anchor.x=MathUtils.damp(this.anchor.x,p.x,9,dt);this.anchor.z=MathUtils.damp(this.anchor.z,p.z,9,dt);
   if(Math.abs(p.y-this.anchor.y)>.025)this.anchor.y=MathUtils.damp(this.anchor.y,p.y,6,dt);
   this.yaw=MathUtils.damp(this.yaw,this.targetYaw,18,dt);this.pitch=MathUtils.damp(this.pitch,this.targetPitch,18,dt);
  }
  // The smoothed target must not lag inside a facade during a long fall.
  const head=p.clone().add(new Vector3(0,1.35,0)),lag=this.anchor.clone().add(new Vector3(0,1.35,0)).sub(head);
  if(lag.length()>.6)this.anchor.copy(p).addScaledVector(lag.normalize(),.6);
  this.ray.origin.copy(head);this.ray.direction.copy(this.anchor).add(new Vector3(0,1.35,0)).sub(head);const lagLength=this.ray.direction.length();this.ray.direction.normalize();const blocked=this.world.rayIntersect(this.ray);if(blocked&&blocked.distance<lagLength+.05)this.anchor.copy(p);
  this.focus.copy(this.anchor).y+=1.35;
  this.direction.set(Math.sin(this.yaw)*Math.cos(this.pitch),Math.sin(this.pitch),Math.cos(this.yaw)*Math.cos(this.pitch));
  let allowed=this.distance;
  // Centre and shoulder rays keep the camera outside roofs/walls while orbiting.
  for(const side of [-.18,0,.18]){this.ray.origin.copy(this.focus);this.ray.origin.x+=Math.cos(this.yaw)*side;this.ray.origin.z-=Math.sin(this.yaw)*side;this.ray.direction.copy(this.direction);const hit=this.world.rayIntersect(this.ray);if(hit&&hit.distance<allowed)allowed=Math.max(.35,hit.distance-.28);}
  // Briefly route the camera around an occluding corner, keeping orbit controls
  // independent. Choose a deterministic clear side instead of entering the mesh.
  if(allowed<1.25){let best=allowed,bestDirection=null;for(const offset of [.52,-.52,1.05,-1.05,1.57,-1.57,Math.PI]){const d=new Vector3(Math.sin(this.yaw+offset)*Math.cos(this.pitch),Math.sin(this.pitch),Math.cos(this.yaw+offset)*Math.cos(this.pitch));this.ray.origin.copy(this.focus);this.ray.direction.copy(d);const hit=this.world.rayIntersect(this.ray),space=hit?Math.min(this.distance,hit.distance-.35):this.distance;if(space>best){best=space;bestDirection=d;}if(best>3.5)break;}if(bestDirection){allowed=best;this.direction.copy(bestDirection);}}
  this.actualDistance=allowed<this.actualDistance||snap?allowed:MathUtils.damp(this.actualDistance,allowed,4,dt);
  this.desired.copy(this.focus).addScaledVector(this.direction,this.actualDistance);this.ray.origin.copy(head);this.ray.direction.copy(this.desired).sub(head);const sightDistance=this.ray.direction.length();this.ray.direction.normalize();const obstruction=this.world.rayIntersect(this.ray);if(obstruction&&obstruction.distance<sightDistance)this.desired.copy(head).addScaledVector(this.ray.direction,Math.max(.15,obstruction.distance-.22));this.camera.position.copy(this.desired);
  // A short look-ahead reveals the next landing while keeping the runner visible.
  const look=this.focus.clone(),ahead=1.25*this.actualDistance/this.distance;look.x-=Math.sin(this.yaw)*ahead;look.z-=Math.cos(this.yaw)*ahead;
  this.camera.lookAt(look);this.camera.fov=MathUtils.damp(this.camera.fov,64+Math.min(2,speed*.2),3,dt);this.camera.updateProjectionMatrix();
 }
 get state(){return {yaw:this.yaw,pitch:this.pitch,distance:this.actualDistance,targetYaw:this.targetYaw};}
}
