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
import { logError } from './error-log'

type DigestBindings = {
  LOOKBOOK_DB: D1Database
  ADMIN_PASSWORD: string
  ANTHROPIC_API_KEY?: string
  NAVER_CLIENT_ID?: string
  NAVER_CLIENT_SECRET?: string
  GITHUB_TOKEN?: string
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
//
// 계절 무관하게 고정 8개만 쓰면 한겨울에도 원피스/블라우스가 계속 섞여 나오는 등
// 실무 체감과 어긋나서, 월 기준으로 계절 품목을 절반 정도 교체한다. 청바지/니트/가디건처럼
// 사계절 걸쳐 꾸준히 검색되는 품목은 공통으로 유지.
function seasonalItemKeywords(date: Date = new Date()): string[] {
  const month = date.getMonth() + 1 // 1~12
  const common = ['청바지', '니트', '가디건']
  if (month >= 3 && month <= 5) return [...common, '원피스', '블라우스', '트렌치코트', '스커트', '자켓'] // 봄
  if (month >= 6 && month <= 8) return [...common, '원피스', '반팔티', '린넨셔츠', '반바지', '샌들'] // 여름
  if (month >= 9 && month <= 11) return [...common, '코트', '맨투맨', '자켓', '부츠', '원피스'] // 가을
  return [...common, '패딩', '코트', '목도리', '맨투맨', '부츠'] // 겨울(12~2월)
}

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

// 네이버 API HUB 무료 한도(뉴스 월 775,000건 공유 / 검색어트렌드·쇼핑인사이트 각 월
// 50,000건) 근접 여부를 어드민에서 확인할 수 있도록 실제 호출마다 카운트를 쌓는다.
// 카운팅 자체의 실패가 본 기능에 영향을 주면 안 되므로 항상 실패를 삼킨다.
async function incrementNaverUsage(env: DigestBindings, apiType: 'news' | 'search_trend' | 'shopping_insight') {
  try {
    const yearMonth = new Date().toISOString().slice(0, 7)
    await env.LOOKBOOK_DB.prepare(
      `INSERT INTO naver_api_usage (year_month, api_type, call_count) VALUES (?, ?, 1)
       ON CONFLICT(year_month, api_type) DO UPDATE SET call_count = call_count + 1`
    ).bind(yearMonth, apiType).run()
  } catch {
    // 무시 — 사용량 집계 실패가 실제 API 호출 결과에 영향을 주면 안 됨
  }
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
    await incrementNaverUsage(env, 'news')
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
  // 네이버 데이터랩은 오늘이 포함된 "이번 주" 구간도 (아직 며칠 안 지났어도) 하나의 주간
  // 버킷으로 돌려준다 — 그래서 항상 최근 3주 이상을 가져와서, 아직 안 끝난 마지막 구간은
  // 버리고 그 앞의 "완전한 두 주"끼리 비교한다 (computeChangePct 참고).
  const end = new Date()
  const start = new Date(end.getTime() - 21 * 24 * 60 * 60 * 1000)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { start: fmt(start), end: fmt(end) }
}

function computeChangePct(points: Array<{ ratio: number }>): number | null {
  // 마지막 구간은 아직 끝나지 않은 이번 주(부분 데이터)라서 제외 — 그 앞의 완전한 두 주만 비교
  if (!points || points.length < 3) return null
  const prev = points[points.length - 3].ratio
  const cur = points[points.length - 2].ratio
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
      await incrementNaverUsage(env, 'search_trend')
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

async function fetchShoppingInsight(env: DigestBindings, keywords: string[], gender?: 'f' | 'm'): Promise<TrendPoint[]> {
  if (!env.NAVER_CLIENT_ID || !env.NAVER_CLIENT_SECRET) return []
  const { start, end } = trendDateRange()
  // 네이버 데이터랩 쇼핑인사이트 API도 요청당 keyword 최대 5개까지만 허용
  const batches: string[][] = []
  for (let i = 0; i < keywords.length; i += 5) batches.push(keywords.slice(i, i + 5))

  const out: TrendPoint[] = []
  for (const batch of batches) {
    try {
      const body: any = {
        startDate: start,
        endDate: end,
        timeUnit: 'week',
        category: SHOPPING_CATEGORY.code,
        keyword: batch.map((kw) => ({ name: kw, param: [kw] })),
      }
      if (gender) body.gender = gender
      const res = await fetch('https://naverapihub.apigw.ntruss.com/shopping/v1/category/keywords', {
        method: 'POST',
        headers: {
          'X-NCP-APIGW-API-KEY-ID': env.NAVER_CLIENT_ID,
          'X-NCP-APIGW-API-KEY': env.NAVER_CLIENT_SECRET,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(12000),
      })
      await incrementNaverUsage(env, 'shopping_insight')
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

// 쇼핑인사이트에 성별 구분이 없다는 지적으로 추가 — 같은 품목 목록을 여성/남성으로
// 나눠 조회해서 평균 증감률을 비교한다 (품목별 세부 비교까지는 API 호출이 너무
// 늘어나서, 이번 주 전체적으로 어느 쪽이 더 견인했는지 정도의 요약만 제공).
async function fetchShoppingInsightGenderSummary(env: DigestBindings, keywords: string[]): Promise<{ female: number; male: number } | null> {
  const [femaleTrends, maleTrends] = await Promise.all([
    fetchShoppingInsight(env, keywords, 'f'),
    fetchShoppingInsight(env, keywords, 'm'),
  ])
  if (!femaleTrends.length || !maleTrends.length) return null
  const avg = (arr: TrendPoint[]) => Math.round((arr.reduce((sum, t) => sum + t.changePct, 0) / arr.length) * 10) / 10
  return { female: avg(femaleTrends), male: avg(maleTrends) }
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

원본 목록 순번(1-based)을 idx로 사용해서, 아래 JSON 형식으로만 응답하세요 (마크다운 코드펜스 없이, 내부/시스템 태그 없이):
{"overallSummary": string, "keywords": string[], "items": [{"idx": number, "category": string, "summary": string, "importance": number}]}`

  // 2026-09-21: max_tokens: 3000으로 고정해도 HTTP 403 forbidden("Request not allowed")이
  // 간헐적으로 발생하는 게 실사용에서 확인됨 — 같은 요청을 바로 재시도하면 성공하는 경우가
  // 많아, 고정 상한값 문제가 아니라 Cloudflare Workers 엣지가 요청마다 다른 리전으로
  // 라우팅되며 일부만 걸리는 일시적 현상으로 추정됨. 최대 3회, 짧은 대기 후 재시도한다.
  let res: Response | null = null
  let lastErrorText = ''
  for (let attempt = 1; attempt <= 3; attempt++) {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        // Cloudflare Workers의 fetch 기본 User-Agent가 자동화 트래픽으로 분류돼 Anthropic
        // 쪽 엣지에서 간헐적으로 차단되는 것으로 의심돼(Anthropic 콘솔 사용량/한도는 정상인데도
        // HTTP 403 forbidden 발생) 표준 User-Agent를 명시해본다.
        'User-Agent': 'EZlook-ContentDigest/1.0 (+https://www.aifashion.co.kr)',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        // Sonnet 5는 thinking을 명시하지 않으면 기본으로 적응형 사고(thinking)가 켜진 채
        // 실행되어 max_tokens 예산을 상당 부분 잡아먹는다 — JSON 응답만 필요하므로 꺼둔다.
        thinking: { type: 'disabled' },
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(45000),
    })
    if (res.ok) break
    lastErrorText = (await res.text()).slice(0, 300)
    const retryable = res.status === 403 || res.status === 429 || res.status >= 500
    if (!retryable || attempt === 3) break
    await new Promise((r) => setTimeout(r, attempt * 800))
  }
  if (!res || !res.ok) throw new Error(`Claude API 오류: HTTP ${res?.status} — ${lastErrorText}`)
  const data = await res.json<any>()
  if (data?.stop_reason === 'max_tokens') {
    throw new Error('Claude API 응답이 max_tokens 제한으로 중간에 잘렸습니다. max_tokens를 늘려야 합니다.')
  }
  // content[0]이 항상 텍스트라고 가정하면 안 됨 — 최신 모델은 앞에 thinking 블록을 먼저 넣고
  // 그 뒤에 실제 답변(text 블록)을 넣는다. type이 'text'인 블록을 찾아야 함.
  const textBlock = (data?.content || []).find((b: any) => b.type === 'text')
  const text = (textBlock?.text || '{}').replace(/^```json\s*|```$/g, '').trim()
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

// 오르내림 상위 품목을 뽑아 실무자가 바로 판단할 수 있는 한 문장 인사이트를 만든다
// (Claude 호출 없이 결정론적으로 계산 — 검색어트렌드/쇼핑인사이트는 이미 숫자 자체가
// 명확해서 별도 AI 해석 없이도 "무엇을 해야 하는지"가 나온다)
function buildTrendInsight(type: 'search_trend' | 'shopping_insight', trends: TrendPoint[], genderSummary?: { female: number; male: number } | null): string {
  const metricLabel = type === 'search_trend' ? '검색 관심도' : '구매 클릭'
  const actionTip = type === 'search_trend'
    ? '오르는 품목 위주로 콘텐츠·마케팅 노출을 늘려보세요.'
    : '클릭이 느는 품목은 재고·프로모션을 우선 챙길 타이밍입니다.'

  // 쇼핑인사이트에 성별 구분이 없다는 지적으로 추가 — 두 성별 평균 증감률 차이가
  // 뚜렷할 때만(5%p 이상) 한 문장 덧붙인다 (차이가 미미하면 굳이 언급하지 않음).
  const genderNote = (() => {
    if (!genderSummary) return ''
    const diff = genderSummary.female - genderSummary.male
    if (Math.abs(diff) < 5) return ''
    const leader = diff > 0 ? '여성' : '남성'
    return ` 성별로 보면 ${leader} 고객의 클릭 증가가 더 두드러졌습니다 (여성 ${genderSummary.female > 0 ? '+' : ''}${genderSummary.female}% / 남성 ${genderSummary.male > 0 ? '+' : ''}${genderSummary.male}%).`
  })()

  if (!trends.length) return `이번 주 ${type === 'search_trend' ? '검색어트렌드' : '쇼핑인사이트'} 데이터를 가져오지 못했습니다.`

  const sorted = [...trends].sort((a, b) => b.changePct - a.changePct)
  const risers = sorted.filter((t) => t.changePct > 0)
  const fallers = sorted.filter((t) => t.changePct < 0).slice(-2).reverse()
  const fmt = (t: TrendPoint) => `${t.label}(${t.changePct > 0 ? '+' : ''}${t.changePct}%)`

  // 매주 똑같은 "~이 올랐다/내렸다" 패턴만 반복하지 않도록, 그 주 데이터의 실제 모양
  // (전원 상승/전원 하락/혼조/변화 미미/독주)에 따라 다른 문장 구조를 쓴다.
  const top = sorted[0]
  const second = sorted[1]
  const allFlat = sorted.every((t) => Math.abs(t.changePct) < 5)
  const allRising = fallers.length === 0 && risers.length === sorted.length
  const allFalling = risers.length === 0 && fallers.length > 0

  let base: string
  if (allFlat) {
    base = `이번 주 ${metricLabel}는 품목별로 큰 변화 없이 대체로 비슷한 수준을 유지했습니다 (전주 대비 ±5% 이내). ${actionTip}`
  } else if (allRising) {
    const list = risers.slice(0, 4).map(fmt).join(', ')
    base = `이번 주는 ${list} 등 추적 품목 전반이 고르게 상승했습니다. ${actionTip}`
  } else if (allFalling) {
    const list = fallers.slice(0, 4).map(fmt).join(', ')
    base = `이번 주는 ${list} 등 추적 품목 전반이 하락세입니다 — 계절 전환 등 일시적 요인일 수 있으니 다음 주 추이도 같이 확인해보세요.`
  } else if (top && second && top.changePct > 0 && top.changePct > second.changePct * 2 && top.changePct >= 30) {
    // 1위가 2위보다 2배 이상 튀는 "독주" 패턴이면 그 품목을 단독으로 강조
    const rest = risers.slice(1, 3).map(fmt).join(', ')
    base = `이번 주는 단연 ${fmt(top)}입니다 — 다른 품목보다 확실히 눈에 띄는 상승폭입니다.${rest ? ` (${rest}도 함께 올랐습니다)` : ''} ${actionTip}`
  } else {
    const topRisers = risers.slice(0, 3).map(fmt).join(', ')
    const topFallers = fallers.map(fmt).join(', ')
    base = topRisers
      ? `이번 주 ${metricLabel}는 ${topRisers}이 가장 크게 올랐습니다.`
      : `이번 주 ${metricLabel}는 오른 품목이 없습니다.`
    if (topFallers) base += ` 반대로 ${topFallers}는 하락세입니다.`
    base += ` ${actionTip}`
  }

  return base + genderNote
}

// 뉴스(월)와 검색어트렌드/쇼핑인사이트(수·금)가 요일별로 완전히 분리되어 생성되다
// 보니 "왜 이 품목이 뜨는지" 설명이 서로 연결되지 않는다는 지적으로 추가 — 같은
// 주차(period)의 월요일 뉴스 다이제스트 키워드와 이번 주 최고 상승 품목이 겹치면
// 한 줄로 연결해준다. 겹치는 게 없으면 조용히 빈 문자열을 반환한다(억지로 연결 안 함).
async function findNewsLinkNote(db: D1Database, period: string, trends: TrendPoint[]): Promise<string> {
  if (!trends.length) return ''
  try {
    const newsDigest = await db.prepare(
      `SELECT keywords FROM content_digests WHERE period = ? AND type = 'news' ORDER BY generated_at DESC LIMIT 1`
    ).bind(period).first<any>()
    if (!newsDigest) return ''
    const newsKeywords: string[] = JSON.parse(newsDigest.keywords || '[]')
    if (!newsKeywords.length) return ''

    const top = [...trends].sort((a, b) => b.changePct - a.changePct)[0]
    if (!top || top.changePct <= 0) return ''
    const matched = newsKeywords.find((kw) => kw.includes(top.label) || top.label.includes(kw))
    if (!matched) return ''
    return `참고로 이번 주 뉴스에서도 "${matched}" 키워드가 다뤄졌습니다 — 관련 기사를 월요일 기사 다이제스트에서 확인해보세요.`
  } catch {
    return ''
  }
}

// 월: 기사(news), 수: 검색어트렌드(search_trend), 금: 쇼핑인사이트(shopping_insight) —
// 요일별로 서로 다른 내용의 다이제스트를 만든다 (하나로 합치면 카톡 메시지가 너무 길어짐)
export async function runDigestPipeline(env: DigestBindings, type: DigestType = 'news'): Promise<{ digestId: number; articleCount: number }> {
  const db = env.LOOKBOOK_DB
  const period = currentPeriod()

  if (type === 'search_trend' || type === 'shopping_insight') {
    const keywords = seasonalItemKeywords()
    const trends = type === 'search_trend'
      ? await fetchSearchTrends(env, keywords)
      : await fetchShoppingInsight(env, keywords)
    const genderSummary = type === 'shopping_insight' ? await fetchShoppingInsightGenderSummary(env, keywords) : null

    let summary = buildTrendInsight(type, trends, genderSummary)
    const newsLink = await findNewsLinkNote(db, period, trends)
    if (newsLink) summary += ` ${newsLink}`

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
    // 조용히 비어있는 다이제스트로 넘어가지 않도록 — 기사/트렌드가 0건이면 실패는
    // 아니지만 뭔가 잘못됐을 가능성이 높다 (API 차단, 키워드 매칭 실패 등). 에러
    // 로그에 기록해서 어드민 "에러 로그" 탭/GitHub 이슈로 드러나게 한다.
    if (result.articleCount === 0) {
      await logError(c.env, {
        source: 'server',
        message: `콘텐츠 다이제스트(${type}) 생성 결과 0건`,
        route: '/api/admin/content-digest/generate',
        extra: { type, digestId: result.digestId },
      })
    }
    return c.json({ success: true, ...result })
  } catch (e: any) {
    await logError(c.env, {
      source: 'server',
      message: `콘텐츠 다이제스트(${type}) 생성 실패: ${String(e?.message || e)}`,
      stack: e?.stack,
      route: '/api/admin/content-digest/generate',
      extra: { type },
    })
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

// 진단용: classifyAndSummarize()가 실제로 호출하는 Claude API의 원본 응답을 그대로 보여준다
digest.get('/debug-classify', async (c) => {
  if (!c.env.ANTHROPIC_API_KEY) {
    return c.json({ success: false, error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다.' })
  }
  const articles = await collectArticles(c.env, 7)
  const list = articles.map((a, i) => `${i + 1}. [${a.source || '출처미상'}] ${a.title}`).join('\n')
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

원본 목록 순번(1-based)을 idx로 사용해서, 아래 JSON 형식으로만 응답하세요 (마크다운 코드펜스 없이, 내부/시스템 태그 없이):
{"overallSummary": string, "keywords": string[], "items": [{"idx": number, "category": string, "summary": string, "importance": number}]}`
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': c.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'User-Agent': 'EZlook-ContentDigest/1.0 (+https://www.aifashion.co.kr)',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        thinking: { type: 'disabled' },
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(45000),
    })
    const rawText = await res.text()
    let usage = null
    try { usage = JSON.parse(rawText)?.usage ?? null } catch {}
    return c.json({
      success: true,
      articleCount: articles.length,
      httpStatus: res.status,
      usage,
      rawBodyPreview: rawText.slice(0, 2000),
    })
  } catch (e: any) {
    return c.json({ success: false, articleCount: articles.length, error: String(e?.message || e) })
  }
})

// 진단용: 실제 "기사 생성"이 쓰는 collectArticles() 경로를 그대로 돌려서
// 키워드별로 몇 건 나왔고, 날짜 필터 전/후로 몇 건이 남는지 그대로 보여준다.
digest.get('/debug-collect', async (c) => {
  const perKeyword = await Promise.all(
    KEYWORDS.map(async (kw) => ({ keyword: kw, count: (await fetchNewsFromNaver(c.env, kw, 12)).length }))
  )
  const collected = await collectArticles(c.env, 7)
  return c.json({
    success: true,
    perKeyword,
    afterDedupeAndDateFilter: collected.length,
    sample: collected.slice(0, 3),
  })
})

// 진단용: 검색어트렌드/쇼핑인사이트 데이터랩 API 원시 응답 직접 확인
digest.get('/debug-trends', async (c) => {
  if (!c.env.NAVER_CLIENT_ID || !c.env.NAVER_CLIENT_SECRET) {
    return c.json({ success: false, error: 'NAVER_CLIENT_ID/NAVER_CLIENT_SECRET이 설정되지 않았습니다.' })
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
          keywordGroups: seasonalItemKeywords().slice(0, 5).map((kw) => ({ groupName: kw, keywords: [kw] })),
        }),
        signal: AbortSignal.timeout(12000),
      }),
      fetch('https://naverapihub.apigw.ntruss.com/shopping/v1/category/keywords', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          startDate: start, endDate: end, timeUnit: 'week',
          category: SHOPPING_CATEGORY.code,
          keyword: seasonalItemKeywords().slice(0, 5).map((kw) => ({ name: kw, param: [kw] })),
        }),
        signal: AbortSignal.timeout(12000),
      }),
    ])
    const [searchText, shoppingText] = await Promise.all([searchRes.text(), shoppingRes.text()])
    return c.json({
      success: true,
      searchTrend: { httpStatus: searchRes.status, body: searchText.slice(0, 1500) },
      shoppingInsight: { httpStatus: shoppingRes.status, body: shoppingText.slice(0, 1500) },
    })
  } catch (e: any) {
    return c.json({ success: false, error: String(e?.message || e) })
  }
})

// 네이버 API HUB 이번 달 사용량 (무료 한도 근접 여부 확인용)
const NAVER_MONTHLY_LIMITS: Record<string, number> = {
  news: 775000, // NAVER 검색 카테고리 공유 한도
  search_trend: 50000,
  shopping_insight: 50000,
}
digest.get('/usage', async (c) => {
  const yearMonth = new Date().toISOString().slice(0, 7)
  const { results } = await c.env.LOOKBOOK_DB.prepare(
    `SELECT api_type, call_count FROM naver_api_usage WHERE year_month = ?`
  ).bind(yearMonth).all<any>()
  const byType: Record<string, number> = { news: 0, search_trend: 0, shopping_insight: 0 }
  for (const r of results) byType[r.api_type] = r.call_count
  const usage = Object.keys(NAVER_MONTHLY_LIMITS).map((apiType) => ({
    apiType,
    count: byType[apiType] || 0,
    limit: NAVER_MONTHLY_LIMITS[apiType],
    pct: Math.round(((byType[apiType] || 0) / NAVER_MONTHLY_LIMITS[apiType]) * 1000) / 10,
  }))
  return c.json({ success: true, yearMonth, usage })
})

// ────────────────────────────────────────────────────
// 조회 / 검토 / 발행 표시
// ────────────────────────────────────────────────────
digest.get('/list', async (c) => {
  const type = c.req.query('type') // 'news' | 'search_trend' | 'shopping_insight' | 미지정(전체)
  const where = type ? `WHERE d.type = ?` : ''
  const binds = type ? [type] : []
  const { results } = await c.env.LOOKBOOK_DB.prepare(
    `SELECT d.*, (SELECT COUNT(*) FROM digest_articles a WHERE a.digest_id = d.id AND a.excluded = 0) AS article_count
     FROM content_digests d ${where} ORDER BY d.generated_at DESC LIMIT 50`
  ).bind(...binds).all()
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

digest.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.LOOKBOOK_DB.prepare(`DELETE FROM digest_articles WHERE digest_id = ?`).bind(id).run()
  await c.env.LOOKBOOK_DB.prepare(`DELETE FROM digest_trends WHERE digest_id = ?`).bind(id).run()
  await c.env.LOOKBOOK_DB.prepare(`DELETE FROM content_digests WHERE id = ?`).bind(id).run()
  return c.json({ success: true })
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
