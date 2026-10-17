import * as THREE from 'three';
import {GLTFLoader} from './vendor/examples/jsm/loaders/GLTFLoader.js';
import {Octree} from './vendor/examples/jsm/math/Octree.js';
import {Sky} from './vendor/examples/jsm/objects/Sky.js';
import {LADDERS,STAIRS} from './traversal.js';
import {AdvancedTraversal} from './advanced-traversal.js';
import {createParkourCourse} from './parkour-course.js';
import {createAtmosphere} from './atmosphere.js';
import {RunnerPhysics} from './physics.js';
import {RunnerAnimation} from './animation.js';
import {FollowCamera} from './camera.js';
import {createCity} from './city.js';
import {createControls} from './controls.js';
import {GameAudio} from './audio.js';
import {LEVEL,SPAWN,GOAL,DISTANCE} from './level.js';

const $=id=>document.getElementById(id),clamp=THREE.MathUtils.clamp;
document.body.classList.add('is-intro');
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',alpha:false});}
catch(e){$('load-label').textContent='Tu dispositivo necesita WebGL 2 para abrir Jumping in the City.';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
$('viewport').appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x94b6d2);scene.fog=new THREE.Fog(0xb8c7ce,80,330);
const camera=new THREE.PerspectiveCamera(64,innerWidth/innerHeight,.1,1200);
const hemi=new THREE.HemisphereLight(0xb9d9ff,0x6d5948,.70);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffd4a0,3.8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-27,right:27,top:27,bottom:-27,near:1,far:140});
sun.shadow.bias=-.00006;sun.shadow.normalBias=.035;sun.shadow.radius=2;scene.add(sun,sun.target);
const pmrem=new THREE.PMREMGenerator(renderer),sky=new Sky(),skyScene=new THREE.Scene();sky.scale.setScalar(100);sky.material.uniforms.turbidity.value=6;sky.material.uniforms.rayleigh.value=1.7;sky.material.uniforms.mieCoefficient.value=.006;sky.material.uniforms.sunPosition.value.set(-36,33,20);skyScene.add(sky);scene.environment=pmrem.fromScene(skyScene,.04).texture;scene.environmentIntensity=.45;sky.geometry.dispose();sky.material.dispose();pmrem.dispose();
const atmosphere=createAtmosphere(scene);
const loader=new GLTFLoader(),world=new Octree(),collisionGroup=new THREE.Group(),buildings=[],markers=[];
const physics=new RunnerPhysics(world),traversal=new AdvancedTraversal(physics),audio=new GameAudio(),view=new FollowCamera(camera,world);
let avatar,anim,backdrop,city,course,checkpointIndex=0,ready=false,started=false,paused=false,completed=false,respawning=false,elapsed=0,roofIndex=0,bestRoof=0;
let checkpoint=new THREE.Vector3(SPAWN.x,SPAWN.y,SPAWN.z),quality='high',toastTimer=0,lastHint='',frameCount=0,fpsTime=0,fps=60;
const direction=new THREE.Vector3(0,0,-1),lookTarget=new THREE.Vector3(),cameraGoal=new THREE.Vector3();
const state={version:'0.5.0',loaded:false,errors:[],assets:[],fps:60};
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
function markLandings(){
 const material=new THREE.MeshBasicMaterial({color:0xffcf69,transparent:true,opacity:.72,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
 for(let i=0;i<LEVEL.length-1;i++)for(const [b,entry] of [[LEVEL[i],false],[LEVEL[i+1],true]]){const x=(entry?b.route[0]:b.route.at(-1)).x,z=entry?b.entryZ-1.05:b.exitZ+.9,h=groundAt(x,z,b.height+2,4);if(!h)continue;
  for(const dx of [-.8,.8]){const mark=new THREE.Mesh(new THREE.PlaneGeometry(.12,1.6),material);mark.rotation.x=-Math.PI/2;mark.position.set(x+dx,h.position.y+.04,z);scene.add(mark);}
 }
}

async function init(){
 progress(2,'ABRIENDO EL DISTRITO DEL RÍO');
 const tex=await new THREE.TextureLoader().loadAsync('./assets/city-panorama.webp');tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 tex.wrapS=THREE.MirroredRepeatWrapping;tex.repeat.set(4,1);tex.offset.x=.5;
 backdrop=new THREE.Mesh(new THREE.CylinderGeometry(650,650,1200,64,1,true),new THREE.MeshBasicMaterial({map:tex,side:THREE.BackSide,fog:false,toneMapped:false,depthWrite:false}));backdrop.position.set(0,-30,0);backdrop.renderOrder=-100;scene.add(backdrop);
 const runner=await loader.loadAsync('./assets/parkour/runner-traversal.glb');avatar=new THREE.Group();avatar.add(runner.scene);runner.scene.scale.setScalar(1.82/.9763185);avatar.rotation.y=Math.PI;scene.add(avatar);
 runner.scene.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;n.frustumCulled=false;n.material.envMapIntensity=.65;}});
 anim=new RunnerAnimation(runner.scene,runner.animations);state.animations=runner.animations.map(c=>({name:c.name,duration:c.duration}));state.bones=0;runner.scene.traverse(n=>{if(n.isBone)state.bones++;});
 progress(12,'PERSONAJE Y ANIMACIONES LISTOS');
 for(const [i,b] of LEVEL.entries()){
  const [g,c]=await Promise.all([loader.loadAsync(`./assets/${b.id}.glb`),loader.loadAsync(`./assets/${b.id}-collider.glb`)]);
  for(const object of [g.scene,c.scene]){object.scale.setScalar(b.scale);object.position.set(b.offsetX,b.y,b.z);object.updateMatrixWorld(true);}
  g.scene.traverse(n=>{if(n.isMesh){n.castShadow=i<3;n.receiveShadow=true;n.material.envMapIntensity=.5;n.material.normalScale?.set(.65,.65);if(n.material.map)n.material.map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());}});
  scene.add(g.scene);collisionGroup.add(c.scene);buildings.push(g.scene);state.assets.push(b.id);
  progress(12+(i+1)*8,`COLOCANDO AZOTEA ${i+1} DE 7`);
 }
 progress(70,'UNIENDO CALLES Y CRUCES');
 city=await createCity(scene,loader,LEVEL,(n,total)=>progress(70+19*n/total,`PREPARANDO CIUDAD Y PERSONAJES ${n} / ${total}`));
 progress(90,'PREPARANDO OBSTÁCULOS Y ACCESO A LA CALLE');collisionGroup.updateMatrixWorld(true);world.fromGraphNode(collisionGroup);
 course=await createParkourCourse(scene,loader,LEVEL,physics,collisionGroup,city);traversal.configure(course);collisionGroup.updateMatrixWorld(true);world.clear();world.fromGraphNode(collisionGroup);progress(96,'CONECTANDO EL RECORRIDO');
 for(const b of LEVEL)for(const p of b.route)createArrow(p.x,p.z);
 markLandings();
 const g=LEVEL.at(-1),doorLight=new THREE.PointLight(0xffbd66,9,6,2);doorLight.position.set(g.offsetX,g.height+4.2,g.z-.19*g.scale);scene.add(doorLight);
 physics.teleport(checkpoint);for(let i=0;i<30;i++)physics.step(1/120,{x:0,z:0});checkpoint.copy(physics.position);avatar.position.copy(physics.position);anim.update(0,{speed:0,grounded:true});
 updateCamera(1,true);updateSun();renderer.render(scene,camera);
 ready=true;state.loaded=true;state.colliderTriangles=collisionGroup.children.reduce((sum,g)=>{g.traverse(n=>{if(n.isMesh)sum+=(n.geometry.index?.count??n.geometry.attributes.position.count)/3;});return sum;},0);state.level=LEVEL;progress(100,'TU RECORRIDO ESTÁ LISTO');
 $('loading').style.opacity='0';setTimeout(()=>$('loading').classList.add('hidden'),650);
 updateHUD();
 if(new URLSearchParams(location.search).has('play'))start();
}

function start(){if(!ready)return;started=true;paused=false;completed=false;document.body.classList.remove('is-intro','is-paused');$('menu').classList.add('hidden');$('finish').classList.add('hidden');audio.init();toast('Joystick para moverte · arrastra a la derecha para mirar.',5);}
function pause(){if(!started||completed||respawning)return;paused=true;controls.reset();document.body.classList.add('is-paused');$('menu').classList.remove('hidden');}
function resume(){paused=false;document.body.classList.remove('is-paused');$('menu').classList.add('hidden');}
function reset(){view.recenter();elapsed=0;roofIndex=bestRoof=checkpointIndex=0;checkpoint.set(SPAWN.x,SPAWN.y,SPAWN.z);traversal.reset();physics.teleport(checkpoint);controls.reset();start();updateCamera(1,true);}
function jump(){if(!started||paused||completed||respawning)return;traversal.requestJump();}
function flip(){if(started&&!paused&&!completed)traversal.flip();}
function climb(){if(started&&!paused)traversal.tryAttach({x:direction.x,z:direction.z});}
const controls=createControls({jump,flip,pause:()=>paused?resume():pause(),look:(x,y)=>view.drag(x,y),recenter:()=>view.recenter(),canLook:()=>started&&!paused&&!completed,autoChanged:a=>{if(a&&started)toast('Carrera continua · puedes mirar alrededor.',2.5);}});
$('start').onclick=start;$('pause').onclick=pause;$('resume').onclick=resume;$('restart').onclick=reset;$('replay').onclick=reset;$('retry').onclick=()=>{resume();respawn();};
$('sound').onclick=()=>{$('sound').innerHTML=`<svg><use href="#i-sound"/></svg> SONIDO: ${audio.toggle()?'SÍ':'NO'}`;};
function setQuality(q){quality=q;const high=q==='high';renderer.setPixelRatio(Math.min(devicePixelRatio,high?1.5:1));renderer.shadowMap.enabled=high;renderer.setSize(innerWidth,innerHeight);$('quality').textContent='CALIDAD: '+(high?'ALTA':'FLUIDA');city?.setQuality(q);}
$('quality').onclick=()=>setQuality(quality==='high'?'low':'high');
window.parkutPause=pause;

async function respawn(){if(respawning||completed)return;respawning=true;controls.reset();$('fade').classList.add('active');await new Promise(r=>setTimeout(r,400));physics.teleport(checkpoint);traversal.reset();updateCamera(1,true);$('fade').classList.remove('active');respawning=false;toast('De vuelta en el último punto de control.',3.5);}
function finish(){completed=true;controls.reset();physics.velocity.set(0,0,0);$('finish-time').textContent=formatTime(elapsed);$('finish').classList.remove('hidden');$('progress').style.width='100%';try{const b=Number(localStorage.getItem('parkut-best')||Infinity);if(elapsed<b)localStorage.setItem('parkut-best',String(elapsed));}catch{}}
const cameraAnchor=view.anchor;
function updateSun(){
 const p=cameraAnchor,step=54/2048,x=Math.round(p.x/step)*step,z=Math.round((p.z-8)/step)*step;
 sun.position.set(x-36,p.y+45,z+24);sun.target.position.set(x,p.y+5,z);sun.target.updateMatrixWorld();
}
function updateCamera(dt,snap=false){
 view.update(dt,physics.position,Math.hypot(physics.velocity.x,physics.velocity.z),snap);
 if(backdrop){backdrop.position.x=camera.position.x;backdrop.position.z=camera.position.z;}
}
function movementInput(){const input=controls.get(),motion=view.movement(input);if(input.auto){motion.z=Math.min(motion.z-.85,-.2);}return motion;}
function updateMovementLabel(speed){const labels={ladder:'ESCALERA',climb:'TREPANDO',land:'AMORTIGUANDO',monkey:'BARRAS · JOYSTICK PARA AVANZAR',pole:'TUBO · JOYSTICK PARA DESCENDER',net:'RED · JOYSTICK PARA SUBIR',ledge:'CORNISA · LATERAL / SALTAR PARA SUBIR',wall:'CARRERA POR PARED',flip:'MORTAL HACIA ATRÁS',balance:'CUIDADO CON EL BORDE'};const label=labels[traversal.animation?.mode]||(physics.position.y<-15?'PASEO DE LA CIUDAD':'PARKOUR AUTOMÁTICO');$('movement-state').textContent=label;$('movement-state').classList.toggle('performing',!!traversal.animation);}
function updateHUD(){
 const cp=course?.checkpoints[checkpointIndex],total=course?.checkpoints.length||8;
 $('distance').textContent=`${Math.min(checkpointIndex,total)} / ${total} etapas`;$('progress').style.width=(checkpointIndex/total*100)+'%';$('clock').textContent=formatTime(elapsed);
 $('roof-name').textContent=cp?.name||'EL REFUGIO';$('roof-count').textContent=physics.position.y<-15?'A NIVEL DE CALLE':`AZOTEA ${roofIndex+1} / 7`;
}
function updateProgress(){
 const p=physics.position;for(let i=0;i<LEVEL.length;i++){const b=LEVEL[i];if(p.z<=b.entryZ+.8&&p.z>=b.exitZ-.8){roofIndex=i;break;}}
 const cp=course?.checkpoints[checkpointIndex];
 if(cp&&physics.grounded&&!traversal.active&&p.distanceTo(cp.position)<cp.radius){
  checkpoint.copy(cp.position).y+=.06;checkpointIndex++;bestRoof=Math.max(bestRoof,cp.roof);course.rings[checkpointIndex-1].material.color.setHex(0x61d5b5);$('checkpoint').classList.add('show');setTimeout(()=>$('checkpoint').classList.remove('show'),2200);
  const next=course.checkpoints[checkpointIndex];if(next)toast(next.id==='street'?'Busca el tubo amarillo: el recorrido baja al paseo.':next.id==='roof-02'?'Camina hasta la red amarilla y vuelve a subir.':'Siguiente etapa: '+next.name,5);
 }
 if(physics.grounded&&checkpointIndex===course?.checkpoints.length&&Math.hypot(p.x-GOAL.x,p.z-GOAL.z)<1.8)finish();
 if(p.y<-31||Math.abs(p.x)>165||p.z>250||p.z<-390)respawn();
}

let previous=performance.now(),accumulator=0,hudTimer=0;
function frame(now){
 const actualDt=(now-previous)/1000,dt=Math.min(actualDt,.05);previous=now;requestAnimationFrame(frame);
 if(!ready||paused)return;
 if(started&&!paused&&!completed&&!respawning){
  elapsed+=Math.min(actualDt,.25);accumulator=Math.min(accumulator+dt,.10);const input=movementInput();
  while(accumulator>=1/120){traversal.step(1/120,input);accumulator-=1/120;}
  const speed=Math.hypot(physics.velocity.x,physics.velocity.z),active=traversal.active;
  if(active)direction.copy(active.ladder?.facing||active.dir||direction);
  else if(speed>.25)direction.set(physics.velocity.x,0,physics.velocity.z).normalize();
  if(active||speed>.25){const target=Math.atan2(direction.x,direction.z),delta=Math.atan2(Math.sin(target-avatar.rotation.y),Math.cos(target-avatar.rotation.y));avatar.rotation.y+=delta*(1-Math.exp(-dt*13));}
  avatar.position.copy(physics.position);
  anim.update(dt,{speed,grounded:physics.grounded,stairs:physics.onStairs,verticalSpeed:physics.velocity.y,action:traversal.animation});
  audio.tick(dt,speed,physics.grounded);updateProgress();
  updateMovementLabel(speed);
  if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('hint').classList.remove('show');}
 }else if(!paused&&!completed){avatar.position.copy(physics.position);anim.update(dt,{speed:0,grounded:true});}
 const ground=groundAt(physics.position.x,physics.position.z,physics.position.y+.25,7);
 contactShadow.visible=!!ground;if(ground){contactShadow.position.set(physics.position.x,ground.position.y+.035,physics.position.z);contactShadow.material.opacity=Math.max(0,1-(physics.position.y-ground.position.y)/3);}
 if(!paused){updateCamera(dt);atmosphere.update(dt,cameraAnchor);city?.update(dt,cameraAnchor,camera);course?.update(dt,physics.position);}
 updateSun();hudTimer+=dt;
 if(hudTimer>.16){hudTimer=0;updateHUD();for(let i=0;i<buildings.length;i++){buildings[i].visible=Math.abs(LEVEL[i].z-physics.position.z)<135;buildings[i].traverse(n=>{if(n.isMesh)n.castShadow=Math.abs(LEVEL[i].z-physics.position.z)<52;});}}
 renderer.render(scene,camera);frameCount++;fpsTime+=actualDt;if(fpsTime>1){fps=frameCount/fpsTime;frameCount=0;fpsTime=0;state.fps=Math.round(fps);}
}
requestAnimationFrame(frame);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();toast('La imagen se ha interrumpido. Vuelve a abrir la aplicación.',30);});
document.addEventListener('contextmenu',e=>e.preventDefault());
// Read-only diagnostic state; test actions are enabled only by an explicit local URL flag.
window.parkut={getState:()=>({...state,position:physics.position.toArray(),grounded:physics.grounded,roof:roofIndex,elapsed,started,paused,completed,animation:anim?.current,animationsUsed:[...(anim?.used||[])],action:traversal.animation,actionHistory:traversal.history,camera:camera.position.toArray(),orbit:view.state,traffic:city?.state,pedestrians:city?.pedestrians.state,landscape:city?.landscape.state,ladderIK:anim?.ikErrors,checkpoint:checkpoint.toArray(),checkpointIndex,course:course?{objects:course.objects.length,zones:course.zones.map(z=>({id:z.id,type:z.type})),checkpoints:course.checkpoints.length}:null,velocity:physics.velocity.toArray(),render:renderer.info.render})};
if(new URLSearchParams(location.search).has('test'))window.parkut.test={teleport:(x,y,z)=>{physics.teleport(new THREE.Vector3(x,y,z));traversal.reset();updateCamera(1,true);},start,reset,jump,flip,climb,pause,resume,setQuality,ground:(x,z,y=40)=>groundAt(x,z,y)?.position.toArray(),setInput:controls.setAuto,setJoystick:controls.setTestInput,look:(dx,dy)=>{view.drag(dx,dy);updateCamera(1,true);renderer.render(scene,camera);},recenter:()=>{view.recenter();updateCamera(1,true);},viewpoint:(position,target)=>{camera.position.fromArray(position);camera.lookAt(new THREE.Vector3().fromArray(target));city?.update(0,camera.position,camera);renderer.render(scene,camera);},pedestrians:()=>city?.pedestrians.debug(),pedestrianActors:()=>city?.pedestrians.actors.map(a=>({id:a.person.id,modelY:a.model.position.y,visible:a.pivot.visible,position:a.pivot.position.toArray()})),advanceCity:seconds=>{city.update(seconds,physics.position,camera);renderer.render(scene,camera);return city.pedestrians.debug();},cityProbe:(x,z)=>{scene.updateMatrixWorld(true);const ray=new THREE.Raycaster(new THREE.Vector3(x,-22,z),new THREE.Vector3(0,-1,0));return ray.intersectObjects(city.landscape.walkMeshes,false)[0]?.point.toArray();},citySurfaces:()=>city.landscape.surfaces,cityPools:()=>city.landscape.pools,traffic:()=>city?.debug(),advanceTraffic:seconds=>{city.update(seconds,physics.position,camera);renderer.render(scene,camera);return city.debug();},course:()=>({objects:course.objects,zones:course.zones,checkpoints:course.checkpoints}),traversalState:()=>traversal.active,attachZone:id=>{const z=course.zones.find(z=>z.id===id);return z?traversal.attach(z):false;},stepPhysics:(seconds,input={x:0,z:0})=>{for(let t=0;t<seconds;t+=1/120){traversal.step(1/120,input);updateProgress();}return window.parkut.getState();},simulate:(seconds,input={x:0,z:0})=>{for(let t=0;t<seconds;t+=1/120){traversal.step(1/120,input);updateProgress();}avatar.position.copy(physics.position);const a=traversal.active;if(a)direction.copy(a.ladder?.facing||a.dir||direction);else if(Math.hypot(input.x,input.z)>.1)direction.set(input.x,0,input.z).normalize();avatar.rotation.y=Math.atan2(direction.x,direction.z);anim.update(1/30,{speed:Math.hypot(physics.velocity.x,physics.velocity.z),grounded:physics.grounded,stairs:physics.onStairs,verticalSpeed:physics.velocity.y,action:traversal.animation});updateMovementLabel(physics.velocity.length());updateHUD();updateCamera(.1,true);renderer.render(scene,camera);return window.parkut.getState();},bones:()=>Object.fromEntries(Object.entries(anim.bones).filter(([name])=>/Hips|Arm$|ForeArm$|Hand$|Foot$|Leg$/.test(name)).map(([name,b])=>[name,b.getWorldPosition(new THREE.Vector3()).toArray()])),goal:GOAL,advance:(seconds,input={x:0,z:0})=>{for(let t=0;t<seconds;t+=1/120){traversal.step(1/120,input);avatar.position.copy(physics.position);const a=traversal.active;if(a)direction.copy(a.ladder?.facing||a.dir||direction);else if(Math.hypot(input.x,input.z)>.1)direction.set(input.x,0,input.z).normalize();avatar.rotation.y=Math.atan2(direction.x,direction.z);anim.update(1/120,{speed:Math.hypot(physics.velocity.x,physics.velocity.z),grounded:physics.grounded,stairs:physics.onStairs,verticalSpeed:physics.velocity.y,action:traversal.animation});}updateProgress();updateHUD();updateMovementLabel(Math.hypot(physics.velocity.x,physics.velocity.z));updateCamera(1,true);updateSun();city?.update(seconds,physics.position,camera);renderer.render(scene,camera);return window.parkut.getState();},level:LEVEL,ladders:LADDERS,stairs:STAIRS,pose:(name,t)=>{anim.play(name,0);anim.actions[name].paused=true;anim.actions[name].time=t;anim.mixer.update(0);anim.placeOnSupport();},support:()=>({offset:anim.model.position.y,samples:anim.samples.map(s=>s.ids.length)})};
init().catch(e=>{console.error(e);state.errors.push(String(e));$('load-label').textContent='No se pudo cargar la ciudad. Cierra y vuelve a abrir la aplicación.';$('load-count').textContent=e.message;});
