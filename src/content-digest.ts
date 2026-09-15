// ────────────────────────────────────────────────────
// 패션 콘텐츠 다이제스트 — 주간 패션 뉴스 자동 수집·요약
// RSS(Google News) 수집 → Claude로 분류/요약 → 관리자 검토 →
// (현재는 수동으로) 카카오톡 채널에 발행
//
// Cloudflare Cron Trigger(scheduled 핸들러)에서 매주 자동 실행되거나,
// 관리자가 /generate를 수동 호출해도 동일하게 동작한다.
// ────────────────────────────────────────────────────
import { Hono } from 'hono'

type DigestBindings = {
  LOOKBOOK_DB: D1Database
  ADMIN_PASSWORD: string
  ANTHROPIC_API_KEY?: string
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
// RSS 수집 (Google News, 외부 라이브러리 없이 정규식 파싱)
// ────────────────────────────────────────────────────
const KEYWORDS = [
  '패션 트렌드', '패션 브랜드', 'K-패션', '패션 이커머스', '온라인 쇼핑몰 패션',
  '패션 스타트업', 'AI 패션', '패션 플랫폼',
]

type RawArticle = { title: string; link: string; pubDate: string; source: string }

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
}

function stripCdata(s: string): string {
  const m = s.match(/<!\[CDATA\[([\s\S]*?)\]\]>/)
  return decodeEntities((m ? m[1] : s).trim())
}

function parseRSSItems(xml: string): RawArticle[] {
  const items: RawArticle[] = []
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) || []
  for (const block of itemBlocks) {
    const title = (block.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || ''
    const link = (block.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || ''
    const pubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || ''
    const sourceMatch = block.match(/<source[^>]*>([\s\S]*?)<\/source>/)
    let source = sourceMatch ? stripCdata(sourceMatch[1]) : ''
    if (!source) {
      const titleText = stripCdata(title)
      const dashMatch = titleText.match(/[-–—]\s*([^-–—]+)$/)
      source = dashMatch ? dashMatch[1].trim() : ''
    }
    items.push({ title: stripCdata(title), link: stripCdata(link), pubDate: pubDate.trim(), source })
  }
  return items
}

async function fetchNewsFromRSS(keyword: string, maxItems: number): Promise<RawArticle[]> {
  // Google News RSS의 after:/before: 날짜 연산자는 결과를 0건으로 만들 만큼 불안정해서
  // 쿼리에서 날짜 제한을 빼고, 대신 아래 collectArticles()에서 pubDate로 직접 필터링한다.
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=ko&gl=KR&ceid=KR:ko`
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(12000), // 소스 하나가 느려도 전체 파이프라인이 무한 대기하지 않도록
    })
    if (!res.ok) return []
    const xml = await res.text()
    return parseRSSItems(xml).slice(0, maxItems)
  } catch {
    return []
  }
}

async function collectArticles(daysBack: number): Promise<RawArticle[]> {
  const pools = await Promise.all(KEYWORDS.map((kw) => fetchNewsFromRSS(kw, 12)))
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
export async function runDigestPipeline(env: DigestBindings): Promise<{ digestId: number; articleCount: number }> {
  const articles = await collectArticles(7)
  const { summary, keywords, items } = await classifyAndSummarize(env, articles)

  const now = new Date()
  const period = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${Math.ceil(now.getDate() / 7)}주차`

  const db = env.LOOKBOOK_DB
  const insertDigest = await db.prepare(
    `INSERT INTO content_digests (period, status, summary, keywords) VALUES (?, 'draft', ?, ?)`
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
  try {
    const result = await runDigestPipeline(c.env)
    return c.json({ success: true, ...result })
  } catch (e: any) {
    return c.json({ success: false, message: String(e?.message || e) }, 500)
  }
})

// ────────────────────────────────────────────────────
// 진단용: RSS 요청이 실제로 어떻게 응답받는지 직접 확인
// (Cloudflare 로그 접근 없이도 원인 파악 가능하게)
// ────────────────────────────────────────────────────
digest.get('/debug-rss', async (c) => {
  const keyword = c.req.query('kw') || KEYWORDS[0]
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=ko&gl=KR&ceid=KR:ko`
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(12000),
    })
    const text = await res.text()
    const items = parseRSSItems(text)
    return c.json({
      success: true,
      keyword,
      url,
      httpStatus: res.status,
      contentType: res.headers.get('content-type'),
      bodyLength: text.length,
      bodyPreview: text.slice(0, 800),
      parsedItemCount: items.length,
      firstItems: items.slice(0, 3),
    })
  } catch (e: any) {
    return c.json({ success: false, keyword, url, error: String(e?.message || e) })
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
  return c.json({ success: true, digest: { ...d, keywords: JSON.parse(d.keywords || '[]') }, articles })
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
  const { results: articles } = await c.env.LOOKBOOK_DB.prepare(
    `SELECT * FROM digest_articles WHERE digest_id = ? AND excluded = 0 ORDER BY importance DESC, id ASC LIMIT 5`
  ).bind(id).all<any>()

  const lines = [
    `🧵 EZlook 패션 트렌드 위클리 — ${d.period}`,
    '',
    d.summary,
    '',
  ]
  articles.forEach((a: any, i: number) => {
    lines.push(`${i + 1}. [${a.category}] ${a.title}`)
    lines.push(a.summary)
    if (a.url) lines.push(`🔗 ${a.url}`)
    lines.push('')
  })
  lines.push('👉 AI 룩북 무료 체험: https://www.aifashion.co.kr/?utm_source=kakao&utm_medium=channel&utm_campaign=weekly_digest')

  return c.text(lines.join('\n'))
})

export default digest
