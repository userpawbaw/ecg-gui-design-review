# D-194: 멈춤 캡처에서 질환 행의 밝은 초점 폭을 픽셀로 잰다(열 평균 밝기가 어두운 바깥 중앙값의 1.6배 넘는 열). 사용: python3 spot_px.py <png>...
import sys
from PIL import Image
for f in sys.argv[1:]:
    im=Image.open(f).convert('L');W,H=im.size;px=im.load()
    y0,y1=int(H*.12),int(H*.42);left=int(W*.075);right=W-int(W*.02)   # 질환 행 띠, 축 글자 제외
    col=[sum(px[x,y] for y in range(y0,y1,2))/((y1-y0)//2) for x in range(left,right)]
    base=sorted(col)[len(col)//3];on=[c>1.6*base for c in col];n=sum(on)
    print(f'{f}: 밝은 열 {n}/{len(col)} = {100*n/len(col):.0f} %')
