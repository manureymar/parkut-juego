import {chromium} from 'playwright';import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {startServer} from './server.mjs';
const server=await startServer(8094),browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{const page=await browser.newPage({viewport:{width:480,height:880}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8094/?test=1');await page.waitForFunction(()=>window.parkut?.getState().loaded,{},{timeout:120000});
const report=await page.evaluate(()=>{
 const t=parkut.test,course=t.course(),level=t.level,log=[];t.reset();t.pause();t.stepPhysics(.5);let total=0;
 const jump=()=>{t.resume();t.jump();t.pause();};
 const finishAction=()=>{let s=parkut.getState();for(let i=0;i<400&&['monkey','pole','net'].includes(s.action?.mode);i++){const z=s.action.zone;s=t.stepPhysics(.1,{x:z.dir.x,z:z.dir.z});total+=.1;}t.stepPhysics(.8);return parkut.getState();};
 const move=(x,z,label)=>{let stalled=0,last=Infinity;for(let i=0;i<300;i++){
  let s=parkut.getState();if(['monkey','pole','net'].includes(s.action?.mode)){s=finishAction();log.push({label,crossed:true,position:s.position,checkpoint:s.checkpointIndex});return true;}
  if(s.action?.mode==='ledge'){jump();s=t.stepPhysics(.8);}
  const dx=x-s.position[0],dz=z-s.position[2],d=Math.hypot(dx,dz);if(d<.48){log.push({label,position:s.position,checkpoint:s.checkpointIndex});return true;}
  stalled=d>last-.035?stalled+1:0;last=d;if(stalled>8&&s.grounded){jump();stalled=0;}
  s=t.stepPhysics(.1,{x:dx/d,z:dz/d});total+=.1;
  if(s.position[1]<-8&&!label.startsWith('street')&&!label.startsWith('net')){log.push({label,failed:'fell',position:s.position,target:[x,z]});return false;}
 }
 log.push({label,failed:'stuck',state:parkut.getState(),target:[x,z]});return false;};
 const route=(index,exceptLast=false)=>{const points=exceptLast?level[index].route.slice(0,-1):level[index].route;for(const [i,p] of points.entries())if(!move(p.x,p.z,'roof-'+index+'-'+i))return false;return true;};
 let ok=route(0,true);const bars=course.zones.find(z=>z.id==='sky-bars');if(ok)ok=move(bars.start.x,bars.start.z,'bars-approach');if(ok){t.stepPhysics(.6,{x:bars.dir.x,z:bars.dir.z});finishAction();}
 const pole=course.zones.find(z=>z.id==='promenade-pole');if(ok)ok=move(level[1].offsetX+4,pole.start.z,'pole-platform');if(ok)ok=move(pole.start.x,pole.start.z,'pole-approach');if(ok){t.stepPhysics(.5,{x:1,z:0});finishAction();}
 if(ok)ok=move(20.3,-34,'street-checkpoint');const net=course.zones.find(z=>z.id==='return-net');if(ok)ok=move(20.3,net.start.z,'street-to-net');if(ok)ok=move(net.start.x,net.start.z,'net-approach');if(ok){t.stepPhysics(.5,{x:-1,z:0});finishAction();}
 if(ok)ok=move(level[2].offsetX+5,net.start.z,'return-deck');
 for(let i=2;i<7&&ok;i++)ok=route(i);
 if(ok)ok=move(t.goal.x,t.goal.z,'goal');t.stepPhysics(.5);t.simulate(0);return {ok,simulatedSeconds:total,log,final:parkut.getState()};
});await fs.writeFile('test-results/v05/route.json',JSON.stringify({...report,errors},null,2));await page.screenshot({path:'test-results/v05/route-final.png'});console.log(JSON.stringify({ok:report.ok,completed:report.final.completed,checkpoint:report.final.checkpointIndex,last:report.log.slice(-4),errors}));assert.deepEqual(errors,[]);assert(report.ok&&report.final.completed,'Full route is not completable with normal movement and context actions');await fs.writeFile('docs/parkour-route-verification.json',JSON.stringify({...report,errors},null,2));
}finally{await browser.close();server.close();}
