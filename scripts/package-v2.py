"""Package built browser app and generated data; no runtime CDN dependencies."""
from pathlib import Path
import zipfile,json,hashlib,shutil
root=Path(__file__).resolve().parents[1];built=root/'dist/v2';out=root/'dist/ecg-signal-studio-v2.2.zip'
assert (built/'replay/manifest.json').exists();manifest=json.loads((built/'replay/manifest.json').read_text());assert len(manifest['scenes'])==98
readme='''ECG Signal Studio v2.2 — 실행 패키지

1. ZIP 전체를 압축 해제합니다.
2. Node.js 24 이상이 설치된 PC에서 START_WINDOWS.cmd를 실행합니다.
3. 브라우저에서 http://127.0.0.1:4173 을 엽니다.
4. 종료는 서버 콘솔에서 Ctrl+C입니다.

최초 Node 설치와 선택 Playwright 설치에는 인터넷이 필요합니다.
앱 실행 데이터/폰트 대체/스크립트는 로컬이며 실행 중 외부 CDN을 사용하지 않습니다.
index.html을 file://로 직접 열지 마세요. 청크 fetch와 해시 검증은 로컬 서버를 사용합니다.

기본 자료: 98조건 × 600초, 기존 모델 추론. 재학습 없음.
MITDB 원 ECG와 합성 noise presets이며 NSTDB 실측 잡음이 아닙니다.
Reference는 공통 FE 처리 기준 신호입니다. 실제 장치 LIVE가 아닙니다.
시연 A/B/C는 각 조건의 10–20초 고정 구간이며 결과가 우세한 위치를 고른 것이 아닙니다.
Attract는 별도로 표시한 10초 구간 반복이고 600초 자료의 대체물이 아닙니다.

자동 PC 검수(선택): qa 폴더에서 npm install, npx playwright install chromium, npm test.
10분 실시간 검수: PowerShell에서 $env:ECG_SOAK="1"; npm test
결과: qa/test-results 및 qa/playwright-report. 이 패키지의 브라우저 검수는 아직 미실행입니다.
자세한 한계 및 상태는 IMPLEMENTATION.md와 VERIFICATION.json을 읽어주세요.
'''
qa={'name':'ecg-v2-pc-check','private':True,'type':'module','scripts':{'test':'playwright test','test:headed':'playwright test --headed'},'devDependencies':{'@playwright/test':json.loads((root/'prototype/v2/package-lock.json').read_text())['packages']['node_modules/@playwright/test']['version']}}
config="import {defineConfig} from '@playwright/test';import path from 'node:path';export default defineConfig({testDir:'./tests',timeout:45000,workers:1,reporter:[['html',{open:'never'}],['json',{outputFile:'test-results/results.json'}]],use:{baseURL:'http://127.0.0.1:4173',viewport:{width:1920,height:1080},trace:'on',video:'on',screenshot:'on'},webServer:{command:'node ../serve-v2.cjs',env:{ECG_V2_ROOT:path.resolve('../app')},port:4173,reuseExistingServer:true}});"
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=4)as z:
 for f in built.rglob('*'):
  if f.is_file() and 'long' not in f.relative_to(built).parts:z.write(f,'app/'+str(f.relative_to(built)))
 z.write(root/'scripts/serve-v2.cjs','serve-v2.cjs');z.writestr('START_WINDOWS.cmd','@echo off\r\ncd /d "%~dp0"\r\nset "ECG_V2_ROOT=%~dp0app"\r\nnode serve-v2.cjs\r\npause\r\n');z.writestr('README.txt',readme)
 z.writestr('qa/package.json',json.dumps(qa,indent=2));z.writestr('qa/playwright.config.ts',config)
 z.write(root/'prototype/v2/browser-tests/expo.spec.ts','qa/tests/expo.spec.ts')
 z.write(root/'docs/17_v2_team_handoff.md','IMPLEMENTATION.md');z.write(root/'verification/v2-long-data.json','VERIFICATION.json')
 license=root/'prototype/v2/SHADCN-LICENSE.txt'
 if license.exists():z.write(license,'licenses/shadcn-ui.txt')
 for license in (root/'prototype/v2/node_modules').rglob('*'):
  if license.is_file() and license.name.lower().startswith(('license','licence')):z.write(license,'licenses/dependencies/'+str(license.relative_to(root/'prototype/v2/node_modules')))
with zipfile.ZipFile(out)as z:assert z.testzip() is None;assert len([p for p in z.namelist()if p.endswith('.bin')])==1960
receipt={'file':out.name,'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'zipCRC':'PASS','chunks':1960,'browser':'NOT VERIFIED'}
(root/'verification/v2-package.json').write_text(json.dumps(receipt,indent=2));print(json.dumps(receipt,indent=2))
