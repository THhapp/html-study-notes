/* Optional development test. Requires Playwright, never used by a delivered note. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');

const root = path.resolve(__dirname,'..');
const graph = {A:['B','C'],B:['D'],C:[],D:[]};
// Independent domain computation, not the frames embedded in the note.
function search(start) {
  const visited = new Set([start]), queue = [start];
  const frames = [{visited:[...visited],queue:[...queue],current:''}];
  while (queue.length) {
    const current = queue.shift();
    for (const next of graph[current]) if (!visited.has(next)) {visited.add(next);queue.push(next);}
    frames.push({visited:[...visited].sort(),queue:[...queue],current});
  }
  return frames;
}
function luminance(hex) {
  const rgb = hex.trim().slice(1).match(/../g).map(value=>parseInt(value,16)/255);
  const linear = rgb.map(value=>value<=.04045 ? value/12.92 : ((value+.055)/1.055)**2.4);
  return linear[0]*.2126+linear[1]*.7152+linear[2]*.0722;
}
function contrast(a,b) {
  const values=[luminance(a),luminance(b)].sort((x,y)=>y-x);
  return (values[0]+.05)/(values[1]+.05);
}

(async () => {
  const output = process.env.NOTE_QA_DIR || await fs.mkdtemp(path.join(os.tmpdir(),'html-study-notes-qa-'));
  await fs.mkdir(output,{recursive:true});
  const browser = await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE ? {executablePath:process.env.BROWSER_EXECUTABLE} : {})});
  const requests = [], errors = [];
  const results = [];
  try {
    const context = await browser.newContext({viewport:{width:1440,height:1000},offline:true});
    await context.route(/^https?:/,route => {requests.push(route.request().url());return route.abort();});
    const page = await context.newPage();
    page.on('pageerror',e => errors.push(e.message));
    page.on('console',message => {if(message.type() === 'error') errors.push(message.text());});
    await page.goto(pathToFileURL(path.join(root,'assets/reachability-note.html')).href);
    await page.waitForFunction(() => document.querySelector('[data-hn-sequence]').dataset.hnIndex === '0');
    const knowledge = await page.locator('.hn-block').allTextContents();
    const frames = await page.locator('[data-hn-frames]').evaluate(el => JSON.parse(el.textContent));
    assert.deepEqual(frames.map(({visited,queue,current}) => ({visited,queue,current})),search('A'));
    const adjacency = await page.locator('.hn-matrix tbody tr').evaluateAll(rows => rows.map(row => [...row.querySelectorAll('td')].map(td => Number(td.textContent))));
    assert.deepEqual(adjacency,Object.keys(graph).map(from => Object.keys(graph).map(to => Number(graph[from].includes(to)))));
    const counts = await page.locator('.hn-bar-row').evaluateAll(rows => rows.map(row => Number(row.lastElementChild.textContent.match(/\d+/)[0])));
    assert.deepEqual(counts,Object.keys(graph).map(key => search(key).at(-1).visited.length));
    const tableQueue = await page.locator('#bfs-static-table tbody tr td:last-child').allTextContents();
    assert.deepEqual(tableQueue.map(text => text.replace(/[\[\]\s]/g,'')),search('A').map(frame => frame.queue.join(',')));
    results.push('Independent graph, matrix, counts, frame and static queue checks');

    await page.getByRole('button',{name:'选择顶点 B',exact:true}).click();
    assert.equal(await page.locator('#representations [data-hn-key="B"].hn-selected').count(),3);
    assert.equal(await page.locator('.hn-edge.hn-selected').count(),1);
    await page.getByRole('button',{name:'选择顶点 B',exact:true}).press('Space');
    assert.equal(await page.locator('#representations .hn-selected').count(),0);
    for (let i=0;i<frames.length;i++) {
      await page.locator('[data-hn-range]').fill(String(i));
      assert.equal(await page.locator('[data-hn-sequence]').getAttribute('data-hn-index'),String(i));
      const chips = await page.locator('[data-bfs-visited] .hn-chip').allTextContents();
      assert.deepEqual(chips.map(text=>text.split(' · ')[0]),frames[i].visited);
      const queue = await page.locator('[data-bfs-queue] .hn-chip').allTextContents();
      assert.deepEqual(queue,frames[i].queue);
    }
    await page.getByRole('button',{name:'重置',exact:true}).click();
    await page.getByRole('button',{name:'播放',exact:true}).click();
    await page.waitForTimeout(1620);
    assert.equal(await page.locator('[data-hn-sequence]').getAttribute('data-hn-index'),'1');
    await page.getByRole('button',{name:'暂停',exact:true}).click();
    await page.waitForTimeout(1600);
    assert.equal(await page.locator('[data-hn-sequence]').getAttribute('data-hn-index'),'1');
    await page.getByRole('button',{name:'播放',exact:true}).click();
    await page.getByRole('button',{name:'重置',exact:true}).click();
    await page.waitForTimeout(1600);
    assert.equal(await page.locator('[data-hn-sequence]').getAttribute('data-hn-index'),'0');
    await page.locator('[data-hn-range]').fill('3');
    await page.getByRole('button',{name:'播放',exact:true}).click();
    await page.waitForTimeout(1620);
    assert.equal(await page.locator('[data-hn-sequence]').getAttribute('data-hn-index'),'4');
    assert.equal(await page.getByRole('button',{name:'播放',exact:true}).getAttribute('aria-pressed'),'false');
    results.push('Keyboard selection, every frame, pause, reset cancellation and end stop');

    assert.equal(await page.evaluate(() => StudyNotes.mount(document).length),2);
    const isolation = await page.evaluate(() => {
      const source = document.querySelector('[data-hn-sequence]');
      const copy = source.cloneNode(true); copy.removeAttribute('id');
      copy.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
      document.querySelector('main').append(copy);
      const [controller] = StudyNotes.mount(copy);
      controller.go(2);
      const independent = source.dataset.hnIndex === '4' && copy.dataset.hnIndex === '2';
      controller.destroy(); copy.remove();
      const group = document.createElement('section'); group.dataset.hnLinked = '';
      group.dataset.hnSelectedMessage = '当前课程 {key}：相关记录已标记。';
      const button = document.createElement('button');button.dataset.hnSelect = 'A';button.disabled = true;
      const target = document.createElement('p');target.dataset.hnKey = 'A';
      const status = document.createElement('p');status.dataset.hnLinkedStatus = '';status.textContent = '选择课程查看关联记录。';
      group.append(button,target,status);document.querySelector('main').append(group);
      const [linked] = StudyNotes.mount(group);linked.select('A');
      const separate = target.classList.contains('hn-selected') && status.textContent === '当前课程 A：相关记录已标记。' && document.querySelector('#representations [data-hn-select="A"]').getAttribute('aria-pressed') === 'false';
      linked.select('');
      const restored = status.textContent === '选择课程查看关联记录。';
      linked.destroy();group.remove();
      return independent && separate && restored;
    });
    assert.equal(isolation,true);
    results.push('Repeated mount, two sequence instances and two selection groups stay isolated');

    for (const mode of [
      {name:'wide-light',width:1440,height:1000,colorScheme:'light',reducedMotion:'no-preference'},
      {name:'narrow-system-dark',width:720,height:1000,colorScheme:'dark',reducedMotion:'no-preference'},
      {name:'small-reduced',width:320,height:950,colorScheme:'light',reducedMotion:'reduce'},
    ]) {
      await page.setViewportSize({width:mode.width,height:mode.height});
      await page.emulateMedia({colorScheme:mode.colorScheme,reducedMotion:mode.reducedMotion});
      await page.waitForTimeout(100);
      const metrics = await page.evaluate(() => {
        const graph = document.querySelector('.hn-graph'), rect=graph.getBoundingClientRect();
        const svg = graph.querySelector('svg');
        return {width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,viewBox:svg.viewBox.baseVal.width,graphWidth:rect.width,tocOpen:document.querySelector('.hn-toc details').open,
          transition:getComputedStyle(document.querySelector('[data-hn-key]')).transitionDuration};
      });
      assert.ok(metrics.scroll <= metrics.width+1,`${mode.name}: page overflow`);
      assert.ok(Math.abs(metrics.viewBox-metrics.graphWidth)<1,`${mode.name}: stale connector geometry`);
      assert.equal(metrics.tocOpen,mode.width>1050);
      if(mode.reducedMotion==='reduce') assert.equal(metrics.transition,'0s');
      const pairs = await page.evaluate(() => {
        const style = getComputedStyle(document.documentElement);
        if (style.colorScheme !== 'light' || style.getPropertyValue('--hn-bg').trim() !== '#ffffff') throw new Error('Note must retain its white background regardless of system preference');
        return [['ink','bg'],['muted','bg'],['blue','def'],['amber','key'],['orange','caution'],['red','question']].map(pair=>pair.map(name=>style.getPropertyValue(`--hn-${name}`)));
      });
      for (const pair of pairs) assert.ok(contrast(...pair)>=4.5,`${mode.name}: role text contrast ${pair}`);
      if (mode.reducedMotion==='reduce') {
        await page.locator('[data-hn-range]').fill('1');
        assert.equal(await page.locator('[data-hn-sequence]').evaluate(el=>el.getAnimations({subtree:true}).length),0);
      }
      await page.evaluate(() => window.scrollTo(0,0));
      await page.screenshot({path:path.join(output,`${mode.name}.png`),fullPage:true});
      results.push(`${mode.name}: reflow, connector resize, contents and screenshot`);
    }
    await page.setViewportSize({width:1200,height:1000});
    await page.emulateMedia({media:'print',colorScheme:'light'});
    assert.equal(await page.locator('.hn-toc').isVisible(),false);
    assert.equal(await page.locator('[data-hn-controls]').isVisible(),false);
    assert.equal(await page.locator('#bfs-static-table tbody tr').count(),5);
    assert.equal(await page.locator('#bfs-static-table').isVisible(),true);
    await page.pdf({path:path.join(output,'print-check.pdf'),format:'A4',printBackground:true,margin:{top:'14mm',bottom:'14mm',left:'14mm',right:'14mm'}});
    results.push('Print: controls hidden; full process table retained; PDF generated');
    await context.close();

    const plain = await browser.newContext({javaScriptEnabled:false,offline:true,viewport:{width:720,height:1000}});
    await plain.route(/^https?:/,route => {requests.push(route.request().url());return route.abort();});
    const noJS = await plain.newPage();
    await noJS.goto(pathToFileURL(path.join(root,'assets/reachability-note.html')).href);
    assert.equal(await noJS.locator('[data-hn-controls]').isVisible(),false);
    assert.equal(await noJS.locator('main section').count(),3);
    assert.equal(await noJS.locator('#bfs-static-table tbody tr').count(),5);
    assert.ok((await noJS.locator('main').innerText()).includes('零长度约定'));
    assert.equal(await noJS.locator('.hn-matrix td').count(),16);
    assert.deepEqual(await noJS.locator('.hn-block').allTextContents(),knowledge);
    await noJS.screenshot({path:path.join(output,'no-script.png'),fullPage:true});
    await plain.close();
    assert.deepEqual(requests,[]);assert.deepEqual(errors,[]);
    results.push('file:// offline, no network attempts or JS errors; no-script knowledge retained');
    const report = {checkedAt:new Date().toISOString(),browser:await browser.version(),results,requests,errors,artifacts:output};
    await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report,null,2));
  } finally {await browser.close();}
})().catch(error => {console.error(error);process.exitCode=1;});
