import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildCategoryTrees, expandRepeat, moduleIdFor, flattenCategory, formatAutoNumber,
  buildGroupResponseSchema, buildCategoryStructureText, mergeCategoryBlocks, isAiGeneratedNode,
  decodeTableRows, buildAiBlocksByModuleId,
} from './generationAssembly.ts'
import type { GovNode } from './validate.ts'

let seq = 0
function node(partial: Partial<GovNode>): GovNode {
  seq++
  return {
    id: partial.id || `n${seq}`, programId: 'test', parentId: null, level: 3, sortKey: `a${seq}`,
    expressionType: 'bullets', title: null, payload: {}, binding: 'ai', bindingKey: null,
    targetChars: null, repeatConfig: null, conditionConfig: null, ...partial,
  }
}

function sampleTree() {
  const l1 = node({ id: 'l1', level: 1, parentId: null, expressionType: 'categoryHeader', title: '1. 문제 인식', payload: {}, binding: 'static', targetChars: 1000 })
  const l2 = node({ id: 'l2', level: 2, parentId: 'l1', expressionType: 'subhead', title: '가. 배경', payload: { text: '가. 배경', autoNumber: true, numberStyle: 'korean' }, binding: 'static' })
  const l3headline = node({ id: 'l3h', level: 3, parentId: 'l2', expressionType: 'headlineBox', title: '헤드카피', payload: { text: '힌트 문장' }, binding: 'ai' })
  const l3bullets = node({ id: 'l3b', level: 3, parentId: 'l2', expressionType: 'bullets', title: '불릿', payload: {}, binding: 'ai' })
  const l3table = node({ id: 'l3t', level: 3, parentId: 'l2', expressionType: 'table', title: '집행계획', payload: { columns: [{ key: 'item', label: '비목' }] }, binding: 'computed', bindingKey: 'fundUse.stage1' })
  const l3answer = node({ id: 'l3a', level: 3, parentId: 'l2', expressionType: 'paragraph', title: '브랜드명', payload: {}, binding: 'answer', bindingKey: 'brandName' })
  const nodes = [l1, l2, l3headline, l3bullets, l3table, l3answer]
  return buildCategoryTrees(nodes)[0]
}

test('buildCategoryTrees는 L1>L2>L3 3단계로 조립한다', () => {
  const cat = sampleTree()
  assert.equal(cat.node.id, 'l1')
  assert.equal(cat.children.length, 1)
  assert.equal(cat.children[0].children.length, 4)
})

test('expandRepeat — repeat 미사용이면 원본 그대로 1개', () => {
  const n = node({ repeatConfig: null })
  const out = expandRepeat(n, {})
  assert.equal(out.length, 1)
  assert.equal(out[0].repeatIndex, null)
})

test('expandRepeat — repeat 사용 시 답변 배열 길이만큼 전개', () => {
  const n = node({ repeatConfig: { enabled: true, source: 'products' } })
  const out = expandRepeat(n, { products: ['a', 'b', 'c'] })
  assert.equal(out.length, 3)
  assert.deepEqual(out.map((o) => o.repeatIndex), [0, 1, 2])
})

test('expandRepeat — max가 배열 길이보다 작으면 max만큼만', () => {
  const n = node({ repeatConfig: { enabled: true, source: 'products', max: 2 } })
  const out = expandRepeat(n, { products: ['a', 'b', 'c'] })
  assert.equal(out.length, 2)
})

test('moduleIdFor — 반복 아니면 원본id, 반복이면 id#index', () => {
  assert.equal(moduleIdFor('x', null), 'x')
  assert.equal(moduleIdFor('x', 2), 'x#2')
})

test('isAiGeneratedNode — binding=ai이고 promptFragment가 있는 타입만 true', () => {
  assert.equal(isAiGeneratedNode(node({ binding: 'ai', expressionType: 'bullets' })), true)
  assert.equal(isAiGeneratedNode(node({ binding: 'ai', expressionType: 'chart' })), false) // promptFragment null
  assert.equal(isAiGeneratedNode(node({ binding: 'static', expressionType: 'bullets' })), false)
})

test('flattenCategory는 L2+L3를 트리(깊이우선) 순서로 평면화한다', () => {
  const cat = sampleTree()
  const flat = flattenCategory(cat, {})
  assert.deepEqual(flat.map((f) => f.node.id), ['l2', 'l3h', 'l3b', 'l3t', 'l3a'])
})

test('formatAutoNumber — numeric/korean/paren/circled', () => {
  assert.equal(formatAutoNumber('numeric', 1, 0), '1-1.')
  assert.equal(formatAutoNumber('numeric', 2, 2), '2-3.')
  assert.equal(formatAutoNumber('korean', 0, 0), '가.')
  assert.equal(formatAutoNumber('korean', 0, 2), '다.')
  assert.equal(formatAutoNumber('paren', 0, 0), '1)')
  assert.equal(formatAutoNumber('circled', 0, 1), '②')
})

test('buildGroupResponseSchema — static/answer/computed 모듈은 스키마에서 제외된다', () => {
  const cat = sampleTree()
  const schema: any = buildGroupResponseSchema([cat], {})
  const anyOf = schema.properties.sections.items.properties.blocks.items.anyOf
  const moduleIds = anyOf.map((s: any) => s.properties.moduleId.const)
  assert.deepEqual(moduleIds.sort(), ['l3b', 'l3h']) // ai 바인딩인 headlineBox/bullets만
  assert.ok(!moduleIds.includes('l3t')) // computed table 제외
  assert.ok(!moduleIds.includes('l3a')) // answer paragraph 제외
  assert.ok(!moduleIds.includes('l2'))  // static subhead 제외
})

test('buildGroupResponseSchema — 반복 모듈은 인덱스별로 전개된 moduleId를 갖는다', () => {
  const l1 = node({ id: 'l1', level: 1, parentId: null, expressionType: 'categoryHeader', binding: 'static' })
  const l2 = node({ id: 'l2', level: 2, parentId: 'l1', expressionType: 'subhead', binding: 'static' })
  const l3 = node({ id: 'l3', level: 3, parentId: 'l2', expressionType: 'bullets', binding: 'ai', repeatConfig: { enabled: true, source: 'products' } })
  const cat = buildCategoryTrees([l1, l2, l3])[0]
  const schema: any = buildGroupResponseSchema([cat], { products: ['a', 'b'] })
  const moduleIds = schema.properties.sections.items.properties.blocks.items.anyOf.map((s: any) => s.properties.moduleId.const)
  assert.deepEqual(moduleIds.sort(), ['l3#0', 'l3#1'])
})

test('buildCategoryStructureText는 moduleId와 바인딩 지시문을 포함한다', () => {
  const cat = sampleTree()
  const text = buildCategoryStructureText(cat, {})
  assert.match(text, /moduleId="l3h"/)
  assert.match(text, /재계산 절대 금지/) // computed 지시
  assert.match(text, /생성 금지/) // answer 지시
})

test('buildCategoryStructureText — payload.text가 없고 caption만 있는 노드(아이콘형 시각화 등)도 힌트로 포함된다', () => {
  const l1 = node({ id: 'l1', level: 1, parentId: null, expressionType: 'categoryHeader', title: '1. 문제 인식', payload: {}, binding: 'static', targetChars: 1000 })
  const l2 = node({ id: 'l2', level: 2, parentId: 'l1', expressionType: 'subhead', title: '가. 배경', payload: { text: '가. 배경' }, binding: 'static' })
  const l3icon = node({ id: 'l3icon', level: 3, parentId: 'l2', expressionType: 'iconStats', title: '아이콘 도식화', payload: { caption: '창업아이템 배경 핵심 수치' }, binding: 'ai' })
  const cat = buildCategoryTrees([l1, l2, l3icon])[0]
  const text = buildCategoryStructureText(cat, {})
  assert.match(text, /참고\(관리자가 적어둔 힌트\/제목\/캡션\): 창업아이템 배경 핵심 수치/)
})

test('buildCategoryStructureText — binding=ai인 그룹(자식 있는) 노드는 moduleId가 없어 "지시:"를 내려보내지 않는다', () => {
  // 2026-10-26: 그룹 노드는 moduleId가 없어 AI가 생성한 제목을 돌려받을 방법이
  // 없는데도 "지시: 제목만 생성..."을 내려보냈더니, 모델이 그룹 제목 문자열을
  // 가짜 moduleId로 쓴 블록을 지어내 JSON 파싱이 깨지는 사례가 실제로 있었다.
  const l1 = node({ id: 'l1', level: 1, parentId: null, expressionType: 'categoryHeader', title: '1. 문제 인식', payload: {}, binding: 'static', targetChars: 1000 })
  const l2group = node({ id: 'l2g', level: 2, parentId: 'l1', expressionType: 'subhead', title: '2-4. 1단계 정부지원사업비 집행 계획', payload: { text: '2-4. 1단계 정부지원사업비 집행 계획' }, binding: 'ai' })
  const l3leaf = node({ id: 'l3t', level: 3, parentId: 'l2g', expressionType: 'table', title: '집행계획 표', payload: { columns: [{ key: 'item', label: '비목' }] }, binding: 'ai' })
  const cat = buildCategoryTrees([l1, l2group, l3leaf])[0]
  const text = buildCategoryStructureText(cat, {})
  assert.doesNotMatch(text, /지시: 제목만 생성/)
  assert.match(text, /고정 제목\(구조 안내용 — 생성·수정 대상 아님\)/)
  assert.doesNotMatch(text, /moduleId="l2g"/)
})

test('mergeCategoryBlocks — bullets는 payload.showLabel이 켜져 있을 때만 node.title을 label로 실어 보낸다', () => {
  // 2026-10-26: "1) 외부적 배경 및 동기"처럼 소소분류(L4) 자체가 bullets 리프인
  // 경우(4단계 한계로 더 못 내려감) node.title이 블록에 전혀 실리지 않아 화면에
  // 제목이 통째로 안 보였다 — label 필드로 실어 렌더러가 보여줄 수 있게 한다.
  // 단, node.title이 있다고 무조건 보여주면 "OOO 개조식 설명"처럼 관리자가
  // 편의상 붙인 내부 이름까지 노출되므로 showLabel로 명시한 경우만 보여준다.
  const l1 = node({ id: 'l1', level: 1, parentId: null, expressionType: 'categoryHeader', title: '1. 문제 인식', payload: {}, binding: 'static', targetChars: 1000 })
  const l2 = node({ id: 'l2', level: 2, parentId: 'l1', expressionType: 'subhead', title: '가. 배경', payload: { text: '가. 배경' }, binding: 'static' })
  const l3bullets = node({ id: 'l3b', level: 3, parentId: 'l2', expressionType: 'bullets', title: '1) 외부적 배경 및 동기', payload: { items: [], showLabel: true }, binding: 'ai' })
  const l3noLabel = node({ id: 'l3n', level: 3, parentId: 'l2', expressionType: 'bullets', title: '가.배경 개조식 설명', payload: { items: [] }, binding: 'ai' })
  const cat = buildCategoryTrees([l1, l2, l3bullets, l3noLabel])[0]
  const { blocks } = mergeCategoryBlocks(cat, new Map([
    ['l3b', { moduleId: 'l3b', items: ['국내 시장 규모 1조원'] }],
    ['l3n', { moduleId: 'l3n', items: ['편안함을 중시하는 소비 성향'] }],
  ]), {}, () => null, 1)
  const bulletsBlocks = blocks.filter((b) => b.type === 'bullets')
  assert.equal(bulletsBlocks[0].label, '1) 외부적 배경 및 동기')
  assert.equal(bulletsBlocks[1].label, undefined)
})

test('mergeCategoryBlocks — table은 payload.columns에서 헤더를 뽑아 base.headers로 싣는다(바인딩 종류 무관)', () => {
  // 2026-10-26: 렌더러(rsRenderBlock)가 b.headers를 읽는데, 이걸 payload.columns
  // (label)에서 채워 넣는 코드가 어디에도 없어 모든 table이 헤더 없이 렌더되고
  // 있었다 — static/computed/ai 바인딩 전부 해당(전사적 버그).
  const l1 = node({ id: 'l1', level: 1, parentId: null, expressionType: 'categoryHeader', title: '1. 문제 인식', payload: {}, binding: 'static', targetChars: 1000 })
  const l2 = node({ id: 'l2', level: 2, parentId: 'l1', expressionType: 'subhead', title: '2-4', payload: { text: '2-4' }, binding: 'static' })
  const l3table = node({
    id: 'l3t', level: 3, parentId: 'l2', expressionType: 'table', title: '1단계 집행계획 표',
    payload: { columns: [{ key: 'item', label: '비목' }, { key: 'amount', label: '금액' }] },
    binding: 'computed', bindingKey: 'fundUse.stage1',
  })
  const cat = buildCategoryTrees([l1, l2, l3table])[0]
  const { blocks } = mergeCategoryBlocks(cat, new Map(), {}, (key) => (key === 'fundUse.stage1' ? { rows: [['샘플·가봉', '20000000']] } : null), 1)
  const tableBlock = blocks.find((b) => b.type === 'table')!
  assert.deepEqual(tableBlock.headers, ['비목', '금액'])
  assert.deepEqual(tableBlock.rows, [['샘플·가봉', '20000000']])
})

test('mergeCategoryBlocks — computed 모듈은 AI 응답과 무관하게 서버 계산값으로 강제된다', () => {
  const cat = sampleTree()
  const aiBlocks = new Map<string, any>([
    ['l3t', { moduleId: 'l3t', rows: [['조작됨', '999']] }], // AI가 혹시 computed 모듈을 채워 보내도
  ])
  const { blocks } = mergeCategoryBlocks(cat, aiBlocks, {}, (key) => (key === 'fundUse.stage1' ? { rows: [['소재비', '10000000']] } : null), 1)
  const tableBlock = blocks.find((b) => b.type === 'table')!
  assert.deepEqual(tableBlock.rows, [['소재비', '10000000']]) // AI가 보낸 값이 아니라 서버 계산값
})

test('mergeCategoryBlocks — answer 모듈은 사용자 답변값을 그대로 쓴다(AI 응답 무시)', () => {
  const cat = sampleTree()
  const aiBlocks = new Map<string, any>()
  const { blocks } = mergeCategoryBlocks(cat, aiBlocks, { brandName: { text: '진짜브랜드' } }, () => null, 1)
  const idx = flattenIndexOfParagraph(cat)
  assert.deepEqual(blocks[idx], { type: 'paragraph', text: '진짜브랜드' })
})
function flattenIndexOfParagraph(cat: any): number {
  // mergeCategoryBlocks의 순회 순서(그룹 L2 먼저, 그다음 L3들)와 동일하게 계산.
  // children은 이제 NodeTree({node, children})이므로 leaf.node로 접근한다(4단계 확장).
  let i = 0
  for (const group of cat.children) {
    i++ // L2 자신
    for (const leaf of group.children) {
      if (leaf.node.expressionType === 'paragraph') return i
      i++
    }
  }
  return -1
}

test('mergeCategoryBlocks — ai 모듈은 응답을 그대로 반영하고, subhead는 자동번호가 붙는다', () => {
  const cat = sampleTree()
  const aiBlocks = new Map<string, any>([['l3h', { moduleId: 'l3h', text: 'AI가 쓴 헤드카피' }]])
  const { blocks } = mergeCategoryBlocks(cat, aiBlocks, {}, () => null, 1)
  const subheadBlock = blocks[0]
  assert.equal(subheadBlock.type, 'subhead')
  assert.equal(subheadBlock.number, '가.')
  const headlineBlock = blocks.find((b) => b.type === 'headlineBox')!
  assert.equal(headlineBlock.text, 'AI가 쓴 헤드카피')
})

test('mergeCategoryBlocks — 번호 없는 형제(headlineBox/iconStats 등)가 사이에 끼어도 자동번호는 건너뛰지 않고 연속된다', () => {
  const l1 = node({ id: 'l1', level: 1, parentId: null, expressionType: 'categoryHeader', binding: 'static' })
  const a = node({ id: 'a', level: 2, parentId: 'l1', expressionType: 'headlineBox', binding: 'static' }) // 번호 없음
  const b = node({ id: 'b', level: 2, parentId: 'l1', expressionType: 'subhead', payload: { autoNumber: true }, binding: 'static' })
  const c = node({ id: 'c', level: 2, parentId: 'l1', expressionType: 'subhead2', payload: { autoNumber: true }, binding: 'static' })
  const d = node({ id: 'd', level: 2, parentId: 'l1', expressionType: 'iconStats', binding: 'static' }) // 번호 없음
  const e = node({ id: 'e', level: 2, parentId: 'l1', expressionType: 'subhead', payload: { autoNumber: true }, binding: 'static' })
  const cat = buildCategoryTrees([l1, a, b, c, d, e])[0]
  const { blocks } = mergeCategoryBlocks(cat, new Map(), {}, () => null, 1)
  const numbered = blocks.filter((x) => x.number).map((x) => x.number)
  assert.deepEqual(numbered, ['1-1.', '1-2.', '1-3.']) // 1-1,1-3,1-5처럼 건너뛰지 않는다
})

test('mergeCategoryBlocks — AI 응답에 moduleId가 없으면 경고를 남기고 콘텐츠 필드는 비운다(관리자 힌트를 콘텐츠로 노출하지 않음)', () => {
  const cat = sampleTree()
  const { blocks, warnings } = mergeCategoryBlocks(cat, new Map(), {}, () => null, 1)
  const headlineBlock = blocks.find((b) => b.type === 'headlineBox')!
  // node.payload.text("힌트 문장")는 AI를 위한 프롬프트 힌트일 뿐 완성 문구가 아니다 —
  // AI 응답이 없으면 그대로 노출하지 않고 비운다(2026-10-26, 실사용자 리포트로 확인된
  // "관리자 메모가 그대로 생성물에 노출" 버그 수정).
  assert.equal(headlineBlock.text, undefined)
  assert.ok(warnings.some((w) => w.moduleId === 'l3h'))
})

test('mergeCategoryBlocks — AI 응답 누락 시 AI 소유 필드(items 등)만 지우고 표현 설정(tone 등)은 남긴다', () => {
  const l1 = node({ id: 'g1', level: 1, parentId: null, expressionType: 'categoryHeader', payload: {}, binding: 'static' })
  const l2 = node({ id: 'g2', level: 2, parentId: 'g1', expressionType: 'subhead', payload: { text: '가.', autoNumber: false }, binding: 'static' })
  const headline = node({ id: 'g3', level: 3, parentId: 'g2', expressionType: 'headlineBox', payload: { text: '힌트 문장', tone: 'info', align: 'left' }, binding: 'ai' })
  const bullets = node({ id: 'g4', level: 3, parentId: 'g2', expressionType: 'bullets', payload: { items: ['관리자 메모 힌트'], marker: 'dot' }, binding: 'ai' })
  const cat = buildCategoryTrees([l1, l2, headline, bullets])[0]
  const { blocks } = mergeCategoryBlocks(cat, new Map(), {}, () => null, 1)
  const headlineBlock = blocks.find((b) => b.type === 'headlineBox')!
  const bulletsBlock = blocks.find((b) => b.type === 'bullets')!
  assert.equal(headlineBlock.text, undefined)
  assert.equal(headlineBlock.tone, 'info') // 표현 설정은 유지
  assert.equal(headlineBlock.align, 'left')
  assert.equal(bulletsBlock.items, undefined) // 관리자 메모가 콘텐츠로 남지 않는다
  assert.equal(bulletsBlock.marker, 'dot') // 표현 설정은 유지
})

test('mergeCategoryBlocks — iconStats 타일은 4개로 절단된다', () => {
  const l1 = node({ id: 'l1', level: 1, parentId: null, expressionType: 'categoryHeader', binding: 'static' })
  const l2 = node({ id: 'l2', level: 2, parentId: 'l1', expressionType: 'subhead', binding: 'static' })
  const l3 = node({ id: 'l3', level: 3, parentId: 'l2', expressionType: 'iconStats', binding: 'ai' })
  const cat = buildCategoryTrees([l1, l2, l3])[0]
  const tiles = [1, 2, 3, 4, 5].map((i) => ({ icon: '📌', value: String(i), label: 'x' }))
  const { blocks } = mergeCategoryBlocks(cat, new Map([['l3', { moduleId: 'l3', tiles }]]), {}, () => null, 1)
  const b = blocks.find((x) => x.type === 'iconStats')!
  assert.equal(b.tiles.length, 4)
})

test('mergeCategoryBlocks — ai 바인딩 visual의 관리자 설정(visualId 등)은 AI 응답과 무관하게 보존된다', () => {
  const l1 = node({ id: 'l1', level: 1, parentId: null, expressionType: 'categoryHeader', binding: 'static' })
  const l2 = node({ id: 'l2', level: 2, parentId: 'l1', expressionType: 'subhead', binding: 'static' })
  const l3 = node({
    id: 'l3', level: 3, parentId: 'l2', expressionType: 'visual', binding: 'ai',
    payload: { kind: 'generated', visualId: 'process-flow', caption: '', alt: '' },
  })
  const cat = buildCategoryTrees([l1, l2, l3])[0]
  const { blocks } = mergeCategoryBlocks(cat, new Map([['l3', { moduleId: 'l3', caption: 'AI가 쓴 캡션', alt: 'AI가 쓴 대체텍스트' }]]), {}, () => null, 1)
  const b = blocks.find((x) => x.type === 'visual')!
  assert.equal(b.visualId, 'process-flow') // 관리자 설정 — AI 응답에 없어도 유지
  assert.equal(b.kind, 'generated')
  assert.equal(b.caption, 'AI가 쓴 캡션') // AI 필드는 정상적으로 덮어씀
  assert.equal(b.alt, 'AI가 쓴 대체텍스트')
})

test('decodeTableRows — JSON 배열 문자열 행을 string[][]로 되돌린다', () => {
  assert.deepEqual(decodeTableRows(['["a","b"]', '["c","d"]']), [['a', 'b'], ['c', 'd']])
})

test('decodeTableRows — 깨진 JSON이나 비문자열 행은 원문을 1칸짜리 행으로 안전하게 감싼다', () => {
  assert.deepEqual(decodeTableRows(['not json', 123 as any]), [['not json'], ['123']])
})

test('decodeTableRows — 이미 배열(구형 응답)로 온 행은 그대로 문자열화해 받아들인다', () => {
  assert.deepEqual(decodeTableRows([['a', 1 as any]]), [['a', '1']])
})

test('decodeTableRows — 입력이 배열이 아니면 빈 배열', () => {
  assert.deepEqual(decodeTableRows(null), [])
  assert.deepEqual(decodeTableRows(undefined), [])
})

test('mergeCategoryBlocks — ai 바인딩 table의 rows는 JSON 문자열 행에서 string[][]로 디코드된다', () => {
  const l1 = node({ id: 'l1', level: 1, parentId: null, expressionType: 'categoryHeader', binding: 'static' })
  const l2 = node({ id: 'l2', level: 2, parentId: 'l1', expressionType: 'subhead', binding: 'static' })
  const l3 = node({ id: 'l3', level: 3, parentId: 'l2', expressionType: 'table', binding: 'ai' })
  const cat = buildCategoryTrees([l1, l2, l3])[0]
  const { blocks } = mergeCategoryBlocks(cat, new Map([['l3', { moduleId: 'l3', rows: ['["구분","금액"]', '["1단계","100"]'] }]]), {}, () => null, 1)
  const b = blocks.find((x) => x.type === 'table')!
  assert.deepEqual(b.rows, [['구분', '금액'], ['1단계', '100']])
})

test('buildAiBlocksByModuleId — moduleId가 정확히 일치하면 그대로 매칭된다', () => {
  const l1 = node({ id: 'l1', level: 1, parentId: null, expressionType: 'categoryHeader', binding: 'static' })
  const l2 = node({ id: 'l2', level: 2, parentId: 'l1', expressionType: 'subhead', binding: 'static' })
  const a = node({ id: 'a', level: 3, parentId: 'l2', expressionType: 'headlineBox', binding: 'ai' })
  const b = node({ id: 'b', level: 3, parentId: 'l2', expressionType: 'paragraph', binding: 'ai' })
  const cat = buildCategoryTrees([l1, l2, a, b])[0]
  const map = buildAiBlocksByModuleId(cat, {}, [{ moduleId: 'b', text: 'B' }, { moduleId: 'a', text: 'A' }])
  assert.equal(map.get('a').text, 'A')
  assert.equal(map.get('b').text, 'B')
})

test('buildAiBlocksByModuleId — moduleId가 하나도 안 맞으면(구조화 출력 없이 모델이 잘못 베껴씀) 순서대로 배정한다', () => {
  const l1 = node({ id: 'l1', level: 1, parentId: null, expressionType: 'categoryHeader', binding: 'static' })
  const l2 = node({ id: 'l2', level: 2, parentId: 'l1', expressionType: 'subhead', binding: 'static' })
  const a = node({ id: 'a', level: 3, parentId: 'l2', expressionType: 'headlineBox', binding: 'ai' })
  const b = node({ id: 'b', level: 3, parentId: 'l2', expressionType: 'paragraph', binding: 'ai' })
  const cat = buildCategoryTrees([l1, l2, a, b])[0]
  const map = buildAiBlocksByModuleId(cat, {}, [{ moduleId: 'wrong-id-1', text: 'first' }, { moduleId: 'wrong-id-2', text: 'second' }])
  assert.equal(map.get('a').text, 'first')
  assert.equal(map.get('b').text, 'second')
})

// ── 4단계 확장(대분류/중분류/소분류/소소분류) ──────────────────────
function sample4LevelTree() {
  const l1 = node({ id: 'l1', level: 1, parentId: null, expressionType: 'categoryHeader', title: '1. 문제인식', payload: {}, binding: 'static', targetChars: 1000 })
  const l2 = node({ id: 'l2', level: 2, parentId: 'l1', expressionType: 'subhead', title: '1-1. 창업아이템 배경', payload: { text: '1-1. 창업아이템 배경', autoNumber: true }, binding: 'static' })
  const l3 = node({ id: 'l3', level: 3, parentId: 'l2', expressionType: 'subhead2', title: '가. 창업아이템 배경', payload: { text: '가. 창업아이템 배경', autoNumber: true, numberStyle: 'paren' }, binding: 'static' })
  const l4a = node({ id: 'l4a', level: 4, parentId: 'l3', expressionType: 'headlineBox', title: '외부적 배경', payload: { text: '힌트' }, binding: 'ai' })
  const l4b = node({ id: 'l4b', level: 4, parentId: 'l3', expressionType: 'paragraph', title: '동기', payload: {}, binding: 'ai' })
  const nodes = [l1, l2, l3, l4a, l4b]
  return buildCategoryTrees(nodes)[0]
}

test('buildCategoryTrees — L1>L2>L3>L4 4단계까지 재귀로 조립한다', () => {
  const cat = sample4LevelTree()
  assert.equal(cat.node.id, 'l1')
  assert.equal(cat.children.length, 1)
  assert.equal(cat.children[0].node.id, 'l2')
  assert.equal(cat.children[0].children.length, 1)
  assert.equal(cat.children[0].children[0].node.id, 'l3')
  assert.equal(cat.children[0].children[0].children.length, 2)
})

test('flattenCategory — 4단계 트리도 깊이우선 순서로 전부 평면화된다', () => {
  const cat = sample4LevelTree()
  const flat = flattenCategory(cat, {})
  assert.deepEqual(flat.map((f) => f.node.id), ['l2', 'l3', 'l4a', 'l4b'])
  assert.deepEqual(flat.map((f) => f.depth), [2, 3, 4, 4])
})

test('buildCategoryStructureText — 4단계에서는 자식 없는 노드(어느 깊이든)에만 moduleId가 붙는다', () => {
  const cat = sample4LevelTree()
  const text = buildCategoryStructureText(cat, {})
  assert.match(text, /moduleId="l4a"/)
  assert.match(text, /moduleId="l4b"/)
  assert.doesNotMatch(text, /moduleId="l2"/)
  assert.doesNotMatch(text, /moduleId="l3"/)
})

test('mergeCategoryBlocks — 4단계 트리에서도 subhead/subhead2 자동번호가 깊이와 무관하게 끊기지 않는다', () => {
  const cat = sample4LevelTree()
  const { blocks } = mergeCategoryBlocks(cat, new Map(), {}, () => null, 1)
  const numbered = blocks.filter((b) => b.number).map((b) => b.number)
  assert.deepEqual(numbered, ['1-1.', '2)']) // l2(subhead,numeric)·l3(subhead2,paren) 둘 다 번호 부여, 끊기지 않음
})

test('buildAiBlocksByModuleId — 일부만 정확히 일치하면 나머지만 순서대로 채운다', () => {
  const l1 = node({ id: 'l1', level: 1, parentId: null, expressionType: 'categoryHeader', binding: 'static' })
  const l2 = node({ id: 'l2', level: 2, parentId: 'l1', expressionType: 'subhead', binding: 'static' })
  const a = node({ id: 'a', level: 3, parentId: 'l2', expressionType: 'headlineBox', binding: 'ai' })
  const b = node({ id: 'b', level: 3, parentId: 'l2', expressionType: 'paragraph', binding: 'ai' })
  const c = node({ id: 'c', level: 3, parentId: 'l2', expressionType: 'bullets', binding: 'ai' })
  const cat = buildCategoryTrees([l1, l2, a, b, c])[0]
  const map = buildAiBlocksByModuleId(cat, {}, [{ moduleId: 'wrong', items: ['x'] }, { moduleId: 'b', text: 'exact B' }, { moduleId: 'also-wrong', text: 'leftover' }])
  assert.equal(map.get('b').text, 'exact B') // 정확히 일치하는 건 그대로
  assert.equal(map.get('a').items.length, 1) // 남은 블록은 순서대로
  assert.equal(map.get('c').text, 'leftover')
})
