# 🤝 Claude 인계 문서 — AI Fashion Lookbook Studio

> **이 문서를 새 Claude 세션에 그대로 붙여넣으세요.**  
> 백업 파일: https://www.genspark.ai/api/files/s/s8tEztiJ (tar.gz, ~9.8MB)

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **서비스명** | AI Fashion Lookbook Studio |
| **배포 URL** | `https://5b4dd5bb-5472-423d-9846-fc19e940868b.vip.gensparksite.com` |
| **플랫폼** | Cloudflare Workers for Platform (Genspark Hosted) |
| **프레임워크** | Hono (TypeScript) + Vite + Cloudflare D1 |
| **로컬 경로** | `/home/user/webapp` |
| **Git 브랜치** | `main`, 최신 커밋 `0b77533` |

---

## 2. 프로젝트 복원 방법 (새 Claude 샌드박스에서)

```bash
# 1. 백업 파일 다운로드 & 압축 해제
cd /home/user
curl -L "https://www.genspark.ai/api/files/s/s8tEztiJ" -o webapp_backup.tar.gz
tar -xzf webapp_backup.tar.gz
# → /home/user/webapp 폴더 생성됨

# 2. 의존성 설치
cd /home/user/webapp
npm install

# 3. 빌드 확인
npm run build
# 성공 시: dist/_worker.js ~229KB

# 4. 로컬 개발 서버 (PM2)
pm2 start ecosystem.config.cjs
# 또는: npx wrangler pages dev dist --ip 0.0.0.0 --port 3000
```

---

## 3. 파일 구조

```
/home/user/webapp/
├── src/index.tsx          # ★ 메인 백엔드 (5273줄) — Hono 라우터 전체
├── public/static/
│   ├── app.js             # ★ 메인 프론트엔드 (2642줄) — 모든 UI 로직
│   └── style.css          # 전역 스타일
├── migrations/
│   ├── 0001_initial.sql
│   ├── 0002_users.sql
│   ├── 0003_credit_logs.sql
│   ├── 0004_generation_logs.sql
│   ├── 0005_generation_logs_v2.sql
│   ├── 0006_payments.sql
│   ├── 0007_users_agree_marketing.sql
│   └── 0008_model_labels.sql   ← 최신 마이그레이션 (배포 완료)
├── wrangler.jsonc          # Cloudflare 설정 (name: lookbook-ai)
├── vite.config.ts
├── package.json
└── ecosystem.config.cjs    # PM2 설정
```

---

## 4. 기술 스택 & 아키텍처

### 백엔드 (`src/index.tsx`)
- **Hono** 프레임워크, Cloudflare Workers 런타임
- **D1 SQLite** (`LOOKBOOK_DB` binding)
- **외부 API**: Atlas Cloud AI (`ATLAS_API_KEY`), aifashion.co.kr
- **OAuth**: 카카오 + 구글 소셜 로그인
- **결제**: 나이스페이먼츠 (`NICEPAY_CLIENT_ID` / `NICEPAY_SECRET_KEY` / `NICEPAY_API_BASE`)

### 프론트엔드 (`public/static/app.js`)
- Vanilla JS + 인라인 HTML (SPA 구조)
- **i18n**: `I18N` 객체 + `t()` 함수 + `STATIC_I18N` + `applyStaticI18n()`
- CDN: TailwindCSS, FontAwesome, axios

### DB 바인딩
```
LOOKBOOK_DB  → Cloudflare D1 (lookbook-ai-production)
```

### 환경 변수 (Cloudflare Secrets)
```
KAKAO_CLIENT_ID / KAKAO_CLIENT_SECRET
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
ADMIN_PASSWORD
NICEPAY_CLIENT_ID
NICEPAY_SECRET_KEY
NICEPAY_API_BASE   (샌드박스: https://sandbox-api.nicepay.co.kr / 운영: https://api.nicepay.co.kr)
ATLAS_API_KEY
OPENAI_API_KEY
```

---

## 5. 주요 API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/locale` | 국가별 언어 감지 (CF-IPCountry 헤더) |
| GET | `/api/models` | AI 모델 목록 |
| GET | `/api/backgrounds` | 배경 목록 |
| POST | `/api/generate` | AI 이미지 생성 |
| GET | `/api/generate/status/:jobId` | 생성 상태 폴링 |
| POST | `/api/auth/login` | 이메일 로그인 |
| POST | `/api/auth/signup` | 회원가입 |
| GET | `/api/auth/kakao/callback` | 카카오 OAuth |
| GET | `/api/auth/google/callback` | 구글 OAuth |
| GET | `/api/credits` | 크레딧 조회 |
| POST | `/api/credits/deduct` | 크레딧 차감 (다운로드) |
| POST | `/api/payments/prepare` | 결제 준비 (orderId 발급) |
| POST | `/payment/return` | 나이스페이먼츠 returnUrl (서버 승인) |
| GET | `/api/payments/status` | 결제 승인 결과 조회 |
| GET | `/api/history` | 생성 내역 |
| GET | `/api/admin/*` | 어드민 (X-Admin-Password 헤더 필요) |

---

## 6. i18n 아키텍처 (중요)

### 초기화 흐름
```
DOMContentLoaded
  → initLocale()          # /api/locale 호출 → _locale 전역 설정
    → applyStaticI18n()   # data-i18n 속성 요소에 번역 적용
      → initPage()        # UI 초기화
```

### 번역 사용법
```js
// 동적 텍스트
t('key')          // I18N[_locale]['key']
t('key', arg1)    // 함수형 번역값 호출

// 정적 HTML 요소
<span data-i18n="keyName">기본값</span>
// → applyStaticI18n()이 STATIC_I18N[_locale]['keyName']으로 교체
```

### data-i18n 적용된 요소들
- `step1/2/3-label`, `step1/2/3-title`
- `btn-prev`, `btn-next`, `btn-gen`
- `charge-title`, `charge-current`
- `pkg-11`, `pkg-25`, `pkg-44`, `pkg-bonus15`, `pkg-bonus33`
- `nav-login`, `nav-signup`, `nav-signup2`, `nav-logout`, `nav-charge`, `nav-history`
- `signupBtn`, `gen-loading`, `bg-loading`, `gen-status-init`

---

## 7. 최근 작업 히스토리 (완료된 것들)

| 커밋 | 내용 | 상태 |
|------|------|------|
| `0b77533` | `/api/locale` CF-IPCountry 헤더 방식으로 교체 | ✅ 배포 승인 대기 중 (`2a852408`) |
| `e2a8b0e` | ko 딕셔너리 영문 혼입 수정 + data-i18n 전수 적용 | ✅ 배포됨 |
| `82604d2` | 국가별 자동 언어 변환 (한국/일본/기타) | ✅ 배포됨 |
| `f2710e4` | 선택없음(랜덤) 카드 이모지 아이콘 삭제 | ✅ 배포됨 |
| `0ea6d1f` | 모델/배경 분류 필터 버튼 전체 삭제 | ✅ 배포됨 |
| `7a4b3c0` | 결제UI + 회원가입 약관 + 모델 AI 자동라벨링 + 3단 필터 | ✅ 배포됨 |

---

## 8. 현재 미완료 작업

### ⚠️ 배포 승인 대기
- **pending_action_id**: `2a852408-fa97-4550-a955-a586fa256fce`
- **내용**: `/api/locale` CF-IPCountry 헤더 수정본 배포
- **승인 방법**: Genspark 프로젝트 배포 탭에서 승인 or `gsk hosted action_wait --id 2a852408-fa97-4550-a955-a586fa256fce`

### 검증 필요
- 배포 승인 후 한국 IP에서 `https://5b4dd5bb-5472-423d-9846-fc19e940868b.vip.gensparksite.com/api/locale` 접속 시 `{"locale":"ko","country":"KR"}` 반환 확인

---

## 9. 배포 방법 (Genspark Hosted)

```bash
# 빌드
cd /home/user/webapp && npm run build

# 배포 (Genspark Hosted)
gsk --project-id 5b4dd5bb-5472-423d-9846-fc19e940868b hosted deploy

# 배포 승인 대기
gsk hosted action_wait --id <pending_action_id>
```

> **주의**: `wrangler login` 불필요. `gsk hosted deploy`로만 배포.

---

## 10. 알려진 이슈 & 주의사항

1. **Workers for Platform 환경**: `c.req.raw.cf` 객체가 dispatch 환경에서 전달 안 됨 → 반드시 `c.req.header('CF-IPCountry')` 사용
2. **Static 파일 경로**: `public/static/` → `/static/*` URL 매핑
3. **D1 마이그레이션**: 새 테이블 추가 시 `migrations/` 폴더에 SQL 파일 추가 후 `gsk hosted rebuild_db` 또는 직접 DDL 실행
4. **어드민 인증**: `X-Admin-Password` 헤더에 `ADMIN_PASSWORD` 환경변수 값 전달
5. **크레딧 단가**: 이미지 다운로드 1장 = 90크레딧

---

## 11. 로컬 개발 시 유용한 명령어

```bash
# 빌드
npm run build

# 로컬 서버 (D1 없이)
npx wrangler pages dev dist --ip 0.0.0.0 --port 3000

# 로컬 서버 (D1 포함)
npx wrangler pages dev dist --d1=LOOKBOOK_DB --local --ip 0.0.0.0 --port 3000

# PM2로 실행
pm2 start ecosystem.config.cjs
pm2 logs webapp --nostream

# 포트 정리
fuser -k 3000/tcp 2>/dev/null || true
```
