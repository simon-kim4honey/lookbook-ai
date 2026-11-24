// ────────────────────────────────────────────────────
// "정부지원사업 실습 교안" 인터랙티브 실습 페이지 API — /study(학생) · /study_admin(강사)
//
// 메인 메뉴/네비게이션에는 노출하지 않는 숨겨진 교육용 라우트.
//
// 설계 단순화(사용자 확정, 2026-11-24): 총 참여자 10명 이하 소규모 사용을
// 전제로, 수업 코드/강의실 구분 개념을 없애고 브랜드명으로만 구분한다.
// 브랜드명 중복은 지금 단계에서는 허용한다(규모가 커지면 "이미 사용 중인
// 브랜드입니다" 같은 중복 방지·강의실 분리를 별도 업그레이드로 추가 예정).
// /study_admin 조회·초기화는 고정 비밀번호(STUDY_ADMIN_PASSWORD)로 보호한다.
//
// 개인정보 최소화: 이름·연락처는 수집하지 않는다. brand_alias는 학생이
// 자유롭게 적는 브랜드명 칸(실명 수집 필드가 아님) — 강사가 오프라인 강의
// 중 구두로 안내하므로 화면 문구로는 별도 안내를 넣지 않는다.
// ────────────────────────────────────────────────────
import { Hono } from 'hono'

type StudyBindings = {
  LOOKBOOK_DB: D1Database
  LOOKBOOK_KV: KVNamespace
}

const studyApi = new Hono<{ Bindings: StudyBindings }>()

// /study_admin 접근 비밀번호 — 사용자 확정값. 10명 이하 소규모·개인정보
// 미수집 전제라 ADMIN_PASSWORD 같은 운영 비밀(시크릿)과 분리된, 강사가
// 구두로 공유하는 수준의 간단한 고정값으로 둔다.
const STUDY_ADMIN_PASSWORD = '3325'

// 비밀번호 무차별 대입 방지 — IP당 분당 호출 수 제한. KV 장애 시에는
// 가용성을 우선해 막지 않는다(에러 로깅 등 다른 기능과 같은 원칙).
async function checkRateLimit(kv: KVNamespace, key: string, limit: number, windowSec: number): Promise<boolean> {
  try {
    const raw = await kv.get(key)
    const count = raw ? parseInt(raw, 10) : 0
    if (count >= limit) return false
    await kv.put(key, String(count + 1), { expirationTtl: windowSec })
    return true
  } catch {
    return true
  }
}

const studyAdminAuth = async (c: any, next: any) => {
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const ok = await checkRateLimit(c.env.LOOKBOOK_KV, `study_admin_rl_${ip}`, 20, 60)
  if (!ok) return c.json({ success: false, message: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.' }, 429)
  const given = c.req.header('X-Study-Admin-Password')
  if (given !== STUDY_ADMIN_PASSWORD) return c.json({ success: false, message: '비밀번호가 올바르지 않아요.' }, 401)
  await next()
}

// POST /api/study/submit — 학생 업로드. 같은 submissionId로 다시 업로드하면 갱신(덮어쓰기)된다.
studyApi.post('/submit', async (c) => {
  try {
    const body = await c.req.json().catch(() => null)
    if (!body) return c.json({ success: false, message: '잘못된 요청이에요.' }, 400)

    const submissionId = String(body.submissionId || '').trim()
    const brandAlias = String(body.brandAlias || '').trim().slice(0, 60)

    if (!/^[a-zA-Z0-9_-]{8,64}$/.test(submissionId)) return c.json({ success: false, message: '잘못된 요청이에요.' }, 400)
    if (!brandAlias) return c.json({ success: false, message: '브랜드명을 입력해주세요.' }, 400)

    const answers = body.answers && typeof body.answers === 'object' ? body.answers : {}
    const answersJson = JSON.stringify(answers).slice(0, 20000)

    const db = c.env.LOOKBOOK_DB
    await db.prepare(
      `INSERT INTO study_submissions (id, brand_alias, answers_json, submitted_at, updated_at)
       VALUES (?, ?, ?, datetime('now'), datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         brand_alias = excluded.brand_alias,
         answers_json = excluded.answers_json,
         updated_at = datetime('now')`
    ).bind(submissionId, brandAlias, answersJson).run()

    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

// GET /api/study/submissions — 강사 조회. 비밀번호로 보호.
studyApi.get('/submissions', studyAdminAuth, async (c) => {
  try {
    const db = c.env.LOOKBOOK_DB
    const rows = (await db.prepare(
      `SELECT id, brand_alias, answers_json, submitted_at, updated_at FROM study_submissions ORDER BY updated_at DESC`
    ).all()).results as any[]

    const submissions = (rows || []).map((r) => ({
      id: r.id,
      brandAlias: r.brand_alias,
      answers: JSON.parse(r.answers_json || '{}'),
      submittedAt: r.submitted_at,
      updatedAt: r.updated_at,
    }))

    return c.json({ success: true, count: submissions.length, submissions })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

// POST /api/study/reset — 강사용 전체 초기화. 제출물을 D1에서 전부 삭제한다. 비밀번호로 보호.
studyApi.post('/reset', studyAdminAuth, async (c) => {
  try {
    const db = c.env.LOOKBOOK_DB
    await db.prepare(`DELETE FROM study_submissions`).run()
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

export default studyApi
