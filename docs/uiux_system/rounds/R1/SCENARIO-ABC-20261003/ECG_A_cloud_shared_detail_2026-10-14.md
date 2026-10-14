# 공통 구름 재질의 국소 디테일 시험 — D137

## 결과 먼저
기존 위성 구름의 실루엣·분포·기본색을 유지한 채 Disney의 국소 명암 잔차를 적용했다. 별개 RGBA군집이 사라져 D135의 재질이질성을 만드는 한 요소는 줄었다. 그러나 사진reference급 작은굴곡/선명도는 아직미달TUNE. 조명용고주파잔차만의방식은새height/normal/density를만들지않으므로양감추가가제한적.

## 실제 변경
- Disney D13545도native → linear luminance, alpha>.98 erosion17,Gaussian3/16pixels bandpass, Q95정규화. 실루엣/투명edge제외. 512² R8,중립128/scale100.
- 같은세계XZ영역(-15km,-16km),90×67.5km안에만. 위성density .55→.82의두꺼운core마스크로적용. 기존massLayer alpha/height/rayintersection유지.
- 태양radiance에bounded signed잔차배율. base색/태양방향은기존구름층사용. 원본bakedlight기여는잔차에남아완전재조명이아님. density/normal/실제높이자료라고표시하지않음.
- 픽셀footprint의명시mip,최소450mfilter. 원경→확대새개체생성/회전sprite없음.
- 8/15%9구도는선명도변화작아보존. 0/30/60%의동일3구도9장추가. 30/60은구름양이아닌국소명암변조상한.
- lab opt-in cloudBlend=1. D135독립atlas대조/주intro보존;새후보채택전.

## 검증과 한계
actual1280×720 snapshot9+약한대조9. 동일camera/ready/context/dimensions/HTTP검사. 표시RGB평균절대차이 p.235에서30% .03290/255,60% .06745/255. 큰변화라는미감점수아님,AA/dither/기존renderer noise도포함.
짧은GPUcomposer30표본지역확대 baseline4.30ms/30%4.06ms/60%7.04ms. 변동이있고동일shader strength의비용차이를확정할수없다. FPS/targetPC/soak/VRAM통과주장금지. 추가R8+mip명목.333MiB,전체VRAM실측아님.
8초정역경로 .18→.235→.18 canvasMediaRecorder VP8 4Mbps영상생성,trace/헤더검증. 연속자글거림/미감전체프레임평가는사용자검토대기;codec/encoding이성능과결에영향.
로컬4198서버종료확인후hostrestart. hostVitebuildPASS. videohandler의기존미정의shot할당2줄을제거하고구조화shot필드로분기;이번canvas영상생성으로실행확인.

## 다음 판단
공통형태유지방향의미감확인후,원형사진같은결이필요하면중간결과같은height-field조명의normal/가림에연결하는B,필요시공통density C를시험한다. residual strength만계속올려사진결해결로판정하지않는다. 그림자보류/서고KEEP/실패2/2/주intro미채택유지.

## 출처
Copyright2017 Disney Enterprises Inc / CC BY-SA3.0 / Kevin Udy 모델사진reference. 실제촬영된오늘날날씨가아닌연출재료. SourceZIP/VDB/개인첨부·개인영상업로드제외. 이번motion은renderer canvas에서직접생성한새샘플이며카메라·마이크·사용자desktop녹화아님.
