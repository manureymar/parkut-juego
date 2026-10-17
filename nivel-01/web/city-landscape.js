import * as T from 'three';
import {mergeGeometries} from './vendor/examples/jsm/utils/BufferGeometryUtils.js';
import {makeRoute} from './pedestrian-simulation.js';

export const SIDEWALK_RISE=.34;
export async function createLandscape(group,streetY,lots){
 const textures=new T.TextureLoader(),[paving,lawn,tree]=await Promise.all(['sidewalk','garden','tree'].map(id=>textures.loadAsync('./assets/environment/'+id+'.webp')));
 for(const texture of [paving,lawn]){texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=4;}
 tree.colorSpace=T.SRGBColorSpace;
 const pavement=new T.MeshStandardMaterial({map:paving,color:0xc6c4bc,roughness:.95,envMapIntensity:.2});
 const garden=new T.MeshStandardMaterial({map:lawn,color:0xa3ae86,roughness:1,envMapIntensity:.15});
 const concrete=new T.MeshStandardMaterial({color:0xb6b5a9,roughness:.95});
 const timber=new T.MeshStandardMaterial({color:0x8c6745,roughness:.85});
 const metal=new T.MeshStandardMaterial({color:0x3a4c50,roughness:.6,metalness:.2});
 const batches=new Map(),surfaces=[],trees=[];
 const add=(material,geometry)=>{if(!batches.has(material))batches.set(material,[]);batches.get(material).push(geometry);};
 const plane=(x,z,w,d,y,material,tile=4)=>{
  const geometry=new T.PlaneGeometry(w,d);geometry.rotateX(-Math.PI/2);geometry.translate(x,y,z);
  const pos=geometry.attributes.position,uv=geometry.attributes.uv;for(let i=0;i<pos.count;i++)uv.setXY(i,pos.getX(i)/tile,pos.getZ(i)/tile);
  add(material,geometry);surfaces.push({x,z,w,d,y,type:material===garden?'garden':'pavement'});
 };
 const box=(x,y,z,w,h,d,material=concrete)=>{const geometry=new T.BoxGeometry(w,h,d);geometry.translate(x,y+h/2,z);add(material,geometry);};
 const top=streetY+SIDEWALK_RISE;
 // A continuous opaque foundation closes every gap, including the spaces
 // between authored street modules. It receives fog instead of becoming transparent.
 plane(0,-80,1200,1200,streetY-.31,pavement,5);
 const strips=[];
 for(const side of [-1,1]){
  const inner=side*19.1;plane(inner,-75,8.5,620,top,pavement);box(side*23.25,streetY-.3,-75,.24,.64,620);
  const branchZ=-69-side*8.18;
  for(const [a,b] of [[-385,branchZ-10],[branchZ+10,235]]){
   plane(side*45.5,(a+b)/2,13,b-a,top,pavement);box(side*39.12,streetY-.3,(a+b)/2,.24,.64,b-a);
   strips.push({x:side*45.5,z:(a+b)/2,w:13,d:b-a});
  }
  // Flat planting beds and billboard foliage are placed beside clear walking lanes.
  for(let z=-190;z<=95;z+=19){
   if(Math.abs(z-branchZ)<15)continue;
   plane(side*49.8,z,3.3,5.7,top+.015,garden,3.5);
   if(!([-20,-130].some(pool=>Math.abs(z-pool)<12)))trees.push({x:side*49.8,z,h:4.6+(Math.abs(z)%7)*.12});
  }
  for(const [a,b] of [[-165,-93],[-46,14]])strips.push({x:side*20.3,z:(a+b)/2,w:3.5,d:b-a});
 }
 // Ground around distant towers is filled with grass and paved connections.
 for(const [i,lot] of lots.entries()){
  plane(lot.x,lot.z,lot.w+5,lot.d+6,streetY+.035,garden,4);
  plane(lot.x,lot.z+lot.d/2+4,lot.w+8,2.2,streetY+.05,pavement);
  if(i%2===0)trees.push({x:lot.x-lot.w/2-1.3,z:lot.z+lot.d/2+1,h:5.1+i%3*.4});
 }
 // A small civic garden behind the first rooftop, visible when orbiting the camera.
 plane(0,42,44,47,top,pavement);
 for(const x of [-12,12]){plane(x,43,13,29,top+.02,garden);for(const z of [31,51])trees.push({x,z,h:5.8});}
 const waterUniform={value:0},waterMaterial=new T.MeshStandardMaterial({color:0x3b737b,metalness:.32,roughness:.21,envMapIntensity:1.1});
 waterMaterial.onBeforeCompile=shader=>{
  shader.uniforms.cityWaterTime=waterUniform;shader.vertexShader='varying vec2 poolUV;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\npoolUV=uv;');
  shader.fragmentShader='uniform float cityWaterTime;varying vec2 poolUV;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float wave=sin(poolUV.x*58.0+poolUV.y*83.0+cityWaterTime*.8)*sin(poolUV.y*119.0-cityWaterTime*.65);
   diffuseColor.rgb*=.94+wave*.07;`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_begin>',`#include <normal_fragment_begin>
   normal=normalize(normal+vec3(sin(poolUV.y*140.0+cityWaterTime)*.035,cos(poolUV.x*110.0-cityWaterTime*.7)*.025,0.0));`);
 };
 const pools=[];
 for(const [x,z,w,d] of [[48,-20,4.6,14],[-48,-130,4.6,14],[0,43,6,22]]){
  const pool=new T.Mesh(new T.PlaneGeometry(w,d),waterMaterial);pool.rotation.x=-Math.PI/2;pool.position.set(x,top+.09,z);pool.receiveShadow=true;group.add(pool);pools.push({x,z,w,d});
  for(const side of [-1,1]){box(x+side*(w/2+.18),top,z,.36,.22,d+.72);box(x,top,z+side*(d/2+.18),w,.22,.36);}
 }
 // Benches and bins use a few shared low-poly meshes, outside the paths.
 let benches=0;
 for(const side of [-1,1])for(const z of [-157,-111,-32,8]){
  const x=side*50.6;box(x,top+.43,z,.60,.12,1.85,timber);box(x+side*.22,top+.55,z,.12,.60,1.85,timber);
  for(const dz of [-.65,.65])box(x,top,z+dz,.44,.43,.12,metal);
  box(x,top,z+2.1,.42,.72,.42,metal);benches++;
 }
 const walkMeshes=[];
 for(const [material,geometries] of batches){const mesh=new T.Mesh(mergeGeometries(geometries),material);mesh.name=material===garden?'Jardines planos':'Suelo urbano continuo';mesh.receiveShadow=true;group.add(mesh);if(material===pavement)walkMeshes.push(mesh);for(const geometry of geometries)geometry.dispose();}
 const treeGeometry=new T.PlaneGeometry(2/3,1);treeGeometry.translate(0,.5,0);
 const treeMaterial=new T.MeshStandardMaterial({map:tree,alphaTest:.44,side:T.DoubleSide,roughness:1,envMapIntensity:.3});
 const foliage=new T.InstancedMesh(treeGeometry,treeMaterial,trees.length);foliage.name='Árboles con imágenes 2D';foliage.instanceMatrix.setUsage(T.DynamicDrawUsage);foliage.frustumCulled=false;group.add(foliage);
 const shadowGeometry=new T.CircleGeometry(1,16);shadowGeometry.rotateX(-Math.PI/2);
 const shadows=new T.InstancedMesh(shadowGeometry,new T.MeshBasicMaterial({color:0x263a2c,transparent:true,opacity:.15,depthWrite:false}),trees.length);group.add(shadows);
 const matrix=new T.Matrix4(),position=new T.Vector3(),quaternion=new T.Quaternion(),scale=new T.Vector3(),up=new T.Vector3(0,1,0);
 trees.forEach((item,i)=>{position.set(item.x,(Math.abs(item.x)>53?streetY+.04:top)+.03,item.z);quaternion.identity();scale.set(item.h*.27,1,item.h*.24);matrix.compose(position,quaternion,scale);shadows.setMatrixAt(i,matrix);});
 const routes=[];for(const cx of [-20.3,20.3,-43.1,43.1])for(const [a,b] of [[-165,-93],[-46,14]])routes.push(makeRoute(routes.length,cx,a,b));
 const update=(dt,anchor,camera)=>{
  waterUniform.value+=dt;
  for(const [i,item] of trees.entries()){
   const distance=Math.hypot(item.x-anchor.x,item.z-anchor.z),size=distance<240?item.h:0;position.set(item.x,Math.abs(item.x)>53?streetY+.04:top,item.z);
   quaternion.setFromAxisAngle(up,Math.atan2((camera?.position.x??anchor.x)-item.x,(camera?.position.z??anchor.z)-item.z));scale.setScalar(size);matrix.compose(position,quaternion,scale);foliage.setMatrixAt(i,matrix);
  }
  foliage.instanceMatrix.needsUpdate=true;
 };
 return {routes,update,surfaces,pools,walkMeshes,pedestrianHeight:()=>top,state:{continuousGround:true,sidewalkRise:SIDEWALK_RISE,trees:trees.length,benches,pools:pools.length,routes:routes.length}};
}
