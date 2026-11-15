// ────────────────────────────────────────────────────
// 서버 에러 기록 공용 헬퍼 — index.tsx, content-digest.ts 등 여러 라우트
// 모듈에서 공유해서 쓰기 위해 별도 파일로 분리 (index.tsx ↔ content-digest.ts
// 상호 import로 인한 순환 참조를 피하기 위함).
//
// GitHub 이슈 자동 생성 — 유지보수 세션의 샌드박스 환경이 *.pages.dev로의
// 아웃바운드 접속을 막고 있어(egress 정책, 계정 설정으로도 못 바꿈이 확인됨)
// 관리자 API를 직접 폴링하는 방식이 동작하지 않는다. 대신 Worker(아웃바운드 제한
// 없음)가 에러 발생 시 직접 GitHub 이슈를 만들고, 유지보수 세션은 GitHub 이슈만
// 확인하도록 우회 — GitHub API 호출은 세션 쪽에서 이미 정상 동작 확인됨.
// 같은 message+route로 24시간 내 이미 만든 이슈가 있으면 새로 만들지 않고
// 그 이슈 URL을 재사용한다(반복 에러가 이슈를 도배하지 않도록).
// ────────────────────────────────────────────────────
const GITHUB_REPO = 'simon-kim4honey/lookbook-ai'

async function findOrCreateGithubIssue(
  db: D1Database,
  githubToken: string | undefined,
  opts: { message: string; route: string | null; stack: string | null; source: string }
): Promise<string | null> {
  if (!githubToken) return null
  try {
    const dup: any = await db.prepare(
      `SELECT github_issue_url FROM error_logs
       WHERE message = ? AND (route = ? OR (route IS NULL AND ? IS NULL))
         AND github_issue_url IS NOT NULL
         AND created_at > datetime('now', '-1 day')
       ORDER BY created_at DESC LIMIT 1`
    ).bind(opts.message, opts.route, opts.route).first()
    if (dup?.github_issue_url) return dup.github_issue_url

    const title = `[자동 에러] ${opts.route || '(경로 없음)'} — ${opts.message}`.slice(0, 250)
    const body = [
      `**출처**: ${opts.source}`,
      `**경로/URL**: ${opts.route || '(없음)'}`,
      `**메시지**: ${opts.message}`,
      opts.stack ? `\n**스택 트레이스**\n\`\`\`\n${opts.stack.slice(0, 3000)}\n\`\`\`` : '',
      '\n---\nlookbook-ai 서버가 자동 생성한 이슈입니다. 유지보수 세션이 이 이슈를 보고 진단 후 수정 PR을 연결하면 `in-review` 라벨이 붙습니다. 실제 배포 확인 후 이 이슈를 닫아주세요.',
    ].join('\n')

    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'lookbook-ai-error-bot',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body, labels: ['auto-error'] }),
    })
    if (!res.ok) {
      console.error('[findOrCreateGithubIssue] GitHub API 실패:', res.status, await res.text())
      return null
    }
    const json: any = await res.json()
    return json.html_url || null
  } catch (e) {
    console.error('[findOrCreateGithubIssue] 실패 (무시):', e)
    return null
  }
}

// 서버 에러 기록 헬퍼 — 절대 요청 흐름을 막지 않도록 실패를 삼킨다(로깅 자체의
// 실패가 실제 API 응답에 영향을 주면 안 됨). message/stack은 D1 컬럼 폭주 방지로 길이 제한.
export async function logError(
  env: { LOOKBOOK_DB: D1Database; GITHUB_TOKEN?: string },
  opts: { source: 'client' | 'server'; message: string; stack?: string; route?: string; extra?: any }
) {
  try {
    const db = env.LOOKBOOK_DB
    const message = String(opts.message || '').slice(0, 2000)
    const stack = opts.stack ? String(opts.stack).slice(0, 4000) : null
    const route = opts.route ? String(opts.route).slice(0, 300) : null
    const extra = opts.extra ? JSON.stringify(opts.extra).slice(0, 2000) : null

    const issueUrl = await findOrCreateGithubIssue(db, env.GITHUB_TOKEN, { message, route, stack, source: opts.source })

    await db.prepare(
      `INSERT INTO error_logs (source, message, stack, route, extra, github_issue_url) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(opts.source, message, stack, route, extra, issueUrl).run()
  } catch (e) {
    console.error('[logError] 에러 기록 실패 (무시):', e)
  }
}
