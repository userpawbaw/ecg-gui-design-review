import * as THREE from 'three';
export async function createTerrainParent(macro:THREE.Texture,broad:THREE.Texture,day:THREE.Texture,packed:THREE.Texture){
 const base=new URL('./north-earth/',document.baseURI),m=await (await fetch(new URL('parent-height.json',base))).json(),raw=new Uint16Array(await (await fetch(new URL('parent-height.bin',base))).arrayBuffer());
 if(raw.length!==m.size*m.size)throw Error('Invalid parent height size');
 const lat0=61.63,lon0=8.4,kx=111.32*Math.cos(THREE.MathUtils.degToRad(lat0)),ky=111.32,n=m.size,b=m.bounds;
 const smooth=(a:number,c:number,x:number)=>{const t=THREE.MathUtils.clamp((x-a)/(c-a),0,1);return t*t*(3-2*t);};
 function sample(x:number,z:number){const lon=x/kx+lon0,lat=lat0-z/ky,u=THREE.MathUtils.clamp((lon-b[0])/(b[2]-b[0])*(n-1),0,n-1.001),v=THREE.MathUtils.clamp((b[3]-lat)/(b[3]-b[1])*(n-1),0,n-1.001),i=Math.floor(u),j=Math.floor(v),a=u-i,c=v-j;
  const h=((raw[j*n+i]*(1-a)+raw[j*n+i+1]*a)*(1-c)+(raw[(j+1)*n+i]*(1-a)+raw[(j+1)*n+i+1]*a)*c)*.0015;
  return h-(x*x+z*z)/(2*6371);
 }
 function normal(x:number,z:number){const step=.8;return new THREE.Vector3(-(sample(x+step,z)-sample(x-step,z))/(2*step),1,-(sample(x,z+step)-sample(x,z-step))/(2*step)).normalize();}
 const geometry=new THREE.PlaneGeometry(1,1,256,256),pos=geometry.getAttribute('position'),uv=geometry.getAttribute('uv'),ground=new Float32Array(pos.count);const la0=THREE.MathUtils.degToRad(lat0);
 for(let i=0;i<pos.count;i++){const lon=b[0]+uv.getX(i)*(b[2]-b[0]),lat=b[1]+uv.getY(i)*(b[3]-b[1]),x=(lon-lon0)*kx,z=(lat0-lat)*ky;const la=THREE.MathUtils.degToRad(lat),delta=THREE.MathUtils.degToRad(lon-lon0),ex=6371*Math.cos(la)*Math.sin(delta),ey=6371*(Math.sin(la)*Math.sin(la0)+Math.cos(la)*Math.cos(la0)*Math.cos(delta))-6371,ez=6371*(Math.sin(la0)*Math.cos(la)*Math.cos(delta)-Math.cos(la0)*Math.sin(la)),edge=Math.min(uv.getX(i),uv.getY(i),1-uv.getX(i),1-uv.getY(i)),rU=(lon-7.1)/2.6,rV=(lat-61.)/1.2,re=Math.min(rU,rV,1-rU,1-rV),w=smooth(-.35,0,re);ground[i]=THREE.MathUtils.lerp(ey,-(x*x+z*z)/(2*6371),w);pos.setXYZ(i,THREE.MathUtils.lerp(ex,x,w),ground[i]+(sample(x,z)+(x*x+z*z)/(2*6371))*smooth(0,.12,edge),THREE.MathUtils.lerp(ez,z,w));}
 geometry.setAttribute('groundHeight',new THREE.BufferAttribute(ground,1));geometry.computeVertexNormals();geometry.computeBoundingSphere();
 const amount={value:0},detail={value:0},mat=new THREE.MeshStandardMaterial({map:macro,roughness:.87,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 mat.onBeforeCompile=s=>{Object.assign(s.uniforms,{parentAmount:amount,detailAmount:detail,parentBroad:{value:broad},parentDay:{value:day},parentPacked:{value:packed}});
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute float groundHeight;uniform float parentAmount,detailAmount;').replace('#include <begin_vertex>',`#include <begin_vertex>
   float curve=groundHeight;float edge=min(min(uv.x,uv.y),min(1.-uv.x,1.-uv.y));
   transformed.y=mix(curve,position.y,parentAmount*smoothstep(0.,.12,edge));
   vec2 region=(vec2(position.x/${kx},61.63-position.z/111.32)+vec2(8.4,0.)-vec2(7.1,61.))/vec2(2.6,1.2);float re=min(min(region.x,region.y),min(1.-region.x,1.-region.y));
   transformed.y-=4.*detailAmount*smoothstep(0.,.20,re);
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D parentBroad,parentDay,parentPacked;').replace('#include <map_fragment>',`#include <map_fragment>
   vec2 ll=vec2(vMapUv.x*16.,56.+vMapUv.y*12.),guv=(ll+vec2(180.,90.))/vec2(360.,180.);float edge=min(min(vMapUv.x,vMapUv.y),min(1.-vMapUv.x,1.-vMapUv.y));
   vec3 globalColor=texture2D(parentDay,guv).rgb;globalColor=mix(globalColor,vec3(.9,.94,1.),texture2D(parentPacked,guv).b*.60);
   diffuseColor.rgb=mix(globalColor,diffuseColor.rgb,smoothstep(0.,.18,edge));
   vec2 r=(ll-vec2(7.1,61.))/vec2(2.6,1.2);float re=min(min(r.x,r.y),min(1.-r.x,1.-r.y));diffuseColor.rgb=mix(diffuseColor.rgb,texture2D(parentBroad,r).rgb,smoothstep(0.,.18,re));
  `);
 };
 const mesh=new THREE.Mesh(geometry,mat);mesh.name='Northern coarse parent terrain';mesh.receiveShadow=true;
 return {mesh,sample,normal,macro,bounds:b,set(p:number,d:number){amount.value=p;detail.value=d;mesh.visible=p>0;},state:()=>({source:m.source,bounds:b,triangles:256*256*2,reveal:amount.value,detail:detail.value}),dispose(){geometry.dispose();mat.dispose();}};
}
