import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import {startServer} from './server.mjs';
const server=await startServer();
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:900,height:900}});page.on('pageerror',e=>console.error(e));
await page.goto('http://127.0.0.1:8080/inspect.html');await page.waitForFunction(()=>!!window.loadModel);
const data=[];
await fs.mkdir('../../model-previews',{recursive:true});
for(const id of ['runner','roof-01','roof-02','roof-03','roof-04','roof-05','roof-06','roof-07']){
 const info=await page.evaluate(id=>window.loadModel(id),id);data.push({id,...info});
 await page.screenshot({path:`../../model-previews/${id}.png`});
 if(id!=='runner'){await page.evaluate(id=>window.loadModel(id,'top'),id);await page.screenshot({path:`../../model-previews/${id}-top.png`}); data.at(-1).grid=await page.evaluate(()=>window.groundGrid());}
 else for(const name of info.animations.map(a=>a.name)){await page.evaluate(name=>window.showClip(name,.25),name);await page.screenshot({path:`../../model-previews/anim-${name.replaceAll(' ','-')}.png`});}
 console.log(id);
}
await fs.writeFile('../../model-previews/info.json',JSON.stringify(data,null,2));await browser.close();server.close();
