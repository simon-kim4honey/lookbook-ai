import { appLogin } from '@apps-in-toss/web-framework'
import { useEffect, useState } from 'react'
import './App.css'

// 기존 lookbook-ai(EZlook) 사이트를 "이식"하는 방식.
// 새로 UI를 만드는 대신, 운영 사이트의 실제 생성기 화면(HTML/CSS/JS)을 그대로 가져와서
// 화면에 심는다 — 업로드 슬롯, 드래그앤드롭, 모델/배경 스와이프 카드, 생성 폴링 등
// 기존 사용성을 100% 그대로 재사용하기 위함. 자세한 배경은 toss-app/README.md 참고.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://www.aifashion.co.kr'

declare global {
  interface Window {
    AppState?: { user: unknown; [key: string]: unknown }
    initLocale?: () => Promise<void>
    initPage?: () => void
    updateUserUI?: () => void
    closeModal?: (id: string) => void
    showToast?: (message: string, type?: string) => void
  }
}

type TokenResponse = {
  success?: boolean
  message?: string
  user?: { name?: string; [key: string]: unknown }
  token?: string
}

function App() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function transplant() {
      try {
        // 1) 앞으로 생기는 모든 상대경로 요청(app.js가 런타임에 만드는 이미지 src, fetch 등)이
        //    운영 도메인으로 가도록 base href를 설정 — fetch를 몽키패치하는 것보다 안전하고
        //    <img src="/api/proxy/...">처럼 fetch를 거치지 않는 리소스에도 동일하게 적용됨.
        let base = document.querySelector('base')
        if (!base) {
          base = document.createElement('base')
          document.head.prepend(base)
        }
        base.setAttribute('href', `${API_BASE}/`)

        // 2) 운영 서버가 렌더링하는 생성기 페이지를 그대로 가져온다 (cors() 적용된 /api/* 경로).
        const res = await fetch(`${API_BASE}/api/toss/generator-html`)
        if (!res.ok) throw new Error(`generator-html fetch failed: ${res.status}`)
        const html = await res.text()
        if (cancelled) return

        const doc = new DOMParser().parseFromString(html, 'text/html')

        // 3) 원본이 쓰는 스타일시트를 그대로 로드 (style.css, 폰트, 아이콘 등 — 하드코딩 안 하고
        //    원본 <head>에서 그대로 뽑아써서 나중에 원본이 바뀌어도 자동으로 따라감).
        const stylesheetHrefs = Array.from(
          doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
        ).map((link) => new URL(link.getAttribute('href') || '', API_BASE).href)

        for (const href of stylesheetHrefs) {
          if (document.querySelector(`link[href="${href}"]`)) continue
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = href
          document.head.appendChild(link)
        }

        // 4) body 내용을 그대로 삽입 (내부에 <script> 태그가 있어도 innerHTML로는 실행되지
        //    않으므로 app.js는 아래에서 별도로 로드한다).
        const container = document.getElementById('ezlook-transplant-root')
        if (container) container.innerHTML = doc.body.innerHTML

        // 5) app.js를 원본 <head>에 적힌 경로 그대로 로드.
        const appJsSrcRaw = doc.querySelector<HTMLScriptElement>('script[src*="app.js"]')?.getAttribute('src')
        const appJsSrc = new URL(appJsSrcRaw || '/static/app.js', API_BASE).href

        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = appJsSrc
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('app.js 로드 실패'))
          document.body.appendChild(script)
        })
        if (cancelled) return

        // 6) app.js는 DOMContentLoaded 시점에 초기화하도록 되어 있는데, 그 이벤트는 이미
        //    지나간 뒤라 다시 발생하지 않는다 — 같은 초기화 함수를 직접 호출해준다.
        await window.initLocale?.()
        window.initPage?.()

        // 7) 로그인 버튼을 토스 로그인으로 교체 (카카오/구글 모달 대신).
        const loginBtn = document.getElementById('navLoginBtn')
        if (loginBtn) {
          loginBtn.textContent = '토스로 로그인'
          loginBtn.onclick = () => {
            handleTossLogin()
          }
        }

        setStatus('ready')
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : String(err))
          setStatus('error')
        }
      }
    }

    transplant()
    return () => {
      cancelled = true
    }
  }, [])

  // appLogin()으로 인가 코드를 받아 서버(/api/auth/toss)에 전달하고, 성공하면 기존
  // 사이트(app.js)가 로그인 완료 시 하는 것과 동일한 절차로 세션을 반영한다
  // (app.js의 handleOAuthSuccess()와 동일한 순서 — 전역 함수/상태를 그대로 재사용).
  const handleTossLogin = async () => {
    try {
      const { authorizationCode, referrer } = await appLogin()

      const res = await fetch(`${API_BASE}/api/auth/toss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorizationCode, referrer }),
      })
      const data: TokenResponse = await res.json()

      if (!res.ok || !data.success || !data.token || !data.user) {
        window.showToast?.(data.message || '토스 로그인에 실패했어요.', 'error')
        return
      }

      if (window.AppState) window.AppState.user = data.user
      localStorage.setItem('lookbook_token', data.token)
      localStorage.setItem('lookbook_user', JSON.stringify(data.user))
      window.updateUserUI?.()
      window.closeModal?.('loginModal')
      window.showToast?.(`환영합니다, ${data.user.name}님`, 'success')
    } catch (err) {
      console.error(err)
      window.showToast?.('토스 로그인에 실패했어요. 토스 앱 내부에서만 동작해요.', 'error')
    }
  }

  return (
    <>
      {status === 'loading' ? (
        <div className="transplant-loading">
          <p>불러오는 중...</p>
        </div>
      ) : null}
      {status === 'error' ? (
        <div className="transplant-loading">
          <p className="error-message">화면을 불러오지 못했어요.</p>
          <p className="notice">{errorMessage}</p>
        </div>
      ) : null}
      <div id="ezlook-transplant-root" />
    </>
  )
}

export default App
