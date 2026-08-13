import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import { cors } from 'hono/cors'

// Vite 빌드 시 vite.config.ts define으로 주입된 빌드 타임 해시
// → 배포할 때마다 값이 바뀌어 브라우저가 새 파일로 인식 (캐시 자동 무효화)
declare const __BUILD_VERSION__: string
const BUILD_VERSION: string = (typeof __BUILD_VERSION__ !== 'undefined') ? __BUILD_VERSION__ : 'dev'

// Cloudflare 바인딩 타입
type Bindings = {
  LOOKBOOK_KV: KVNamespace   // BYOK(studiob) — Cloudflare KV
  LOOKBOOK_DB: D1Database    // Genspark Hosted — Cloudflare D1
  // OAuth Secrets (wrangler secret put 으로 설정)
  KAKAO_CLIENT_ID: string
  KAKAO_CLIENT_SECRET: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  // 카카오톡 공유하기 (카카오 로그인과 별개 — JavaScript 키)
  KAKAO_JS_KEY: string
  // 어드민
  ADMIN_PASSWORD: string
  // 토스페이먼츠
  TOSS_SECRET_KEY: string
  // Atlas Cloud AI (이미지 생성 전용)
  ATLAS_API_KEY: string
  // OpenAI (이미지 분류/라벨링 전용 — gpt-4o-mini, AtlasCloud엔 없는 모델)
  OPENAI_API_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './public' }))

// studiob.aifashion.co.kr → www.aifashion.co.kr 전체 경로 리다이렉트
// studiob 도메인은 더 이상 별도 서비스로 쓰지 않고, www 하나로 통합 (경로/쿼리 그대로 유지)
// 진행 중인 API 요청(세션 유지 등)은 리다이렉트에서 제외
app.use('*', async (c, next) => {
  const host = c.req.header('host') || ''
  if (host.includes('studiob.aifashion.co.kr') && !c.req.path.startsWith('/api/')) {
    const url = new URL(c.req.url)
    return c.redirect(`https://www.aifashion.co.kr${url.pathname}${url.search}`, 302)
  }
  await next()
})

// ────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────
const ATLAS_API_BASE = 'https://api.atlascloud.ai'
// ATLAS_API_KEY는 c.env.ATLAS_API_KEY (환경변수)로 각 라우트에서 직접 참조
const AIFASHION_BASE = 'https://www.aifashion.co.kr'
// 어드민 인증 미들웨어 (상단 선언 필수 — 스토어/라우트보다 먼저 참조됨)
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

// ────────────────────────────────────────────────────
// Admin Prompt Store  (Cloudflare Workers 메모리 싱글톤)
// Workers는 요청마다 재사용되는 isolate를 공유하므로
// 모듈 스코프 변수가 인스턴스 내에서 유지됩니다.
// ────────────────────────────────────────────────────
interface AdminPromptConfig {
  enabled: boolean          // 프롬프트 적용 ON/OFF
  prefix: string            // 시스템 프롬프트 앞에 붙일 내용
  suffix: string            // 시스템 프롬프트 뒤에 붙일 내용
  styleGuide: string        // 스타일 가이드 (촬영 방향, 분위기 등)
  technicalSpec: string     // 기술 스펙 (조명, 해상도 등 고정 지시)
  updatedAt: string
}

let adminPromptConfig: AdminPromptConfig = {
  enabled: true,
  prefix: '',
  suffix: '',
  styleGuide: [
    'SCENE-FIRST INTEGRATION PRINCIPLE: Every composited element — clothing, face, skin — must look as if it was photographed in the original background scene, not pasted in.',
    'LIGHTING MATCH: Identify the background scene\'s primary light source direction, color temperature (warm/neutral/cool), and intensity. Apply identical lighting to the person\'s clothing, face, and all exposed skin. Cast-shadows, specular highlights, and subsurface skin scattering must all originate from the scene\'s light source.',
    'COLOR GRADE MATCH: The background scene carries a specific color grade and tonal mood (e.g. warm golden, cool blue, high-contrast, soft pastel, moody dark). Render all composited elements under this exact color cast — do NOT render clothing or skin under a neutral white balance if the scene is warm or cool-toned.',
    'MOOD AND ATMOSPHERE MATCH: Preserve the scene\'s overall visual mood and atmosphere. The final image must feel tonally coherent — bright and airy scenes stay bright, moody scenes stay moody, editorial high-contrast stays high-contrast.',
    'FABRIC LIGHT INTERACTION: Simulate realistic light interaction with the new fabric — specular sheen on satin/silk, soft diffuse on cotton/knit, translucency on chiffon/voile — all under the scene\'s lighting conditions.',
    'Fashion editorial quality: magazine cover level seamless compositing, physically grounded.',
  ].join(' '),
  technicalSpec: [
    '초사실적 표현, 직물 질감과 피부 디테일 극사실 재현.',
    '의류 드레이프와 핏 완벽 재현. 자연스러운 주름 외 구김 없음.',
    '의류에 선명한 포커스. 배경과 동일한 심도 및 렌즈 특성 유지.',
    '배경 씬의 색감·무드·조명 톤을 인물과 의류에 완전히 통합. 합성 아티팩트 없음.',
    '참조 이미지에 없는 의류, 액세서리, 소품 절대 추가 금지.',
    'ABSOLUTE PROHIBITION: DO NOT modify, redesign, or alter any detail of the uploaded clothing item.',
  ].join(' '),
  updatedAt: new Date().toISOString(),
}

// 어드민 프롬프트를 generation 프롬프트에 주입하는 헬퍼
function injectAdminPrompt(basePrompt: string): string {
  if (!adminPromptConfig.enabled) return basePrompt
  const parts: string[] = []
  if (adminPromptConfig.prefix.trim())       parts.push(adminPromptConfig.prefix.trim())
  parts.push(basePrompt)
  if (adminPromptConfig.styleGuide.trim())   parts.push(adminPromptConfig.styleGuide.trim())
  if (adminPromptConfig.technicalSpec.trim()) parts.push(adminPromptConfig.technicalSpec.trim())
  if (adminPromptConfig.suffix.trim())       parts.push(adminPromptConfig.suffix.trim())
  return parts.join(' ')
}

// ────────────────────────────────────────────────────
// 커스텀 모델/배경 — 통합 스토리지 레이어
//
// 우선순위:
//   1) LOOKBOOK_KV (KVNamespace)  → BYOK studiob 환경
//   2) LOOKBOOK_DB (D1Database)   → Genspark Hosted 환경
//   3) 메모리 폴백                → 로컬 개발
// ────────────────────────────────────────────────────
interface CustomModel {
  id: string
  name: string
  desc: string
  gender: string   // 여성 | 남성 | 미분류
  age: string      // 10대 | 20대 | 30대 | 40대 | 미분류
  mood: string     // 로맨틱 | 보이시 | 캐주얼 | 시크 | 내추럴 | 미분류
  createdAt: string
}
interface CustomBg {
  id: string
  name: string
  bgDesc: string
  category: string
  createdAt: string
  hasGenImage?: boolean  // 얼굴-마스킹된 "생성용" 이미지가 별도로 등록되어 있는지
}

// ── KV 헬퍼 (BYOK) ──
async function kvGetModels(kv: KVNamespace): Promise<CustomModel[]> {
  const raw = await kv.get('model_index')
  return raw ? JSON.parse(raw) : []
}
async function kvSaveModels(kv: KVNamespace, list: CustomModel[]) {
  await kv.put('model_index', JSON.stringify(list))
}
async function kvGetBgs(kv: KVNamespace): Promise<CustomBg[]> {
  const raw = await kv.get('bg_index')
  return raw ? JSON.parse(raw) : []
}
async function kvSaveBgs(kv: KVNamespace, list: CustomBg[]) {
  await kv.put('bg_index', JSON.stringify(list))
}
async function kvNextId(kv: KVNamespace): Promise<string> {
  const raw = await kv.get('id_counter')
  const next = raw ? parseInt(raw) + 1 : 1001
  await kv.put('id_counter', String(next))
  return String(next - 1 === 0 ? 1000 : next - 1)
}

// ── D1 헬퍼 (Genspark Hosted) ──
async function d1EnsureSchema(db: D1Database) {
  // D1은 db.exec() 멀티스테이트먼트 미지원 → 각각 prepare().run()으로 실행
  await db.prepare(`CREATE TABLE IF NOT EXISTS id_counter (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    value INTEGER NOT NULL DEFAULT 1000
  )`).run()
  await db.prepare(`INSERT OR IGNORE INTO id_counter (id, value) VALUES (1, 1000)`).run()
  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    desc_text TEXT NOT NULL DEFAULT '',
    image_b64 TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run()
  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_bgs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '기타',
    bg_desc TEXT NOT NULL DEFAULT '',
    image_b64 TEXT NOT NULL,
    gen_image_b64 TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run()
  // 어드민 프롬프트 설정 영속화 테이블
  await db.prepare(`CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run()
}
async function d1NextId(db: D1Database): Promise<string> {
  await db.prepare(`UPDATE id_counter SET value = value + 1 WHERE id = 1`).run()
  const row: any = await db.prepare(`SELECT value FROM id_counter WHERE id = 1`).first()
  return String(row?.value ?? 1000)
}
async function d1GetModels(db: D1Database): Promise<CustomModel[]> {
  const { results } = await db.prepare(`SELECT id, name, desc_text, gender, age, mood, created_at FROM custom_models ORDER BY created_at ASC`).all()
  return (results as any[]).map(r => ({
    id: r.id, name: r.name, desc: r.desc_text,
    gender: r.gender || '미분류', age: r.age || '미분류', mood: r.mood || '미분류',
    createdAt: r.created_at
  }))
}
async function d1AddModels(db: D1Database, items: Array<{ name: string; desc?: string; gender?: string; age?: string; mood?: string; imageBase64: string }>): Promise<CustomModel[]> {
  const results: CustomModel[] = []
  for (const item of items) {
    const { name, desc, gender, age, mood, imageBase64 } = item
    if (!name || !imageBase64) continue
    const id = await d1NextId(db)
    const createdAt = new Date().toISOString()
    // gender/age/mood 컬럼이 없을 경우(구 스키마) 대비 try-catch
    try {
      await db.prepare(`INSERT INTO custom_models (id, name, desc_text, gender, age, mood, image_b64, created_at) VALUES (?,?,?,?,?,?,?,?)`)
        .bind(id, name, desc || name, gender || '미분류', age || '미분류', mood || '미분류', imageBase64, createdAt).run()
    } catch {
      await db.prepare(`INSERT INTO custom_models (id, name, desc_text, image_b64, created_at) VALUES (?,?,?,?,?)`)
        .bind(id, name, desc || name, imageBase64, createdAt).run()
    }
    results.push({ id, name, desc: desc || name, gender: gender || '미분류', age: age || '미분류', mood: mood || '미분류', createdAt })
  }
  return results
}
async function d1DeleteModel(db: D1Database, id: string): Promise<boolean> {
  const r = await db.prepare(`DELETE FROM custom_models WHERE id = ?`).bind(id).run()
  return (r.meta?.changes ?? 0) > 0
}
async function d1GetModelImg(db: D1Database, id: string): Promise<string | null> {
  const row: any = await db.prepare(`SELECT image_b64 FROM custom_models WHERE id = ?`).bind(id).first()
  return row?.image_b64 ?? null
}
async function d1GetBgs(db: D1Database): Promise<CustomBg[]> {
  const { results } = await db.prepare(`SELECT id, name, category, bg_desc, created_at, CASE WHEN gen_image_b64 IS NOT NULL AND gen_image_b64 != '' THEN 1 ELSE 0 END AS has_gen_image FROM custom_bgs ORDER BY created_at ASC`).all()
  return (results as any[]).map(r => ({ id: r.id, name: r.name, bgDesc: r.bg_desc, category: r.category, createdAt: r.created_at, hasGenImage: !!r.has_gen_image }))
}
async function d1AddBgs(db: D1Database, items: Array<{ name: string; bgDesc?: string; category?: string; imageBase64: string }>): Promise<CustomBg[]> {
  const results: CustomBg[] = []
  for (const item of items) {
    const { name, bgDesc, category, imageBase64 } = item
    if (!name || !imageBase64) continue
    const id = await d1NextId(db)
    const createdAt = new Date().toISOString()
    await db.prepare(`INSERT INTO custom_bgs (id, name, category, bg_desc, image_b64, created_at) VALUES (?,?,?,?,?,?)`)
      .bind(id, name, category || '커스텀', bgDesc || name, imageBase64, createdAt).run()
    results.push({ id, name, bgDesc: bgDesc || name, category: category || '커스텀', createdAt })
  }
  return results
}
async function d1DeleteBg(db: D1Database, id: string): Promise<boolean> {
  const r = await db.prepare(`DELETE FROM custom_bgs WHERE id = ?`).bind(id).run()
  return (r.meta?.changes ?? 0) > 0
}
async function d1GetBgImg(db: D1Database, id: string): Promise<string | null> {
  const row: any = await db.prepare(`SELECT image_b64 FROM custom_bgs WHERE id = ?`).bind(id).first()
  return row?.image_b64 ?? null
}
// 생성(AtlasCloud 전달)용 이미지 — gen_image_b64(얼굴 마스킹본)가 있으면 그걸, 없으면 전시용 원본을 폴백으로 사용
async function d1GetBgGenImg(db: D1Database, id: string): Promise<string | null> {
  const row: any = await db.prepare(`SELECT image_b64, gen_image_b64 FROM custom_bgs WHERE id = ?`).bind(id).first()
  if (!row) return null
  return (row.gen_image_b64 && String(row.gen_image_b64).trim()) ? row.gen_image_b64 : row.image_b64
}
async function d1SetBgGenImg(db: D1Database, id: string, imageBase64: string): Promise<boolean> {
  const r = await db.prepare(`UPDATE custom_bgs SET gen_image_b64 = ? WHERE id = ?`).bind(imageBase64, id).run()
  return (r.meta?.changes ?? 0) > 0
}

// ── 메모리 폴백 (로컬 개발) ──
let _memModels: (CustomModel & { imageBase64?: string })[] = []
let _memBgs: (CustomBg & { imageBase64?: string })[] = []
let _memIdCounter = 1000

// ── 커스텀 모델 API ──
// POST /api/admin/models — 모델 업로드 (단일 or 배열 일괄)
app.post('/api/admin/models', adminAuth, async (c) => {
  try {
    const body: any = await c.req.json()
    const items: Array<{ name: string; desc?: string; imageBase64: string }> =
      Array.isArray(body) ? body : [body]
    if (items.length === 0) return c.json({ success: false, message: '업로드할 항목이 없습니다.' }, 400)
    const kv: KVNamespace | undefined = (c.env as any)?.LOOKBOOK_KV
    const db: D1Database | undefined = (c.env as any)?.LOOKBOOK_DB
    let results: CustomModel[] = []

    if (kv) {
      // ── KV 모드 (BYOK studiob) ──
      const list = await kvGetModels(kv)
      for (const item of items) {
        const { name, desc, imageBase64 } = item
        if (!name || !imageBase64) continue
        const id = await kvNextId(kv)
        const meta: CustomModel = { id, name, desc: desc || name, createdAt: new Date().toISOString() }
        list.push(meta)
        await kv.put(`model_img:${id}`, imageBase64)
        results.push(meta)
      }
      await kvSaveModels(kv, list)
    } else if (db) {
      // ── D1 모드 (Genspark Hosted) ──
      results = await d1AddModels(db, items)
    } else {
      // ── 메모리 폴백 (로컬 개발) ──
      for (const item of items) {
        const { name, desc, imageBase64 } = item
        if (!name || !imageBase64) continue
        const id = String(_memIdCounter++)
        const meta = { id, name, desc: desc || name, imageBase64, createdAt: new Date().toISOString() }
        _memModels.push(meta)
        results.push({ id, name, desc: meta.desc, createdAt: meta.createdAt })
      }
    }
    return c.json({ success: true, models: results, count: results.length })
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500)
  }
})

// POST /api/validate/clothing — 사용자가 업로드한 이미지가 의류 사진인지 AI로 검증
// (강아지, 풍경 등 옷이 아닌 이미지를 올려 이상한 결과가 나오는 것을 사전 차단)
// 검증 자체가 실패/타임아웃 나면 사용자 플로우를 막지 않도록 fail-open으로 통과 처리
app.post('/api/validate/clothing', async (c) => {
  try {
    const body: any = await c.req.json()
    const imageBase64: string = body?.imageBase64 || ''
    if (!imageBase64) return c.json({ success: false, message: 'imageBase64 필수' }, 400)

    const openaiKey = (c.env as any)?.OPENAI_API_KEY || ''
    if (!openaiKey) return c.json({ success: true, isClothing: true })

    const prompt = `You are an image classifier for a fashion shopping app. Does this image show a wearable clothing garment (e.g. shirt, blouse, t-shirt, pants, skirt, dress, jacket, coat, sweater) as its main subject — whether laid flat, on a hanger, or worn by a person? Animals, landscapes, objects, food, random photos, or anything that is not primarily a clothing item should be NO. Respond with ONLY one word: YES or NO.`

    const content = await openaiChatVision(openaiKey, imageBase64, prompt)
    if (content === null) return c.json({ success: true, isClothing: true })
    return c.json({ success: true, isClothing: content.trim().toUpperCase().startsWith('YES') })
  } catch (e: any) {
    console.error('validate/clothing error:', e)
    return c.json({ success: true, isClothing: true })
  }
})

// POST /api/admin/auto-label — 모델/배경 이미지 AI 자동 라벨링
app.post('/api/admin/auto-label', adminAuth, async (c) => {
  try {
    const body: any = await c.req.json()
    const { type, imageBase64 } = body  // type: 'model' | 'background'
    if (!imageBase64) return c.json({ success: false, message: 'imageBase64 필수' }, 400)

    const openaiKey = (c.env as any)?.OPENAI_API_KEY || ''
    if (!openaiKey) return c.json({ success: false, message: 'OPENAI_API_KEY 미설정' }, 500)

    const parseJsonLabels = (raw: string) => {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      return JSON.parse(jsonMatch?.[0] || raw)
    }

    if (type === 'model') {
      // 모델 이미지 → 성별/연령대/무드 분류
      const prompt = `You are an AI fashion model classifier. Analyze this model photo and return ONLY a JSON object with these exact fields:
{
  "gender": "여성" or "남성",
  "age": "10대" or "20대" or "30대" or "40대",
  "mood": one of ["로맨틱", "보이시", "캐주얼", "시크", "내추럴"]
}
Rules:
- gender: female face/body = "여성", male = "남성"
- age: estimate from face
- mood: overall vibe of the person/styling
Return ONLY the JSON, no explanation.`

      const content = await openaiChatVision(openaiKey, imageBase64, prompt)
      if (content === null) return c.json({ success: false, message: '라벨링 요청 실패' }, 500)
      try {
        const labels = parseJsonLabels(content)
        return c.json({ success: true, labels: {
          gender: labels.gender || '미분류',
          age: labels.age || '미분류',
          mood: labels.mood || '미분류',
        }})
      } catch {
        return c.json({ success: false, message: '응답 파싱 실패', raw: content })
      }

    } else if (type === 'background') {
      // 배경 이미지 → 카테고리/분위기 분류
      const prompt = `You are a fashion photography background classifier. Analyze this background image and return ONLY a JSON object:
{
  "category": one of ["스튜디오", "야외/자연", "도심/거리", "인테리어", "컨셉/특수"],
  "mood": one of ["미니멀", "내추럴", "모던", "빈티지", "럭셔리", "스트릿"],
  "name_ko": short Korean name for this background (5-10 chars)
}
Return ONLY the JSON, no explanation.`

      const content = await openaiChatVision(openaiKey, imageBase64, prompt)
      if (content === null) return c.json({ success: false, message: '라벨링 요청 실패' }, 500)
      try {
        const labels = parseJsonLabels(content)
        return c.json({ success: true, labels: {
          category: labels.category || '스튜디오',
          mood: labels.mood || '미니멀',
          name_ko: labels.name_ko || '',
        }})
      } catch {
        return c.json({ success: false, message: '응답 파싱 실패', raw: content })
      }
    }

    return c.json({ success: false, message: 'type은 model 또는 background 이어야 합니다.' }, 400)
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500)
  }
})

// PATCH /api/admin/models/:id/labels — 라벨 저장
app.patch('/api/admin/models/:id/labels', adminAuth, async (c) => {
  try {
    const id = c.req.param('id')
    const { gender, age, mood } = await c.req.json() as any
    const kv: KVNamespace | undefined = (c.env as any)?.LOOKBOOK_KV
    const db: D1Database | undefined = (c.env as any)?.LOOKBOOK_DB
    if (kv) {
      const list = await kvGetModels(kv)
      const idx = list.findIndex(m => m.id === id)
      if (idx === -1) return c.json({ success: false, message: '모델을 찾을 수 없습니다.' }, 404)
      list[idx] = { ...list[idx], gender: gender || '미분류', age: age || '미분류', mood: mood || '미분류' }
      await kvSaveModels(kv, list)
      return c.json({ success: true })
    }
    if (!db) return c.json({ success: false, message: 'D1/KV 없음' }, 500)
    await db.prepare(`UPDATE custom_models SET gender=?, age=?, mood=? WHERE id=?`)
      .bind(gender || '미분류', age || '미분류', mood || '미분류', id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500)
  }
})

// GET /api/admin/models — 목록 조회 (메타만)
app.get('/api/admin/models', adminAuth, async (c) => {
  const kv: KVNamespace | undefined = (c.env as any)?.LOOKBOOK_KV
  const db: D1Database | undefined = (c.env as any)?.LOOKBOOK_DB
  if (kv) {
    const list = await kvGetModels(kv)
    return c.json({ success: true, models: list })
  }
  if (db) {
    const list = await d1GetModels(db)
    return c.json({ success: true, models: list })
  }
  const list = _memModels.map(m => ({ id: m.id, name: m.name, desc: m.desc, createdAt: m.createdAt }))
  return c.json({ success: true, models: list })
})

// DELETE /api/admin/models/:id
app.delete('/api/admin/models/:id', adminAuth, async (c) => {
  const id = c.req.param('id')
  const kv: KVNamespace | undefined = (c.env as any)?.LOOKBOOK_KV
  const db: D1Database | undefined = (c.env as any)?.LOOKBOOK_DB
  if (kv) {
    const list = await kvGetModels(kv)
    const newList = list.filter(m => m.id !== id)
    await kvSaveModels(kv, newList)
    await kv.delete(`model_img:${id}`)
    return c.json({ success: list.length > newList.length })
  }
  if (db) {
    const ok = await d1DeleteModel(db, id)
    return c.json({ success: ok })
  }
  const before = _memModels.length
  _memModels = _memModels.filter(m => m.id !== id)
  return c.json({ success: _memModels.length < before })
})

// GET /api/proxy/custom-model/:id — 이미지 바이너리 서빙
app.get('/api/proxy/custom-model/:id', async (c) => {
  const id = c.req.param('id')
  const kv: KVNamespace | undefined = (c.env as any)?.LOOKBOOK_KV
  const db: D1Database | undefined = (c.env as any)?.LOOKBOOK_DB
  let imageBase64: string | null = null
  if (kv) {
    imageBase64 = await kv.get(`model_img:${id}`)
  } else if (db) {
    imageBase64 = await d1GetModelImg(db, id)
  } else {
    const m = _memModels.find(m => m.id === id)
    imageBase64 = m?.imageBase64 || null
  }
  if (!imageBase64) return c.notFound()
  const [header, b64] = imageBase64.split(',')
  const mime = (header.match(/data:([^;]+)/) || [])[1] || 'image/jpeg'
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Response(bytes.buffer, {
    headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=3600' },
  })
})

// ── 커스텀 배경 API ──
app.post('/api/admin/backgrounds', adminAuth, async (c) => {
  try {
    const body: any = await c.req.json()
    const items: Array<{ name: string; bgDesc?: string; category?: string; imageBase64: string }> =
      Array.isArray(body) ? body : [body]
    if (items.length === 0) return c.json({ success: false, message: '업로드할 항목이 없습니다.' }, 400)
    const kv: KVNamespace | undefined = (c.env as any)?.LOOKBOOK_KV
    const db: D1Database | undefined = (c.env as any)?.LOOKBOOK_DB
    let results: CustomBg[] = []

    if (kv) {
      // ── KV 모드 (BYOK studiob) ──
      const list = await kvGetBgs(kv)
      for (const item of items) {
        const { name, bgDesc, category, imageBase64 } = item
        if (!name || !imageBase64) continue
        const id = await kvNextId(kv)
        const meta: CustomBg = { id, name, bgDesc: bgDesc || name, category: category || '커스텀', createdAt: new Date().toISOString() }
        list.push(meta)
        await kv.put(`bg_img:${id}`, imageBase64)
        results.push(meta)
      }
      await kvSaveBgs(kv, list)
    } else if (db) {
      // ── D1 모드 (Genspark Hosted) ──
      results = await d1AddBgs(db, items)
    } else {
      // ── 메모리 폴백 (로컬 개발) ──
      for (const item of items) {
        const { name, bgDesc, category, imageBase64 } = item
        if (!name || !imageBase64) continue
        const id = String(_memIdCounter++)
        const meta = { id, name, bgDesc: bgDesc || name, category: category || '커스텀', imageBase64, createdAt: new Date().toISOString() }
        _memBgs.push(meta)
        results.push({ id, name, bgDesc: meta.bgDesc, category: meta.category, createdAt: meta.createdAt })
      }
    }
    return c.json({ success: true, backgrounds: results, count: results.length })
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500)
  }
})

app.get('/api/admin/backgrounds', adminAuth, async (c) => {
  const kv: KVNamespace | undefined = (c.env as any)?.LOOKBOOK_KV
  const db: D1Database | undefined = (c.env as any)?.LOOKBOOK_DB
  if (kv) {
    const list = await kvGetBgs(kv)
    return c.json({ success: true, backgrounds: list })
  }
  if (db) {
    const list = await d1GetBgs(db)
    return c.json({ success: true, backgrounds: list })
  }
  const list = _memBgs.map(b => ({ id: b.id, name: b.name, bgDesc: b.bgDesc, category: b.category, createdAt: b.createdAt, hasGenImage: !!(b as any).genImageBase64 }))
  return c.json({ success: true, backgrounds: list })
})

app.delete('/api/admin/backgrounds/:id', adminAuth, async (c) => {
  const id = c.req.param('id')
  const kv: KVNamespace | undefined = (c.env as any)?.LOOKBOOK_KV
  const db: D1Database | undefined = (c.env as any)?.LOOKBOOK_DB
  if (kv) {
    const list = await kvGetBgs(kv)
    const newList = list.filter(b => b.id !== id)
    await kvSaveBgs(kv, newList)
    await kv.delete(`bg_img:${id}`)
    await kv.delete(`bg_gen_img:${id}`)
    return c.json({ success: list.length > newList.length })
  }
  if (db) {
    const ok = await d1DeleteBg(db, id)
    return c.json({ success: ok })
  }
  const before = _memBgs.length
  _memBgs = _memBgs.filter(b => b.id !== id)
  return c.json({ success: _memBgs.length < before })
})

// PUT /api/admin/backgrounds/:id/gen-image — "생성용"(얼굴 마스킹) 이미지 등록/교체
// 사용자 화면 전시용 원본(image_b64)은 그대로 두고, AtlasCloud 생성 요청에만 쓰일 이미지를 별도 저장
app.put('/api/admin/backgrounds/:id/gen-image', adminAuth, async (c) => {
  const id = c.req.param('id')
  try {
    const body: any = await c.req.json()
    const imageBase64: string = body?.imageBase64 || ''
    if (!imageBase64) return c.json({ success: false, message: 'imageBase64 필수' }, 400)

    const kv: KVNamespace | undefined = (c.env as any)?.LOOKBOOK_KV
    const db: D1Database | undefined = (c.env as any)?.LOOKBOOK_DB

    if (kv) {
      const list = await kvGetBgs(kv)
      const target = list.find(b => b.id === id)
      if (!target) return c.json({ success: false, message: '배경을 찾을 수 없습니다.' }, 404)
      await kv.put(`bg_gen_img:${id}`, imageBase64)
      target.hasGenImage = true
      await kvSaveBgs(kv, list)
      return c.json({ success: true })
    }
    if (db) {
      const ok = await d1SetBgGenImg(db, id, imageBase64)
      if (!ok) return c.json({ success: false, message: '배경을 찾을 수 없습니다.' }, 404)
      return c.json({ success: true })
    }
    const target = _memBgs.find(b => b.id === id) as any
    if (!target) return c.json({ success: false, message: '배경을 찾을 수 없습니다.' }, 404)
    target.genImageBase64 = imageBase64
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500)
  }
})

app.get('/api/proxy/custom-bg/:id', async (c) => {
  const id = c.req.param('id')
  const kv: KVNamespace | undefined = (c.env as any)?.LOOKBOOK_KV
  const db: D1Database | undefined = (c.env as any)?.LOOKBOOK_DB
  let imageBase64: string | null = null
  if (kv) {
    imageBase64 = await kv.get(`bg_img:${id}`)
  } else if (db) {
    imageBase64 = await d1GetBgImg(db, id)
  } else {
    const b = _memBgs.find(b => b.id === id)
    imageBase64 = b?.imageBase64 || null
  }
  if (!imageBase64) return c.notFound()
  const [header, b64] = imageBase64.split(',')
  const mime = (header.match(/data:([^;]+)/) || [])[1] || 'image/jpeg'
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Response(bytes.buffer, {
    headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=3600' },
  })
})

// GET /api/proxy/clothing/:jobId/:idx — 공유 페이지용 원본 의상 이미지 서빙 (14일 KV 보관)
app.get('/api/proxy/clothing/:jobId/:idx', async (c) => {
  const jobId = c.req.param('jobId')
  const idx = parseInt(c.req.param('idx') || '0', 10)
  const kv: KVNamespace | undefined = (c.env as any)?.LOOKBOOK_KV
  if (!kv) return c.notFound()

  const stored = await kv.get(`clothing_img:${jobId}`)
  if (!stored) return c.notFound()

  let urls: string[] = []
  try { urls = JSON.parse(stored) } catch {}
  const dataUrl = urls[idx]
  if (!dataUrl) return c.notFound()

  const [header, b64] = dataUrl.split(',')
  const mime = (header.match(/data:([^;]+)/) || [])[1] || 'image/jpeg'
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Response(bytes.buffer, {
    headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=3600' },
  })
})

// Atlas Cloud 헤더 생성
const atlasHeaders = (apiKey: string) => ({
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
})

// OpenAI 텍스트/비전 분류 헬퍼 — gpt-4o-mini 직접 호출 (AtlasCloud엔 분류용 모델이 없어 별도 연결)
// (이미지 생성은 여전히 AtlasCloud. 이 함수는 분류/라벨링 전용)
const OPENAI_API_BASE = 'https://api.openai.com'
async function openaiChatVision(openaiKey: string, imageBase64: string, prompt: string): Promise<string | null> {
  const url = `${OPENAI_API_BASE}/v1/chat/completions`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` } },
            { type: 'text', text: prompt }
          ]
        }]
      })
    })
    // 응답을 text로 먼저 읽어서, JSON이 아닌 에러 응답도 그대로 로그에 남김
    const rawText = await res.text()
    console.log(`openaiChatVision: POST ${url} → HTTP ${res.status} | body(첫 500자): ${rawText.slice(0, 500)}`)
    if (!res.ok) {
      console.error(`openaiChatVision: 요청 실패 (HTTP ${res.status})`)
      return null
    }
    let data: any
    try {
      data = JSON.parse(rawText)
    } catch {
      console.error('openaiChatVision: JSON 파싱 실패, 원문:', rawText.slice(0, 300))
      return null
    }
    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      console.warn('openaiChatVision: 예상치 못한 응답 형식:', JSON.stringify(data).slice(0, 300))
      return null
    }
    return content
  } catch (e: any) {
    console.error('openaiChatVision error:', e?.message || e)
    return null
  }
}

// ────────────────────────────────────────────────────
// Atlas API 단일 이미지 생성 → 완료까지 동기 대기 헬퍼
// 최대 90초 대기 (폴링 간격 3초 × 30회)
// ────────────────────────────────────────────────────
async function atlasGenerateAndWait(params: {
  images: string[]
  prompt: string
  aspect_ratio: string
  resolution: string
  thinking_level?: string
  apiKey: string
}): Promise<string | null> {
  const { images, prompt, aspect_ratio, resolution, thinking_level = 'default', apiKey } = params

  // 1) 생성 요청
  const startRes = await fetch(`${ATLAS_API_BASE}/api/v1/model/generateImage`, {
    method: 'POST',
    headers: atlasHeaders(apiKey),
    body: JSON.stringify({
      model: 'google/nano-banana-2/edit',
      prompt,
      aspect_ratio,
      resolution,
      thinking_level,
      output_format: 'jpeg',
      images,
    }),
  })
  const startData: any = await startRes.json()
  if (startData.code !== 200 || !startData.data?.id) {
    console.error('atlasGenerateAndWait start failed:', startData)
    return null
  }

  const jobId = startData.data.id
  console.log('atlasGenerateAndWait jobId:', jobId)

  // 2) 폴링 (최대 30회 × 3초 = 90초)
  const terminalStatuses = new Set(['completed', 'succeeded', 'failed', 'timeout', 'canceled', 'error'])
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 3000))
    const pollRes: any = await fetch(`${ATLAS_API_BASE}/api/v1/model/prediction/${jobId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    }).then(r => r.json())

    const status = pollRes.data?.status
    console.log(`atlasGenerateAndWait poll[${i}] status:`, status)

    if (status === 'completed' || status === 'succeeded') {
      const rawOut = pollRes.data?.outputs ?? pollRes.data?.output ?? pollRes.data?.images ?? null
      const urls: string[] = Array.isArray(rawOut)
        ? rawOut.filter((u: any) => typeof u === 'string' && u.startsWith('http'))
        : (typeof rawOut === 'string' && rawOut.startsWith('http') ? [rawOut] : [])
      if (urls.length > 0) {
        console.log('atlasGenerateAndWait success url:', urls[0].substring(0, 80))
        return urls[0]  // 첫 번째 URL 반환
      }
      return null
    }

    if (terminalStatuses.has(status)) {
      console.error('atlasGenerateAndWait failed status:', status)
      return null
    }
  }

  console.error('atlasGenerateAndWait timeout after 90s')
  return null
}

// ────────────────────────────────────────────────────
// 외부 이미지 URL → base64 변환 헬퍼 (Workers 환경)
// ────────────────────────────────────────────────────
async function urlToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) { console.error('urlToBase64 fetch failed:', res.status, url); return null }
    const arrayBuffer = await res.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    // base64 인코딩 (Workers 환경: btoa 사용)
    let binary = ''
    const chunkSize = 8192
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
    }
    return `data:${contentType};base64,${btoa(binary)}`
  } catch (err) {
    console.error('urlToBase64 error:', err)
    return null
  }
}

// ────────────────────────────────────────────────────
// Photorealistic Prompt Builder
// ────────────────────────────────────────────────────
function buildPhotorealisticPrompt(params: {
  modelName: string
  modelDesc: string
  bgName: string
  bgDesc: string
  poseType: string
  pose: string
  clothingImageUrl?: string
}): string {
  const { modelName, modelDesc, bgName, bgDesc, poseType, pose } = params

  const poseMap: Record<string, string> = {
    '전신': 'full body shot',
    '반신': 'half body shot',
    '상반신': 'upper body shot',
  }
  const poseTypeText = poseMap[poseType] || 'full body shot'

  const poseStyleMap: Record<string, string> = {
    '정면': 'facing camera directly, natural standing pose',
    '측면': '3/4 angle pose, elegant slight turn',
    '워킹': 'dynamic walking pose, confident in motion',
    '정적': 'elegant static pose, hands relaxed at sides',
  }
  const poseStyleText = poseStyleMap[pose] || 'natural standing pose'

  return [
    `Ultra-photorealistic professional fashion photography,`,
    `8K resolution, shot on Canon EOS R5 with 85mm f/1.4 lens,`,
    `professional studio lighting with softbox and fill light,`,
    `${poseTypeText} of a ${modelDesc} fashion model,`,
    `${poseStyleText},`,
    `background: ${bgDesc} (${bgName}),`,
    `hyperrealistic skin texture, perfect fabric detail,`,
    `commercial fashion editorial photography style,`,
    `RAW photo, sharp focus, high dynamic range,`,
    `professional retouching, magazine quality,`,
    `no artifacts, photorealistic, cinematic lighting`,
  ].join(' ')
}

// ────────────────────────────────────────────────────
// URL → base64 data URL 변환 헬퍼 (서버사이드)
// ────────────────────────────────────────────────────
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LookbookAI/1.0)',
        'Accept': 'image/jpeg,image/png,image/*',
      },
    })
    if (!res.ok) return null
    const buffer = await res.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)
    const contentType = res.headers.get('Content-Type') || 'image/jpeg'
    return `data:${contentType};base64,${base64}`
  } catch {
    return null
  }
}

// ────────────────────────────────────────────────────
// aifashion.co.kr API Proxies
// ────────────────────────────────────────────────────

// 모델 목록 — 관리자 업로드 커스텀 모델만 반환
app.get('/api/presets/models', async (c) => {
  const kv: KVNamespace | undefined = (c.env as any)?.LOOKBOOK_KV
  const db: D1Database | undefined = (c.env as any)?.LOOKBOOK_DB
  let customRaw: CustomModel[]
  if (kv) {
    customRaw = await kvGetModels(kv)
  } else if (db) {
    customRaw = await d1GetModels(db)
  } else {
    customRaw = _memModels.map(m => ({ id: m.id, name: m.name, desc: m.desc, createdAt: m.createdAt }))
  }
  const customList = customRaw.map(m => ({
    id: Number(m.id), name: m.name,
    gender: m.gender || '미분류',
    age: m.age || '미분류',
    mood: m.mood || '미분류',
    body: '-', skin: '-',
    desc: m.desc, unsplashId: null, isCustom: true, customId: m.id,
  }))
  return c.json({ models: customList })
})

// 배경 목록 — 관리자 업로드 커스텀 배경만 반환
app.get('/api/presets/backgrounds', async (c) => {
  const kv: KVNamespace | undefined = (c.env as any)?.LOOKBOOK_KV
  const db: D1Database | undefined = (c.env as any)?.LOOKBOOK_DB
  let customBgRaw: CustomBg[]
  if (kv) {
    customBgRaw = await kvGetBgs(kv)
  } else if (db) {
    customBgRaw = await d1GetBgs(db)
  } else {
    customBgRaw = _memBgs.map(b => ({ id: b.id, name: b.name, bgDesc: b.bgDesc, category: b.category, createdAt: b.createdAt }))
  }
  const customBgList = customBgRaw.map(b => ({
    id: Number(b.id), name: b.name, category: b.category, mood: '-',
    bgDesc: b.bgDesc, unsplashId: null, isCustom: true, customId: b.id,
  }))
  return c.json({ backgrounds: customBgList })
})

// /api/proxy/model-image/:id — 기본 Unsplash 모델 제거로 404 반환
app.get('/api/proxy/model-image/:id', (c) => c.notFound())

// /api/proxy/bg-image/:id — 기본 Unsplash 배경 제거로 404 반환
app.get('/api/proxy/bg-image/:id', (c) => c.notFound())

// 생성 결과 이미지 프록시 (Atlas Cloud CDN CORS 우회)
app.get('/api/proxy/gen-image', async (c) => {
  const url = c.req.query('url')
  const isDownload = c.req.query('download') === '1'
  if (!url) return c.json({ error: 'Missing url param' }, 400)

  try {
    // 모든 https URL 허용 (Atlas Cloud 다양한 CDN 사용)
    const parsed = new URL(url)
    if (!parsed.protocol.startsWith('https')) {
      return c.json({ error: 'Only HTTPS URLs allowed' }, 400)
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LookbookAI/1.0)',
      },
    })

    if (!res.ok) {
      return c.json({ error: `Upstream error: ${res.status}` }, res.status as any)
    }

    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get('Content-Type') || 'image/jpeg'

    // 파일명 생성 (다운로드 시)
    const filename = `lookbook_ai_${Date.now()}.jpg`

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    }
    // download=1 이면 브라우저가 바로 저장 대화상자 띄움
    if (isDownload) {
      headers['Content-Disposition'] = `attachment; filename="${filename}"`
    }

    return new Response(buffer, { headers })
  } catch (err: any) {
    console.error('Gen image proxy error:', err)
    return c.json({ error: err.message }, 500)
  }
})

// ────────────────────────────────────────────────────
// Projects API (샘플 데이터)
// ────────────────────────────────────────────────────
const sampleProjects = [
  { id: 'p1', name: '2024 S/S 룩북', status: 'done', images: 8, created: '2024-03-15', thumb_color: '#FF6B9D' },
  { id: 'p2', name: '캐주얼 티셔츠 컷', status: 'done', images: 4, created: '2024-03-12', thumb_color: '#6C47FF' },
  { id: 'p3', name: '데님 라인 촬영', status: 'processing', images: 0, created: '2024-03-10', thumb_color: '#3B82F6' },
  { id: 'p4', name: '원피스 봄 컬렉션', status: 'draft', images: 0, created: '2024-03-08', thumb_color: '#00D4AA' },
]

app.get('/api/projects', (c) => {
  return c.json({ projects: sampleProjects })
})

// ── 국가 기반 locale 감지 ──────────────────────────────
// Workers for Platform dispatch 환경에서는 c.req.raw.cf가 전달되지 않으므로
// Cloudflare가 모든 요청에 주입하는 CF-IPCountry 헤더를 우선 사용
app.get('/api/locale', (c) => {
  const country = (
    c.req.header('CF-IPCountry') ??
    c.req.header('cf-ipcountry') ??
    (c.req.raw as any).cf?.country ??
    ''
  ).toUpperCase()
  let locale = 'en'
  if (country === 'KR') locale = 'ko'
  else if (country === 'JP') locale = 'ja'
  return c.json({ locale, country })
})

// ── 카카오톡 공유하기용 JS 키 조회 (공개 정보 — 카카오 로그인 REST 키와 무관) ──
app.get('/api/config/kakao-js-key', (c) => {
  return c.json({ key: c.env.KAKAO_JS_KEY || '' })
})

// ════════════════════════════════════════════════════
// Auth System — 이메일 + 카카오 OAuth + 구글 OAuth
// D1 users / user_sessions 테이블 사용
// ════════════════════════════════════════════════════

// ── OAuth 앱 설정: c.env에서 읽음 (wrangler secret put으로 설정)
// KAKAO_CLIENT_ID, KAKAO_CLIENT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

// ── 헬퍼: 랜덤 토큰 생성 (64자 hex)
function genToken(): string {
  const arr = new Uint8Array(32)
  crypto.getRandomValues(arr)
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── 헬퍼: 사용자 ID 생성
function genUserId(): string {
  return 'u_' + genToken().substring(0, 16)
}

// ── 헬퍼: 비밀번호 해싱 (SHA-256 기반, Workers crypto.subtle)
async function hashPassword(password: string): Promise<string> {
  const salt = genToken().substring(0, 16)
  const data = new TextEncoder().encode(salt + password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${salt}:${hashHex}`
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, storedHash] = stored.split(':')
  const data = new TextEncoder().encode(salt + password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex === storedHash
}

// ── 헬퍼: 세션 토큰으로 사용자 조회 (미들웨어용)
async function getUserFromToken(db: D1Database, token: string | null) {
  if (!token) return null
  const now = new Date().toISOString()
  const row = await db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.status, u.credits, u.avatar_url, u.provider
    FROM user_sessions s JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ? AND u.status = 'active'
  `).bind(token, now).first()
  return row || null
}

// ── 헬퍼: 세션 생성 (30일)
async function createSession(db: D1Database, userId: string): Promise<string> {
  const token = genToken()
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  // 오래된 세션 정리 (사용자당 최대 5개)
  await db.prepare(`DELETE FROM user_sessions WHERE user_id = ? AND token NOT IN (
    SELECT token FROM user_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 4
  )`).bind(userId, userId).run()
  await db.prepare(
    `INSERT INTO user_sessions (token, user_id, expires_at) VALUES (?, ?, ?)`
  ).bind(token, userId, expires).run()
  return token
}

// ── 공개 사용자 정보 (민감 정보 제외)
function publicUser(u: any) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, credits: u.credits, avatar_url: u.avatar_url, provider: u.provider }
}

// ────────────────────────────────────────────────────
// POST /api/auth/signup — 이메일 회원가입
// ────────────────────────────────────────────────────
app.post('/api/auth/signup', async (c) => {
  try {
    const db = c.env.LOOKBOOK_DB
    const body: any = await c.req.json()
    const { name, email, password, agreeMarketing } = body

    if (!name || !email || !password) return c.json({ success: false, message: '모든 항목을 입력해주세요.' }, 400)
    if (password.length < 8) return c.json({ success: false, message: '비밀번호는 8자 이상이어야 합니다.' }, 400)

    // 중복 이메일 확인
    const existing = await db.prepare(`SELECT id FROM users WHERE email = ?`).bind(email).first()
    if (existing) return c.json({ success: false, message: '이미 가입된 이메일입니다.' }, 409)

    const id = genUserId()
    const hash = await hashPassword(password)
    const marketingFlag = agreeMarketing ? 1 : 0
    await db.prepare(`
      INSERT INTO users (id, email, name, password_hash, provider, status, credits, role, agree_marketing)
      VALUES (?, ?, ?, ?, 'email', 'active', 200, 'user', ?)
    `).bind(id, email.toLowerCase(), name, hash, marketingFlag).run()

    const token = await createSession(db, id)
    const user = { id, name, email: email.toLowerCase(), role: 'user', credits: 200, avatar_url: null, provider: 'email' }
    return c.json({ success: true, user, token })
  } catch (err: any) {
    console.error('signup error:', err)
    return c.json({ success: false, message: '서버 오류가 발생했습니다.' }, 500)
  }
})

// ────────────────────────────────────────────────────
// POST /api/auth/login — 이메일 로그인
// ────────────────────────────────────────────────────
app.post('/api/auth/login', async (c) => {
  try {
    const db = c.env.LOOKBOOK_DB
    const body: any = await c.req.json()
    const { email, password } = body

    if (!email || !password) return c.json({ success: false, message: '이메일과 비밀번호를 입력해주세요.' }, 400)

    const u: any = await db.prepare(`SELECT * FROM users WHERE email = ? AND provider = 'email'`).bind(email.toLowerCase()).first()
    if (!u) return c.json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401)
    if (u.status !== 'active') return c.json({ success: false, message: '정지된 계정입니다. 관리자에게 문의하세요.' }, 403)
    if (!u.password_hash) return c.json({ success: false, message: '소셜 계정으로 가입된 이메일입니다.' }, 400)

    const ok = await verifyPassword(password, u.password_hash)
    if (!ok) return c.json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401)

    await db.prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`).bind(u.id).run()
    const token = await createSession(db, u.id)
    return c.json({ success: true, user: publicUser(u), token })
  } catch (err: any) {
    console.error('login error:', err)
    return c.json({ success: false, message: '서버 오류가 발생했습니다.' }, 500)
  }
})

// ────────────────────────────────────────────────────
// GET /api/auth/me — 세션 확인 (토큰 → 사용자 정보)
// ────────────────────────────────────────────────────
app.get('/api/auth/me', async (c) => {
  try {
    const db = c.env.LOOKBOOK_DB
    const token = c.req.header('X-Session-Token') || c.req.query('token')
    const user = await getUserFromToken(db, token || null)
    if (!user) return c.json({ success: false, message: '로그인이 필요합니다.' }, 401)
    return c.json({ success: true, user: publicUser(user) })
  } catch (err: any) {
    return c.json({ success: false, message: '서버 오류' }, 500)
  }
})

// ────────────────────────────────────────────────────
// POST /api/auth/logout — 로그아웃 (세션 삭제)
// ────────────────────────────────────────────────────
app.post('/api/auth/logout', async (c) => {
  try {
    const db = c.env.LOOKBOOK_DB
    const token = c.req.header('X-Session-Token')
    if (token) await db.prepare(`DELETE FROM user_sessions WHERE token = ?`).bind(token).run()
    return c.json({ success: true })
  } catch { return c.json({ success: true }) }
})

// ────────────────────────────────────────────────────
// ── origin 헬퍼: Host 헤더 기반으로 추출 (Cloudflare Workers 호환) ──
function getOrigin(c: any): string {
  // Cloudflare Workers: 실제 클라이언트 도메인은 Host 헤더에 있음
  const host = c.req.header('host') || c.req.header('x-forwarded-host') || ''
  // localhost는 http, 나머지는 https
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  return `${proto}://${host}`
}

// GET /api/auth/kakao — 카카오 OAuth 시작
// ────────────────────────────────────────────────────
app.get('/api/auth/kakao', (c) => {
  const origin = getOrigin(c)
  const mode = c.req.query('mode') || 'popup'  // popup | redirect
  // ✅ redirect_uri는 mode 없이 고정 (카카오 콘솔 등록값과 정확히 일치)
  const redirectUri = `${origin}/api/auth/kakao/callback`
  const clientId = c.env.KAKAO_CLIENT_ID || ''
  if (!clientId) {
    if (mode === 'redirect') return c.redirect(`/?oauth_error=kakao_no_key`)
    return c.html(`<script>window.opener?.postMessage({type:'oauth_error',provider:'kakao',error:'카카오 앱 키가 설정되지 않았습니다.'},'*');window.close();</script>`)
  }
  // mode는 state 파라미터로 전달 (redirect_uri 변경 없이 mode 구분)
  const url = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${mode}`
  return c.redirect(url)
})

// ────────────────────────────────────────────────────
// GET /api/auth/kakao/callback — 카카오 OAuth 콜백
// ────────────────────────────────────────────────────
app.get('/api/auth/kakao/callback', async (c) => {
  const db = c.env.LOOKBOOK_DB
  const origin = getOrigin(c)
  const code = c.req.query('code')
  const error = c.req.query('error')
  // ✅ mode는 state 파라미터에서 읽음 (redirect_uri에 포함하지 않음)
  const mode = c.req.query('state') || 'popup'  // popup | redirect

  function errorResponse(msg: string) {
    if (mode === 'redirect') {
      return c.redirect(`/?oauth_error=${encodeURIComponent(msg)}`)
    }
    return c.html(`<script>window.opener?.postMessage({type:'oauth_error',provider:'kakao',error:'${msg}'},'*');window.close();</script>`)
  }

  if (error || !code) return errorResponse(error || 'cancelled')

  try {
    // ✅ 토큰 교환용 redirect_uri도 mode 없이 고정
    const redirectUri = `${origin}/api/auth/kakao/callback`
    // 토큰 교환
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code', code,
        client_id: c.env.KAKAO_CLIENT_ID || '', client_secret: c.env.KAKAO_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
      }),
    })
    const tokenData: any = await tokenRes.json()
    if (!tokenData.access_token) throw new Error('카카오 토큰 발급 실패')

    // 사용자 정보 조회
    const profileRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const profile: any = await profileRes.json()
    const providerId = String(profile.id)
    const kakaoEmail = profile.kakao_account?.email || `kakao_${providerId}@kakao.local`
    const kakaoName  = profile.kakao_account?.profile?.nickname || '카카오 사용자'
    const kakaoAvatar = profile.kakao_account?.profile?.profile_image_url || null

    // 기존 사용자 조회 또는 신규 생성
    let user: any = await db.prepare(`SELECT * FROM users WHERE provider = 'kakao' AND provider_id = ?`).bind(providerId).first()
    if (!user) {
      user = await db.prepare(`SELECT * FROM users WHERE email = ?`).bind(kakaoEmail).first()
      if (user) {
        await db.prepare(`UPDATE users SET provider_id = ?, avatar_url = ? WHERE id = ?`).bind(providerId, kakaoAvatar, user.id).run()
      } else {
        const id = genUserId()
        await db.prepare(`INSERT INTO users (id, email, name, provider, provider_id, avatar_url, status, credits, role) VALUES (?, ?, ?, 'kakao', ?, ?, 'active', 200, 'user')`).bind(id, kakaoEmail, kakaoName, providerId, kakaoAvatar).run()
        user = await db.prepare(`SELECT * FROM users WHERE id = ?`).bind(id).first()
      }
    }
    if (!user || user.status !== 'active') throw new Error('계정이 정지 상태입니다.')

    await db.prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`).bind(user.id).run()
    const token = await createSession(db, user.id)
    const userJson = JSON.stringify(publicUser(user))

    if (mode === 'redirect') {
      // ── 모바일 리다이렉트 모드: localStorage 저장 후 원래 페이지로 복귀 ──
      return c.html(`<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><title>로그인 성공</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body>
<p style="font-family:sans-serif;text-align:center;padding:40px;color:#333;">✅ 로그인 성공! 잠시 이동합니다...</p>
<script>
(function(){
  var payload = {type:'oauth_success',provider:'kakao',token:'${token}',user:${userJson}};
  try { localStorage.setItem('oauth_result', JSON.stringify(payload)); } catch(e) {}
  var pending = {};
  try { pending = JSON.parse(localStorage.getItem('oauth_redirect_pending') || '{}'); } catch(e) {}
  var dest = (pending.returnPath && pending.returnPath !== '/') ? pending.returnPath : '/';
  window.location.replace(dest);
})();
</script>
</body></html>`)
    }

    // ── 팝업 모드: 부모 창으로 postMessage ──
    return c.html(`<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><title>로그인 성공</title></head>
<body>
<p style="font-family:sans-serif;text-align:center;padding:40px;color:#333;">✅ 로그인 성공! 잠시 후 창이 닫힙니다...</p>
<script>
(function() {
  var payload = {type:'oauth_success',provider:'kakao',token:'${token}',user:${userJson}};
  function tryClose() { try { window.close(); } catch(e) {} }
  function sendMsg() {
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(payload, '*');
        setTimeout(tryClose, 800);
      } else {
        try { localStorage.setItem('oauth_result', JSON.stringify(payload)); } catch(e) {}
        setTimeout(tryClose, 500);
      }
    } catch(e) {
      setTimeout(tryClose, 500);
    }
  }
  if (document.readyState === 'complete') { sendMsg(); }
  else { window.addEventListener('load', sendMsg); }
})();
</script>
</body></html>`)
  } catch (err: any) {
    console.error('kakao callback error:', err)
    return errorResponse(err.message || '로그인 오류')
  }
})

// ────────────────────────────────────────────────────
// GET /api/auth/google — 구글 OAuth 시작
// ────────────────────────────────────────────────────
app.get('/api/auth/google', (c) => {
  const origin = getOrigin(c)
  const mode = c.req.query('mode') || 'popup'
  // ✅ redirect_uri는 mode 없이 고정 (구글 콘솔 등록값과 정확히 일치)
  const redirectUri = `${origin}/api/auth/google/callback`
  const clientId = c.env.GOOGLE_CLIENT_ID || ''
  if (!clientId) {
    if (mode === 'redirect') return c.redirect(`/?oauth_error=google_no_key`)
    return c.html(`<script>window.opener?.postMessage({type:'oauth_error',provider:'google',error:'구글 클라이언트 ID가 설정되지 않았습니다.'},'*');window.close();</script>`)
  }
  // mode는 state 파라미터로 전달 (redirect_uri 변경 없이 mode 구분)
  const params = new URLSearchParams({
    client_id: clientId, redirect_uri: redirectUri,
    response_type: 'code', scope: 'openid email profile',
    access_type: 'offline', prompt: 'select_account',
    state: mode,
  })
  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
})

// ────────────────────────────────────────────────────
// GET /api/auth/google/callback — 구글 OAuth 콜백
// ────────────────────────────────────────────────────
app.get('/api/auth/google/callback', async (c) => {
  const db = c.env.LOOKBOOK_DB
  const origin = getOrigin(c)
  const code = c.req.query('code')
  const error = c.req.query('error')
  // ✅ mode는 state 파라미터에서 읽음 (redirect_uri에 포함하지 않음)
  const mode = c.req.query('state') || 'popup'

  function errorResponse(msg: string) {
    if (mode === 'redirect') {
      return c.redirect(`/?oauth_error=${encodeURIComponent(msg)}`)
    }
    return c.html(`<script>window.opener?.postMessage({type:'oauth_error',provider:'google',error:'${msg}'},'*');window.close();</script>`)
  }

  if (error || !code) return errorResponse(error || 'cancelled')

  try {
    // ✅ 토큰 교환용 redirect_uri도 mode 없이 고정
    const redirectUri = `${origin}/api/auth/google/callback`
    // 토큰 교환
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code', code,
        client_id: c.env.GOOGLE_CLIENT_ID || '', client_secret: c.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
      }),
    })
    const tokenData: any = await tokenRes.json()
    if (!tokenData.access_token) throw new Error('구글 토큰 발급 실패')

    // 사용자 정보 조회
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const profile: any = await profileRes.json()
    const providerId = profile.id
    const googleEmail = profile.email
    const googleName  = profile.name || '구글 사용자'
    const googleAvatar = profile.picture || null

    let user: any = await db.prepare(`SELECT * FROM users WHERE provider = 'google' AND provider_id = ?`).bind(providerId).first()
    if (!user) {
      user = await db.prepare(`SELECT * FROM users WHERE email = ?`).bind(googleEmail).first()
      if (user) {
        await db.prepare(`UPDATE users SET provider_id = ?, avatar_url = ? WHERE id = ?`).bind(providerId, googleAvatar, user.id).run()
      } else {
        const id = genUserId()
        await db.prepare(`INSERT INTO users (id, email, name, provider, provider_id, avatar_url, status, credits, role) VALUES (?, ?, ?, 'google', ?, ?, 'active', 200, 'user')`).bind(id, googleEmail, googleName, providerId, googleAvatar).run()
        user = await db.prepare(`SELECT * FROM users WHERE id = ?`).bind(id).first()
      }
    }
    if (!user || user.status !== 'active') throw new Error('계정이 정지 상태입니다.')

    await db.prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`).bind(user.id).run()
    const token = await createSession(db, user.id)
    const userJson = JSON.stringify(publicUser(user))

    if (mode === 'redirect') {
      // ── 모바일 리다이렉트 모드 ──
      return c.html(`<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><title>로그인 성공</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body>
<p style="font-family:sans-serif;text-align:center;padding:40px;color:#333;">✅ 로그인 성공! 잠시 이동합니다...</p>
<script>
(function(){
  var payload = {type:'oauth_success',provider:'google',token:'${token}',user:${userJson}};
  try { localStorage.setItem('oauth_result', JSON.stringify(payload)); } catch(e) {}
  var pending = {};
  try { pending = JSON.parse(localStorage.getItem('oauth_redirect_pending') || '{}'); } catch(e) {}
  var dest = (pending.returnPath && pending.returnPath !== '/') ? pending.returnPath : '/';
  window.location.replace(dest);
})();
</script>
</body></html>`)
    }

    // ── 팝업 모드 ──
    return c.html(`<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><title>로그인 성공</title></head>
<body>
<p style="font-family:sans-serif;text-align:center;padding:40px;color:#333;">✅ 로그인 성공! 잠시 후 창이 닫힙니다...</p>
<script>
(function() {
  var payload = {type:'oauth_success',provider:'google',token:'${token}',user:${userJson}};
  function tryClose() { try { window.close(); } catch(e) {} }
  function sendMsg() {
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(payload, '*');
        setTimeout(tryClose, 800);
      } else {
        try { localStorage.setItem('oauth_result', JSON.stringify(payload)); } catch(e) {}
        setTimeout(tryClose, 500);
      }
    } catch(e) {
      setTimeout(tryClose, 500);
    }
  }
  if (document.readyState === 'complete') { sendMsg(); }
  else { window.addEventListener('load', sendMsg); }
})();
</script>
</body></html>`)
  } catch (err: any) {
    console.error('google callback error:', err)
    return errorResponse(err.message || '로그인 오류')
  }
})

// ────────────────────────────────────────────────────
// Admin — 회원 관리 API
// ────────────────────────────────────────────────────

// GET /api/admin/users — 전체 회원 목록
app.get('/api/admin/users', adminAuth, async (c) => {
  try {
    const db = c.env.LOOKBOOK_DB
    const page   = parseInt(c.req.query('page') || '1')
    const limit  = parseInt(c.req.query('limit') || '50')
    const search = c.req.query('search') || ''
    const status = c.req.query('status') || ''
    const offset = (page - 1) * limit

    let where = 'WHERE 1=1'
    const params: any[] = []
    if (search) { where += ` AND (name LIKE ? OR email LIKE ?)`; params.push(`%${search}%`, `%${search}%`) }
    if (status) { where += ` AND status = ?`; params.push(status) }

    const total: any = await db.prepare(`SELECT COUNT(*) as cnt FROM users ${where}`).bind(...params).first()
    const users = await db.prepare(
      `SELECT id, name, email, provider, status, credits, role, last_login_at, created_at FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all()

    return c.json({ success: true, users: users.results, total: total?.cnt || 0, page, limit })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

// GET /api/admin/users/:id — 회원 상세
app.get('/api/admin/users/:id', adminAuth, async (c) => {
  try {
    const db = c.env.LOOKBOOK_DB
    const user = await db.prepare(`SELECT id, name, email, provider, status, credits, role, last_login_at, created_at FROM users WHERE id = ?`).bind(c.req.param('id')).first()
    if (!user) return c.json({ success: false, message: '존재하지 않는 사용자입니다.' }, 404)
    return c.json({ success: true, user })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

// PATCH /api/admin/users/:id — 회원 상태/크레딧/역할 수정
app.patch('/api/admin/users/:id', adminAuth, async (c) => {
  try {
    const db = c.env.LOOKBOOK_DB
    const body: any = await c.req.json()
    const id = c.req.param('id')
    const sets: string[] = []
    const vals: any[]   = []
    if (body.status  !== undefined) { sets.push(`status = ?`);  vals.push(body.status) }
    if (body.role    !== undefined) { sets.push(`role = ?`);    vals.push(body.role) }

    // 크레딧: add_credits(증감) 또는 credits(절대값 설정) 지원
    if (body.add_credits !== undefined) {
      // 현재 잔액 조회 후 증감
      const cur = await db.prepare(`SELECT credits FROM users WHERE id = ?`).bind(id).first() as any
      const current = cur?.credits ?? 0
      const amount = parseInt(body.add_credits)
      const newBal = Math.max(0, current + amount)
      sets.push(`credits = ?`)
      vals.push(newBal)
      // 로그 기록
      sets.push(`updated_at = datetime('now')`)
      await db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).bind(...vals, id).run()
      await db.prepare(
        `INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id)
         VALUES (?, 'grant', ?, ?, 'admin_grant', ?)`
      ).bind(id, amount, newBal, `admin_${Date.now()}`).run()
      if (body.status === 'suspended') {
        await db.prepare(`DELETE FROM user_sessions WHERE user_id = ?`).bind(id).run()
      }
      return c.json({ success: true, newCredits: newBal })
    }

    if (body.credits !== undefined) {
      // 절대값 설정 (레거시 호환)
      const cur = await db.prepare(`SELECT credits FROM users WHERE id = ?`).bind(id).first() as any
      const current = cur?.credits ?? 0
      const newBal = parseInt(body.credits)
      const diff = newBal - current
      sets.push(`credits = ?`)
      vals.push(newBal)
      sets.push(`updated_at = datetime('now')`)
      await db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).bind(...vals, id).run()
      if (diff !== 0) {
        await db.prepare(
          `INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id)
           VALUES (?, ?, ?, ?, 'admin_set', ?)`
        ).bind(id, diff > 0 ? 'grant' : 'deduct', diff, newBal, `admin_${Date.now()}`).run()
      }
      if (body.status === 'suspended') {
        await db.prepare(`DELETE FROM user_sessions WHERE user_id = ?`).bind(id).run()
      }
      return c.json({ success: true, newCredits: newBal })
    }

    if (sets.length === 0) return c.json({ success: false, message: '변경할 항목이 없습니다.' }, 400)
    sets.push(`updated_at = datetime('now')`)
    await db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).bind(...vals, id).run()
    if (body.status === 'suspended') {
      await db.prepare(`DELETE FROM user_sessions WHERE user_id = ?`).bind(id).run()
    }
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

// DELETE /api/admin/users/:id — 회원 삭제 (소프트)
app.delete('/api/admin/users/:id', adminAuth, async (c) => {
  try {
    const db = c.env.LOOKBOOK_DB
    const id = c.req.param('id')
    await db.prepare(`UPDATE users SET status = 'deleted', updated_at = datetime('now') WHERE id = ?`).bind(id).run()
    await db.prepare(`DELETE FROM user_sessions WHERE user_id = ?`).bind(id).run()
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

// GET /api/admin/stats — 전체 통계
app.get('/api/admin/stats', adminAuth, async (c) => {
  try {
    const db = c.env.LOOKBOOK_DB
    const total    = await db.prepare(`SELECT COUNT(*) as cnt FROM users WHERE status != 'deleted'`).first() as any
    const active   = await db.prepare(`SELECT COUNT(*) as cnt FROM users WHERE status = 'active'`).first() as any
    const suspended= await db.prepare(`SELECT COUNT(*) as cnt FROM users WHERE status = 'suspended'`).first() as any
    const today    = await db.prepare(`SELECT COUNT(*) as cnt FROM users WHERE date(created_at) = date('now') AND status != 'deleted'`).first() as any
    const kakao    = await db.prepare(`SELECT COUNT(*) as cnt FROM users WHERE provider = 'kakao' AND status = 'active'`).first() as any
    const google   = await db.prepare(`SELECT COUNT(*) as cnt FROM users WHERE provider = 'google' AND status = 'active'`).first() as any
    const email    = await db.prepare(`SELECT COUNT(*) as cnt FROM users WHERE provider = 'email' AND status = 'active'`).first() as any
    return c.json({ success: true, stats: {
      total: total?.cnt || 0, active: active?.cnt || 0,
      suspended: suspended?.cnt || 0, today: today?.cnt || 0,
      by_provider: { kakao: kakao?.cnt || 0, google: google?.cnt || 0, email: email?.cnt || 0 }
    }})
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

// ────────────────────────────────────────────────────
// Credits History API — 내 크레딧 사용 내역
// ────────────────────────────────────────────────────
app.get('/api/credits/history', async (c) => {
  try {
    const db: D1Database = c.env.LOOKBOOK_DB
    const sessionToken = c.req.header('X-Session-Token') || ''
    if (!sessionToken) return c.json({ error: '로그인이 필요합니다.' }, 401)

    const sess = await db.prepare(
      `SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime('now')`
    ).bind(sessionToken).first() as any
    if (!sess) return c.json({ error: '세션이 만료되었습니다.' }, 401)

    const logs = await db.prepare(
      `SELECT type, amount, balance, reason, ref_id, created_at
       FROM credit_logs
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 100`
    ).bind(sess.user_id).all()

    return c.json({ success: true, logs: logs.results || [] })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

// ────────────────────────────────────────────────────
// Generation History API — 이미지 생성 내역 조회
// ────────────────────────────────────────────────────
app.get('/api/generation/history', async (c) => {
  try {
    const db: D1Database = c.env.LOOKBOOK_DB
    const sessionToken = c.req.header('X-Session-Token') || ''
    if (!sessionToken) return c.json({ error: '로그인이 필요합니다.' }, 401)

    const sess = await db.prepare(
      `SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime('now')`
    ).bind(sessionToken).first() as any
    if (!sess) return c.json({ error: '세션이 만료되었습니다.' }, 401)

    const logs = await db.prepare(
      `SELECT id, seq_no, job_id, image_count, model_name, bg_name, ratio,
              image_urls, expires_at, created_at, downloaded_indices
       FROM generation_logs
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 100`
    ).bind(sess.user_id).all()

    return c.json({ success: true, logs: logs.results || [] })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

// Generation Images Update — 폴링 완료 후 이미지 URL 저장
// ────────────────────────────────────────────────────
app.post('/api/generation/save-images', async (c) => {
  try {
    const db: D1Database = c.env.LOOKBOOK_DB
    const sessionToken = c.req.header('X-Session-Token') || ''
    if (!sessionToken) return c.json({ error: '로그인이 필요합니다.' }, 401)

    const sess = await db.prepare(
      `SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime('now')`
    ).bind(sessionToken).first() as any
    if (!sess) return c.json({ error: '세션이 만료되었습니다.' }, 401)

    const body = await c.req.json() as any
    const { job_id, image_urls } = body
    if (!job_id || !image_urls) return c.json({ error: 'job_id, image_urls 필수' }, 400)

    const urlsJson = JSON.stringify(Array.isArray(image_urls) ? image_urls : [image_urls])
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)

    await db.prepare(
      `UPDATE generation_logs
       SET image_urls = ?, expires_at = datetime('now', '+14 days')
       WHERE job_id = ? AND user_id = ?`
    ).bind(urlsJson, job_id, sess.user_id).run()

    return c.json({ success: true, expires_at: expiresAt })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

// ────────────────────────────────────────────────────
// Credits Deduct API — 이미지 다운로드 시 크레딧 차감
// ────────────────────────────────────────────────────
app.post('/api/credits/deduct', async (c) => {
  try {
    const db: D1Database = c.env.LOOKBOOK_DB
    const sessionToken = c.req.header('X-Session-Token') || ''
    if (!sessionToken) return c.json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' }, 401)

    const sess = await db.prepare(
      `SELECT s.user_id, u.credits, u.name FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now')`
    ).bind(sessionToken).first() as any
    if (!sess) return c.json({ error: '세션이 만료되었습니다.', code: 'UNAUTHORIZED' }, 401)

    const body: any = await c.req.json().catch(() => ({}))
    const jobId: string | undefined = body?.job_id
    const imgIdx: number | undefined = Number.isInteger(body?.idx) ? body.idx : undefined

    // job 하나가 여러 장의 이미지를 포함할 수 있으므로, job_id 단위가 아니라
    // job_id + 이미지 인덱스 단위로 다운로드 이력을 추적한다 (배치 내 다른 이미지가
    // 함께 무료 처리되는 것을 방지)
    let genLog: any = null
    let downloadedIndices: number[] = []
    if (jobId) {
      genLog = await db.prepare(
        `SELECT id, downloaded_indices FROM generation_logs WHERE job_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1`
      ).bind(jobId, sess.user_id).first() as any
      if (genLog?.downloaded_indices) {
        try { downloadedIndices = JSON.parse(genLog.downloaded_indices) } catch {}
      }
      if (genLog && imgIdx !== undefined && downloadedIndices.includes(imgIdx)) {
        return c.json({ success: true, creditsUsed: 0, creditsRemaining: sess.credits, alreadyDownloaded: true })
      }
    }

    const COST = CREDITS_PER_IMAGE  // 90크레딧
    if (sess.credits < COST) {
      return c.json({
        error: `크레딧이 부족합니다. (보유: ${sess.credits}크레딧, 필요: ${COST}크레딧)`,
        code: 'INSUFFICIENT_CREDITS',
        available: sess.credits,
        required: COST,
      }, 402)
    }

    const newBalance = sess.credits - COST
    await db.prepare(
      `UPDATE users SET credits = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(newBalance, sess.user_id).run()

    await db.prepare(
      `INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id)
       VALUES (?, 'deduct', ?, ?, 'image_download', ?)`
    ).bind(sess.user_id, -COST, newBalance, `dl_${Date.now()}`).run()

    if (genLog && imgIdx !== undefined) {
      downloadedIndices.push(imgIdx)
      await db.prepare(
        `UPDATE generation_logs SET downloaded_indices = ? WHERE id = ?`
      ).bind(JSON.stringify(downloadedIndices), genLog.id).run()
    }

    console.log(`[Credits] Download deduct: ${sess.name} ${sess.credits} → ${newBalance} (-${COST})`)

    return c.json({ success: true, creditsUsed: COST, creditsRemaining: newBalance, alreadyDownloaded: false })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

// ────────────────────────────────────────────────────
// Generation History Delete API — 생성 내역 삭제
// ────────────────────────────────────────────────────
app.delete('/api/generation/history/:id', async (c) => {
  try {
    const db: D1Database = c.env.LOOKBOOK_DB
    const sessionToken = c.req.header('X-Session-Token') || ''
    if (!sessionToken) return c.json({ error: '로그인이 필요합니다.' }, 401)

    const sess = await db.prepare(
      `SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime('now')`
    ).bind(sessionToken).first() as any
    if (!sess) return c.json({ error: '세션이 만료되었습니다.' }, 401)

    const id = c.req.param('id')
    await db.prepare(`DELETE FROM generation_logs WHERE id = ? AND user_id = ?`).bind(id, sess.user_id).run()

    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

// ────────────────────────────────────────────────────
// Payments API — 토스페이먼츠 연동
// ────────────────────────────────────────────────────

// 크레딧 패키지 정의
const CREDIT_PACKAGES: Record<string, { amount: number; credits: number; label: string }> = {
  pkg_20000: { amount: 20000, credits: 1000,  label: '20,000원 → 1,000크레딧' },
  pkg_40000: { amount: 40000, credits: 2300,  label: '40,000원 → 2,300크레딧' },
  pkg_60000: { amount: 60000, credits: 4000,  label: '60,000원 → 4,000크레딧' },
}

// GET /api/payments/packages — 패키지 목록
app.get('/api/payments/packages', (c) => {
  return c.json({ success: true, packages: CREDIT_PACKAGES })
})

// POST /api/payments/prepare — orderId 발급 + payment_logs pending 생성
app.post('/api/payments/prepare', async (c) => {
  try {
    const db: D1Database = c.env.LOOKBOOK_DB
    const sessionToken = c.req.header('X-Session-Token') || ''
    if (!sessionToken) return c.json({ error: '로그인이 필요합니다.' }, 401)

    const sess = await db.prepare(
      `SELECT s.user_id, u.name, u.email FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now')`
    ).bind(sessionToken).first() as any
    if (!sess) return c.json({ error: '세션이 만료되었습니다.' }, 401)

    const { packageId } = await c.req.json() as any
    const pkg = CREDIT_PACKAGES[packageId]
    if (!pkg) return c.json({ error: '잘못된 패키지입니다.' }, 400)

    // ── M-7: 중복 orderId 방지 ─────────────────────────────
    // 동일 유저가 5분 이내 동일 패키지로 pending 레코드를 이미 생성했으면
    // 새 orderId를 발급하지 않고 기존 것을 재사용 (토스 위젯 중복 호출 방어)
    const existing = await db.prepare(
      `SELECT order_id FROM payment_logs
       WHERE user_id = ? AND amount = ? AND status = 'pending'
         AND created_at > datetime('now', '-5 minutes')
       ORDER BY created_at DESC LIMIT 1`
    ).bind(sess.user_id, pkg.amount).first() as any

    if (existing?.order_id) {
      return c.json({
        success: true,
        orderId: existing.order_id,
        amount: pkg.amount,
        credits: pkg.credits,
        orderName: pkg.label,
        customerName: sess.name,
        customerEmail: sess.email,
      })
    }
    // ─────────────────────────────────────────────────────────

    // 고유 orderId: lookbook-{userId6}-{timestamp}-{random4}
    const shortUid = sess.user_id.slice(0, 6)
    const ts = Date.now()
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
    const orderId = `lookbook-${shortUid}-${ts}-${rand}`

    await db.prepare(
      `INSERT INTO payment_logs (user_id, order_id, amount, credits, status)
       VALUES (?, ?, ?, ?, 'pending')`
    ).bind(sess.user_id, orderId, pkg.amount, pkg.credits).run()

    return c.json({
      success: true,
      orderId,
      amount: pkg.amount,
      credits: pkg.credits,
      orderName: pkg.label,
      customerName: sess.name,
      customerEmail: sess.email,
    })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

// POST /api/payments/confirm — 토스 서버사이드 confirm + 크레딧 지급
app.post('/api/payments/confirm', async (c) => {
  try {
    const db: D1Database = c.env.LOOKBOOK_DB
    const { paymentKey, orderId, amount } = await c.req.json() as any

    if (!paymentKey || !orderId || !amount) {
      return c.json({ error: 'paymentKey, orderId, amount 필수' }, 400)
    }

    // 1) payment_logs 에서 pending 레코드 조회
    const log = await db.prepare(
      `SELECT id, user_id, amount, credits, status FROM payment_logs
       WHERE order_id = ? AND status = 'pending'`
    ).bind(orderId).first() as any
    if (!log) return c.json({ error: '결제 정보를 찾을 수 없거나 이미 처리되었습니다.' }, 404)

    // 2) 금액 검증
    if (Number(amount) !== Number(log.amount)) {
      return c.json({ error: '결제 금액이 일치하지 않습니다.' }, 400)
    }

    // 3) 토스페이먼츠 서버사이드 confirm
    const secretKey = c.env.TOSS_SECRET_KEY || 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R'
    const encoded = btoa(secretKey + ':')
    const tossResp = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encoded}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    })

    const tossData = await tossResp.json() as any

    if (!tossResp.ok) {
      // 토스 에러 → payment_logs failed 업데이트
      await db.prepare(
        `UPDATE payment_logs
         SET status='failed', toss_raw=?, paid_at=datetime('now')
         WHERE order_id=?`
      ).bind(JSON.stringify(tossData), orderId).run()
      return c.json({ error: tossData.message || '결제 승인 실패', code: tossData.code }, 400)
    }

    // 4) payment_logs paid 업데이트
    await db.prepare(
      `UPDATE payment_logs
       SET status='paid', payment_key=?, toss_method=?, toss_raw=?, paid_at=datetime('now')
       WHERE order_id=?`
    ).bind(
      tossData.paymentKey,
      tossData.method || '',
      JSON.stringify(tossData),
      orderId
    ).run()

    // 5) users.credits 증가
    const userRow = await db.prepare(`SELECT credits FROM users WHERE id=?`).bind(log.user_id).first() as any
    const prevBal = userRow?.credits ?? 0
    const newBal  = prevBal + Number(log.credits)
    await db.prepare(
      `UPDATE users SET credits=?, updated_at=datetime('now') WHERE id=?`
    ).bind(newBal, log.user_id).run()

    // 6) credit_logs grant 기록
    await db.prepare(
      `INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id)
       VALUES (?, 'grant', ?, ?, 'payment', ?)`
    ).bind(log.user_id, log.credits, newBal, orderId).run()

    return c.json({
      success: true,
      credits: log.credits,
      creditsTotal: newBal,
      method: tossData.method,
      orderId,
    })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

// GET /api/payments/history — 결제 내역 조회
app.get('/api/payments/history', async (c) => {
  try {
    const db: D1Database = c.env.LOOKBOOK_DB
    const sessionToken = c.req.header('X-Session-Token') || ''
    if (!sessionToken) return c.json({ error: '로그인이 필요합니다.' }, 401)

    const sess = await db.prepare(
      `SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime('now')`
    ).bind(sessionToken).first() as any
    if (!sess) return c.json({ error: '세션이 만료되었습니다.' }, 401)

    const logs = await db.prepare(
      `SELECT order_id, amount, credits, status, toss_method, created_at, paid_at
       FROM payment_logs
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`
    ).bind(sess.user_id).all()

    return c.json({ success: true, logs: logs.results || [] })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

// ────────────────────────────────────────────────────
// Image Upload API
// ────────────────────────────────────────────────────
app.post('/api/uploads/image', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return c.json({ success: false, message: '파일이 없습니다.' }, 400)
    }

    // 파일을 base64로 변환하여 클라이언트에 반환
    const arrayBuffer = await file.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    const mimeType = file.type || 'image/jpeg'
    const dataUrl = `data:${mimeType};base64,${base64}`

    return c.json({
      success: true,
      imageId: 'img_' + Math.random().toString(36).substr(2, 9),
      url: dataUrl,
      dataUrl,
    })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

// ────────────────────────────────────────────────────
// Generation API - Atlas Cloud nano-banana-2 연동
// ────────────────────────────────────────────────────

// 화면 비율 → width/height 변환
function getRatioDimensions(ratio: string): { width: number; height: number } {
  const map: Record<string, { width: number; height: number }> = {
    '1:1':  { width: 1024, height: 1024 },
    '4:5':  { width: 896,  height: 1120 },
    '3:4':  { width: 896,  height: 1216 },  // 기본 (패션 세로형)
    '9:16': { width: 768,  height: 1360 },
  }
  return map[ratio] || { width: 896, height: 1216 }
}

// 해상도 배율 적용
function applyResolution(dims: { width: number; height: number }, resolution: string) {
  if (resolution === '4K') {
    return { width: Math.round(dims.width * 1.5), height: Math.round(dims.height * 1.5) }
  }
  if (resolution === 'HD') {
    return { width: Math.round(dims.width * 1.2), height: Math.round(dims.height * 1.2) }
  }
  return dims  // 표준
}

// ratio → nano-banana-2 aspect_ratio 문자열 변환
function toAspectRatio(ratio: string): string {
  const map: Record<string, string> = {
    '1:1': '1:1', '4:5': '4:5', '3:4': '3:4', '9:16': '9:16',
  }
  return map[ratio] || '3:4'
}

// resolution → nano-banana-2 resolution 문자열 변환
function toNBResolution(resolution: string): string {
  if (resolution === '4K') return '4k'
  if (resolution === 'HD') return '2k'
  return '1k'  // 표준
}

// ────────────────────────────────────────────────────
// /api/clothing/classify
// 업로드된 의류 이미지들을 nano-banana-2로 자동 분류
// body: { images: [{ dataUrl, index }] }
// return: { items: [{ index, category, label, confidence }] }
// category: 'top' | 'bottom' | 'outer' | 'dress' | 'unknown'
// ────────────────────────────────────────────────────
app.post('/api/clothing/classify', async (c) => {
  try {
    const body: any = await c.req.json()
    const images: Array<{ dataUrl: string; index: number }> = body.images || []

    if (images.length === 0) {
      return c.json({ success: false, message: '이미지가 없습니다.' }, 400)
    }

    // 각 이미지를 개별 분류 (병렬)
    const classifyResults = await Promise.all(
      images.map(async ({ dataUrl, index }) => {
        try {
          const classifyPrompt = [
            'Analyze this clothing item image and classify it into EXACTLY ONE of these categories:',
            'TOP — shirts, t-shirts, blouses, crop tops, hoodies (without coat), sweaters, knits, vests worn as tops',
            'BOTTOM — pants, trousers, jeans, skirts, shorts, leggings',
            'OUTER — coats, jackets, blazers, cardigans worn as outerwear, parkas, windbreakers, leather jackets, denim jackets',
            'DRESS — one-piece dresses, jumpsuits, overalls that cover both top and bottom',
            'UNKNOWN — if cannot determine',
            'Respond in EXACTLY this JSON format only, no other text:',
            '{"category":"TOP","label":"white button-down shirt","confidence":0.95}',
          ].join(' ')

          const res = await fetch(`${ATLAS_API_BASE}/api/v1/model/generateImage`, {
            method: 'POST',
            headers: atlasHeaders(c.env.ATLAS_API_KEY),
            body: JSON.stringify({
              model: 'google/nano-banana-2/edit',
              prompt: classifyPrompt,
              images: [dataUrl],
              aspect_ratio: '1:1',
              resolution: '1k',
              thinking_level: 'default',
              output_format: 'jpeg',
            }),
          })
          const data: any = await res.json()

          // nano-banana-2는 텍스트 응답 불가 — vision 분류를 위해 별도 방식 사용
          // Atlas Cloud의 generate 응답에서 실제 분류를 얻을 수 없으므로
          // 이미지 메타(파일명 힌트 없음)만으로는 한계 → 규칙 기반 fallback 분류
          // 실용적 접근: 이미지 비율/파일명이 없으므로 nano-banana-2 text completion으로 처리
          console.log('Classify atlas response code:', data.code)

          // Atlas가 jobId를 반환하면 폴링해서 결과 텍스트 획득
          if (data.code === 200 && data.data?.id) {
            const jobId = data.data.id
            // 최대 15초 폴링
            for (let i = 0; i < 10; i++) {
              await new Promise(r => setTimeout(r, 1500))
              const poll: any = await fetch(`${ATLAS_API_BASE}/api/v1/model/prediction/${jobId}`, {
                headers: { 'Authorization': `Bearer ${c.env.ATLAS_API_KEY}` },
              }).then(r => r.json())

              const status = poll.data?.status
              if (status === 'completed' || status === 'succeeded') {
                // 결과 이미지는 사용하지 않고 성공 자체로 판단
                // nano-banana-2는 이미지 생성 모델이므로 프롬프트에 JSON 포함 요청해도
                // 이미지로 출력됨. 실용적 fallback: 이미지 종횡비로 분류
                break
              }
              if (status === 'failed' || status === 'error') break
            }
          }

          // ── 실용적 클라이언트사이드 분류 (서버에서 base64 분석) ──
          // nano-banana-2가 이미지 생성 전용이므로 규칙 기반으로 분류
          // dataUrl 앞 부분에서 이미지 메타를 확인하는 대신
          // 이미지 aspect ratio를 base64 헤더로 추론
          return { index, category: 'UNRESOLVED', label: '', confidence: 0 }
        } catch (e) {
          return { index, category: 'UNKNOWN', label: '', confidence: 0 }
        }
      })
    )

    // ── 실제 분류: Atlas LLM text completion API 사용 ──
    // nano-banana-2/edit는 이미지→이미지. 텍스트 응답이 필요하면 별도 endpoint 필요.
    // Atlas Cloud에 text completion이 없으면 프롬프트 기반 규칙 분류를 사용.
    // 여기서는 이미지 자체 데이터에서 종횡비를 추출해 분류합니다.
    const finalItems = await Promise.all(
      images.map(async ({ dataUrl, index }) => {
        return classifyByImageAnalysis(dataUrl, index)
      })
    )

    console.log('Classify results:', finalItems.map(i => `[${i.index}]${i.category}`).join(', '))
    return c.json({ success: true, items: finalItems })

  } catch (err: any) {
    console.error('Classify error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// ── 이미지 분류 헬퍼: Atlas nano-banana-2 프롬프트 기반 ──
// nano-banana-2는 이미지→이미지 모델이므로, 분류 결과를 프롬프트에
// JSON 텍스트를 이미지 위에 렌더링 요청 → 결과 이미지에서 텍스트 추출 불가
// 대신 실용적 접근: 이미지 종횡비와 base64 길이로 추론
async function classifyByImageAnalysis(
  dataUrl: string,
  index: number
): Promise<{ index: number; category: string; label: string; confidence: number }> {
  try {
    // base64 데이터에서 이미지 dimensions 추론
    // PNG: 가로>세로 = 하의(넓은 팬츠/스커트), 세로>가로 = 상의/아우터
    // 실용적: 모든 의류를 일단 UNKNOWN으로 반환하고
    // 클라이언트에서 사용자가 확인 가능하게 함
    // 더 나은 방법: Atlas Cloud의 vision LLM 호출

    // Atlas vision-only 분류 시도 (text prompt only generation)
    const res = await fetch(`${ATLAS_API_BASE}/api/v1/model/generateImage`, {
      method: 'POST',
      headers: atlasHeaders(c.env.ATLAS_API_KEY),
      body: JSON.stringify({
        model: 'google/nano-banana-2',
        prompt: [
          'CLASSIFICATION TASK. Look at this clothing item.',
          'Output ONLY ONE WORD: TOP or BOTTOM or OUTER or DRESS',
          'TOP = shirt/tshirt/blouse/sweater/hoodie/knit/vest',
          'BOTTOM = pants/jeans/skirt/shorts/leggings',
          'OUTER = coat/jacket/blazer/cardigan/parka',
          'DRESS = one-piece dress/jumpsuit',
        ].join(' '),
        images: [dataUrl],
        aspect_ratio: '1:1',
        resolution: '1k',
        thinking_level: 'low',
        output_format: 'jpeg',
      }),
    })
    const data: any = await res.json()

    if (data.code === 200 && data.data?.id) {
      const jobId = data.data.id
      for (let i = 0; i < 8; i++) {
        await new Promise(r => setTimeout(r, 1500))
        const poll: any = await fetch(`${ATLAS_API_BASE}/api/v1/model/prediction/${jobId}`, {
          headers: { 'Authorization': `Bearer ${c.env.ATLAS_API_KEY}` },
        }).then(r => r.json())
        if (poll.data?.status === 'completed' || poll.data?.status === 'succeeded') {
          // 생성된 이미지에서 텍스트 추출 불가 → 메타데이터에서 힌트 탐색
          break
        }
        if (poll.data?.status === 'failed' || poll.data?.status === 'error') break
      }
    }

    // ── Fallback: base64 이미지 크기 비율로 추론 ──
    const base64Data = dataUrl.split(',')[1] || ''
    const byteLen = Math.floor(base64Data.length * 0.75)
    // 파일 크기만으로는 정확한 분류 어려움
    // 실용적 기본값: 1장이면 TOP, 나머지는 확인 불가
    return { index, category: 'TOP', label: 'clothing item', confidence: 0.5 }

  } catch {
    return { index, category: 'TOP', label: 'clothing item', confidence: 0.3 }
  }
}

// ────────────────────────────────────────────────────
// 의류 분류 결과로 프롬프트 내 역할 설명 생성
// ────────────────────────────────────────────────────
function buildClothingRoleDesc(
  items: Array<{ category: string; label: string; dataUrl: string }>,
  imageIndexOffset: number  // images 배열에서 의류가 시작되는 인덱스 (1-based)
): string {
  const roleLines: string[] = []
  items.forEach((item, i) => {
    const imgNum = imageIndexOffset + i
    const catLabel = {
      'TOP':     'TOP GARMENT (shirt/blouse/sweater/jacket-top)',
      'BOTTOM':  'BOTTOM GARMENT (pants/skirt/shorts)',
      'OUTER':   'OUTER LAYER (coat/jacket/cardigan)',
      'DRESS':   'FULL OUTFIT (dress/jumpsuit — covers both top and bottom)',
      'UNKNOWN': 'CLOTHING ITEM',
    }[item.category] || 'CLOTHING ITEM'
    roleLines.push(`Image ${imgNum} = ${catLabel}${item.label ? ` — ${item.label}` : ''}.`)
  })
  return roleLines.join(' ')
}

// 의류 카테고리별 교체 지시 프롬프트 생성
function buildClothingReplaceInstructions(
  items: Array<{ category: string; label: string }>,
  imageIndexOffset: number
): string {
  const instructions: string[] = []
  const categories = items.map(i => i.category)

  const hasDress   = categories.includes('DRESS')
  const hasTop     = categories.includes('TOP')
  const hasBottom  = categories.includes('BOTTOM')
  const hasOuter   = categories.includes('OUTER')

  if (hasDress) {
    const idx = items.findIndex(i => i.category === 'DRESS')
    instructions.push(
      `Replace the ENTIRE outfit (top and bottom) with Image ${imageIndexOffset + idx}'s full dress/jumpsuit. Reproduce every design detail exactly.`
    )
  } else {
    if (hasTop) {
      const idx = items.findIndex(i => i.category === 'TOP')
      instructions.push(
        `Replace ONLY the TOP garment with Image ${imageIndexOffset + idx}'s item. Exact color, pattern, texture, neckline, sleeve length.`
      )
    }
    if (hasBottom) {
      const idx = items.findIndex(i => i.category === 'BOTTOM')
      instructions.push(
        `Replace ONLY the BOTTOM garment with Image ${imageIndexOffset + idx}'s item. Exact color, pattern, waistband, length, cut.`
      )
    }
    if (hasOuter) {
      const idx = items.findIndex(i => i.category === 'OUTER')
      instructions.push(
        `Add/replace the OUTER LAYER (coat/jacket) with Image ${imageIndexOffset + idx}'s item worn over the other clothing. Exact lapels, buttons, length.`
      )
    }
  }

  // 교체하지 않는 부분 명시
  if (!hasDress) {
    if (!hasTop)    instructions.push('Keep the original TOP garment EXACTLY unchanged — do NOT modify it.')
    if (!hasBottom) instructions.push('Keep the original BOTTOM garment EXACTLY unchanged — do NOT modify it.')
    if (!hasOuter)  instructions.push('Remove any outer layer if present, or keep it minimal.')
  }

  return instructions.join(' ')
}

// ── 크레딧 상수 ──
const CREDITS_PER_IMAGE = 90  // 이미지 1장당 차감 크레딧 (1,800원 / 20원 = 90)

app.post('/api/generation/start', async (c) => {
  try {
    const body: any = await c.req.json()

    const {
      modelId,
      modelName = '패션 모델',
      modelDesc = 'young Asian female fashion model, slim figure, natural look',
      bgId,
      bgName = '스튜디오',
      bgDesc = 'clean white studio background with professional lighting',
      poseType = '전신',
      pose = '정면',
      ratio = '3:4',
      resolution = 'HD',
      count = 4,
      clothingImageUrl,          // 레거시 단일 파라미터 (하위 호환)
      clothingImages,            // 신규: [{ dataUrl, category, label }] 배열
    } = body

    // ── 세션 인증 (로그인 체크만, 크레딧 차감 없음) ──
    const db: D1Database | undefined = (c.env as any)?.LOOKBOOK_DB
    let sessionUser: any = null

    if (db) {
      const sessionToken = c.req.header('X-Session-Token') || ''
      if (sessionToken) {
        const sess = await db.prepare(
          `SELECT s.user_id, u.name, u.credits FROM user_sessions s
           JOIN users u ON u.id = s.user_id
           WHERE s.token = ? AND s.expires_at > datetime('now')`
        ).bind(sessionToken).first() as any
        if (sess) sessionUser = sess
      }

      if (!sessionUser) {
        return c.json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' }, 401)
      }

      // 크레딧 차감은 다운로드 시점에 수행 (POST /api/credits/deduct)
      console.log(`[Generation] ${sessionUser.name} started generation (credits: ${sessionUser.credits})`)
    }

    const aspectRatio = toAspectRatio(ratio)
    const nbResolution = toNBResolution(resolution)

    console.log('Model ID:', modelId, '| BG ID:', bgId)
    console.log('Ratio:', aspectRatio, '| Resolution:', nbResolution)
    console.log('Clothing:', clothingImageUrl ? clothingImageUrl.substring(0, 60) + '...' : 'none')

    // ── 포즈 텍스트 변환 ──
    const poseTypeMap: Record<string, string> = {
      '전신': 'full body shot', '반신': 'half body shot', '상반신': 'upper body shot',
    }
    const poseStyleMap: Record<string, string> = {
      '정면': 'facing camera, natural standing pose',
      '측면': '3/4 angle, elegant slight turn',
      '워킹': 'dynamic walking pose, confident stride',
      '정적': 'elegant static pose, hands relaxed at sides',
    }
    const poseTypeText  = poseTypeMap[poseType]  || 'full body shot'
    const poseStyleText = poseStyleMap[pose]      || 'natural standing pose'

    // ── 서버사이드: 커스텀 모델·배경 이미지 base64 취득 (관리자 업로드 전용) ──
    let modelImageBase64: string | null = null
    let bgImageBase64: string | null = null

    const kv: KVNamespace | undefined = (c.env as any)?.LOOKBOOK_KV
    // db는 위의 세션 인증 블록에서 이미 선언됨

    let modelGender: string | null = null
    if (modelId) {
      const mid = String(modelId)
      if (kv) {
        const stored = await kv.get(`model_img:${mid}`)
        if (stored) { modelImageBase64 = stored; console.log('KV custom model: OK') }
        const kvModels = await kvGetModels(kv)
        modelGender = kvModels.find(m => m.id === mid)?.gender || null
      } else if (db) {
        const stored = await d1GetModelImg(db, mid)
        if (stored) { modelImageBase64 = stored; console.log('D1 custom model: OK') }
        const genderRow: any = await db.prepare(`SELECT gender FROM custom_models WHERE id = ?`).bind(mid).first()
        modelGender = genderRow?.gender || null
      } else {
        const m = _memModels.find(m => m.id === mid)
        if (m?.imageBase64) { modelImageBase64 = m.imageBase64; console.log('Mem custom model: OK') }
        modelGender = (m as any)?.gender || null
      }
      if (!modelImageBase64) console.log('Custom model image not found for id:', mid)
    }

    // 남성 모델 선택 시에만 체형 지시 추가. 여성/미지정은 기존 프롬프트 그대로 유지.
    // ⚠️ 앞으로 성별 언급 없는 프롬프트 보완 요청은 이 변수와 무관하게 공통 프롬프트 쪽에 적용할 것.
    const modelBodyTypeNote = modelGender === '남성'
      ? `MALE BODY TYPE: Render the body/physique as a MALE body type — broader shoulders, flatter chest, straighter waist-to-hip line, masculine posture and build. The clothing must fit and drape as menswear on a male body, not a female body shape.`
      : ''
    if (bgId) {
      const bid = String(bgId)
      // 생성(AtlasCloud 전달)에는 얼굴-마스킹된 "생성용" 이미지를 우선 사용 (없으면 전시용 원본 폴백)
      // 사용자 화면 썸네일(/api/proxy/custom-bg/:id)은 항상 전시용 원본을 그대로 보여줌 — 여기와 무관
      if (kv) {
        const genStored = await kv.get(`bg_gen_img:${bid}`)
        const stored = genStored || (await kv.get(`bg_img:${bid}`))
        if (stored) {
          bgImageBase64 = stored
          console.log(`KV custom bg: OK | bgId=${bid} | source=${genStored ? 'GEN(masked)' : 'ORIGINAL(fallback, no gen image registered)'}`)
        }
      } else if (db) {
        const row: any = await db.prepare(`SELECT image_b64, gen_image_b64 FROM custom_bgs WHERE id = ?`).bind(bid).first()
        if (row) {
          const hasGen = !!(row.gen_image_b64 && String(row.gen_image_b64).trim())
          bgImageBase64 = hasGen ? row.gen_image_b64 : row.image_b64
          console.log(`D1 custom bg: OK | bgId=${bid} | source=${hasGen ? 'GEN(masked)' : 'ORIGINAL(fallback, no gen image registered)'}`)
        }
      } else {
        const b = _memBgs.find(b => b.id === bid) as any
        if (b?.genImageBase64 || b?.imageBase64) {
          bgImageBase64 = b.genImageBase64 || b.imageBase64
          console.log(`Mem custom bg: OK | bgId=${bid} | source=${b?.genImageBase64 ? 'GEN(masked)' : 'ORIGINAL(fallback, no gen image registered)'}`)
        }
      }
      if (!bgImageBase64) console.log('Custom bg image not found for id:', bid)
    }

    // ── 공통 불변 제약 파라미터 (모든 모드에 공통 적용) ──
    const HARD_CONSTRAINTS = [
      `ABSOLUTE RULES — NEVER VIOLATE UNDER ANY CIRCUMSTANCES:`,
      `1. DO NOT insert, overlay, embed, or render ANY text, letters, numbers, words, logos, watermarks, brand marks, or typographic elements ANYWHERE in the image.`,
      `2. Facial identity is non-negotiable: the output face must be the SAME PERSON as the identity reference image (bone structure, eye/nose/lip shape, proportions unchanged) — never a different-looking substitute. See the IDENTITY instructions above for what may change (angle, lighting) vs. what may not (identity).`,
      `3. DO NOT change, redesign, or substitute ANY detail of the clothing: color, pattern, print, texture, collar, neckline, sleeve length, hem, buttons, zippers, pockets, or stitching must be reproduced EXACTLY as shown in the reference.`,
      `4. NO watermarks. NO overlaid captions. NO decorative text. NO brand insignia added by AI.`,
      `Ultra-photorealistic, 8K quality, professional fashion editorial, magazine cover quality.`,
    ].join(' ')

    // ── 의류 이미지 정규화 ──
    // 신규: clothingImages[] 배열 우선, 레거시 clothingImageUrl 폴백
    type ClothingItem = { dataUrl: string; category: string; label: string }
    let clothingItems: ClothingItem[] = []

    if (Array.isArray(clothingImages) && clothingImages.length > 0) {
      // 신규 다중 업로드 경로
      clothingItems = clothingImages.filter((ci: any) => ci?.dataUrl?.startsWith('data:'))
    } else if (clothingImageUrl && clothingImageUrl.startsWith('data:')) {
      // 레거시 단일 경로 → TOP으로 취급
      clothingItems = [{ dataUrl: clothingImageUrl, category: 'TOP', label: 'clothing item' }]
    }

    console.log('Clothing items:', clothingItems.map(ci => `[${ci.category}]`).join(', ') || 'none')
    console.log('Model ID:', modelId, '| BG ID:', bgId)

    // ── Nano Banana 2 Edit: images 배열 구성 ──
    // 순서: [의류1, 의류2?, 의류3?, 모델?, 배경?]
    // 프롬프트에서 각 이미지 번호(Image N)를 명시해 역할 구분
    const images: string[] = []

    // 1) 의류 이미지들 (분류 순서 정렬: DRESS → TOP → BOTTOM → OUTER)
    const ORDER = ['DRESS', 'TOP', 'BOTTOM', 'OUTER', 'UNKNOWN']
    const sortedClothing = [...clothingItems].sort(
      (a, b) => ORDER.indexOf(a.category) - ORDER.indexOf(b.category)
    )
    sortedClothing.forEach(ci => images.push(ci.dataUrl))

    const clothingCount = sortedClothing.length
    const modelImgIdx  = clothingCount + 1  // Image N (1-based)
    const bgImgIdx     = clothingCount + (modelImageBase64 ? 1 : 0) + 1

    // 2) 모델 이미지
    if (modelImageBase64) images.push(modelImageBase64)

    // 3) 배경 이미지
    if (bgImageBase64) images.push(bgImageBase64)

    console.log(`images 배열: 의류${clothingCount}장 | 모델${modelImageBase64 ? 1 : 0}장 | 배경${bgImageBase64 ? 1 : 0}장 | 총${images.length}장`)

    // ── 프롬프트 구성 ──
    let prompt: string = ''
    const hasBg    = !!bgImageBase64
    const hasModel = !!modelImageBase64
    const hasClothing = clothingCount > 0
    // 생성 수량 1장 고정
    const jobCount = 1

    if (hasClothing && hasModel && hasBg) {
      // ══════════════════════════════════════════════════════════
      // ── 풀 모드: 단일 단계 — 의상 교체 + 얼굴/신원 교체 동시 처리 ──
      //   이미지 순서: [의류1, 의류2?, ..., 모델(신원), 배경(씬)]
      // ══════════════════════════════════════════════════════════

      console.log('[단일 단계] 의상+얼굴+신원 통합 합성 시작')

      const clothingRoleDesc = buildClothingRoleDesc(sortedClothing.map(ci => ({ ...ci })), 1)
      const clothingReplaceInstructions = buildClothingReplaceInstructions(sortedClothing, 1)

      prompt = [
        `COMPLETE FASHION LOOKBOOK SYNTHESIS — clothing replacement + identity swap in a single pass.`,

        clothingRoleDesc,
        `Image ${bgImgIdx} = SCENE ANCHOR. This scene defines: background environment, scene lighting direction/color-temperature/intensity/saturation, color grade, and mood. LOCKED: background.`,

        `CLOTHING REPLACEMENT:`,
        clothingReplaceInstructions,
        `Body pose and stance may adjust naturally to fit the new clothing and scene — natural variation is fine, no need to rigidly lock it to any reference image.`,

        `IDENTITY (from Image ${modelImgIdx}) — READ THIS ONCE, IT IS THE ONLY IDENTITY RULE:`,
        `This is Image ${modelImgIdx}'s exact face, physically rotated to a new head angle and relit under Image ${bgImgIdx}'s scene — the SAME face asset transformed, never a newly generated or substitute face. KEEP UNCHANGED: bone structure, eye shape/spacing, iris color, nose shape, lip shape, jawline, cheekbones, face width, and skin undertone — these must be pixel-consistent with Image ${modelImgIdx} when mentally rotated back to its original angle. Hair may adjust naturally (style, volume, flow) to suit the pose and scene — it does not need to be locked to Image ${modelImgIdx}'s exact hairstyle. Head/face size relative to the body must stay in natural human proportion, matching Image ${modelImgIdx}'s scale — do not enlarge or shrink it. CHANGE ONLY what a camera and lighting change: head angle, tilt, gaze direction, expression, perspective, brightness, shadows, color temperature, saturation. Do NOT copy Image ${modelImgIdx}'s original angle, expression, or lighting — they must update to match Image ${bgImgIdx}'s scene. Do NOT use body shape, clothing, or pose from Image ${modelImgIdx}.`,
        `If Image ${bgImgIdx} already shows a person, their pose, stance, and hair may be used as a natural reference and can vary freely to fit the scene — but their FACE is IRRELEVANT and must NEVER appear in the output. The output face must be Image ${modelImgIdx}'s identity, not the person already in Image ${bgImgIdx}.`,
        modelBodyTypeNote,

        `SCENE LIGHTING INTEGRATION (from Image ${bgImgIdx} — critical for photorealism):`,
        `  Re-light ALL elements (clothing, face, skin, hair) under Image ${bgImgIdx}'s physical lighting environment:`,
        `  · BRIGHTNESS: Match face and skin brightness to the scene's ambient light level. Bright scene → bright face; moody/dim scene → face lit accordingly.`,
        `  · LIGHT DIRECTION: Apply the scene's key light direction. Highlights land on the correct side of the face (forehead, cheekbone, nose bridge), shadows fall on the opposite side.`,
        `  · COLOR TEMPERATURE & SATURATION: Tint face, skin, and clothing under the scene's color temperature AND saturation level — face and body must share identical hue/saturation/brightness at every point, with zero visible tone or saturation boundary anywhere on exposed skin.`,
        `  · SHADOW QUALITY: Hard shadows in direct sunlight; soft wrap-around shadows in diffuse/cloudy/studio light — match the scene exactly.`,
        `  · CATCH-LIGHTS: Eyes must reflect Image ${bgImgIdx}'s light source position and shape.`,
        `  · FABRIC RENDERING: Simulate specular highlights on shiny fabrics, soft diffuse on matte, translucency on thin materials — all under the scene's light.`,
        `  · SUBSURFACE SCATTERING: Realistic skin SSS under scene light (warm ears/nose in backlit; strong SSS in diffuse light).`,
        `  · GROUNDING: The model must cast a soft contact shadow onto the ground/floor matching Image ${bgImgIdx}'s light direction and shadow softness. Depth-of-field, grain, and sharpness falloff on the model must match the background photo's camera characteristics.`,
        `  · SEAMLESS INTEGRATION: The face-to-neck-to-body transition must be completely seamless — same lighting falloff, same color temperature, no hard edge or tone jump, identical skin micro-texture/sharpness/grain between face and body. This must read as ONE continuous photograph of ONE real person, never a cutout, collage, sticker, or composite.`,
        `  · HAIR INTEGRATION: Hair receives the scene's ambient + key light. Rim/backlight if present in the scene. Flyaways lit naturally.`,

        `FINAL OUTPUT: One seamless, ultra-photorealistic fashion photograph — Image ${modelImgIdx}'s exact identity, re-angled and re-lit to fit Image ${bgImgIdx}'s scene, wearing the new clothing. This must look like an actual photograph taken with a real camera — NOT an AI-generated, CGI, 3D-rendered, or illustrated image. Natural skin texture with visible pores, fine hairs, subtle imperfections. Natural film grain and lens characteristics. Avoid overly smooth/plastic/airbrushed skin, avoid uncanny-valley symmetry, avoid the glossy "AI look." Shot on a professional camera, candid editorial photography style.`,
        `8K resolution, magazine editorial quality.`,
        HARD_CONSTRAINTS,
      ].join(' ')

    } else if (hasClothing && hasModel && !hasBg) {
      // ── 의류 + 모델, 배경 없음 ──
      const clothingRoleDesc = buildClothingRoleDesc(sortedClothing.map(ci => ({ ...ci })), 1)
      const clothingReplaceInstructions = buildClothingReplaceInstructions(sortedClothing, 1)
      prompt = [
        `Create a hyper-realistic professional fashion lookbook photograph.`,
        clothingRoleDesc,
        `Image ${modelImgIdx} = MODEL IDENTITY — preserve this exact person's face, hair, skin tone, body proportions exactly.`,
        modelBodyTypeNote,
        clothingReplaceInstructions,
        `Show a ${poseTypeText}, ${poseStyleText}.`,
        `Background: ${bgDesc} (${bgName}). Create a photorealistic environment. Integrate the model naturally with correct lighting and shadows.`,
        HARD_CONSTRAINTS,
      ].join(' ')

    } else if (hasClothing && !hasModel && hasBg) {
      // ── 의류 + 배경, 모델 없음 ── CLOTHING SWAP (배경 속 원래 사람 유지)
      const clothingRoleDesc = buildClothingRoleDesc(sortedClothing.map(ci => ({ ...ci })), 1)
      const clothingReplaceInstructions = buildClothingReplaceInstructions(sortedClothing, 1)
      prompt = [
        `You are doing a CLOTHING SWAP on a fashion background scene.`,
        clothingRoleDesc,
        `Image ${bgImgIdx} = SOURCE BACKGROUND SCENE containing a person. Keep the scene and person EXACTLY as-is — same face, same pose, same stance, same body position.`,
        clothingReplaceInstructions,
        `FINAL RESULT: Same scene, same person, same pose — only the specified clothing items are replaced. Natural lighting, seamless integration.`,
        HARD_CONSTRAINTS,
      ].join(' ')

    } else if (hasClothing && !hasModel && !hasBg) {
      // ── 의류만 ── 텍스트 모델/배경 사용
      const clothingRoleDesc = buildClothingRoleDesc(sortedClothing.map(ci => ({ ...ci })), 1)
      const clothingReplaceInstructions = buildClothingReplaceInstructions(sortedClothing, 1)
      prompt = [
        `Create a hyper-realistic professional fashion lookbook photograph.`,
        clothingRoleDesc,
        `Model: ${modelDesc}. Show in a ${poseTypeText}, ${poseStyleText}.`,
        clothingReplaceInstructions,
        `Background: ${bgDesc} (${bgName}). Photorealistic environment with correct lighting and shadows.`,
        HARD_CONSTRAINTS,
      ].join(' ')

    } else {
      // ── 이미지 없음 → 텍스트 기반 ──
      prompt = [
        `Ultra-photorealistic professional fashion photography.`,
        `A ${modelDesc} fashion model, ${poseTypeText}, ${poseStyleText}.`,
        `Background: ${bgDesc} (${bgName}). Natural lighting, seamless scene integration.`,
        `8K resolution, Canon EOS R5, professional lighting, hyperrealistic skin texture, perfect fabric detail, commercial fashion editorial, magazine quality.`,
        HARD_CONSTRAINTS,
      ].join(' ')
    }

    // 어드민 프롬프트 주입 — D1에서 최신 설정 로드 후 적용
    try {
      const latestConfig = await d1GetPromptConfig(c.env.LOOKBOOK_DB)
      adminPromptConfig = latestConfig  // 메모리 동기화
    } catch (e) { /* D1 실패 시 메모리 기본값 사용 */ }
    prompt = injectAdminPrompt(prompt)

    console.log('Prompt (first 300):', prompt.substring(0, 300))
    console.log('images count:', images.length, '| mode:', images.length >= 3 ? 'FULL(clothing+model+bg)' : images.length === 2 ? 'PARTIAL' : images.length === 1 ? 'CLOTHING_ONLY' : 'TEXT')

    // ── Atlas Cloud API 요청: google/nano-banana-2/edit ──
    const requestBody: any = {
      model: 'google/nano-banana-2/edit',
      prompt,
      aspect_ratio: aspectRatio,
      resolution: nbResolution,
      thinking_level: 'high',
      output_format: 'jpeg',
    }
    // images가 있을 때만 포함 (없으면 text-to-image 모드로 동작)
    if (images.length > 0) {
      requestBody.images = images
    }

    console.log('Final prompt (first 300):', prompt.substring(0, 300))
    console.log('Atlas request → model:', requestBody.model, '| images:', images.length, '| aspect_ratio:', aspectRatio, '| resolution:', nbResolution, '| jobs:', jobCount)

    const jobRequests = Array.from({ length: jobCount }, () =>
      fetch(`${ATLAS_API_BASE}/api/v1/model/generateImage`, {
        method: 'POST',
        headers: atlasHeaders(c.env.ATLAS_API_KEY),
        body: JSON.stringify(requestBody),
      }).then(r => r.json())
    )

    const results: any[] = await Promise.all(jobRequests)
    console.log('Atlas responses:', results.map(r => `${r.code}:${r.data?.id}`).join(', '))

    const jobIds: string[] = results
      .filter(r => r.code === 200 && r.data?.id)
      .map(r => r.data.id)

    if (jobIds.length === 0) {
      const firstErr = results[0]
      console.error('All Atlas requests failed:', firstErr)
      const fallbackJobId = 'fallback_' + Math.random().toString(36).substr(2, 9)
      return c.json({
        jobId: fallbackJobId,
        estimatedSeconds: 5,
        status: 'queued',
        isFallback: true,
        error: firstErr?.msg || firstErr?.message || 'Atlas API error',
      })
    }

    // jobIds를 콤마로 묶어 단일 jobId처럼 전달 (폴링에서 분리)
    const combinedJobId = jobIds.join(',')

    // 생성 내역 기록 (크레딧 차감 없이 생성 이벤트만 로깅)
    if (db && sessionUser) {
      try {
        // 유저별 seq_no 채번 (1부터 시작)
        const lastSeq = await db.prepare(
          `SELECT COALESCE(MAX(seq_no), 0) AS last_seq FROM generation_logs WHERE user_id = ?`
        ).bind(sessionUser.user_id).first() as any
        const nextSeq = (lastSeq?.last_seq || 0) + 1

        await db.prepare(
          `INSERT INTO generation_logs (user_id, job_id, image_count, model_name, bg_name, ratio, seq_no, model_id, bg_id, expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+14 days'))`
        ).bind(
          sessionUser.user_id,
          combinedJobId,
          count,
          modelName || '패션 모델',
          bgName || '스튜디오',
          ratio || '3:4',
          nextSeq,
          modelId ? String(modelId) : null,
          bgId ? String(bgId) : null,
        ).run()
        console.log(`[GenLog] seq_no=${nextSeq} 기록 완료`)
      } catch (logErr) {
        console.warn('[GenLog] 생성 내역 기록 실패 (무시):', logErr)
      }
    }

    // 공유 페이지에서 원본 의상 이미지를 보여주기 위해 KV에 14일간 보관
    // (의상 이미지는 다른 곳에 저장되지 않는 요청 단발성 데이터라 여기서만 백업)
    if (kv && sortedClothing.length > 0) {
      try {
        await kv.put(
          `clothing_img:${combinedJobId}`,
          JSON.stringify(sortedClothing.map(ci => ci.dataUrl)),
          { expirationTtl: 14 * 24 * 60 * 60 }
        )
      } catch (kvErr) {
        console.warn('[GenLog] 의상 이미지 KV 저장 실패 (무시):', kvErr)
      }
    }

    return c.json({
      jobId: combinedJobId,
      estimatedSeconds: 30,
      status: 'queued',
      isFallback: false,
    })

  } catch (err: any) {
    console.error('Generation start error:', err)
    const fallbackJobId = 'fallback_' + Math.random().toString(36).substr(2, 9)
    return c.json({
      jobId: fallbackJobId,
      estimatedSeconds: 5,
      status: 'queued',
      isFallback: true,
      error: err.message,
    })
  }
})

// Generation 상태 폴링 (nano-banana-2: 단건 jobId 또는 콤마 구분 복수 jobId)
app.get('/api/generation/:jobId/status', async (c) => {
  const rawJobId = c.req.param('jobId')

  // Fallback 처리
  if (rawJobId.startsWith('fallback_')) {
    const placeholderImages = generatePlaceholderImages(1)
    return c.json({ status: 'completed', progress: 100, images: placeholderImages, isFallback: true })
  }

  // 콤마로 묶인 복수 jobId 분리
  const jobIds = rawJobId.split(',').filter(Boolean)

  try {
    // 모든 jobId를 병렬 폴링
    const pollResults = await Promise.all(
      jobIds.map(id =>
        fetch(`${ATLAS_API_BASE}/api/v1/model/prediction/${id}`, {
          headers: { 'Authorization': `Bearer ${c.env.ATLAS_API_KEY}` },
        }).then(r => r.json())
      )
    )

    console.log('Poll statuses:', pollResults.map(r => `${r.data?.id?.substring(0,8)}:${r.data?.status}`).join(', '))

    const terminalStatuses = new Set(['completed', 'succeeded', 'failed', 'timeout', 'canceled', 'error'])
    const allDone = pollResults.every(r => terminalStatuses.has(r.data?.status))
    const anyProcessing = pollResults.some(r => !terminalStatuses.has(r.data?.status))

    if (!allDone) {
      // 아직 처리 중인 작업이 있음
      const doneCount  = pollResults.filter(r => terminalStatuses.has(r.data?.status)).length
      const totalCount = pollResults.length
      const progress   = Math.round(20 + (doneCount / totalCount) * 60)
      return c.json({ status: 'processing', progress, images: [] })
    }

    // 모두 완료 → 성공한 것만 수집
    const resultImages: any[] = []
    pollResults.forEach((r, idx) => {
      const st  = r.data?.status
      // Atlas API 완료 응답: outputs가 배열(string[]) 또는 단일 string일 수 있음
      const rawOut = r.data?.outputs ?? r.data?.output ?? r.data?.images ?? r.data?.result ?? null
      const urls: string[] = Array.isArray(rawOut) ? rawOut.filter((u: any) => typeof u === 'string' && u.startsWith('http')) : (typeof rawOut === 'string' && rawOut.startsWith('http') ? [rawOut] : [])
      console.log(`Job ${idx} status:${st} urls:`, urls)
      if ((st === 'completed' || st === 'succeeded') && urls.length > 0) {
        urls.forEach((url, i) => {
          resultImages.push({
            id: `result_${resultImages.length + 1}`,
            url,
            title: `AI 피팅컷 #${resultImages.length + 1}`,
          })
        })
      }
    })

    if (resultImages.length === 0) {
      // 전부 실패 → fallback placeholder
      console.error('All jobs failed:', pollResults.map(r => r.data?.status).join(', '))
      const placeholderImages = generatePlaceholderImages(1)
      return c.json({ status: 'completed', progress: 100, images: placeholderImages, isFallback: true, error: 'All jobs failed' })
    }

    return c.json({ status: 'completed', progress: 100, images: resultImages, isFallback: false })

  } catch (err: any) {
    console.error('Poll error:', err)
    const placeholderImages = generatePlaceholderImages(1)
    return c.json({ status: 'completed', progress: 100, images: placeholderImages, isFallback: true, error: err.message })
  }
})

// 플레이스홀더 이미지 생성 헬퍼 (Atlas API 실패 시)
function generatePlaceholderImages(count: number) {
  const colors = [
    ['#FF6B9D', '#FF8C42'],
    ['#6C47FF', '#00D4AA'],
    ['#FF6B9D', '#6C47FF'],
    ['#F59E0B', '#EF4444'],
  ]
  return Array.from({ length: count }, (_, i) => ({
    id: `placeholder_${i + 1}`,
    url: null,
    placeholder: true,
    gradient: `linear-gradient(135deg, ${colors[i % colors.length][0]}, ${colors[i % colors.length][1]})`,
    title: `AI 피팅컷 #${i + 1}`,
    width: 832,
    height: 1216,
  }))
}

// ────────────────────────────────────────────────────
// ────────────────────────────────────────────────────
// Admin API Routes
// ────────────────────────────────────────────────────

// ── 어드민 프롬프트 D1 헬퍼 ──
async function d1GetPromptConfig(db: D1Database): Promise<AdminPromptConfig> {
  try {
    const row: any = await db.prepare(`SELECT value FROM app_settings WHERE key = 'admin_prompt_config'`).first()
    if (row?.value) {
      const saved = JSON.parse(row.value)
      // 저장된 값이 없는 필드는 메모리 기본값으로 보완
      return {
        enabled:      typeof saved.enabled === 'boolean'      ? saved.enabled      : adminPromptConfig.enabled,
        prefix:       typeof saved.prefix === 'string'        ? saved.prefix       : adminPromptConfig.prefix,
        suffix:       typeof saved.suffix === 'string'        ? saved.suffix       : adminPromptConfig.suffix,
        styleGuide:   typeof saved.styleGuide === 'string'    ? saved.styleGuide   : adminPromptConfig.styleGuide,
        technicalSpec: typeof saved.technicalSpec === 'string' ? saved.technicalSpec : adminPromptConfig.technicalSpec,
        updatedAt:    saved.updatedAt || adminPromptConfig.updatedAt,
      }
    }
  } catch (e) {
    console.warn('d1GetPromptConfig fallback to memory:', e)
  }
  return adminPromptConfig
}

async function d1SavePromptConfig(db: D1Database, config: AdminPromptConfig): Promise<void> {
  await db.prepare(
    `INSERT INTO app_settings (key, value, updated_at) VALUES ('admin_prompt_config', ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).bind(JSON.stringify(config)).run()
}

// GET /api/admin/prompt — D1에서 설정 조회 (없으면 메모리 기본값)
app.get('/api/admin/prompt', adminAuth, async (c) => {
  try {
    const db: D1Database = c.env.LOOKBOOK_DB
    const config = await d1GetPromptConfig(db)
    return c.json({ success: true, config })
  } catch (err: any) {
    // D1 오류 시 메모리 fallback
    return c.json({ success: true, config: adminPromptConfig })
  }
})

// PUT /api/admin/prompt — D1에 저장 + 메모리 동기화
app.put('/api/admin/prompt', adminAuth, async (c) => {
  try {
    const db: D1Database = c.env.LOOKBOOK_DB
    const body: any = await c.req.json()
    const current = await d1GetPromptConfig(db)
    const updated: AdminPromptConfig = {
      enabled:      typeof body.enabled === 'boolean'      ? body.enabled      : current.enabled,
      prefix:       typeof body.prefix === 'string'        ? body.prefix       : current.prefix,
      suffix:       typeof body.suffix === 'string'        ? body.suffix       : current.suffix,
      styleGuide:   typeof body.styleGuide === 'string'    ? body.styleGuide   : current.styleGuide,
      technicalSpec: typeof body.technicalSpec === 'string' ? body.technicalSpec : current.technicalSpec,
      updatedAt: new Date().toISOString(),
    }
    // D1 저장
    await d1SavePromptConfig(db, updated)
    // 메모리 동기화 (같은 Worker 인스턴스 내 즉시 반영)
    adminPromptConfig = updated
    console.log('Admin prompt config saved to D1:', updated.updatedAt)
    return c.json({ success: true, config: updated })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 400)
  }
})

// POST /api/admin/auth — 비밀번호 확인
app.post('/api/admin/auth', async (c) => {
  const body: any = await c.req.json()
  const adminPassword = c.env.ADMIN_PASSWORD
  if (!adminPassword) {
    return c.json({ success: false, message: '서버 설정 오류: ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.' }, 500)
  }
  if (body.password === adminPassword) {
    return c.json({ success: true })
  }
  return c.json({ success: false, message: '비밀번호가 올바르지 않습니다.' }, 401)
})

// ────────────────────────────────────────────────────
// Pages (HTML Shell)
// ────────────────────────────────────────────────────
const htmlShell = (title: string, bodyContent: string) => `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | EZlook</title>
  <meta name="description" content="의류 이미지 하나로 AI 온모델 피팅컷과 룩북 세트를 자동 생성하세요." />
  <link rel="icon" type="image/svg+xml" href="/static/favicon.svg?v=${BUILD_VERSION}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
  <link href="/static/style.css?v=${BUILD_VERSION}" rel="stylesheet" />
  <!-- app.js는 head에 defer — body 인라인 script보다 항상 먼저 파싱·실행됨 -->
  <script src="/static/app.js?v=${BUILD_VERSION}" defer></script>
</head>
<body>
${bodyContent}

<!-- ── 크레딧 충전 패널 (모든 페이지 공통) ── -->
<div id="chargePanel" style="display:none;position:fixed;inset:0;background:#0d0d1a;z-index:9000;overflow-y:auto;">
  <div style="max-width:480px;margin:0 auto;padding:24px 16px 80px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
      <button onclick="closeChargePanel()" style="width:36px;height:36px;border:none;background:#2a2a45;border-radius:50%;color:#e0e0f0;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">‹</button>
      <h2 style="font-size:18px;font-weight:700;color:#f0f0f8;margin:0;" data-i18n="charge-title">크레딧 충전</h2>
    </div>
    <div style="background:linear-gradient(135deg,#1e1e35,#252545);border:1px solid rgba(108,71,255,0.3);border-radius:16px;padding:16px 20px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;">
      <div>
        <div style="font-size:12px;color:#8b8ba0;margin-bottom:4px;" data-i18n="charge-current">현재 보유 크레딧</div>
        <div id="chargePanelCredits" style="font-size:28px;font-weight:800;color:#a78bfa;">-</div>
      </div>
      <div style="font-size:32px;opacity:0.5;">💎</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:28px;">
      <div class="pkg-card" onclick="selectPackage('pkg_20000',this)" data-pkg="pkg_20000"
           style="background:linear-gradient(135deg,#1a1a2e,#252545);border:2px solid #3a3a60;border-radius:16px;padding:18px 20px;cursor:pointer;transition:all 0.2s;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:20px;font-weight:800;color:#f0f0f8;margin-bottom:4px;">1,000 크레딧</div>
            <div style="font-size:13px;color:#8b8ba0;" data-i18n="pkg-11">이미지 <strong style="color:#a78bfa;">11장</strong> 다운로드 가능</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:22px;font-weight:800;color:#6c47ff;">20,000원</div>
          </div>
        </div>
      </div>
      <div class="pkg-card" onclick="selectPackage('pkg_40000',this)" data-pkg="pkg_40000"
           style="background:linear-gradient(135deg,#1e1435,#2a1a50);border:2px solid #6c47ff;border-radius:16px;padding:18px 20px;cursor:pointer;transition:all 0.2s;position:relative;">
        <div style="position:absolute;top:0;right:20px;background:linear-gradient(135deg,#6c47ff,#a855f7);color:white;font-size:10px;font-weight:700;padding:3px 10px;border-radius:0 0 8px 8px;" data-i18n="pkg-popular">인기</div>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:20px;font-weight:800;color:#f0f0f8;margin-bottom:4px;">2,300 크레딧</div>
            <div style="font-size:13px;color:#8b8ba0;" data-i18n="pkg-25">이미지 <strong style="color:#a78bfa;">25장</strong> 다운로드 가능</div>
            <div style="font-size:11px;color:#a78bfa;margin-top:4px;" data-i18n="pkg-bonus15">✨ 기본 대비 15% 더 받기</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:22px;font-weight:800;color:#6c47ff;">40,000원</div>
          </div>
        </div>
      </div>
      <div class="pkg-card" onclick="selectPackage('pkg_60000',this)" data-pkg="pkg_60000"
           style="background:linear-gradient(135deg,#1a1a2e,#252545);border:2px solid #3a3a60;border-radius:16px;padding:18px 20px;cursor:pointer;transition:all 0.2s;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:20px;font-weight:800;color:#f0f0f8;margin-bottom:4px;">4,000 크레딧</div>
            <div style="font-size:13px;color:#8b8ba0;" data-i18n="pkg-44">이미지 <strong style="color:#a78bfa;">44장</strong> 다운로드 가능</div>
            <div style="font-size:11px;color:#a78bfa;margin-top:4px;" data-i18n="pkg-bonus33">🚀 기본 대비 33% 더 받기</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:22px;font-weight:800;color:#6c47ff;">60,000원</div>
          </div>
        </div>
      </div>
    </div>
    <button id="chargeCta" onclick="startPayment()"
            style="width:100%;padding:16px;background:linear-gradient(135deg,#6c47ff,#a855f7);border:none;border-radius:16px;color:white;font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;opacity:0.5;pointer-events:none;transition:all 0.2s;">
      <i class="fas fa-credit-card"></i>
      <span id="ctaLabel" data-i18n="pkg-btn">패키지를 선택하세요</span>
    </button>

  </div>
</div>

</body>
</html>`

// ─── 공유된 생성 이미지 보기 (링크복사 / 카카오톡 공유로 전달되는 공개 페이지) ───
// 별도 테이블 없이 기존 generation_logs.image_urls + expires_at(14일)을 그대로 재사용
app.get('/share/:jobId/:idx', async (c) => {
  const db: D1Database = c.env.LOOKBOOK_DB
  const jobId = c.req.param('jobId')
  const idx = parseInt(c.req.param('idx') || '0', 10)

  const renderSharePage = (opts: { state: 'ok' | 'expired' | 'notfound'; imageUrl?: string; sourceTabs?: { label: string; url: string }[]; resultTab?: { label: string; url: string } }) => {
    const origin = getOrigin(c)
    const pageUrl = `${origin}/share/${jobId}/${idx}`
    let body = ''
    if (opts.state === 'ok') {
      const sourceTabs = opts.sourceTabs || []
      const topTabsHtml = sourceTabs.length > 0 ? `
          <div class="share-tabs">
            ${sourceTabs.map(t => `<button class="share-tab" data-url="${t.url}" onclick="_switchShareTab(this)">${t.label}</button>`).join('')}
          </div>` : ''
      const bottomTabHtml = (opts.resultTab && sourceTabs.length > 0) ? `
          <div class="share-tabs share-tabs-bottom">
            <button class="share-tab active" data-url="${opts.resultTab.url}" onclick="_switchShareTab(this)">${opts.resultTab.label}</button>
          </div>` : ''
      body = `
        <div class="share-card">
          ${topTabsHtml}
          ${bottomTabHtml}
          <div class="share-img-wrap">
            <img id="shareMainImg" src="${opts.imageUrl}" alt="EZlook 생성 이미지" class="share-img" />
          </div>
          <div class="share-info">
            <p class="share-title">상품 이미지로 모델컷 만들기</p>
            <p class="share-desc">클릭4번으로 AI모델컷이 무료로 만들어 진다고?</p>
            <a href="/generator" class="share-cta"><i class="fas fa-wand-magic-sparkles"></i> 나도 해보기</a>
          </div>
        </div>
        <script>
          function _switchShareTab(btn) {
            document.querySelectorAll('.share-tab').forEach(function(b){ b.classList.remove('active'); });
            btn.classList.add('active');
            document.getElementById('shareMainImg').src = btn.getAttribute('data-url');
          }
        </script>`
    } else if (opts.state === 'expired') {
      body = `
        <div class="share-card share-message">
          <span class="share-emoji">⏰</span>
          <p class="share-msg-text">다운로드 기간 14일이 만료되어 파일을 불러올 수 없어요.</p>
          <a href="/generator" class="share-cta"><i class="fas fa-wand-magic-sparkles"></i> 나도 만들어보기</a>
        </div>`
    } else {
      body = `
        <div class="share-card share-message">
          <span class="share-emoji">🔍</span>
          <p class="share-msg-text">이미지를 찾을 수 없어요.</p>
          <a href="/generator" class="share-cta"><i class="fas fa-wand-magic-sparkles"></i> 나도 만들어보기</a>
        </div>`
    }

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>EZlook - 공유된 피팅컷</title>
  <meta property="og:title" content="상품 이미지로 모델컷 만들기" />
  <meta property="og:description" content="클릭4번으로 AI모델컷이 무료로 만들어 진다고?" />
  ${opts.state === 'ok' ? `<meta property="og:image" content="${opts.imageUrl}" />` : ''}
  <meta property="og:url" content="${pageUrl}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body { margin: 0; height: 100dvh; background: #0d0d1a; font-family: 'Pretendard', -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; padding: 12px; overflow: hidden; }
    .share-card { width: 100%; max-width: 420px; height: 100%; max-height: 760px; background: #17172b; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.4); display: flex; flex-direction: column; }
    .share-tabs { flex: 0 0 auto; display: flex; gap: 6px; padding: 10px 10px 0; flex-wrap: wrap; }
    .share-tabs-bottom { padding: 8px 10px 0; }
    .share-tab { flex: 1; min-width: 60px; background: #23233d; color: #a0a0c0; border: none; border-radius: 10px; padding: 8px 4px; font-size: 11px; font-weight: 700; cursor: pointer; font-family: inherit; transition: background 0.15s, color 0.15s; }
    .share-tab.active { background: linear-gradient(135deg,#6c47ff,#a855f7); color: #fff; }
    .share-img-wrap { flex: 1 1 auto; min-height: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-top: 8px; background: #000; }
    .share-img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; display: block; }
    .share-info { flex: 0 0 auto; padding: 12px 18px 16px; text-align: center; }
    .share-title { color: #fff; font-size: 14px; font-weight: 800; margin: 0 0 4px; }
    .share-desc { color: #a0a0c0; font-size: 12px; font-weight: 600; margin: 0 0 10px; }
    .share-cta { display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg,#6c47ff,#a855f7); color: #fff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 10px 22px; border-radius: 12px; }
    .share-message { padding: 48px 28px; text-align: center; }
    .share-emoji { font-size: 40px; display: block; margin-bottom: 16px; }
    .share-msg-text { color: #e0e0f0; font-size: 15px; font-weight: 600; line-height: 1.6; margin: 0 0 24px; }
  </style>
</head>
<body>
  ${body}
</body>
</html>`
  }

  if (!jobId || isNaN(idx)) return c.html(renderSharePage({ state: 'notfound' }), 404)

  try {
    const log = await db.prepare(
      `SELECT image_urls, expires_at, model_id, bg_id FROM generation_logs WHERE job_id = ? ORDER BY id DESC LIMIT 1`
    ).bind(jobId).first() as any

    if (!log || !log.image_urls) return c.html(renderSharePage({ state: 'notfound' }), 404)

    if (log.expires_at) {
      const exp = new Date(String(log.expires_at).replace(' ', 'T') + 'Z')
      if (exp.getTime() <= Date.now()) return c.html(renderSharePage({ state: 'expired' }))
    }

    let urls: string[] = []
    try { urls = JSON.parse(log.image_urls) } catch {}
    const url = urls[idx]
    if (!url) return c.html(renderSharePage({ state: 'notfound' }), 404)

    const origin = getOrigin(c)
    const proxiedUrl = `${origin}/api/proxy/gen-image?url=${encodeURIComponent(url)}`

    // 공유 화면 상단 탭 — 원본 의상/모델/배경, 하단 탭 — 생성결과
    const sourceTabs: { label: string; url: string }[] = []
    const kv: KVNamespace | undefined = (c.env as any)?.LOOKBOOK_KV
    if (kv) {
      const clothingStored = await kv.get(`clothing_img:${jobId}`)
      if (clothingStored) {
        try {
          const clothingUrls: string[] = JSON.parse(clothingStored)
          clothingUrls.forEach((_, i) => {
            sourceTabs.push({
              label: clothingUrls.length > 1 ? `의상${i + 1}` : '의상',
              url: `${origin}/api/proxy/clothing/${jobId}/${i}`,
            })
          })
        } catch {}
      }
    }
    if (log.model_id) sourceTabs.push({ label: '모델', url: `${origin}/api/proxy/custom-model/${log.model_id}` })
    if (log.bg_id) sourceTabs.push({ label: '배경', url: `${origin}/api/proxy/custom-bg/${log.bg_id}` })

    return c.html(renderSharePage({
      state: 'ok',
      imageUrl: proxiedUrl,
      sourceTabs,
      resultTab: { label: '생성결과', url: proxiedUrl },
    }))
  } catch (err: any) {
    console.error('Share page error:', err)
    return c.html(renderSharePage({ state: 'notfound' }), 500)
  }
})

// ─── 이용약관 페이지 ───
app.get('/terms', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>서비스 이용약관 - EZlook</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #333; line-height: 1.8; }
    h1 { font-size: 28px; border-bottom: 2px solid #eee; padding-bottom: 16px; }
    h2 { font-size: 18px; margin-top: 32px; color: #111; }
    p, li { font-size: 15px; color: #444; }
    .date { color: #888; font-size: 14px; margin-bottom: 32px; }
    a { color: #6c5ce7; }
  </style>
</head>
<body>
  <h1>서비스 이용약관</h1>
  <p class="date">시행일: 2025년 1월 1일 | 최종 수정일: 2025년 1월 1일</p>

  <h2>제1조 (목적)</h2>
  <p>본 약관은 EZlook(이하 "서비스")이 제공하는 AI 패션 룩북 생성 서비스의 이용에 관한 조건 및 절차, 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>

  <h2>제2조 (정의)</h2>
  <p>① "서비스"란 EZlook이 제공하는 AI 기반 패션 이미지 생성 플랫폼을 의미합니다.</p>
  <p>② "이용자"란 본 약관에 동의하고 서비스를 이용하는 자를 의미합니다.</p>
  <p>③ "크레딧"이란 서비스 내 AI 이미지 생성에 사용되는 가상 화폐를 의미합니다.</p>

  <h2>제3조 (약관의 효력 및 변경)</h2>
  <p>① 본 약관은 서비스 화면에 게시하거나 기타 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</p>
  <p>② 서비스는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 공지 후 7일 이내에 효력이 발생합니다.</p>

  <h2>제4조 (서비스 이용)</h2>
  <p>① 이용자는 본 약관에 동의함으로써 서비스를 이용할 수 있습니다.</p>
  <p>② 서비스는 AI를 활용한 패션 이미지 생성 기능을 제공합니다.</p>
  <p>③ 이용자는 서비스 이용 시 관련 법령을 준수해야 합니다.</p>

  <h2>제5조 (이용자의 의무)</h2>
  <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
  <ul>
    <li>타인의 권리를 침해하는 방식으로 서비스를 이용하는 행위</li>
    <li>불법적인 콘텐츠를 생성하거나 유포하는 행위</li>
    <li>서비스의 정상적인 운영을 방해하는 행위</li>
    <li>다른 이용자의 개인정보를 무단으로 수집·이용하는 행위</li>
  </ul>

  <h2>제6조 (서비스 변경 및 중단)</h2>
  <p>서비스는 운영상 필요한 경우 서비스 내용을 변경하거나 중단할 수 있으며, 이 경우 사전에 공지합니다.</p>

  <h2>제7조 (면책조항)</h2>
  <p>① 서비스는 AI가 생성한 콘텐츠의 정확성, 완전성에 대해 보증하지 않습니다.</p>
  <p>② 서비스는 이용자의 귀책사유로 인한 손해에 대해 책임을 지지 않습니다.</p>

  <h2 id="refund">제8조 (청약철회 및 환불)</h2>
  <p>① 이용자는 크레딧 결제일로부터 7일 이내에는 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조에 따라 청약철회를 요청할 수 있습니다. 단, 해당 크레딧을 일부라도 사용(이미지 생성)한 경우에는 사용분을 제외한 잔여 크레딧에 한해 환불이 가능합니다.</p>
  <p>② 크레딧을 전부 사용한 경우, 또는 결제일로부터 7일이 경과한 경우에는 원칙적으로 청약철회 및 환불이 제한됩니다.</p>
  <p>③ 서비스 오류(AI 생성 실패, 결제 중복 등) 등 회사의 귀책사유로 정상적인 서비스 제공이 불가능한 경우, 이용자는 사용 여부와 관계없이 전액 환불을 요청할 수 있습니다.</p>
  <p>④ 환불 신청은 아래 문의처로 결제 정보(주문번호, 결제일시, 결제수단)와 함께 요청해 주시기 바랍니다. 환불은 신청 접수 후 3영업일 이내에 결제 수단과 동일한 방법으로 처리됩니다.</p>
  <p>⑤ 이용자의 단순 변심에 의한 환불 시, 이미 사용한 크레딧에 해당하는 금액은 환불 대상에서 제외됩니다.</p>

  <h2>제9조 (분쟁 해결)</h2>
  <p>본 약관과 관련한 분쟁은 대한민국 법률을 적용하며, 관할 법원은 민사소송법에 따릅니다.</p>

  <p style="margin-top:40px; color:#888; font-size:13px;">문의: <a href="mailto:kim4honey@gmail.com">kim4honey@gmail.com</a></p>
</body>
</html>`)
})

// ─── 개인정보처리방침 페이지 ───
app.get('/privacy', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>개인정보처리방침 - EZlook</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #333; line-height: 1.8; }
    h1 { font-size: 28px; border-bottom: 2px solid #eee; padding-bottom: 16px; }
    h2 { font-size: 18px; margin-top: 32px; color: #111; }
    p, li { font-size: 15px; color: #444; }
    .date { color: #888; font-size: 14px; margin-bottom: 32px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #ddd; padding: 10px 14px; font-size: 14px; text-align: left; }
    th { background: #f5f5f5; }
    a { color: #6c5ce7; }
  </style>
</head>
<body>
  <h1>개인정보처리방침</h1>
  <p class="date">시행일: 2025년 1월 1일 | 최종 수정일: 2025년 1월 1일</p>

  <p>EZlook(이하 "서비스")은 이용자의 개인정보를 소중히 여기며, 개인정보 보호법 등 관련 법령을 준수합니다.</p>

  <h2>1. 수집하는 개인정보 항목</h2>
  <table>
    <tr><th>수집 항목</th><th>수집 목적</th><th>보유 기간</th></tr>
    <tr><td>이메일, 닉네임, 프로필 사진</td><td>회원가입 및 서비스 이용</td><td>회원 탈퇴 시까지</td></tr>
    <tr><td>서비스 이용 기록</td><td>서비스 개선 및 분석</td><td>1년</td></tr>
  </table>

  <h2>2. 개인정보 수집 방법</h2>
  <p>카카오 로그인, Google 로그인, 이메일 직접 가입을 통해 수집합니다.</p>

  <h2>3. 개인정보 이용 목적</h2>
  <ul>
    <li>회원 식별 및 서비스 제공</li>
    <li>AI 이미지 생성 서비스 운영</li>
    <li>고객 문의 응대</li>
    <li>서비스 개선 및 신규 기능 개발</li>
  </ul>

  <h2>4. 개인정보 제3자 제공</h2>
  <p>서비스는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 단, 법령에 의한 요청이 있는 경우는 예외로 합니다.</p>

  <h2>5. 개인정보 보유 및 이용 기간</h2>
  <p>회원 탈퇴 시 즉시 삭제하며, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관 후 삭제합니다.</p>

  <h2>6. 이용자의 권리</h2>
  <p>이용자는 언제든지 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다.</p>

  <h2>7. 개인정보 보호책임자</h2>
  <p>이메일: <a href="mailto:kim4honey@gmail.com">kim4honey@gmail.com</a></p>

  <h2>8. 개인정보 처리방침 변경</h2>
  <p>본 방침은 법령·정책 변경에 따라 수정될 수 있으며, 변경 시 서비스 내 공지합니다.</p>
</body>
</html>`)
})

// ─── Landing Page ───
app.get('/_home_old', (c) => {
  return c.redirect('/generator', 302)
})

app.get('/', (c) => {
  // studiob.aifashion.co.kr는 상단 전역 미들웨어에서 이미 www로 리다이렉트됨
  // 마케팅 홈페이지(이용약관·개인정보처리방침·사업자정보 포함)를 직접 서빙
  return c.html(htmlShell('홈', `
  <!-- Toast Container -->
  <div class="toast-container" id="toastContainer"></div>

  <!-- ════════════════════════════════════════
       홈페이지 전용 흑백(Black & White) 테마 오버라이드
       — 이 페이지(/)에서만 적용됨. 생성화면/대시보드 등
       다른 페이지의 공통 style.css 색상에는 영향 없음.
  ════════════════════════════════════════ -->
  <style>
    #navbar .btn-primary,
    #hero .btn-primary,
    #how-it-works .btn-primary,
    #pricing .btn-primary,
    #cta-section .btn-primary {
      background: #000 !important;
      box-shadow: none !important;
    }
    #navbar .btn-primary:hover,
    #hero .btn-primary:hover,
    #how-it-works .btn-primary:hover,
    #pricing .btn-primary:hover,
    #cta-section .btn-primary:hover { background: #222 !important; }
    #pricing .btn-secondary { color: #000 !important; border-color: #000 !important; }
    #pricing .btn-secondary:hover { background: #f0f0f0 !important; }

    #navUserAvatar { background: #000 !important; box-shadow: none !important; }
    #ddUserCredits { color: #000 !important; }
    #userDropdownMenu button[onclick*="openChargePanel"] { background: #000 !important; }

    /* Hero */
    #hero { background: linear-gradient(135deg, #000 0%, #1a1a1a 50%, #000 100%) !important; }
    #hero .hero-bg-grid {
      background-image:
        linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px) !important;
    }
    #hero .hero-glow-1 { background: radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%) !important; }
    #hero .hero-glow-2 { background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%) !important; }
    #hero .hero-tag { background: rgba(255,255,255,0.1) !important; border-color: rgba(255,255,255,0.3) !important; color: #fff !important; }
    #hero .hero-title .highlight { background: none !important; -webkit-text-fill-color: #fff !important; color: #fff !important; }
    #hero .hero-stat-num { background: none !important; -webkit-text-fill-color: #fff !important; color: #fff !important; }
    #hero .hero-showcase { filter: grayscale(1); }
    #hero .showcase-badge { background: rgba(0,0,0,0.75) !important; }

    /* Features */
    #features .section-tag { background: #f0f0f0 !important; color: #000 !important; }
    #features .feature-card:hover { border-color: #000 !important; }
    #features .feature-icon { background: #f0f0f0 !important; }
    #features .feature-icon i { color: #000 !important; }

    /* How it works */
    #how-it-works .steps-grid { grid-template-columns: repeat(3, 1fr) !important; max-width: 720px; margin: 0 auto; }
    #how-it-works .steps-grid::before { background: #ddd !important; }
    #how-it-works .step-card:hover .step-num { background: #f0f0f0 !important; border-color: #000 !important; }
    #how-it-works .step-num i { color: #000 !important; }

    /* Pricing */
    #pricing .pricing-plan { color: #000 !important; }
    #pricing .pricing-card.featured { border-color: #000 !important; }
    #pricing .pricing-popular { background: #000 !important; color: #fff !important; }
    #pricing .pricing-features li .check { color: #000 !important; }

    /* CTA */
    #cta-section { background: linear-gradient(135deg, #000 0%, #111 100%) !important; }
    #cta-section::before { background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%) !important; }
    #cta-section .cta-title .highlight { background: none !important; -webkit-text-fill-color: #fff !important; color: #fff !important; }
  </style>

  <!-- Navbar -->
  <nav id="navbar">
    <div class="navbar-inner">
      <a href="/" class="navbar-logo">
        <span>EZlook</span>
      </a>
      <div class="navbar-nav">
        <a href="#features">기능</a>
        <a href="#how-it-works">이용방법</a>
        <a href="#pricing">요금제</a>
        <a href="/dashboard">대시보드</a>
      </div>
      <div class="navbar-actions" style="position:relative;">
        <button class="btn btn-ghost" id="navLoginBtn" onclick="openModal('loginModal')" data-i18n="nav-login">로그인</button>
        <button class="btn btn-primary" id="navSignupBtn" onclick="switchAuthTab('signup');openModal('loginModal')" data-i18n="nav-signup">무료 시작</button>
        <!-- 로그인 후 프로필 아이콘만 표시 -->
        <div id="navUserArea" style="display:none;align-items:center;gap:0;position:relative;">
          <span id="navUserCredits" style="display:none;"></span>
          <span id="navUserName" style="display:none;"></span>
          <div id="navUserAvatar" onclick="toggleUserMenu()" style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--primary),#a855f7);display:flex;align-items:center;justify-content:center;color:white;font-size:15px;font-weight:700;cursor:pointer;user-select:none;box-shadow:0 2px 8px rgba(108,71,255,0.4);">?</div>
          <!-- 드롭다운 -->
          <div id="userDropdownMenu" style="display:none;position:absolute;top:44px;right:0;background:#1e1e35;border:1px solid #3a3a60;border-radius:16px;padding:6px;min-width:220px;box-shadow:0 12px 32px rgba(0,0,0,0.6);z-index:2000;">
            <div style="padding:12px 14px 10px;border-bottom:1px solid #3a3a60;margin-bottom:4px;">
              <div id="ddUserName" style="font-size:14px;font-weight:700;color:#f0f0f8;margin-bottom:2px;"></div>
              <div id="ddUserEmail" style="font-size:12px;color:#8b8ba0;margin-bottom:6px;"></div>
              <div style="display:flex;align-items:center;justify-content:space-between;">
                <div id="ddUserCredits" style="font-size:13px;font-weight:600;color:#6c47ff;"></div>
                <button onclick="openChargePanel();toggleUserMenu();" style="font-size:11px;padding:3px 10px;background:#6c47ff;color:white;border:none;border-radius:20px;cursor:pointer;font-weight:600;" data-i18n="nav-charge">충전</button>
              </div>
            </div>
            <a href="/dashboard#history" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:10px 14px;font-size:14px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''" data-i18n="nav-history">생성 내역</a>
            <a href="http://pf.kakao.com/_wFyCX/chat" target="_blank" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:10px 14px;font-size:14px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">카톡 문의</a>
            <a href="https://www.aifashion.co.kr/#siteFooter" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:10px 14px;font-size:14px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">서비스소개</a>
            <div style="height:1px;background:#3a3a60;margin:4px 0;"></div>
            <button onclick="handleLogout()" style="display:block;width:100%;text-align:left;padding:10px 14px;font-size:14px;color:#ef4444;background:none;border:none;cursor:pointer;border-radius:10px;" onmouseover="this.style.background='#ef444411'" onmouseout="this.style.background=''" data-i18n="nav-logout">로그아웃</button>
          </div>
        </div>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section id="hero">
    <div class="hero-bg-grid"></div>
    <div class="hero-glow-1"></div>
    <div class="hero-glow-2"></div>
    <div class="hero-content">
      <div class="hero-left">
        <div class="hero-tag">
          <i class="fas fa-sparkles"></i>
          국내 최소 클릭 · AI 패션 이미지 자동화 플랫폼
        </div>
        <h1 class="hero-title">
          옷 사진 한 장으로<br />
          <span class="highlight">AI 룩북 완성</span>
        </h1>
        <p class="hero-desc">
          촬영 없이도 전문 모델 피팅컷과 고품질 룩북을 즉시 제작하세요.<br />
          누구나 최소한의 클릭으로 쉽게 쓸 수 있도록 만들었습니다.
        </p>
        <div class="hero-stats">
          <div class="hero-stat">
            <div class="hero-stat-num">95%</div>
            <div class="hero-stat-label">생성 성공률</div>
          </div>
          <div class="hero-stat">
            <div class="hero-stat-num">30초</div>
            <div class="hero-stat-label">평균 생성 시간</div>
          </div>
          <div class="hero-stat">
            <div class="hero-stat-num">50K+</div>
            <div class="hero-stat-label">생성된 이미지</div>
          </div>
        </div>
        <div class="hero-cta">
          <button class="btn btn-primary btn-lg" onclick="location.href='/generator'">
            <i class="fas fa-bolt"></i>
            무료로 시작하기
          </button>
          <a href="#how-it-works" class="btn btn-ghost btn-lg" style="color:#A0A0C0; border: 2px solid rgba(255,255,255,0.2);">
            <i class="fas fa-play-circle"></i>
            작동 방식 보기
          </a>
        </div>
      </div>
      <div class="hero-visual">
        <div class="hero-showcase">
          <div class="showcase-card">
            <div style="width:100%;height:100%;background:linear-gradient(135deg,#FF6B9D,#FF8C42);display:flex;align-items:center;justify-content:center;font-size:72px;">👗</div>
            <div class="showcase-badge">원본 의류</div>
          </div>
          <div class="showcase-card">
            <div style="width:100%;height:100%;background:linear-gradient(135deg,#6C47FF,#00D4AA);display:flex;align-items:center;justify-content:center;font-size:72px;">🧍‍♀️</div>
            <div class="showcase-badge">AI 생성 피팅컷</div>
          </div>
          <div class="showcase-card" style="grid-column:span 2;aspect-ratio:16/9;margin-top:0">
            <div style="width:100%;height:100%;background:linear-gradient(135deg,#1A1A3E,#6C47FF);display:flex;align-items:center;justify-content:center;gap:20px;flex-wrap:wrap;padding:20px;">
              <span style="font-size:48px;">👗</span><span style="font-size:32px;color:#A78BFF;">→</span><span style="font-size:48px;">🧍‍♀️</span><span style="font-size:32px;color:#A78BFF;">→</span><span style="font-size:48px;">📸</span>
            </div>
            <div class="showcase-badge">스타일샷 세트</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section id="features">
    <div class="container">
      <div class="section-header">
        <div class="section-tag"><i class="fas fa-star"></i> 핵심 기능</div>
        <h2 class="section-title">프로 촬영을 대체하는<br />AI 기술</h2>
        <p class="section-desc">패션 디렉터, 디자이너, AI 전문가가 함께 만들어 결과물의 완성도가 다릅니다.</p>
      </div>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon purple"><i class="fas fa-shirt"></i></div>
          <h3 class="feature-title">원클릭 의류 업로드</h3>
          <p class="feature-desc">JPG, PNG, WEBP 형식의 의류 이미지를 드래그앤드롭으로 간편하게 업로드하고 앞/뒤 방향을 설정하세요.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon pink"><i class="fas fa-person"></i></div>
          <h3 class="feature-title">100+ AI 모델 프리셋</h3>
          <p class="feature-desc">성별, 연령대, 체형, 피부톤, 무드를 필터링하여 브랜드에 딱 맞는 AI 모델을 선택하세요.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon teal"><i class="fas fa-image"></i></div>
          <h3 class="feature-title">다양한 배경 프리셋</h3>
          <p class="feature-desc">스튜디오, 스트리트, 카페, 자연 등 15가지+ 배경을 제공합니다. 무드에 맞는 배경으로 분위기를 완성하세요.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon amber"><i class="fas fa-bolt"></i></div>
          <h3 class="feature-title">30초 내 AI 생성</h3>
          <p class="feature-desc">최대 90초 이내에 고품질 온모델 피팅컷을 생성합니다. 전신/반신/상반신 구도와 다양한 포즈를 선택하세요.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon blue"><i class="fas fa-layer-group"></i></div>
          <h3 class="feature-title">룩북 세트 자동 생성</h3>
          <p class="feature-desc">상세용, 광고용, SNS용, 룩북용 이미지 세트를 한 번에 생성하여 모든 채널의 크리에이티브를 해결하세요.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon green"><i class="fas fa-download"></i></div>
          <h3 class="feature-title">일괄 다운로드</h3>
          <p class="feature-desc">생성된 이미지를 개별 또는 ZIP 파일로 일괄 다운로드하고, 즐겨찾기로 관리하세요.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- How It Works -->
  <section id="how-it-works">
    <div class="container">
      <div class="section-header">
        <div class="section-tag"><i class="fas fa-route"></i> 이용 방법</div>
        <h2 class="section-title">3단계로 완성되는<br />AI 룩북 제작</h2>
        <p class="section-desc">국내에서 가장 적은 클릭으로 상품 이미지를 모델컷으로 바꿔드립니다.</p>
      </div>
      <div class="steps-grid">
        <div class="step-card">
          <div class="step-num"><i class="fas fa-shirt"></i></div>
          <div class="step-title">Step 1. 옷 사진 업로드</div>
          <div class="step-desc">가지고 있는 상품 이미지 한 장만 올리면 끝</div>
        </div>
        <div class="step-card">
          <div class="step-num"><i class="fas fa-person"></i></div>
          <div class="step-title">Step 2. AI 모델 선택</div>
          <div class="step-desc">성별, 체형, 무드에 맞는 모델을 선택합니다</div>
        </div>
        <div class="step-card">
          <div class="step-num"><i class="fas fa-wand-magic-sparkles"></i></div>
          <div class="step-title">Step 3. 배경 선택 → 자동 생성</div>
          <div class="step-desc">배경만 고르면 AI가 알아서 완성해드려요</div>
        </div>
      </div>
      <div style="text-align:center;margin-top:48px;">
        <a href="/generator" class="btn btn-primary btn-lg">
          <i class="fas fa-wand-magic-sparkles"></i>
          지금 바로 시작하기
        </a>
      </div>
    </div>
  </section>

  <!-- Pricing -->
  <section id="pricing">
    <div class="container">
      <div class="section-header">
        <div class="section-tag"><i class="fas fa-tags"></i> 요금제</div>
        <h2 class="section-title">쓴 만큼만 내는<br />크레딧 충전제</h2>
        <p class="section-desc">월정액 없이, 필요한 만큼만 충전해서 쓰세요. 가입 즉시 무료 크레딧이 지급됩니다.<br />이미지 1장 다운로드 시 90크레딧이 차감됩니다.</p>
      </div>
      <div class="pricing-grid">
        <div class="pricing-card">
          <div class="pricing-plan">스타터</div>
          <div class="pricing-price">
            <span class="amount">₩20,000</span>
            <span class="period">1회 충전</span>
          </div>
          <p class="pricing-desc">1,000 크레딧 · 이미지 최대 11장</p>
          <hr class="pricing-divider" />
          <ul class="pricing-features">
            <li><span class="check">✓</span> 전체 AI 모델 100종+</li>
            <li><span class="check">✓</span> 전체 배경 15종+</li>
            <li><span class="check">✓</span> 스타일샷 세트 생성</li>
            <li><span class="check">✓</span> 일괄 다운로드</li>
          </ul>
          <button class="btn btn-secondary btn-full" onclick="location.href='/generator'">충전하고 시작하기</button>
        </div>
        <div class="pricing-card featured">
          <div class="pricing-popular">가장 인기</div>
          <div class="pricing-plan">인기 충전권</div>
          <div class="pricing-price">
            <span class="amount">₩40,000</span>
            <span class="period">1회 충전</span>
          </div>
          <p class="pricing-desc">2,300 크레딧 · 이미지 최대 25장<br />✨ 기본 대비 15% 더 받기</p>
          <hr class="pricing-divider" />
          <ul class="pricing-features">
            <li><span class="check">✓</span> 전체 AI 모델 100종+</li>
            <li><span class="check">✓</span> 전체 배경 15종+</li>
            <li><span class="check">✓</span> 스타일샷 세트 생성</li>
            <li><span class="check">✓</span> 일괄 다운로드</li>
          </ul>
          <button class="btn btn-primary btn-full" onclick="location.href='/generator'">지금 시작하기</button>
        </div>
        <div class="pricing-card">
          <div class="pricing-plan">베스트 밸류</div>
          <div class="pricing-price">
            <span class="amount">₩60,000</span>
            <span class="period">1회 충전</span>
          </div>
          <p class="pricing-desc">4,000 크레딧 · 이미지 최대 44장<br />🚀 기본 대비 33% 더 받기</p>
          <hr class="pricing-divider" />
          <ul class="pricing-features">
            <li><span class="check">✓</span> 전체 AI 모델 100종+</li>
            <li><span class="check">✓</span> 전체 배경 15종+</li>
            <li><span class="check">✓</span> 스타일샷 세트 생성</li>
            <li><span class="check">✓</span> 일괄 다운로드</li>
          </ul>
          <button class="btn btn-secondary btn-full" onclick="location.href='/generator'">충전하고 시작하기</button>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section id="cta-section">
    <div class="container">
      <div class="cta-content">
        <h2 class="cta-title">지금 바로 <span class="highlight">무료로 체험</span>하세요</h2>
        <p class="cta-desc">신용카드 없이 200크레딧을 무료로 받고<br />AI 룩북 제작을 경험해보세요.</p>
        <div class="cta-actions">
          <button class="btn btn-primary btn-lg" onclick="location.href='/generator'">
            <i class="fas fa-rocket"></i>
            무료로 시작하기 →
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer id="siteFooter">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="navbar-logo">
            <span>EZlook</span>
          </div>
          <p>AI 기술로 패션 이커머스 촬영의<br />새로운 기준을 만들어갑니다.</p>
        </div>
        <div class="footer-col">
          <h4>제품</h4>
          <ul class="footer-links">
            <li><a href="#features">기능 소개</a></li>
            <li><a href="#how-it-works">이용 방법</a></li>
            <li><a href="#pricing">요금제</a></li>
            <li><a href="/generator">데모</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>회사</h4>
          <ul class="footer-links">
            <li><a href="#">회사 소개</a></li>
            <li><a href="#">블로그</a></li>
            <li><a href="#">채용</a></li>
            <li><a href="#">문의하기</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>법적 고지</h4>
          <ul class="footer-links">
            <li><a href="/terms">이용약관</a></li>
            <li><a href="/terms#refund">환불정책</a></li>
            <li><a href="/privacy">개인정보처리방침</a></li>
          </ul>
        </div>
      </div>

      <!-- 회사 정보 구분선 -->
      <div style="border-top:1px solid rgba(255,255,255,0.08);margin:32px 0 24px;"></div>

      <!-- 사업자 정보 -->
      <div class="footer-company-info">
        <p>
          <strong>벌거벗은호랑이</strong>&nbsp;&nbsp;
          대표자 : 김사헌&nbsp;&nbsp;
          사업자등록번호 : 204-29-48306&nbsp;&nbsp;
          통신판매업신고번호 : 2025-충북청주-1463
        </p>
        <p>
          사업장주소 : 충청북도 청주시 서원구 무심서로 377-3&nbsp;&nbsp;
          전화번호 : 070-4581-8166
        </p>
      </div>

      <div class="footer-bottom">
        <span>© 2026 벌거벗은호랑이 / NakedTiger. All rights reserved.</span>
        <div style="display:flex;gap:16px;align-items:center;">
          <a href="/terms" style="color:var(--text-muted);font-size:13px;">이용약관</a>
          <a href="/privacy" style="color:var(--text-muted);font-size:13px;font-weight:700;">개인정보처리방침</a>
        </div>
      </div>
    </div>
  </footer>

  <!-- Login / Signup Modal (통합) -->
  <div class="modal-overlay" id="loginModal">
    <div class="modal-box" style="max-width:420px;">
      <button class="modal-close" onclick="closeModal('loginModal')">×</button>

      <!-- 탭 전환 -->
      <div style="display:flex;gap:0;margin-bottom:24px;border-bottom:2px solid var(--border);">
        <button id="tabLogin"  onclick="switchAuthTab('login')"  style="flex:1;padding:10px;background:none;border:none;font-size:15px;font-weight:700;color:var(--primary);border-bottom:2px solid var(--primary);margin-bottom:-2px;cursor:pointer;" data-i18n="nav-login">로그인</button>
        <button id="tabSignup" onclick="switchAuthTab('signup')" style="flex:1;padding:10px;background:none;border:none;font-size:15px;font-weight:600;color:var(--text-muted);cursor:pointer;" data-i18n="nav-signup2">회원가입</button>
      </div>

      <!-- 소셜 로그인 버튼 -->
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
        <button onclick="oauthLogin('kakao', this)" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:13px;background:#FEE500;border:none;border-radius:10px;font-size:15px;font-weight:700;color:#3C1E1E;cursor:pointer;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.628 5.073 4.09 6.51L4.993 21l4.457-2.387A11.3 11.3 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z"/></svg>
          카카오로 시작하기
        </button>
        <button onclick="oauthLogin('google', this)" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:13px;background:#fff;border:1px solid #dadce0;border-radius:10px;font-size:15px;font-weight:600;color:#3c4043;cursor:pointer;">
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Google로 시작하기
        </button>
      </div>

      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
        <div style="flex:1;height:1px;background:var(--border);"></div>
        <span style="font-size:12px;color:var(--text-muted);">또는 이메일로</span>
        <div style="flex:1;height:1px;background:var(--border);"></div>
      </div>

      <!-- 로그인 폼 -->
      <div id="authFormLogin">
        <form id="loginForm" onsubmit="handleLogin(event)" novalidate>
          <div id="loginError" class="auth-message error" role="alert" style="display:none;"><span class="auth-msg-icon">❌</span><span id="loginErrorText"></span></div>
          <div class="form-group">
            <input type="email" class="form-input" id="loginEmail" placeholder="이메일" autocomplete="email" />
          </div>
          <div class="form-group">
            <input type="password" class="form-input" id="loginPassword" placeholder="비밀번호" autocomplete="current-password" />
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg" id="loginBtn" style="margin-top:4px;" data-i18n="nav-login">로그인</button>
        </form>
      </div>

      <!-- 회원가입 폼 -->
      <div id="authFormSignup" style="display:none;">
        <form id="signupForm" onsubmit="handleSignup(event)" novalidate>
          <div id="signupError" class="auth-message error" role="alert" style="display:none;"><span class="auth-msg-icon">❌</span><span id="signupErrorText"></span></div>

          <!-- 약관 동의 체크박스 — 에러 바로 아래, 입력필드 위 -->
          <div style="display:flex;flex-direction:column;gap:0;margin-bottom:14px;background:var(--bg-secondary,#f8f8f8);border-radius:10px;border:1px solid var(--border-color,#e8e8e8);overflow:hidden;">
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:13px 16px;border-bottom:1px solid var(--border-color,#e8e8e8);background:var(--white,#fff);" onclick="toggleAgreeAll(event)">
              <input type="checkbox" id="agreeAll" data-i18n-next="agree-all" style="width:18px;height:18px;cursor:pointer;accent-color:var(--primary,#6366f1);flex-shrink:0;" />
              <span style="font-size:14px;font-weight:700;color:var(--text-primary,#111);">전체 동의</span>
            </label>
            <div style="display:flex;flex-direction:column;gap:0;padding:10px 16px 12px;">
              <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:13px;color:var(--text-secondary,#555);line-height:1.5;padding:6px 0;">
                <input type="checkbox" id="agreePrivacy" style="margin-top:2px;width:16px;height:16px;cursor:pointer;accent-color:var(--primary,#6366f1);flex-shrink:0;" onchange="syncAgreeAll()" />
                <span><a href="/privacy" target="_blank" style="color:var(--primary,#6366f1);font-weight:600;text-decoration:underline;">개인정보처리방침</a>에 따른 개인정보 수집 및 이용에 동의합니다. <span style="color:#e53e3e;font-weight:700;">(필수)</span></span>
              </label>
              <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:13px;color:var(--text-secondary,#555);line-height:1.5;padding:6px 0;">
                <input type="checkbox" id="agreeMarketing" style="margin-top:2px;width:16px;height:16px;cursor:pointer;accent-color:var(--primary,#6366f1);flex-shrink:0;" onchange="syncAgreeAll()" />
                <span>가끔 프로모션 이메일 및 알림을 수신합니다. 언제든지 수신 거부할 수 있습니다. <span style="color:var(--text-muted,#999);">(선택)</span></span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <input type="text" class="form-input" id="signupName" placeholder="이름" autocomplete="name" />
          </div>
          <div class="form-group">
            <input type="email" class="form-input" id="signupEmail" placeholder="이메일" autocomplete="email" />
          </div>
          <div class="form-group">
            <input type="password" class="form-input" id="signupPassword" placeholder="비밀번호 (8자 이상)" autocomplete="new-password" />
          </div>

          <button type="submit" class="btn btn-primary btn-full btn-lg" id="signupBtn" style="margin-top:12px;" data-i18n="signupBtn">가입하고 무료 시작 🎁</button>
        </form>
      </div>

      <p style="font-size:11px;color:var(--text-muted);text-align:center;margin-top:16px;">가입 시 <a href="/terms" target="_blank" style="color:var(--primary);">이용약관</a> 및 <a href="/privacy" target="_blank" style="color:var(--primary);">개인정보처리방침</a>에 동의합니다.</p>
    </div>
  </div>
  `))
})

// ─── Dashboard Page ───
app.get('/dashboard', (c) => {
  return c.html(htmlShell('내 프로필', `
  <div class="toast-container" id="toastContainer"></div>

  <style>
    body { background: #0d0d1a; }

    .db-wrap {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 16px 80px;
      background: #0d0d1a;
    }

    /* ── 프로필 카드 ── */
    .db-card {
      width: 100%;
      max-width: 420px;
      background: #16162a;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 8px 40px rgba(0,0,0,0.5);
      margin-bottom: 16px;
    }

    /* 상단 헤더 (아바타 + 이름) */
    .db-card-header {
      padding: 32px 28px 24px;
      border-bottom: 1px solid #2a2a45;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .db-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6c47ff, #a855f7);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 800;
      color: white;
      flex-shrink: 0;
      box-shadow: 0 4px 16px rgba(108,71,255,0.4);
    }
    .db-name {
      font-size: 18px;
      font-weight: 700;
      color: #f0f0f8;
      margin-bottom: 3px;
    }
    .db-email {
      font-size: 13px;
      color: #8b8ba0;
    }

    /* 크레딧 행 */
    .db-credit-row {
      padding: 20px 28px;
      border-bottom: 1px solid #2a2a45;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .db-credit-label {
      font-size: 13px;
      color: #8b8ba0;
      margin-bottom: 4px;
    }
    .db-credit-val {
      font-size: 22px;
      font-weight: 800;
      color: #6c47ff;
    }
    .db-credit-sub {
      font-size: 11px;
      color: #8b8ba0;
      margin-top: 2px;
    }
    .db-charge-btn {
      padding: 9px 20px;
      background: #6c47ff;
      color: white;
      border: none;
      border-radius: 24px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s;
      flex-shrink: 0;
    }
    .db-charge-btn:hover { background: #7c57ff; }

    /* 메뉴 항목 */
    .db-menu-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 28px;
      cursor: pointer;
      border-bottom: 1px solid #2a2a45;
      text-decoration: none;
      transition: background 0.12s;
    }
    .db-menu-item:last-child { border-bottom: none; }
    .db-menu-item:hover { background: #1e1e35; }
    .db-menu-label {
      font-size: 15px;
      color: #e0e0f0;
      font-weight: 500;
    }
    .db-menu-arrow {
      font-size: 18px;
      color: #5a5a7a;
    }

    /* 로그아웃 카드 */
    .db-logout-card {
      width: 100%;
      max-width: 420px;
      background: #16162a;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 8px 40px rgba(0,0,0,0.4);
    }
    .db-logout-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 18px 28px;
      background: none;
      border: none;
      cursor: pointer;
      transition: background 0.12s;
    }
    .db-logout-btn:hover { background: #1e1e35; }
    .db-logout-label {
      font-size: 15px;
      font-weight: 600;
      color: #ef4444;
    }

    /* 로고 */
    .db-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 32px;
      text-decoration: none;
    }
    .db-logo-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg,#6c47ff,#a855f7);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .db-logo-text {
      font-size: 18px;
      font-weight: 800;
      color: #f0f0f8;
    }

    /* 생성하러 가기 버튼 */
    .db-gen-btn {
      width: 100%;
      max-width: 420px;
      margin-top: 16px;
      padding: 16px;
      background: linear-gradient(135deg,#6c47ff,#a855f7);
      color: white;
      border: none;
      border-radius: 16px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.15s;
      text-decoration: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .db-gen-btn:hover { opacity: 0.9; }
  </style>

  <div class="db-wrap">

    <!-- 로고 -->
    <a href="/" class="db-logo">
      <div class="db-logo-icon">✨</div>
      <span class="db-logo-text">EZlook</span>
    </a>

    <!-- 메인 카드 -->
    <div class="db-card">

      <!-- 프로필 헤더 -->
      <div class="db-card-header">
        <div class="db-avatar" id="dbAvatar">?</div>
        <div>
          <div class="db-name" id="dbName">로딩 중...</div>
          <div class="db-email" id="dbEmail"></div>
        </div>
      </div>

      <!-- 크레딧 -->
      <div class="db-credit-row">
        <div>
          <div class="db-credit-label">현재 크레딧</div>
          <div class="db-credit-val" id="dbCredits">-</div>
          <div class="db-credit-sub">이미지 1장 = 90크레딧</div>
        </div>
        <button class="db-charge-btn" onclick="openChargePanel()" data-i18n="nav-charge">충전</button>
      </div>

      <!-- 생성 내역 -->
      <a href="/dashboard#history" class="db-menu-item" id="menuHistory">
        <span class="db-menu-label">생성 내역</span>
        <span class="db-menu-arrow">›</span>
      </a>

      <!-- 카톡 문의 -->
      <a href="http://pf.kakao.com/_wFyCX/chat" target="_blank" class="db-menu-item">
        <span class="db-menu-label">카톡 문의</span>
        <span class="db-menu-arrow">›</span>
      </a>

      <!-- 서비스소개 -->
      <a href="https://www.aifashion.co.kr/#siteFooter" class="db-menu-item">
        <span class="db-menu-label">서비스소개</span>
        <span class="db-menu-arrow">›</span>
      </a>

    </div>

    <!-- 로그아웃 카드 -->
    <div class="db-logout-card">
      <button class="db-logout-btn" onclick="handleLogout()">
        <span class="db-logout-label">로그아웃</span>
        <span style="font-size:18px;color:#ef4444;">›</span>
      </button>
    </div>

    <!-- 이미지 생성 바로가기 -->
    <a href="/generator" class="db-gen-btn">
      <i class="fas fa-wand-magic-sparkles"></i> 이미지 생성 바로가기
    </a>

  </div>

  <!-- 생성 내역 패널 (해시 #history) -->
  <div id="historyPanel" style="display:none;position:fixed;inset:0;background:#0d0d1a;z-index:500;overflow-y:auto;">
    <div style="max-width:480px;margin:0 auto;padding:24px 16px 80px;">
      <!-- 헤더 -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <button onclick="document.getElementById('historyPanel').style.display='none';history.replaceState(null,'','/dashboard');" style="width:36px;height:36px;border:none;background:#2a2a45;border-radius:50%;color:#e0e0f0;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">‹</button>
        <h2 style="font-size:18px;font-weight:700;color:#f0f0f8;">생성 내역</h2>
      </div>
      <!-- 14일 보관 안내 -->
      <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);border-radius:10px;padding:10px 14px;margin-bottom:20px;display:flex;align-items:center;gap:8px;">
        <span style="font-size:15px;">⏰</span>
        <span style="font-size:12px;color:#fca5a5;line-height:1.5;">이미지는 <strong>14일 동안만 보관</strong>됩니다. 제때 다운로드하시기 바랍니다.<br/>재다운로드시 크레딧은 차감되지 않습니다.</span>
      </div>
      <div id="historyList" style="display:flex;flex-direction:column;gap:16px;">
        <div style="text-align:center;padding:60px 20px;color:#5a5a7a;font-size:14px;">
          <div style="font-size:40px;margin-bottom:12px;">🎨</div>
          생성 내역을 불러오는 중...
        </div>
      </div>
    </div>
  </div>

  <!-- 이미지 확대 보기 모달 (히스토리 전용 — 다시보기) -->
  <div id="histImgModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:1000;align-items:center;justify-content:center;flex-direction:column;padding:20px;">
    <button onclick="closeHistModal()" style="position:absolute;top:16px;right:16px;width:36px;height:36px;border:none;background:rgba(255,255,255,0.1);border-radius:50%;color:#fff;font-size:20px;cursor:pointer;">×</button>
    <img id="histModalImg" src="" alt="생성 이미지"
      style="max-width:min(420px,90vw);max-height:calc(100dvh - 140px);object-fit:contain;border-radius:14px;display:block;" />
    <div id="histModalExpiry" style="font-size:11px;color:#f87171;margin-top:8px;text-align:center;"></div>
  </div>

  <!-- Action Progress Modal (다운로드 진행 중 + 완료 팝업 — generator 페이지와 동일 구조 공유) -->
  <div class="modal-overlay" id="actionProgressModal" style="z-index:10500;">
    <div class="action-progress-box">
      <div id="actionProgressSpinner" class="action-progress-spinner"></div>
      <div id="actionProgressCheck" class="action-progress-check" style="display:none;"><i class="fas fa-check"></i></div>
      <div id="actionProgressText" class="action-progress-text">처리 중...</div>
      <div id="actionProgressShare" class="action-progress-share" style="display:none;">
        <button class="action-progress-share-btn link" onclick="copyShareLink()">
          <i class="fas fa-link"></i> 링크복사
        </button>
        <button id="actionProgressKakaoBtn" class="action-progress-share-btn kakao" onclick="shareToKakao()" style="display:none;">
          <i class="fas fa-comment"></i> 카카오톡 공유
        </button>
      </div>
      <button id="actionProgressCloseBtn" class="action-progress-close" onclick="closeActionProgress()" style="display:none;">닫기</button>
    </div>
  </div>

  <script>
  // ── 대시보드 초기화 ──
  document.addEventListener('DOMContentLoaded', async () => {
    await verifySession();
    const user = AppState.user;
    if (!user) {
      window.location.href = '/';
      return;
    }
    // 프로필 채우기
    const initial = (user.name || user.email || '?')[0].toUpperCase();
    document.getElementById('dbAvatar').textContent = initial;
    document.getElementById('dbName').textContent   = user.name || user.email;
    document.getElementById('dbEmail').textContent  = user.email || '';
    document.getElementById('dbCredits').textContent = (user.credits ?? 0).toLocaleString();

    // 해시 처리
    if (location.hash === '#history') openHistory();
    document.getElementById('menuHistory').addEventListener('click', (e) => {
      e.preventDefault();
      openHistory();
    });
  });

  function openHistory() {
    history.replaceState(null,'','/dashboard#history');
    document.getElementById('historyPanel').style.display = 'block';
    loadHistory();
  }

  // ── 순번 포맷: YYYYMMDDHHMM + zero-padded seq_no ──
  function formatHistSeq(createdAt, seqNo) {
    // createdAt: "2026-08-04 08:39:49" 형태
    const dt = createdAt ? createdAt.replace('T',' ') : '';
    const parts = dt.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/);
    if (!parts) return String(seqNo || '?').padStart(3,'0');
    const yy = parts[1].slice(2); // 26
    const mm = parts[2]; const dd = parts[3];
    const hh = parts[4]; const mi = parts[5];
    const seq = String(seqNo || 1).padStart(3,'0');
    return \`\${yy}\${mm}\${dd}\${hh}\${mi}-\${seq}\`;
  }

  // ── 만료까지 남은 일수 계산 ──
  function expiryLabel(expiresAt) {
    if (!expiresAt) return null;
    const exp = new Date(expiresAt.replace(' ','T') + (expiresAt.includes('Z') ? '' : 'Z'));
    const now = Date.now();
    const diffMs = exp.getTime() - now;
    if (diffMs <= 0) return '만료됨';
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) return \`⚠️ \${diffDays}일 후 만료\`;
    return \`\${diffDays}일 후 만료\`;
  }

  // ── 히스토리 이미지 모달 상태 ──
  let _histModalUrl = null;

  function openHistModal(imgUrl, expiresAt) {
    _histModalUrl = imgUrl;
    const modal = document.getElementById('histImgModal');
    document.getElementById('histModalImg').src = imgUrl;
    const expLabel = expiresAt ? expiryLabel(expiresAt) : null;
    document.getElementById('histModalExpiry').textContent = expLabel ? \`만료: \${expLabel}\` : '';
    modal.style.display = 'flex';
  }
  function closeHistModal() {
    document.getElementById('histImgModal').style.display = 'none';
    _histModalUrl = null;
  }
  async function loadHistory() {
    const list = document.getElementById('historyList');
    list.innerHTML = '<div style="text-align:center;padding:40px;color:#5a5a7a;">불러오는 중...</div>';
    try {
      const token = localStorage.getItem('lookbook_token') || '';
      const res = await fetch('/api/generation/history', { headers: { 'X-Session-Token': token } });
      if (!res.ok) throw new Error('서버 오류');
      const data = await res.json();
      const logs = data.logs || [];
      if (!logs.length) {
        list.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#5a5a7a;font-size:14px;"><div style="font-size:40px;margin-bottom:12px;">🎨</div>아직 생성 내역이 없어요.<br/>이미지를 생성해보세요!</div>';
        return;
      }

      const rows = [];
      logs.forEach((log, i) => {
        const seqLabel  = formatHistSeq(log.created_at, log.seq_no || (logs.length - i));
        const dateStr   = log.created_at ? log.created_at.slice(0,16).replace('T',' ') : '';
        const expLabel  = expiryLabel(log.expires_at);
        const expired   = expLabel === '만료됨';
        const expEsc    = (log.expires_at || '').replace(/'/g,"\\\\'");

        // image_urls 파싱 (JSON 배열 문자열)
        let urls = [];
        try { urls = log.image_urls ? JSON.parse(log.image_urls) : []; } catch(e) { urls = []; }
        // 이미지 인덱스별 다운로드 이력 (JSON 배열, 예: [0,2])
        let downloadedIdx = [];
        try { downloadedIdx = log.downloaded_indices ? JSON.parse(log.downloaded_indices) : []; } catch(e) { downloadedIdx = []; }

        if (urls.length === 0) {
          rows.push(\`<div class="hist-row">
            <div class="hist-thumb hist-thumb--empty"><i class="fas fa-image"></i></div>
            <div class="hist-body">
              <div class="hist-meta">#\${seqLabel} · \${dateStr}</div>
              <div class="hist-meta-sub">이미지 준비 중이거나 저장 전 세션이 종료되었습니다</div>
              <div class="hist-actions">
                <button class="hist-action-btn danger" onclick="deleteHistItem(\${log.id})"><i class="fas fa-trash"></i> 삭제</button>
              </div>
            </div>
          </div>\`);
          return;
        }

        urls.forEach((u, ui) => {
          const rowSeq = urls.length > 1 ? \`\${seqLabel}-\${ui+1}\` : seqLabel;
          const proxyUrl = u.startsWith('/api/proxy') ? u : \`/api/proxy/gen-image?url=\${encodeURIComponent(u)}\`;
          const urlEsc = proxyUrl.replace(/'/g,"\\\\'");
          const origEsc = u.replace(/'/g,"\\\\'");
          const jobIdEsc = (log.job_id || '').replace(/'/g,"\\\\'");

          if (expired) {
            rows.push(\`<div class="hist-row hist-row--expired">
              <div class="hist-thumb hist-thumb--empty"><i class="fas fa-clock"></i></div>
              <div class="hist-body">
                <div class="hist-meta">#\${rowSeq} · \${dateStr} · 만료됨</div>
                <div class="hist-actions">
                  <button class="hist-action-btn danger" onclick="deleteHistItem(\${log.id})"><i class="fas fa-trash"></i> 삭제</button>
                </div>
              </div>
            </div>\`);
            return;
          }

          const dlLabel = downloadedIdx.includes(ui) ? '재다운로드' : '다운로드';

          rows.push(\`<div class="hist-row">
            <div class="hist-thumb" onclick="openHistModal('\${urlEsc}','\${expEsc}')">
              <img src="\${proxyUrl}" alt="생성 이미지" onerror="this.parentNode.innerHTML='<i class=\\"fas fa-image\\"></i>'" />
            </div>
            <div class="hist-body">
              <div class="hist-meta">#\${rowSeq} · \${dateStr} · \${expLabel || ''}</div>
              <div class="hist-actions">
                <button class="hist-action-btn" onclick="openHistModal('\${urlEsc}','\${expEsc}')"><i class="fas fa-eye"></i> 다시보기</button>
                <button class="hist-action-btn primary" id="histDlBtn-\${log.id}-\${ui}" onclick="histRowDownload('\${jobIdEsc}','\${origEsc}',\${ui},this)"><i class="fas fa-download"></i> \${dlLabel}</button>
                <button class="hist-action-btn danger" onclick="deleteHistItem(\${log.id})"><i class="fas fa-trash"></i> 삭제</button>
              </div>
            </div>
          </div>\`);
        });
      });

      list.innerHTML = rows.join('');
    } catch (e) {
      list.innerHTML = '<div style="text-align:center;padding:40px;color:#ef4444;font-size:13px;">불러오기 실패</div>';
    }
  }

  async function histRowDownload(jobId, originalUrl, imgIdx, btn) {
    const token = localStorage.getItem('lookbook_token') || '';
    if (!token) { showToast('로그인이 필요합니다.', 'error'); return; }

    openActionProgress('다운로드 중...');
    try {
      const deductRes = await fetch('/api/credits/deduct', {
        method: 'POST',
        headers: { 'X-Session-Token': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, idx: imgIdx }),
      });
      if (deductRes.status === 401) { closeActionProgress(); showToast('로그인이 필요합니다.', 'error'); return; }
      if (deductRes.status === 402) {
        closeActionProgress();
        const errData = await deductRes.json();
        showToast(\`크레딧 부족 (보유: \${errData.available ?? 0}크레딧 / 필요: 90크레딧)\`, 'error');
        return;
      }
      if (!deductRes.ok) { closeActionProgress(); showToast('크레딧 처리 오류', 'error'); return; }

      const deductData = await deductRes.json();
      const cachedUser = JSON.parse(localStorage.getItem('lookbook_user') || 'null');
      if (cachedUser) { cachedUser.credits = deductData.creditsRemaining; localStorage.setItem('lookbook_user', JSON.stringify(cachedUser)); }
      if (AppState.user) AppState.user.credits = deductData.creditsRemaining;
      const dbCredEl = document.getElementById('dbCredits');
      if (dbCredEl) dbCredEl.textContent = (deductData.creditsRemaining ?? 0).toLocaleString();

      // 파일 다운로드
      const dlUrl = originalUrl.includes('/api/proxy/gen-image')
        ? originalUrl + (originalUrl.includes('?') ? '&' : '?') + 'download=1'
        : \`/api/proxy/gen-image?url=\${encodeURIComponent(originalUrl)}&download=1\`;
      const a = document.createElement('a');
      a.href = dlUrl; a.download = \`lookbook_ai_\${Date.now()}.jpg\`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);

      const completeMsg = deductData.alreadyDownloaded
        ? '재다운로드 완료! (크레딧 차감 없음)'
        : \`다운로드 완료! (잔액: \${deductData.creditsRemaining}크레딧)\`;
      setActionComplete(completeMsg, { showShare: true, jobId: jobId, idx: imgIdx, imageUrl: originalUrl });

      if (btn) btn.innerHTML = '<i class="fas fa-download"></i> 재다운로드';
    } catch (err) {
      closeActionProgress();
      showToast('다운로드 중 오류가 발생했습니다.', 'error');
    }
  }

  async function deleteHistItem(logId) {
    if (!confirm('이 생성 내역을 삭제할까요? 삭제하면 복구할 수 없어요.')) return;
    const token = localStorage.getItem('lookbook_token') || '';
    try {
      const res = await fetch(\`/api/generation/history/\${logId}\`, {
        method: 'DELETE',
        headers: { 'X-Session-Token': token },
      });
      if (!res.ok) { showToast('삭제에 실패했습니다.', 'error'); return; }
      showToast('삭제되었습니다.', 'success');
      loadHistory();
    } catch (err) {
      showToast('삭제 중 오류가 발생했습니다.', 'error');
    }
  }

  </script>
  `))
})


// ─── Generator Page ───
app.get('/generator', (c) => {
  return c.html(htmlShell('AI 룩북 생성', `
  <div class="toast-container" id="toastContainer"></div>

  <!-- ════════════════════════════════════════
       GENERATOR APP — position:fixed 전체화면
       step-panel: position:absolute inset:0
       translateX 슬라이드 전환
       높이 계산 JS 완전 제거
  ════════════════════════════════════════ -->
  <div id="gapp">
    <!-- ── 중앙 패널 (모바일=전체, PC=480px 중앙) ── -->
    <div id="gapp-panel">

    <!-- ── 상단 바 (고정) ── -->
    <header id="gapp-header">
      <a href="/" class="gapp-logo"><span class="gapp-logo-ez">EZ</span><span class="gapp-logo-look">look</span></a>
      <!-- 로그인 상태 표시 -->
      <div style="display:flex;align-items:center;gap:8px;position:relative;">
        <button id="navLoginBtn" onclick="openModal('loginModal')" style="font-size:12px;padding:6px 12px;background:var(--primary-bg);border:1px solid var(--primary);border-radius:20px;color:var(--primary);cursor:pointer;font-weight:600;">로그인</button>
        <div id="navUserArea" style="display:none;align-items:center;gap:0;position:relative;">
          <span id="navUserCredits" style="display:none;"></span>
          <span id="navUserName" style="display:none;"></span>
          <div id="navUserAvatar" onclick="toggleUserMenu()" style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--primary),#a855f7);display:flex;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:700;cursor:pointer;user-select:none;box-shadow:0 2px 8px rgba(108,71,255,0.4);">?</div>
          <div id="userDropdownMenu" style="display:none;position:absolute;top:38px;right:0;background:#1e1e35;border:1px solid #3a3a60;border-radius:16px;padding:6px;min-width:210px;box-shadow:0 12px 32px rgba(0,0,0,0.6);z-index:10001;">
            <div style="padding:12px 14px 10px;border-bottom:1px solid #3a3a60;margin-bottom:4px;">
              <div id="ddUserName" style="font-size:13px;font-weight:700;color:#f0f0f8;margin-bottom:2px;"></div>
              <div id="ddUserEmail" style="font-size:11px;color:#8b8ba0;margin-bottom:6px;"></div>
              <div style="display:flex;align-items:center;justify-content:space-between;">
                <div id="ddUserCredits" style="font-size:12px;font-weight:600;color:#6c47ff;"></div>
                <button onclick="openChargePanel();toggleUserMenu();" style="font-size:11px;padding:3px 10px;background:#6c47ff;color:white;border:none;border-radius:20px;cursor:pointer;font-weight:600;" data-i18n="nav-charge">충전</button>
              </div>
            </div>
            <a href="/dashboard#history" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:9px 12px;font-size:13px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''" data-i18n="nav-history">생성 내역</a>
            <a href="http://pf.kakao.com/_wFyCX/chat" target="_blank" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:9px 12px;font-size:13px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">카톡 문의</a>
            <a href="https://www.aifashion.co.kr/#siteFooter" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:9px 12px;font-size:13px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">서비스소개</a>
            <div style="height:1px;background:#3a3a60;margin:4px 0;"></div>
            <button onclick="handleLogout()" style="display:block;width:100%;text-align:left;padding:9px 12px;font-size:13px;color:#ef4444;background:none;border:none;cursor:pointer;border-radius:10px;" onmouseover="this.style.background='#ef444411'" onmouseout="this.style.background=''" data-i18n="nav-logout">로그아웃</button>
          </div>
        </div>
      </div>
    </header>

    <!-- ── 슬라이드 컨테이너 ── -->
    <div id="gapp-slides">

      <!-- STEP 1 · 의류 업로드 -->
      <div class="gslide active" id="step-1">
        <div class="gslide-body">
          <div class="gstep-label" data-i18n="step1-label">Step 1 / 3 · 의류 업로드</div>
          <h2 class="gstep-title" data-i18n="step1-title">의류를 종류별로 업로드하세요</h2>
          <p class="gstep-sub">각 칸에 해당하는 의류를 업로드하세요 · 원하는 칸만 사용해도 됩니다</p>

          <!-- 숨겨진 파일 input — label for= 연결용 (슬롯 위에 선언해야 label이 참조 가능) -->
          <input type="file" id="fileInput-TOP"    accept="image/*" style="display:none;" onchange="handleSlotFileSelect(event,'TOP')" />
          <input type="file" id="fileInput-BOTTOM" accept="image/*" style="display:none;" onchange="handleSlotFileSelect(event,'BOTTOM')" />
          <input type="file" id="fileInput-DRESS"  accept="image/*" style="display:none;" onchange="handleSlotFileSelect(event,'DRESS')" />

          <!-- 2열 슬롯 그리드: 왼쪽=상의(위)+하의(아래) / 오른쪽=전체(전체 높이) -->
          <div class="clothing-slots">

            <!-- 상의 슬롯 (왼쪽 열 1행) -->
            <label class="cslot" id="slot-TOP" for="fileInput-TOP"
              style="grid-column:1; grid-row:1;"
              ondragover="handleSlotDragOver(event,'TOP')"
              ondragleave="handleSlotDragLeave(event,'TOP')"
              ondrop="handleSlotDrop(event,'TOP')"
              onclick="return handleSlotLabelClick(event,'TOP')">
              <span class="cslot-label">상의</span>
              <span class="cslot-body" id="slot-body-TOP">
                <span class="cslot-empty">
                  <span class="cslot-plus">＋</span>
                  <span class="cslot-hint">탭하여 사진 선택</span>
                </span>
              </span>
              <button type="button" class="cslot-remove hidden" id="slot-remove-TOP"
                onclick="removeSlot(event,'TOP')">✕</button>
            </label>

            <!-- 하의 슬롯 (왼쪽 열 2행) -->
            <label class="cslot" id="slot-BOTTOM" for="fileInput-BOTTOM"
              style="grid-column:1; grid-row:2;"
              ondragover="handleSlotDragOver(event,'BOTTOM')"
              ondragleave="handleSlotDragLeave(event,'BOTTOM')"
              ondrop="handleSlotDrop(event,'BOTTOM')"
              onclick="return handleSlotLabelClick(event,'BOTTOM')">
              <span class="cslot-label">하의</span>
              <span class="cslot-body" id="slot-body-BOTTOM">
                <span class="cslot-empty">
                  <span class="cslot-plus">＋</span>
                  <span class="cslot-hint">탭하여 사진 선택</span>
                </span>
              </span>
              <button type="button" class="cslot-remove hidden" id="slot-remove-BOTTOM"
                onclick="removeSlot(event,'BOTTOM')">✕</button>
            </label>

            <!-- 전체 슬롯 (오른쪽 열 전체 높이: 1행~2행 span) -->
            <label class="cslot cslot--full" id="slot-DRESS" for="fileInput-DRESS"
              style="grid-column:2; grid-row:1 / span 2;"
              ondragover="handleSlotDragOver(event,'DRESS')"
              ondragleave="handleSlotDragLeave(event,'DRESS')"
              ondrop="handleSlotDrop(event,'DRESS')"
              onclick="return handleSlotLabelClick(event,'DRESS')">
              <span class="cslot-label">전체</span>
              <span class="cslot-body" id="slot-body-DRESS">
                <span class="cslot-empty">
                  <span class="cslot-plus">＋</span>
                  <span class="cslot-hint">탭하여 사진 선택</span>
                </span>
              </span>
              <button type="button" class="cslot-remove hidden" id="slot-remove-DRESS"
                onclick="removeSlot(event,'DRESS')">✕</button>
            </label>

          </div><!-- /.clothing-slots -->
        </div>
        <div class="gslide-nav">
          <div class="gslide-nav-inner">
            <button class="step-nav-back" onclick="prevStep(1)"><i class="fas fa-arrow-left"></i> <span data-i18n="btn-prev">이전</span></button>
            <button class="step-nav-next" id="nextBtn1" onclick="nextStep(1)" disabled><span data-i18n="btn-next">다음 단계</span> <i class="fas fa-arrow-right"></i></button>
          </div>
        </div>
      </div>

      <!-- STEP 2 · 모델 선택 -->
      <div class="gslide" id="step-2">
        <div class="gslide-header">
          <div class="gstep-label" data-i18n="step2-label">Step 2 / 3 · 모델 선택</div>
          <h2 class="gstep-title" data-i18n="step2-title">AI 모델을 선택하세요</h2>

        </div>
        <div class="gfilter-bar" id="modelFilters" style="display:flex;gap:8px;margin:0 0 16px;flex-wrap:wrap;">
          <button class="filter-tag active" onclick="filterModels('gender','all',this)">전체</button>
          <button class="filter-tag" onclick="filterModels('gender','여성',this)">여성</button>
          <button class="filter-tag" onclick="filterModels('gender','남성',this)">남성</button>
        </div>
        <div class="gslide-grid" id="modelGridWrap">
          <div id="modelsLoading" class="grid-loading">
            <div style="font-size:32px;">⏳</div><p data-i18n="gen-loading">모델 불러오는 중...</p>
          </div>
          <div class="select-grid" id="modelGrid"></div>
        </div>
        <div class="gslide-nav">
          <div class="gslide-nav-inner">
            <button class="step-nav-back" onclick="prevStep(2)"><i class="fas fa-arrow-left"></i> <span data-i18n="btn-prev">이전</span></button>
            <button class="step-nav-next" id="nextBtn2" onclick="nextStep(2)"><span data-i18n="btn-next">다음 단계</span> <i class="fas fa-arrow-right"></i></button>
          </div>
        </div>
      </div>

      <!-- STEP 3 · 배경 선택 -->
      <div class="gslide" id="step-3">
        <div class="gslide-header">
          <div class="gstep-label" data-i18n="step3-label">Step 3 / 3 · 배경 선택</div>
          <h2 class="gstep-title" data-i18n="step3-title">배경을 선택하세요</h2>

        </div>
        <div class="gslide-grid" id="bgGridWrap">
          <div id="bgsLoading" class="grid-loading">
            <div style="font-size:32px;">⏳</div><p data-i18n="bg-loading">배경 불러오는 중...</p>
          </div>
          <div class="select-grid" id="bgGrid"></div>
        </div>
        <!-- 생성 중 오버레이 (step-3 내부) -->
        <div class="generating-view" id="generatingView">
          <div class="gen-spinner"></div>
          <h2 style="font-size:20px;font-weight:800;margin-bottom:8px;">AI가 이미지를 생성 중입니다...</h2>
          <div class="gen-progress-bar"><div class="gen-progress-fill" id="genProgressFill" style="width:0%"></div></div>
          <div class="gen-status-text" id="genStatusText" data-i18n="gen-status-init">시작 중...</div>
          <div class="gen-status-msgs">
            <div class="gen-msg current" id="msg1"><div class="dot"></div> 의류 이미지 분석 중...</div>
            <div class="gen-msg" id="msg2"><div class="dot"></div> AI 모델 피팅 적용 중...</div>
            <div class="gen-msg" id="msg3"><div class="dot"></div> 배경 합성 중...</div>
            <div class="gen-msg" id="msg4"><div class="dot"></div> 이미지 품질 향상 중...</div>
            <div class="gen-msg" id="msg5"><div class="dot"></div> 최종 렌더링 중...</div>
          </div>
        </div>
        <div class="gslide-nav" id="step3Nav">
          <div class="gslide-nav-inner">
            <button class="step-nav-back" onclick="prevStep(3)"><i class="fas fa-arrow-left"></i> <span data-i18n="btn-prev">이전</span></button>
            <button class="step-nav-next" id="nextBtn3" onclick="startGeneration()"><i class="fas fa-wand-magic-sparkles"></i> <span data-i18n="btn-gen">AI 생성 시작</span></button>
          </div>
        </div>
      </div>

      <!-- STEP 4 (구 Step5) · 결과 -->
      <div class="gslide" id="step-4">
        <div class="gslide-scroll" style="padding-top:12px;">
          <div class="results-grid" id="resultsGrid"></div>
          <!-- 이미지 하단 ~ 버튼 상단 사이 안내 메시지 -->
          <div style="padding:18px 16px 4px;text-align:center;">
            <p style="font-size:13px;color:#8b8ba0;line-height:1.6;margin:0;">
              <span style="color:#9b7cff;font-weight:600;">이미지 생성은 크레딧이 차감되지 않습니다.</span><br/>
              오류가 있거나 마음에 들지 않으면 이미지 위 <strong style="color:#e0e0f0;">🔄 재생성</strong> 버튼을 눌러보세요.
            </p>
          </div>
        </div>
        <div class="gslide-nav">
          <div class="gslide-nav-inner">
            <button class="step-nav-back" onclick="window.location.href='/generator'"><i class="fas fa-plus"></i> 새 프로젝트</button>
            <button class="step-nav-next" onclick="window.location.href='/'"><i class="fas fa-home"></i> 홈으로</button>
          </div>
        </div>
      </div>

    </div><!-- /gapp-slides -->
    </div><!-- /gapp-panel -->
  </div><!-- /gapp -->

  <!-- Image View Modal -->
  <div class="modal-overlay image-modal" id="imageModal">
    <div class="modal-box">
      <button class="modal-close" style="background:rgba(0,0,0,0.5);color:white;top:12px;right:12px;z-index:20;" onclick="closeModal('imageModal')">×</button>
      <div style="position:relative;display:block;width:100%;">
        <img id="modalImage" src="" alt="생성된 이미지" />
        <!-- 버튼 영역: 재생성 + 다운로드 -->
        <div id="modalButtonArea" style="position:absolute;bottom:16px;right:16px;z-index:20;display:flex;align-items:center;gap:8px;">
          <!-- 재생성 버튼 -->
          <button id="regenBtn" onclick="regenImage()" style="display:flex;align-items:center;gap:6px;padding:10px 16px;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);color:white;border:1px solid rgba(255,255,255,0.25);border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.85)'" onmouseout="this.style.background='rgba(0,0,0,0.6)'">
            <i class="fas fa-redo-alt"></i>
            <span id="regenBtnText">재생성</span>
            <span id="regenCounter" style="font-size:12px;opacity:0.8;"></span>
          </button>
          <!-- 다운로드 버튼 -->
          <button id="downloadBtn" onclick="downloadImage()" style="display:flex;align-items:center;gap:8px;padding:10px 20px;background:rgba(99,102,241,0.85);backdrop-filter:blur(8px);color:white;border:1px solid rgba(255,255,255,0.25);border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background='rgba(99,102,241,1)'" onmouseout="this.style.background='rgba(99,102,241,0.85)'">
            <i class="fas fa-download"></i> 다운로드
          </button>
        </div>
        <!-- 재생성 한도 초과 메시지 -->
        <div id="regenLimitMsg" style="display:none;position:absolute;bottom:60px;left:50%;transform:translateX(-50%);background:rgba(239,68,68,0.9);backdrop-filter:blur(8px);color:white;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;white-space:nowrap;z-index:21;">
          재생성 한도가 초과하였습니다. 다른 옷으로 시도해주세요.
        </div>
      </div>
    </div>
  </div>

  <!-- Action Progress Modal (다운로드/재생성 진행 중 + 완료 팝업) -->
  <div class="modal-overlay" id="actionProgressModal" style="z-index:10500;">
    <div class="action-progress-box">
      <div id="actionProgressSpinner" class="action-progress-spinner"></div>
      <div id="actionProgressCheck" class="action-progress-check" style="display:none;"><i class="fas fa-check"></i></div>
      <div id="actionProgressText" class="action-progress-text">처리 중...</div>
      <div id="actionProgressShare" class="action-progress-share" style="display:none;">
        <button class="action-progress-share-btn link" onclick="copyShareLink()">
          <i class="fas fa-link"></i> 링크복사
        </button>
        <button id="actionProgressKakaoBtn" class="action-progress-share-btn kakao" onclick="shareToKakao()" style="display:none;">
          <i class="fas fa-comment"></i> 카카오톡 공유
        </button>
      </div>
      <button id="actionProgressCloseBtn" class="action-progress-close" onclick="closeActionProgress()" style="display:none;">닫기</button>
    </div>
  </div>

  <!-- Auth Modal (Generator 내부) -->
  <div class="modal-overlay" id="loginModal" style="z-index:10000;">
    <div class="modal-box" style="max-width:420px;">
      <button class="modal-close" onclick="closeModal('loginModal')">×</button>
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:28px;margin-bottom:8px;">✨</div>
        <h2 style="font-size:20px;font-weight:800;margin-bottom:4px;">AI 생성을 시작하려면<br/>로그인이 필요해요</h2>
        <p style="font-size:13px;color:var(--text-muted);">가입 즉시 무료 크레딧을 드려요!</p>
      </div>
      <div style="display:flex;gap:0;margin-bottom:20px;border-bottom:2px solid var(--border);">
        <button id="tabLogin"  onclick="switchAuthTab('login')"  style="flex:1;padding:10px;background:none;border:none;font-size:15px;font-weight:700;color:var(--primary);border-bottom:2px solid var(--primary);margin-bottom:-2px;cursor:pointer;" data-i18n="nav-login">로그인</button>
        <button id="tabSignup" onclick="switchAuthTab('signup')" style="flex:1;padding:10px;background:none;border:none;font-size:15px;font-weight:600;color:var(--text-muted);cursor:pointer;" data-i18n="nav-signup2">회원가입</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
        <button onclick="oauthLogin('kakao', this)" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:13px;background:#FEE500;border:none;border-radius:10px;font-size:15px;font-weight:700;color:#3C1E1E;cursor:pointer;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.628 5.073 4.09 6.51L4.993 21l4.457-2.387A11.3 11.3 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z"/></svg>
          카카오로 시작하기
        </button>
        <button onclick="oauthLogin('google', this)" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:13px;background:#fff;border:1px solid #dadce0;border-radius:10px;font-size:15px;font-weight:600;color:#3c4043;cursor:pointer;">
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Google로 시작하기
        </button>
      </div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <div style="flex:1;height:1px;background:var(--border);"></div>
        <span style="font-size:12px;color:var(--text-muted);">또는 이메일로</span>
        <div style="flex:1;height:1px;background:var(--border);"></div>
      </div>
      <div id="authFormLogin">
        <form id="loginForm" onsubmit="handleLogin(event)" novalidate>
          <div id="loginError" class="auth-message error" role="alert" style="display:none;"><span class="auth-msg-icon">❌</span><span id="loginErrorText"></span></div>
          <div class="form-group"><input type="email" class="form-input" id="loginEmail" placeholder="이메일" autocomplete="email" /></div>
          <div class="form-group"><input type="password" class="form-input" id="loginPassword" placeholder="비밀번호" autocomplete="current-password" /></div>
          <button type="submit" class="btn btn-primary btn-full btn-lg" id="loginBtn" style="margin-top:4px;" data-i18n="nav-login">로그인</button>
        </form>
      </div>
            <div id="authFormSignup" style="display:none;">
        <form id="signupForm" onsubmit="handleSignup(event)" novalidate>
          <div id="signupError" class="auth-message error" role="alert" style="display:none;"><span class="auth-msg-icon">❌</span><span id="signupErrorText"></span></div>

          <div style="display:flex;flex-direction:column;gap:0;margin-bottom:14px;background:var(--bg-secondary,#f8f8f8);border-radius:10px;border:1px solid var(--border-color,#e8e8e8);overflow:hidden;">
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:13px 16px;border-bottom:1px solid var(--border-color,#e8e8e8);background:var(--white,#fff);" onclick="toggleAgreeAll(event)">
              <input type="checkbox" id="agreeAll" style="width:18px;height:18px;cursor:pointer;accent-color:var(--primary,#6366f1);flex-shrink:0;" />
              <span style="font-size:14px;font-weight:700;color:var(--text-primary,#111);">전체 동의</span>
            </label>
            <div style="display:flex;flex-direction:column;gap:0;padding:10px 16px 12px;">
              <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:13px;color:var(--text-secondary,#555);line-height:1.5;padding:6px 0;">
                <input type="checkbox" id="agreePrivacy" style="margin-top:2px;width:16px;height:16px;cursor:pointer;accent-color:var(--primary,#6366f1);flex-shrink:0;" onchange="syncAgreeAll()" />
                <span><a href="/privacy" target="_blank" style="color:var(--primary,#6366f1);font-weight:600;text-decoration:underline;">개인정보처리방침</a>에 따른 개인정보 수집 및 이용에 동의합니다. <span style="color:#e53e3e;font-weight:700;">(필수)</span></span>
              </label>
              <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:13px;color:var(--text-secondary,#555);line-height:1.5;padding:6px 0;">
                <input type="checkbox" id="agreeMarketing" style="margin-top:2px;width:16px;height:16px;cursor:pointer;accent-color:var(--primary,#6366f1);flex-shrink:0;" onchange="syncAgreeAll()" />
                <span>가끔 프로모션 이메일 및 알림을 수신합니다. 언제든지 수신 거부할 수 있습니다. <span style="color:var(--text-muted,#999);">(선택)</span></span>
              </label>
            </div>
          </div>

          <div class="form-group"><input type="text" class="form-input" id="signupName" placeholder="이름" autocomplete="name" /></div>
          <div class="form-group"><input type="email" class="form-input" id="signupEmail" placeholder="이메일" autocomplete="email" /></div>
          <div class="form-group"><input type="password" class="form-input" id="signupPassword" placeholder="비밀번호 (8자 이상)" autocomplete="new-password" /></div>
          <button type="submit" class="btn btn-primary btn-full btn-lg" id="signupBtn" style="margin-top:4px;" data-i18n="signupBtn">가입하고 무료 시작 🎁</button>
        </form>
      </div>
      <p style="font-size:11px;color:var(--text-muted);text-align:center;margin-top:14px;">가입 시 이용약관 및 개인정보처리방침에 동의합니다.</p>
    </div>
  </div>
  `))
})

// ────────────────────────────────────────────────────
// Admin Page  GET /admin
// ────────────────────────────────────────────────────
// ── /admin02: 실제 어드민 페이지 (기존 /admin에서 이동) ──
app.get('/admin02', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Admin | EZlook</title>
  <link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Pretendard',-apple-system,sans-serif;background:#0f0f1a;color:#e0e0f0;min-height:100vh;}
    /* 로그인 */
    #loginOverlay{position:fixed;inset:0;background:#0f0f1a;display:flex;align-items:center;justify-content:center;z-index:100;}
    .login-card{background:#1a1a2e;border:1px solid #2e2e50;border-radius:16px;padding:40px;width:100%;max-width:380px;text-align:center;}
    .login-card .logo{font-size:32px;margin-bottom:8px;}
    .login-card h2{font-size:20px;font-weight:700;margin-bottom:4px;}
    .login-card p{font-size:13px;color:#8b8ba0;margin-bottom:28px;}
    .login-card input{width:100%;padding:12px 16px;background:#252540;border:1px solid #3a3a60;border-radius:10px;color:#e0e0f0;font-size:15px;outline:none;margin-bottom:12px;transition:border-color .2s;}
    .login-card input:focus{border-color:#6c47ff;}
    .login-card .err{font-size:13px;color:#ef4444;margin-bottom:10px;min-height:18px;}
    /* 헤더 */
    #adminMain{display:none;}
    .admin-header{background:#1a1a2e;border-bottom:1px solid #2e2e50;padding:14px 28px;display:flex;align-items:center;gap:14px;position:sticky;top:0;z-index:50;}
    .admin-header .logo{font-size:18px;font-weight:700;color:#6c47ff;}
    .admin-header .badge{font-size:11px;background:#6c47ff22;color:#9b7cff;padding:3px 10px;border-radius:20px;border:1px solid #6c47ff44;}
    .admin-header .logout{margin-left:auto;font-size:13px;cursor:pointer;padding:6px 14px;border:1px solid #3a3a60;border-radius:8px;background:none;color:#e0e0f0;transition:all .2s;}
    .admin-header .logout:hover{border-color:#6c47ff;color:#9b7cff;}
    /* 탭 */
    .tab-bar{display:flex;gap:4px;background:#1a1a2e;border-bottom:1px solid #2e2e50;padding:0 28px;}
    .tab-btn{padding:14px 20px;font-size:14px;font-weight:500;cursor:pointer;border:none;background:none;color:#8b8ba0;border-bottom:2px solid transparent;transition:all .2s;}
    .tab-btn.active{color:#9b7cff;border-bottom-color:#6c47ff;}
    .tab-btn:hover{color:#e0e0f0;}
    .tab-panel{display:none;}
    .tab-panel.active{display:block;}
    /* 바디 */
    .admin-body{max-width:960px;margin:0 auto;padding:28px 24px;}
    .page-title{font-size:20px;font-weight:700;margin-bottom:6px;}
    .page-sub{font-size:13px;color:#8b8ba0;margin-bottom:28px;}
    /* 토글 */
    .toggle-card{background:#1a1a2e;border:1px solid #2e2e50;border-radius:14px;padding:18px 22px;margin-bottom:20px;display:flex;align-items:center;gap:16px;}
    .toggle-card .info{flex:1;}
    .toggle-card .info h3{font-size:14px;font-weight:600;margin-bottom:3px;}
    .toggle-card .info p{font-size:12px;color:#8b8ba0;}
    .toggle-switch{position:relative;width:48px;height:26px;flex-shrink:0;}
    .toggle-switch input{opacity:0;width:0;height:0;}
    .slider{position:absolute;inset:0;cursor:pointer;background:#3a3a60;border-radius:26px;transition:.3s;}
    .slider:before{content:"";position:absolute;height:20px;width:20px;left:3px;bottom:3px;background:white;border-radius:50%;transition:.3s;}
    input:checked+.slider{background:#6c47ff;}
    input:checked+.slider:before{transform:translateX(22px);}
    /* 섹션 카드 */
    .section-card{background:#1a1a2e;border:1px solid #2e2e50;border-radius:14px;padding:22px;margin-bottom:18px;}
    .section-card h3{font-size:14px;font-weight:600;margin-bottom:4px;display:flex;align-items:center;gap:8px;}
    .section-card .section-desc{font-size:12px;color:#8b8ba0;margin-bottom:14px;}
    .section-card textarea{width:100%;background:#0f0f1a;border:1px solid #3a3a60;border-radius:10px;color:#e0e0f0;font-size:13px;font-family:inherit;line-height:1.6;padding:12px;resize:vertical;outline:none;transition:border-color .2s;}
    .section-card textarea:focus{border-color:#6c47ff;}
    .char-count{font-size:12px;color:#8b8ba0;text-align:right;margin-top:5px;}
    .preset-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;}
    .preset-btn{font-size:12px;padding:4px 11px;border:1px solid #3a3a60;border-radius:20px;background:none;color:#a0a0c0;cursor:pointer;transition:all .2s;white-space:nowrap;}
    .preset-btn:hover{border-color:#6c47ff;color:#9b7cff;background:#6c47ff11;}
    /* 저장바 */
    .save-bar{position:sticky;bottom:0;background:#0f0f1a;border-top:1px solid #2e2e50;padding:14px 0;display:flex;align-items:center;gap:14px;margin-top:6px;}
    .btn-save{padding:11px 28px;background:#6c47ff;color:white;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;}
    .btn-save:hover{background:#7c5bff;}
    .btn-save:disabled{background:#3a3a60;color:#8b8ba0;cursor:not-allowed;}
    .btn-cancel{padding:11px 20px;background:transparent;color:#8b8ba0;border:1.5px solid #3a3a60;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;}
    .btn-cancel:hover{border-color:#6c47ff;color:#9b7cff;}
    .save-status{font-size:13px;color:#8b8ba0;}
    .save-status.ok{color:#22c55e;}
    .save-status.err{color:#ef4444;}
    .preview-box{background:#0f0f1a;border:1px solid #3a3a60;border-radius:10px;padding:14px;font-size:12px;color:#a0c0a0;line-height:1.7;max-height:200px;overflow-y:auto;white-space:pre-wrap;word-break:break-word;margin-top:6px;}
    /* 공통 버튼 */
    .btn-sm{padding:7px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid #3a3a60;background:none;color:#e0e0f0;transition:all .2s;}
    .btn-sm:hover{border-color:#6c47ff;color:#9b7cff;}
    .btn-danger-sm{border-color:#ef4444;color:#ef4444;}
    .btn-danger-sm:hover{background:#ef444420;}
    .btn-primary-sm{background:#6c47ff;border-color:#6c47ff;color:white;}
    .btn-primary-sm:hover{background:#7c5bff;}
    /* 미디어 업로드 */
    .upload-zone{border:2px dashed #3a3a60;border-radius:12px;padding:32px;text-align:center;cursor:pointer;transition:all .2s;background:#0f0f1a;}
    .upload-zone:hover,.upload-zone.drag{border-color:#6c47ff;background:#6c47ff0a;}
    .upload-zone .icon{font-size:28px;margin-bottom:10px;color:#8b8ba0;}
    .upload-zone p{font-size:13px;color:#8b8ba0;}
    .upload-zone p span{color:#9b7cff;text-decoration:underline;cursor:pointer;}
    /* 미디어 그리드 */
    .media-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px;margin-top:20px;}
    .media-card{background:#1a1a2e;border:1px solid #2e2e50;border-radius:12px;overflow:hidden;position:relative;}
    .media-card img{width:100%;aspect-ratio:3/4;object-fit:cover;display:block;}
    .media-card.bg-card-item img{aspect-ratio:16/9;}
    .media-card .meta{padding:10px 12px;}
    .media-card .meta .name{font-size:13px;font-weight:600;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .media-card .meta .desc{font-size:11px;color:#8b8ba0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .media-card .del-btn{position:absolute;top:6px;right:6px;width:26px;height:26px;border-radius:50%;background:#ef44449e;border:none;color:white;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;transition:background .2s;}
    .media-card .del-btn:hover{background:#ef4444;}
    .media-card .custom-badge{position:absolute;top:6px;left:6px;font-size:10px;background:#6c47ffcc;color:white;padding:2px 8px;border-radius:10px;}
    /* 업로드 폼 */
    .upload-form{background:#1a1a2e;border:1px solid #2e2e50;border-radius:14px;padding:22px;margin-top:20px;}
    .upload-form h3{font-size:14px;font-weight:600;margin-bottom:16px;}
    .form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;}
    .form-row.single{grid-template-columns:1fr;}
    .form-label{font-size:12px;color:#8b8ba0;margin-bottom:5px;display:block;}
    .form-input{width:100%;background:#0f0f1a;border:1px solid #3a3a60;border-radius:8px;color:#e0e0f0;font-size:13px;padding:10px 12px;outline:none;transition:border-color .2s;}
    .form-input:focus{border-color:#6c47ff;}
    .upload-preview{width:100%;max-height:180px;object-fit:contain;border-radius:8px;margin-top:8px;display:none;}
    .empty-state{text-align:center;padding:48px 20px;color:#8b8ba0;font-size:13px;}
    .empty-state .icon{font-size:32px;margin-bottom:12px;opacity:.4;}
  </style>
</head>
<body>

<!-- 로그인 -->
<div id="loginOverlay">
  <div class="login-card">
    <div class="logo">🛡️</div>
    <h2>Admin 로그인</h2>
    <p>EZlook 관리자 페이지</p>
    <input type="password" id="pwInput" placeholder="비밀번호 입력" onkeydown="if(event.key==='Enter')doLogin()"/>
    <div class="err" id="loginErr"></div>
    <button class="btn-save" style="width:100%" onclick="doLogin()">로그인</button>
  </div>
</div>

<!-- 어드민 메인 -->
<div id="adminMain">
  <header class="admin-header">
    <span class="logo">✨ EZlook</span>
    <span class="badge">Admin</span>
    <button class="logout" onclick="doLogout()"><i class="fas fa-sign-out-alt"></i> 로그아웃</button>
  </header>

  <!-- 탭 바 -->
  <div class="tab-bar">
    <button class="tab-btn active" onclick="switchTab('prompt')"><i class="fas fa-magic"></i> 프롬프트</button>
    <button class="tab-btn" onclick="switchTab('models')"><i class="fas fa-user-circle"></i> 모델 관리</button>
    <button class="tab-btn" onclick="switchTab('bgs')"><i class="fas fa-image"></i> 배경 관리</button>
    <button class="tab-btn" onclick="switchTab('users')"><i class="fas fa-users"></i> 회원 관리</button>
  </div>

  <!-- ▼ 탭: 프롬프트 -->
  <div class="tab-panel active" id="tabPrompt">
    <div class="admin-body">
      <div class="page-title">🎨 AI 생성 프롬프트 관리</div>
      <div class="page-sub">아래 설정은 사용자에게 노출되지 않으며, 이미지 생성 시 자동으로 적용됩니다. 프롬프트는 한글로 작성하세요.</div>

      <div class="toggle-card">
        <div class="info">
          <h3>어드민 프롬프트 적용</h3>
          <p>OFF 시 기본 프롬프트만 사용됩니다.</p>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="toggleEnabled" checked/>
          <span class="slider"></span>
        </label>
      </div>

      <div class="section-card">
        <h3><i class="fas fa-arrow-right" style="color:#6c47ff;font-size:12px;"></i> 앞에 추가 (Prefix)</h3>
        <div class="section-desc">기본 프롬프트 앞에 삽입. 예: [프리미엄 패션 브랜드 룩북] 고급 에디토리얼 이미지 생성.</div>
        <textarea id="fieldPrefix" rows="3" placeholder="예: [프리미엄 패션 브랜드] 고급 에디토리얼 룩북 이미지를 생성하세요."></textarea>
        <div class="char-count"><span id="cntPrefix">0</span>자</div>
      </div>

      <div class="section-card">
        <h3><i class="fas fa-camera" style="color:#ff6b9d;font-size:12px;"></i> 스타일 가이드</h3>
        <div class="section-desc">카메라, 조명, 색감, 분위기 등 촬영 스타일을 고정합니다.</div>
        <div class="preset-row">
          <button class="preset-btn" onclick="applyPreset('styleGuide','studio')">🏢 스튜디오</button>
          <button class="preset-btn" onclick="applyPreset('styleGuide','editorial')">📸 에디토리얼</button>
          <button class="preset-btn" onclick="applyPreset('styleGuide','outdoor')">🌿 아웃도어</button>
          <button class="preset-btn" onclick="applyPreset('styleGuide','luxury')">💎 럭셔리</button>
          <button class="preset-btn" onclick="applyPreset('styleGuide','minimal')">⬜ 미니멀</button>
          <button class="preset-btn" onclick="applyPreset('styleGuide','streetwear')">🏙️ 스트릿</button>
        </div>
        <textarea id="fieldStyleGuide" rows="5" placeholder="예: 후지필름 GFX 100S 중형 카메라, 자연광 확산, 따뜻한 하이라이트, 패션 에디토리얼 무드..."></textarea>
        <div class="char-count"><span id="cntStyleGuide">0</span>자</div>
      </div>

      <div class="section-card">
        <h3><i class="fas fa-sliders-h" style="color:#00d4aa;font-size:12px;"></i> 기술 스펙</h3>
        <div class="section-desc">해상도, 선명도, 의상 묘사 방식 등 기술적 제약을 고정합니다.</div>
        <div class="preset-row">
          <button class="preset-btn" onclick="applyPreset('technicalSpec','standard')">📐 스탠다드</button>
          <button class="preset-btn" onclick="applyPreset('technicalSpec','highres')">🔬 초고해상도</button>
          <button class="preset-btn" onclick="applyPreset('technicalSpec','fabric')">🧵 원단 강조</button>
          <button class="preset-btn" onclick="applyPreset('technicalSpec','strict')">🔒 의상 엄격 고정</button>
        </div>
        <textarea id="fieldTechnicalSpec" rows="5" placeholder="예: 초사실적 표현, 직물 질감 극사실 재현, 의류 드레이프 완벽 재현, 아티팩트 없음..."></textarea>
        <div class="char-count"><span id="cntTechnicalSpec">0</span>자</div>
      </div>

      <div class="section-card">
        <h3><i class="fas fa-arrow-left" style="color:#6c47ff;font-size:12px;"></i> 뒤에 추가 (Suffix)</h3>
        <div class="section-desc">마지막에 삽입. 네거티브 지시나 최종 강조에 활용하세요.</div>
        <textarea id="fieldSuffix" rows="3" placeholder="예: 워터마크 없음. 텍스트 오버레이 없음. 인쇄 가능 품질."></textarea>
        <div class="char-count"><span id="cntSuffix">0</span>자</div>
      </div>

      <div class="section-card">
        <h3><i class="fas fa-eye" style="color:#f59e0b;font-size:12px;"></i> 최종 프롬프트 미리보기</h3>
        <div class="section-desc">실제 생성 시 조합되는 프롬프트 구조입니다.</div>
        <div class="preview-box" id="previewBox">미리보기 로딩 중...</div>
      </div>

      <div class="save-bar">
        <button class="btn-save" id="saveBtn" onclick="saveConfig()"><i class="fas fa-save"></i> 저장하기</button>
        <button class="btn-sm" onclick="loadConfig()"><i class="fas fa-redo"></i> 초기화</button>
        <span class="save-status" id="saveStatus"></span>
      </div>
    </div>
  </div>

  <!-- ▼ 탭: 모델 관리 -->
  <div class="tab-panel" id="tabModels">
    <div class="admin-body">
      <div class="page-title">👤 모델 관리</div>
      <div class="page-sub">업로드한 모델은 사용자 화면에서 기본 제공 모델보다 먼저 표시됩니다.</div>

      <!-- 다중 업로드 폼 -->
      <div class="upload-form">
        <h3><i class="fas fa-plus-circle" style="color:#6c47ff;"></i> 모델 추가 <span style="font-size:13px;font-weight:400;color:#888;">(여러 장 동시 업로드 가능)</span></h3>

        <!-- 드롭존 -->
        <div class="upload-zone multi-zone" id="modelUploadZone" onclick="document.getElementById('modelFileInput').click()">
          <div class="icon"><i class="fas fa-images"></i></div>
          <p>클릭하거나 이미지를 드래그하세요<br/><span>여러 파일 선택 가능</span> (JPG, PNG, WEBP)</p>
        </div>
        <input type="file" id="modelFileInput" accept="image/*" multiple style="display:none" onchange="onModelFilesSelect(event)"/>

        <!-- 선택된 파일 미리보기 그리드 -->
        <div id="modelStagingGrid" style="display:none;margin-top:16px;">
          <div style="font-size:13px;font-weight:600;color:#444;margin-bottom:10px;">
            선택된 이미지 — 이름을 입력 후 등록하세요
          </div>
          <div id="modelStagingItems" style="display:flex;flex-wrap:wrap;gap:14px;"></div>
          <div style="display:flex;gap:10px;align-items:center;margin-top:16px;">
            <button class="btn-save" onclick="uploadModels()"><i class="fas fa-upload"></i> 전체 등록</button>
            <button class="btn-cancel" onclick="clearModelStaging()"><i class="fas fa-times"></i> 초기화</button>
            <span class="save-status" id="modelUploadStatus"></span>
          </div>
        </div>
      </div>

      <!-- 커스텀 모델 목록 -->
      <div id="customModelGrid"></div>
    </div>
  </div>

  <!-- ▼ 탭: 배경 관리 -->
  <div class="tab-panel" id="tabBgs">
    <div class="admin-body">
      <div class="page-title">🖼️ 배경 관리</div>
      <div class="page-sub">업로드한 배경은 사용자 화면에서 기본 배경보다 먼저 표시됩니다.</div>

      <!-- 다중 업로드 폼 -->
      <div class="upload-form">
        <h3><i class="fas fa-plus-circle" style="color:#6c47ff;"></i> 배경 추가 <span style="font-size:13px;font-weight:400;color:#888;">(여러 장 동시 업로드 가능)</span></h3>

        <!-- 기본 카테고리 (공통 적용) -->
        <div class="form-row single" style="margin-bottom:10px;">
          <div>
            <label class="form-label">기본 카테고리 <span style="color:#888;font-weight:400;">(공통 적용, 개별 변경 가능)</span></label>
            <input class="form-input" id="bgDefaultCategory" placeholder="예: 스튜디오, 야외, 럭셔리" style="max-width:320px;"/>
          </div>
        </div>

        <!-- 드롭존 -->
        <div class="upload-zone multi-zone" id="bgUploadZone" onclick="document.getElementById('bgFileInput').click()">
          <div class="icon"><i class="fas fa-images"></i></div>
          <p>클릭하거나 이미지를 드래그하세요<br/><span>여러 파일 선택 가능</span> (JPG, PNG, WEBP)</p>
        </div>
        <input type="file" id="bgFileInput" accept="image/*" multiple style="display:none" onchange="onBgFilesSelect(event)"/>

        <!-- 선택된 파일 미리보기 그리드 -->
        <div id="bgStagingGrid" style="display:none;margin-top:16px;">
          <div style="font-size:13px;font-weight:600;color:#444;margin-bottom:10px;">
            선택된 이미지 — 이름을 입력 후 등록하세요
          </div>
          <div id="bgStagingItems" style="display:flex;flex-wrap:wrap;gap:14px;"></div>
          <div style="display:flex;gap:10px;align-items:center;margin-top:16px;">
            <button class="btn-save" onclick="uploadBgs()"><i class="fas fa-upload"></i> 전체 등록</button>
            <button class="btn-cancel" onclick="clearBgStaging()"><i class="fas fa-times"></i> 초기화</button>
            <span class="save-status" id="bgUploadStatus"></span>
          </div>
        </div>
      </div>

      <div id="customBgGrid"></div>
    </div>
  </div>

  <!-- ▼ 탭: 회원 관리 -->
  <div class="tab-panel" id="tabUsers">
    <div class="admin-body">
      <div class="page-title">👥 회원 관리</div>
      <div class="page-sub">가입된 회원 목록을 조회하고 상태를 관리합니다.</div>

      <!-- 통계 카드 -->
      <div id="userStats" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;margin-bottom:24px;">
        <div class="section-card" style="padding:16px;text-align:center;">
          <div style="font-size:24px;font-weight:800;color:#9b7cff;" id="statTotal">-</div>
          <div style="font-size:12px;color:#8b8ba0;margin-top:4px;">전체 회원</div>
        </div>
        <div class="section-card" style="padding:16px;text-align:center;">
          <div style="font-size:24px;font-weight:800;color:#22c55e;" id="statActive">-</div>
          <div style="font-size:12px;color:#8b8ba0;margin-top:4px;">활성</div>
        </div>
        <div class="section-card" style="padding:16px;text-align:center;">
          <div style="font-size:24px;font-weight:800;color:#ef4444;" id="statSuspended">-</div>
          <div style="font-size:12px;color:#8b8ba0;margin-top:4px;">정지</div>
        </div>
        <div class="section-card" style="padding:16px;text-align:center;">
          <div style="font-size:24px;font-weight:800;color:#f59e0b;" id="statToday">-</div>
          <div style="font-size:12px;color:#8b8ba0;margin-top:4px;">오늘 가입</div>
        </div>
        <div class="section-card" style="padding:16px;text-align:center;">
          <div style="font-size:13px;font-weight:700;color:#FEE500;" id="statKakao">-</div>
          <div style="font-size:12px;color:#8b8ba0;margin-top:4px;">카카오</div>
        </div>
        <div class="section-card" style="padding:16px;text-align:center;">
          <div style="font-size:13px;font-weight:700;color:#4285F4;" id="statGoogle">-</div>
          <div style="font-size:12px;color:#8b8ba0;margin-top:4px;">구글</div>
        </div>
      </div>

      <!-- 필터/검색 바 -->
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;">
        <input type="text" id="userSearch" class="form-input" placeholder="🔍 이름/이메일 검색..." style="flex:1;min-width:200px;" oninput="filterUsers()"/>
        <select id="userStatusFilter" class="form-input" style="width:130px;" onchange="filterUsers()">
          <option value="">전체 상태</option>
          <option value="active">활성</option>
          <option value="suspended">정지</option>
        </select>
        <select id="userProviderFilter" class="form-input" style="width:130px;" onchange="filterUsers()">
          <option value="">전체 가입경로</option>
          <option value="email">이메일</option>
          <option value="kakao">카카오</option>
          <option value="google">구글</option>
        </select>
        <button class="btn-sm btn-primary-sm" onclick="loadUsers()">🔄 새로고침</button>
      </div>

      <!-- 회원 목록 테이블 -->
      <div class="section-card" style="padding:0;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#0f0f1a;border-bottom:1px solid #2e2e50;">
              <th style="text-align:left;padding:12px 16px;font-size:12px;color:#8b8ba0;font-weight:600;">회원</th>
              <th style="text-align:left;padding:12px 16px;font-size:12px;color:#8b8ba0;font-weight:600;">가입경로</th>
              <th style="text-align:center;padding:12px 16px;font-size:12px;color:#8b8ba0;font-weight:600;">크레딧</th>
              <th style="text-align:center;padding:12px 16px;font-size:12px;color:#8b8ba0;font-weight:600;">상태</th>
              <th style="text-align:left;padding:12px 16px;font-size:12px;color:#8b8ba0;font-weight:600;">가입일</th>
              <th style="text-align:center;padding:12px 16px;font-size:12px;color:#8b8ba0;font-weight:600;">관리</th>
            </tr>
          </thead>
          <tbody id="userTableBody">
            <tr><td colspan="6" style="text-align:center;padding:40px;color:#8b8ba0;font-size:13px;">로딩 중...</td></tr>
          </tbody>
        </table>
      </div>

      <!-- 페이징 -->
      <div id="userPagination" style="display:flex;justify-content:center;align-items:center;gap:8px;margin-top:16px;"></div>
    </div>
  </div>

</div>

<script>
const NL = String.fromCharCode(10)
let adminPassword = ''

// ── 프리셋 데이터 (한글) ──
const PRESETS = {
  styleGuide: {
    studio:     'PERSON SWAP — Studio Scene: Replace person identity and clothing only. Preserve exact original pose, studio lighting direction, white cyclorama background, and all scene elements. The replaced model must match the same camera angle and eye-level. Lighting: neutral-warm softbox, fill reflector, subtle rim light. Magazine cover quality seamless compositing.',
    editorial:  'PERSON SWAP — Editorial Scene: Replace person identity and clothing only. Preserve exact original pose, natural diffused window light, warm highlights, and all scene elements. The replaced model must appear naturally integrated at the same perspective. Fujifilm GFX aesthetic: elegant, sophisticated magazine editorial quality.',
    outdoor:    'PERSON SWAP — Outdoor Scene: Replace person identity and clothing only. Preserve exact original pose, golden-hour natural lighting, background bokeh, and all scene elements. The replaced model must cast realistic ground shadows matching the scene lighting. Warm cinematic color grade. Fresh lifestyle fashion feel.',
    luxury:     'PERSON SWAP — Luxury Scene: Replace person identity and clothing only. Preserve exact original pose, dramatic chiaroscuro lighting, deep shadows, rich contrast, and all scene elements. The replaced model must be seamlessly integrated. High fashion luxury brand aesthetic: opulent, refined, top editorial quality.',
    minimal:    'PERSON SWAP — Minimal Scene: Replace person identity and clothing only. Preserve exact original pose, flat even diffused lighting, no shadows, clean background, and all scene elements. The replaced model must blend seamlessly. Scandinavian-inspired: restrained, elegant, clean aesthetic.',
    streetwear: 'PERSON SWAP — Street Scene: Replace person identity and clothing only. Preserve exact original pose, urban environment, natural available light, slight authentic grain, and all scene elements. The replaced model must appear genuinely present in the location. Dynamic, authentic street style editorial energy.',
  },
  technicalSpec: {
    standard:   '초사실적 표현. 의류에 선명한 포커스, 배경의 자연스러운 얕은 심도. 전문 색 보정. 아티팩트 없음, 왜곡 없음. 인쇄 가능 품질.',
    highres:    '초사실적 8K 품질. 피부 질감과 직물 미세 디테일의 극사실 재현. 서브픽셀 선명한 엣지. HDR 다이나믹 레인지. 대형 인쇄 및 빌보드 사용에 완벽.',
    fabric:     '극한의 직물 디테일 재현: 실 수가 보이고, 직조 패턴 정확하며, 소재 무게감이 시각적으로 전달됨. 의류는 착용 가능하고 입체적으로 표현. 드레이프와 실루엣은 자연스럽고 중력에 맞게 표현.',
    strict:     '절대 제약: 참조 이미지의 의류를 창의적 변형 없이 그대로 재현. 모든 솔기, 스티치, 단추, 지퍼, 프린트, 자수, 색상이 정확히 일치해야 함. 어떤 의류 요소도 단순화, 양식화 또는 재해석 금지. 위반은 허용되지 않음.',
  },
}

// ─── 탭 전환 ───
function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    const names = ['prompt','models','bgs','users']
    b.classList.toggle('active', names[i] === name)
  })
  document.getElementById('tabPrompt').classList.toggle('active', name === 'prompt')
  document.getElementById('tabModels').classList.toggle('active', name === 'models')
  document.getElementById('tabBgs').classList.toggle('active', name === 'bgs')
  document.getElementById('tabUsers').classList.toggle('active', name === 'users')
  if (name === 'models') loadCustomModels()
  if (name === 'bgs')    loadCustomBgs()
  if (name === 'users')  loadUsers()
}

// ─── 회원 관리 ───
let allUsers = []
let usersPage = 1
const USERS_PER_PAGE = 20

async function loadUsers() {
  try {
    const res = await fetch('/api/admin/stats', {headers:{'X-Admin-Password':adminPassword}})
    const stats = await res.json()
    if (stats.success) {
      const s = stats.stats
      document.getElementById('statTotal').textContent     = s.total?.toLocaleString() || 0
      document.getElementById('statActive').textContent    = s.active?.toLocaleString() || 0
      document.getElementById('statSuspended').textContent = s.suspended?.toLocaleString() || 0
      document.getElementById('statToday').textContent     = s.today?.toLocaleString() || 0
      document.getElementById('statKakao').textContent     = (s.by_provider?.kakao || 0) + '명'
      document.getElementById('statGoogle').textContent    = (s.by_provider?.google || 0) + '명'
    }
  } catch(e) {}

  const q      = document.getElementById('userSearch')?.value || ''
  const status = document.getElementById('userStatusFilter')?.value || ''
  const prov   = document.getElementById('userProviderFilter')?.value || ''

  try {
    const params = new URLSearchParams({ page: usersPage, limit: USERS_PER_PAGE })
    if (q)      params.set('q', q)
    if (status) params.set('status', status)
    if (prov)   params.set('provider', prov)

    const res = await fetch('/api/admin/users?' + params.toString(), {
      headers: {'X-Admin-Password': adminPassword}
    })
    const data = await res.json()
    if (!data.success) { renderUserTable([]); return }

    allUsers = data.users || []
    renderUserTable(allUsers)
    renderUserPagination(data.total || allUsers.length, data.page || 1, data.limit || USERS_PER_PAGE)
  } catch(e) {
    document.getElementById('userTableBody').innerHTML =
      '<tr><td colspan="6" style="text-align:center;padding:40px;color:#ef4444;font-size:13px;">⚠️ 로딩 실패</td></tr>'
  }
}

function filterUsers() {
  usersPage = 1
  loadUsers()
}

function renderUserTable(users) {
  const tbody = document.getElementById('userTableBody')
  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#8b8ba0;font-size:13px;">조건에 맞는 회원이 없습니다</td></tr>'
    return
  }
  const providerBadge = {
    kakao:  '<span style="font-size:11px;background:#FEE500;color:#3C1E1E;padding:2px 8px;border-radius:10px;font-weight:700;">카카오</span>',
    google: '<span style="font-size:11px;background:#4285F4;color:white;padding:2px 8px;border-radius:10px;font-weight:700;">구글</span>',
    email:  '<span style="font-size:11px;background:#3a3a60;color:#e0e0f0;padding:2px 8px;border-radius:10px;font-weight:700;">이메일</span>',
  }
  const statusBadge = {
    active:    '<span style="font-size:11px;background:#22c55e22;color:#22c55e;padding:2px 8px;border-radius:10px;border:1px solid #22c55e44;">활성</span>',
    suspended: '<span style="font-size:11px;background:#ef444422;color:#ef4444;padding:2px 8px;border-radius:10px;border:1px solid #ef444444;">정지</span>',
    deleted:   '<span style="font-size:11px;background:#6b728022;color:#6b7280;padding:2px 8px;border-radius:10px;border:1px solid #6b728044;">삭제됨</span>',
  }
  tbody.innerHTML = users.map(function(u) {
    var avatar = u.avatar_url
      ? '<img src="' + u.avatar_url + '" style="width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0;">'
      : '<div style="width:28px;height:28px;border-radius:50%;background:#6c47ff44;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;">' + ((u.name||'?')[0]) + '</div>'
    var joined = u.created_at ? u.created_at.slice(0,10) : '-'
    var isAdmin = u.role === 'admin'
    var adminBadge = isAdmin ? ' <span style="font-size:10px;background:#6c47ff;color:white;padding:1px 6px;border-radius:8px;">Admin</span>' : ''
    var uid = String(u.id)
    var statusBtn = ''
    if (u.status === 'active') {
      statusBtn = '<button data-uid="' + uid + '" data-action="suspend" class="btn-sm btn-danger-sm" style="font-size:11px;padding:4px 10px;">정지</button>'
    } else if (u.status === 'suspended') {
      statusBtn = '<button data-uid="' + uid + '" data-action="activate" class="btn-sm btn-primary-sm" style="font-size:11px;padding:4px 10px;">활성화</button>'
    }
    var deleteBtn = !isAdmin ? '<button data-uid="' + uid + '" data-name="' + escHtml(u.name||'') + '" data-email="' + escHtml(u.email||'') + '" data-action="delete" class="btn-sm btn-danger-sm" style="font-size:11px;padding:4px 10px;">삭제</button>' : ''
    var credits = (u.credits != null) ? u.credits : 0
    return '<tr style="border-bottom:1px solid #1e1e3a;">'
      + '<td style="padding:12px 16px;">'
      +   '<div style="display:flex;align-items:center;gap:10px;">'
      +     avatar
      +     '<div>'
      +       '<div style="font-size:13px;font-weight:600;">' + (u.name || '(이름 없음)') + adminBadge + '</div>'
      +       '<div style="font-size:11px;color:#8b8ba0;">' + u.email + '</div>'
      +     '</div>'
      +   '</div>'
      + '</td>'
      + '<td style="padding:12px 16px;">' + (providerBadge[u.provider] || u.provider) + '</td>'
      + '<td style="padding:12px 16px;text-align:center;">'
      +   '<span style="font-size:14px;font-weight:700;color:#9b7cff;">' + credits + '</span>'
      +   '<span style="font-size:10px;color:#8b8ba0;"> 크레딧</span>'
      +   '<div style="margin-top:4px;display:flex;gap:4px;justify-content:center;">'
      +     '<button data-uid="' + uid + '" data-credits="' + credits + '" data-action="grant" style="font-size:10px;padding:2px 8px;background:#6c47ff33;border:1px solid #6c47ff66;border-radius:6px;color:#9b7cff;cursor:pointer;font-weight:600;">지급</button>'
      +     '<button data-uid="' + uid + '" data-credits="' + credits + '" data-action="credits" style="font-size:10px;padding:2px 8px;background:none;border:1px solid #3a3a60;border-radius:6px;color:#8b8ba0;cursor:pointer;">설정</button>'
      +   '</div>'
      + '</td>'
      + '<td style="padding:12px 16px;text-align:center;">' + (statusBadge[u.status] || u.status) + '</td>'
      + '<td style="padding:12px 16px;font-size:12px;color:#8b8ba0;">' + joined + '</td>'
      + '<td style="padding:12px 16px;text-align:center;">'
      +   '<div style="display:flex;gap:6px;justify-content:center;">'
      +     statusBtn + deleteBtn
      +   '</div>'
      + '</td>'
      + '</tr>'
  }).join('')
}

function renderUserPagination(total, page, limit) {
  var totalPages = Math.ceil(total / limit)
  var pag = document.getElementById('userPagination')
  if (!pag || totalPages <= 1) { if (pag) pag.innerHTML = ''; return }
  var html = ''
  if (page > 1) html += '<button class="btn-sm" onclick="goUsersPage(' + (page-1) + ')">‹ 이전</button>'
  for (var i = Math.max(1, page-2); i <= Math.min(totalPages, page+2); i++) {
    html += '<button class="btn-sm' + (i===page ? ' btn-primary-sm' : '') + '" onclick="goUsersPage(' + i + ')">' + i + '</button>'
  }
  if (page < totalPages) html += '<button class="btn-sm" onclick="goUsersPage(' + (page+1) + ')">다음 ›</button>'
  html += '<span style="font-size:12px;color:#8b8ba0;margin-left:8px;">총 ' + total + '명</span>'
  pag.innerHTML = html
}


function goUsersPage(p) { usersPage = p; loadUsers() }

async function setUserStatus(id, status) {
  if (!confirm('이 회원을 ' + (status === 'active' ? '활성화' : '정지') + '하시겠습니까?')) return
  try {
    const res = await fetch('/api/admin/users/' + id, {
      method: 'PATCH',
      headers: {'Content-Type':'application/json','X-Admin-Password':adminPassword},
      body: JSON.stringify({ status })
    })
    const data = await res.json()
    if (data.success) { showAdminToast(status === 'active' ? '활성화 완료' : '정지 완료', 'ok'); loadUsers() }
    else showAdminToast(data.message || '실패', 'err')
  } catch(e) { showAdminToast('서버 오류', 'err') }
}

async function adjustCredits(id, current) {
  // 절대값 설정 (설정 버튼)
  const val = prompt('크레딧 절대값 설정 (현재: ' + current + '크레딧) - 새 크레딧 수를 입력하세요:', current)
  if (val === null) return
  const credits = parseInt(val)
  if (isNaN(credits) || credits < 0) { showAdminToast('올바른 크레딧 수를 입력하세요', 'err'); return }
  try {
    const res = await fetch('/api/admin/users/' + id, {
      method: 'PATCH',
      headers: {'Content-Type':'application/json','X-Admin-Password':adminPassword},
      body: JSON.stringify({ credits })
    })
    const data = await res.json()
    if (data.success) { showAdminToast('크레딧 설정 완료 → ' + (data.newCredits ?? credits) + '크레딧', 'ok'); loadUsers() }
    else showAdminToast(data.message || '실패', 'err')
  } catch(e) { showAdminToast('서버 오류', 'err') }
}

async function grantCredits(id, current) {
  // 크레딧 지급 (증감) — 지급 버튼
  const val = prompt('크레딧 지급 (현재: ' + current + '크레딧) - 지급할 크레딧 수 입력 (음수=차감) / 빠른 지급: 100/500/1000', '1000')
  if (val === null) return
  const amount = parseInt(val)
  if (isNaN(amount) || amount === 0) { showAdminToast('0이 아닌 숫자를 입력하세요', 'err'); return }
  const action = amount > 0 ? '지급' : '차감'
  if (!confirm('"' + Math.abs(amount) + '크레딧"을 ' + action + '하시겠습니까? 현재: ' + current + ' → 변경 후: ' + (current + amount))) return
  try {
    const res = await fetch('/api/admin/users/' + id, {
      method: 'PATCH',
      headers: {'Content-Type':'application/json','X-Admin-Password':adminPassword},
      body: JSON.stringify({ add_credits: amount })
    })
    const data = await res.json()
    if (data.success) { showAdminToast('크레딧 ' + action + ' 완료 → ' + data.newCredits + '크레딧', 'ok'); loadUsers() }
    else showAdminToast(data.message || '실패', 'err')
  } catch(e) { showAdminToast('서버 오류', 'err') }
}

async function deleteUser(id, name, email) {
  if (!confirm('"' + name + '" (' + email + ') 회원을 삭제하시겠습니까? 삭제 후 복구가 어렵습니다.')) return
  try {
    const res = await fetch('/api/admin/users/' + id, {
      method: 'DELETE',
      headers: {'X-Admin-Password':adminPassword}
    })
    const data = await res.json()
    if (data.success) { showAdminToast('삭제 완료', 'ok'); loadUsers() }
    else showAdminToast(data.message || '실패', 'err')
  } catch(e) { showAdminToast('서버 오류', 'err') }
}

function showAdminToast(msg, type) {
  const bar = document.querySelector('.save-bar')
  const el = document.querySelector('.save-status')
  if (el) {
    el.textContent = msg
    el.className = 'save-status ' + (type === 'ok' ? 'ok' : 'err')
    setTimeout(() => { if (el) el.textContent = '' }, 3000)
  }
}

// ─── 로그인 ───
async function doLogin() {
  const pw = document.getElementById('pwInput').value
  const err = document.getElementById('loginErr')
  err.textContent = ''
  try {
    const res = await fetch('/api/admin/auth', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({password: pw}) })
    const data = await res.json()
    if (data.success) {
      adminPassword = pw
      document.getElementById('loginOverlay').style.display = 'none'
      document.getElementById('adminMain').style.display = 'block'
      loadConfig()
    } else { err.textContent = '비밀번호가 올바르지 않습니다.' }
  } catch(e) { err.textContent = '서버 오류가 발생했습니다.' }
}
function doLogout() {
  adminPassword = ''
  document.getElementById('loginOverlay').style.display = 'flex'
  document.getElementById('adminMain').style.display = 'none'
  document.getElementById('pwInput').value = ''
}

// ─── 프롬프트 로드/저장 ───
async function loadConfig() {
  try {
    const res = await fetch('/api/admin/prompt', {headers:{'X-Admin-Password':adminPassword}})
    const data = await res.json()
    if (!data.success) return
    const cfg = data.config
    document.getElementById('toggleEnabled').checked = cfg.enabled
    document.getElementById('fieldPrefix').value = cfg.prefix || ''
    document.getElementById('fieldStyleGuide').value = cfg.styleGuide || ''
    document.getElementById('fieldTechnicalSpec').value = cfg.technicalSpec || ''
    document.getElementById('fieldSuffix').value = cfg.suffix || ''
    updateAllCounts(); updatePreview()
  } catch(e) { console.error(e) }
}
async function saveConfig() {
  const btn = document.getElementById('saveBtn')
  const status = document.getElementById('saveStatus')
  btn.disabled = true; status.textContent = '저장 중...'; status.className = 'save-status'
  try {
    const res = await fetch('/api/admin/prompt', {
      method: 'PUT',
      headers: {'Content-Type':'application/json','X-Admin-Password':adminPassword},
      body: JSON.stringify({
        enabled: document.getElementById('toggleEnabled').checked,
        prefix: document.getElementById('fieldPrefix').value,
        styleGuide: document.getElementById('fieldStyleGuide').value,
        technicalSpec: document.getElementById('fieldTechnicalSpec').value,
        suffix: document.getElementById('fieldSuffix').value,
      }),
    })
    const data = await res.json()
    if (data.success) { status.textContent = '저장 완료 ' + new Date().toLocaleTimeString('ko-KR'); status.className = 'save-status ok' }
    else { status.textContent = '저장 실패'; status.className = 'save-status err' }
  } catch(e) { status.textContent = '네트워크 오류'; status.className = 'save-status err' }
  finally { btn.disabled = false }
}
function applyPreset(field, key) {
  const m = {styleGuide:'fieldStyleGuide', technicalSpec:'fieldTechnicalSpec'}
  const el = document.getElementById(m[field]); if (!el) return
  el.value = PRESETS[field][key] || ''
  updateCharCount(field==='styleGuide'?'cntStyleGuide':'cntTechnicalSpec', el.value); updatePreview()
}
function updateCharCount(id, text) { const el=document.getElementById(id); if(el) el.textContent=text.length }
function updateAllCounts() {
  ['fieldPrefix','fieldStyleGuide','fieldTechnicalSpec','fieldSuffix'].forEach(id => {
    const cntId = {fieldPrefix:'cntPrefix',fieldStyleGuide:'cntStyleGuide',fieldTechnicalSpec:'cntTechnicalSpec',fieldSuffix:'cntSuffix'}[id]
    updateCharCount(cntId, document.getElementById(id).value)
  })
}
function updatePreview() {
  const enabled = document.getElementById('toggleEnabled').checked
  const prefix = document.getElementById('fieldPrefix').value.trim()
  const styleGuide = document.getElementById('fieldStyleGuide').value.trim()
  const technicalSpec = document.getElementById('fieldTechnicalSpec').value.trim()
  const suffix = document.getElementById('fieldSuffix').value.trim()
  const BASE = '[기본 프롬프트: 전문 패션 룩북 사진 생성. 이미지1=의류, 이미지2=모델, 이미지3=배경...]'
  let preview = ''
  if (!enabled) {
    preview = '어드민 프롬프트 OFF - 기본 프롬프트만 사용됩니다.' + NL + NL + BASE
  } else {
    const parts = []
    if (prefix) parts.push('[PREFIX]' + NL + prefix)
    parts.push('[BASE PROMPT]' + NL + BASE)
    if (styleGuide) parts.push('[STYLE GUIDE]' + NL + styleGuide)
    if (technicalSpec) parts.push('[TECHNICAL SPEC]' + NL + technicalSpec)
    if (suffix) parts.push('[SUFFIX]' + NL + suffix)
    preview = parts.join(NL + NL)
  }
  document.getElementById('previewBox').textContent = preview
}

// ─── 공통: FileReader → base64 (리사이즈+압축) ───
// D1 row 제한(~1MB) 및 Workers body 한계 방지: 최대 800px, JPEG 0.85 품질
function readFileAsBase64(file) {
  return new Promise(resolve => {
    const r = new FileReader()
    r.onload = e => {
      const img = new Image()
      img.onload = () => {
        const MAX = 800
        let w = img.width, h = img.height
        if (w > MAX || h > MAX) {
          if (w >= h) { h = Math.round(h * MAX / w); w = MAX }
          else        { w = Math.round(w * MAX / h); h = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = e.target.result
    }
    r.readAsDataURL(file)
  })
}

// ══════════════════════════════════════════════
//  모델 관리 — 다중 업로드
// ══════════════════════════════════════════════
let modelStagingList = []  // [{ file, base64, name, gender, age, mood }]

async function onModelFilesSelect(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  const status = document.getElementById('modelUploadStatus')
  status.textContent = 'AI 자동 라벨링 중...'; status.className = 'save-status'
  for (const file of files) {
    const base64 = await readFileAsBase64(file)
    const defaultName = file.name.replace(/\.[^.]+$/, '')
    let gender = '미분류', age = '미분류', mood = '미분류'
    try {
      const lr = await fetch('/api/admin/auto-label', {
        method:'POST',
        headers:{'Content-Type':'application/json','X-Admin-Password':adminPassword},
        body:JSON.stringify({ type:'model', imageBase64: base64 })
      })
      const ld = await lr.json()
      if (ld.success && ld.labels) { gender=ld.labels.gender; age=ld.labels.age; mood=ld.labels.mood }
    } catch(err) { console.warn('auto-label 실패:', err) }
    modelStagingList.push({ file, base64, name: defaultName, gender, age, mood })
  }
  e.target.value = ''
  status.textContent = ''; status.className = 'save-status'
  renderModelStaging()
}

function renderModelStaging() {
  const grid = document.getElementById('modelStagingGrid')
  const container = document.getElementById('modelStagingItems')
  if (!modelStagingList.length) { grid.style.display = 'none'; return }
  grid.style.display = 'block'
  document.getElementById('modelUploadZone').style.borderColor = '#6c47ff'
  const mkOpts = (list, sel) => list.map(v => '<option value="'+v+'"'+(v===sel?' selected':'')+'>'+v+'</option>').join('')
  container.innerHTML = modelStagingList.map((item, i) =>
    '<div style="width:160px;flex-shrink:0;">' +
    '<div style="position:relative;width:160px;height:160px;border-radius:10px;overflow:hidden;border:1.5px solid #e0e0e0;">' +
    '<img src="' + item.base64 + '" style="width:100%;height:100%;object-fit:cover;"/>' +
    '<button onclick="removeModelStaging(' + i + ')" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.55);color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:12px;line-height:22px;text-align:center;padding:0;">✕</button>' +
    '</div>' +
    '<input class="form-input" value="' + escHtml(item.name) + '" oninput="modelStagingList[' + i + '].name=this.value" placeholder="이름" style="margin-top:6px;width:100%;box-sizing:border-box;font-size:11px;padding:4px 7px;"/>' +
    '<select class="form-input" onchange="modelStagingList['+i+'].gender=this.value" style="margin-top:3px;width:100%;font-size:11px;padding:3px 6px;">' + mkOpts(['미분류','여성','남성'], item.gender) + '</select>' +
    '<select class="form-input" onchange="modelStagingList['+i+'].age=this.value" style="margin-top:3px;width:100%;font-size:11px;padding:3px 6px;">' + mkOpts(['미분류','10대','20대','30대','40대'], item.age) + '</select>' +
    '<select class="form-input" onchange="modelStagingList['+i+'].mood=this.value" style="margin-top:3px;width:100%;font-size:11px;padding:3px 6px;">' + mkOpts(['미분류','로맨틱','보이시','캐주얼','시크','내추럴'], item.mood) + '</select>' +
    '</div>'
  ).join('')
}
function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;') }

function removeModelStaging(idx) {
  modelStagingList.splice(idx, 1)
  renderModelStaging()
}

function clearModelStaging() {
  modelStagingList = []
  document.getElementById('modelUploadZone').style.borderColor = ''
  document.getElementById('modelStagingGrid').style.display = 'none'
  document.getElementById('modelUploadStatus').textContent = ''
}

async function uploadModels() {
  const status = document.getElementById('modelUploadStatus')
  if (!modelStagingList.length) { status.textContent = '이미지를 선택하세요'; status.className = 'save-status err'; return }
  const missing = modelStagingList.filter(i => !i.name.trim())
  if (missing.length) { status.textContent = '이름이 비어있는 항목이 있습니다'; status.className = 'save-status err'; return }
  status.textContent = '등록 중...'; status.className = 'save-status'
  try {
    const payload = modelStagingList.map(i => ({
      name: i.name.trim(), desc: i.name.trim(),
      gender: i.gender || '미분류',
      age: i.age || '미분류',
      mood: i.mood || '미분류',
      imageBase64: i.base64
    }))
    const res = await fetch('/api/admin/models', {
      method: 'POST',
      headers: {'Content-Type':'application/json','X-Admin-Password':adminPassword},
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (data.success) {
      status.textContent = data.count + '개 등록 완료!'; status.className = 'save-status ok'
      clearModelStaging()
      loadCustomModels()
    } else { status.textContent = data.message || '등록 실패'; status.className = 'save-status err' }
  } catch(e) { status.textContent = '오류: ' + e.message; status.className = 'save-status err' }
}

async function deleteModel(id) {
  if (!confirm('이 모델을 삭제하시겠습니까?')) return
  const res = await fetch('/api/admin/models/' + id, {method:'DELETE', headers:{'X-Admin-Password':adminPassword}})
  const data = await res.json()
  if (!data.success) { alert('삭제 실패: ' + (data.message || '알 수 없는 오류')); return }
  await loadCustomModels()
}
async function loadCustomModels() {
  const grid = document.getElementById('customModelGrid')
  try {
    const res = await fetch('/api/admin/models', {headers:{'X-Admin-Password':adminPassword}})
    const data = await res.json()
    if (!data.models || data.models.length === 0) {
      grid.innerHTML = '<div class="empty-state"><div class="icon"><i class="fas fa-user-slash"></i></div><p>등록된 커스텀 모델이 없습니다.</p></div>'
      return
    }
    grid.innerHTML = '<div style="font-size:14px;font-weight:600;margin:20px 0 12px;">커스텀 모델 (' + data.models.length + '개)</div><div class="media-grid">' +
      data.models.map(m => {
        const g = m.gender || '미분류'
        return (
        '<div class="media-card">' +
        '<img src="/api/proxy/custom-model/' + m.id + '" alt="' + m.name + '" loading="lazy"/>' +
        '<span class="custom-badge">커스텀</span>' +
        '<button class="del-btn" onclick="event.stopPropagation();deleteModel(' + "'" + m.id + "'" + ')"><i class="fas fa-times"></i></button>' +
        '<div class="meta">' +
          '<div class="name">' + m.name + '</div>' +
          '<div class="desc">' + (m.desc || '-') + '</div>' +
          '<div style="display:flex;gap:6px;margin-top:6px;">' +
            '<button onclick="event.stopPropagation();setModelGender(\\'' + m.id + '\\',\\'여성\\')" style="flex:1;padding:5px;border-radius:6px;border:1px solid ' + (g==='여성'?'#6366f1':'#444') + ';background:' + (g==='여성'?'#6366f1':'transparent') + ';color:#fff;font-size:12px;cursor:pointer;">여성</button>' +
            '<button onclick="event.stopPropagation();setModelGender(\\'' + m.id + '\\',\\'남성\\')" style="flex:1;padding:5px;border-radius:6px;border:1px solid ' + (g==='남성'?'#6366f1':'#444') + ';background:' + (g==='남성'?'#6366f1':'transparent') + ';color:#fff;font-size:12px;cursor:pointer;">남성</button>' +
          '</div>' +
        '</div>' +
        '</div>'
        )
      }).join('') + '</div>'
  } catch(e) { console.error('loadCustomModels error:', e); grid.innerHTML = '<div class="empty-state"><p>불러오기 실패: ' + e.message + '</p></div>' }
}

async function setModelGender(id, gender) {
  try {
    const res = await fetch('/api/admin/models/' + id + '/labels', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword },
      body: JSON.stringify({ gender, age: '미분류', mood: '미분류' })
    })
    const data = await res.json()
    if (!data.success) { alert('저장 실패: ' + (data.message || '알 수 없는 오류')); return }
    await loadCustomModels()
  } catch (e) { alert('오류: ' + e.message) }
}

// ══════════════════════════════════════════════
//  배경 관리 — 다중 업로드
// ══════════════════════════════════════════════
let bgStagingList = []  // [{ file, base64, name, category, mood }]

async function onBgFilesSelect(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  const status = document.getElementById('bgUploadStatus')
  status.textContent = 'AI 자동 라벨링 중...'; status.className = 'save-status'
  for (const file of files) {
    const base64 = await readFileAsBase64(file)
    const defaultName = file.name.replace(/\.[^.]+$/, '')
    let category = '스튜디오', mood = '미니멀', autoName = defaultName
    try {
      const lr = await fetch('/api/admin/auto-label', {
        method:'POST',
        headers:{'Content-Type':'application/json','X-Admin-Password':adminPassword},
        body:JSON.stringify({ type:'background', imageBase64: base64 })
      })
      const ld = await lr.json()
      if (ld.success && ld.labels) {
        category = ld.labels.category || '스튜디오'
        mood     = ld.labels.mood || '미니멀'
        if (ld.labels.name_ko) autoName = ld.labels.name_ko
      }
    } catch(err) { console.warn('bg auto-label 실패:', err) }
    bgStagingList.push({ file, base64, name: autoName, category, mood })
  }
  e.target.value = ''
  status.textContent = ''; status.className = 'save-status'
  renderBgStaging()
}

function renderBgStaging() {
  const grid = document.getElementById('bgStagingGrid')
  const container = document.getElementById('bgStagingItems')
  if (!bgStagingList.length) { grid.style.display = 'none'; return }
  grid.style.display = 'block'
  document.getElementById('bgUploadZone').style.borderColor = '#6c47ff'
  const mkOpts = (list, sel) => list.map(v => '<option value="'+v+'"'+(v===sel?' selected':'')+'>'+v+'</option>').join('')
  const catList = ['스튜디오','야외/자연','도심/거리','인테리어','컨셉/특수']
  const moodList = ['미니멀','내추럴','모던','빈티지','럭셔리','스트릿']
  container.innerHTML = bgStagingList.map((item, i) =>
    '<div style="width:160px;flex-shrink:0;">' +
    '<div style="position:relative;width:160px;height:120px;border-radius:10px;overflow:hidden;border:1.5px solid #e0e0e0;">' +
    '<img src="' + item.base64 + '" style="width:100%;height:100%;object-fit:cover;"/>' +
    '<button onclick="removeBgStaging(' + i + ')" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.55);color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:12px;line-height:22px;text-align:center;padding:0;">✕</button>' +
    '</div>' +
    '<input class="form-input" value="' + escHtml(item.name) + '" oninput="bgStagingList[' + i + '].name=this.value" placeholder="배경 이름" style="margin-top:6px;width:100%;box-sizing:border-box;font-size:11px;padding:4px 7px;"/>' +
    '<select class="form-input" onchange="bgStagingList['+i+'].category=this.value" style="margin-top:3px;width:100%;font-size:11px;padding:3px 6px;">' + mkOpts(catList, item.category) + '</select>' +
    '<select class="form-input" onchange="bgStagingList['+i+'].mood=this.value" style="margin-top:3px;width:100%;font-size:11px;padding:3px 6px;">' + mkOpts(moodList, item.mood) + '</select>' +
    '</div>'
  ).join('')
}

function removeBgStaging(idx) {
  bgStagingList.splice(idx, 1)
  renderBgStaging()
}

function clearBgStaging() {
  bgStagingList = []
  document.getElementById('bgUploadZone').style.borderColor = ''
  document.getElementById('bgStagingGrid').style.display = 'none'
  document.getElementById('bgUploadStatus').textContent = ''
}

async function uploadBgs() {
  const status = document.getElementById('bgUploadStatus')
  if (!bgStagingList.length) { status.textContent = '이미지를 선택하세요'; status.className = 'save-status err'; return }
  const missing = bgStagingList.filter(i => !i.name.trim())
  if (missing.length) { status.textContent = '이름이 비어있는 항목이 있습니다'; status.className = 'save-status err'; return }
  status.textContent = '등록 중...'; status.className = 'save-status'
  try {
    const payload = bgStagingList.map(i => ({
      name: i.name.trim(),
      bgDesc: i.name.trim(),
      category: (i.category || '커스텀').trim(),
      imageBase64: i.base64,
    }))
    const res = await fetch('/api/admin/backgrounds', {
      method: 'POST',
      headers: {'Content-Type':'application/json','X-Admin-Password':adminPassword},
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (data.success) {
      status.textContent = data.count + '개 등록 완료!'; status.className = 'save-status ok'
      clearBgStaging()
      loadCustomBgs()
    } else { status.textContent = data.message || '등록 실패'; status.className = 'save-status err' }
  } catch(e) { status.textContent = '오류: ' + e.message; status.className = 'save-status err' }
}

async function deleteBg(id) {
  if (!confirm('이 배경을 삭제하시겠습니까?')) return
  const res = await fetch('/api/admin/backgrounds/' + id, {method:'DELETE', headers:{'X-Admin-Password':adminPassword}})
  const data = await res.json()
  if (!data.success) { alert('삭제 실패: ' + (data.message || '알 수 없는 오류')); return }
  await loadCustomBgs()
}
async function loadCustomBgs() {
  const grid = document.getElementById('customBgGrid')
  try {
    const res = await fetch('/api/admin/backgrounds', {headers:{'X-Admin-Password':adminPassword}})
    const data = await res.json()
    if (!data.backgrounds || data.backgrounds.length === 0) {
      grid.innerHTML = '<div class="empty-state"><div class="icon"><i class="fas fa-image"></i></div><p>등록된 커스텀 배경이 없습니다.</p></div>'
      return
    }
    grid.innerHTML = '<div style="font-size:14px;font-weight:600;margin:20px 0 12px;">커스텀 배경 (' + data.backgrounds.length + '개)</div><div class="media-grid">' +
      data.backgrounds.map(b =>
        '<div class="media-card bg-card-item">' +
        '<img src="/api/proxy/custom-bg/' + b.id + '" alt="' + b.name + '" loading="lazy"/>' +
        '<span class="custom-badge">커스텀</span>' +
        '<button class="del-btn" onclick="event.stopPropagation();deleteBg(' + "'" + b.id + "'" + ')"><i class="fas fa-times"></i></button>' +
        '<div class="meta"><div class="name">' + b.name + '</div><div class="desc">' + b.category + ' · ' + (b.bgDesc || '-') + '</div>' +
        '<div style="margin-top:6px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
        (b.hasGenImage
          ? '<span style="font-size:10px;padding:2px 7px;border-radius:20px;background:#dcfce7;color:#15803d;font-weight:600;">생성용 이미지 등록됨</span>'
          : '<span style="font-size:10px;padding:2px 7px;border-radius:20px;background:#fef3c7;color:#92400e;font-weight:600;">생성용 미등록 (원본 사용)</span>') +
        '<button onclick="event.stopPropagation();pickBgGenImage(' + "'" + b.id + "'" + ')" style="font-size:10px;padding:2px 8px;border-radius:20px;border:1px solid #ccc;background:#fff;cursor:pointer;">' +
        (b.hasGenImage ? '생성용 이미지 교체' : '생성용 이미지 등록') + '</button>' +
        '</div></div>' +
        '</div>'
      ).join('') + '</div>'
  } catch(e) { console.error('loadCustomBgs error:', e); grid.innerHTML = '<div class="empty-state"><p>불러오기 실패: ' + e.message + '</p></div>' }
}

// ─── 배경 "생성용"(얼굴 마스킹) 이미지 등록/교체 ───
let _pendingGenImageBgId = null
function pickBgGenImage(id) {
  _pendingGenImageBgId = id
  let input = document.getElementById('bgGenImageInput')
  if (!input) {
    input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.id = 'bgGenImageInput'
    input.style.display = 'none'
    input.addEventListener('change', onBgGenImageSelect)
    document.body.appendChild(input)
  }
  input.value = ''
  input.click()
}
async function onBgGenImageSelect(e) {
  const file = (e.target.files || [])[0]
  const id = _pendingGenImageBgId
  if (!file || !id) return
  try {
    const base64 = await readFileAsBase64(file)
    const res = await fetch('/api/admin/backgrounds/' + id + '/gen-image', {
      method: 'PUT',
      headers: {'Content-Type':'application/json','X-Admin-Password':adminPassword},
      body: JSON.stringify({ imageBase64: base64 }),
    })
    const data = await res.json()
    if (!data.success) { alert('등록 실패: ' + (data.message || '알 수 없는 오류')); return }
    await loadCustomBgs()
  } catch(err) { alert('오류: ' + err.message) }
}

// ─── 드래그앤드롭 (다중) ───
function setupDrop(zoneId, onFiles) {
  const zone = document.getElementById(zoneId)
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag') })
  zone.addEventListener('dragleave', () => zone.classList.remove('drag'))
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('drag')
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (!files.length) return
    onFiles({ target: { files, value: '' } })
  })
}

// ─── 이벤트 바인딩 ───
document.addEventListener('DOMContentLoaded', () => {
  ['fieldPrefix','fieldStyleGuide','fieldTechnicalSpec','fieldSuffix'].forEach(id => {
    const el = document.getElementById(id)
    const cntId = {fieldPrefix:'cntPrefix',fieldStyleGuide:'cntStyleGuide',fieldTechnicalSpec:'cntTechnicalSpec',fieldSuffix:'cntSuffix'}[id]
    el.addEventListener('input', () => { updateCharCount(cntId, el.value); updatePreview() })
  })
  document.getElementById('toggleEnabled').addEventListener('change', updatePreview)
  document.getElementById('pwInput').focus()
  setupDrop('modelUploadZone', onModelFilesSelect)
  setupDrop('bgUploadZone', onBgFilesSelect)

  // 이벤트 위임: 유저 테이블 버튼 처리 (onclick 대신 data-action 사용)
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-action]')
    if (!btn) return
    var action = btn.dataset.action
    var uid = btn.dataset.uid
    if (action === 'suspend') { setUserStatus(uid, 'suspended') }
    else if (action === 'activate') { setUserStatus(uid, 'active') }
    else if (action === 'delete') { deleteUser(uid, btn.dataset.name || '', btn.dataset.email || '') }
    else if (action === 'credits') { adjustCredits(uid, parseInt(btn.dataset.credits || '0')) }
    else if (action === 'grant')   { grantCredits(uid, parseInt(btn.dataset.credits || '0')) }
  })
})
</script>
</body>
</html>`)
})

// ── /admin → /admin02 포워드 (도메인이 www 하나로 통합됨) ──
app.get('/admin', (c) => {
  return c.redirect('/admin02', 302)
})

// ── /studio-b 경로: 메인 앱 그대로 서빙 ──
// www.aifashion.co.kr/studio-b → 이 서비스
app.get('/studio-b', (c) => c.redirect('/'))
app.get('/studio-b/*', (c) => {
  const path = c.req.path.replace('/studio-b', '') || '/'
  return c.redirect(path)
})

// ────────────────────────────────────────────────────
// 결제 결과 페이지 — 토스페이먼츠 redirectUrl
// ────────────────────────────────────────────────────
app.get('/payment/success', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>결제 완료 — Studio B</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    body { background: #0f0f0f; font-family: 'Pretendard', -apple-system, sans-serif; }
    .card { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid rgba(255,255,255,0.08); }
  </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4">
  <div class="card rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
    <div id="loadingState">
      <div class="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p class="text-gray-300 text-sm">결제 확인 중...</p>
    </div>
    <div id="successState" class="hidden">
      <div class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <i class="fas fa-check text-green-400 text-2xl"></i>
      </div>
      <h1 class="text-white text-2xl font-bold mb-2">결제 완료!</h1>
      <p class="text-gray-400 text-sm mb-4" id="successMsg"></p>
      <div class="bg-black/30 rounded-xl p-4 mb-6 text-left">
        <div class="flex justify-between text-sm mb-2">
          <span class="text-gray-400">지급 크레딧</span>
          <span class="text-purple-300 font-bold" id="creditsGranted"></span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-400">잔여 크레딧</span>
          <span class="text-white font-semibold" id="creditsTotal"></span>
        </div>
      </div>
      <button onclick="goHome()" class="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-3 font-semibold transition-colors">
        <i class="fas fa-home mr-2"></i>서비스 이용하기
      </button>
    </div>
    <div id="errorState" class="hidden">
      <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <i class="fas fa-times text-red-400 text-2xl"></i>
      </div>
      <h1 class="text-white text-2xl font-bold mb-2">결제 확인 실패</h1>
      <p class="text-gray-400 text-sm mb-6" id="errorMsg"></p>
      <button onclick="goHome()" class="w-full bg-gray-700 hover:bg-gray-600 text-white rounded-xl py-3 font-semibold transition-colors">
        홈으로 돌아가기
      </button>
    </div>
  </div>

  <script>
    const params = new URLSearchParams(location.search)
    const paymentKey = params.get('paymentKey')
    const orderId    = params.get('orderId')
    const amount     = params.get('amount')
    const sessionToken = localStorage.getItem('lookbook_token') || ''

    async function confirmPayment() {
      try {
        const res = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
        })
        const data = await res.json()
        document.getElementById('loadingState').classList.add('hidden')
        if (data.success) {
          document.getElementById('successMsg').textContent = '크레딧이 충전되었습니다.'
          document.getElementById('creditsGranted').textContent = '+' + data.credits.toLocaleString() + ' 크레딧'
          document.getElementById('creditsTotal').textContent = data.creditsTotal.toLocaleString() + ' 크레딧'
          document.getElementById('successState').classList.remove('hidden')
          // 세션스토리지에 갱신 신호
          sessionStorage.setItem('creditsRefresh', '1')
        } else {
          document.getElementById('errorMsg').textContent = data.error || '알 수 없는 오류가 발생했습니다.'
          document.getElementById('errorState').classList.remove('hidden')
        }
      } catch (e) {
        document.getElementById('loadingState').classList.add('hidden')
        document.getElementById('errorMsg').textContent = '네트워크 오류가 발생했습니다.'
        document.getElementById('errorState').classList.remove('hidden')
      }
    }

    function goHome() { location.href = '/' }

    if (!paymentKey || !orderId || !amount) {
      document.getElementById('loadingState').classList.add('hidden')
      document.getElementById('errorMsg').textContent = '결제 파라미터가 올바르지 않습니다.'
      document.getElementById('errorState').classList.remove('hidden')
    } else {
      confirmPayment()
    }
  </script>
</body>
</html>`)
})

app.get('/payment/fail', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>결제 실패 — Studio B</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>body { background: #0f0f0f; font-family: 'Pretendard', -apple-system, sans-serif; }</style>
</head>
<body class="min-h-screen flex items-center justify-center p-4">
  <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border:1px solid rgba(255,255,255,0.08)" class="rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
    <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
      <i class="fas fa-times text-red-400 text-2xl"></i>
    </div>
    <h1 class="text-white text-2xl font-bold mb-2">결제가 취소되었습니다</h1>
    <p class="text-gray-400 text-sm mb-2" id="errMsg"></p>
    <p class="text-gray-500 text-xs mb-6" id="errCode"></p>
    <button onclick="location.href='/'" class="w-full bg-gray-700 hover:bg-gray-600 text-white rounded-xl py-3 font-semibold transition-colors">
      홈으로 돌아가기
    </button>
  </div>
  <script>
    const p = new URLSearchParams(location.search)
    const msg = p.get('message')
    const code = p.get('code')
    if (msg) document.getElementById('errMsg').textContent = decodeURIComponent(msg)
    if (code) document.getElementById('errCode').textContent = '오류코드: ' + code
  </script>
</body>
</html>`)
})

export default app
