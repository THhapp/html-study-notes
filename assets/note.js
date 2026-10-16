/* Original html-study-notes controls. MIT License. No network or storage. */
"use strict";
window.StudyNotes = (() => {
  const mounted = new WeakMap();
  function sequence(root) {
    const data = root.querySelector('[data-hn-frames]');
    function validate(value) {
      if (!Array.isArray(value) || !value.length || value.some(f => !f || typeof f.label !== 'string')) {
        throw new Error('Sequence requires nonempty frames with text labels');
      }
      return value;
    }
    let frames = validate(JSON.parse(data.textContent));
    let index = 0, timer = null;
    const buttons = Object.fromEntries(['prev','next','play','reset'].map(k => [k, root.querySelector(`[data-hn-action="${k}"]`)]));
    const range = root.querySelector('[data-hn-range]');
    const status = root.querySelector('[data-hn-status]');
    const controls = root.querySelector('[data-hn-controls]');
    const removers = [];
    const on = (el, type, fn) => { el.addEventListener(type, fn); removers.push(() => el.removeEventListener(type, fn)); };
    function stop() {
      if (timer !== null) clearTimeout(timer);
      timer = null;
      buttons.play.textContent = '播放';
      buttons.play.setAttribute('aria-pressed','false');
    }
    function render() {
      range.value = String(index);
      buttons.prev.disabled = index === 0;
      buttons.next.disabled = index === frames.length - 1;
      status.textContent = `${index + 1} / ${frames.length} · ${frames[index].label}`;
      root.dataset.hnIndex = String(index);
      root.querySelectorAll('[data-hn-bind]').forEach(el => {
        const value = frames[index][el.dataset.hnBind];
        el.textContent = Array.isArray(value) ? (value.join(' → ') || '空') : String(value ?? '');
      });
      root.dispatchEvent(new CustomEvent('hn:frame', {bubbles:true, detail:{index, frame:frames[index]}}));
    }
    function go(value) {
      stop();
      const n = Number(value);
      index = Number.isFinite(n) ? Math.max(0, Math.min(frames.length - 1, Math.round(n))) : 0;
      render();
    }
    function tick() {
      if (index < frames.length - 1) { index++; render(); }
      if (index === frames.length - 1) stop();
      else timer = setTimeout(tick, 1500);
    }
    on(buttons.prev,'click',() => go(index - 1));
    on(buttons.next,'click',() => go(index + 1));
    on(buttons.reset,'click',() => go(0));
    on(range,'input',() => go(range.value));
    on(buttons.play,'click',() => {
      if (timer !== null) return stop();
      if (index === frames.length - 1) { index = 0; render(); }
      buttons.play.textContent = '暂停';
      buttons.play.setAttribute('aria-pressed','true');
      timer = setTimeout(tick, 1500);
    });
    on(document,'visibilitychange',() => { if (document.hidden) stop(); });
    const details = [...root.querySelectorAll('details')];
    let beforePrint = [];
    on(window,'beforeprint',() => { stop(); beforePrint = details.map(d => d.open); details.forEach(d => d.open = true); });
    on(window,'afterprint',() => details.forEach((d,i) => d.open = beforePrint[i] ?? d.open));
    range.min = '0'; range.max = String(frames.length - 1); range.step = '1';
    render(); controls.hidden = false;
    function setFrames(value) {
      const next = validate(value);
      stop(); frames = next; index = 0;
      range.max = String(frames.length - 1);
      render();
    }
    return {go, stop, setFrames, get index(){return index;}, destroy(){stop();removers.forEach(fn=>fn());controls.hidden=true;mounted.delete(root);}};
  }
  function linked(root) {
    const controls = [...root.querySelectorAll('[data-hn-select]')];
    const status = root.querySelector('[data-hn-linked-status]');
    const idleMessage = status?.textContent || '显示全部对象；选择对象可定位对应表示。';
    const selectedMessage = root.dataset.hnSelectedMessage || '当前对象 {key}：相关表示已同步标记。';
    const select = key => {
      root.querySelectorAll('[data-hn-key]').forEach(el => el.classList.toggle('hn-selected', !!key && el.dataset.hnKey.split(/\s+/).includes(key)));
      controls.forEach(el => el.setAttribute('aria-pressed', String(el.dataset.hnSelect === key)));
      if (status) status.textContent = key ? selectedMessage.replaceAll('{key}',key) : idleMessage;
      root.dispatchEvent(new CustomEvent('hn:select',{bubbles:true,detail:{key}}));
    };
    const handlers = controls.map(el => {
      el.disabled = false;
      const fn = () => select(el.getAttribute('aria-pressed') === 'true' ? '' : el.dataset.hnSelect);
      el.addEventListener('click',fn); return () => {el.removeEventListener('click',fn);el.disabled=true;};
    });
    select('');
    return {select,destroy(){handlers.forEach(fn=>fn());select('');mounted.delete(root);}};
  }
  function mount(scope = document) {
    const result = [];
    for (const [selector, create] of [['[data-hn-sequence]',sequence],['[data-hn-linked]',linked]]) {
      const roots = [...scope.querySelectorAll(selector)];
      if (scope.matches?.(selector)) roots.unshift(scope);
      for (const root of roots) {
        if (!mounted.has(root)) {
          try { mounted.set(root,create(root)); }
          catch (error) { root.dataset.hnError = 'initialization'; console.error(error); }
        }
        if (mounted.has(root)) result.push(mounted.get(root));
      }
    }
    return result;
  }
  return {mount};
})();
