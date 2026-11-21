const menuButton = document.querySelector('.nav-toggle');
const navigation = document.querySelector('#primary-nav');

if (menuButton && navigation) {
  const groups = [...navigation.querySelectorAll('.nav-group')]
    .map((group) => ({
      group,
      button: group.querySelector(':scope > .nav-group-toggle'),
      submenu: group.querySelector(':scope > .nav-submenu'),
    }))
    .filter(({ button, submenu }) => button && submenu);

  const currentPage = location.pathname.split('/').pop() || 'index.html';
  const parentPage = {
    'nozzle.html': 'physics.html',
    'bass.html': 'music.html',
    'metronome.html': 'music.html',
    'reading-paths.html': 'library.html',
    'timer.html': 'focus.html',
  }[currentPage] || currentPage;

  navigation.querySelectorAll('a[href]').forEach((link) => {
    const target = new URL(link.href).pathname.split('/').pop() || 'index.html';
    if (target === parentPage) link.classList.add('is-current');
  });

  function closeGroups() {
    groups.forEach(({ group, button, submenu }) => {
      button.setAttribute('aria-expanded', 'false');
      submenu.hidden = true;
      group.classList.remove('is-open');
    });
  }

  function setMenuOpen(open) {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
    navigation.classList.toggle('is-open', open);
    if (!open) closeGroups();
  }

  groups.forEach(({ group, button, submenu }) => {
    submenu.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      closeGroups();
      if (open) {
        submenu.hidden = false;
        button.setAttribute('aria-expanded', 'true');
        group.classList.add('is-open');
      }
    });
  });

  setMenuOpen(false);
  menuButton.addEventListener('click', () => {
    setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true');
  });

  navigation.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) setMenuOpen(false);
  });

  document.addEventListener('click', (event) => {
    if (!navigation.contains(event.target) && !menuButton.contains(event.target)) setMenuOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    if (!open && !groups.some(({ button }) => button.getAttribute('aria-expanded') === 'true')) return;
    event.preventDefault();
    setMenuOpen(false);
    menuButton.focus();
  });
}
