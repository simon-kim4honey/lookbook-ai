import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderSchemaFormHtml } from './schemaForm.ts'
import { getExpressionType } from './moduleTypes.ts'

const opts = { idPrefix: 'n1', onChangeFnName: 'gsFieldChange' }

test('필수 필드가 비어있으면 인라인 오류가 포함된다', () => {
  const html = renderSchemaFormHtml(getExpressionType('headlineBox')!, { text: '' }, opts)
  assert.match(html, /sf-field-error/)
})

test('필수 필드가 채워져 있으면 인라인 오류가 없다', () => {
  const html = renderSchemaFormHtml(getExpressionType('headlineBox')!, { text: '내용' }, opts)
  assert.doesNotMatch(html, /sf-field-error/)
})

test('select 필드는 옵션을 전부 렌더하고 현재 값에 selected를 붙인다', () => {
  const html = renderSchemaFormHtml(getExpressionType('headlineBox')!, { text: 'x', tone: 'warning' }, opts)
  assert.match(html, /<option value="warning" selected>/)
})

test('list 필드는 항목 수만큼 행을 렌더한다', () => {
  const html = renderSchemaFormHtml(getExpressionType('bullets')!, { items: ['a', 'b', 'c'] }, opts)
  assert.equal((html.match(/sf-list-row/g) || []).length, 3)
})

test('onChangeFnName이 그대로 onchange/onclick 핸들러에 들어간다', () => {
  const html = renderSchemaFormHtml(getExpressionType('paragraph')!, { text: '' }, opts)
  assert.match(html, /gsFieldChange\('n1','text'/)
})
