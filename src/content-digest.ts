// ────────────────────────────────────────────────────
// 패션 콘텐츠 다이제스트 — 주간 패션 뉴스 자동 수집·요약
// 네이버 뉴스 검색 API 수집 → Claude로 분류/요약 → 관리자 검토 →
// (현재는 수동으로) 카카오톡 채널에 발행
//
// (예전에는 Google News RSS를 썼으나, Cloudflare Workers의 공유 egress IP가
// Google에 의해 자동화 요청으로 차단(HTTP 503)되어 네이버 뉴스 검색 API로 교체함)
//
// GitHub Actions 스케줄(.github/workflows/weekly-content-digest.yml)에서 매주 자동
// 호출되거나, 관리자가 /generate를 수동 호출해도 동일하게 동작한다.
// ────────────────────────────────────────────────────
import { Hono } from 'hono'

type DigestBindings = {
  LOOKBOOK_DB: D1Database
  ADMIN_PASSWORD: string
  ANTHROPIC_API_KEY?: string
  NAVER_CLIENT_ID?: string
  NAVER_CLIENT_SECRET?: string
}

const digest = new Hono<{ Bindings: DigestBindings }>()

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
digest.use('/*', adminAuth)

// ────────────────────────────────────────────────────
// 뉴스 수집 (네이버 뉴스 검색 API, JSON)
// https://developers.naver.com/docs/serviceapi/search/news/news.md
// ────────────────────────────────────────────────────
const KEYWORDS = [
  '패션 트렌드', '패션 브랜드', 'K-패션', '패션 이커머스', '온라인 쇼핑몰 패션',
  '패션 스타트업', 'AI 패션', '패션 플랫폼',
]

// 검색어트렌드/쇼핑인사이트는 뉴스용 주제어(KEYWORDS)와 달리 실제 검색/구매로 이어지는
// 품목 단위 키워드를 써야 의미가 있다 (예: "패션 트렌드"는 검색량 자체가 낮아 트렌드 비교에 부적합)
const ITEM_KEYWORDS = ['원피스', '니트', '코트', '청바지', '가디건', '맨투맨', '패딩', '블라우스']

type RawArticle = { title: string; link: string; pubDate: string; source: string }

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
}

// 네이버 검색 API는 검색어 일치 부분에 <b>...</b> 태그를 넣어서 응답한다.
function stripNaverHighlight(s: string): string {
  return decodeEntities(s.replace(/<\/?b>/g, '')).trim()
}

async function fetchNewsFromNaver(env: DigestBindings, keyword: string, maxItems: number): Promise<RawArticle[]> {
  if (!env.NAVER_CLIENT_ID || !env.NAVER_CLIENT_SECRET) return []
  const url = `https://naverapihub.apigw.ntruss.com/search/v1/news?query=${encodeURIComponent(keyword)}&display=${maxItems}&sort=date`
  try {
    const res = await fetch(url, {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': env.NAVER_CLIENT_ID,
        'X-NCP-APIGW-API-KEY': env.NAVER_CLIENT_SECRET,
      },
      signal: AbortSignal.timeout(12000), // 소스 하나가 느려도 전체 파이프라인이 무한 대기하지 않도록
    })
    if (!res.ok) return []
    const data = await res.json<any>()
    const items = Array.isArray(data?.items) ? data.items : []
    return items.map((it: any) => {
      const link = it.originallink || it.link || ''
      let source = ''
      try { source = link ? new URL(link).hostname.replace(/^www\./, '') : '' } catch {}
      return {
        title: stripNaverHighlight(it.title || ''),
        link,
        pubDate: it.pubDate || '',
        source,
      }
    }).slice(0, maxItems)
  } catch {
    return []
  }
}

async function collectArticles(env: DigestBindings, daysBack: number): Promise<RawArticle[]> {
  const pools = await Promise.all(KEYWORDS.map((kw) => fetchNewsFromNaver(env, kw, 12)))
  const cutoff = Date.now() - daysBack * 24 * 60 * 60 * 1000
  const seen = new Set<string>()
  const merged: RawArticle[] = []
  for (const pool of pools) {
    for (const a of pool) {
      const key = a.link || a.title
      if (!key || seen.has(key)) continue
      const t = a.pubDate ? Date.parse(a.pubDate) : NaN
      if (!isNaN(t) && t < cutoff) continue // 발행일이 파싱되는데 기간 밖이면 제외 (파싱 실패시엔 일단 포함)
      seen.add(key)
      merged.push(a)
    }
  }
  return merged.slice(0, 40) // Claude 호출당 상한
}

// ────────────────────────────────────────────────────
// 검색어트렌드 / 쇼핑인사이트 (네이버 데이터랩 API)
// 최근 2주치를 주 단위로 조회해서 "직전 주 대비 이번 주" 변화율만 계산한다
// (절대 검색량이 아니라 상대 비율(ratio)이라 절대 수치는 의미가 없음)
// https://developers.naver.com/docs/serviceapi/datalab/search/search.md
// https://developers.naver.com/docs/serviceapi/datalab/shopping/shopping.md
// ────────────────────────────────────────────────────
type TrendPoint = { label: string; changePct: number }

function trendDateRange(): { start: string; end: string } {
  const end = new Date()
  const start = new Date(end.getTime() - 14 * 24 * 60 * 60 * 1000)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { start: fmt(start), end: fmt(end) }
}

function computeChangePct(points: Array<{ ratio: number }>): number | null {
  if (!points || points.length < 2) return null
  const prev = points[points.length - 2].ratio
  const cur = points[points.length - 1].ratio
  if (!prev) return null
  return Math.round(((cur - prev) / prev) * 1000) / 10
}

async function fetchSearchTrends(env: DigestBindings, keywords: string[]): Promise<TrendPoint[]> {
  if (!env.NAVER_CLIENT_ID || !env.NAVER_CLIENT_SECRET) return []
  const { start, end } = trendDateRange()
  // 네이버 데이터랩 검색어트렌드 API는 요청당 keywordGroups 최대 5개까지만 허용
  const batches: string[][] = []
  for (let i = 0; i < keywords.length; i += 5) batches.push(keywords.slice(i, i + 5))

  const results: TrendPoint[] = []
  for (const batch of batches) {
    try {
      const res = await fetch('https://naverapihub.apigw.ntruss.com/search-trend/v1/search', {
        method: 'POST',
        headers: {
          'X-NCP-APIGW-API-KEY-ID': env.NAVER_CLIENT_ID,
          'X-NCP-APIGW-API-KEY': env.NAVER_CLIENT_SECRET,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: start,
          endDate: end,
          timeUnit: 'week',
          keywordGroups: batch.map((kw) => ({ groupName: kw, keywords: [kw] })),
        }),
        signal: AbortSignal.timeout(12000),
      })
      if (!res.ok) continue
      const data = await res.json<any>()
      for (const group of data?.results || []) {
        const changePct = computeChangePct(group.data || [])
        if (changePct !== null) results.push({ label: group.title, changePct })
      }
    } catch {
      // 이 배치만 건너뛰고 나머지는 계속 시도
    }
  }
  return results
}

// "패션의류" 대분류 카테고리(네이버 데이터랩 공식 문서 예시 코드) 안에서, 품목 키워드별
// 클릭 트렌드를 조회한다 (PDF의 "키워드별 클릭 인사이트" 활용 예시와 동일한 방식).
const SHOPPING_CATEGORY = { name: '패션의류', code: '50000000' }

async function fetchShoppingInsight(env: DigestBindings, keywords: string[]): Promise<TrendPoint[]> {
  if (!env.NAVER_CLIENT_ID || !env.NAVER_CLIENT_SECRET) return []
  const { start, end } = trendDateRange()
  // 네이버 데이터랩 쇼핑인사이트 API도 요청당 keyword 최대 5개까지만 허용
  const batches: string[][] = []
  for (let i = 0; i < keywords.length; i += 5) batches.push(keywords.slice(i, i + 5))

  const out: TrendPoint[] = []
  for (const batch of batches) {
    try {
      const res = await fetch('https://naverapihub.apigw.ntruss.com/shopping/v1/category/keywords', {
        method: 'POST',
        headers: {
          'X-NCP-APIGW-API-KEY-ID': env.NAVER_CLIENT_ID,
          'X-NCP-APIGW-API-KEY': env.NAVER_CLIENT_SECRET,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: start,
          endDate: end,
          timeUnit: 'week',
          category: SHOPPING_CATEGORY.code,
          keyword: batch.map((kw) => ({ name: kw, param: [kw] })),
        }),
        signal: AbortSignal.timeout(12000),
      })
      if (!res.ok) continue
      const data = await res.json<any>()
      for (const group of data?.results || []) {
        const changePct = computeChangePct(group.data || [])
        if (changePct !== null) out.push({ label: group.title, changePct })
      }
    } catch {
      // 이 배치만 건너뛰고 나머지는 계속 시도
    }
  }
  return out
}

// ────────────────────────────────────────────────────
// Claude로 분류 + 요약 (1회 호출)
// ────────────────────────────────────────────────────
const REPORT_CATEGORIES = ['트렌드', '브랜드', '유통', '시장', '글로벌']

async function classifyAndSummarize(env: DigestBindings, articles: RawArticle[]) {
  if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다.')
  if (!articles.length) return { summary: '이번 주 수집된 기사가 없습니다.', keywords: [], items: [] as any[] }

  const list = articles
    .map((a, i) => `${i + 1}. [${a.source || '출처미상'}] ${a.title}`)
    .join('\n')

  const prompt = `당신은 국내 중소 패션 브랜드를 위한 패션 산업 뉴스 큐레이터입니다.
아래는 최근 수집된 패션 관련 뉴스 제목 목록입니다. 이 중에서 국내 중소 패션 브랜드 운영자가 알아두면 좋을 기사를 최대 8개 선별하고, 카카오톡 채널 메시지로 보낼 수 있게 정리해주세요.

규칙:
- 카테고리는 반드시 "트렌드"|"브랜드"|"유통"|"시장"|"글로벌" 중 하나
- 각 기사 summary는 2문장 이내, 실무자가 바로 이해할 수 있는 쉬운 표현
- importance는 1~5 정수 (중소 브랜드 실무 관련성 기준)
- overallSummary는 이번 주 전체를 아우르는 3~4문장 요약 (카톡 메시지 인트로용)
- keywords는 이번 주 핵심 키워드 5~8개

기사 목록:
${list}

원본 목록 순번(1-based)을 idx로 사용해서, 아래 JSON 형식으로만 응답하세요 (마크다운 코드펜스 없이):
{"overallSummary": string, "keywords": string[], "items": [{"idx": number, "category": string, "summary": string, "importance": number}]}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(45000),
  })
  if (!res.ok) throw new Error(`Claude API 오류: HTTP ${res.status}`)
  const data = await res.json<any>()
  const text = (data?.content?.[0]?.text || '{}').replace(/^```json\s*|```$/g, '').trim()
  const parsed = JSON.parse(text)

  const items = (parsed.items || [])
    .filter((it: any) => it.idx >= 1 && it.idx <= articles.length)
    .map((it: any) => {
      const a = articles[it.idx - 1]
      return {
        category: REPORT_CATEGORIES.includes(it.category) ? it.category : '트렌드',
        title: a.title,
        source: a.source || '',
        url: a.link,
        published_at: a.pubDate,
        summary: it.summary || '',
        importance: Math.max(1, Math.min(5, Number(it.importance) || 3)),
      }
    })

  return { summary: parsed.overallSummary || '', keywords: parsed.keywords || [], items }
}

// ────────────────────────────────────────────────────
// 파이프라인 실행 (수동 트리거 / cron 공용)
// ────────────────────────────────────────────────────
export type DigestType = 'news' | 'search_trend' | 'shopping_insight'

function currentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${Math.ceil(now.getDate() / 7)}주차`
}

// 월: 기사(news), 수: 검색어트렌드(search_trend), 금: 쇼핑인사이트(shopping_insight) —
// 요일별로 서로 다른 내용의 다이제스트를 만든다 (하나로 합치면 카톡 메시지가 너무 길어짐)
export async function runDigestPipeline(env: DigestBindings, type: DigestType = 'news'): Promise<{ digestId: number; articleCount: number }> {
  const db = env.LOOKBOOK_DB
  const period = currentPeriod()

  if (type === 'search_trend' || type === 'shopping_insight') {
    const trends = type === 'search_trend'
      ? await fetchSearchTrends(env, ITEM_KEYWORDS)
      : await fetchShoppingInsight(env, ITEM_KEYWORDS)

    const label = type === 'search_trend' ? '검색어트렌드' : '쇼핑인사이트'
    const summary = trends.length
      ? `이번 주 ${label} — 품목별 전주 대비 변화율입니다.`
      : `이번 주 ${label} 데이터를 가져오지 못했습니다.`

    const insertDigest = await db.prepare(
      `INSERT INTO content_digests (period, status, summary, keywords, type) VALUES (?, 'draft', ?, '[]', ?)`
    ).bind(period, summary, type).run()
    const digestId = insertDigest.meta.last_row_id as number

    for (const t of trends) {
      await db.prepare(
        `INSERT INTO digest_trends (digest_id, type, label, change_pct) VALUES (?,?,?,?)`
      ).bind(digestId, type, t.label, t.changePct).run()
    }

    return { digestId, articleCount: trends.length }
  }

  const articles = await collectArticles(env, 7)
  const { summary, keywords, items } = await classifyAndSummarize(env, articles)

  const insertDigest = await db.prepare(
    `INSERT INTO content_digests (period, status, summary, keywords, type) VALUES (?, 'draft', ?, ?, 'news')`
  ).bind(period, summary, JSON.stringify(keywords)).run()
  const digestId = insertDigest.meta.last_row_id as number

  for (const it of items) {
    await db.prepare(
      `INSERT INTO digest_articles (digest_id, category, title, source, url, published_at, summary, importance)
       VALUES (?,?,?,?,?,?,?,?)`
    ).bind(digestId, it.category, it.title, it.source, it.url, it.published_at, it.summary, it.importance).run()
  }

  return { digestId, articleCount: items.length }
}

digest.post('/generate', async (c) => {
  const typeParam = c.req.query('type') || (await c.req.json().catch(() => ({})))?.type
  const type: DigestType = typeParam === 'search_trend' || typeParam === 'shopping_insight' ? typeParam : 'news'
  try {
    const result = await runDigestPipeline(c.env, type)
    return c.json({ success: true, ...result })
  } catch (e: any) {
    return c.json({ success: false, message: String(e?.message || e) }, 500)
  }
})

// ────────────────────────────────────────────────────
// 진단용: 네이버 뉴스 검색 API 요청이 실제로 어떻게 응답받는지 직접 확인
// (Cloudflare 로그 접근 없이도 원인 파악 가능하게)
// ────────────────────────────────────────────────────
digest.get('/debug-news', async (c) => {
  const keyword = c.req.query('kw') || KEYWORDS[0]
  if (!c.env.NAVER_CLIENT_ID || !c.env.NAVER_CLIENT_SECRET) {
    return c.json({ success: false, keyword, error: 'NAVER_CLIENT_ID/NAVER_CLIENT_SECRET이 설정되지 않았습니다.' })
  }
  const url = `https://naverapihub.apigw.ntruss.com/search/v1/news?query=${encodeURIComponent(keyword)}&display=10&sort=date`
  try {
    const res = await fetch(url, {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': c.env.NAVER_CLIENT_ID,
        'X-NCP-APIGW-API-KEY': c.env.NAVER_CLIENT_SECRET,
      },
      signal: AbortSignal.timeout(12000),
    })
    const text = await res.text()
    return c.json({
      success: true,
      keyword,
      url,
      httpStatus: res.status,
      contentType: res.headers.get('content-type'),
      bodyLength: text.length,
      bodyPreview: text.slice(0, 800),
    })
  } catch (e: any) {
    return c.json({ success: false, keyword, url, error: String(e?.message || e) })
  }
})

// 진단용: 검색어트렌드/쇼핑인사이트 데이터랩 API 원시 응답 직접 확인
digest.get('/debug-trends', async (c) => {
  if (!c.env.NAVER_CLIENT_ID || !c.env.NAVER_CLIENT_SECRET) {
    return c.json({ success: false, error: 'NAVER_CLIENT_ID/NAVER_CLIENT_SECRET이 설정되지 않았습니다.' })
  }
  // 일시적 진단용: 시크릿 값에 눈에 안 보이는 공백/줄바꿈이 섞여있는지 확인 (Worker 안에서만 401나는 문제 원인 파악)
  const envDebug = {
    clientIdRaw: JSON.stringify(c.env.NAVER_CLIENT_ID),
    clientIdLength: c.env.NAVER_CLIENT_ID.length,
    clientSecretRaw: JSON.stringify(c.env.NAVER_CLIENT_SECRET),
    clientSecretLength: c.env.NAVER_CLIENT_SECRET.length,
  }
  const { start, end } = trendDateRange()
  const authHeaders = {
    'X-NCP-APIGW-API-KEY-ID': c.env.NAVER_CLIENT_ID,
    'X-NCP-APIGW-API-KEY': c.env.NAVER_CLIENT_SECRET,
    'Content-Type': 'application/json',
  }
  try {
    const [searchRes, shoppingRes] = await Promise.all([
      fetch('https://naverapihub.apigw.ntruss.com/search-trend/v1/search', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          startDate: start, endDate: end, timeUnit: 'week',
          keywordGroups: ITEM_KEYWORDS.slice(0, 5).map((kw) => ({ groupName: kw, keywords: [kw] })),
        }),
        signal: AbortSignal.timeout(12000),
      }),
      fetch('https://naverapihub.apigw.ntruss.com/shopping/v1/category/keywords', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          startDate: start, endDate: end, timeUnit: 'week',
          category: SHOPPING_CATEGORY.code,
          keyword: ITEM_KEYWORDS.slice(0, 5).map((kw) => ({ name: kw, param: [kw] })),
        }),
        signal: AbortSignal.timeout(12000),
      }),
    ])
    const [searchText, shoppingText] = await Promise.all([searchRes.text(), shoppingRes.text()])
    return c.json({
      success: true,
      envDebug,
      searchTrend: { httpStatus: searchRes.status, body: searchText.slice(0, 1500) },
      shoppingInsight: { httpStatus: shoppingRes.status, body: shoppingText.slice(0, 1500) },
    })
  } catch (e: any) {
    return c.json({ success: false, envDebug, error: String(e?.message || e) })
  }
})

// ────────────────────────────────────────────────────
// 조회 / 검토 / 발행 표시
// ────────────────────────────────────────────────────
digest.get('/list', async (c) => {
  const { results } = await c.env.LOOKBOOK_DB.prepare(
    `SELECT d.*, (SELECT COUNT(*) FROM digest_articles a WHERE a.digest_id = d.id AND a.excluded = 0) AS article_count
     FROM content_digests d ORDER BY d.generated_at DESC LIMIT 50`
  ).all()
  return c.json({ success: true, digests: results })
})

digest.get('/:id', async (c) => {
  const id = c.req.param('id')
  const d = await c.env.LOOKBOOK_DB.prepare(`SELECT * FROM content_digests WHERE id = ?`).bind(id).first<any>()
  if (!d) return c.json({ success: false, message: '찾을 수 없습니다.' }, 404)
  const { results: articles } = await c.env.LOOKBOOK_DB.prepare(
    `SELECT * FROM digest_articles WHERE digest_id = ? ORDER BY importance DESC, id ASC`
  ).bind(id).all()
  const { results: trends } = await c.env.LOOKBOOK_DB.prepare(
    `SELECT * FROM digest_trends WHERE digest_id = ? ORDER BY change_pct DESC`
  ).bind(id).all()
  return c.json({ success: true, digest: { ...d, keywords: JSON.parse(d.keywords || '[]') }, articles, trends })
})

digest.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json()
  const fields: string[] = []
  const args: any[] = []
  if (b.summary !== undefined) { fields.push('summary = ?'); args.push(b.summary) }
  if (b.status !== undefined) {
    fields.push('status = ?'); args.push(b.status)
    if (b.status === 'reviewed') fields.push(`reviewed_at = datetime('now')`)
    if (b.status === 'sent') fields.push(`sent_at = datetime('now')`)
  }
  if (!fields.length) return c.json({ success: false, message: '변경할 필드가 없습니다.' }, 400)
  args.push(id)
  await c.env.LOOKBOOK_DB.prepare(`UPDATE content_digests SET ${fields.join(', ')} WHERE id = ?`).bind(...args).run()
  return c.json({ success: true })
})

digest.patch('/:id/articles/:articleId', async (c) => {
  const { articleId } = c.req.param()
  const b = await c.req.json()
  const fields: string[] = []
  const args: any[] = []
  if (b.excluded !== undefined) { fields.push('excluded = ?'); args.push(b.excluded ? 1 : 0) }
  if (b.summary !== undefined) { fields.push('summary = ?'); args.push(b.summary) }
  if (!fields.length) return c.json({ success: false, message: '변경할 필드가 없습니다.' }, 400)
  args.push(articleId)
  await c.env.LOOKBOOK_DB.prepare(`UPDATE digest_articles SET ${fields.join(', ')} WHERE id = ?`).bind(...args).run()
  return c.json({ success: true })
})

// 카톡 발행용 텍스트 포맷 생성 (관리자가 복사해서 카톡 채널 관리자센터에 붙여넣기)
digest.get('/:id/kakao-text', async (c) => {
  const id = c.req.param('id')
  const d = await c.env.LOOKBOOK_DB.prepare(`SELECT * FROM content_digests WHERE id = ?`).bind(id).first<any>()
  if (!d) return c.json({ success: false, message: '찾을 수 없습니다.' }, 404)
  const type: DigestType = d.type === 'search_trend' || d.type === 'shopping_insight' ? d.type : 'news'
  const fmtChange = (pct: number) => `${pct > 0 ? '📈+' : pct < 0 ? '📉' : '➖'}${pct}%`

  const lines: string[] = []
  if (type === 'news') {
    const { results: articles } = await c.env.LOOKBOOK_DB.prepare(
      `SELECT * FROM digest_articles WHERE digest_id = ? AND excluded = 0 ORDER BY importance DESC, id ASC LIMIT 5`
    ).bind(id).all<any>()
    lines.push(`🧵 EZlook 패션 트렌드 위클리 — ${d.period}`, '', d.summary, '')
    articles.forEach((a: any, i: number) => {
      lines.push(`${i + 1}. [${a.category}] ${a.title}`)
      lines.push(a.summary)
      if (a.url) lines.push(`🔗 ${a.url}`)
      lines.push('')
    })
  } else {
    const { results: trends } = await c.env.LOOKBOOK_DB.prepare(
      `SELECT * FROM digest_trends WHERE digest_id = ? ORDER BY change_pct DESC`
    ).bind(id).all<any>()
    const title = type === 'search_trend' ? '🔎 EZlook 검색어트렌드 위클리' : '🛍️ EZlook 쇼핑인사이트 위클리'
    lines.push(`${title} — ${d.period}`, '', d.summary, '')
    trends.forEach((t: any) => lines.push(`- ${t.label} ${fmtChange(t.change_pct)}`))
    lines.push('')
  }

  lines.push('👉 AI 룩북 무료 체험: https://www.aifashion.co.kr/?utm_source=kakao&utm_medium=channel&utm_campaign=weekly_digest')

  return c.text(lines.join('\n'))
})

export default digest
