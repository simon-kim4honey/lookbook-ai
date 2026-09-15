# EZlook 인스타그램 광고 자동 생성

`create_campaign.py` — Meta Marketing API로 캠페인/광고세트/크리에이티브/광고를 자동 생성한다.
- 오퍼 A(AI 룩북 무료체험) / 오퍼 B(카톡채널 친구추가) 두 세트를 만들고, 각각 다른 UTM으로 랜딩시켜 GA4에서 구분 측정한다.
- 안전을 위해 기본은 dry-run(미리보기만)이며, 생성되는 모든 항목은 `PAUSED` 상태다 — 실제 노출/과금은 Ads Manager에서 사람이 직접 켜야 시작된다.

## 준비물

Meta Business Suite에서:
1. Facebook 페이지 (없으면 생성)
2. 인스타그램 비즈니스 계정 → 위 페이지와 연동
3. 광고 계정(Ad Account) 생성 + 결제수단 등록
4. [developers.facebook.com](https://developers.facebook.com)에서 앱 생성 → Marketing API 추가
5. 비즈니스 설정 → 시스템 사용자 생성 → `ads_management`, `ads_read`, `pages_read_engagement` 권한으로 장기 액세스 토큰 발급

## 실행

```bash
pip install requests

export META_ACCESS_TOKEN=...
export META_AD_ACCOUNT_ID=act_...
export META_PAGE_ID=...
export META_IG_ACTOR_ID=...

# 미리보기만 (아무것도 생성 안 됨)
python3 create_campaign.py --image-a offer_a.jpg --image-b offer_b.jpg --daily-budget 20000

# 실제 생성 (PAUSED 상태로)
python3 create_campaign.py --image-a offer_a.jpg --image-b offer_b.jpg --daily-budget 20000 --live
```

`--image-a`/`--image-b`는 각 오퍼용 광고 이미지 로컬 파일 경로. `--daily-budget`은 광고세트 하나당 하루 예산(원) — 두 세트를 만들기 때문에 총 집행액은 2배.

## 실행 후

Meta Ads Manager에서 생성된 캠페인을 검토하고(타겟팅, 카피, 이미지, 예산), 문제없으면 캠페인/광고세트를 `PAUSED → ACTIVE`로 전환해야 실제로 노출이 시작된다.
