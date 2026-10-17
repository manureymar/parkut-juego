import * as THREE from 'three';
// Lightweight ambient motion. No extra fullscreen rendering pass on mobile.
export function createAtmosphere(scene){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'rgba(255,241,211,1)');gradient.addColorStop(.2,'rgba(255,232,185,.48)');gradient.addColorStop(1,'rgba(255,232,185,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);const soft=new THREE.CanvasTexture(canvas);
 const dustGeo=new THREE.BufferGeometry(),positions=new Float32Array(72*3),seed=[];
 for(let i=0;i<72;i++){seed.push([Math.sin(i*12.9)*18,2+(i*1.73)%12,-8-(i*3.71)%52]);positions.set(seed[i],i*3);}
 dustGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({map:soft,color:0xffe8bf,size:.065,transparent:true,opacity:.38,depthWrite:false,sizeAttenuation:true}));scene.add(dust);
 const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:soft,color:0xffdfaa,transparent:true,opacity:.6,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));halo.scale.set(90,90,1);scene.add(halo);
 const sunDirection=new THREE.Vector3(-36,40,24).normalize().multiplyScalar(450),haze=[];
 for(let i=0;i<5;i++){const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:soft,color:0xc9d3d4,transparent:true,opacity:.045,depthWrite:false}));sprite.scale.set(55,10,1);scene.add(sprite);haze.push(sprite);}
 const birdGeo=new THREE.BufferGeometry(),birdPositions=new Float32Array(12*9);birdGeo.setAttribute('position',new THREE.BufferAttribute(birdPositions,3));
 const birds=new THREE.Mesh(birdGeo,new THREE.MeshBasicMaterial({color:0x3c5265,side:THREE.DoubleSide,fog:true}));birds.frustumCulled=false;scene.add(birds);let time=0;
 return {update(dt,anchor){time+=dt;halo.position.copy(anchor).add(sunDirection);for(const [i,sprite] of haze.entries())sprite.position.set((i%2?1:-1)*(30+i*5)+Math.sin(time*.06+i)*4,-9+i*2,anchor.z-35-i*34);dust.position.set(anchor.x,0,anchor.z);for(let i=0;i<72;i++){positions[i*3]=seed[i][0]+Math.sin(time*.16+i)*.8;positions[i*3+1]=seed[i][1]+Math.sin(time*.2+i)*.3;}dustGeo.attributes.position.needsUpdate=true;
  for(let i=0;i<12;i++){const x=Math.sin(time*.013+i*.21)*68,y=25+Math.sin(i*1.3)*4,z=anchor.z-80-i*4,flap=Math.sin(time*4+i)*.23;birdPositions.set([x-.55,y+flap,z,x,y,z+.12,x+.55,y+flap,z],i*9);}birdGeo.attributes.position.needsUpdate=true;
 }};
}
