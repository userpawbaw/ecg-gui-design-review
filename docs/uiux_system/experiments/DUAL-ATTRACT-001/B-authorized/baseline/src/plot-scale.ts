/** Tick values are physical mV, including when the difference trace has display gain. */
export function amplitudeTicks(amplitude:number,gain=1){
 if(!Number.isFinite(amplitude)||amplitude<=0||!Number.isFinite(gain)||gain<=0)throw new RangeError('Positive finite scale required');
 const range=amplitude/gain,step=range/2;
 // Preserve small tick spacing; thirds (gain ×3) are rounded to readable labels.
 const decimals=Math.min(8,Math.max(1,1-Math.floor(Math.log10(step))));
 return [range,step,0,-step,-range].map((value,i)=>({value,fraction:i/4,label:value===0?'0':(value<0?'−':'')+Math.abs(value).toFixed(decimals)}));
}
