// Analytical audit of the default arrival route at t=0, not a browser capture.
import * as T from '../../prototype/spikes/a-climb/node_modules/three/build/three.module.js';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const smooth = (a,b,p) => {const x=Math.max(0,Math.min(1,(p-a)/(b-a)));return x*x*(3-2*x);};
const frames = [.245,.28,.30,.315].map(p => {
  const q=smooth(.1,.245,p),radial=new T.Vector3(.3,.45,.842).normalize();
  const tangent=new T.Vector3(.82,.3,-.5).addScaledVector(radial,-new T.Vector3(.82,.3,-.5).dot(radial)).normalize();
  const alt=T.MathUtils.lerp(.16,.0025,smooth(.23,.315,p));
  const end=radial.clone().multiplyScalar(1+alt),cam=new T.Vector3(0,-.12,3.1).lerp(end,q);
  const pitch=T.MathUtils.lerp(.65,.13,smooth(.23,.315,p));
  const target=new T.Vector3(-.4,.14,0).lerp(end.clone().addScaledVector(tangent,Math.cos(pitch)).addScaledVector(radial,-Math.sin(pitch)),q);
  const hit=new T.Ray(cam,target.clone().sub(cam).normalize()).intersectSphere(new T.Sphere(new T.Vector3(),1),new T.Vector3());
  const inv=new T.Quaternion().setFromEuler(new T.Euler(-1.15+q*1.15,-.5+q*.45,.14+q*.3)).invert();
  const subcamera=cam.clone().normalize().applyQuaternion(inv);
  if(hit)hit.applyQuaternion(inv).normalize();
  return {p,altitude_km:alt*6360,subcamera_latitude_deg:T.MathUtils.radToDeg(Math.asin(subcamera.y)),center_hit_latitude_deg:hit?T.MathUtils.radToDeg(Math.asin(hit.y)):null,near_plane_km:.025*6360};
});
const sources=['prototype/spikes/a-climb/arrival.ts','prototype/spikes/a-climb/planet-terrain.ts','prototype/spikes/a-climb/assets/earth/manifest.json','prototype/spikes/a-climb/assets/planet-v2/manifest.json'];
const result={scope:'default route, t=0, unit sphere analytical center-ray only; no sculpt/photo route, displacement or viewport footprint evaluation',frames,
  global_color_size:[4096,2048],equatorial_km_per_texel:2*Math.PI*6360/4096,
  antarctic_height_source_spacing_m:1000,antarctic_grid:[2048,512],antarctic_mesh_segments:[512,192],antarctic_coverage_latitude_deg:[-90,-60],
  sources:sources.map(file=>({file,sha256:createHash('sha256').update(readFileSync(root+file)).digest('hex')}))};
mkdirSync(root+'verification/a-earth-detail-20261007',{recursive:true});
writeFileSync(root+'verification/a-earth-detail-20261007/source-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
