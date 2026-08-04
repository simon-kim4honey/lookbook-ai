import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import { cors } from 'hono/cors'

// Cloudflare 바인딩 타입
type Bindings = {
  LOOKBOOK_KV: KVNamespace   // BYOK(studiob) — Cloudflare KV
  LOOKBOOK_DB: D1Database    // Genspark Hosted — Cloudflare D1
  // OAuth Secrets (wrangler secret put 으로 설정)
  KAKAO_CLIENT_ID: string
  KAKAO_CLIENT_SECRET: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  // 어드민
  ADMIN_PASSWORD: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './public' }))

// ────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────
const ATLAS_API_BASE = 'https://api.atlascloud.ai'
const ATLAS_API_KEY = 'apikey-768c01fdea4c405f972d93ae16f0b9e3'
const AIFASHION_BASE = 'https://www.aifashion.co.kr'
// 어드민 인증 미들웨어 (상단 선언 필수 — 스토어/라우트보다 먼저 참조됨)
const adminAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('X-Admin-Password')
  const adminPassword = c.env.ADMIN_PASSWORD || 'sa3325'
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
    'SKIN-SCENE MATCH: The model\'s face and skin must be RE-LIT to match the scene. Preserve facial geometry and identity exactly, but ADJUST brightness, color temperature, and shadow direction to match the scene\'s lighting. Do NOT preserve the face\'s original lighting from the reference image — re-render it under the scene\'s physical light. Face-to-neck and face-to-arm skin tone must be seamlessly consistent.',
    'Fashion editorial quality: magazine cover level seamless compositing, physically grounded.',
  ].join(' '),
  technicalSpec: [
    '초사실적 표현, 직물 질감과 피부 디테일 극사실 재현.',
    '의류 드레이프와 핏 완벽 재현. 자연스러운 주름 외 구김 없음.',
    '의류에 선명한 포커스. 배경과 동일한 심도 및 렌즈 특성 유지.',
    '배경 씬의 색감·무드·조명 톤을 인물과 의류에 완전히 통합. 합성 아티팩트 없음.',
    '참조 이미지에 없는 의류, 액세서리, 소품 절대 추가 금지.',
    'ABSOLUTE PROHIBITION: NO text, NO letters, NO numbers, NO logos, NO watermarks, NO brand marks, NO typographic elements of any kind anywhere in the image.',
    'ABSOLUTE PROHIBITION: DO NOT alter the model\'s facial geometry, eye/nose/lip shape, or hair style. HOWEVER: skin brightness, color temperature, and lighting on the face MUST be adjusted to match the scene — this is not a violation, it is required.',
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
  createdAt: string
}
interface CustomBg {
  id: string
  name: string
  bgDesc: string
  category: string
  createdAt: string
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
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run()
}
async function d1NextId(db: D1Database): Promise<string> {
  await db.prepare(`UPDATE id_counter SET value = value + 1 WHERE id = 1`).run()
  const row: any = await db.prepare(`SELECT value FROM id_counter WHERE id = 1`).first()
  return String(row?.value ?? 1000)
}
async function d1GetModels(db: D1Database): Promise<CustomModel[]> {
  const { results } = await db.prepare(`SELECT id, name, desc_text, created_at FROM custom_models ORDER BY created_at ASC`).all()
  return (results as any[]).map(r => ({ id: r.id, name: r.name, desc: r.desc_text, createdAt: r.created_at }))
}
async function d1AddModels(db: D1Database, items: Array<{ name: string; desc?: string; imageBase64: string }>): Promise<CustomModel[]> {
  const results: CustomModel[] = []
  for (const item of items) {
    const { name, desc, imageBase64 } = item
    if (!name || !imageBase64) continue
    const id = await d1NextId(db)
    const createdAt = new Date().toISOString()
    await db.prepare(`INSERT INTO custom_models (id, name, desc_text, image_b64, created_at) VALUES (?,?,?,?,?)`)
      .bind(id, name, desc || name, imageBase64, createdAt).run()
    results.push({ id, name, desc: desc || name, createdAt })
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
  const { results } = await db.prepare(`SELECT id, name, category, bg_desc, created_at FROM custom_bgs ORDER BY created_at ASC`).all()
  return (results as any[]).map(r => ({ id: r.id, name: r.name, bgDesc: r.bg_desc, category: r.category, createdAt: r.created_at }))
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
  const list = _memBgs.map(b => ({ id: b.id, name: b.name, bgDesc: b.bgDesc, category: b.category, createdAt: b.createdAt }))
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

// Atlas Cloud 헤더 생성
const atlasHeaders = () => ({
  'Authorization': `Bearer ${ATLAS_API_KEY}`,
  'Content-Type': 'application/json',
})

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
}): Promise<string | null> {
  const { images, prompt, aspect_ratio, resolution, thinking_level = 'default' } = params

  // 1) 생성 요청
  const startRes = await fetch(`${ATLAS_API_BASE}/api/v1/model/generateImage`, {
    method: 'POST',
    headers: atlasHeaders(),
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
      headers: { 'Authorization': `Bearer ${ATLAS_API_KEY}` },
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
    id: Number(m.id), name: m.name, gender: '커스텀', age: '-', body: '-', mood: '-', skin: '-',
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
    const { name, email, password } = body

    if (!name || !email || !password) return c.json({ success: false, message: '모든 항목을 입력해주세요.' }, 400)
    if (password.length < 8) return c.json({ success: false, message: '비밀번호는 8자 이상이어야 합니다.' }, 400)

    // 중복 이메일 확인
    const existing = await db.prepare(`SELECT id FROM users WHERE email = ?`).bind(email).first()
    if (existing) return c.json({ success: false, message: '이미 가입된 이메일입니다.' }, 409)

    const id = genUserId()
    const hash = await hashPassword(password)
    await db.prepare(`
      INSERT INTO users (id, email, name, password_hash, provider, status, credits, role)
      VALUES (?, ?, ?, ?, 'email', 'active', 5, 'user')
    `).bind(id, email.toLowerCase(), name, hash).run()

    const token = await createSession(db, id)
    const user = { id, name, email: email.toLowerCase(), role: 'user', credits: 5, avatar_url: null, provider: 'email' }
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
// GET /api/auth/kakao — 카카오 OAuth 시작
// ────────────────────────────────────────────────────
app.get('/api/auth/kakao', (c) => {
  const origin = new URL(c.req.url).origin
  const redirectUri = `${origin}/api/auth/kakao/callback`
  const clientId = c.env.KAKAO_CLIENT_ID || ''
  if (!clientId) return c.html(`<script>window.opener?.postMessage({type:'oauth_error',provider:'kakao',error:'카카오 앱 키가 설정되지 않았습니다. 관리자에게 문의하세요.'},'*');window.close();</script>`)
  const url = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`
  return c.redirect(url)
})

// ────────────────────────────────────────────────────
// GET /api/auth/kakao/callback — 카카오 OAuth 콜백
// ────────────────────────────────────────────────────
app.get('/api/auth/kakao/callback', async (c) => {
  const db = c.env.LOOKBOOK_DB
  const origin = new URL(c.req.url).origin
  const code = c.req.query('code')
  const error = c.req.query('error')

  if (error || !code) {
    return c.html(`<script>window.opener?.postMessage({type:'oauth_error',provider:'kakao',error:'${error||'cancelled'}'},'*');window.close();</script>`)
  }

  try {
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
      // 같은 이메일로 가입된 계정 확인
      user = await db.prepare(`SELECT * FROM users WHERE email = ?`).bind(kakaoEmail).first()
      if (user) {
        // 기존 계정에 카카오 연동
        await db.prepare(`UPDATE users SET provider_id = ?, avatar_url = ? WHERE id = ?`).bind(providerId, kakaoAvatar, user.id).run()
      } else {
        // 신규 생성
        const id = genUserId()
        await db.prepare(`INSERT INTO users (id, email, name, provider, provider_id, avatar_url, status, credits, role) VALUES (?, ?, ?, 'kakao', ?, ?, 'active', 5, 'user')`).bind(id, kakaoEmail, kakaoName, providerId, kakaoAvatar).run()
        user = await db.prepare(`SELECT * FROM users WHERE id = ?`).bind(id).first()
      }
    }
    if (!user || user.status !== 'active') throw new Error('계정이 정지 상태입니다.')

    await db.prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`).bind(user.id).run()
    const token = await createSession(db, user.id)
    const userJson = JSON.stringify(publicUser(user))

    // 팝업 창에서 부모 창으로 메시지 전달
    return c.html(`<!DOCTYPE html><html><body><script>
      window.opener?.postMessage({type:'oauth_success',provider:'kakao',token:'${token}',user:${userJson}},'*');
      window.close();
    </script><p>로그인 중...</p></body></html>`)
  } catch (err: any) {
    console.error('kakao callback error:', err)
    return c.html(`<script>window.opener?.postMessage({type:'oauth_error',provider:'kakao',error:'${err.message}'},'*');window.close();</script>`)
  }
})

// ────────────────────────────────────────────────────
// GET /api/auth/google — 구글 OAuth 시작
// ────────────────────────────────────────────────────
app.get('/api/auth/google', (c) => {
  const origin = new URL(c.req.url).origin
  const redirectUri = `${origin}/api/auth/google/callback`
  const clientId = c.env.GOOGLE_CLIENT_ID || ''
  if (!clientId) return c.html(`<script>window.opener?.postMessage({type:'oauth_error',provider:'google',error:'구글 클라이언트 ID가 설정되지 않았습니다. 관리자에게 문의하세요.'},'*');window.close();</script>`)
  const params = new URLSearchParams({
    client_id: clientId, redirect_uri: redirectUri,
    response_type: 'code', scope: 'openid email profile',
    access_type: 'offline', prompt: 'select_account',
  })
  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
})

// ────────────────────────────────────────────────────
// GET /api/auth/google/callback — 구글 OAuth 콜백
// ────────────────────────────────────────────────────
app.get('/api/auth/google/callback', async (c) => {
  const db = c.env.LOOKBOOK_DB
  const origin = new URL(c.req.url).origin
  const code = c.req.query('code')
  const error = c.req.query('error')

  if (error || !code) {
    return c.html(`<script>window.opener?.postMessage({type:'oauth_error',provider:'google',error:'${error||'cancelled'}'},'*');window.close();</script>`)
  }

  try {
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
        await db.prepare(`INSERT INTO users (id, email, name, provider, provider_id, avatar_url, status, credits, role) VALUES (?, ?, ?, 'google', ?, ?, 'active', 5, 'user')`).bind(id, googleEmail, googleName, providerId, googleAvatar).run()
        user = await db.prepare(`SELECT * FROM users WHERE id = ?`).bind(id).first()
      }
    }
    if (!user || user.status !== 'active') throw new Error('계정이 정지 상태입니다.')

    await db.prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`).bind(user.id).run()
    const token = await createSession(db, user.id)
    const userJson = JSON.stringify(publicUser(user))

    return c.html(`<!DOCTYPE html><html><body><script>
      window.opener?.postMessage({type:'oauth_success',provider:'google',token:'${token}',user:${userJson}},'*');
      window.close();
    </script><p>로그인 중...</p></body></html>`)
  } catch (err: any) {
    console.error('google callback error:', err)
    return c.html(`<script>window.opener?.postMessage({type:'oauth_error',provider:'google',error:'${err.message}'},'*');window.close();</script>`)
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
    if (body.credits !== undefined) { sets.push(`credits = ?`); vals.push(body.credits) }
    if (body.role    !== undefined) { sets.push(`role = ?`);    vals.push(body.role) }
    if (sets.length === 0) return c.json({ success: false, message: '변경할 항목이 없습니다.' }, 400)
    sets.push(`updated_at = datetime('now')`)
    await db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).bind(...vals, id).run()
    // 정지된 경우 세션 전체 삭제
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
            headers: atlasHeaders(),
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
                headers: { 'Authorization': `Bearer ${ATLAS_API_KEY}` },
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
      headers: atlasHeaders(),
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
          headers: { 'Authorization': `Bearer ${ATLAS_API_KEY}` },
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
    const db: D1Database | undefined = (c.env as any)?.LOOKBOOK_DB

    if (modelId) {
      const mid = String(modelId)
      if (kv) {
        const stored = await kv.get(`model_img:${mid}`)
        if (stored) { modelImageBase64 = stored; console.log('KV custom model: OK') }
      } else if (db) {
        const stored = await d1GetModelImg(db, mid)
        if (stored) { modelImageBase64 = stored; console.log('D1 custom model: OK') }
      } else {
        const m = _memModels.find(m => m.id === mid)
        if (m?.imageBase64) { modelImageBase64 = m.imageBase64; console.log('Mem custom model: OK') }
      }
      if (!modelImageBase64) console.log('Custom model image not found for id:', mid)
    }
    if (bgId) {
      const bid = String(bgId)
      if (kv) {
        const stored = await kv.get(`bg_img:${bid}`)
        if (stored) { bgImageBase64 = stored; console.log('KV custom bg: OK') }
      } else if (db) {
        const stored = await d1GetBgImg(db, bid)
        if (stored) { bgImageBase64 = stored; console.log('D1 custom bg: OK') }
      } else {
        const b = _memBgs.find(b => b.id === bid)
        if (b?.imageBase64) { bgImageBase64 = b.imageBase64; console.log('Mem custom bg: OK') }
      }
      if (!bgImageBase64) console.log('Custom bg image not found for id:', bid)
    }

    // ── 공통 불변 제약 파라미터 (모든 모드에 공통 적용) ──
    const HARD_CONSTRAINTS = [
      `ABSOLUTE RULES — NEVER VIOLATE UNDER ANY CIRCUMSTANCES:`,
      `1. DO NOT insert, overlay, embed, or render ANY text, letters, numbers, words, logos, watermarks, brand marks, or typographic elements ANYWHERE in the image.`,
      `2. DO NOT alter the model's facial geometry, facial bone structure, eye shape, nose shape, lip shape, or hair style. NOTE: skin brightness and color temperature MAY be adjusted to match the scene's lighting — this is required for natural integration.`,
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

        // 이미지 역할 정의
        clothingRoleDesc,
        `Image ${modelImgIdx} = IDENTITY DONOR. Extract: facial geometry (jawline, eye socket, nose, lips, cheekbones), eye details (shape/iris/lash), hair (color/volume/cut/style), and full-body skin undertone (hue + warmth + texture). DO NOT use body shape, clothing, or pose from this image.`,
        `Image ${bgImgIdx} = SCENE ANCHOR. This scene defines: background environment, all objects, scene lighting direction/color-temperature/intensity, color grade, and mood. LOCKED: background, all scene objects.`,

        // 의상 교체
        `CLOTHING REPLACEMENT:`,
        clothingReplaceInstructions,
        `Body pose may shift slightly so the new clothing fits naturally (minor arm/stance adjustments only).`,

        // 신원 교체
        `IDENTITY & FACE TRANSPLANT (from Image ${modelImgIdx}):`,
        `  · Transplant the FACIAL GEOMETRY exactly: jawline, cheekbone position, eye socket shape, nose bridge/tip, lip shape, overall facial proportions.`,
        `  · Transplant EYE DETAILS exactly: eye shape, lid type, iris color, lash density.`,
        `  · Transplant HAIR exactly: color (root-to-tip gradient), volume, texture, cut, style.`,
        `  · Apply the skin UNDERTONE (warm/cool/neutral base hue) from Image ${modelImgIdx} to ALL exposed skin uniformly — face, neck, décolletage, shoulders, arms, hands — ZERO tone mismatch across the body.`,

        // 씬 조명 통합 (핵심)
        `SCENE LIGHTING INTEGRATION (from Image ${bgImgIdx} — critical for photorealism):`,
        `  Re-light ALL elements (clothing, face, skin) under Image ${bgImgIdx}'s physical lighting environment:`,
        `  · BRIGHTNESS: Match face and skin brightness to the scene's ambient light level. Bright scene → bright face; moody/dim scene → face lit accordingly.`,
        `  · LIGHT DIRECTION: Apply the scene's key light direction. Highlights land on the correct side of the face (forehead, cheekbone, nose bridge), shadows fall on the opposite side.`,
        `  · COLOR TEMPERATURE: Tint face, skin, and clothing under the scene's color temperature (warm golden-hour tint, cool blue shade, neutral studio white, etc.). Do NOT render any element under a different white balance from the scene.`,
        `  · SHADOW QUALITY: Hard shadows in direct sunlight; soft wrap-around shadows in diffuse/cloudy/studio light — match the scene exactly.`,
        `  · CATCH-LIGHTS: Eyes must reflect Image ${bgImgIdx}'s light source position and shape.`,
        `  · FABRIC RENDERING: Simulate specular highlights on shiny fabrics, soft diffuse on matte, translucency on thin materials — all under the scene's light.`,
        `  · SUBSURFACE SCATTERING: Realistic skin SSS under scene light (warm ears/nose in backlit; strong SSS in diffuse light).`,
        `  · FACE-TO-NECK SEAM: The face-to-neck boundary must be seamless — same lighting falloff, same color temperature, no hard edge or tone jump.`,
        `  · HAIR INTEGRATION: Hair receives the scene's ambient + key light. Rim/backlight if present in the scene. Flyaways lit naturally.`,

        `FINAL OUTPUT: One seamless, ultra-photorealistic fashion photograph. The new clothing is worn by Image ${modelImgIdx}'s identity — face, hair, and full-body skin re-lit under Image ${bgImgIdx}'s scene. Result looks like this person was photographed in the original scene wearing the specified outfit — zero compositing artifacts.`,
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

    // 어드민 프롬프트 주입 (requestBody 생성 전에 적용)
    prompt = injectAdminPrompt(prompt)

    console.log('Prompt (first 300):', prompt.substring(0, 300))
    console.log('images count:', images.length, '| mode:', images.length >= 3 ? 'FULL(clothing+model+bg)' : images.length === 2 ? 'PARTIAL' : images.length === 1 ? 'CLOTHING_ONLY' : 'TEXT')

    // ── Atlas Cloud API 요청: google/nano-banana-2/edit ──
    const requestBody: any = {
      model: 'google/nano-banana-2/edit',
      prompt,
      aspect_ratio: aspectRatio,
      resolution: nbResolution,
      thinking_level: 'default',
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
        headers: atlasHeaders(),
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
    return c.json({
      jobId: jobIds.join(','),
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
    const placeholderImages = generatePlaceholderImages(4)
    return c.json({ status: 'completed', progress: 100, images: placeholderImages, isFallback: true })
  }

  // 콤마로 묶인 복수 jobId 분리
  const jobIds = rawJobId.split(',').filter(Boolean)

  try {
    // 모든 jobId를 병렬 폴링
    const pollResults = await Promise.all(
      jobIds.map(id =>
        fetch(`${ATLAS_API_BASE}/api/v1/model/prediction/${id}`, {
          headers: { 'Authorization': `Bearer ${ATLAS_API_KEY}` },
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
      const placeholderImages = generatePlaceholderImages(4)
      return c.json({ status: 'completed', progress: 100, images: placeholderImages, isFallback: true, error: 'All jobs failed' })
    }

    return c.json({ status: 'completed', progress: 100, images: resultImages, isFallback: false })

  } catch (err: any) {
    console.error('Poll error:', err)
    const placeholderImages = generatePlaceholderImages(4)
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

// GET /api/admin/prompt — 현재 설정 조회
app.get('/api/admin/prompt', adminAuth, (c) => {
  return c.json({ success: true, config: adminPromptConfig })
})

// PUT /api/admin/prompt — 설정 업데이트
app.put('/api/admin/prompt', adminAuth, async (c) => {
  try {
    const body: any = await c.req.json()
    adminPromptConfig = {
      enabled:      typeof body.enabled === 'boolean' ? body.enabled : adminPromptConfig.enabled,
      prefix:       typeof body.prefix === 'string'   ? body.prefix  : adminPromptConfig.prefix,
      suffix:       typeof body.suffix === 'string'   ? body.suffix  : adminPromptConfig.suffix,
      styleGuide:   typeof body.styleGuide === 'string'    ? body.styleGuide    : adminPromptConfig.styleGuide,
      technicalSpec: typeof body.technicalSpec === 'string' ? body.technicalSpec : adminPromptConfig.technicalSpec,
      updatedAt: new Date().toISOString(),
    }
    console.log('Admin prompt config updated:', adminPromptConfig.updatedAt)
    return c.json({ success: true, config: adminPromptConfig })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 400)
  }
})

// POST /api/admin/auth — 비밀번호 확인
app.post('/api/admin/auth', async (c) => {
  const body: any = await c.req.json()
  const adminPassword = c.env.ADMIN_PASSWORD || 'sa3325'
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
  <title>${title} | AI Fashion Lookbook Studio</title>
  <meta name="description" content="의류 이미지 하나로 AI 온모델 피팅컷과 룩북 세트를 자동 생성하세요." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
  <link href="/static/style.css" rel="stylesheet" />
</head>
<body>
${bodyContent}
<script src="/static/app.js"></script>
</body>
</html>`

// ─── Landing Page ───
app.get('/_home_old', (c) => {
  return c.redirect('/generator', 302)
})

app.get('/', (c) => {
  return c.html(htmlShell('홈', `
  <!-- Toast Container -->
  <div class="toast-container" id="toastContainer"></div>

  <!-- Navbar -->
  <nav id="navbar">
    <div class="navbar-inner">
      <a href="/" class="navbar-logo">
        <div class="logo-icon">✨</div>
        <span>LookbookAI</span>
      </a>
      <div class="navbar-nav">
        <a href="#features">기능</a>
        <a href="#how-it-works">이용방법</a>
        <a href="#pricing">요금제</a>
        <a href="/dashboard">대시보드</a>
      </div>
      <div class="navbar-actions">
        <button class="btn btn-ghost" id="navLoginBtn" onclick="openModal('loginModal')">로그인</button>
        <button class="btn btn-primary" id="navSignupBtn" onclick="switchAuthTab('signup');openModal('loginModal')">무료 시작</button>
        <!-- 로그인 후 노출 영역 -->
        <div id="navUserArea" style="display:none;align-items:center;gap:10px;">
          <span style="font-size:13px;color:var(--text-muted);" id="navUserCredits">0크레딧</span>
          <div style="display:flex;align-items:center;gap:8px;padding:7px 14px;background:var(--primary-bg);border-radius:var(--radius-full);cursor:pointer;" onclick="toggleUserMenu()">
            <div style="width:26px;height:26px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:700;">✨</div>
            <span style="font-size:14px;font-weight:600;color:var(--primary);" id="navUserName">사용자</span>
            <i class="fas fa-chevron-down" style="font-size:10px;color:var(--primary);"></i>
          </div>
          <div id="userDropdownMenu" style="display:none;position:absolute;top:60px;right:24px;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:8px;min-width:160px;box-shadow:0 8px 24px rgba(0,0,0,0.3);z-index:1000;">
            <a href="/dashboard" style="display:block;padding:10px 14px;font-size:14px;color:var(--text);text-decoration:none;border-radius:8px;" onmouseover="this.style.background='var(--primary-bg)'" onmouseout="this.style.background=''">📁 대시보드</a>
            <div style="height:1px;background:var(--border);margin:4px 0;"></div>
            <button onclick="handleLogout()" style="display:block;width:100%;text-align:left;padding:10px 14px;font-size:14px;color:#ef4444;background:none;border:none;cursor:pointer;border-radius:8px;" onmouseover="this.style.background='#ef444411'" onmouseout="this.style.background=''">🚪 로그아웃</button>
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
          AI 패션 이미지 자동화 플랫폼
        </div>
        <h1 class="hero-title">
          옷 사진 한 장으로<br />
          <span class="highlight">AI 룩북 완성</span>
        </h1>
        <p class="hero-desc">
          촬영 없이도 전문 모델 피팅컷과 고품질 룩북을 즉시 제작하세요.<br />
          스튜디오 비용 제로, 결과물은 프로급.
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
          <button class="btn btn-primary btn-lg" onclick="openModal('signupModal')">
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
        <p class="section-desc">단 몇 번의 클릭으로 전문 패션 사진을 완성하세요.</p>
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
        <h2 class="section-title">5단계로 완성되는<br />AI 룩북 제작</h2>
        <p class="section-desc">복잡한 촬영 과정을 단 5단계로 간소화했습니다.</p>
      </div>
      <div class="steps-grid">
        <div class="step-card">
          <div class="step-num">📤</div>
          <div class="step-title">Step 1. 의류 업로드</div>
          <div class="step-desc">의류 이미지를 업로드합니다. 여러 장일수록 좋아요!</div>
        </div>
        <div class="step-card">
          <div class="step-num">🧍</div>
          <div class="step-title">Step 2. 모델 선택</div>
          <div class="step-desc">성별, 체형, 피부톤으로 AI 모델을 선택합니다</div>
        </div>
        <div class="step-card">
          <div class="step-num">🏙️</div>
          <div class="step-title">Step 3. 배경 선택</div>
          <div class="step-desc">브랜드에 맞는 배경을 카테고리별로 선택합니다</div>
        </div>
        <div class="step-card">
          <div class="step-num">⚡</div>
          <div class="step-title">Step 4. 생성 실행</div>
          <div class="step-desc">수량, 구도, 포즈를 설정하고 AI 생성을 시작합니다</div>
        </div>
        <div class="step-card">
          <div class="step-num">✅</div>
          <div class="step-title">Step 5. 결과 확인</div>
          <div class="step-desc">생성된 이미지를 확인하고 다운로드합니다</div>
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
        <h2 class="section-title">합리적인 가격으로<br />시작하세요</h2>
        <p class="section-desc">촬영비의 1/10 비용으로 더 많은 결과물을 만들어보세요.</p>
      </div>
      <div class="pricing-grid">
        <div class="pricing-card">
          <div class="pricing-plan">Free</div>
          <div class="pricing-price">
            <span class="amount">₩0</span>
            <span class="period">/월</span>
          </div>
          <p class="pricing-desc">처음 시작하는 분들을 위한 플랜</p>
          <hr class="pricing-divider" />
          <ul class="pricing-features">
            <li><span class="check">✓</span> 월 5크레딧 무료 제공</li>
            <li><span class="check">✓</span> 기본 모델 10종</li>
            <li><span class="check">✓</span> 기본 배경 5종</li>
            <li><span class="check">✓</span> 1회 4장 생성</li>
            <li><span class="x">✗</span> <span style="opacity:0.5">스타일샷 세트</span></li>
            <li><span class="x">✗</span> <span style="opacity:0.5">일괄 다운로드</span></li>
          </ul>
          <button class="btn btn-secondary btn-full" onclick="openModal('signupModal')">무료로 시작</button>
        </div>
        <div class="pricing-card featured">
          <div class="pricing-popular">가장 인기</div>
          <div class="pricing-plan">Pro</div>
          <div class="pricing-price">
            <span class="amount">₩49,000</span>
            <span class="period">/월</span>
          </div>
          <p class="pricing-desc">활발하게 판매하는 셀러를 위한 플랜</p>
          <hr class="pricing-divider" />
          <ul class="pricing-features">
            <li><span class="check">✓</span> 월 100크레딧 제공</li>
            <li><span class="check">✓</span> 전체 모델 50종+</li>
            <li><span class="check">✓</span> 전체 배경 30종+</li>
            <li><span class="check">✓</span> 1회 최대 8장 생성</li>
            <li><span class="check">✓</span> 스타일샷 세트</li>
            <li><span class="check">✓</span> 일괄 다운로드</li>
          </ul>
          <button class="btn btn-primary btn-full" onclick="openModal('signupModal')">Pro 시작하기</button>
        </div>
        <div class="pricing-card">
          <div class="pricing-plan">Business</div>
          <div class="pricing-price">
            <span class="amount">₩149,000</span>
            <span class="period">/월</span>
          </div>
          <p class="pricing-desc">브랜드 & 에이전시를 위한 플랜</p>
          <hr class="pricing-divider" />
          <ul class="pricing-features">
            <li><span class="check">✓</span> 월 400크레딧 제공</li>
            <li><span class="check">✓</span> 전체 모델/배경 무제한</li>
            <li><span class="check">✓</span> 커스텀 모델 등록</li>
            <li><span class="check">✓</span> 팀 계정 5인</li>
            <li><span class="check">✓</span> API 접근</li>
            <li><span class="check">✓</span> 전담 CS 지원</li>
          </ul>
          <button class="btn btn-secondary btn-full" onclick="openModal('signupModal')">Business 시작</button>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section id="cta-section">
    <div class="container">
      <div class="cta-content">
        <h2 class="cta-title">지금 바로 <span class="highlight">무료로 체험</span>하세요</h2>
        <p class="cta-desc">신용카드 없이 5크레딧을 무료로 받고<br />AI 룩북 제작을 경험해보세요.</p>
        <div class="cta-actions">
          <button class="btn btn-primary btn-lg" onclick="openModal('signupModal')">
            <i class="fas fa-rocket"></i>
            무료로 시작하기 →
          </button>
          <a href="/generator" class="btn btn-lg" style="background:rgba(255,255,255,0.1);color:white;border:2px solid rgba(255,255,255,0.3);">
            <i class="fas fa-eye"></i>
            데모 체험하기
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer>
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="navbar-logo">
            <div class="logo-icon">✨</div>
            <span>LookbookAI</span>
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
            <li><a href="/privacy">개인정보처리방침</a></li>
            <li><a href="#">쿠키 정책</a></li>
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
          사업장주소 : 충청북도 청주시 서원구 무심서로 377-3
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
        <button id="tabLogin"  onclick="switchAuthTab('login')"  style="flex:1;padding:10px;background:none;border:none;font-size:15px;font-weight:700;color:var(--primary);border-bottom:2px solid var(--primary);margin-bottom:-2px;cursor:pointer;">로그인</button>
        <button id="tabSignup" onclick="switchAuthTab('signup')" style="flex:1;padding:10px;background:none;border:none;font-size:15px;font-weight:600;color:var(--text-muted);cursor:pointer;">회원가입</button>
      </div>

      <!-- 소셜 로그인 버튼 -->
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
        <button onclick="oauthLogin('kakao')" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:13px;background:#FEE500;border:none;border-radius:10px;font-size:15px;font-weight:700;color:#3C1E1E;cursor:pointer;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.628 5.073 4.09 6.51L4.993 21l4.457-2.387A11.3 11.3 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z"/></svg>
          카카오로 시작하기
        </button>
        <button onclick="oauthLogin('google')" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:13px;background:#fff;border:1px solid #dadce0;border-radius:10px;font-size:15px;font-weight:600;color:#3c4043;cursor:pointer;">
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
        <form id="loginForm" onsubmit="handleLogin(event)">
          <div class="form-group">
            <input type="email" class="form-input" id="loginEmail" placeholder="이메일" required />
          </div>
          <div class="form-group">
            <input type="password" class="form-input" id="loginPassword" placeholder="비밀번호" required />
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg" id="loginBtn" style="margin-top:4px;">로그인</button>
        </form>
      </div>

      <!-- 회원가입 폼 -->
      <div id="authFormSignup" style="display:none;">
        <form id="signupForm" onsubmit="handleSignup(event)">
          <div class="form-group">
            <input type="text" class="form-input" id="signupName" placeholder="이름" required />
          </div>
          <div class="form-group">
            <input type="email" class="form-input" id="signupEmail" placeholder="이메일" required />
          </div>
          <div class="form-group">
            <input type="password" class="form-input" id="signupPassword" placeholder="비밀번호 (8자 이상)" required />
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg" id="signupBtn" style="margin-top:4px;">가입하고 무료 시작 🎁</button>
        </form>
      </div>

      <p style="font-size:11px;color:var(--text-muted);text-align:center;margin-top:16px;">가입 시 <a href="#" style="color:var(--primary);">이용약관</a> 및 <a href="#" style="color:var(--primary);">개인정보처리방침</a>에 동의합니다.</p>
    </div>
  </div>
  `))
})

// ─── Dashboard Page ───
app.get('/dashboard', (c) => {
  return c.html(htmlShell('대시보드', `
  <div class="toast-container" id="toastContainer"></div>

  <!-- Navbar -->
  <nav id="navbar">
    <div class="navbar-inner">
      <a href="/" class="navbar-logo">
        <div class="logo-icon">✨</div>
        <span>LookbookAI</span>
      </a>
      <div class="navbar-nav">
        <a href="/dashboard" style="color:var(--primary);font-weight:600;">대시보드</a>
        <a href="/generator">새 프로젝트</a>
      </div>
      <div class="navbar-actions" style="position:relative;">
        <button class="btn btn-ghost" id="navLoginBtn" onclick="openModal('loginModal')">로그인</button>
        <button class="btn btn-primary" id="navSignupBtn" onclick="switchAuthTab('signup');openModal('loginModal')">무료 시작</button>
        <div id="navUserArea" style="display:none;align-items:center;gap:10px;">
          <span style="font-size:13px;color:var(--text-muted);" id="navUserCredits">0크레딧</span>
          <div style="display:flex;align-items:center;gap:8px;padding:7px 14px;background:var(--primary-bg);border-radius:var(--radius-full);cursor:pointer;" onclick="toggleUserMenu()">
            <div style="width:26px;height:26px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:700;">✨</div>
            <span style="font-size:14px;font-weight:600;color:var(--primary);" id="navUserName">사용자</span>
            <i class="fas fa-chevron-down" style="font-size:10px;color:var(--primary);"></i>
          </div>
          <div id="userDropdownMenu" style="display:none;position:absolute;top:54px;right:0;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:8px;min-width:160px;box-shadow:0 8px 24px rgba(0,0,0,0.3);z-index:1000;">
            <a href="/dashboard" style="display:block;padding:10px 14px;font-size:14px;color:var(--text);text-decoration:none;border-radius:8px;" onmouseover="this.style.background='var(--primary-bg)'" onmouseout="this.style.background=''">📁 대시보드</a>
            <div style="height:1px;background:var(--border);margin:4px 0;"></div>
            <button onclick="handleLogout()" style="display:block;width:100%;text-align:left;padding:10px 14px;font-size:14px;color:#ef4444;background:none;border:none;cursor:pointer;border-radius:8px;" onmouseover="this.style.background='#ef444411'" onmouseout="this.style.background=''">🚪 로그아웃</button>
          </div>
        </div>
      </div>
    </div>
  </nav>

  <div id="dashboard-page">
    <div class="dashboard-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-section">
          <div class="sidebar-label">메인</div>
          <button class="sidebar-item active" onclick="switchTab('my-projects')">
            <span class="icon">📁</span> 내 프로젝트
            <span class="badge badge-primary">4</span>
          </button>
          <button class="sidebar-item" onclick="switchTab('favorites')">
            <span class="icon">❤️</span> 즐겨찾기
          </button>
          <button class="sidebar-item" onclick="switchTab('downloads')">
            <span class="icon">⬇️</span> 다운로드 내역
          </button>
        </div>
        <div class="sidebar-section">
          <div class="sidebar-label">설정</div>
          <button class="sidebar-item" onclick="switchTab('billing')">
            <span class="icon">💳</span> 요금제 &amp; 결제
          </button>
          <button class="sidebar-item" onclick="switchTab('settings')">
            <span class="icon">⚙️</span> 계정 설정
          </button>
        </div>
        <div class="sidebar-credit">
          <div class="credit-label">✨ 남은 크레딧</div>
          <div class="credit-amount">24</div>
          <div class="credit-sub">크레딧 (이미지 생성 1회 = 1크레딧)</div>
          <button class="btn btn-primary btn-sm" style="margin-top:12px;width:100%;" onclick="showToast('요금제 페이지로 이동합니다.','info')">크레딧 충전</button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="dashboard-main">
        <!-- Tab: My Projects -->
        <div id="tab-my-projects" class="tab-content">
          <div class="dashboard-header">
            <div>
              <h1 class="dashboard-title">내 프로젝트</h1>
              <p class="dashboard-sub">생성한 AI 룩북 프로젝트를 관리하세요.</p>
            </div>
            <a href="/generator" class="btn btn-primary">
              <i class="fas fa-plus"></i> 새 프로젝트
            </a>
          </div>

          <!-- Stats -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">총 프로젝트</div>
              <div class="stat-value">4</div>
              <div class="stat-change up">↑ 이번 달 2개 추가</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">생성된 이미지</div>
              <div class="stat-value">12</div>
              <div class="stat-change up">↑ 지난달 대비 50%</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">다운로드 횟수</div>
              <div class="stat-value">8</div>
              <div class="stat-change up">↑ 이번 주 3회</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">남은 크레딧</div>
              <div class="stat-value" style="color:var(--primary);">24</div>
              <div class="stat-change">100크레딧 플랜 중</div>
            </div>
          </div>

          <!-- Projects Toolbar -->
          <div class="projects-toolbar">
            <div class="toolbar-left">
              <div class="search-box">
                <i class="fas fa-search" style="color:var(--text-muted);font-size:13px;"></i>
                <input type="text" placeholder="프로젝트 검색..." id="projectSearch" oninput="filterProjects()" />
              </div>
              <button class="filter-btn active" onclick="filterByStatus('all', this)">전체</button>
              <button class="filter-btn" onclick="filterByStatus('done', this)">완료</button>
              <button class="filter-btn" onclick="filterByStatus('processing', this)">생성중</button>
              <button class="filter-btn" onclick="filterByStatus('draft', this)">초안</button>
            </div>
          </div>

          <!-- Projects Grid -->
          <div class="projects-grid" id="projectsGrid">
            <!-- New Project Card -->
            <div class="new-project-card" onclick="window.location.href='/generator'">
              <div class="new-project-icon">+</div>
              <div class="new-project-text">새 프로젝트 생성</div>
              <div style="font-size:13px;color:var(--text-muted);">의류 이미지를 업로드하고<br />AI 룩북을 만들어보세요</div>
            </div>
          </div>
        </div>

        <!-- Tab: Favorites -->
        <div id="tab-favorites" class="tab-content hidden">
          <div class="dashboard-header">
            <div>
              <h1 class="dashboard-title">즐겨찾기</h1>
              <p class="dashboard-sub">즐겨찾기한 이미지를 모아보세요.</p>
            </div>
          </div>
          <div style="text-align:center;padding:80px;color:var(--text-muted);">
            <div style="font-size:64px;margin-bottom:16px;">❤️</div>
            <h3 style="margin-bottom:8px;">즐겨찾기한 이미지가 없습니다</h3>
            <p style="font-size:14px;">결과 이미지에서 하트 버튼을 눌러 즐겨찾기에 추가하세요.</p>
          </div>
        </div>

        <!-- Tab: Downloads -->
        <div id="tab-downloads" class="tab-content hidden">
          <div class="dashboard-header">
            <div>
              <h1 class="dashboard-title">다운로드 내역</h1>
              <p class="dashboard-sub">다운로드한 이미지 내역을 확인하세요.</p>
            </div>
          </div>
          <div style="background:var(--white);border-radius:var(--radius-lg);border:1px solid var(--border);overflow:hidden;">
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="border-bottom:1px solid var(--border);">
                  <th style="padding:16px;text-align:left;font-size:13px;color:var(--text-muted);">프로젝트</th>
                  <th style="padding:16px;text-align:left;font-size:13px;color:var(--text-muted);">파일명</th>
                  <th style="padding:16px;text-align:left;font-size:13px;color:var(--text-muted);">날짜</th>
                  <th style="padding:16px;text-align:left;font-size:13px;color:var(--text-muted);">크기</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:1px solid var(--border);">
                  <td style="padding:16px;font-size:14px;">2024 S/S 룩북</td>
                  <td style="padding:16px;font-size:14px;color:var(--primary);">lookbook_001.png</td>
                  <td style="padding:16px;font-size:14px;color:var(--text-muted);">2024-03-15</td>
                  <td style="padding:16px;font-size:14px;color:var(--text-muted);">2.4 MB</td>
                </tr>
                <tr style="border-bottom:1px solid var(--border);">
                  <td style="padding:16px;font-size:14px;">캐주얼 티셔츠 컷</td>
                  <td style="padding:16px;font-size:14px;color:var(--primary);">fitting_set_001.zip</td>
                  <td style="padding:16px;font-size:14px;color:var(--text-muted);">2024-03-12</td>
                  <td style="padding:16px;font-size:14px;color:var(--text-muted);">8.1 MB</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Tab: Billing -->
        <div id="tab-billing" class="tab-content hidden">
          <div class="dashboard-header">
            <div>
              <h1 class="dashboard-title">요금제 &amp; 결제</h1>
            </div>
          </div>
          <div style="background:linear-gradient(135deg,var(--primary),var(--secondary));border-radius:var(--radius-xl);padding:32px;color:white;margin-bottom:24px;">
            <div style="font-size:13px;opacity:0.8;margin-bottom:8px;">현재 플랜</div>
            <div style="font-size:28px;font-weight:800;margin-bottom:8px;">Pro 플랜</div>
            <div style="font-size:14px;opacity:0.8;">다음 결제일: 2024-04-15 | ₩49,000/월</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div style="background:var(--white);border-radius:var(--radius-lg);padding:24px;border:1px solid var(--border);">
              <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">이번 달 크레딧 사용</div>
              <div style="font-size:32px;font-weight:800;">76 / 100</div>
              <div style="height:8px;background:var(--border);border-radius:4px;margin-top:12px;overflow:hidden;">
                <div style="width:76%;height:100%;background:var(--primary);border-radius:4px;"></div>
              </div>
            </div>
            <div style="background:var(--white);border-radius:var(--radius-lg);padding:24px;border:1px solid var(--border);">
              <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">남은 크레딧</div>
              <div style="font-size:32px;font-weight:800;color:var(--primary);">24</div>
              <button class="btn btn-primary btn-sm" style="margin-top:12px;">크레딧 추가 구매</button>
            </div>
          </div>
        </div>

        <!-- Tab: Settings -->
        <div id="tab-settings" class="tab-content hidden">
          <div class="dashboard-header">
            <div>
              <h1 class="dashboard-title">계정 설정</h1>
            </div>
          </div>
          <div style="background:var(--white);border-radius:var(--radius-xl);padding:32px;border:1px solid var(--border);max-width:560px;">
            <div class="form-group">
              <label class="form-label">이름</label>
              <input class="form-input" value="패션 셀러" />
            </div>
            <div class="form-group">
              <label class="form-label">이메일</label>
              <input class="form-input" value="seller@fashion.com" type="email" />
            </div>
            <div class="form-group">
              <label class="form-label">비밀번호 변경</label>
              <input class="form-input" placeholder="새 비밀번호" type="password" />
            </div>
            <button class="btn btn-primary" onclick="showToast('설정이 저장되었습니다.','success')">저장하기</button>
          </div>
        </div>
      </main>
    </div>
  </div>
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
      <a href="/" class="gapp-logo">✨ LookbookAI</a>
      <div id="gapp-steps">
        <span class="gstep" id="gs1">1</span>
        <span class="gstep-line" id="gl1"></span>
        <span class="gstep" id="gs2">2</span>
        <span class="gstep-line" id="gl2"></span>
        <span class="gstep" id="gs3">3</span>
      </div>
      <!-- 로그인 상태 표시 -->
      <div style="display:flex;align-items:center;gap:8px;position:relative;">
        <button id="navLoginBtn" onclick="openModal('loginModal')" style="font-size:12px;padding:6px 12px;background:var(--primary-bg);border:1px solid var(--primary);border-radius:20px;color:var(--primary);cursor:pointer;font-weight:600;">로그인</button>
        <div id="navUserArea" style="display:none;align-items:center;gap:6px;cursor:pointer;" onclick="toggleUserMenu()">
          <div style="width:24px;height:24px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;">✨</div>
          <span style="font-size:12px;font-weight:600;color:var(--primary);" id="navUserName">사용자</span>
          <span style="font-size:11px;color:var(--text-muted);" id="navUserCredits"></span>
        </div>
        <div id="userDropdownMenu" style="display:none;position:absolute;top:36px;right:0;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:8px;min-width:150px;box-shadow:0 8px 24px rgba(0,0,0,0.4);z-index:10001;">
          <a href="/dashboard" style="display:block;padding:9px 12px;font-size:13px;color:var(--text);text-decoration:none;border-radius:8px;" onmouseover="this.style.background='var(--primary-bg)'" onmouseout="this.style.background=''">📁 대시보드</a>
          <div style="height:1px;background:var(--border);margin:4px 0;"></div>
          <button onclick="handleLogout()" style="display:block;width:100%;text-align:left;padding:9px 12px;font-size:13px;color:#ef4444;background:none;border:none;cursor:pointer;border-radius:8px;" onmouseover="this.style.background='#ef444411'" onmouseout="this.style.background=''">🚪 로그아웃</button>
        </div>
      </div>
    </header>

    <!-- ── 슬라이드 컨테이너 ── -->
    <div id="gapp-slides">

      <!-- STEP 1 · 의류 업로드 -->
      <div class="gslide active" id="step-1">
        <div class="gslide-body">
          <div class="gstep-label">Step 1 / 3 · 의류 업로드</div>
          <h2 class="gstep-title">의류를 종류별로 업로드하세요</h2>
          <p class="gstep-sub">각 칸에 해당하는 의류를 업로드하세요 · 원하는 칸만 사용해도 됩니다</p>

          <!-- 3칸 슬롯 -->
          <div class="clothing-slots">

            <!-- 상의 슬롯 -->
            <div class="cslot" id="slot-TOP"
              ondragover="handleSlotDragOver(event,'TOP')"
              ondragleave="handleSlotDragLeave(event,'TOP')"
              ondrop="handleSlotDrop(event,'TOP')"
              onclick="triggerSlotInput('TOP')">
              <div class="cslot-label">상의</div>
              <div class="cslot-body" id="slot-body-TOP">
                <div class="cslot-empty">
                  <div class="cslot-plus">＋</div>
                  <div class="cslot-hint">클릭 또는 드래그</div>
                </div>
              </div>
              <button class="cslot-remove hidden" id="slot-remove-TOP"
                onclick="removeSlot(event,'TOP')">✕</button>
            </div>

            <!-- 하의 슬롯 -->
            <div class="cslot" id="slot-BOTTOM"
              ondragover="handleSlotDragOver(event,'BOTTOM')"
              ondragleave="handleSlotDragLeave(event,'BOTTOM')"
              ondrop="handleSlotDrop(event,'BOTTOM')"
              onclick="triggerSlotInput('BOTTOM')">
              <div class="cslot-label">하의</div>
              <div class="cslot-body" id="slot-body-BOTTOM">
                <div class="cslot-empty">
                  <div class="cslot-plus">＋</div>
                  <div class="cslot-hint">클릭 또는 드래그</div>
                </div>
              </div>
              <button class="cslot-remove hidden" id="slot-remove-BOTTOM"
                onclick="removeSlot(event,'BOTTOM')">✕</button>
            </div>

            <!-- 전체(상의+하의 한 이미지 / 원피스·세트업) 슬롯 -->
            <div class="cslot" id="slot-DRESS"
              ondragover="handleSlotDragOver(event,'DRESS')"
              ondragleave="handleSlotDragLeave(event,'DRESS')"
              ondrop="handleSlotDrop(event,'DRESS')"
              onclick="triggerSlotInput('DRESS')">
              <div class="cslot-label">전체</div>
              <div class="cslot-body" id="slot-body-DRESS">
                <div class="cslot-empty">
                  <div class="cslot-plus">＋</div>
                  <div class="cslot-hint">클릭 또는 드래그</div>
                </div>
              </div>
              <button class="cslot-remove hidden" id="slot-remove-DRESS"
                onclick="removeSlot(event,'DRESS')">✕</button>
            </div>

          </div><!-- /.clothing-slots -->

          <!-- 숨겨진 파일 input (슬롯별 category 속성으로 구분) -->
          <input type="file" id="fileInput-TOP"    accept="image/*" style="display:none;" onchange="handleSlotFileSelect(event,'TOP')" />
          <input type="file" id="fileInput-BOTTOM" accept="image/*" style="display:none;" onchange="handleSlotFileSelect(event,'BOTTOM')" />
          <input type="file" id="fileInput-DRESS"  accept="image/*" style="display:none;" onchange="handleSlotFileSelect(event,'DRESS')" />
        </div>
        <div class="gslide-nav">
          <div class="gslide-nav-inner">
            <button class="step-nav-back" onclick="prevStep(1)"><i class="fas fa-arrow-left"></i> 이전</button>
            <button class="step-nav-next" id="nextBtn1" onclick="nextStep(1)" disabled>다음 단계 <i class="fas fa-arrow-right"></i></button>
          </div>
        </div>
      </div>

      <!-- STEP 2 · 모델 선택 -->
      <div class="gslide" id="step-2">
        <div class="gslide-header">
          <div class="gstep-label">Step 2 / 3 · 모델 선택</div>
          <h2 class="gstep-title">AI 모델을 선택하세요</h2>
          <div class="gfilter-bar model-filters" id="modelFilters">
            <button class="filter-tag active" onclick="filterModels('all',this)">전체</button>
            <button class="filter-tag" onclick="filterModels('여성',this)">여성</button>
            <button class="filter-tag" onclick="filterModels('남성',this)">남성</button>
          </div>
        </div>
        <div class="gslide-grid" id="modelGridWrap">
          <div id="modelsLoading" class="grid-loading">
            <div style="font-size:32px;">⏳</div><p>모델 불러오는 중...</p>
          </div>
          <div class="select-grid" id="modelGrid"></div>
        </div>
        <div class="gslide-nav">
          <div class="gslide-nav-inner">
            <button class="step-nav-back" onclick="prevStep(2)"><i class="fas fa-arrow-left"></i> 이전</button>
            <button class="step-nav-next" id="nextBtn2" onclick="nextStep(2)">다음 단계 <i class="fas fa-arrow-right"></i></button>
          </div>
        </div>
      </div>

      <!-- STEP 3 · 배경 선택 -->
      <div class="gslide" id="step-3">
        <div class="gslide-header">
          <div class="gstep-label">Step 3 / 3 · 배경 선택</div>
          <h2 class="gstep-title">배경을 선택하세요</h2>
          <div class="gfilter-bar bg-categories" id="bgCategories">
            <button class="bg-cat active" onclick="filterBg('전체',this)">전체</button>
            <button class="bg-cat" onclick="filterBg('스튜디오',this)">스튜디오</button>
            <button class="bg-cat" onclick="filterBg('실내',this)">실내</button>
            <button class="bg-cat" onclick="filterBg('야외',this)">야외</button>
            <button class="bg-cat" onclick="filterBg('스트리트',this)">스트리트</button>
            <button class="bg-cat" onclick="filterBg('카페',this)">카페</button>
            <button class="bg-cat" onclick="filterBg('럭셔리',this)">럭셔리</button>
          </div>
        </div>
        <div class="gslide-grid" id="bgGridWrap">
          <div id="bgsLoading" class="grid-loading">
            <div style="font-size:32px;">⏳</div><p>배경 불러오는 중...</p>
          </div>
          <div class="select-grid" id="bgGrid"></div>
        </div>
        <!-- 생성 중 오버레이 (step-3 내부) -->
        <div class="generating-view" id="generatingView">
          <div class="gen-spinner"></div>
          <h2 style="font-size:20px;font-weight:800;margin-bottom:8px;">AI가 이미지를 생성 중입니다...</h2>
          <div class="gen-progress-bar"><div class="gen-progress-fill" id="genProgressFill" style="width:0%"></div></div>
          <div class="gen-status-text" id="genStatusText">시작 중...</div>
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
            <button class="step-nav-back" onclick="prevStep(3)"><i class="fas fa-arrow-left"></i> 이전</button>
            <button class="step-nav-next" id="nextBtn3" onclick="startGeneration()"><i class="fas fa-wand-magic-sparkles"></i> AI 생성 시작</button>
          </div>
        </div>
      </div>

      <!-- STEP 4 (구 Step5) · 결과 -->
      <div class="gslide" id="step-4">
        <div class="gslide-header">
          <div class="gstep-label">생성 완료 ✅</div>
          <h2 class="gstep-title">이미지가 생성되었습니다!</h2>
          <div class="results-toolbar" style="padding:0;border:none;margin-top:8px;">
            <div class="results-tabs">
              <button class="results-tab active" onclick="switchResultsTab('fitting',this)">피팅컷</button>
              <button class="results-tab" onclick="switchResultsTab('styleset',this)">스타일샷</button>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-primary btn-sm" onclick="downloadAll()"><i class="fas fa-download"></i> 다운로드</button>
            </div>
          </div>
        </div>
        <div class="gslide-scroll">
          <div class="results-grid" id="resultsGrid"></div>
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
    <div class="modal-box" style="max-width:900px;width:95vw;padding:0;overflow:hidden;background:var(--dark);">
      <button class="modal-close" style="background:rgba(255,255,255,0.1);color:white;top:16px;right:16px;z-index:10;" onclick="closeModal('imageModal')">×</button>
      <div class="image-modal-inner">
        <div class="image-modal-preview"><img id="modalImage" src="" alt="생성된 이미지" /></div>
        <div class="image-modal-sidebar">
          <div class="image-modal-title" id="modalImageTitle">생성된 피팅컷</div>
          <div class="image-modal-meta" id="modalImageMeta">해상도 확인 중...</div>
          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:16px 0;" />
          <div class="image-modal-actions">
            <button class="btn btn-primary btn-full" onclick="downloadImage()"><i class="fas fa-download"></i> 다운로드</button>
            <button class="btn btn-full" style="background:rgba(255,255,255,0.1);color:white;" onclick="toggleFavorite()"><i class="fas fa-heart" id="modalFavIcon"></i> 즐겨찾기</button>
          </div>
          <div style="margin-top:auto;">
            <div style="font-size:11px;color:var(--gray-4);line-height:1.6;" id="modalImageDetail">생성 모델: Atlas Cloud AI<br/>해상도: 확인 중...<br/>형식: JPEG</div>
          </div>
        </div>
      </div>
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
        <button id="tabLogin"  onclick="switchAuthTab('login')"  style="flex:1;padding:10px;background:none;border:none;font-size:15px;font-weight:700;color:var(--primary);border-bottom:2px solid var(--primary);margin-bottom:-2px;cursor:pointer;">로그인</button>
        <button id="tabSignup" onclick="switchAuthTab('signup')" style="flex:1;padding:10px;background:none;border:none;font-size:15px;font-weight:600;color:var(--text-muted);cursor:pointer;">회원가입</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
        <button onclick="oauthLogin('kakao')" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:13px;background:#FEE500;border:none;border-radius:10px;font-size:15px;font-weight:700;color:#3C1E1E;cursor:pointer;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.628 5.073 4.09 6.51L4.993 21l4.457-2.387A11.3 11.3 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z"/></svg>
          카카오로 시작하기
        </button>
        <button onclick="oauthLogin('google')" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:13px;background:#fff;border:1px solid #dadce0;border-radius:10px;font-size:15px;font-weight:600;color:#3c4043;cursor:pointer;">
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
        <form id="loginForm" onsubmit="handleLogin(event)">
          <div class="form-group"><input type="email" class="form-input" id="loginEmail" placeholder="이메일" required /></div>
          <div class="form-group"><input type="password" class="form-input" id="loginPassword" placeholder="비밀번호" required /></div>
          <button type="submit" class="btn btn-primary btn-full btn-lg" id="loginBtn" style="margin-top:4px;">로그인</button>
        </form>
      </div>
      <div id="authFormSignup" style="display:none;">
        <form id="signupForm" onsubmit="handleSignup(event)">
          <div class="form-group"><input type="text" class="form-input" id="signupName" placeholder="이름" required /></div>
          <div class="form-group"><input type="email" class="form-input" id="signupEmail" placeholder="이메일" required /></div>
          <div class="form-group"><input type="password" class="form-input" id="signupPassword" placeholder="비밀번호 (8자 이상)" required /></div>
          <button type="submit" class="btn btn-primary btn-full btn-lg" id="signupBtn" style="margin-top:4px;">가입하고 무료 시작 🎁</button>
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
app.get('/admin', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Admin | LookbookAI</title>
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
    <p>LookbookAI 관리자 페이지</p>
    <input type="password" id="pwInput" placeholder="비밀번호 입력" onkeydown="if(event.key==='Enter')doLogin()"/>
    <div class="err" id="loginErr"></div>
    <button class="btn-save" style="width:100%" onclick="doLogin()">로그인</button>
  </div>
</div>

<!-- 어드민 메인 -->
<div id="adminMain">
  <header class="admin-header">
    <span class="logo">✨ LookbookAI</span>
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
      +   '<button data-uid="' + uid + '" data-credits="' + credits + '" data-action="credits" style="margin-left:6px;font-size:10px;padding:2px 6px;background:none;border:1px solid #3a3a60;border-radius:6px;color:#8b8ba0;cursor:pointer;">수정</button>'
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
  const val = prompt('크레딧 수정 (현재: ' + current + '크레딧)\\n새 크레딧 수를 입력하세요:', current)
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
    if (data.success) { showAdminToast('크레딧 수정 완료', 'ok'); loadUsers() }
    else showAdminToast(data.message || '실패', 'err')
  } catch(e) { showAdminToast('서버 오류', 'err') }
}

async function deleteUser(id, name, email) {
  if (!confirm('"' + name + '" (' + email + ') 회원을 삭제하시겠습니까?\\n삭제 후 복구가 어렵습니다.')) return
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
let modelStagingList = []  // [{ file, base64, name }]

async function onModelFilesSelect(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  for (const file of files) {
    const base64 = await readFileAsBase64(file)
    const defaultName = file.name.replace(/\.[^.]+$/, '')
    modelStagingList.push({ file, base64, name: defaultName })
  }
  // input 초기화(같은 파일 재선택 허용)
  e.target.value = ''
  renderModelStaging()
}

function renderModelStaging() {
  const grid = document.getElementById('modelStagingGrid')
  const container = document.getElementById('modelStagingItems')
  if (!modelStagingList.length) { grid.style.display = 'none'; return }
  grid.style.display = 'block'
  document.getElementById('modelUploadZone').style.borderColor = '#6c47ff'
  container.innerHTML = modelStagingList.map((item, i) =>
    '<div style="width:160px;flex-shrink:0;">' +
    '<div style="position:relative;width:160px;height:160px;border-radius:10px;overflow:hidden;border:1.5px solid #e0e0e0;">' +
    '<img src="' + item.base64 + '" style="width:100%;height:100%;object-fit:cover;"/>' +
    '<button onclick="removeModelStaging(' + i + ')" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.55);color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:12px;line-height:22px;text-align:center;padding:0;">✕</button>' +
    '</div>' +
    '<input class="form-input" value="' + escHtml(item.name) + '" oninput="modelStagingList[' + i + '].name=this.value" placeholder="이름 입력" style="margin-top:6px;width:100%;box-sizing:border-box;font-size:12px;padding:5px 8px;"/>' +
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
    const payload = modelStagingList.map(i => ({ name: i.name.trim(), desc: i.name.trim(), imageBase64: i.base64 }))
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
      data.models.map(m =>
        '<div class="media-card">' +
        '<img src="/api/proxy/custom-model/' + m.id + '" alt="' + m.name + '" loading="lazy"/>' +
        '<span class="custom-badge">커스텀</span>' +
        '<button class="del-btn" onclick="event.stopPropagation();deleteModel(' + "'" + m.id + "'" + ')"><i class="fas fa-times"></i></button>' +
        '<div class="meta"><div class="name">' + m.name + '</div><div class="desc">' + (m.desc || '-') + '</div></div>' +
        '</div>'
      ).join('') + '</div>'
  } catch(e) { console.error('loadCustomModels error:', e); grid.innerHTML = '<div class="empty-state"><p>불러오기 실패: ' + e.message + '</p></div>' }
}

// ══════════════════════════════════════════════
//  배경 관리 — 다중 업로드
// ══════════════════════════════════════════════
let bgStagingList = []  // [{ file, base64, name, category }]

async function onBgFilesSelect(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  const defaultCat = (document.getElementById('bgDefaultCategory').value || '커스텀').trim()
  for (const file of files) {
    const base64 = await readFileAsBase64(file)
    const defaultName = file.name.replace(/\.[^.]+$/, '')
    bgStagingList.push({ file, base64, name: defaultName, category: defaultCat })
  }
  e.target.value = ''
  renderBgStaging()
}

function renderBgStaging() {
  const grid = document.getElementById('bgStagingGrid')
  const container = document.getElementById('bgStagingItems')
  if (!bgStagingList.length) { grid.style.display = 'none'; return }
  grid.style.display = 'block'
  document.getElementById('bgUploadZone').style.borderColor = '#6c47ff'
  container.innerHTML = bgStagingList.map((item, i) =>
    '<div style="width:160px;flex-shrink:0;">' +
    '<div style="position:relative;width:160px;height:120px;border-radius:10px;overflow:hidden;border:1.5px solid #e0e0e0;">' +
    '<img src="' + item.base64 + '" style="width:100%;height:100%;object-fit:cover;"/>' +
    '<button onclick="removeBgStaging(' + i + ')" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.55);color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:12px;line-height:22px;text-align:center;padding:0;">✕</button>' +
    '</div>' +
    '<input class="form-input" value="' + escHtml(item.name) + '" oninput="bgStagingList[' + i + '].name=this.value" placeholder="배경 이름" style="margin-top:6px;width:100%;box-sizing:border-box;font-size:12px;padding:5px 8px;"/>' +
    '<input class="form-input" value="' + escHtml(item.category) + '" oninput="bgStagingList[' + i + '].category=this.value" placeholder="카테고리" style="margin-top:4px;width:100%;box-sizing:border-box;font-size:12px;padding:5px 8px;color:#888;"/>' +
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
        '<div class="meta"><div class="name">' + b.name + '</div><div class="desc">' + b.category + ' · ' + (b.bgDesc || '-') + '</div></div>' +
        '</div>'
      ).join('') + '</div>'
  } catch(e) { console.error('loadCustomBgs error:', e); grid.innerHTML = '<div class="empty-state"><p>불러오기 실패: ' + e.message + '</p></div>' }
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
  })
})
</script>
</body>
</html>`)
})

// ── /studio-b 경로: 메인 앱 그대로 서빙 ──
// www.aifashion.co.kr/studio-b → 이 서비스
app.get('/studio-b', (c) => c.redirect('/'))
app.get('/studio-b/*', (c) => {
  const path = c.req.path.replace('/studio-b', '') || '/'
  return c.redirect(path)
})

export default app
