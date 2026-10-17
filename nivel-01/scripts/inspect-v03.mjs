import{chromium}from'playwright';import{startServer}from'./server.mjs';import fs from'node:fs/promises';
const server=await startServer(8085),browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{const page=await browser.newPage({viewport:{width:900,height:900}});page.on('pageerror',e=>console.error(e.message));await page.goto('http://127.0.0.1:8085/?test=1');await page.waitForFunction(()=>parkut?.getState().loaded,{},{timeout:180000});await page.evaluate(()=>{parkut.test.start();parkut.test.pause();document.querySelectorAll('#menu,#loading,#hint,#checkpoint,#hud,#controls').forEach(n=>n.style.display='none');});
 await page.evaluate(()=>parkut.test.viewpoint([100,100,80],[0,-12,-90]));await page.screenshot({path:'test-results/v03/overview.png'});
 await page.evaluate(()=>parkut.test.viewpoint([40,8,35],[31,-25,-22]));await page.screenshot({path:'test-results/v03/street.png'});
 const info=await page.evaluate(()=>{const l=parkut.test.ladders[0];parkut.test.teleport(l.base.x,l.base.y+.04,l.base.z+.13);parkut.test.advance(.5);return parkut.test.advance(1.8,{x:l.facing.x,z:l.facing.z});});console.log(JSON.stringify({ik:info.ladderIK,orbit:info.orbit,traffic:info.traffic}));
 await page.evaluate(()=>{const l=parkut.test.ladders[0];parkut.test.viewpoint([l.base.x+4,l.base.y+4,l.base.z+4],[l.base.x,l.base.y+3,l.base.z-.4]);});await page.screenshot({path:'test-results/v03/ladder-detail.png'});
}finally{await browser.close();server.close();}
