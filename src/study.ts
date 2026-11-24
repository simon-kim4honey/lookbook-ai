// ────────────────────────────────────────────────────
// "정부지원사업 실습 교안" 인터랙티브 실습 페이지 API — /study(학생) · /study_admin(강사)
//
// 메인 메뉴/네비게이션에는 노출하지 않는 숨겨진 교육용 라우트. 접근 보호는
// 별도 로그인이 아니라 "수업 코드를 아는 사람만 그 수업 데이터를 볼 수 있다"는
// 방식 — 강사가 현장에서 화면에 코드를 띄워 공유한다.
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

// 혼동되는 문자(0/O, 1/I) 제외 — 강사가 화면으로 공유하고 학생이 직접 타이핑하는 코드라서
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function generateClassCode(len = 6): string {
  let out = ''
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  return out
}
function isValidCode(code: string): boolean {
  return typeof code === 'string' && /^[A-Z0-9]{4,8}$/.test(code)
}

// 조회 API 남용(코드 무차별 대입) 방지 — IP당 분당 호출 수 제한. KV 장애 시에는
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

// POST /api/study/class/new — 강사가 "새 수업 시작"을 눌러 코드 발급
studyApi.post('/class/new', async (c) => {
  try {
    const db = c.env.LOOKBOOK_DB
    let code = ''
    for (let i = 0; i < 6; i++) {
      code = generateClassCode()
      const exists = await db.prepare(`SELECT code FROM study_classes WHERE code = ?`).bind(code).first()
      if (!exists) break
    }
    await db.prepare(`INSERT INTO study_classes (code) VALUES (?)`).bind(code).run()
    return c.json({ success: true, code })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

// POST /api/study/submit — 학생 업로드. 같은 submissionId로 다시 업로드하면 갱신(덮어쓰기)된다.
studyApi.post('/submit', async (c) => {
  try {
    const body = await c.req.json().catch(() => null)
    if (!body) return c.json({ success: false, message: '잘못된 요청이에요.' }, 400)

    const classCode = String(body.classCode || '').toUpperCase().trim()
    const submissionId = String(body.submissionId || '').trim()
    const brandAlias = String(body.brandAlias || '').trim().slice(0, 60)

    if (!isValidCode(classCode)) return c.json({ success: false, message: '수업 코드 형식이 올바르지 않아요.' }, 400)
    if (!/^[a-zA-Z0-9_-]{8,64}$/.test(submissionId)) return c.json({ success: false, message: '잘못된 요청이에요.' }, 400)
    if (!brandAlias) return c.json({ success: false, message: '브랜드명을 입력해주세요.' }, 400)

    const answers = body.answers && typeof body.answers === 'object' ? body.answers : {}
    const answersJson = JSON.stringify(answers).slice(0, 20000)

    const db = c.env.LOOKBOOK_DB
    const cls: any = await db.prepare(`SELECT code, is_active FROM study_classes WHERE code = ?`).bind(classCode).first()
    if (!cls) return c.json({ success: false, message: '존재하지 않는 수업 코드예요. 강사에게 코드를 다시 확인해주세요.' }, 404)
    if (!cls.is_active) return c.json({ success: false, message: '종료된 수업이에요.' }, 410)

    await db.prepare(
      `INSERT INTO study_submissions (id, class_code, brand_alias, answers_json, submitted_at, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         brand_alias = excluded.brand_alias,
         answers_json = excluded.answers_json,
         updated_at = datetime('now')`
    ).bind(submissionId, classCode, brandAlias, answersJson).run()

    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

// GET /api/study/submissions?class=XXXX — 강사 조회. 수업 코드가 곧 접근 열쇠라서
// IP당 호출 수를 제한해 코드 무차별 대입을 어렵게 만든다.
studyApi.get('/submissions', async (c) => {
  try {
    const classCode = String(c.req.query('class') || '').toUpperCase().trim()
    if (!isValidCode(classCode)) return c.json({ success: false, message: '수업 코드 형식이 올바르지 않아요.' }, 400)

    const kv = c.env.LOOKBOOK_KV
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
    const ok = await checkRateLimit(kv, `study_rl_${ip}`, 30, 60)
    if (!ok) return c.json({ success: false, message: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.' }, 429)

    const db = c.env.LOOKBOOK_DB
    const cls = await db.prepare(`SELECT code FROM study_classes WHERE code = ?`).bind(classCode).first()
    if (!cls) return c.json({ success: false, message: '존재하지 않는 수업 코드예요.' }, 404)

    const rows = (await db.prepare(
      `SELECT id, brand_alias, answers_json, submitted_at, updated_at FROM study_submissions WHERE class_code = ? ORDER BY updated_at DESC`
    ).bind(classCode).all()).results as any[]

    const submissions = (rows || []).map((r) => ({
      id: r.id,
      brandAlias: r.brand_alias,
      answers: JSON.parse(r.answers_json || '{}'),
      submittedAt: r.submitted_at,
      updatedAt: r.updated_at,
    }))

    return c.json({ success: true, classCode, count: submissions.length, submissions })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

// POST /api/study/class/:code/reset — 강사용 전체 초기화. 해당 수업 코드의 제출물을 D1에서 전부 삭제한다.
studyApi.post('/class/:code/reset', async (c) => {
  try {
    const classCode = String(c.req.param('code') || '').toUpperCase().trim()
    if (!isValidCode(classCode)) return c.json({ success: false, message: '수업 코드 형식이 올바르지 않아요.' }, 400)
    const db = c.env.LOOKBOOK_DB
    await db.prepare(`DELETE FROM study_submissions WHERE class_code = ?`).bind(classCode).run()
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

export default studyApi
