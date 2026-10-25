// ────────────────────────────────────────────────────
// 지원사업 구조 모듈 빌더 개편 P1 — 노드/구조 검증
// (기획서 §4-1 구조 무결성 규칙, §8-8 검증 패널 V001~V014, §12-2 point 3)
//
// 두 층위로 나눈다:
// - validateNode(node, ctx): 노드 하나만으로(+아주 가벼운 컨텍스트) 판단 가능한 규칙
//   (V003/V005/V006/V009/V011/V012/V013, 그리고 ctx.hasChildren이 주어지면 V004).
// - validateProgram(nodes): 트리 전체를 봐야 하는 규칙 — 구조 무결성(부모 존재·순환
//   없음·sort_key 중복·레벨 규칙) + V001/V002/V004/V007/V008/V010/V014 + 모든 노드에
//   대한 validateNode 결과 병합. nodes는 "같은 program_id"라고 가정한다.
// ────────────────────────────────────────────────────

import {
  ANSWER_KEYS, CATEGORY_HEADER_TYPE, CHART_COMPUTED_SOURCES, COMPUTED_KEY_WHITELIST,
  getExpressionType, type ExpressionTypeDef, type FieldSchema,
} from './moduleTypes.ts'

export type IssueLevel = 'error' | 'warn' | 'info'

export interface ValidationIssue {
  code: string
  level: IssueLevel
  message: string
  nodeId?: string
}

export interface GovNode {
  id: string
  programId: string
  parentId: string | null
  level: 1 | 2 | 3 | 4
  sortKey: string
  expressionType: string
  title?: string | null
  payload: Record<string, any>
  binding: 'static' | 'answer' | 'computed' | 'ai'
  bindingKey?: string | null
  targetChars?: number | null
  repeatConfig?: { enabled?: boolean; source?: string; max?: number } | null
  conditionConfig?: { enabled?: boolean; when?: string } | null
}

export interface ValidateNodeCtx {
  hasChildren?: boolean
  answerKeys?: readonly string[]
  computedKeyWhitelist?: readonly string[]
}

// §4-1 R-3/R-4 — 현재 14종 중 "자식 없이는 존재할 수 없는" 컨테이너 전용 타입은 없다
// (subhead/subhead2도 단독 허용). 향후 그런 타입이 추가되면 여기에 key를 등록하면
// V004가 바로 동작한다. export하는 이유는 테스트에서 V004 경로를 직접 확인하기 위함.
export const CONTAINER_ONLY_TYPES: string[] = []

function isEmptyValue(v: any): boolean {
  if (v === undefined || v === null) return true
  if (typeof v === 'string') return v.trim() === ''
  if (Array.isArray(v)) return v.length === 0
  return false
}

function typeOk(field: FieldSchema, value: any): boolean {
  if (value === undefined || value === null) return !field.required
  switch (field.type) {
    case 'text': case 'textarea': case 'select': case 'color': return typeof value === 'string'
    case 'number': return typeof value === 'number'
    case 'toggle': return typeof value === 'boolean'
    case 'list': case 'table': return Array.isArray(value)
    default: return true
  }
}

// §12-2 point 4 테스트 대상 — payload의 "구조(키·타입)"가 스키마와 맞는지만 본다.
// 필수 필드가 비어있는지(내용 완성도)는 보지 않는다 — 그건 V003의 몫이다. 갓 추가된
// 빈 기본값(defaultPayload)이 구조적으로는 유효하면서도 V003(내용 미완성)은 띄우는
// 것이 정상 동작이다 — 둘을 섞으면 "방금 추가한 모듈"과 "스키마 자체가 깨진 모듈"을
// 구분할 수 없다.
export function payloadMatchesSchema(expressionType: string, payload: Record<string, any>): boolean {
  const def = getExpressionType(expressionType)
  if (!def) return false
  return def.payloadSchema.every((f) => typeOk(f, payload?.[f.key]))
}

function estimateNodeTextLength(node: GovNode, def: ExpressionTypeDef | undefined): number {
  // V007/V014 전용 "대략치" — §6-8-3의 정식 블록 높이 추정식(분량 제어, P5.5)과는
  // 별개다. 여기서는 "이 구조에 글자를 채울 자리가 충분히 있는가"만 거칠게 가늠한다.
  const p = node.payload || {}
  switch (node.expressionType) {
    case 'headlineBox': case 'callout': return (p.text || '').length || 40
    case 'subhead': case 'subhead2': return 10
    case 'paragraph': return p.maxChars || 300
    case 'bullets': return (p.maxItems || 6) * 35
    case 'bulletsSummary': return (p.maxItems || 3) * 30
    case 'table': return ((p.rows?.length) || 3) * ((p.columns?.length) || 3) * 8
    case 'compareTable': return ((p.rows?.length) || 3) * 20
    case 'timeline': return ((p.columns?.length) || 4) * 4 * 10
    case 'iconStats': return ((p.tiles?.length) || p.maxTiles || 4) * 15
    case 'chart': case 'diagram': case 'visual': return 0
    default: return def ? 20 : 0
  }
}

export function validateNode(node: GovNode, ctx: ValidateNodeCtx = {}): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (node.level === 1) return issues // L1(categoryHeader)은 payload가 없는 시스템 노드 — 아래 규칙 대상 아님

  const def = getExpressionType(node.expressionType)
  const answerKeys = ctx.answerKeys || ANSWER_KEYS
  const computedKeyWhitelist = ctx.computedKeyWhitelist || COMPUTED_KEY_WHITELIST

  if (!def) {
    issues.push({ code: 'V_UNKNOWN_TYPE', level: 'error', message: `알 수 없는 표현방법: ${node.expressionType}`, nodeId: node.id })
    return issues
  }

  // V003 — payload 필수 필드 누락
  for (const f of def.payloadSchema) {
    if (f.required && isEmptyValue(node.payload?.[f.key])) {
      issues.push({ code: 'V003', level: 'error', message: `${def.labelKo}의 필수 필드 "${f.labelKo}"가 비어있습니다.`, nodeId: node.id })
    }
  }

  // V004 — 리프 노드인데 표현방법이 컨테이너 전용(subhead 단독은 허용)
  if (ctx.hasChildren === false && CONTAINER_ONLY_TYPES.includes(node.expressionType) && node.expressionType !== 'subhead') {
    issues.push({ code: 'V004', level: 'error', message: `"${def.labelKo}"는 컨테이너 전용 표현방법이라 자식 없이 존재할 수 없습니다.`, nodeId: node.id })
  }

  // V005 — binding=computed인데 bindingKey가 서버 계산 키 목록에 없음
  if (node.binding === 'computed' && (!node.bindingKey || !computedKeyWhitelist.includes(node.bindingKey as any))) {
    issues.push({ code: 'V005', level: 'error', message: `bindingKey "${node.bindingKey || ''}"는 서버 계산값 화이트리스트에 없습니다.`, nodeId: node.id })
  }

  // V006 — chart 모듈이 computedSource 없이 존재
  if (node.expressionType === 'chart') {
    const src = node.payload?.computedSource
    if (!src || !CHART_COMPUTED_SOURCES.includes(src)) {
      issues.push({ code: 'V006', level: 'error', message: `차트 모듈에 유효한 computedSource가 없습니다.`, nodeId: node.id })
    }
  }

  // V009 — bullets(/bulletsSummary) 항목이 maxItems 초과
  if (node.expressionType === 'bullets' || node.expressionType === 'bulletsSummary') {
    const items: any[] = node.payload?.items || []
    const maxItems = node.payload?.maxItems ?? (node.expressionType === 'bullets' ? 6 : 3)
    if (items.length > maxItems) {
      issues.push({ code: 'V009', level: 'warn', message: `항목이 ${items.length}개로 최대 ${maxItems}개를 초과했습니다.`, nodeId: node.id })
    }
  }

  // V011 — repeat 소스가 위저드 답변 스키마에 존재하지 않음
  const repeatSource = node.repeatConfig?.enabled ? node.repeatConfig.source : undefined
  if (repeatSource && !answerKeys.includes(repeatSource as any)) {
    issues.push({ code: 'V011', level: 'warn', message: `반복 소스 "${repeatSource}"는 위저드 답변 키 목록에 없습니다.`, nodeId: node.id })
  }

  // V012 — condition의 when 키가 위저드 답변 스키마에 존재하지 않음
  const conditionWhen = node.conditionConfig?.enabled ? node.conditionConfig.when : undefined
  if (conditionWhen && !answerKeys.includes(conditionWhen as any)) {
    issues.push({ code: 'V012', level: 'warn', message: `조건 키 "${conditionWhen}"는 위저드 답변 키 목록에 없습니다.`, nodeId: node.id })
  }

  // V013 — 텍스트 길이 제한 초과 (제목 30자, bullet 항목 60자 등)
  if (node.title && node.title.length > 30) {
    issues.push({ code: 'V013', level: 'warn', message: `제목이 ${node.title.length}자로 30자를 초과했습니다.`, nodeId: node.id })
  }
  if (node.expressionType === 'bullets' || node.expressionType === 'bulletsSummary') {
    const items: string[] = node.payload?.items || []
    const tooLong = items.filter((s) => (s || '').length > 60)
    if (tooLong.length) {
      issues.push({ code: 'V013', level: 'warn', message: `불릿 항목 ${tooLong.length}개가 60자를 초과했습니다.`, nodeId: node.id })
    }
  }

  return issues
}

export function validateProgram(nodes: GovNode[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const childrenOf = new Map<string, GovNode[]>()
  for (const n of nodes) {
    if (!n.parentId) continue
    if (!childrenOf.has(n.parentId)) childrenOf.set(n.parentId, [])
    childrenOf.get(n.parentId)!.push(n)
  }

  // ── 구조 무결성 ──────────────────────────────────
  for (const n of nodes) {
    if (n.parentId && !byId.has(n.parentId)) {
      issues.push({ code: 'STRUCT_NO_PARENT', level: 'error', message: `부모 노드(${n.parentId})가 존재하지 않습니다.`, nodeId: n.id })
    }
    if (n.level < 1 || n.level > 4) {
      issues.push({ code: 'STRUCT_LEVEL', level: 'error', message: `level은 1~4 사이여야 합니다 (현재 ${n.level}).`, nodeId: n.id })
    }
    if (n.level === 1 && n.parentId) {
      issues.push({ code: 'STRUCT_LEVEL', level: 'error', message: `대분류(L1)는 부모가 없어야 합니다.`, nodeId: n.id })
    }
    if (n.level > 1) {
      const parent = n.parentId ? byId.get(n.parentId) : undefined
      if (parent && parent.level !== n.level - 1) {
        issues.push({ code: 'STRUCT_LEVEL', level: 'error', message: `레벨 불일치 — 부모는 level ${parent.level}, 자식은 level ${n.level}.`, nodeId: n.id })
      }
      // R-2: L1은 반드시 L2만 자식으로 갖는다
      if (parent && parent.level === 1 && n.level !== 2) {
        issues.push({ code: 'STRUCT_LEVEL', level: 'error', message: `대분류(L1)의 자식은 중분류(L2)여야 합니다.`, nodeId: n.id })
      }
    }
  }

  // 순환 없음 — 각 노드에서 parent를 따라 올라가며 자기 자신을 다시 만나면 순환
  for (const n of nodes) {
    const seen = new Set<string>()
    let cur: GovNode | undefined = n
    while (cur?.parentId) {
      if (seen.has(cur.id)) {
        issues.push({ code: 'STRUCT_CYCLE', level: 'error', message: `순환 참조가 감지됐습니다.`, nodeId: n.id })
        break
      }
      seen.add(cur.id)
      cur = byId.get(cur.parentId)
      if (!cur) break
    }
  }

  // sort_key 중복 — 같은 부모(또는 L1끼리, parentId=null) 아래 형제 간 유일해야 함
  const siblingGroups = new Map<string, GovNode[]>()
  for (const n of nodes) {
    const groupKey = n.parentId ?? `__root_${n.programId}`
    if (!siblingGroups.has(groupKey)) siblingGroups.set(groupKey, [])
    siblingGroups.get(groupKey)!.push(n)
  }
  for (const siblings of siblingGroups.values()) {
    const seenKeys = new Map<string, number>()
    for (const n of siblings) seenKeys.set(n.sortKey, (seenKeys.get(n.sortKey) || 0) + 1)
    for (const n of siblings) {
      if ((seenKeys.get(n.sortKey) || 0) > 1) {
        issues.push({ code: 'STRUCT_DUP_SORT_KEY', level: 'error', message: `형제 노드 사이에 sort_key("${n.sortKey}")가 중복됩니다.`, nodeId: n.id })
      }
    }
  }

  // ── V001/V002 ────────────────────────────────────
  const l1Nodes = nodes.filter((n) => n.level === 1)
  if (!l1Nodes.length) {
    issues.push({ code: 'V001', level: 'error', message: '대분류(L1)가 없습니다.' })
  }
  for (const l1 of l1Nodes) {
    const l2Children = (childrenOf.get(l1.id) || []).filter((c) => c.level === 2)
    if (!l2Children.length) {
      issues.push({ code: 'V002', level: 'error', message: `대분류 "${l1.title}"에 중분류(L2)가 하나도 없습니다.`, nodeId: l1.id })
    }
  }

  // ── 노드별 검증(V003/V005/V006/V009/V011/V012/V013) + V004 ─────────
  for (const n of nodes) {
    const ctx: ValidateNodeCtx = { hasChildren: (childrenOf.get(n.id) || []).length > 0 }
    issues.push(...validateNode(n, ctx))
  }

  // ── V007/V008/V010/V014 — 대분류 단위 집계 ──────────
  function descendantsOf(nodeId: string): GovNode[] {
    const out: GovNode[] = []
    const stack = [...(childrenOf.get(nodeId) || [])]
    while (stack.length) {
      const cur = stack.pop()!
      out.push(cur)
      stack.push(...(childrenOf.get(cur.id) || []))
    }
    return out
  }

  let totalEstimatedChars = 0
  for (const l1 of l1Nodes) {
    const desc = descendantsOf(l1.id)
    const estimatedChars = desc.reduce((sum, n) => sum + estimateNodeTextLength(n, getExpressionType(n.expressionType)), 0)
    totalEstimatedChars += estimatedChars

    // V007 — 목표 글자수 대비 배정된 모듈의 권장 글자수 합계가 60% 미만
    if (l1.targetChars && l1.targetChars > 0 && estimatedChars < l1.targetChars * 0.6) {
      issues.push({
        code: 'V007', level: 'warn',
        message: `대분류 "${l1.title}" 목표 ${l1.targetChars}자 대비 배정된 모듈의 추정 글자수(${estimatedChars}자)가 60% 미만입니다.`,
        nodeId: l1.id,
      })
    }

    // V010 — ai 바인딩 비율이 대분류 내 80% 초과
    if (desc.length) {
      const aiCount = desc.filter((n) => n.binding === 'ai').length
      if (aiCount / desc.length > 0.8) {
        issues.push({
          code: 'V010', level: 'warn',
          message: `대분류 "${l1.title}" 내 ai 바인딩 비율이 ${Math.round((aiCount / desc.length) * 100)}%로 80%를 초과했습니다 — 사실 근거 부족 위험.`,
          nodeId: l1.id,
        })
      }
    }

  }

  // V008 — headlineBox가 한 그룹(아무 레벨이든, 자신+직속 자식 기준)에 2개 이상 —
  // level 2(중분류)/3(소분류)/4(소소분류) 구분 없이 "자식을 가진 노드"마다 체크한다
  // (3→4단계 확장에서 어느 깊이든 그룹 역할을 할 수 있으므로 레벨 번호에 의존하지 않음).
  for (const [parentId, children] of childrenOf) {
    const parent = byId.get(parentId)
    if (!parent) continue
    const headlineCount = (parent.expressionType === 'headlineBox' ? 1 : 0) + children.filter((c) => c.expressionType === 'headlineBox').length
    if (headlineCount >= 2) {
      issues.push({ code: 'V008', level: 'warn', message: `그룹 "${parent.title}"에 headlineBox가 ${headlineCount}개 있습니다.`, nodeId: parent.id })
    }
  }

  // V014 — 이 구조로 생성 시 예상 총 글자수(정보)
  issues.push({ code: 'V014', level: 'info', message: `이 구조로 생성 시 예상 총 글자수: 약 ${totalEstimatedChars}자` })

  return issues
}
