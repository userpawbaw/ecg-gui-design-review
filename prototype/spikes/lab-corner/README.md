# Lab Corner — AI 단독 Blender 제작 + 360° 빛 방향 시험

제품 UI가 아니다. "Opus + Blender(bpy)만으로 레퍼런스급 3D 장면을 만들 수 있는가"와
"방은 그대로 두고 드래그로 빛 방향을 360° 돌릴 수 있는가"를 확인하는 spike다.
결과·판단: `docs/uiux_system/handoffs/EFFECT_PRODUCTION_PIPELINE_AUDIT_2026-09-25.md` §20, F-013.

v3(2026-09-25): 스크롤하면 카메라가 전경에서 모니터 앞으로 내려온다(`?p=0..1`로 시작 위치 지정), 포인터 시선, 2048 px 화면(저장 replay 파형, 장식), 반사 전용 환경, 먼지. 문서: `docs/uiux_system/handoffs/REFERENCE_REPRO_AND_QUALITY_GAP_2026-09-25.md` §2.

v2(2026-09-25): C 방식 전용. v1 A/B/C 비교는 커밋 `d1e669c`와 audit §20에 있다. v2 변경: audit §21.

```bash
# 1) 소품·텍스처(Poly Haven CC0) 받기 — assets/registry.json 의 ph-* 항목
node scripts/assets/fetch.mjs --only=ph-
# 2) 장면 조립 + 베이크(하늘빛 1회 + 반사광 8방향, OIDN, 약 12분, CPU 4코어) + 웹 패키징
python3 scripts/blender/build_lab_corner.py --azimuths 8 --size 1024 --samples 256 --passes sky,bounce
python3 scripts/blender/package_lab_corner.py prototype/spikes/lab-corner/public/scene
# 3) 웹
cd prototype/spikes/lab-corner && npm install && npm run build && npm run preview   # http://127.0.0.1:4190/
CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npm run qa             # 후처리 on/off × 9각도 + 드래그
```

조명 = 실시간 해(직접광 + 그림자 맵) + 베이크 하늘빛 + 8방향 해 반사광 블렌드. 잎은 평균 조명 프로브를 쓴다.
`?angle=` 시작 각도, `?fx=0` 후처리 끔.

모니터 화면 파형은 저장 replay `d1-mixed-10`의 M08 출력으로 그린 **장식**이다(측정 표시 아님).
