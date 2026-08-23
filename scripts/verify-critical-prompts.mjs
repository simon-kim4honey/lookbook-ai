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
    name: '고스트컷 — 샘플 이미지는 실루엣/구도 참조 전용, 샘플의 실제 의류·배경·조명은 무관함',
    must: 'Image 2 = an UNRELATED product photo used SOLELY as an empty silhouette/shape template',
    why: '관리자가 등록한 카테고리 샘플 이미지의 실제 옷(색상/패턴)이나 배경/조명이 결과물에 섞이면 안 되고, 실루엣/구도만 참조해야 함.',
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
