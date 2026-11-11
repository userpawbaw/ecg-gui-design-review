# catalog-loader

공급사에서 내려받은 상품 카탈로그(`.cat`)를 읽어 JSON으로 바꾸는 스크립트입니다. 매장 단말기가 시작할 때마다 한 번 실행됩니다.

## 실행

    python3 catalog_loader.py <입력.cat> <출력.json>

- 출력은 항목 배열(JSON)이고, 뒤 단계(가격표 생성기)가 이 파일을 그대로 읽습니다. 항목 순서와 필드 값이 바뀌면 안 됩니다.
- 같은 SKU가 뒤에 다시 나오면 앞 항목을 갱신합니다(대소문자 구분 없음, 자리는 처음 나온 위치).
- 다른 스크립트에서 `from catalog_loader import load` 로도 씁니다. `load(path)` 는 항목(dict) 리스트를 돌려줍니다.

## 샘플 데이터

    python3 make_sample.py sample.cat

`sample.cat` 은 실제 카탈로그와 비슷한 크기(약 5천 항목)로 만든 것입니다. 실제 파일은 매번 내용이 다릅니다.

## 환경

매장 단말기는 Python 3 표준 라이브러리만 쓸 수 있습니다(추가 패키지 설치 불가).
