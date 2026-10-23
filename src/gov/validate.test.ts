import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateNode, validateProgram, CONTAINER_ONLY_TYPES, type GovNode } from './validate.ts'

let seq = 0
function node(partial: Partial<GovNode>): GovNode {
  seq++
  return {
    id: partial.id || `n${seq}`,
    programId: 'test',
    parentId: null,
    level: 3,
    sortKey: `a${String(seq).padStart(3, '0')}`,
    expressionType: 'bullets',
    title: null,
    payload: {},
    binding: 'ai',
    bindingKey: null,
    targetChars: null,
    repeatConfig: null,
    conditionConfig: null,
    ...partial,
  }
}

// 최소 유효 트리 — L1 > L2 > L3(headlineBox+bullets). 각 V-코드 테스트는 이걸 복사해
// 한 가지만 깨뜨린다.
function baselineTree(): GovNode[] {
  const l1 = node({ id: 'l1', level: 1, parentId: null, expressionType: 'categoryHeader', title: '1. 문제 인식', payload: {}, binding: 'static', targetChars: 1000 })
  const l2 = node({ id: 'l2', level: 2, parentId: 'l1', expressionType: 'subhead', title: '가. 배경', payload: { text: '가. 배경', autoNumber: true }, binding: 'static' })
  const l3a = node({ id: 'l3a', level: 3, parentId: 'l2', expressionType: 'headlineBox', title: '헤드카피', payload: { text: '요약 리드 문장입니다.', tone: 'info', align: 'left' }, binding: 'ai' })
  const l3b = node({ id: 'l3b', level: 3, parentId: 'l2', expressionType: 'bullets', title: '세부 설명', payload: { items: ['첫째', '둘째'], marker: 'dot', maxItems: 6 }, binding: 'answer' })
  return [l1, l2, l3a, l3b]
}

test('baselineTree는 오류가 없다(V001/V002/V003/V005/V006 없음, 구조 무결성 통과)', () => {
  const issues = validateProgram(baselineTree())
  const errors = issues.filter((i) => i.level === 'error')
  assert.deepEqual(errors, [])
})

test('V001 — L1이 없으면 오류', () => {
  const issues = validateProgram([])
  assert.ok(issues.some((i) => i.code === 'V001'))
})

test('V002 — L1에 L2가 하나도 없으면 오류', () => {
  const tree = baselineTree().filter((n) => n.level !== 2 && n.level !== 3) // L1만 남김
  const issues = validateProgram(tree)
  assert.ok(issues.some((i) => i.code === 'V002'))
})

test('V003 — 필수 필드(headlineBox.text)가 비어있으면 오류', () => {
  const tree = baselineTree()
  const headline = tree.find((n) => n.id === 'l3a')!
  headline.payload = { ...headline.payload, text: '' }
  const issues = validateProgram(tree)
  assert.ok(issues.some((i) => i.code === 'V003' && i.nodeId === 'l3a'))
})

test('V004 — 컨테이너 전용 표현방법인데 자식이 없으면 오류', () => {
  // 현재 14종엔 컨테이너 전용 타입이 없어 평소엔 절대 발동하지 않는다 — 메커니즘 자체를
  // 확인하기 위해 테스트 동안만 'subhead2'를 컨테이너 전용으로 등록했다가 되돌린다.
  CONTAINER_ONLY_TYPES.push('subhead2')
  try {
    const leaf = node({ id: 'leaf', level: 3, parentId: 'l2', expressionType: 'subhead2', title: '1) 소제목', payload: { text: '1) 소제목' } })
    const issues = validateNode(leaf, { hasChildren: false })
    assert.ok(issues.some((i) => i.code === 'V004'))
  } finally {
    CONTAINER_ONLY_TYPES.length = 0
  }
})

test('V005 — binding=computed인데 bindingKey가 화이트리스트에 없으면 오류', () => {
  const n = node({ binding: 'computed', bindingKey: 'notAllowed' })
  const issues = validateNode(n)
  assert.ok(issues.some((i) => i.code === 'V005'))
})

test('V006 — chart 모듈에 computedSource가 없으면 오류', () => {
  const n = node({ expressionType: 'chart', payload: {} })
  const issues = validateNode(n)
  assert.ok(issues.some((i) => i.code === 'V006'))
})

test('V007 — 대분류 목표 글자수 대비 배정된 모듈 추정치가 60% 미만이면 경고', () => {
  const l1 = node({ id: 'l1', level: 1, parentId: null, expressionType: 'categoryHeader', title: 'L1', payload: {}, binding: 'static', targetChars: 100000 })
  const l2 = node({ id: 'l2', level: 2, parentId: 'l1', expressionType: 'subhead', title: 'L2', payload: { text: 'L2' }, binding: 'static' })
  const l3 = node({ id: 'l3', level: 3, parentId: 'l2', expressionType: 'subhead2', title: 'L3', payload: { text: 'L3' }, binding: 'static' })
  const issues = validateProgram([l1, l2, l3])
  assert.ok(issues.some((i) => i.code === 'V007' && i.nodeId === 'l1'))
})

test('V008 — 한 중분류에 headlineBox가 2개 이상이면 경고', () => {
  const l1 = node({ id: 'l1', level: 1, parentId: null, expressionType: 'categoryHeader', title: 'L1', payload: {}, binding: 'static', targetChars: 100 })
  const l2 = node({ id: 'l2', level: 2, parentId: 'l1', expressionType: 'subhead', title: 'L2', payload: { text: 'L2' }, binding: 'static' })
  const h1 = node({ id: 'h1', level: 3, parentId: 'l2', expressionType: 'headlineBox', payload: { text: '첫 번째 헤드카피' } })
  const h2 = node({ id: 'h2', level: 3, parentId: 'l2', expressionType: 'headlineBox', payload: { text: '두 번째 헤드카피' } })
  const issues = validateProgram([l1, l2, h1, h2])
  assert.ok(issues.some((i) => i.code === 'V008' && i.nodeId === 'l2'))
})

test('V009 — bullets 항목이 maxItems를 초과하면 경고', () => {
  const n = node({ expressionType: 'bullets', payload: { items: ['1', '2', '3'], maxItems: 2 } })
  const issues = validateNode(n)
  assert.ok(issues.some((i) => i.code === 'V009'))
})

test('V010 — 대분류 내 ai 바인딩 비율이 80%를 초과하면 경고', () => {
  const l1 = node({ id: 'l1', level: 1, parentId: null, expressionType: 'categoryHeader', title: 'L1', payload: {}, binding: 'static', targetChars: 100 })
  const l2 = node({ id: 'l2', level: 2, parentId: 'l1', expressionType: 'subhead', title: 'L2', payload: { text: 'L2' }, binding: 'ai' })
  const l3 = node({ id: 'l3', level: 3, parentId: 'l2', expressionType: 'subhead2', title: 'L3', payload: { text: 'L3' }, binding: 'ai' })
  const issues = validateProgram([l1, l2, l3])
  assert.ok(issues.some((i) => i.code === 'V010' && i.nodeId === 'l1'))
})

test('V011 — repeat 소스가 위저드 답변 키에 없으면 경고', () => {
  const n = node({ repeatConfig: { enabled: true, source: 'notAKey' } })
  const issues = validateNode(n)
  assert.ok(issues.some((i) => i.code === 'V011'))
})

test('V012 — condition.when이 위저드 답변 키에 없으면 경고', () => {
  const n = node({ conditionConfig: { enabled: true, when: 'notAKey' } })
  const issues = validateNode(n)
  assert.ok(issues.some((i) => i.code === 'V012'))
})

test('V013 — 제목이 30자를 초과하면 경고', () => {
  const n = node({ title: '가'.repeat(31) })
  const issues = validateNode(n)
  assert.ok(issues.some((i) => i.code === 'V013'))
})

test('V014 — 예상 총 글자수 정보가 항상 포함된다', () => {
  const issues = validateProgram(baselineTree())
  const info = issues.find((i) => i.code === 'V014')
  assert.ok(info)
  assert.equal(info!.level, 'info')
})

test('구조 무결성 — 존재하지 않는 부모를 참조하면 오류', () => {
  const n = node({ level: 2, parentId: 'ghost' })
  const issues = validateProgram([n])
  assert.ok(issues.some((i) => i.code === 'STRUCT_NO_PARENT'))
})

test('구조 무결성 — 순환 참조가 있으면 오류', () => {
  const a = node({ id: 'a', level: 2, parentId: 'b' })
  const b = node({ id: 'b', level: 2, parentId: 'a' })
  const issues = validateProgram([a, b])
  assert.ok(issues.some((i) => i.code === 'STRUCT_CYCLE'))
})

test('구조 무결성 — 형제 사이 sort_key가 중복되면 오류', () => {
  const l1 = node({ id: 'l1', level: 1, parentId: null, expressionType: 'categoryHeader', sortKey: 'a000' })
  const a = node({ id: 'a', level: 2, parentId: 'l1', sortKey: 'a000' })
  const b = node({ id: 'b', level: 2, parentId: 'l1', sortKey: 'a000' })
  const issues = validateProgram([l1, a, b])
  assert.ok(issues.some((i) => i.code === 'STRUCT_DUP_SORT_KEY'))
})

test('구조 무결성 — L1의 자식이 L2가 아니면(레벨 규칙 위반) 오류', () => {
  const l1 = node({ id: 'l1', level: 1, parentId: null, expressionType: 'categoryHeader' })
  const wrong = node({ id: 'w', level: 3, parentId: 'l1' }) // L1의 자식은 L2여야 함
  const issues = validateProgram([l1, wrong])
  assert.ok(issues.some((i) => i.code === 'STRUCT_LEVEL'))
})
