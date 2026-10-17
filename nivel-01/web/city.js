import * as T from 'three';
import {TrafficSimulation} from './traffic.js';
import {createLandscape} from './city-landscape.js';
import {createPedestrians} from './pedestrians.js';
export const STREET_Y=-25.5;
const V=T.Vector3;

function geometryOf(g){let found;g.scene.updateMatrixWorld(true);g.scene.traverse(n=>{if(n.isMesh&&!found)found=n;});return {geometry:found.geometry.clone().applyMatrix4(found.matrixWorld),material:found.material.clone()};}
function fadeIntoSkyline(material){
 material.transparent=true;
 material.onBeforeCompile=shader=>{shader.vertexShader='varying float cityDistance;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\ncityDistance=length(mvPosition.xyz);');shader.fragmentShader='varying float cityDistance;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`#include <alphatest_fragment>
 float cityFade=1.0-smoothstep(140.0,250.0,cityDistance);if(cityFade<0.005)discard;diffuseColor.a*=cityFade;`);};
}
function straightenRoad(geometry){
 // The image-to-3D road tapers from perspective. Fit its pavement edges and
 // remove that taper so repeated segments meet at the same lane width.
 const p=geometry.attributes.position,bins=Array.from({length:20},()=>[]);
 for(let i=0;i<p.count;i++)if(p.getY(i)<.035){const k=Math.max(0,Math.min(19,Math.floor((p.getZ(i)+.49)/.98*20)));bins[k].push(p.getX(i));}
 const samples=bins.map((a,k)=>{a.sort((a,b)=>a-b);const left=a[Math.floor(a.length*.002)],right=a[Math.floor(a.length*.998)];return {z:(k+.5)*.049-.49,c:(left+right)/2,w:(right-left)/2};}).filter(v=>Number.isFinite(v.w)&&v.w>.05);
 const fit=key=>{let sz=0,sv=0,szz=0,szv=0;for(const s of samples){sz+=s.z;sv+=s[key];szz+=s.z*s.z;szv+=s.z*s[key];}const slope=(samples.length*szv-sz*sv)/(samples.length*szz-sz*sz);return {slope,intercept:(sv-slope*sz)/samples.length};};
 const center=fit('c'),width=fit('w');for(let i=0;i<p.count;i++){const z=p.getZ(i),w=width.intercept+width.slope*z;p.setX(i,(p.getX(i)-center.intercept-center.slope*z)*.16185/w);}p.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
}
function normalizedCar(g,rotation,length){const {geometry,material}=geometryOf(g);geometry.rotateY(rotation);geometry.computeBoundingBox();const box=geometry.boundingBox,size=box.getSize(new V()),center=box.getCenter(new V());geometry.translate(-center.x,-box.min.y,-center.z);geometry.scale(length/size.z,length/size.z,length/size.z);material.roughness=Math.max(.48,material.roughness);material.metalness=Math.min(.45,material.metalness);material.envMapIntensity=.45;return {geometry,material};}

export async function createCity(scene,loader,level,progress=()=>{}){
 const ids=['city-road','city-intersection','traffic-compact','traffic-taxi','traffic-pickup','traffic-van','city-building-1','city-building-2','city-building-3'];
 const assets={};for(const [i,id] of ids.entries()){assets[id]=await loader.loadAsync('./assets/'+id+'.glb');progress(i+1,ids.length+7);}
 const group=new T.Group();group.name='Ciudad y tráfico';scene.add(group);
 const road=geometryOf(assets['city-road']),intersection=geometryOf(assets['city-intersection']);
 straightenRoad(road.geometry);
 for(const m of [road.material,intersection.material]){m.envMapIntensity=.25;m.roughness=1;m.metalness=0;m.normalScale?.set(.4,.4);if(m.map)m.map.anisotropy=4;fadeIntoSkyline(m);}
 // Local axes are measured on the supplied GLBs, including the offset centre
 // of the T junction; this keeps module seams and lane centres aligned.
 const roadScale=49.4,roadLength=.978515625*roadScale,intersectionScale=81.8,intersectionHalf=.4899749755859375*intersectionScale;
 const roads=[],crossings=[],signalObjects=[];
 const addRoad=(source,x,z,rotation=0,scale=roadScale)=>{const mesh=new T.Mesh(source.geometry,source.material);mesh.position.set(x,STREET_Y,z);mesh.rotation.y=rotation;mesh.scale.setScalar(scale);mesh.receiveShadow=true;mesh.updateMatrixWorld(true);group.add(mesh);roads.push(mesh);return mesh;};
 const avenues=[-31,31],junctionZ=-69;
 for(const [index,x] of avenues.entries()){
  const sign=x<0?-1:1;
  addRoad(intersection,x+sign*.12*intersectionScale,junctionZ,sign*Math.PI/2,intersectionScale);
  const stops=[junctionZ];
  for(const direction of [-1,1])for(let i=0;i<5;i++){const z=junctionZ+direction*(intersectionHalf+roadLength*(i+.5));addRoad(road,x,z);stops.push(z+.095*roadScale);}
  const branchZ=junctionZ-sign*.10*intersectionScale,branchEnd=x+sign*.339*intersectionScale;
  for(let i=0;i<3;i++)addRoad(road,branchEnd+sign*roadLength*(i+.5),branchZ,Math.PI/2);
  crossings.push({x,stops,index});
 }
 // Towers are light geometry around the roads; the authored roofs remain the
 // only playable surfaces. Foundations reach the street instead of floating.
 const facadeTexture=await new T.TextureLoader().loadAsync('./assets/environment/facade.webp');facadeTexture.colorSpace=T.SRGBColorSpace;facadeTexture.wrapS=facadeTexture.wrapT=T.RepeatWrapping;facadeTexture.anisotropy=4;
 const facade=new T.MeshStandardMaterial({map:facadeTexture,color:0xe0ddd4,roughness:.86,envMapIntensity:.35});
 const roofMat=new T.MeshStandardMaterial({color:0x929591,roughness:.95});
 const box=(x,y,z,w,h,d,mat=facade)=>{const geometry=new T.BoxGeometry(w,h,d),uv=geometry.attributes.uv,normals=geometry.attributes.normal;for(let i=0;i<uv.count;i++){const horizontal=Math.abs(normals.getX(i))>.5?d:w;uv.setXY(i,uv.getX(i)*horizontal/10,uv.getY(i)*h/12);}const m=new T.Mesh(geometry,[mat,mat,roofMat,roofMat,mat,mat]);m.position.set(x,y+h/2,z);m.receiveShadow=true;group.add(m);return m;};
 for(const b of level){const bottom=b.y,fullDepth=(b.near-b.far)*b.scale;
  if(bottom>STREET_Y)box(b.offsetX,STREET_Y,b.z+(b.near+b.far)*b.scale/2,b.id==='roof-06'?17:Math.min(24,b.scale*.72),bottom-STREET_Y+.15,fullDepth*.97);
 }
 let n=0;const lots=[];for(const x of [-137,-99,-65,65,99,137])for(let z=-270;z<=105;z+=38){
  // Leave the T branches open through the outer blocks.
  if(Math.abs(z-junctionZ)<23)continue;
  const w=17+(n*13%8),d=21+(n*7%7),h=15+(n*17%32),px=x+(n%3-1)*1.6;
  lots.push({x:px,z,w,h,d,type:n%3});n++;
 }
 for(const z of [-302,-264,-226,-188,100,138]){lots.push({x:0,z,w:25,h:25+(n%3)*7,d:26,type:n%3});n++;}
 for(let type=0;type<3;type++){const {geometry,material}=geometryOf(assets['city-building-'+(type+1)]);geometry.computeBoundingBox();const bounds=geometry.boundingBox,center=bounds.getCenter(new V()),size=bounds.getSize(new V());geometry.translate(-center.x,-bounds.min.y,-center.z);fadeIntoSkyline(material);material.envMapIntensity=.4;material.roughness=Math.max(.8,material.roughness);material.normalScale?.set(.5,.5);const placed=lots.filter(l=>l.type===type),mesh=new T.InstancedMesh(geometry,material,placed.length),matrix=new T.Matrix4(),q=new T.Quaternion();placed.forEach((lot,i)=>{q.setFromAxisAngle(new V(0,1,0),i%2*Math.PI);matrix.compose(new V(lot.x,STREET_Y,lot.z),q,new V(lot.w/size.x,lot.h/size.y,lot.d/size.z));mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,new T.Color(0xffffff).multiplyScalar(.88+i%4*.04));});mesh.receiveShadow=true;group.add(mesh);}
 const landscape=await createLandscape(group,STREET_Y,lots);
 const pedestrians=await createPedestrians(group,loader,landscape,(n,total)=>progress(ids.length+n,ids.length+total));
 const routes=[];const zMin=-345,zMax=206;
 for(const cross of crossings)for(const direction of [-1,1])for(let lane=0;lane<2;lane++){
  const startZ=direction<0?zMax:zMin,length=zMax-zMin,x=cross.x+(direction<0?1:-1)*(1.55+lane*3.05);
  routes.push({x,direction,startZ,length,stops:cross.stops.map((z,j)=>({s:(z-startZ)*direction-3.5,offset:(j*5+cross.index*7)%34})).filter(s=>s.s>0&&s.s<length)});
 }
 const simulation=new TrafficSimulation(routes),specs=[['traffic-compact',Math.PI/2,4.25],['traffic-taxi',0,5.1],['traffic-pickup',0,5.35],['traffic-van',0,4.85]],batches=[];
 for(const [type,[id,rotation,length]] of specs.entries()){
  const {geometry,material}=normalizedCar(assets[id],rotation,length),cars=simulation.cars.filter(c=>c.type===type),mesh=new T.InstancedMesh(geometry,material,cars.length);
  if(type===0||type===2)material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#if defined(USE_COLOR) || defined(USE_COLOR_ALPHA)
   float paintMax=max(diffuseColor.r,max(diffuseColor.g,diffuseColor.b));float paintMin=min(diffuseColor.r,min(diffuseColor.g,diffuseColor.b));float paint=smoothstep(0.28,0.60,(paintMax-paintMin)/max(paintMax,0.001));float shade=dot(diffuseColor.rgb,vec3(.3,.5,.2));diffuseColor.rgb=mix(diffuseColor.rgb,vColor.rgb*shade*1.7,paint);
   #endif`);};
  mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;mesh.receiveShadow=true;group.add(mesh);
  cars.forEach((car,i)=>{car.slot=i;car.length=length;const paint=type===0?[0xb83d31,0x658393,0xb8b8ac,0x487b6e][Math.floor(car.id/4)%4]:type===2?[0x425d88,0x78826d,0xa6a6a0,0x7f4c44][Math.floor(car.id/4)%4]:0xffffff;mesh.setColorAt(i,new T.Color(paint).multiplyScalar(.9+(car.id%3)*.05));});batches.push({mesh,cars});
 }
 // Cache the actual reconstructed pavement height along each lane once.
 const ray=new T.Raycaster(),down=new V(0,-1,0),heightMaps=routes.map(r=>{
  const heights=[];for(let z=zMin;z<=zMax+3;z+=3){ray.set(new V(r.x,STREET_Y+1.5,z),down);const hit=ray.intersectObjects(roads,false)[0];heights.push(hit&&hit.point.y<STREET_Y+1.2?hit.point.y:STREET_Y+.25);}return heights;
 });
 const getHeight=(lane,z)=>{const q=(z-zMin)/3,i=Math.max(0,Math.floor(q)),h=heightMaps[lane];return T.MathUtils.lerp(h[Math.min(i,h.length-1)],h[Math.min(i+1,h.length-1)],q-i);};
 const signalGeo=new T.SphereGeometry(.12,6,4),signalMat=new T.MeshBasicMaterial({color:0xffffff,toneMapped:false});
 for(const [lane,r] of routes.entries())if(lane%2===0)for(const stop of r.stops){const z=r.startZ+r.direction*(stop.s+3.5),m=new T.Mesh(signalGeo,signalMat.clone());m.position.set(r.x,STREET_Y+5.7,z);group.add(m);signalObjects.push({m,stop});}
 const matrix=new T.Matrix4(),pos=new V(),quat=new T.Quaternion(),up=new V(0,1,0),scale=new V(1,1,1);let visible=0;
 const update=(dt,anchor,camera)=>{simulation.update(dt);landscape.update(dt,anchor,camera);pedestrians.update(dt,anchor);visible=0;
  for(const {mesh,cars} of batches){for(const car of cars){const p=simulation.position(car),distance=Math.hypot(p.x-anchor.x,p.z-anchor.z),fade=T.MathUtils.clamp((270-distance)/35,0,1);pos.set(p.x,getHeight(car.lane,p.z)+.025,p.z);quat.setFromAxisAngle(up,p.rotation);scale.setScalar(fade);matrix.compose(pos,quat,scale);mesh.setMatrixAt(car.slot,matrix);if(fade>.01)visible++;}mesh.instanceMatrix.needsUpdate=true;}
  for(const {m,stop} of signalObjects){const phase=simulation.phase(stop);m.material.color.setHex(phase==='green'?0x76e399:phase==='amber'?0xffc861:0xff5b3f);}
 };
 update(0,new V());return {update,simulation,roads,group,landscape,pedestrians,setQuality:q=>pedestrians.setQuality(q),get state(){return {total:simulation.cars.length,visible,types:specs.map(s=>s[0]),roadModules:roads.length,buildings:n,pedestrians:pedestrians.state,landscape:landscape.state};},debug:()=>simulation.snapshot()};
}
