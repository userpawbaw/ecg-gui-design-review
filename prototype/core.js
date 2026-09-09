(function (root) {
  'use strict';
  function decode(encoded, scale, expectedLength) {
    if (!(scale > 0) || !Number.isFinite(scale)) throw Error('Invalid scale');
    const raw = typeof atob === 'function' ? atob(encoded) : Buffer.from(encoded,'base64').toString('binary');
    if (raw.length !== expectedLength * 2) throw Error('Invalid trace length');
    const samples = new Float64Array(expectedLength);
    for(let i=0;i<samples.length;i++) {
      let q=raw.charCodeAt(i*2) | raw.charCodeAt(i*2+1)<<8;
      if(q & 0x8000) q-=65536;
      samples[i]=q*scale;
    }
    return samples;
  }
  function metrics(ref, output, input) {
    if(!ref || !output || ref.length !== output.length || ref.length<2 || (input && input.length!==ref.length)) return null;
    const n=ref.length;
    const mean=a=>a.reduce((sum,x)=>sum+x,0)/n;
    const mr=mean(ref), mo=mean(output), mi=input?mean(input):0;
    let rr=0,oo=0,ro=0,error=0,inputError=0;
    for(let i=0;i<n;i++) {
      const r=ref[i]-mr,o=output[i]-mo;
      if(!Number.isFinite(r)||!Number.isFinite(o)||(input&&!Number.isFinite(input[i]))) return null;
      rr+=r*r;oo+=o*o;ro+=r*o;error+=(r-o)**2;
      if(input) inputError+=(r-(input[i]-mi))**2;
    }
    if(rr<=0) return null;
    const snr=e=>e<=0?Infinity:10*Math.log10(rr/e);
    const alpha=oo>0?ro/oo:null;
    let scaledError=0;
    if(alpha!==null) for(let i=0;i<n;i++) scaledError+=((ref[i]-mr)-alpha*(output[i]-mo))**2;
    return {strict:snr(error),scaled:alpha===null?-Infinity:snr(scaledError),alpha,
      cc:oo>0?ro/Math.sqrt(rr*oo):null,rmse:Math.sqrt(error/n),input:input?snr(inputError):null,n};
  }
  function selection(start,length,fs,n) {
    const dur=n/fs;
    const size=Math.min(n,Math.max(2,Math.round((Number.isFinite(+length)?+length:1.2)*fs)));
    const first=Math.max(0,Math.min(n-size,Math.round((Number.isFinite(+start)?+start:0)*fs)));
    return {first,last:first+size,start:first/fs,length:size/fs,end:(first+size)/fs,duration:dur};
  }
  const api={decode,metrics,selection};
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.ECGCore=api;
})(typeof window==='object'?window:this);
