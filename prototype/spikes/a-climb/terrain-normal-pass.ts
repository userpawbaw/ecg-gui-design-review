import * as THREE from 'three';
import {NormalPass} from 'postprocessing';

// The optical normal buffer must describe the same GPU-deformed surface as the color/depth pass.
// NormalPass's shared override otherwise drops terrain onBeforeCompile vertex morphs.
export class TerrainNormalPass extends NormalPass {
 matched=true;
 private sceneRef:THREE.Scene;
 private variants=new Map<THREE.Material,THREE.MeshNormalMaterial>();
 constructor(scene:THREE.Scene,camera:THREE.Camera){super(scene,camera);this.sceneRef=scene;}
 set mainScene(scene:THREE.Scene){this.sceneRef=scene;super.mainScene=scene;}
 render(renderer:THREE.WebGLRenderer,input:any,output:any,delta?:number,stencil?:boolean){
  if(!this.matched){super.render(renderer,input,output,delta,stencil);return;}
  const swaps:{mesh:THREE.Mesh;material:THREE.Material}[]=[],hidden:THREE.Object3D[]=[];
  const pass=(this as any).renderPass;
  const override=pass.overrideMaterialManager;pass.overrideMaterialManager=null;
  this.sceneRef.traverse(o=>{
   if(o instanceof THREE.Points||o instanceof THREE.Line){if(o.visible){hidden.push(o);o.visible=false;}return;}
   if(!(o instanceof THREE.Mesh)||Array.isArray(o.material))return;
   const source=o.material;
   // Transparent clouds do not write the terrain depth buffer and must not overwrite its normals.
   if(!source.depthWrite){if(o.visible){hidden.push(o);o.visible=false;}return;}
   let normal=this.variants.get(source);
   if(!normal){
    normal=new THREE.MeshNormalMaterial({side:source.side,flatShading:(source as any).flatShading??false,
     depthTest:source.depthTest,depthWrite:source.depthWrite,polygonOffset:source.polygonOffset,
     polygonOffsetFactor:source.polygonOffsetFactor,polygonOffsetUnits:source.polygonOffsetUnits});
    normal.onBeforeCompile=(shader,r)=>{
     const adapted={...shader,uniforms:{...shader.uniforms}};
     source.onBeforeCompile(adapted,r);
     // Keep the normal fragment output, sharing only geometry and its live morph uniforms.
     shader.vertexShader=adapted.vertexShader;Object.assign(shader.uniforms,adapted.uniforms);
    };
    normal.customProgramCacheKey=()=>source.customProgramCacheKey()+'-matched-terrain-normal';
    this.variants.set(source,normal);
   }
   normal.polygonOffset=source.polygonOffset;normal.polygonOffsetFactor=source.polygonOffsetFactor;normal.polygonOffsetUnits=source.polygonOffsetUnits;
   swaps.push({mesh:o,material:source});o.material=normal;
  });
  try{super.render(renderer,input,output,delta,stencil);}
  finally{for(const {mesh,material} of swaps)mesh.material=material;for(const o of hidden)o.visible=true;pass.overrideMaterialManager=override;}
 }
 dispose(){for(const m of this.variants.values())m.dispose();this.variants.clear();super.dispose();}
}
