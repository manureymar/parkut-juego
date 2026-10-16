import fs from 'node:fs/promises';import {Group,Vector3} from 'three';import assert from 'node:assert/strict';import {GLTFLoader} from '../web/vendor/examples/jsm/loaders/GLTFLoader.js';import {Octree} from '../web/vendor/examples/jsm/math/Octree.js';import {RunnerPhysics} from '../web/physics.js';import {Traversal,STAIRS,LADDERS} from '../web/traversal.js';import {LEVEL,SPAWN} from '../web/level.js';
const group=new Group();for(const b of LEVEL){const buf=await fs.readFile(`nivel-01/web/assets/${b.id}-collider.glb`),g=await new GLTFLoader().parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'');g.scene.scale.setScalar(b.scale);g.scene.position.set(b.offsetX,b.y,b.z);group.add(g.scene);}group.updateMatrixWorld(true);const p=new RunnerPhysics(new Octree().fromGraphNode(group)),tr=new Traversal(p),out=[];
const input={x:0,z:0},step=(n,i=input)=>{for(let k=0;k<n;k++)tr.step(1/120,i);};
const spawn=(x,z,y)=>{const h=p.ground(x,z,y??40,100);assert(h,'ground');p.teleport(new Vector3(x,h.position.y+.03,z));tr.reset();step(90);};
spawn(SPAWN.x,SPAWN.z);const before=p.position.clone();step(2400);out.push({test:'stationary-20-seconds',drift:before.distanceTo(p.position),p:p.position.toArray()});assert(before.distanceTo(p.position)<.0001,'Idle drift');
for(const [i,r]of STAIRS.entries()){
 const d=r.b.clone().sub(r.a).setY(0).normalize(),start=r.a.clone().addScaledVector(d,-.4);spawn(start.x,start.z,r.a.y+1);
 let maxY=p.position.y;const states=new Set();let n=0;for(;n<800;n++){tr.step(1/120,{x:d.x*.5,z:d.z*.5});maxY=Math.max(maxY,p.position.y);if(p.onStairs)states.add('stairs');if(p.position.clone().sub(r.b).dot(d)>-.1)break;}
 out.push({test:`stairs-${i}`,passed:n<800,maxY,target:r.b.y,position:p.position.toArray(),states:[...states]});console.log(out.at(-1));assert(n<800&&maxY>r.b.y-.2&&states.has('stairs'),'Stair ascent failed');
}
const l=LADDERS[0];spawn(l.base.x,l.base.z+.15,l.base.y+.3);step(60);step(150,{x:0,z:-1});assert(tr.active?.type==='ladder','Tank ladder must attach from forward input');const frozen=p.position.clone();step(120);assert(p.position.distanceTo(frozen)<.001,'Stopped ladder must hold');for(let i=0;i<600&&tr.active;i++)tr.step(1/120,{x:0,z:-1});step(60);out.push({test:'tank-ladder',position:p.position.toArray(),target:l.exit.toArray(),history:tr.history});console.log(out.at(-1));assert(p.position.y>l.exit.y-.5,'Tank exit must be on top');
spawn(-2,4);p.position.y+=3.4;p.grounded=false;tr.fallTop=p.position.y;let rolled=false;for(let i=0;i<280;i++){tr.step(1/120,{x:0,z:0});if(tr.animation?.mode==='roll')rolled=true;}out.push({test:'landing-roll',rolled});assert(rolled,'Hard fall must use dive roll');
// Auto-jump must cross the first gap without a jump/action command.
spawn(1.5,LEVEL[0].exitZ+3);step(190,{x:0,z:-1});out.push({test:'automatic-gap',p:p.position.toArray(),history:tr.history});console.log(out.at(-1));assert(p.position.z<LEVEL[1].entryZ-.5&&p.position.y>-1,'Automatic gap jump');
// A container's edge should start a mantle using forward intent only.
let found=null;const container=LEVEL.find(b=>b.id==='roof-03');
outer:for(let x=-3;x<=3;x+=.3)for(let z=container.entryZ-2;z>container.exitZ+1;z-=.3){const h=p.ground(x,z,container.height+1.5,2);if(!h)continue;p.teleport(new Vector3(x,h.position.y+.03,z));tr.reset();step(60);const target=p.mantleTarget(new Vector3(0,0,-1));if(target){found={x,z,target};console.log('mantle fixture',found);break outer;}}
assert(found,'A reachable container edge must exist');spawn(found.x,found.z);step(2,{x:0,z:-1});assert.equal(tr.active?.type,'mantle');step(190);out.push({test:'automatic-mantle',start:[found.x,found.z],end:p.position.toArray()});
await fs.writeFile('docs/traversal-test-results.json',JSON.stringify(out,null,2));console.log('ALL',out);
