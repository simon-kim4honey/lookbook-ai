import { test } from 'node:test'
import assert from 'node:assert/strict'
import { between, rebalance } from './sortKey.ts'

test('between(null, null)은 양쪽에 여유가 있는 키를 만든다', () => {
  const k = between(null, null)
  assert.ok(k.length > 0)
})

test('between(a, null)은 a보다 큰 키를 만든다(끝에 삽입)', () => {
  const k = between('m', null)
  assert.ok(k > 'm')
})

test('between(null, b)은 b보다 작은 키를 만든다(앞에 삽입)', () => {
  const k = between(null, 'm')
  assert.ok(k < 'm')
})

test('between(a, b)는 항상 a < k < b', () => {
  const k = between('a000', 'a001')
  assert.ok(k > 'a000' && k < 'a001')
})

test('prevKey >= nextKey면 던진다', () => {
  assert.throws(() => between('b', 'a'))
  assert.throws(() => between('a', 'a'))
})

test('1000회 연속 between 삽입 후에도 정렬 순서가 유지된다(같은 간격을 계속 반쪼갬)', () => {
  let lo = 'a000'
  let hi = 'a001'
  const inserted: string[] = []
  for (let i = 0; i < 1000; i++) {
    const k = between(lo, hi)
    assert.ok(k > lo, `반복 ${i}: ${JSON.stringify(k)}가 lo(${JSON.stringify(lo)})보다 커야 함`)
    assert.ok(k < hi, `반복 ${i}: ${JSON.stringify(k)}가 hi(${JSON.stringify(hi)})보다 작아야 함`)
    inserted.push(k)
    hi = k // 다음 삽입은 lo와 새로 만든 키 사이 — 점점 더 좁은 간격을 계속 반쪼갠다
  }
  // hi를 계속 당겨왔으므로 삽입 순서는 내림차순이 된다(매번 lo에 더 가까워짐) —
  // 그래도 "삽입 순서 == 정렬 순서(역방향)"이어야 한다: 나중에 넣을수록 lo에 더
  // 가까운 더 작은 키라는 뜻이고, 이는 매 반복에서 확인한 lo < k < hi 부등식이
  // 1000번 연속으로 깨지지 않았다는 것과 동치다.
  const descSorted = [...inserted].sort().reverse()
  assert.deepEqual(inserted, descSorted, '삽입 순서가 내림차순 정렬과 일치해야 한다')
})

test('1000회 연속 between 삽입(끝쪽에 계속 추가)도 정렬 순서가 유지된다', () => {
  let prev = 'm'
  const inserted: string[] = [prev]
  for (let i = 0; i < 1000; i++) {
    const k = between(prev, null)
    assert.ok(k > prev)
    inserted.push(k)
    prev = k
  }
  const sorted = [...inserted].sort()
  assert.deepEqual(inserted, sorted)
})

test('rebalance(n)은 n개의 서로 다른, 오름차순 키를 만든다', () => {
  const keys = rebalance(50)
  assert.equal(keys.length, 50)
  assert.equal(new Set(keys).size, 50)
  const sorted = [...keys].sort()
  assert.deepEqual(keys, sorted)
})

test('rebalance(0)은 빈 배열', () => {
  assert.deepEqual(rebalance(0), [])
})
