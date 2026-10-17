import {copyFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..');
const src=path.join(root,'node_modules/three');
const dest=path.join(root,'nivel-01/web/vendor');
for(const file of ['build/three.module.js','build/three.core.js','examples/jsm/loaders/GLTFLoader.js','examples/jsm/utils/BufferGeometryUtils.js','examples/jsm/utils/SkeletonUtils.js','examples/jsm/math/Octree.js','examples/jsm/math/Capsule.js','examples/jsm/environments/RoomEnvironment.js','examples/jsm/objects/Sky.js','LICENSE']){
 await mkdir(path.dirname(path.join(dest,file)),{recursive:true});
 await copyFile(path.join(src,file),path.join(dest,file));
}
