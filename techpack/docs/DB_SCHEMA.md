# DB SCHEMA — EZlook AI 자동 기술도식화 생성기

> PostgreSQL 기준. ARCHITECTURE.md의 시스템 구성을 참고할 것.
> 컬럼 타입은 참고용 제안이며, 실제 구현 시 마이그레이션 도구(Prisma/Alembic 등) 선택에 맞춰 조정한다.

## users

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| email | text unique | |
| name | text | |
| created_at | timestamptz | |

## flat_jobs

의류 사진 1건에 대한 생성 작업 단위.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users.id | 비로그인 테스트 허용 시 nullable |
| original_image_url | text | 업로드 원본 |
| preprocessed_image_url | text | 배경 제거·정규화 후 이미지 |
| category_predicted | text | AI 예측 카테고리 (tshirt / sweatshirt / hoodie ...) |
| category_confirmed | text | 사용자 확인/수정 카테고리 |
| status | text | pending / processing / done / failed |
| error_reason | text | 실패 시 원인 |
| created_at | timestamptz | |
| completed_at | timestamptz | |

## flat_results

한 job에 대해 view(front/back)별로 생성된 결과.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| job_id | uuid FK → flat_jobs.id | |
| view_type | text | front / back |
| structured_json | jsonb | ARCHITECTURE.md 3번의 garment structured JSON |
| svg_url | text | |
| png_url | text | |
| preview_url | text | |
| created_at | timestamptz | |

## flat_feedback

관리자 검수 / 사용자 피드백 기록 (데이터 플라이휠의 원천).

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| result_id | uuid FK → flat_results.id | |
| issue_type | text | 카테고리 오분류 / 디테일 누락 / 대칭 오류 등 |
| corrected_category | text | |
| corrected_notes | text | |
| rating | integer | |
| created_at | timestamptz | |

## templates

카테고리별 base SVG 템플릿 (ARCHITECTURE.md 8번 템플릿 엔진과 연동).

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| category | text | tshirt / sweatshirt / hoodie ... |
| version | integer | |
| svg_base | text | 기본 템플릿 SVG 원본 |
| metadata | jsonb | variant 목록(넥라인/포켓/후드/소매/밑단 등) |
| active | boolean | |

## 인덱스 제안

- `flat_jobs(user_id, created_at desc)` — 사용자별 생성 이력 조회
- `flat_jobs(status)` — 관리자 실패 케이스 목록 조회
- `flat_results(job_id)`
- `flat_feedback(result_id)`
- `templates(category, active)`

## 향후 확장 테이블 (2차 이후, MVP 범위 아님)

Tech Pack 확장 시 필요할 것으로 예상되는 테이블 (지금 만들지 말 것):
- `pom_entries` (측정 포인트: 가슴단면/총장/소매장/어깨너비 등)
- `bom_items` (원단/시보리/라벨/지퍼/단추/프린트/자수/행택)
- `construction_notes` (봉제/구성 노트, 페이지별)
- `tech_pack_documents` (POM+BOM+플랫+노트를 묶은 최종 문서, 버전 관리)
- `factory_shares` (읽기 전용 공유 링크)
- `collections` (시즌/라인별 스타일 묶음, 상태 관리)
