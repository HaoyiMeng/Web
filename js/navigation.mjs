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

  function setGroupOpen(item, open) {
    item.button.setAttribute('aria-expanded', String(open));
    item.submenu.hidden = !open;
    item.group.classList.toggle('is-open', open);
  }

  function closeGroups() {
    groups.forEach((item) => setGroupOpen(item, false));
  }

  function setMenuOpen(open) {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
    navigation.classList.toggle('is-open', open);
    if (!open) closeGroups();
  }

  groups.forEach((item) => {
    setGroupOpen(item, false);
    item.button.addEventListener('click', () => {
      const shouldOpen = item.button.getAttribute('aria-expanded') !== 'true';
      closeGroups();
      if (shouldOpen) setGroupOpen(item, true);
    });
  });

  setMenuOpen(false);

  menuButton.addEventListener('click', () => {
    setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true');
  });

  navigation.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) {
      setMenuOpen(false);
    }
  });

  document.addEventListener('click', (event) => {
    if (!navigation.contains(event.target) && !menuButton.contains(event.target)) {
      setMenuOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;

    const menuWasOpen = menuButton.getAttribute('aria-expanded') === 'true';
    const openGroup = groups.find(({ button }) => button.getAttribute('aria-expanded') === 'true');
    if (!menuWasOpen && !openGroup) return;

    event.preventDefault();
    setMenuOpen(false);
    (menuWasOpen ? menuButton : openGroup.button).focus();
  });

  window.addEventListener('hashchange', () => setMenuOpen(false));
}
