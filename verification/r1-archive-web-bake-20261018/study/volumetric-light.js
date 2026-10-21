import * as THREE from 'three';
import {FullScreenQuad} from 'three/addons/postprocessing/Pass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {createCurtainField} from './curtain-field.js';
import {installContactShadows} from './contact-shadows.js';
import {vertexShader,volumeShader,filterShader,compositeShader} from './volume-shaders.js';

// D-148: independent raw light depth avoids Three's PCF comparison texture/private fields.
export function createVolumetricLight({renderer,scene,camera,root,sun,bounds,lighting,lightSize=2048}){
  const gl=renderer.getContext();
  if(!gl.getExtension('EXT_color_buffer_float'))throw new Error('선형 HDR 렌더 타깃을 지원하지 않는 GPU입니다. 베이크 결과를 확인해주세요.');
  const resources=[],proxies=new THREE.Scene(),materials=new Map(),casters=[];
  root.updateWorldMatrix(true,true);
  root.traverse(o=>{
    if(!o.isMesh)return;
    const source=Array.isArray(o.material)?o.material:[o.material];
    const depthMaterials=source.map(m=>{
      if(!materials.has(m)){
        const d=new THREE.MeshDepthMaterial({map:m.map,alphaMap:m.alphaMap,alphaTest:m.alphaTest,side:m.side,depthPacking:THREE.BasicDepthPacking});
        d.colorWrite=false;d.depthWrite=true;materials.set(m,d);
      }
      m.shadowSide=m.side;return materials.get(m);
    });
    const proxy=new THREE.Mesh(o.geometry,Array.isArray(o.material)?depthMaterials:depthMaterials[0]);
    proxy.matrixAutoUpdate=false;proxy.matrix.copy(o.matrixWorld);proxies.add(proxy);casters.push({source:o,proxy});
  });
  const lightCamera=new THREE.OrthographicCamera();
  const lightRT=new THREE.WebGLRenderTarget(lightSize,lightSize,{depthTexture:new THREE.DepthTexture(lightSize,lightSize,THREE.UnsignedIntType)});
  lightRT.depthTexture.compareFunction=null;lightRT.depthTexture.minFilter=lightRT.depthTexture.magFilter=THREE.NearestFilter;
  resources.push(lightRT);
  const hdr=(w,h,depth=false)=>{
    const t=new THREE.WebGLRenderTarget(w,h,{type:THREE.HalfFloatType,depthBuffer:depth,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});
    if(depth){t.depthTexture=new THREE.DepthTexture(w,h,THREE.UnsignedIntType);t.samples=4;}
    resources.push(t);return t;
  };
  const colorRT=hdr(1,1,true),compositeRT=hdr(1,1);
  const presets={fast:{scale:.25,steps:16},settled:{scale:.5,steps:48},high:{scale:.75,steps:64}};
  for(const p of Object.values(presets)){p.raw=hdr(1,1);p.filtered=hdr(1,1);}
  const uniform=(value)=>({value});
  const shared={viewDepth:uniform(colorRT.depthTexture),cameraNear:uniform(camera.near),cameraFar:uniform(camera.far)};
  const volumeUniforms={...shared,lightDepth:uniform(lightRT.depthTexture),inverseProjection:uniform(new THREE.Matrix4()),cameraWorld:uniform(new THREE.Matrix4()),lightVP:uniform(new THREE.Matrix4()),cameraPositionWorld:uniform(new THREE.Vector3()),boundsMin:uniform(bounds.min.clone()),boundsMax:uniform(bounds.max.clone()),toSun:uniform(lighting.toSun),sunColor:uniform(sun.color),basisU:uniform(new THREE.Vector3()),basisV:uniform(new THREE.Vector3()),sunIntensity:uniform(sun.intensity),strength:uniform(1),grain:uniform(.15),time:uniform(0),depthBias:uniform(.0001),sunTangent:uniform(0),lightSpan:uniform(new THREE.Vector2()),lightDepthRange:uniform(1),sigmaT:uniform(.012),sigmaS:uniform(.008),phaseG:uniform(.5),beamGain:uniform(1),steps:uniform(48)};
  const field=createCurtainField(lighting);Object.assign(volumeUniforms,field.uniforms);
  const contactShadows=installContactShadows(root,{lightRT,lightCamera,lightVP:volumeUniforms.lightVP,depthBias:volumeUniforms.depthBias,lighting,field});
  const material=(fragmentShader,uniforms)=>new THREE.ShaderMaterial({vertexShader,fragmentShader,uniforms,depthTest:false,depthWrite:false,toneMapped:false});
  const volumeMat=material(volumeShader,volumeUniforms);
  const filterMat=material(filterShader,{...shared,volume:uniform(null),texel:uniform(new THREE.Vector2())});
  const compositeMat=material(compositeShader,{...shared,sceneColor:uniform(colorRT.texture),volume:uniform(null),volumeSize:uniform(new THREE.Vector2())});
  const quad=new FullScreenQuad(volumeMat),output=new OutputPass();output.renderToScreen=true;
  const worldBounds=new THREE.Box3().setFromObject(root).union(bounds),center=worldBounds.getCenter(new THREE.Vector3());
  const corners=[];for(let i=0;i<8;i++)corners.push(new THREE.Vector3(i&1?worldBounds.max.x:worldBounds.min.x,i&2?worldBounds.max.y:worldBounds.min.y,i&4?worldBounds.max.z:worldBounds.min.z));
  let lightDirty=true,width=1,height=1;
  const stats={frames:0,lightDepthRenders:0,rawDepthSize:lightSize,quality:'settled',scale:.5,steps:48,fullScreenPasses:4,sceneSamples:4,casters:casters.length,worldBounds:{min:worldBounds.min.toArray(),max:worldBounds.max.toArray()},drawCalls:0};
  function updateLight(){
    for(const {source,proxy} of casters){source.updateWorldMatrix(true,false);proxy.matrix.copy(source.matrixWorld);proxy.geometry=source.geometry;proxy.visible=source.visible;}
    const distance=worldBounds.getSize(new THREE.Vector3()).length()*1.5;
    lightCamera.position.copy(center).addScaledVector(lighting.toSun,distance);lightCamera.lookAt(center);lightCamera.updateMatrixWorld(true);
    const box=new THREE.Box3();for(const corner of corners)box.expandByPoint(corner.clone().applyMatrix4(lightCamera.matrixWorldInverse));
    Object.assign(lightCamera,{left:box.min.x-.15,right:box.max.x+.15,bottom:box.min.y-.15,top:box.max.y+.15,near:Math.max(.05,-box.max.z-.3),far:-box.min.z+.3});lightCamera.updateProjectionMatrix();
    volumeUniforms.lightVP.value.multiplyMatrices(lightCamera.projectionMatrix,lightCamera.matrixWorldInverse);
    volumeUniforms.depthBias.value=.003/(lightCamera.far-lightCamera.near);
    sun.position.copy(lightCamera.position);sun.target.position.copy(center);sun.target.updateMatrixWorld(true);
    Object.assign(sun.shadow.camera,{left:lightCamera.left,right:lightCamera.right,top:lightCamera.top,bottom:lightCamera.bottom,near:lightCamera.near,far:lightCamera.far});sun.shadow.camera.updateProjectionMatrix();
    renderer.shadowMap.needsUpdate=true;
    const up=Math.abs(lighting.toSun.y)>.97?new THREE.Vector3(1,0,0):new THREE.Vector3(0,1,0);
    volumeUniforms.basisU.value.crossVectors(lighting.toSun,up).normalize();volumeUniforms.basisV.value.crossVectors(lighting.toSun,volumeUniforms.basisU.value).normalize();
    renderer.setRenderTarget(lightRT);renderer.clear();renderer.render(proxies,lightCamera);stats.lightDepthRenders++;lightDirty=false;
  }
  function resize(w,h){width=w;height=h;colorRT.setSize(w,h);compositeRT.setSize(w,h);for(const p of Object.values(presets)){const x=Math.max(1,Math.round(w*p.scale)),y=Math.max(1,Math.round(h*p.scale));p.raw.setSize(x,y);p.filtered.setSize(x,y);}}
  function draw(mat,target){quad.material=mat;renderer.setRenderTarget(target);quad.render(renderer);}
  function render({moving=false,time=0}={}){
    renderer.info.reset();
    if(lightDirty)updateLight();
    field.update(time);contactShadows.update();volumeUniforms.sunTangent.value=contactShadows.uniforms.archiveSunTangent.value;volumeUniforms.lightSpan.value.copy(contactShadows.uniforms.archiveLightSpan.value);volumeUniforms.lightDepthRange.value=contactShadows.uniforms.archiveDepthRange.value;
    camera.updateMatrixWorld(true);shared.cameraNear.value=camera.near;shared.cameraFar.value=camera.far;
    renderer.setRenderTarget(colorRT);renderer.clear();renderer.render(scene,camera);
    const s=lighting.state;
    volumeUniforms.sigmaT.value=s.curtainMode==='legacy'?.012:s.airDensity;volumeUniforms.sigmaS.value=s.curtainMode==='legacy'?.008:s.airDensity*.75;volumeUniforms.phaseG.value=field.phaseG;volumeUniforms.beamGain.value=s.curtainMode==='legacy'?1:s.beamGain;
    const mode=s.quality==='high'?'high':s.quality==='fast'||moving?'fast':'settled',p=presets[mode];
    stats.quality=mode;stats.scale=p.scale;stats.steps=p.steps;
    if(!s.enabled||s.strength===0){output.render(renderer,null,colorRT);stats.fullScreenPasses=1;}
    else{
      volumeUniforms.inverseProjection.value.copy(camera.projectionMatrixInverse);volumeUniforms.cameraWorld.value.copy(camera.matrixWorld);camera.getWorldPosition(volumeUniforms.cameraPositionWorld.value);
      volumeUniforms.strength.value=s.strength;volumeUniforms.grain.value=s.grain;volumeUniforms.time.value=time;volumeUniforms.steps.value=p.steps;volumeUniforms.sunIntensity.value=sun.intensity;
      draw(volumeMat,p.raw);
      filterMat.uniforms.volume.value=p.raw.texture;filterMat.uniforms.texel.value.set(1/p.raw.width,1/p.raw.height);draw(filterMat,p.filtered);
      compositeMat.uniforms.volume.value=p.filtered.texture;compositeMat.uniforms.volumeSize.value.set(p.filtered.width,p.filtered.height);draw(compositeMat,compositeRT);
      output.render(renderer,null,compositeRT);stats.fullScreenPasses=4;
    }
    stats.curtainMode=s.curtainMode;stats.animationTime=time;stats.phaseG=field.phaseG;stats.frames++;stats.drawCalls=renderer.info.render.calls;stats.size=[width,height];stats.textures=renderer.info.memory.textures;
  }
  function setSamples(samples){colorRT.samples=samples;stats.sceneSamples=samples;colorRT.dispose();}
  function readVolume(){const p=presets[stats.quality];const pixels=new Uint16Array(p.raw.width*p.raw.height*4);renderer.readRenderTargetPixels(p.raw,0,0,p.raw.width,p.raw.height,pixels);return {pixels,width:p.raw.width,height:p.raw.height};}
  return {render,resize,surfaceUniforms:contactShadows.uniforms,markLightDirty(){lightDirty=true;},stats,field,lightCamera,lightRT,proxies,colorRT,presets,volumeUniforms,readVolume,setSamples,
    dispose(){contactShadows.dispose();for(const r of resources)r.dispose();for(const m of materials.values())m.dispose();volumeMat.dispose();filterMat.dispose();compositeMat.dispose();output.dispose();quad.dispose();proxies.clear();}};
}
