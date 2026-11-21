const $ = (id) => document.getElementById(id);
const KEY = 'haoyi-studio-focus-v2';
const display = $('timer-display');
const toggle = $('timer-toggle');
const reset = $('timer-reset');
const status = $('timer-status');
const mode = $('timer-mode');
const progress = $('timer-progress-fill');
const presets = [...document.querySelectorAll('[data-focus-minutes]')];
const taskField = $('focus-task');
const todayMinutes = $('today-minutes');
const todaySessions = $('today-sessions');
const sevenDays = $('week-minutes');
const latest = $('focus-recent-list');
const taskInput = $('task-input');
const taskAdd = $('task-add');
const tasksElement = $('task-list');

const secondsIn = (value) => Math.max(0, Math.floor(Number(value) || 0));
const today = () => { const d=new Date(); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); };
const fresh = () => ({
  mode: '专注', duration: 1500, remaining: 1500,
  running: false, deadline: null, focusTask: '', history: [], tasks: []
});
let state = fresh();
try {
  const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (raw && typeof raw === 'object') {
    state = {
      ...state, ...raw,
      duration: [300,900,1500,3000].includes(raw.duration) ? raw.duration : 1500,
      history: Array.isArray(raw.history) ? raw.history.slice(-500) : [],
      tasks: Array.isArray(raw.tasks) ? raw.tasks.slice(-100) : [],
      focusTask: typeof raw.focusTask === 'string' ? raw.focusTask.slice(0,120) : ''
    };
    state.remaining = Math.min(state.duration, secondsIn(state.remaining));
  }
} catch { /* local storage may be blocked; timer still works */ }

const persist = () => {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch { /* private browsing or full quota */ }
};
let interval = null;

function complete() {
  state.running = false;
  state.deadline = null;
  state.remaining = 0;
  if (state.mode === '专注') {
    state.history.push({day: today(), minutes: Math.round(state.duration / 60), task: state.focusTask.trim().slice(0,120)});
    state.history = state.history.slice(-500);
  }
  persist();
  renderStats();
  status.textContent = state.mode === '专注' ? '已完成一段专注，记录已保存。' : '短休息结束，可以继续了。';
}
function tick() {
  if (!state.running) return;
  if (Date.now() - Number(state.deadline) > 10 * 60 * 1000) {
    state.running=false;state.deadline=null;state.remaining=state.duration;
    window.clearInterval(interval);interval=null;
    status.textContent='上次计时已中断，未计入专注记录。';
    persist();renderTimer();return;
  }
  state.remaining = Math.max(0, Math.ceil((Number(state.deadline) - Date.now()) / 1000));
  if (state.remaining === 0) {
    window.clearInterval(interval); interval = null;
    complete();
  }
  renderTimer();
}
function stopClock() {
  window.clearInterval(interval);
  interval = null;
  if (state.running) state.remaining = Math.max(0, Math.ceil((Number(state.deadline) - Date.now()) / 1000));
  state.running = false; state.deadline = null;
  persist();
}
function startClock() {
  if (state.remaining <= 0) state.remaining = state.duration;
  state.running = true;
  state.deadline = Date.now() + state.remaining * 1000;
  persist();
  status.textContent = '正在专注。这个页面可保留在前台，也可稍后返回查看。';
  window.clearInterval(interval);
  interval = window.setInterval(tick, 250);
  tick();
}
function renderTimer() {
  if (!display) return;
  display.textContent = String(Math.floor(state.remaining/60)).padStart(2,'0') + ':' + String(state.remaining%60).padStart(2,'0');
  progress.style.width = Math.min(100, Math.max(0,(1 - state.remaining/state.duration)*100)) + '%';
  toggle.textContent = state.running ? '暂停计时' : state.remaining===0 ? '再来一轮' : state.remaining===state.duration ? '开始计时' : '继续计时';
  mode.textContent = state.mode + '时间';
  presets.forEach(button => button.classList.toggle('active', Number(button.dataset.focusMinutes)*60===state.duration && button.dataset.focusLabel===state.mode));
  document.title = (state.running ? display.textContent + ' · ' : '') + 'Focus Timer — Haoyi Studio';
}
function renderStats() {
  const entries = state.history;
  const todays = entries.filter(item => item.day === today());
  if (todayMinutes) todayMinutes.textContent = String(todays.reduce((sum,item)=>sum+secondsIn(item.minutes),0));
  if (todaySessions) todaySessions.textContent = String(todays.length);
  if (sevenDays) {
    const cutoff=new Date();cutoff.setHours(0,0,0,0);cutoff.setDate(cutoff.getDate()-6);
    sevenDays.textContent = String(entries.filter(item=>new Date(item.day+'T12:00:00')>=cutoff).reduce((sum,item)=>sum+secondsIn(item.minutes),0));
  }
  if (latest) {
    latest.replaceChildren();
    const recent = [...entries].reverse().slice(0,5);
    if (!recent.length) {
      const p=document.createElement('p');p.className='focus-empty';p.textContent='还没有记录。完成第一轮专注后，会在这里显示。';latest.append(p);return;
    }
    recent.forEach(item=>{
      const row=document.createElement('div');row.className='focus-record';
      const label=document.createElement('span');label.textContent=item.task || '未命名的专注';
      const meta=document.createElement('small');meta.textContent=item.day + ' · ' + item.minutes + ' min';
      row.append(label,meta);latest.append(row);
    });
  }
}
function renderTasks() {
  if (!tasksElement) return;
  tasksElement.replaceChildren();
  if (!state.tasks.length) {
    const p=document.createElement('p');p.className='focus-empty';p.textContent='还没有任务。写下今天想搞明白的一件事。';tasksElement.append(p);return;
  }
  state.tasks.forEach(item=>{
    const row=document.createElement('div');row.className='focus-task-row';
    const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=Boolean(item.done);checkbox.setAttribute('aria-label','完成任务 '+item.text);
    checkbox.addEventListener('change',()=>{item.done=checkbox.checked;persist();renderTasks();});
    const title=document.createElement('span');title.textContent=item.text;if(item.done)title.classList.add('is-done');
    const use=document.createElement('button');use.type='button';use.textContent='专注此项';use.addEventListener('click',()=>{state.focusTask=item.text;if(taskField)taskField.value=item.text;persist();document.getElementById('focus-timer')?.scrollIntoView({behavior:'smooth',block:'center'});});
    const del=document.createElement('button');del.type='button';del.textContent='×';del.className='focus-remove';del.setAttribute('aria-label','删除任务 '+item.text);del.addEventListener('click',()=>{state.tasks=state.tasks.filter(t=>t.id!==item.id);persist();renderTasks();});
    row.append(checkbox,title,use,del);tasksElement.append(row);
  });
}
if (display && toggle && reset && status && mode && progress && presets.length) {
  if (taskField) {
    taskField.value=state.focusTask;
    taskField.addEventListener('input',()=>{state.focusTask=taskField.value.slice(0,120);persist();});
  }
  toggle.addEventListener('click',()=>{
    if (state.running) {stopClock();status.textContent='已暂停。';}
    else startClock();
    renderTimer();
  });
  reset.addEventListener('click',()=>{stopClock();state.remaining=state.duration;persist();status.textContent='已重置，不会记录未完成的专注。';renderTimer();});
  presets.forEach(button=>button.addEventListener('click',()=>{
    stopClock();state.duration=Number(button.dataset.focusMinutes)*60;state.remaining=state.duration;state.mode=button.dataset.focusLabel;persist();
    status.textContent='已切换到'+state.mode+'模式。';renderTimer();
  }));
  if (state.running) {
    const restoredRemaining = Math.max(0, Math.ceil((Number(state.deadline)-Date.now()) / 1000));
    if (restoredRemaining===0) {
      if (Date.now() - Number(state.deadline) > 10*60*1000) {
        state.running=false;state.deadline=null;state.remaining=state.duration;
        status.textContent='上次计时已过期，未计入记录。';persist();
      } else complete();
    }
    else {state.remaining=restoredRemaining;interval=window.setInterval(tick,250);status.textContent='已恢复上次的计时。';}
  }
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
  window.addEventListener('pageshow',tick);
  taskAdd?.addEventListener('click',()=>{
    const value=taskInput.value.trim().slice(0,120);
    if(!value)return;
    state.tasks.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),text:value,done:false});
    state.tasks=state.tasks.slice(-100);taskInput.value='';persist();renderTasks();taskInput.focus();
  });
  taskInput?.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();taskAdd.click();}});
  renderTimer();renderStats();renderTasks();
}
