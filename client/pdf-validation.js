(function () {
  'use strict';

  const MAX_BYTES = 20 * 1024 * 1024;
  let libraryPromise = null;

  function library() {
    if (!Promise.withResolvers) Promise.withResolvers = function () {
      let resolve, reject;
      const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
      return { promise, resolve, reject };
    };
    if (!libraryPromise) libraryPromise = import('/vendor/pdf.min.mjs').then(pdfjs => {
      pdfjs.GlobalWorkerOptions.workerSrc = '/vendor/pdf.worker.min.mjs';
      return pdfjs;
    }).catch(() => {
      libraryPromise = null;
      throw new Error('PDF 확인 모듈 로드 실패 · 새로고침 후 재시도');
    });
    return libraryPromise;
  }

  async function inspect(file) {
    if (!file || typeof file.arrayBuffer !== 'function') throw new Error('PDF 파일 선택');
    if (typeof file.size === 'number' && file.size > MAX_BYTES) throw new Error('PDF 파일 한도: 20 MB');
    const bytes = new Uint8Array(await file.arrayBuffer().catch(() => { throw new Error('파일 읽기 실패 · PDF 재선택'); }));
    if (bytes.byteLength > MAX_BYTES) throw new Error('PDF 파일 한도: 20 MB');
    if (bytes.byteLength < 5 || String.fromCharCode(...bytes.subarray(0, 5)) !== '%PDF-') throw new Error('PDF 형식 확인 후 재시도');

    const pdfjs = await library();
    let loadingTask = null, document = null;
    try {
      loadingTask = pdfjs.getDocument({
        data: bytes,
        disableRange: true,
        disableStream: true,
        isEvalSupported: false,
        enableXfa: false,
        useSystemFonts: true,
        cMapUrl: '/vendor/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: '/vendor/standard_fonts/'
      });
      document = await loadingTask.promise;
      const pages = document.numPages;
      if (!Number.isInteger(pages) || pages < 1 || pages > 2000) throw new Error('PDF 페이지 한도: 1~2,000쪽');
      const firstPage = await document.getPage(1);
      firstPage.cleanup?.();
      return { pages };
    } catch (error) {
      if (error?.name === 'PasswordException') throw new Error('암호 없는 PDF 파일 선택');
      if (error?.message === 'PDF 페이지 한도: 1~2,000쪽' || error?.message === '암호 없는 PDF 파일 선택') throw error;
      throw new Error('PDF 파일 손상 · 다른 PDF 선택');
    } finally {
      if (document) try { await document.destroy(); } catch (_) { /* Disposal does not change the validation result. */ }
      if (loadingTask) try { await loadingTask.destroy(); } catch (_) { /* Loading failures also release their worker. */ }
    }
  }

  window.PDFValidation = Object.freeze({ inspect });
})();
