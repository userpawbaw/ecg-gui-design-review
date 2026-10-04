import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {h5Vert,h5Frag} from './h5.js';
// BG-B-02 / D-058. Independent geometry test, not a reference reproduction.
const $=id=>document.getElementById(id),stage=$('stage');
let renderer;
try{renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});}
catch(e){$('error').textContent='WebGL 초기화 실패: '+e.message;throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;stage.prepend(renderer.domElement);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const world=new T.Scene();world.background=new T.Color('#030609');
const camera=new T.PerspectiveCamera(34,16/9,.05,40);
world.add(new T.HemisphereLight(0x7e9aaa,0x22150c,.65));
const amber=new T.PointLight(0xffbd70,28,13,2);amber.position.set(-3,3.5,2);world.add(amber);
const cool=new T.PointLight(0x80aabd,13,12,2);cool.position.set(3,3,-1);world.add(cool);
const room=new T.Group(),edges=new T.Group(),patches=new T.Group(),hero=new T.Group(),papers=new T.Group(),signal=new T.Group(),digital=new T.Group();
world.add(room,edges,patches,hero,papers,signal,digital);
const dark=new T.MeshStandardMaterial({color:0x090d12,roughness:.92,metalness:.06});
const paperCanvas=document.createElement('canvas');paperCanvas.width=paperCanvas.height=1024;
const pc=paperCanvas.getContext('2d');pc.fillStyle='#dfd8c6';pc.fillRect(0,0,1024,1024);
let seed=21;for(let i=0;i<40000;i++){seed=(seed*1664525+1013904223)>>>0;const x=seed%1024;seed=(seed*1664525+1013904223)>>>0;const y=seed%1024;pc.fillStyle=i%2?'rgba(40,25,15,.035)':'rgba(255,255,255,.07)';pc.fillRect(x,y,1,2);}
pc.strokeStyle='rgba(147,93,82,.16)';pc.lineWidth=1;pc.beginPath();for(let i=0;i<=1024;i+=32){pc.moveTo(i,0);pc.lineTo(i,1024);pc.moveTo(0,i);pc.lineTo(1024,i);}pc.stroke();
const paperTexture=new T.CanvasTexture(paperCanvas);paperTexture.colorSpace=T.SRGBColorSpace;paperTexture.anisotropy=4;
const ivory=new T.MeshStandardMaterial({color:0xf7f5ed,map:paperTexture,roughness:.93,metalness:0,side:T.DoubleSide});
const contour=new T.LineBasicMaterial({color:0x728b96,transparent:true,opacity:.29,depthTest:true});
const cyan=new T.LineBasicMaterial({color:0x719aa5,transparent:true,opacity:.4,depthTest:true});
const warm=new T.LineBasicMaterial({color:0xd6ac6f,transparent:true,opacity:.7,depthTest:true});
function box(parent,w,h,d,x,y,z,mat=dark){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
function line(parent,pts,mat=contour){const g=new T.BufferGeometry().setFromPoints(pts.map(p=>new T.Vector3(...p)));const m=new T.Line(g,mat);parent.add(m);return m;}
function edgeBox(parent,w,h,d,x,y,z,mat=contour){const m=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(w,h,d),35),mat);m.position.set(x,y,z);parent.add(m);return m;}
box(room,13,.08,12,0,-.055,-2);box(room,13,5,.12,0,2.5,-3.8);
box(room,.14,5,6,-5,2.5,-1);
// Only one structural frame, not a triangulated wire room.
box(room,.07,2.8,.10,-2.85,1.4,-2.5);box(room,.07,2.8,.10,-1.65,1.4,-2.5);box(room,1.27,.07,.10,-2.25,2.8,-2.5);
line(edges,[[-2.85,.04,-2.44],[-2.85,2.8,-2.44],[-1.65,2.8,-2.44],[-1.65,.04,-2.44]]);
for(const o of room.children.slice(3,6))o.position.x-=.8;
edges.children[0].position.x-=.8;
line(edges,[[-4.7,.04,-3.71],[4.9,.04,-3.71]]);
// Warm receiver approximation: local low luminance surface, no full-room glow.
const patchMat=new T.MeshBasicMaterial({color:0x302117,transparent:true,opacity:.48,depthWrite:false});
const patch=new T.Mesh(new T.PlaneGeometry(1.25,2.6),patchMat);patch.position.set(-3.5,1.65,-3.72);patches.add(patch);
patch.visible=false;
const roomLight=new T.SpotLight(0xffd3a0,34,14,.25,.55,2);roomLight.position.set(-3.7,3.8,1.6);roomLight.target.position.set(-3.65,1.0,-3.7);roomLight.castShadow=true;roomLight.shadow.mapSize.set(1024,1024);roomLight.shadow.bias=-.0002;world.add(roomLight,roomLight.target);
const paperLight=new T.SpotLight(0xffe4bb,22,10,.53,.8,2);paperLight.position.set(1.1,3.8,2.6);paperLight.target.position.set(1.4,1.1,0);paperLight.castShadow=true;paperLight.shadow.mapSize.set(1024,1024);paperLight.shadow.bias=-.0001;world.add(paperLight,paperLight.target);
roomLight.shadow.normalBias=.02;paperLight.shadow.normalBias=.015;paperLight.intensity=11;
// Measurement cart remains the same object in all modes/scenes.
const cart=new T.Group();cart.position.set(2.35,0,-1.15);world.add(cart);
box(cart,.9,.09,.55,0,.9,0);box(cart,.10,.85,.1,0,.43,0);
box(cart,.76,.53,.08,0,1.3,-.12);box(cart,.72,.035,.65,0,.06,0);
const screen=box(cart,.66,.42,.01,0,1.3,-.069,new T.MeshBasicMaterial({color:0x0d1d22}));
const steel=new T.MeshStandardMaterial({color:0x586268,metalness:.55,roughness:.48});
cart.children.slice(0,4).forEach(o=>o.material=steel);
for(let i=0;i<3;i++){const key=new T.Mesh(new T.CylinderGeometry(.015,.015,.008,16),steel);key.rotation.x=Math.PI/2;key.position.set(.20+i*.045,1.04,-.065);cart.add(key);}
for(const x of[-.29,.29])for(const z of[-.2,.2]){const wheel=new T.Mesh(new T.CylinderGeometry(.07,.07,.055,16),dark);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.07,z);cart.add(wheel);}
edgeBox(edges,.9,.09,.55,2.35,.9,-1.15);edgeBox(edges,.76,.53,.08,2.35,1.3,-1.27);
line(cart,[[-.27,1.28,-.06],[-.16,1.28,-.06],[-.11,1.36,-.06],[-.08,1.2,-.06],[-.04,1.28,-.06],[.27,1.28,-.06]],cyan);
// Faceless procedural clay; ring geometry does not claim H5 asset fidelity.
const body=new T.Group();hero.add(body);
const skin=new T.MeshStandardMaterial({color:0x132229,roughness:.75,metalness:.16});
function ellipsoid(x,y,z,sx,sy,sz){const m=new T.Mesh(new T.SphereGeometry(1,32,24),skin);m.position.set(x,y,z);m.scale.set(sx,sy,sz);body.add(m);return m;}
ellipsoid(0,1.52,0,.34,.58,.19);ellipsoid(0,2.25,0,.16,.23,.145);ellipsoid(0,1.98,0,.09,.13,.09);
for(const s of[-1,1]){ellipsoid(s*.38,1.51,0,.085,.45,.085);ellipsoid(s*.43,1.05,.02,.07,.14,.065);ellipsoid(s*.16,.53,0,.11,.51,.11);ellipsoid(s*.16,.055,.055,.10,.06,.19);}
for(let y=1.0;y<1.97;y+=.025){const dy=(y-1.52)/.58,r=Math.sqrt(Math.max(0,1-dy*dy));const pts=[];for(let k=0;k<=64;k++){const a=k/64*Math.PI*2;pts.push([Math.cos(a)*.342*r,y,Math.sin(a)*.193*r]);}line(body,pts,cyan);}
for(let y=2.04;y<2.47;y+=.017){const r=Math.sqrt(Math.max(0,1-((y-2.25)/.23)**2));const pts=[];for(let k=0;k<=48;k++){const a=k/48*Math.PI*2;pts.push([Math.cos(a)*.161*r,y,Math.sin(a)*.146*r]);}line(body,pts,cyan);}
const clayPieces=body.children.slice();
const heart=new T.Group();heart.position.set(.075,1.75,.225);body.add(heart);
const heartPts=[];for(let i=0;i<=96;i++){let a=i/96*Math.PI*2;heartPts.push([.009*16*Math.sin(a)**3,.009*(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a)),0]);}line(heart,heartPts,new T.LineBasicMaterial({color:0xffb66f}));
for(const [x,y] of[[-.16,1.8],[.17,1.8],[.18,1.25]]){const e=new T.Mesh(new T.SphereGeometry(.03,12,8),new T.MeshStandardMaterial({color:0xa2b6b7,roughness:.8}));e.position.set(x,y,.21);body.add(e);line(body,[[x,y,.21],[.3,1.1,.22],[.52,.95,.18],[1.05,.9,.1]],warm);}
// Foreground paper margins actually occlude the room when camera advances.
const left=box(papers,1.6,4,.035,-2.25,1.45,2,ivory),right=box(papers,1.6,4,.035,2.25,1.45,2,ivory);left.rotation.y=.22;right.rotation.y=-.22;
function curvedPaper(w,h,bend){const geo=new T.PlaneGeometry(w,h,40,4);const pos=geo.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i);pos.setZ(i,bend*Math.sin(x/w*Math.PI));}geo.computeVertexNormals();return geo;}
left.geometry.dispose();right.geometry.dispose();left.geometry=curvedPaper(1.6,4,.23);right.geometry=curvedPaper(1.6,4,-.23);
const sheet=new T.Group();sheet.position.set(1.15,1.45,.28);world.add(sheet);
const mainPaper=box(sheet,2.2,1.55,.025,-.5,0,0,ivory);mainPaper.geometry.dispose();mainPaper.geometry=curvedPaper(2.2,1.55,.025);
box(sheet,.45,1.55,.025,1.375,0,0,ivory);
const gridMat=new T.LineBasicMaterial({color:0x674d37,transparent:true,opacity:.22});
for(let x=-1.55;x<=1.56;x+=.1)if(x<.60||x>1.15)line(sheet,[[x,-.75,.016],[x,.75,.016]],gridMat);
for(let y=-.75;y<=.76;y+=.1){line(sheet,[[-1.55,y,.016],[.60,y,.016]],gridMat);line(sheet,[[1.15,y,.016],[1.55,y,.016]],gridMat);}
const flap=new T.Group();flap.position.set(.60,0,.03);sheet.add(flap);box(flap,.55,1.55,.015,.275,0,0,ivory);
const flapMesh=flap.children[0];flapMesh.geometry.dispose();flapMesh.geometry=curvedPaper(.55,1.55,.04);
const digitalMat=new T.LineBasicMaterial({color:0x5cbdc7,transparent:true,opacity:.6});
for(let i=0;i<8;i++)line(digital,[[.015+i*.08,-.72,0],[.015+i*.08,.72,0]],digitalMat);
for(let y=-.72;y<=.73;y+=.12)line(digital,[[0,y,0],[.65,y,0]],digitalMat);
 digital.position.set(1.75,1.45,.20);
// Schematized trace with one shared beat clock; no dataset, SNR or DSP claim.
const n=600,positions=new Float32Array(n*3),sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(positions,3));
 const trace=new T.Line(sg,new T.LineBasicMaterial({color:0xd7a86e,transparent:true,opacity:.9}));signal.add(trace);
const head=new T.Mesh(new T.SphereGeometry(.016,12,8),new T.MeshBasicMaterial({color:0xf4cb8a}));signal.add(head);
let actualModel=null,actualHeart=null,assetsReady=false,h5=null;
try{
 const loader=new GLTFLoader();const [b,h,fig]=await Promise.all([loader.loadAsync('/model/body.glb'),loader.loadAsync('/model/heart.glb'),fetch('/model/figure.json').then(r=>r.json())]);
 let bm,hm;b.scene.traverse(o=>{if(o.isMesh&&!bm)bm=o;});h.scene.traverse(o=>{if(o.isMesh&&!hm)hm=o;});
 if(!bm||!hm)throw Error('Actual GLB mesh missing');
 const geometry=bm.geometry;if(!geometry.getAttribute('aSlice'))geometry.setAttribute('aSlice',geometry.getAttribute('_slice')||new T.Float32BufferAttribute(Array.from(geometry.attributes.position.array).filter((_,i)=>i%3===1),1));
 h5=new T.ShaderMaterial({vertexShader:h5Vert,fragmentShader:h5Frag.replace('vec3(1.,.36,.42)','vec3(1.,.62,.24)').replace('dh*dh/.018','dh*dh/.040').replace('dh*dh/.011','dh*dh/.028'),transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{uSkin:{value:new T.Color('#b9c8cc')},uLine:{value:new T.Color('#c1d2d5')},uSunCol:{value:new T.Color('#ffd09a')},uSunTo:{value:new T.Vector3(0,-1,0)},uExposure:{value:.34},uRefDist:{value:0},uSunOn:{value:0},tLight:{value:null},uLightVP:{value:new T.Matrix4()},uOpacity:{value:.80},uFlash:{value:0},uFeet:{value:0},uDensity:{value:42},uScan:{value:-1},uScanOn:{value:0},uHeart:{value:new T.Vector3()},uWaveT:{value:9},uWaveAmp:{value:0}}});
 actualModel=new T.Group();actualModel.scale.setScalar(1.45);body.add(actualModel);
 const depth=new T.Mesh(geometry,new T.ShaderMaterial({vertexShader:h5Vert,fragmentShader:'void main(){gl_FragColor=vec4(0.);}',uniforms:{},colorWrite:false,side:T.DoubleSide,transparent:true}));depth.renderOrder=3;depth.castShadow=true;actualModel.add(depth);
 const surface=new T.Mesh(geometry,h5);surface.renderOrder=4;actualModel.add(surface);
 actualHeart=new T.Mesh(hm.geometry,new T.MeshBasicMaterial({color:0xfbc28b,transparent:true,opacity:.88,depthWrite:false}));actualHeart.position.set(...fig.heart);actualHeart.renderOrder=2;actualModel.add(actualHeart);
 assetsReady=true;$('loaded').textContent='실제 인체·심장 로드 완료';
}catch(e){$('error').textContent='실제 에셋 로드 실패: '+e.message;throw e;}
let sceneName='B3',mode='hybrid',p=.5,t=0,freeze=false,follow=true;let mx=0,my=0,dx=0,dy=0,last=performance.now();
function apply(){
 sceneName=$('scene').value;mode=$('mode').value;p=Number($('progress').value);freeze=$('freeze').checked;follow=$('follow').checked&&!matchMedia('(prefers-reduced-motion: reduce)').matches;$('p').value=p.toFixed(2);
 room.visible=mode!=='off';edges.visible=mode!=='off';patches.visible=mode==='hybrid';
 roomLight.visible=mode==='hybrid';renderer.shadowMap.enabled=$('shadows').checked;
 const useActual=$('asset').value==='actual';actualModel.visible=useActual;clayPieces.forEach(o=>o.visible=!useActual);heart.visible=!useActual;
 papers.visible=sceneName==='B3';sheet.visible=signal.visible=sceneName!=='B3';digital.visible=sceneName==='B6';
 body.position.x=sceneName==='B3'?0:-1.55;body.scale.setScalar(sceneName==='B3'?1:1.65);body.position.y=sceneName==='B3'?0:-1.12;
 $('caption').innerHTML=sceneName==='B3'?'':`<small>ECG DENOISING · 연출 예시</small><h2>${sceneName==='B5'?'심장의 신호를 기록하다':'기록에서 디지털 신호로'}</h2><p>${sceneName==='B5'?'박동과 같은 시간에 그려지는 신호':'접힘 뒤의 처리층을 드러내는 구도 시험'}</p>`;
}
// Allocate mode material once. No per-frame material churn.
 const occluder=new T.MeshBasicMaterial({color:0x030609});
const originalApply=apply;
function update(){originalApply();room.children.forEach(o=>o.material=mode==='hybrid'?dark:occluder);}
for(const id of['scene','mode','progress','freeze','follow','asset','shadows'])$(id).addEventListener('input',update);
stage.addEventListener('pointermove',e=>{const b=stage.getBoundingClientRect();mx=(e.clientX-b.left)/b.width-.5;my=(e.clientY-b.top)/b.height-.5;});stage.addEventListener('pointerleave',()=>{mx=my=0;});
new ResizeObserver(()=>{renderer.setSize(stage.clientWidth,stage.clientHeight,false);camera.aspect=stage.clientWidth/stage.clientHeight;camera.updateProjectionMatrix();}).observe(stage);
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.1);last=now;if(!freeze)t+=dt;
 dx+=( (follow?mx:0)-dx)*(1-Math.exp(-dt*7));dy+=((follow?my:0)-dy)*(1-Math.exp(-dt*7));
 const b3=sceneName==='B3';camera.position.set((b3?-.12+.24*p:sceneName==='B6'?.65+.44*p:.06+.44*p)+dx*.20,1.60+dy*.1,b3?6.1-.7*p:6.2-.25*p);camera.lookAt(b3?0:.35,1.42,0);
 left.position.x=-2.05-.45*p;right.position.x=2.05+.45*p;flap.rotation.y=sceneName==='B6'?.35+.17*p:0;
 const phase=t%1;const beat=Math.exp(-(((phase-.18)/.055)**2));heart.scale.setScalar(1+.13*beat);
 actualHeart.scale.setScalar(1+.10*beat);actualModel.updateWorldMatrix(true,true);h5.uniforms.uHeart.value.copy(actualHeart.getWorldPosition(new T.Vector3()));h5.uniforms.uFlash.value=beat;
 for(let i=0;i<n;i++){const x=i/(n-1),u=(t-(1-x)*2.5)%1;const cyc=(u+1)%1;const r=Math.exp(-(((cyc-.18)/.023)**2))*.29-Math.exp(-(((cyc-.22)/.032)**2))*.09;const noise=sceneName==='B6'?.017*Math.sin(i*.43+t*4):.025*Math.sin(i*.57+t*3);positions[i*3]=-.38+x*3.03;positions[i*3+1]=1.40+r+noise;positions[i*3+2]=.39;}
 sg.attributes.position.needsUpdate=true;head.position.set(positions[(n-1)*3],positions[(n-1)*3+1],positions[(n-1)*3+2]);
 renderer.render(world,camera);$('stats').textContent=`${sceneName} · p=${p.toFixed(2)} · t=${t.toFixed(2)}s · ${renderer.info.render.calls} draw calls · ${renderer.info.render.triangles.toLocaleString()} triangles · ${renderer.domElement.width}×${renderer.domElement.height}`;
}
update();requestAnimationFrame(frame);
window.previs={set(s,m,progress,time=0,asset='actual',shadows=true){$('scene').value=s;$('mode').value=m;$('progress').value=progress;$('freeze').checked=true;$('follow').checked=false;$('asset').value=asset;$('shadows').checked=shadows;t=time;update();},state(){return{assetsReady,asset:$('asset').value,shadows:renderer.shadowMap.enabled,scene:sceneName,mode,p,t,camera:camera.position.toArray(),aspect:camera.aspect,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,depthTest:contour.depthTest,opaqueOccluders:!dark.transparent,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches};}};
