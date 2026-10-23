import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EXPRESSION_TYPES, getExpressionType, isKnownExpressionType, CATEGORY_HEADER_TYPE } from './moduleTypes.ts'
import { payloadMatchesSchema } from './validate.ts'

test('표현방법 카탈로그는 14종이다', () => {
  assert.equal(EXPRESSION_TYPES.length, 14)
})

test('표현방법 key는 전부 고유하다', () => {
  const keys = EXPRESSION_TYPES.map((t) => t.key)
  assert.equal(new Set(keys).size, keys.length)
})

test('categoryHeader는 14종 목록에 포함되지 않는다(L1 전용 시스템 타입)', () => {
  assert.equal(EXPRESSION_TYPES.some((t) => t.key === CATEGORY_HEADER_TYPE), false)
})

test('모든 표현방법은 levelAllow가 비어있지 않다', () => {
  for (const t of EXPRESSION_TYPES) {
    assert.ok(t.levelAllow.length > 0, `${t.key}의 levelAllow가 비어있음`)
  }
})

test('getExpressionType / isKnownExpressionType', () => {
  assert.ok(getExpressionType('headlineBox'))
  assert.equal(getExpressionType('doesNotExist'), undefined)
  assert.equal(isKnownExpressionType('bullets'), true)
  assert.equal(isKnownExpressionType(CATEGORY_HEADER_TYPE), true)
  assert.equal(isKnownExpressionType('doesNotExist'), false)
})

test('모든 표현방법의 defaultPayload는 자신의 payloadSchema 구조를 통과한다', () => {
  for (const t of EXPRESSION_TYPES) {
    assert.ok(
      payloadMatchesSchema(t.key, t.defaultPayload),
      `${t.key}의 defaultPayload가 자신의 payloadSchema를 통과하지 못함: ${JSON.stringify(t.defaultPayload)}`
    )
  }
})

test('chart의 computedSource 기본값은 화이트리스트 안에 있다', () => {
  const chart = getExpressionType('chart')!
  const field = chart.payloadSchema.find((f) => f.key === 'computedSource')!
  const allowed = field.options!.map((o) => o.value)
  assert.ok(allowed.includes(chart.defaultPayload.computedSource))
})

test('chart/callout은 AI 호출 대상이 아니라 promptFragment가 null이다', () => {
  assert.equal(getExpressionType('chart')!.promptFragment, null)
  assert.equal(getExpressionType('callout')!.promptFragment, null)
})
