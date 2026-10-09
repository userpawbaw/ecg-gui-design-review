// D125: identical geographic colour reconstruction for sphere and deformed parent.
// Match low-frequency source colour; retain high-frequency source texture.
export const terrainSourceGLSL=`
vec3 matchedSourceColour(vec3 fine,vec3 low,vec3 reference){
 vec3 ratio=clamp(reference/max(low,vec3(.025)),vec3(.45),vec3(2.2));
 return fine*ratio;
}
vec3 continuousTerrainSource(sampler2D globalMap,sampler2D macroMap,sampler2D regionMap,vec2 guv,float gain){
 vec2 m=(guv-vec2(.5,146./180.))/vec2(16./360.,12./180.);
 float me=min(min(m.x,m.y),min(1.-m.x,1.-m.y));
 vec3 base=texture2D(globalMap,guv).rgb*gain;
 vec3 macro=texture2D(macroMap,m).rgb;
 macro=matchedSourceColour(macro,texture2D(macroMap,m,6.).rgb,texture2D(globalMap,guv,1.).rgb*gain);
 vec3 colour=mix(base,macro,smoothstep(0.,.24,me));
 vec2 r=(guv-vec2(187.1/360.,151./180.))/vec2(2.6/360.,1.2/180.);
 float re=min(min(r.x,r.y),min(1.-r.x,1.-r.y));
 vec3 region=texture2D(regionMap,r).rgb;
 vec3 referenceLow=texture2D(globalMap,guv,1.).rgb*gain;
 region=matchedSourceColour(region,texture2D(regionMap,r,6.).rgb,referenceLow);
 return mix(colour,region,smoothstep(0.,.24,re));
}`;
