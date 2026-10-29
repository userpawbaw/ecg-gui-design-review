# T3 loop: bash t3.sh <label> '<TUNE js>' → 4 still-shot captures + stats (run from the repo root, server on :4173)
V=verification/r1-figure-v3-web-20261003
for s in s1_top s2_beams s3_aisle s4_person; do HIDEUI=1 TUNE="$2" EXTRA="&look=archive&shot=$s" node $V/cap.mjs $1-$s ".55,3" >/dev/null 2>&1 & done; wait
python $V/stats.py $V/frames/$1-s*.jpg
