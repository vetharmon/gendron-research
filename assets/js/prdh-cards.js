/* Original research-card presentation; source screenshots and raw exports stay private. */
(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const anchor = key => 'prdh-' + key.replace(':','-');
  const base = window.GG_BASE || '';
  const site = path => base.replace(/\/$/,'') + path;
  const status = {copied:'Saved transcription', ocr:'OCR · needs review', research:'From research dossier', partial:'Partial notes', reference:'Contents missing'};
  const kinds = {individual:'Individual',family:'Family',act:'Event certificate',couple:'Couple'};
  const candidateLink = cid => `<a href="${site('/candidates/'+cid.toLowerCase()+'/')}">${esc(cid)}</a>`;
  function card(c) {
    const facts = c.facts.map(f => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join('');
    const participants = c.participants.length ? `<div class="prdh-people">${c.participants.map(p => `<div><span>${esc(p.role)}</span><strong>${esc(p.name)}</strong>${p.age?`<small>Age in certificate: ${esc(p.age)}</small>`:''}${p.occupation?`<small>${esc(p.occupation)}</small>`:''}</div>`).join('')}</div>` : '';
    const marriages = (c.marriages||[]).length ? `<h4>Marriages recorded</h4><ol class="prdh-notes">${c.marriages.map(m=>`<li><strong>${esc(m.date_place)}</strong>${m.spouse?` — ${esc(m.spouse)}`:''}${m.father||m.mother?`<br>Spouse’s parents: ${esc([m.father,m.mother].filter(Boolean).join(' & '))}`:''}</li>`).join('')}</ol>` : '';
    const children = c.children.length ? `<h4>Children recorded in the family dossier</h4><div class="prdh-table-wrap"><table><thead><tr><th>Child</th><th>Baptism</th><th>Later record</th></tr></thead><tbody>${c.children.map(ch=>`<tr><td>${esc(ch.name)}</td><td>${esc(ch.baptism)}</td><td>${esc(ch.later)}</td></tr>`).join('')}</tbody></table></div>` : '';
    const related = c.related_candidates.length ? `<p class="prdh-related">Research candidates in this family: ${c.related_candidates.map(r => candidateLink(r.candidate)+' '+esc(r.name)).join(' · ')}. This is not a complete child list.</p>` : '';
    return `<article class="prdh-card prdh-${esc(c.kind)}" id="${anchor(c.key)}"><header><div class="prdh-card-meta"><span>${esc(c.event||kinds[c.kind])}</span><span class="prdh-state ${esc(c.recovery)}">${esc(status[c.recovery])}</span></div><h3>${esc(c.title)}</h3><p class="prdh-number">PRDH ${esc(kinds[c.kind].toLowerCase())} · ${esc(c.id)}</p></header>${c.warning?`<p class="prdh-warning"><strong>Linkage caution.</strong> ${esc(c.warning)}</p>`:''}${facts?`<dl class="prdh-facts">${facts}</dl>`:''}${participants}${marriages}${children}${related}${c.notes.length?`<ul class="prdh-notes">${c.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul>`:''}<footer>${c.dossier?`<a href="${site(c.dossier)}">Family dossier →</a> · `:''}<a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">PRDH source ↗</a><span class="hint">Opening PRDH may use a hit.</span><details class="prdh-provenance"><summary>Saved-source references</summary><p>${c.sources.map(esc).join('<br>')}</p><p>These references identify private working copies, not images hosted here. A saved transcription is not independent verification of an original act.</p></details></footer></article>`;
  }
  function missing(label, id, text) {return `<article class="prdh-card prdh-missing" id="${id}"><div class="prdh-card-meta"><span>${esc(label)}</span><span class="prdh-state reference">Not recovered</span></div><h3>${esc(label)} card</h3><p>${esc(text)}</p></article>`;}
  function candidateView(data, root) {
    const row = data.coverage.find(r=>r.candidate===root.dataset.prdhCandidate);
    if (!row) {root.querySelector('.prdh-card-list').textContent='This candidate is not yet mapped in the recovery index.';return;}
    const map = new Map(data.cards.map(c=>[c.key,c]));
    const records = row.cards.map(k=>map.get(k)).filter(Boolean);
    const groups = [
      ['Individual', records.filter(c=>c.kind==='individual'), 'The individual card has not been recovered.'],
      ['Baptism', records.filter(c=>c.key==='act:'+row.baptism_act), 'The baptism certificate has not been recovered.'],
      ['Burial', records.filter(c=>c.event==='Burial'), 'No burial card has been securely linked in this recovery. This does not establish that no burial exists.'],
      ['Family', records.filter(c=>c.kind==='family'||c.kind==='couple'), 'No family card has been securely linked in this recovery.']
    ];
    const used = new Set(); let markup=''; const shortcuts=[];
    for (const [label, list, gap] of groups) {
      const id = list.length ? anchor(list[0].key) : 'prdh-gap-'+label.toLowerCase();
      const usable=list.some(c=>['copied','ocr','research'].includes(c.recovery));
      shortcuts.push(`<a href="#${id}"><span>${esc(label)}</span><small>${usable?'Saved':list.length?'Reference only':'Not recovered'}</small></a>`);
      markup += list.length ? list.map(c=>{used.add(c.key);return card(c);}).join('') : missing(label,id,gap);
    }
    markup += records.filter(c=>!used.has(c.key)).map(card).join('');
    root.querySelector('.prdh-card-list').innerHTML=markup;
    document.querySelector('.prdh-shortcuts').innerHTML=shortcuts.join('');
  }
  function indexView(data, root) {
    const search=root.querySelector('[data-prdh-search]'),kind=root.querySelector('[data-prdh-kind]'),recovery=root.querySelector('[data-prdh-recovery]'),count=root.querySelector('[data-prdh-count]'),list=root.querySelector('[data-prdh-list]');
    let limit=30;
    function draw() {
      const q=search.value.trim().toLowerCase();
      const matches=data.cards.filter(c=>(!kind.value||c.kind===kind.value)&&(!recovery.value||c.recovery===recovery.value)&&(!q||JSON.stringify(c).toLowerCase().includes(q)));
      count.textContent=`${matches.length} matching records · showing ${Math.min(matches.length,limit)}`;
      list.innerHTML=matches.slice(0,limit).map(card).join('') || '<p>No matching cards.</p>';
      root.querySelector('[data-prdh-more]').hidden=matches.length<=limit;
    }
    for (const el of [search,kind,recovery]) el.addEventListener('input',()=>{limit=30;draw();});
    root.querySelector('[data-prdh-more]').addEventListener('click',()=>{limit+=30;draw();});
    search.value=new URLSearchParams(location.search).get('candidate')||'';draw();
    const byRecovery={};for (const c of data.cards) byRecovery[c.recovery]=(byRecovery[c.recovery]||0)+1;
    root.querySelector('[data-prdh-summary]').textContent=`${byRecovery.copied||0} saved transcriptions · ${byRecovery.ocr||0} OCR records · ${byRecovery.research||0} dossier records · ${(byRecovery.reference||0)+(byRecovery.partial||0)} partial or missing records`;
  }
  const root=document.querySelector('[data-prdh-candidate], [data-prdh-index]');
  if (!root) return;
  const header=document.querySelector('.top');
  if (header) {
    const offset=()=>document.documentElement.style.setProperty('--prdh-scroll-offset',`${Math.ceil(header.getBoundingClientRect().height)+24}px`);
    offset();
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(offset).observe(header);
    else window.addEventListener('resize',offset);
  }
  fetch(root.dataset.prdhUrl).then(r=>{if(!r.ok)throw new Error('Could not load the saved record file.');return r.json();}).then(data=>{
    if (root.hasAttribute('data-prdh-index')) indexView(data,root);
    else candidateView(data,root);
    // Saved-card anchors only exist after the record file has loaded.
    if (location.hash.startsWith('#prdh-')) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }).catch(()=>{
    const dest=root.querySelector('.prdh-card-list, [data-prdh-list]');dest.textContent='The saved cards could not be loaded. Reload this page to try again.';
  });
})();
