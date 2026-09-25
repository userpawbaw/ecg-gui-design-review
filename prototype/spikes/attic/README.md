# Attic — REF-002 다락방 책장 재구성 spike

제품 UI가 아니다. REF-002(leoparpeix) EFX-002-01·03의 다락방 책장 장면을 CC0 재료와 절차 생성으로 다시 만든 연구 페이지.
책·책장·사다리·판화는 생성, 소품 17종은 Poly Haven(CC0), 조명은 Blender에서 완전 베이크, 빛줄기는 브라우저에서 레이마칭.

```bash
npm install && npm run build && npm run preview      # http://127.0.0.1:4192/
npm run scene                                        # 다시 굽기(Python bpy 필요, 약 30분)
node scripts/qa.mjs                                  # 헤드리스 캡처(PS=0.3,0.7 Q='?fx=0')
```

URL 조정: `?fx=0`(빛줄기 끔) `?shaft=2.6` `?density=0.05` `?exp=1.45` `?sat=1.18` `?curve=0.6` `?fov=27`.
문서: `docs/uiux_system/handoffs/ATTIC_BOOKSHELF_STUDY_2026-09-25.md`.
