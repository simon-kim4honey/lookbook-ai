# ARCHITECTURE — EZlook AI 자동 기술도식화 생성기

> PRD.md를 먼저 읽을 것. 이 문서는 기획 문서의 "기술적으로는 어떻게 만들면 되나" + "권장 기술 아키텍처" + "AI 파이프라인 상세" 섹션을 정리한 것이다.

## ⚠️ 기존 lookbook-ai 저장소와의 관계 (중요)

**이 기능은 기존 EZlook 서비스(Cloudflare Workers + Hono + D1 + KV, `src/index.tsx` 단일 파일 구조)와 완전히 다른 기술 스택을 전제로 기획되었다.** Cloudflare Workers는 Python(FastAPI)이나 상시 구동 PostgreSQL/Redis, Docker 컨테이너를 실행할 수 없으므로, 아래 아키텍처는 **별도의 호스팅 환경**(예: Railway, Render, Fly.io, AWS 등)에 배포되는 것을 전제로 한다.

현재 이 문서·스캐폴드는 `lookbook-ai` 저장소 안의 `techpack/` 폴더에 임시로 두었으며, 기존 Cloudflare Pages 빌드/배포 파이프라인(`npm run build`, `dist/_worker.js`, `develop`/`main` 브랜치 프로모션)과는 **완전히 분리되어 있다.** 실제 서비스로 배포하려면:
1. 별도 저장소로 분리할지, 이 저장소 안에 계속 둘지
2. 어느 클라우드/호스팅에 배포할지 (Postgres·Redis·S3 필요)

를 먼저 결정해야 한다 — 이건 코드로 해결할 수 없는 운영/비용 결정이라 사용자 확인이 필요하다.

## 1. 시스템 구성

### Web App
사용자 업로드, 미리보기, 다운로드, 히스토리 UI. Next.js + TypeScript + Tailwind CSS + React Query.

### API Server
인증, 파일 관리, 작업 생성, 결과 조회. FastAPI 또는 NestJS. API 서버와 AI worker는 프로세스를 분리한다.

### Worker
실제 AI 추론(비전 분석 → 카테고리 분류 → 구조 분석 → 템플릿 렌더링 → 벡터 후처리)을 수행하는 비동기 작업자.

### Admin Console
실패 케이스 검토, 라벨링, 품질 분석.

## 2. 계층별 설계

### 입력 계층
- 상품 사진
- 간단 텍스트 브리프
- 카테고리 선택
- 레퍼런스 이미지 선택

### AI 추론 계층
- **Vision 모델**: 의류의 부위, 패널, 넥라인, 소매, 포켓, 지퍼 등 구조 파악
- **플랫 생성 모델**: 사진을 선화/벡터형 도식으로 변환
- **LLM 구조화 엔진**: BOM, POM, construction notes 초안 생성 (2차 이후)
- **QC 에이전트**: 원본 브리프와 현재 문서 비교 (2차 이후)

### 문서 계층
- JSON 기반 tech pack schema (garment structured JSON — 아래 3번 참고)
- 페이지별 블록 구조
- 버전 관리
- 승인 상태 관리

### 출력 계층
- PNG
- SVG
- 공유 링크 (2차 이후)
- 향후 PDF / Illustrator export / Excel (2차 이후)

핵심 원칙: **이미지 한 장에서 바로 PNG/SVG를 찍는 방식이 아니라, 중간에 반드시 구조화 JSON을 둔다.** 그래야 편집·QC·버전관리·export가 전부 쉬워진다.

## 3. Garment Structured JSON (핵심 중간 산출물)

```json
{
  "category": "hoodie",
  "view": "front",
  "neckline": "hood",
  "sleeve": "long",
  "pocket": "kangaroo",
  "zipper": false,
  "cuff_rib": true,
  "hem_rib": true,
  "seams": ["raglan_like", "side_seam"],
  "fit": "regular"
}
```

이 JSON이 있어야 이후 POM/BOM/작업지시서/QC로 확장 가능하다. 최종 출력은 가능하면 **템플릿 기반 벡터 재구성 결과**가 되게 한다 — 생성형 AI는 구조 추론 보조, 애매한 디테일 해석, 초기 선화 후보 생성, 실패 케이스 재생성 후보 생성에 **제한적으로만** 사용한다.

## 4. AI 파이프라인 상세 (4단계)

### Step 1. Garment detection
사진에서 의류만 정확히 분리 (배경 제거, 윤곽 추출, 소매/몸판/카라/주머니 등 주요 부위 검출)

### Step 2. Structure understanding
카테고리 분류(티셔츠/후디/셔츠/팬츠/원피스) + 카테고리별 주요 포인트 추출
- 후디: 후드, 캥거루 포켓, 시보리가 중요
- 셔츠: 칼라, 플래킷, 커프스가 중요

### Step 3. Flat sketch generation
사진을 그대로 선화로 바꾸는 게 아니라, **카테고리별 표준 템플릿 위에 구조를 재구성**한다. 윤곽선·절개선·봉제선·지퍼/포켓/단추 위치·소매/밑단 비례를 **규칙 기반 템플릿 + AI 추출 결과**로 재조립한다.

### Step 4. Vector cleanup/export
- path simplify
- symmetry adjust
- stroke normalization
- anchor cleanup
- SVG export → PNG 렌더링

## 5. 구현 방식 비교

### 방식 A: 비전 분석 + 템플릿 재구성 (권장 — MVP는 이 방식)
흐름: 사진 업로드 → 비전 모델이 카테고리/부위/디테일 분석 → 해당 카테고리 기본 플랫 템플릿 선택 → 포켓/카라/후드/지퍼/절개 등만 템플릿에 반영 → SVG 출력

장점: 결과 안정적, 생산용 도식 느낌 유지, 카테고리별 정확도 개선 쉬움, 수정 포인트 명확

### 방식 B: 생성형 이미지 모델 중심
장점: 빠른 프로토타입, 다양한 스타일. 단점: 좌우 대칭 깨짐, 디테일 위치 흔들림, 반복 일관성 부족, SVG 품질 낮음

**결론: MVP는 방식 A. 이후 일부 디테일 보완에 생성형 접근을 섞는 하이브리드로 확장.**

## 6. 권장 기술 스택

- **프론트엔드**: Next.js, TypeScript, Tailwind CSS, React Query, SVG viewer/editor component
- **백엔드**: FastAPI 또는 NestJS, API 서버와 AI worker 분리, 비동기 job queue
- **데이터베이스**: PostgreSQL
- **파일 저장소**: S3 호환 스토리지 또는 Supabase Storage
- **비동기 처리**: Redis + Celery / RQ / BullMQ 중 하나
- **AI 서비스 계층**: image preprocessing / vision parsing / template rendering / vector cleanup — 각각 별도 서비스로 분리

## 7. 모노레포 폴더 구조

```
/apps
  /web
  /api
  /worker
/packages
  /ui
  /shared-types
  /svg-renderer
  /garment-schema
  /template-engine
/services
  /vision-parser
  /vector-cleaner
  /preprocess
/docs
  PRD.md
  ARCHITECTURE.md
  DB_SCHEMA.md
  API_SPEC.md
```

## 8. 템플릿 엔진 (핵심 컴포넌트)

핵심은 "그림을 생성"하는 게 아니라 "구조를 재구성"하는 것이다. 카테고리별로 아래를 조합하는 렌더링 엔진이 필요하다:
- 기본 바디 템플릿
- 넥라인 variants
- 포켓 variants
- 후드 variants
- 소매 variants
- 밑단/시보리 variants

## 9. AI 모델 전략 로드맵

- **초반**: 범용 비전 모델 + 규칙 기반 후처리 (카테고리 분류, 주요 부위 탐지, 선화 변환, 템플릿 정렬)
- **중기**: 카테고리별 전용 파이프라인 (티셔츠/후디, 셔츠/블라우스, 팬츠/데님, 아우터, 원피스로 분리해야 정확도 상승)
- **장기**: 브랜드 데이터 기반 파인튜닝 — 실제 생성/수정 로그가 쌓이면 "어떤 부분을 AI가 항상 틀리는지"가 보이고, 그때부터 모델이 아니라 **데이터 flywheel**이 경쟁력이 된다.

## 10. 필요 연동

### 필수
1. 파일 업로드 스토리지
2. DB 저장
3. 비동기 잡큐
4. SVG/PNG export 모듈
5. 관리자 로그 시스템

### 권장
1. 에러 모니터링
2. 분석 대시보드
3. 사용자 행동 추적
4. 피드백 수집 폼

### 향후
1. EZlook 기존 상품 이미지 DB 연동
2. 작업지시서 생성 모듈
3. POM/BOM 편집기
4. PDF export
5. 공장 공유 링크
6. 카카오 알림 연동
7. Illustrator 연동
