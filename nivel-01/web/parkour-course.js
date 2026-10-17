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
 const pad=(p,w=2.5,d=2.5)=>box(p.x,p.y-.20,p.z,w,.20,d);
 const deck=(a,b,width=1.35)=>{const delta=b.clone().sub(a),length=Math.hypot(delta.x,delta.z),mesh=box((a.x+b.x)/2,(a.y+b.y)/2-.22,(a.z+b.z)/2,width,.22,length);mesh.rotation.y=Math.atan2(delta.x,delta.z);mesh.rotation.x=-Math.atan2(delta.y,length);const copy=collisionGroup.children.at(-1);copy.rotation.copy(mesh.rotation);return mesh;};
 const roofEntry=b=>{const p=b.route[0];return new V(p.x,roofY(b,p.x,p.z),p.z);};
 const roofExit=b=>{const p=b.route.at(-1);return new V(p.x,roofY(b,p.x,p.z),p.z);};
 // Every authored roof has a useful arrival checkpoint. A street checkpoint
 // between roofs 2 and 3 makes the descent part of the complete route.
 for(const [i,b] of level.entries()){checkpoints.push({id:b.id,name:b.name,position:roofEntry(b),radius:3.2,roof:i});if(i===1)checkpoints.push({id:'street',name:'PASEO DE LA CIUDAD',position:new V(20.3,STREET_Y+.34,-34),radius:3.5,roof:1});}
 // The street is real collision geometry. Foundations are solid down to it.
 for(const m of city.landscape.walkMeshes)collisionGroup.add(m.clone());
 for(const m of city.collisionMeshes||[])collisionGroup.add(m.clone());
 for(const x of [-31,31]){const road=new T.Mesh(new T.PlaneGeometry(16,640));road.rotation.x=-Math.PI/2;road.position.set(x,STREET_Y+.25,-75);collisionGroup.add(road);}
 // 1: a suspended bar crossing between staggered rooftops, with actual rungs
 // at hand-sized intervals instead of stretching their spacing with the GLB.
 {
  const a=roofExit(level[0]),b=roofEntry(level[1]);a.z+=.7;b.z-=.7;const y=Math.max(a.y,b.y),delta=b.clone().sub(a).setY(0),length=delta.length(),dir=delta.normalize(),side=new V(-dir.z,0,dir.x),center=a.clone().add(b).multiplyScalar(.5);a.y=b.y=y;pad(a,3,3);pad(b,3,3);
  const angle=Math.atan2(dir.x,dir.z);place('monkey-bars',new V(center.x,y-.12,center.z),[2.0,3.15,length+1.1],angle,false);
  const handY=y+2.92,rungs=[];for(let s=0;s<=length+.01;s+=.52){const p=a.clone().addScaledVector(dir,s);p.y=handY;rungs.push(p);rail(p.clone().addScaledVector(side,-.85),p.clone().addScaledVector(side,.85),.045);}
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
  rail(new V(18,streetTop,poleZ),new V(18,poleTop+1.15,poleZ),.065,metal);
  for(let y=streetTop+1;y<poleTop;y+=4.5){rail(new V(18,y,poleZ),new V(16.5,y,poleZ),.055,metal);box(16.35,y-.15,poleZ,.25,.3,.38,concrete);}
  box(16.05,STREET_Y,poleZ, .5,poleTop-STREET_Y,2.4,concrete);
  zones.push({id:'promenade-pole',type:'pole',start,end,pole,dir:new V(1,0,0),length:poleTop-streetTop,speed:3.8});
 }
 // Return tower: six short net modules, rather than one implausibly stretched
 // mesh. Hands and feet target the vertical climbing plane in the controller.
 {
  const z=returnRoof.z+3.5,top=returnRoof.height+1.2,start=new V(18.6,streetTop,z),end=new V(15.8,top,z),dir=new V(-1,0,0),height=top-streetTop;
  for(let y=streetTop;y<top;y+=4.25)place('rope-net',new V(16.8,y,z),[2.8,Math.min(4.5,top-y+1),1.55],Math.PI/2,false);
  box(15.8,STREET_Y,z,.35,top-STREET_Y,3.6,metal);pad(new V(16.2,top,z),2.0,3.6);const roofPoint=new V(returnRoof.offsetX+5,top,z);deck(end,roofPoint,2.1);pad(roofPoint,3,3);
  zones.push({id:'return-net',type:'net',start,end,dir,planeX:17.20,length:height,speed:2.8,rungStep:.43});
  const rope=new T.MeshStandardMaterial({color:0xa79873,roughness:1});for(let y=streetTop+.43;y<=top+1.11;y+=.43)rail(new V(17.2,y,z-1.05),new V(17.2,y,z+1.05),.031,rope);
  // A second descent beside the return route allows revisiting the city.
  const lower=new V(19,streetTop,z-3.4),upper=new V(17.2,top,z-3.4);deck(new V(16.2,top,z),upper,1.4);pad(upper,1.0,2);for(let y=streetTop;y<top+1;y+=4.3)place('pole',new V(18.2,y,z-3.4-.31),[.18,Math.min(4.4,top+1-y),.7],0,false);rail(new V(18.2,streetTop,z-3.4),new V(18.2,top+1,z-3.4),.065,metal);zones.push({id:'return-pole',type:'pole',start:upper,end:lower,pole:new V(18.2,top,z-3.4),dir:new V(1,0,0),length:height,speed:3.8});
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
   deck(a,b,1.05);place('walkway',new V(center.x,center.y-.85,center.z),[2.0,.85,length],Math.atan2(dir.x,dir.z));
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
  const b=level[index],x=b.offsetX+dx,z=b.z+dz,y=roofY(b,x,z);place(id,new V(x,y,z),size,angle);
 }
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
