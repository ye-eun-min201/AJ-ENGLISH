(function () {
  'use strict';
  const selector = 'input[data-fg-label],textarea[data-fg-label],select[data-fg-label]';
  const fields = new Map();
  let scope = null, observer = null, serial = 0;
  const setText = (element, value) => { if (element.textContent !== value) element.textContent = value; };
  function forget(control, helper) {
    const described = (control.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id && id !== helper.id);
    if (described.length) control.setAttribute('aria-describedby', described.join(' '));
    else control.removeAttribute('aria-describedby');
    control.removeAttribute('data-fg-over-limit');
    helper.remove(); fields.delete(control);
  }
  function update(control) {
    if (!control?.matches?.(selector)) return;
    let helper = fields.get(control);
    if (!helper || !helper.parentNode) {
      helper = document.createElement('span');
      helper.className = 'fg-meta'; helper.id = 'fg-meta-' + (++serial);
      helper.setAttribute('data-fg-helper', control.name || control.id || 'field');
      const requirement = document.createElement('span'); requirement.className = 'fg-requirement'; requirement.setAttribute('data-fg-requirement', '');
      const counter = document.createElement('span'); counter.className = 'fg-counter'; counter.setAttribute('data-fg-counter', '');
      helper.append(requirement, counter);
      control.insertAdjacentElement('afterend', helper); fields.set(control, helper);
    }
    const described = new Set((control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean)); described.add(helper.id);
    const description = [...described].join(' ');
    if (control.getAttribute('aria-describedby') !== description) control.setAttribute('aria-describedby', description);
    const required = control.required === true || control.hasAttribute('required');
    helper.dataset.required = String(required);
    setText(helper.querySelector('[data-fg-requirement]'), required ? '필수' : '선택');
    const maximum = Number(control.getAttribute('maxlength')), limited = control.hasAttribute('maxlength') && Number.isInteger(maximum) && maximum >= 0 && control.dataset.fgCounter !== 'off';
    const counter = helper.querySelector('[data-fg-counter]');
    counter.hidden = !limited;
    const length = String(control.value || '').length, over = limited && length > maximum;
    if (limited) setText(counter, length.toLocaleString('ko-KR') + ' / ' + maximum.toLocaleString('ko-KR') + '자');
    helper.classList.toggle('fg-over-limit', over);
    control.toggleAttribute('data-fg-over-limit', over);
  }
  function refresh(target = document) {
    if (!target) return;
    if (target.matches?.(selector)) update(target);
    for (const control of target.querySelectorAll?.(selector) || []) update(control);
    for (const [control, helper] of fields) if (!control.isConnected || !control.matches(selector)) forget(control, helper);
  }
  function onInput(event) { if (event.target.matches?.(selector)) update(event.target); }
  function onReset(event) { Promise.resolve().then(() => { if (scope) refresh(event.target); }); }
  function init(target = document) {
    if (scope) { refresh(target); return { refresh, destroy }; }
    scope = target;
    scope.addEventListener('input', onInput); scope.addEventListener('change', onInput); scope.addEventListener('reset', onReset);
    if (typeof MutationObserver === 'function') {
      observer = new MutationObserver(changes => {
        for (const change of changes) {
          if (change.type === 'attributes') update(change.target);
          else for (const node of change.addedNodes) if (node.nodeType === 1 && !node.closest?.('[data-fg-helper]')) refresh(node);
        }
        for (const [control, helper] of fields) if (!control.isConnected) forget(control, helper);
      });
      observer.observe(target.nodeType === 9 ? target.documentElement : target, { subtree: true, childList: true, attributes: true, attributeFilter: ['required', 'maxlength', 'data-fg-label', 'data-fg-counter'] });
    }
    refresh(target); return { refresh, destroy };
  }
  function destroy() {
    if (scope) { scope.removeEventListener('input', onInput); scope.removeEventListener('change', onInput); scope.removeEventListener('reset', onReset); }
    observer?.disconnect(); observer = null; scope = null;
    for (const [control, helper] of fields) forget(control, helper);
    document.removeEventListener('DOMContentLoaded', boot);
  }
  function boot() { init(document); }
  window.AJFormGuidance = { init, refresh, destroy };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
