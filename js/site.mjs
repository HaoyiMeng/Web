const year = document.querySelector('#current-year');
if (year) year.textContent = String(new Date().getFullYear());

const RECENT_KEY = 'haoyi-studio-recent-v1';
const pages = {
  'nozzle.html': { title: 'De Laval Nozzle', subtitle: '调节背压，观察喷管流动', icon: 'M2 5h4l5 5h3l5-5h3M2 19h4l5-5h3l5 5h3M3 12h18' },
  'metronome.html': { title: 'Metronome', subtitle: '开始节奏练习 · 调节 BPM', icon: 'M12 3a9 9 0 1 0 9 9M12 12l4-4M12 3v4' },
  'bass.html': { title: 'Bass Fretboard', subtitle: '查看音阶与指板位置', icon: 'M4 4v16m5-16v16m5-16v16m5-16v16M2 8h20M2 15h20' },
  'reading-paths.html': { title: 'Reading Paths', subtitle: '浏览主题阅读线索', icon: 'M12 20c-2.5-2-5.5-3-9-3V4c3.5 0 6.5 1 9 3 2.5-2 5.5-3 9-3v13c-3.5 0-6.5 1-9 3Zm0-13v13' },
  'timer.html': { title: 'Focus Timer', subtitle: '开始一段专注时间', icon: 'M9 2h6m-3 4v2m0 13a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-13v5l3 2' },
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
  const destinations = [...new Set([...recent, 'nozzle.html', 'bass.html'])].slice(0, 2);
  const heading = panel.querySelector('[data-quick-heading]');
  if (heading) heading.textContent = '继续探索';

  panel.querySelectorAll('[data-quick-row]').forEach((row, index) => {
    const path = destinations[index];
    if (!path) return;
    row.href = `./${path}`;
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
