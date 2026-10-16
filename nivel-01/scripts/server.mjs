import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../web');
export async function startServer(port=8080){
 const server=http.createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://localhost'),rel=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);
   const file=path.resolve(root,'.'+rel);if(!file.startsWith(root+path.sep))throw new Error('Path');
   const data=await fs.readFile(file),type={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.webp':'image/webp','.json':'application/json','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream';
   res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-cache'});res.end(data);
  }catch(e){res.writeHead(404);res.end('Not found');}
 });await new Promise(r=>server.listen(port,'127.0.0.1',r));return server;
}
if(process.argv[1]===import.meta.filename){await startServer(Number(process.env.PORT||8080));console.log('Parkut: http://127.0.0.1:8080');}
