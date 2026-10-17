import * as T from 'three';
import {mergeGeometries} from './vendor/examples/jsm/utils/BufferGeometryUtils.js';
import {STREET_Y} from './city.js';
const V=T.Vector3;
export async function createParkourCourse(scene,loader,level,physics,collisionGroup,city){
 const group=new T.Group();group.name='Recorrido de parkour 0.5';scene.add(group);
 const profiles=await(await fetch('./assets/parkour/manifest.json')).json(),sources=new Map(),objects=[],zones=[],checkpoints=[];
 for(const profile of profiles){const [visible,solid]=await Promise.all([loader.loadAsync('./assets/parkour/'+profile.id+'.glb'),loader.loadAsync('./assets/parkour/'+profile.id+'-collider.glb')]);sources.set(profile.id,{visible:visible.scene,solid:solid.scene,...profile});}
 const masonry=await new T.TextureLoader().loadAsync('./assets/environment/sidewalk.webp');masonry.colorSpace=T.SRGBColorSpace;masonry.wrapS=masonry.wrapT=T.RepeatWrapping;masonry.anisotropy=4;
 const metal=new T.MeshStandardMaterial({color:0x34464b,roughness:.7,metalness:.3}),yellow=new T.MeshStandardMaterial({color:0xe9b844,roughness:.6}),concrete=new T.MeshStandardMaterial({map:masonry,color:0xc1bba9,roughness:.95});
 const box=(x,y,z,w,h,d,material=metal,solid=true)=>{const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material);if(material===concrete){const uv=mesh.geometry.attributes.uv,n=mesh.geometry.attributes.normal;for(let i=0;i<uv.count;i++){const width=Math.abs(n.getX(i))>.5?d:w;uv.setXY(i,uv.getX(i)*width/2,uv.getY(i)*h/2);}}mesh.position.set(x,y+h/2,z);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);if(solid)collisionGroup.add(mesh.clone());return mesh;};
 const rail=(a,b,r=.055,material=yellow,solid=false)=>{const delta=b.clone().sub(a),mesh=new T.Mesh(new T.CylinderGeometry(r,r,delta.length(),8),material);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new V(0,1,0),delta.normalize());mesh.castShadow=true;group.add(mesh);if(solid)collisionGroup.add(mesh.clone());return mesh;};
 const place=(id,p,size,angle=0,solid=true)=>{
  const src=sources.get(id),min=new V(...src.bounds.min),max=new V(...src.bounds.max),extent=max.clone().sub(min),center=min.clone().add(max).multiplyScalar(.5);let visual;
  for(const [source,isSolid] of [[src.visible,false],[src.solid,true]]){if(isSolid&&!solid)continue;const pivot=new T.Group(),m=source.clone(true);m.scale.set(size[0]/extent.x,size[1]/extent.y,size[2]/extent.z);m.position.set(-center.x*m.scale.x,-min.y*m.scale.y,-center.z*m.scale.z);pivot.add(m);pivot.position.copy(p);pivot.rotation.y=angle;
   if(isSolid)collisionGroup.add(pivot);else{group.add(pivot);visual=pivot;pivot.traverse(n=>{if(n.isMesh){n.castShadow=n.receiveShadow=true;n.material.envMapIntensity=.55;}});}}
  objects.push({id,position:p.toArray(),size,angle});return visual;
 };
 const roofY=(b,x,z)=>physics.ground(x,z,b.height+4,6)?.position.y??b.height;
 const pad=(p,w=2.5,d=2.5)=>box(p.x,p.y-.17,p.z,w,.20,d);
 const deck=(a,b,width=1.35)=>{const delta=b.clone().sub(a),length=Math.hypot(delta.x,delta.z),mesh=box((a.x+b.x)/2,(a.y+b.y)/2-.22,(a.z+b.z)/2,width,.22,length);mesh.rotation.y=Math.atan2(delta.x,delta.z);mesh.rotation.x=-Math.atan2(delta.y,length);const copy=collisionGroup.children.at(-1);copy.rotation.copy(mesh.rotation);return mesh;};
 const roofEntry=b=>{const p=b.route[0];return new V(p.x,roofY(b,p.x,p.z),p.z);};
 const roofExit=b=>{const p=b.route.at(-1);return new V(p.x,roofY(b,p.x,p.z),p.z);};
 // Every authored roof has a useful arrival checkpoint. A street checkpoint
 // between roofs 2 and 3 makes the descent part of the complete route.
 for(const [i,b] of level.entries()){checkpoints.push({id:b.id,name:b.name,position:roofEntry(b),radius:3.2,roof:i});if(i===1)checkpoints.push({id:'street',name:'PASEO DE LA CIUDAD',position:new V(20.3,STREET_Y+.34,-34),radius:3.5,roof:1});}
 // The street is real collision geometry. Foundations are solid down to it.
 for(const m of city.landscape.walkMeshes)collisionGroup.add(m.clone());
 for(const m of city.collisionMeshes||[])collisionGroup.add(m.clone());
 for(const m of city.roadColliders)collisionGroup.add(m.clone());
 // 1: a suspended bar crossing between staggered rooftops, with actual rungs
 // at hand-sized intervals instead of stretching their spacing with the GLB.
 {
  const a=roofExit(level[0]),b=roofEntry(level[1]);a.z+=.7;b.z-=.7;const y=Math.max(a.y,b.y),delta=b.clone().sub(a).setY(0),length=delta.length(),dir=delta.normalize(),side=new V(-dir.z,0,dir.x),center=a.clone().add(b).multiplyScalar(.5);a.y=b.y=y;pad(a,3,3);pad(b,3,3);
  const angle=Math.atan2(dir.x,dir.z);
  // One rung grid, one support frame: overlapping generated grids caused shimmer.
  for(const sign of [-1,1]){const pa=a.clone().addScaledVector(side,sign*.85),pb=b.clone().addScaledVector(side,sign*.85);rail(pa.clone().setY(y+2.92),pb.clone().setY(y+2.92),.075,metal,true);for(const p of [pa,pb])rail(p.clone().setY(y),p.clone().setY(y+2.92),.075,metal,true);}
  objects.push({id:'monkey-bars',position:center.toArray(),size:[2,3.15,length],angle,functionalFrame:true});
  const handY=y+2.92,rungs=[];for(let s=0;s<=length+.01;s+=.52){const p=a.clone().addScaledVector(dir,s);p.y=handY;rungs.push(p);rail(p.clone().addScaledVector(side,-.85),p.clone().addScaledVector(side,.85),.045,yellow,true);}
  zones.push({id:'sky-bars',type:'monkey',start:a,end:b,dir,side,handY,rungs,length,speed:1.35});
 }
 // 2: rooftop to promenade. A facade-supported landing gives the pole a real
 // upper access; the lower landing meets the pedestrian pavement.
 const descentRoof=level[1],returnRoof=level[2],streetTop=STREET_Y+.34,poleZ=descentRoof.z+1,poleTop=Math.max(descentRoof.height+2,roofY(descentRoof,descentRoof.offsetX+5,poleZ));
 {
  const start=new V(17.0,poleTop,poleZ),end=new V(18.7,streetTop,poleZ),pole=new V(18,poleTop,poleZ),from=new V(descentRoof.offsetX+4,poleTop,poleZ);deck(from,start,2.1);pad(from,3,3);pad(start,1.2,2.5);
  const supportY=roofY(descentRoof,from.x,from.z);box(from.x,supportY,from.z,2.4,poleTop-supportY,2.4,concrete);
  // Model's pole is at the front of its bounding box (brackets point backward).
  for(let y=streetTop;y<poleTop+1;y+=4.3)place('pole',new V(18,y,poleZ-.318),[.18,Math.min(4.4,poleTop+1.1-y),.72],0,false);
  rail(new V(18,streetTop,poleZ),new V(18,poleTop+1.15,poleZ),.065,yellow,true);
  for(let y=streetTop+1;y<poleTop;y+=4.5){rail(new V(18,y,poleZ),new V(16.5,y,poleZ),.055,metal);box(16.35,y-.15,poleZ,.25,.3,.38,concrete);}
  box(16.05,STREET_Y,poleZ, .5,poleTop-STREET_Y,2.4,concrete);
  zones.push({id:'promenade-pole',type:'pole',start,end,pole,dir:new V(1,0,0),length:poleTop-streetTop,speed:3.8});
 }
 // Return tower: six short net modules, rather than one implausibly stretched
 // mesh. Hands and feet target the vertical climbing plane in the controller.
 {
  const z=returnRoof.z+3.5,top=returnRoof.height+1.2,start=new V(18.6,streetTop,z),end=new V(15.8,top,z),dir=new V(-1,0,0),height=top-streetTop;
  for(const dz of [-1.15,1.15]){rail(new V(17.2,streetTop,z+dz),new V(17.2,top+1.1,z+dz),.065,yellow,true);for(let y=streetTop+.2;y<top;y+=4.3)rail(new V(15.8,y,z+dz),new V(17.2,y,z+dz),.05,metal,true);}
  objects.push({id:'rope-net',position:[17.2,streetTop,z],size:[2.3,height,1.4],functionalFrame:true});
  box(15.8,STREET_Y,z,.35,top-STREET_Y,3.6,metal);pad(new V(16.2,top,z),2.0,3.6);const roofPoint=new V(returnRoof.offsetX+5,top,z);deck(end,roofPoint,2.1);pad(roofPoint,3,3);
  zones.push({id:'return-net',type:'net',start,end,dir,planeX:17.20,length:height,speed:1.0,rungStep:.43});
  const rope=new T.MeshStandardMaterial({color:0xa79873,roughness:1});for(let dz=-.86;dz<=.87;dz+=.43)rail(new V(17.2,streetTop,z+dz),new V(17.2,top+1.1,z+dz),.022,rope);for(let y=streetTop+.43;y<=top+1.11;y+=.43)rail(new V(17.2,y,z-1.05),new V(17.2,y,z+1.05),.031,rope);
  // A second descent beside the return route allows revisiting the city.
  const lower=new V(19,streetTop,z-3.4),upper=new V(17.2,top,z-3.4);deck(new V(16.2,top,z),upper,1.4);pad(upper,1.0,2);for(let y=streetTop;y<top+1;y+=4.3)place('pole',new V(18.2,y,z-3.4-.31),[.18,Math.min(4.4,top+1-y),.7],0,false);rail(new V(18.2,streetTop,z-3.4),new V(18.2,top+1,z-3.4),.065,yellow,true);zones.push({id:'return-pole',type:'pole',start:upper,end:lower,pole:new V(18.2,top,z-3.4),dir:new V(1,0,0),length:height,speed:3.8});
 }
 // Remaining crossings use narrow decks, offset stepping platforms and a
 // final wall-run panel. Raised pieces always have a visible landing.
 for(let i=2;i<level.length-1;i++){
  const a=roofExit(level[i]),b=roofEntry(level[i+1]),delta=b.clone().sub(a),dir=delta.clone().setY(0).normalize(),side=new V(-dir.z,0,dir.x),length=Math.hypot(delta.x,delta.z),center=a.clone().add(b).multiplyScalar(.5);
  pad(a,2.6,2.6);pad(b,2.6,2.6);
  if(i===2){
   // Two landing decks leave a measured 2.6 m jump, angled toward the next roof.
   const p=a.clone().lerp(b,.36),q=a.clone().lerp(b,.64);deck(a,p,1.5);deck(q,b,1.5);pad(p,1.7,1.7);pad(q,1.7,1.7);
   zones.push({id:'precision-jump',type:'jump',start:p,end:q,dir,length:p.distanceTo(q)});
   place('platform',new V(center.x,Math.min(a.y,b.y)-2.2,center.z),[Math.min(length,7),2.1,1.3],Math.atan2(-dir.z,dir.x));
  }else if(i===3){
   deck(a,b,1.05);place('walkway',new V(center.x,center.y-.99,center.z),[2.0,.85,length],Math.atan2(dir.x,dir.z));
  }else if(i===4){
   deck(a,b,.85);const wallTop=Math.max(a.y,b.y)+2.2,wall=center.clone().addScaledVector(side,1.2);const panel=box(wall.x,Math.min(a.y,b.y)-1.6,wall.z,.30,wallTop-Math.min(a.y,b.y)+1.6,length+2,concrete);panel.rotation.y=Math.atan2(dir.x,dir.z);collisionGroup.children.at(-1).rotation.copy(panel.rotation);
   const start=a.clone().addScaledVector(side,.58),end=b.clone().addScaledVector(side,.58);zones.push({id:'cornice',type:'ledge',start,end,dir,normal:side.clone().negate(),handY:wallTop+.04,length,speed:1.0});
   rail(a.clone().addScaledVector(side,.72).setY(wallTop+.04),b.clone().addScaledVector(side,.72).setY(wallTop+.04),.07,yellow);
  }else{
   deck(a,b,1.15);const wall=center.clone().addScaledVector(side,1.05),panel=box(wall.x,Math.min(a.y,b.y)-.15,wall.z,.24,3.3,length+1,concrete);panel.rotation.y=Math.atan2(dir.x,dir.z);collisionGroup.children.at(-1).rotation.copy(panel.rotation);
   zones.push({id:'final-wall',type:'wall',start:a,end:b,dir,normal:side.clone().negate(),length,speed:5.8});
  }
 }
 // Distinct rooftop challenges made from every supplied obstacle type.
 for(const [index,id,size,dx,dz,angle] of [[0,'ramp',[2.2,1.2,3.4],0,-1,0],[0,'pipe-rail',[3.3,1.05,.5],0,-5,0],[1,'platform',[5,1.8,1.4],0,-1,.2],[2,'barrier',[5,2.4,3.7],-1,0,.35],[3,'ramp',[2,1.1,3.2],1,0,.3],[4,'rope-net',[3.4,3.5,2.2],0,0,0],[5,'pipe-rail',[3.5,.95,.55],-2,2,.5],[6,'platform',[4.5,1.5,1.2],3,1,-.4]]){
  const b=level[index];let best=null;
  // Require a continuous roof beneath the complete footprint, including both
  // approaches. Never place an obstacle at a fallback height above an open gap.
  for(let ox=-7;ox<=7;ox+=.7)for(let oz=-7;oz<=7;oz+=.7){const x=b.offsetX+ox,z=b.z+oz,ys=[];let safe=true;
   for(const sx of [-.5,0,.5])for(const sz of [-.5,0,.5]){const lx=sx*size[0],lz=sz*(size[2]+1.8),px=x+lx*Math.cos(angle)+lz*Math.sin(angle),pz=z-lx*Math.sin(angle)+lz*Math.cos(angle),hit=physics.ground(px,pz,b.height+.8,1.5);if(!hit||hit.position.y<b.height-.35){safe=false;break;}if(!physics.clearanceAt(new V(px,hit.position.y+.06,pz),.05)||!physics.clearanceAt(new V(px,hit.position.y+size[1]+.2,pz),.05)){safe=false;break;}ys.push(hit.position.y);}
   if(!safe||Math.max(...ys)-Math.min(...ys)>.22)continue;const score=(ox-dx)**2+(oz-dz)**2;if(!best||score<best.score)best={x,z,y:Math.max(...ys)+.025,score};
  }
  if(best)place(id,new V(best.x,best.y,best.z),size,angle);
  else{const p=roofEntry(b);place(id,p.clone().add(new V(0,.07,0)),size,angle);pad(p,size[0]+1,size[2]+2);}

 }
 // Climbable window routes. Each grip has matching visible stone, collision,
 // a bounded horizontal span and a reachable next grip; textures alone are not grips.
 const windows=[],glass=new T.MeshStandardMaterial({color:0x31515b,roughness:.32,metalness:.2}),ray=new T.Ray(new V(),new V(-1,0,0));
 for(const [i,b] of level.entries()){
  const landing=roofEntry(b),z=landing.z;let x=b.offsetX+(b.id==='roof-06'?17:Math.min(24,b.scale*.72))/2+.2;
  for(let y=streetTop+1;y<landing.y+.5;y+=1){ray.origin.set(40,y,z);const h=physics.world.rayIntersect(ray);if(h&&h.position.x<18&&h.position.x>b.offsetX)x=Math.max(x,h.position.x+.2);}
  let top=landing.y+.15;for(let xx=x-1.4;xx<x+.8;xx+=.20){const h=physics.ground(xx,z,b.height+5,7);if(h)top=Math.max(top,h.position.y+.14);}
  // A narrow facade bay supports its windows all the way to a real roof
  // balcony. Its constant plane prevents unreachable jumps between AI surfaces.
  box(x-.20,streetTop,z,.28,top-streetTop,2.6,concrete);
  const balcony=new V(x-.45,top,z);pad(balcony,1.2,2.8);deck(new V(x-1.4,top,z),balcony,1.5);pad(new V(x-1.4,top,z),1.4,2.4);
  const ys=[],first=streetTop+1.9,steps=Math.ceil((top-first)/1.25);for(let j=0;j<=steps;j++)ys.push(first+(top-first)*j/steps);
  const route=[];for(const [j,y] of ys.entries()){
   const width=2.25,edge=new V(x+.16,y,z);box(x,y-.12,z,.34,.12,width,concrete);rail(new V(x+.18,y+.02,z-width/2),new V(x+.18,y+.02,z+width/2),.025,yellow);
   if(j<ys.length-1){box(x-.05,y+.07,z,.035,.80,width-.25,glass,false);for(const dz of [-width/2,width/2])box(x,y,z+dz,.12,.93,.09,concrete);}
   const w={id:'window-'+i+'-'+j,type:'window',route:i,edge,normal:new V(1,0,0),tangent:new V(0,0,1),dir:new V(-1,0,0),handY:y+.04,width,top:j===ys.length-1};
   if(w.top)w.exit=new V(x-.45,top+.055,z);
   route.push(w);windows.push(w);
  }
  route.forEach((w,j)=>{w.next=route[j+1]?.id||null;});
 }
 zones.push(...windows);
 // Ramps use measured smooth surfaces over their deck, removing mesh noise.
 const ramps=[];for(const o of objects.filter(o=>o.id==='ramp')){const dir=new V(Math.sin(o.angle),0,Math.cos(o.angle));ramps.push({a:new V(...o.position).addScaledVector(dir,-o.size[2]/2),b:new V(...o.position).addScaledVector(dir,o.size[2]/2).add(new V(0,o.size[1],0)),width:o.size[0]});}
 // Distinct numbered rings make the longer route legible from roof and street.
 const rings=[];for(const [i,c] of checkpoints.entries()){const ring=new T.Mesh(new T.TorusGeometry(.8,.055,6,32),new T.MeshBasicMaterial({color:i===0?0x7cd9bd:0xf0c759}));ring.rotation.x=Math.PI/2;ring.position.copy(c.position).y+=.09;group.add(ring);rings.push(ring);}
 // Bake static transforms and batch by material. Repeated nets and pole
 // sections do not each cost a draw call on the phone.
 group.updateMatrixWorld(true);const batches=new Map();group.traverse(n=>{if(!n.isMesh||rings.includes(n))return;const key=n.material.uuid+':'+Object.keys(n.geometry.attributes).sort().join(',');if(!batches.has(key))batches.set(key,{material:n.material,geometries:[]});batches.get(key).geometries.push(n.geometry.clone().applyMatrix4(n.matrixWorld));});
 for(const n of [...group.children])if(!rings.includes(n))group.remove(n);
 for(const b of batches.values()){const mesh=new T.Mesh(mergeGeometries(b.geometries),b.material);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);for(const g of b.geometries)g.dispose();}
 return {group,objects,zones,checkpoints,ramps,rings,streetY:streetTop,update(){}};
}
