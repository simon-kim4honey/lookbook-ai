// ────────────────────────────────────────────────────
// 브랜드 리드(Lead) 파이프라인 — 수집 · 분류 · 분석 · 아웃리치 초안
//
// 범위(1단계): 공개 브랜드 디렉토리/수동 CSV 수집 → 스타일·가격대 분류 →
// 영업 우선순위 분석 → 국가별(ko/en/ja) 이메일 초안 생성까지.
// 실제 발송은 하지 않음 — 모든 초안은 status='draft'로 생성되며
// 관리자가 검토 후 status='reviewed'로 바꾸고 본인 메일함에서 수동 발송한다.
// (스팸 관련 법령 및 각 플랫폼 이용약관 준수를 위한 설계)
// ────────────────────────────────────────────────────
import { Hono } from 'hono'

type LeadBindings = {
  LOOKBOOK_DB: D1Database
  ADMIN_PASSWORD: string
  ANTHROPIC_API_KEY?: string
}

const leads = new Hono<{ Bindings: LeadBindings }>()

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
leads.use('/*', adminAuth)

// ────────────────────────────────────────────────────
// Platforms
// ────────────────────────────────────────────────────
leads.get('/platforms', async (c) => {
  const { results } = await c.env.LOOKBOOK_DB.prepare(
    `SELECT * FROM lead_platforms ORDER BY country, name`
  ).all()
  return c.json({ success: true, platforms: results })
})

leads.post('/platforms', async (c) => {
  const b = await c.req.json()
  if (!b.code || !b.country || !b.name) {
    return c.json({ success: false, message: 'code, country, name은 필수입니다.' }, 400)
  }
  await c.env.LOOKBOOK_DB.prepare(
    `INSERT INTO lead_platforms (country, code, name, directory_url, list_selector, name_selector, link_selector, category_selector, is_scrapable, notes)
     VALUES (?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(code) DO UPDATE SET
       country=excluded.country, name=excluded.name, directory_url=excluded.directory_url,
       list_selector=excluded.list_selector, name_selector=excluded.name_selector,
       link_selector=excluded.link_selector, category_selector=excluded.category_selector,
       is_scrapable=excluded.is_scrapable, notes=excluded.notes`
  ).bind(
    b.country, b.code, b.name, b.directory_url || null,
    b.list_selector || null, b.name_selector || null, b.link_selector || null, b.category_selector || null,
    b.is_scrapable ? 1 : 0, b.notes || null
  ).run()
  return c.json({ success: true })
})

// ────────────────────────────────────────────────────
// 수집: CSV(수동 업로드) — 가장 안전한 기본 경로
// 관리자 UI에서 CSV를 파싱해 rows(JSON)로 전송한다.
// ────────────────────────────────────────────────────
leads.post('/collect/csv', async (c) => {
  const b = await c.req.json()
  const { platformCode, rows } = b as { platformCode: string; rows: Array<{ name: string; category?: string; brand_url?: string; contact_email?: string }> }
  if (!platformCode || !Array.isArray(rows) || rows.length === 0) {
    return c.json({ success: false, message: 'platformCode와 rows(배열)가 필요합니다.' }, 400)
  }
  const platform = await c.env.LOOKBOOK_DB.prepare(`SELECT * FROM lead_platforms WHERE code = ?`).bind(platformCode).first<any>()
  if (!platform) return c.json({ success: false, message: '등록되지 않은 플랫폼 코드입니다.' }, 404)

  const job = await c.env.LOOKBOOK_DB.prepare(
    `INSERT INTO collection_jobs (platform_id, method, status) VALUES (?, 'csv', 'running')`
  ).bind(platform.id).run()
  const jobId = job.meta.last_row_id

  let inserted = 0
  try {
    for (const row of rows.slice(0, 2000)) {
      if (!row.name || !row.name.trim()) continue
      const r = await c.env.LOOKBOOK_DB.prepare(
        `INSERT OR IGNORE INTO brands (platform_id, country, name, category, brand_url, contact_email, source, status)
         VALUES (?,?,?,?,?,?, 'manual_csv', 'new')`
      ).bind(platform.id, platform.country, row.name.trim(), row.category || null, row.brand_url || null, row.contact_email || null).run()
      if (r.meta.changes > 0) inserted++
    }
    await c.env.LOOKBOOK_DB.prepare(
      `UPDATE collection_jobs SET status='success', collected_count=?, finished_at=datetime('now') WHERE id=?`
    ).bind(inserted, jobId).run()
  } catch (e: any) {
    await c.env.LOOKBOOK_DB.prepare(
      `UPDATE collection_jobs SET status='failed', error=?, finished_at=datetime('now') WHERE id=?`
    ).bind(String(e?.message || e), jobId).run()
    return c.json({ success: false, message: '수집 중 오류: ' + String(e?.message || e) }, 500)
  }
  return c.json({ success: true, inserted, jobId })
})

// ────────────────────────────────────────────────────
// 수집: 공개 브랜드 디렉토리 스크래핑
// - platform.is_scrapable=1 이고 셀렉터가 등록된 경우에만 동작
// - robots.txt를 먼저 확인해 Disallow 경로면 중단
// - 브랜드명/카테고리/URL만 수집 (담당자 연락처 등 개인정보성 데이터는 수집하지 않음)
// ────────────────────────────────────────────────────
async function isAllowedByRobots(targetUrl: string): Promise<boolean> {
  try {
    const u = new URL(targetUrl)
    const robotsUrl = `${u.origin}/robots.txt`
    const res = await fetch(robotsUrl, { headers: { 'User-Agent': 'LookbookAI-LeadBot/1.0' } })
    if (!res.ok) return true // robots.txt 없으면 차단 규칙 없음으로 간주
    const text = await res.text()
    const path = u.pathname || '/'
    let applies = false
    let disallowed = false
    for (const rawLine of text.split('\n')) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const [keyRaw, ...rest] = line.split(':')
      const key = keyRaw.trim().toLowerCase()
      const value = rest.join(':').trim()
      if (key === 'user-agent') {
        applies = (value === '*')
      } else if (applies && key === 'disallow' && value) {
        if (path.startsWith(value)) disallowed = true
      }
    }
    return !disallowed
  } catch {
    return true
  }
}

leads.post('/collect/scrape', async (c) => {
  const { platformId } = await c.req.json()
  const platform = await c.env.LOOKBOOK_DB.prepare(`SELECT * FROM lead_platforms WHERE id = ?`).bind(platformId).first<any>()
  if (!platform) return c.json({ success: false, message: '플랫폼을 찾을 수 없습니다.' }, 404)
  if (!platform.is_scrapable) {
    return c.json({ success: false, message: '이 플랫폼은 is_scrapable=0 입니다. 이용약관/robots.txt를 확인하고 셀렉터를 검증한 뒤 관리자가 직접 활성화해야 합니다.' }, 400)
  }
  if (!platform.directory_url || !platform.list_selector) {
    return c.json({ success: false, message: 'directory_url과 list_selector를 먼저 등록하세요.' }, 400)
  }

  const allowed = await isAllowedByRobots(platform.directory_url)
  if (!allowed) {
    return c.json({ success: false, message: 'robots.txt에 의해 해당 경로 크롤링이 금지되어 있습니다. 수집을 중단합니다.' }, 403)
  }

  const job = await c.env.LOOKBOOK_DB.prepare(
    `INSERT INTO collection_jobs (platform_id, method, status) VALUES (?, 'scrape', 'running')`
  ).bind(platform.id).run()
  const jobId = job.meta.last_row_id

  try {
    const res = await fetch(platform.directory_url, {
      headers: { 'User-Agent': 'LookbookAI-LeadBot/1.0 (+brand outreach lead collection; contact: admin of lookbook-ai)' },
    })
    if (!res.ok) throw new Error(`대상 페이지 응답 오류: HTTP ${res.status}`)
    const html = await res.text()

    // 브랜드 항목(각각 <a> 요소여야 함: text=브랜드명, href=브랜드 URL)
    const items: Array<{ name: string; href: string }> = []
    await new HTMLRewriter()
      .on(platform.list_selector, {
        element(el: any) {
          items.push({ name: '', href: el.getAttribute('href') || '' })
          ;(el as any)._captureIndex = items.length - 1
        },
        text(t: any) {
          if (items.length > 0) {
            items[items.length - 1].name += t.text
          }
        },
      })
      .transform(new Response(html))
      .text()

    const categories: string[] = []
    if (platform.category_selector) {
      let buf = ''
      await new HTMLRewriter()
        .on(`${platform.list_selector} ${platform.category_selector}`, {
          text(t: any) { buf += t.text; if (t.lastInTextNode) { categories.push(buf.trim()); buf = '' } },
        })
        .transform(new Response(html))
        .text()
    }

    const base = new URL(platform.directory_url)
    let inserted = 0
    for (let i = 0; i < Math.min(items.length, 300); i++) {
      const name = items[i].name.trim()
      if (!name) continue
      let url = items[i].href
      try { url = new URL(url, base).toString() } catch {}
      const category = categories[i] || null
      const r = await c.env.LOOKBOOK_DB.prepare(
        `INSERT OR IGNORE INTO brands (platform_id, country, name, category, brand_url, source, status)
         VALUES (?,?,?,?,?, 'scrape', 'new')`
      ).bind(platform.id, platform.country, name, category, url).run()
      if (r.meta.changes > 0) inserted++
    }

    await c.env.LOOKBOOK_DB.prepare(
      `UPDATE collection_jobs SET status='success', collected_count=?, finished_at=datetime('now') WHERE id=?`
    ).bind(inserted, jobId).run()
    return c.json({ success: true, inserted, totalParsed: items.length, jobId })
  } catch (e: any) {
    await c.env.LOOKBOOK_DB.prepare(
      `UPDATE collection_jobs SET status='failed', error=?, finished_at=datetime('now') WHERE id=?`
    ).bind(String(e?.message || e), jobId).run()
    return c.json({ success: false, message: '수집 중 오류: ' + String(e?.message || e) }, 500)
  }
})

leads.get('/jobs', async (c) => {
  const { results } = await c.env.LOOKBOOK_DB.prepare(
    `SELECT j.*, p.name AS platform_name, p.code AS platform_code
     FROM collection_jobs j LEFT JOIN lead_platforms p ON p.id = j.platform_id
     ORDER BY j.started_at DESC LIMIT 50`
  ).all()
  return c.json({ success: true, jobs: results })
})

// ────────────────────────────────────────────────────
// Brands 조회
// ────────────────────────────────────────────────────
leads.get('/brands', async (c) => {
  const country = c.req.query('country')
  const platformId = c.req.query('platformId')
  const status = c.req.query('status')
  const search = c.req.query('search')
  const limit = Math.min(Number(c.req.query('limit') || 100), 500)
  const offset = Number(c.req.query('offset') || 0)

  let sql = `
    SELECT b.*, p.name AS platform_name, p.code AS platform_code,
           a.style_tags, a.target_customer, a.price_tier, a.lookbook_need_score, a.priority_score, a.ai_summary,
           (SELECT COUNT(*) FROM outreach_drafts d WHERE d.brand_id = b.id) AS draft_count
    FROM brands b
    LEFT JOIN lead_platforms p ON p.id = b.platform_id
    LEFT JOIN brand_analysis a ON a.id = (SELECT id FROM brand_analysis WHERE brand_id = b.id ORDER BY analyzed_at DESC LIMIT 1)
    WHERE 1=1
  `
  const args: any[] = []
  if (country) { sql += ` AND b.country = ?`; args.push(country) }
  if (platformId) { sql += ` AND b.platform_id = ?`; args.push(platformId) }
  if (status) { sql += ` AND b.status = ?`; args.push(status) }
  if (search) { sql += ` AND b.name LIKE ?`; args.push(`%${search}%`) }
  sql += ` ORDER BY COALESCE(a.priority_score, -1) DESC, b.collected_at DESC LIMIT ? OFFSET ?`
  args.push(limit, offset)

  const { results } = await c.env.LOOKBOOK_DB.prepare(sql).bind(...args).all()
  return c.json({ success: true, brands: results })
})

leads.get('/brands/:id', async (c) => {
  const id = c.req.param('id')
  const brand = await c.env.LOOKBOOK_DB.prepare(`SELECT * FROM brands WHERE id = ?`).bind(id).first()
  if (!brand) return c.json({ success: false, message: '브랜드를 찾을 수 없습니다.' }, 404)
  const { results: analyses } = await c.env.LOOKBOOK_DB.prepare(
    `SELECT * FROM brand_analysis WHERE brand_id = ? ORDER BY analyzed_at DESC`
  ).bind(id).all()
  const { results: drafts } = await c.env.LOOKBOOK_DB.prepare(
    `SELECT * FROM outreach_drafts WHERE brand_id = ? ORDER BY created_at DESC`
  ).bind(id).all()
  return c.json({ success: true, brand, analyses, drafts })
})

leads.patch('/brands/:id', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json()
  const fields: string[] = []
  const args: any[] = []
  for (const k of ['status', 'category', 'brand_url', 'contact_email']) {
    if (b[k] !== undefined) { fields.push(`${k} = ?`); args.push(b[k]) }
  }
  if (fields.length === 0) return c.json({ success: false, message: '변경할 필드가 없습니다.' }, 400)
  args.push(id)
  await c.env.LOOKBOOK_DB.prepare(`UPDATE brands SET ${fields.join(', ')} WHERE id = ?`).bind(...args).run()
  return c.json({ success: true })
})

// ────────────────────────────────────────────────────
// 분석: 휴리스틱 기본, ANTHROPIC_API_KEY가 설정되어 있으면 Claude로 고도화
// ────────────────────────────────────────────────────
const STYLE_KEYWORDS: Record<string, string[]> = {
  street:  ['스트릿', '스트리트', 'street', 'ストリート'],
  casual:  ['캐주얼', 'casual', 'カジュアル'],
  minimal: ['미니멀', 'minimal', 'ミニマル', 'contemporary', '컨템포러리'],
  luxury:  ['럭셔리', 'luxury', '디자이너', 'designer', 'ラグジュアリー'],
  golf:    ['골프', 'golf', 'ゴルフ'],
  outdoor: ['아웃도어', 'outdoor', 'アウトドア'],
  formal:  ['포멀', '수트', 'suit', 'formal', 'オフィス', 'フォーマル'],
  vintage: ['빈티지', 'vintage', 'ヴィンテージ', '古着'],
  kids:    ['키즈', '아동', 'kids', 'baby', 'キッズ'],
  lingerie:['언더웨어', '속옷', 'lingerie', 'ランジェリー'],
  shoes:   ['슈즈', '신발', 'shoes', '靴'],
  bag:     ['가방', 'bag', 'バッグ'],
}
const PRICE_TIER_KEYWORDS: Record<string, string[]> = {
  luxury:  ['럭셔리', 'luxury', '디자이너', 'designer', 'ラグジュアリー'],
  premium: ['프리미엄', 'premium', '컨템포러리', 'contemporary'],
  budget:  ['보세', '균일가', 'budget', '저가', 'プチプラ'],
}

function heuristicAnalyze(name: string, category: string | null) {
  const text = `${name} ${category || ''}`.toLowerCase()
  const tags: string[] = []
  for (const [tag, kws] of Object.entries(STYLE_KEYWORDS)) {
    if (kws.some((k) => text.includes(k.toLowerCase()))) tags.push(tag)
  }
  let priceTier = 'mid'
  for (const [tier, kws] of Object.entries(PRICE_TIER_KEYWORDS)) {
    if (kws.some((k) => text.includes(k.toLowerCase()))) { priceTier = tier; break }
  }
  let lookbookNeed = 55
  if (tags.includes('street') || tags.includes('casual') || tags.includes('minimal')) lookbookNeed += 15
  if (tags.includes('shoes') || tags.includes('bag')) lookbookNeed -= 10
  lookbookNeed = Math.max(0, Math.min(100, lookbookNeed))

  const tierWeight: Record<string, number> = { budget: 40, mid: 60, premium: 80, luxury: 70 }
  const priority = Math.round(lookbookNeed * 0.7 + (tierWeight[priceTier] || 60) * 0.3)

  const summary = `${name}은(는) ${category || '패션'} 카테고리${tags.length ? ` (${tags.join(', ')} 스타일)` : ''}로 추정되며, 가격대는 ${priceTier} 수준으로 분류됩니다. 시즌 룩북 갱신 빈도가 높을 가능성이 있어 AI 룩북 자동 생성 제안 대상으로 적합합니다.`

  return {
    style_tags: tags,
    target_customer: tags.includes('kids') ? '키즈/부모' : '20~30대 일반 소비자(추정)',
    price_tier: priceTier,
    lookbook_need_score: lookbookNeed,
    priority_score: Math.max(0, Math.min(100, priority)),
    ai_summary: summary,
    analysis_method: 'heuristic' as const,
  }
}

async function claudeAnalyze(env: LeadBindings, name: string, category: string | null, country: string) {
  const lang = country === 'US' ? 'English' : country === 'JP' ? '日本語' : '한국어'
  const prompt = `You are a B2B market analyst for an AI fashion lookbook generation SaaS. Given a fashion brand name and category, return ONLY strict JSON (no markdown fences) with this shape:
{"style_tags": string[], "target_customer": string, "price_tier": "budget"|"mid"|"premium"|"luxury", "lookbook_need_score": number(0-100), "priority_score": number(0-100), "ai_summary": string}
The ai_summary must be written in ${lang}, 2-3 sentences, explaining why this brand may need frequent AI-generated lookbook imagery.
Brand name: ${name}
Category: ${category || 'unknown'}
Country: ${country}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`Claude API 오류: HTTP ${res.status}`)
  const data = await res.json<any>()
  const text = data?.content?.[0]?.text || '{}'
  const cleaned = text.replace(/^```json\s*|```$/g, '').trim()
  const parsed = JSON.parse(cleaned)
  return {
    style_tags: parsed.style_tags || [],
    target_customer: parsed.target_customer || '',
    price_tier: parsed.price_tier || 'mid',
    lookbook_need_score: Math.max(0, Math.min(100, Number(parsed.lookbook_need_score) || 0)),
    priority_score: Math.max(0, Math.min(100, Number(parsed.priority_score) || 0)),
    ai_summary: parsed.ai_summary || '',
    analysis_method: 'claude' as const,
  }
}

leads.post('/analyze', async (c) => {
  const b = await c.req.json()
  const { brandIds, platformId, onlyUnanalyzed } = b as { brandIds?: number[]; platformId?: number; onlyUnanalyzed?: boolean }

  let targetIds: number[] = []
  if (brandIds && brandIds.length) {
    targetIds = brandIds
  } else if (platformId) {
    let sql = `SELECT id FROM brands WHERE platform_id = ?`
    if (onlyUnanalyzed) sql += ` AND status = 'new'`
    const { results } = await c.env.LOOKBOOK_DB.prepare(sql).bind(platformId).all<any>()
    targetIds = results.map((r) => r.id)
  } else {
    return c.json({ success: false, message: 'brandIds 또는 platformId가 필요합니다.' }, 400)
  }
  targetIds = targetIds.slice(0, 100) // 요청당 상한

  const useClaude = !!c.env.ANTHROPIC_API_KEY
  let analyzed = 0
  const errors: string[] = []

  for (const id of targetIds) {
    const brand = await c.env.LOOKBOOK_DB.prepare(`SELECT * FROM brands WHERE id = ?`).bind(id).first<any>()
    if (!brand) continue
    let result
    try {
      result = useClaude
        ? await claudeAnalyze(c.env, brand.name, brand.category, brand.country)
        : heuristicAnalyze(brand.name, brand.category)
    } catch (e) {
      result = heuristicAnalyze(brand.name, brand.category) // Claude 실패 시 휴리스틱으로 폴백
      errors.push(`brand ${id}: ${String((e as any)?.message || e)}`)
    }
    await c.env.LOOKBOOK_DB.prepare(
      `INSERT INTO brand_analysis (brand_id, style_tags, target_customer, price_tier, lookbook_need_score, priority_score, ai_summary, analysis_method)
       VALUES (?,?,?,?,?,?,?,?)`
    ).bind(id, JSON.stringify(result.style_tags), result.target_customer, result.price_tier, result.lookbook_need_score, result.priority_score, result.ai_summary, result.analysis_method).run()
    await c.env.LOOKBOOK_DB.prepare(`UPDATE brands SET status = 'analyzed' WHERE id = ? AND status = 'new'`).bind(id).run()
    analyzed++
  }

  return c.json({ success: true, analyzed, method: useClaude ? 'claude' : 'heuristic', errors: errors.slice(0, 10) })
})

// ────────────────────────────────────────────────────
// 아웃리치 초안 생성 (항상 status='draft' — 수동 검토 후 발송)
// ────────────────────────────────────────────────────
const SERVICE_PITCH = {
  ko: {
    valueProps: [
      '촬영 스튜디오·모델 섭외 없이 몇 분 만에 시즌 룩북 이미지를 생성',
      '다양한 AI 모델·배경 프리셋으로 여러 컨셉을 동시에 테스트',
      '크레딧제 과금으로 소량 생산도 부담 없이 시작 가능',
    ],
  },
  en: {
    valueProps: [
      'Generate seasonal lookbook imagery in minutes — no studio or model booking required',
      'Test multiple concepts at once with a range of AI model & background presets',
      'Pay-as-you-go credits, so even small runs are affordable',
    ],
  },
  ja: {
    valueProps: [
      'スタジオ撮影やモデル手配なしで、数分でシーズンルックブック画像を生成',
      '多彩なAIモデル・背景プリセットで複数のコンセプトを同時にテスト',
      'クレジット制課金で少量からでも気軽に開始可能',
    ],
  },
}

function templateDraft(lang: 'ko' | 'en' | 'ja', brandName: string, styleTags: string[], priceTier: string) {
  const pitch = SERVICE_PITCH[lang]
  if (lang === 'ko') {
    return {
      subject: `[제안] ${brandName}님을 위한 AI 룩북 자동 생성 서비스 소개`,
      body: `안녕하세요, ${brandName} 담당자님.\n\n저희는 AI로 패션 룩북 이미지를 자동 생성하는 서비스를 운영하고 있습니다. 공개된 브랜드 정보를 바탕으로 ${brandName}님과 잘 맞을 것 같아 연락드립니다.\n\n- ${pitch.valueProps.join('\n- ')}\n\n${styleTags.length ? `${styleTags.join('/')} 스타일` : '시즌 컬렉션'} 룩북 제작에 활용해보실 의향이 있으시면, 샘플 이미지를 먼저 보내드리고 싶습니다.\n\n관심 없으시면 회신으로 말씀해 주세요. 더 이상 연락드리지 않겠습니다.\n\n감사합니다.\n[초안 — 검토 후 발신자 정보/연락처를 채워 넣고 발송하세요]`,
    }
  }
  if (lang === 'ja') {
    return {
      subject: `【ご提案】${brandName}様向けAIルックブック自動生成サービスのご紹介`,
      body: `${brandName}ご担当者様\n\nはじめまして。AIでファッションルックブック画像を自動生成するサービスを運営しております。公開されているブランド情報を拝見し、${brandName}様に合うのではと思いご連絡いたしました。\n\n- ${pitch.valueProps.join('\n- ')}\n\n${styleTags.length ? `${styleTags.join('/')}系` : 'シーズンコレクション'}のルックブック制作にご活用いただけそうでしたら、サンプル画像をお送りいたします。\n\nご不要な場合は返信にてお知らせください。以後のご連絡は控えさせていただきます。\n\nよろしくお願いいたします。\n[下書き — 送信前に差出人情報を追記してください]`,
    }
  }
  return {
    subject: `Quick idea for ${brandName}'s next lookbook`,
    body: `Hi ${brandName} team,\n\nWe run an AI-powered fashion lookbook generation service, and based on your brand's public profile we thought this could be a good fit.\n\n- ${pitch.valueProps.join('\n- ')}\n\nIf you're open to it, we'd love to send over a few sample images${styleTags.length ? ` in a ${styleTags.join('/')} style` : ''} for your next collection.\n\nNot interested? Just reply and we won't follow up again.\n\nBest,\n[Draft — add sender contact info before sending]`,
  }
}

async function claudeDraft(env: LeadBindings, lang: 'ko' | 'en' | 'ja', brandName: string, category: string | null, styleTags: string[], targetCustomer: string) {
  const langName = lang === 'ko' ? 'Korean' : lang === 'ja' ? 'Japanese' : 'English'
  const prompt = `Write a short, professional B2B cold-outreach email (under 150 words) in ${langName} from an AI fashion lookbook generation SaaS to a fashion brand called "${brandName}" (category: ${category || 'unknown'}, style: ${styleTags.join(', ') || 'unknown'}, target customer: ${targetCustomer || 'unknown'}). Tone: friendly, non-spammy, no exaggerated claims, easy opt-out line included. Return ONLY strict JSON: {"subject": string, "body": string}`
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-5', max_tokens: 600, messages: [{ role: 'user', content: prompt }] }),
  })
  if (!res.ok) throw new Error(`Claude API 오류: HTTP ${res.status}`)
  const data = await res.json<any>()
  const text = (data?.content?.[0]?.text || '{}').replace(/^```json\s*|```$/g, '').trim()
  return JSON.parse(text) as { subject: string; body: string }
}

leads.post('/drafts/generate', async (c) => {
  const b = await c.req.json()
  const { brandIds, language } = b as { brandIds: number[]; language?: 'ko' | 'en' | 'ja' }
  if (!Array.isArray(brandIds) || brandIds.length === 0) {
    return c.json({ success: false, message: 'brandIds가 필요합니다.' }, 400)
  }
  const useClaude = !!c.env.ANTHROPIC_API_KEY
  let created = 0
  const errors: string[] = []

  for (const id of brandIds.slice(0, 50)) {
    const brand = await c.env.LOOKBOOK_DB.prepare(`SELECT * FROM brands WHERE id = ?`).bind(id).first<any>()
    if (!brand) continue
    const analysis = await c.env.LOOKBOOK_DB.prepare(
      `SELECT * FROM brand_analysis WHERE brand_id = ? ORDER BY analyzed_at DESC LIMIT 1`
    ).bind(id).first<any>()
    const lang = language || (brand.country === 'US' ? 'en' : brand.country === 'JP' ? 'ja' : 'ko')
    const styleTags = analysis?.style_tags ? JSON.parse(analysis.style_tags) : []
    const priceTier = analysis?.price_tier || 'mid'

    let draft: { subject: string; body: string }
    let method: 'template' | 'claude' = 'template'
    try {
      if (useClaude) {
        draft = await claudeDraft(c.env, lang, brand.name, brand.category, styleTags, analysis?.target_customer || '')
        method = 'claude'
      } else {
        draft = templateDraft(lang, brand.name, styleTags, priceTier)
      }
    } catch (e) {
      draft = templateDraft(lang, brand.name, styleTags, priceTier)
      errors.push(`brand ${id}: ${String((e as any)?.message || e)}`)
    }

    await c.env.LOOKBOOK_DB.prepare(
      `INSERT INTO outreach_drafts (brand_id, language, channel, subject, body, generation_method, status)
       VALUES (?,?, 'email', ?, ?, ?, 'draft')`
    ).bind(id, lang, draft.subject, draft.body, method).run()
    await c.env.LOOKBOOK_DB.prepare(`UPDATE brands SET status = 'drafted' WHERE id = ?`).bind(id).run()
    created++
  }

  return c.json({ success: true, created, method: useClaude ? 'claude' : 'template', errors: errors.slice(0, 10) })
})

leads.get('/drafts', async (c) => {
  const status = c.req.query('status')
  const language = c.req.query('language')
  let sql = `SELECT d.*, b.name AS brand_name, b.country, b.brand_url FROM outreach_drafts d JOIN brands b ON b.id = d.brand_id WHERE 1=1`
  const args: any[] = []
  if (status) { sql += ` AND d.status = ?`; args.push(status) }
  if (language) { sql += ` AND d.language = ?`; args.push(language) }
  sql += ` ORDER BY d.created_at DESC LIMIT 200`
  const { results } = await c.env.LOOKBOOK_DB.prepare(sql).bind(...args).all()
  return c.json({ success: true, drafts: results })
})

leads.patch('/drafts/:id', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json()
  const fields: string[] = []
  const args: any[] = []
  if (b.subject !== undefined) { fields.push('subject = ?'); args.push(b.subject) }
  if (b.body !== undefined) { fields.push('body = ?'); args.push(b.body) }
  if (b.status !== undefined) {
    fields.push('status = ?'); args.push(b.status)
    if (b.status === 'reviewed') fields.push(`reviewed_at = datetime('now')`)
    if (b.status === 'sent') fields.push(`sent_at = datetime('now')`)
  }
  if (fields.length === 0) return c.json({ success: false, message: '변경할 필드가 없습니다.' }, 400)
  args.push(id)
  await c.env.LOOKBOOK_DB.prepare(`UPDATE outreach_drafts SET ${fields.join(', ')} WHERE id = ?`).bind(...args).run()
  return c.json({ success: true })
})

// ────────────────────────────────────────────────────
// 통계 & CSV 내보내기 (수동 발송 워크플로용)
// ────────────────────────────────────────────────────
leads.get('/stats', async (c) => {
  const { results: byCountry } = await c.env.LOOKBOOK_DB.prepare(
    `SELECT country, COUNT(*) AS total, SUM(CASE WHEN status='new' THEN 1 ELSE 0 END) AS new_count,
            SUM(CASE WHEN status='analyzed' THEN 1 ELSE 0 END) AS analyzed_count,
            SUM(CASE WHEN status='drafted' THEN 1 ELSE 0 END) AS drafted_count,
            SUM(CASE WHEN status='contacted' THEN 1 ELSE 0 END) AS contacted_count
     FROM brands GROUP BY country`
  ).all()
  const { results: draftsByStatus } = await c.env.LOOKBOOK_DB.prepare(
    `SELECT status, COUNT(*) AS total FROM outreach_drafts GROUP BY status`
  ).all()
  return c.json({ success: true, byCountry, draftsByStatus })
})

leads.get('/export.csv', async (c) => {
  const { results } = await c.env.LOOKBOOK_DB.prepare(
    `SELECT b.id, b.country, p.name AS platform, b.name AS brand, b.category, b.brand_url, b.contact_email, b.status,
            a.price_tier, a.priority_score, d.language, d.subject, d.body AS draft_body, d.status AS draft_status
     FROM brands b
     LEFT JOIN lead_platforms p ON p.id = b.platform_id
     LEFT JOIN brand_analysis a ON a.id = (SELECT id FROM brand_analysis WHERE brand_id=b.id ORDER BY analyzed_at DESC LIMIT 1)
     LEFT JOIN outreach_drafts d ON d.id = (SELECT id FROM outreach_drafts WHERE brand_id=b.id ORDER BY created_at DESC LIMIT 1)
     ORDER BY a.priority_score DESC`
  ).all<any>()

  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const header = ['id','country','platform','brand','category','brand_url','contact_email','status','price_tier','priority_score','language','subject','draft_body','draft_status']
  const lines = [header.join(',')]
  for (const r of results) {
    lines.push(header.map((h) => esc((r as any)[h])).join(','))
  }
  return c.text(lines.join('\n'), 200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': 'attachment; filename="brand_leads_export.csv"',
  })
})

export default leads
