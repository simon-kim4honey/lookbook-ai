import { appLogin } from '@apps-in-toss/web-framework'
import { useEffect, useState } from 'react'
import './App.css'

// 기존 lookbook-ai(EZlook) Cloudflare Workers 백엔드를 그대로 재사용한다.
// 운영 도메인 기본값이며, 스테이징에서 테스트할 때는 .env.local에
// VITE_API_BASE_URL=https://<staging-pages-domain> 을 넣어 덮어쓴다.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://www.aifashion.co.kr'

type ShowcaseImage = { id: string; imageBase64: string }
type ModelPreset = { id: number; name: string; gender: string; mood: string }

function App() {
  const [showcase, setShowcase] = useState<ShowcaseImage[]>([])
  const [models, setModels] = useState<ModelPreset[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  const [loginNotice, setLoginNotice] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [showcaseRes, modelsRes] = await Promise.all([
          fetch(`${API_BASE}/api/home/showcase`),
          fetch(`${API_BASE}/api/presets/models`),
        ])
        const showcaseJson = await showcaseRes.json()
        const modelsJson = await modelsRes.json()
        setShowcase(showcaseJson.images ?? [])
        setModels(modelsJson.models ?? [])
      } catch (err) {
        console.error(err)
        setLoadError('홈 데이터를 불러오지 못했어요.')
      }
    }
    loadHomeData()
  }, [])

  // appLogin()으로 인가 코드까지만 클라이언트에서 받는다. 이 코드를 AccessToken으로
  // 교환하는 서버 엔드포인트(mTLS 인증서 필요)는 아직 준비되지 않았다 — 파트너센터에서
  // mTLS 인증서/복호화 키를 발급받은 뒤 별도로 구현 예정.
  const handleTossLogin = async () => {
    setIsLoggingIn(true)
    setLoginError(null)
    setLoginNotice(null)
    try {
      const { authorizationCode, referrer } = await appLogin()
      console.log('토스 로그인 인가 코드 수신', { referrer })

      try {
        const res = await fetch(`${API_BASE}/api/auth/toss`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authorizationCode, referrer }),
        })
        if (!res.ok) throw new Error(`status=${res.status}`)
        const data = await res.json()
        setLoginNotice('토스 로그인에 성공했어요.')
        console.log('토스 로그인 서버 응답', data)
      } catch {
        setLoginNotice(
          '인가 코드는 정상적으로 받았어요.\n서버 토큰 교환 연동은 mTLS 인증서 발급 후 준비될 예정이에요.',
        )
      }
    } catch (err) {
      console.error(err)
      setLoginError('토스 로그인에 실패했어요. 토스 앱 내부(WebView) 환경에서만 동작해요.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <main className="app">
      <header className="hero">
        <h1>EZlook</h1>
        <p>AI 모델 착장 이미지, 토스 앱에서 바로 만들어보세요.</p>
      </header>

      <section className="section">
        <button
          type="button"
          className="login-button"
          onClick={handleTossLogin}
          disabled={isLoggingIn}
        >
          {isLoggingIn ? '로그인 처리 중...' : '토스로 로그인'}
        </button>
        {loginNotice != null ? <p className="notice">{loginNotice}</p> : null}
        {loginError != null ? <p className="error-message">{loginError}</p> : null}
      </section>

      {loadError != null ? <p className="error-message">{loadError}</p> : null}

      {showcase.length > 0 ? (
        <section className="section">
          <h2>쇼케이스</h2>
          <div className="showcase-scroll">
            {showcase.map((img) => (
              <img key={img.id} src={img.imageBase64} alt="" />
            ))}
          </div>
        </section>
      ) : null}

      {models.length > 0 ? (
        <section className="section">
          <h2>모델 프리셋</h2>
          <div className="model-grid">
            {models.slice(0, 6).map((m) => (
              <div key={m.id} className="model-card">
                <strong>{m.name}</strong>
                <span>{m.gender} · {m.mood}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}

export default App
