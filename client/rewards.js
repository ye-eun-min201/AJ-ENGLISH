(function () {
  'use strict';
  let layer, serial = 0;
  const timers = new Map();
  const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0));
  function show(options = {}) {
    if (!document.body) return;
    if (!layer?.isConnected) {
      layer = document.createElement('div');
      layer.id = 'aj-reward-layer';
      layer.setAttribute('aria-live', 'polite');
      layer.setAttribute('aria-atomic', 'false');
      document.body.append(layer);
    }
    const points = typeof options.points === 'number' && Number.isFinite(options.points) ? Math.max(0, Math.floor(options.points)) : 0;
    const delta = clamp(options.deltaProgress, 0, 100);
    const progress = clamp(options.progress, 0, 100);
    const popup = document.createElement('div');
    popup.className = 'aj-reward-popup' + (points ? ' has-points' : '');
    popup.dataset.rewardId = String(++serial);
    const mark = document.createElement('span'); mark.className = 'aj-reward-mark'; mark.textContent = '✦'; mark.setAttribute('aria-hidden', 'true');
    const heading = document.createElement('strong');
    heading.textContent = points ? '+' + points + ' XP' : delta ? '+' + Math.round(delta) + '%' : options.label || '정답';
    const detail = document.createElement('span'); detail.className = 'aj-reward-detail';
    detail.textContent = points ? '포인트 적립' + (delta ? ' · 진행 +' + Math.round(delta) + '%' : '') : (options.label || '퀘스트 진행');
    popup.append(mark, heading, detail);
    if (options.progress !== undefined) {
      const track = document.createElement('div'); track.className = 'aj-reward-track';
      const fill = document.createElement('i'); fill.style.width = progress + '%'; track.append(fill);
      const text = document.createElement('small'); text.textContent = '진행률 ' + Math.round(progress) + '%';
      popup.append(track, text);
    }
    for (let i = 0; i < 8; i++) {
      const spark = document.createElement('i'); spark.className = 'aj-reward-spark';
      spark.style.setProperty('--spark-x', ((i % 2 ? -1 : 1) * (32 + i * 12)) + 'px');
      spark.style.setProperty('--spark-y', (-18 - (i % 4) * 22) + 'px');
      spark.style.setProperty('--spark-turn', (i * 43) + 'deg'); spark.setAttribute('aria-hidden', 'true'); popup.append(spark);
    }
    const rect = options.anchor?.getBoundingClientRect?.();
    const width = Math.max(280, window.innerWidth || 1024), height = window.innerHeight || 768;
    popup.style.left = clamp(rect ? rect.left + rect.width / 2 : width / 2, 130, width - 130) + 'px';
    const minY = Math.min(150, height / 2), maxY = Math.max(minY, height - 100);
    popup.style.top = clamp(rect ? rect.top + Math.min(rect.height / 2, 90) : height * .4, minY, maxY) + 'px';
    layer.append(popup);
    while (layer.children.length > 3) {
      const oldest = layer.firstElementChild; clearTimeout(timers.get(oldest)); timers.delete(oldest); oldest.remove();
    }
    timers.set(popup, setTimeout(() => { popup.remove(); timers.delete(popup); }, 2400));
    window.dispatchEvent(new CustomEvent('aj:reward', { detail: { points, progress, deltaProgress: delta, label: options.label || '' } }));
    return popup;
  }
  function clear() { for (const timer of timers.values()) clearTimeout(timer); timers.clear(); layer?.replaceChildren(); }
  window.AJRewards = { show, clear };
})();
