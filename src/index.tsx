import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import { cors } from 'hono/cors'

// Cloudflare KV 바인딩 타입
type Bindings = {
  LOOKBOOK_KV: KVNamespace
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
const ADMIN_PASSWORD = 'sa3325'   // 어드민 접근 비밀번호

// 어드민 인증 미들웨어 (상단 선언 필수 — 스토어/라우트보다 먼저 참조됨)
const adminAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('X-Admin-Password')
  if (authHeader !== ADMIN_PASSWORD) {
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
    '카메라: 아이레벨(지상 160-165cm 높이) 정면 촬영, 85-135mm 표준 망원 렌즈.',
    '배경은 참조 이미지의 장소·분위기·색감을 유지하되, 모델의 카메라 앵글과 눈높이에 맞게 원근감을 새로 구성.',
    '배경 지평선이 반드시 모델의 눈높이와 일치해야 함.',
    '배경 요소 실제 스케일 기준 — 모델(170cm) 옆의 일반 승용차는 모델 어깨~가슴 높이, 배경 보행자는 거리에 비례해 작게, 나무·건물은 모델보다 훨씬 크게.',
    '모델 발밑 지면 그림자 자연스럽게 합성, 모델이 실제 그 장소 바닥에 서 있는 것처럼.',
    '조명 방향·색온도·그림자 방향이 배경과 완벽 일치.',
    '패션 에디토리얼 무드: 매거진 커버 퀄리티, 배경 얕은 심도 처리.',
  ].join(' '),
  technicalSpec: [
    '초사실적 표현, 직물 질감과 피부 디테일 극사실 재현.',
    '의류 드레이프와 핏 완벽 재현. 자연스러운 주름 외 구김 없음.',
    '의류에 선명한 포커스. 배경은 얕은 심도 처리.',
    '전문 리터칭. 아티팩트 없음, 왜곡 없음.',
    '참조 이미지에 없는 의류, 액세서리, 소품 절대 추가 금지.',
    'ABSOLUTE PROHIBITION: NO text, NO letters, NO numbers, NO logos, NO watermarks, NO brand marks, NO typographic elements of any kind anywhere in the image.',
    'ABSOLUTE PROHIBITION: DO NOT modify the model face, facial features, or skin tone in any way.',
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
// 커스텀 모델/배경 — Cloudflare KV 영구 저장
// KV 키 구조:
//   model_index          → JSON 배열 (메타만, base64 제외)
//   model_img:{id}       → base64 이미지 문자열
//   bg_index             → JSON 배열 (메타만, base64 제외)
//   bg_img:{id}          → base64 이미지 문자열
//   id_counter           → 숫자 문자열 (1000~)
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

// KV 헬퍼
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

// KV 없는 환경(로컬 개발)용 메모리 폴백
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
    const results: CustomModel[] = []

    if (kv) {
      // ── KV 모드 (프로덕션) ──
      const list = await kvGetModels(kv)
      for (const item of items) {
        const { name, desc, imageBase64 } = item
        if (!name || !imageBase64) continue
        const id = await kvNextId(kv)
        const meta: CustomModel = { id, name, desc: desc || name, createdAt: new Date().toISOString() }
        list.push(meta)
        // 이미지는 별도 키에 저장 (인덱스와 분리)
        await kv.put(`model_img:${id}`, imageBase64)
        results.push(meta)
      }
      await kvSaveModels(kv, list)
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
  if (kv) {
    const list = await kvGetModels(kv)
    return c.json({ success: true, models: list })
  }
  const list = _memModels.map(m => ({ id: m.id, name: m.name, desc: m.desc, createdAt: m.createdAt }))
  return c.json({ success: true, models: list })
})

// DELETE /api/admin/models/:id
app.delete('/api/admin/models/:id', adminAuth, async (c) => {
  const id = c.req.param('id')
  const kv: KVNamespace | undefined = (c.env as any)?.LOOKBOOK_KV
  if (kv) {
    const list = await kvGetModels(kv)
    const newList = list.filter(m => m.id !== id)
    await kvSaveModels(kv, newList)
    await kv.delete(`model_img:${id}`)
    return c.json({ success: list.length > newList.length })
  }
  const before = _memModels.length
  _memModels = _memModels.filter(m => m.id !== id)
  return c.json({ success: _memModels.length < before })
})

// GET /api/proxy/custom-model/:id — 이미지 바이너리 서빙
app.get('/api/proxy/custom-model/:id', async (c) => {
  const id = c.req.param('id')
  const kv: KVNamespace | undefined = (c.env as any)?.LOOKBOOK_KV
  let imageBase64: string | null = null
  if (kv) {
    imageBase64 = await kv.get(`model_img:${id}`)
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
    const results: CustomBg[] = []

    if (kv) {
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
    } else {
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
  if (kv) {
    const list = await kvGetBgs(kv)
    return c.json({ success: true, backgrounds: list })
  }
  const list = _memBgs.map(b => ({ id: b.id, name: b.name, bgDesc: b.bgDesc, category: b.category, createdAt: b.createdAt }))
  return c.json({ success: true, backgrounds: list })
})

app.delete('/api/admin/backgrounds/:id', adminAuth, async (c) => {
  const id = c.req.param('id')
  const kv: KVNamespace | undefined = (c.env as any)?.LOOKBOOK_KV
  if (kv) {
    const list = await kvGetBgs(kv)
    const newList = list.filter(b => b.id !== id)
    await kvSaveBgs(kv, newList)
    await kv.delete(`bg_img:${id}`)
    return c.json({ success: list.length > newList.length })
  }
  const before = _memBgs.length
  _memBgs = _memBgs.filter(b => b.id !== id)
  return c.json({ success: _memBgs.length < before })
})

app.get('/api/proxy/custom-bg/:id', async (c) => {
  const id = c.req.param('id')
  const kv: KVNamespace | undefined = (c.env as any)?.LOOKBOOK_KV
  let imageBase64: string | null = null
  if (kv) {
    imageBase64 = await kv.get(`bg_img:${id}`)
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
  const customRaw: CustomModel[] = kv
    ? await kvGetModels(kv)
    : _memModels.map(m => ({ id: m.id, name: m.name, desc: m.desc, createdAt: m.createdAt }))
  const customList = customRaw.map(m => ({
    id: Number(m.id), name: m.name, gender: '커스텀', age: '-', body: '-', mood: '-', skin: '-',
    desc: m.desc, unsplashId: null, isCustom: true, customId: m.id,
  }))
  return c.json({ models: customList })
})

// 배경 목록 — 관리자 업로드 커스텀 배경만 반환
app.get('/api/presets/backgrounds', async (c) => {
  const kv: KVNamespace | undefined = (c.env as any)?.LOOKBOOK_KV
  const customBgRaw: CustomBg[] = kv
    ? await kvGetBgs(kv)
    : _memBgs.map(b => ({ id: b.id, name: b.name, bgDesc: b.bgDesc, category: b.category, createdAt: b.createdAt }))
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
  if (!url) return c.json({ error: 'Missing url param' }, 400)

  try {
    // 허용된 도메인인지 확인 (보안)
    const parsed = new URL(url)
    const allowedHosts = ['cdn.atlascloud.ai', 'storage.atlascloud.ai', 'replicate.delivery', 'pbxt.replicate.delivery', 'delivery.replicate.com', 'cdn2.atlascloud.ai']
    const isAllowed = allowedHosts.some(h => parsed.hostname.endsWith(h)) || parsed.hostname.includes('atlascloud') || parsed.hostname.includes('replicate')

    // 모든 https URL 허용 (Atlas Cloud 다양한 CDN 사용)
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
    const contentType = res.headers.get('Content-Type') || 'image/png'

    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
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

// ────────────────────────────────────────────────────
// Auth API (Mock)
// ────────────────────────────────────────────────────
app.post('/api/auth/login', async (c) => {
  const body = await c.req.json()
  if (body.email && body.password) {
    return c.json({
      success: true,
      user: { id: 'u1', name: '패션 셀러', email: body.email, credits: 24 },
      token: 'mock-jwt-token'
    })
  }
  return c.json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401)
})

app.post('/api/auth/signup', async (c) => {
  const body = await c.req.json()
  if (body.email && body.password && body.name) {
    return c.json({
      success: true,
      user: { id: 'u_new', name: body.name, email: body.email, credits: 5 },
      token: 'mock-jwt-token-new'
    })
  }
  return c.json({ success: false, message: '입력값을 확인해주세요.' }, 400)
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
      clothingImageUrl,
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

    if (modelId) {
      const mid = String(modelId)
      // 커스텀 모델: KV 또는 메모리에서만 이미지 취득 (기본 Unsplash 없음)
      if (kv) {
        const stored = await kv.get(`model_img:${mid}`)
        if (stored) { modelImageBase64 = stored; console.log('KV custom model: OK') }
      } else {
        const m = _memModels.find(m => m.id === mid)
        if (m?.imageBase64) { modelImageBase64 = m.imageBase64; console.log('Mem custom model: OK') }
      }
      if (!modelImageBase64) console.log('Custom model image not found for id:', mid)
    }
    if (bgId) {
      const bid = String(bgId)
      // 커스텀 배경: KV 또는 메모리에서만 이미지 취득 (기본 Unsplash 없음)
      if (kv) {
        const stored = await kv.get(`bg_img:${bid}`)
        if (stored) { bgImageBase64 = stored; console.log('KV custom bg: OK') }
      } else {
        const b = _memBgs.find(b => b.id === bid)
        if (b?.imageBase64) { bgImageBase64 = b.imageBase64; console.log('Mem custom bg: OK') }
      }
      if (!bgImageBase64) console.log('Custom bg image not found for id:', bid)
    }

    // ── Nano Banana 2 Edit: images 배열 구성 ──
    // 순서: [의류(필수), 모델, 배경]
    // Nano Banana 2는 images 배열 순서와 프롬프트 내 언급으로 역할을 구분
    const images: string[] = []
    if (clothingImageUrl && clothingImageUrl.startsWith('data:')) {
      images.push(clothingImageUrl)
    }
    if (modelImageBase64) images.push(modelImageBase64)
    if (bgImageBase64)    images.push(bgImageBase64)

    // ── 프롬프트 구성 ──
    // images 배열의 인덱스를 명시적으로 언급해 역할을 분명히 지정
    let prompt: string
    // 모델 이미지가 있는지 여부 (이미지가 있으면 텍스트 설명 불필요)
    const hasModelImage = !!modelImageBase64

    // ── 공통 불변 제약 파라미터 (모든 모드에 공통 적용) ──
    const HARD_CONSTRAINTS = [
      `ABSOLUTE RULES — NEVER VIOLATE UNDER ANY CIRCUMSTANCES:`,
      `1. DO NOT insert, overlay, embed, or render ANY text, letters, numbers, words, logos, watermarks, brand marks, or typographic elements ANYWHERE in the image.`,
      `2. DO NOT alter the model's face, facial features, skin tone, hair, or body structure in any way whatsoever.`,
      `3. DO NOT change, redesign, or substitute ANY detail of the clothing: color, pattern, print, texture, collar, neckline, sleeve length, hem, buttons, zippers, pockets, or stitching must be reproduced EXACTLY as shown in the reference.`,
      `4. NO watermarks. NO overlaid captions. NO decorative text. NO brand insignia added by AI.`,
      `Ultra-photorealistic, 8K quality, professional fashion editorial, magazine cover quality.`,
    ].join(' ')

    if (images.length >= 3) {
      // 의류 + 모델 이미지 + 배경 모두 있는 풀 모드
      // 핵심 전략: 배경 이미지는 '장소/분위기 참조'로만 사용.
      // AI가 모델의 카메라 앵글·눈높이·원근감을 기준으로 배경 장면을 새로 구성.
      prompt = [
        `Create a hyper-realistic professional fashion editorial photograph.`,

        // ── 의류 (Image 1) ──
        `Image 1 is the CLOTHING ITEM. Reproduce EVERY detail of this garment with 100% fidelity: exact color, exact pattern, exact texture, collar shape, sleeve length, hem line, buttons, zippers, prints. This clothing must appear IDENTICAL to the reference.`,

        // ── 모델 (Image 2) ──
        `Image 2 is the MODEL. Preserve this exact person: face, facial features, hair style and color, skin tone, body proportions. Make NO changes to the model's appearance.`,

        // ── 배경 전략 핵심 변경 ──
        `Image 3 is a LOCATION REFERENCE only — it shows the place, atmosphere, lighting mood, and environment style. Use it SOLELY to understand the scene's character (location type, time of day, color palette, overall vibe).`,

        `CRITICAL COMPOSITING TASK: Reconstruct the background scene FROM SCRATCH using Image 3 as a style/location reference, but built entirely around the model's camera perspective and scale:`,
        `- Determine the model's shooting camera: eye-level (~160-165cm height from ground), straight-on angle, standard portrait focal length (~85-135mm equivalent).`,
        `- Re-render the background environment matching THAT exact camera position and angle. The background's horizon line MUST sit at the model's eye level.`,
        `- All background elements must obey real-world scale relative to a ~170cm tall model in the foreground: full-size cars (sedan ~1.4-1.5m tall) must reach roughly the model's shoulder/chest height when nearby; background pedestrians must be proportionally smaller with distance; trees and buildings must tower appropriately ABOVE the model.`,
        `- Recreate the same location's atmosphere (same street, same beach/city environment, same time of day, same weather, same color palette from Image 3) — but with correct perspective built around the model.`,
        `- The model must appear to be physically standing ON the ground of that scene, with correct contact shadows and ground-plane integration.`,

        // ── 조명/합성 ──
        `Match the scene's natural lighting direction and color temperature to the model. Cast realistic ground shadow beneath the model's feet. Apply shallow depth-of-field to background elements.`,
        `The final result must look like a single photograph taken on location — zero compositing artifacts, zero scale mismatch, zero perspective conflict.`,

        `Show the model in a ${poseTypeText}, ${poseStyleText}.`,
        HARD_CONSTRAINTS,
      ].join(' ')
    } else if (images.length === 2 && clothingImageUrl) {
      // 의류 + 모델 이미지 (배경 없음)
      prompt = [
        `Create a hyper-realistic professional fashion lookbook photograph.`,
        `Image 1 is the CLOTHING ITEM — reproduce this garment EXACTLY with every design detail preserved.`,
        `Image 2 is the MODEL — preserve this person's exact face, features, hair, skin tone, and body. NEVER change the model's look.`,
        `Place the model naturally in a ${bgDesc} environment, with photorealistic lighting and seamless integration.`,
        `Show the model in a ${poseTypeText}, ${poseStyleText}.`,
        HARD_CONSTRAINTS,
      ].join(' ')
    } else if (images.length === 1 && clothingImageUrl) {
      // 의류만 있음 (모델 이미지 없음)
      prompt = [
        `Create a hyper-realistic professional fashion lookbook photograph.`,
        `Image 1 is the CLOTHING ITEM — reproduce this garment EXACTLY with all details.`,
        `Show a ${modelDesc} model wearing it naturally in a ${poseTypeText}, ${poseStyleText}.`,
        `Background: ${bgDesc}. Lighting and shadows are fully consistent and photorealistic.`,
        HARD_CONSTRAINTS,
      ].join(' ')
    } else {
      // 이미지 없음 → 순수 텍스트 기반
      prompt = [
        `Ultra-photorealistic professional fashion photography.`,
        `A ${modelDesc} fashion model, ${poseTypeText}, ${poseStyleText}.`,
        `Background: ${bgDesc} (${bgName}). Natural lighting, seamless integration.`,
        `8K resolution, Canon EOS R5, professional studio lighting, hyperrealistic skin texture, perfect fabric detail, commercial fashion editorial, magazine quality.`,
        HARD_CONSTRAINTS,
      ].join(' ')
    }

    console.log('Prompt (first 200):', prompt.substring(0, 200))
    console.log('images count:', images.length)

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

    // 어드민 프롬프트 주입
    prompt = injectAdminPrompt(prompt)
    console.log('Final prompt (first 300):', prompt.substring(0, 300))

    // 생성 수량 3장 고정 (count 파라미터 무시)
    const jobCount = 3
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
      const urls: string[] = r.data?.outputs || r.data?.output || []
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
  if (body.password === ADMIN_PASSWORD) {
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
app.get('/', (c) => {
  return c.redirect('/generator', 302)
})

app.get('/_home', (c) => {
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
        <button class="btn btn-ghost" onclick="openModal('loginModal')">로그인</button>
        <button class="btn btn-primary" onclick="openModal('signupModal')">무료 시작</button>
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
            <li><a href="#">이용약관</a></li>
            <li><a href="#">개인정보처리방침</a></li>
            <li><a href="#">쿠키 정책</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2024 LookbookAI. All rights reserved.</span>
        <span>사업자등록번호: 000-00-00000</span>
      </div>
    </div>
  </footer>

  <!-- Login Modal -->
  <div class="modal-overlay" id="loginModal">
    <div class="modal-box">
      <button class="modal-close" onclick="closeModal('loginModal')">×</button>
      <h2 class="modal-title">로그인</h2>
      <p class="modal-subtitle">계정에 로그인하여 AI 룩북을 제작하세요.</p>
      <form id="loginForm" onsubmit="handleLogin(event)">
        <div class="form-group">
          <label class="form-label">이메일</label>
          <input type="email" class="form-input" id="loginEmail" placeholder="email@example.com" required />
        </div>
        <div class="form-group">
          <label class="form-label">비밀번호</label>
          <input type="password" class="form-input" id="loginPassword" placeholder="비밀번호 입력" required />
        </div>
        <button type="submit" class="btn btn-primary btn-full btn-lg" id="loginBtn">로그인</button>
      </form>
      <div class="auth-switch">계정이 없으신가요? <a onclick="switchModal('loginModal','signupModal')">회원가입</a></div>
    </div>
  </div>

  <!-- Signup Modal -->
  <div class="modal-overlay" id="signupModal">
    <div class="modal-box">
      <button class="modal-close" onclick="closeModal('signupModal')">×</button>
      <h2 class="modal-title">무료 회원가입</h2>
      <p class="modal-subtitle">가입 즉시 5크레딧을 무료로 드려요! 🎁</p>
      <form id="signupForm" onsubmit="handleSignup(event)">
        <div class="form-group">
          <label class="form-label">이름</label>
          <input type="text" class="form-input" id="signupName" placeholder="홍길동" required />
        </div>
        <div class="form-group">
          <label class="form-label">이메일</label>
          <input type="email" class="form-input" id="signupEmail" placeholder="email@example.com" required />
        </div>
        <div class="form-group">
          <label class="form-label">비밀번호</label>
          <input type="password" class="form-input" id="signupPassword" placeholder="8자 이상 입력" required />
          <div class="form-hint">영문, 숫자 포함 8자 이상</div>
        </div>
        <button type="submit" class="btn btn-primary btn-full btn-lg" id="signupBtn">회원가입 &amp; 무료 시작</button>
      </form>
      <div class="auth-switch">이미 계정이 있으신가요? <a onclick="switchModal('signupModal','loginModal')">로그인</a></div>
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
      <div class="navbar-actions">
        <div style="display:flex;align-items:center;gap:8px;padding:8px 16px;background:var(--primary-bg);border-radius:var(--radius-full);cursor:pointer;" onclick="toggleUserMenu()">
          <div style="width:28px;height:28px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:700;">P</div>
          <span style="font-size:14px;font-weight:600;color:var(--primary);">패션 셀러</span>
          <i class="fas fa-chevron-down" style="font-size:11px;color:var(--primary);"></i>
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

  <!-- Navbar -->
  <nav id="navbar">
    <div class="navbar-inner">
      <a href="/generator" class="navbar-logo">
        <div class="logo-icon">✨</div>
        <span>LookbookAI</span>
      </a>
      <div style="flex:1;"></div>
    </div>
  </nav>

  <div id="generator-page" style="height:100vh;overflow:hidden;display:flex;flex-direction:column;">

    <!-- Generator Body -->
    <div class="generator-body" style="flex:1;overflow:hidden;display:flex;flex-direction:column;min-height:0;">

      <!-- ─── Step 1: Upload ─── -->
      <div class="step-panel active" id="step-1" style="height:100%;flex-direction:column;overflow:hidden;">
        <div class="step-title-area">
          <div class="step-num-badge">Step 1 / 5 · 의류 업로드</div>
          <h2 class="step-heading">의류 이미지를 업로드하세요</h2>
          <p class="step-sub">배경이 흰색이거나 투명한 이미지를 사용하면 가장 좋은 결과를 얻을 수 있어요.</p>
        </div>

        <div id="uploadArea" class="upload-area" style="flex:1;overflow-y:auto;"
          ondragover="handleDragOver(event)"
          ondragleave="handleDragLeave(event)"
          ondrop="handleDrop(event)"
          onclick="document.getElementById('fileInput').click()">
          <div class="upload-icon">📤</div>
          <h3 class="upload-title">이미지를 드래그하거나 클릭하여 업로드</h3>
          <p class="upload-desc">PNG, JPG, WEBP 형식 지원 · 최대 10MB</p>
          <button class="btn btn-primary" type="button">파일 선택</button>
          <div class="upload-formats" style="margin-top:16px;">권장: 흰 배경, 정면 전신 샷, 고해상도 이미지</div>
          <input type="file" id="fileInput" accept="image/*" style="display:none;" onchange="handleFileSelect(event)" />
        </div>

        <div id="uploadPreview" class="upload-preview hidden" style="flex:1;overflow-y:auto;">
          <div class="upload-preview-inner">
            <div class="upload-preview-img">
              <img id="previewImg" src="" alt="업로드된 의류" />
            </div>
            <div class="upload-preview-info">
              <div class="upload-preview-name" id="previewName">-</div>
              <div class="upload-preview-meta" id="previewMeta">-</div>
              <div class="upload-tips" style="background:linear-gradient(135deg,rgba(108,71,255,0.08),rgba(0,212,170,0.08));border:1px solid rgba(108,71,255,0.2);border-radius:10px;padding:12px 16px;">
                <p style="margin:0;font-size:13px;color:var(--text-primary);font-weight:600;">📸 이미지가 여러 장일수록 더 좋은 결과를 얻을 수 있어요!</p>
                <p style="margin:8px 0 0;font-size:12px;color:var(--text-muted);">더 많은 촬영 팁이 필요하다면 →
                  <a href="https://www.style-room.ai" target="_blank" rel="noopener"
                    style="color:var(--primary);font-weight:600;text-decoration:none;">
                    www.style-room.ai
                  </a>
                  를 참고하세요
                </p>
              </div>
              <button class="btn btn-ghost btn-sm" style="margin-top:16px;" onclick="resetUpload()">
                <i class="fas fa-redo"></i> 다시 선택
              </button>
            </div>
          </div>
        </div>

        <div class="step-nav">
          <button class="step-nav-back" onclick="prevStep(1)">
            <i class="fas fa-arrow-left"></i> 이전
          </button>
          <button class="step-nav-next" id="nextBtn1" onclick="nextStep(1)" disabled>
            다음 단계 <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>

      <!-- ─── Step 2: Model (그리드 선택) ─── -->
      <div class="step-panel" id="step-2" style="flex-direction:column;height:100%;overflow:hidden;">
        <div class="step-title-area" style="flex-shrink:0;">
          <div class="step-num-badge">Step 2 / 5 · 모델 선택</div>
          <h2 class="step-heading">AI 모델을 선택하세요</h2>
        </div>

        <div class="model-filters" id="modelFilters" style="flex-shrink:0;">
          <button class="filter-tag active" onclick="filterModels('all', this)">전체</button>
          <button class="filter-tag" onclick="filterModels('여성', this)">여성</button>
          <button class="filter-tag" onclick="filterModels('남성', this)">남성</button>
        </div>

        <div id="modelsLoading" style="text-align:center;padding:60px;color:var(--text-muted);flex:1;">
          <div style="font-size:36px;margin-bottom:12px;">⏳</div>
          <p>모델 목록을 불러오는 중...</p>
        </div>

        <div id="modelGridWrap" style="display:none;flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;">
          <div class="select-grid" id="modelGrid">
            <!-- JS가 채움 -->
          </div>
        </div>

        <div class="step-nav" style="flex-shrink:0;">
          <button class="step-nav-back" onclick="prevStep(2)">
            <i class="fas fa-arrow-left"></i> 이전
          </button>
          <button class="step-nav-next" id="nextBtn2" onclick="nextStep(2)">
            다음 단계 <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>

      <!-- ─── Step 3: Background (그리드 선택) ─── -->
      <div class="step-panel" id="step-3" style="flex-direction:column;height:100%;overflow:hidden;">
        <div class="step-title-area" style="flex-shrink:0;">
          <div class="step-num-badge">Step 3 / 5 · 배경 선택</div>
          <h2 class="step-heading">배경을 선택하세요</h2>
        </div>

        <div class="bg-categories" id="bgCategories" style="flex-shrink:0;">
          <button class="bg-cat active" onclick="filterBg('전체', this)">전체</button>
          <button class="bg-cat" onclick="filterBg('스튜디오', this)">스튜디오</button>
          <button class="bg-cat" onclick="filterBg('실내', this)">실내</button>
          <button class="bg-cat" onclick="filterBg('야외', this)">야외</button>
          <button class="bg-cat" onclick="filterBg('스트리트', this)">스트리트</button>
          <button class="bg-cat" onclick="filterBg('카페', this)">카페</button>
          <button class="bg-cat" onclick="filterBg('럭셔리', this)">럭셔리</button>
        </div>

        <div id="bgsLoading" style="text-align:center;padding:60px;color:var(--text-muted);flex:1;">
          <div style="font-size:36px;margin-bottom:12px;">⏳</div>
          <p>배경 목록을 불러오는 중...</p>
        </div>

        <div id="bgGridWrap" style="display:none;flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;">
          <div class="select-grid" id="bgGrid">
            <!-- JS가 채움 -->
          </div>
        </div>

        <div class="step-nav" style="flex-shrink:0;">
          <button class="step-nav-back" onclick="prevStep(3)">
            <i class="fas fa-arrow-left"></i> 이전
          </button>
          <button class="step-nav-next" id="nextBtn3" onclick="nextStep(3)">
            다음 단계 <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>

      <!-- ─── Step 4: Generate ─── -->
      <div class="step-panel" id="step-4" style="height:100%;flex-direction:column;overflow:hidden;">
        <div class="step-title-area" id="step5TitleArea" style="flex-shrink:0;">
          <div class="step-num-badge">Step 4 / 5 · 생성 옵션</div>
          <h2 class="step-heading">생성 옵션을 설정하세요</h2>
          <p class="step-sub">화면 비율, 해상도, 구도, 포즈를 선택하세요.</p>
        </div>

        <div id="genOptionsView" style="flex:1;overflow-y:auto;">
          <div class="gen-options-grid">
            <div class="gen-option-group">
              <div class="gen-option-title">🖼️ 화면 비율</div>
              <div class="option-chips">
                <div class="option-chip" onclick="selectOption(this, 'ratio')">1:1</div>
                <div class="option-chip" onclick="selectOption(this, 'ratio')">4:5</div>
                <div class="option-chip selected" onclick="selectOption(this, 'ratio')">3:4</div>
                <div class="option-chip" onclick="selectOption(this, 'ratio')">9:16</div>
              </div>
            </div>
            <div class="gen-option-group">
              <div class="gen-option-title">✨ 해상도</div>
              <div class="option-chips">
                <div class="option-chip" onclick="selectOption(this, 'resolution')">표준</div>
                <div class="option-chip selected" onclick="selectOption(this, 'resolution')">HD</div>
                <div class="option-chip" onclick="selectOption(this, 'resolution')">4K</div>
              </div>
            </div>
            <div class="gen-option-group">
              <div class="gen-option-title">🎯 구도</div>
              <div class="option-chips">
                <div class="option-chip selected" onclick="selectOption(this, 'pose_type')">전신</div>
                <div class="option-chip" onclick="selectOption(this, 'pose_type')">반신</div>
                <div class="option-chip" onclick="selectOption(this, 'pose_type')">상반신</div>
              </div>
            </div>
            <div class="gen-option-group">
              <div class="gen-option-title">🧍 포즈</div>
              <div class="option-chips">
                <div class="option-chip selected" onclick="selectOption(this, 'pose')">정면</div>
                <div class="option-chip" onclick="selectOption(this, 'pose')">측면</div>
                <div class="option-chip" onclick="selectOption(this, 'pose')">워킹</div>
                <div class="option-chip" onclick="selectOption(this, 'pose')">정적</div>
              </div>
            </div>
          </div>

          <div class="gen-summary" id="genSummary">
            <div class="gen-summary-title">생성 요약</div>
            <div class="gen-summary-grid">
              <div class="gen-summary-item">
                <div class="gen-summary-label">선택된 모델</div>
                <div class="gen-summary-val" id="sumModel">-</div>
              </div>
              <div class="gen-summary-item">
                <div class="gen-summary-label">선택된 배경</div>
                <div class="gen-summary-val" id="sumBg">-</div>
              </div>
              <div class="gen-summary-item">
                <div class="gen-summary-label">생성 수량</div>
                <div class="gen-summary-val">3장 (고정)</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Generating View -->
        <div class="generating-view" id="generatingView">
          <div class="gen-spinner"></div>
          <h2 style="font-size:24px;font-weight:800;margin-bottom:12px;">AI가 이미지를 생성 중입니다...</h2>
          <p style="color:var(--text-muted);margin-bottom:0;">Atlas Cloud AI가 실사 패션 이미지를 생성하고 있습니다. 잠시만 기다려주세요.</p>
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

        <div class="step-nav" id="step5Nav" style="flex-shrink:0;">
          <button class="step-nav-back" onclick="prevStep(4)">
            <i class="fas fa-arrow-left"></i> 이전
          </button>
          <button class="step-nav-next" onclick="startGeneration()">
            <i class="fas fa-wand-magic-sparkles"></i> AI 생성 시작
          </button>
        </div>
      </div>

      <!-- ─── Step 5: Results ─── -->
      <div class="step-panel" id="step-5" style="height:100%;flex-direction:column;overflow:hidden;">
        <div class="step-title-area" style="flex-shrink:0;">
          <div class="step-num-badge">Step 5 / 5 · 생성 완료 ✅</div>
          <h2 class="step-heading">이미지가 생성되었습니다!</h2>
          <p class="step-sub">AI가 생성한 실사 피팅컷을 확인하고 다운로드하세요.</p>
        </div>

        <div class="results-toolbar" style="flex-shrink:0;">
          <div class="results-tabs">
            <button class="results-tab active" onclick="switchResultsTab('fitting', this)">피팅컷</button>
            <button class="results-tab" onclick="switchResultsTab('styleset', this)">스타일샷 세트</button>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary btn-sm" onclick="showToast('즐겨찾기에 추가되었습니다.', 'success')">
              <i class="fas fa-heart"></i> 즐겨찾기
            </button>
            <button class="btn btn-primary btn-sm" onclick="downloadAll()">
              <i class="fas fa-download"></i> 일괄 다운로드
            </button>
          </div>
        </div>

        <div style="flex:1;overflow-y:auto;">
          <div class="results-grid" id="resultsGrid">
            <!-- Populated by JS -->
          </div>

          <div style="margin-top:40px;padding:24px;background:linear-gradient(135deg,var(--primary-bg),#F0EDFF);border-radius:var(--radius-xl);border:1px solid rgba(108,71,255,0.2);">
            <h3 style="font-size:18px;font-weight:700;margin-bottom:8px;">스타일샷 세트로 확장하기</h3>
            <p style="font-size:14px;color:var(--text-muted);margin-bottom:16px;">피팅컷을 기반으로 상세용, 광고용, SNS용, 룩북용 이미지 세트를 추가 생성할 수 있습니다.</p>
            <div style="display:flex;gap:12px;flex-wrap:wrap;">
              <button class="btn btn-primary btn-sm" onclick="showToast('스타일샷 세트 생성 중...', 'info')">상세페이지용 세트</button>
              <button class="btn btn-secondary btn-sm" onclick="showToast('스타일샷 세트 생성 중...', 'info')">광고용 세트</button>
              <button class="btn btn-secondary btn-sm" onclick="showToast('스타일샷 세트 생성 중...', 'info')">SNS용 세트</button>
              <button class="btn btn-secondary btn-sm" onclick="showToast('스타일샷 세트 생성 중...', 'info')">룩북용 세트</button>
            </div>
          </div>
        </div>

        <div class="step-nav" style="flex-shrink:0;">
          <button class="step-nav-back" onclick="window.location.href='/dashboard'">
            <i class="fas fa-th-large"></i> 대시보드로
          </button>
          <button class="step-nav-next" onclick="window.location.href='/generator'">
            <i class="fas fa-plus"></i> 새 프로젝트
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Image View Modal -->
  <div class="modal-overlay image-modal" id="imageModal">
    <div class="modal-box" style="max-width:900px;width:95vw;padding:0;overflow:hidden;background:var(--dark);">
      <button class="modal-close" style="background:rgba(255,255,255,0.1);color:white;top:16px;right:16px;z-index:10;" onclick="closeModal('imageModal')">×</button>
      <div class="image-modal-inner">
        <div class="image-modal-preview">
          <img id="modalImage" src="" alt="생성된 이미지" />
        </div>
        <div class="image-modal-sidebar">
          <div class="image-modal-title" id="modalImageTitle">생성된 피팅컷</div>
          <div class="image-modal-meta" id="modalImageMeta">832 × 1216px · PNG</div>
          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:16px 0;" />
          <div class="image-modal-actions">
            <button class="btn btn-primary btn-full" onclick="downloadImage()">
              <i class="fas fa-download"></i> 다운로드
            </button>
            <button class="btn btn-full" style="background:rgba(255,255,255,0.1);color:white;" onclick="toggleFavorite()">
              <i class="fas fa-heart" id="modalFavIcon"></i> 즐겨찾기
            </button>
          </div>
          <div style="margin-top:auto;">
            <div style="font-size:11px;color:var(--gray-4);line-height:1.6;" id="modalImageDetail">
              생성 모델: Atlas Cloud AI<br />
              해상도: 832 × 1216px<br />
              형식: PNG
            </div>
          </div>
        </div>
      </div>
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
</div>

<script>
const NL = String.fromCharCode(10)
let adminPassword = ''

// ── 프리셋 데이터 (한글) ──
const PRESETS = {
  styleGuide: {
    studio:     '소니 A7R V, 85mm f/1.4 렌즈로 촬영. 대형 소프트박스 주조명, 보조 반사판, 미묘한 림라이트의 전문 스튜디오 세팅. 깨끗한 화이트 사이클로라마 배경. 색 보정: 중립~따뜻한 톤, 완벽한 피부 재현.',
    editorial:  '후지필름 GFX 100S 중형 카메라, 110mm f/2 렌즈 촬영. 카메라 왼쪽의 자연 확산 창문광, 보조 반사판. 색 보정: 깨끗한 중립 피부 톤, 약간 따뜻한 하이라이트. 패션 에디토리얼 무드: 우아하고 세련된 매거진 커버 품질.',
    outdoor:    '캐논 EOS R5, 50mm f/1.8 촬영. 황금 시간대 야외 조명, 부드러운 자연 보케 배경. 따뜻한 시네마틱 색 보정. 상쾌하고 생동감 있는 패션 라이프스타일 사진 느낌.',
    luxury:     '핫셀블라드 X2D 100C, 90mm f/2.2 촬영. 극적인 명암 대비 스튜디오 조명에 미묘한 보조 조명. 깊은 그림자, 풍부한 대비. 하이패션 럭셔리 브랜드 미학: 고급스럽고 세련되며 에디토리얼 최고 수준.',
    minimal:    '소니 A7R V, 55mm f/1.8 촬영. 깨끗한 미니멀 미학: 플랫 레이 또는 단순 배경, 균일한 확산 조명, 그림자 없음. 스칸디나비아 인스파이어드, 절제되고 우아한 스타일.',
    streetwear: '라이카 Q3, 28mm f/1.7 촬영. 도시 환경, 자연 가용 조명, 진정성을 위한 약간의 그레인. 스트릿 스타일 에디토리얼: 역동적이고 자연스러운 느낌, 청년 문화 에너지.',
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
    const names = ['prompt','models','bgs']
    b.classList.toggle('active', names[i] === name)
  })
  document.getElementById('tabPrompt').classList.toggle('active', name === 'prompt')
  document.getElementById('tabModels').classList.toggle('active', name === 'models')
  document.getElementById('tabBgs').classList.toggle('active', name === 'bgs')
  if (name === 'models') loadCustomModels()
  if (name === 'bgs')    loadCustomBgs()
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

// ─── 공통: FileReader → base64 ───
function readFileAsBase64(file) {
  return new Promise(resolve => {
    const r = new FileReader()
    r.onload = e => resolve(e.target.result)
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
  await fetch('/api/admin/models/' + id, {method:'DELETE', headers:{'X-Admin-Password':adminPassword}})
  loadCustomModels()
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
        '<button class="del-btn" onclick="deleteModel(' + "'" + m.id + "'" + ')"><i class="fas fa-times"></i></button>' +
        '<div class="meta"><div class="name">' + m.name + '</div><div class="desc">' + (m.desc || '-') + '</div></div>' +
        '</div>'
      ).join('') + '</div>'
  } catch(e) { grid.innerHTML = '<div class="empty-state"><p>불러오기 실패</p></div>' }
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
  await fetch('/api/admin/backgrounds/' + id, {method:'DELETE', headers:{'X-Admin-Password':adminPassword}})
  loadCustomBgs()
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
        '<button class="del-btn" onclick="deleteBg(' + "'" + b.id + "'" + ')"><i class="fas fa-times"></i></button>' +
        '<div class="meta"><div class="name">' + b.name + '</div><div class="desc">' + b.category + ' · ' + (b.bgDesc || '-') + '</div></div>' +
        '</div>'
      ).join('') + '</div>'
  } catch(e) { grid.innerHTML = '<div class="empty-state"><p>불러오기 실패</p></div>' }
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
