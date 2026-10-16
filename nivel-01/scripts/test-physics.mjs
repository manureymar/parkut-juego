import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {Group,Vector3,Ray} from 'three';
import {GLTFLoader} from '../web/vendor/examples/jsm/loaders/GLTFLoader.js';
import {Octree} from '../web/vendor/examples/jsm/math/Octree.js';
import {RunnerPhysics} from '../web/physics.js';
import {LEVEL,SPAWN,GOAL} from '../web/level.js';
const root=path.resolve(import.meta.dirname,'../..'),group=new Group(),loader=new GLTFLoader();
for(const b of LEVEL){const buf=await fs.readFile(path.join(root,'nivel-01/web/assets',b.id+'-collider.glb'));const g=await loader.parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'');g.scene.scale.setScalar(b.scale);g.scene.position.set(b.offsetX,b.y,b.z);group.add(g.scene);}
group.updateMatrixWorld(true);const world=new Octree().fromGraphNode(group),p=new RunnerPhysics(world),results=[];
function spawn(x,z){const h=p.ground(x,z,40,100);assert(h,'Ground under spawn');p.teleport(new Vector3(x,h.position.y+.03,z));for(let i=0;i<60;i++)p.step(1/120,{x:0,z:0});}
spawn(SPAWN.x,SPAWN.z);const start=p.position.clone();
for(let i=0;i<180;i++)p.step(1/120,{x:0,z:-1});
results.push({test:'walk-over-start-grating',start:start.toArray(),end:p.position.toArray(),distance:start.distanceTo(p.position)});
console.log(results.at(-1));assert(start.z-p.position.z>4,'Movement must advance over low roof details');
spawn(-2,4);p.requestJump();let peak=p.position.y;for(let i=0;i<180;i++){p.step(1/120,{x:0,z:-.5});peak=Math.max(peak,p.position.y);}
results.push({test:'jump-and-land',peak,end:p.position.toArray(),grounded:p.grounded});console.log(results.at(-1));assert(peak>1.8&&p.grounded,'Jump must rise then land');
for(let i=0;i<LEVEL.length-1;i++){
 const b=LEVEL[i],next=LEVEL[i+1],x=b.route.at(-1).x;
 spawn(x,b.exitZ+2.0);let jumped=false,minY=50,peak=-50;
 for(let frame=0;frame<210;frame++){
  if(!jumped&&p.position.z<b.exitZ+1.5){p.requestJump();jumped=true;}
  const tx=next.route[0].x,dx=tx-p.position.x;
  p.step(1/120,{x:Math.abs(dx)>.15?Math.sign(dx)*Math.min(.6,Math.abs(dx)) :0,z:-1});
  minY=Math.min(minY,p.position.y);peak=Math.max(peak,p.position.y);
 }
 const ok=p.position.z<next.entryZ-.4&&p.position.y>-2;
 results.push({test:`gap-${i+1}-${i+2}`,ok,jumped,minY,peak,end:p.position.toArray(),nextEntry:next.entryZ});console.log(results.at(-1));
}
const hole=LEVEL[5],holeGround=p.ground(0,hole.z,40,100),sideGround=p.ground(-4.05,hole.z,40,100);
results.push({test:'hole-and-side-ledge',holeY:holeGround?.position.y,ledgeY:sideGround?.position.y});console.log(results.at(-1));assert(sideGround.position.y-holeGround.position.y>5,'Hole must stay open');
await fs.writeFile(path.join(root,'docs/physics-test-results.json'),JSON.stringify(results,null,2));
if(results.some(r=>r.ok===false))process.exitCode=1;
