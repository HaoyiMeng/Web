const display = document.querySelector('#timer-display');
const toggle = document.querySelector('#timer-toggle');
const reset = document.querySelector('#timer-reset');
const status = document.querySelector('#timer-status');
const mode = document.querySelector('#timer-mode');
const progress = document.querySelector('#timer-progress-fill');
const presets = [...document.querySelectorAll('[data-focus-minutes]')];

if (display && toggle && reset && status && mode && progress && presets.length) {
  let duration = 25 * 60;
  let remaining = duration;
  let deadline = 0;
  let running = false;
  let interval;

  function render() {
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    display.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    progress.style.width = `${Math.min(100, Math.max(0, (1 - remaining / duration) * 100))}%`;
    toggle.textContent = running ? '暂停计时' : remaining === 0 ? '重新开始' : remaining === duration ? '开始计时' : '继续计时';
  }

  function stop() {
    running = false;
    clearInterval(interval);
    interval = undefined;
  }

  function tick() {
    remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    if (remaining === 0) {
      stop();
      status.textContent = '这一段时间结束了。休息一下，再继续探索。';
    }
    render();
  }

  toggle.addEventListener('click', () => {
    if (running) {
      tick();
      stop();
      status.textContent = '已暂停。';
    } else {
      if (remaining === 0) remaining = duration;
      deadline = Date.now() + remaining * 1000;
      running = true;
      status.textContent = '正在计时。';
      interval = setInterval(tick, 250);
    }
    render();
  });

  reset.addEventListener('click', () => {
    stop();
    remaining = duration;
    status.textContent = '计时已重置。';
    render();
  });

  presets.forEach((preset) => preset.addEventListener('click', () => {
    stop();
    duration = Number(preset.dataset.focusMinutes) * 60;
    remaining = duration;
    mode.textContent = `${preset.dataset.focusLabel}时间`;
    presets.forEach((button) => button.classList.toggle('active', button === preset));
    status.textContent = `已选择${preset.dataset.focusLabel}模式。`;
    render();
  }));

  render();
}
