// ────────────────────────────────────────────────────
// 지원사업 구조 모듈 빌더 개편 P2 — 빌더 API (§10-5, §12-3)
//
// §10-5 전체 API 목록 중 "구조 트리 CRUD + 발행 + 검증"만 이번 단계 범위다. §14
// 마이그레이션 계획의 phase 표가 템플릿/버전/양식추출/import-export는 P5(프롬프트6),
// 미리보기 생성은 P4(프롬프트5)로 따로 떼어뒀기 때문이다(12-3 프롬프트 본문은
// §10-5 전체를 나열하지만, phase 표의 완료 조건은 "curl 시나리오 + 동시 편집 409"만
// 요구한다 — 둘이 서로 다른 레벨의 스코프를 말하고 있어 phase 표를 따랐다).
// 그래서 /templates, /versions, /source-docs, /export, /import, /answer-sets,
// /preview-generate는 이번 커밋에 없다 — 각자의 phase에서 추가한다.
//
// index.tsx의 기존 /api/admin/gov-support/* (section/item 2단계 CRUD, P0 이전부터
// 있던 구버전)는 그대로 둔다 — 이 새 /api/admin/gov/* 가 대체하는 건 P3(빌더 UI)에서
// admin02의 "지원사업" 탭이 새 빌더로 바뀔 때다. 두 API는 당분간 같은 DB를 각자
// 다른 테이블(gov_support_sections/items vs gov_support_nodes)로 읽고 쓰므로 서로
// 충돌하지 않는다.
// ────────────────────────────────────────────────────

import { Hono } from 'hono'
import { validateProgram, type GovNode, type ValidationIssue } from './validate.ts'
import { isKnownExpressionType, CATEGORY_HEADER_TYPE } from './moduleTypes.ts'
import { between } from './sortKey.ts'

type GovBindings = { LOOKBOOK_DB: D1Database; ADMIN_PASSWORD: string }
const gov = new Hono<{ Bindings: GovBindings }>()

const adminAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('X-Admin-Password')
  const adminPassword = c.env.ADMIN_PASSWORD
  if (!adminPassword) {
    return c.json({ success: false, message: '서버 설정 오류: ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.' }, 500)
  }
  if (authHeader !== adminPassword) {
    return c.json({ success: false, message: '인증 실패' }, 401)
  }
  await next()
}
gov.use('/*', adminAuth)

// ── 공통 헬퍼 ──────────────────────────────────────

function safeJsonParse<T>(text: any, fallback: T): T {
  if (text == null) return fallback
  try {
    return JSON.parse(text)
  } catch {
    return fallback
  }
}

function rowToGovNode(r: any): GovNode {
  return {
    id: r.id,
    programId: r.program_id,
    parentId: r.parent_id,
    level: r.level,
    sortKey: r.sort_key,
    expressionType: r.expression_type,
    title: r.title,
    payload: safeJsonParse(r.payload, {}),
    binding: r.binding,
    bindingKey: r.binding_key,
    targetChars: r.target_chars,
    repeatConfig: safeJsonParse(r.repeat_config, null),
    conditionConfig: safeJsonParse(r.condition_config, null),
  }
}

async function loadProgramNodes(db: D1Database, programId: string): Promise<{ rows: any[]; nodes: GovNode[] }> {
  const rows = ((await db.prepare(
    `SELECT * FROM gov_support_nodes WHERE program_id = ? ORDER BY level, sort_key`
  ).bind(programId).all()).results || []) as any[]
  return { rows, nodes: rows.map(rowToGovNode) }
}

function maxUpdatedAt(rows: any[]): number {
  return rows.reduce((m, r) => Math.max(m, Number(r.updated_at) || 0), 0)
}

function buildTree(nodes: GovNode[]): any[] {
  const byParent = new Map<string | null, GovNode[]>()
  for (const n of nodes) {
    const key = n.parentId
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(n)
  }
  for (const list of byParent.values()) list.sort((a, b) => (a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : 0))

  function attach(n: GovNode): any {
    const children = (byParent.get(n.id) || []).map(attach)
    return { ...n, children }
  }
  return (byParent.get(null) || []).map(attach)
}

async function writeAuditLog(
  db: D1Database, programId: string, nodeId: string | null, action: string,
  before: any, after: any, author: string | null
) {
  await db.prepare(
    `INSERT INTO gov_support_audit_log (id, program_id, node_id, node_path, action, before_json, after_json, author, created_at)
     VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?)`
  ).bind(
    crypto.randomUUID(), programId, nodeId, action,
    before != null ? JSON.stringify(before) : null,
    after != null ? JSON.stringify(after) : null,
    author, Date.now()
  ).run()
}

function descendantIds(nodes: GovNode[], rootId: string): string[] {
  const byParent = new Map<string | null, GovNode[]>()
  for (const n of nodes) {
    if (!byParent.has(n.parentId)) byParent.set(n.parentId, [])
    byParent.get(n.parentId)!.push(n)
  }
  const out: string[] = []
  const stack = [...(byParent.get(rootId) || [])]
  while (stack.length) {
    const cur = stack.pop()!
    out.push(cur.id)
    stack.push(...(byParent.get(cur.id) || []))
  }
  return out
}

// ── GET /programs — 프로그램별 구조 상태 + 레벨별 노드 수 ──────────

gov.get('/programs', async (c) => {
  const db = c.env.LOOKBOOK_DB
  const countRows = ((await db.prepare(
    `SELECT program_id, level, COUNT(*) as cnt FROM gov_support_nodes GROUP BY program_id, level`
  ).all()).results || []) as any[]
  const configRows = ((await db.prepare(
    `SELECT program_id, structure_status, published_at, published_version FROM gov_support_config`
  ).all()).results || []) as any[]

  const byProgram = new Map<string, { nodeCounts: Record<string, number> }>()
  for (const r of countRows) {
    if (!byProgram.has(r.program_id)) byProgram.set(r.program_id, { nodeCounts: {} })
    byProgram.get(r.program_id)!.nodeCounts[String(r.level)] = r.cnt
  }
  const configByProgram = new Map(configRows.map((r) => [r.program_id, r]))

  const programIds = new Set([...byProgram.keys(), ...configByProgram.keys()])
  const programs = Array.from(programIds).map((programId) => ({
    programId,
    nodeCounts: byProgram.get(programId)?.nodeCounts || {},
    structureStatus: configByProgram.get(programId)?.structure_status || 'draft',
    publishedAt: configByProgram.get(programId)?.published_at || null,
    publishedVersion: configByProgram.get(programId)?.published_version || null,
  }))
  return c.json({ success: true, programs })
})

// ── GET /programs/:programId/structure — 전체 3단계 트리 ──────────

gov.get('/programs/:programId/structure', async (c) => {
  const db = c.env.LOOKBOOK_DB
  const programId = c.req.param('programId')
  const { rows, nodes } = await loadProgramNodes(db, programId)
  return c.json({
    success: true, programId,
    updatedAt: maxUpdatedAt(rows),
    nodes, tree: buildTree(nodes),
  })
})

// ── PUT /programs/:programId/structure — 부분 갱신 + 낙관적 잠금 ──

gov.put('/programs/:programId/structure', async (c) => {
  const db = c.env.LOOKBOOK_DB
  const programId = c.req.param('programId')
  const body = await c.req.json().catch(() => ({})) as {
    baseUpdatedAt?: number
    upsert?: any[]
    delete?: string[]
    moves?: { nodeId: string; newParentId: string | null; afterSiblingId?: string | null }[]
  }

  const { rows, nodes } = await loadProgramNodes(db, programId)
  const currentMax = maxUpdatedAt(rows)
  if (body.baseUpdatedAt !== undefined && body.baseUpdatedAt !== currentMax) {
    return c.json({
      ok: false, updatedAt: currentMax,
      message: '다른 곳에서 이미 수정되었습니다.',
      conflicts: [{ reason: 'STALE_BASE_UPDATED_AT', expected: body.baseUpdatedAt, actual: currentMax }],
    }, 409)
  }

  const byId = new Map(nodes.map((n) => [n.id, n]))
  const now = Date.now()
  const conflicts: any[] = []
  let upserted = 0, deleted = 0, moved = 0

  // delete (자손 포함)
  for (const id of body.delete || []) {
    if (!byId.has(id)) { conflicts.push({ reason: 'ALREADY_DELETED', nodeId: id }); continue }
    const toDelete = [id, ...descendantIds(nodes, id)]
    await db.batch(toDelete.map((did) => db.prepare(`DELETE FROM gov_support_nodes WHERE id = ?`).bind(did)))
    await writeAuditLog(db, programId, id, 'delete', { id }, null, null)
    deleted++
  }

  // upsert
  for (const item of body.upsert || []) {
    const expressionType = item.level === 1 ? CATEGORY_HEADER_TYPE : item.expressionType
    if (!isKnownExpressionType(expressionType)) {
      conflicts.push({ reason: 'UNKNOWN_EXPRESSION_TYPE', nodeId: item.id, expressionType })
      continue
    }
    const existing = item.id ? byId.get(item.id) : undefined
    const id = item.id || crypto.randomUUID()
    const payload = JSON.stringify(item.payload ?? {})
    const repeatConfig = item.repeatConfig != null ? JSON.stringify(item.repeatConfig) : null
    const conditionConfig = item.conditionConfig != null ? JSON.stringify(item.conditionConfig) : null

    if (existing) {
      await db.prepare(
        `UPDATE gov_support_nodes SET parent_id=?, level=?, sort_key=?, expression_type=?, title=?, payload=?,
          binding=?, binding_key=?, fill_policy=?, target_chars=?, repeat_config=?, condition_config=?, note=?, updated_at=?
         WHERE id = ?`
      ).bind(
        item.parentId ?? existing.parentId, item.level ?? existing.level, item.sortKey ?? existing.sortKey,
        expressionType, item.title ?? existing.title, payload,
        item.binding ?? existing.binding, item.bindingKey ?? existing.bindingKey ?? null,
        item.fillPolicy ?? 'aiFill', item.targetChars ?? existing.targetChars ?? null,
        repeatConfig, conditionConfig, item.note ?? null, now, id
      ).run()
      await writeAuditLog(db, programId, id, 'update', existing, item, null)
    } else {
      await db.prepare(
        `INSERT INTO gov_support_nodes
          (id, program_id, parent_id, level, sort_key, expression_type, title, payload, binding, binding_key,
           fill_policy, target_chars, repeat_config, condition_config, note, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`
      ).bind(
        id, programId, item.parentId ?? null, item.level, item.sortKey || between(null, null),
        expressionType, item.title ?? null, payload, item.binding || 'ai', item.bindingKey ?? null,
        item.fillPolicy || 'aiFill', item.targetChars ?? null, repeatConfig, conditionConfig, item.note ?? null,
        now, now
      ).run()
      await writeAuditLog(db, programId, id, 'create', null, item, null)
    }
    upserted++
  }

  // moves
  for (const mv of body.moves || []) {
    const node = byId.get(mv.nodeId)
    if (!node) { conflicts.push({ reason: 'MOVE_TARGET_MISSING', nodeId: mv.nodeId }); continue }
    const newParent = mv.newParentId ? byId.get(mv.newParentId) : null
    if (mv.newParentId && !newParent) { conflicts.push({ reason: 'NEW_PARENT_MISSING', nodeId: mv.nodeId }); continue }
    const expectedParentLevel = node.level - 1
    if ((newParent?.level ?? 0) !== expectedParentLevel) {
      conflicts.push({ reason: 'LEVEL_RULE_VIOLATION', nodeId: mv.nodeId }); continue
    }
    const siblings = nodes.filter((n) => n.parentId === (mv.newParentId ?? null) && n.id !== node.id)
      .sort((a, b) => (a.sortKey < b.sortKey ? -1 : 1))
    const afterIdx = mv.afterSiblingId ? siblings.findIndex((s) => s.id === mv.afterSiblingId) : -1
    const prevKey = afterIdx >= 0 ? siblings[afterIdx].sortKey : null
    const nextKey = afterIdx >= 0 ? (siblings[afterIdx + 1]?.sortKey ?? null) : (siblings[0]?.sortKey ?? null)
    const newSortKey = between(prevKey, nextKey)
    await db.prepare(`UPDATE gov_support_nodes SET parent_id=?, sort_key=?, updated_at=? WHERE id=?`)
      .bind(mv.newParentId ?? null, newSortKey, now, node.id).run()
    await writeAuditLog(db, programId, node.id, 'move', { parentId: node.parentId, sortKey: node.sortKey }, { parentId: mv.newParentId, sortKey: newSortKey }, null)
    moved++
  }

  const { rows: freshRows } = await loadProgramNodes(db, programId)
  return c.json({ ok: true, updatedAt: maxUpdatedAt(freshRows), applied: { upserted, deleted, moved }, conflicts })
})

// ── POST /nodes — 단일 노드 생성 ──────────────────

gov.post('/nodes', async (c) => {
  const db = c.env.LOOKBOOK_DB
  const body = await c.req.json().catch(() => ({})) as any
  const expressionType = body.level === 1 ? CATEGORY_HEADER_TYPE : body.expressionType
  if (!body.programId || !body.level || !isKnownExpressionType(expressionType)) {
    return c.json({ success: false, message: 'programId/level/expressionType이 올바르지 않습니다.' }, 400)
  }
  const { nodes } = await loadProgramNodes(db, body.programId)
  const siblings = nodes.filter((n) => n.parentId === (body.parentId ?? null)).sort((a, b) => (a.sortKey < b.sortKey ? -1 : 1))
  const afterIdx = body.afterSiblingId ? siblings.findIndex((s) => s.id === body.afterSiblingId) : siblings.length - 1
  const prevKey = afterIdx >= 0 ? siblings[afterIdx].sortKey : null
  const nextKey = afterIdx >= 0 ? (siblings[afterIdx + 1]?.sortKey ?? null) : (siblings[0]?.sortKey ?? null)
  const sortKey = between(prevKey, nextKey)
  const id = crypto.randomUUID()
  const now = Date.now()
  await db.prepare(
    `INSERT INTO gov_support_nodes
      (id, program_id, parent_id, level, sort_key, expression_type, title, payload, binding, binding_key,
       fill_policy, target_chars, repeat_config, condition_config, note, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`
  ).bind(
    id, body.programId, body.parentId ?? null, body.level, sortKey, expressionType, body.title ?? null,
    JSON.stringify(body.payload ?? {}), body.binding || 'ai', body.bindingKey ?? null, body.fillPolicy || 'aiFill',
    body.targetChars ?? null, body.repeatConfig ? JSON.stringify(body.repeatConfig) : null,
    body.conditionConfig ? JSON.stringify(body.conditionConfig) : null, body.note ?? null, now, now
  ).run()
  await writeAuditLog(db, body.programId, id, 'create', null, body, null)
  return c.json({ success: true, id, sortKey })
})

// ── PATCH /nodes/:id — 단일 노드 수정(표현방법 전환 포함) ──────────

gov.patch('/nodes/:id', async (c) => {
  const db = c.env.LOOKBOOK_DB
  const id = c.req.param('id')
  const existingRow = await db.prepare(`SELECT * FROM gov_support_nodes WHERE id = ?`).bind(id).first() as any
  if (!existingRow) return c.json({ success: false, message: '노드를 찾을 수 없습니다.' }, 404)
  const existing = rowToGovNode(existingRow)
  const body = await c.req.json().catch(() => ({})) as any

  if (body.expressionType !== undefined && existing.level !== 1 && !isKnownExpressionType(body.expressionType)) {
    return c.json({ success: false, message: `알 수 없는 expressionType: ${body.expressionType}` }, 400)
  }

  const sets: string[] = ['updated_at = ?']
  const params: any[] = [Date.now()]
  const maybe = (col: string, key: string, transform: (v: any) => any = (v) => v) => {
    if (body[key] !== undefined) { sets.push(`${col} = ?`); params.push(transform(body[key])) }
  }
  maybe('title', 'title')
  maybe('expression_type', 'expressionType')
  maybe('payload', 'payload', (v) => JSON.stringify(v))
  maybe('binding', 'binding')
  maybe('binding_key', 'bindingKey')
  maybe('fill_policy', 'fillPolicy')
  maybe('fixed_phrase', 'fixedPhrase')
  maybe('target_chars', 'targetChars')
  maybe('weight', 'weight')
  maybe('page_share', 'pageShare')
  maybe('repeat_config', 'repeatConfig', (v) => (v == null ? null : JSON.stringify(v)))
  maybe('condition_config', 'conditionConfig', (v) => (v == null ? null : JSON.stringify(v)))
  maybe('note', 'note')
  params.push(id)

  await db.prepare(`UPDATE gov_support_nodes SET ${sets.join(', ')} WHERE id = ?`).bind(...params).run()
  await writeAuditLog(db, existing.programId, id, 'update', existing, body, null)
  return c.json({ success: true })
})

// ── DELETE /nodes/:id — 자손 포함 삭제(트랜잭션) ──────────

gov.delete('/nodes/:id', async (c) => {
  const db = c.env.LOOKBOOK_DB
  const id = c.req.param('id')
  const row = await db.prepare(`SELECT program_id FROM gov_support_nodes WHERE id = ?`).bind(id).first() as any
  if (!row) return c.json({ success: false, message: '노드를 찾을 수 없습니다.' }, 404)
  const { nodes } = await loadProgramNodes(db, row.program_id)
  const toDelete = [id, ...descendantIds(nodes, id)]
  await db.batch(toDelete.map((did) => db.prepare(`DELETE FROM gov_support_nodes WHERE id = ?`).bind(did)))
  await writeAuditLog(db, row.program_id, id, 'delete', { id, descendantCount: toDelete.length - 1 }, null, null)
  return c.json({ success: true, deletedCount: toDelete.length })
})

// ── POST /nodes/:id/duplicate — 자손 포함 복제 ──────────

gov.post('/nodes/:id/duplicate', async (c) => {
  const db = c.env.LOOKBOOK_DB
  const id = c.req.param('id')
  const row = await db.prepare(`SELECT * FROM gov_support_nodes WHERE id = ?`).bind(id).first() as any
  if (!row) return c.json({ success: false, message: '노드를 찾을 수 없습니다.' }, 404)
  const { nodes } = await loadProgramNodes(db, row.program_id)
  const node = rowToGovNode(row)

  const siblings = nodes.filter((n) => n.parentId === node.parentId).sort((a, b) => (a.sortKey < b.sortKey ? -1 : 1))
  const idx = siblings.findIndex((s) => s.id === node.id)
  const nextKey = siblings[idx + 1]?.sortKey ?? null
  const newRootSortKey = between(node.sortKey, nextKey)

  const idMap = new Map<string, string>()
  idMap.set(node.id, crypto.randomUUID())
  const subtreeIds = descendantIds(nodes, node.id)
  for (const did of subtreeIds) idMap.set(did, crypto.randomUUID())

  const allOriginal = [node, ...subtreeIds.map((did) => nodes.find((n) => n.id === did)!)]
  const now = Date.now()
  const stmts = allOriginal.map((n) => {
    const newId = idMap.get(n.id)!
    const newParentId = n.id === node.id ? node.parentId : idMap.get(n.parentId!) || null
    const newSortKey = n.id === node.id ? newRootSortKey : n.sortKey
    return db.prepare(
      `INSERT INTO gov_support_nodes
        (id, program_id, parent_id, level, sort_key, expression_type, title, payload, binding, binding_key,
         fill_policy, target_chars, repeat_config, condition_config, note, status, created_at, updated_at)
       SELECT ?, program_id, ?, level, ?, expression_type, title, payload, binding, binding_key,
         fill_policy, target_chars, repeat_config, condition_config, note, 'draft', ?, ?
       FROM gov_support_nodes WHERE id = ?`
    ).bind(newId, newParentId, newSortKey, now, now, n.id)
  })
  await db.batch(stmts)
  await writeAuditLog(db, row.program_id, idMap.get(node.id)!, 'duplicate', { sourceId: node.id }, { newRootId: idMap.get(node.id) }, null)
  return c.json({ success: true, newRootId: idMap.get(node.id), duplicatedCount: allOriginal.length })
})

// ── POST /nodes/move — 레벨 규칙 검증 후 이동 ──────────

gov.post('/nodes/move', async (c) => {
  const db = c.env.LOOKBOOK_DB
  const body = await c.req.json().catch(() => ({})) as { nodeId: string; newParentId: string | null; afterSiblingId?: string | null }
  const row = await db.prepare(`SELECT * FROM gov_support_nodes WHERE id = ?`).bind(body.nodeId).first() as any
  if (!row) return c.json({ success: false, message: '노드를 찾을 수 없습니다.' }, 404)
  const node = rowToGovNode(row)
  const { nodes } = await loadProgramNodes(db, node.programId)

  if (body.newParentId === node.id) {
    return c.json({ success: false, message: '자기 자신에게로는 이동할 수 없습니다.' }, 400)
  }
  if (body.newParentId && descendantIds(nodes, node.id).includes(body.newParentId)) {
    return c.json({ success: false, message: '자손 노드 아래로는 이동할 수 없습니다.' }, 400)
  }
  const newParent = body.newParentId ? nodes.find((n) => n.id === body.newParentId) : null
  const expectedParentLevel = node.level - 1
  if ((newParent?.level ?? 0) !== expectedParentLevel) {
    return c.json({ success: false, message: `레벨 규칙 위반 — 이 노드(level ${node.level})의 부모는 level ${expectedParentLevel}이어야 합니다.` }, 400)
  }

  const siblings = nodes.filter((n) => n.parentId === (body.newParentId ?? null) && n.id !== node.id)
    .sort((a, b) => (a.sortKey < b.sortKey ? -1 : 1))
  const afterIdx = body.afterSiblingId ? siblings.findIndex((s) => s.id === body.afterSiblingId) : -1
  const prevKey = afterIdx >= 0 ? siblings[afterIdx].sortKey : null
  const nextKey = afterIdx >= 0 ? (siblings[afterIdx + 1]?.sortKey ?? null) : (siblings[0]?.sortKey ?? null)
  const newSortKey = between(prevKey, nextKey)
  const now = Date.now()

  await db.prepare(`UPDATE gov_support_nodes SET parent_id=?, sort_key=?, level=?, updated_at=? WHERE id=?`)
    .bind(body.newParentId ?? null, newSortKey, node.level, now, node.id).run()
  // 자손 level 재귀 갱신 — §12-3 point3. 위 검증(newParent.level+1===node.level)이
  // 이미 node.level 불변을 보장하므로 평소엔 no-op이지만, 방어적으로 그대로 재적용한다.
  const descIds = descendantIds(nodes, node.id)
  if (descIds.length) {
    const levelById = new Map(nodes.map((n) => [n.id, n.level]))
    await db.batch(descIds.map((did) => db.prepare(`UPDATE gov_support_nodes SET level=?, updated_at=? WHERE id=?`).bind(levelById.get(did), now, did)))
  }

  await writeAuditLog(db, node.programId, node.id, 'move', { parentId: node.parentId, sortKey: node.sortKey }, { parentId: body.newParentId, sortKey: newSortKey }, null)
  return c.json({ success: true, sortKey: newSortKey })
})

// ── POST /nodes/bulk — 일괄 표현방법/바인딩 변경 또는 일괄 삭제 ──────────

gov.post('/nodes/bulk', async (c) => {
  const db = c.env.LOOKBOOK_DB
  const body = await c.req.json().catch(() => ({})) as {
    nodeIds: string[]
    delete?: boolean
    patch?: { expressionType?: string; binding?: string; fillPolicy?: string }
  }
  if (!Array.isArray(body.nodeIds) || !body.nodeIds.length) {
    return c.json({ success: false, message: 'nodeIds가 필요합니다.' }, 400)
  }

  // nodeIds가 여러 프로그램에 걸칠 수도 있으니, 프로그램별로 묶어 각자의 트리에서
  // 자손을 계산한다(한 프로그램의 descendantIds를 다른 프로그램 노드에 적용하면
  // 잘못된 id가 섞여 들어갈 수 있다). audit_log도 이 program_id로 기록한다.
  const idRows = ((await db.batch(
    body.nodeIds.map((id) => db.prepare(`SELECT id, program_id FROM gov_support_nodes WHERE id = ?`).bind(id))
  )) as any[]).flatMap((r) => r.results || [])
  const programIdById = new Map(idRows.map((r) => [r.id, r.program_id]))
  const idsByProgram = new Map<string, string[]>()
  for (const r of idRows) {
    if (!idsByProgram.has(r.program_id)) idsByProgram.set(r.program_id, [])
    idsByProgram.get(r.program_id)!.push(r.id)
  }

  if (body.delete) {
    const allToDelete = new Set<string>()
    for (const [programId, ids] of idsByProgram) {
      const { nodes } = await loadProgramNodes(db, programId)
      for (const id of ids) { allToDelete.add(id); for (const d of descendantIds(nodes, id)) allToDelete.add(d) }
    }
    if (allToDelete.size) {
      await db.batch(Array.from(allToDelete).map((id) => db.prepare(`DELETE FROM gov_support_nodes WHERE id = ?`).bind(id)))
    }
    for (const id of body.nodeIds) {
      await writeAuditLog(db, programIdById.get(id) || '', id, 'delete', { id, bulk: true }, null, null)
    }
    return c.json({ success: true, deletedCount: allToDelete.size })
  }

  if (body.patch && (body.patch.expressionType || body.patch.binding || body.patch.fillPolicy)) {
    if (body.patch.expressionType && !isKnownExpressionType(body.patch.expressionType)) {
      return c.json({ success: false, message: `알 수 없는 expressionType: ${body.patch.expressionType}` }, 400)
    }
    const now = Date.now()
    const sets: string[] = ['updated_at = ?']
    const params: any[] = [now]
    if (body.patch.expressionType) { sets.push('expression_type = ?'); params.push(body.patch.expressionType) }
    if (body.patch.binding) { sets.push('binding = ?'); params.push(body.patch.binding) }
    if (body.patch.fillPolicy) { sets.push('fill_policy = ?'); params.push(body.patch.fillPolicy) }
    await db.batch(body.nodeIds.map((id) => db.prepare(`UPDATE gov_support_nodes SET ${sets.join(', ')} WHERE id = ?`).bind(...params, id)))
    for (const id of body.nodeIds) {
      await writeAuditLog(db, programIdById.get(id) || '', id, 'update', null, { bulk: true, patch: body.patch }, null)
    }
    return c.json({ success: true, updatedCount: body.nodeIds.length })
  }

  return c.json({ success: false, message: 'delete 또는 patch 중 하나는 지정해야 합니다.' }, 400)
})

// ── GET /programs/:programId/validate ──────────

gov.get('/programs/:programId/validate', async (c) => {
  const db = c.env.LOOKBOOK_DB
  const programId = c.req.param('programId')
  const { nodes } = await loadProgramNodes(db, programId)
  const issues: ValidationIssue[] = validateProgram(nodes)
  return c.json({ success: true, programId, issues, errorCount: issues.filter((i) => i.level === 'error').length })
})

// ── POST /programs/:programId/publish ──────────

gov.post('/programs/:programId/publish', async (c) => {
  const db = c.env.LOOKBOOK_DB
  const programId = c.req.param('programId')
  const { nodes } = await loadProgramNodes(db, programId)
  const issues = validateProgram(nodes)
  const errors = issues.filter((i) => i.level === 'error')
  if (errors.length) {
    return c.json({ success: false, message: '검증 오류가 있어 게시할 수 없습니다.', issues: errors }, 409)
  }

  const now = Date.now()
  await db.batch(nodes.map((n) => db.prepare(`UPDATE gov_support_nodes SET status = 'published', updated_at = ? WHERE id = ?`).bind(now, n.id)))

  const lastVersion = await db.prepare(`SELECT MAX(version_no) as v FROM gov_support_versions WHERE program_id = ?`).bind(programId).first() as any
  const versionNo = (lastVersion?.v || 0) + 1
  await db.prepare(
    `INSERT INTO gov_support_versions (id, program_id, version_no, label, memo, tree_json, node_count, is_published, author, created_at)
     VALUES (?, ?, ?, ?, NULL, ?, ?, 1, NULL, ?)`
  ).bind(crypto.randomUUID(), programId, versionNo, `v${versionNo}`, JSON.stringify(nodes), nodes.length, now).run()

  await db.prepare(
    `INSERT INTO gov_support_config (program_id, structure_status, published_at, published_version, updated_at) VALUES (?, 'published', ?, ?, ?)
     ON CONFLICT(program_id) DO UPDATE SET structure_status='published', published_at=excluded.published_at, published_version=excluded.published_version, updated_at=excluded.updated_at`
  ).bind(programId, now, `v${versionNo}`, now).run()

  await writeAuditLog(db, programId, null, 'publish', null, { versionNo }, null)
  return c.json({ success: true, versionNo, publishedVersion: `v${versionNo}` })
})

// ── GET /audit-log ──────────

gov.get('/audit-log', async (c) => {
  const db = c.env.LOOKBOOK_DB
  const programId = c.req.query('programId')
  const nodeId = c.req.query('nodeId')
  const from = c.req.query('from')
  const to = c.req.query('to')
  const limit = Math.min(Number(c.req.query('limit')) || 50, 200)

  const conds: string[] = []
  const params: any[] = []
  if (programId) { conds.push('program_id = ?'); params.push(programId) }
  if (nodeId) { conds.push('node_id = ?'); params.push(nodeId) }
  if (from) { conds.push('created_at >= ?'); params.push(Number(from)) }
  if (to) { conds.push('created_at <= ?'); params.push(Number(to)) }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : ''
  const rows = (await db.prepare(
    `SELECT * FROM gov_support_audit_log ${where} ORDER BY created_at DESC LIMIT ?`
  ).bind(...params, limit).all()).results
  return c.json({ success: true, entries: rows })
})

export default gov
