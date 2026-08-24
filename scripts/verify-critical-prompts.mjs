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
    name: '고스트컷 디테일컷 — 크롭/줌일 뿐 새로운 디자인 해석 금지',
    must: 'Do NOT redesign, alter, invent, or change ANY detail of the garment — this is a crop/zoom of the exact same real garment, not a new interpretation.',
    why: '디테일컷은 생성된 고스트컷 이미지의 특정 부위를 클로즈업하는 것일 뿐, AI가 새로운 디자인으로 재해석하면 안 된다. 이 문구가 없으면 클로즈업 과정에서 디자인/색상이 미묘하게 바뀔 위험이 있음.',
  },
  {
    name: '고스트컷 디테일컷 — 배경 화이트/무그림자 유지',
    must: "Background MUST remain pure solid white (#FFFFFF), completely flat and shadowless",
    why: '디테일컷도 원본 고스트컷 이미지와 동일하게 순백색·무그림자 배경을 유지해야 함을 명시.',
  },
  {
    name: '고스트컷 디테일컷 — 원본에 없는 워싱/디스트레싱/에이징 임의 추가 금지',
    must: 'CRITICAL — DO NOT ADD ANY WEAR, AGING, OR DISTRESSING THAT IS NOT ALREADY IN THE SOURCE IMAGE',
    why: '2026-08-23 실제 발견된 회귀: 매끈한 청바지 밑단이 디테일컷 클로즈업에서 낡고 해진 빈티지 원단으로 바뀌어 나옴. "디자인 변경 금지" 문구가 색상/패턴만 포괄적으로 언급했을 뿐 가공/워싱/디스트레싱 추가를 구체적으로 금지하지 않아서 발생. 원본에 없는 워싱/해짐/낡은 질감을 임의로 추가하지 못하도록 구체적으로 명시.',
  },
  {
    name: '고스트컷 디테일컷 — 새 사진이 아닌 원본의 크롭/줌일 뿐임을 명시',
    must: 'IMAGE CROP TASK — this is NOT a new photograph and NOT a creative reinterpretation.',
    why: '2026-08-23 재발 사례: 워싱/디스트레싱 금지 문구를 추가한 뒤에도 사용자가 "일부 응용이 포함되어있다"고 재차 리포트함. "close-up macro shot을 만들어라(create)" 같은 표현 자체가 AI에게 "새로운 사진을 찍어라"는 창작 여지를 줘서 발생한 것으로 추정 — 이 작업이 원본 사진의 특정 영역을 그대로 잘라 확대하는 것일 뿐, 새로운 사진이나 창작적 재해석이 아님을 프롬프트 최상단에 명시.',
  },
  {
    name: '고스트컷 디테일컷 — 창작적 변경 전면 금지(질감/구김/비율/조명 등)',
    must: 'ABSOLUTE PROHIBITION ON CREATIVE CHANGES: Do NOT add, remove, invent, embellish, restyle, or reinterpret ANYTHING.',
    why: '워싱/디스트레싱 외에도 질감·구김·비율·조명 등 다른 종류의 "응용"이 재발할 수 있으므로, 특정 케이스(워싱 등)에 한정하지 않고 모든 창작적 변경을 포괄적으로 금지하는 문구를 추가함. 특정 사례만 막으면 다른 형태의 변형이 계속 재발하는 패턴(2026-08-23 반복 확인)을 근본적으로 차단하기 위함.',
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
