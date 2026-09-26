# EZlook — 토스 인앱(Apps in Toss) 미니앱

기존 `lookbook-ai` Cloudflare Workers 백엔드(`../src/index.tsx`)를 그대로 API 서버로 재사용하는
앱인토스(Apps in Toss) WebView 미니앱 프론트엔드입니다. 앱인토스는 **iframe으로 기존 웹뷰를
그대로 띄우는 것을 허용하지 않아서**(보안 심사 반려 사유), `@apps-in-toss/web-framework` 기반의
별도 React + Vite 프로젝트로 화면을 새로 구성했습니다.

## 왜 별도 디렉토리인가

- 배포 방식이 기존 Cloudflare Pages와 다릅니다. 이 프로젝트는 `npm run build`로 Vite 빌드 후
  `ait build`/`ait deploy`로 **토스 파트너센터에 빌드 결과물을 업로드**해서 토스 앱이 서빙합니다.
  Cloudflare Pages 라우트(`/toss/*` 등)로 서빙하는 게 아닙니다.
- 기존 루트 `vite.config.ts`는 `@hono/vite-build/cloudflare-pages`로 Hono 서버(Worker) 전체를
  빌드하는 설정이라, 이 프로젝트(순수 클라이언트 SPA 빌드)와 같은 설정을 공유할 수 없습니다.
- 그래서 같은 저장소(모노레포) 안에서 `toss-app/`을 완전히 독립된 `package.json`/`vite.config.ts`
  프로젝트로 분리했습니다.

## 현재 상태 (2026-09-26 기준)

- ✅ 홈 화면: 기존 `/api/home/showcase`, `/api/presets/models` API를 그대로 fetch해서 보여줌.
- ✅ `appLogin()`으로 인가 코드(`authorizationCode`)를 받는 클라이언트 로직까지 구현.
- ⛔ **서버 토큰 교환(`/api/auth/toss`)은 아직 구현하지 않았습니다.** 앱인토스 서버 API는
  전부 mTLS 클라이언트 인증서가 필수인데(`developers-apps-in-toss.toss.im/api/auth.md`),
  이 인증서를 파트너센터에서 발급받았는지 아직 확인되지 않았기 때문입니다. 인증서 발급이
  확인되면 아래 "다음 단계"를 진행하세요.
- ⛔ 결제(IAP)는 손대지 않았습니다 — 사업자정보/정산정보/상품등록이 선행되어야 합니다.

## 다음 단계 (mTLS 인증서 확보 후)

참고용 공식 예제: `github.com/toss/apps-in-toss-examples`의 `toss-login/server/`
(이 세션에서 `/home/user/toss/apps-in-toss-examples`로 클론해서 실제로 확인한 코드입니다).

1. 파트너센터에서 mTLS 인증서(cert/key 쌍), `AAD_STRING`, `DECRYPTION_KEY_BASE64`(사용자
   정보 복호화용) 발급.
2. `../src/index.tsx`에 `POST /api/auth/toss` 추가:
   - body: `{ authorizationCode, referrer }`
   - `https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2/generate-token` 호출
     (mTLS 필요 — Cloudflare Workers는 Node `https` 모듈이 아니라
     [mTLS 인증서 바인딩](https://developers.cloudflare.com/workers/wrangler/configuration/#mtls-certificates)을
     써야 함. `wrangler.jsonc`에 `mtls_certificates` 바인딩 추가 후
     `c.env.<BINDING>.fetch(...)`로 호출)
   - 응답의 `accessToken`/`refreshToken`으로 `login-me` 조회 → `userKey` 확보
   - 기존 `users` 테이블에 `provider='toss'`, `provider_id=userKey`로 upsert
     (카카오/구글 로그인과 동일 패턴, `src/index.tsx`의 `/api/auth/kakao/callback` 참고)
   - `createSession()`으로 기존과 동일한 세션 토큰 발급
   - ⚠️ 기존 `TOSS_API_BASE`(TossPayments, 별개 서비스) 환경변수와 이름이 겹치지 않게
     새 env var는 `APPS_IN_TOSS_*` 접두사 사용 권장.
3. 이 파일(`toss-app/src/App.tsx`)의 `handleTossLogin`에서 서버 응답으로 받은 세션 토큰을
   저장하도록 수정 (현재는 인가 코드 수신 여부만 표시).

## 로컬 개발

```bash
npm install
npm run dev
```

스테이징 API로 테스트하려면 `.env.local`에:

```dotenv
VITE_API_BASE_URL=https://<스테이징 Pages 도메인>
```

## 빌드 / 배포

```bash
npm run build   # vite build && ait build
npm run deploy  # ait deploy — 토스 파트너센터로 업로드
```

`ait` CLI 인증(파트너센터 계정 연동)이 이 세션 환경에는 없으므로, 실제 `deploy`는 로컬/사용자
환경에서 진행해야 합니다.
