import * as THREE from 'three';

// Derived geometry only. GLB and its UV/material sources remain untouched.
export function createCeilingApertures(root) {
 const holes=[{x:[-.35,1.45],z:[.1,.85]},{x:[-.35,1.45],z:[-.8,0]},{x:[-.35,1.45],z:[-2.25,-1.45]}];
 const low=4.999956,high=5.149882,changes=[],reveals=[];
 root.updateWorldMatrix(true,true);
 const targets=[];root.traverse(o=>{if(o.isMesh&&!Array.isArray(o.material)&&o.material.name==='plaster')targets.push(o);});
 if(!targets.length)throw new Error('Ceiling plaster mesh missing');
 function split(poly,axis,bound,sign){const inside=[],outside=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=(a.w[axis]-bound)*sign,db=(b.w[axis]-bound)*sign; (da>=0?inside:outside).push(a);if((da>=0)!==(db>=0)){const t=da/(da-db),v={w:a.w.map((x,j)=>x+(b.w[j]-x)*t),a:{}};for(const k of Object.keys(a.a))v.a[k]=a.a[k].map((x,j)=>x+(b.a[k][j]-x)*t);inside.push(v);outside.push(v);}}return [inside,outside];}
 for(const mesh of targets){
  const original=mesh.geometry,source=original.index?original.toNonIndexed():original,attrs=source.attributes,output=Object.fromEntries(Object.keys(attrs).map(k=>[k,[]]));
  const vertex=i=>{const p=new THREE.Vector3().fromBufferAttribute(attrs.position,i).applyMatrix4(mesh.matrixWorld);const a={};for(const [k,attr]of Object.entries(attrs)){a[k]=Array.from({length:attr.itemSize},(_,j)=>attr.getComponent(i,j));}return {w:p.toArray(),a};};
  for(let i=0;i<attrs.position.count;i+=3){let polygons=[[vertex(i),vertex(i+1),vertex(i+2)]];for(const hole of holes){const next=[];for(const poly of polygons){let rest=poly;for(const [axis,bound,sign]of [[0,hole.x[0],1],[0,hole.x[1],-1],[2,hole.z[0],1],[2,hole.z[1],-1],[1,4.98,1],[1,5.17,-1]]){if(rest.length<3)break;const [inside,outside]=split(rest,axis,bound,sign);if(outside.length>=3)next.push(outside);rest=inside;}}polygons=next;}
   for(const poly of polygons)for(let j=1;j<poly.length-1;j++)for(const v of [poly[0],poly[j],poly[j+1]])for(const k of Object.keys(attrs))output[k].push(...v.a[k]);
  }
  const cut=new THREE.BufferGeometry();for(const [k,attr]of Object.entries(attrs))cut.setAttribute(k,new THREE.Float32BufferAttribute(output[k],attr.itemSize));cut.normalizeNormals();cut.computeBoundingBox();cut.computeBoundingSphere();changes.push({mesh,original,cut});mesh.geometry=cut;if(source!==original)source.dispose();
  const inverse=new THREE.Matrix4().copy(mesh.matrixWorld).invert();
  for(const hole of holes){const [x0,x1]=hole.x,[z0,z1]=hole.z;const edges=[[[x0,z0],[x1,z0]],[[x1,z0],[x1,z1]],[[x1,z1],[x0,z1]],[[x0,z1],[x0,z0]]];for(const [a,b]of edges){const ps=[[a[0],low,a[1]],[b[0],low,b[1]],[b[0],high,b[1]],[a[0],high,a[1]]].map(p=>new THREE.Vector3(...p).applyMatrix4(inverse));const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,1,2,0,2,3].flatMap(i=>ps[i].toArray()),3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,.15,0,0,1,.15,0,.15],2));g.computeVertexNormals();const r=new THREE.Mesh(g,mesh.material);r.name='aisle_aperture_reveal';r.castShadow=r.receiveShadow=true;mesh.add(r);reveals.push(r);}}
 }
 let enabled=true;
 return {holes,changes,reveals,get enabled(){return enabled;},setEnabled(value){enabled=!!value;for(const c of changes)c.mesh.geometry=enabled?c.cut:c.original;for(const r of reveals)r.visible=enabled;},stats:changes.map(c=>({mesh:c.mesh.name,before:c.original.index?c.original.index.count/3:c.original.attributes.position.count/3,after:c.cut.attributes.position.count/3})),dispose(){for(const c of changes)(enabled?c.original:c.cut).dispose();}};
}
