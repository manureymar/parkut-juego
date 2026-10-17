export function createControls({jump,flip,interact,pause,autoChanged,look,recenter,canLook=()=>true}){
 const keys=new Set(),joy={x:0,z:0},pad=document.querySelector('#joystick'),stick=document.querySelector('#stick'),autoBtn=document.querySelector('#auto-run');let pointer=null,auto=false;
 const setAuto=value=>{auto=value;autoBtn.classList.toggle('active',auto);autoChanged?.(auto);};
 const move=e=>{const b=pad.getBoundingClientRect(),r=b.width/2,dx=e.clientX-b.left-r,dy=e.clientY-b.top-r,len=Math.hypot(dx,dy),m=Math.min(1,len/(r*.7));joy.x=len?dx/len*m:0;joy.z=len?dy/len*m:0;stick.style.transform=`translate(${joy.x*32}px,${joy.z*32}px)`;};
 pad.addEventListener('pointerdown',e=>{e.preventDefault();pointer=e.pointerId;pad.setPointerCapture(pointer);move(e);});
 pad.addEventListener('pointermove',e=>{if(e.pointerId===pointer)move(e);});
 const release=()=>{pointer=null;joy.x=joy.z=0;stick.style.transform='';};
 pad.addEventListener('pointerup',release);pad.addEventListener('pointercancel',release);pad.addEventListener('lostpointercapture',release);
 const canvas=document.querySelector('#viewport canvas');let lookPointer=null,lastX=0,lastY=0;
 canvas.addEventListener('pointerdown',e=>{if(!canLook()||lookPointer!==null)return;e.preventDefault();lookPointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(e.pointerId!==lookPointer)return;look?.(e.clientX-lastX,e.clientY-lastY);lastX=e.clientX;lastY=e.clientY;});
 const releaseLook=()=>{lookPointer=null;};for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,releaseLook);
 document.querySelector('#recenter').onclick=()=>recenter?.();
 for(const [id,fn] of [['jump',jump],['flip',flip],['interact',interact]])document.querySelector('#'+id).addEventListener('pointerdown',e=>{e.preventDefault();fn();});
 autoBtn.onclick=()=>setAuto(!auto);
 addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyW','KeyA','KeyS','KeyD'].includes(e.code))e.preventDefault();keys.add(e.code);if(!e.repeat){if(e.code==='Space')jump();if(e.code==='KeyE')interact?.();if(e.code==='KeyF')flip?.();if(e.code==='Escape'||e.code==='KeyP')pause();if(e.code==='KeyR')setAuto(!auto);if(e.code==='KeyC')recenter?.();}});
 addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();release();setAuto(false);pause();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();release();setAuto(false);pause();}});
 return {get(){return {x:Math.max(-1,Math.min(1,joy.x+(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0))),z:Math.max(-1,Math.min(1,joy.z+(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0))),auto};},reset(){keys.clear();release();releaseLook();setAuto(false);},setAuto,setTestInput:(x,z)=>{joy.x=x;joy.z=z;}};
}
