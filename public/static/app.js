/* ===================================================
   AI Fashion Lookbook Studio - Frontend Logic
   =================================================== */

// ─────────────────────────────────────────────────────────
// GLOBAL STATE
// ─────────────────────────────────────────────────────────
const AppState = {
  currentStep: 1,
  direction: null,
  uploadedFile: null,
  uploadedImageUrl: null,
  selectedModel: null,
  selectedBg: null,
  genOptions: {
    count: '4장 (1크레딧)',
    pose_type: '전신',
    pose: '정면',
    face: '얼굴 있음'
  },
  generatedImages: [],
  isGenerating: false,
  user: null,
};

// Mock data mirrors
const MODELS = [
  { id: 'm1', name: '소피아', gender: '여성', age: '20대', body: '표준', mood: '시크', skin: '밝은', color: '#FFB3C6' },
  { id: 'm2', name: '지아', gender: '여성', age: '20대', body: '슬림', mood: '내추럴', skin: '중간', color: '#C8A882' },
  { id: 'm3', name: '레이첼', gender: '여성', age: '30대', body: '커브', mood: '럭셔리', skin: '어두운', color: '#8B6B45' },
  { id: 'm4', name: '민지', gender: '여성', age: '20대', body: '표준', mood: '큐트', skin: '밝은', color: '#FFD6E7' },
  { id: 'm5', name: '에마', gender: '여성', age: '30대', body: '슬림', mood: '시크', skin: '중간', color: '#D4A5A5' },
  { id: 'm6', name: '유나', gender: '여성', age: '20대', body: '표준', mood: '캐주얼', skin: '밝은', color: '#A8D8EA' },
  { id: 'm7', name: '다니엘', gender: '남성', age: '20대', body: '표준', mood: '캐주얼', skin: '중간', color: '#B5D5C5' },
  { id: 'm8', name: '제이크', gender: '남성', age: '30대', body: '근육', mood: '시크', skin: '어두운', color: '#7C9885' },
  { id: 'm9', name: '리암', gender: '남성', age: '20대', body: '슬림', mood: '스트릿', skin: '밝은', color: '#C5D5EA' },
  { id: 'm10', name: '마야', gender: '여성', age: '10대', body: '슬림', mood: '청순', skin: '밝은', color: '#FFF0D4' },
  { id: 'm11', name: '비앙카', gender: '여성', age: '40대', body: '표준', mood: '럭셔리', skin: '중간', color: '#D4C5A9' },
  { id: 'm12', name: '카오리', gender: '여성', age: '20대', body: '표준', mood: '내추럴', skin: '밝은', color: '#E8D5C0' },
];

const BACKGROUNDS = [
  { id: 'b1', name: '화이트 스튜디오', category: '스튜디오', mood: '미니멀', color: '#F5F5F5', icon: '🤍' },
  { id: 'b2', name: '그레이 스튜디오', category: '스튜디오', mood: '뉴트럴', color: '#BDBDBD', icon: '🩶' },
  { id: 'b3', name: '블랙 스튜디오', category: '스튜디오', mood: '하이엔드', color: '#2A2A2A', icon: '🖤' },
  { id: 'b4', name: '핑크 스튜디오', category: '스튜디오', mood: '웜', color: '#FFB6C1', icon: '🌸' },
  { id: 'b5', name: '카페 인테리어', category: '카페', mood: '웜', color: '#C8A882', icon: '☕' },
  { id: 'b6', name: '루프탑', category: '실내', mood: '뉴트럴', color: '#87CEEB', icon: '🌆' },
  { id: 'b7', name: '스트리트 도쿄', category: '스트리트', mood: '뉴트럴', color: '#708090', icon: '🗼' },
  { id: 'b8', name: '봄 공원', category: '자연', mood: '웜', color: '#90EE90', icon: '🌸' },
  { id: 'b9', name: '럭셔리 호텔 로비', category: '럭셔리', mood: '하이엔드', color: '#D4AF87', icon: '✨' },
  { id: 'b10', name: '미니멀 화이트룸', category: '실내', mood: '미니멀', color: '#FAFAFA', icon: '🏠' },
  { id: 'b11', name: '빈티지 벽돌벽', category: '스트리트', mood: '빈티지', color: '#CC7722', icon: '🧱' },
  { id: 'b12', name: '블루 오션', category: '자연', mood: '쿨', color: '#1E90FF', icon: '🌊' },
  { id: 'b13', name: '모던 갤러리', category: '실내', mood: '미니멀', color: '#E8E8E8', icon: '🎨' },
  { id: 'b14', name: '파리 골목', category: '스트리트', mood: '빈티지', color: '#8B7355', icon: '🗺️' },
];

const SAMPLE_PROJECTS = [
  { id: 'p1', name: '2024 S/S 룩북', status: 'done', images: 8, created: '2024-03-15', color: '#FF6B9D', icon: '👗' },
  { id: 'p2', name: '캐주얼 티셔츠 컷', status: 'done', images: 4, created: '2024-03-12', color: '#6C47FF', icon: '👕' },
  { id: 'p3', name: '데님 라인 촬영', status: 'processing', images: 0, created: '2024-03-10', color: '#3B82F6', icon: '👖' },
  { id: 'p4', name: '원피스 봄 컬렉션', status: 'draft', images: 0, created: '2024-03-08', color: '#00D4AA', icon: '👘' },
];

// Generated result colors for mock display
const RESULT_GRADIENTS = [
  'linear-gradient(135deg, #FF6B9D 0%, #FF8C42 100%)',
  'linear-gradient(135deg, #6C47FF 0%, #00D4AA 100%)',
  'linear-gradient(135deg, #FF6B9D 0%, #6C47FF 100%)',
  'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
  'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
  'linear-gradient(135deg, #00D4AA 0%, #6C47FF 100%)',
  'linear-gradient(135deg, #EC4899 0%, #F97316 100%)',
  'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
];

// ─────────────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initPage();
});

function initPage() {
  const path = window.location.pathname;

  // Navbar scroll effect
  initNavbar();

  if (path === '/' || path === '') {
    // Landing page
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
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

// ─────────────────────────────────────────────────────────
// TOAST NOTIFICATIONS
// ─────────────────────────────────────────────────────────
function showToast(message, type = 'info', duration = 3000) {
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

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// Close modal on ESC key
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
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
  // Show target tab
  const target = document.getElementById(`tab-${tabId}`);
  if (target) target.classList.remove('hidden');

  // Update sidebar active state
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.remove('active');
  });

  // Find the clicked item
  const items = document.querySelectorAll('.sidebar-item');
  items.forEach(item => {
    if (item.getAttribute('onclick') && item.getAttribute('onclick').includes(tabId)) {
      item.classList.add('active');
    }
  });
}

function renderProjects(projects) {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  // Keep the new project card
  const newCard = grid.querySelector('.new-project-card');
  const existingCards = grid.querySelectorAll('.project-card');
  existingCards.forEach(c => c.remove());

  // Status labels
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
           <button class="project-action-btn primary" onclick="openResultsForProject('${p.id}'); event.stopPropagation();">결과 보기</button>` :
          `<button class="project-action-btn primary" onclick="window.location.href='/generator'; event.stopPropagation();">계속 작업</button>`
        }
      </div>
    `;
    card.addEventListener('click', () => openProjectDetail(p));
    grid.appendChild(card);
  });
}

function filterProjects() {
  const query = document.getElementById('projectSearch').value.toLowerCase();
  document.querySelectorAll('.project-card').forEach(card => {
    const name = card.dataset.name || '';
    card.style.display = name.includes(query) ? '' : 'none';
  });
}

function filterByStatus(status, btn) {
  // Update active button
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  document.querySelectorAll('.project-card').forEach(card => {
    if (status === 'all' || card.dataset.status === status) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

function openProjectDetail(project) {
  showToast(`"${project.name}" 프로젝트를 엽니다.`, 'info');
}

function toggleUserMenu() {
  showToast('메뉴가 준비 중입니다.', 'info');
}

// ─────────────────────────────────────────────────────────
// GENERATOR
// ─────────────────────────────────────────────────────────
function initGenerator() {
  renderModels(MODELS);
  renderBackgrounds(BACKGROUNDS);
}

// ── Step Navigation ──
function goToStep(step) {
  // Only allow going back
  if (step >= AppState.currentStep) return;
  changeStep(step);
}

function nextStep(currentStep) {
  if (currentStep === 1 && !AppState.direction) {
    showToast('의류 방향을 선택해주세요.', 'warning');
    return;
  }
  if (currentStep === 2 && !AppState.uploadedImageUrl) {
    showToast('의류 이미지를 업로드해주세요.', 'warning');
    return;
  }
  if (currentStep === 3 && !AppState.selectedModel) {
    showToast('AI 모델을 선택해주세요.', 'warning');
    return;
  }
  if (currentStep === 4 && !AppState.selectedBg) {
    showToast('배경을 선택해주세요.', 'warning');
    return;
  }

  changeStep(currentStep + 1);

  // Update generation summary when reaching step 5
  if (currentStep + 1 === 5) {
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
  // Hide current step
  const currentPanel = document.getElementById(`step-${AppState.currentStep}`);
  if (currentPanel) currentPanel.classList.remove('active');

  // Show new step
  const newPanel = document.getElementById(`step-${newStep}`);
  if (newPanel) newPanel.classList.add('active');

  // Update step progress dots
  for (let i = 1; i <= 6; i++) {
    const dot = document.getElementById(`dot-${i}`);
    const line = document.getElementById(`line-${i}`);
    if (dot) {
      dot.classList.remove('active', 'done');
      if (i < newStep) dot.classList.add('done');
      else if (i === newStep) dot.classList.add('active');
    }
    if (line) {
      line.classList.remove('done');
      if (i < newStep) line.classList.add('done');
    }
  }

  AppState.currentStep = newStep;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Step 1: Direction ──
function selectDirection(dir) {
  AppState.direction = dir;

  // Update card UI
  document.querySelectorAll('.direction-card').forEach(c => c.classList.remove('selected'));
  const card = document.getElementById(`dir-${dir}`);
  if (card) card.classList.add('selected');

  // Enable next button
  const btn = document.getElementById('nextBtn1');
  if (btn) btn.disabled = false;
}

// ── Step 2: Upload ──
function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  const area = document.getElementById('uploadArea');
  if (area) area.classList.add('drag-over');
}

function handleDragLeave(e) {
  const area = document.getElementById('uploadArea');
  if (area) area.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  const area = document.getElementById('uploadArea');
  if (area) area.classList.remove('drag-over');

  const files = e.dataTransfer.files;
  if (files && files[0]) {
    processFile(files[0]);
  }
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) processFile(file);
}

function processFile(file) {
  // Validate type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    showToast('JPG, PNG, WEBP 형식만 지원합니다.', 'error');
    return;
  }

  // Validate size (10MB)
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
  const uploadArea = document.getElementById('uploadArea');
  const preview = document.getElementById('uploadPreview');
  const previewImg = document.getElementById('previewImg');
  const previewName = document.getElementById('previewName');
  const previewMeta = document.getElementById('previewMeta');

  if (uploadArea) uploadArea.classList.add('hidden');
  if (preview) preview.classList.remove('hidden');
  if (previewImg) previewImg.src = dataUrl;
  if (previewName) previewName.textContent = file.name;
  if (previewMeta) previewMeta.textContent = `${(file.size / 1024).toFixed(1)} KB · ${file.type.split('/')[1].toUpperCase()}`;

  // Enable next button
  const btn = document.getElementById('nextBtn2');
  if (btn) btn.disabled = false;

  showToast('이미지가 업로드되었습니다!', 'success');
}

function resetUpload() {
  AppState.uploadedFile = null;
  AppState.uploadedImageUrl = null;

  const uploadArea = document.getElementById('uploadArea');
  const preview = document.getElementById('uploadPreview');
  const fileInput = document.getElementById('fileInput');

  if (uploadArea) uploadArea.classList.remove('hidden');
  if (preview) preview.classList.add('hidden');
  if (fileInput) fileInput.value = '';

  const btn = document.getElementById('nextBtn2');
  if (btn) btn.disabled = true;
}

// ── Step 3: Model Selection ──
function renderModels(models) {
  const grid = document.getElementById('modelsGrid');
  if (!grid) return;

  grid.innerHTML = '';
  models.forEach(model => {
    const card = document.createElement('div');
    card.className = 'model-card' + (AppState.selectedModel?.id === model.id ? ' selected' : '');
    card.dataset.id = model.id;
    card.innerHTML = `
      <div class="model-thumb" style="background:linear-gradient(160deg, ${model.color}99, ${model.color});">
        <div class="model-silhouette">
          ${model.gender === '여성' ? '🧍‍♀️' : '🧍‍♂️'}
        </div>
      </div>
      <div class="model-info">
        <div class="model-name">${model.name}</div>
        <div class="model-tags">${model.gender} · ${model.age} · ${model.mood}</div>
      </div>
      <div class="model-selected-check">✓</div>
    `;
    card.addEventListener('click', () => selectModel(model, card));
    grid.appendChild(card);
  });
}

function selectModel(model, card) {
  AppState.selectedModel = model;

  document.querySelectorAll('.model-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');

  const btn = document.getElementById('nextBtn3');
  if (btn) btn.disabled = false;

  showToast(`${model.name} 모델을 선택했습니다.`, 'success');
}

let modelFilterState = { gender: null, age: null, body: null, mood: null };

function filterModels(value, btn, type = 'gender') {
  // Handle "전체" reset
  if (value === 'all') {
    modelFilterState = { gender: null, age: null, body: null, mood: null };
    document.querySelectorAll('#modelFilters .filter-tag').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderModels(MODELS);
    return;
  }

  // Toggle filter
  if (modelFilterState[type] === value) {
    modelFilterState[type] = null;
    btn.classList.remove('active');
  } else {
    // Remove other active of same type
    document.querySelectorAll(`#modelFilters .filter-tag[onclick*="${type}"]`).forEach(b => b.classList.remove('active'));
    modelFilterState[type] = value;
    btn.classList.add('active');
  }

  // Remove "전체" active if any filter is set
  const hasFilter = Object.values(modelFilterState).some(v => v !== null);
  const allBtn = document.querySelector('#modelFilters .filter-tag[onclick*="\'all\'"]');
  if (allBtn) allBtn.classList.toggle('active', !hasFilter);

  // Filter models
  const filtered = MODELS.filter(m => {
    if (modelFilterState.gender && m.gender !== modelFilterState.gender) return false;
    if (modelFilterState.age && m.age !== modelFilterState.age) return false;
    if (modelFilterState.body && m.body !== modelFilterState.body) return false;
    if (modelFilterState.mood && m.mood !== modelFilterState.mood) return false;
    return true;
  });

  renderModels(filtered.length > 0 ? filtered : MODELS);
}

// ── Step 4: Background Selection ──
function renderBackgrounds(bgs) {
  const grid = document.getElementById('backgroundsGrid');
  if (!grid) return;

  grid.innerHTML = '';
  bgs.forEach(bg => {
    const card = document.createElement('div');
    card.className = 'bg-card' + (AppState.selectedBg?.id === bg.id ? ' selected' : '');
    card.dataset.id = bg.id;
    card.innerHTML = `
      <div class="bg-thumb" style="background:linear-gradient(135deg, ${bg.color}88, ${bg.color});">
        <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;">${bg.icon}</div>
      </div>
      <div class="bg-info">
        <div class="bg-name">${bg.name}</div>
        <div class="bg-mood">${bg.category} · ${bg.mood}</div>
      </div>
      <div class="bg-selected-check">✓</div>
    `;
    card.addEventListener('click', () => selectBg(bg, card));
    grid.appendChild(card);
  });
}

function selectBg(bg, card) {
  AppState.selectedBg = bg;

  document.querySelectorAll('.bg-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');

  const btn = document.getElementById('nextBtn4');
  if (btn) btn.disabled = false;

  showToast(`"${bg.name}" 배경을 선택했습니다.`, 'success');
}

function filterBg(category, btn) {
  document.querySelectorAll('.bg-cat').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  if (category === '전체') {
    renderBackgrounds(BACKGROUNDS);
  } else {
    const filtered = BACKGROUNDS.filter(b => b.category === category);
    renderBackgrounds(filtered);
  }
}

// ── Step 5: Generation Options ──
function selectOption(chip, type) {
  // Only one selection per type group
  const group = chip.closest('.option-chips');
  if (group) {
    group.querySelectorAll('.option-chip').forEach(c => c.classList.remove('selected'));
  }
  chip.classList.add('selected');

  AppState.genOptions[type] = chip.textContent.trim();

  // Update cost display
  updateCostDisplay();
}

function updateCostDisplay() {
  const countChip = document.querySelector('.option-chips .option-chip.selected');
  const costEl = document.querySelector('.gen-cost-amount');
  if (!costEl) return;

  const is8 = AppState.genOptions.count && AppState.genOptions.count.includes('8장');
  costEl.textContent = is8 ? '2 크레딧' : '1 크레딧';
}

function updateGenSummary() {
  const dirEl = document.getElementById('sumDirection');
  const modelEl = document.getElementById('sumModel');
  const bgEl = document.getElementById('sumBg');

  if (dirEl) dirEl.textContent = AppState.direction === 'front' ? '앞면 (Front)' : '뒷면 (Back)';
  if (modelEl) {
    if (AppState.selectedModel) {
      modelEl.innerHTML = `<span style="width:32px;height:40px;border-radius:6px;background:${AppState.selectedModel.color};display:inline-flex;align-items:center;justify-content:center;font-size:16px;">${AppState.selectedModel.gender === '여성' ? '🧍‍♀️' : '🧍‍♂️'}</span> ${AppState.selectedModel.name}`;
    } else {
      modelEl.textContent = '선택되지 않음';
    }
  }
  if (bgEl) {
    if (AppState.selectedBg) {
      bgEl.innerHTML = `<span style="font-size:16px;">${AppState.selectedBg.icon}</span> ${AppState.selectedBg.name}`;
    } else {
      bgEl.textContent = '선택되지 않음';
    }
  }
}

// ── Generation ──
function startGeneration() {
  if (AppState.isGenerating) return;
  AppState.isGenerating = true;

  // Hide options, show generating view
  document.getElementById('genOptionsView').style.display = 'none';
  document.getElementById('step5TitleArea').style.display = 'none';
  document.getElementById('step5Nav').style.display = 'none';

  const genView = document.getElementById('generatingView');
  if (genView) genView.classList.add('active');

  // Simulate generation progress
  simulateGeneration();
}

function simulateGeneration() {
  const steps = [
    { id: 'msg1', text: '의류 이미지 분석 완료!', progress: 20, delay: 1500 },
    { id: 'msg2', text: 'AI 모델 피팅 적용 완료!', progress: 45, delay: 3500 },
    { id: 'msg3', text: '배경 합성 완료!', progress: 65, delay: 5500 },
    { id: 'msg4', text: '이미지 품질 향상 완료!', progress: 85, delay: 7500 },
    { id: 'msg5', text: '최종 렌더링 완료!', progress: 100, delay: 9500 },
  ];

  steps.forEach((step, idx) => {
    setTimeout(() => {
      // Mark previous as done
      const prevMsg = document.getElementById(steps[idx > 0 ? idx - 1 : 0].id);
      if (idx > 0 && prevMsg) {
        prevMsg.classList.remove('current');
        prevMsg.classList.add('done');
        prevMsg.querySelector('.dot').style.background = 'var(--success)';
      }

      // Mark current
      const currentMsg = document.getElementById(step.id);
      if (currentMsg) {
        currentMsg.classList.add('current');
        currentMsg.querySelector('div').textContent = ''; // clear dot text
      }

      // Update progress bar
      const fill = document.getElementById('genProgressFill');
      if (fill) fill.style.width = step.progress + '%';

      const statusText = document.getElementById('genStatusText');
      if (statusText) statusText.textContent = step.text;

      // Complete!
      if (idx === steps.length - 1) {
        setTimeout(() => {
          AppState.isGenerating = false;
          completeGeneration();
        }, 1000);
      }
    }, step.delay);
  });
}

function completeGeneration() {
  // Generate mock result images
  const count = AppState.genOptions.count && AppState.genOptions.count.includes('8장') ? 8 : 4;
  AppState.generatedImages = [];

  for (let i = 0; i < count; i++) {
    AppState.generatedImages.push({
      id: `result_${i + 1}`,
      title: `피팅컷 #${i + 1}`,
      gradient: RESULT_GRADIENTS[i % RESULT_GRADIENTS.length],
      icon: ['👗', '👘', '🥻', '👙', '🩱', '👚', '👕', '🥼'][i % 8],
    });
  }

  // Render results and go to step 6
  renderResults();
  changeStep(6);
  showToast(`${count}장의 이미지가 생성되었습니다! 🎉`, 'success');
}

// ── Step 6: Results ──
function renderResults() {
  const grid = document.getElementById('resultsGrid');
  if (!grid) return;

  grid.innerHTML = '';
  AppState.generatedImages.forEach((img, idx) => {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.innerHTML = `
      <div class="result-thumb">
        <div style="width:100%;height:100%;background:${img.gradient};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;">
          <span style="font-size:64px;">${img.icon}</span>
          <span style="color:rgba(255,255,255,0.7);font-size:13px;font-weight:600;">AI 생성 피팅컷 #${idx + 1}</span>
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
    card.addEventListener('click', () => openImageModal(idx));
    grid.appendChild(card);
  });
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

function openImageModal(idx) {
  const img = AppState.generatedImages[idx];
  if (!img) return;

  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImage');
  const modalTitle = document.getElementById('modalImageTitle');

  if (modalImg) {
    // Create a canvas-based placeholder since we don't have real images
    modalImg.style.width = '400px';
    modalImg.style.height = '533px';
    modalImg.style.objectFit = 'cover';
    modalImg.style.borderRadius = '12px';
    modalImg.style.background = img.gradient;
    modalImg.alt = img.title;
    // Use a placeholder image with gradient style
    modalImg.src = '';
    modalImg.style.background = img.gradient;
    modalImg.style.display = 'flex';

    // Temporarily replace with a div showing the gradient
    const previewArea = document.querySelector('.image-modal-preview');
    if (previewArea) {
      previewArea.innerHTML = `
        <div style="width:400px;height:533px;background:${img.gradient};border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;">
          <span style="font-size:80px;">${img.icon}</span>
          <span style="color:rgba(255,255,255,0.8);font-size:16px;font-weight:700;">AI 생성 피팅컷 #${idx + 1}</span>
        </div>
      `;
    }
  }

  if (modalTitle) modalTitle.textContent = img.title;
  openModal('imageModal');
}

function downloadSingle(num) {
  showToast(`피팅컷 #${num} 다운로드를 시작합니다.`, 'success');
}

function downloadAll() {
  showToast(`${AppState.generatedImages.length}장을 ZIP으로 다운로드합니다.`, 'success');
}

function downloadImage() {
  showToast('이미지를 다운로드합니다.', 'success');
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
// SMOOTH SCROLL for anchor links
// ─────────────────────────────────────────────────────────
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (link) {
    e.preventDefault();
    const targetId = link.getAttribute('href').slice(1);
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
});

// ─────────────────────────────────────────────────────────
// LOAD USER FROM LOCAL STORAGE
// ─────────────────────────────────────────────────────────
(function loadUser() {
  try {
    const stored = localStorage.getItem('lookbook_user');
    if (stored) {
      AppState.user = JSON.parse(stored);
    }
  } catch (e) {}
})();

// ─────────────────────────────────────────────────────────
// MISC UI EFFECTS
// ─────────────────────────────────────────────────────────

// Animate stats on scroll (landing page)
function initIntersectionObserver() {
  const statNums = document.querySelectorAll('.hero-stat-num');
  if (!statNums.length) return;

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
}

// Call on load
window.addEventListener('load', () => {
  initIntersectionObserver();
});
