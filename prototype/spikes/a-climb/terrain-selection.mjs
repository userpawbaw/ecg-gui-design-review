// D092: measured height error projected into pixels; distance is to the closest point of the tile.
export function selectTerrainLevel(tile,camera,focalPixels,tolerance=1.2,current=-1){
 const distance=Math.max(.05,Math.hypot(...camera.map((c,i)=>c-Math.max(tile.min[i],Math.min(tile.max[i],c)))));
 const errors=tile.levels.map(l=>l.errorKm*focalPixels/distance);
 let selected=errors.findIndex(e=>e<=tolerance);if(selected<0)selected=tile.levels.length-1;
 // Refine promptly; coarsen only below the lower threshold to prevent boundary oscillation.
 if(current>=0&&selected<current&&errors[selected]>tolerance*.8)selected=current;
 return {level:selected,errorPixels:errors[selected],distance};
}
