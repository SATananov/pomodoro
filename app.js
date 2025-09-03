// --- State ---
const el = {
  time: document.getElementById('time'),
  mode: document.getElementById('mode'),
  start: document.getElementById('start'),
  pause: document.getElementById('pause'),
  reset: document.getElementById('reset'),
  skip: document.getElementById('skip'),
  focusMin: document.getElementById('focusMin'),
  breakMin: document.getElementById('breakMin'),
  longBreakMin: document.getElementById('longBreakMin'),
  cycles: document.getElementById('cycles'),
  save: document.getElementById('save'),
  completed: document.getElementById('completed'),
  beep: document.getElementById('beep'),
};

const MODES = { FOCUS: 'Фокус', BREAK: 'Почивка', LONG: 'Дълга почивка' };

let settings = loadSettings() || { focus: 25, rest: 5, long: 15, cycles: 4 };
applySettingsToInputs();

let state = {
  mode: MODES.FOCUS,
  remaining: settings.focus * 60,
  timer: null,
  running: false,
  cycleCount: 0,        // брои кратки почивки до дългата
  completedFocus: 0,
};

updateUI();

// --- Events ---
el.start.addEventListener('click', startTimer);
el.pause.addEventListener('click', pauseTimer);
el.reset.addEventListener('click', resetTimer);
el.skip.addEventListener('click', nextPhase);
el.save.addEventListener('click', saveSettings);

// --- Functions ---
function startTimer() {
  if (state.running) return;
  state.running = true;
  tick();
  state.timer = setInterval(tick, 1000);
}

function pauseTimer() {
  if (!state.running) return;
  clearInterval(state.timer);
  state.running = false;
}

function resetTimer() {
  pauseTimer();
  state.mode = MODES.FOCUS;
  state.remaining = settings.focus * 60;
  state.cycleCount = 0;
  updateUI();
}

function nextPhase() {
  // смяна на режим
  if (state.mode === MODES.FOCUS) {
    state.completedFocus++;
    el.completed.textContent = state.completedFocus;
    state.cycleCount++;
    if (state.cycleCount >= settings.cycles) {
      state.mode = MODES.LONG;
      state.cycleCount = 0;
      state.remaining = settings.long * 60;
    } else {
      state.mode = MODES.BREAK;
      state.remaining = settings.rest * 60;
    }
  } else {
    state.mode = MODES.FOCUS;
    state.remaining = settings.focus * 60;
  }
  notify();
  updateUI();
}

function tick() {
  if (state.remaining <= 0) {
    nextPhase();
    return;
  }
  state.remaining -= 1;
  updateTime();
}

function updateUI() {
  el.mode.textContent = state.mode;
  updateTime();
}

function updateTime() {
  const m = Math.floor(state.remaining / 60);
  const s = state.remaining % 60;
  el.time.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  document.title = `${el.time.textContent} • ${state.mode} • Pomodoro`;
}

function saveSettings() {
  settings = {
    focus: clamp(parseInt(el.focusMin.value), 1, 240),
    rest: clamp(parseInt(el.breakMin.value), 1, 120),
    long: clamp(parseInt(el.longBreakMin.value), 1, 180),
    cycles: clamp(parseInt(el.cycles.value), 1, 12),
  };
  localStorage.setItem('tanashi_pomodoro_settings', JSON.stringify(settings));
  // При запазване – рестартираме фазата според новите стойности
  if (state.mode === MODES.FOCUS) state.remaining = settings.focus * 60;
  else if (state.mode === MODES.BREAK) state.remaining = settings.rest * 60;
  else state.remaining = settings.long * 60;
  updateUI();
}

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem('tanashi_pomodoro_settings'));
  } catch { return null; }
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n || min)); }

function notify() {
  // кратък звук
  try { el.beep.currentTime = 0; el.beep.play().catch(()=>{}); } catch {}
  // вибрация на мобилни (ако има)
  if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
}
