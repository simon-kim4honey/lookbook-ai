# API SPEC — EZlook AI 자동 기술도식화 생성기

> DB_SCHEMA.md의 테이블을 기준으로 한다. MVP 범위(PRD.md 4번)에 해당하는 엔드포인트만 정의한다.

## POST /api/flat-jobs

업로드 후 생성 작업 시작.

**Request**: multipart/form-data
- `image`: file (JPG/PNG/WEBP, 최대 10MB)
- `category_hint`: string (optional — 사용자가 미리 카테고리를 지정한 경우)

**Response**: `201 Created`
```json
{
  "job_id": "uuid",
  "status": "pending"
}
```

**검증 (PRD.md 6번 입력 조건)**: 파일 형식, 크기, 최소 해상도를 여기서 먼저 검사하고, 미달 시 `422`로 즉시 반려한다 (품질 검사 실패 사유 포함).

---

## GET /api/flat-jobs/:id

작업 상태 조회 (폴링용).

**Response**: `200 OK`
```json
{
  "job_id": "uuid",
  "status": "pending | processing | done | failed",
  "category_predicted": "hoodie",
  "category_confirmed": null,
  "error_reason": null,
  "results": [
    { "result_id": "uuid", "view_type": "front" }
  ]
}
```

---

## POST /api/flat-jobs/:id/regenerate

디테일 옵션 수정 후 재생성 (PRD.md 8번 편집 기능 기반).

**Request**:
```json
{
  "view_type": "front",
  "overrides": {
    "pocket": "none",
    "hood": true,
    "sleeve_length": "short"
  }
}
```

**Response**: `202 Accepted` — 새 `flat_results` row가 비동기로 생성됨. 클라이언트는 `GET /api/flat-jobs/:id`로 폴링.

---

## GET /api/flat-results/:id

특정 결과 조회 (structured_json 포함).

**Response**: `200 OK`
```json
{
  "result_id": "uuid",
  "job_id": "uuid",
  "view_type": "front",
  "structured_json": { "category": "hoodie", "...": "..." },
  "svg_url": "https://.../result.svg",
  "png_url": "https://.../result.png",
  "preview_url": "https://.../preview.jpg"
}
```

---

## GET /api/flat-results/:id/download/svg

SVG 파일 다운로드 (리다이렉트 또는 스트리밍).

## GET /api/flat-results/:id/download/png

PNG 파일 다운로드.

---

## POST /api/flat-results/:id/feedback

사용자 피드백 저장 (`flat_feedback` 테이블).

**Request**:
```json
{
  "issue_type": "detail_missing",
  "corrected_notes": "캥거루 포켓이 생성 결과에서 빠짐",
  "rating": 3
}
```

**Response**: `201 Created`

---

## 관리자 전용 (MVP 범위, 인증 필요)

### GET /api/admin/flat-jobs?status=failed
실패 작업 목록 (원본/결과 비교용 URL 포함).

### GET /api/admin/flat-jobs/stats
카테고리별 성공률, 평균 처리 시간, SVG export 성공률 대시보드용 집계.

### POST /api/admin/flat-results/:id/tag
카테고리 오분류 / 디테일 누락 태깅 → 재학습용 샘플 큐에 저장.

---

## 인증

- 사용자 업로드(`POST /api/flat-jobs`)는 PRD.md 4번에 따라 **비로그인 테스트를 허용**한다 (MVP 한정, 추후 크레딧 연동 시 로그인 필수로 전환 예정).
- 관리자 엔드포인트(`/api/admin/*`)는 별도 인증(세션 또는 API 키) 필수.

## 에러 응답 형식 (공통)

```json
{
  "error": {
    "code": "INVALID_IMAGE_QUALITY",
    "message": "이미지 해상도가 너무 낮습니다 (최소 1200px 권장)."
  }
}
```
