#!/usr/bin/env python3
"""
EZlook 인스타그램(Meta) 광고 자동 생성 스크립트
- 사업자리드 vs 인스타 광고 A/B 테스트의 인스타 쪽 채널을 자동으로 세팅한다.
- 오퍼 A(AI 룩북 무료체험) / 오퍼 B(카톡채널 친구추가) 두 개의 광고세트를 만들고,
  각각 UTM이 다른 랜딩 링크로 연결해 GA4에서 성과를 구분 측정할 수 있게 한다.
- 기본은 --dry-run 이며, 실제로 Meta에 생성하려면 --live 를 붙여야 한다.
- 생성되는 캠페인/광고세트/광고는 모두 PAUSED 상태로 만든다 — 예산 집행은
  Ads Manager에서 사람이 직접 확인 후 켜야 한다 (실수로 바로 과금 시작 방지).

필요 환경변수:
  META_ACCESS_TOKEN   시스템 사용자 장기 액세스 토큰 (ads_management 권한)
  META_AD_ACCOUNT_ID  act_로 시작하는 광고 계정 ID
  META_PAGE_ID        연동된 Facebook 페이지 ID
  META_IG_ACTOR_ID    연동된 인스타그램 비즈니스 계정 ID

사용 예:
  export META_ACCESS_TOKEN=...
  export META_AD_ACCOUNT_ID=act_1234567890
  export META_PAGE_ID=1234567890
  export META_IG_ACTOR_ID=1234567890
  python3 create_campaign.py --image-a offer_a.jpg --image-b offer_b.jpg --daily-budget 20000 --dry-run
  python3 create_campaign.py --image-a offer_a.jpg --image-b offer_b.jpg --daily-budget 20000 --live
"""
import argparse
import json
import os
import sys
import urllib.request
import urllib.parse

try:
    import requests
except ImportError:
    print("이 스크립트는 이미지 업로드(멀티파트)에 requests 패키지가 필요합니다.\n"
          "실행 전에 설치해주세요: pip install requests", file=sys.stderr)
    sys.exit(1)

GRAPH_API_VERSION = "v21.0"
GRAPH_BASE = f"https://graph.facebook.com/{GRAPH_API_VERSION}"

LANDING_BASE = "https://www.aifashion.co.kr/"

OFFERS = {
    "a": {
        "name": "오퍼A_룩북체험",
        "utm_campaign": "ig_offer_lookbook_trial",
        "headline": "촬영 없이 3클릭, AI 룩북 무료 체험",
        "primary_text": "신용카드 없이 200크레딧 무료 지급. 옷 사진 한 장으로 전문 모델 피팅컷을 30초 만에 만들어보세요.",
        "cta": "SIGN_UP",
    },
    "b": {
        "name": "오퍼B_카톡채널친구추가",
        "utm_campaign": "ig_offer_kakao_channel",
        "headline": "패션 트렌드 정보, 카톡채널로 무료 구독",
        "primary_text": "AI 룩북 활용법과 시즌 트렌드를 정기적으로 카톡으로 받아보세요. 지금 채널 추가하면 바로 시작됩니다.",
        "cta": "LEARN_MORE",
    },
}


def landing_url(offer_key: str) -> str:
    params = {
        "utm_source": "instagram",
        "utm_medium": "paid",
        "utm_campaign": OFFERS[offer_key]["utm_campaign"],
    }
    return LANDING_BASE + "?" + urllib.parse.urlencode(params)


def graph_call(path: str, token: str, method: str = "GET", data: dict | None = None, files: dict | None = None):
    url = f"{GRAPH_BASE}/{path}"
    if method == "GET":
        qs = urllib.parse.urlencode({**(data or {}), "access_token": token})
        req = urllib.request.Request(f"{url}?{qs}")
    else:
        payload = dict(data or {})
        payload["access_token"] = token
        body = urllib.parse.urlencode(payload).encode("utf-8")
        req = urllib.request.Request(url, data=body, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"Graph API 오류 ({path}): {err_body}", file=sys.stderr)
        raise


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--image-a", required=True, help="오퍼A(룩북체험) 광고 이미지 로컬 경로")
    p.add_argument("--image-b", required=True, help="오퍼B(카톡채널) 광고 이미지 로컬 경로")
    p.add_argument("--daily-budget", type=int, default=20000, help="광고세트당 일 예산 (원, 기본 20,000원)")
    p.add_argument("--live", action="store_true", help="실제로 Meta에 생성한다 (기본은 dry-run)")
    p.add_argument("--dry-run", action="store_true", help="(기본값이라 생략 가능) 실제 생성 없이 미리보기만 출력")
    args = p.parse_args()

    dry_run = not args.live

    token = os.environ.get("META_ACCESS_TOKEN")
    ad_account_id = os.environ.get("META_AD_ACCOUNT_ID")
    page_id = os.environ.get("META_PAGE_ID")
    ig_actor_id = os.environ.get("META_IG_ACTOR_ID")

    missing = [k for k, v in {
        "META_ACCESS_TOKEN": token, "META_AD_ACCOUNT_ID": ad_account_id,
        "META_PAGE_ID": page_id, "META_IG_ACTOR_ID": ig_actor_id,
    }.items() if not v]
    if missing:
        print("다음 환경변수가 설정되지 않았습니다: " + ", ".join(missing), file=sys.stderr)
        sys.exit(1)

    print(f"{'[DRY RUN] ' if dry_run else '[LIVE] '}EZlook 인스타그램 광고 캠페인 생성 시작")
    print(f"광고계정: {ad_account_id} / 페이지: {page_id} / 인스타그램: {ig_actor_id}")
    print(f"세트당 일 예산: {args.daily_budget:,}원 (총 2세트 = {args.daily_budget*2:,}원/일)\n")

    for key in ("a", "b"):
        offer = OFFERS[key]
        url = landing_url(key)
        print(f"--- 오퍼 {key.upper()}: {offer['name']} ---")
        print(f"  랜딩 URL: {url}")
        print(f"  헤드라인: {offer['headline']}")
        print(f"  본문: {offer['primary_text']}")

    if dry_run:
        print("\ndry-run 모드라 실제로 아무것도 생성하지 않았습니다. --live로 다시 실행하면 진행됩니다.")
        return

    # 1) 캠페인 생성 (PAUSED)
    campaign = graph_call(
        f"{ad_account_id}/campaigns", token, "POST",
        {
            "name": "EZlook_Phase1_사업자리드vs인스타_2026",
            "objective": "OUTCOME_TRAFFIC",
            "status": "PAUSED",
            "special_ad_categories": json.dumps([]),
        },
    )
    campaign_id = campaign["id"]
    print(f"\n캠페인 생성됨: {campaign_id}")

    for key, image_path in (("a", args.image_a), ("b", args.image_b)):
        offer = OFFERS[key]
        url = landing_url(key)

        # 2) 이미지 업로드
        with open(image_path, "rb") as f:
            image_bytes = f.read()
        img_resp = requests.post(
            f"{GRAPH_BASE}/{ad_account_id}/adimages",
            params={"access_token": token},
            files={"filename": (os.path.basename(image_path), image_bytes)},
        ).json()
        image_hash = list(img_resp["images"].values())[0]["hash"]

        # 3) 광고세트 생성 (PAUSED)
        adset = graph_call(
            f"{ad_account_id}/adsets", token, "POST",
            {
                "name": f"EZlook_Phase1_{offer['name']}",
                "campaign_id": campaign_id,
                # KRW는 "zero-decimal" 통화라 100을 곱하지 않는다 (USD 등과 달리 센트 단위 아님).
                # 광고 계정 통화가 KRW가 아니라면 이 값을 그 통화의 최소단위 기준으로 다시 계산해야 한다.
                "daily_budget": args.daily_budget,
                "billing_event": "IMPRESSIONS",
                "optimization_goal": "LINK_CLICKS",
                "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
                "targeting": json.dumps({
                    "geo_locations": {"countries": ["KR"]},
                    "age_min": 20,
                    "age_max": 55,
                    "publisher_platforms": ["instagram"],
                    "instagram_positions": ["stream", "story", "reels"],
                    "flexible_spec": [{
                        "interests": [
                            {"name": "Fashion design"}, {"name": "Online shopping"},
                            {"name": "E-commerce"}, {"name": "Small business"},
                        ]
                    }],
                }),
                "status": "PAUSED",
            },
        )
        adset_id = adset["id"]
        print(f"  [{key.upper()}] 광고세트 생성됨: {adset_id}")

        # 4) 크리에이티브 생성
        creative = graph_call(
            f"{ad_account_id}/adcreatives", token, "POST",
            {
                "name": f"EZlook_Phase1_{offer['name']}_creative",
                "object_story_spec": json.dumps({
                    "page_id": page_id,
                    "instagram_actor_id": ig_actor_id,
                    "link_data": {
                        "image_hash": image_hash,
                        "link": url,
                        "message": offer["primary_text"],
                        "name": offer["headline"],
                        "call_to_action": {"type": offer["cta"], "value": {"link": url}},
                    },
                }),
            },
        )
        creative_id = creative["id"]

        # 5) 광고 생성 (PAUSED)
        ad = graph_call(
            f"{ad_account_id}/ads", token, "POST",
            {
                "name": f"EZlook_Phase1_{offer['name']}_ad",
                "adset_id": adset_id,
                "creative": json.dumps({"creative_id": creative_id}),
                "status": "PAUSED",
            },
        )
        print(f"  [{key.upper()}] 광고 생성됨: {ad['id']}")

    print(f"\n완료. Meta Ads Manager에서 캠페인 '{campaign_id}'을 확인하고, "
          f"내용 검토 후 PAUSED → ACTIVE로 직접 전환해주세요 (실수 과금 방지를 위해 자동으로 켜지 않습니다).")


if __name__ == "__main__":
    main()
