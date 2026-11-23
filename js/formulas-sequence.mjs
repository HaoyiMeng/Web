// A topic can contain a sequence of focused, independently expandable cards.
export function renderSequence(item, group, {escape, equations, paragraphs}) {
  const blocks = entries => entries.map(entry => `<section class="formula-section"><h3>${escape(entry.title)}</h3><p>${escape(entry.text)}</p>${equations(entry.equations)}</section>`).join('');
  return `<a class="formula-back" href="#">返回公式目录</a>
    <header class="formula-detail-head"><span class="formula-group-badge">${escape(group.label)}</span><span class="formula-category">${escape(item.category)}</span>
    <h1 class="formula-title" id="formula-title" tabindex="-1">${escape(item.name)}</h1><p class="formula-subtitle">${escape(item.italian)}</p></header>
    <div class="formula-question"><h2>从扰动速度走到压力</h2><p>${escape(item.question)}</p></div>
    <nav class="formula-jumps" aria-label="本篇内容">${item.cards.map(card => `<button type="button" data-jump="thin-${card.id}">${escape(card.title)}</button>`).join('')}</nav>
    <p class="formula-sequence-hint">按顺序阅读，也可以单独展开一张卡片。长公式可在框内左右滑动。</p>
    <div class="formula-subcards">${item.cards.map((card, index) => `<details class="formula-subcard"${index === 0 ? ' open' : ''}>
      <summary><span class="formula-subcard-order">${String(index+1).padStart(2,'0')}</span><span><strong id="thin-${card.id}" tabindex="-1">${escape(card.title)}</strong><span class="formula-subcard-english" lang="en">${escape(card.english)}</span><span class="formula-subcard-description">${escape(card.summary)}</span></span></summary>
      <div class="formula-subcard-body">${blocks(card.blocks)}<p class="formula-takeaway">${escape(card.takeaway)}</p></div></details>`).join('')}</div>
    <details class="formula-supplement"><summary>符号与适用条件</summary><div><dl class="formula-term-list">${item.terms.map(([term,definition])=>`<dt>${escape(term)}</dt><dd>${escape(definition)}</dd>`).join('')}</dl><section class="formula-conditions"><h2>适用条件</h2><ul>${item.conditions.map(text=>`<li>${escape(text)}</li>`).join('')}</ul></section></div></details>
    <details class="formula-supplement"><summary>后续补充：Kutta 条件、升力与薄平板</summary><div>${blocks(item.supplement)}<section class="formula-meaning">${paragraphs(item.meaning)}</section></div></details>
    <section class="formula-sources"><h2>参考与实验</h2><p>${escape(item.sourceNote)}</p>${item.sources.map(source=>`<a href="${escape(source.url)}">${escape(source.title)}</a>`).join('')}</section>`;
}
