/* Original domain binding for the synthetic graph example. MIT License. */
(() => {
  'use strict';
  const group = document.getElementById('representations');
  const graph = group.querySelector('.hn-graph');
  const svg = graph.querySelector('svg');
  function drawEdges() {
    const box = graph.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    group.querySelectorAll('[data-hn-edge-from]').forEach(path => {
      const from = group.querySelector(`[data-hn-select="${path.dataset.hnEdgeFrom}"]`).getBoundingClientRect();
      const to = group.querySelector(`[data-hn-select="${path.dataset.hnEdgeTo}"]`).getBoundingClientRect();
      const a = {x:from.x + from.width/2 - box.x,y:from.y + from.height/2 - box.y};
      const b = {x:to.x + to.width/2 - box.x,y:to.y + to.height/2 - box.y};
      const dx = b.x - a.x, dy = b.y - a.y;
      const length = Math.hypot(dx,dy);
      const inset = Math.min(30,length/3);
      path.setAttribute('d', `M ${a.x + dx/length*inset} ${a.y + dy/length*inset} L ${b.x - dx/length*inset} ${b.y - dy/length*inset}`);
    });
  }
  new ResizeObserver(drawEdges).observe(graph);
  drawEdges();
  group.addEventListener('hn:select', event => {
    group.querySelectorAll('[data-hn-edge-from]').forEach(path => path.classList.toggle('hn-selected', path.dataset.hnEdgeFrom === event.detail.key));
  });
  const root = document.getElementById('bfs-example');
  const paintChips = (target, items, current, discovered) => {
    const previous = new Map([...target.querySelectorAll('[data-chip-key]')].map(el => {
      el.getAnimations().forEach(animation => animation.cancel());
      return [el.dataset.chipKey,{element:el,box:el.getBoundingClientRect()}];
    }));
    const elements = items.map(key => {
      const span = previous.get(key)?.element || document.createElement('span');
      span.dataset.chipKey = key;
      span.className = 'hn-chip' + (discovered ? ' hn-discovered' : '') + (key === current ? ' hn-current' : '');
      span.textContent = key === current ? `${key} · 当前` : key;
      return span;
    });
    if (!elements.length) elements.push(document.createTextNode('空'));
    target.replaceChildren(...elements);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      for (const element of elements) {
        if (element.nodeType !== Node.ELEMENT_NODE) continue;
        const old = previous.get(element.dataset.chipKey)?.box;
        const now = element.getBoundingClientRect();
        const dx = old ? old.x - now.x : 0, dy = old ? old.y - now.y : 10;
        // The domain state is already final; motion only tracks object placement.
        if (dx || dy) element.animate([
          {transform:`translate(${dx}px,${dy}px)`,opacity:old ? 1 : .35},
          {transform:'translate(0,0)',opacity:1},
        ],{duration:280,easing:'ease-out'});
      }
    }
  };
  root.addEventListener('hn:frame', event => {
    const {frame,index} = event.detail;
    paintChips(root.querySelector('[data-bfs-visited]'),frame.visited,frame.current,true);
    paintChips(root.querySelector('[data-bfs-queue]'),frame.queue,'',false);
    root.querySelectorAll('[data-bfs-step]').forEach(el => el.classList.toggle('hn-active',Number(el.dataset.bfsStep) === index));
  });
  // Collapse the right-hand contents into the top strip in a narrow pane.
  const media = window.matchMedia('(max-width:1050px)');
  const toc = document.querySelector('.hn-toc details');
  const resize = () => { toc.open = !media.matches; };
  media.addEventListener('change',resize);
  resize();
})();
