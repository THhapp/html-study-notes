/* Original html-study-notes geometry and object continuity helpers. MIT License. */
window.StudyDiagrams = (() => {
  'use strict';
  const connections = new WeakMap();
  const moving = new WeakMap();
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function connect(root) {
    if (connections.has(root)) return connections.get(root);
    const svg = root.querySelector('[data-hn-wire-layer]');
    if (!svg) throw new Error('A wire layer is required');
    let scheduled = 0, disposed = false;
    const observed = new Set();
    const animations = new Set();
    const point = (box, side, origin) => ({
      x:(side === 'left' ? box.left : side === 'right' ? box.right : box.left + box.width / 2) - origin.left,
      y:(side === 'top' ? box.top : side === 'bottom' ? box.bottom : box.top + box.height / 2) - origin.top,
    });
    function draw() {
      if (disposed) return;
      const origin = svg.getBoundingClientRect();
      if (!origin.width || !origin.height) return;
      svg.setAttribute('viewBox',`0 0 ${origin.width} ${origin.height}`);
      const anchors = new Map([...root.querySelectorAll('[data-hn-anchor]')].map(el => [el.dataset.hnAnchor,el]));
      const wanted = new Set([root,...anchors.values()]);
      for (const el of observed) if (!wanted.has(el)) { resize.unobserve(el); observed.delete(el); }
      for (const el of wanted) if (!observed.has(el)) { resize.observe(el); observed.add(el); }
      for (const path of svg.querySelectorAll('[data-hn-wire-from]')) {
        const from = anchors.get(path.dataset.hnWireFrom), to = anchors.get(path.dataset.hnWireTo);
        const a = from?.getBoundingClientRect(), b = to?.getBoundingClientRect();
        const visible = a?.width && a?.height && b?.width && b?.height;
        path.hidden = !visible;
        // SVG does not consistently honor the HTML hidden property.
        path.style.display = visible ? '' : 'none';
        if (!visible) continue;
        const vertical = path.dataset.hnWireAxis === 'vertical' || (path.dataset.hnWireAxis !== 'horizontal' && b.top >= a.bottom + 8);
        const start = point(a,path.dataset.hnWireStart || (vertical ? 'bottom' : 'right'),origin);
        const end = point(b,path.dataset.hnWireEnd || (vertical ? 'top' : 'left'),origin);
        const d = vertical
          ? `M ${start.x} ${start.y} C ${start.x} ${(start.y+end.y)/2},${end.x} ${(start.y+end.y)/2},${end.x} ${end.y}`
          : `M ${start.x} ${start.y} C ${(start.x+end.x)/2} ${start.y},${(start.x+end.x)/2} ${end.y},${end.x} ${end.y}`;
        path.setAttribute('d',d);
      }
    }
    function refresh() {
      if (disposed || scheduled) return;
      scheduled = requestAnimationFrame(() => {scheduled=0;draw();});
    }
    function cancel() { animations.forEach(a=>a.cancel()); animations.clear(); }
    function pulse(keys) {
      cancel(); if (reduced() || disposed) return;
      for (const path of svg.querySelectorAll('[data-hn-wire-key]')) {
        if (keys && !keys.includes(path.dataset.hnWireKey)) continue;
        if (getComputedStyle(path).display === 'none' || path.classList.contains('hn-faded')) continue;
        const animation = path.animate([
          {strokeDasharray:'7 5',strokeDashoffset:24},
          {strokeDasharray:'7 5',strokeDashoffset:0},
        ],{duration:420,easing:'linear'});
        animations.add(animation);
        animation.finished.then(()=>animations.delete(animation),()=>animations.delete(animation));
      }
    }
    const resize = new ResizeObserver(refresh);
    const mutation = new MutationObserver(refresh);
    mutation.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['data-hn-anchor','data-hn-wire-from','data-hn-wire-to']});
    const layout = () => {cancel();refresh();};
    root.addEventListener('hn:layout',layout);
    window.addEventListener('resize',refresh);
    draw();
    const api = {refresh,draw,pulse,cancel,destroy(){
      disposed=true;cancel();cancelAnimationFrame(scheduled);resize.disconnect();mutation.disconnect();
      root.removeEventListener('hn:layout',layout);window.removeEventListener('resize',refresh);connections.delete(root);
    }};
    connections.set(root,api);
    return api;
  }

  function move(root,update) {
    const oldAnimations = moving.get(root) || [];
    oldAnimations.forEach(a=>a.cancel());
    const previous = new Map([...root.querySelectorAll('[data-hn-item]')].map(el => [el.dataset.hnItem,el.getBoundingClientRect()]));
    update();
    const animations=[];
    if (!reduced()) for (const el of root.querySelectorAll('[data-hn-item]')) {
      const before = previous.get(el.dataset.hnItem), after = el.getBoundingClientRect();
      const dx=before ? before.x-after.x : 0, dy=before ? before.y-after.y : 8;
      if (dx || dy || !before) animations.push(el.animate([
        {transform:`translate(${dx}px,${dy}px)`,opacity:before ? 1 : .3},
        {transform:'translate(0,0)',opacity:1},
      ],{duration:280,easing:'ease-out'}));
    }
    moving.set(root,animations);
    root.dispatchEvent(new CustomEvent('hn:layout',{bubbles:true}));
    return {cancel(){animations.forEach(a=>a.cancel());}};
  }
  return {connect,move};
})();
