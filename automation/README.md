# 업무 자동화 스크립트

## 설치

```bash
cd automation
npm install
npx playwright install chromium
```

## 설정

1. `config.template.json`을 복사해서 `config.json` 생성
2. 각 서비스의 URL, 아이디, 비밀번호 입력
3. ITSM OTP 시크릿 키 입력 (아래 참고)

### Google OTP 시크릿 키 얻는 방법

OTP를 처음 등록할 때 QR 코드 아래에 표시되는 **텍스트 키**입니다.
예시: `JBSWY3DPEHPK3PXP`

이미 등록된 상태라면:
- ITSM 관리자에게 OTP 재발급 요청 후 시크릿 키 저장
- 또는 Google Authenticator 앱 > 계정 내보내기 > 시크릿 추출 (루팅 필요)

### 선택자 확인 방법

실제 사이트에서 F12 → Elements 탭에서 input/button의 `name` 또는 `id` 확인 후
`config.json`의 `selectors` 항목 수정.

## 실행

```bash
# 개별 실행
npm run itsm       # ITSM 일일 체크만
npm run sso        # SSO 로그인만
npm run aws        # AWS 개발서버만
npm run external   # 외부망 로그인만

# 전체 실행
npm run all
```

## 세션 관리

최초 실행 시 로그인 + OTP 입력 필요.
이후 `sessions/` 폴더에 세션이 저장되어 재로그인 스킵.
세션 만료 시 자동으로 다시 로그인.

## 매일 자동 실행 (Windows 작업 스케줄러)

1. 작업 스케줄러 열기 (`taskschd.msc`)
2. 기본 작업 만들기
3. 트리거: 매일 오전 9:00
4. 작업: `node C:\work-organizer-app\automation\run-all.js`
