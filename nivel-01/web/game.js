import * as THREE from 'three';
import {GLTFLoader} from './vendor/examples/jsm/loaders/GLTFLoader.js';
import {Octree} from './vendor/examples/jsm/math/Octree.js';
import {RoomEnvironment} from './vendor/examples/jsm/environments/RoomEnvironment.js';
import {RunnerPhysics} from './physics.js';
import {RunnerAnimation} from './animation.js';
import {createControls} from './controls.js';
import {GameAudio} from './audio.js';
import {LEVEL,SPAWN,GOAL,DISTANCE} from './level.js';

const $=id=>document.getElementById(id),clamp=THREE.MathUtils.clamp;
document.body.classList.add('is-intro');
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',alpha:false});}
catch(e){$('load-label').textContent='Tu dispositivo necesita WebGL 2 para abrir Parkut.';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.16;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
$('viewport').appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x94b6d2);scene.fog=new THREE.Fog(0xa9bdc7,90,235);
const camera=new THREE.PerspectiveCamera(64,innerWidth/innerHeight,.1,1200);
const hemi=new THREE.HemisphereLight(0xd5e8ff,0x8d795d,1.35);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe1b0,3.2);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-27,right:27,top:27,bottom:-27,near:1,far:140});
sun.shadow.bias=-.00008;sun.shadow.normalBias=.025;sun.shadow.radius=2;scene.add(sun,sun.target);
const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.05).texture;scene.environmentIntensity=.35;room.dispose();pmrem.dispose();
const loader=new GLTFLoader(),world=new Octree(),collisionGroup=new THREE.Group(),buildings=[],markers=[];
const physics=new RunnerPhysics(world),audio=new GameAudio();
let avatar,anim,backdrop,ready=false,started=false,paused=false,completed=false,respawning=false,elapsed=0,roofIndex=0,bestRoof=0,airTime=0,stairsTime=0,landBounce=0;
let checkpoint=new THREE.Vector3(SPAWN.x,SPAWN.y,SPAWN.z),mantle=null,quality='high',toastTimer=0,lastHint='',frameCount=0,fpsTime=0,fps=60;
const direction=new THREE.Vector3(0,0,-1),lookTarget=new THREE.Vector3(),cameraGoal=new THREE.Vector3(),zero=new THREE.Vector3();
const state={version:'0.1.0',loaded:false,errors:[],assets:[],fps:60};
addEventListener('error',e=>state.errors.push(e.message));addEventListener('unhandledrejection',e=>state.errors.push(String(e.reason)));
function progress(n,label){$('load-progress').style.width=n+'%';$('load-count').textContent=Math.round(n)+'%';$('load-label').textContent=label;}
function toast(text,duration=3.4){if(lastHint===text&&toastTimer>0)return;lastHint=text;$('hint').textContent=text;$('hint').classList.add('show');toastTimer=duration;}
function formatTime(t){return String(Math.floor(t/60)).padStart(2,'0')+':'+String(Math.floor(t%60)).padStart(2,'0');}

function groundAt(x,z,top=40,max=100){return physics.ground(x,z,top,max);}
function createArrow(x,z){
 const h=groundAt(x,z);if(!h||h.position.y<-4)return;
 const g=new THREE.BufferGeometry(),v=[];
 for(const back of [0,.48]){
  const p=[[-.36,back+.29],[0,back], [.36,back+.29],[.30,back+.39],[0,back+.15],[-.30,back+.39]];
  for(const t of [[0,1,4],[0,4,5],[1,2,3],[1,3,4]])for(const i of t)v.push(p[i][0],0,p[i][1]);
 }
 g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.computeVertexNormals();
 const a=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xffd16b,transparent:true,opacity:.76,side:THREE.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
 a.position.set(x,h.position.y+.03,z);scene.add(a);markers.push(a);
}
function createContactShadow(){const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d'),gr=ctx.createRadialGradient(32,32,0,32,32,30);gr.addColorStop(0,'rgba(15,25,35,.3)');gr.addColorStop(1,'rgba(15,25,35,0)');ctx.fillStyle=gr;ctx.fillRect(0,0,64,64);const m=new THREE.Mesh(new THREE.PlaneGeometry(1.0,.8),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;scene.add(m);return m;}
const contactShadow=createContactShadow();

async function init(){
 progress(2,'ABRIENDO EL DISTRITO DEL RÍO');
 const tex=await new THREE.TextureLoader().loadAsync('./assets/city-panorama.webp');tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 backdrop=new THREE.Mesh(new THREE.PlaneGeometry(1800,1200),new THREE.MeshBasicMaterial({map:tex,fog:false,toneMapped:false,depthWrite:false}));backdrop.position.set(0,-30,-650);backdrop.renderOrder=-100;scene.add(backdrop);
 const runner=await loader.loadAsync('./assets/runner.glb');avatar=new THREE.Group();avatar.add(runner.scene);runner.scene.scale.setScalar(1.82/.9763185);avatar.rotation.y=Math.PI;scene.add(avatar);
 runner.scene.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;n.frustumCulled=false;n.material.envMapIntensity=.4;}});
 anim=new RunnerAnimation(runner.scene,runner.animations);state.animations=runner.animations.map(c=>({name:c.name,duration:c.duration}));state.bones=0;runner.scene.traverse(n=>{if(n.isBone)state.bones++;});
 progress(12,'PERSONAJE Y ANIMACIONES LISTOS');
 for(const [i,b] of LEVEL.entries()){
  const [g,c]=await Promise.all([loader.loadAsync(`./assets/${b.id}.glb`),loader.loadAsync(`./assets/${b.id}-collider.glb`)]);
  for(const object of [g.scene,c.scene]){object.scale.setScalar(b.scale);object.position.set(b.offsetX,b.y,b.z);object.updateMatrixWorld(true);}
  g.scene.traverse(n=>{if(n.isMesh){n.castShadow=i<3;n.receiveShadow=true;n.material.envMapIntensity=.25;n.material.normalScale?.set(.65,.65);if(n.material.map)n.material.map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());}});
  scene.add(g.scene);collisionGroup.add(c.scene);buildings.push(g.scene);state.assets.push(b.id);
  progress(12+(i+1)*10,`COLOCANDO AZOTEA ${i+1} DE 7`);
 }
 progress(88,'PREPARANDO SUPERFICIES Y SOMBRAS');collisionGroup.updateMatrixWorld(true);world.fromGraphNode(collisionGroup);
 for(const b of LEVEL)for(const p of b.route)createArrow(p.x,p.z);
 const g=LEVEL.at(-1),doorLight=new THREE.PointLight(0xffbd66,9,6,2);doorLight.position.set(0,4.2,g.z-.19*g.scale);scene.add(doorLight);
 physics.teleport(checkpoint);for(let i=0;i<30;i++)physics.step(1/120,{x:0,z:0});checkpoint.copy(physics.position);avatar.position.copy(physics.position);
 updateCamera(1,true);updateSun();renderer.render(scene,camera);
 ready=true;state.loaded=true;state.colliderTriangles=collisionGroup.children.reduce((sum,g)=>{g.traverse(n=>{if(n.isMesh)sum+=(n.geometry.index?.count??n.geometry.attributes.position.count)/3;});return sum;},0);state.level=LEVEL;progress(100,'TU RECORRIDO ESTÁ LISTO');
 $('loading').style.opacity='0';setTimeout(()=>$('loading').classList.add('hidden'),650);
 updateHUD();
 if(new URLSearchParams(location.search).has('play'))start();
}

function start(){if(!ready)return;started=true;paused=false;completed=false;document.body.classList.remove('is-intro','is-paused');$('menu').classList.add('hidden');$('finish').classList.add('hidden');audio.init();toast('Mueve el joystick hacia arriba para avanzar.',4);}
function pause(){if(!started||completed||respawning)return;paused=true;controls.reset();document.body.classList.add('is-paused');$('menu').classList.remove('hidden');}
function resume(){paused=false;document.body.classList.remove('is-paused');$('menu').classList.add('hidden');}
function reset(){elapsed=0;roofIndex=bestRoof=0;checkpoint.set(SPAWN.x,SPAWN.y,SPAWN.z);mantle=null;airTime=0;physics.teleport(checkpoint);controls.reset();start();updateCamera(1,true);}
function jump(){if(!started||paused||completed||respawning||mantle)return;physics.requestJump();}
function climb(){if(!started||paused||completed||respawning||mantle)return;const target=physics.mantleTarget(direction);if(!target){toast('Acércate al borde del obstáculo para trepar.',2);return;}mantle={start:physics.position.clone(),end:target.end,elapsed:0,duration:1.5,rise:target.rise};physics.velocity.set(0,0,0);controls.setAuto(false);}
const controls=createControls({jump,action:climb,pause:()=>paused?resume():pause(),autoChanged:a=>{if(a&&started)toast('Carrera continua · dirige con el joystick.',2.5);}});
$('start').onclick=start;$('pause').onclick=pause;$('resume').onclick=resume;$('restart').onclick=reset;$('replay').onclick=reset;
$('sound').onclick=()=>{$('sound').innerHTML=`<svg><use href="#i-sound"/></svg> SONIDO: ${audio.toggle()?'SÍ':'NO'}`;};
function setQuality(q){quality=q;const high=q==='high';renderer.setPixelRatio(Math.min(devicePixelRatio,high?1.5:1));renderer.shadowMap.enabled=high;renderer.setSize(innerWidth,innerHeight);$('quality').textContent='CALIDAD: '+(high?'ALTA':'FLUIDA');}
$('quality').onclick=()=>setQuality(quality==='high'?'low':'high');
window.parkutPause=pause;

async function respawn(){if(respawning||completed)return;respawning=true;controls.reset();$('fade').classList.add('active');await new Promise(r=>setTimeout(r,400));physics.teleport(checkpoint);mantle=null;airTime=0;updateCamera(1,true);$('fade').classList.remove('active');respawning=false;toast('De vuelta en la última azotea. Inténtalo otra vez.',3.5);}
function finish(){completed=true;controls.reset();physics.velocity.set(0,0,0);$('finish-time').textContent=formatTime(elapsed);$('finish').classList.remove('hidden');$('progress').style.width='100%';try{const b=Number(localStorage.getItem('parkut-best')||Infinity);if(elapsed<b)localStorage.setItem('parkut-best',String(elapsed));}catch{}}
function updateSun(){const p=physics.position;sun.position.set(p.x-30,p.y+42,p.z+22);sun.target.position.set(p.x,p.y,p.z-10);sun.target.updateMatrixWorld();}
function updateCamera(dt,snap=false){
 const p=physics.position,speed=physics.velocity.length(),fov=64+Math.min(2,speed*.18);camera.fov=THREE.MathUtils.lerp(camera.fov,fov,snap?1:1-Math.exp(-dt*2));camera.updateProjectionMatrix();
 cameraGoal.set(p.x-.5,p.y+5.2-landBounce*.08,p.z+8.8);
 camera.position.lerp(cameraGoal,snap?1:1-Math.exp(-dt*8));
 lookTarget.set(p.x,p.y+1.25,p.z-7.5);camera.lookAt(lookTarget);
 if(backdrop){backdrop.position.x=camera.position.x*.94;backdrop.position.z=camera.position.z-650;}
}
function updateHUD(){
 const travelled=clamp(SPAWN.z-physics.position.z,0,DISTANCE),pct=travelled/DISTANCE*100;
 $('distance').textContent=`${Math.floor(travelled)} / ${Math.round(DISTANCE)} m`;$('progress').style.width=pct+'%';$('clock').textContent=formatTime(elapsed);
 $('roof-name').textContent=LEVEL[roofIndex].name;$('roof-count').textContent=`AZOTEA ${roofIndex+1} / 7`;
}
function updateProgress(){
 const p=physics.position;
 for(let i=0;i<LEVEL.length;i++){const b=LEVEL[i];if(p.z<=b.entryZ+.8&&p.z>=b.exitZ-.8){roofIndex=i;break;}}
 if(roofIndex>bestRoof&&physics.grounded){bestRoof=roofIndex;checkpoint.copy(p);checkpoint.y+=.06;$('checkpoint').classList.add('show');setTimeout(()=>$('checkpoint').classList.remove('show'),2500);
  if(roofIndex===5)toast('El hueco es largo: usa la cornisa de la izquierda.',5);
  else if(roofIndex===6)toast('La puerta iluminada es el final del recorrido.',4);
 }
 if(physics.grounded&&roofIndex===6&&Math.hypot(p.x-GOAL.x,p.z-GOAL.z)<1.8)finish();
 if(p.y<-8||Math.abs(p.x)>55)respawn();
}

let previous=performance.now(),accumulator=0,hudTimer=0,actionTimer=0;
function frame(now){
 const dt=Math.min((now-previous)/1000,.05);previous=now;requestAnimationFrame(frame);
 if(!ready)return;
 if(started&&!paused&&!completed&&!respawning){
  elapsed+=dt;accumulator=Math.min(accumulator+dt,.10);const input=controls.get();
  while(accumulator>=1/120){
   if(mantle){
    mantle.elapsed+=1/120;const t=clamp(mantle.elapsed/mantle.duration,0,1),ease=t*t*(3-2*t);
    const next=mantle.start.clone().lerp(mantle.end,ease);next.y=mantle.start.y+(mantle.end.y-mantle.start.y)*Math.sin(t*Math.PI/2)+Math.sin(t*Math.PI)*.20;
    physics.teleport(next);if(t>=1){mantle=null;physics.velocity.set(0,0,0);}
   }else{
    const r=physics.step(1/120,input,6.4);if(r.landed)landBounce=Math.min(1,Math.abs(r.impact)/10);if(r.stepHeight>.02)stairsTime=.3;
   }
   accumulator-=1/120;
  }
  const speed=Math.hypot(physics.velocity.x,physics.velocity.z);
  if(speed>.25){direction.set(physics.velocity.x,0,physics.velocity.z).normalize();const target=Math.atan2(direction.x,direction.z),delta=Math.atan2(Math.sin(target-avatar.rotation.y),Math.cos(target-avatar.rotation.y));avatar.rotation.y+=delta*(1-Math.exp(-dt*13));}
  airTime=physics.grounded?0:airTime+dt;stairsTime=Math.max(0,stairsTime-dt);landBounce=Math.max(0,landBounce-dt*5);
  anim.update(dt,{speed,grounded:physics.grounded,climbing:!!mantle,stairs:stairsTime>0,airTime});
  avatar.position.copy(physics.position);audio.tick(dt,speed,physics.grounded);
  updateProgress();
  actionTimer+=dt;if(actionTimer>.18){actionTimer=0;$('action').classList.toggle('available',!!physics.mantleTarget(direction));}
  if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('hint').classList.remove('show');}
 }else if(!paused&&!completed){anim.update(dt,{speed:0,grounded:true,climbing:false,stairs:false,airTime:0});avatar.position.copy(physics.position);}
 const ground=groundAt(physics.position.x,physics.position.z,physics.position.y+.25,7);
 contactShadow.visible=!!ground;if(ground){contactShadow.position.set(physics.position.x,ground.position.y+.02,physics.position.z);contactShadow.material.opacity=Math.max(0,1-(physics.position.y-ground.position.y)/3);}
 updateCamera(dt);updateSun();hudTimer+=dt;
 if(hudTimer>.12){hudTimer=0;updateHUD();for(let i=0;i<buildings.length;i++){buildings[i].visible=Math.abs(LEVEL[i].z-physics.position.z)<135;buildings[i].traverse(n=>{if(n.isMesh)n.castShadow=Math.abs(LEVEL[i].z-physics.position.z)<43;});}}
 renderer.render(scene,camera);
 frameCount++;fpsTime+=dt;if(fpsTime>1){fps=frameCount/fpsTime;frameCount=0;fpsTime=0;state.fps=Math.round(fps);}
}
requestAnimationFrame(frame);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();toast('La imagen se ha interrumpido. Vuelve a abrir la aplicación.',30);});
document.addEventListener('contextmenu',e=>e.preventDefault());
// Read-only diagnostic state; test actions are enabled only by an explicit local URL flag.
window.parkut={getState:()=>({...state,position:physics.position.toArray(),grounded:physics.grounded,roof:roofIndex,elapsed,started,paused,completed,animation:anim?.current,render:renderer.info.render})};
if(new URLSearchParams(location.search).has('test'))window.parkut.test={teleport:(x,y,z)=>{physics.teleport(new THREE.Vector3(x,y,z));updateCamera(1,true);},start,reset,jump,climb,pause,resume,setQuality,ground:(x,z,y=40)=>groundAt(x,z,y)?.position.toArray(),setInput:controls.setAuto,goal:GOAL,level:LEVEL};
init().catch(e=>{console.error(e);state.errors.push(String(e));$('load-label').textContent='No se pudo cargar la ciudad. Cierra y vuelve a abrir la aplicación.';$('load-count').textContent=e.message;});
