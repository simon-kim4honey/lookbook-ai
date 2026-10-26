// ────────────────────────────────────────────────────
// 지원사업 구조 모듈 빌더 개편 P1 — 표현방법(모듈 타입) 14종 카탈로그
// (기획서 "정부지원사업 사업계획서 자동화 — 어드민 모듈 빌더 개편" §5, §12-2)
//
// 이 파일이 14종 표현방법의 "코드의 단일 소스"다 — payload 구조, 어드민 인스펙터 폼
// 필드, AI 프롬프트 조각, 기본값을 전부 여기서 정의한다. 다른 곳(빌더 API, 생성
// 파이프라인, 렌더러)은 이 상수를 참조만 한다.
//
// §5-1에서 'categoryHeader'는 L1(대분류) 전용 시스템 타입으로 따로 분류된다 —
// 대분류 헤더는 title로 자동 렌더되고 관리자가 표현방법을 바꿀 수 없으므로
// EXPRESSION_TYPES(14종, 관리자가 선택 가능한 타입) 목록에는 포함하지 않는다.
// ────────────────────────────────────────────────────

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'toggle' | 'list' | 'table' | 'color'

export interface FieldSchema {
  key: string
  labelKo: string
  type: FieldType
  required?: boolean
  options?: { value: string; labelKo: string }[]
  maxItems?: number
  placeholder?: string
  helpText?: string
}

export interface ExpressionTypeDef {
  key: string
  labelKo: string
  icon: string
  levelAllow: (1 | 2 | 3 | 4)[]
  payloadSchema: FieldSchema[]
  // AI 호출 대상이 아닌 타입(chart/callout)은 null — §5-4
  promptFragment: string | null
  defaultPayload: Record<string, any>
}

export const CATEGORY_HEADER_TYPE = 'categoryHeader'

// chart.computedSource가 허용하는 키 — §5-2, §12-2 point1. 이 화이트리스트 밖의 키를
// 쓰면 V006(검증)에서 오류로 처리한다.
export const CHART_COMPUTED_SOURCES = ['costBreakdown', 'channelMargin', 'revenueScenario'] as const

// binding='computed'의 bindingKey가 허용하는 키 전체 — 부록 B. chart 전용 3개보다
// 범위가 넓다(표 셀 등 일반 모듈도 서버 계산값을 그대로 인용할 수 있어야 하므로).
// V005(검증)에서 이 목록 밖의 bindingKey를 오류로 처리한다.
export const COMPUTED_KEY_WHITELIST = [
  'costBreakdown', 'channelMargin', 'revenueScenario', 'fundUse.stage1', 'fundUse.stage2',
  'competitorTable',
] as const

// binding='answer' 및 repeat.source / condition.when이 허용하는 위저드 답변 키 —
// 부록 C. 배열 답변은 '[]' 표기를 떼고 키 이름만 남긴다(repeat.source가 참조하는 건
// 배열 키 자체이므로). V011/V012(검증)에서 이 목록 밖의 키를 경고로 처리한다.
//
// 2026-10-26: 위저드(wzCollectStep, src/index.tsx)가 실제로 저장하는 키 이름과
// 이 목록이 달랐다(예: 'targetCustomer'가 아니라 'target', 'deliverables'가 아니라
// 'productOutput') — 지금은 yebi가 binding='answer'를 전혀 쓰지 않고 answers 전체를
// 통째로 AI 프롬프트에 넘기는 방식이라 실제 생성엔 영향이 없었지만, 관리자가 구조
// 빌더에서 특정 칸에 답변을 직접 바인딩하려 하면 혼란스럽거나 조용히 빈 값이 나올
// 수 있어 위저드가 실제로 쓰는 키 이름으로 전부 맞췄다.
export const ANSWER_KEYS = [
  'brandName', 'founderAge', 'stage',
  'product1', 'product2', 'product3', 'concept', 'category', 'priceRange', 'ipStatus', 'validationEfforts',
  'target', 'problemStatement',
  'competitor1_name', 'competitor1_feature', 'competitor2_name', 'competitor2_feature', 'competitorsUnknown', 'buyReason',
  'productionMethod', 'productionDetail',
  'processSteps', 'processNote',
  'diffReason', 'diffStubborn', 'diffFeedback', 'differentiationTypes',
  'preSale', 'cost_product1', 'cost_product2', 'cost_product3', 'price_product1', 'price_product2', 'price_product3',
  'selfMallUrl', 'channels',
  'capital', 'fundUse',
  'experience', 'experienceDetail', 'externalBackground', 'motivation', 'expectedImpact',
  'productOutput', 'founderJob', 'teamMembers', 'partners', 'threeYearGoal',
] as const

const toneOptions = [
  { value: 'info', labelKo: '정보(파란 배경)' },
  { value: 'warning', labelKo: '경고(노란 배경)' },
  { value: 'brand', labelKo: '브랜드' },
]

export const EXPRESSION_TYPES: ExpressionTypeDef[] = [
  {
    key: 'headlineBox', labelKo: '박스형 헤드카피', icon: '🔷', levelAllow: [2, 3, 4],
    payloadSchema: [
      { key: 'text', labelKo: '리드 문장', type: 'textarea', required: true, helpText: '1~3문장' },
      { key: 'tone', labelKo: '톤', type: 'select', options: toneOptions },
      { key: 'align', labelKo: '정렬', type: 'select', options: [{ value: 'left', labelKo: '왼쪽' }, { value: 'center', labelKo: '가운데' }] },
    ],
    promptFragment: '섹션의 문제의식과 지향을 압축한 리드 문장 1~3개. 명사형 종결 허용. 수치 1개 이상 포함.',
    defaultPayload: { text: '', tone: 'info', align: 'left' },
  },
  {
    key: 'subhead', labelKo: '중제목', icon: '🔠', levelAllow: [2, 3, 4],
    payloadSchema: [
      { key: 'text', labelKo: '제목', type: 'text', required: true },
      { key: 'autoNumber', labelKo: '번호 자동 부여', type: 'toggle' },
      {
        key: 'numberStyle', labelKo: '번호 스타일', type: 'select',
        options: [{ value: 'numeric', labelKo: '1-1.' }, { value: 'korean', labelKo: '가.' }, { value: 'circled', labelKo: '①' }],
      },
    ],
    promptFragment: '제목만 생성. 20자 이내. 번호는 시스템이 부여하므로 넣지 말 것.',
    defaultPayload: { text: '', autoNumber: true, numberStyle: 'numeric' },
  },
  {
    key: 'subhead2', labelKo: '소제목', icon: '🔡', levelAllow: [3, 4],
    payloadSchema: [
      { key: 'text', labelKo: '제목', type: 'text', required: true },
      { key: 'autoNumber', labelKo: '번호 자동 부여', type: 'toggle' },
      {
        key: 'numberStyle', labelKo: '번호 스타일', type: 'select',
        options: [{ value: 'paren', labelKo: '1)' }, { value: 'circled', labelKo: '①' }],
      },
    ],
    promptFragment: '제목만 생성. 20자 이내. 번호는 시스템이 부여하므로 넣지 말 것.',
    defaultPayload: { text: '', autoNumber: true, numberStyle: 'paren' },
  },
  {
    key: 'paragraph', labelKo: '서술형 본문', icon: '📝', levelAllow: [3, 4],
    payloadSchema: [
      { key: 'text', labelKo: '본문', type: 'textarea', required: true },
      { key: 'maxChars', labelKo: '목표 글자수', type: 'number', helpText: '소프트 상한 — 초과해도 저장은 허용' },
    ],
    promptFragment: '정부지원사업 컨설턴트 문체로 4~5문장. 추상어 금지, 소재명·수치·기간으로 구체화.',
    defaultPayload: { text: '', maxChars: 400 },
  },
  {
    key: 'bullets', labelKo: '개조식 상세 설명', icon: '•', levelAllow: [3, 4],
    payloadSchema: [
      { key: 'items', labelKo: '불릿 목록', type: 'list', maxItems: 6 },
      {
        key: 'marker', labelKo: '마커', type: 'select',
        options: [{ value: 'dot', labelKo: '•' }, { value: 'dash', labelKo: '-' }, { value: 'check', labelKo: '✓' }],
      },
      { key: 'maxItems', labelKo: '최대 항목 수', type: 'number' },
      { key: 'hintToAI', labelKo: 'AI 추가 지시(선택)', type: 'text' },
      {
        key: 'showLabel', labelKo: '카드 제목을 본문에 소제목으로 표시', type: 'toggle',
        helpText: '"1) 외부적 배경 및 동기"처럼 카드 제목 자체가 실제 소소분류 항목명일 때만 켠다. "OOO 개조식 설명"처럼 관리자가 편의상 붙인 이름이면 꺼둔다(기본값) — 켜면 생성물에 그대로 노출된다.',
      },
    ],
    promptFragment: '• 불릿 3~5개. 각 항목 40자 이내. 수치 또는 고유명사 1개 이상 포함.',
    defaultPayload: { items: [], marker: 'dot', maxItems: 6, hintToAI: '', showLabel: false },
  },
  {
    key: 'bulletsSummary', labelKo: '개조식 요약 설명', icon: '≡', levelAllow: [2, 3, 4],
    payloadSchema: [
      { key: 'items', labelKo: '요약 불릿', type: 'list', maxItems: 3 },
      { key: 'maxItems', labelKo: '최대 항목 수', type: 'number' },
      { key: 'label', labelKo: '표시 제목(선택)', type: 'text' },
      { key: 'hintToAI', labelKo: 'AI 추가 지시(선택)', type: 'text' },
    ],
    promptFragment: '핵심만 정확히 3줄. 앞 섹션 내용을 압축할 것, 새 사실 창작 금지.',
    defaultPayload: { items: [], maxItems: 3, label: '핵심 요약', hintToAI: '' },
  },
  {
    key: 'table', labelKo: '표', icon: '▦', levelAllow: [3, 4],
    payloadSchema: [
      { key: 'columns', labelKo: '컬럼', type: 'table', required: true, helpText: 'key/label/width/align' },
      { key: 'rows', labelKo: '정적 행(선택)', type: 'table' },
      { key: 'repeatSource', labelKo: '반복 소스(선택)', type: 'text', helpText: '예: products, teamMembers, partners' },
      { key: 'computedSource', labelKo: '서버 계산값 키(선택)', type: 'text', helpText: '예: fundUse.stage1' },
      { key: 'showTotalRow', labelKo: '합계 행 표시', type: 'toggle' },
    ],
    promptFragment: '지정된 컬럼·행만 채울 것. 컬럼 추가·삭제·순서변경 절대 금지. 숫자는 서버 계산값만 인용.',
    defaultPayload: { columns: [], rows: [], repeatSource: null, computedSource: null, showTotalRow: false },
  },
  {
    key: 'compareTable', labelKo: '비교표', icon: '⇄', levelAllow: [3, 4],
    payloadSchema: [
      { key: 'criteriaLabel', labelKo: '비교 항목 라벨', type: 'text' },
      { key: 'subjects', labelKo: '비교 대상', type: 'list' },
      { key: 'rows', labelKo: '비교 행', type: 'table' },
      {
        key: 'cellRender', labelKo: '셀 표현', type: 'select',
        options: [{ value: 'text', labelKo: '텍스트' }, { value: 'symbol', labelKo: '기호(○/△/×)' }, { value: 'score', labelKo: '점수(★)' }],
      },
      { key: 'highlightSelf', labelKo: '본 브랜드 강조', type: 'toggle' },
    ],
    promptFragment: "경쟁사 실존 브랜드명 창작 금지. 사용자가 비워둔 경쟁사는 일반 명사('대형 SPA 브랜드')로.",
    defaultPayload: { criteriaLabel: '비교 항목', subjects: [{ key: 'self', labelKo: '본 브랜드', isSelf: true }], rows: [], cellRender: 'text', highlightSelf: true },
  },
  {
    key: 'chart', labelKo: '도표/그래프', icon: '📊', levelAllow: [3, 4],
    payloadSchema: [
      {
        key: 'chartType', labelKo: '차트 종류', type: 'select',
        options: [{ value: 'bar', labelKo: '막대' }, { value: 'stackedBar', labelKo: '누적 막대' }, { value: 'line', labelKo: '선' }, { value: 'donut', labelKo: '도넛' }, { value: 'scatter', labelKo: '산점도' }],
      },
      { key: 'title', labelKo: '제목', type: 'text' },
      {
        key: 'computedSource', labelKo: '서버 계산값 키', type: 'select', required: true,
        options: CHART_COMPUTED_SOURCES.map((v) => ({ value: v, labelKo: v })),
        helpText: '계산값 전용 — AI가 생성하지 않는다',
      },
      { key: 'showLegend', labelKo: '범례 표시', type: 'toggle' },
      { key: 'showDataLabels', labelKo: '데이터 라벨 표시', type: 'toggle' },
    ],
    promptFragment: null, // AI 호출 대상 아님 — 서버가 계산값으로 직접 렌더
    defaultPayload: { chartType: 'bar', title: '', computedSource: CHART_COMPUTED_SOURCES[0], showLegend: true, showDataLabels: true },
  },
  {
    key: 'diagram', labelKo: '도식화', icon: '🔀', levelAllow: [3, 4],
    payloadSchema: [
      {
        key: 'diagramType', labelKo: '도식 종류', type: 'select',
        options: [{ value: 'flow', labelKo: '흐름도' }, { value: 'hierarchy', labelKo: '계층도' }, { value: 'matrix', labelKo: '매트릭스' }, { value: 'cycle', labelKo: '순환도' }],
      },
      { key: 'title', labelKo: '제목', type: 'text' },
      { key: 'nodes', labelKo: '노드', type: 'list' },
      { key: 'edges', labelKo: '연결', type: 'list' },
      {
        key: 'source', labelKo: '내용 원천', type: 'select',
        options: [{ value: 'answer', labelKo: '사용자 답변' }, { value: 'ai', labelKo: 'AI 생성' }, { value: 'static', labelKo: '고정' }],
      },
      { key: 'sourceKey', labelKo: '답변 키(선택)', type: 'text', helpText: '예: processSteps' },
    ],
    promptFragment: '사용자가 선택한 공정/차별점을 순서대로 노드화. 노드 3~7개. 새로운 단계 창작 금지.',
    defaultPayload: { diagramType: 'flow', title: '', nodes: [], edges: [], source: 'answer', sourceKey: 'processSteps' },
  },
  {
    key: 'timeline', labelKo: '일정/로드맵', icon: '📅', levelAllow: [3, 4],
    payloadSchema: [
      { key: 'title', labelKo: '제목', type: 'text' },
      {
        key: 'scope', labelKo: '범위', type: 'select',
        options: [{ value: 'agreement', labelKo: '협약기간 내' }, { value: 'overall', labelKo: '전체 사업단계' }],
      },
      { key: 'columns', labelKo: '컬럼', type: 'list' },
      {
        key: 'source', labelKo: '내용 원천', type: 'select',
        options: [{ value: 'ai', labelKo: 'AI 생성' }, { value: 'answer', labelKo: '사용자 답변' }, { value: 'static', labelKo: '고정' }],
      },
    ],
    promptFragment: '협약기간 내 일정과 전체 사업단계 일정을 구분. 기간은 분기 단위 표기.',
    defaultPayload: { title: '사업추진 일정', scope: 'agreement', columns: ['구분', '추진 내용', '추진 기간', '세부 내용'], source: 'ai' },
  },
  {
    key: 'visual', labelKo: '이미지', icon: '🖼️', levelAllow: [3, 4],
    payloadSchema: [
      {
        key: 'kind', labelKo: '종류', type: 'select',
        options: [{ value: 'generated', labelKo: 'AI 생성' }, { value: 'uploaded', labelKo: '업로드' }, { value: 'placeholder', labelKo: '자리표시' }],
      },
      { key: 'assetId', labelKo: '자산 ID(선택)', type: 'text' },
      { key: 'caption', labelKo: '캡션', type: 'text' },
      { key: 'alt', labelKo: '대체텍스트', type: 'text' },
      { key: 'generateHint', labelKo: 'AI 생성 지시(kind=generated일 때만)', type: 'text' },
    ],
    promptFragment: '캡션과 대체텍스트만 생성. 이미지 본체는 별도 파이프라인.',
    defaultPayload: { kind: 'placeholder', assetId: '', caption: '', alt: '', generateHint: '' },
  },
  {
    key: 'iconStats', labelKo: '아이콘형 시각화', icon: '🔢', levelAllow: [3, 4],
    payloadSchema: [
      { key: 'caption', labelKo: '상단 캡션(선택)', type: 'text' },
      { key: 'tiles', labelKo: '타일(2~4개)', type: 'list', maxItems: 4 },
      { key: 'maxTiles', labelKo: '최대 타일 수', type: 'number' },
    ],
    promptFragment: '타일 2~4개. metric은 짧은 숫자+단위(예: 73%, 2.6톤, 1조원). label은 20자 이내.',
    defaultPayload: { caption: '', tiles: [], maxTiles: 4 },
  },
  {
    key: 'callout', labelKo: '강조 박스', icon: '⚠️', levelAllow: [3, 4],
    payloadSchema: [
      { key: 'text', labelKo: '문구', type: 'textarea', required: true },
      {
        key: 'tone', labelKo: '톤', type: 'select',
        options: [{ value: 'warning', labelKo: '주의' }, { value: 'info', labelKo: '정보' }, { value: 'legal', labelKo: '법적 고지' }],
      },
      {
        key: 'icon', labelKo: '아이콘', type: 'select',
        options: [{ value: 'none', labelKo: '없음' }, { value: 'alert', labelKo: '경고' }, { value: 'info', labelKo: '정보' }, { value: 'shield', labelKo: '보호' }],
      },
    ],
    promptFragment: null, // AI 호출 대상 아님 — 관리자 고정 문구
    defaultPayload: { text: '', tone: 'warning', icon: 'none' },
  },
]

const EXPRESSION_TYPE_MAP: Record<string, ExpressionTypeDef> = {}
for (const t of EXPRESSION_TYPES) EXPRESSION_TYPE_MAP[t.key] = t

export function getExpressionType(key: string): ExpressionTypeDef | undefined {
  return EXPRESSION_TYPE_MAP[key]
}

export function isKnownExpressionType(key: string): boolean {
  return key === CATEGORY_HEADER_TYPE || !!EXPRESSION_TYPE_MAP[key]
}
