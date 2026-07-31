/* ===================================================
   AI Fashion Lookbook Studio - Frontend Logic
   aifashion.co.kr + Atlas Cloud AI 실API 연동
   =================================================== */

// ─────────────────────────────────────────────────────────
// GLOBAL STATE
// ─────────────────────────────────────────────────────────
const AppState = {
  currentStep: 1,
  uploadedFile: null,
  uploadedImageUrl: null,  // base64 데이터URL
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

  if (path === '/' || path === '') {
    // Landing page - no special init needed
  } else if (path === '/dashboard') {
    initDashboard();
  } else if (path === '/generator') {
    initGenerator();
  }
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
// AUTH
// ─────────────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');

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
      localStorage.setItem('lookbook_user', JSON.stringify(data.user));
      localStorage.setItem('lookbook_token', data.token);
      closeModal('loginModal');
      showToast(`환영합니다, ${data.user.name}님! 🎉`, 'success');
      setTimeout(() => window.location.href = '/dashboard', 1000);
    } else {
      showToast(data.message || '로그인에 실패했습니다.', 'error');
    }
  } catch (err) {
    showToast('서버 오류가 발생했습니다.', 'error');
  } finally {
    btn.textContent = '로그인';
    btn.disabled = false;
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const btn = document.getElementById('signupBtn');

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
      localStorage.setItem('lookbook_user', JSON.stringify(data.user));
      localStorage.setItem('lookbook_token', data.token);
      closeModal('signupModal');
      showToast(`가입 완료! 5크레딧을 드렸어요 🎁`, 'success');
      setTimeout(() => window.location.href = '/dashboard', 1000);
    } else {
      showToast(data.message || '가입에 실패했습니다.', 'error');
    }
  } catch (err) {
    showToast('서버 오류가 발생했습니다.', 'error');
  } finally {
    btn.textContent = '회원가입 & 무료 시작';
    btn.disabled = false;
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

function toggleUserMenu() {
  showToast('메뉴가 준비 중입니다.', 'info');
}

// ─────────────────────────────────────────────────────────
// GENERATOR INIT
// ─────────────────────────────────────────────────────────
function initGenerator() {
  // 모델과 배경 API에서 로드 (step 3, 4 진입 시 로드)
  // 페이지 초기화 시 미리 로드
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
  if (currentStep === 1 && !AppState.uploadedImageUrl) {
    showToast('의류 이미지를 업로드해주세요.', 'warning');
    return;
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

  if (currentStep + 1 === 4) {
    updateGenSummary();
  }
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

  // gstep 인디케이터 업데이트
  for (let i = 1; i <= 5; i++) {
    const dot  = document.getElementById(`gs${i}`);
    const line = document.getElementById(`gl${i}`);
    if (dot) {
      dot.classList.remove('active','done');
      if (i < newStep)      dot.classList.add('done');
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
// STEP 1: Upload
// ─────────────────────────────────────────────────────────
function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  document.getElementById('uploadArea')?.classList.add('drag-over');
}

function handleDragLeave(e) {
  document.getElementById('uploadArea')?.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  document.getElementById('uploadArea')?.classList.remove('drag-over');
  const files = e.dataTransfer.files;
  if (files && files[0]) processFile(files[0]);
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) processFile(file);
}

function processFile(file) {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    showToast('JPG, PNG, WEBP 형식만 지원합니다.', 'error');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast('파일 크기는 10MB 이하여야 합니다.', 'error');
    return;
  }

  AppState.uploadedFile = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    AppState.uploadedImageUrl = e.target.result;
    showUploadPreview(file, e.target.result);
  };
  reader.readAsDataURL(file);
}

function showUploadPreview(file, dataUrl) {
  document.getElementById('uploadArea')?.classList.add('hidden');
  document.getElementById('uploadPreview')?.classList.remove('hidden');

  const previewImg = document.getElementById('previewImg');
  if (previewImg) previewImg.src = dataUrl;

  const previewName = document.getElementById('previewName');
  if (previewName) previewName.textContent = file.name;

  const previewMeta = document.getElementById('previewMeta');
  if (previewMeta) previewMeta.textContent = `${(file.size / 1024).toFixed(1)} KB · ${file.type.split('/')[1].toUpperCase()}`;

  const btn = document.getElementById('nextBtn1');
  if (btn) btn.disabled = false;

  showToast('이미지가 업로드되었습니다!', 'success');
}

function resetUpload() {
  AppState.uploadedFile = null;
  AppState.uploadedImageUrl = null;

  document.getElementById('uploadArea')?.classList.remove('hidden');
  document.getElementById('uploadPreview')?.classList.add('hidden');

  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.value = '';

  const btn = document.getElementById('nextBtn1');
  if (btn) btn.disabled = true;
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
  AppState.isGenerating = true;

  // UI: 옵션 숨기기, 생성 뷰 표시
  document.getElementById('genOptionsView').style.display = 'none';
  document.getElementById('step5TitleArea').style.display = 'none';
  document.getElementById('step5Nav').style.display = 'none';

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

    const count = 3; // 생성 수량 고정

    // 의류 이미지 URL (base64 데이터URL)
    const clothingImageUrl = AppState.uploadedImageUrl;

    // 생성 요청
    updateProgress(10, '의류 이미지 분석 중...');

    const startRes = await fetch('/api/generation/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
        clothingImageUrl,
      })
    });

    const startData = await startRes.json();
    console.log('Generation start response:', startData);

    if (!startData.jobId) {
      throw new Error('생성 요청 실패: Job ID 없음');
    }

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
    document.getElementById('genOptionsView').style.display = '';
    document.getElementById('step5TitleArea').style.display = '';
    document.getElementById('step5Nav').style.display = '';
    const genView = document.getElementById('generatingView');
    if (genView) genView.classList.remove('active');
  }
}

// Atlas Cloud 결과 폴링
async function pollGenerationStatus(jobId, count) {
  let attempts = 0;
  const maxAttempts = 60; // 최대 2분 (2초 간격)
  const pollDelay = 3000; // 3초 간격

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
        const progressMessages = ['AI 모델 피팅 적용 중...', '배경 합성 중...', '이미지 품질 향상 중...'];
        const msgIdx = Math.floor((attempts / maxAttempts) * progressMessages.length);
        updateProgress(20 + progress * 0.65, progressMessages[msgIdx] || '처리 중...');

        // 메시지 상태 업데이트
        if (attempts > 5) setMsgState('msg2', 'done'), setMsgState('msg3', 'current');
        if (attempts > 15) setMsgState('msg3', 'done'), setMsgState('msg4', 'current');
        if (attempts > 30) setMsgState('msg4', 'done'), setMsgState('msg5', 'current');
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

  // Atlas Cloud 이미지 URL을 서버사이드 프록시로 변환 (CORS 우회)
  const proxiedImages = images.map(img => {
    if (img.url && img.url.startsWith('http')) {
      return { ...img, url: `/api/proxy/gen-image?url=${encodeURIComponent(img.url)}`, originalUrl: img.url };
    }
    return img;
  });

  AppState.generatedImages = proxiedImages;

  renderResults(proxiedImages);
  changeStep(5);

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
            onerror="this.parentElement.style.background='${img.gradient || 'linear-gradient(135deg,#6C47FF,#00D4AA)'}';this.style.display='none';"
          />
        </div>
        <button class="result-fav" onclick="toggleResultFav(this, event)" title="즐겨찾기">🤍</button>
        <div class="result-overlay">
          <button class="result-overlay-btn fav" onclick="toggleResultFav(event.currentTarget, event)">🤍</button>
          <button class="result-overlay-btn download" onclick="downloadSingleImage('${img.url}', ${idx + 1}); event.stopPropagation();">
            ⬇️ 다운로드
          </button>
          <button class="result-overlay-btn fav" onclick="openImageModal(${idx}); event.stopPropagation();">
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
        <button class="result-fav" onclick="toggleResultFav(this, event)" title="즐겨찾기">🤍</button>
        <div class="result-overlay">
          <button class="result-overlay-btn fav" onclick="toggleResultFav(event.currentTarget, event)">🤍</button>
          <button class="result-overlay-btn download" onclick="downloadSingle(${idx + 1}); event.stopPropagation();">
            ⬇️ 다운로드
          </button>
          <button class="result-overlay-btn fav" onclick="openImageModal(${idx}); event.stopPropagation();">
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
  const modalTitle = document.getElementById('modalImageTitle');
  const modalMeta = document.getElementById('modalImageMeta');
  const previewArea = document.querySelector('.image-modal-preview');

  if (previewArea) {
    if (img.url) {
      previewArea.innerHTML = `
        <img
          src="${img.url}"
          alt="${img.title || `피팅컷 #${idx + 1}`}"
          style="max-width:100%;max-height:80vh;border-radius:12px;object-fit:contain;"
          onerror="this.parentElement.innerHTML='<div style=\\"width:400px;height:533px;background:${img.gradient || 'linear-gradient(135deg,#6C47FF,#00D4AA)'};border-radius:12px;display:flex;align-items:center;justify-content:center;\\"</div>'"
        />
      `;
    } else {
      previewArea.innerHTML = `
        <div style="width:400px;height:533px;background:${img.gradient};border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;">
          <span style="font-size:80px;">✨</span>
          <span style="color:rgba(255,255,255,0.9);font-size:16px;font-weight:700;">AI 생성 피팅컷 #${idx + 1}</span>
          <span style="color:rgba(255,255,255,0.6);font-size:13px;">데모 이미지</span>
        </div>
      `;
    }
  }

  if (modalTitle) modalTitle.textContent = img.title || `AI 피팅컷 #${idx + 1}`;
  if (modalMeta) modalMeta.textContent = `${img.width || 832} × ${img.height || 1216}px · PNG`;

  // 현재 이미지 인덱스 저장 (다운로드용)
  modal.dataset.currentIdx = idx;

  openModal('imageModal');
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

function downloadSingleImage(url, num) {
  if (!url) {
    showToast(`피팅컷 #${num} 다운로드를 시작합니다.`, 'success');
    return;
  }
  const a = document.createElement('a');
  a.href = url;
  a.download = `lookbook_ai_fitting_${num}.png`;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast(`피팅컷 #${num} 다운로드를 시작합니다.`, 'success');
}

function downloadSingle(num) {
  showToast(`피팅컷 #${num} 다운로드를 시작합니다.`, 'success');
}

function downloadAll() {
  const count = AppState.generatedImages.length;
  // 실제 이미지가 있는 경우 순차 다운로드 시도
  const realImages = AppState.generatedImages.filter(img => img.url);
  if (realImages.length > 0) {
    realImages.forEach((img, idx) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = img.url;
        a.download = `lookbook_ai_fitting_${idx + 1}.png`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, idx * 500);
    });
  }
  showToast(`${count}장 다운로드를 시작합니다.`, 'success');
}

function downloadImage() {
  const modal = document.getElementById('imageModal');
  const idx = parseInt(modal?.dataset.currentIdx || '0');
  const img = AppState.generatedImages[idx];

  if (img?.url) {
    downloadSingleImage(img.url, idx + 1);
  } else {
    showToast('이미지를 다운로드합니다.', 'success');
  }
  closeModal('imageModal');
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
// LOAD USER FROM LOCAL STORAGE
// ─────────────────────────────────────────────────────────
(function loadUser() {
  try {
    const stored = localStorage.getItem('lookbook_user');
    if (stored) AppState.user = JSON.parse(stored);
  } catch (e) {}
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
