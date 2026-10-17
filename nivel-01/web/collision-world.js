import {Box3,Vector3,Triangle} from 'three';
import {Capsule} from './vendor/examples/jsm/math/Capsule.js';
import {Octree} from './vendor/examples/jsm/math/Octree.js';
// A bounded BVH stores each triangle once. A global octree duplicated long
// pavement triangles across thousands of leaves when street collisions were added.
export class CollisionWorld {
 constructor(){this.solver=new Octree();this.triangle=new Triangle();this.temp=new Vector3();this.clear();}
 clear(){this.nodes=[];this.vertices=new Float32Array();this.indices=new Uint32Array();this.centers=new Float32Array();return this;}
 fromGraphNode(group){
  this.clear();group.updateMatrixWorld(true);const meshes=[];let count=0;group.traverse(m=>{if(m.isMesh){meshes.push(m);count+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;}});
  this.vertices=new Float32Array(count*9);this.centers=new Float32Array(count*3);this.indices=new Uint32Array(count);let k=0;
  for(const m of meshes){const p=m.geometry.attributes.position,ix=m.geometry.index,n=ix?.count||p.count;for(let i=0;i<n;i+=3){const center=new Vector3();for(let j=0;j<3;j++){this.temp.fromBufferAttribute(p,ix?ix.getX(i+j):i+j).applyMatrix4(m.matrixWorld);this.temp.toArray(this.vertices,k*9+j*3);center.add(this.temp);}center.multiplyScalar(1/3).toArray(this.centers,k*3);this.indices[k]=k;k++;}}
  const build=(start,end)=>{const box=new Box3(),cbox=new Box3();for(let i=start;i<end;i++){const id=this.indices[i];for(let j=0;j<3;j++)box.expandByPoint(this.temp.fromArray(this.vertices,id*9+j*3));cbox.expandByPoint(this.temp.fromArray(this.centers,id*3));}box.expandByScalar(.0001);const node={box,start,count:end-start,left:-1,right:-1},index=this.nodes.length;this.nodes.push(node);if(end-start>18){const size=cbox.getSize(new Vector3()),axis=size.x>size.y?(size.x>size.z?0:2):(size.y>size.z?1:2);this.indices.subarray(start,end).sort((a,b)=>this.centers[a*3+axis]-this.centers[b*3+axis]);const mid=(start+end)>>1;node.left=build(start,mid);node.right=build(mid,end);node.count=0;}return index;};if(count)build(0,count);this.centers=new Float32Array();return this;
 }
 read(id){const t=this.triangle;t.a.fromArray(this.vertices,id*9);t.b.fromArray(this.vertices,id*9+3);t.c.fromArray(this.vertices,id*9+6);return t;}
 rayIntersect(ray){
  if(!this.nodes.length)return false;const stack=[0],point=new Vector3();let distance=Infinity,result=false;
  while(stack.length){const n=this.nodes[stack.pop()];if(!ray.intersectBox(n.box,point)||point.distanceTo(ray.origin)>distance&&!n.box.containsPoint(ray.origin))continue;
   if(n.count){for(let i=n.start;i<n.start+n.count;i++){const t=this.read(this.indices[i]);if(ray.intersectTriangle(t.a,t.b,t.c,true,point)){const d=point.distanceTo(ray.origin);if(d<distance){distance=d;result={distance:d,position:point.clone(),triangle:t.clone()};}}}}
   else{stack.push(n.left,n.right);}
  }return result;
 }
 capsuleIntersect(capsule){
  if(!this.nodes.length)return false;const c=new Capsule().copy(capsule),bounds=new Box3().setFromPoints([c.start,c.end]).expandByScalar(c.radius+.05),stack=[0];let hit=false;
  while(stack.length){const n=this.nodes[stack.pop()];if(!n.box.intersectsBox(bounds))continue;if(n.count){for(let i=n.start;i<n.start+n.count;i++){const h=this.solver.triangleCapsuleIntersect(c,this.read(this.indices[i]));if(h){hit=true;c.translate(h.normal.multiplyScalar(h.depth));}}}else stack.push(n.left,n.right);}
  if(!hit)return false;const delta=c.start.clone().sub(capsule.start),depth=delta.length();return depth>1e-8?{normal:delta.normalize(),depth}:false;
 }
}
