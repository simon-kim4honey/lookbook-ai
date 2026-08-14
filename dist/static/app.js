/* ===================================================
   EZlook - Frontend Logic
   aifashion.co.kr + Atlas Cloud AI 실API 연동
   =================================================== */

// ─────────────────────────────────────────────────────────
// i18n — 다국어 번역 테이블
// ─────────────────────────────────────────────────────────
const I18N = {
  ko: {
    // 공통
    loading: '불러오는 중...',
    error: '오류',
    close: '닫기',
    cancel: '취소',
    confirm: '확인',
    // 인증
    welcome: (name) => `환영합니다, ${name}님! 🎉`,
    loginRequired: '로그인이 필요합니다.',
    loginFailed: '소셜 로그인에 실패했습니다. 다시 시도해주세요.',
    loggingIn: '로그인 중...',
    loginBtn: '로그인',
    loggedOut: '로그아웃 되었습니다.',
    signingUp: '가입 중...',
    signupDone: '가입 완료! 무료 크레딧을 드렸어요 🎁',
    signupBtn: '가입하고 무료 시작 🎁',
    // 크레딧
    creditsLeft: (n) => `${n}크레딧 남음`,
    creditsUnit: (n) => `${n.toLocaleString()} 크레딧`,
    creditShort: (n) => `${n.toLocaleString()}`,
    creditInsufficient: (need, have) => `크레딧이 부족합니다. 필요: ${need}크레딧 / 보유: ${have}크레딧`,
    creditInsufficientDetail: (have) => `크레딧이 부족합니다. (보유: ${have}크레딧 / 필요: 90크레딧) 대시보드에서 충전해 주세요.`,
    creditDeductDone: (remain) => `다운로드 완료! (90크레딧 차감, 잔액: ${remain}크레딧)`,
    creditRedownloadDone: '재다운로드 완료! (크레딧 차감 없음)',
    creditError: '크레딧 처리 중 오류가 발생했습니다.',
    creditLackPartial: (n, have) => `크레딧 부족으로 ${n}장만 다운로드했습니다. (보유: ${have}크레딧 / 필요: 90크레딧)`,
    creditErrNum: (n) => `${n}번 이미지 크레딧 처리 오류`,
    selectPackage: '패키지를 선택하세요',
    // 업로드
    uploadFormatErr: 'JPG, PNG, WEBP 형식만 지원합니다.',
    uploadSizeErr: '파일 크기는 10MB 이하여야 합니다.',
    uploadDone: (label) => `${label} 업로드 완료`,
    uploadHint: '상의·하의·전체(원피스/세트) 중 하나 이상 업로드해주세요.',
    notClothingErr: (cat) => {
      const label = { TOP: '상의', BOTTOM: '하의', DRESS: '전체' }[cat] || '의류';
      return `장난치지 마세요. ${label} 상품 사진을 업로드해주세요.`;
    },
    slotLockedErr: (cat) => {
      return cat === 'DRESS'
        ? '상의/하의를 이미 업로드해서 전체는 사용할 수 없어요. 전체를 쓰려면 상의/하의를 먼저 삭제해주세요.'
        : '전체를 이미 업로드해서 상의/하의는 사용할 수 없어요. 상의/하의를 쓰려면 전체를 먼저 삭제해주세요.';
    },
    slotLockedHint: (cat) => cat === 'DRESS' ? '상의/하의 업로드 시 사용 불가' : '전체 업로드 시 사용 불가',
    validatingClothing: '이미지 확인 중...',
    genAnalysisErr: '이미지 분석 오류입니다. 상품을 다시 업로드해주세요.',
    // 모델/배경
    noModels: '<div style="font-size:40px;margin-bottom:12px">👤</div><p style="font-weight:700">등록된 모델이 없습니다</p><p style="font-size:12px;margin-top:4px">관리자 페이지에서 모델을 등록해주세요</p>',
    modelLoadFail: '<div style="padding:40px;text-align:center;color:var(--text-muted)"><div style="font-size:48px;margin-bottom:16px">⚠️</div><p style="font-weight:700;font-size:16px;margin-bottom:6px">모델 목록 로딩 실패</p><p style="font-size:13px">잠시 후 다시 시도해주세요</p></div>',
    noBgs: '<div style="padding:40px;text-align:center;color:var(--text-muted)"><div style="font-size:48px;margin-bottom:16px">🖼️</div><p style="font-weight:700;font-size:16px;margin-bottom:6px">등록된 배경이 없습니다</p><p style="font-size:13px">관리자 페이지에서 배경을 먼저 등록해주세요</p></div>',
    bgLoadFail: '<div style="padding:40px;text-align:center;color:var(--text-muted)"><div style="font-size:48px;margin-bottom:16px">⚠️</div><p style="font-weight:700;font-size:16px;margin-bottom:6px">배경 목록 로딩 실패</p><p style="font-size:13px">잠시 후 다시 시도해주세요</p></div>',
    skipCard: '선택 없음<br>(랜덤)',
    randomModel: (name) => `랜덤 모델이 선택됐습니다: ${name}`,
    randomBg: (name) => `랜덤 배경이 선택됐습니다: ${name}`,
    randomAssigned: '랜덤 자동 배정',
    // 생성
    generating: '준비 중...',
    genStart: '<i class="fas fa-wand-magic-sparkles"></i> AI 생성 시작',
    genError: (msg) => `생성 중 오류: ${msg}`,
    genDoneDemo: '이미지 분석 오류, 상품 업로드를 다시해주세요.',
    genDone: (n) => `${n}장의 실사 AI 이미지가 생성되었습니다! 🎉`,
    genStyleHint: '스타일샷 세트를 추가 생성하려면 아래 버튼을 클릭하세요.',
    fitLabel: (n) => `피팅컷 (${n})`,
    regenBtn: '재생성',
    regenIng: '<span class="btn-spinner" style="width:14px;height:14px;border-width:2px;"></span> 재생성 중...',
    regenLimitErr: '재생성 한도가 초과하였습니다. 다른 옷으로 시도해주세요.',
    regenNoInfo: '재생성할 이미지 정보가 없습니다.',
    regenFail: (msg) => msg || '재생성 요청 실패',
    regenNoJobId: '재생성 요청 실패: Job ID 없음',
    regenStart: (n, max) => `재생성 시작! (${n}/${max})`,
    regenErr: (msg) => `재생성 오류: ${msg}`,
    // 다운로드
    downloadStart: (n) => `피팅컷 #${n} 다운로드를 시작합니다.`,
    downloadNoImg: '다운로드할 이미지가 없습니다.',
    downloadImgNotFound: '이미지를 찾을 수 없습니다.',
    downloadMultiStart: (n) => `${n}장 다운로드를 시작합니다. 이미지당 90크레딧이 차감됩니다.`,
    downloadDone: (n) => `${n}장 다운로드 완료!`,
    downloadErr: '다운로드 중 오류가 발생했습니다.',
    downloadIng: '<i class="fas fa-spinner fa-spin"></i> 처리 중...',
    downloadBtn: '<i class="fas fa-download"></i> 다운로드',
    downloadSingle: '이미지를 다운로드합니다.',
    // 즐겨찾기
    favAdd: '즐겨찾기에 추가되었습니다.',
    favRemove: '즐겨찾기에서 제거되었습니다.',
    favIcon: (isFav) => isFav ? '❤️' : '🤍',
    // 결제
    payFail: (msg) => msg || '결제 중 오류가 발생했습니다.',
    paySelectPkg: '패키지를 선택해주세요.',
    // 프로젝트
    projectDownload: '이미지를 다운로드합니다.',
    projectOpen: (name) => `"${name}" 프로젝트를 엽니다.`,
  },
  en: {
    loading: 'Loading...',
    error: 'Error',
    close: 'Close',
    cancel: 'Cancel',
    confirm: 'OK',
    welcome: (name) => `Welcome, ${name}! 🎉`,
    loginRequired: 'Login required.',
    loginFailed: 'Social login failed. Please try again.',
    loggingIn: 'Signing in...',
    loginBtn: 'Sign In',
    loggedOut: 'You have been logged out.',
    signingUp: 'Creating account...',
    signupDone: 'Account created! Free credits added 🎁',
    signupBtn: 'Start Free 🎁',
    creditsLeft: (n) => `${n} credits left`,
    creditsUnit: (n) => `${n.toLocaleString()} credits`,
    creditShort: (n) => `${n.toLocaleString()}`,
    creditInsufficient: (need, have) => `Insufficient credits. Need: ${need} / Have: ${have}`,
    creditInsufficientDetail: (have) => `Insufficient credits. (Have: ${have} / Need: 90) Please top up on the dashboard.`,
    creditDeductDone: (remain) => `Download complete! (90 credits used, balance: ${remain})`,
    creditRedownloadDone: 'Re-download complete! (no credits charged)',
    creditError: 'An error occurred while processing credits.',
    creditLackPartial: (n, have) => `Only ${n} image(s) downloaded due to insufficient credits. (Have: ${have} / Need: 90)`,
    creditErrNum: (n) => `Credit processing error for image #${n}`,
    selectPackage: 'Select a package',
    uploadFormatErr: 'Only JPG, PNG, WEBP formats are supported.',
    uploadSizeErr: 'File size must be 10MB or less.',
    uploadDone: (label) => `${label} uploaded`,
    uploadHint: 'Please upload at least one of: top, bottom, or full outfit.',
    notClothingErr: (cat) => {
      const label = { TOP: 'top', BOTTOM: 'bottom', DRESS: 'full outfit' }[cat] || 'clothing';
      return `Nice try. Please upload an actual ${label} product photo.`;
    },
    slotLockedErr: (cat) => {
      return cat === 'DRESS'
        ? "You've already uploaded a top/bottom, so full outfit is unavailable. Remove the top/bottom first to use this slot."
        : "You've already uploaded a full outfit, so top/bottom are unavailable. Remove the full outfit first to use this slot.";
    },
    slotLockedHint: (cat) => cat === 'DRESS' ? 'Unavailable while top/bottom is uploaded' : 'Unavailable while full outfit is uploaded',
    validatingClothing: 'Checking image...',
    genAnalysisErr: 'Image analysis error. Please re-upload your product photo.',
    noModels: '<div style="font-size:40px;margin-bottom:12px">👤</div><p style="font-weight:700">No models registered</p><p style="font-size:12px;margin-top:4px">Please register models in the admin page</p>',
    modelLoadFail: '<div style="padding:40px;text-align:center;color:var(--text-muted)"><div style="font-size:48px;margin-bottom:16px">⚠️</div><p style="font-weight:700;font-size:16px;margin-bottom:6px">Failed to load models</p><p style="font-size:13px">Please try again later</p></div>',
    noBgs: '<div style="padding:40px;text-align:center;color:var(--text-muted)"><div style="font-size:48px;margin-bottom:16px">🖼️</div><p style="font-weight:700;font-size:16px;margin-bottom:6px">No backgrounds registered</p><p style="font-size:13px">Please add backgrounds in the admin page</p></div>',
    bgLoadFail: '<div style="padding:40px;text-align:center;color:var(--text-muted)"><div style="font-size:48px;margin-bottom:16px">⚠️</div><p style="font-weight:700;font-size:16px;margin-bottom:6px">Failed to load backgrounds</p><p style="font-size:13px">Please try again later</p></div>',
    skipCard: 'No selection<br>(Random)',
    randomModel: (name) => `Random model selected: ${name}`,
    randomBg: (name) => `Random background selected: ${name}`,
    randomAssigned: 'Randomly assigned',
    generating: 'Preparing...',
    genStart: '<i class="fas fa-wand-magic-sparkles"></i> Start AI Generation',
    genError: (msg) => `Generation error: ${msg}`,
    genDoneDemo: 'Image analysis error. Please re-upload your product photo.',
    genDone: (n) => `${n} AI image(s) generated! 🎉`,
    genStyleHint: 'Click the button below to generate additional style shots.',
    fitLabel: (n) => `Fitting Shots (${n})`,
    regenBtn: 'Regenerate',
    regenIng: '<span class="btn-spinner" style="width:14px;height:14px;border-width:2px;"></span> Regenerating...',
    regenLimitErr: 'Regeneration limit reached. Please try different clothes.',
    regenNoInfo: 'No image info available for regeneration.',
    regenFail: (msg) => msg || 'Regeneration request failed',
    regenNoJobId: 'Regeneration failed: No Job ID',
    regenStart: (n, max) => `Regenerating! (${n}/${max})`,
    regenErr: (msg) => `Regeneration error: ${msg}`,
    downloadStart: (n) => `Starting download of fitting shot #${n}.`,
    downloadNoImg: 'No images to download.',
    downloadImgNotFound: 'Image not found.',
    downloadMultiStart: (n) => `Starting download of ${n} image(s). 90 credits per image.`,
    downloadDone: (n) => `${n} image(s) downloaded!`,
    downloadErr: 'An error occurred while downloading.',
    downloadIng: '<i class="fas fa-spinner fa-spin"></i> Processing...',
    downloadBtn: '<i class="fas fa-download"></i> Download',
    downloadSingle: 'Downloading image.',
    favAdd: 'Added to favorites.',
    favRemove: 'Removed from favorites.',
    favIcon: (isFav) => isFav ? '❤️' : '🤍',
    payFail: (msg) => msg || 'An error occurred during payment.',
    paySelectPkg: 'Please select a package.',
    projectDownload: 'Downloading images.',
    projectOpen: (name) => `Opening project "${name}".`,
  },
  ja: {
    loading: '読み込み中...',
    error: 'エラー',
    close: '閉じる',
    cancel: 'キャンセル',
    confirm: '確認',
    welcome: (name) => `ようこそ、${name}さん！ 🎉`,
    loginRequired: 'ログインが必要です。',
    loginFailed: 'ソーシャルログインに失敗しました。再試行してください。',
    loggingIn: 'ログイン中...',
    loginBtn: 'ログイン',
    loggedOut: 'ログアウトしました。',
    signingUp: '登録中...',
    signupDone: '登録完了！無料クレジットをプレゼント 🎁',
    signupBtn: '無料で始める 🎁',
    creditsLeft: (n) => `${n}クレジット残り`,
    creditsUnit: (n) => `${n.toLocaleString()}クレジット`,
    creditShort: (n) => `${n.toLocaleString()}`,
    creditInsufficient: (need, have) => `クレジットが不足しています。必要: ${need} / 保有: ${have}`,
    creditInsufficientDetail: (have) => `クレジットが不足しています。(保有: ${have} / 必要: 90) ダッシュボードでチャージしてください。`,
    creditDeductDone: (remain) => `ダウンロード完了！(90クレジット消費、残高: ${remain})`,
    creditRedownloadDone: '再ダウンロード完了！(クレジット消費なし)',
    creditError: 'クレジット処理中にエラーが発生しました。',
    creditLackPartial: (n, have) => `クレジット不足のため${n}枚のみダウンロードしました。(保有: ${have} / 必要: 90)`,
    creditErrNum: (n) => `画像${n}番のクレジット処理エラー`,
    selectPackage: 'パッケージを選択',
    uploadFormatErr: 'JPG、PNG、WEBP形式のみ対応しています。',
    uploadSizeErr: 'ファイルサイズは10MB以下にしてください。',
    uploadDone: (label) => `${label}をアップロードしました`,
    uploadHint: 'トップス・ボトムス・全身のいずれかをアップロードしてください。',
    notClothingErr: (cat) => {
      const label = { TOP: 'トップス', BOTTOM: 'ボトムス', DRESS: 'ワンピース/セット' }[cat] || '衣類';
      return `ふざけないでください。${label}の商品写真をアップロードしてください。`;
    },
    slotLockedErr: (cat) => {
      return cat === 'DRESS'
        ? 'トップス/ボトムスを既にアップロードしているため、ワンピース/セットは使用できません。先にトップス/ボトムスを削除してください。'
        : 'ワンピース/セットを既にアップロードしているため、トップス/ボトムスは使用できません。先にワンピース/セットを削除してください。';
    },
    slotLockedHint: (cat) => cat === 'DRESS' ? 'トップス/ボトムスアップロード時は使用不可' : 'ワンピース/セットアップロード時は使用不可',
    validatingClothing: '画像を確認中...',
    genAnalysisErr: '画像分析エラーです。商品画像を再アップロードしてください。',
    noModels: '<div style="font-size:40px;margin-bottom:12px">👤</div><p style="font-weight:700">モデルが登録されていません</p><p style="font-size:12px;margin-top:4px">管理ページでモデルを登録してください</p>',
    modelLoadFail: '<div style="padding:40px;text-align:center;color:var(--text-muted)"><div style="font-size:48px;margin-bottom:16px">⚠️</div><p style="font-weight:700;font-size:16px;margin-bottom:6px">モデルの読み込みに失敗しました</p><p style="font-size:13px">しばらくしてから再試行してください</p></div>',
    noBgs: '<div style="padding:40px;text-align:center;color:var(--text-muted)"><div style="font-size:48px;margin-bottom:16px">🖼️</div><p style="font-weight:700;font-size:16px;margin-bottom:6px">背景が登録されていません</p><p style="font-size:13px">管理ページで背景を登録してください</p></div>',
    bgLoadFail: '<div style="padding:40px;text-align:center;color:var(--text-muted)"><div style="font-size:48px;margin-bottom:16px">⚠️</div><p style="font-weight:700;font-size:16px;margin-bottom:6px">背景の読み込みに失敗しました</p><p style="font-size:13px">しばらくしてから再試行してください</p></div>',
    skipCard: '選択なし<br>(ランダム)',
    randomModel: (name) => `ランダムモデルが選択されました: ${name}`,
    randomBg: (name) => `ランダム背景が選択されました: ${name}`,
    randomAssigned: 'ランダム自動割り当て',
    generating: '準備中...',
    genStart: '<i class="fas fa-wand-magic-sparkles"></i> AI生成スタート',
    genError: (msg) => `生成エラー: ${msg}`,
    genDoneDemo: '画像解析エラー。商品画像を再アップロードしてください。',
    genDone: (n) => `${n}枚のAI画像が生成されました！ 🎉`,
    genStyleHint: '下のボタンをクリックして追加スタイルショットを生成してください。',
    fitLabel: (n) => `フィッティングショット (${n})`,
    regenBtn: '再生成',
    regenIng: '<span class="btn-spinner" style="width:14px;height:14px;border-width:2px;"></span> 再生成中...',
    regenLimitErr: '再生成の上限に達しました。別の服で試してください。',
    regenNoInfo: '再生成する画像情報がありません。',
    regenFail: (msg) => msg || '再生成リクエスト失敗',
    regenNoJobId: '再生成失敗: Job ID なし',
    regenStart: (n, max) => `再生成スタート！(${n}/${max})`,
    regenErr: (msg) => `再生成エラー: ${msg}`,
    downloadStart: (n) => `フィッティングショット #${n} のダウンロードを開始します。`,
    downloadNoImg: 'ダウンロードする画像がありません。',
    downloadImgNotFound: '画像が見つかりません。',
    downloadMultiStart: (n) => `${n}枚のダウンロードを開始します。1枚あたり90クレジット消費。`,
    downloadDone: (n) => `${n}枚のダウンロード完了！`,
    downloadErr: 'ダウンロード中にエラーが発生しました。',
    downloadIng: '<i class="fas fa-spinner fa-spin"></i> 処理中...',
    downloadBtn: '<i class="fas fa-download"></i> ダウンロード',
    downloadSingle: '画像をダウンロードします。',
    favAdd: 'お気に入りに追加しました。',
    favRemove: 'お気に入りから削除しました。',
    favIcon: (isFav) => isFav ? '❤️' : '🤍',
    payFail: (msg) => msg || '決済中にエラーが発生しました。',
    paySelectPkg: 'パッケージを選択してください。',
    projectDownload: '画像をダウンロードします。',
    projectOpen: (name) => `プロジェクト「${name}」を開きます。`,
  }
};

// t() — 현재 locale의 번역 키 반환
// 값이 함수면 인자 전달, 문자열이면 그대로 반환
let _locale = 'ko'; // 기본값, initLocale()에서 갱신
function t(key, ...args) {
  const dict = I18N[_locale] || I18N['en'];
  const val = dict[key] ?? I18N['en'][key] ?? key;
  return typeof val === 'function' ? val(...args) : val;
}

async function initLocale() {
  try {
    const res = await fetch('/api/locale');
    const data = await res.json();
    _locale = data.locale || 'ko';
  } catch (e) {
    _locale = 'ko';
  }
  // HTML lang 속성 설정
  document.documentElement.lang = _locale;
  // data-i18n 속성 정적 텍스트 교체
  applyStaticI18n();
}

// data-i18n 속성 기반 정적 텍스트 교체
// index.tsx HTML에 data-i18n="key" 지정 시 자동 적용
const STATIC_I18N = {
  // 네비게이션
  'nav-home':        { ko: '홈', en: 'Home', ja: 'ホーム' },
  'nav-studio':      { ko: '스튜디오', en: 'Studio', ja: 'スタジオ' },
  'nav-dashboard':   { ko: '대시보드', en: 'Dashboard', ja: 'ダッシュボード' },
  'nav-login':       { ko: '로그인', en: 'Sign In', ja: 'ログイン' },
  'nav-signup':      { ko: '무료 시작', en: 'Get Started', ja: '無料で始める' },
  'nav-signup2':     { ko: '회원가입', en: 'Sign Up', ja: '会員登録' },
  'nav-logout':      { ko: '로그아웃', en: 'Sign Out', ja: 'ログアウト' },
  'nav-charge':      { ko: '충전', en: 'Top Up', ja: 'チャージ' },
  'nav-history':     { ko: '생성 내역', en: 'History', ja: '生成履歴' },
  // Step 네비게이션 (①상품 업로드 › ②모델 선택 › ③배경선택)
  'stepnav-1':       { ko: '상품 업로드', en: 'Upload Product', ja: '商品アップロード' },
  'stepnav-2':       { ko: '모델 선택', en: 'Select Model', ja: 'モデル選択' },
  'stepnav-3':       { ko: '배경선택', en: 'Select Background', ja: '背景選択' },
  'step1-title':     { ko: '의상 이미지를 업로드하세요', en: 'Upload your clothing images', ja: '服の画像をアップロード' },
  'step2-title':     { ko: 'AI 모델을 선택하세요', en: 'Select an AI model', ja: 'AIモデルを選択してください' },
  'step3-title':     { ko: '배경을 선택하세요', en: 'Select a background', ja: '背景を選択してください' },
  // 버튼
  'btn-prev':        { ko: '이전', en: 'Back', ja: '戻る' },
  'btn-next':        { ko: '다음 단계', en: 'Next', ja: '次へ' },
  'btn-gen':         { ko: 'AI 생성 시작', en: 'Start AI Generation', ja: 'AI生成スタート' },
  'btn-regen':       { ko: '재생성', en: 'Regenerate', ja: '再生成' },
  'btn-download':    { ko: '다운로드', en: 'Download', ja: 'ダウンロード' },
  'btn-download-all':{ ko: '전체 다운로드', en: 'Download All', ja: '全てダウンロード' },
  // 업로드 슬롯
  'slot-top':        { ko: '상의', en: 'Top', ja: 'トップス' },
  'slot-bottom':     { ko: '하의', en: 'Bottom', ja: 'ボトムス' },
  'slot-full':       { ko: '전체(원피스/세트)', en: 'Full Outfit', ja: '全身(ワンピース/セット)' },
  'slot-hint':       { ko: '이미지를 드래그하거나 클릭하여 업로드', en: 'Drag & drop or click to upload', ja: 'ドラッグ＆ドロップまたはクリックしてアップロード' },
  // 생성 화면
  'gen-loading':     { ko: '모델 불러오는 중...', en: 'Loading models...', ja: 'モデルを読み込み中...' },
  'bg-loading':      { ko: '배경 불러오는 중...', en: 'Loading backgrounds...', ja: '背景を読み込み中...' },
  'gen-status-init': { ko: '시작 중...', en: 'Starting...', ja: '開始中...' },
  // 결제 패널
  'charge-title':    { ko: '크레딧 충전', en: 'Top Up Credits', ja: 'クレジットチャージ' },
  'charge-current':  { ko: '현재 보유 크레딧', en: 'Current Credits', ja: '現在のクレジット' },
  'pkg-popular':     { ko: '인기', en: 'Popular', ja: '人気' },
  'pkg-btn':         { ko: '패키지를 선택하세요', en: 'Select a package', ja: 'パッケージを選択' },
  'pkg-11':          { ko: '이미지 <strong style="color:#a78bfa;">11장</strong> 다운로드 가능', en: 'Download up to <strong style="color:#a78bfa;">11 images</strong>', ja: '<strong style="color:#a78bfa;">11枚</strong>ダウンロード可能' },
  'pkg-25':          { ko: '이미지 <strong style="color:#a78bfa;">25장</strong> 다운로드 가능', en: 'Download up to <strong style="color:#a78bfa;">25 images</strong>', ja: '<strong style="color:#a78bfa;">25枚</strong>ダウンロード可能' },
  'pkg-44':          { ko: '이미지 <strong style="color:#a78bfa;">44장</strong> 다운로드 가능', en: 'Download up to <strong style="color:#a78bfa;">44 images</strong>', ja: '<strong style="color:#a78bfa;">44枚</strong>ダウンロード可能' },
  'pkg-bonus15':     { ko: '✨ 기본 대비 15% 더 받기', en: '✨ 15% more than basic', ja: '✨ 基本より15%お得' },
  'pkg-bonus33':     { ko: '🚀 기본 대비 33% 더 받기', en: '🚀 33% more than basic', ja: '🚀 基本より33%お得' },
  // 로그인/회원가입
  'login-title':     { ko: '로그인', en: 'Sign In', ja: 'ログイン' },
  'signup-title':    { ko: '회원가입', en: 'Create Account', ja: 'アカウント作成' },
  'signupBtn':       { ko: '가입하고 무료 시작 🎁', en: 'Sign Up Free 🎁', ja: '無料で登録 🎁' },
  'agree-all':       { ko: '전체 동의', en: 'Agree to All', ja: '全て同意' },
  'agree-privacy':   { ko: '개인정보처리방침 동의 (필수)', en: 'Privacy Policy (Required)', ja: 'プライバシーポリシーに同意 (必須)' },
  'agree-marketing': { ko: '프로모션 이메일 수신 동의 (선택)', en: 'Marketing Emails (Optional)', ja: 'プロモーションメール受信 (任意)' },
  // 대시보드
  'dash-title':      { ko: '대시보드', en: 'Dashboard', ja: 'ダッシュボード' },
  'dash-credits':    { ko: '보유 크레딧', en: 'Your Credits', ja: '保有クレジット' },
  'dash-history':    { ko: '생성 내역', en: 'Generation History', ja: '生成履歴' },
  'dash-no-history': { ko: '생성 내역이 없습니다', en: 'No generation history', ja: '生成履歴がありません' },
};

function applyStaticI18n() {
  const lang = _locale;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const map = STATIC_I18N[key];
    if (!map) return;
    const text = map[lang] || map['en'] || '';
    // placeholder 속성인지 체크
    if (el.hasAttribute('placeholder')) {
      el.setAttribute('placeholder', text);
    } else {
      el.innerHTML = text;
    }
  });
}

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
  lastJobId: null,        // 이미지 URL 저장용 (save-images API)
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
  initLocale().then(() => initPage());
});

function initPage() {
  const path = window.location.pathname;
  initNavbar();
  // 모바일 OAuth 리다이렉트 콜백 결과 먼저 처리
  checkOAuthRedirectResult();
  // 모든 페이지에서 세션 복원 (자동 로그인)
  verifySession().then(() => {
    if (path === '/' || path === '') {
      // Landing — verifySession 후 UI만 업데이트됨
      initHomeShowcase();
      initHomeFeatureBgs();
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
// 홈페이지 히어로 쇼케이스 캐러셀 (관리자 업로드 이미지 자동 롤링)
// ─────────────────────────────────────────────────────────
async function initHomeShowcase() {
  const wrap = document.getElementById('heroShowcase');
  const img = document.getElementById('heroShowcaseImg');
  const placeholder = document.getElementById('heroShowcasePlaceholder');
  if (!wrap || !img) return;
  try {
    const res = await fetch('/api/home/showcase');
    const data = await res.json();
    const images = (data.images || []).map(i => i.imageBase64);
    if (!images.length) return; // 등록된 이미지 없으면 플레이스홀더 유지
    let idx = 0;
    const show = (i) => {
      img.style.opacity = '0';
      setTimeout(() => {
        img.src = images[i];
        img.style.opacity = '1';
      }, 300);
    };
    img.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
    img.src = images[0];
    if (images.length > 1) {
      setInterval(() => {
        idx = (idx + 1) % images.length;
        show(idx);
      }, 4000);
    }
  } catch (e) {
    console.warn('히어로 쇼케이스 로딩 실패:', e);
  }
}

// ─────────────────────────────────────────────────────────
// 홈페이지 기능 소개 박스 배경 이미지 (관리자 업로드, 슬롯별 1장)
// ─────────────────────────────────────────────────────────
async function initHomeFeatureBgs() {
  const cards = document.querySelectorAll('#features .feature-card[data-feature-slot]');
  if (!cards.length) return;
  try {
    const res = await fetch('/api/home/feature-bgs');
    const data = await res.json();
    const bgs = data.backgrounds || {};
    cards.forEach(card => {
      const slot = card.getAttribute('data-feature-slot');
      const bg = bgs[slot];
      if (bg) {
        card.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.55),rgba(0,0,0,0.55)), url(${bg})`;
        card.style.backgroundSize = 'cover';
        card.style.backgroundPosition = 'center';
        card.classList.add('feature-card--has-bg');
      }
    });
  } catch (e) {
    console.warn('기능 박스 배경 로딩 실패:', e);
  }
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
    <button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;font-size:18px;padding:0;margin-left:8px;">×</button>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(100%)';
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

// ─────────────────────────────────────────────────────────
// ACTION PROGRESS MODAL (다운로드 / 재생성 진행 + 완료 팝업)
// ─────────────────────────────────────────────────────────
let _shareCtx = { jobId: null, idx: null, imageUrl: null };
let _kakaoJsKey = null;

function openActionProgress(text) {
  const spinner = document.getElementById('actionProgressSpinner');
  const check = document.getElementById('actionProgressCheck');
  const textEl = document.getElementById('actionProgressText');
  const share = document.getElementById('actionProgressShare');
  const closeBtn = document.getElementById('actionProgressCloseBtn');
  if (spinner) spinner.style.display = '';
  if (check) check.style.display = 'none';
  if (textEl) textEl.textContent = text;
  if (share) share.style.display = 'none';
  if (closeBtn) closeBtn.style.display = 'none';
  openModal('actionProgressModal');
}

function setActionComplete(text, opts) {
  opts = opts || {};
  const spinner = document.getElementById('actionProgressSpinner');
  const check = document.getElementById('actionProgressCheck');
  const textEl = document.getElementById('actionProgressText');
  const share = document.getElementById('actionProgressShare');
  const closeBtn = document.getElementById('actionProgressCloseBtn');
  const kakaoBtn = document.getElementById('actionProgressKakaoBtn');
  if (spinner) spinner.style.display = 'none';
  if (check) check.style.display = 'flex';
  if (textEl) textEl.textContent = text;
  if (closeBtn) closeBtn.style.display = '';
  if (opts.showShare && opts.jobId && opts.idx != null && opts.idx >= 0) {
    _shareCtx = { jobId: opts.jobId, idx: opts.idx, imageUrl: opts.imageUrl || '' };
    if (share) share.style.display = 'flex';
    if (kakaoBtn) kakaoBtn.style.display = _kakaoJsKey ? '' : 'none';
  } else if (share) {
    share.style.display = 'none';
  }
}

function closeActionProgress() {
  closeModal('actionProgressModal');
}

function _shareUrlFor(jobId, idx) {
  return `${location.origin}/share/${jobId}/${idx}`;
}

// 생성 이미지 배열 내 idx → 실제 저장된 image_urls 배열 내 인덱스로 변환
function getShareIndex(idx) {
  const img = AppState.generatedImages[idx];
  if (!img || !img.originalUrl) return -1;
  const realOnly = AppState.generatedImages.filter(im => im.originalUrl);
  return realOnly.indexOf(img);
}

function copyShareLink() {
  if (!_shareCtx.jobId || _shareCtx.idx == null || _shareCtx.idx < 0) {
    showToast('공유 가능한 이미지가 없습니다.', 'error');
    return;
  }
  const url = _shareUrlFor(_shareCtx.jobId, _shareCtx.idx);
  const done = () => showToast('공유 링크가 복사되었습니다. (14일간 유효)', 'success');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(done).catch(() => _fallbackCopy(url, done));
  } else {
    _fallbackCopy(url, done);
  }
}

function _fallbackCopy(text, onDone) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    onDone();
  } catch (e) {
    showToast('링크 복사에 실패했습니다.', 'error');
  }
  document.body.removeChild(ta);
}

// ─── 카카오톡 공유 SDK 로드 (JS 키가 설정된 경우에만) ───
(function loadKakaoConfig() {
  fetch('/api/config/kakao-js-key').then(r => r.json()).then(d => {
    if (d && d.key) {
      _kakaoJsKey = d.key;
      const s = document.createElement('script');
      s.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
      s.onload = () => {
        if (window.Kakao && !Kakao.isInitialized()) Kakao.init(_kakaoJsKey);
      };
      document.head.appendChild(s);
    }
  }).catch(() => {});
})();

function shareToKakao() {
  if (!window.Kakao || !Kakao.isInitialized()) {
    showToast('카카오톡 공유 기능을 사용할 수 없습니다.', 'error');
    return;
  }
  if (!_shareCtx.jobId || _shareCtx.idx == null || _shareCtx.idx < 0) {
    showToast('공유 가능한 이미지가 없습니다.', 'error');
    return;
  }
  const shareUrl = _shareUrlFor(_shareCtx.jobId, _shareCtx.idx);
  Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: '상품 이미지로 모델컷 만들기',
      description: '클릭4번으로 AI모델컷이 무료로 만들어 진다고?',
      imageUrl: _shareCtx.imageUrl,
      link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
    },
    buttons: [
      { title: '나도 해보기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } },
    ],
  });
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

  // 탭 전환 시 에러 메시지 초기화
  clearAuthError('loginError');
  clearAuthError('signupError');

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

/** 모바일 여부 감지 */
function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (typeof window.orientation !== 'undefined');
}

/** OAuth 소셜 로그인 — 모바일: 리다이렉트 / PC: 팝업 */
// 진행 중인 위저드 상태(의류/모델/배경/옵션)를 직렬화 — 로그인 후 생성 재개용
function _captureGenState() {
  return {
    clothingItems: (AppState.clothingItems || []).map(ci => ({
      dataUrl: ci.dataUrl, category: ci.category, label: ci.label || '',
    })),
    uploadedImageUrl: AppState.uploadedImageUrl || null,
    selectedModel: AppState.selectedModel || null,
    selectedBg: AppState.selectedBg || null,
    genOptions: AppState.genOptions || null,
  };
}

function _restoreGenState(genState) {
  if (!genState) return;
  if (genState.clothingItems) AppState.clothingItems = genState.clothingItems;
  if (genState.uploadedImageUrl) AppState.uploadedImageUrl = genState.uploadedImageUrl;
  if (genState.selectedModel) AppState.selectedModel = genState.selectedModel;
  if (genState.selectedBg) AppState.selectedBg = genState.selectedBg;
  if (genState.genOptions) AppState.genOptions = genState.genOptions;
  changeStep(3);
  updateGenSummary();
}

// 로그인 모달의 카카오/구글 버튼 전체 — 클릭 즉시 로딩 상태로 전환
function _setAuthButtonsBusy(busy, activeBtn) {
  const buttons = document.querySelectorAll('#loginModal button[onclick^="oauthLogin"]');
  buttons.forEach(b => {
    if (busy) {
      if (!b.dataset.originalHtml) b.dataset.originalHtml = b.innerHTML;
      b.disabled = true;
      if (b === activeBtn) {
        b.innerHTML = '<span class="btn-spinner" style="width:16px;height:16px;border-width:2px;"></span> 이동 중...';
      } else {
        b.style.opacity = '0.5';
      }
    } else {
      b.disabled = false;
      b.style.opacity = '';
      if (b.dataset.originalHtml) {
        b.innerHTML = b.dataset.originalHtml;
        delete b.dataset.originalHtml;
      }
    }
  });
}

function oauthLogin(provider, btn) {
  // 이전 oauth_result 잔여 데이터 제거
  localStorage.removeItem('oauth_result');
  // 클릭 즉시 반응 피드백 (버튼 로딩 상태)
  _setAuthButtonsBusy(true, btn);

  if (isMobileDevice()) {
    // ── 모바일: 현재 탭에서 OAuth 제공자로 이동 (팝업 차단 우회) ──
    // 콜백 복귀 후 처리할 정보 저장
    const pending = {
      provider,
      returnPath: window.location.pathname,
      pendingGeneration: AppState.pendingGeneration || false,
      ts: Date.now(),
    };
    if (AppState.pendingGeneration) {
      pending.genState = _captureGenState();
    }
    try {
      localStorage.setItem('oauth_redirect_pending', JSON.stringify(pending));
    } catch (e) {
      // 저장 용량 초과 등 — genState 없이라도 기본 정보는 저장 시도
      console.warn('oauth_redirect_pending 저장 실패, genState 제외 후 재시도:', e);
      delete pending.genState;
      try { localStorage.setItem('oauth_redirect_pending', JSON.stringify(pending)); } catch (e2) {}
    }
    window.location.href = `/api/auth/${provider}?mode=redirect`;
    return;
  }

  // ── PC: 팝업 방식 유지 ──
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
    _setAuthButtonsBusy(false);
    updateUserUI();
    closeModal('loginModal');
    showToast(t('welcome', user.name), 'success');
    if (AppState.pendingGeneration) {
      AppState.pendingGeneration = false;
      setTimeout(() => startGeneration(), 300);
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
      _setAuthButtonsBusy(false);
      showToast(t('loginFailed'), 'error');
    }
  };

  window.addEventListener('message', onMessage);

  // 팝업이 닫힌 경우 — localStorage 폴백 체크 (postMessage 실패 대비)
  const checkClosed = setInterval(() => {
    if (popup && popup.closed) {
      clearInterval(checkClosed);
      window.removeEventListener('message', onMessage);
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
      // 성공 데이터 없이 팝업만 닫힘 — 사용자가 취소한 것으로 간주하고 버튼 복원
      _setAuthButtonsBusy(false);
    }
  }, 500);
}

/** 모바일 OAuth 리다이렉트 콜백 복귀 처리 */
function checkOAuthRedirectResult() {
  // URL에 oauth_error 파라미터가 있으면 오류 토스트 표시
  const urlParams = new URLSearchParams(window.location.search);
  const oauthError = urlParams.get('oauth_error');
  if (oauthError) {
    // URL에서 파라미터 제거 (히스토리 정리)
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    localStorage.removeItem('oauth_redirect_pending');
    showToast(t('loginFailed'), 'error');
    return;
  }

  try {
    const pendingStr = localStorage.getItem('oauth_redirect_pending');
    const resultStr  = localStorage.getItem('oauth_result');
    if (!pendingStr || !resultStr) return;

    const pending = JSON.parse(pendingStr);
    const data    = JSON.parse(resultStr);

    // 5분 이상 지난 데이터는 무효
    if (Date.now() - (pending.ts || 0) > 5 * 60 * 1000) {
      localStorage.removeItem('oauth_redirect_pending');
      localStorage.removeItem('oauth_result');
      return;
    }

    localStorage.removeItem('oauth_redirect_pending');
    localStorage.removeItem('oauth_result');

    if (data?.type === 'oauth_success') {
      const { token, user } = data;
      AppState.user = user;
      localStorage.setItem('lookbook_token', token);
      localStorage.setItem('lookbook_user', JSON.stringify(user));
      updateUserUI();
      showToast(t('welcome', user.name), 'success');
      if (pending.pendingGeneration) {
        AppState.pendingGeneration = false;
        // 전체 페이지 리다이렉트로 날아간 의류/모델/배경 선택 상태 복원 후 생성 재개
        _restoreGenState(pending.genState);
        setTimeout(() => startGeneration(), 300);
      }
    } else if (data?.type === 'oauth_error') {
      showToast(t('loginFailed'), 'error');
    }
  } catch(e) {
    localStorage.removeItem('oauth_redirect_pending');
    localStorage.removeItem('oauth_result');
  }
}

/** 이메일 로그인 */
/** 모달 내 에러 박스 표시/숨김 헬퍼 */
function showAuthError(boxId, textId, msg) {
  const box  = document.getElementById(boxId);
  const text = document.getElementById(textId);
  if (!box || !text) {
    // fallback: 에러 박스를 찾지 못하면 alert으로 표시
    alert(msg);
    return;
  }
  text.textContent = msg;
  // className 방식 대신 style.display로 직접 제어 (모바일 호환성 향상)
  box.style.display = 'flex';
  box.style.opacity = '1';
  // 스크롤로 에러 박스가 보이도록
  try { box.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch(e) {}
}
function clearAuthError(boxId) {
  const box = document.getElementById(boxId);
  if (box) box.style.display = 'none';
}

async function handleLogin(e) {
  e.preventDefault();
  const emailEl    = document.getElementById('loginEmail');
  const passwordEl = document.getElementById('loginPassword');
  const email      = emailEl ? emailEl.value.trim() : '';
  const password   = passwordEl ? passwordEl.value : '';
  const btn        = document.getElementById('loginBtn');

  // 클라이언트 유효성 검사
  if (!email) {
    showAuthError('loginError', 'loginErrorText', '이메일을 입력해주세요.');
    if (emailEl) emailEl.focus();
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showAuthError('loginError', 'loginErrorText', '올바른 이메일 주소를 입력해주세요.');
    if (emailEl) emailEl.focus();
    return;
  }
  if (!password) {
    showAuthError('loginError', 'loginErrorText', '비밀번호를 입력해주세요.');
    if (passwordEl) passwordEl.focus();
    return;
  }

  clearAuthError('loginError');
  btn.innerHTML = '<span class="btn-spinner"></span> ' + t('loggingIn');
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
      showToast(t('welcome', data.user.name), 'success');
      // 로그인 후 생성 재개
      if (AppState.pendingGeneration) {
        AppState.pendingGeneration = false;
        setTimeout(() => startGeneration(), 300);
      }
    } else {
      // 서버 오류 메시지를 모달 안에 표시
      const msg = data.message || '이메일 또는 비밀번호가 올바르지 않습니다.';
      showAuthError('loginError', 'loginErrorText', msg);
      // 비밀번호 오류면 비밀번호 필드 포커스
      if (res.status === 401 && passwordEl) {
        passwordEl.select();
        passwordEl.focus();
      }
    }
  } catch (err) {
    showAuthError('loginError', 'loginErrorText', '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  } finally {
    btn.innerHTML = t('loginBtn');
    btn.disabled = false;
  }
}

/** 전체 동의 토글 */
function toggleAgreeAll(e) {
  // label 클릭 → checkbox 자동 toggle 이후 syncAgreeAll 호출
  // label 내부의 checkbox 직접 클릭 시 중복 toggle 방지
  const allChk = document.getElementById('agreeAll');
  if (!allChk) return;
  // setTimeout으로 checkbox 상태가 바뀐 뒤에 처리
  setTimeout(() => {
    const checked = allChk.checked;
    const privacy   = document.getElementById('agreePrivacy');
    const marketing = document.getElementById('agreeMarketing');
    if (privacy)   privacy.checked   = checked;
    if (marketing) marketing.checked = checked;
  }, 0);
}

/** 개별 체크박스 변경 시 전체 동의 체크 상태 동기화 */
function syncAgreeAll() {
  const privacy   = document.getElementById('agreePrivacy');
  const marketing = document.getElementById('agreeMarketing');
  const allChk    = document.getElementById('agreeAll');
  if (!allChk) return;
  const allChecked = (!privacy || privacy.checked) && (!marketing || marketing.checked);
  allChk.checked = allChecked;
}

/** 이메일 회원가입 */
async function handleSignup(e) {
  e.preventDefault();
  const nameEl          = document.getElementById('signupName');
  const emailEl         = document.getElementById('signupEmail');
  const passwordEl      = document.getElementById('signupPassword');
  const agreePrivacyEl  = document.getElementById('agreePrivacy');
  const agreeMarketingEl= document.getElementById('agreeMarketing');
  const name            = nameEl     ? nameEl.value.trim()     : '';
  const email           = emailEl    ? emailEl.value.trim()    : '';
  const password        = passwordEl ? passwordEl.value        : '';
  const agreePrivacy    = agreePrivacyEl  ? agreePrivacyEl.checked  : false;
  const agreeMarketing  = agreeMarketingEl? agreeMarketingEl.checked : false;
  const btn             = document.getElementById('signupBtn');

  // 클라이언트 유효성 검사
  if (!name) {
    showAuthError('signupError', 'signupErrorText', '이름을 입력해주세요.');
    if (nameEl) nameEl.focus();
    return;
  }
  if (!email) {
    showAuthError('signupError', 'signupErrorText', '이메일을 입력해주세요.');
    if (emailEl) emailEl.focus();
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showAuthError('signupError', 'signupErrorText', '올바른 이메일 주소 형식이 아닙니다. (예: example@email.com)');
    if (emailEl) emailEl.focus();
    return;
  }
  if (password.length < 8) {
    showAuthError('signupError', 'signupErrorText', '비밀번호는 8자 이상이어야 합니다.');
    if (passwordEl) passwordEl.focus();
    return;
  }
  // 개인정보 동의는 필수
  if (!agreePrivacy) {
    showAuthError('signupError', 'signupErrorText', '개인정보 수집 및 이용에 동의해주세요. (필수)');
    if (agreePrivacyEl) agreePrivacyEl.focus();
    return;
  }

  clearAuthError('signupError');
  btn.innerHTML = '<span class="btn-spinner"></span> ' + t('signingUp');
  btn.disabled = true;

  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, agreeMarketing })
    });
    const data = await res.json();

    if (data.success) {
      AppState.user = data.user;
      localStorage.setItem('lookbook_token', data.token);
      localStorage.setItem('lookbook_user', JSON.stringify(data.user));
      updateUserUI();
      closeModal('loginModal');
      showToast(t('signupDone'), 'success');
      // 가입 후 생성 재개
      if (AppState.pendingGeneration) {
        AppState.pendingGeneration = false;
        setTimeout(() => startGeneration(), 300);
      }
    } else {
      // 서버 오류 메시지를 모달 안에 표시
      const msg = data.message || '가입에 실패했습니다. 다시 시도해주세요.';
      showAuthError('signupError', 'signupErrorText', msg);
      // 중복 이메일이면 이메일 필드 포커스
      if (res.status === 409 && emailEl) {
        emailEl.select();
        emailEl.focus();
      }
    }
  } catch (err) {
    showAuthError('signupError', 'signupErrorText', '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  } finally {
    btn.innerHTML = t('signupBtn');
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
  showToast(t('loggedOut'), 'info');
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
    if (ddCredits) ddCredits.textContent = t('creditsLeft', user.credits ?? 0);

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
          `<button class="project-action-btn" onclick="showToast(t('downloadSingle'), 'success'); event.stopPropagation();">다운로드</button>
           <button class="project-action-btn primary" onclick="window.location.href='/generator'; event.stopPropagation();">재생성</button>` :
          p.status === 'processing' ?
          `<button class="project-action-btn" disabled>생성중...</button>
           <button class="project-action-btn primary" onclick="event.stopPropagation();">결과 보기</button>` :
          `<button class="project-action-btn primary" onclick="window.location.href='/generator'; event.stopPropagation();">계속 작업</button>`
        }
      </div>
    `;
    card.addEventListener('click', () => showToast(t('projectOpen', p.name), 'info'));
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

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 앞 FRONT_RESERVE자리는 남성 모델 제외(여성 선호 사용자가 다수라 초반 이탈 방지),
// 그 다음 자리부터는 (남은 여성 + 전체 남성)을 완전 랜덤으로 섞음 — 남성도 너무
// 뒤로 밀리지 않고 5번째 자리부터는 자연스럽게 랜덤 등장.
function shuffleModelsGenderFrontReserve(models) {
  const FRONT_RESERVE = 4
  const male = models.filter(m => m.gender === '남성')
  const rest = shuffleArray(models.filter(m => m.gender !== '남성'))
  const front = rest.slice(0, FRONT_RESERVE)
  const remaining = shuffleArray([...rest.slice(FRONT_RESERVE), ...male])
  return [...front, ...remaining]
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
    // 모델 노출 순서 랜덤화 — 앞 4자리는 남성 제외(여성 선호 사용자 다수), 5번째 자리부터는 랜덤 혼합
    AppState.allModels = shuffleModelsGenderFrontReserve(AppState.allModels);
    AppState.filteredModels = [...AppState.allModels];

    const wrap = document.getElementById('modelGridWrap');
    const loading = document.getElementById('modelsLoading');
    if (AppState.allModels.length === 0) {
      if (loading) {
        loading.style.display = '';
        loading.innerHTML = t('noModels');
      }
    } else {
      showGrid('modelsLoading', 'modelGrid', () => renderModelGrid(AppState.allModels));
    }
  } catch (err) {
    console.error('Models load error:', err);
    const loading = document.getElementById('modelsLoading');
    if (loading) {
      loading.style.display = '';
      loading.innerHTML = t('modelLoadFail');
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

    // 배경 노출 순서 랜덤화
    for (let i = AppState.allBackgrounds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [AppState.allBackgrounds[i], AppState.allBackgrounds[j]] = [AppState.allBackgrounds[j], AppState.allBackgrounds[i]];
    }
    AppState.filteredBackgrounds = [...AppState.allBackgrounds];

    const wrap = document.getElementById('bgGridWrap');
    const loading = document.getElementById('bgsLoading');
    if (AppState.allBackgrounds.length === 0) {
      if (loading) {
        loading.style.display = '';
        loading.innerHTML = t('noBgs');
      }
    } else {
      showGrid('bgsLoading', 'bgGrid', () => renderBgGrid(AppState.allBackgrounds));
    }
  } catch (err) {
    console.error('Backgrounds load error:', err);
    const loading = document.getElementById('bgsLoading');
    if (loading) {
      loading.style.display = '';
      loading.innerHTML = t('bgLoadFail');
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
      showToast(t('uploadHint'), 'warning');
      return;
    }
  }
  // Step 2: 모델 미선택 시 랜덤 자동 선택
  if (currentStep === 2 && !AppState.selectedModel) {
    const pool = AppState.allModels.length > 0 ? AppState.allModels : getFallbackModels();
    if (pool.length > 0) {
      const random = pool[Math.floor(Math.random() * pool.length)];
      AppState.selectedModel = random;
      showToast(t('randomModel', random.name || '#' + random.id), 'info');
    }
  }
  // Step 3: 배경 미선택 시 랜덤 자동 선택
  if (currentStep === 3 && !AppState.selectedBg) {
    const pool = AppState.allBackgrounds.length > 0 ? AppState.allBackgrounds : getFallbackBackgrounds();
    if (pool.length > 0) {
      const random = pool[Math.floor(Math.random() * pool.length)];
      AppState.selectedBg = random;
      showToast(t('randomBg', random.name), 'info');
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

  // 동일 step 전환은 무시 (prev 클래스 오염 방지)
  if (newStep === prev) return;

  // gslide 전환 (새 구조)
  const allSlides = document.querySelectorAll('.gslide');
  allSlides.forEach(s => { s.classList.remove('active','prev'); s.style.transform = ''; });

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
// 슬롯별 AI 의류 검증 진행 중 여부
const slotValidating = { TOP: false, BOTTOM: false, DRESS: false };

// ── 상의/하의 ↔ 전체 상호 배타 ──
// 상의 또는 하의를 먼저 올리면 전체는 잠기고, 전체를 먼저 올리면 상의/하의가 잠김.
// (부분 조합과 전체를 동시에 올리면 생성 시 뒤섞여 오류 이미지가 나오는 문제 방지)
function getDisabledSlotCats() {
  if (slotData.DRESS !== null) return ['TOP', 'BOTTOM'];
  if (slotData.TOP !== null || slotData.BOTTOM !== null) return ['DRESS'];
  return [];
}
function isSlotDisabled(cat) {
  return getDisabledSlotCats().includes(cat);
}

// ── label for= 방식: 이미 채워진 슬롯이면 파일선택창 열기 차단 ──
// label 클릭 시 호출. 이미 이미지가 있으면 false 반환 → label의 for= 동작 억제
function handleSlotLabelClick(e, cat) {
  // ✕ 버튼 클릭은 removeSlot()에서 처리 → label 기본동작 억제
  if (e.target.closest('.cslot-remove')) return false;
  // 이미 채워진 슬롯 또는 검증 중인 슬롯: 파일 선택창 열지 않음
  if (slotData[cat] || slotValidating[cat]) return false;
  // 상의/하의 ↔ 전체 상호 배타로 잠긴 슬롯: 이유 안내 후 차단
  if (isSlotDisabled(cat)) {
    showToast(t('slotLockedErr', cat), 'error');
    return false;
  }
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
  if (slotData[cat] || slotValidating[cat] || isSlotDisabled(cat)) return; // 이미 채워졌거나 검증 중이거나 잠긴 슬롯은 무시
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
  if (slotData[cat] || slotValidating[cat]) return; // 이미 채워졌거나 검증 중인 슬롯 무시
  if (isSlotDisabled(cat)) { showToast(t('slotLockedErr', cat), 'error'); return; }
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
  if (isSlotDisabled(cat)) { showToast(t('slotLockedErr', cat), 'error'); return; }
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    showToast(t('uploadFormatErr'), 'error');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast(t('uploadSizeErr'), 'error');
    return;
  }

  const onReady = async (dataUrl) => {
    // 옷이 아닌 이미지(강아지, 풍경 등)를 올려 이상한 결과가 나오는 것을 사전 차단
    slotValidating[cat] = true;
    renderSlots();
    updateNextBtn1();
    let isClothing = true;
    try {
      const vr = await fetch('/api/validate/clothing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl, cat }),
      });
      const vd = await vr.json();
      if (vd && vd.isClothing === false) isClothing = false;
    } catch (err) {
      console.warn('의류 이미지 검증 실패, 통과 처리:', err); // 검증 자체가 실패하면 업로드는 막지 않음
    }
    slotValidating[cat] = false;
    if (!isClothing) {
      showToast(t('notClothingErr', cat), 'error');
      renderSlots();
      updateNextBtn1();
      return;
    }
    slotData[cat] = { file, dataUrl };
    syncClothingItems();
    renderSlots();
    updateNextBtn1();
  };

  // 원본 해상도가 크면(특히 "전체" 등 풀샷) base64 payload가 너무 커져
  // AI 생성 요청이 간헐적으로 실패하는 원인이 됨 — 업로드 시 다운스케일 압축
  _resizeImageFile(file, 1600, 0.85).then(onReady).catch((err) => {
    console.warn('이미지 리사이즈 실패, 원본으로 대체:', err);
    const reader = new FileReader();
    reader.onload = (ev) => onReady(ev.target.result);
    reader.readAsDataURL(file);
  });
}

// 업로드 이미지를 캔버스로 다운스케일 + JPEG 재압축 (Atlas Cloud 전송 payload 절감)
function _resizeImageFile(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width <= maxDim && height <= maxDim) {
          // 이미 충분히 작으면 원본 화질 유지
          resolve(ev.target.result);
          return;
        }
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        // 투명 PNG 대비 흰 배경 채우기
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
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

    if (slotValidating[cat]) {
      // AI 의류 검증 중 → 스피너 표시
      slot.classList.remove('cslot--filled');
      body.innerHTML = `
        <span class="cslot-empty">
          <span class="btn-spinner dark"></span>
          <span class="cslot-hint">${t('validatingClothing')}</span>
        </span>`;
      if (removeBtn) removeBtn.classList.add('hidden');
    } else if (data) {
      // 이미지 있음 → 썸네일 표시 + label for= 비활성화 (pointer-events:none 로 파일창 방지)
      slot.classList.add('cslot--filled');
      body.innerHTML = `<img src="${data.dataUrl}" alt="${SLOT_LABEL[cat]}" class="cslot-img" />`;
      if (removeBtn) removeBtn.classList.remove('hidden');
    } else if (isSlotDisabled(cat)) {
      // 상의/하의 ↔ 전체 상호 배타로 잠김 → 비활성 플레이스홀더
      slot.classList.remove('cslot--filled');
      slot.classList.add('cslot--disabled');
      body.innerHTML = `
        <span class="cslot-empty">
          <span class="cslot-plus">🔒</span>
          <span class="cslot-hint">${t('slotLockedHint', cat)}</span>
        </span>`;
      if (removeBtn) removeBtn.classList.add('hidden');
      return;
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
    slot.classList.remove('cslot--disabled');
  });
}

// ── 다음 버튼: 슬롯 1개 이상 채워지면 활성화 ──
function updateNextBtn1() {
  const btn = document.getElementById('nextBtn1');
  if (!btn) return;
  const hasAny = SLOT_CATS.some(cat => slotData[cat] !== null);
  const validating = SLOT_CATS.some(cat => slotValidating[cat]);
  btn.disabled = !hasAny || validating;
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
  skipCard.innerHTML = `<p>${t('skipCard')}</p>`;
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
      <div class="grid-card-check"><i class="fas fa-check"></i></div>`;

    card.addEventListener('click', () => {
      AppState.selectedModel = model;
      document.querySelectorAll('#modelGrid .grid-card, #modelGrid .grid-skip-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
    grid.appendChild(card);
  });

}

let modelFilterState = { gender: null, age: null, mood: null };

function filterModels(type, value, btn) {
  // 해당 필터 행의 active 해제
  const barId = type === 'gender' ? '#modelFilters' : type === 'age' ? '#modelAgeFilters' : '#modelMoodFilters';
  document.querySelectorAll(barId + ' .filter-tag').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  modelFilterState[type] = (value === 'all') ? null : value;

  // 3가지 필터 동시 적용
  const filtered = AppState.allModels.filter(m => {
    const g = m.gender || '미분류';
    const a = m.age    || '미분류';
    const mo = m.mood  || '미분류';
    if (modelFilterState.gender && g !== modelFilterState.gender) return false;
    if (modelFilterState.age    && a !== modelFilterState.age)    return false;
    if (modelFilterState.mood   && mo !== modelFilterState.mood)  return false;
    return true;
  });
  renderModelGrid(filtered.length > 0 ? filtered : (value === 'all' ? AppState.allModels : []));
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
  skipCard.innerHTML = `<p>${t('skipCard')}</p>`;
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
      modelEl.innerHTML = t('randomAssigned');
    }
  }

  if (bgEl) {
    if (AppState.selectedBg) {
      const imageUrl = `/api/proxy/bg-image/${AppState.selectedBg.id}`;
      bgEl.innerHTML = `<img src="${imageUrl}" alt="${AppState.selectedBg.name}" style="width:48px;height:32px;object-fit:cover;border-radius:4px;vertical-align:middle;margin-right:6px;" onerror="this.style.display='none'"> ${AppState.selectedBg.name}`;
    } else {
      bgEl.innerHTML = t('randomAssigned');
    }
  }
}

// ─────────────────────────────────────────────────────────
// GENERATION - Atlas Cloud API 실제 연동
// ─────────────────────────────────────────────────────────
async function startGeneration() {
  if (AppState.isGenerating) return;

  // 생성 버튼 즉각 눌림 피드백
  const nextBtn3 = document.getElementById('nextBtn3');
  if (nextBtn3) {
    nextBtn3.innerHTML = '<span class="btn-spinner"></span> ' + t('generating');
    nextBtn3.disabled = true;
  }

  // ── 로그인 체크: 미로그인 시 모달 표시 후 리턴 ──
  if (!AppState.user) {
    AppState.pendingGeneration = true;
    if (nextBtn3) { nextBtn3.innerHTML = t('genStart'); nextBtn3.disabled = false; }
    openModal('loginModal');
    return;
  }

  // 배경 미선택 시 랜덤 자동 선택
  if (!AppState.selectedBg) {
    const pool = AppState.allBackgrounds.length > 0 ? AppState.allBackgrounds : getFallbackBackgrounds();
    if (pool.length > 0) {
      const random = pool[Math.floor(Math.random() * pool.length)];
      AppState.selectedBg = random;
      showToast(t('randomBg', random.name), 'info');
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
      showToast(t('loginRequired'), 'error');
      showStep(1);
      return;
    }
    if (startRes.status === 402) {
      const errData = await startRes.json();
      const need = errData.required ?? 90;
      const have = errData.available ?? 0;
      showToast(t('creditInsufficient', need, have), 'error');
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
    AppState.lastJobId = startData.jobId; // 이미지 URL 저장용

    // Fallback 처리 (즉시 완료)
    if (startData.isFallback) {
      console.warn('[Generation] Atlas Cloud 요청 실패 — 데모 이미지로 대체:', startData.error);
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

      // 폴백 결과 표시 — Atlas Cloud가 이미지를 받지 못했거나 요청 실패 시 (isFallback: true 필수 전달)
      const fallbackImages = generateFallbackImages(count);
      completeGeneration(fallbackImages, true);
      return;
    }

    // 실제 Atlas Cloud 폴링
    updateProgress(20, 'AI 모델 피팅 적용 중...');
    setMsgState('msg1', 'done');
    setMsgState('msg2', 'current');

    await pollGenerationStatus(startData.jobId, count);

  } catch (err) {
    console.error('Generation error:', err);
    showToast(t('genError', err.message), 'error');
    AppState.isGenerating = false;

    // UI 복원
    const step3Nav = document.getElementById('step3Nav');
    if (step3Nav) step3Nav.style.display = '';
    const nb3err = document.getElementById('nextBtn3');
    if (nb3err) { nb3err.innerHTML = t('genStart'); nb3err.disabled = false; }
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

  // 실제 생성이 실패해서 임시 이미지로 대체된 경우, 사용자에게 명확히 알림
  if (isFallback) {
    showToast(t('genAnalysisErr'), 'error');
  }

  // Atlas Cloud 이미지 URL을 서버사이드 프록시로 변환 (CORS 우회)
  const proxiedImages = images.map(img => {
    if (img.url && img.url.startsWith('http')) {
      return { ...img, url: `/api/proxy/gen-image?url=${encodeURIComponent(img.url)}`, originalUrl: img.url };
    }
    return img;
  });

  AppState.generatedImages = proxiedImages;

  // 생성된 이미지 URL을 서버에 저장 (썸네일 미리보기용, 14일 보관)
  // fallback 포함 — 실제 URL이 있으면 무조건 저장 시도
  if (AppState.lastJobId) {
    const realUrls = images
      .filter(img => img.url && img.url.startsWith('http'))
      .map(img => img.url);
    if (realUrls.length > 0) {
      const token = localStorage.getItem('lookbook_token') || '';
      fetch('/api/generation/save-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-Token': token },
        body: JSON.stringify({ job_id: AppState.lastJobId, image_urls: realUrls }),
      }).catch(e => console.warn('[SaveImages] 저장 실패(무시):', e));
    }
    // 실제 URL 없음(placeholder 전용) → 히스토리 썸네일 없이 저장됨 (정상)
  }

  renderResults(proxiedImages);

  // step3Nav 복원 + 생성 버튼 상태 복원
  const step3NavEl = document.getElementById('step3Nav');
  if (step3NavEl) step3NavEl.style.display = '';
  const nb3 = document.getElementById('nextBtn3');
  if (nb3) { nb3.innerHTML = t('genStart'); nb3.disabled = false; }
  // generatingView 숨김
  const genViewEl = document.getElementById('generatingView');
  if (genViewEl) genViewEl.style.display = 'none';

  changeStep(4);

  const count = images.length;
  if (isFallback) {
    showToast(t('genDoneDemo'), 'error');
  } else {
    showToast(t('genDone', count), 'success');
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

  // 새 결과가 렌더링되면 이전 영상 생성 상태/버튼을 초기화
  _videoState = { jobId: null, videoUrl: null, polling: false };
  const videoBtn = document.getElementById('videoActionBtn');
  if (videoBtn) {
    videoBtn.disabled = false;
    const main = videoBtn.querySelector('.rnb-main');
    if (main) main.innerHTML = '<i class="fas fa-film"></i> 영상 생성';
  }
  const videoSub = document.getElementById('videoActionSub');
  if (videoSub) videoSub.innerHTML = '5초 · <s class="rnb-strike">1200</s> <i class="fas fa-coins"></i> 600';

  grid.innerHTML = '';

  // 결과 탭 텍스트 업데이트
  const firstTab = document.querySelector('.results-tab');
  if (firstTab) firstTab.textContent = t('fitLabel', images.length);

  images.forEach((img, idx) => {
    const card = document.createElement('div');
    card.className = 'result-card';

    const thumbContent = img.url
      ? `<img
            src="${img.url}"
            alt="${img.title || `피팅컷 #${idx + 1}`}"
            style="width:100%;height:auto;display:block;"
            onerror="console.error('Image load failed:', this.src); this.parentElement.style.background='${img.gradient || 'linear-gradient(135deg,#6C47FF,#00D4AA)'}'; this.style.display='none'; this.insertAdjacentHTML('afterend','<div style=\\'width:100%;aspect-ratio:3/4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;\\'><span style=\\'font-size:32px;\\'>⚠️</span><span style=\\'color:rgba(255,255,255,0.8);font-size:12px;text-align:center;padding:0 8px;\\'>이미지 로드 실패</span></div>');"
          />`
      : `<div style="width:100%;aspect-ratio:3/4;background:${img.gradient};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;">
           <span style="font-size:48px;">✨</span>
           <span style="color:rgba(255,255,255,0.9);font-size:13px;font-weight:700;">AI 생성 #${idx + 1}</span>
           <span style="color:rgba(255,255,255,0.6);font-size:11px;">데모 이미지</span>
         </div>`;

    card.innerHTML = `
      <div class="result-thumb" id="resultThumb-${idx}">${thumbContent}</div>
    `;

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
    if (regenBtnText) regenBtnText.textContent = t('regenBtn');
    if (regenCounter) regenCounter.textContent = `${MAX_REGEN}/${MAX_REGEN}`;
    if (regenLimitMsg) regenLimitMsg.style.display = 'block';
  } else {
    // 정상 상태
    regenBtn.disabled = false;
    regenBtn.style.opacity = '1';
    regenBtn.style.cursor = 'pointer';
    if (regenBtnText) regenBtnText.textContent = t('regenBtn');
    if (regenCounter) regenCounter.textContent = AppState.regenCount > 0 ? `${AppState.regenCount}/${MAX_REGEN}` : '';
    if (regenLimitMsg) regenLimitMsg.style.display = 'none';
  }
}

function switchResultsTab(tab, btn) {
  document.querySelectorAll('.results-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  if (tab === 'styleset') {
    showToast(t('genStyleHint'), 'info');
  }
}

function toggleResultFav(btn, e) {
  if (e) e.stopPropagation();
  const isFav = btn.classList.toggle('active');
  btn.textContent = t('favIcon', isFav);
  showToast(isFav ? t('favAdd') : t('favRemove'), isFav ? 'success' : 'info');
}

// ─── 실제 파일 다운로드 (크레딧 차감 없이 파일만 저장) ───
function _doFileDownload(url, num) {
  if (!url) {
    showToast(t('downloadStart', num), 'success');
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
  if (!img) { showToast(t('downloadImgNotFound'), 'error'); return; }

  const sessionToken = localStorage.getItem('lookbook_token') || '';
  if (!sessionToken) {
    showToast(t('loginRequired'), 'error');
    return;
  }

  openActionProgress(t('downloadIng').replace(/<[^>]*>/g, '').trim() || '다운로드 중...');

  try {
    const deductRes = await fetch('/api/credits/deduct', {
      method: 'POST',
      headers: { 'X-Session-Token': sessionToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: AppState.lastJobId, idx: getShareIndex(idx) }),
    });

    if (deductRes.status === 401) {
      closeActionProgress();
      showToast(t('loginRequired'), 'error');
      return;
    }
    if (deductRes.status === 402) {
      closeActionProgress();
      const errData = await deductRes.json();
      const have = errData.available ?? 0;
      showToast(t('creditInsufficientDetail', have), 'error');
      setTimeout(() => {
        const userArea = document.getElementById('navUserArea');
        if (userArea) userArea.click();
      }, 1500);
      return;
    }
    if (!deductRes.ok) {
      closeActionProgress();
      showToast(t('creditError'), 'error');
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
    const completeMsg = deductData.alreadyDownloaded ? t('creditRedownloadDone') : t('creditDeductDone', deductData.creditsRemaining);
    setActionComplete(completeMsg, {
      showShare: true,
      jobId: AppState.lastJobId,
      idx: getShareIndex(idx),
      imageUrl: img.originalUrl || img.url,
    });
  } catch (err) {
    console.error('Download error:', err);
    closeActionProgress();
    showToast(t('downloadErr'), 'error');
  }
}

// ─────────────────────────────────────────────────────────
// 영상 생성 (AtlasCloud seedance-2.5/reference-to-video)
// ─────────────────────────────────────────────────────────
let _videoState = { jobId: null, videoUrl: null, polling: false };

function _resetVideoBtn() {
  _videoState.polling = false;
  const btn = document.getElementById('videoActionBtn');
  const sub = document.getElementById('videoActionSub');
  if (btn) btn.disabled = false;
  if (sub) sub.innerHTML = '5초 · <i class="fas fa-coins"></i> 600';
}

async function startVideoGeneration() {
  if (_videoState.videoUrl) { downloadVideo(); return; }
  if (_videoState.polling) return;

  const img = AppState.generatedImages[0];
  if (!img || !img.originalUrl) {
    showToast('영상을 생성할 이미지가 없습니다.', 'error');
    return;
  }

  const sessionToken = localStorage.getItem('lookbook_token') || '';
  if (!sessionToken) {
    showToast(t('loginRequired'), 'error');
    return;
  }

  const btn = document.getElementById('videoActionBtn');
  const sub = document.getElementById('videoActionSub');
  if (btn) btn.disabled = true;
  if (sub) sub.textContent = '요청 중...';
  _videoState.polling = true;

  openActionProgress('영상 생성을 요청하는 중...');

  try {
    const startRes = await fetch('/api/video/start', {
      method: 'POST',
      headers: { 'X-Session-Token': sessionToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: img.originalUrl,
        modelName: AppState.lastGenParams?.modelName,
        bgName: AppState.lastGenParams?.bgName,
      }),
    });

    if (startRes.status === 401) {
      closeActionProgress();
      showToast(t('loginRequired'), 'error');
      _resetVideoBtn();
      return;
    }
    if (startRes.status === 402) {
      closeActionProgress();
      const errData = await startRes.json();
      showToast(t('creditInsufficientDetail', errData.available ?? 0), 'error');
      _resetVideoBtn();
      setTimeout(() => {
        const userArea = document.getElementById('navUserArea');
        if (userArea) userArea.click();
      }, 1500);
      return;
    }
    if (!startRes.ok) {
      closeActionProgress();
      const errData = await startRes.json().catch(() => ({}));
      showToast(errData.message || '영상 생성 요청에 실패했습니다.', 'error');
      _resetVideoBtn();
      return;
    }

    const startData = await startRes.json();
    _videoState.jobId = startData.jobId;

    if (startData.creditsRemaining !== undefined) {
      const cachedUser = JSON.parse(localStorage.getItem('lookbook_user') || 'null');
      if (cachedUser) { cachedUser.credits = startData.creditsRemaining; localStorage.setItem('lookbook_user', JSON.stringify(cachedUser)); }
      if (AppState.user) AppState.user.credits = startData.creditsRemaining;
      updateUserUI({ credits: startData.creditsRemaining });
    }

    openActionProgress('AI가 영상을 생성 중입니다... (최대 2~3분 소요)');
    if (sub) sub.textContent = '생성 중...';
    _pollVideoStatus();
  } catch (err) {
    console.error('Video start error:', err);
    closeActionProgress();
    showToast('영상 생성 중 오류가 발생했습니다.', 'error');
    _resetVideoBtn();
  }
}

async function _pollVideoStatus() {
  if (!_videoState.jobId) return;
  try {
    const res = await fetch(`/api/video/${_videoState.jobId}/status`);
    const data = await res.json();
    if (data.status === 'completed' && data.videoUrl) {
      _videoState.videoUrl = data.videoUrl;
      _videoState.polling = false;
      _onVideoReady(data.videoUrl);
      return;
    }
    if (data.status === 'failed') {
      _videoState.polling = false;
      closeActionProgress();
      showToast(data.error || '영상 생성에 실패했습니다.', 'error');
      _resetVideoBtn();
      return;
    }
    setTimeout(_pollVideoStatus, 4000);
  } catch (err) {
    console.error('Video poll error:', err);
    setTimeout(_pollVideoStatus, 5000);
  }
}

function _onVideoReady(videoUrl) {
  const btn = document.getElementById('videoActionBtn');
  const sub = document.getElementById('videoActionSub');
  if (btn) {
    btn.disabled = false;
    const main = btn.querySelector('.rnb-main');
    if (main) main.innerHTML = '<i class="fas fa-download"></i> 영상 다운로드';
  }
  if (sub) sub.textContent = '다운로드 준비 완료';

  closeActionProgress();

  // 결과 화면(첫 번째 카드)을 영상 재생 화면으로 교체
  // AtlasCloud 원본 저장소가 Content-Disposition: attachment로 강제 다운로드
  // 설정돼 있어 원본 URL을 그대로 쓰면 브라우저가 재생 대신 다운로드로 튐 —
  // 프록시를 거쳐야 이 헤더가 제거되어 인라인 재생이 됨
  const thumb = document.getElementById('resultThumb-0');
  if (thumb) {
    const proxiedVideoUrl = `/api/proxy/gen-image?url=${encodeURIComponent(videoUrl)}`;
    thumb.innerHTML = `<video src="${proxiedVideoUrl}" autoplay loop muted playsinline controls style="width:100%;height:auto;display:block;"></video>`;
  }
}

// ─── 영상 완성 후 다운로드 전 미리보기 모달 ───
function openVideoPreview(videoUrl) {
  const player = document.getElementById('videoPreviewPlayer');
  if (player) player.src = videoUrl;
  openModal('videoPreviewModal');
}

function closeVideoPreview() {
  const player = document.getElementById('videoPreviewPlayer');
  if (player) { player.pause(); player.removeAttribute('src'); player.load(); }
  closeModal('videoPreviewModal');
}

function downloadVideo() {
  if (!_videoState.videoUrl) {
    showToast('다운로드할 영상이 없습니다.', 'error');
    return;
  }
  const dlUrl = `/api/proxy/gen-image?url=${encodeURIComponent(_videoState.videoUrl)}&download=1`;
  const a = document.createElement('a');
  a.href = dlUrl;
  a.download = 'lookbook_ai_video.mp4';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('영상 다운로드를 시작합니다.', 'success');
  closeVideoPreview();

  setActionComplete('영상 다운로드가 시작되었습니다.', {
    showShare: true,
    jobId: _videoState.jobId,
    idx: 0,
    imageUrl: _videoState.videoUrl,
  });
}

// 레거시 — 내부에서만 사용 (크레딧 차감 없이 파일 저장만)
function downloadSingleImage(url, num) { _doFileDownload(url, num); }
function downloadSingle(num) { showToast(t('downloadStart', num), 'success'); }

// ─── 전체 다운로드: 이미지 1장씩 크레딧 차감 후 순차 다운로드 ───
async function downloadAll() {
  const realImages = AppState.generatedImages.filter(img => img.url);
  if (!realImages.length) {
    showToast(t('downloadNoImg'), 'error');
    return;
  }

  const sessionToken = localStorage.getItem('lookbook_token') || '';
  if (!sessionToken) {
    showToast(t('loginRequired'), 'error');
    return;
  }

  showToast(t('downloadMultiStart', realImages.length), 'info');

  let successCount = 0;
  for (let i = 0; i < realImages.length; i++) {
    const img = realImages[i];
    try {
      const deductRes = await fetch('/api/credits/deduct', {
        method: 'POST',
        headers: { 'X-Session-Token': sessionToken },
      });

      if (deductRes.status === 401) {
        showToast(t('loginRequired'), 'error');
        return;
      }
      if (deductRes.status === 402) {
        const errData = await deductRes.json();
        const have = errData.available ?? 0;
        showToast(t('creditLackPartial', i, have), 'error');
        return;
      }
      if (!deductRes.ok) {
        showToast(t('creditErrNum', i + 1), 'error');
        continue;
      }

      const deductData = await deductRes.json();
      // 크레딧 UI 갱신
      if (deductData.creditsRemaining !== undefined) {
        const cachedUser = JSON.parse(localStorage.getItem('lookbook_user') || 'null');
        if (cachedUser) { cachedUser.credits = deductData.creditsRemaining; localStorage.setItem('lookbook_user', JSON.stringify(cachedUser)); }
        if (AppState.user) AppState.user.credits = deductData.creditsRemaining;
        updateUserUI({ credits: deductData.creditsRemaining });
      }

      // 파일 다운로드
      await new Promise(resolve => setTimeout(resolve, i * 600));
      _doFileDownload(img.url, i + 1);
      successCount++;
    } catch (err) {
      console.error(`downloadAll error at index ${i}:`, err);
    }
  }

  if (successCount > 0) {
    showToast(t('downloadDone', successCount), 'success');
  }
}

async function downloadImage() {
  const modal = document.getElementById('imageModal');
  const idx = parseInt(modal?.dataset.currentIdx || '0');
  const img = AppState.generatedImages[idx];
  const downloadBtn = document.getElementById('downloadBtn');

  // 버튼 비활성화 (중복 클릭 방지)
  if (downloadBtn) {
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = t('downloadIng');
  }

  closeModal('imageModal');
  openActionProgress(t('downloadIng').replace(/<[^>]*>/g, '').trim() || '다운로드 중...');

  try {
    // 크레딧 차감 API 호출
    const sessionToken = localStorage.getItem('lookbook_token') || '';
    const deductRes = await fetch('/api/credits/deduct', {
      method: 'POST',
      headers: { 'X-Session-Token': sessionToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: AppState.lastJobId, idx: getShareIndex(idx) }),
    });

    if (deductRes.status === 401) {
      closeActionProgress();
      showToast(t('loginRequired'), 'error');
      return;
    }

    if (deductRes.status === 402) {
      closeActionProgress();
      const errData = await deductRes.json();
      const have = errData.available || 0;
      showToast(t('creditInsufficientDetail', have), 'error');
      setTimeout(() => {
        const userArea = document.getElementById('navUserArea');
        if (userArea) userArea.click();
      }, 1500);
      return;
    }

    if (!deductRes.ok) {
      closeActionProgress();
      showToast(t('creditError'), 'error');
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
      const completeMsg = deductData.alreadyDownloaded ? t('creditRedownloadDone') : t('creditDeductDone', deductData.creditsRemaining);
      setActionComplete(completeMsg, {
        showShare: true,
        jobId: AppState.lastJobId,
        idx: getShareIndex(idx),
        imageUrl: img.originalUrl || img.url,
      });
    } else {
      setActionComplete(t('downloadSingle'), { showShare: false });
    }

  } catch (err) {
    console.error('Download error:', err);
    closeActionProgress();
    showToast(t('downloadErr'), 'error');
  } finally {
    if (downloadBtn) {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = t('downloadBtn');
    }
  }
}

// 카드에서 재생성 버튼 클릭 시 (모달 없이 바로 재생성 시작)
function regenFromCard(idx) {
  const MAX_REGEN = 3;
  if (AppState.regenCount >= MAX_REGEN) {
    showToast(t('regenLimitErr'), 'error');
    return;
  }
  if (!AppState.lastGenParams) {
    showToast(t('regenNoInfo'), 'error');
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
    showToast(t('regenNoInfo'), 'error');
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
  if (regenBtnText) {
    regenBtnText.innerHTML = t('regenIng');
  }
  if (regenCounter) regenCounter.textContent = '';

  openActionProgress(t('regenIng').replace(/<[^>]*>/g, '').trim() || '재생성 중...');

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
      closeActionProgress();
      showToast(t('loginRequired'), 'error');
      return;
    }
    if (!res.ok) {
      closeActionProgress();
      const errData = await res.json().catch(() => ({}));
      showToast(t('regenFail', errData.error), 'error');
      return;
    }

    const startData = await res.json();
    if (!startData.jobId) {
      closeActionProgress();
      showToast(t('regenNoJobId'), 'error');
      return;
    }

    // 재생성 카운트 증가
    AppState.regenCount++;

    // ── 재생성 시에도 lastJobId 업데이트 (save-images가 올바른 job에 저장되도록)
    AppState.lastJobId = startData.jobId;

    // 모달 닫고 step-3 (생성 진행 화면)으로 전환
    closeActionProgress();
    closeModal('imageModal');

    // step-3으로 되돌아가서 generatingView 표시 (step-4 → step-3 → step-4 흐름)
    changeStep(3);
    const generatingView = document.getElementById('generatingView');
    const step3Nav = document.getElementById('step3Nav');
    if (generatingView) generatingView.style.display = '';
    if (step3Nav) step3Nav.style.display = 'none';

    updateProgress(10, '재생성 중...');
    AppState.isGenerating = true;
    AppState.currentJobId = startData.jobId;

    // 폴링
    await pollGenerationStatus(startData.jobId, AppState.lastGenParams.count || 1);

  } catch (err) {
    console.error('Regen error:', err);
    closeActionProgress();
    showToast(t('regenErr', err.message), 'error');
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

// ─────────────────────────────────────────────────────────
// 크레딧 충전 패널 (모든 페이지 공통)
// ─────────────────────────────────────────────────────────
let _selectedPkg = null;

function openChargePanel() {
  const user = AppState.user;
  const credits = user ? (user.credits ?? 0) : 0;
  const el = document.getElementById('chargePanelCredits');
  if (el) el.textContent = t('creditsUnit', credits);
  const panel = document.getElementById('chargePanel');
  if (!panel) return;
  panel.style.display = 'block';
  document.body.style.overflow = 'hidden';
  _selectedPkg = null;
  // 기본 선택: 4만원 패키지
  const defaultCard = document.querySelector('[data-pkg="pkg_40000"]');
  if (defaultCard) selectPackage('pkg_40000', defaultCard);
}

function closeChargePanel() {
  const panel = document.getElementById('chargePanel');
  if (panel) panel.style.display = 'none';
  document.body.style.overflow = '';
  _selectedPkg = null;
}

function selectPackage(pkgId, el) {
  _selectedPkg = pkgId;
  document.querySelectorAll('.pkg-card').forEach(c => {
    c.style.border = '2px solid #3a3a60';
    c.style.transform = 'scale(1)';
  });
  el.style.border = '2px solid #6c47ff';
  el.style.transform = 'scale(1.01)';
  const cta = document.getElementById('chargeCta');
  const lbl = document.getElementById('ctaLabel');
  if (cta) { cta.style.opacity = '1'; cta.style.pointerEvents = 'auto'; }
  const map = { pkg_20000: '20,000원 결제', pkg_40000: '40,000원 결제', pkg_60000: '60,000원 결제' };
  if (lbl) lbl.textContent = map[pkgId] || '결제하기';
}

async function startPayment() {
  if (!_selectedPkg) { showToast(t('paySelectPkg'), 'error'); return; }
  const sessionToken = localStorage.getItem('lookbook_token') || '';
  if (!sessionToken) { showToast(t('loginRequired'), 'error'); return; }

  const cta = document.getElementById('chargeCta');
  try {
    if (cta) { cta.style.opacity = '0.6'; cta.style.pointerEvents = 'none'; }

    const res = await fetch('/api/payments/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
      body: JSON.stringify({ packageId: _selectedPkg }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || '결제 준비 실패');
    if (!data.clientId) throw new Error('결제 설정 오류 (NICEPAY_CLIENT_ID 미설정)');

    if (!window.AUTHNICE) await loadNicepaySDK();

    // 나이스페이먼츠 서버 승인 모델: 결제창 인증 완료 후 우리 서버(/payment/return)로
    // 결제창이 직접 POST → 서버에서 승인 API 호출까지 끝난 뒤 결과 페이지로 리다이렉트됨
    const payReq = {
      clientId: data.clientId,
      method: 'card',
      orderId: data.orderId,
      amount: data.amount,
      goodsName: data.orderName,
      buyerName: data.customerName,
      returnUrl: location.origin + '/payment/return',
      fnError: function (result) {
        if (cta) { cta.style.opacity = '1'; cta.style.pointerEvents = 'auto'; }
        showToast(t('payFail', result && result.errorMsg || ''), 'error');
      },
    };
    // 카카오 로그인 등 이메일 미동의 계정은 내부용 가짜 이메일(@kakao.local)이 저장되어
    // 있는데, 이걸 그대로 보내면 나이스페이 인증 단계에서 거부됨(U116) — 실제 이메일일 때만 전달
    if (data.customerEmail && !data.customerEmail.endsWith('@kakao.local')) {
      payReq.buyerEmail = data.customerEmail;
    }
    AUTHNICE.requestPay(payReq);
  } catch (e) {
    if (cta) { cta.style.opacity = '1'; cta.style.pointerEvents = 'auto'; }
    showToast(t('payFail', e.message), 'error');
  }
}

function loadNicepaySDK() {
  return new Promise((resolve, reject) => {
    if (window.AUTHNICE) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://pay.nicepay.co.kr/v1/js/';
    s.onload = resolve;
    s.onerror = () => reject(new Error('나이스페이먼츠 SDK 로드 실패'));
    document.head.appendChild(s);
  });
}

// 결제 완료 후 creditsRefresh 신호 처리 (탭 복귀 시)
window.addEventListener('focus', () => {
  if (sessionStorage.getItem('creditsRefresh')) {
    sessionStorage.removeItem('creditsRefresh');
    verifySession().then(() => {
      const user = AppState.user;
      if (!user) return;
      ['dbCredits'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = (user.credits ?? 0).toLocaleString();
      });
      const dd = document.getElementById('ddUserCredits');
      if (dd) dd.textContent = (user.credits ?? 0).toLocaleString() + ' 크레딧';
    });
  }
});
