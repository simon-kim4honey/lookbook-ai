import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './public' }))

// ────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────
const ATLAS_API_BASE = 'https://api.atlascloud.ai'
const ATLAS_API_KEY = 'apikey-768c01fdea4c405f972d93ae16f0b9e3'
const AIFASHION_BASE = 'https://www.aifashion.co.kr'

// Atlas Cloud 헤더 생성
const atlasHeaders = () => ({
  'Authorization': `Bearer ${ATLAS_API_KEY}`,
  'Content-Type': 'application/json',
})

// ────────────────────────────────────────────────────
// Photorealistic Prompt Builder
// ────────────────────────────────────────────────────
function buildPhotorealisticPrompt(params: {
  direction: string
  modelName: string
  modelDesc: string
  bgName: string
  bgDesc: string
  poseType: string
  pose: string
  face: string
  clothingImageUrl?: string
}): string {
  const { direction, modelName, modelDesc, bgName, bgDesc, poseType, pose, face } = params

  const directionText = direction === 'front' ? 'front view' : 'back view'

  const poseMap: Record<string, string> = {
    '전신': 'full body shot',
    '반신': 'half body shot',
    '상반신': 'upper body shot',
  }
  const poseTypeText = poseMap[poseType] || 'full body shot'

  const poseStyleMap: Record<string, string> = {
    '정면': 'facing camera directly, natural standing pose',
    '측면': '3/4 angle pose, slight turn',
    '워킹': 'dynamic walking pose, in motion',
    '정적': 'elegant static pose, hands relaxed',
  }
  const poseStyleText = poseStyleMap[pose] || 'natural standing pose'

  const faceText = face === '얼굴 없음'
    ? 'model facing away from camera, no face visible'
    : 'model facing camera with confident expression'

  return [
    `Ultra-photorealistic professional fashion photography,`,
    `8K resolution, shot on Canon EOS R5 with 85mm f/1.4 lens,`,
    `professional studio lighting with softbox,`,
    `${poseTypeText} of a ${modelDesc} fashion model`,
    `wearing the clothing item shown (${directionText}),`,
    `${poseStyleText},`,
    `${faceText},`,
    `background: ${bgDesc} (${bgName}),`,
    `hyperrealistic skin texture, perfect fabric detail,`,
    `commercial fashion photography style,`,
    `RAW photo, sharp focus, high dynamic range,`,
    `professional retouching, magazine quality,`,
    `no artifacts, photorealistic, cinematic lighting`,
  ].join(' ')
}

// ────────────────────────────────────────────────────
// aifashion.co.kr API Proxies
// ────────────────────────────────────────────────────

// 모델 목록 프록시
app.get('/api/presets/models', async (c) => {
  try {
    const res = await fetch(`${AIFASHION_BASE}/api/models`, {
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) {
      throw new Error(`aifashion models API error: ${res.status}`)
    }
    const data: any = await res.json()

    // aifashion 응답 형식을 앱 내부 형식으로 변환
    const models = (data.models || []).map((m: any) => ({
      id: m.id,
      name: m.name || `모델 ${m.id}`,
      description: m.description || '',
      image_type: m.image_type || 'image/png',
      // 프론트엔드 필터링용 메타데이터 (aifashion API에서 제공하지 않으면 기본값)
      gender: m.gender || '여성',
      age: m.age || '20대',
      body: m.body || '표준',
      mood: m.mood || '내추럴',
      skin: m.skin || '중간',
    }))

    return c.json({ models })
  } catch (err: any) {
    console.error('Models API error:', err)
    return c.json({ error: 'Failed to fetch models', message: err.message }, 500)
  }
})

// 배경 목록 프록시
app.get('/api/presets/backgrounds', async (c) => {
  try {
    const res = await fetch(`${AIFASHION_BASE}/api/backgrounds`, {
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) {
      throw new Error(`aifashion backgrounds API error: ${res.status}`)
    }
    const data: any = await res.json()

    // aifashion 배경 이름 기반 카테고리/무드 매핑
    const categoryMap: Record<string, { category: string; mood: string; bgDesc: string }> = {
      '전차내부':   { category: '실내',     mood: '빈티지',   bgDesc: 'vintage train interior with retro seats' },
      '지하복도':   { category: '실내',     mood: '어반',     bgDesc: 'underground corridor with dramatic lighting' },
      '네온 식당':  { category: '실내',     mood: '트렌디',   bgDesc: 'neon-lit restaurant with vibrant atmosphere' },
      '파스텔 모텔':{ category: '실내',     mood: '큐트',     bgDesc: 'pastel-colored motel room with retro vibe' },
      '캔디왕국':   { category: '판타지',   mood: '큐트',     bgDesc: 'candy kingdom fantasy background, colorful and whimsical' },
      '해변도로':   { category: '야외',     mood: '서머',     bgDesc: 'coastal road by the beach, golden hour light' },
      '북촌 오르막':{ category: '스트리트', mood: '전통',     bgDesc: 'traditional Korean hanok village hillside street' },
      '해변 카페':  { category: '카페',     mood: '웜',       bgDesc: 'beachside cafe with ocean view, warm ambiance' },
      '모래사막':   { category: '야외',     mood: '익조틱',   bgDesc: 'golden sand desert dunes, dramatic sky' },
      '실내 테니스코트': { category: '스포츠', mood: '스포티', bgDesc: 'indoor tennis court with clean lines' },
      '팜시티 거리':{ category: '스트리트', mood: '트로피컬', bgDesc: 'palm tree lined city street, tropical urban' },
      '에스컬레이터':{ category: '실내',    mood: '모던',     bgDesc: 'modern escalator in a mall, dynamic geometry' },
      '극장 로비':  { category: '럭셔리',   mood: '하이엔드', bgDesc: 'grand theater lobby with elegant chandelier' },
      '빈티지 관제실': { category: '실내',  mood: '빈티지',   bgDesc: 'vintage control room with retro equipment' },
      '컨테이너 항구': { category: '야외',  mood: '어반',     bgDesc: 'industrial container port with colorful shipping containers' },
    }

    const backgrounds = (data.backgrounds || []).map((b: any) => {
      const meta = categoryMap[b.name] || { category: '기타', mood: '뉴트럴', bgDesc: b.name }
      return {
        id: b.id,
        name: b.name || `배경 ${b.id}`,
        category: meta.category,
        mood: meta.mood,
        bgDesc: meta.bgDesc,
        image_type: 'image/jpeg',
      }
    })

    return c.json({ backgrounds })
  } catch (err: any) {
    console.error('Backgrounds API error:', err)
    return c.json({ error: 'Failed to fetch backgrounds', message: err.message }, 500)
  }
})

// 모델 이미지 프록시
app.get('/api/proxy/model-image/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const res = await fetch(`${AIFASHION_BASE}/api/models/${id}/image`)
    if (!res.ok) {
      return c.notFound()
    }
    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get('Content-Type') || 'image/png'
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    return c.notFound()
  }
})

// 배경 이미지 프록시
app.get('/api/proxy/bg-image/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const res = await fetch(`${AIFASHION_BASE}/api/backgrounds/${id}/image`)
    if (!res.ok) {
      return c.notFound()
    }
    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get('Content-Type') || 'image/jpeg'
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    return c.notFound()
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
// Generation API - Atlas Cloud 연동
// ────────────────────────────────────────────────────
app.post('/api/generation/start', async (c) => {
  try {
    const body: any = await c.req.json()

    const {
      direction = 'front',
      modelId,
      modelName = '패션 모델',
      modelDesc = 'young Asian female fashion model, slim figure, natural look',
      bgName = '스튜디오',
      bgDesc = 'clean white studio background with professional lighting',
      poseType = '전신',
      pose = '정면',
      face = '얼굴 있음',
      count = 4,
      clothingImageUrl,
    } = body

    // Photorealistic 프롬프트 빌드
    const prompt = buildPhotorealisticPrompt({
      direction,
      modelName,
      modelDesc,
      bgName,
      bgDesc,
      poseType,
      pose,
      face,
      clothingImageUrl,
    })

    console.log('Generation prompt:', prompt)
    console.log('Clothing image URL:', clothingImageUrl ? clothingImageUrl.substring(0, 50) + '...' : 'none')

    // Atlas Cloud API 요청
    let requestBody: any = {
      model: 'bytedance/seedream-v4',
      prompt,
      negative_prompt: 'cartoon, anime, illustration, painting, drawing, low quality, blurry, deformed, ugly, unrealistic, fake, CGI, 3d render',
      width: 832,
      height: 1216,
      num_outputs: Math.min(count, 4), // 한 번에 최대 4장
    }

    // 의류 이미지가 있는 경우 image-to-image 모드 사용
    if (clothingImageUrl && clothingImageUrl.startsWith('data:')) {
      // base64 데이터 URL에서 base64 문자열만 추출
      const base64Data = clothingImageUrl.split(',')[1]
      if (base64Data) {
        requestBody = {
          model: 'black-forest-labs/flux-kontext-pro',
          prompt: `${prompt}. The model is wearing the exact clothing from the reference image.`,
          input_image: clothingImageUrl,
          width: 832,
          height: 1216,
        }
      }
    }

    console.log('Atlas Cloud request model:', requestBody.model)

    const atlasRes = await fetch(`${ATLAS_API_BASE}/api/v1/model/generateImage`, {
      method: 'POST',
      headers: atlasHeaders(),
      body: JSON.stringify(requestBody),
    })

    const atlasData: any = await atlasRes.json()
    console.log('Atlas Cloud response:', JSON.stringify(atlasData).substring(0, 200))

    if (!atlasRes.ok || atlasData.code !== 200) {
      console.error('Atlas API error:', atlasData)
      // 폴백: 플레이스홀더 반환
      const fallbackJobId = 'fallback_' + Math.random().toString(36).substr(2, 9)
      return c.json({
        jobId: fallbackJobId,
        estimatedSeconds: 5,
        status: 'queued',
        isFallback: true,
        error: atlasData.msg || 'Atlas API error',
      })
    }

    const jobId = atlasData.data?.id || atlasData.data?.prediction_id
    if (!jobId) {
      throw new Error('No job ID in Atlas response')
    }

    return c.json({
      jobId,
      estimatedSeconds: 60,
      status: 'queued',
      isFallback: false,
    })

  } catch (err: any) {
    console.error('Generation start error:', err)
    // 에러 시 fallback으로 처리
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

// Generation 상태 폴링
app.get('/api/generation/:jobId/status', async (c) => {
  const jobId = c.req.param('jobId')

  // Fallback 처리 (Atlas API 오류 시 플레이스홀더 이미지 반환)
  if (jobId.startsWith('fallback_')) {
    const placeholderImages = generatePlaceholderImages(4)
    return c.json({
      status: 'completed',
      progress: 100,
      images: placeholderImages,
      isFallback: true,
    })
  }

  try {
    const res = await fetch(`${ATLAS_API_BASE}/api/v1/model/prediction/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${ATLAS_API_KEY}`,
      },
    })

    const data: any = await res.json()
    console.log('Atlas poll response status:', data.data?.status, 'jobId:', jobId)

    if (!res.ok || data.code !== 200) {
      return c.json({
        status: 'failed',
        progress: 0,
        images: [],
        error: data.msg || 'Poll error',
      })
    }

    const predData = data.data
    const predStatus = predData?.status

    // Atlas Cloud 상태 매핑
    // starting, processing, succeeded, failed, canceled
    if (predStatus === 'succeeded' || predStatus === 'completed') {
      // Atlas Cloud uses 'outputs' (plural), fallback to 'output' (singular)
      const outputUrls: string[] = predData?.outputs || predData?.output || []
      const images = outputUrls.map((url: string, idx: number) => ({
        id: `result_${idx + 1}`,
        url,
        title: `AI 피팅컷 #${idx + 1}`,
        width: 832,
        height: 1216,
      }))

      return c.json({
        status: 'completed',
        progress: 100,
        images,
        isFallback: false,
      })
    } else if (predStatus === 'failed' || predStatus === 'canceled' || predStatus === 'error') {
      // 실패 시 플레이스홀더로 폴백
      const placeholderImages = generatePlaceholderImages(4)
      return c.json({
        status: 'completed',
        progress: 100,
        images: placeholderImages,
        isFallback: true,
        error: `Generation ${predStatus}`,
      })
    } else {
      // processing, starting
      const progressMap: Record<string, number> = {
        'starting': 15,
        'processing': 55,
      }
      return c.json({
        status: 'processing',
        progress: progressMap[predStatus] || 30,
        images: [],
      })
    }

  } catch (err: any) {
    console.error('Poll error:', err)
    // 폴링 에러 시 플레이스홀더 반환
    const placeholderImages = generatePlaceholderImages(4)
    return c.json({
      status: 'completed',
      progress: 100,
      images: placeholderImages,
      isFallback: true,
      error: err.message,
    })
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
        <h2 class="section-title">6단계로 완성되는<br />AI 룩북 제작</h2>
        <p class="section-desc">복잡한 촬영 과정을 단 6단계로 간소화했습니다.</p>
      </div>
      <div class="steps-grid">
        <div class="step-card">
          <div class="step-num">👔</div>
          <div class="step-title">Step 1. 방향 선택</div>
          <div class="step-desc">앞모습 또는 뒷모습 의류 방향을 선택합니다</div>
        </div>
        <div class="step-card">
          <div class="step-num">📤</div>
          <div class="step-title">Step 2. 의류 업로드</div>
          <div class="step-desc">의류 이미지를 업로드합니다. JPG/PNG/WEBP 지원</div>
        </div>
        <div class="step-card">
          <div class="step-num">🧍</div>
          <div class="step-title">Step 3. 모델 선택</div>
          <div class="step-desc">성별, 체형, 피부톤으로 AI 모델을 선택합니다</div>
        </div>
        <div class="step-card">
          <div class="step-num">🏙️</div>
          <div class="step-title">Step 4. 배경 선택</div>
          <div class="step-desc">브랜드에 맞는 배경을 카테고리별로 선택합니다</div>
        </div>
        <div class="step-card">
          <div class="step-num">⚡</div>
          <div class="step-title">Step 5. 생성 실행</div>
          <div class="step-desc">수량, 구도, 포즈를 설정하고 AI 생성을 시작합니다</div>
        </div>
        <div class="step-card">
          <div class="step-num">✅</div>
          <div class="step-title">Step 6. 결과 확인</div>
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
      <a href="/" class="navbar-logo">
        <div class="logo-icon">✨</div>
        <span>LookbookAI</span>
      </a>
      <div style="flex:1;"></div>
      <div class="navbar-actions">
        <a href="/dashboard" class="btn btn-ghost btn-sm">
          <i class="fas fa-arrow-left"></i> 대시보드
        </a>
        <div style="display:flex;align-items:center;gap:8px;padding:6px 14px;background:var(--primary-bg);border-radius:var(--radius-full);">
          <span style="font-size:13px;font-weight:700;color:var(--primary);">✨ 24 크레딧</span>
        </div>
      </div>
    </div>
  </nav>

  <div id="generator-page">
    <!-- Step Progress Header -->
    <div class="generator-header">
      <div class="generator-header-inner">
        <div style="font-size:14px;font-weight:700;color:var(--text-primary);white-space:nowrap;">새 프로젝트</div>
        <div class="step-progress" id="stepProgress">
          <div class="step-item">
            <div class="step-dot active" id="dot-1" onclick="goToStep(1)">
              1
              <div class="step-label">방향</div>
            </div>
            <div class="step-line" id="line-1"></div>
          </div>
          <div class="step-item">
            <div class="step-dot" id="dot-2" onclick="goToStep(2)">
              2
              <div class="step-label">업로드</div>
            </div>
            <div class="step-line" id="line-2"></div>
          </div>
          <div class="step-item">
            <div class="step-dot" id="dot-3" onclick="goToStep(3)">
              3
              <div class="step-label">모델</div>
            </div>
            <div class="step-line" id="line-3"></div>
          </div>
          <div class="step-item">
            <div class="step-dot" id="dot-4" onclick="goToStep(4)">
              4
              <div class="step-label">배경</div>
            </div>
            <div class="step-line" id="line-4"></div>
          </div>
          <div class="step-item">
            <div class="step-dot" id="dot-5" onclick="goToStep(5)">
              5
              <div class="step-label">생성</div>
            </div>
            <div class="step-line" id="line-5"></div>
          </div>
          <div class="step-item">
            <div class="step-dot" id="dot-6">
              6
              <div class="step-label">결과</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Generator Body -->
    <div class="generator-body">

      <!-- ─── Step 1: Direction ─── -->
      <div class="step-panel active" id="step-1">
        <div class="step-title-area">
          <div class="step-num-badge">Step 1 / 6 · 방향 선택</div>
          <h2 class="step-heading">의류 방향을 선택하세요</h2>
          <p class="step-sub">업로드할 의류 이미지가 앞면인지 뒷면인지 선택해주세요.</p>
        </div>
        <div class="direction-grid">
          <div class="direction-card" id="dir-front" onclick="selectDirection('front')">
            <div class="direction-visual">
              <span style="font-size:64px;">👔</span>
            </div>
            <div class="direction-name">앞면 (Front)</div>
            <div class="direction-desc">의류의 정면 모습이 찍힌 이미지</div>
            <div class="direction-check">✓</div>
          </div>
          <div class="direction-card" id="dir-back" onclick="selectDirection('back')">
            <div class="direction-visual">
              <span style="font-size:64px;">🔄</span>
            </div>
            <div class="direction-name">뒷면 (Back)</div>
            <div class="direction-desc">의류의 뒷면 모습이 찍힌 이미지</div>
            <div class="direction-check">✓</div>
          </div>
        </div>
        <div class="step-nav">
          <div></div>
          <button class="step-nav-next" id="nextBtn1" onclick="nextStep(1)" disabled>
            다음 단계 <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>

      <!-- ─── Step 2: Upload ─── -->
      <div class="step-panel" id="step-2">
        <div class="step-title-area">
          <div class="step-num-badge">Step 2 / 6 · 의류 업로드</div>
          <h2 class="step-heading">의류 이미지를 업로드하세요</h2>
          <p class="step-sub">배경이 흰색이거나 투명한 이미지를 사용하면 가장 좋은 결과를 얻을 수 있어요.</p>
        </div>

        <div id="uploadArea" class="upload-area"
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

        <div id="uploadPreview" class="upload-preview hidden">
          <div class="upload-preview-inner">
            <div class="upload-preview-img">
              <img id="previewImg" src="" alt="업로드된 의류" />
            </div>
            <div class="upload-preview-info">
              <div class="upload-preview-name" id="previewName">-</div>
              <div class="upload-preview-meta" id="previewMeta">-</div>
              <div class="upload-tips">
                <h4>💡 좋은 결과를 위한 팁</h4>
                <ul>
                  <li><span>✓</span> 배경이 깨끗한 이미지를 사용하세요</li>
                  <li><span>✓</span> 의류가 화면 중앙에 위치해야 합니다</li>
                  <li><span>✓</span> 고해상도 이미지일수록 결과가 좋습니다</li>
                  <li><span>✓</span> 구겨진 의류보다 펼쳐진 의류가 좋아요</li>
                </ul>
              </div>
              <button class="btn btn-ghost btn-sm" style="margin-top:16px;" onclick="resetUpload()">
                <i class="fas fa-redo"></i> 다시 선택
              </button>
            </div>
          </div>
        </div>

        <div class="step-nav">
          <button class="step-nav-back" onclick="prevStep(2)">
            <i class="fas fa-arrow-left"></i> 이전
          </button>
          <button class="step-nav-next" id="nextBtn2" onclick="nextStep(2)" disabled>
            다음 단계 <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>

      <!-- ─── Step 3: Model ─── -->
      <div class="step-panel" id="step-3">
        <div class="step-title-area">
          <div class="step-num-badge">Step 3 / 6 · 모델 선택</div>
          <h2 class="step-heading">AI 모델을 선택하세요</h2>
          <p class="step-sub">의류에 가장 잘 어울리는 AI 모델을 선택하세요.</p>
        </div>

        <div class="model-filters" id="modelFilters">
          <button class="filter-tag active" onclick="filterModels('all', this)">전체</button>
          <button class="filter-tag" onclick="filterModels('여성', this)">여성</button>
          <button class="filter-tag" onclick="filterModels('남성', this)">남성</button>
        </div>

        <!-- Loading state -->
        <div id="modelsLoading" style="text-align:center;padding:60px;color:var(--text-muted);">
          <div style="font-size:36px;margin-bottom:12px;">⏳</div>
          <p>모델 목록을 불러오는 중...</p>
        </div>

        <div class="models-grid" id="modelsGrid" style="display:none;">
          <!-- Populated by JS from API -->
        </div>

        <div class="step-nav">
          <button class="step-nav-back" onclick="prevStep(3)">
            <i class="fas fa-arrow-left"></i> 이전
          </button>
          <button class="step-nav-next" id="nextBtn3" onclick="nextStep(3)" disabled>
            다음 단계 <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>

      <!-- ─── Step 4: Background ─── -->
      <div class="step-panel" id="step-4">
        <div class="step-title-area">
          <div class="step-num-badge">Step 4 / 6 · 배경 선택</div>
          <h2 class="step-heading">배경을 선택하세요</h2>
          <p class="step-sub">브랜드 분위기에 맞는 배경을 선택해 완성도 높은 이미지를 만드세요.</p>
        </div>

        <div class="bg-categories" id="bgCategories">
          <button class="bg-cat active" onclick="filterBg('전체', this)">전체</button>
          <button class="bg-cat" onclick="filterBg('실내', this)">실내</button>
          <button class="bg-cat" onclick="filterBg('야외', this)">야외</button>
          <button class="bg-cat" onclick="filterBg('스트리트', this)">스트리트</button>
          <button class="bg-cat" onclick="filterBg('카페', this)">카페</button>
          <button class="bg-cat" onclick="filterBg('럭셔리', this)">럭셔리</button>
          <button class="bg-cat" onclick="filterBg('판타지', this)">판타지</button>
        </div>

        <!-- Loading state -->
        <div id="bgsLoading" style="text-align:center;padding:60px;color:var(--text-muted);">
          <div style="font-size:36px;margin-bottom:12px;">⏳</div>
          <p>배경 목록을 불러오는 중...</p>
        </div>

        <div class="backgrounds-grid" id="backgroundsGrid" style="display:none;">
          <!-- Populated by JS from API -->
        </div>

        <div class="step-nav">
          <button class="step-nav-back" onclick="prevStep(4)">
            <i class="fas fa-arrow-left"></i> 이전
          </button>
          <button class="step-nav-next" id="nextBtn4" onclick="nextStep(4)" disabled>
            다음 단계 <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>

      <!-- ─── Step 5: Generate ─── -->
      <div class="step-panel" id="step-5">
        <div class="step-title-area" id="step5TitleArea">
          <div class="step-num-badge">Step 5 / 6 · 생성 옵션</div>
          <h2 class="step-heading">생성 옵션을 설정하세요</h2>
          <p class="step-sub">생성할 이미지 수량, 구도, 포즈를 선택하세요. 크레딧이 차감됩니다.</p>
        </div>

        <div id="genOptionsView">
          <div class="gen-options-grid">
            <div class="gen-option-group">
              <div class="gen-option-title">📸 생성 수량</div>
              <div class="option-chips">
                <div class="option-chip selected" onclick="selectOption(this, 'count')">4장 (1크레딧)</div>
                <div class="option-chip" onclick="selectOption(this, 'count')">8장 (2크레딧)</div>
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
            <div class="gen-option-group">
              <div class="gen-option-title">😊 얼굴 노출</div>
              <div class="option-chips">
                <div class="option-chip selected" onclick="selectOption(this, 'face')">얼굴 있음</div>
                <div class="option-chip" onclick="selectOption(this, 'face')">얼굴 없음</div>
              </div>
            </div>
          </div>

          <div class="gen-summary" id="genSummary">
            <div class="gen-summary-title">생성 요약</div>
            <div class="gen-summary-grid">
              <div class="gen-summary-item">
                <div class="gen-summary-label">의류 방향</div>
                <div class="gen-summary-val" id="sumDirection">-</div>
              </div>
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
                <div class="gen-summary-val">4장</div>
              </div>
            </div>
            <div class="gen-cost">
              <span class="gen-cost-label">✨ 소요 크레딧</span>
              <span class="gen-cost-amount">1 크레딧</span>
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

        <div class="step-nav" id="step5Nav">
          <button class="step-nav-back" onclick="prevStep(5)">
            <i class="fas fa-arrow-left"></i> 이전
          </button>
          <button class="step-nav-next" onclick="startGeneration()">
            <i class="fas fa-wand-magic-sparkles"></i> AI 생성 시작
          </button>
        </div>
      </div>

      <!-- ─── Step 6: Results ─── -->
      <div class="step-panel" id="step-6">
        <div class="step-title-area">
          <div class="step-num-badge">Step 6 / 6 · 생성 완료 ✅</div>
          <h2 class="step-heading">이미지가 생성되었습니다!</h2>
          <p class="step-sub">AI가 생성한 실사 피팅컷을 확인하고 다운로드하세요.</p>
        </div>

        <div class="results-toolbar">
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

        <div class="step-nav">
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

export default app
