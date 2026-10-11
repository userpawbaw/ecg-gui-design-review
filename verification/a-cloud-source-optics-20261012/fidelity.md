# D132 충실도와 검증 범위

- PASS: survey10장384²/32최대samples, native새4장1024²/96최대samples, baseline1장D130재사용. native/source SHA·크기 검증 및 실제1:1crop 정지이미지 검토.
- TUNE: density4에서능선·골명암부분개선. g0는밝은면추가변화. 사진섬유결미달/단단한면과partial-alphaedgegrain남음.
- 미채택: 실제web코드변경없음. 원본08이나density4/g0를사용자가선택한것아님.
- NOT VERIFIED: 브라우저스크롤/정역motion/실시간GPU frame/VRAM/targetPC/지도seam/국소patch인계.
- 동일source내에서는camera/light/bbox고정.06↔08은source형상과광학path차이가있어resolution-only대조아님.
- 다음: 별도고해상도source와공식example조건재현→결gate확보후국소footprint6구도/정역motion.
- 그림자보류/서고KEEP/과거실패2/2와fallback보존.
