#!/usr/bin/env node
// ────────────────────────────────────────────────────
// 생성 프롬프트 회귀 방지 가드
//
// src/index.tsx의 이미지/영상 생성 프롬프트는 실제 AI 결과물 품질에 직접
// 영향을 준다. 다른 로직을 리팩터링/정리하다가 실수로 이 문구들이 지워지거나
// 바뀌면, 화면상 에러 없이 조용히 생성 품질만 나빠진다 (예: 2026-08-14
// 커밋에서 의류 이미지 포즈 오염을 막으려다 배경 인물 포즈 참조 로직까지
// 함께 깨진 사례 — 화면/로그로는 전혀 드러나지 않았고 사용자 리포트로만 발견됨).
//
// 이 스크립트는 `npm run build`에 포함되어 있어, 아래 필수 문구 중 하나라도
// src/index.tsx에서 사라지면 빌드 자체가 실패한다. 프롬프트 문구를 의도적으로
// 바꾸는 경우에는 아래 GUARDS 배열도 함께 업데이트할 것.
// ────────────────────────────────────────────────────

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const srcPath = join(__dirname, '..', 'src', 'index.tsx')
const src = readFileSync(srcPath, 'utf8')

const GUARDS = [
  {
    name: '풀 모드(의류+모델+배경) 포즈 — 배경 인물 포즈 최우선 참조',
    must: 'PRIMARY pose reference',
    why: '배경에 인물이 있으면 그 포즈를 따라야 함. 이 문구가 없으면 모델이 UI 기본값(정면 정자세)으로 고정되는 회귀가 재발한다.',
  },
  {
    name: '풀 모드 포즈 — 의류 참조 이미지의 포즈 오염 방지',
    must: 'The pose must NEVER be copied from a clothing reference image',
    why: '의류 사진 속 인물의 포즈가 결과물에 섞여 들어가는 것을 막는 문구.',
  },
  {
    name: '의류 역할 설명 — 의류 이미지는 텍스처 소스 전용',
    must: 'Clothing images are a texture/design source ONLY, never a pose or scene reference.',
    why: '의류 이미지의 배경/인물/포즈가 결과물에 영향을 주지 않도록 하는 문구.',
  },
  {
    name: '풀 모드 — 신원(얼굴) 유지 규칙',
    must: "KEEP UNCHANGED: bone structure, eye shape/spacing, iris color, nose shape, lip shape, jawline, cheekbones, face width, and skin undertone",
    why: '모델 얼굴 동일성을 보장하는 핵심 문구. 없으면 생성마다 다른 사람 얼굴이 나올 수 있음.',
  },
  {
    name: '영상 생성 — 슬로우모션 배제',
    must: 'absolutely no slow motion, no slow-mo effect, no frame-rate ramping',
    why: '영상 생성 시 슬로우모션 효과가 들어가지 않도록 막는 문구.',
  },
  {
    name: '고스트컷 — 두 이미지는 서로 다른 무관한 상품이라는 명시',
    must: 'TWO COMPLETELY DIFFERENT GARMENTS from two different products',
    why: '실제 배포 후 확인된 회귀: AI가 이 문구가 약할 때 관리자 샘플(Image 2)의 실제 옷을 그대로 복사해버리는 현상이 발생함(2026-08-23). 두 이미지가 서로 무관한 별개 상품임을 강하게 못박는 문구.',
  },
  {
    name: '고스트컷 — 샘플 이미지는 렌더링 기법/구도 참조 전용, 형태(길이·컷·실루엣)는 절대 참조 안 함',
    must: 'Image 2 = an UNRELATED product photo used SOLELY for the RENDERING TECHNIQUE and camera framing — NEVER for shape.',
    why: '2026-08-23 실제 발견된 회귀: 이전 문구("empty silhouette/shape template")가 샘플의 전체적인 길이/실루엣까지 따라하라는 뜻으로 읽혀, 숏패딩을 업로드했는데 롱패딩으로 바뀌어 나온 사고가 있었음. 샘플은 오직 "고스트 마네킹 렌더링 기법"과 "카메라 구도"만 참고하고, 의류의 형태(길이/컷/실루엣)는 무조건 사용자 원본을 따라야 함.',
  },
  {
    name: '고스트컷 — 상품 이미지 디테일 정확 재현',
    must: 'DO NOT change, redesign, or substitute ANY detail of the garment from Image 1',
    why: '사용자가 업로드한 실제 상품의 색상/패턴/디테일이 왜곡되지 않도록 하는 문구.',
  },
  {
    name: '고스트컷 — 배경 화이트 고정 + 그림자 제거',
    must: 'Background MUST be pure solid white (#FFFFFF), completely flat and shadowless',
    why: '샘플 이미지의 배경/그림자를 그대로 따라가지 않고, 항상 순백색·무그림자 배경으로 강제하기 위한 문구.',
  },
  {
    name: '고스트컷 — 샘플 의류 복사 시 치명적 실패로 명시(HARD_CONSTRAINTS)',
    must: 'if the output resembles Image 2\'s garment instead of Image 1\'s, this is a CRITICAL FAILURE',
    why: '핵심 제약 목록에도 동일 규칙을 재차 명시 — 관리자 샘플 의류가 결과물에 그대로 나오는 회귀를 막기 위한 이중 안전장치.',
  },
  {
    name: '고스트컷 — 의류 길이/실루엣을 샘플에 맞춰 바꾸지 말 것(HARD_CONSTRAINTS)',
    must: "Image 1's garment LENGTH and SILHOUETTE (e.g., a cropped/short jacket must stay cropped/short, a long coat must stay long) must be preserved EXACTLY",
    why: '2026-08-23 회귀(숏패딩→롱패딩) 재발 방지용 핵심 제약. 길이/실루엣은 반드시 사용자 원본(Image 1) 그대로 유지되어야 하고, 샘플(Image 2)의 형태를 따라가면 안 됨.',
  },
  {
    name: '고스트컷 — 소재/컬러 절대 변경 금지(HARD_CONSTRAINTS)',
    must: "Image 1's garment FABRIC MATERIAL and COLOR must be reproduced with ZERO deviation",
    why: '2026-08-23 사용자 요청으로 추가된 이중 안전장치. 다른 문구들이 색상/패턴을 포괄적으로 언급하고 있었지만, 소재(재질)와 컬러를 별도의 절대 규칙으로 명시해 향후 리팩터링으로 흐려지지 않도록 함.',
  },
  {
    name: '고스트컷 영상 — 옷은 제자리에서 미풍에만 흔들림(사람 등장/이동 금지)',
    must: 'it does NOT walk, float away, spin, or change position',
    why: '고스트컷 영상은 사람이 포징하는 모델컷 영상과 달리 옷 자체가 제자리에서 살랑거리기만 해야 함. 이 문구가 없으면 모델컷 영상 프롬프트처럼 인물/이동이 섞여 들어갈 수 있음.',
  },
  {
    name: '고스트컷 영상 — 옷이 안에서 공기가 들어차 부풀어 오르는(풍선 효과) 것 금지',
    must: 'it must NOT inflate, balloon, puff up, expand, grow rounder, or look like it is filling with air from within',
    why: '2026-08-23 실제 발견된 회귀: 미풍 표현을 지나치게 약하게("very subtle, minimal movement") 서술했더니 오히려 AI가 옷 안쪽에서 공기가 들어차 부풀어 오르는 부자연스러운 영상을 만들었다. 옷 표면이 자연스럽게 살랑거리는 것은 허용하되, 옷 전체 부피가 풍선처럼 팽창하는 것은 명시적으로 금지해야 함.',
  },
  {
    name: '고스트컷 영상 — 패딩/퀄팅류는 볼륨이 첫 프레임 그대로 고정(재발 방지)',
    must: 'This applies especially to padded, quilted, or puffer-style garments (e.g. a padded jumper/jacket) — their padding and loft must look exactly as filled and rigid as in the first frame from start to finish, with zero growth in volume',
    why: '2026-08-23 재발 사례: 위 풍선 효과 금지 문구를 추가한 뒤에도 패딩 점퍼 상품에서는 옷 전체가 다시 부풀어 오르는 현상이 재발함. 패딩류는 원래 형태 자체가 통통해서 AI가 "더 부풀리는" 쪽으로 해석하기 쉬우므로, 패딩/퀄팅류를 별도로 콕 집어 볼륨 고정을 강조하는 문구를 추가함.',
  },
  {
    name: '고스트컷 영상 — 배경 화이트를 영상 끝까지 유지',
    must: 'identical to the first frame from start to finish',
    why: '영상 중간에 배경이 변하거나 그림자가 생기지 않도록 첫 프레임과 끝까지 동일해야 함을 명시.',
  },
]

let failed = false
for (const g of GUARDS) {
  if (!src.includes(g.must)) {
    failed = true
    console.error(`\n✘ [프롬프트 가드 위반] ${g.name}`)
    console.error(`  기대 문구: "${g.must}"`)
    console.error(`  이 문구가 src/index.tsx에서 사라졌거나 변경되었습니다.`)
    console.error(`  이유: ${g.why}`)
    console.error(`  의도적인 변경이라면 scripts/verify-critical-prompts.mjs의 GUARDS도 함께 업데이트하세요.`)
  }
}

if (failed) {
  console.error('\n빌드를 중단합니다 — 생성 프롬프트 회귀 가능성이 감지되었습니다.\n')
  process.exit(1)
} else {
  console.log('✔ 생성 프롬프트 가드 통과 (' + GUARDS.length + '개 문구 확인됨)')
}
