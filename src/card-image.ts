// ────────────────────────────────────────────────────
// 주간 트렌드 분석 — 다이제스트 카드를 SNS 공유용 "카드뉴스" 이미지로 재가공.
//
// 1) Claude가 원본 다이제스트 문구(사실 전달 위주)를 SNS에 어울리는 짧고
//    임팩트 있는 헤드라인/서브라인으로 다시 씀("AI가 재가공").
// 2) EZlook 브랜드 톤(다크 오로라 그라데이션)의 SVG 카드를 직접 문자열로 그린다.
//
// (처음엔 satori + WASM 레이아웃 엔진으로 시도했으나, 이 프로젝트의 Vite→
// Cloudflare Pages 번들링 과정에서 satori가 내장한 WASM 자동 로더가 "Cannot
// read properties of undefined (reading 'href')"로 깨졌다 — satori/standalone +
// 수동 init()으로 바꿔도 동일 — Node에서는 멀쩡히 되는데 번들된 Worker에서만
// 재현되는 번들러 호환성 문제였다. 카드가 고정 레이아웃이라 굳이 범용 flex
// 레이아웃 엔진이 필요 없으므로, WASM 의존성 자체를 없애고 좌표를 직접
// 계산하는 이 방식으로 교체했다.)
//
// 폰트는 임베드하지 않고 한국어 시스템 폰트 스택(Apple SD Gothic Neo/맑은 고딕
// 등)에 맡긴다 — 브랜드 폰트(Pretendard) 완전 일치보다, WASM/폰트 임베딩 없이
// 안정적으로 동작하는 쪽을 택함. 보는 사람 대부분의 기기에 깔려 있는 폰트라
// 실제 품질 차이는 크지 않다.
// ────────────────────────────────────────────────────

export type CardImageInput = {
  type: 'news' | 'search_trend' | 'shopping_insight'
  typeLabel: string
  period: string
  title: string
  body: string
  statText?: string
  statColor?: string
}

// Claude로 원본 문구를 SNS용 헤드라인/서브라인으로 재가공.
// ANTHROPIC_API_KEY 미설정이거나 호출 실패 시 원본 문구를 적당히 잘라
// 그대로 사용(카드 생성 자체는 계속 진행 — AI 윤문은 "있으면 더 좋은" 보강).
export async function rewriteForCardNews(
  apiKey: string | undefined,
  input: Pick<CardImageInput, 'typeLabel' | 'title' | 'body' | 'statText'>
): Promise<{ headline: string; subline: string }> {
  // 줄바꿈은 renderCardSvg의 wrapByChars가 알아서 처리하므로, 여기서는
  // 단어 경계를 넘지 않는 선에서만 넉넉히 자른다(어색하게 중간이 잘리는 것 방지)
  const trimAtWord = (s: string, max: number) => {
    const t = s.replace(/\s+/g, ' ').trim()
    if (t.length <= max) return t
    const cut = t.slice(0, max)
    const lastSpace = cut.lastIndexOf(' ')
    return (lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut).trim()
  }
  const fallback = {
    headline: trimAtWord(input.title, 30),
    subline: trimAtWord(input.body, 60),
  }
  if (!apiKey) return fallback

  const prompt = `다음은 EZlook 주간 트렌드 분석 콘텐츠입니다. 인스타그램 등 SNS에 공유할 카드뉴스용으로 다시 써주세요.

[유형] ${input.typeLabel}
[제목/키워드] ${input.title}
[본문] ${input.body}
${input.statText ? `[수치] ${input.statText}` : ''}

요구사항:
- headline: 14자 내외의 임팩트 있는 한 줄 헤드라인(느낌표·이모지 없이, 과장·클릭베이트 금지, 사실 왜곡 금지)
- subline: 28자 내외의 보조 설명 한 줄

아래 JSON 형식으로만 응답하세요(마크다운 코드펜스 없이):
{"headline": string, "subline": string}`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'User-Agent': 'EZlook-card-image/1.0 (+https://aifashion.co.kr)',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        thinking: { type: 'disabled' },
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return fallback
    const data = await res.json<any>()
    const textBlock = (data?.content || []).find((b: any) => b.type === 'text')
    const text = (textBlock?.text || '{}').replace(/^```json\s*|```$/g, '').trim()
    const parsed = JSON.parse(text)
    if (!parsed.headline || !parsed.subline) return fallback
    return { headline: String(parsed.headline).slice(0, 40), subline: String(parsed.subline).slice(0, 60) }
  } catch {
    return fallback
  }
}

function escXml(s: string): string {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// 긴 문자열을 글자수 기준으로 줄바꿈(한글/영문 혼용이라 폭 계산 대신 글자수
// 추정 — 카드뉴스용 짧은 문구라 이 정도 근사로 충분하다)
function wrapByChars(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.split(/(\s+)/).filter((w) => w !== '')
  const lines: string[] = []
  let current = ''
  for (const w of words) {
    if ((current + w).length > maxCharsPerLine && current.trim()) {
      lines.push(current.trim())
      current = w
      if (lines.length >= maxLines - 1) break
    } else {
      current += w
    }
  }
  if (current.trim()) lines.push(current.trim())
  if (lines.length > maxLines) lines.length = maxLines
  // 단어 단위로도 안 끊기는 긴 토큰(공백 없는 문자열)은 강제로 자른다
  return lines.map((l) => (l.length > maxCharsPerLine + 4 ? l.slice(0, maxCharsPerLine + 2) + '…' : l))
}

const FONT_STACK = "'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR','Noto Sans CJK KR',sans-serif"

// 카드뉴스는 생성 즉시 사용자 소유의 SNS 콘텐츠가 된다 — EZlook 로고/유형
// 배지/날짜/ezlook.co.kr 같은 자체 브랜딩을 네 모퉁이에서 전부 빼고, 내용
// (통계 수치 + 헤드라인 + 서브라인)만 담아 그 사람이 자유롭게 쓸 수 있게 한다.
export function renderCardSvg(input: CardImageInput, copy: { headline: string; subline: string }): string {
  const W = 1080
  const H = 1350
  const padX = 64

  const headlineLines = wrapByChars(copy.headline, 13, 3)
  const sublineLines = wrapByChars(copy.subline, 22, 3)

  // 중앙 블록(통계 숫자 + 헤드라인 + 서브라인)을 카드 전체 높이 기준으로
  // 수직 중앙 정렬하기 위해 블록 높이를 먼저 계산한다
  const statBlockH = input.statText ? 150 : 0
  const headlineLineH = 82
  const sublineLineH = 44
  const gap = 26
  const blockH =
    statBlockH +
    (input.statText ? gap : 0) +
    headlineLines.length * headlineLineH +
    gap +
    sublineLines.length * sublineLineH

  let cursorY = Math.max(padX, (H - blockH) / 2)

  const parts: string[] = []

  // 배경
  parts.push(`
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#051334"/>
        <stop offset="60%" stop-color="#0450A0"/>
        <stop offset="100%" stop-color="#0579B3"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
  `)

  // 중앙: 통계 숫자(있으면) + 헤드라인 + 서브라인
  if (input.statText) {
    parts.push(`<text x="${padX}" y="${cursorY + 110}" font-family="${FONT_STACK}" font-size="128" font-weight="800" fill="${escXml(input.statColor || '#ffffff')}">${escXml(input.statText)}</text>`)
    cursorY += statBlockH + gap
  }
  headlineLines.forEach((line, i) => {
    parts.push(`<text x="${padX}" y="${cursorY + (i + 1) * headlineLineH - 22}" font-family="${FONT_STACK}" font-size="64" font-weight="800" fill="#ffffff">${escXml(line)}</text>`)
  })
  cursorY += headlineLines.length * headlineLineH + gap
  sublineLines.forEach((line, i) => {
    parts.push(`<text x="${padX}" y="${cursorY + (i + 1) * sublineLineH - 12}" font-family="${FONT_STACK}" font-size="32" font-weight="500" fill="rgba(255,255,255,0.78)">${escXml(line)}</text>`)
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join('')}</svg>`
}
