import {chromium} from 'playwright';import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {startServer} from './server.mjs';
const out='test-results/v03';await fs.mkdir(out,{recursive:true});const server=await startServer(8084),browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});page.on('console',m=>{if(m.type()==='error'){errors.push(m.text());console.error(m.text());}});
 await page.goto('http://127.0.0.1:8084/?test=1');await page.waitForFunction(()=>window.parkut?.getState().loaded,{},{timeout:180000});
 await page.evaluate(()=>{parkut.test.start();parkut.test.pause();document.getElementById('menu').style.display='none';document.body.classList.remove('is-paused');document.getElementById('hint').classList.remove('show');document.getElementById('loading').style.display='none';});
 const advance=(s,input={x:0,z:0})=>page.evaluate(({s,input})=>parkut.test.advance(s,input),{s,input});
 let s=await advance(1);assert(s.animations.some(a=>a.name==='idle'&&a.duration>15));assert(s.animations.some(a=>a.name==='jump'));assert.equal(s.traffic.total,72);assert.equal(s.traffic.types.length,4);
 await page.screenshot({path:out+'/01-nivel.png'});const idleStart=s.position;
 s=await advance(8);assert.deepEqual(s.position,idleStart);assert.equal(s.animation,'idle');
 // Actual canvas pointer drag must rotate the view while the runner stands still.
 await page.evaluate(()=>parkut.test.resume());await page.mouse.move(260,390);await page.mouse.down();await page.mouse.move(365,430,{steps:8});await page.mouse.up();await page.evaluate(()=>parkut.test.pause());
 s=await advance(.05);assert(Math.abs(s.orbit.yaw)>.35);assert(Math.hypot(s.position[0]-idleStart[0],s.position[2]-idleStart[2])<.02);await page.screenshot({path:out+'/02-camara-lateral.png'});
 await page.evaluate(()=>{const p=parkut.test.ground(7,6);parkut.test.teleport(7,p[1]+.03,6);parkut.test.recenter();parkut.test.look(314,62);});await page.screenshot({path:out+'/03-ciudad-trafico.png'});
 const trafficA=await page.evaluate(()=>parkut.test.traffic()),trafficB=await page.evaluate(()=>parkut.test.advanceTraffic(12));assert(trafficB.cars.some((c,i)=>Math.abs(c.s-trafficA.cars[i].s)>20));assert(trafficB.cars.some(c=>c.speed<.5));
 // Normal jump: supplied clip is used, and landing on the same roof is not a roll.
 await page.evaluate(()=>{const p=parkut.test.ground(0,7.3);parkut.test.teleport(0,p[1]+.03,7.3);parkut.test.advance(.4);parkut.test.recenter();parkut.test.resume();parkut.test.jump();parkut.test.pause();});
 const jumps=[];for(let i=0;i<12;i++){const frame=await advance(.10);jumps.push({y:frame.position[1],animation:frame.animation,action:frame.action?.mode});if(i===3)await page.screenshot({path:out+'/04-salto.png'});}
 assert(jumps.some(f=>f.animation==='jump'));assert(!jumps.some(f=>f.action==='roll'));assert(Math.max(...jumps.map(f=>f.y))>1.8);
 const l=await page.evaluate(()=>parkut.test.ladders[0]);await page.evaluate(l=>{parkut.test.teleport(l.base.x,l.base.y+.04,l.base.z+.13);},l);await advance(.5);s=await advance(1.8,{x:l.facing.x,z:l.facing.z});assert.equal(s.action?.mode,'ladder');
 await page.screenshot({path:out+'/05-escalera.png'});assert(s.ladderIK.filter(i=>/Hand/.test(i.bone)).every(i=>i.error<.16),JSON.stringify(s.ladderIK));
 const ladder=s;const held=await advance(1);assert.deepEqual(held.position,s.position);await advance(3,{x:l.facing.x,z:l.facing.z});await page.screenshot({path:out+'/06-tanque.png'});
 // Check the route at the approach that was hidden in the user's recording.
 const b=await page.evaluate(()=>parkut.test.level[1]);await page.evaluate(b=>{const x=b.route.at(-2).x,z=b.route.at(-2).z,p=parkut.test.ground(x,z,b.height+4);parkut.test.teleport(x,p[1]+.03,z);parkut.test.recenter();},b);await advance(.4);await page.screenshot({path:out+'/07-proximo-edificio.png'});
 assert.deepEqual(errors,[]);const report={version:s.version,errors,normalJump:jumps,traffic:{count:trafficB.count,types:[...new Set(trafficB.cars.map(c=>c.type))],stopped:trafficB.cars.filter(c=>c.speed<.5).length},ladderIK:ladder.ladderIK};await fs.writeFile('docs/v03-test-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();server.close();}
