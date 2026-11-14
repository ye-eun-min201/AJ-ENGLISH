(function () {
  'use strict';

  const MAX_PDF_BYTES = 20 * 1024 * 1024;
  const MAX_POINTS = 5000, MAX_STROKES = 1000;
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  let active = null, pdfLibraryPromise = null;

  function cloneStrokes(strokes) {
    return (Array.isArray(strokes) ? strokes : []).filter(stroke => stroke && Array.isArray(stroke.points)).slice(0, MAX_STROKES).map(stroke => ({
      tool: ['pen', 'highlighter', 'eraser'].includes(stroke.tool) ? stroke.tool : 'pen',
      color: /^#[0-9a-f]{6}$/i.test(stroke.color || '') ? stroke.color : '#f15f43',
      width: clamp(Number(stroke.width) || .004, .0001, 1),
      points: stroke.points.filter(point => point && Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.y))).map(point => ({ x: clamp(Number(point.x), 0, 1), y: clamp(Number(point.y), 0, 1) }))
    })).filter(stroke => stroke.points.length);
  }

  async function library() {
    if (!Promise.withResolvers) Promise.withResolvers = function () { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
    if (!pdfLibraryPromise) pdfLibraryPromise = import('/vendor/pdf.min.mjs').then(pdfjs => {
      pdfjs.GlobalWorkerOptions.workerSrc = '/vendor/pdf.worker.min.mjs';
      return pdfjs;
    }).catch(error => { pdfLibraryPromise = null; throw error; });
    return pdfLibraryPromise;
  }

  function mount(container, options = {}) {
    if (!container || !container.querySelector) throw new Error('ClassroomSlides requires a container.');
    if (active) active.destroy();
    let chapters = Array.isArray(options.chapters) ? options.chapters.slice() : [];
    let destroyed = false, documentGeneration = 0, renderGeneration = 0, noteGeneration = 0;
    let pdfDoc = null, loadingTask = null, renderTask = null, fetchController = null, resizeObserver = null;
    let autoSaveTimer = null, resizeTimer = null, currentStroke = null, drawingPointer = null;
    let saveQueue = Promise.resolve(true), queuedSignature = '', queuedResult = null;
    const thumbnailTasks = new Set(), cleanup = [], thumbnailsRendered = new Set();
    let thumbnailObserver = null, thumbnailQueue = [];
    const state = { chapter: null, page: 1, totalPages: 1, loading: false, transitioning: false, rendering: false, notesLoading: true, notesError: false, text: '', strokes: [], undo: [], redo: [], revision: 0, dirty: false, saving: false, saveError: '', updatedAt: null, tool: 'hand', color: '#f15f43', width: 3, zoom: 'fit', viewport: null, pixelRatio: 1, lastViewed: '' };
    const authenticated = options.authenticated === true;
    const request = options.api || (async (path, body) => {
      const response = await fetch('/api/' + path, { method: body ? 'POST' : 'GET', credentials: 'same-origin', headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || '요청을 처리하지 못했습니다.');
      return result;
    });
    // 화면 짜임: 위 = 얇은 제목 줄 / 가운데 = PDF가 넓게 / 아래에 떠 있는 필기 도구 줄 / 오른쪽 아래 = 쪽 번호
    const icon = body => '<svg viewBox="0 0 24 24" aria-hidden="true">' + body + '</svg>';
    const TOOL_ICON = {
      hand: '<path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11m0-1V4.5a1.5 1.5 0 0 1 3 0V11m0-4.5a1.5 1.5 0 0 1 3 0V13m-9-1-1.6-1.9a1.5 1.5 0 0 0-2.4 1.8L8 18.5c1 1.6 2.4 2.5 4.5 2.5h1.2c3 0 4.8-2 4.8-5V10"/>',
      pen: '<path d="M4 20l1.2-4.6L16.5 4.1a2 2 0 0 1 2.8 0l.6.6a2 2 0 0 1 0 2.8L8.6 18.8Zm10.8-14.2 3.4 3.4"/>',
      highlighter: '<path d="M9 14.5 16.8 4.6a1.6 1.6 0 0 1 2.3-.2l1 .9a1.6 1.6 0 0 1 .1 2.3L11.8 17Zm0 0-2 4.5h4l.8-2M4 21h16"/>',
      eraser: '<path d="M7.5 19.5 3.6 15.6a1.8 1.8 0 0 1 0-2.6l8.5-8.5a1.8 1.8 0 0 1 2.6 0l5.7 5.7a1.8 1.8 0 0 1 0 2.6l-6.7 6.7Zm0 0H20M8.5 8.2l7.3 7.3"/>'
    };
    container.innerHTML = '<section class="classroom-slides nb is-thumbs-collapsed" aria-label="챕터 PDF와 나의 필기">' +
      '<header class="slides-heading nb-top"><div class="nb-title"><p class="slides-eyebrow">PDF CLASSROOM</p><h2>수업 자료 · PDF 필기</h2><p class="slides-chapter-meta"></p></div><p class="slides-note-status" role="status" aria-live="polite">메모 불러오는 중</p><label class="slides-course-select">수업 챕터<select aria-label="읽을 수업 챕터"></select></label>' +
      '<div class="nb-top-actions"><label class="slides-zoom">크기 <select aria-label="PDF 확대 비율"><option value="fit">너비에 맞추기</option><option value="0.5">50%</option><option value="0.75">75%</option><option value="1">100%</option><option value="1.25">125%</option><option value="1.5">150%</option><option value="2">200%</option></select></label><button type="button" class="nb-icon" data-slide-fullscreen aria-pressed="false" aria-label="전체 화면" title="전체 화면">' + icon('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>') + '</button><a class="nb-icon slides-open-original" target="_blank" rel="noopener" aria-label="PDF 원본을 새 창에서 열기" title="원본 열기">' + icon('<path d="M14 4h6v6M20 4l-9 9M18 13.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4.5"/>') + '</a><a class="nb-icon slides-download" aria-label="PDF 내려받기" title="PDF 내려받기">' + icon('<path d="M12 4v11m0 0-4-4m4 4 4-4M5 19.5h14"/>') + '</a></div></header><nav class="slides-past" aria-label="지난 수업 다시 보기" hidden><p><strong>지난 수업 다시 보기</strong><span>공개된 수업 자료는 계속 열어 볼 수 있어요</span></p><div class="slides-past-list"></div></nav>' +
      '<div class="slides-layout"><nav class="slides-thumbnails" aria-label="PDF 페이지 미리 보기"></nav><div class="nb-work"><main class="slides-stage"><p class="slides-render-status" role="status" aria-live="polite">수업 자료 불러오는 중</p><div class="slides-paper" hidden><canvas class="slides-pdf-canvas" role="img" aria-label="수업 PDF 페이지"></canvas><canvas class="slides-ink-canvas" data-tool="hand" aria-label="PDF 위에 직접 필기하는 영역"></canvas></div><div class="slides-empty" hidden></div></main>' +
      '<div class="nb-float"><div class="nb-dock" role="toolbar" aria-label="PDF 필기 도구"><button type="button" class="nb-tool" data-ink-undo disabled aria-label="되돌리기" title="되돌리기">' + icon('<path d="M9 7 4.5 11.5 9 16M5 11.5h9a5 5 0 0 1 0 10h-2"/>') + '</button><button type="button" class="nb-tool" data-ink-redo disabled aria-label="다시 하기" title="다시 하기">' + icon('<path d="M15 7l4.5 4.5L15 16m4-4.5h-9a5 5 0 0 0 0 10h2"/>') + '</button><i class="nb-sep"></i>' +
      '<div class="slides-drawing-tools" role="group" aria-label="필기 도구 고르기">' + [['hand', '이동'], ['pen', '펜'], ['highlighter', '형광펜'], ['eraser', '지우개']].map(([tool, label]) => '<button type="button" class="nb-tool' + (tool === 'hand' ? ' active' : '') + '" data-ink-tool="' + tool + '" aria-pressed="' + (tool === 'hand') + '" title="' + label + '">' + icon(TOOL_ICON[tool]) + '<span>' + label + '</span></button>').join('') + '</div><i class="nb-sep"></i>' +
      '<div class="slides-ink-options"><div class="slides-colors" role="group" aria-label="필기 색상">' + [['#f15f43', '주황'], ['#173f91', '파랑'], ['#182b22', '검정'], ['#e5b91c', '노랑']].map(([color, label], index) => '<button type="button" class="slides-color' + (!index ? ' active' : '') + '" data-ink-color="' + color + '" style="--ink-color:' + color + '" aria-label="' + label + ' 필기" aria-pressed="' + (!index) + '"></button>').join('') + '</div><label class="slides-pen-width">굵기 <input type="range" min="1" max="8" value="3" aria-label="필기 굵기"></label></div><i class="nb-sep"></i>' +
      '<button type="button" class="nb-tool" data-ink-clear aria-label="이 쪽 필기 모두 지우기" title="이 쪽 필기 모두 지우기">' + icon('<path d="M5 7h14M10 7V4.5h4V7m-7 0 .8 11.5a1.5 1.5 0 0 0 1.5 1.5h5.400a1.5 1.5 0 0 0 1.5-1.5L17 7M10.5 11v5M13.5 11v5"/>') + '</button></div>' +
      '<div class="nb-pager" role="group" aria-label="쪽 이동"><label class="slides-page-input"><input type="number" min="1" value="1" aria-label="PDF 페이지 번호"><span><b class="slides-page-total">1</b></span></label><button type="button" data-slide-prev aria-label="이전 페이지" title="이전 페이지">' + icon('<path d="m6 14.5 6-6 6 6"/>') + '</button><button type="button" data-slide-next aria-label="다음 페이지" title="다음 페이지">' + icon('<path d="m6 9.5 6 6 6-6"/>') + '</button></div></div></div>' +
      '<aside class="slides-notes-panel"><div class="slides-note-label"><h3>글 메모</h3><span class="slides-note-page">PAGE 1</span></div><p class="slides-storage-label">' + (authenticated ? '내 계정 비공개 저장 · 다른 수강생 열람 불가' : '이 기기에 저장 · 로그인 후 계정 저장 가능') + '</p><p class="slides-help">PDF 위에는 아래 도구 줄의 펜으로 쓰고, 여기에는 글로 적어요.</p><label class="slides-text-label">표현 · 문장 메모<textarea class="slides-note-text" maxlength="10000" placeholder="핵심 표현 · 질문 · 나의 문장" disabled></textarea></label><div class="slides-save-row"><button type="button" class="slides-button primary" data-note-save disabled>메모 저장</button></div><button type="button" class="slides-button small slides-note-retry" data-note-retry hidden>메모 다시 불러오기</button></aside></div>' +
      '<section class="slides-content-body" hidden><p class="slides-eyebrow">CHAPTER NOTES</p><h3>챕터 수업 내용</h3><div></div></section></section>';
    const root = container.querySelector('.classroom-slides');
    const $ = selector => root.querySelector(selector);
    const select = $('.slides-course-select select'), pageInput = $('.slides-page-input input'), zoomSelect = $('.slides-zoom select');
    const baseCanvas = $('.slides-pdf-canvas'), inkCanvas = $('.slides-ink-canvas'), paper = $('.slides-paper'), stage = $('.slides-stage'), noteInput = $('.slides-note-text'), noteStatus = $('.slides-note-status');
    const listen = (target, name, fn, configuration) => { target.addEventListener(name, fn, configuration); cleanup.push(() => target.removeEventListener(name, fn, configuration)); };
    const currentKey = () => state.chapter ? state.chapter.id + ':' + state.page : '';
    const localKey = (chapterId, page) => 'classroom-note-v1:' + chapterId + ':' + page;

    function safePdfUrl(chapter) {
      if (!chapter || !chapter.pdf || !chapter.pdf.url) return '';
      try { const url = new URL(chapter.pdf.url, window.location.href); return url.origin === window.location.origin && /^https?:$/.test(url.protocol) ? url.href : ''; } catch (_) { return ''; }
    }
    function chapterLabel(chapter) { return (chapter.number ? 'CHAPTER ' + String(chapter.number).padStart(2, '0') + ' · ' : '') + (chapter.title || '수업 자료'); }
    function updateHeader() {
      select.innerHTML = chapters.map(chapter => '<option value="' + esc(chapter.id) + '">' + esc(chapterLabel(chapter)) + '</option>').join('');
      select.disabled = !chapters.length || state.transitioning;
      const past = $('.slides-past');
      if (past) {
        past.hidden = chapters.length < 2;
        $('.slides-past-list').innerHTML = chapters.map(chapter => '<button type="button" data-slides-past="' + esc(chapter.id) + '"' + (state.chapter && state.chapter.id === chapter.id ? ' aria-current="true"' : '') + (state.transitioning ? ' disabled' : '') + '><b>' + esc(chapter.number ? String(chapter.number).padStart(2, '0') : '·') + '</b><span><strong>' + esc(chapter.title || '수업 자료') + '</strong><small>' + esc([chapter.weekStart ? chapter.weekStart + ' 주차' : '', chapter.pdf ? 'PDF' : '수업 메모'].filter(Boolean).join(' · ')) + '</small></span></button>').join('');
      }
      if (state.chapter) select.value = state.chapter.id;
      $('.slides-heading h2').textContent = state.chapter ? state.chapter.title : '공개 수업 자료 없음';
      $('.slides-chapter-meta').textContent = state.chapter ? [state.chapter.number ? '챕터 ' + state.chapter.number : '', state.chapter.weekStart ? state.chapter.weekStart + ' 주차' : '', state.chapter.pdf ? state.chapter.pdf.name : '수업 메모'].filter(Boolean).join(' · ') : '선생님 등록 자료 표시';
      const body = state.chapter && (typeof state.chapter.body === 'string' ? state.chapter.body : state.chapter.body && state.chapter.body.text || '');
      $('.slides-content-body').hidden = !body;
      $('.slides-content-body > div').textContent = body || '';
      const url = safePdfUrl(state.chapter);
      ['.slides-open-original', '.slides-download'].forEach(selector => { const link = $(selector); link.hidden = !url; if (url) link.href = url; else link.removeAttribute('href'); });
      if (state.chapter && state.chapter.pdf) $('.slides-download').setAttribute('download', state.chapter.pdf.name || 'classroom.pdf');
      pageInput.value = state.page;
      pageInput.max = state.totalPages;
      $('.slides-page-total').textContent = state.totalPages;
      $('.slides-note-page').textContent = 'PAGE ' + state.page;
      root.querySelectorAll('[data-slide-prev]').forEach(button => button.disabled = state.loading || state.transitioning || state.page <= 1);
      root.querySelectorAll('[data-slide-next]').forEach(button => button.disabled = state.loading || state.transitioning || state.page >= state.totalPages);
      pageInput.disabled = state.loading || state.transitioning || !pdfDoc;
      zoomSelect.disabled = !pdfDoc || state.loading;
      root.querySelectorAll('.slide-thumb').forEach(button => { const selected = Number(button.dataset.slidePage) === state.page; button.classList.toggle('active', selected); button.setAttribute('aria-current', selected ? 'page' : 'false'); });
    }
    function updateNoteState() {
      if (destroyed) return;
      const locked = !state.chapter || state.notesLoading || state.notesError;
      noteInput.disabled = locked;
      $('[data-note-save]').disabled = locked || (!state.dirty && !state.saveError) || state.saving;
      $('[data-ink-undo]').disabled = locked || !state.undo.length;
      $('[data-ink-redo]').disabled = locked || !state.redo.length;
      $('[data-ink-clear]').disabled = locked || !state.strokes.length;
      root.querySelectorAll('[data-ink-tool],[data-ink-color],.slides-pen-width input').forEach(control => control.disabled = locked || !pdfDoc || state.rendering);
      inkCanvas.style.pointerEvents = !locked && pdfDoc && !state.rendering && state.tool !== 'hand' ? 'auto' : 'none';
      noteStatus.className = 'slides-note-status ' + (state.saveError || state.notesError ? 'is-error' : state.saving ? 'is-saving' : state.dirty ? 'is-dirty' : 'is-saved');
      noteStatus.textContent = !state.chapter ? '수업 선택' : state.notesLoading ? '메모 불러오는 중' : state.notesError ? '메모 불러오기 실패 · 재시도' : state.saveError ? state.saveError : state.saving ? '저장 중…' : state.dirty ? '미저장 변경사항' : state.updatedAt ? (authenticated ? '내 계정에 저장됨' : '이 기기에 저장됨') : '메모 자동 저장';
      $('.slides-note-retry').hidden = !state.notesError;
    }
    function changed() {
      state.revision++; state.dirty = true; state.saveError = '';
      updateNoteState();
      clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(() => { autoSaveTimer = null; flush(); }, 850);
    }
    function snapshot() { return { chapterId: state.chapter.id, page: state.page, text: state.text, strokes: cloneStrokes(state.strokes), revision: state.revision, key: currentKey() }; }
    function saveSnapshot(note) {
      const signature = note.key + ':' + note.revision;
      if (signature === queuedSignature && queuedResult) return queuedResult;
      queuedSignature = signature;
      const operation = saveQueue.then(async () => {
        if (!destroyed && currentKey() === note.key) { state.saving = true; state.saveError = ''; updateNoteState(); }
        try {
          let result;
          if (authenticated) result = await request('notes', { chapterId: note.chapterId, page: note.page, text: note.text, strokes: note.strokes });
          else {
            result = { chapterId: note.chapterId, page: note.page, text: note.text, strokes: note.strokes, updatedAt: Date.now() };
            window.localStorage.setItem(localKey(note.chapterId, note.page), JSON.stringify(result));
          }
          if (result && result.requiresLogin) throw new Error('로그인 만료 · 재로그인 후 저장');
          if (!destroyed && currentKey() === note.key) {
            if (state.revision === note.revision) state.dirty = false;
            state.updatedAt = result && result.updatedAt || Date.now();
            state.saving = false; state.saveError = ''; updateNoteState();
          }
          return true;
        } catch (error) {
          if (!destroyed && currentKey() === note.key) { state.saving = false; state.saveError = error.message || '저장 실패 · 연결 확인 후 재저장'; updateNoteState(); }
          return false;
        }
      });
      queuedResult = operation;
      saveQueue = operation.then(() => true, () => true);
      operation.then(success => { if (!success && queuedSignature === signature) { queuedSignature = ''; queuedResult = null; } });
      return operation;
    }
    async function flush() {
      clearTimeout(autoSaveTimer); autoSaveTimer = null;
      finishStroke();
      if (!state.chapter || !state.dirty) return true;
      if (state.notesLoading || state.notesError) return false;
      return saveSnapshot(snapshot());
    }
    async function loadNote() {
      const generation = ++noteGeneration, chapterId = state.chapter.id, page = state.page;
      state.notesLoading = true; state.notesError = false; state.text = ''; state.strokes = []; state.undo = []; state.redo = []; state.redo = []; state.dirty = false; state.saveError = ''; state.updatedAt = null; state.revision++;
      noteInput.value = ''; paintInk(); updateNoteState();
      try {
        const stored = authenticated ? await request('notes?chapterId=' + encodeURIComponent(chapterId) + '&page=' + page) : JSON.parse(window.localStorage.getItem(localKey(chapterId, page)) || 'null');
        if (destroyed || generation !== noteGeneration || currentKey() !== chapterId + ':' + page) return false;
        if (authenticated && stored && stored.requiresLogin) throw new Error('로그인 필요 · 재로그인 후 메모 확인');
        state.text = typeof stored?.text === 'string' ? stored.text.slice(0, 10000) : '';
        state.strokes = cloneStrokes(stored?.strokes);
        state.updatedAt = stored?.updatedAt || null;
        state.notesLoading = false; noteInput.value = state.text; paintInk(); updateNoteState();
        return true;
      } catch (error) {
        if (destroyed || generation !== noteGeneration) return false;
        state.notesLoading = false; state.notesError = true; state.saveError = error.message || '메모 불러오기 실패'; updateNoteState();
        return false;
      }
    }
    function context() { try { return inkCanvas.getContext('2d'); } catch (_) { return null; } }
    function paintStroke(ctx, stroke) {
      if (!stroke.points.length || !state.viewport) return;
      const width = state.viewport.width, height = state.viewport.height;
      ctx.save();
      ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.globalAlpha = stroke.tool === 'highlighter' ? .28 : 1;
      ctx.strokeStyle = stroke.color; ctx.fillStyle = stroke.color;
      ctx.lineWidth = Math.max(.6, stroke.width * width); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      const first = stroke.points[0]; ctx.moveTo(first.x * width, first.y * height);
      if (stroke.points.length === 1) { ctx.lineTo(first.x * width + .01, first.y * height + .01); }
      else stroke.points.slice(1).forEach(point => ctx.lineTo(point.x * width, point.y * height));
      ctx.stroke(); ctx.restore();
    }
    function paintInk() {
      const ctx = context(); if (!ctx || !state.viewport) return;
      ctx.setTransform(state.pixelRatio, 0, 0, state.pixelRatio, 0, 0);
      ctx.clearRect(0, 0, state.viewport.width, state.viewport.height);
      state.strokes.forEach(stroke => paintStroke(ctx, stroke));
      if (currentStroke) paintStroke(ctx, currentStroke);
    }
    function finishStroke() {
      if (!currentStroke) return;
      const stroke = currentStroke; currentStroke = null;
      if (stroke.points.length) { state.redo = []; state.undo.push(state.strokes.slice()); if (state.undo.length > 30) state.undo.shift(); state.strokes = state.strokes.concat([stroke]); changed(); }
      if (drawingPointer !== null) try { inkCanvas.releasePointerCapture(drawingPointer); } catch (_) { /* Released by browser. */ }
      drawingPointer = null;
      paintInk();
    }
    function point(event) { const rect = inkCanvas.getBoundingClientRect(); return { x: clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1), y: clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1) }; }
    function appendPoint(event) {
      if (!currentStroke) return;
      const next = point(event), previous = currentStroke.points[currentStroke.points.length - 1];
      if (Math.hypot(next.x - previous.x, next.y - previous.y) < .0012) return;
      const existing = state.strokes.reduce((total, stroke) => total + stroke.points.length, 0);
      if (existing + currentStroke.points.length >= MAX_POINTS) { finishStroke(); state.saveError = '페이지 필기 한도 초과 · 불필요한 필기 되돌리기 또는 다른 페이지 사용'; updateNoteState(); return; }
      if (currentStroke.points.length >= 600) currentStroke.points = currentStroke.points.filter((_, index) => index % 2 === 0);
      currentStroke.points.push(next); paintInk();
    }
    function cancelRendering() {
      renderGeneration++;
      if (renderTask && renderTask.cancel) try { renderTask.cancel(); } catch (_) { /* Already complete. */ }
      renderTask = null;
    }
    function showPdfMessage(message, error) {
      const status = $('.slides-render-status'); status.hidden = !message; status.textContent = message || ''; status.classList.toggle('is-error', !!error);
    }
    async function renderPage() {
      if (!pdfDoc || destroyed) return false;
      cancelRendering();
      const generation = renderGeneration, chapterId = state.chapter.id, number = state.page;
      state.rendering = true; updateNoteState(); showPdfMessage('PDF ' + number + '페이지를 그리는 중…');
      try {
        const page = await pdfDoc.getPage(number);
        if (destroyed || generation !== renderGeneration) return false;
        const base = page.getViewport({ scale: 1 });
        const available = Math.max(180, (stage.clientWidth || Math.min(800, Math.max(300, (window.innerWidth || 1000) - 420))) - 34);
        const scale = state.zoom === 'fit' ? available / base.width : Number(state.zoom);
        const viewport = page.getViewport({ scale: clamp(scale, .2, 4) });
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(12000000 / (viewport.width * viewport.height)), 16384 / viewport.width, 16384 / viewport.height);
        state.viewport = viewport; state.pixelRatio = pixelRatio;
        paper.style.width = viewport.width + 'px'; paper.style.height = viewport.height + 'px';
        [baseCanvas, inkCanvas].forEach(canvas => { canvas.width = Math.max(1, Math.floor(viewport.width * pixelRatio)); canvas.height = Math.max(1, Math.floor(viewport.height * pixelRatio)); canvas.style.width = viewport.width + 'px'; canvas.style.height = viewport.height + 'px'; });
        let ctx; try { ctx = baseCanvas.getContext('2d'); } catch (_) { /* Fallback handled below. */ }
        if (!ctx) throw new Error('PDF 표시 미지원 · 원본 열기로 확인');
        paper.hidden = false; $('.slides-empty').hidden = true;
        baseCanvas.setAttribute('aria-label', chapterLabel(state.chapter) + ' · ' + number + ' / ' + state.totalPages + '페이지');
        renderTask = page.render({ canvasContext: ctx, viewport, transform: pixelRatio === 1 ? null : [pixelRatio, 0, 0, pixelRatio, 0, 0], background: 'rgb(255,255,255)' });
        await renderTask.promise;
        if (destroyed || generation !== renderGeneration) return false;
        renderTask = null; state.rendering = false; showPdfMessage(''); paintInk(); updateNoteState();
        const key = chapterId + ':' + number;
        if (state.lastViewed !== key) { state.lastViewed = key; try { options.onPageView?.({ chapterId, page: number, totalPages: state.totalPages }); } catch (_) { /* Optional analytics do not block reading. */ } }
        return true;
      } catch (error) {
        if (destroyed || generation !== renderGeneration || error.name === 'RenderingCancelledException') return false;
        state.rendering = false; showPdfMessage(error.message || 'PDF 페이지 표시 실패 · 원본 열기로 확인', true); updateNoteState(); return false;
      }
    }
    function stopThumbnails() {
      thumbnailObserver?.disconnect(); thumbnailObserver = null; thumbnailQueue = []; thumbnailsRendered.clear();
      thumbnailTasks.forEach(task => { try { task.cancel(); } catch (_) {} }); thumbnailTasks.clear();
    }
    function createThumbnails() {
      stopThumbnails();
      const rail = $('.slides-thumbnails'); rail.replaceChildren();
      const generation = documentGeneration;
      let thumbnailRunning = 0;
      function enqueue(button) { const number = Number(button.dataset.slidePage); if (!thumbnailsRendered.has(number) && !thumbnailQueue.includes(button)) { thumbnailQueue.push(button); pump(); } }
      function pump() {
        if (destroyed || generation !== documentGeneration || !pdfDoc) return;
        while (thumbnailRunning < 2 && thumbnailQueue.length) {
          const button = thumbnailQueue.shift(), number = Number(button.dataset.slidePage);
          if (thumbnailsRendered.has(number)) continue;
          thumbnailsRendered.add(number); thumbnailRunning++;
          (async () => {
            try {
              const page = await pdfDoc.getPage(number); if (destroyed || generation !== documentGeneration) return;
              const base = page.getViewport({ scale: 1 }), viewport = page.getViewport({ scale: 96 / base.width });
              const canvas = button.querySelector('canvas'); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
              const ctx = canvas.getContext('2d'); if (!ctx) return;
              const task = page.render({ canvasContext: ctx, viewport, background: 'rgb(255,255,255)' }); thumbnailTasks.add(task);
              try { await task.promise; } finally { thumbnailTasks.delete(task); }
            } catch (_) { button.classList.add('is-thumb-fallback'); }
            finally { thumbnailRunning--; if (generation === documentGeneration) pump(); }
          })();
        }
      }
      if (window.IntersectionObserver) thumbnailObserver = new window.IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { enqueue(entry.target); thumbnailObserver.unobserve(entry.target); } }), { root: rail, rootMargin: '160px' });
      for (let number = 1; number <= state.totalPages; number++) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'slide-thumb'; button.dataset.slidePage = number; button.setAttribute('aria-label', number + '페이지 보기');
        button.innerHTML = '<canvas aria-hidden="true"></canvas><span>' + number + '</span>'; rail.appendChild(button);
        if (thumbnailObserver) thumbnailObserver.observe(button); else if (number <= 5 || number === state.page) enqueue(button);
      }
    }
    async function loadDocument(chapter) {
      const generation = ++documentGeneration;
      fetchController?.abort(); cancelRendering(); stopThumbnails();
      if (loadingTask && loadingTask.destroy) Promise.resolve(loadingTask.destroy()).catch(() => {});
      if (pdfDoc && pdfDoc.destroy) Promise.resolve(pdfDoc.destroy()).catch(() => {});
      pdfDoc = null; loadingTask = null; state.viewport = null; state.loading = true; state.notesLoading = true;
      state.chapter = chapter; state.page = Math.max(1, state.page); state.totalPages = 1; state.lastViewed = '';
      if (!destroyed) try { options.onChapterChange?.({ chapterId: chapter.id }); } catch (_) { /* Optional address updates do not block the classroom. */ }
      paper.hidden = true; $('.slides-empty').hidden = true; updateHeader(); updateNoteState();
      const url = safePdfUrl(chapter);
      if (!url) {
        state.page = 1; state.loading = false; $('.slides-thumbnails').replaceChildren();
        $('.slides-empty').hidden = false; $('.slides-empty').innerHTML = '<span class="slides-empty-icon">▤</span><h3>등록된 PDF 없음</h3><p>수업 내용 확인 및 메모 작성 가능 · PDF 등록 시 표시</p>';
        showPdfMessage(''); updateHeader(); await loadNote(); return true;
      }
      showPdfMessage('수업 PDF 불러오는 중');
      try {
        fetchController = new AbortController();
        let loadedDocument;
        if (options.loadPdf) loadedDocument = await options.loadPdf(chapter, fetchController.signal);
        else {
          const response = await fetch(url, { credentials: 'same-origin', signal: fetchController.signal });
          if (!response.ok) throw new Error(response.status === 404 ? 'PDF 없음 · 자료 변경 여부 확인' : 'PDF 불러오기 실패 · 연결 확인');
          if (Number(response.headers.get('content-length')) > MAX_PDF_BYTES) throw new Error('PDF 용량 한도: 20MB');
          const bytes = new Uint8Array(await response.arrayBuffer());
          if (bytes.byteLength > MAX_PDF_BYTES) throw new Error('PDF 용량 한도: 20MB');
          const pdfjs = await library();
          if (destroyed || generation !== documentGeneration) return false;
          loadingTask = pdfjs.getDocument({ data: bytes, disableRange: true, disableStream: true, isEvalSupported: false, enableXfa: false, useSystemFonts: true, cMapUrl: '/vendor/cmaps/', cMapPacked: true, standardFontDataUrl: '/vendor/standard_fonts/' });
          loadedDocument = await loadingTask.promise;
        }
        if (destroyed || generation !== documentGeneration) { if (loadedDocument && loadedDocument.destroy) Promise.resolve(loadedDocument.destroy()).catch(() => {}); return false; }
        pdfDoc = loadedDocument;
        state.totalPages = Math.min(2000, Math.max(1, pdfDoc.numPages)); state.page = clamp(state.page, 1, state.totalPages); state.loading = false;
        createThumbnails(); updateHeader();
        await Promise.all([loadNote(), renderPage()]); return true;
      } catch (error) {
        if (destroyed || generation !== documentGeneration || error.name === 'AbortError') return false;
        state.loading = false; state.page = 1; state.totalPages = 1;
        const message = error.name === 'PasswordException' ? '암호화된 PDF · 원본 열기 또는 암호 없는 자료 요청' : error.message || 'PDF 표시 실패 · 원본 열기로 확인';
        showPdfMessage(message, true); $('.slides-empty').hidden = false; $('.slides-empty').innerHTML = '<h3>원본 PDF 확인</h3><p>‘원본 열기’ 또는 ‘PDF 내려받기’ 이용 · 아래 페이지 메모 작성 가능</p>';
        updateHeader(); await loadNote(); return false;
      }
    }
    async function goToPage(number) {
      if (destroyed || state.loading || state.transitioning || !pdfDoc) return false;
      const target = clamp(Math.floor(Number(number) || 1), 1, state.totalPages);
      if (target === state.page) { pageInput.value = state.page; return true; }
      state.transitioning = true; updateHeader();
      if (!await flush()) { state.transitioning = false; updateHeader(); return false; }
      state.page = target; updateHeader();
      await Promise.all([loadNote(), renderPage()]);
      state.transitioning = false; updateHeader();
      $('.slide-thumb.active')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
      return true;
    }
    async function selectChapter(id) {
      if (destroyed || state.transitioning) return false;
      const chapter = chapters.find(item => item.id === id); if (!chapter) return false;
      if (state.chapter && chapter.id === state.chapter.id) return true;
      state.transitioning = true; updateHeader();
      if (!await flush()) { state.transitioning = false; updateHeader(); return false; }
      state.page = 1; await loadDocument(chapter); state.transitioning = false; updateHeader(); return true;
    }

    listen(root, 'click', async event => {
      const button = event.target.closest('button,a'); if (!button || !root.contains(button)) return;
      if (button.hasAttribute('data-slide-prev')) { goToPage(state.page - 1); return; }
      if (button.hasAttribute('data-slide-next')) { goToPage(state.page + 1); return; }
      if (button.dataset.slidePage) { goToPage(button.dataset.slidePage); return; }
      if (button.hasAttribute('data-note-save')) { await flush(); return; }
      if (button.hasAttribute('data-note-retry')) { await loadNote(); return; }
      if (button.dataset.inkTool) {
        finishStroke(); state.tool = button.dataset.inkTool; inkCanvas.dataset.tool = state.tool;
        root.querySelectorAll('[data-ink-tool]').forEach(control => { const selected = control.dataset.inkTool === state.tool; control.classList.toggle('active', selected); control.setAttribute('aria-pressed', selected); }); updateNoteState(); return;
      }
      if (button.dataset.inkColor) {
        state.color = button.dataset.inkColor; root.querySelectorAll('[data-ink-color]').forEach(control => { const selected = control.dataset.inkColor === state.color; control.classList.toggle('active', selected); control.setAttribute('aria-pressed', selected); }); return;
      }
      if (button.hasAttribute('data-ink-undo')) { finishStroke(); if (state.undo.length) { state.redo.push(state.strokes.slice()); state.strokes = state.undo.pop(); paintInk(); changed(); } return; }
      if (button.hasAttribute('data-ink-redo')) { finishStroke(); if (state.redo.length) { state.undo.push(state.strokes.slice()); state.strokes = state.redo.pop(); paintInk(); changed(); } return; }
      if (button.hasAttribute('data-ink-clear')) { finishStroke(); if (state.strokes.length) { state.redo = []; state.undo.push(state.strokes.slice()); state.strokes = []; paintInk(); changed(); } return; }
      if (button.hasAttribute('data-slide-notes')) { const open = root.classList.toggle('is-notes-open'); button.setAttribute('aria-pressed', open); button.classList.toggle('active', open); if (state.zoom === 'fit') renderPage(); if (open) noteInput.focus({ preventScroll: true }); return; }
      if (button.hasAttribute('data-slide-thumbs')) { const collapsed = root.classList.toggle('is-thumbs-collapsed'); button.setAttribute('aria-pressed', !collapsed); if (state.zoom === 'fit') renderPage(); return; }
      if (button.hasAttribute('data-slide-fullscreen')) {
        try { if (document.fullscreenElement) await document.exitFullscreen(); else if (root.requestFullscreen) await root.requestFullscreen(); else root.classList.toggle('is-expanded'); } catch (_) { root.classList.toggle('is-expanded'); }
        button.setAttribute('aria-pressed', document.fullscreenElement === root || root.classList.contains('is-expanded')); if (state.zoom === 'fit') renderPage(); return;
      }
      if (button.classList.contains('slides-open-original') || button.classList.contains('slides-download')) try { options.onOpenDeck?.({ chapterId: state.chapter.id, page: state.page, url: safePdfUrl(state.chapter) }); } catch (_) {}
    });
    listen(noteInput, 'input', () => { if (state.notesLoading || state.notesError) return; state.text = noteInput.value.slice(0, 10000); changed(); });
    listen(select, 'change', () => { selectChapter(select.value); });
    listen(root, 'click', event => { const button = event.target.closest('[data-slides-past]'); if (button && root.contains(button)) selectChapter(button.getAttribute('data-slides-past')); });
    listen(pageInput, 'change', () => { goToPage(pageInput.value); });
    listen(pageInput, 'keydown', event => { if (event.key === 'Enter') { event.preventDefault(); goToPage(pageInput.value); } });
    listen(zoomSelect, 'change', () => { finishStroke(); state.zoom = zoomSelect.value; renderPage(); });
    listen($('.slides-pen-width input'), 'input', event => { state.width = Number(event.target.value); });
    listen(inkCanvas, 'pointerdown', event => {
      if (state.tool === 'hand' || state.notesLoading || state.notesError || state.rendering || !state.viewport || drawingPointer !== null || event.button !== undefined && event.button !== 0) return;
      const count = state.strokes.reduce((total, stroke) => total + stroke.points.length, 0);
      if (state.strokes.length >= MAX_STROKES || count >= MAX_POINTS) { state.saveError = '페이지 필기 한도 초과 · 되돌리기 또는 다른 페이지 사용'; updateNoteState(); return; }
      event.preventDefault(); drawingPointer = event.pointerId;
      const width = (state.tool === 'highlighter' ? state.width * 5 : state.tool === 'eraser' ? state.width * 6 : state.width) / state.viewport.width;
      currentStroke = { tool: state.tool, color: state.color, width: clamp(width, .0001, 1), points: [point(event)] };
      try { inkCanvas.setPointerCapture(event.pointerId); } catch (_) {}
      paintInk();
    });
    listen(inkCanvas, 'pointermove', event => { if (!currentStroke || event.pointerId !== drawingPointer) return; event.preventDefault(); const coalesced = event.getCoalescedEvents ? event.getCoalescedEvents() : []; const events = coalesced.length ? coalesced : [event]; events.forEach(appendPoint); });
    const pointerEnd = event => { if (event.pointerId === drawingPointer) finishStroke(); };
    listen(window, 'pointerup', pointerEnd); listen(window, 'pointercancel', pointerEnd);
    listen(root, 'keydown', event => {
      if (event.target.closest('input,textarea,select,[contenteditable]')) return;
      if (event.key === 'ArrowLeft') { event.preventDefault(); goToPage(state.page - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); goToPage(state.page + 1); }
      if (event.key === 'Escape' && root.classList.contains('is-expanded')) { root.classList.remove('is-expanded'); if (state.zoom === 'fit') renderPage(); }
    });
    listen(document, 'fullscreenchange', () => { $('[data-slide-fullscreen]').setAttribute('aria-pressed', document.fullscreenElement === root || root.classList.contains('is-expanded')); if (state.zoom === 'fit') renderPage(); });
    function resized() { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (!destroyed && state.zoom === 'fit' && pdfDoc) renderPage(); }, 180); }
    listen(window, 'resize', resized);
    if (window.ResizeObserver) { resizeObserver = new window.ResizeObserver(resized); resizeObserver.observe(stage); }
    listen(window, 'beforeunload', event => { if (!state.dirty) return; flush(); event.preventDefault(); event.returnValue = ''; });

    const controller = {
      flush, goToPage, selectChapter,
      async update(nextChapters) {
        if (destroyed) return false;
        chapters = Array.isArray(nextChapters) ? nextChapters.slice() : [];
        const next = chapters.find(chapter => chapter.id === state.chapter?.id) || chapters[0];
        if (!next) { if (!await flush()) return false; documentGeneration++; noteGeneration++; fetchController?.abort(); cancelRendering(); stopThumbnails(); if (loadingTask && loadingTask.destroy) Promise.resolve(loadingTask.destroy()).catch(() => {}); if (pdfDoc && pdfDoc.destroy) Promise.resolve(pdfDoc.destroy()).catch(() => {}); pdfDoc = null; loadingTask = null; state.chapter = null; state.viewport = null; state.text = ''; state.strokes = []; state.undo = []; state.redo = []; state.totalPages = 1; state.page = 1; noteInput.value = ''; $('.slides-thumbnails').replaceChildren(); state.notesLoading = false; state.loading = false; paper.hidden = true; $('.slides-empty').hidden = false; $('.slides-empty').innerHTML = '<h3>공개 수업 없음</h3><p>선생님 등록 자료 표시</p>'; updateHeader(); updateNoteState(); return true; }
        const same = state.chapter && next.id === state.chapter.id && JSON.stringify(next.pdf || null) === JSON.stringify(state.chapter.pdf || null);
        if (same) { state.chapter = next; updateHeader(); return true; }
        if (!await flush()) { updateHeader(); return false; }
        if (next.id !== state.chapter?.id) state.page = 1;
        await loadDocument(next); return true;
      },
      destroy() {
        if (destroyed) return saveQueue;
        const saving = flush();
        destroyed = true; documentGeneration++; noteGeneration++; cancelRendering(); fetchController?.abort(); stopThumbnails();
        clearTimeout(autoSaveTimer); clearTimeout(resizeTimer); resizeObserver?.disconnect(); cleanup.splice(0).forEach(remove => remove());
        if (loadingTask && loadingTask.destroy) Promise.resolve(loadingTask.destroy()).catch(() => {});
        if (pdfDoc && pdfDoc.destroy) Promise.resolve(pdfDoc.destroy()).catch(() => {});
        if (active === controller) active = null;
        return saving;
      },
      snapshot() { return { chapterId: state.chapter?.id || null, page: state.page, totalPages: state.totalPages, dirty: state.dirty, saving: state.saving, notesLoading: state.notesLoading, notesError: state.notesError, text: state.text, strokes: cloneStrokes(state.strokes), tool: state.tool, destroyed }; }
    };
    active = controller;
    const initial = chapters.find(chapter => chapter.id === options.chapterId) || chapters[0];
    if (initial) controller.ready = loadDocument(initial);
    else { state.notesLoading = false; updateHeader(); updateNoteState(); showPdfMessage(''); $('.slides-empty').hidden = false; $('.slides-empty').innerHTML = '<h3>공개 수업 없음</h3><p>PDF 및 수업 내용 등록 시 표시</p>'; controller.ready = Promise.resolve(true); }
    return controller;
  }

  window.ClassroomSlides = { mount, update(chapters) { return active ? active.update(chapters) : Promise.resolve(false); }, flush() { return active ? active.flush() : Promise.resolve(true); }, destroy() { return active ? active.destroy() : Promise.resolve(true); } };
})();
