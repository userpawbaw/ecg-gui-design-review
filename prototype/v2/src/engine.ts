export type Mode='sweep'|'scroll';
export class Transport {
 time=5; playing=false; speed=1; duration=10; loop=false; private last:number|null=null;
 play(){if(this.time>=this.duration)this.time=0;this.playing=true;this.last=null;}
 pause(){this.playing=false;this.last=null;}
 seek(t:number){this.pause();this.time=Math.max(0,Math.min(this.duration,t));}
 tick(now:number){if(!this.playing){this.last=null;return;}if(this.last!==null){this.time+=(now-this.last)/1000*this.speed;if(this.time>=this.duration){if(this.loop)this.time%=this.duration;else{this.time=this.duration;this.pause();}}}if(this.playing)this.last=now;}
}
export type Point={index:number,x:number,alpha:number,breakBefore:boolean};
export function visiblePoints(time:number,span:number,fs:number,n:number,mode:Mode,inspect=false,soft=true):Point[]{
 const count=Math.round(span*fs),head=Math.min(n-1,Math.floor(time*fs)),out:Point[]=[];
 if(inspect||mode==='scroll'){
  const end=inspect?Math.min(n,Math.max(1,Math.round(time*fs))):Math.min(n,time*fs+1);
  const start=inspect?Math.max(0,end-count):end-count;
  const width=inspect?Math.max(1,Math.min(count,end)):count;
  for(let i=Math.max(0,Math.ceil(start));i<Math.min(n,end);i++)out.push({index:i,x:(i-start)/width,alpha:1,breakBefore:out.length===0});return out;
 }
 const cycle=Math.floor(head/count),pos=head%count,gap=.12*fs,fade=.08*fs;
 let prev=-2;
 for(let k=0;k<count;k++){
  let index=cycle*count+k;if(index>head)index-=count;if(index<0||index>=n)continue;
  const d=(k-pos+count)%count;
  const alpha=d>0&&d<gap?0:d>=gap&&d<gap+fade?(soft?(d-gap)/fade:0):1;
  out.push({index,x:k/count,alpha,breakBefore:index!==prev+1});prev=index;
 }return out;
}
export function decode(encoded:string,scale:number,n:number){
 if(!(scale>0&&Number.isFinite(scale)))throw Error('Invalid scale');const b=atob(encoded);if(b.length!==n*2)throw Error('파형 길이가 manifest와 다릅니다.');const a=new Float32Array(n);
 for(let i=0;i<n;i++){let v=b.charCodeAt(i*2)|(b.charCodeAt(i*2+1)<<8);if(v&32768)v-=65536;a[i]=v*scale;}return a;
}
export function metric(ref:Float32Array,out?:Float32Array,input?:Float32Array){
 if(!out||ref.length!==out.length||!ref.length)return null;let mr=0,mo=0,mi=0;const n=ref.length;for(let i=0;i<n;i++){mr+=ref[i];mo+=out[i];mi+=input?.[i]||0;}mr/=n;mo/=n;mi/=n;
 let rr=0,oo=0,ro=0,err=0,ie=0;for(let i=0;i<n;i++){const r=ref[i]-mr,o=out[i]-mo;rr+=r*r;oo+=o*o;ro+=r*o;err+=(r-o)**2;if(input)ie+=(r-(input[i]-mi))**2;}
 if(rr===0)return null;const alpha=oo?ro/oo:0;let se=0;for(let i=0;i<n;i++)se+=((ref[i]-mr)-alpha*(out[i]-mo))**2;
 return{strict:10*Math.log10(rr/err),scaled:10*Math.log10(rr/se),alpha,cc:oo?ro/Math.sqrt(rr*oo):NaN,rmse:Math.sqrt(err/n),input:input?10*Math.log10(rr/ie):NaN,n};
}
