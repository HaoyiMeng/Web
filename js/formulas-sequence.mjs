// A topic can contain a sequence of focused, independently expandable cards.
export function renderSequence(item, group, {escape, equations, paragraphs}) {
  const blocks = entries => entries.map(entry => `<section class="formula-section"><h3>${escape(entry.title)}</h3><p>${escape(entry.text)}</p>${equations(entry.equations)}</section>`).join('');
  return `<a class="formula-back" href="#">返回公式目录</a>
    <header class="formula-detail-head"><span class="formula-group-badge">${escape(group.label)}</span><span class="formula-category">${escape(item.category)}</span>
    <h1 class="formula-title" id="formula-title" tabindex="-1">${escape(item.name)}</h1><p class="formula-subtitle">${escape(item.italian)}</p></header>
    <div class="formula-question"><h2>从扰动速度走到压力</h2><p>${escape(item.question)}</p></div>
    <div class="formula-sequence-intro"><span>GUIDED THEORY · ${item.cards.length} CHAPTERS</span><h2>从速度扰动，到压力系数。</h2><p>沿着物理推导逐章阅读，也可以跳到需要复习的环节。</p></div>
    <div class="formula-sequence-layout"><nav class="formula-jumps formula-sequence-nav" aria-label="本篇章节"><div class="formula-sequence-nav-title"><span>STUDY PATH</span><strong>章节导航</strong><small>${String(item.cards.length).padStart(2,'0')} STEPS</small></div>${item.cards.map((card,index) => `<button type="button" data-jump="thin-${card.id}"${index === 0 ? ' aria-current="step"' : ''}>${escape(card.title)}</button>`).join('')}</nav>
    <div class="formula-sequence-reader"><p class="formula-sequence-hint">按顺序阅读，也可以单独展开一张卡片。长公式可在框内左右滑动。</p>
    <div class="formula-sequence-tools" role="group" aria-label="章节展开控制"><button type="button" data-formula-expand="all">全部展开</button><button type="button" data-formula-expand="none">全部收起</button></div>
    <div class="formula-subcards">${item.cards.map((card, index) => `<details class="formula-subcard"${index === 0 ? ' open' : ''}>
      <summary><span class="formula-subcard-order">${String(index+1).padStart(2,'0')}</span><span><strong id="thin-${card.id}" tabindex="-1">${escape(card.title)}</strong><span class="formula-subcard-english" lang="en">${escape(card.english)}</span><span class="formula-subcard-description">${escape(card.summary)}</span></span></summary>
      <div class="formula-subcard-body">${blocks(card.blocks)}<p class="formula-takeaway">${escape(card.takeaway)}</p></div></details>`).join('')}</div></div></div>
    <div class="formula-sequence-extras"><span>REFERENCE &amp; NOTES</span><h2>附录与延伸</h2><p>符号约定与适用条件，按需查阅。</p></div>
    <details class="formula-supplement"><summary>符号与适用条件</summary><div><dl class="formula-term-list">${item.terms.map(([term,definition])=>`<dt>${escape(term)}</dt><dd>${escape(definition)}</dd>`).join('')}</dl><section class="formula-conditions"><h2>适用条件</h2><ul>${item.conditions.map(text=>`<li>${escape(text)}</li>`).join('')}</ul></section></div></details>
    ${item.supplement.length ? `<details class="formula-supplement"><summary>补充结论</summary><div>${blocks(item.supplement)}</div></details>` : ''}
    <section class="formula-sources"><h2>参考与实验</h2><p>${escape(item.sourceNote)}</p>${item.sources.map(source=>`<a href="${escape(source.url)}">${escape(source.title)}</a>`).join('')}</section>`;
}

