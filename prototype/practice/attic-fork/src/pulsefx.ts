// Pulse FX in the book's own space: a wavefront ring that leaves the heart on every R, crosses the gutter and reaches the plate
// (heart → waveform link, K2), and motes around the heart that are pushed outward by the passing front and settle back.
// Everything is a CONTINUOUS function of `age` (seconds since the last R) — nothing is emitted, teleported or re-seeded, so the
// user's "dust jumps then snaps back like a gif" cannot happen (IDEA-R1-SPACE-FORK §6.3-9, F-034).
import * as THREE from 'three';
const C_SPEED=.62,WAVE_W=.045;
export type PulseFx={ring:THREE.Group,motes:THREE.Points,update:(o:{age:number,time:number,mix:number,show:number,beat:number})=>void};
export function makePulseFx(page:{w:number,h:number},center:THREE.Vector2):PulseFx{
 const mkRing=(additive:boolean)=>new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,side:THREE.DoubleSide,
  uniforms:{uAge:{value:9},uC:{value:center.clone()},uCol:{value:additive?new THREE.Color():new THREE.Color(0x6a3a10)},uAmp:{value:0}},
  vertexShader:'varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform float uAge,uAmp;uniform vec2 uC;uniform vec3 uCol;varying vec2 vP;
   void main(){float d=length(vP-uC),rr=${C_SPEED.toFixed(3)}*uAge;
    float ring=exp(-pow((d-rr)/.013,2.))+.35*exp(-pow((d-rr*.72)/.02,2.));
    float a=ring*exp(-uAge/.8)*smoothstep(0.,.04,uAge)*uAmp*(1.-smoothstep(.2,.62,d));
    gl_FragColor=vec4(uCol*${additive?'1.6':'1.0'},a);}`});
 const ringMat=mkRing(true),darkMat=mkRing(false);
 const ring=new THREE.Group();for(const [m,o] of [[darkMat,0],[ringMat,.0004]] as const){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(page.w,page.h),m);mesh.position.z=o;mesh.renderOrder=7;mesh.frustumCulled=false;ring.add(mesh);}
 // motes: shell of points around the heart (home positions fixed), displaced radially by the front
 const N=240,home=new Float32Array(N*3),dir=new Float32Array(N*3),seed=new Float32Array(N),pos=new Float32Array(N*3);
 for(let i=0;i<N;i++){const u=Math.random()*2-1,a=Math.random()*Math.PI*2,r=.07+Math.random()*.13,s=Math.sqrt(1-u*u);
  const x=s*Math.cos(a),y=s*Math.sin(a),z=Math.abs(u)*.9+.1;                    // upper hemisphere (out of the page)
  home[i*3]=x*r*1.3;home[i*3+1]=y*r*1.1;home[i*3+2]=z*r*.9;const l=Math.hypot(x,y,z)||1;dir[i*3]=x/l;dir[i*3+1]=y/l;dir[i*3+2]=z/l;seed[i]=Math.random()*50;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
 const dc=document.createElement('canvas');dc.width=dc.height=64;const dg=dc.getContext('2d')!;const gr=dg.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(1,'rgba(255,255,255,0)');dg.fillStyle=gr;dg.fillRect(0,0,64,64);
 const mm=new THREE.PointsMaterial({map:new THREE.CanvasTexture(dc),size:.012,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,color:0xffc890,sizeAttenuation:true,toneMapped:false});
 const motes=new THREE.Points(g,mm);motes.frustumCulled=false;motes.renderOrder=7;
 const AMB=new THREE.Color(0xffb36b),MNT=new THREE.Color(0x67e7c3),tmp=new THREE.Color();
 return{ring,motes,update:({age,time,mix,show,beat})=>{
  tmp.copy(AMB).lerp(MNT,mix);ringMat.uniforms.uAge.value=age;ringMat.uniforms.uCol.value.copy(tmp);ringMat.uniforms.uAmp.value=1.5*show;darkMat.uniforms.uAge.value=age;darkMat.uniforms.uAmp.value=.55*show;
  const front=C_SPEED*age;
  for(let i=0;i<N;i++){const hx=home[i*3],hy=home[i*3+1],hz=home[i*3+2],d=Math.hypot(hx,hy,hz);
   const w=Math.exp(-Math.pow((d-front)/WAVE_W,2))*Math.exp(-age/.9),push=.038*w;          // pushed outward as the front passes, relaxes smoothly
   const s=seed[i],drift=.006;
   pos[i*3]=hx+dir[i*3]*push+Math.sin(time*.7+s)*drift;pos[i*3+1]=hy+dir[i*3+1]*push+Math.cos(time*.6+s*1.3)*drift;pos[i*3+2]=hz+dir[i*3+2]*push+Math.sin(time*.5+s*.7)*drift;}
  g.attributes.position.needsUpdate=true;mm.color.copy(tmp);mm.opacity=show*(.30+.55*beat);mm.size=.011+.006*beat;
 }};
}
