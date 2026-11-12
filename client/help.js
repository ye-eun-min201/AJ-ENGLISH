(function () {
  'use strict';

  const SEEN_KEYS = {
    student: 'ajenglish-onboarding-student-v1',
    admin: 'ajenglish-onboarding-admin-v1'
  };
  const memorySeen = new Map();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const roleName = role => role === 'admin' ? '관리자' : '학생';

  const tours = {
    student: [
      { icon: '◎', title: '레일 퀘스트', intro: '단어·문장 각각 하루 10문제.', points: ['매일 영단어 또는 말하기 문장 선택', '정답 통과 저장 후 다음 문제. 맞춘 문항은 재접속 시 건너뜀.', '레일 게임 XP와 20분 주간 복습의 학습 XP는 별도. 진행률 %는 포인트가 아님.'], target: 'home', label: '레일 퀘스트' },
      { icon: '☺', title: '로그인·캐릭터 설정', intro: '계정별 캐릭터·학습 기록 저장.', points: ['로그인 후 별명·캐릭터 저장', '반 생성 또는 반 코드로 참여', '같은 반의 월간 MVP 확인'], target: 'profile', label: '캐릭터 설정' },
      { icon: '▤', title: '주간 수업·PDF 필기', intro: '챕터별 PDF 열람·필기.', points: ['썸네일·페이지 이동·확대·전체 화면', '페이지별 텍스트·손글씨 필기', '로그인 필기: 계정에 비공개 저장. 게스트 필기: 현재 브라우저 저장. 저장 상태 확인 후 이동.'], target: 'slides', label: '수업 자료' },
      { icon: 'Aa', title: '영단어·말하기 문장', intro: '매일 영단어와 말하기 문장을 나누어 학습.', points: ['매일 영단어: 단어·뜻 중심 복습', '말하기 문장: 문장 전체·뜻 중심 학습', '각 분류에서 카드·배우기·쓰기·맞추기·듣기 선택'], target: 'library', label: '매일 학습' },
      { icon: '↗', title: '영어 게임', intro: '수업 표현 기반 말하기·문장 조립·듣기 퀴즈.', points: ['말하기 학습: 문장 전체 인식 시 과일 상자 채움', '문장 조립·듣기 퀴즈로 수업 표현 복습', '인식 문장 일치 기준. 음소 단위의 정밀 발음 채점은 제공하지 않음.'], target: 'arcade', label: '영어 게임' },
      { icon: '✦', title: '실제 XP·월간 MVP', intro: '완료 후 지급 XP와 실제 순위 확인.', points: ['XP 팝업: 서버에서 실제 지급한 포인트. 진행률 %와 별도.', '학습 하루 최대 130 XP · 게임 하루 최대 40 XP. 한도 적용 시 추가 지급 없음.', '학습·게임·종합 MVP 구분. 한국 시간 매월 1일 새 리그 시작.'], target: 'rankings', label: '월간 MVP' }
    ],
    admin: [
      { icon: '✦', title: '관리자 메뉴', intro: '단어·수업 관리 및 학생 학습 현황.', points: ['관리 비밀번호로 로그인. 비밀번호는 도움말에 미표시.', '영단어·말하기 문장 등록: 단어·문장 관리', '수업 본문·교재: 주간 수업 관리. 월별 기록: 학생 학습 현황. 이 안내에서는 실제 입력·등록을 실행하지 않음.'] },
      { icon: 'Aa', title: '매일 영단어·말하기 문장 등록', intro: '입력 상단에서 학습 분류 선택 후 등록.', points: ['매일 영단어: 영단어·한국어 뜻 입력', '말하기 문장: 문장·한국어 뜻 입력. 기존 내용은 분류 변경 시 유지.', '학생 공개 후 같은 분류로 학생 화면 반영. 추가 설정: 예문·메모·복습 일차.'], tab: 'daily', label: '단어·문장 관리' },
      { icon: '▤', title: '수업 등록: 제목·내용', intro: '주간 수업의 제목·본문 입력.', points: ['수업 제목 입력', '핵심 표현·대화·질문 등 본문 입력', '수업 번호 자동 지정. 날짜·공개 시간은 추가 설정에서 변경.'], tab: 'chapters', label: '주간 수업 관리' },
      { icon: '↑', title: 'PDF 교재 선택', intro: 'PDF 첨부는 선택 사항. 본문만 등록 가능.', points: ['파일 선택 또는 끌어 놓기', '실제 PDF 형식·암호·쪽수 확인 · 최대 20 MB', 'PDF 저장과 학생 공개는 별도. 파일 저장 후 3단계 수업 등록으로 공개.'], tab: 'chapters', label: '수업 교재 관리' },
      { icon: '✓', title: '등록 내용·공개 설정', intro: '제목·본문·PDF 확인 후 수업 등록.', points: ['등록 버튼으로 수업·PDF 순차 저장', '초안: 학생 비공개. 수정 후 공개 가능.', '예약: 한국 시간 기준. 미래 주차는 주 시작일 00:00부터 공개. 지정 시간이 더 늦으면 해당 시각 적용.'], tab: 'chapters', label: '수업 등록' },
      { icon: '↗', title: '학생 화면 확인', intro: '학생 화면에서 공개 결과 확인.', points: ['공개 가능한 표현·수업 자동 반영', '열린 학생 화면은 약 5초 간격으로 업데이트 확인', '초안·공개 전 예약 자료는 학생 비공개'], },
      { icon: '◎', title: '학생 학습 현황·도움말', intro: '월·반별 학생 기록 조회.', points: ['학생 학습 현황: 닉네임 검색·수업 시간·학습·게임 XP 확인', '학습 시간은 수업 퀘스트 기록만 집계. 카드 시간은 미측정, 게임 시간은 해당 집계에 미포함.', '등록 자료는 목록에서 수정. 도움말 검색·사용 안내 다시 보기.'], tab: 'learners', label: '학생 학습 현황' }
    ]
  };

  const faqs = [
    { role: 'student', category: '시작하기', title: '주일 수업·오늘의 20분 복습', answer: '수업은 매주 일요일 16:00–17:00, 주일 오후 예배 후 1시간. 한국 시간 기준. 첫 화면에서 오늘의 20분 복습 시작 또는 이어하기 선택. 레일 퀘스트 하루 10문제와 20분 퀘스트는 별도 기록.', target: 'home' },
    { role: 'student', category: '수업·PDF', title: '태블릿·휴대폰 화면', answer: '화면 너비에 따라 자동 배치. 태블릿에서는 PDF와 필기 공간을 넓게 사용, 휴대폰에서는 자료·문제·필기 순서로 세로 배치. 펜 필기 후 스크롤은 이동 도구 선택. 저장됨 표시 확인 후 화면 전환.', target: 'slides' },
    { role: 'student', category: '시작하기', title: '레일 퀘스트·학습 시작', answer: '첫 화면에서 매일 영단어 또는 말하기 문장 선택 후 탑승 시작. 단어·문장 각각 하루 10문제. 비슷한 뜻의 보기 중 정답 선택 후 통과 저장. 맞춘 문항은 재접속 시 건너뜀. 10문제 완료 후 미학습·오답 우선 자유 복습 가능. 레일은 게임 XP 기록이며 20분 주간 복습 완료와는 별도. 퀘스트 지도에서 주간 학습 진행.', target: 'home' },
    { role: 'student', category: '시작하기', title: '로그인·반 코드', answer: '로그인 후 캐릭터·별명 저장. 반 참여는 0·1·I·O를 제외한 영문·숫자 6자리 코드 입력. 반 미참여 상태에서도 개인 학습 가능. 같은 반의 월간 MVP 확인에 사용.', target: 'profile' },
    { role: 'student', category: '수업·PDF', title: 'PDF 교재 열기', answer: '수업 자료에서 주간 챕터 선택. 썸네일·페이지 이동·확대·전체 화면 지원. 교재가 없으면 해당 챕터의 공개 상태 확인.', target: 'slides' },
    { role: 'student', category: '수업·PDF', title: 'PDF 필기 저장·공개 범위', answer: '로그인 필기는 본인 계정에 비공개 저장. 게스트 필기는 현재 브라우저에 저장되며 로그인 계정으로 자동 이전되지 않음. 페이지 이동·새로고침·종료 전 저장됨 표시 확인. 저장 중·오류 상태에서는 화면 유지 후 메모 저장 재시도.', target: 'slides' },
    { role: 'student', category: '수업·PDF', title: '새 교재 반영', answer: '학생 화면은 약 5초 간격으로 새 자료 확인. 미반영 시 잠시 후 새로고침. 초안·미래 주간 수업·예약 시각 이전 자료는 학생 비공개.', target: 'quests' },
    { role: 'student', category: '복습·게임', title: '영단어·말하기 문장 학습', answer: '매일 영단어는 단어·뜻, 말하기 문장은 문장·뜻으로 분리. 각 분류에서 카드·배우기·쓰기·맞추기·듣기 선택. 분류는 선생님이 등록한 학습 종류 기준.', target: 'library' },
    { role: 'student', category: '복습·게임', title: '영어 음성 재생 문제', answer: '기기 미디어 음량·이어폰 연결 확인. 듣기 설정에서 영어 음성·속도 변경 후 소리 테스트. 필요 시 기기에 영어 음성 데이터 설치. 앱 내 브라우저 대신 Chrome 또는 Edge에서 재시도.' },
    { role: 'student', category: '복습·게임', title: '말하기 인식·상자 채우기', answer: '수업 문장 전체를 발화. 인식 결과의 누락·다른 단어 확인 후 재시도. 마이크 권한·인터넷 연결 확인. 인식 문장 일치 기준이며 음소 단위의 정밀 발음 채점은 제공하지 않음.', target: 'arcade' },
    { role: 'student', category: '포인트·MVP', title: '실제 XP·진행률·하루 한도', answer: '진행률 %는 학습 완료 상태이며 포인트가 아님. XP 팝업은 서버에서 실제 지급한 값. 학습 최대 130 XP: 20분 퀘스트 100 XP + 단어장 복습 30 XP. 게임은 별도 최대 40 XP. 같은 카드의 학습 포인트는 하루 1회. 하루 한도 적용 시 추가 지급 없음.', target: 'rankings' },
    { role: 'student', category: '포인트·MVP', title: '20분 이전 퀘스트 완료', answer: '말하기·퀴즈 완료 후 조기 종료 가능. 학습 시간에 비례해 포인트 지급하며 당일 첫 완료 보상 마감. 최대 보상은 20분 학습 후 완료 시 적용.', target: 'quests' },
    { role: 'student', category: '포인트·MVP', title: '학습·게임·종합 MVP 기준', answer: '학습 MVP: 학습 포인트. 게임 MVP: 게임 포인트. 종합 MVP: 두 점수의 합. 같은 반의 실제 기록 기준이며 동점은 포인트를 얻은 학습일 수로 비교하며 같으면 공동 순위. 매월 말일 23:59 집계 마감, 다음 달 1일 새 순위 집계. 지난달 기록 조회 가능.', target: 'rankings' },
    { role: 'student', category: '포인트·MVP', title: '코인·랭킹 포인트', answer: '코인과 랭킹 포인트는 별도 관리. 코인으로 소품을 교환해도 학습·게임 포인트는 유지.', target: 'profile' },
    { role: 'admin', category: '시작하기', title: '관리자 로그인', answer: '관리자 주소에서 관리 비밀번호로 로그인. 비밀번호는 도움말에 미표시. 단어·문장 관리 또는 주간 수업 관리 선택.' },
    { role: 'admin', category: '오늘 표현', title: '매일 영단어·말하기 문장 등록', answer: '입력 상단에서 매일 영단어 또는 말하기 문장 선택. 영어·한국어 뜻 입력 후 학생 공개. 선택한 분류 그대로 학생 화면에 반영. 예문·메모는 추가 설정에서 입력.', tab: 'daily' },
    { role: 'admin', category: '이번 주 수업', title: '수업 등록 순서', answer: '① 제목·내용 ② PDF 선택(선택 사항) ③ 확인·등록. 수업 번호는 자동 지정하며 수업·교재를 순서대로 저장.', tab: 'chapters' },
    { role: 'admin', category: '이번 주 수업', title: '저장한 PDF가 학생에게 안 보이는 경우', answer: '파일 저장 완료와 학생 공개 완료는 별도. 초안·미래 수업 주·예약 공개 시각 확인. 3단계에서 공개 설정 확인 후 수업 등록. 학생 공개 완료 표시와 학생 수업 화면 링크로 대상 챕터 확인.', tab: 'chapters' },
    { role: 'admin', category: '이번 주 수업', title: 'PDF 교체·필기 보존', answer: '같은 챕터의 PDF 교체 시 이전 원본 복원 기능 없음. 페이지 필기는 챕터·페이지 기준으로 남으므로 다른 내용의 교재는 새 챕터로 등록. 교체 전 원본 파일 별도 보관.', tab: 'chapters' },
    { role: 'student', category: '복습·게임', title: '단어장 저장 실패·상태 재저장', answer: '계정 저장 실패 시 암기·별표 상태를 이 기기의 계정별 보관함에 유지. 저장 재시도로 상태만 재저장하며 추가 학습 포인트는 지급하지 않음. 게스트 학습은 기기에만 저장되며 로그인 계정으로 자동 합산되지 않음.', target: 'library' },
    { role: 'admin', category: '이번 주 수업', title: 'PDF 선택·업로드', answer: '파일 선택은 미저장 상태. 2단계 PDF 저장 또는 3단계 수업 등록으로 파일 저장. 초안 파일은 저장 후에도 학생 비공개. 학생 공개는 3단계 수업 등록 완료와 공개 시점 도달 후 반영. PDF 없이 본문만 등록 가능. 파일 한도 20 MB.', tab: 'chapters' },
    { role: 'admin', category: '오늘 표현', title: '학습 분류·복습 일차', answer: '상단 분류는 매일 영단어 또는 말하기 문장. 새 항목의 기본값은 영단어이며 기존 항목 수정 시 저장된 분류 유지. 추가 설정에서 복습 일차·메모·예문 지정. 일괄 등록에도 학습 분류 선택 필요.', tab: 'daily' },
    { role: 'admin', category: '공개·예약', title: '초안·학생 공개', answer: '초안은 학생 비공개. 내용 확인 후 학생 공개 또는 수업 등록으로 공개 처리.', tab: 'chapters' },
    { role: 'admin', category: '공개·예약', title: '미래 주간 수업·예약 공개', answer: '추가 설정에서 수업 주 시작일·공개 시간 지정. 한국 시간(KST) 기준. 주 시작일 00:00와 별도 예약 시각 중 늦은 시점부터 공개. 연결 표현·PDF도 수업 공개 시점 적용.', tab: 'chapters' },
    { role: 'admin', category: '공개·예약', title: '학생 화면 반영', answer: '공개 가능한 자료 자동 반영. 열린 학생 화면은 약 5초 간격으로 확인. 초안·미래 주간 수업·예약 시각 이전 자료는 학생 비공개.' },
    { role: 'admin', category: '오늘 표현', title: '자료 수정·비공개 전환', answer: '등록 목록에서 항목 선택 후 수정·저장. 공개 중지는 초안 전환. 삭제 전 대상 항목 재확인.', tab: 'daily' },
    { role: 'student', category: '시작하기', title: '퀘스트 지도·20분 주간 복습', answer: '퀘스트 지도에서 7단계 주간 복습 진행. 첫 미완료 단계 입장, 완료 단계 재학습, 잠금 단계 상세 확인 가능. 주간 완료 기록은 20분 수업 퀘스트 기준이며 레일 게임의 일일 10문제 완료와 별도. 지도 완료 별은 정확도 점수가 아님.', target: 'quests' },
    { role: 'admin', category: '학생 현황', title: '학생 학습 기록 조회', answer: '학생 학습 현황에서 조회 월·반 선택, 닉네임 검색. 수업 학습 시간·수업 및 게임 완료 횟수·학습 및 게임 XP·최근 학습일 확인. 반 필터는 소속 학생 선택 기준이며 지표는 학생의 사이트 전체 기록.', tab: 'learners' },
    { role: 'student', category: '복습·게임', title: '하루 10문제·정답 저장·추가 연습', answer: '매일 영단어와 말하기 문장은 별도 10문제. 로그인 시 정답 통과 계정 저장, 게스트는 이 기기 저장. 오답 후 교정 정답도 통과 저장되며 첫 정답 XP는 추가 지급 없음. 하루 목표 완료 후 자유 복습은 미학습·미통과 오답 우선, 추가 XP 없음. 전 문항 학습 완료 시 이전 문항 복습 표시. 보기 부족 자료는 한국어 뜻을 보고 영어 입력.', target: 'home' },
    { role: 'admin', category: '학생 현황', title: '학습 시간·카드 집계 기준', answer: '시간은 수업 퀘스트에 저장된 기록만 집계. 카드 학습 시간은 측정하지 않음. 게임 시간은 수업 시간 집계에 미포함. 수업 완료 횟수는 재학습 포함. 상세의 암기·복습 카드는 조회 월과 무관한 누적 기록. 로그인하지 않은 기기 내 학습은 관리자 현황에 미포함.', tab: 'learners' }
  ];

  let config = null, root = null, opened = false, mode = 'help', stepIndex = 0, helpRole = 'student', category = '전체', query = '';
  let previousFocus = null, previousOverflow = '', background = [], tourShownRole = null;

  function seen(role) {
    if (memorySeen.has(role)) return true;
    try { const value = typeof localStorage === 'undefined' ? null : localStorage.getItem(SEEN_KEYS[role]); if (value) { memorySeen.set(role, value); return true; } } catch (_) { /* The current session still remembers dismissal. */ }
    return false;
  }
  function markSeen(role, complete) {
    if (!memorySeen.has(role)) seen(role);
    const value = complete ? 'complete' : memorySeen.get(role) === 'complete' ? 'complete' : 'seen';
    memorySeen.set(role, value);
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(SEEN_KEYS[role], value); } catch (_) { /* Tutorials also work without local storage. */ }
  }
  function getRoot() {
    if (!root || !root.isConnected) { root = document.createElement('div'); root.id = 'aj-help-root'; document.body.appendChild(root); }
    return root;
  }
  function appDialogActive() {
    return !!document.querySelector('#modal-root .dialog') || !!document.querySelector('#chapter-preview:not([hidden])');
  }
  function canAction(item, itemRole) {
    if (!config || itemRole !== config.role || appDialogActive()) return false;
    if (config.role === 'admin' && document.querySelector('#teacher-workspace')?.hidden) return false;
    return config.role === 'student' ? !!item.target && typeof config.onNavigate === 'function' : !!item.tab && typeof config.onAdminTab === 'function';
  }
  function actionButton(item, role, source) {
    return canAction(item, role) ? '<button type="button" class="aj-help-button aj-help-button-outline" data-aj-help-action="' + esc(source) + '">' + esc(item.label || '해당 화면 보기') + ' <span aria-hidden="true">↗</span></button>' : '';
  }
  function shell(content, tour) {
    return '<div class="aj-help-backdrop" data-aj-help-backdrop><section class="aj-help-dialog ' + (tour ? 'aj-help-tour-dialog' : '') + '" role="dialog" aria-modal="true" aria-labelledby="aj-help-title"><header class="aj-help-header"><div class="aj-help-brand"><span aria-hidden="true">AJ</span><strong>AJ ENGLISH<small>' + (tour ? 'QUICK START GUIDE' : 'HELP CENTER') + '</small></strong></div><button class="aj-help-close" type="button" data-aj-help-close aria-label="도움말 닫기">×</button></header>' + content + '</section></div>';
  }
  function renderTour() {
    const steps = tours[config.role], step = steps[stepIndex];
    tourShownRole = config.role;
    getRoot().innerHTML = shell('<div class="aj-help-tour"><aside class="aj-help-tour-cover"><span class="aj-help-role-label">' + roleName(config.role) + ' 사용 안내</span><div class="aj-help-tour-icon" aria-hidden="true">' + step.icon + '</div><div class="aj-help-cover-caption"><span>USER GUIDE</span><strong>AJ ENGLISH</strong></div><p>학생·관리자 기능 안내</p></aside><div class="aj-help-tour-content"><div class="aj-help-tour-topline"><span>STEP ' + String(stepIndex + 1).padStart(2, '0') + ' / ' + steps.length + '</span><button type="button" class="aj-help-text-button" data-aj-help-mode="help">전체 도움말 보기 ↗</button></div><h2 id="aj-help-title" tabindex="-1">' + esc(step.title) + '</h2><p class="aj-help-intro">' + esc(step.intro) + '</p><ul class="aj-help-points">' + step.points.map(point => '<li><span aria-hidden="true">✓</span><p>' + esc(point) + '</p></li>').join('') + '</ul><div class="aj-help-tour-action">' + actionButton(step, config.role, 'tour') + '</div><nav class="aj-help-steps" aria-label="튜토리얼 단계">' + steps.map((item, index) => '<button type="button" class="aj-help-step ' + (index === stepIndex ? 'active' : index < stepIndex ? 'done' : '') + '" data-aj-help-step="' + index + '" aria-label="' + (index + 1) + '단계: ' + esc(item.title) + '" ' + (index === stepIndex ? 'aria-current="step"' : '') + '>' + (index < stepIndex ? '✓' : index + 1) + '</button>').join('') + '</nav><div class="aj-help-progress" aria-hidden="true"><span style="width:' + ((stepIndex + 1) / steps.length * 100) + '%"></span></div><footer class="aj-help-tour-footer"><button type="button" class="aj-help-text-button" data-aj-help-skip>건너뛰기</button><div><button type="button" class="aj-help-button aj-help-button-soft" data-aj-help-prev ' + (stepIndex === 0 ? 'disabled' : '') + '>이전</button><button type="button" class="aj-help-button aj-help-button-primary" ' + (stepIndex === steps.length - 1 ? 'data-aj-help-complete' : 'data-aj-help-next') + '>' + (stepIndex === steps.length - 1 ? '완료 ✓' : '다음 단계 →') + '</button></div></footer></div></div>', true);
    getRoot().querySelector('#aj-help-title').focus();
  }
  function renderHelp() {
    const categories = ['전체', ...new Set(faqs.filter(item => item.role === helpRole).map(item => item.category))];
    getRoot().innerHTML = shell('<div class="aj-help-center"><div class="aj-help-center-heading"><div><span class="aj-help-eyebrow">사용 안내</span><h2 id="aj-help-title" tabindex="-1">도움말</h2><p>학습·교재 관리 기능 안내</p></div><span class="aj-help-center-symbol" aria-hidden="true">?</span></div><label class="aj-help-search"><span aria-hidden="true">⌕</span><input id="aj-help-search" type="search" value="' + esc(query) + '" placeholder="기능 검색: PDF·포인트·예약" aria-label="도움말 검색"></label><div class="aj-help-role-tabs" role="tablist" aria-label="사용자별 도움말"><button type="button" role="tab" id="aj-help-student-tab" data-aj-help-role="student" aria-selected="' + (helpRole === 'student') + '" class="' + (helpRole === 'student' ? 'active' : '') + '">학생 안내</button><button type="button" role="tab" id="aj-help-admin-tab" data-aj-help-role="admin" aria-selected="' + (helpRole === 'admin') + '" class="' + (helpRole === 'admin' ? 'active' : '') + '">관리자 안내</button></div><div class="aj-help-filters" aria-label="도움말 분류">' + categories.map(item => '<button type="button" data-aj-help-category="' + esc(item) + '" class="' + (category === item ? 'active' : '') + '" aria-pressed="' + (category === item) + '">' + esc(item) + '</button>').join('') + '</div><div class="aj-help-result-heading"><strong id="aj-help-result-count"></strong><button type="button" class="aj-help-text-button" data-aj-help-mode="tour">' + roleName(config.role) + ' 튜토리얼 다시 보기 ↻</button></div><div id="aj-help-results" class="aj-help-results" role="tabpanel" aria-labelledby="aj-help-' + helpRole + '-tab"></div><footer class="aj-help-center-footer"><span aria-hidden="true">✦</span><p>학생·관리자 사용 안내</p></footer></div>', false);
    renderResults();
    getRoot().querySelector('#aj-help-title').focus();
  }
  function renderResults() {
    if (!root || mode !== 'help') return;
    const normalized = query.trim().toLowerCase();
    const matches = faqs.map((item, index) => ({ ...item, index })).filter(item => item.role === helpRole && (category === '전체' || item.category === category) && (!normalized || [item.title, item.answer, item.category].join(' ').toLowerCase().includes(normalized)));
    root.querySelector('#aj-help-result-count').textContent = matches.length + '개의 사용 안내';
    root.querySelector('#aj-help-results').innerHTML = matches.length ? matches.map(item => '<details class="aj-help-faq"><summary><span><small>' + esc(item.category) + '</small><strong>' + esc(item.title) + '</strong></span><i aria-hidden="true">+</i></summary><div class="aj-help-faq-answer"><p>' + esc(item.answer) + '</p>' + actionButton(item, helpRole, String(item.index)) + '</div></details>').join('') : '<div class="aj-help-empty"><span aria-hidden="true">⌕</span><strong>검색 결과 없음</strong><p>검색어·분류 변경 후 재검색</p><button type="button" class="aj-help-button aj-help-button-soft" data-aj-help-clear>검색과 분류 초기화</button></div>';
  }
  function protectBackground() {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    background = Array.from(document.body.children).filter(element => element !== root).map(element => ({ element, inert: element.hasAttribute('inert'), ariaHidden: element.getAttribute('aria-hidden') }));
    background.forEach(({ element }) => { element.setAttribute('inert', ''); element.setAttribute('aria-hidden', 'true'); });
  }
  function restoreBackground() {
    background.forEach(({ element, inert, ariaHidden }) => {
      if (!element.isConnected) return;
      if (!inert) element.removeAttribute('inert');
      if (ariaHidden === null) element.removeAttribute('aria-hidden'); else element.setAttribute('aria-hidden', ariaHidden);
    });
    background = [];
    document.body.style.overflow = previousOverflow;
  }
  function open(nextMode) {
    if (!config) return false;
    if (!opened) { previousFocus = document.activeElement; getRoot(); protectBackground(); opened = true; helpRole = config.role; category = '전체'; query = ''; stepIndex = 0; tourShownRole = null; }
    mode = nextMode === 'tour' ? 'tour' : 'help';
    if (mode === 'tour') { stepIndex = 0; renderTour(); } else renderHelp();
    return true;
  }
  function close(options) {
    if (!opened) return false;
    if (tourShownRole) markSeen(tourShownRole, !!options?.complete);
    opened = false; getRoot().replaceChildren(); restoreBackground(); tourShownRole = null;
    const focus = previousFocus?.isConnected ? previousFocus : document.querySelector('[data-help]');
    focus?.focus?.(); previousFocus = null;
    return true;
  }
  const GAME_KEY = 'ajenglish-tutorial-game-v1';
  function gameSeen() { try { return !!localStorage.getItem(GAME_KEY); } catch (_) { return memorySeen.has('game'); } }
  function markGame() { memorySeen.set('game', 'seen'); try { localStorage.setItem(GAME_KEY, 'seen'); } catch (_) { /* 저장이 안 돼도 이번 방문에는 다시 뜨지 않음 */ } }
  function maybeWelcome() {
    if (!config || opened || appDialogActive()) return false;
    if (config.role === 'student' && window.AJTutorial) { if (gameSeen() || memorySeen.has('game')) return false; markGame(); return window.AJTutorial.open({ onClose: complete => markSeen('student', complete) }); }
    if (seen(config.role)) return false;
    const workspace = document.querySelector('#teacher-workspace');
    if (config.role === 'admin' && workspace?.hidden) return false;
    return open('tour');
  }
  function performAction(item, role) {
    if (!canAction(item, role)) return;
    const callback = role === 'student' ? config.onNavigate : config.onAdminTab;
    const destination = role === 'student' ? item.target : item.tab;
    close();
    try { const result = callback(destination); if (result && typeof result.catch === 'function') result.catch(() => {}); } catch (_) { /* Help does not submit forms or force navigation on failure. */ }
  }
  function onClick(event) {
    const button = event.target.closest('button,a');
    if (!button) { if (opened && event.target.hasAttribute?.('data-aj-help-backdrop')) close(); return; }
    if (button.hasAttribute('data-help')) { event.preventDefault(); open('help'); return; }
    if (button.hasAttribute('data-tutorial')) { event.preventDefault(); if (config?.role === 'student' && window.AJTutorial) { if (opened) close(); window.AJTutorial.open(); } else open('tour'); return; }
    if (!opened || !root?.contains(button)) return;
    if (button.hasAttribute('data-aj-help-close') || button.hasAttribute('data-aj-help-skip')) { close(); return; }
    if (button.hasAttribute('data-aj-help-complete')) { close({ complete: true }); return; }
    if (button.dataset.ajHelpMode) { open(button.dataset.ajHelpMode); return; }
    if (button.hasAttribute('data-aj-help-next')) { stepIndex = Math.min(tours[config.role].length - 1, stepIndex + 1); renderTour(); return; }
    if (button.hasAttribute('data-aj-help-prev')) { stepIndex = Math.max(0, stepIndex - 1); renderTour(); return; }
    if (button.dataset.ajHelpStep !== undefined) { const next = Number(button.dataset.ajHelpStep); if (Number.isInteger(next) && next >= 0 && next < tours[config.role].length) { stepIndex = next; renderTour(); } return; }
    if (button.dataset.ajHelpRole) { helpRole = button.dataset.ajHelpRole === 'admin' ? 'admin' : 'student'; category = '전체'; renderHelp(); root.querySelector('[data-aj-help-role="' + helpRole + '"]').focus(); return; }
    if (button.dataset.ajHelpCategory) { category = button.dataset.ajHelpCategory; root.querySelectorAll('[data-aj-help-category]').forEach(item => { item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', String(item === button)); }); renderResults(); return; }
    if (button.hasAttribute('data-aj-help-clear')) { category = '전체'; query = ''; renderHelp(); root.querySelector('#aj-help-search').focus(); return; }
    if (button.dataset.ajHelpAction) {
      if (button.dataset.ajHelpAction === 'tour') performAction(tours[config.role][stepIndex], config.role);
      else { const index = Number(button.dataset.ajHelpAction); const item = faqs[index]; if (item) performAction(item, item.role); }
    }
  }
  function onInput(event) { if (opened && mode === 'help' && event.target.id === 'aj-help-search') { query = event.target.value; renderResults(); } }
  function onKeyDown(event) {
    if (!opened) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close(); return; }
    if (event.key !== 'Tab') return;
    event.stopImmediatePropagation();
    const focusable = Array.from(root.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])')).filter(element => !element.hidden && !element.closest('[hidden]'));
    if (!focusable.length) { event.preventDefault(); root.querySelector('.aj-help-dialog').focus(); return; }
    const first = focusable[0], last = focusable[focusable.length - 1], active = document.activeElement;
    if (!root.contains(active) || !focusable.includes(active)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
    else if (event.shiftKey && active === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus(); }
  }
  function init(options) {
    const next = { role: options?.role === 'admin' ? 'admin' : 'student', onNavigate: options?.onNavigate, onAdminTab: options?.onAdminTab };
    if (config) { if (config.role !== next.role) close(); config = next; return window.AJHelp; }
    config = next; getRoot();
    document.addEventListener('click', onClick); document.addEventListener('input', onInput); document.addEventListener('keydown', onKeyDown, true);
    return window.AJHelp;
  }
  function destroy() {
    close(); document.removeEventListener('click', onClick); document.removeEventListener('input', onInput); document.removeEventListener('keydown', onKeyDown, true);
    root?.remove(); root = null; config = null;
  }
  window.AJHelp = { init, maybeWelcome, open, close, destroy };
})();
