import {chromium} from 'playwright';import fs from 'node:fs/promises';import sharp from 'sharp';import assert from 'node:assert/strict';import {startServer} from './server.mjs';
const out='test-results/pedestrians';await fs.mkdir(out,{recursive:true});const server=await startServer(8086),browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:400,height:480}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8086/pedestrian-lab.html');await page.waitForFunction(()=>window.ready);const profiles=await page.evaluate(()=>review.profiles),results=[];
 for(let i=0;i<profiles.length;i++){
  const clips=await page.evaluate(i=>review.load(i),i),images=[];
  for(const [row,clip] of clips.entries())for(const [col,fraction] of [0,.24,.53,.81,.99].entries()){
   const time=clip.duration*fraction,pose=await page.evaluate(({name,time})=>review.pose(name,time),{name:clip.name,time});results.push({model:profiles[i].id,clip:clip.name,time,...pose});
   images.push({input:await sharp(await page.screenshot()).resize(240,288).toBuffer(),left:col*240,top:row*288});
  }
  await sharp({create:{width:1200,height:clips.length*288,channels:3,background:'#a5b7c5'}}).composite(images).jpeg({quality:88}).toFile(out+'/'+profiles[i].id+'.jpg');console.log(profiles[i].id,clips.length,'clips reviewed');
 }
 await fs.writeFile(out+'/poses.json',JSON.stringify(results,null,2));assert.deepEqual(errors,[]);assert(results.every(p=>Number.isFinite(p.min)&&p.min>-.035&&p.min<.04),'Support clearance outside tolerance');
 const report={models:profiles.length,clips:profiles.reduce((n,p)=>n+p.clips.length,0),poses:results.length,minClearance:Math.min(...results.map(p=>p.min)),maxClearance:Math.max(...results.map(p=>p.min)),errors};await fs.writeFile('docs/pedestrian-animation-verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();server.close();}
