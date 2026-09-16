# lookbook-ai (EZlook)

Cloudflare Workers/Pages + Hono + D1 + KV. `src/index.tsx` is a single large server
file (JSX used only as string templating for server-rendered HTML, not a component
framework). Client is `public/static/app.js` (vanilla JS) + `public/static/style.css`.

## ⚠️ 이미지/영상 생성 프롬프트는 조용히 망가질 수 있다

`src/index.tsx`의 `app.post('/api/generation/start', ...)` 안에 있는 프롬프트
문자열들(특히 "풀 모드" — 의류+모델+배경이 모두 있을 때의 프롬프트, `hasClothing &&
hasModel && hasBg` 분기)은 실제 AI 생성 결과물의 품질을 직접 좌우한다.

이 프롬프트를 건드리면:
- **에러가 나지 않는다.** 빌드도 되고, 배포도 되고, 화면도 정상 작동한다.
- **로그에도 안 남는다.**
- **사용자가 실제로 이미지를 몇 장 생성해보고 "이상하다"고 느낄 때까지 아무도 모른다.**

실제로 2026-08-14 커밋(`30670e0`)에서 "의류 참조 이미지의 포즈 오염 방지"라는
정당한 목적의 리팩터링을 하다가, 같은 김에 포즈 지시문 자체를 "배경 인물 포즈를
자연스럽게 참고"에서 "UI 기본값(정면 정자세)을 무조건 따르라"로 바꿔버렸다.
빌드는 계속 성공했고, 몇 주 뒤 사용자가 "모델이 다 정자세로 서있다"고 리포트할
때까지 아무도 몰랐다.

### 안전장치

- `npm run build`는 `npm run verify-prompts`를 먼저 실행한다
  (`scripts/verify-critical-prompts.mjs`). 이 스크립트는 프롬프트 안의 핵심 문구
  몇 개가 그대로 남아있는지 grep으로 확인하고, 하나라도 사라지면 **빌드 자체를
  실패시킨다.**
- 이 가드는 만능이 아니다 — 지정된 문구가 "존재하는지"만 확인하지, 프롬프트의
  의미/논리 전체를 검증하지 않는다. 문구를 요리조리 바꿔도 원래 뜻만 유지하면
  가드는 통과한다. **문구가 있다고 안심하지 말고, 프롬프트를 고칠 때는 반드시
  직접 읽고 의미를 확인할 것.**

### 프롬프트를 고쳐야 할 때 지켜야 할 것

1. **다른 것을 리팩터링하다가 프롬프트 문자열이 눈에 띄어도, 요청받지 않았다면
   손대지 마라.** "정리하다 보니 문구가 어색해서 고쳤다"가 가장 위험한 패턴이다.
2. 프롬프트 문구를 의도적으로 바꿀 때는:
   - 바꾸기 전 문구와 바꾼 후 문구를 나란히 보여주고, 무엇이 왜 바뀌는지 설명할 것.
   - `scripts/verify-critical-prompts.mjs`의 `GUARDS` 배열도 함께 업데이트할 것
     (지운 문구가 가드에 걸려있었다면 가드도 고쳐야 `npm run build`가 통과한다 —
     이게 실수로 지워진 게 아니라 의도된 변경이라는 걸 스스로 증명하는 절차다).
   - 가능하면 이 저장소는 외부 AI API(Atlas Cloud)에 접근할 수 없는 샌드박스에서
     작업하는 경우가 많다 — 실제 생성 결과로 검증이 불가능하므로, 스테이징에
     배포한 뒤 사용자에게 실제 생성 테스트를 요청할 것. "빌드 성공 = 프롬프트
     정상"이 아니다.
3. 새로운 "절대 지켜야 하는" 문구를 프롬프트에 추가했다면, 그 문구도
   `scripts/verify-critical-prompts.mjs`의 `GUARDS`에 등록해서 다음 리팩터링이
   똑같은 방식으로 회귀하지 않도록 할 것.

## 사용자 에러 자동 감지/유지보수 루틴

`error_logs` D1 테이블(`migrations/0024_error_logs.sql`)에 클라이언트(브라우저
`window.onerror`/`unhandledrejection` → `POST /api/errors/report`, 인증 없음)와
서버(`/api/generation/start` 등 개별 catch 블록 + 전역 `app.onError`) 양쪽 에러가
자동 기록된다. `/admin02`의 "에러 로그" 탭(`GET/PATCH /api/admin/errors*`, 헤더
`X-Admin-Password`)에서 확인 가능하고, status는 `open → in_review(수정 PR 대기)
→ resolved` 순으로 사람이 직접 바꾸거나 유지보수 세션이 PATCH로 바꾼다.

별도의 **"EZlook 유지보수" 세션**이 30분 주기 Routine으로 깨어나 스테이징 관리자
API를 `X-Maint-Token`(전용 시크릿, `ADMIN_PASSWORD`와 분리)으로 조회해 `open` 에러를
진단하고, 수정 브랜치+PR을 만든 뒤 해당 에러를 `in_review`로 바꾼다. **절대 스스로
`main`에 배포하지 않는다** — 실제 배포는 항상 사람이 PR을 확인한 뒤 기존 승격
절차(아래 배포 워크플로)를 따른다. `MAINT_API_TOKEN`은
`wrangler secret put MAINT_API_TOKEN`으로 스테이징/운영 양쪽에 설정해야 하며(D1
마이그레이션과 마찬가지로 샌드박스 세션은 직접 실행 불가), 값이 없으면 이 엔드포인트는
`ADMIN_PASSWORD`만 허용한다.

## 배포 워크플로

- `claude/lookbook-ai-handoff-eqvygd` (핸드오프/개발) → `develop` (스테이징, Cloudflare
  Pages 자동 배포) → 확인 후 `promote-*-to-main` 브랜치 + PR + merge → `main` (운영).
- `dist/_worker.js`, `dist/static/*`는 빌드 산출물이지만 저장소에 커밋되어 있다
  (`npm run build` 후 항상 함께 커밋).
- `wrangler.jsonc`는 브랜치별로 다르다 — `develop`/handoff는 스테이징 D1/KV를,
  `main`은 운영 D1/KV를 가리킨다. **`main`으로 승격할 때 `wrangler.jsonc`는 절대
  건드리지 말 것** (`git diff origin/main -- wrangler.jsonc`가 비어있는지 항상 확인).
- 새 D1 마이그레이션은 스테이징/운영 양쪽에 수동으로 실행해야 한다
  (`npx wrangler d1 execute <db-name> --remote --file=migrations/...sql`) — 이 세션
  환경은 `wrangler`가 인증되어 있지 않아 직접 실행할 수 없으므로, 정확한 명령어를
  사용자에게 안내할 것.
- **로컬 `wrangler pages dev` 실행 시 `--d1=`/`--kv=` 플래그를 직접 주지 말 것.**
  `wrangler.jsonc`에 이미 바인딩이 선언되어 있는데 `--d1=LOOKBOOK_DB`처럼 이름만
  넘기면, 실제 `database_id`를 무시하고 완전히 새 "가짜" 로컬 D1을 만들어버려서
  기존 로컬 시드 데이터(회원 등)가 하나도 없는 빈 DB에 붙는다 — 에러 없이 조용히
  다른 파일(`.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite`)을 쓰기
  시작하므로 알아채기 어렵다. 그냥 `npx wrangler pages dev dist`(또는
  `npm run preview`)만 실행해 `wrangler.jsonc`의 바인딩을 그대로 읽게 할 것.
