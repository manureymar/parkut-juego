// Deterministic traffic simulation, independent of rendering. Distances: metres.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export class TrafficSimulation {
 constructor(routes){this.routes=routes;this.time=0;this.cars=[];
  for(const [lane,r] of routes.entries())for(let i=0;i<9;i++)this.cars.push({id:this.cars.length,lane,type:((i===8?1:i)+lane*3+Math.floor(lane/4))%4,s:(i+.25+(lane%3)*.17)*r.length/9,speed:6.4+(i*13+lane*7)%18/10,cruise:7.3+(i*7+lane*11)%20/10,length:5.3,wrapped:0});
 }
 phase(stop){const t=(this.time+stop.offset)%34;return t<22?'green':t<25?'amber':'red';}
 update(dt){
  if(dt<=0)return;const steps=Math.ceil(dt/.04),step=dt/steps;
  for(let k=0;k<steps;k++){this.time+=step;const next=[];
   for(const car of this.cars){const r=this.routes[car.lane];let gap=Infinity;
    for(const other of this.cars)if(other!==car&&other.lane===car.lane){const d=(other.s-car.s+r.length)%r.length-other.length;if(d<gap)gap=d;}
    let stopDistance=Infinity;for(const stop of r.stops){const d=stop.s-car.s-car.length/2;if(d>=-.3&&this.phase(stop)==='red')stopDistance=Math.min(stopDistance,Math.max(0,d));else if(d>car.speed*car.speed/5+2&&this.phase(stop)==='amber')stopDistance=Math.min(stopDistance,d);}
    const available=Math.min(Math.max(0,gap-2.2),stopDistance),safeSpeed=Math.sqrt(2*3.2*available),desired=Math.min(car.cruise,safeSpeed);
    const acceleration=desired<car.speed?3.5:1.25,speed=car.speed+clamp(desired-car.speed,-acceleration*step,acceleration*step);
    const advance=Math.min(speed*step,available);next.push({car,s:car.s+advance,speed:advance<speed*step?.0:speed});
   }
   for(const {car,s,speed} of next){car.s=s;car.speed=speed;const len=this.routes[car.lane].length;if(car.s>=len){car.s-=len;car.wrapped++;}}
  }
 }
 position(car){const r=this.routes[car.lane];return {x:r.x,z:r.startZ+r.direction*car.s,rotation:r.direction>0?0:Math.PI};}
 snapshot(){return {time:this.time,count:this.cars.length,cars:this.cars.map(c=>({...c,...this.position(c)})),signals:this.routes.flatMap((r,lane)=>r.stops.map(s=>({lane,z:r.startZ+r.direction*s.s,phase:this.phase(s)})))};}
}
