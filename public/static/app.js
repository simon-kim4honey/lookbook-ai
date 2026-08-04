/* ===================================================
   AI Fashion Lookbook Studio - Frontend Logic
   aifashion.co.kr + Atlas Cloud AI 실API 연동
   =================================================== */

// ─────────────────────────────────────────────────────────
// GLOBAL STATE
// ─────────────────────────────────────────────────────────
const AppState = {
  currentStep: 1,

  // ── 다중 의류 업로드 (신규) ──
  // clothingItems: [{ file, dataUrl, category, label, classifying }]
  clothingItems: [],

  // 레거시 단일 필드 (하위 호환 — generation 요청 시 clothingItems로 대체됨)
  uploadedFile: null,
  uploadedImageUrl: null,

  selectedModel: null,     // { id, name, description, gender, ... }
  selectedBg: null,        // { id, name, category, mood, bgDesc }
  genOptions: {
    ratio: '3:4',
    resolution: 'HD',
    pose_type: '전신',
    pose: '정면',
  },
  generatedImages: [],
  isGenerating: false,
  currentJobId: null,
  pollInterval: null,
  user: null,

  // 재생성 관련
  regenCount: 0,          // 현재 재생성 횟수 (최대 3회)
  lastGenParams: null,    // 마지막 생성에 사용된 파라미터 (재생성용)

  // API 로드된 데이터
  allModels: [],
  filteredModels: [],
  allBackgrounds: [],
  filteredBackgrounds: [],
};

const SAMPLE_PROJECTS = [
  { id: 'p1', name: '2024 S/S 룩북', status: 'done', images: 8, created: '2024-03-15', color: '#FF6B9D', icon: '👗' },
  { id: 'p2', name: '캐주얼 티셔츠 컷', status: 'done', images: 4, created: '2024-03-12', color: '#6C47FF', icon: '👕' },
  { id: 'p3', name: '데님 라인 촬영', status: 'processing', images: 0, created: '2024-03-10', color: '#3B82F6', icon: '👖' },
  { id: 'p4', name: '원피스 봄 컬렉션', status: 'draft', images: 0, created: '2024-03-08', color: '#00D4AA', icon: '👘' },
];

// ─────────────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initPage();
});

function initPage() {
  const path = window.location.pathname;
  initNavbar();
  // 모든 페이지에서 세션 복원 (자동 로그인)
  verifySession().then(() => {
    if (path === '/' || path === '') {
      // Landing — verifySession 후 UI만 업데이트됨
    } else if (path === '/dashboard') {
      initDashboard();
    } else if (path === '/generator') {
      initGenerator();
    }
  });
}

// ─────────────────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────────────────
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });
}

// ─────────────────────────────────────────────────────────
// TOAST NOTIFICATIONS
// ─────────────────────────────────────────────────────────
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span style="font-size:18px;">${icons[type] || 'ℹ️'}</span>
    <span style="flex:1;">${message}</span>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;font-size:18px;color:var(--text-muted);padding:0;margin-left:8px;">×</button>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ─────────────────────────────────────────────────────────
// MODALS
// ─────────────────────────────────────────────────────────
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function switchModal(from, to) {
  closeModal(from);
  setTimeout(() => openModal(to), 150);
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => {
      m.classList.remove('active');
    });
    document.body.style.overflow = '';
  }
});

// ─────────────────────────────────────────────────────────
// AUTH — 탭 전환 / 소셜 로그인 / 이메일 로그인·가입
// ─────────────────────────────────────────────────────────

/** 로그인/회원가입 탭 전환 */
function switchAuthTab(tab) {
  const loginForm   = document.getElementById('authFormLogin');
  const signupForm  = document.getElementById('authFormSignup');
  const tabLoginBtn = document.getElementById('tabLogin');
  const tabSignupBtn= document.getElementById('tabSignup');

  if (tab === 'login') {
    if (loginForm)   loginForm.style.display  = '';
    if (signupForm)  signupForm.style.display = 'none';
    if (tabLoginBtn) {
      tabLoginBtn.style.color  = 'var(--primary)';
      tabLoginBtn.style.borderBottom = '2px solid var(--primary)';
      tabLoginBtn.style.fontWeight = '700';
    }
    if (tabSignupBtn) {
      tabSignupBtn.style.color = 'var(--text-muted)';
      tabSignupBtn.style.borderBottom = '2px solid transparent';
      tabSignupBtn.style.fontWeight = '600';
    }
  } else {
    if (loginForm)   loginForm.style.display  = 'none';
    if (signupForm)  signupForm.style.display = '';
    if (tabSignupBtn) {
      tabSignupBtn.style.color = 'var(--primary)';
      tabSignupBtn.style.borderBottom = '2px solid var(--primary)';
      tabSignupBtn.style.fontWeight = '700';
    }
    if (tabLoginBtn) {
      tabLoginBtn.style.color = 'var(--text-muted)';
      tabLoginBtn.style.borderBottom = '2px solid transparent';
      tabLoginBtn.style.fontWeight = '600';
    }
  }
}

/** OAuth 소셜 로그인 (팝업 방식) */
function oauthLogin(provider) {
  // 이전 oauth_result 잔여 데이터 제거
  localStorage.removeItem('oauth_result');

  const popup = window.open(
    `/api/auth/${provider}`,
    'oauth_popup',
    'width=520,height=640,left=' + Math.round((screen.width - 520) / 2) + ',top=' + Math.round((screen.height - 640) / 2)
  );

  function handleOAuthSuccess(data) {
    const { token, user } = data;
    AppState.user = user;
    localStorage.setItem('lookbook_token', token);
    localStorage.setItem('lookbook_user', JSON.stringify(user));
    localStorage.removeItem('oauth_result');
    updateUserUI();
    closeModal('loginModal');
    showToast(`환영합니다, ${user.name}님! 🎉`, 'success');
    if (AppState.pendingGeneration) {
      AppState.pendingGeneration = false;
      setTimeout(() => startGeneration(), 300);
    } else if (window.location.pathname === '/') {
      setTimeout(() => window.location.href = '/dashboard', 800);
    }
  }

  const onMessage = (e) => {
    if (e.data?.type === 'oauth_success') {
      clearInterval(checkClosed);
      window.removeEventListener('message', onMessage);
      handleOAuthSuccess(e.data);
    } else if (e.data?.type === 'oauth_error') {
      clearInterval(checkClosed);
      window.removeEventListener('message', onMessage);
      showToast('소셜 로그인에 실패했습니다. 다시 시도해주세요.', 'error');
    }
  };

  window.addEventListener('message', onMessage);

  // 팝업이 닫힌 경우 — localStorage 폴백 체크 (postMessage 실패 대비)
  const checkClosed = setInterval(() => {
    if (popup && popup.closed) {
      clearInterval(checkClosed);
      window.removeEventListener('message', onMessage);
      // postMessage가 전달 안 됐을 경우 localStorage에서 결과 읽기
      try {
        const stored = localStorage.getItem('oauth_result');
        if (stored) {
          const data = JSON.parse(stored);
          if (data?.type === 'oauth_success') {
            handleOAuthSuccess(data);
            return;
          }
        }
      } catch(e) {}
    }
  }, 500);
}

/** 이메일 로그인 */
async function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const btn      = document.getElementById('loginBtn');

  btn.textContent = '로그인 중...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.success) {
      AppState.user = data.user;
      localStorage.setItem('lookbook_token', data.token);
      localStorage.setItem('lookbook_user', JSON.stringify(data.user));
      updateUserUI();
      closeModal('loginModal');
      showToast(`환영합니다, ${data.user.name}님! 🎉`, 'success');
      // 로그인 후 생성 재개
      if (AppState.pendingGeneration) {
        AppState.pendingGeneration = false;
        setTimeout(() => startGeneration(), 300);
      } else if (window.location.pathname === '/') {
        setTimeout(() => window.location.href = '/dashboard', 800);
      }
    } else {
      showToast(data.message || '이메일 또는 비밀번호가 올바르지 않습니다.', 'error');
    }
  } catch (err) {
    showToast('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
  } finally {
    btn.textContent = '로그인';
    btn.disabled = false;
  }
}

/** 이메일 회원가입 */
async function handleSignup(e) {
  e.preventDefault();
  const name     = document.getElementById('signupName').value.trim();
  const email    = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const btn      = document.getElementById('signupBtn');

  if (!name) {
    showToast('이름을 입력해주세요.', 'warning');
    return;
  }
  if (password.length < 8) {
    showToast('비밀번호는 8자 이상이어야 합니다.', 'warning');
    return;
  }

  btn.textContent = '가입 중...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();

    if (data.success) {
      AppState.user = data.user;
      localStorage.setItem('lookbook_token', data.token);
      localStorage.setItem('lookbook_user', JSON.stringify(data.user));
      updateUserUI();
      closeModal('loginModal');
      showToast(`가입 완료! 무료 크레딧 5개를 드렸어요 🎁`, 'success');
      // 가입 후 생성 재개
      if (AppState.pendingGeneration) {
        AppState.pendingGeneration = false;
        setTimeout(() => startGeneration(), 300);
      } else if (window.location.pathname === '/') {
        setTimeout(() => window.location.href = '/dashboard', 800);
      }
    } else {
      showToast(data.message || '가입에 실패했습니다.', 'error');
    }
  } catch (err) {
    showToast('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
  } finally {
    btn.textContent = '가입하고 무료 시작 🎁';
    btn.disabled = false;
  }
}

/** 로그아웃 */
async function handleLogout() {
  // 드롭다운 먼저 닫기
  const menu = document.getElementById('userDropdownMenu');
  if (menu) menu.style.display = 'none';

  try {
    const token = localStorage.getItem('lookbook_token');
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'X-Session-Token': token }
      });
    }
  } catch (e) { /* ignore */ }

  AppState.user = null;
  localStorage.removeItem('lookbook_token');
  localStorage.removeItem('lookbook_user');
  updateUserUI();
  showToast('로그아웃 되었습니다.', 'info');
  setTimeout(() => window.location.href = '/', 600);
}

/** 헤더/네비바 사용자 UI 업데이트 */
function updateUserUI(partial) {
  // partial: { credits } 전달 시 크레딧만 부분 업데이트
  if (partial && partial.credits !== undefined && AppState.user) {
    AppState.user.credits = partial.credits;
  }

  const user = AppState.user;

  const loginBtn   = document.getElementById('navLoginBtn');
  const signupBtn  = document.getElementById('navSignupBtn');
  const userArea   = document.getElementById('navUserArea');
  const userName   = document.getElementById('navUserName');
  const userCredits= document.getElementById('navUserCredits');
  const userAvatar = document.getElementById('navUserAvatar');

  if (user) {
    if (loginBtn)  loginBtn.style.display  = 'none';
    if (signupBtn) signupBtn.style.display = 'none';
    if (userArea)  userArea.style.display  = 'flex';
    // 아이콘 영역에는 이름/크레딧 표시 안 함 (드롭다운에서만 보임)
    if (userName)  userName.textContent    = '';
    if (userCredits) userCredits.textContent = '';
    // 아바타 이니셜 업데이트
    if (userAvatar) {
      const initial = (user.name || user.email || '?')[0].toUpperCase();
      userAvatar.textContent = initial;
    }
    // 드롭다운 내 정보 업데이트
    const ddName    = document.getElementById('ddUserName');
    const ddEmail   = document.getElementById('ddUserEmail');
    const ddCredits = document.getElementById('ddUserCredits');
    if (ddName)    ddName.textContent    = user.name || user.email;
    if (ddEmail)   ddEmail.textContent   = user.email || '';
    if (ddCredits) ddCredits.textContent = `${user.credits ?? 0}크레딧 남음`;

    // 사이드바 크레딧 표시 업데이트 (dashboard / generator 공통)
    const sidebarAmt = document.getElementById('sidebarCreditAmount');
    const dashStat   = document.getElementById('dashCreditStat');
    const dashDetail = document.getElementById('dashCreditDetail');
    const credits = user.credits ?? 0;
    if (sidebarAmt) sidebarAmt.textContent = credits.toLocaleString();
    if (dashStat)   dashStat.textContent   = credits.toLocaleString();
    if (dashDetail) dashDetail.textContent = credits.toLocaleString();
  } else {
    if (loginBtn)  loginBtn.style.display  = '';
    if (signupBtn) signupBtn.style.display = '';
    if (userArea)  userArea.style.display  = 'none';
  }
}

/** 세션 서버 검증 (페이지 로드 시) — 항상 Promise 반환 */
async function verifySession() {
  const token = localStorage.getItem('lookbook_token');
  if (!token) {
    // 토큰 없으면 localStorage 캐시도 확인 (최초 로드 flash 방지)
    const stored = localStorage.getItem('lookbook_user');
    if (stored) {
      try { AppState.user = JSON.parse(stored); } catch(e) {}
    } else {
      AppState.user = null;
    }
    updateUserUI();
    return;
  }

  // 먼저 로컬 캐시로 즉시 UI 표시 (Flash 방지)
  const stored = localStorage.getItem('lookbook_user');
  if (stored) {
    try {
      AppState.user = JSON.parse(stored);
      updateUserUI(); // 즉시 표시
    } catch(e) {}
  }

  // 백그라운드에서 서버 검증
  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'X-Session-Token': token }
    });
    const data = await res.json();
    if (data.success && data.user) {
      AppState.user = data.user;
      localStorage.setItem('lookbook_user', JSON.stringify(data.user));
    } else {
      // 서버에서 만료 확인 → 정리
      AppState.user = null;
      localStorage.removeItem('lookbook_token');
      localStorage.removeItem('lookbook_user');
    }
  } catch (e) {
    // 네트워크 오류 시 로컬 캐시 유지 (이미 위에서 설정됨)
    console.log('Session verify network error, using cached user');
  }
  updateUserUI();
}

/** 유저 메뉴 드롭다운 토글 */
function toggleUserMenu() {
  const menu = document.getElementById('userDropdownMenu');
  if (!menu) return;
  const isVisible = menu.style.display !== 'none';
  menu.style.display = isVisible ? 'none' : 'block';
  if (!isVisible) {
    const closeMenu = (e) => {
      const userArea = document.getElementById('navUserArea');
      if (!menu.contains(e.target) && !(userArea && userArea.contains(e.target))) {
        menu.style.display = 'none';
        document.removeEventListener('click', closeMenu);
      }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 10);
  }
}

// ─────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────
function initDashboard() {
  renderProjects(SAMPLE_PROJECTS);
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
  const target = document.getElementById(`tab-${tabId}`);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('onclick') && item.getAttribute('onclick').includes(tabId)) {
      item.classList.add('active');
    }
  });
}

function renderProjects(projects) {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  grid.querySelectorAll('.project-card').forEach(c => c.remove());

  const statusLabel = { done: '완료', processing: '생성중', draft: '초안' };

  projects.forEach(p => {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.dataset.status = p.status;
    card.dataset.name = p.name.toLowerCase();
    card.innerHTML = `
      <div class="project-thumb">
        <div class="project-thumb-placeholder" style="background:linear-gradient(135deg, ${p.color}33, ${p.color}66);">
          <span class="icon" style="font-size:48px;">${p.icon}</span>
          <span style="font-size:13px;color:var(--text-muted);">${p.name}</span>
        </div>
        <div class="project-status ${p.status}">${statusLabel[p.status]}</div>
      </div>
      <div class="project-info">
        <div class="project-name">${p.name}</div>
        <div class="project-meta">
          <span>📷 ${p.images}장 생성</span>
          <span>·</span>
          <span>${p.created}</span>
        </div>
      </div>
      <div class="project-actions">
        ${p.status === 'done' ?
          `<button class="project-action-btn" onclick="showToast('이미지를 다운로드합니다.', 'success'); event.stopPropagation();">다운로드</button>
           <button class="project-action-btn primary" onclick="window.location.href='/generator'; event.stopPropagation();">재생성</button>` :
          p.status === 'processing' ?
          `<button class="project-action-btn" disabled>생성중...</button>
           <button class="project-action-btn primary" onclick="event.stopPropagation();">결과 보기</button>` :
          `<button class="project-action-btn primary" onclick="window.location.href='/generator'; event.stopPropagation();">계속 작업</button>`
        }
      </div>
    `;
    card.addEventListener('click', () => showToast(`"${p.name}" 프로젝트를 엽니다.`, 'info'));
    grid.appendChild(card);
  });
}

function filterProjects() {
  const query = document.getElementById('projectSearch').value.toLowerCase();
  document.querySelectorAll('.project-card').forEach(card => {
    card.style.display = (card.dataset.name || '').includes(query) ? '' : 'none';
  });
}

function filterByStatus(status, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.project-card').forEach(card => {
    card.style.display = (status === 'all' || card.dataset.status === status) ? '' : 'none';
  });
}

// toggleUserMenu 는 위에서 정의됨 (중복 제거)

// ─────────────────────────────────────────────────────────
// GENERATOR INIT
// ─────────────────────────────────────────────────────────
function initGenerator() {
  // verifySession은 initPage에서 이미 호출됨
  // 모델/배경 미리 로드
  loadModelsFromAPI();
  loadBackgroundsFromAPI();
}

// ─────────────────────────────────────────────────────────
// API: 모델 로드 (aifashion.co.kr)
// ─────────────────────────────────────────────────────────
async function loadModelsFromAPI() {
  try {
    const res = await fetch('/api/presets/models');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    AppState.allModels = data.models || [];
    AppState.filteredModels = [...AppState.allModels];

    const wrap = document.getElementById('modelGridWrap');
    const loading = document.getElementById('modelsLoading');
    if (AppState.allModels.length === 0) {
      if (loading) {
        loading.style.display = '';
        loading.innerHTML = '<div style="font-size:40px;margin-bottom:12px">👤</div><p style="font-weight:700">등록된 모델이 없습니다</p><p style="font-size:12px;margin-top:4px">관리자 페이지에서 모델을 등록해주세요</p>';
      }
    } else {
      showGrid('modelsLoading', 'modelGrid', () => renderModelGrid(AppState.allModels));
    }
  } catch (err) {
    console.error('Models load error:', err);
    const loading = document.getElementById('modelsLoading');
    if (loading) {
      loading.style.display = '';
      loading.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)"><div style="font-size:48px;margin-bottom:16px">⚠️</div><p style="font-weight:700;font-size:16px;margin-bottom:6px">모델 목록 로딩 실패</p><p style="font-size:13px">잠시 후 다시 시도해주세요</p></div>';
    }
  }
}

// ─────────────────────────────────────────────────────────
// API: 배경 로드 (aifashion.co.kr)
// ─────────────────────────────────────────────────────────
async function loadBackgroundsFromAPI() {
  try {
    const res = await fetch('/api/presets/backgrounds');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    AppState.allBackgrounds = data.backgrounds || [];
    AppState.filteredBackgrounds = [...AppState.allBackgrounds];

    const wrap = document.getElementById('bgGridWrap');
    const loading = document.getElementById('bgsLoading');
    if (AppState.allBackgrounds.length === 0) {
      if (loading) {
        loading.style.display = '';
        loading.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)"><div style="font-size:48px;margin-bottom:16px">🖼️</div><p style="font-weight:700;font-size:16px;margin-bottom:6px">등록된 배경이 없습니다</p><p style="font-size:13px">관리자 페이지에서 배경을 먼저 등록해주세요</p></div>';
      }
    } else {
      showGrid('bgsLoading', 'bgGrid', () => renderBgGrid(AppState.allBackgrounds));
    }
  } catch (err) {
    console.error('Backgrounds load error:', err);
    const loading = document.getElementById('bgsLoading');
    if (loading) {
      loading.style.display = '';
      loading.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)"><div style="font-size:48px;margin-bottom:16px">⚠️</div><p style="font-weight:700;font-size:16px;margin-bottom:6px">배경 목록 로딩 실패</p><p style="font-size:13px">잠시 후 다시 시도해주세요</p></div>';
    }
  }
}

// ─────────────────────────────────────────────────────────
// FALLBACK DATA (API 실패 시)
// ─────────────────────────────────────────────────────────
function getFallbackModels() {
  // 관리자 업로드 커스텀 모델만 사용 — 기본 폴백 없음
  return [];
}

function getFallbackBackgrounds() {
  // 관리자 업로드 커스텀 배경만 사용 — 기본 폴백 없음
  return [];
}

// ─────────────────────────────────────────────────────────
// STEP NAVIGATION
// ─────────────────────────────────────────────────────────
function goToStep(step) {
  if (step >= AppState.currentStep) return;
  changeStep(step);
}

function nextStep(currentStep) {
  if (currentStep === 1) {
    const hasAny = SLOT_CATS.some(cat => slotData[cat] !== null);
    if (!hasAny) {
      showToast('상의·하의·전체(원피스/세트) 중 하나 이상 업로드해주세요.', 'warning');
      return;
    }
  }
  // Step 2: 모델 미선택 시 랜덤 자동 선택
  if (currentStep === 2 && !AppState.selectedModel) {
    const pool = AppState.allModels.length > 0 ? AppState.allModels : getFallbackModels();
    if (pool.length > 0) {
      const random = pool[Math.floor(Math.random() * pool.length)];
      AppState.selectedModel = random;
      showToast(`랜덤 모델이 선택됐습니다: ${random.name || '#' + random.id}`, 'info');
    }
  }
  // Step 3: 배경 미선택 시 랜덤 자동 선택
  if (currentStep === 3 && !AppState.selectedBg) {
    const pool = AppState.allBackgrounds.length > 0 ? AppState.allBackgrounds : getFallbackBackgrounds();
    if (pool.length > 0) {
      const random = pool[Math.floor(Math.random() * pool.length)];
      AppState.selectedBg = random;
      showToast(`랜덤 배경이 선택됐습니다: ${random.name}`, 'info');
    }
  }

  changeStep(currentStep + 1);
}

function prevStep(currentStep) {
  if (currentStep <= 1) {
    window.location.href = '/dashboard';
    return;
  }
  changeStep(currentStep - 1);
}


function changeStep(newStep) {
  const prev = AppState.currentStep;

  // gslide 전환 (새 구조)
  const allSlides = document.querySelectorAll('.gslide');
  allSlides.forEach(s => { s.classList.remove('active','prev'); });

  const newSlide = document.getElementById(`step-${newStep}`);
  const oldSlide = document.getElementById(`step-${prev}`);

  if (oldSlide) oldSlide.classList.add('prev');
  if (newSlide) newSlide.classList.add('active');

  // 뒤로 가면 방향 반전
  if (newStep < prev) {
    if (oldSlide) { oldSlide.classList.remove('prev'); oldSlide.style.transform='translateX(100%)'; }
    if (newSlide) { newSlide.style.transform='translateX(0)'; }
    // 트랜지션 후 인라인 스타일 정리
    setTimeout(() => {
      if (oldSlide) oldSlide.style.transform = '';
      if (newSlide) newSlide.style.transform = '';
    }, 300);
  }

  // gstep 인디케이터 업데이트 (3단계)
  for (let i = 1; i <= 3; i++) {
    const dot  = document.getElementById(`gs${i}`);
    const line = document.getElementById(`gl${i}`);
    if (dot) {
      dot.classList.remove('active','done');
      if (i < newStep)        dot.classList.add('done');
      else if (i === newStep) dot.classList.add('active');
    }
    if (line) line.classList.toggle('done', i < newStep);
  }

  AppState.currentStep = newStep;

  // Step 2: 모델 그리드
  if (newStep === 2) {
    if (AppState.allModels.length > 0) {
      showGrid('modelsLoading', 'modelGrid', () => renderModelGrid(AppState.allModels));
    } else {
      loadModelsFromAPI();
    }
  }

  // Step 3: 배경 그리드
  if (newStep === 3) {
    if (AppState.allBackgrounds.length > 0) {
      showGrid('bgsLoading', 'bgGrid', () => renderBgGrid(AppState.allBackgrounds));
    } else {
      loadBackgroundsFromAPI();
    }
  }
}

// 로딩 숨기고 그리드 표시 헬퍼
function showGrid(loadingId, gridId, renderFn) {
  const loading = document.getElementById(loadingId);
  const grid    = document.getElementById(gridId);
  if (loading) loading.style.display = 'none';
  if (grid)    grid.style.display    = '';
  if (renderFn) renderFn();
}

// ─────────────────────────────────────────────────────────
// STEP 1: 슬롯 기반 의류 업로드 (상의 / 하의 / 전체)
// 사용자가 직접 카테고리를 선택해 업로드 → 분류 오류 없음
// ─────────────────────────────────────────────────────────

// AppState.clothingItems 는 슬롯별로 최대 1장씩, 카테고리가 key
// { TOP: {dataUrl, file} | null, BOTTOM: ..., DRESS: ... }
// 기존 clothingItems 배열도 generation 요청 시 슬롯 데이터로 채워서 유지

const SLOT_CATS = ['TOP', 'BOTTOM', 'DRESS'];
const SLOT_LABEL = { TOP: '상의', BOTTOM: '하의', DRESS: '전체' };

// 슬롯별 데이터 저장 (null = 비어 있음)
const slotData = { TOP: null, BOTTOM: null, DRESS: null };

// ── label for= 방식: 이미 채워진 슬롯이면 파일선택창 열기 차단 ──
// label 클릭 시 호출. 이미 이미지가 있으면 false 반환 → label의 for= 동작 억제
function handleSlotLabelClick(e, cat) {
  // ✕ 버튼 클릭은 removeSlot()에서 처리 → label 기본동작 억제
  if (e.target.closest('.cslot-remove')) return false;
  // 이미 채워진 슬롯: 파일 선택창 열지 않음
  if (slotData[cat]) return false;
  // 비어 있으면 label for= 연결로 파일 선택창 열림 (브라우저 네이티브 동작)
  return true;
}

// ── 레거시 호환 (혹시 남은 onclick 에서 호출될 경우 대비) ──
function triggerSlotInput(cat) {
  if (slotData[cat]) return;
  const input = document.getElementById(`fileInput-${cat}`);
  if (input) input.click();
}

// ── 드래그 이벤트 ──
function handleSlotDragOver(e, cat) {
  e.preventDefault();
  e.stopPropagation();
  if (slotData[cat]) return; // 이미 채워진 슬롯은 무시
  document.getElementById(`slot-${cat}`)?.classList.add('drag-over');
}
function handleSlotDragLeave(e, cat) {
  const slot = document.getElementById(`slot-${cat}`);
  if (slot && !slot.contains(e.relatedTarget)) {
    slot.classList.remove('drag-over');
  }
}
function handleSlotDrop(e, cat) {
  e.preventDefault();
  e.stopPropagation();
  document.getElementById(`slot-${cat}`)?.classList.remove('drag-over');
  if (slotData[cat]) return; // 이미 채워진 슬롯 무시
  const file = e.dataTransfer.files?.[0];
  if (file) processSlotFile(file, cat);
}

// ── 파일 input change ──
function handleSlotFileSelect(e, cat) {
  const file = e.target.files?.[0];
  if (file) processSlotFile(file, cat);
  e.target.value = ''; // 같은 파일 재선택 허용
}

// ── 공통: 파일 유효성 검사 + 슬롯에 저장 ──
function processSlotFile(file, cat) {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    showToast('JPG, PNG, WEBP 형식만 지원합니다.', 'error');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast('파일 크기는 10MB 이하여야 합니다.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (ev) => {
    slotData[cat] = { file, dataUrl: ev.target.result };
    syncClothingItems();
    renderSlots();
    updateNextBtn1();
    showToast(`${SLOT_LABEL[cat]} 업로드 완료`, 'success');
  };
  reader.readAsDataURL(file);
}

// ── 슬롯 삭제 ──
function removeSlot(e, cat) {
  e.stopPropagation(); // 슬롯 클릭 전파 방지
  slotData[cat] = null;
  syncClothingItems();
  renderSlots();
  updateNextBtn1();
}

// ── slotData → AppState.clothingItems 동기화 (generation 요청에서 사용) ──
function syncClothingItems() {
  AppState.clothingItems = SLOT_CATS
    .filter(cat => slotData[cat] !== null)
    .map(cat => ({
      id:       `slot-${cat}`,
      file:     slotData[cat].file,
      dataUrl:  slotData[cat].dataUrl,
      category: cat,
      label:    SLOT_LABEL[cat],
      classifying: false,
    }));

  // 레거시 호환
  AppState.uploadedFile     = AppState.clothingItems[0]?.file     || null;
  AppState.uploadedImageUrl = AppState.clothingItems[0]?.dataUrl  || null;
}

// ── 슬롯 UI 렌더링 ──
function renderSlots() {
  SLOT_CATS.forEach(cat => {
    const slot       = document.getElementById(`slot-${cat}`);
    const body       = document.getElementById(`slot-body-${cat}`);
    const removeBtn  = document.getElementById(`slot-remove-${cat}`);
    if (!slot || !body) return;

    const data = slotData[cat];

    if (data) {
      // 이미지 있음 → 썸네일 표시 + label for= 비활성화 (pointer-events:none 로 파일창 방지)
      slot.classList.add('cslot--filled');
      body.innerHTML = `<img src="${data.dataUrl}" alt="${SLOT_LABEL[cat]}" class="cslot-img" />`;
      if (removeBtn) removeBtn.classList.remove('hidden');
    } else {
      // 비어 있음 → 플레이스홀더 (span 태그 — label 내부에서도 block처럼 동작)
      slot.classList.remove('cslot--filled');
      body.innerHTML = `
        <span class="cslot-empty">
          <span class="cslot-plus">＋</span>
          <span class="cslot-hint">탭하여 사진 선택</span>
        </span>`;
      if (removeBtn) removeBtn.classList.add('hidden');
    }
  });
}

// ── 다음 버튼: 슬롯 1개 이상 채워지면 활성화 ──
function updateNextBtn1() {
  const btn = document.getElementById('nextBtn1');
  if (!btn) return;
  const hasAny = SLOT_CATS.some(cat => slotData[cat] !== null);
  btn.disabled = !hasAny;
}

// ── 전체 초기화 (레거시 resetUpload 호환) ──
function resetUpload() {
  SLOT_CATS.forEach(cat => { slotData[cat] = null; });
  syncClothingItems();
  renderSlots();
  updateNextBtn1();
}

// ─────────────────────────────────────────────────────────
// STEP 2/3: PC 스크롤 화살표
// ─────────────────────────────────────────────────────────

function gridScroll(wrapId, direction) {
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;
  const scrollAmt = wrap.clientHeight * 0.7;
  wrap.scrollBy({ top: direction === 'left' ? -scrollAmt : scrollAmt, behavior: 'smooth' });
}

// 스크롤 화살표 표시/숨김 업데이트
function updateGridScrollBtns(wrapId) {
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;
  const prefix = wrapId === 'modelGridWrap' ? 'model' : 'bg';
  const leftBtn = document.getElementById(`${prefix}ScrollLeft`);
  const rightBtn = document.getElementById(`${prefix}ScrollRight`);
  if (leftBtn) leftBtn.style.opacity = wrap.scrollTop > 10 ? '1' : '0.3';
  if (rightBtn) {
    const atBottom = wrap.scrollTop + wrap.clientHeight >= wrap.scrollHeight - 10;
    rightBtn.style.opacity = atBottom ? '0.3' : '1';
  }
}

// ─────────────────────────────────────────────────────────
// STEP 2: Model Selection — 그리드 UI
// ─────────────────────────────────────────────────────────

// fixGridHeight — 새 구조에서는 CSS flex:1 로 자동처리, 빈 함수 유지
function fixGridHeight(wrapId) { /* no-op: CSS .gslide-grid { flex:1 } 으로 처리 */ }

function renderModelGrid(models) {
  const grid = document.getElementById('modelGrid');
  if (!grid) return;
  grid.innerHTML = '';

  // 스킵 카드
  const skipCard = document.createElement('div');
  skipCard.className = 'grid-skip-card' + (!AppState.selectedModel ? ' selected' : '');
  skipCard.innerHTML = `<span>🎲</span><p>선택 없음<br>(랜덤)</p>`;
  skipCard.addEventListener('click', () => {
    AppState.selectedModel = null;
    document.querySelectorAll('#modelGrid .grid-card, #modelGrid .grid-skip-card').forEach(c => c.classList.remove('selected'));
    skipCard.classList.add('selected');
  });
  grid.appendChild(skipCard);

  models.forEach((model) => {
    const displayName = model.name && !model.name.match(/^\d+$/)
      ? model.name : `모델 ${model.name || model.id}`;
    const imgSrc = model.isCustom
      ? `/api/proxy/custom-model/${model.customId}`
      : `/api/proxy/model-image/${model.id}`;

    const card = document.createElement('div');
    card.className = 'grid-card' + (AppState.selectedModel?.id === model.id ? ' selected' : '');
    card.innerHTML = `
      <img src="${imgSrc}" alt="${displayName}"
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="grid-card-fallback">${model.gender === '남성' ? '🧍‍♂️' : '🧍‍♀️'}</div>
      <div class="grid-card-label">${displayName}</div>
      <div class="grid-card-check"><i class="fas fa-check"></i></div>`;

    card.addEventListener('click', () => {
      AppState.selectedModel = model;
      document.querySelectorAll('#modelGrid .grid-card, #modelGrid .grid-skip-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
    grid.appendChild(card);
  });

}

let modelFilterState = { gender: null };

function filterModels(value, btn) {
  document.querySelectorAll('#modelFilters .filter-tag').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (value === 'all') {
    modelFilterState.gender = null;
    renderModelGrid(AppState.allModels);
  } else {
    modelFilterState.gender = value;
    const filtered = AppState.allModels.filter(m => (m.gender || '여성') === value);
    renderModelGrid(filtered.length > 0 ? filtered : AppState.allModels);
  }
}

// ─────────────────────────────────────────────────────────
// STEP 3: Background Selection — 그리드 UI
// ─────────────────────────────────────────────────────────

function renderBgGrid(bgs) {
  const grid = document.getElementById('bgGrid');
  if (!grid) return;
  grid.innerHTML = '';

  // 스킵 카드
  const skipCard = document.createElement('div');
  skipCard.className = 'grid-skip-card' + (!AppState.selectedBg ? ' selected' : '');
  skipCard.innerHTML = `<span>🌄</span><p>선택 없음<br>(랜덤)</p>`;
  skipCard.addEventListener('click', () => {
    AppState.selectedBg = null;
    document.querySelectorAll('#bgGrid .grid-card, #bgGrid .grid-skip-card').forEach(c => c.classList.remove('selected'));
    skipCard.classList.add('selected');
  });
  grid.appendChild(skipCard);

  bgs.forEach((bg) => {
    const imgSrc = bg.isCustom
      ? `/api/proxy/custom-bg/${bg.customId}`
      : `/api/proxy/bg-image/${bg.id}`;

    const card = document.createElement('div');
    card.className = 'grid-card' + (AppState.selectedBg?.id === bg.id ? ' selected' : '');
    card.innerHTML = `
      <img src="${imgSrc}" alt="${bg.name}"
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="grid-card-fallback">🖼️</div>
      <div class="grid-card-label">${bg.name}</div>
      <div class="grid-card-check"><i class="fas fa-check"></i></div>`;

    card.addEventListener('click', () => {
      AppState.selectedBg = bg;
      document.querySelectorAll('#bgGrid .grid-card, #bgGrid .grid-skip-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
    grid.appendChild(card);
  });

}

function filterBg(category, btn) {
  document.querySelectorAll('.bg-cat').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (category === '전체') {
    renderBgGrid(AppState.allBackgrounds);
  } else {
    const filtered = AppState.allBackgrounds.filter(b => b.category === category);
    renderBgGrid(filtered.length > 0 ? filtered : AppState.allBackgrounds);
  }
}

// STEP 5: Generation Options
// ─────────────────────────────────────────────────────────
function selectOption(chip, type) {
  const group = chip.closest('.option-chips');
  if (group) group.querySelectorAll('.option-chip').forEach(c => c.classList.remove('selected'));
  chip.classList.add('selected');
  AppState.genOptions[type] = chip.textContent.trim();
  updateCostDisplay();
}

function updateCostDisplay() {
  // 수량 고정 — 크레딧 표시 불필요 (공란 처리)
}

function updateGenSummary() {
  const modelEl = document.getElementById('sumModel');
  const bgEl = document.getElementById('sumBg');

  if (modelEl) {
    if (AppState.selectedModel) {
      const displayName = AppState.selectedModel.name && !AppState.selectedModel.name.match(/^\d+$/)
        ? AppState.selectedModel.name
        : `모델 ${AppState.selectedModel.name || AppState.selectedModel.id}`;
      const imageUrl = `/api/proxy/model-image/${AppState.selectedModel.id}`;
      modelEl.innerHTML = `<img src="${imageUrl}" alt="${displayName}" style="width:32px;height:40px;object-fit:cover;border-radius:4px;vertical-align:middle;margin-right:6px;" onerror="this.style.display='none'"> ${displayName}`;
    } else {
      modelEl.innerHTML = `<span style="font-size:18px;vertical-align:middle;margin-right:6px;">🎲</span> 랜덤 자동 배정`;
    }
  }

  if (bgEl) {
    if (AppState.selectedBg) {
      const imageUrl = `/api/proxy/bg-image/${AppState.selectedBg.id}`;
      bgEl.innerHTML = `<img src="${imageUrl}" alt="${AppState.selectedBg.name}" style="width:48px;height:32px;object-fit:cover;border-radius:4px;vertical-align:middle;margin-right:6px;" onerror="this.style.display='none'"> ${AppState.selectedBg.name}`;
    } else {
      bgEl.innerHTML = `<span style="font-size:18px;vertical-align:middle;margin-right:6px;">🌄</span> 랜덤 자동 배정`;
    }
  }
}

// ─────────────────────────────────────────────────────────
// GENERATION - Atlas Cloud API 실제 연동
// ─────────────────────────────────────────────────────────
async function startGeneration() {
  if (AppState.isGenerating) return;

  // ── 로그인 체크: 미로그인 시 모달 표시 후 리턴 ──
  if (!AppState.user) {
    AppState.pendingGeneration = true;
    openModal('loginModal');
    return;
  }

  // 배경 미선택 시 랜덤 자동 선택
  if (!AppState.selectedBg) {
    const pool = AppState.allBackgrounds.length > 0 ? AppState.allBackgrounds : getFallbackBackgrounds();
    if (pool.length > 0) {
      const random = pool[Math.floor(Math.random() * pool.length)];
      AppState.selectedBg = random;
      showToast(`랜덤 배경이 선택됐습니다: ${random.name}`, 'info');
    }
  }

  AppState.isGenerating = true;

  // UI: step-3 nav 숨기기, 생성 뷰 표시 (step-3 내부 오버레이)
  const step3Nav = document.getElementById('step3Nav');
  if (step3Nav) step3Nav.style.display = 'none';

  const genView = document.getElementById('generatingView');
  if (genView) genView.classList.add('active');

  // 진행 상태 초기화
  updateProgress(0, '시작 중...');
  setMsgState('msg1', 'current');

  try {
    // 선택된 모델의 description 생성
    const model = AppState.selectedModel;
    const modelDesc = buildModelDescription(model);
    const bg = AppState.selectedBg;

    const count = 1; // 생성 수량 고정 (1장)

    // 의류 이미지 배열 구성 (신규 다중 업로드)
    const clothingImages = AppState.clothingItems.map(ci => ({
      dataUrl:  ci.dataUrl,
      category: ci.category,
      label:    ci.label || '',
    }));

    // 레거시 단일 필드 (서버에서도 하위 호환 처리)
    const clothingImageUrl = AppState.uploadedImageUrl;

    // 생성 요청 시작 — fetch 대기 중 진행 바 애니메이션
    updateProgress(10, '의류 이미지 분석 중...');

    let fakeProgress = 10;
    const fakeProgressMessages = [
      '의류 이미지 분석 중...',
      'AI 이미지 합성 준비 중...',
      '의상·신원 통합 처리 중...',
    ];
    let fakeMsgIdx = 0;
    const fakeTimer = setInterval(() => {
      if (fakeProgress < 30) {
        fakeProgress += 3;
        fakeMsgIdx = Math.min(Math.floor((fakeProgress - 10) / 7), fakeProgressMessages.length - 1);
        updateProgress(fakeProgress, fakeProgressMessages[fakeMsgIdx]);
      }
    }, 2000);

    // 세션 토큰 (로그인 인증용)
    const sessionToken = localStorage.getItem('lookbook_token') || '';

    // 재생성을 위해 파라미터 저장 + 재생성 카운터 초기화
    AppState.lastGenParams = {
      modelId: model?.id,
      modelName: model?.name || '패션 모델',
      modelDesc,
      bgId: bg?.id,
      bgName: bg?.name || '스튜디오',
      bgDesc: bg?.bgDesc || 'clean studio background with professional lighting',
      poseType: AppState.genOptions.pose_type,
      pose: AppState.genOptions.pose,
      ratio: AppState.genOptions.ratio || '3:4',
      resolution: AppState.genOptions.resolution || 'HD',
      count,
      clothingImages,
      clothingImageUrl,
    };
    AppState.regenCount = 0;

    let startRes;
    try {
      startRes = await fetch('/api/generation/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken,
        },
        body: JSON.stringify(AppState.lastGenParams)
      });
    } finally {
      // Step1 완료 (또는 단일단계 요청 완료) → 가짜 진행 타이머 중지
      clearInterval(fakeTimer);
    }

    // 로그인/크레딧 오류 처리
    if (startRes.status === 401) {
      showToast('로그인이 필요합니다.', 'error');
      showStep(1);
      return;
    }
    if (startRes.status === 402) {
      const errData = await startRes.json();
      const need = errData.required ?? 90;
      const have = errData.available ?? 0;
      showToast(`크레딧이 부족합니다. 필요: ${need}크레딧 / 보유: ${have}크레딧`, 'error');
      // 드롭다운 열어서 충전 버튼 유도
      const userArea = document.getElementById('navUserArea');
      if (userArea) userArea.click();
      showStep(1);
      return;
    }

    const startData = await startRes.json();
    console.log('Generation start response:', startData);

    if (!startData.jobId) {
      throw new Error('생성 요청 실패: Job ID 없음');
    }

    // 크레딧 차감은 다운로드 시점에 수행
    AppState.currentJobId = startData.jobId;

    // Fallback 처리 (즉시 완료)
    if (startData.isFallback) {
      updateProgress(30, 'AI 모델 피팅 적용 중...');
      setMsgState('msg1', 'done');
      setMsgState('msg2', 'current');

      await sleep(1500);
      updateProgress(60, '배경 합성 중...');
      setMsgState('msg2', 'done');
      setMsgState('msg3', 'current');

      await sleep(1500);
      updateProgress(85, '이미지 품질 향상 중...');
      setMsgState('msg3', 'done');
      setMsgState('msg4', 'current');

      await sleep(1000);
      updateProgress(100, '완료!');
      setMsgState('msg4', 'done');
      setMsgState('msg5', 'done');

      // 폴백 결과 표시
      const fallbackImages = generateFallbackImages(count);
      completeGeneration(fallbackImages);
      return;
    }

    // 실제 Atlas Cloud 폴링
    updateProgress(20, 'AI 모델 피팅 적용 중...');
    setMsgState('msg1', 'done');
    setMsgState('msg2', 'current');

    await pollGenerationStatus(startData.jobId, count);

  } catch (err) {
    console.error('Generation error:', err);
    showToast(`생성 중 오류: ${err.message}`, 'error');
    AppState.isGenerating = false;

    // UI 복원
    const step3Nav = document.getElementById('step3Nav');
    if (step3Nav) step3Nav.style.display = '';
    const genView = document.getElementById('generatingView');
    if (genView) genView.classList.remove('active');
  }
}

// Atlas Cloud 결과 폴링
async function pollGenerationStatus(jobId, count) {
  let attempts = 0;
  const maxAttempts = 60; // 60회×3초=3분
  const pollDelay = 3000;

  const progressMessages = [
    'AI 모델 피팅 적용 중...',
    '의상·얼굴 통합 합성 중...',
    '씬 조명 적용 중...',
    '이미지 품질 향상 중...',
    '최종 렌더링 중...',
  ];

  while (attempts < maxAttempts) {
    await sleep(pollDelay);
    attempts++;

    try {
      const res = await fetch(`/api/generation/${jobId}/status`);
      const data = await res.json();

      console.log(`Poll attempt ${attempts}:`, data.status, data.progress);

      if (data.status === 'completed') {
        // 완료 처리
        updateProgress(95, '최종 렌더링 중...');
        setMsgState('msg3', 'done');
        setMsgState('msg4', 'done');
        setMsgState('msg5', 'current');

        await sleep(800);
        updateProgress(100, '생성 완료!');
        setMsgState('msg5', 'done');

        completeGeneration(data.images || [], data.isFallback);
        return;

      } else if (data.status === 'failed') {
        throw new Error(data.error || '생성 실패');

      } else {
        // processing
        const progress = Math.min(data.progress || 30, 85);
        const msgIdx = Math.min(
          Math.floor((attempts / maxAttempts) * progressMessages.length),
          progressMessages.length - 1
        );
        updateProgress(20 + progress * 0.65, progressMessages[msgIdx] || '처리 중...');

        // 메시지 상태 업데이트
        if (attempts > 5)  { setMsgState('msg2', 'done'); setMsgState('msg3', 'current'); }
        if (attempts > 15) { setMsgState('msg3', 'done'); setMsgState('msg4', 'current'); }
        if (attempts > 30) { setMsgState('msg4', 'done'); setMsgState('msg5', 'current'); }
      }

    } catch (pollErr) {
      console.error('Poll error:', pollErr);
      if (attempts >= maxAttempts - 5) {
        throw pollErr;
      }
    }
  }

  // 타임아웃 - 폴백으로 처리
  console.warn('Generation timeout, using fallback');
  const fallbackImages = generateFallbackImages(count);
  completeGeneration(fallbackImages, true);
}

// 생성 완료 처리
function completeGeneration(images, isFallback = false) {
  AppState.isGenerating = false;

  console.log('completeGeneration called — isFallback:', isFallback, '| images count:', images.length, '| images:', JSON.stringify(images.map(i => ({id:i.id, url: i.url ? i.url.substring(0,80) : null, placeholder: i.placeholder}))));

  // Atlas Cloud 이미지 URL을 서버사이드 프록시로 변환 (CORS 우회)
  const proxiedImages = images.map(img => {
    if (img.url && img.url.startsWith('http')) {
      return { ...img, url: `/api/proxy/gen-image?url=${encodeURIComponent(img.url)}`, originalUrl: img.url };
    }
    return img;
  });

  AppState.generatedImages = proxiedImages;

  renderResults(proxiedImages);
  changeStep(4);

  const count = images.length;
  if (isFallback) {
    showToast(`${count}장의 이미지가 생성되었습니다. (데모 모드) 🎉`, 'success');
  } else {
    showToast(`${count}장의 실사 AI 이미지가 생성되었습니다! 🎉`, 'success');
  }
}

// 폴백 이미지 생성 헬퍼
function generateFallbackImages(count) {
  const gradients = [
    ['#FF6B9D', '#FF8C42'],
    ['#6C47FF', '#00D4AA'],
    ['#FF6B9D', '#6C47FF'],
    ['#F59E0B', '#EF4444'],
    ['#3B82F6', '#8B5CF6'],
    ['#00D4AA', '#6C47FF'],
    ['#EC4899', '#F97316'],
    ['#8B5CF6', '#EC4899'],
  ];
  return Array.from({ length: count }, (_, i) => ({
    id: `placeholder_${i + 1}`,
    url: null,
    placeholder: true,
    gradient: `linear-gradient(135deg, ${gradients[i % gradients.length][0]}, ${gradients[i % gradients.length][1]})`,
    title: `AI 피팅컷 #${i + 1}`,
    width: 832,
    height: 1216,
  }));
}

// 모델 설명 생성 (photorealistic 프롬프트용)
function buildModelDescription(model) {
  if (!model) return 'young Asian female fashion model, slim figure, natural look';

  const genderMap = { '여성': 'female', '남성': 'male' };
  const ageMap = {
    '10대': 'teenage', '20대': 'young adult in their 20s',
    '30대': 'adult in their 30s', '40대': 'mature adult in their 40s',
  };
  const bodyMap = {
    '슬림': 'slim', '표준': 'average build', '커브': 'curvy',
    '근육': 'athletic muscular', '플러스': 'plus size',
  };
  const moodMap = {
    '시크': 'chic and sophisticated', '내추럴': 'natural and casual',
    '럭셔리': 'luxurious and elegant', '큐트': 'cute and fresh',
    '캐주얼': 'casual and relaxed', '스트릿': 'street style edgy',
    '청순': 'pure and innocent',
  };
  const skinMap = {
    '밝은': 'light skin tone', '중간': 'medium skin tone', '어두운': 'dark skin tone',
  };

  const parts = [
    ageMap[model.age] || 'young adult',
    genderMap[model.gender] || 'female',
    'Asian',
    bodyMap[model.body] || 'average build',
    'fashion model',
    moodMap[model.mood] ? `with ${moodMap[model.mood]} style` : '',
    skinMap[model.skin] || 'medium skin tone',
  ].filter(Boolean);

  return parts.join(', ');
}

// ─────────────────────────────────────────────────────────
// STEP 6: Results
// ─────────────────────────────────────────────────────────
function renderResults(images) {
  const grid = document.getElementById('resultsGrid');
  if (!grid) return;

  grid.innerHTML = '';

  // 결과 탭 텍스트 업데이트
  const firstTab = document.querySelector('.results-tab');
  if (firstTab) firstTab.textContent = `피팅컷 (${images.length})`;

  images.forEach((img, idx) => {
    const card = document.createElement('div');
    card.className = 'result-card';

    if (img.url) {
      // 실제 생성된 이미지 (Atlas Cloud)
      card.innerHTML = `
        <div class="result-thumb" style="overflow:hidden;">
          <img
            src="${img.url}"
            alt="${img.title || `피팅컷 #${idx + 1}`}"
            style="width:100%;height:100%;object-fit:cover;display:block;"
            onerror="console.error('Image load failed:', this.src); this.parentElement.style.background='${img.gradient || 'linear-gradient(135deg,#6C47FF,#00D4AA)'}'; this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;\\'><span style=\\'font-size:32px;\\'>⚠️</span><span style=\\'color:rgba(255,255,255,0.8);font-size:12px;text-align:center;padding:0 8px;\\'>이미지 로드 실패<br/>프록시 오류</span></div>';"
          />
        </div>
        <div class="result-overlay">
          <button class="result-overlay-btn download" onclick="downloadWithCreditCheck(${idx}); event.stopPropagation();">
            ⬇️ 다운로드
          </button>
          <button class="result-overlay-btn regen" onclick="regenFromCard(${idx}); event.stopPropagation();" title="재생성">
            🔄 재생성
          </button>
          <button class="result-overlay-btn enlarge" onclick="openImageModal(${idx}); event.stopPropagation();">
            🔍 확대
          </button>
        </div>
      `;
    } else {
      // 플레이스홀더 (폴백)
      card.innerHTML = `
        <div class="result-thumb">
          <div style="width:100%;height:100%;background:${img.gradient};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;">
            <span style="font-size:48px;">✨</span>
            <span style="color:rgba(255,255,255,0.9);font-size:13px;font-weight:700;">AI 생성 #${idx + 1}</span>
            <span style="color:rgba(255,255,255,0.6);font-size:11px;">데모 이미지</span>
          </div>
        </div>
        <div class="result-overlay">
          <button class="result-overlay-btn download" onclick="downloadWithCreditCheck(${idx}); event.stopPropagation();">
            ⬇️ 다운로드
          </button>
          <button class="result-overlay-btn regen" onclick="regenFromCard(${idx}); event.stopPropagation();" title="재생성">
            🔄 재생성
          </button>
          <button class="result-overlay-btn enlarge" onclick="openImageModal(${idx}); event.stopPropagation();">
            🔍 확대
          </button>
        </div>
      `;
    }

    card.addEventListener('click', () => openImageModal(idx));
    grid.appendChild(card);
  });
}

function openImageModal(idx) {
  const img = AppState.generatedImages[idx];
  if (!img) return;

  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImage');

  // 이미지 설정
  if (modalImg) {
    if (img.url) {
      modalImg.src = img.url;
      modalImg.style.display = 'block';
    } else {
      modalImg.src = '';
      modalImg.style.display = 'none';
    }
  }

  // 현재 이미지 인덱스 저장 (다운로드 / 재생성용)
  modal.dataset.currentIdx = idx;

  // 재생성 버튼 상태 업데이트
  updateRegenUI();

  openModal('imageModal');
}

// 재생성 버튼 UI 업데이트
function updateRegenUI() {
  const regenBtn = document.getElementById('regenBtn');
  const regenBtnText = document.getElementById('regenBtnText');
  const regenCounter = document.getElementById('regenCounter');
  const regenLimitMsg = document.getElementById('regenLimitMsg');
  const MAX_REGEN = 3;

  if (!regenBtn) return;

  if (AppState.regenCount >= MAX_REGEN) {
    // 한도 초과
    regenBtn.disabled = true;
    regenBtn.style.opacity = '0.4';
    regenBtn.style.cursor = 'not-allowed';
    if (regenBtnText) regenBtnText.textContent = '재생성';
    if (regenCounter) regenCounter.textContent = `${MAX_REGEN}/${MAX_REGEN}`;
    if (regenLimitMsg) regenLimitMsg.style.display = 'block';
  } else {
    // 정상 상태
    regenBtn.disabled = false;
    regenBtn.style.opacity = '1';
    regenBtn.style.cursor = 'pointer';
    if (regenBtnText) regenBtnText.textContent = '재생성';
    if (regenCounter) regenCounter.textContent = AppState.regenCount > 0 ? `${AppState.regenCount}/${MAX_REGEN}` : '';
    if (regenLimitMsg) regenLimitMsg.style.display = 'none';
  }
}

function switchResultsTab(tab, btn) {
  document.querySelectorAll('.results-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  if (tab === 'styleset') {
    showToast('스타일샷 세트를 추가 생성하려면 아래 버튼을 클릭하세요.', 'info');
  }
}

function toggleResultFav(btn, e) {
  if (e) e.stopPropagation();
  const isFav = btn.classList.toggle('active');
  btn.textContent = isFav ? '❤️' : '🤍';
  showToast(isFav ? '즐겨찾기에 추가되었습니다.' : '즐겨찾기에서 제거되었습니다.', isFav ? 'success' : 'info');
}

// ─── 실제 파일 다운로드 (크레딧 차감 없이 파일만 저장) ───
function _doFileDownload(url, num) {
  if (!url) {
    showToast(`피팅컷 #${num} 다운로드를 시작합니다.`, 'success');
    return;
  }
  const dlUrl = url.includes('/api/proxy/gen-image')
    ? url + (url.includes('?') ? '&' : '?') + 'download=1'
    : url;
  const a = document.createElement('a');
  a.href = dlUrl;
  a.download = `lookbook_ai_fitting_${num}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── 크레딧 차감 후 다운로드 (모든 다운로드 경로의 공통 진입점) ───
async function downloadWithCreditCheck(idx) {
  const img = AppState.generatedImages[idx];
  if (!img) { showToast('이미지를 찾을 수 없습니다.', 'error'); return; }

  const sessionToken = localStorage.getItem('lookbook_token') || '';
  if (!sessionToken) {
    showToast('로그인이 필요합니다.', 'error');
    return;
  }

  try {
    const deductRes = await fetch('/api/credits/deduct', {
      method: 'POST',
      headers: { 'X-Session-Token': sessionToken },
    });

    if (deductRes.status === 401) {
      showToast('로그인이 필요합니다.', 'error');
      return;
    }
    if (deductRes.status === 402) {
      const errData = await deductRes.json();
      const have = errData.available ?? 0;
      showToast(`크레딧이 부족합니다. (보유: ${have}크레딧 / 필요: 90크레딧) 대시보드에서 충전해 주세요.`, 'error');
      setTimeout(() => {
        const userArea = document.getElementById('navUserArea');
        if (userArea) userArea.click();
      }, 1500);
      return;
    }
    if (!deductRes.ok) {
      showToast('크레딧 처리 중 오류가 발생했습니다.', 'error');
      return;
    }

    const deductData = await deductRes.json();
    // 크레딧 잔액 UI 갱신
    if (deductData.creditsRemaining !== undefined) {
      const cachedUser = JSON.parse(localStorage.getItem('lookbook_user') || 'null');
      if (cachedUser) { cachedUser.credits = deductData.creditsRemaining; localStorage.setItem('lookbook_user', JSON.stringify(cachedUser)); }
      if (AppState.user) AppState.user.credits = deductData.creditsRemaining;
      updateUserUI({ credits: deductData.creditsRemaining });
    }
    // 파일 다운로드
    _doFileDownload(img.url, idx + 1);
    showToast(`다운로드 완료! (90크레딧 차감, 잔액: ${deductData.creditsRemaining}크레딧)`, 'success');
  } catch (err) {
    console.error('Download error:', err);
    showToast('다운로드 중 오류가 발생했습니다.', 'error');
  }
}

// 레거시 — 내부에서만 사용 (크레딧 차감 없이 파일 저장만)
function downloadSingleImage(url, num) { _doFileDownload(url, num); }
function downloadSingle(num) { showToast(`피팅컷 #${num} 다운로드를 시작합니다.`, 'success'); }

function downloadAll() {
  const count = AppState.generatedImages.length;
  // 실제 이미지가 있는 경우 순차 다운로드 시도
  const realImages = AppState.generatedImages.filter(img => img.url);
  if (realImages.length > 0) {
    realImages.forEach((img, idx) => {
      setTimeout(() => {
        const dlUrl = img.url.includes('/api/proxy/gen-image')
          ? img.url + (img.url.includes('?') ? '&' : '?') + 'download=1'
          : img.url;
        const a = document.createElement('a');
        a.href = dlUrl;
        a.download = `lookbook_ai_fitting_${idx + 1}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, idx * 500);
    });
  }
  showToast(`${count}장 다운로드를 시작합니다. (1792 × 2400px 원본)`, 'success');
}

async function downloadImage() {
  const modal = document.getElementById('imageModal');
  const idx = parseInt(modal?.dataset.currentIdx || '0');
  const img = AppState.generatedImages[idx];
  const downloadBtn = document.getElementById('downloadBtn');

  // 버튼 비활성화 (중복 클릭 방지)
  if (downloadBtn) {
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 처리 중...';
  }

  try {
    // 크레딧 차감 API 호출
    const sessionToken = localStorage.getItem('lookbook_token') || '';
    const deductRes = await fetch('/api/credits/deduct', {
      method: 'POST',
      headers: { 'X-Session-Token': sessionToken },
    });

    if (deductRes.status === 401) {
      showToast('로그인이 필요합니다.', 'error');
      closeModal('imageModal');
      return;
    }

    if (deductRes.status === 402) {
      const errData = await deductRes.json();
      const have = errData.available || 0;
      showToast(`크레딧이 부족합니다. (보유: ${have}크레딧 / 필요: 90크레딧) 대시보드에서 충전해 주세요.`, 'error');
      // 모달 닫고 대시보드 충전 페이지로 유도
      setTimeout(() => {
        closeModal('imageModal');
        // 네비 드롭다운 열기 (충전 버튼 노출)
        const userArea = document.getElementById('navUserArea');
        if (userArea) userArea.click();
      }, 1500);
      return;
    }

    if (!deductRes.ok) {
      showToast('크레딧 처리 중 오류가 발생했습니다.', 'error');
      return;
    }

    const deductData = await deductRes.json();
    console.log('[Credits] 다운로드 차감:', deductData);

    // 크레딧 잔액 UI 갱신
    if (deductData.creditsRemaining !== undefined) {
      const cachedUser = JSON.parse(localStorage.getItem('lookbook_user') || 'null');
      if (cachedUser) {
        cachedUser.credits = deductData.creditsRemaining;
        localStorage.setItem('lookbook_user', JSON.stringify(cachedUser));
      }
      if (AppState.user) AppState.user.credits = deductData.creditsRemaining;
      updateUserUI({ credits: deductData.creditsRemaining });
    }

    // 실제 다운로드 실행
    if (img?.url) {
      downloadSingleImage(img.url, idx + 1);
      showToast(`다운로드 완료! (90크레딧 차감, 잔액: ${deductData.creditsRemaining}크레딧)`, 'success');
    } else {
      showToast('이미지를 다운로드합니다.', 'success');
    }
    closeModal('imageModal');

  } catch (err) {
    console.error('Download error:', err);
    showToast('다운로드 중 오류가 발생했습니다.', 'error');
  } finally {
    if (downloadBtn) {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = '<i class="fas fa-download"></i> 다운로드';
    }
  }
}

// 카드에서 재생성 버튼 클릭 시 (모달 없이 바로 재생성 시작)
function regenFromCard(idx) {
  const MAX_REGEN = 3;
  if (AppState.regenCount >= MAX_REGEN) {
    showToast('재생성 한도가 초과하였습니다. 다른 옷으로 시도해주세요.', 'error');
    return;
  }
  if (!AppState.lastGenParams) {
    showToast('재생성할 이미지 정보가 없습니다.', 'error');
    return;
  }
  // regenImage와 동일한 로직 사용
  regenImage();
}

// 재생성 함수 (최대 3회)
async function regenImage() {
  const MAX_REGEN = 3;

  if (AppState.regenCount >= MAX_REGEN) {
    updateRegenUI();
    return;
  }

  if (!AppState.lastGenParams) {
    showToast('재생성할 이미지 정보가 없습니다.', 'error');
    return;
  }

  const regenBtn = document.getElementById('regenBtn');
  const regenBtnText = document.getElementById('regenBtnText');
  const regenCounter = document.getElementById('regenCounter');

  // 버튼 로딩 상태
  if (regenBtn) {
    regenBtn.disabled = true;
    regenBtn.style.opacity = '0.6';
  }
  if (regenBtnText) regenBtnText.textContent = '재생성 중...';
  if (regenCounter) regenCounter.textContent = '';

  const sessionToken = localStorage.getItem('lookbook_token') || '';

  try {
    // 현재 모달의 이미지 인덱스 기억
    const modal = document.getElementById('imageModal');
    const currentIdx = parseInt(modal?.dataset.currentIdx || '0');

    // 생성 API 재호출
    const res = await fetch('/api/generation/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken,
      },
      body: JSON.stringify(AppState.lastGenParams),
    });

    if (res.status === 401) {
      showToast('로그인이 필요합니다.', 'error');
      return;
    }
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      showToast(errData.error || '재생성 요청 실패', 'error');
      return;
    }

    const startData = await res.json();
    if (!startData.jobId) {
      showToast('재생성 요청 실패: Job ID 없음', 'error');
      return;
    }

    // 재생성 카운트 증가
    AppState.regenCount++;

    showToast(`재생성 시작! (${AppState.regenCount}/${MAX_REGEN})`, 'info');

    // 모달 닫고 생성 진행 UI 표시
    closeModal('imageModal');

    // 생성 진행 상태 UI로 전환
    const generatingView = document.getElementById('generatingView');
    const resultsSection = document.getElementById('resultsSection');
    if (generatingView) generatingView.style.display = '';
    if (resultsSection) resultsSection.style.display = 'none';

    updateProgress(10, '재생성 중...');
    AppState.isGenerating = true;
    AppState.currentJobId = startData.jobId;

    // 폴링
    await pollGenerationStatus(startData.jobId, AppState.lastGenParams.count || 1);

  } catch (err) {
    console.error('Regen error:', err);
    showToast(`재생성 오류: ${err.message}`, 'error');
  } finally {
    // 버튼 상태 복원은 updateRegenUI에서 처리
    updateRegenUI();
  }
}

function toggleFavorite() {
  const icon = document.getElementById('modalFavIcon');
  if (!icon) return;
  const isFav = icon.classList.toggle('fa-solid');
  if (!isFav) icon.classList.add('fa-regular');
  showToast(isFav ? '즐겨찾기에 추가되었습니다.' : '즐겨찾기에서 제거되었습니다.', 'success');
}

// ─────────────────────────────────────────────────────────
// PROGRESS HELPERS
// ─────────────────────────────────────────────────────────
function updateProgress(percent, text) {
  const fill = document.getElementById('genProgressFill');
  if (fill) fill.style.width = Math.min(percent, 100) + '%';
  const statusText = document.getElementById('genStatusText');
  if (statusText) statusText.textContent = text;
}

function setMsgState(msgId, state) {
  const msg = document.getElementById(msgId);
  if (!msg) return;
  msg.classList.remove('current', 'done');
  if (state === 'current') {
    msg.classList.add('current');
    const dot = msg.querySelector('.dot');
    if (dot) dot.style.background = 'var(--primary)';
  } else if (state === 'done') {
    msg.classList.add('done');
    const dot = msg.querySelector('.dot');
    if (dot) dot.style.background = 'var(--success)';
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────
// SMOOTH SCROLL
// ─────────────────────────────────────────────────────────
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (link) {
    e.preventDefault();
    const targetId = link.getAttribute('href').slice(1);
    const target = document.getElementById(targetId);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// ─────────────────────────────────────────────────────────
// LOAD USER — 로컬 캐시 먼저 적용, 서버 세션 검증
// ─────────────────────────────────────────────────────────
(function loadUser() {
  try {
    const stored = localStorage.getItem('lookbook_user');
    if (stored) {
      AppState.user = JSON.parse(stored);
      updateUserUI(); // 즉시 UI 반영 (서버 검증 전)
    }
  } catch (e) {}
  // 랜딩 페이지에서도 세션 검증 실행
  const path = window.location.pathname;
  if (path === '/' || path === '') {
    verifySession();
  }
})();

// ─────────────────────────────────────────────────────────
// SCROLL ANIMATION
// ─────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.feature-card, .step-card, .pricing-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
});
