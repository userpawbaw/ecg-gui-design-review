"""Intermediate parent imagery prevents a high-detail island in blurry global imagery."""
from pathlib import Path
R=Path(__file__).resolve().parents[2]
code=(R/'scripts/assets/prepare-detailed-terrain.py').read_text().split('bounds=(8.12,61.5')[0]
code=code.replace("'assets/source/a-terrain-detailed-20261007'","'assets/source/a-north-macro-20261007'").replace("'assets/processed/a-terrain-detailed-20261007'","'assets/processed/a-north-macro-20261007'")
code=code.replace("[('broad',(7.1,61.0,9.7,62.2),10),('near',(8.12,61.5,8.65,61.75),12)]","[('macro',(0.,56.,16.,68.),7)]")
exec(code)
image=Image.open(OUT/'macro.jpg');image.thumbnail((2048,2048));p=R/'prototype/spikes/a-climb/public/north-earth/macro.jpg';image.save(p,quality=94);meta['runtime']=pin(p);meta['runtime_dimensions']=image.size
(OUT/'metadata.json').write_text(json.dumps(meta,indent=2)+'\n');print('MACRO MAP READY',image.size,flush=True)
