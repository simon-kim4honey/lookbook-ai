# GA4 설치 & 전환 추적 — 설정 가이드

마케팅 0단계(측정 기반)로 GA4 연동 코드를 심어뒀습니다. **아래 설정만 하면 바로 동작**합니다.

## 1. GA4 속성 만들기 (Google 계정에서, 코드 작업 아님)

1. https://analytics.google.com 접속 → 관리(Admin) → "속성 만들기"
2. 속성 이름: `AI Fashion Lookbook Studio` 등 원하는 이름
3. 웹 데이터 스트림 추가 → URL: `https://studiob.aifashion.co.kr` (실제 운영 도메인)
4. 생성되는 **측정 ID**(`G-XXXXXXXXXX` 형식)를 복사

## 2. 측정 ID를 프로젝트에 등록

GA4 측정 ID는 프론트엔드에 노출되는 공개 값이라 시크릿이 아닙니다. `wrangler.jsonc`의 `vars`에 추가하세요.

```jsonc
// wrangler.jsonc
{
  // ...기존 설정...
  "vars": {
    "GA4_MEASUREMENT_ID": "G-XXXXXXXXXX"
  }
}
```

로컬 개발에서만 다른 값을 쓰고 싶다면 `.dev.vars`에 `GA4_MEASUREMENT_ID=G-XXXXXXXXXX`를 추가해도 됩니다(git에 커밋되지 않음).

설정하지 않으면 GA 스니펫 자체가 페이지에 삽입되지 않아 아무 영향이 없습니다 — 안전하게 나중에 추가해도 됩니다.

## 3. 배포

```bash
npm run build && npm run deploy
```

## 4. 지금 심어져 있는 이벤트

| 이벤트 | 발생 시점 | 위치 |
|---|---|---|
| `page_view` | 모든 페이지 로드 시 (GA 기본) | 전체 |
| `sign_up` | 이메일 가입 완료 / 카카오·구글 최초 로그인(신규 계정 생성 시에만) | `method` 파라미터로 `email`/`kakao`/`google` 구분 |
| `generate_lookbook` | AI 이미지 생성 완료 시 | `image_count`, `is_fallback` 파라미터 포함 |
| `purchase` | 크레딧 결제 확인 성공 시 | `transaction_id`, `value`(원화), `items` 포함 |

`sign_up` 이벤트에는 가입 시점에 저장돼 있던 **UTM 파라미터**(`utm_source`, `utm_medium`, `utm_campaign` 등)가 함께 전송됩니다 — 랜딩 시 URL에 있던 UTM을 30일간 기억했다가(첫 접속 기준, first-touch) 가입 시 붙여 보내는 방식입니다.

## 5. 채널별 UTM 규칙 (마케팅 링크 만들 때 이 규칙으로)

| 채널 | utm_source | utm_medium | 예시 |
|---|---|---|---|
| 브랜드 콜드 이메일 | `brand_outreach` | `email` | `?utm_source=brand_outreach&utm_medium=email&utm_campaign=kr_2026q1` |
| 네이버 검색광고 | `naver` | `cpc` | `?utm_source=naver&utm_medium=cpc&utm_campaign=lookbook_kw` |
| 메타(인스타/페북) 광고 | `meta` | `cpc` | `?utm_source=meta&utm_medium=cpc&utm_campaign=lookbook_visual` |
| 셀러 커뮤니티 게시글 | `community` | `referral` | `?utm_source=aiboss&utm_medium=referral&utm_campaign=intro_post` |
| 인스타그램 오가닉 | `instagram` | `social` | `?utm_source=instagram&utm_medium=social&utm_campaign=before_after` |

## 6. GA4에서 확인하는 방법

- 실시간 리포트(Realtime)에서 배포 직후 본인 접속으로 `page_view` 찍히는지 먼저 확인
- 관리 → 이벤트에서 `sign_up`, `generate_lookbook`, `purchase`를 **전환(conversion)**으로 표시해두면 캠페인별 전환수/전환율을 바로 비교 가능
- 탐색(Explore) → 유입경로 탐색으로 `page_view → sign_up → generate_lookbook → purchase` 퍼널 확인
