#!/bin/bash
# BYOK (studiob.aifashion.co.kr) 배포 스크립트
# - KV 바인딩은 유지 (kv_namespaces 블록 보존)
# - D1 바인딩만 제거 (Cloudflare Pages는 placeholder UUID 거부)

set -e
cd /home/user/webapp

echo "=== BYOK 배포 시작 ==="

# 1. 원본 백업
cp wrangler.jsonc wrangler.jsonc.bak

# 2. D1 블록만 제거한 배포용 wrangler.jsonc 생성 (KV는 유지)
cat > wrangler.jsonc << 'EOF'
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "lookbook-ai",
  "compatibility_date": "2026-07-10",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": [
    "nodejs_compat"
  ],
  "kv_namespaces": [
    {
      "binding": "LOOKBOOK_KV",
      "id": "2aab8e4e250840e0b3327d4a8e776ed9",
      "preview_id": "6a8c336e82d346039bad45e071eaad66"
    }
  ]
}
EOF

# 3. 빌드
echo "빌드 중..."
npm run build

# 4. 배포
echo "배포 중..."
npx wrangler pages deploy dist --project-name lookbook-ai --commit-dirty=true

# 5. 원본 복원
cp wrangler.jsonc.bak wrangler.jsonc
rm wrangler.jsonc.bak

echo "=== BYOK 배포 완료 ==="
