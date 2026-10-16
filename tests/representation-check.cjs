/* End-to-end checks for the main synthetic example; development-only Playwright. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const source=[['D01','北区','林原','巡检','待办'],['D01','北区','林原','校准','完成'],['D02','北区','林原','巡检','待办'],['D03','南区','许禾','巡检','完成']];
const fields={da:[0,1],ao:[1,2],dts:[0,3,4]};
function project(cols,dedupe){const rows=source.map(row=>cols.map(i=>row[i]));return dedupe?[...new Map(rows.map(row=>[JSON.stringify(row),row])).values()]:rows;}
function validFD(rows,left,right){return rows.every(a=>rows.every(b=>!left.every(i=>a[i]===b[i])||right.every(i=>a[i]===b[i])));}

(async()=>{
 const output=process.env.NOTE_QA_DIR || await fs.mkdtemp(path.join(os.tmpdir(),'html-representation-qa-'));
 await fs.mkdir(output,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 const errors=[],requests=[],checks=[];
 try{
  const context=await browser.newContext({offline:true,viewport:{width:1440,height:1000}});
  await context.route(/^https?:/,route=>{requests.push(route.request().url());return route.abort();});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(pathToFileURL(path.join(root,'assets/reference-note.html')).href);
  await page.waitForFunction(()=>document.querySelector('#projection-sequence').dataset.stage==='3');
  assert.equal(await page.evaluate(()=>document.getAnimations().length),0,'Initial rendering must be static');
  const knowledge=await page.locator('.hn-block').allTextContents();
  const rows=()=>page.locator('[data-copy-records] tr').evaluateAll(rows=>rows.map(tr=>[...tr.querySelectorAll('td')].map(td=>td.firstChild.textContent)));
  assert.deepEqual(await rows(),source);
  const copies=page.locator('[data-copy-targets] button');
  assert.equal(await copies.count(),3);await copies.first().click();
  assert.equal(await page.locator('[data-copy-records] tr.hn-selected').count(),1);assert.equal(await page.locator('#copy-board .hn-traced').count(),1);
  await copies.first().press('Space');assert.equal(await page.locator('#copy-links .hn-selected').count(),0);
  const copy=page.locator('#copy-sequence');
  await page.getByRole('button',{name:'更新异常',exact:true}).click();
  await copy.locator('[data-hn-range]').fill('1');let current=await rows();
  assert.equal(current[0][2],'周宁');assert.equal(current[1][2],'林原');assert.equal(validFD(current,[1],[2]),false);
  assert.ok((await copy.locator('[data-hn-status]').innerText()).includes('违规'));
  await copy.locator('[data-hn-range]').fill('2');current=await rows();
  assert.equal(validFD(current,[1],[2]),true);assert.deepEqual(current.slice(0,3).map(r=>r[2]),['周宁','周宁','周宁']);
  await page.getByRole('button',{name:'插入异常',exact:true}).click();await copy.locator('[data-hn-range]').fill('1');
  assert.deepEqual(await rows(),source);assert.equal(await copies.count(),0);assert.equal(await page.locator('#copy-board path').count(),0);
  await page.getByRole('button',{name:'删除异常',exact:true}).click();assert.equal(await copies.count(),1);
  await copy.locator('[data-hn-range]').fill('1');assert.deepEqual(await rows(),source.slice(0,3));assert.equal(await copies.count(),0);
  assert.equal(await page.locator('[data-copy-fact].is-lost').count(),1);
  await page.getByRole('button',{name:'数据冗余',exact:true}).click();assert.deepEqual(await rows(),source);assert.equal(await copies.count(),3);
  checks.push('Copy fanout, graph/row keyboard selection and all four data operations independently checked');

  // Changing scenes cancels the timer and adjusts the available frame range.
  await copy.locator('[data-hn-action="play"]').click();
  await page.getByRole('button',{name:'更新异常',exact:true}).click();await page.waitForTimeout(1570);
  assert.equal(await copy.getAttribute('data-hn-index'),'0');assert.equal(await copy.locator('[data-hn-range]').getAttribute('max'),'2');
  assert.equal(await copy.locator('[data-hn-action="play"]').getAttribute('aria-pressed'),'false');
  const rejected=await page.evaluate(()=>{const root=document.getElementById('copy-sequence'),api=StudyNotes.mount(root)[0],before=api.index;try{api.setFrames([]);}catch(e){return api.index===before&&root.querySelector('[data-hn-range]').max==='2';}return false;});
  assert.equal(rejected,true);checks.push('Scene replacement cancels playback; invalid frame arrays leave current state intact');

  const projection=page.locator('#projection-sequence');
  for(let stage=0;stage<4;stage++){
   await projection.locator('[data-hn-range]').fill(String(stage));
   for(const [key,cols]of Object.entries(fields)){
    const actual=await page.locator(`[data-projection="${key}"] tbody tr[data-hn-item]`).evaluateAll(rows=>rows.map(tr=>[...tr.querySelectorAll('td')].map(td=>td.firstChild.textContent)));
    assert.deepEqual(actual,stage===0?[]:project(cols,stage>=2));
   }
   assert.equal(await page.locator('.hn-duplicate').count(),stage===1?3:0);
  }
  const area=page.locator('#attribute-links [data-hn-select="Area"]');await area.nth(1).click();
  assert.equal(await page.locator('#projection-board .hn-wire.hn-traced').count(),2);
  assert.equal(await page.locator('#attribute-links [data-hn-select="Area"][aria-pressed="true"]').count(),3);
  assert.equal(await page.locator('[data-projection="dts"].is-filtered').count(),1);
  await area.nth(1).click();assert.equal(await page.locator('#projection-board .hn-faded').count(),0);
  checks.push('All projection stages equal independently calculated row projections and unique sets; multi-target attribute tracing works');

  await projection.locator('[data-hn-action="reset"]').click();await projection.locator('[data-hn-action="play"]').click();
  await page.waitForTimeout(1570);assert.equal(await projection.getAttribute('data-hn-index'),'1');
  await projection.locator('[data-hn-action="play"]').click();await page.waitForTimeout(1570);assert.equal(await projection.getAttribute('data-hn-index'),'1');
  await projection.locator('[data-hn-action="reset"]').click();await page.waitForTimeout(1570);assert.equal(await projection.getAttribute('data-hn-index'),'0');
  await projection.locator('[data-hn-range]').fill('2');await projection.locator('[data-hn-action="play"]').click();await page.waitForTimeout(1570);
  assert.equal(await projection.getAttribute('data-hn-index'),'3');assert.equal(await projection.locator('[data-hn-action="play"]').getAttribute('aria-pressed'),'false');
  checks.push('Projection playback, pause, reset, final stop and independent scene controllers');

  async function checkGeometry(){
   const values=await page.evaluate(()=>[...document.querySelectorAll('[data-hn-wire-layer]')].flatMap(svg=>{
    const origin=svg.getBoundingClientRect(),root=svg.parentElement;
    return [...svg.querySelectorAll('[data-hn-wire-from]')].map(path=>{
     const a=root.querySelector(`[data-hn-anchor="${path.dataset.hnWireFrom}"]`).getBoundingClientRect(),b=root.querySelector(`[data-hn-anchor="${path.dataset.hnWireTo}"]`).getBoundingClientRect();
     const vertical=path.dataset.hnWireAxis==='vertical',start=path.getPointAtLength(0),end=path.getPointAtLength(path.getTotalLength());
     const desiredStart=vertical?[a.x+a.width/2-origin.x,a.bottom-origin.y]:[a.right-origin.x,a.y+a.height/2-origin.y];
     const desiredEnd=vertical?[b.x+b.width/2-origin.x,b.top-origin.y]:[b.left-origin.x,b.y+b.height/2-origin.y];
     return Math.max(Math.abs(start.x-desiredStart[0]),Math.abs(start.y-desiredStart[1]),Math.abs(end.x-desiredEnd[0]),Math.abs(end.y-desiredEnd[1]));
    });
   }));
   assert.equal(values.length,10);assert.ok(values.every(value=>value<1),JSON.stringify(values));
  }
  await page.getByRole('button',{name:'数据冗余',exact:true}).click();
  for(const [name,width,scheme,motion]of [['wide',1440,'light','no-preference'],['pane',720,'dark','no-preference'],['small',320,'light','reduce']]){
   await page.setViewportSize({width,height:1000});await page.emulateMedia({colorScheme:scheme,reducedMotion:motion});await page.waitForTimeout(320);
   const metrics=await page.evaluate(()=>({w:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,bg:getComputedStyle(document.body).backgroundColor,definition:getComputedStyle(document.querySelector('.hn-block')).backgroundColor,toc:document.querySelector('.hn-toc details').open}));
   assert.ok(metrics.scroll<=metrics.w+1);assert.equal(metrics.bg,'rgb(255, 255, 255)');assert.equal(metrics.definition,'rgba(0, 0, 0, 0)');assert.equal(metrics.toc,width>1050);
   await checkGeometry();
   if(width===320){
    const region=page.locator('#projection-board').locator('..');
    assert.ok(await region.evaluate(el=>el.scrollWidth>el.clientWidth));
    await region.evaluate(el=>el.scrollLeft=120);await checkGeometry();
    await projection.locator('[data-hn-range]').fill('1');assert.equal(await page.evaluate(()=>document.getAnimations().length),0);
    await projection.locator('[data-hn-range]').fill('3');
   }
   await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(output,`${name}.png`),fullPage:true});
   checks.push(`${name}: white background, editorial definition, reflow and all measured connector endpoints`);
  }
  await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({colorScheme:'light',reducedMotion:'no-preference'});await page.waitForTimeout(100);
  await page.locator('#copy-board').screenshot({path:path.join(output,'copy-detail.png')});await page.locator('#projection-board').screenshot({path:path.join(output,'projection-detail.png')});

  // Validate reusable connector lifecycle with inserted, hidden and missing anchors.
  const lifecycle=await page.evaluate(async()=>{
   const el=document.createElement('div');el.className='hn-wire-board';el.style.cssText='width:240px;height:100px';
   const a=document.createElement('span');a.dataset.hnAnchor='a';a.textContent='a';a.style.cssText='position:absolute;left:10px;top:10px';
   const b=document.createElement('span');b.dataset.hnAnchor='b';b.textContent='b';b.style.cssText='position:absolute;left:170px;top:60px';
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('hn-wire-layer');svg.dataset.hnWireLayer='';
   const line=document.createElementNS(svg.namespaceURI,'path');line.dataset.hnWireFrom='a';line.dataset.hnWireTo='b';svg.append(line);el.append(a,svg);document.querySelector('main').append(el);
   const api=StudyDiagrams.connect(el),same=StudyDiagrams.connect(el)===api;api.draw();const missing=line.style.display==='none';
   el.append(b);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));const inserted=line.style.display!=='none'&&!!line.getAttribute('d');
   b.hidden=true;api.draw();const hidden=line.style.display==='none';api.destroy();el.remove();return same&&missing&&inserted&&hidden;
  });assert.equal(lifecycle,true);checks.push('Connector idempotence, dynamic anchor insertion, missing/hidden endpoints and disposal');

  await projection.locator('[data-hn-range]').fill('1');await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));await page.emulateMedia({media:'print'});
  assert.equal(await projection.getAttribute('data-hn-index'),'3');assert.equal(await page.locator('.hn-toc').isVisible(),false);
  for(const control of await page.locator('[data-hn-controls]').all())assert.equal(await control.isVisible(),false);
  await page.screenshot({path:path.join(output,'print.png'),fullPage:true});
  await page.evaluate(()=>dispatchEvent(new Event('afterprint')));assert.equal(await projection.getAttribute('data-hn-index'),'1');checks.push('Print restores complete projected tables, hides controls and returns to prior paused step');

  const plain=await browser.newContext({javaScriptEnabled:false,offline:true,viewport:{width:720,height:1000}});
  await plain.route(/^https?:/,route=>{requests.push(route.request().url());return route.abort();});const noJS=await plain.newPage();
  await noJS.goto(pathToFileURL(path.join(root,'assets/reference-note.html')).href);
  assert.deepEqual(await noJS.locator('.hn-block').allTextContents(),knowledge);
  for(const [key,cols]of Object.entries(fields)){
   const actual=await noJS.locator(`[data-projection="${key}"] tbody tr`).evaluateAll(rows=>rows.map(tr=>[...tr.querySelectorAll('td')].map(td=>td.textContent)));
   assert.deepEqual(actual,project(cols,true));
  }
  assert.equal(await noJS.locator('figure').count(),2);assert.equal(await noJS.locator('.hn-outcome').count(),4);
  await noJS.screenshot({path:path.join(output,'no-script.png'),fullPage:true});await plain.close();
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);checks.push('Offline file opening, complete no-script data and unchanged core text; no network or JS errors');
  const report={browser:await browser.version(),checkedAt:new Date().toISOString(),checks,errors,requests,artifacts:output};
  await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
