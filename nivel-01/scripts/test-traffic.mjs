import assert from 'node:assert/strict';import fs from 'node:fs/promises';import{TrafficSimulation}from'../web/traffic.js';
const routes=Array.from({length:8},(_,lane)=>({x:lane*3.05,startZ:lane%2?0:500,direction:lane%2?1:-1,length:500,stops:[{s:120,offset:lane%4},{s:280,offset:lane%4+6}]}));
const sim=new TrafficSimulation(routes);let minGap=Infinity,stopped=false,resumed=false,stopIds=new Set(),redCrossings=0;
for(let i=0;i<7200;i++){
 const before=sim.cars.map(c=>c.s),previousPhases=routes.map(r=>r.stops.map(s=>sim.phase(s)));sim.update(1/60);
 for(const c of sim.cars){if(c.speed<.05){stopped=true;stopIds.add(c.id);}if(stopIds.has(c.id)&&c.speed>3)resumed=true;const r=routes[c.lane];for(const other of sim.cars)if(other.id!==c.id&&other.lane===c.lane)minGap=Math.min(minGap,(other.s-c.s+r.length)%r.length-other.length);
  for(const [j,s] of r.stops.entries())if(previousPhases[c.lane][j]==='red'&&sim.phase(s)==='red'&&before[c.id]+c.length/2<s.s-.001&&c.s+c.length/2>s.s+.001&&c.s>before[c.id])redCrossings++;
 }
}
assert(minGap>=2.1,`Traffic overlap: ${minGap}`);assert(stopped&&resumed);assert.equal(redCrossings,0);assert.equal(new Set(sim.cars.map(c=>c.type)).size,4);
for(let lane=0;lane<8;lane++){const cars=sim.cars.filter(c=>c.lane===lane);for(let i=1;i<cars.length;i++)assert.notEqual(cars[i].type,cars[i-1].type);}
const report={cars:sim.cars.length,simulatedSeconds:120,minGap,stopped,resumed,redCrossings,types:[...new Set(sim.cars.map(c=>c.type))]};await fs.writeFile('docs/traffic-test-results.json',JSON.stringify(report,null,2)+'\n');console.log(report);
