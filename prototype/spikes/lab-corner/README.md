# Lab Corner — AI 단독 Blender 제작 + 360° 빛 방향 시험

제품 UI가 아니다. "Opus + Blender(bpy)만으로 레퍼런스급 3D 장면을 만들 수 있는가"와
"방은 그대로 두고 드래그로 빛 방향을 360° 돌릴 수 있는가"를 확인하는 spike다.
결과·판단: `docs/uiux_system/handoffs/EFFECT_PRODUCTION_PIPELINE_AUDIT_2026-09-25.md` §20, F-013.

```bash
# 1) 소품(Poly Haven CC0) 받기 — assets/registry.json 의 ph-* 항목
node scripts/assets/fetch.mjs --only=ph-
# 2) 장면 조립 + 베이크(약 13분, CPU 4코어) + 웹 패키징
python3 scripts/blender/build_lab_corner.py --azimuths 8 --size 1024 --samples 128 --passes full,indirect
python3 scripts/blender/package_lab_corner.py prototype/spikes/lab-corner/public/scene
# 3) 웹
cd prototype/spikes/lab-corner && npm install && npm run build && npm run preview   # http://127.0.0.1:4190/
CHROMIUM=/opt/pw-browsers/chromium npm run qa                                       # 3모드 × 9각도 캡처 + 드래그 관성
```

조명 방식 3가지(`?mode=`):
- `baked` A — 8방향 전체 조명(직접+간접)을 구워 두고 인접 두 장을 섞음
- `realtime` B — 실시간 태양(그림자 맵) + 반구광 + 베이크 AO
- `hybrid` C — 실시간 직접광(그림자 맵) + 8방향 간접광 베이크 블렌드 + 약한 반구광(하늘 직접광 보완)

모니터 화면 파형은 저장 replay `d1-mixed-10`의 M08 출력으로 그린 **장식**이다(측정 표시 아님).
