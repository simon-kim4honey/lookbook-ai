import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildGovSupportDocx, plainText } from './docxExport.ts'

test('plainText — [[AI]]/[[AI:url]] 토큰을 제거한다', () => {
  assert.equal(plainText('30대 직장인 체형 고려 부족[[AI]]'), '30대 직장인 체형 고려 부족')
  assert.equal(plainText('시장 규모 7.5조원[[AI:https://example.com/report]]'), '시장 규모 7.5조원')
  assert.equal(plainText(null), '')
})

test('buildGovSupportDocx — 모든 블록 타입을 예외 없이 Document로 변환한다', () => {
  const content = {
    sections: [
      {
        sectionId: 'problem',
        headline: '1. 문제 인식',
        lead: '리드 문장[[AI]]',
        blocks: [
          { type: 'headlineBox', text: '헤드카피[[AI]]' },
          { type: 'subhead', number: '가.', text: '배경' },
          { type: 'subhead2', number: '1)', text: '세부' },
          { type: 'paragraph', text: '본문 문단[[AI]]' },
          { type: 'bullets', label: '라벨', items: ['항목1[[AI]]', '항목2'] },
          { type: 'bulletsSummary', items: ['요약1', '요약2'] },
          { type: 'table', headers: ['비목', '금액'], rows: [['샘플 제작', '1,000,000']] },
          { type: 'timeline', title: '일정', columns: ['구분', '기간'], rows: [['1단계', '1~3개월']] },
          {
            type: 'compareTable', criteriaLabel: '항목',
            subjects: [{ key: 'a', labelKo: '본 브랜드' }],
            rows: [{ label: '가격', values: { a: '3만원' } }],
          },
          { type: 'iconStats', caption: '핵심 지표', tiles: [{ icon: '📈', value: '30%[[AI]]', label: '성장률' }] },
          { type: 'diagram', diagramType: 'flow', nodes: [{ label: '기획' }, { label: '생산' }] },
          { type: 'callout', text: '주의 문구' },
          { type: 'chart', chartId: 'cost-breakdown', caption: '원가 구조' },
          { type: 'visual', visualId: 'process-flow', caption: '공정도' },
          { type: 'visual', visualUrl: '/api/gov-support/projects/p1/visual-image/vis-problem', caption: '문제점 요약' },
          { type: 'visual', caption: '빈 시각화' },
          { type: 'evidenceGap', need: '근거', how: '직접 입력' },
          { type: 'unknownType', foo: 'bar' },
        ],
      },
    ],
  }
  const doc = buildGovSupportDocx({
    programName: '예비창업패키지',
    generatedAt: '2026-10-31',
    content,
    images: { process: null, visual: {} },
  })
  assert.ok(doc)
})
