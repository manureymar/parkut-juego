// Seedable scheduling and paths are separate from rendering, so off-screen citizens
// keep their own schedules without spending time updating invisible skeletons.
export function randomSource(seed){let state=seed>>>0;return ()=>{state+=0x6D2B79F5;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function motionAt(clip,time){
 const curve=clip.motion;if(!clip.locomotion||!curve?.length)return 0;
 let lo=0,hi=curve.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(curve[mid][0]<=time)lo=mid;else hi=mid;}
 const a=curve[lo],b=curve[hi],f=clamp((time-a[0])/(b[0]-a[0]||1),0,1);return a[1]+(b[1]-a[1])*f;
}
export function makeRoute(id,cx,z0,z1){
 const radius=.9,points=[];
 // Rounded U-turns keep people facing along the pavement, rather than snapping 180 degrees.
 for(let i=0;i<=10;i++){const a=Math.PI+i*Math.PI/10;points.push({x:cx+radius*Math.cos(a),z:z0+radius*Math.sin(a)});}
 for(let i=0;i<=10;i++){const a=i*Math.PI/10;points.push({x:cx+radius*Math.cos(a),z:z1+radius*Math.sin(a)});}
 const segments=[];let length=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],d=Math.hypot(b.x-a.x,b.z-a.z);segments.push({a,b,start:length,length:d});length+=d;}
 return {id,cx,z0,z1,radius,points,segments,length};
}
export function routePosition(route,distance){
 const s=((distance%route.length)+route.length)%route.length,segment=route.segments.find(v=>s<v.start+v.length)||route.segments.at(-1),f=(s-segment.start)/segment.length;
 return {x:segment.a.x+(segment.b.x-segment.a.x)*f,z:segment.a.z+(segment.b.z-segment.a.z)*f,yaw:Math.atan2(segment.b.x-segment.a.x,segment.b.z-segment.a.z)};
}
export class PedestrianSimulation {
 constructor(profiles,routes,{seed=Date.now(),count=28}={}){
  this.profiles=profiles;this.routes=routes;this.random=randomSource(seed);this.time=0;this.accumulator=0;this.people=[];this.transitions=0;
  for(let i=0;i<count;i++){
   const profile=profiles[i%profiles.length],route=i%routes.length,slot=Math.floor(i/routes.length),slots=Math.ceil((count-route)/routes.length);
   const person={id:i,model:i%profiles.length,route,s:(slot+.2+this.random()*.35)*routes[route].length/slots,clip:null,clipTime:0,rate:.9+this.random()*.2,remaining:0,revision:0,scale:profile.height/.977,blocked:false,used:new Set(),history:[],lastActivity:null};
   const initial=i%4===0?profile.clips.find(c=>!c.locomotion&&c.category!=='emotion'):profile.clips.find(c=>c.name==='walk');
   this.begin(person,initial);person.clipTime=this.random()*Math.min(initial.duration,initial.loop?initial.duration:initial.duration*.65);person.remaining=Math.max(1,person.remaining-person.clipTime);this.people.push(person);
  }
 }
 begin(p,clip){
  p.clip=clip;p.clipTime=0;p.revision++;p.used.add(clip.name);p.history.push(clip.name);if(p.history.length>40)p.history.shift();
  p.remaining=clip.loop?clip.duration*(2+Math.floor(this.random()*5)):clip.duration;p.rate=.88+this.random()*.24;
 }
 next(p){
  const clips=this.profiles[p.model].clips,walks=clips.filter(c=>c.loop),activities=clips.filter(c=>!c.loop&&c.name!==p.lastActivity);
  let clip;
  if(!p.clip.loop||this.random()<.18)clip=walks[Math.floor(this.random()*walks.length)];
  else{
   // Shuffle a personal activity deck: no global timer, no same gesture twice in a row.
   if(!p.deck?.length)p.deck=activities.filter(c=>c.category!=='emotion'||this.random()<.2).map(c=>({c,key:this.random()})).sort((a,b)=>a.key-b.key).map(v=>v.c);
   clip=p.deck.pop()||walks[0];p.lastActivity=clip.name;
  }
  this.begin(p,clip);this.transitions++;
 }
 update(dt){
  if(dt<=0)return;const step=1/60;this.accumulator+=dt;const steps=Math.floor((this.accumulator+1e-9)/step);this.accumulator=Math.max(0,this.accumulator-steps*step);if(!steps)return;
  for(let i=0;i<steps;i++){
   this.time+=step;const proposals=[];
   for(const p of this.people){
    const clip=p.clip,advanceTime=Math.min(step*p.rate,p.remaining,clip.duration-p.clipTime),nextTime=p.clipTime+advanceTime,travel=(motionAt(clip,nextTime)-motionAt(clip,p.clipTime))*p.scale;
    let available=Infinity;const route=this.routes[p.route];
    for(const other of this.people)if(other!==p&&other.route===p.route){const gap=(other.s-p.s+route.length)%route.length;if(gap>1e-6)available=Math.min(available,Math.max(0,gap-1.35));}
    const ratio=travel>1e-8?Math.min(1,available/travel):1;
    proposals.push({p,advanceTime:advanceTime*ratio,travel:Math.min(travel,available),blocked:ratio<.05});
   }
   for(const {p,advanceTime,travel,blocked} of proposals){
    p.s=(p.s+travel)%this.routes[p.route].length;p.clipTime+=advanceTime;p.remaining-=advanceTime;p.blocked=blocked;
    if(p.remaining<1e-5)this.next(p);else if(p.clipTime>=p.clip.duration-1e-5){if(p.clip.loop)p.clipTime=0;else this.next(p);}
   }
  }
 }
 snapshot(){return {time:this.time,total:this.people.length,models:this.profiles.length,transitions:this.transitions,people:this.people.map(p=>({id:p.id,model:this.profiles[p.model].id,route:p.route,s:p.s,...routePosition(this.routes[p.route],p.s),clip:p.clip.name,category:p.clip.category,clipTime:p.clipTime,rate:p.rate,blocked:p.blocked,used:[...p.used],history:p.history.slice()}))};}
}
