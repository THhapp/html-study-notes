/* Original synthetic data and bindings for information copies and projection. MIT License. */
(() => {
  'use strict';
  const base = [
    {id:'r1',Device:'D01',Area:'北区',Owner:'林原',Task:'巡检',State:'待办'},
    {id:'r2',Device:'D01',Area:'北区',Owner:'林原',Task:'校准',State:'完成'},
    {id:'r3',Device:'D02',Area:'北区',Owner:'林原',Task:'巡检',State:'待办'},
    {id:'r4',Device:'D03',Area:'南区',Owner:'许禾',Task:'巡检',State:'完成'},
  ];
  const columns=['Device','Area','Owner','Task','State'];
  const cases={
    redundancy:{context:'要保存的是“北区当前负责人为林原”。三条作业记录共同承担了这项事实。',area:'北区',owner:'林原',frames:[
      {label:'原始记录。',variant:'base',explanation:'北区负责人这一事实被保存了三次。'},
      {label:'标记同一事实的副本。',variant:'highlight',explanation:'三处都是北区的现任负责人；这里的重复属于同一事实的重复保存。'},
    ]},
    update:{context:'北区负责人从林原改为周宁。一次事实变化要求三份存储副本同步。',area:'北区',owner:'周宁',frames:[
      {label:'变更前。',variant:'base',explanation:'三条北区记录的负责人均为林原。'},
      {label:'只修改 r1：出现违规冲突。',variant:'partial',explanation:'r1 已是周宁，r2、r3 仍是林原；同一区域出现两种负责人取值，不满足 Area→Owner。'},
      {label:'同步其余两份副本。',variant:'all',explanation:'三条北区记录都更新为周宁，恢复依赖约束的一致性。'},
    ]},
    insert:{context:'西区已确定由沈青负责，但尚无设备与作业。待存的是区域事实，不是一条完整作业记录。',area:'西区',owner:'沈青',frames:[
      {label:'区域事实已知，尚未存入清单。',variant:'base',explanation:'清单仍只有原来的四条记录，西区事实还没有存储副本。'},
      {label:'无法仅凭区域事实插入完整元组。',variant:'insert',explanation:'缺少 Device 与 Task，不能虚构作业；区域事实仍未入库，原四行不变。'},
    ]},
    delete:{context:'删除南区唯一设备的作业记录 r4。区域仍存在，负责人事实仍需要保存。',area:'南区',owner:'许禾',frames:[
      {label:'南区事实只剩一份存储副本。',variant:'base',explanation:'r4 同时保存作业事实和“南区由许禾负责”的事实。'},
      {label:'删除 r4：另一层事实随之丢失。',variant:'delete',explanation:'作业行从四行变三行；南区负责人事实的存储副本归零。'},
    ]},
  };
  let active='redundancy';
  let ready=false;
  const change=(root,update)=>ready ? StudyDiagrams.move(root,update) : update();
  const sequence=document.getElementById('copy-sequence');
  const links=document.getElementById('copy-links');
  const board=document.getElementById('copy-board');
  const wires=StudyDiagrams.connect(board);
  const svg=board.querySelector('svg');
  const source=board.querySelector('[data-copy-fact]');
  const targets=board.querySelector('[data-copy-targets]');
  const body=links.querySelector('[data-copy-records]');
  const node=(tag,text,className)=>{const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;return el;};
  let rows=base.map(row=>({...row}));
  function renderCopies(frame) {
    const config=cases[active];rows=base.map(row=>({...row}));
    if(frame.variant==='partial')rows[0].Owner='周宁';
    if(frame.variant==='all')rows.forEach(row=>{if(row.Area==='北区')row.Owner='周宁';});
    if(frame.variant==='delete')rows=rows.filter(row=>row.id!=='r4');
    const copies=rows.filter(row=>row.Area===config.area);
    const conflict=frame.variant==='partial';
    source.classList.toggle('is-lost',frame.variant==='delete');
    source.dataset.hnKey=copies.map(row=>row.id).join(' ');
    source.replaceChildren(node('span','需要保存的区域事实','hn-small'),node('strong',config.area),node('strong','负责人：'+(active==='update'&&frame.variant==='base'?'林原':config.owner)),node('span',frame.variant==='delete'?'最后的存储载体已删除':frame.variant==='insert'?'尚未存入清单':conflict?'副本取值冲突，违反约束':'同一事实的存储位置','hn-small'));
    targets.replaceChildren(...copies.map(row=>{
      const button=node('button','','hn-copy-target');button.type='button';button.dataset.hnAnchor='copy-'+row.id;button.dataset.hnSelect=row.id;button.dataset.hnKey=row.id;button.setAttribute('aria-pressed','false');button.disabled=true;
      if(conflict)button.classList.add('hn-conflict');
      button.append(node('small',`记录 ${row.id} · ${row.Device}／${row.Task}`),node('strong',`${row.Area} · ${row.Owner}`));
      return button;
    }));
    if(!copies.length)targets.append(node('p',active==='delete'?'没有剩余副本：区域信息也随记录消失。':'0 处存储：没有完整作业可承载这项区域事实。','hn-small'));
    svg.replaceChildren(...copies.map(row=>{
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      path.classList.add('hn-wire');path.style.setProperty('--hn-wire-color','var(--hn-purple)');path.dataset.hnWireFrom='fact';path.dataset.hnWireTo='copy-'+row.id;path.dataset.hnWireKey=row.id;path.dataset.hnWireAxis='horizontal';return path;
    }));
    change(body,()=>body.replaceChildren(...rows.map(row=>{
      const tr=document.createElement('tr');tr.dataset.hnItem=row.id;tr.dataset.hnKey=row.id;
      for(const column of columns){
        const td=node('td',row[column]);
        if(column==='Device')td.append(node('span',row.id,'hn-row-label'));
        if(column==='Owner'&&row.Area===config.area){
          if(frame.variant==='highlight')td.classList.add('hn-changed');
          if(conflict)td.classList.add('hn-conflict');
          if(frame.variant==='all')td.classList.add('hn-changed');
        }
        tr.append(td);
      }
      return tr;
    })));
    links.querySelector('[data-copy-identity]').textContent=`区域事实：${config.area} → ${active==='update'&&frame.variant==='base'?'林原':config.owner}`;
    links.querySelector('[data-copy-count]').textContent=conflict?`${copies.length} 处存储 · 2 种冲突取值`:`同一事实 · ${copies.length} 处存储`;
    // Rebind only dynamic buttons: dispose the old group's listeners and reset its selection.
    const old=StudyNotes.mount(links)[0];old.destroy();StudyNotes.mount(links);
    wires.draw();if(ready)wires.pulse();
    sequence.dataset.variant=frame.variant;
  }
  links.addEventListener('hn:select',event=>{
    svg.querySelectorAll('[data-hn-wire-key]').forEach(path=>{
      path.classList.toggle('hn-traced',path.dataset.hnWireKey===event.detail.key);
      path.classList.toggle('hn-faded',!!event.detail.key&&path.dataset.hnWireKey!==event.detail.key);
    });
    if(ready)wires.pulse(event.detail.key?[event.detail.key]:undefined);
  });
  sequence.addEventListener('hn:frame',event=>renderCopies(event.detail.frame));
  const controls=sequence.querySelector('[data-case-controls]');controls.hidden=false;
  controls.querySelectorAll('[data-copy-case]').forEach(button=>button.addEventListener('click',()=>{
    active=button.dataset.copyCase;
    controls.querySelectorAll('button').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));
    sequence.querySelector('[data-copy-context]').textContent=cases[active].context;
    StudyNotes.mount(sequence)[0].setFrames(cases[active].frames);
    sequence.dataset.activeCase=active;
  }));

  const projection=document.getElementById('projection-sequence');
  const attrs=document.getElementById('attribute-links');
  const flow=document.getElementById('projection-board');
  const flows=StudyDiagrams.connect(flow);
  const projections={da:['Device','Area'],ao:['Area','Owner'],dts:['Device','Task','State']};
  attrs.addEventListener('hn:select',event=>{
    const key=event.detail.key;
    flow.querySelectorAll('[data-hn-wire-key]').forEach(path=>{path.classList.toggle('hn-faded',!!key&&path.dataset.hnWireKey!==key);path.classList.toggle('hn-traced',path.dataset.hnWireKey===key);});
    flow.querySelectorAll('[data-projection]').forEach(panel=>panel.classList.toggle('is-filtered',!!key&&!projections[panel.dataset.projection].includes(key)));
    if(ready)flows.pulse(key?[key]:undefined);
  });
  projection.addEventListener('hn:frame',event=>{
    const stage=event.detail.frame.stage;
    const linked=StudyNotes.mount(attrs)[0];linked.select('');
    for(const [key,columns] of Object.entries(projections)){
      const panel=flow.querySelector(`[data-projection="${key}"]`),tbody=panel.querySelector('tbody');
      const raw=base.map(row=>columns.map(column=>row[column]));
      const seen=new Set();const data=stage===0?[]:stage===1?raw:raw.filter(row=>{const k=JSON.stringify(row);if(seen.has(k))return false;seen.add(k);return true;});
      const occurrences=new Map();
      change(tbody,()=>{
        tbody.replaceChildren(...data.map(row=>{
          const value=JSON.stringify(row),n=occurrences.get(value)||0;occurrences.set(value,n+1);
          const tr=document.createElement('tr');tr.dataset.hnItem=`${key}:${value}:${n}`;
          if(n)tr.className='hn-duplicate';
          row.forEach((value,j)=>{const td=node('td',value);td.dataset.hnKey=columns[j];if(n&&j===0)td.append(node('span','重复','hn-row-label'));tr.append(td);});return tr;
        }));
        if(!data.length){const tr=document.createElement('tr'),td=node('td','等待投影');td.colSpan=columns.length;tr.append(td);tbody.append(tr);}
      });
      panel.querySelector('[data-projection-count]').textContent=stage===0?'等待':stage===1?`${data.length} 条（未去重）`:`${data.length} 行`;
      panel.classList.toggle('hn-good',stage===3);
    }
    projection.dataset.stage=String(stage);
    flows.draw();if(ready&&stage>0)flows.pulse();
  });
  // Present the completed projection by default; all earlier steps remain reachable.
  StudyNotes.mount(document);
  StudyNotes.mount(projection)[0].go(3);
  ready=true;
  const media=matchMedia('(max-width:1050px)'),toc=document.querySelector('.hn-toc details');
  const resize=()=>{toc.open=!media.matches;wires.refresh();flows.refresh();};
  media.addEventListener('change',resize);resize();
  let printedIndex=null;
  window.addEventListener('beforeprint',()=>{
    const controller=StudyNotes.mount(projection)[0];printedIndex=controller.index;
    ready=false;controller.go(3);ready=true;
  });
  window.addEventListener('afterprint',()=>{
    if(printedIndex===null)return;
    ready=false;StudyNotes.mount(projection)[0].go(printedIndex);ready=true;printedIndex=null;
  });
})();
