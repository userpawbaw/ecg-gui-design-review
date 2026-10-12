# Disney 구름 원본·공식 예제 번안 · D133

2026-10-12 · 국소 source/광학 시험. 도입부 실제web 채택과 별도.

## 권장과 범위

기존 JangaFX 팩의 작은warp/밀도증폭 반복 대신, 별도 고해상도 source의결과 공식예제 광학조건을 함께 검토한다. 원본의 최대해상도를web전체에 넣지 않고, **1/4과1/2 동일구도**에서 결 차이를 확인한다.1/2에서6/64 volume bounces를대조해샘플수·해상도와빛의재산란을분리한다.6→64만으로실제평균광선경로가64회라는뜻은아니다.

## 확보한 자료

- [Disney 공식 Clouds](https://www.disneyanimation.com/resources/clouds/), [공식 Readme](https://media.disneyanimation.com/uploads/production/data_set_asset/1/asset/Cloud_Readme.pdf), [공식 라이선스](https://media.disneyanimation.com/uploads/production/data_set_asset/6/asset/License_Cloud.pdf).
- ZIP **2,968,485,941bytes**, SHA256 `f7cf130e17b366a08ed038865277ed67dc76f87d1fa6effd21b76aa7294cdccd`. curl의완료파일길이/ZIPdirectory확인후`.part→.zip`.출처/hash/개별CRC검사는`verification/a-disney-cloud-20261012/acquisition.json`.
- full VDB는ZIP안에보유/미추출·미로드. eighth10,032,545B/quarter68,366,243B/half491,820,521B를추출. 파일크기는GPUmemory와다르다.
- README와MitsubaXML을직접읽었다. 기존Mitsuba-vdb플러그인과integrator수정이필요하다고README가설명한다. 해당renderer를설치/원형실행하지않았고 **Cycles4.5.3 번안**으로표시한다.
- CC BY-SA3.0 / Copyright2017 Disney Enterprises Inc. 원형사진Kevin Udy. 내부시안단계유지. 원본ZIP/VDB/제작사beauty는로컬자료이며이번Git에는코드/직접렌더샘플/기록만보존.

## 공식 예제 조건과 차이

XML카메라origin `(648.064,-82.473,-63.856)`, target `(6.021,100.043,-43.679)`, up `(.273,.962,-.009)`, 가로FOV54.43°,333×180/1024samples.

directional light방향 `(-.5826,-.7660,-.2717)`, irradianceRGB `(2.6,2.5,2.3)`; ambientRGB `(.03,.07,.23)`. y-up floor y=-1000/radius20000/diffuse.2. densityscale4, HGg.877, albedo1, maxDepth1,000,000. README는RRsurvivalupperlimit.95→1변경으로고알베도경로가과도하게끝나는문제를피하라고설명한다.

이번Cycles는같은원본좌표/scale1,같은camera/sun/ambientRGB번안,whitealbedo1/g.877/density4/step.35. 최대bounce6/64와최대96adaptive samples/OIDN/AgX/1024×554. spectral/radiometric동일성·RR동일성·Hyperion동일성은보장하지않는다. 원본의1,000,000depth를흉내낸다고Cyclesmax_bounces를무한에가깝게설정하지않는다.투명RGBA위에갤러리배경을합성하는표시와공식EXR/display는다르다.

## 원본 공간 해상도

`grid-metadata.json`: Houdini16.0.504.20 fog density/FLOAT metadata.

| source | voxel크기(source단위) | active voxel count | grid file_mem_bytes metadata |
|---|---:|---:|---:|
| 1/8 | 1.66667 | 3,122,022 | 17,299,644 |
| 1/4 | .83333 | 24,063,202 | 92,494,808 |
| 1/2 | .41667 | 188,358,293 | 590,228,032 |

1/4→1/2에서각축샘플간격반감/active수약7.83배. metadata메모리는CPU sparsegrid정보이며 실제GPU상주/RT메모리나웹압축budget아님. source단위를실제m로확정하지않는다.

## 시행착오 보존

첫eighthpreview는Blendervolume_import자동+90°X회전때문에XML y-upcamera/light와어긋났다.독립rotationprobe로확인후cloud.rotation_euler=(0,0,0)으로복원.기각프레임과조건은`rejected-import-axis/`보존. 작은helper의gridmetadata조회는grids.load없어서IndexError도발생했으나rotation증거는이미출력되었다. 최종metadata는nativeOpenVDBreadGridMetadata로확인. 형상방향오류를source나cloudquality문제로오해하지않는다.

## 셰이더·후처리와 검증

기존gray알베도대신XMLwhite1/높은HG로번안. sun/sky/ground조건고정. 내부volume빛전달만검토;지형cloudshadow보류.planetaryveil/빛커튼/bloom/DOF/grain/RGBsharpen추가없음. AgX/OIDN고정.1024native같은pixelcrop과전체형태확인.숫자shader조건이같다고공식renderer와시각동일성을선언하지않는다.

통과조건:1/2에서작은lobes·가는찢긴외곽이실제density로읽힘,밝은면과골유지,단단한돌/입자noise불허. source결gate후에만기존위성footprint일부군집에배치→6구도/정역motion/동일source near인계.이번완료파일은실시간완료증거아님.그림자보류/서고KEEP/실패2/2/fallback유지.

## 결과

새native5장/수정preview1/기각preview1 완료.1/2에서64bounce는6bounce보다어두운돌같은면을크게완화한다.같은source반례이므로원본해상도문제로만판정할수없다. 1/4→1/2는전체뷰에서차이가작고확대쌍에서도미세한차이이며,좁은골이조금더드러나도늘어난원본정보전체가출력에읽히지는않는다. **source확보PASS / 번안renderTUNE**.사진의섬유결및공식Hyperion휘도·빛전달재현목표를달성했다고선언하지않는다.

광학상한과sampling/denoise의수렴및표시조건을같은source에서검토하고,그다음고정빛국소atlas로갈것을권장한다.현재결과가흐리다고즉시더큰source로교체하거나fullVDB를web에넣는것은권하지않는다.원경에서는고해상도source를그대로써도화면표본화로이득이작을수있다는이번뷰의관찰을보존한다.

정지artifact조건/원본·출력SHA/크기검증. `manifest.json`실제초기원본camera값/renderer/time. [검토 페이지](../../../../../verification/a-disney-cloud-20261012/gallery.html). 실제스크롤·browserrenderer·GPUframe/VRAM/국소지리적patch/near인계/사용자채택은미검증.

### 전체뷰 이후 추가대조 범위
전체1024뷰에서1/4과1/2차이가작아보여최종라운드에FOV27°/display+1EV의동일close뷰두원본을추가했다.이쌍은서로같은camera/light/density/bounces/exposure이며공식FOV54.43°와다르다.초기기각축preview→수정전체뷰→확대쌍3라운드로종료. +1EV는빛의입사량/source결추가가아닌출력표시노출이며,확대쌍과전체뷰를비교해밝기변화를해상도효과로오인하지않는다.사진휘도매칭이나Hyperion동일재현은별도미검증.
