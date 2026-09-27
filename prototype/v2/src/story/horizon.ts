// Backlit horizon arc — vanilla WebGL module (D-028: no React per frame).
// Source: REF-001 EFX-001-02/03 (backlit planet rim → light line match cut), BETA-R1-001 L0 / G-15.
// Renders on demand only (render gate): call set() when a uniform changes.
export type HorizonState={rim:number,apexY:number,apexGlow:number};
export type Horizon={set(s:Partial<HorizonState>):void,resize():void,dispose():void,ok:boolean};

const VS=`attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
const FS=`precision highp float;
uniform vec2 res;uniform float rim,apexY,apexGlow;
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){
 vec2 px=vec2(gl_FragCoord.x,res.y-gl_FragCoord.y);
 float R=res.x*1.35;vec2 c=vec2(res.x*.5,apexY+R);
 float d=length(px-c)-R;                              // <0 inside the disc
 float side=exp(-pow((px.x-res.x*.5)/(res.x*.42),2.));   // light concentrates near the apex
 vec3 bg=mix(vec3(.024,.035,.051),vec3(.016,.024,.035),px.y/res.y);
 vec3 col=bg;
 if(d<0.){col=mix(vec3(.008,.011,.016),vec3(.02,.028,.04),exp(d/(res.y*.25)));}
 // round 3 (G6): brighter rim/halo toward BETA-R1-S01 — measured rim apex #f1f2f6 in the still
 float core=exp(-abs(d)/2.)*rim*(.55+.75*side);
 float halo=exp(-max(d,0.)/34.)*step(0.,d)*rim*.5*side;
 float haze=exp(-max(d,0.)/260.)*step(0.,d)*rim*.14*side;
 float apex=exp(-length(px-vec2(res.x*.5,apexY))/120.)*apexGlow*rim*.9;
 col+=vec3(.93,.95,.98)*(core+halo+apex)+vec3(.55,.65,.8)*haze;
 col+=(hash(px+fract(res.x))-.5)*.018;                 // static grain
 gl_FragColor=vec4(col,1.);
}`;

export function createHorizon(canvas:HTMLCanvasElement,init:HorizonState):Horizon{
 const state={...init};
 const gl=canvas.getContext('webgl',{antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:true});
 if(!gl){canvas.classList.add('horizon-fallback');return{set(){},resize(){},dispose(){},ok:false};}
 const sh=(type:number,src:string)=>{const s=gl.createShader(type)!;gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s)||'shader');return s;};
 const prog=gl.createProgram()!;gl.attachShader(prog,sh(gl.VERTEX_SHADER,VS));gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);gl.useProgram(prog);
 const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
 const loc=gl.getAttribLocation(prog,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
 const u=(n:string)=>gl.getUniformLocation(prog,n);const uRes=u('res'),uRim=u('rim'),uApex=u('apexY'),uGlow=u('apexGlow');
 let raf=0,scale=1;
 const draw=()=>{raf=0;gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(uRes,canvas.width,canvas.height);gl.uniform1f(uRim,state.rim);gl.uniform1f(uApex,state.apexY*canvas.height);gl.uniform1f(uGlow,state.apexGlow);gl.drawArrays(gl.TRIANGLES,0,3);};
 const request=()=>{if(!raf)raf=requestAnimationFrame(draw);};
 const resize=()=>{scale=Math.min(1,devicePixelRatio||1);const r=canvas.getBoundingClientRect();canvas.width=Math.max(1,Math.round(r.width*scale));canvas.height=Math.max(1,Math.round(r.height*scale));request();};
 resize();
 return{ok:true,set(s){Object.assign(state,s);request();},resize,dispose(){cancelAnimationFrame(raf);gl.deleteProgram(prog);gl.deleteBuffer(buf);}};
}
