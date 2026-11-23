const year = document.querySelector('#current-year');
if (year) year.textContent = String(new Date().getFullYear());

const RECENT_KEY = 'haoyi-studio-recent-v1';
const pages = {
  'potential-flow.html': { kind: 'physics', title: '势流与流场叠加', subtitle: 'Potential Flow · 圆柱绕流', icon: 'M4 8c5-5 11-5 16 0M4 16c5 5 11 5 16 0' },
  'glauert.html': { kind: 'physics', title: 'Glauert 薄翼理论', subtitle: 'Fourier Coefficients · 涡片与环量', icon: 'M2 17c5-8 13-12 20-8M3 19h18M5 13l3-4 3 4' },
  'perturbation.html': { kind: 'physics', title: '薄翼小扰动理论', subtitle: 'Thin Airfoil Theory · 压力与升力', icon: 'M2 15c5-7 10-8 20-3-8 1-14 3-20 3zM2 15h20' },
  'numbers.html': { kind: 'library', title: '工程无量纲数', subtitle: 'Dimensionless Numbers · Re 与 Ma', icon: 'M9 3 5 21M18 3l-4 18M3 9h18M2 15h18' },
  'formulas.html': { kind: 'library', title: '流体力学公式', subtitle: 'Fluid Mechanics Equations · 定理与推导', icon: 'M18 4H6l7 8-7 8h12M4 4h2M4 20h2' },
  'conformal.html': { kind: 'physics', title: '保角变换与翼型', subtitle: 'Conformal Mapping · Joukowski 翼型', icon: 'M2 15c5-7 10-8 20-3-8 1-14 3-20 3zM2 15h20' },
  'nozzle.html': { kind: 'physics', title: '拉瓦尔喷管', subtitle: 'De Laval Nozzle · 可压缩流', icon: 'M2 5h4l5 5h3l5-5h3M2 19h4l5-5h3l5 5h3M3 12h18' },
  'metronome.html': { kind: 'music', title: '在线节拍器', subtitle: 'Metronome · BPM 与拍号', icon: 'M12 3a9 9 0 1 0 9 9M12 12l4-4M12 3v4' },
  'bass.html': { kind: 'music', title: '贝斯指板与乐理', subtitle: 'Bass Fretboard · 音程和弦', icon: 'M4 4v16m5-16v16m5-16v16m5-16v16M2 8h20M2 15h20' },
  'reading-paths.html': { kind: 'library', title: '专题阅读路线', subtitle: 'Topic Reading Paths · 学科路线', icon: 'M12 20c-2.5-2-5.5-3-9-3V4c3.5 0 6.5 1 9 3 2.5-2 5.5-3 9-3v13c-3.5 0-6.5 1-9 3Zm0-13v13' },
  'timer.html': { kind: 'focus', title: '专注计时与任务', subtitle: 'Focus Timer · 学习记录', icon: 'M9 2h6m-3 4v2m0 13a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-13v5l3 2' },
};
const isPage = (path) => Object.prototype.hasOwnProperty.call(pages, path);
const currentPage = window.location.pathname.split('/').pop() || 'index.html';

function readRecent() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(saved) ? [...new Set(saved.filter(isPage))].slice(0, 2) : [];
  } catch {
    return [];
  }
}

const recent = readRecent();
if (isPage(currentPage)) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify([currentPage, ...recent.filter((path) => path !== currentPage)].slice(0, 2)));
  } catch {
    // The site still works when browser storage is unavailable.
  }
}

const panel = document.querySelector('[data-quick-panel]');
if (panel && recent.length) {
  const rows = [...panel.querySelectorAll('[data-quick-row]')];
  const destinations = [...new Set([...recent, 'nozzle.html', 'metronome.html', 'timer.html', 'bass.html', 'reading-paths.html'])].slice(0, rows.length);
  const heading = panel.querySelector('[data-quick-heading]');
  if (heading) heading.textContent = '继续探索';

  rows.forEach((row, index) => {
    const path = destinations[index];
    if (!path) return;
    row.href = `./${path}`;
    row.dataset.category = pages[path].kind;
    const title = row.querySelector('[data-quick-title]');
    const subtitle = row.querySelector('[data-quick-subtitle]');
    const icon = row.querySelector('[data-quick-icon]');
    if (title) title.textContent = pages[path].title;
    if (subtitle) subtitle.textContent = pages[path].subtitle;
    if (icon) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '1.7');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      const shape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      shape.setAttribute('d', pages[path].icon);
      svg.append(shape);
      icon.replaceChildren(svg);
    }
  });
}

