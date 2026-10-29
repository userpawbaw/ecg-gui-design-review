"""D-158: inspect reference assets outside the repository; never package them for Pages.

Inputs must be user-authorized public reference files in a scratch directory.
Only numerical metadata/reproduction contracts belong in verification/.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct

ROOT=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--assets',type=Path,required=True);p.add_argument('--report',type=Path);a=p.parse_args()
assets=a.assets.resolve()
if assets==ROOT or ROOT in assets.parents:
    raise SystemExit('Reference inputs/viewer must stay outside the repository')
raw=(assets/'scene_v9.glb').read_bytes()
magic,version,total=struct.unpack_from('<III',raw)
if magic!=0x46546c67 or version!=2 or total!=len(raw):raise SystemExit('Invalid GLB2 header')
size,kind=struct.unpack_from('<II',raw,12)
if kind!=0x4e4f534a:raise SystemExit('GLB JSON chunk missing')
gltf=json.loads(raw[20:20+size]);groups=['TexFleur','TexProps','TexMobilier','TexTableaux','TexBibli','TexFloor','TexWalls']
report={'scope':'Original-data inspection/replay only; not a self-authored production model','model':{'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()},'camera':gltf.get('cameras'),'camera_nodes':[],'meshes':[],'textures':[],'triangles':0}
for n in gltf['nodes']:
    if 'camera' in n:report['camera_nodes'].append({k:n.get(k)for k in ['name','camera','translation','rotation','scale']})
    if 'mesh' not in n:continue
    mesh=gltf['meshes'][n['mesh']];entry={'node':n.get('name'),'source_mesh_name':mesh.get('name'),'primitives':[]}
    for primitive in mesh['primitives']:
        accessor=gltf['accessors'][primitive['attributes']['POSITION']]
        indices=gltf['accessors'][primitive['indices']] if 'indices' in primitive else None
        triangles=(indices['count']if indices else accessor['count'])//3;report['triangles']+=triangles
        entry['primitives'].append({'vertices':accessor['count'],'triangles':triangles,'position_bounds':[accessor.get('min'),accessor.get('max')],'attributes':list(primitive['attributes']),'draco':'KHR_draco_mesh_compression'in primitive.get('extensions',{})})
    report['meshes'].append(entry)
for group in groups:
    file=assets/(group+'.ktx2');data=file.read_bytes()
    if data[:12]!=b'\xabKTX 20\xbb\r\n\x1a\n':raise SystemExit('Invalid KTX2: '+group)
    width,height=struct.unpack_from('<II',data,20)
    report['textures'].append({'group':group,'bytes':len(data),'size':[width,height],'sha256':hashlib.sha256(data).hexdigest()})
report['replay']={'omitted_from_analysis_viewer':['full website DOM/compositor','clouds/dust','TexFloor desktop hash blur radius3','pointer smoothing; values inspected in source only'],'scroll_progress':[0,1],'vertical_offset':2.75,'vertical_range':2.75,'pointer_yaw_degrees':.75,'pointer_pitch_degrees':.2,'pointer_decay_per_second':2,'runtime_lighting':False,'runtime_tone_mapping':False,'max_cross_groups':['TexBibli','TexProps','TexWalls'],'provenance':'Current source inspection; original bundle is retained in the scratch directory, not copied into this tool'}
report_path=a.report or assets/'inspection.json';report_path.parent.mkdir(exist_ok=True,parents=True);report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
link=assets/'three-runtime'
if not link.exists():link.symlink_to(ROOT/'prototype/v2/node_modules/three',target_is_directory=True)
(assets/'reference-analysis.html').write_text('''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>REF-002 original-data analysis only</title>
<script type="importmap">{"imports":{"three":"./three-runtime/build/three.module.js","three/addons/":"./three-runtime/examples/jsm/"}}</script>
<style>body{margin:0;background:#161615;overflow:hidden;font:13px system-ui;color:#eee}canvas{display:block}aside{position:fixed;top:12px;left:12px;padding:10px;background:#111d;max-width:440px;border-radius:5px}input{width:280px}p{margin:5px 0}button{background:#333;color:#fff;border:1px solid #888;padding:5px}#error{position:fixed;bottom:10px;white-space:pre-wrap;color:#f99}</style></head><body><aside><strong>원본 자료의 독립 분석 재생 · 자체 제작본 아님</strong><p>임시 분석 전용 · 재배포하지 않음</p><label>다락방 하강 <input id="progress" type="range" min="0" max="1" step=".001" value=".5"></label><output id="value">0.5</output><p><button id="upper">상층 작업실</button> <button id="attic">다락방 책장</button> <button id="overview">전체 배치</button></p><p><label><input id="cross" type="checkbox" checked style="width:auto">얇은 UV 이음선 보정</label></p></aside><div id="error"></div>
<script type="module">
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
try{
 const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);renderer.toneMapping=T.NoToneMapping;renderer.outputColorSpace=T.SRGBColorSpace;document.body.appendChild(renderer.domElement);
 const scene=new T.Scene();scene.background=new T.Color('#b1c6cb');
 const draco=new DRACOLoader().setDecoderPath('./three-runtime/examples/jsm/libs/draco/gltf/');
 const ktx=new KTX2Loader().setTranscoderPath('./three-runtime/examples/jsm/libs/basis/').detectSupport(renderer);
 const names=['TexFleur','TexProps','TexMobilier','TexTableaux','TexBibli','TexFloor','TexWalls'];
 const [gltf,...maps]=await Promise.all([new GLTFLoader().setDRACOLoader(draco).loadAsync('./scene_v9.glb'),...names.map(n=>ktx.loadAsync('./'+n+'.ktx2'))]);
 const meshAudit=[],materials=[];
 // Re-authored unlit sampling; no original website shader code copied here.
 const vertex=`out vec2 sampleUV;void main(){sampleUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
 const fragment=`precision highp float;in vec2 sampleUV;uniform sampler2D baked;uniform bool cleanEdges;uniform bool flipUv;out vec4 resultColor;void main(){vec2 p=vec2(sampleUV.x,flipUv?1.-sampleUV.y:sampleUV.y);if(!cleanEdges){resultColor=texture(baked,p);return;}ivec2 dimensions=textureSize(baked,0),cell=clamp(ivec2(p*vec2(dimensions)),ivec2(0),dimensions-1);vec4 c=texelFetch(baked,cell,0);for(int axis=0;axis<2;axis++)for(int signIndex=0;signIndex<2;signIndex++){ivec2 delta=ivec2(0);delta[axis]=signIndex==0?-1:1;c=max(c,texelFetch(baked,clamp(cell+delta,ivec2(0),dimensions-1),0));}resultColor=c;}`;
 gltf.scene.traverse(o=>{if(!o.isMesh)return;const index=names.findIndex(n=>o.name.startsWith(n));if(index<0)throw new Error('Unmapped mesh '+o.name);const texture=maps[index];texture.colorSpace=T.LinearSRGBColorSpace;texture.minFilter=texture.magFilter=T.LinearFilter;texture.generateMipmaps=false;texture.flipY=true;
 const m=new T.ShaderMaterial({glslVersion:T.GLSL3,vertexShader:vertex,fragmentShader:fragment,uniforms:{baked:{value:texture},cleanEdges:{value:['TexBibli','TexProps','TexWalls'].includes(names[index])},flipUv:{value:false}},toneMapped:false,side:T.FrontSide});o.material=m;materials.push(m);meshAudit.push({name:o.name,texture:names[index],vertices:o.geometry.attributes.position.count,triangles:(o.geometry.index?.count||o.geometry.attributes.position.count)/3});});
 scene.add(gltf.scene);gltf.scene.updateMatrixWorld(true);
 const modelCamera=gltf.scene.getObjectByName('camera');if(!modelCamera?.isPerspectiveCamera)throw new Error('Source camera missing');
 const base=modelCamera.getWorldPosition(new T.Vector3()),rotation=modelCamera.getWorldQuaternion(new T.Quaternion()),camera=modelCamera.clone();camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();let progress=.5,kind='attic';
 function render(){renderer.render(scene,camera);}
 function setProgress(p){progress=T.MathUtils.clamp(p,0,1);kind='attic';camera.position.copy(base).add(new T.Vector3(0,-2.75*(1+progress),0));camera.quaternion.copy(rotation);camera.fov=modelCamera.fov;camera.updateProjectionMatrix();document.querySelector('#progress').value=progress;document.querySelector('#value').value=progress.toFixed(3);render();}
 function upper(){kind='upper';camera.position.copy(base);camera.quaternion.copy(rotation);camera.fov=modelCamera.fov;camera.updateProjectionMatrix();render();}
 function overview(){kind='overview';camera.position.set(17,7,13);camera.lookAt(6,0,0);camera.fov=45;camera.updateProjectionMatrix();render();}
 function measureComponents(){
  const pieces=[];gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(mesh=>{if(!mesh.isMesh)return;const a=mesh.geometry.attributes.position,index=mesh.geometry.index,positions=[],keys=new Map(),parent=[];
   const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
   for(let i=0;i<a.count;i++){const v=new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld),key=v.toArray().map(x=>x.toFixed(5)).join(',');let id=keys.get(key);if(id===undefined){id=parent.length;keys.set(key,id);parent.push(id);}positions.push({v,id});}
   const count=index?index.count:a.count;for(let i=0;i<count;i+=3){const ids=[0,1,2].map(j=>positions[index?index.getX(i+j):i+j].id),r=find(ids[0]);for(const id of ids)parent[find(id)]=r;}
   const groups=new Map();for(const {v,id}of positions){const root=find(id);if(!groups.has(root))groups.set(root,{bounds:new T.Box3(),triangles:0});groups.get(root).bounds.expandByPoint(v);}for(let i=0;i<count;i+=3)groups.get(find(positions[index?index.getX(i):i].id)).triangles++;
   let part=0;for(const item of groups.values())pieces.push({mesh:mesh.name,component:part++,center:item.bounds.getCenter(new T.Vector3()).toArray(),size:item.bounds.getSize(new T.Vector3()).toArray(),triangles:item.triangles});
  });return pieces;
 }
 const bounds=new T.Box3().setFromObject(gltf.scene);window.__referenceAnalysis={measureComponents,renderer,scene,camera,root:gltf.scene,base,rotation,meshAudit,bounds,setProgress,upper,overview,render,setFlip(value){materials.forEach(m=>m.uniforms.flipUv.value=value);render();},setCross(value){materials.forEach((m,i)=>m.uniforms.cleanEdges.value=value&&['TexBibli','TexProps','TexWalls'].includes(meshAudit[i].texture));render();}};
 document.querySelector('#progress').addEventListener('input',e=>setProgress(+e.target.value));document.querySelector('#upper').onclick=upper;document.querySelector('#attic').onclick=()=>setProgress(progress);document.querySelector('#overview').onclick=overview;document.querySelector('#cross').onchange=e=>window.__referenceAnalysis.setCross(e.target.checked);window.addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();render();});setProgress(.5);
}catch(e){document.querySelector('#error').textContent=e.stack||e;}
</script></body></html>''',encoding='utf-8')
print('inspected',len(report['meshes']),'meshes',report['triangles'],'triangles;',len(report['textures']),'textures')
print('scratch-only viewer:',assets/'reference-analysis.html')
