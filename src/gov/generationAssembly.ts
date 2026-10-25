// ────────────────────────────────────────────────────
// 지원사업 구조 모듈 빌더 개편 P4 — 생성 파이프라인 조립 로직 (순수 함수만)
// (기획서 §11-2/§11-3/§11-4/§11-5, §12-5)
//
// 이 파일은 DB·네트워크를 전혀 건드리지 않는다 — 트리를 받아 AI 호출용 스키마/프롬프트
// 조각을 만들고, AI 응답(또는 테스트에서는 가짜 응답)을 받아 최종 렌더 블록으로
// 합치는 "조립" 로직만 담당한다. index.tsx가 DB 로딩과 실제 Claude API 호출을
// 맡고, 이 파일의 함수들을 호출해 조립한다 — 이렇게 나눠야 Node 테스트 러너로
// (API 키 없이도) 이 로직을 직접 검증할 수 있다.
//
// §11-5(검증 후처리) 중 1~8단계(파싱/스키마검증은 호출부, 여기서는 3~6·8단계)를
// 구현한다. v1.1 전용(9~12단계 — 마커 강제부착/No-Empty Gate/차별화반영검증)은
// P4.5 몫이라 이 파일 범위 밖이다.
// ────────────────────────────────────────────────────

import { getExpressionType, CATEGORY_HEADER_TYPE, type ExpressionTypeDef } from './moduleTypes.ts'
import type { GovNode } from './validate.ts'

// 2026-10-24(4단계 확장): 대분류(L1)/중분류(L2)/소분류(L3)/소소분류(L4) — L1 아래로는
// 임의 깊이(최대 4)로 재귀 중첩된다. CategoryTree.node가 L1, 그 아래 NodeTree가
// L2~L4를 전부 표현한다(어느 깊이든 "그룹(자식 보유)" 역할과 "콘텐츠(리프)" 역할을
// 동시에 또는 둘 중 하나만 가질 수 있다 — 기존 L2가 그랬던 것과 동일한 유연성을
// 한 단계 더 유지한다). GroupTree는 과거 이름을 그대로 쓰는 외부 참조가 있을 수 있어
// NodeTree의 별칭으로 남겨둔다.
export interface CategoryTree {
  node: GovNode // level 1
  children: NodeTree[]
}
export interface NodeTree {
  node: GovNode // level 2~4
  children: NodeTree[]
}
export type GroupTree = NodeTree

// ── 트리 조립 ──────────────────────────────────────
export function buildCategoryTrees(nodes: GovNode[]): CategoryTree[] {
  const byParent = new Map<string | null, GovNode[]>()
  for (const n of nodes) {
    const key = n.parentId
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(n)
  }
  for (const list of byParent.values()) list.sort((a, b) => (a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : 0))

  function attach(n: GovNode): NodeTree {
    return { node: n, children: (byParent.get(n.id) || []).map(attach) }
  }
  const l1s = byParent.get(null) || []
  return l1s.map((l1) => ({ node: l1, children: (byParent.get(l1.id) || []).map(attach) }))
}

// ── 반복(repeat) 확장 — repeat.source 배열 길이만큼 노드를 복제한다. §11-3 ──
// answers에서 repeat.source 키가 배열이 아니거나 없으면 반복 없이 노드 1개 그대로.
export function expandRepeat(node: GovNode, answers: Record<string, any>): { node: GovNode; repeatIndex: number | null; moduleId: string }[] {
  const rc = node.repeatConfig
  if (!rc || !rc.enabled || !rc.source) return [{ node, repeatIndex: null, moduleId: moduleIdFor(node.id, null) }]
  const arr = answers?.[rc.source]
  if (!Array.isArray(arr) || !arr.length) return [{ node, repeatIndex: null, moduleId: moduleIdFor(node.id, null) }]
  const max = rc.max && rc.max > 0 ? Math.min(rc.max, arr.length) : arr.length
  return Array.from({ length: max }, (_, i) => ({ node, repeatIndex: i, moduleId: moduleIdFor(node.id, i) }))
}

// moduleId는 반복 전개된 각 사본을 구분해야 하므로 "원본id" 또는 "원본id#index"로 만든다.
export function moduleIdFor(nodeId: string, repeatIndex: number | null): string {
  return repeatIndex == null ? nodeId : `${nodeId}#${repeatIndex}`
}

// ── 어떤 노드가 "AI가 생성해야 하는 모듈"인가 ──────────────────────────
// binding이 'ai'여도 표현방법 자체가 AI 대상이 아니면(promptFragment===null — chart/callout)
// 제외한다 — 관리자가 바인딩을 잘못 설정해도 스키마가 깨지지 않도록 하는 방어.
export function isAiGeneratedNode(node: GovNode): boolean {
  if (node.binding !== 'ai') return false
  const def = getExpressionType(node.expressionType)
  return !!def && def.promptFragment !== null
}

// 대분류(L1) 하나 아래의 L2~L4를 트리 순서(깊이우선)로 평면화하고, 반복 모듈은 전개한다.
// 깊이는 더 이상 고정 2단계가 아니라 재귀로 임의 깊이(최대 4)를 그대로 따라간다.
export interface FlatEntry {
  node: GovNode
  repeatIndex: number | null
  moduleId: string
  depth: 2 | 3 | 4
  siblingIndex: number // 같은 부모 아래에서 몇 번째인지(0-base) — 자동 번호 매김용
}
export function flattenCategory(cat: CategoryTree, answers: Record<string, any>): FlatEntry[] {
  const out: FlatEntry[] = []
  function walk(trees: NodeTree[], depth: 2 | 3 | 4) {
    trees.forEach((t, idx) => {
      for (const { node, repeatIndex } of expandRepeat(t.node, answers)) {
        out.push({ node, repeatIndex, moduleId: moduleIdFor(t.node.id, repeatIndex), depth, siblingIndex: idx })
      }
      if (depth < 4) walk(t.children, (depth + 1) as 3 | 4)
    })
  }
  walk(cat.children, 2)
  return out
}

// ── 자동 번호 — AI가 매기지 않고 트리 형제 순서에서 결정론적으로 계산한다 ──
const KOREAN_ORDINALS = ['가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하']
const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳']

export function formatAutoNumber(numberStyle: string | undefined, l1Index: number, siblingIndex: number): string {
  const n = siblingIndex + 1
  switch (numberStyle) {
    case 'korean': return KOREAN_ORDINALS[siblingIndex] ? `${KOREAN_ORDINALS[siblingIndex]}.` : `${n}.`
    case 'circled': return CIRCLED[siblingIndex] || `(${n})`
    case 'paren': return `${n})`
    case 'numeric':
    default: return `${l1Index}-${n}.`
  }
}

// ── 작업 C: AI 응답 JSON 스키마(대분류 그룹 단위) ──────────────────────
// static/answer/computed 모듈은 스키마에서 완전히 제외 — 토큰 절약 + 환각 원천 차단.
// 타입별로 "AI가 실제로 채울 필드"만 노출한다(관리자가 설정하는 톤/정렬/아이콘종류 등은
// 스키마에 넣지 않는다 — 그런 설정은 admin payload에 이미 있고 렌더 시 그대로 쓴다).
// 2026-10-23~24: table/timeline.rows(원래 array<array<string>>)가 400 "Schema is too
// complex for compilation"에 걸려 한때 행마다 JSON 문자열로 직렬화하는 우회를 썼었다.
// 진짜 원인은 스키마가 아니라 anthropic-version 헤더가 구버전으로 고정돼 있던 것으로
// 밝혀져(gsCallClaudeWithSchema 쪽 주석 참고) rows는 다시 자연스러운 string[][]로
// 되돌렸다. decodeTableRows()는 혹시 모를 과거 형태(JSON 문자열 행) 응답도 안전하게
// 수용하는 방어적 변환으로 남겨둔다 — 정상 응답(중첩 배열)은 그대로 통과시킨다.
export function decodeTableRows(raw: any): string[][] {
  if (!Array.isArray(raw)) return []
  return raw.map((r) => {
    if (Array.isArray(r)) return r.map(String) // 혹시 모델이 예전 형태(중첩 배열)로 주면 그대로 수용
    if (typeof r !== 'string') return [String(r)]
    try {
      const parsed = JSON.parse(r)
      return Array.isArray(parsed) ? parsed.map(String) : [r]
    } catch {
      return [r]
    }
  })
}

const AI_FIELD_SCHEMA: Record<string, { properties: Record<string, any>; required: string[] }> = {
  headlineBox: { properties: { text: { type: 'string' } }, required: ['text'] },
  subhead: { properties: { text: { type: 'string' } }, required: ['text'] },
  subhead2: { properties: { text: { type: 'string' } }, required: ['text'] },
  paragraph: { properties: { text: { type: 'string' } }, required: ['text'] },
  bullets: { properties: { items: { type: 'array', items: { type: 'string' } } }, required: ['items'] },
  bulletsSummary: { properties: { items: { type: 'array', items: { type: 'string' } } }, required: ['items'] },
  table: {
    properties: { rows: { type: 'array', items: { type: 'array', items: { type: 'string' } } } },
    required: ['rows'],
  },
  compareTable: {
    properties: { rows: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, values: { type: 'object' } }, required: ['label', 'values'], additionalProperties: false } } },
    required: ['rows'],
  },
  diagram: {
    properties: {
      nodes: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, label: { type: 'string' } }, required: ['id', 'label'], additionalProperties: false } },
      edges: { type: 'array', items: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' } }, required: ['from', 'to'], additionalProperties: false } },
    },
    required: ['nodes', 'edges'],
  },
  timeline: {
    properties: { rows: { type: 'array', items: { type: 'array', items: { type: 'string' } } } },
    required: ['rows'],
  },
  iconStats: {
    properties: { tiles: { type: 'array', items: { type: 'object', properties: { icon: { type: 'string' }, value: { type: 'string' }, label: { type: 'string' } }, required: ['icon', 'value', 'label'], additionalProperties: false } } },
    required: ['tiles'],
  },
  visual: { properties: { caption: { type: 'string' }, alt: { type: 'string' } }, required: ['caption', 'alt'] },
}

function moduleBlockSchema(entry: FlatEntry) {
  const spec = AI_FIELD_SCHEMA[entry.node.expressionType]
  if (!spec) return null
  return {
    type: 'object',
    properties: { moduleId: { type: 'string', const: entry.moduleId }, ...spec.properties },
    required: ['moduleId', ...spec.required],
    additionalProperties: false,
  }
}

// 그룹(대분류 최대 2개) 전체에 대한 응답 스키마 — 기존 gsSectionsSchema와 같은
// {sections:[...]} 뼈대를 그대로 쓰되, blocks의 판별자가 type이 아니라 moduleId다.
export function buildGroupResponseSchema(categories: CategoryTree[], answers: Record<string, any>) {
  const categoryIds = categories.map((c) => c.node.id)
  const allModuleSchemas = categories.flatMap((c) =>
    flattenCategory(c, answers).filter((e) => isAiGeneratedNode(e.node)).map(moduleBlockSchema).filter((s): s is NonNullable<typeof s> => !!s)
  )
  return {
    type: 'object',
    properties: {
      sections: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          properties: {
            categoryId: { type: 'string', enum: categoryIds },
            blocks: { type: 'array', items: allModuleSchemas.length ? { anyOf: allModuleSchemas } : { type: 'object' } },
          },
          required: ['categoryId', 'blocks'],
          additionalProperties: false,
        },
      },
    },
    required: ['sections'],
    additionalProperties: false,
  }
}

// ── 작업 B: 프롬프트 구조 블록(바인딩별 지시 포함) ─────────────────────
function bindingInstruction(node: GovNode): string {
  switch (node.binding) {
    case 'static': return '고정값 — 생성하지 말 것. 그대로 사용된다.'
    case 'answer': return '사용자 답변값을 그대로 삽입 — 생성 금지.'
    case 'computed': return '서버 계산값을 그대로 인용 — 재계산 절대 금지.'
    case 'ai': default: return '생성 대상.'
  }
}

// 2026-10-24(4단계 확장): 고정 2단계(그룹/리프) 순회를 재귀로 바꾼다. "그룹처럼
// 자식을 가진 노드"는 moduleId 없이 제목·바인딩·지시만 보여주고(기존 L2와 동일 동작),
// "자식이 없는 노드(실제 리프)"만 moduleId를 보여준다 — 깊이 번호(2/3/4)가 아니라
// "자식 보유 여부"로 그룹/리프를 가른다. 기존 3단계 트리에서는 이 두 기준이 항상
// 일치했으므로(L2=그룹, L3=리프) 동작이 그대로 보존되고, 4단계 트리에서는 어느
// 깊이에서 가지가 끝나든 올바르게 moduleId가 노출된다.
export function buildCategoryStructureText(cat: CategoryTree, answers: Record<string, any>): string {
  const lines: string[] = [`[${cat.node.title}] (목표 ${cat.node.targetChars || '제한없음'}자)`]
  function walk(trees: NodeTree[], indent: string) {
    trees.forEach((t) => {
      const n = t.node
      const def = getExpressionType(n.expressionType)
      if (t.children.length === 0) {
        const entries = expandRepeat(n, answers)
        entries.forEach(({ repeatIndex }) => {
          const idSuffix = repeatIndex == null ? '' : ` (반복 ${repeatIndex + 1}번째)`
          lines.push(`${indent}- (moduleId="${moduleIdFor(n.id, repeatIndex)}") "${n.title || ''}"${idSuffix} [${def?.labelKo || n.expressionType}] — ${bindingInstruction(n)}`)
          if (isAiGeneratedNode(n) && def?.promptFragment) lines.push(`${indent}  지시: ${def.promptFragment}`)
          const hint = n.payload?.text || n.payload?.caption
          if (hint) lines.push(`${indent}  참고(관리자가 적어둔 힌트/제목/캡션): ${hint}`)
        })
      } else {
        lines.push(`${indent}- "${n.title || ''}" [${def?.labelKo || n.expressionType}] — ${bindingInstruction(n)}`)
        if (isAiGeneratedNode(n) && def?.promptFragment) lines.push(`${indent}  지시: ${def.promptFragment}`)
      }
      walk(t.children, indent + '  ')
    })
  }
  walk(cat.children, '')
  return lines.join('\n')
}

// 2026-10-24: structured outputs(그룹 응답을 moduleId별 anyOf로 강제)를 걷어내고
// 프롬프트 기반 JSON으로 되돌리면서, 모델이 UUID 형태인 moduleId 문자열을 응답에
// 정확히 그대로 베껴 쓰지 못해(살짝 다르게 쓰거나 생략) blocks가 전부 "AI 응답에
// 해당 moduleId가 없음"으로 빠지는 사례가 생겼다(스테이징 실측 — 관리자 힌트
// 텍스트만 그대로 나옴). moduleId가 정확히 일치하는 것만 먼저 매칭하고, 남는
// 것은 프롬프트에 나열한 순서(=flattenCategory 순서, buildCategoryStructureText와
// 동일 순회)대로 AI 응답의 남은 블록을 순서대로 배정하는 보정을 추가한다.
export function buildAiBlocksByModuleId(cat: CategoryTree, answers: Record<string, any>, aiBlocks: any[]): Map<string, any> {
  const expectedIds = flattenCategory(cat, answers).filter((e) => isAiGeneratedNode(e.node)).map((e) => e.moduleId)
  const blocks = Array.isArray(aiBlocks) ? aiBlocks : []
  const map = new Map<string, any>()
  const usedIdx = new Set<number>()
  for (const id of expectedIds) {
    const idx = blocks.findIndex((b: any, i: number) => b?.moduleId === id && !usedIdx.has(i))
    if (idx !== -1) { map.set(id, blocks[idx]); usedIdx.add(idx) }
  }
  const leftover = blocks.filter((_: any, i: number) => !usedIdx.has(i))
  let li = 0
  for (const id of expectedIds) {
    if (map.has(id)) continue
    if (li < leftover.length) map.set(id, leftover[li++])
  }
  return map
}

// ── 작업 E(일부): 후처리 — AI 블록을 moduleId로 찾아 merge, 없으면 생략/경고 ──
export interface MergedBlock {
  type: string
  [key: string]: any
}
export interface MergeWarning { moduleId: string; reason: string }

export interface ComputedResolver {
  (bindingKey: string | null | undefined): any
}

function staticOrAnswerValue(node: GovNode, answers: Record<string, any>, repeatIndex: number | null): any {
  if (node.binding === 'answer' && node.bindingKey) {
    const v = answers?.[node.bindingKey]
    return repeatIndex != null && Array.isArray(v) ? v[repeatIndex] : v
  }
  return node.payload // static(및 기본값) — payload를 그대로 렌더 입력으로 쓴다
}

// aiBlocksByModuleId: Claude가 돌려준 blocks를 moduleId로 색인한 Map (호출부가 만든다)
//
// 2026-10-24: 자동 번호(subhead/subhead2의 autoNumber)를 "같은 부모 아래 몇 번째인지"
// (groupIdx/leafIdx, 번호 없는 형제도 그대로 센다)로 매겼더니, 번호 없는 headlineBox/
// iconStats/bullets 등이 사이에 끼어있을 때마다 보이는 번호가 1-2,1-3,1-4,1-5,1-7,
// 1-16... 처럼 듬성듬성 건너뛰었다(스테이징 실제 생성으로 확인). 실제 번호가 붙는
// 노드만 세는 별도 카운터로 바꿔 1-1,1-2,1-3...처럼 끊기지 않게 한다.
export function mergeCategoryBlocks(
  cat: CategoryTree, aiBlocksByModuleId: Map<string, any>, answers: Record<string, any>,
  resolveComputed: ComputedResolver, l1Index: number
): { blocks: MergedBlock[]; warnings: MergeWarning[] } {
  const warnings: MergeWarning[] = []
  let autoNumberCounter = 0
  const blocks = flattenCategory(cat, answers).map((entry) => {
    const isNumbered = (entry.node.expressionType === 'subhead' || entry.node.expressionType === 'subhead2') && !!entry.node.payload?.autoNumber
    const autoNumberIndex = isNumbered ? autoNumberCounter++ : -1
    return buildOneBlock(entry.node, entry.moduleId, entry.repeatIndex, aiBlocksByModuleId, answers, resolveComputed, warnings, l1Index, autoNumberIndex)
  })
  return { blocks: blocks.filter((b): b is MergedBlock => !!b), warnings }
}

function buildOneBlock(
  node: GovNode, moduleId: string, repeatIndex: number | null, aiBlocksByModuleId: Map<string, any>,
  answers: Record<string, any>, resolveComputed: ComputedResolver, warnings: MergeWarning[], l1Index: number, siblingIndex: number
): MergedBlock {
  const def = getExpressionType(node.expressionType)
  const base: MergedBlock = { type: node.expressionType }

  // subhead/subhead2 자동 번호 — payload에 남겨둔 텍스트 뒤에 붙이지 않고, 번호를
  // 별도 필드로 둬서 렌더러가 조합한다(§11-6).
  if ((node.expressionType === 'subhead' || node.expressionType === 'subhead2') && node.payload?.autoNumber) {
    base.number = formatAutoNumber(node.payload?.numberStyle, l1Index, siblingIndex)
  }

  if (node.binding === 'computed') {
    const value = resolveComputed(node.bindingKey)
    if (value == null) warnings.push({ moduleId, reason: `computed 값(${node.bindingKey})을 찾지 못함` })
    Object.assign(base, value || {})
    return base
  }
  if (node.binding === 'static' || node.binding === 'answer') {
    Object.assign(base, staticOrAnswerValue(node, answers, repeatIndex))
    return base
  }

  // binding === 'ai' — 먼저 관리자가 설정해둔 payload(예: visual의 visualId/kind,
  // headlineBox의 tone/align 등 "콘텐츠가 아니라 표현 설정")를 그대로 깔고, 그 위에
  // AI가 생성한 필드(AI_FIELD_SCHEMA에 정의된 것만)를 덮어쓴다. 이걸 빼먹으면 예를
  // 들어 visual의 visualId="process-flow"가 사라져 공정도 이미지가 안 뜨는 등,
  // AI 호출과 무관한 관리자 설정값까지 같이 날아간다.
  Object.assign(base, node.payload || {})
  if (!isAiGeneratedNode(node)) {
    // chart/callout처럼 binding=ai로 잘못 설정됐지만 AI 대상이 아닌 타입 — payload 그대로.
    return base
  }
  const ai = aiBlocksByModuleId.get(moduleId)
  if (!ai) {
    warnings.push({ moduleId, reason: 'AI 응답에 해당 moduleId가 없음' })
    // §11-5 item6 상당 — payload에 이미 있는 관리자 힌트(text/items)는 위에서 깔렸으니
    // 그대로 유지되고, 별도로 더 채울 건 없다.
    return base
  }
  const spec = AI_FIELD_SCHEMA[node.expressionType]
  if (spec) for (const key of Object.keys(spec.properties)) if (ai[key] !== undefined) base[key] = ai[key]
  if ((node.expressionType === 'table' || node.expressionType === 'timeline') && base.rows !== undefined) {
    base.rows = decodeTableRows(base.rows)
  }

  // §11-5 item6 — bullets/bulletsSummary 최소 요건, iconStats 4개 절단
  if ((node.expressionType === 'bullets' || node.expressionType === 'bulletsSummary') && Array.isArray(base.items)) {
    if (base.items.length < 2) warnings.push({ moduleId, reason: `항목이 ${base.items.length}개뿐(최소 권장 2개)` })
  }
  if (node.expressionType === 'iconStats' && Array.isArray(base.tiles) && base.tiles.length > 4) {
    base.tiles = base.tiles.slice(0, 4)
  }
  return base
}

export const GS14_AI_FIELD_SCHEMA = AI_FIELD_SCHEMA
