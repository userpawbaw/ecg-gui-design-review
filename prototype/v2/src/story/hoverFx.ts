// Hover feedback (D-048, IDEA-R1-HOVER A2 + B1 + C1 + D1). One delegated listener set per shell: while the pointer rests on, or keyboard focus
// reaches, an element with class "hv", the shell root gets data-hd — CSS then dims the scene layer (B1) and fills the control (A2).
// No React state and no per-element handlers (D-028: nothing per-frame goes through React). Scope: the intro (Story is being redone separately).
import {useEffect,type RefObject} from 'react';

export const HV='.hv';
/** Pure: is `el` inside a hover-feedback control? (exported for tests) */
export const onControl=(el:EventTarget|null)=>!!(el&&(el as Element).closest&&(el as Element).closest(HV));

export function bindHoverDim(root:HTMLElement){
 const set=(on:boolean)=>{if(on)root.setAttribute('data-hd','1');else root.removeAttribute('data-hd');};
 const over=(e:Event)=>{if(onControl(e.target))set(true);};
 const out=(e:Event)=>{if(!onControl((e as PointerEvent).relatedTarget))set(false);};
 const focusIn=(e:Event)=>{const t=e.target as Element;if(onControl(t)&&t.matches(':focus-visible'))set(true);};   // D1: keyboard focus counts, mouse focus does not
 const focusOut=(e:Event)=>{if(!onControl((e as FocusEvent).relatedTarget))set(false);};
 const leave=()=>set(false);
 root.addEventListener('pointerover',over);root.addEventListener('pointerout',out);root.addEventListener('focusin',focusIn);root.addEventListener('focusout',focusOut);
 root.addEventListener('pointerleave',leave);
 return()=>{root.removeEventListener('pointerover',over);root.removeEventListener('pointerout',out);root.removeEventListener('focusin',focusIn);root.removeEventListener('focusout',focusOut);root.removeEventListener('pointerleave',leave);root.removeAttribute('data-hd');};
}

export function useHoverDim(root:RefObject<HTMLElement|null>){
 useEffect(()=>{const el=root.current;return el?bindHoverDim(el):undefined;},[root]);
}
