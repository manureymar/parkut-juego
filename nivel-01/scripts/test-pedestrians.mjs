import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {PedestrianSimulation,makeRoute,routePosition,motionAt} from '../web/pedestrian-simulation.js';
const profiles=JSON.parse(await fs.readFile(new URL('../web/assets/pedestrians/manifest.json',import.meta.url)));
const routes=[];for(const x of [-20.3,20.3,-43.1,43.1])for(const [a,b] of [[-165,-93],[-46,14]])routes.push(makeRoute(routes.length,x,a,b));
assert.equal(profiles.length,7);assert.equal(profiles.reduce((n,p)=>n+p.clips.length,0),38);
for(const profile of profiles){assert(profile.clips.some(c=>c.name==='walk'));for(const c of profile.clips){assert(c.duration>0);assert(c.motion.every(([t,d])=>Number.isFinite(t)&&Number.isFinite(d)&&d>=0));assert(Math.abs(motionAt(c,c.duration)-c.distance)<1e-5);}}
const simulation=new PedestrianSimulation(profiles,routes,{seed:424242}),replay=new PedestrianSimulation(profiles,routes,{seed:424242}),different=new PedestrianSimulation(profiles,routes,{seed:424243});
assert.deepEqual(simulation.snapshot(),replay.snapshot());assert.notDeepEqual(simulation.snapshot(),different.snapshot());
let minGap=Infinity,minEuclideanGap=Infinity;const encountered=new Set();
for(let second=0;second<900;second++){
 simulation.update(1);const snapshot=simulation.snapshot();
 for(const p of snapshot.people){
  assert(Number.isFinite(p.x)&&Number.isFinite(p.z)&&p.clipTime>=0);encountered.add(p.category);
  assert(Math.abs(p.x)>19&&Math.abs(p.x)<45,'Stay on pedestrian corridors');
  assert(p.z<-91||p.z>-48,'No pedestrians across the T-junction vehicle branches');
  assert(Math.abs(Math.abs(p.x)-31)>8,'No walking in vehicle lanes');
  for(const other of snapshot.people)if(p.id!==other.id){const direct=Math.hypot(p.x-other.x,p.z-other.z);minEuclideanGap=Math.min(minEuclideanGap,direct);if(p.route===other.route){const route=routes[p.route],gap=(other.s-p.s+route.length)%route.length;minGap=Math.min(minGap,gap);assert(gap>=1.3499,'Maintain following distance');}}
 }
}
assert(minEuclideanGap>1.1,'No overlapping bodies in the rounded turns');
const final=simulation.snapshot(),coverage=profiles.map(profile=>{const used=new Set(final.people.filter(p=>p.model===profile.id).flatMap(p=>p.used));for(const c of profile.clips)assert(used.has(c.name),'Unused source clip: '+profile.id+' '+c.name);return {model:profile.id,sourceClips:profile.clips.length,playedClips:used.size};});
// Root motion is consumed once and the simulation is independent of frame rate.
const one=new PedestrianSimulation(profiles,routes,{seed:7}),many=new PedestrianSimulation(profiles,routes,{seed:7});one.update(5);for(let i=0;i<300;i++)many.update(1/60);
for(let i=0;i<one.people.length;i++)assert(Math.abs(one.people[i].s-many.people[i].s)<.035);
const single=new PedestrianSimulation(profiles,routes,{seed:3,count:1}),person=single.people[0];single.begin(person,profiles[0].clips.find(c=>c.name==='walk'));person.rate=1;const start=person.s;single.update(1);assert(Math.abs(person.s-start-motionAt(person.clip,person.clipTime)*person.scale)<1e-5);
const report={models:7,sourceClips:38,citizens:28,simulationSeconds:900,transitions:simulation.transitions,minimumFollowingDistance:minGap,minimumBodySeparation:minEuclideanGap,categories:[...encountered],coverage,reproducible:true};
await fs.writeFile(new URL('../../docs/pedestrian-simulation-verification.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
