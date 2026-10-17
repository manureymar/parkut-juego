// Units are metres. The source GLBs remain unchanged in assets-originales/.
// modelRoof is the sampled floor height in each original's coordinate system.
export const LEVEL=[
 {id:'roof-01',name:'AZOTEA TÉCNICA',scale:28,modelRoof:.767,height:0,offsetX:0,near:.365,far:-.365,path:[[0,.27],[-.035,.04],[-.06,-.25],[.055,-.33]]},
 {id:'roof-02',name:'DISTRITO INDUSTRIAL',scale:27,modelRoof:.688,height:.12,offsetX:0,near:.40,far:-.40,path:[[.055,.35],[.08,.1],[.13,-.18],[.13,-.32],[.035,-.375]]},
 {id:'roof-06',name:'OBRAS EN ALTURA',scale:29,modelRoof:.760,height:-.05,offsetX:-2.1,near:.29,far:-.30,path:[[.105,.265],[.105,.12],[.10,-.08],[.08,-.21],[.072,-.275]]},
 {id:'roof-07',name:'TERRAZAS',scale:30,modelRoof:.516,height:.22,offsetX:4.2,near:.26,far:-.26,path:[[-.14,.23],[-.14,.06],[-.14,-.16],[-.14,-.23]]},
 {id:'roof-03',name:'LOS CONTENEDORES',scale:28,modelRoof:.326,height:.1,offsetX:0,near:.46,far:-.45,path:[[.05,.40],[.085,.20],[-.10,-.08],[0,-.40]]},
 {id:'roof-04',name:'EL PASO ESTRECHO',scale:27,modelRoof:.552,height:.2,offsetX:0,near:.45,far:-.44,path:[[0,.38],[-.15,.25],[-.15,.10],[-.15,-.08],[0,-.20],[0,-.40]]},
 {id:'roof-05',name:'EL REFUGIO',scale:28,modelRoof:.504,height:.42,offsetX:0,near:.44,far:-.17,path:[[0,.38],[0,.15],[0,-.10]]},
];
// A staggered route: the second roof descends to the promenade, the third
// is reached by the return climbing tower. Gaps have authored crossings.
const order=['roof-01','roof-06','roof-02','roof-03','roof-07','roof-04','roof-05'];
LEVEL.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
const offsets=[-4,3,2,-4,3,-2,2],heights=[0,.6,1.5,.3,1.6,.8,2.2],gaps=[0,4.8,6,3.2,4,3.5,4];
let previous=null;
for(const [i,b] of LEVEL.entries()){
 b.offsetX=offsets[i];b.height=heights[i];
 b.z=i===0?0:previous.exitZ-gaps[i]-b.near*b.scale;
 b.y=b.height-b.modelRoof*b.scale;b.entryZ=b.z+b.near*b.scale;b.exitZ=b.z+b.far*b.scale;
 b.route=b.path.map(([x,z])=>({x:b.offsetX+x*b.scale,z:b.z+z*b.scale}));previous=b;
}
export const SPAWN={x:-4,y:.08,z:7.3};
export const GOAL={x:2,z:LEVEL.at(-1).z-.12*28};
export const DISTANCE=SPAWN.z-GOAL.z;
