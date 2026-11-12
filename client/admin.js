(function () {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const all = selector => Array.from(document.querySelectorAll(selector));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MAX_PDF_SIZE = 20 * 1024 * 1024;
  let state = { authenticated: false, revision: null, chapters: [], expressions: [] };
  let currentTab = 'start', selectedFile = null, selectedFilePages = 0, bulkRows = [], loading = false;
  let wizardStep = 1, chapterBusy = false, fileChecking = false, fileSelection = 0;
  let previewFocus = null, teachingChannel = null, learnersController = null;
  const deleteConfirmations = new Map();

  function field(form, name) { return form.querySelector('[name="' + name + '"]'); }
  function value(form, name) { return field(form, name).value; }
  function setValue(form, name, next) { const input = field(form, name); if (input) { input.value = String(next ?? ''); window.AJFormGuidance?.refresh(input); } }
  function kstDate() { return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
  function monday() { const date = new Date(kstDate() + 'T00:00:00Z'); date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7); return date.toISOString().slice(0, 10); }
  function isoToKSTInput(iso) { const ms = Date.parse(iso); return Number.isFinite(ms) ? new Date(ms + 9 * 3600000).toISOString().slice(0, 16) : ''; }
  function kstInputToISO(local) { if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local || '')) return null; const date = new Date(local + ':00+09:00'); return Number.isFinite(date.getTime()) ? date.toISOString() : null; }
  function dateTime(iso) { const ms = Date.parse(iso); return Number.isFinite(ms) ? new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(ms)) : ''; }
  function formatSize(bytes) { return Number(bytes) >= 1024 * 1024 ? (Number(bytes) / (1024 * 1024)).toFixed(1) + ' MB' : Math.ceil(Number(bytes || 0) / 1024) + ' KB'; }
  function availableAt(record) {
    const published = record?.publishAt ? Date.parse(record.publishAt) : 0;
    const week = /^\d{4}-\d{2}-\d{2}$/.test(record?.weekStart || '') ? Date.parse(record.weekStart + 'T00:00:00+09:00') : 0;
    return Math.max(Number.isFinite(published) ? published : 0, Number.isFinite(week) ? week : 0);
  }
  function live(record) { return record?.status === 'published' && availableAt(record) <= Date.now(); }
  function chapterById(id) { return state.chapters.find(chapter => String(chapter.id) === String(id)); }
  function publication(record, isExpression) {
    if (record.status !== 'published') return { type: 'draft', label: '초안' };
    let opensAt = availableAt(record);
    if (isExpression && record.chapterId) {
      const parent = chapterById(record.chapterId);
      if (!parent || parent.status !== 'published') return { type: 'draft', label: '연결 수업 공개 대기' };
      opensAt = Math.max(opensAt, availableAt(parent));
    }
    if (opensAt > Date.now()) {
      const scheduledAt = new Date(opensAt).toISOString();
      return { type: 'scheduled', label: '예약 · ' + dateTime(scheduledAt), availableAt: scheduledAt };
    }
    return { type: 'live', label: '공개 중' };
  }
  function status(selector, message, error) { const element = $(selector); element.textContent = message; element.classList.toggle('error', !!error); }
  function showLogin(message) {
    learnersController?.destroy(); learnersController = null;
    state.authenticated = false;
    $('#teacher-workspace').hidden = true;
    $('#teacher-login').hidden = false;
    status('#login-status', message || '관리 비밀번호 입력', !!message);
  }
  function showWorkspace() { $('#teacher-login').hidden = true; $('#teacher-workspace').hidden = false; window.AJHelp?.maybeWelcome(); }

  // 큰 PDF는 3MB 조각으로 나눠 보낸 뒤 서버에서 다시 합친다 (요청 하나의 크기 제한 때문).
  async function uploadPdf(chapterId, file, pages) {
    const headers = {'Content-Type':'application/pdf','X-File-Name':encodeURIComponent(file.name),'X-Pdf-Pages':String(pages)}, PART = 3 * 1024 * 1024;
    const target = 'admin/pdf?chapterId=' + encodeURIComponent(chapterId);
    if (file.size <= PART) return request(target, undefined, {method:'POST',headers,body:file});
    const uploadId = crypto.randomUUID(), total = Math.ceil(file.size / PART);
    for (let index = 0; index < total; index++) await request('admin/pdf-part?uploadId=' + uploadId + '&index=' + index + '&total=' + total, undefined, {method:'POST',headers:{'Content-Type':'application/octet-stream'},body:file.slice(index * PART, (index + 1) * PART)});
    return request(target + '&uploadId=' + uploadId + '&parts=' + total, undefined, {method:'POST',headers});
  }
  async function request(path, body, options) {
    const config = { credentials: 'same-origin', cache: 'no-store', ...(options || {}) };
    if (body !== undefined) {
      config.method = 'POST'; config.headers = { 'Content-Type': 'application/json', ...(config.headers || {}) };
      config.body = JSON.stringify(body);
    }
    const response = await fetch('/api/' + path, config);
    let data;
    try { data = await response.json(); } catch (_) { throw new Error('서버 응답 확인 후 재시도'); }
    if (!response.ok) {
      const error = new Error(data.message || data.error || '요청 처리 실패');
      error.status = response.status;
      if (response.status === 401 && path !== 'admin/login') showLogin(state.authenticated ? '로그인 만료 · 재로그인 필요' : '');
      throw error;
    }
    return data;
  }

  function notify(revision, kind, chapterId) {
    const update = { revision: revision ?? state.revision, kind, chapterId: chapterId || null, at: Date.now() };
    try { if (!teachingChannel && window.BroadcastChannel) teachingChannel = new window.BroadcastChannel('teaching-updates'); teachingChannel?.postMessage(update); } catch (_) { /* Polling remains available. */ }
    try { localStorage.setItem('maranatha-teaching-revision', JSON.stringify(update)); } catch (_) { /* Saving does not depend on browser storage. */ }
  }
  function messageFor(record, noun, isExpression) {
    const publicationState = publication(record, isExpression);
    if (publicationState.type === 'scheduled') return noun + ' 예약 완료 · ' + dateTime(publicationState.availableAt || record.publishAt) + ' (KST) 공개 예정 · 현재 학생 비공개';
    if (publicationState.type === 'live') return noun + ' 저장 완료 · 학생 화면 공개';
    if (record.status === 'published' && isExpression && record.chapterId) return noun + ' 저장 완료 · 연결 수업 공개 대기';
    return noun + ' 초안 저장 완료 · 학생 비공개';
  }
  function replaceRecord(kind, record) {
    const index = state[kind].findIndex(item => String(item.id) === String(record.id));
    if (index >= 0) state[kind][index] = record; else state[kind].unshift(record);
  }

  async function refresh(options) {
    if (loading) return false;
    loading = true;
    try {
      const data = await request('admin/state');
      if (!data.authenticated) { showLogin(); return false; }
      state = { authenticated: true, revision: data.revision, chapters: Array.isArray(data.chapters) ? data.chapters : [], expressions: Array.isArray(data.expressions) ? data.expressions : [] };
      showWorkspace(); renderCollections();
      if (options?.initialize) { newExpression(); newChapter(); selectTab('start'); }
      if (options?.message) status('#workspace-status', options.message);
      return true;
    } catch (error) {
      if (error.status !== 401) {
        if (state.authenticated) status('#workspace-status', error.message, true);
        else status('#login-status', error.message, true);
      }
      return false;
    } finally { loading = false; }
  }

  function selectTab(tab) {
    currentTab = ['daily','chapters','learners'].includes(tab) ? tab : 'start';
    $('#start-panel').hidden = currentTab !== 'start';
    $('#daily-panel').hidden = currentTab !== 'daily'; $('#chapters-panel').hidden = currentTab !== 'chapters';
    $('#learners-panel').hidden = currentTab !== 'learners';
    $('#workspace-heading').textContent = currentTab === 'daily' ? '단어·문장 관리' : currentTab === 'chapters' ? '주간 수업 관리' : currentTab === 'learners' ? '학생 학습 현황' : '관리자 메뉴';
    all('[data-tab]').forEach(button => { const active = button.dataset.tab === currentTab; button.classList.toggle('active', active); button.setAttribute('aria-current', active ? 'page' : 'false'); });
    if (currentTab === 'learners' && state.authenticated) {
      if (learnersController) learnersController.update();
      else if (window.AdminLearners) learnersController = window.AdminLearners.mount($('#admin-learners-host'), { request });
      else $('#admin-learners-host').textContent = '학습 현황 화면 로드 실패 · 새로고침 후 재시도';
    }
    $('#teacher-main').focus({ preventScroll: true });
  }

  function renderChapterOptions() {
    ['#expression-chapter', '#bulk-chapter'].forEach(selector => {
      const select = $(selector), previous = select.value;
      select.innerHTML = '<option value="">공통 표현 · 수업 연결 없음</option>' + [...state.chapters].sort((a, b) => Number(b.number) - Number(a.number)).map(chapter => '<option value="' + esc(chapter.id) + '">' + esc(chapter.title) + (publication(chapter).type === 'live' ? '' : ' (' + esc(publication(chapter).label) + ')') + '</option>').join('');
      select.value = state.chapters.some(c => String(c.id) === previous) ? previous : '';
    });
  }
  function kindLabel(kind) { return kind === '단어' ? '매일 영단어' : '말하기 문장'; }
  function updateExpressionKind(mode) {
    const form = $('#expression-form'), kind = value(form, 'kind') === '단어' ? '단어' : '표현';
    const word = kind === '단어';
    all('[data-expression-kind]').forEach(button => { const active = button.dataset.expressionKind === kind; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
    $('#expression-en-label').textContent = word ? '영단어' : '말하기 문장';
    field(form, 'en').placeholder = word ? 'collaboration' : 'Please keep me in the loop.';
    field(form, 'ko').placeholder = word ? '협업' : '진행 상황을 공유해 주세요.';
    field(form, 'example').placeholder = word ? 'Good collaboration improves team performance.' : 'Please keep me in the loop about the schedule.';
    $('#expression-editor-title').textContent = kindLabel(kind) + (mode === 'saved' ? ' 등록 완료' : mode === 'edit' || value(form, 'id') ? ' 수정' : ' 등록');
  }
  function renderSummary() {
    const count = type => state.expressions.filter(record => publication(record, true).type === type).length;
    $('#teaching-summary').innerHTML = '<span>공개 표현 <b>' + count('live') + '</b></span><i></i><span>예약 중 <b>' + count('scheduled') + '</b></span><i></i><span>초안 <b>' + count('draft') + '</b></span>';
  }
  function renderExpressions() {
    const search = $('#expression-search').value.trim().toLowerCase();
    const filter = $('#expression-status-filter').value;
    const kindFilter = $('#expression-kind-filter').value;
    const expressions = [...state.expressions].sort((a, b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0)).filter(expression => {
      return (kindFilter === 'all' || expression.kind === kindFilter) && (filter === 'all' || publication(expression, true).type === filter) && (!search || [expression.en, expression.ko, expression.note, chapterById(expression.chapterId)?.title].join(' ').toLowerCase().includes(search));
    });
    $('#expression-count').textContent = state.expressions.length;
    $('#expression-list').innerHTML = expressions.length ? expressions.map(expression => {
      const p = publication(expression, true), chapter = chapterById(expression.chapterId);
      return '<article class="expression-item"><div class="expression-item-top"><span class="expression-meta"><b class="admin-type-badge ' + (expression.kind === '단어' ? 'word' : 'sentence') + '">' + kindLabel(expression.kind) + '</b> <span>·</span> ' + esc(expression.studyDay) + '일째 복습</span><span class="status-pill ' + p.type + '">' + esc(p.label) + '</span></div><h3 lang="en">' + esc(expression.en) + '</h3><p class="item-meaning">' + esc(expression.ko) + '</p>' + (expression.note ? '<p class="expression-note">' + esc(expression.note) + '</p>' : '') + '<div class="item-footer"><span class="item-chapter">' + (chapter ? esc(chapter.title) : '오늘의 표현') + '</span><div class="item-actions"><button type="button" data-edit-expression="' + esc(expression.id) + '">수정</button><button type="button" data-toggle-expression="' + esc(expression.id) + '">' + (expression.status === 'published' ? '비공개' : '학생 공개') + '</button><button class="delete" type="button" data-delete-expression="' + esc(expression.id) + '">삭제</button></div></div></article>';
    }).join('') : '<div class="empty-state"><span>Aa</span><h3>' + (state.expressions.length ? '검색 결과 없음' : '등록한 표현 없음') + '</h3><p>' + (state.expressions.length ? '검색어·공개 상태 확인' : '영어·한국어 뜻 입력 후 등록') + '</p></div>';
  }
  function renderChapters() {
    const currentId = value($('#chapter-form'), 'id');
    $('#chapter-count').textContent = state.chapters.length;
    $('#chapter-list').innerHTML = state.chapters.length ? [...state.chapters].sort((a, b) => Number(b.number) - Number(a.number)).map(chapter => {
      const p = publication(chapter);
      return '<button type="button" class="chapter-list-button ' + (String(chapter.id) === currentId ? 'active' : '') + '" data-edit-chapter="' + esc(chapter.id) + '"><span><b>수업 ' + esc(String(chapter.number).padStart(2, '0')) + '</b><em class="status-pill ' + p.type + '">' + esc(p.type === 'scheduled' ? '예약 중' : p.label) + '</em></span><strong>' + esc(chapter.title) + '</strong><small>' + esc(chapter.weekStart || '수업 주 미지정') + (chapter.pdf ? ' · PDF 교재' : '') + '</small></button>';
    }).join('') : '<div class="empty-state"><span>▤</span><h3>등록한 수업 없음</h3><p>제목·내용 입력 후 수업 등록</p></div>';
  }
  function renderCollections() { renderChapterOptions(); renderSummary(); renderExpressions(); renderChapters(); $('#simple-overview').textContent = '등록 자료 · 표현 ' + state.expressions.length + '개 · 수업 ' + state.chapters.length + '개'; }

  function populateDelivery(form, record, kind) {
    const scheduled = record?.status === 'published' && record.publishAt && Date.parse(record.publishAt) > Date.now();
    setValue(form, 'delivery', !record ? 'now' : record.status !== 'published' ? 'draft' : scheduled ? 'scheduled' : 'now');
    setValue(form, 'publishAt', scheduled ? isoToKSTInput(record.publishAt) : '');
    updateSchedule(form, kind);
  }
  function updateSchedule(form, kind) {
    const mode = value(form, 'delivery'), input = field(form, 'publishAt');
    const wrapper = document.querySelector('[data-schedule-field="' + kind + '"]');
    wrapper.hidden = mode !== 'scheduled'; input.required = mode === 'scheduled';
    window.AJFormGuidance?.refresh(input);
    $('#' + kind + '-publish-hint').textContent = mode === 'draft' ? '초안 저장 · 학생 비공개' : mode === 'scheduled' ? '지정 시간에 공개 · 한국 시간(KST) 기준' : kind === 'expression' ? '학생 단어장에 공개 · 연결 수업의 공개 날짜 적용' : '수업 등록 후 선택 주차에 공개';
    if (kind === 'expression') $('#save-expression').textContent = mode === 'draft' ? '초안 저장' : mode === 'scheduled' ? '예약 등록 ↗' : '학생 공개 ↗';
    else { $('#save-chapter').textContent = mode === 'draft' ? '초안 저장' : '수업 등록 ↗'; if (wizardStep === 3) renderWizardSummary(); }
  }
  function deliveryPayload(form) {
    const mode = value(form, 'delivery');
    if (mode === 'scheduled') {
      const publishAt = kstInputToISO(value(form, 'publishAt'));
      if (!publishAt || Date.parse(publishAt) <= Date.now()) throw new Error('예약 날짜·시간 확인 · 한국 시간 기준 미래 시각 필요');
      return { status: 'published', publishAt };
    }
    return { status: mode === 'now' ? 'published' : 'draft', publishAt: null };
  }
  function newExpression() {
    const form = $('#expression-form');
    ['id', 'en', 'ko', 'note', 'example'].forEach(name => setValue(form, name, ''));
    setValue(form, 'chapterId', ''); setValue(form, 'studyDay', '1'); setValue(form, 'kind', '단어');
    populateDelivery(form, null, 'expression');
    updateExpressionKind('new'); $('#expression-advanced').open = false; status('#expression-status', '');
  }
  function editExpression(id) {
    const expression = state.expressions.find(item => String(item.id) === String(id));
    if (!expression) return;
    const form = $('#expression-form');
    ['id', 'en', 'ko', 'note', 'kind', 'example', 'studyDay'].forEach(name => setValue(form, name, expression[name] ?? ''));
    setValue(form, 'chapterId', expression.chapterId || ''); populateDelivery(form, expression, 'expression');
    updateExpressionKind('edit'); status('#expression-status', '영어·한국어 뜻 수정 후 저장');
    selectTab('daily'); form.scrollIntoView?.({ behavior: 'smooth', block: 'start' }); field(form, 'en').focus();
  }
  function expressionPayload(form) {
    return { ...(value(form, 'id') ? { id: value(form, 'id') } : {}), chapterId: value(form, 'chapterId') || null, en: value(form, 'en').trim(), ko: value(form, 'ko').trim(), note: value(form, 'note').trim(), kind: value(form, 'kind'), example: value(form, 'example').trim(), studyDay: Number(value(form, 'studyDay')), ...deliveryPayload(form) };
  }
  async function saveExpression() {
    const form = $('#expression-form');
    if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;
    const button = $('#save-expression'); button.disabled = true; status('#expression-status', '표현 저장 중');
    try {
      const result = await request('admin/expression', expressionPayload(form));
      replaceRecord('expressions', result.expression); state.revision = result.revision;
      setValue(form, 'id', result.expression.id); updateExpressionKind('saved');
      renderCollections(); status('#expression-status', messageFor(result.expression, kindLabel(result.expression.kind), true));
      notify(result.revision, 'expression', result.expression.chapterId);
    } catch (error) { status('#expression-status', error.message, true); }
    finally { button.disabled = false; }
  }
  async function toggleExpression(id, button) {
    const expression = state.expressions.find(item => String(item.id) === String(id));
    if (!expression) return;
    button.disabled = true;
    try {
      const result = await request('admin/expression', { ...expression, status: expression.status === 'published' ? 'draft' : 'published', publishAt: null });
      replaceRecord('expressions', result.expression); state.revision = result.revision;
      if (value($('#expression-form'), 'id') === String(id)) populateDelivery($('#expression-form'), result.expression, 'expression');
      renderCollections(); status('#workspace-status', messageFor(result.expression, kindLabel(result.expression.kind), true)); notify(result.revision, 'expression', result.expression.chapterId);
    } catch (error) { status('#workspace-status', error.message, true); if (button.isConnected) button.disabled = false; }
  }
  async function deleteExpression(id, button) {
    if (!deleteConfirmations.has(String(id))) {
      button.textContent = '한 번 더 눌러 삭제'; button.classList.add('delete-confirm');
      deleteConfirmations.set(String(id), setTimeout(() => { deleteConfirmations.delete(String(id)); if (button.isConnected) { button.textContent = '삭제'; button.classList.remove('delete-confirm'); } }, 5000));
      return;
    }
    clearTimeout(deleteConfirmations.get(String(id))); deleteConfirmations.delete(String(id)); button.disabled = true;
    try {
      const result = await request('admin/expression/delete', { id });
      state.expressions = state.expressions.filter(item => String(item.id) !== String(id)); state.revision = result.revision;
      if (value($('#expression-form'), 'id') === String(id)) newExpression();
      renderCollections(); status('#workspace-status', '표현 삭제 완료 · 학생 화면 제외'); notify(result.revision, 'expression-delete');
    } catch (error) { status('#workspace-status', error.message, true); if (button.isConnected) button.disabled = false; }
  }

  function newChapter() {
    if (chapterBusy) { status('#chapter-status', '수업 등록 중 · 완료 후 재시도'); return; }
    const form = $('#chapter-form');
    ['id', 'title', 'body'].forEach(name => setValue(form, name, ''));
    setValue(form, 'number', Math.min(999, Math.max(0, ...state.chapters.map(c => Number(c.number) || 0)) + 1));
    setValue(form, 'weekStart', monday()); populateDelivery(form, null, 'chapter');
    $('#chapter-editor-title').textContent = '수업 등록'; $('#chapter-advanced').open = false; $('#wizard-success').hidden = true; status('#chapter-status', ''); resetPDFSelection(); renderPDF(null); renderChapters(); syncWeekChoice(); showWizardStep(1);
  }
  function editChapter(id) {
    if (chapterBusy) { status('#chapter-status', '수업 등록 중 · 완료 후 재시도'); return; }
    const chapter = chapterById(id); if (!chapter) return;
    const form = $('#chapter-form');
    ['id', 'number', 'title', 'weekStart', 'body'].forEach(name => setValue(form, name, chapter[name] ?? ''));
    populateDelivery(form, chapter, 'chapter'); $('#chapter-editor-title').textContent = '수업 수정'; $('#wizard-success').hidden = true;
    status('#chapter-status', '내용·교재 수정 후 수업 등록'); resetPDFSelection(); renderPDF(chapter); renderChapters(); syncWeekChoice(); showWizardStep(1);
    selectTab('chapters');
  }
  function nextMonday() { const date = new Date(monday() + 'T00:00:00Z'); date.setUTCDate(date.getUTCDate() + 7); return date.toISOString().slice(0,10); }
  function syncWeekChoice() {
    const chosen = value($('#chapter-form'), 'weekStart');
    $('#chapter-week-choice').value = chosen === monday() ? 'this' : chosen === nextMonday() ? 'next' : 'custom';
    $('#chapter-week-description').textContent = chosen > kstDate() ? chosen.replaceAll('-', '.') + ' 공개 예정' : '수업 등록 후 학생 공개';
  }
  function chapterPayload() {
    const form = $('#chapter-form');
    return { ...(value(form, 'id') ? {id:value(form, 'id')} : {}), number:Number(value(form, 'number')), title:value(form, 'title').trim(), weekStart:value(form, 'weekStart'), body:value(form, 'body'), ...deliveryPayload(form) };
  }
  function validateChapterDetails(requireMaterial) {
    const form = $('#chapter-form');
    if (!value(form, 'title').trim()) { showWizardStep(1); status('#chapter-status', '수업 제목 입력 필요', true); field(form, 'title').focus(); return false; }
    const number = Number(value(form, 'number'));
    if (!Number.isInteger(number) || number < 1 || number > 999 || !/^\d{4}-\d{2}-\d{2}$/.test(value(form, 'weekStart'))) {
      showWizardStep(1); $('#chapter-advanced').open = true; status('#chapter-status', '추가 설정의 수업 번호·시작 날짜 확인', true); return false;
    }
    if (fileChecking) { status('#chapter-status', 'PDF 확인 중 · 완료 후 재시도'); return false; }
    if (requireMaterial && !value(form, 'body').trim() && !selectedFile && !chapterById(value(form, 'id'))?.pdf) {
      showWizardStep(1); status('#chapter-status', '수업 내용 또는 PDF 교재 필요', true); field(form, 'body').focus(); return false;
    }
    try { deliveryPayload(form); } catch (error) { showWizardStep(1); $('#chapter-advanced').open = true; status('#chapter-status', error.message, true); return false; }
    return true;
  }
  function showWizardStep(step) {
    wizardStep = Math.max(1, Math.min(3, Number(step) || 1));
    all('[data-wizard-step]').forEach(panel => panel.hidden = Number(panel.dataset.wizardStep) !== wizardStep);
    all('[data-wizard-indicator]').forEach(item => { const number = Number(item.dataset.wizardIndicator); item.classList.toggle('active', number === wizardStep); item.classList.toggle('complete', number < wizardStep); item.setAttribute('aria-current', number === wizardStep ? 'step' : 'false'); });
    if (wizardStep === 3) renderWizardSummary();
  }
  function goWizardStep(step) {
    if (chapterBusy) return;
    if (Number(step) > wizardStep && !validateChapterDetails(false)) return;
    status('#chapter-status', ''); $('#wizard-success').hidden = true; showWizardStep(step);
    const panel = document.querySelector('[data-wizard-step="' + wizardStep + '"]');
    panel.querySelector('input,textarea,button,[tabindex]')?.focus();
  }
  function renderWizardSummary() {
    const form = $('#chapter-form'), current = chapterById(value(form, 'id'));
    const mode = value(form, 'delivery'), publishAt = kstInputToISO(value(form, 'publishAt'));
    const opensAt = availableAt({weekStart:value(form, 'weekStart'),publishAt});
    const delivery = mode === 'draft' ? '초안 저장 · 학생 비공개' : opensAt > Date.now() ? dateTime(new Date(opensAt).toISOString()) + ' 공개 예정' : '등록 후 학생 공개';
    const body = value(form, 'body').trim();
    $('#wizard-summary').innerHTML = '<div class="summary-field"><span>수업 제목</span><strong>' + esc(value(form,'title') || '제목 입력 필요') + '</strong></div><div class="summary-field"><span>수업 내용</span><p>' + esc(body ? body.slice(0,400) + (body.length>400?'…':'') : 'PDF 교재 사용') + '</p></div><div class="summary-field"><span>PDF 교재</span><p>' + esc(selectedFile ? selectedFile.name + ' · ' + formatSize(selectedFile.size) : current?.pdf?.name || '없음 · 수업 본문 사용') + '</p></div><div class="summary-field"><span>공개 시점</span><p>' + esc(delivery) + '</p></div>';
  }
  async function saveChapter() {
    const form = $('#chapter-form');
    if (chapterBusy || !validateChapterDetails(true)) return;
    if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;
    chapterBusy = true;
    const button = $('#save-chapter'), originalLabel = button.textContent;
    const controls = Array.from(form.querySelectorAll('input,select,textarea,button'));
    const disabledStates = new Map(controls.map(control => [control,control.disabled]));
    controls.forEach(control => control.disabled = true);
    button.textContent = '수업 등록 중'; $('#wizard-success').hidden = true;
    let uploadedChapter = null;
    try {
      const payload = chapterPayload(), file = selectedFile;
      let chapter = chapterById(payload.id);
      if (!payload.id && file) {
        status('#chapter-status', '수업 초안 저장 중 · 학생 비공개');
        const created = await request('admin/chapter', {...payload,status:'draft',publishAt:null});
        chapter = created.chapter; replaceRecord('chapters',chapter); state.revision = created.revision;
        setValue(form,'id',chapter.id); payload.id = chapter.id;
      }
      if (file) {
        status('#chapter-status', 'PDF 교재 업로드 중');
        chapter = await uploadSelectedPDF(chapter, file);
        uploadedChapter = chapter;
        resetPDFSelection(); renderPDF(chapter);
      }
      status('#chapter-status', payload.status === 'draft' ? '초안 저장 중' : '수업 공개 처리 중');
      const result = await request('admin/chapter', {...payload,...(payload.id?{id:payload.id}:{})});
      replaceRecord('chapters', result.chapter); state.revision = result.revision;
      setValue(form, 'id', result.chapter.id); $('#chapter-editor-title').textContent = '수업 등록 완료';
      renderCollections(); renderPDF(result.chapter); renderWizardSummary();
      const message = messageFor(result.chapter, '수업', false);
      status('#chapter-status', message); $('#wizard-success-message').textContent = message; $('#wizard-success').hidden = false;
      notify(result.revision, 'chapter', result.chapter.id);
    } catch (error) {
      const partial = !uploadedChapter ? '' : live(uploadedChapter) ? 'PDF 교체는 학생 화면에 반영됨 · 수업 내용 저장 미완료 · ' : uploadedChapter.status === 'published' ? 'PDF 교체 저장 완료 · ' + dateTime(new Date(availableAt(uploadedChapter)).toISOString()) + ' (KST) 공개 예약 유지 · 수업 내용 저장 미완료 · ' : 'PDF 저장 완료 · 수업 공개 미완료 · 학생 비공개 · ';
      status('#chapter-status', partial + error.message + ' · 입력 내용 유지 · 수업 등록 재시도', true);
      renderChapters();
    } finally {
      chapterBusy = false; disabledStates.forEach((disabled,control) => control.disabled = disabled);
      button.disabled = false; button.textContent = originalLabel; renderPDF(chapterById(value(form,'id')));
    }
  }
  function safeLocalURL(path) { try { const url = new URL(path, window.location.origin); return url.origin === window.location.origin && ['http:', 'https:'].includes(url.protocol) ? url.pathname + url.search + url.hash : ''; } catch (_) { return ''; } }
  function renderPDF(chapter) {
    const exists = !!chapter?.id, pdf = chapter?.pdf;
    $('#pdf-file').disabled = chapterBusy; $('#pdf-drop-zone').setAttribute('aria-disabled', String(chapterBusy));
    $('#pdf-instruction').textContent = pdf ? 'PDF 교체 시 기존 페이지 필기 유지 · 다른 교재는 새 수업 등록' : 'PDF 선택 사항 · 본문만 등록 가능';
    $('#pdf-current').hidden = !pdf;
    $('#pdf-current').innerHTML = pdf ? '<b>현재 교재</b><span>' + esc(pdf.name) + '</span><small>' + formatSize(pdf.size) + (pdf.pages ? ' · ' + Number(pdf.pages) + '쪽' : '') + '</small>' : '';
    const url = pdf ? safeLocalURL(pdf.url) : '';
    $('#pdf-open-link').hidden = !url; $('#pdf-open-link').href = url || '#';
    $('#chapter-student-link').hidden = !exists || !live(chapter);
    $('#chapter-student-link').href = exists ? '/?chapter=' + encodeURIComponent(chapter.id) + '#slides' : '/';
    const savePDFButton = document.querySelector('[data-upload-pdf]');
    savePDFButton.disabled = chapterBusy || fileChecking || !selectedFile;
    savePDFButton.textContent = chapterBusy ? 'PDF 저장 중' : pdf ? 'PDF 교체 저장' : 'PDF 저장';
    const opensAt = chapter ? availableAt(chapter) : 0;
    $('#pdf-save-scope').textContent = !pdf ? 'PDF 저장은 파일 보관 · 학생 공개는 3단계 수업 등록' : live(chapter) ? '파일 저장 완료 · 학생 화면 공개 중' : chapter.status === 'published' ? '파일 저장 완료 · 현재 학생 비공개 · ' + dateTime(new Date(opensAt).toISOString()) + ' (KST) 공개 예정' : '파일 저장 완료 · 학생 비공개 · 3단계 수업 등록 필요';
    $('#pdf-publication-settings').hidden = !pdf || live(chapter);
    $('#pdf-student-link').hidden = !pdf || !live(chapter);
    $('#pdf-student-link').href = exists ? '/?chapter=' + encodeURIComponent(chapter.id) + '#slides' : '/';
    document.querySelector('[data-clear-pdf]').hidden = !selectedFile;
    $('#wizard-pdf-next').textContent = pdf && chapter.status === 'draft' ? '3단계 수업 등록 →' : selectedFile ? 'PDF·등록 내용 확인 →' : '등록 내용 확인 →';
    $('#wizard-pdf-next').disabled = chapterBusy || fileChecking;
  }
  function resetPDFSelection() {
    fileSelection++; fileChecking = false;
    selectedFile = null; selectedFilePages = 0; $('#pdf-file').value = ''; $('#pdf-selection').hidden = true; $('#pdf-selection').textContent = '';
    document.querySelector('[data-upload-pdf]').disabled = true; status('#pdf-status', '');
    document.querySelector('[data-clear-pdf]').hidden = true;
    $('#wizard-pdf-next').textContent = '등록 내용 확인 →';
  }
  async function selectPDF(file) {
    if (chapterBusy) return;
    if (!file) return;
    if ((!/\.pdf$/i.test(file.name || '') && file.type !== 'application/pdf') || file.size > MAX_PDF_SIZE || file.size === 0) { resetPDFSelection(); status('#pdf-status', file.size > MAX_PDF_SIZE ? 'PDF 파일 한도: 20 MB' : 'PDF 파일 선택 필요', true); return; }
    const selection = ++fileSelection; fileChecking = true;
    status('#pdf-status', 'PDF 내용·페이지 확인 중'); renderPDF(chapterById(value($('#chapter-form'),'id')));
    try {
      if (!window.PDFValidation?.inspect) throw new Error('PDF 검사 모듈 로드 실패 · 새로고침 후 재시도');
      const result = await window.PDFValidation.inspect(file);
      if (selection !== fileSelection) return;
      if (!Number.isInteger(result.pages) || result.pages < 1 || result.pages > 2000) throw new Error('PDF 페이지 확인 후 다시 선택');
      selectedFile = file; selectedFilePages = result.pages; $('#pdf-selection').hidden = false; $('#pdf-selection').textContent = file.name + ' · ' + formatSize(file.size) + ' · ' + result.pages + '쪽 · 미저장';
      status('#pdf-status', 'PDF 확인 완료 · 아직 미저장 · PDF 저장 또는 마지막 단계의 수업 등록');
    } catch (error) { if (selection === fileSelection) { resetPDFSelection(); status('#pdf-status', error.message || '파일 읽기 실패', true); } }
    finally { if (selection === fileSelection) { fileChecking = false; renderPDF(chapterById(value($('#chapter-form'),'id'))); } }
  }
  async function uploadSelectedPDF(chapter, file) {
    if (!chapter?.id || !file) throw new Error('수업 제목·PDF 확인');
    if (file !== selectedFile || !Number.isInteger(selectedFilePages) || selectedFilePages < 1) throw new Error('PDF 내용 확인 후 다시 선택');
    const result = await uploadPdf(chapter.id, file, selectedFilePages);
    const updated = {...chapter,pdf:result.pdf}; replaceRecord('chapters',updated); state.revision = result.revision;
    return updated;
  }
  async function uploadPDF() {
    if (chapterBusy) return;
    let chapter = chapterById(value($('#chapter-form'), 'id')); const file = selectedFile;
    if (!file) { status('#pdf-status', 'PDF 파일 선택 필요', true); return; }
    if (!validateChapterDetails(false)) return;
    const button = document.querySelector('[data-upload-pdf]'); button.disabled = true; status('#pdf-status', 'PDF 업로드 중 · 완료까지 화면 유지');
    chapterBusy = true;
    renderPDF(chapter);
    try {
      if (!chapter) {
        const created = await request('admin/chapter',{...chapterPayload(),status:'draft',publishAt:null});
        chapter = created.chapter; replaceRecord('chapters',chapter); state.revision = created.revision; setValue($('#chapter-form'),'id',chapter.id);
      }
      const updatedChapter = await uploadSelectedPDF(chapter,file);
      if (String(chapter.id) === value($('#chapter-form'), 'id')) { resetPDFSelection(); renderPDF(updatedChapter); }
      renderChapters();
      status('#pdf-status', live(updatedChapter) ? '파일 저장 완료 · 학생 화면 공개' : updatedChapter.status === 'published' ? '파일 저장 완료 · 현재 학생 비공개 · ' + dateTime(new Date(availableAt(updatedChapter)).toISOString()) + ' (KST) 공개 예정' : '파일 저장 완료 · 학생 비공개 · 3단계 수업 등록 필요');
      notify(state.revision,'pdf',chapter.id);
    } catch (error) { status('#pdf-status', error.message, true); }
    finally { chapterBusy = false; renderPDF(chapterById(value($('#chapter-form'),'id'))); }
  }
  function previewChapter() {
    const form = $('#chapter-form'); previewFocus = document.activeElement;
    $('#preview-chapter-number').textContent = 'CHAPTER ' + value(form, 'number') + ' · ' + value(form, 'weekStart');
    $('#preview-title').textContent = value(form, 'title').trim() || '수업 제목 입력 필요';
    const body = value(form, 'body').trim();
    $('#preview-body').innerHTML = body ? body.split(/\n{2,}/).map(paragraph => {
      if (/^#{1,3}\s/.test(paragraph)) { const lines = paragraph.split('\n'); return '<h3>' + esc(lines.shift().replace(/^#{1,3}\s+/, '')) + '</h3>' + (lines.length ? '<p>' + esc(lines.join('\n')) + '</p>' : ''); }
      if (paragraph.split('\n').every(line => /^[-*]\s/.test(line))) return '<ul>' + paragraph.split('\n').map(line => '<li>' + esc(line.replace(/^[-*]\s+/, '')) + '</li>').join('') + '</ul>';
      return '<p>' + esc(paragraph) + '</p>';
    }).join('') : '<p class="preview-empty">수업 내용 미리보기</p>';
    $('#chapter-preview').hidden = false; document.body.classList.add('preview-open'); document.querySelector('[data-close-preview]').focus();
  }
  function closePreview() { $('#chapter-preview').hidden = true; document.body.classList.remove('preview-open'); if (previewFocus?.isConnected) previewFocus.focus(); }

  function previewBulk() {
    bulkRows = $('#bulk-input').value.split(/\r?\n/).map((line, index) => ({ line, number: index + 1 })).filter(item => item.line.trim()).map(item => {
      const cells = item.line.split('\t');
      const en = (cells[0] || '').trim(), ko = (cells[1] || '').trim(), note = cells.slice(2).join('\t').trim();
      return { number: item.number, en, ko, note, valid: !!en && !!ko && en.length <= 500 && ko.length <= 1000 && note.length <= 2000, saved: false };
    });
    renderBulk();
    const valid = bulkRows.length && bulkRows.length <= 30 && bulkRows.every(row => row.valid);
    document.querySelector('[data-save-bulk]').disabled = !valid;
    status('#bulk-status', !bulkRows.length ? '등록할 표현 붙여넣기 필요' : bulkRows.length > 30 ? '한 번에 최대 30개 등록 가능' : valid ? bulkRows.length + '개 표현 확인 완료 · 공개 설정 후 저장' : '영어·한국어 뜻 누락 또는 길이 초과 · 해당 줄 확인', !valid);
  }
  function renderBulk() {
    $('#bulk-preview').innerHTML = bulkRows.length ? '<table class="bulk-preview-table"><thead><tr><th>줄</th><th>분류</th><th>영어</th><th>한국어 뜻</th><th>상태</th></tr></thead><tbody>' + bulkRows.map(row => '<tr><td>' + row.number + '</td><td>' + kindLabel(row.savedKind || $('#bulk-kind').value) + '</td><td>' + esc(row.en) + '</td><td>' + esc(row.ko) + '</td><td class="' + (row.saved ? 'saved' : row.valid ? '' : 'invalid') + '">' + (row.saved ? '✓ 저장 완료' : row.valid ? '등록 가능' : '확인 필요') + '</td></tr>').join('') + '</tbody></table>' : '';
  }
  async function saveBulk() {
    if (!bulkRows.length || bulkRows.length > 30 || !bulkRows.every(row => row.valid)) { previewBulk(); return; }
    const button = document.querySelector('[data-save-bulk]'); button.disabled = true;
    let savedCount = bulkRows.filter(row => row.saved).length;
    const chapterId = $('#bulk-chapter').value || null, published = $('#bulk-delivery').value === 'now';
    const kind = $('#bulk-kind').value === '단어' ? '단어' : '표현';
    try {
      for (const row of bulkRows.filter(item => !item.saved)) {
        status('#bulk-status', '표현 저장 중 · ' + savedCount + ' / ' + bulkRows.length);
        const result = await request('admin/expression', { chapterId, en: row.en, ko: row.ko, note: row.note, kind, example: '', studyDay: Number($('#bulk-day').value), status: published ? 'published' : 'draft', publishAt: null });
        replaceRecord('expressions', result.expression); state.revision = result.revision; row.saved = true; row.savedKind = result.expression.kind; savedCount++; renderBulk(); notify(result.revision, 'expression', chapterId);
      }
      renderCollections();
      const blocked = published && chapterId && !live(chapterById(chapterId));
      status('#bulk-status', savedCount + '개 표현 저장 완료 · ' + (published && !blocked ? '학생 화면 공개' : blocked ? '연결 수업 공개 대기' : '초안 저장 완료'));
    } catch (error) { renderCollections(); status('#bulk-status', savedCount + '개 저장 후 중단 · ' + error.message + ' 남은 표현부터 재시도 가능', true); button.disabled = false; }
  }

  document.addEventListener('submit', async event => {
    const form = event.target;
    if (form.id === 'login-form') {
      event.preventDefault(); const button = $('#login-button'); button.disabled = true; status('#login-status', '로그인 중');
      try { await request('admin/login', { password: $('#admin-password').value }); $('#admin-password').value = ''; await refresh({ initialize: true }); }
      catch (error) { status('#login-status', error.message, true); $('#admin-password').value = ''; $('#admin-password').focus(); }
      finally { button.disabled = false; }
    } else if (form.id === 'expression-form') { event.preventDefault(); await saveExpression(); }
    else if (form.id === 'chapter-form') { event.preventDefault(); if (wizardStep < 3) goWizardStep(wizardStep + 1); else await saveChapter(); }
  });
  document.addEventListener('click', async event => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.dataset.tab) { selectTab(button.dataset.tab); return; }
    if (button.dataset.expressionKind) { setValue($('#expression-form'), 'kind', button.dataset.expressionKind === '단어' ? '단어' : '표현'); updateExpressionKind(); return; }
    if (button.hasAttribute('data-start-expression')) { newExpression(); $('#expression-collection').hidden = true; $('.simple-editor-layout').classList.remove('list-open'); selectTab('daily'); field($('#expression-form'),'en').focus(); return; }
    if (button.hasAttribute('data-start-chapter')) { newChapter(); $('#chapter-collection').hidden = true; $('.simple-chapter-workspace').classList.remove('list-open'); selectTab('chapters'); field($('#chapter-form'),'title').focus(); return; }
    if (button.hasAttribute('data-toggle-expression-list') || button.hasAttribute('data-show-expressions')) { const collection = $('#expression-collection'); collection.hidden = button.hasAttribute('data-show-expressions') ? false : !collection.hidden; $('.simple-editor-layout').classList.toggle('list-open',!collection.hidden); selectTab('daily'); return; }
    if (button.hasAttribute('data-toggle-chapter-list') || button.hasAttribute('data-show-chapters')) { const collection = $('#chapter-collection'); collection.hidden = button.hasAttribute('data-show-chapters') ? false : !collection.hidden; $('.simple-chapter-workspace').classList.toggle('list-open',!collection.hidden); selectTab('chapters'); return; }
    if (button.dataset.wizardNext || button.dataset.wizardPrev) { goWizardStep(button.dataset.wizardNext || button.dataset.wizardPrev); return; }
    if (button.hasAttribute('data-clear-pdf')) { if (!chapterBusy) { resetPDFSelection(); renderPDF(chapterById(value($('#chapter-form'),'id'))); if (wizardStep === 3) renderWizardSummary(); } return; }
    if (button.id === 'logout-button') {
      button.disabled = true;
      try { await request('admin/logout', {}); state = { authenticated: false, chapters: [], expressions: [], revision: null }; showLogin(); status('#login-status', '로그아웃 완료'); }
      catch (error) { status('#workspace-status', error.message, true); }
      finally { button.disabled = false; }
      return;
    }
    if (button.hasAttribute('data-refresh')) { await refresh({ message: '자료 목록 새로고침 완료' }); return; }
    if (button.hasAttribute('data-new-expression') || button.hasAttribute('data-reset-expression')) { newExpression(); selectTab('daily'); field($('#expression-form'), 'en').focus(); return; }
    if (button.dataset.editExpression) { editExpression(button.dataset.editExpression); return; }
    if (button.dataset.toggleExpression) { await toggleExpression(button.dataset.toggleExpression, button); return; }
    if (button.dataset.deleteExpression) { await deleteExpression(button.dataset.deleteExpression, button); return; }
    if (button.hasAttribute('data-new-chapter')) { newChapter(); selectTab('chapters'); field($('#chapter-form'), 'title').focus(); return; }
    if (button.dataset.editChapter) { editChapter(button.dataset.editChapter); return; }
    if (button.hasAttribute('data-preview-chapter')) { previewChapter(); return; }
    if (button.hasAttribute('data-pdf-publication-settings')) { if (!chapterBusy) { showWizardStep(1); $('#chapter-advanced').open = true; field($('#chapter-form'), 'delivery').focus(); } return; }
    if (button.hasAttribute('data-close-preview')) { closePreview(); return; }
    if (button.hasAttribute('data-upload-pdf')) { await uploadPDF(); return; }
    if (button.hasAttribute('data-preview-bulk')) { previewBulk(); return; }
    if (button.hasAttribute('data-save-bulk')) { await saveBulk(); }
  });
  document.addEventListener('change', event => {
    if (event.target.dataset.scheduleSelect) updateSchedule(event.target.closest('form'), event.target.dataset.scheduleSelect);
    if (event.target.id === 'expression-status-filter' || event.target.id === 'expression-kind-filter') renderExpressions();
    if (event.target === field($('#expression-form'), 'kind')) updateExpressionKind();
    if (event.target.id === 'bulk-kind') { renderBulk(); $('#bulk-input').placeholder = event.target.value === '단어' ? 'collaboration\t협업' : 'Please keep me in the loop.\t진행 상황을 공유해 주세요.'; }
    if (event.target.id === 'pdf-file') selectPDF(event.target.files?.[0]);
    if (event.target.id === 'chapter-week-choice') {
      if (event.target.value === 'this') setValue($('#chapter-form'),'weekStart',monday());
      else if (event.target.value === 'next') setValue($('#chapter-form'),'weekStart',nextMonday());
      else { $('#chapter-advanced').open = true; field($('#chapter-form'),'weekStart').focus(); }
      syncWeekChoice(); if (wizardStep === 3) renderWizardSummary();
    }
    if (event.target === field($('#chapter-form'),'weekStart')) { syncWeekChoice(); if (wizardStep === 3) renderWizardSummary(); }
  });
  document.addEventListener('input', event => {
    if (event.target.id === 'expression-search') renderExpressions();
    if (event.target.id === 'bulk-input') { bulkRows = []; document.querySelector('[data-save-bulk]').disabled = true; $('#bulk-preview').innerHTML = ''; status('#bulk-status', '입력 변경 · 등록할 표현 재확인 필요'); }
  });
  const dropZone = $('#pdf-drop-zone');
  dropZone.addEventListener('click', event => { if (event.target !== $('#pdf-file') && !$('#pdf-file').disabled) $('#pdf-file').click(); });
  dropZone.addEventListener('keydown', event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); if (!$('#pdf-file').disabled) $('#pdf-file').click(); } });
  ['dragenter', 'dragover'].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); if (!$('#pdf-file').disabled) dropZone.classList.add('dragover'); }));
  ['dragleave', 'drop'].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.remove('dragover'); if (type === 'drop') selectPDF(event.dataTransfer?.files?.[0]); }));
  document.addEventListener('keydown', event => {
    if ($('#chapter-preview').hidden) return;
    if (event.key === 'Escape') closePreview();
    if (event.key === 'Tab') { event.preventDefault(); document.querySelector('[data-close-preview]').focus(); }
  });
  window.addEventListener('beforeunload', () => { learnersController?.destroy(); teachingChannel?.close(); deleteConfirmations.forEach(timer => clearTimeout(timer)); });
  $('#teacher-date').textContent = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'short' }).format(new Date());
  $('#expression-chapter').required = false; $('#bulk-chapter').required = false;
  window.TeacherAdmin = { refresh, selectTab, goWizardStep, kstInputToISO, isoToKSTInput };
  window.AJHelp?.init({role:'admin',onAdminTab:tab=>{if(!state.authenticated){$('#admin-password').focus();return;}selectTab(tab);}});
  refresh({ initialize: true });
})();
