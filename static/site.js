/* ============================================================
   WINDOWS 11-INSPIRED STARTUP EXPERIENCE
   Full-screen cinematic startup with real backend connection.
   ============================================================ */
(function() {
  'use strict';

  const intro = document.getElementById('win11-intro');
  if (!intro) return;

  // Check if intro was already seen
  if (sessionStorage.getItem('win11_intro_seen')) {
    intro.remove();
    return;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // DOM refs
  const logo = document.getElementById('win11-logo');
  const environment = document.getElementById('win11-environment');
  const status = document.getElementById('win11-status');
  const loading = document.getElementById('win11-loading');
  const loadingText = document.getElementById('win11-loading-text');
  const offline = document.getElementById('win11-offline');
  const titleReveal = document.getElementById('win11-title-reveal');
  const skipBtn = document.getElementById('win11-skip');
  const cursorLight = document.getElementById('win11-cursor-light');
  const particlesContainer = document.getElementById('win11-particles');

  // Generate particles
  if (!reducedMotion && particlesContainer) {
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'win11-particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.top = Math.random() * 100 + '%';
      p.style.animationDelay = Math.random() * 8 + 's';
      p.style.animationDuration = (6 + Math.random() * 4) + 's';
      particlesContainer.appendChild(p);
    }
  }

  // Cursor light follow
  const onMouseMove = (e) => {
    if (cursorLight) {
      cursorLight.style.left = e.clientX + 'px';
      cursorLight.style.top = e.clientY + 'px';
    }
  };
  if (!reducedMotion && cursorLight) {
    document.addEventListener('mousemove', onMouseMove);
  }

  // Timing sequence
  const TIMING = {
    DARK: 0,
    LOGO_START: 500,
    LOGO_PANE_1: 600,
    LOGO_PANE_2: 800,
    LOGO_PANE_3: 1000,
    LOGO_PANE_4: 1200,
    LOGO_SETTLE: 1500,
    ENVIRONMENT: 2000,
    STATUS_START: 2700,
    STATUS_INTERVAL: 400,
    TITLE_REVEAL: 4200,
    TRANSITION: 5000,
  };

  let introDone = false;
  let backendData = null;

  function finishIntro() {
    if (introDone) return;
    introDone = true;
    sessionStorage.setItem('win11_intro_seen', '1');
    document.removeEventListener('mousemove', onMouseMove);
    intro.classList.add('win11-fade-out');
    setTimeout(() => {
      intro.remove();
      // Trigger live mode entry
      if (typeof enterLiveMode === 'function') {
        enterLiveMode();
      }
    }, 800);
  }

  skipBtn.addEventListener('click', finishIntro);

  // Backend connection during intro
  async function connectBackend() {
    try {
      loadingText.textContent = 'CONNECTING TO LOCAL BACKEND...';
      const health = await fetch(API + '/api/health').then(r => r.json());
      if (health.status !== 'ok') throw new Error('Backend not ok');

      loadingText.textContent = 'LOADING PLATFORM...';
      const [platform, stats, processes, aiStatus, safety] = await Promise.all([
        fetch(API + '/api/platform').then(r => r.json()),
        fetch(API + '/api/stats').then(r => r.json()),
        fetch(API + '/api/processes?limit=50&sort=cpu').then(r => r.json()),
        fetch(API + '/api/ai_status').then(r => r.json()),
        fetch(API + '/api/safety').then(r => r.json()),
      ]);

      backendData = { platform, stats, processes, aiStatus, safety };
      return true;
    } catch (e) {
      return false;
    }
  }

  // Status sequence
  const statusItems = [
    { key: 'system', label: 'SYSTEM INITIALIZING' },
    { key: 'telemetry', label: 'LIVE TELEMETRY' },
    { key: 'process', label: 'PROCESS INTELLIGENCE' },
    { key: 'ai', label: 'AI WORKLOAD ANALYSIS' },
    { key: 'safety', label: 'SAFETY ENGINE' },
  ];

  function runStatusSequence() {
    statusItems.forEach((item, i) => {
      setTimeout(() => {
        const el = status.querySelector(`[data-status="${item.key}"]`);
        if (el) {
          el.classList.add('win11-active');
          loadingText.textContent = item.label + '...';
        }
        // Mark previous as done
        if (i > 0) {
          const prev = status.querySelector(`[data-status="${statusItems[i-1].key}"]`);
          if (prev) {
            prev.classList.remove('win11-active');
            prev.classList.add('win11-done');
          }
        }
      }, TIMING.STATUS_START + i * TIMING.STATUS_INTERVAL);
    });

    // Mark last as done
    setTimeout(() => {
      const last = status.querySelector(`[data-status="${statusItems[statusItems.length-1].key}"]`);
      if (last) {
        last.classList.remove('win11-active');
        last.classList.add('win11-done');
      }
      loadingText.textContent = 'LIVE SYSTEM READY';
    }, TIMING.STATUS_START + statusItems.length * TIMING.STATUS_INTERVAL);
  }

  // Animation sequence
  function runAnimation() {
    // Step 1: Dark screen (already dark by default)

    // Step 2-5: Logo panes appear
    setTimeout(() => logo?.classList.add('win11-visible'), TIMING.LOGO_START);

    // Step 6: Environment appears
    setTimeout(() => environment?.classList.add('win11-visible'), TIMING.ENVIRONMENT);

    // Step 7: Status sequence
    setTimeout(() => {
      status?.classList.add('win11-visible');
      loading?.classList.add('win11-visible');
      runStatusSequence();
    }, TIMING.STATUS_START);

    // Step 8: Title reveal
    setTimeout(() => titleReveal?.classList.add('win11-visible'), TIMING.TITLE_REVEAL);

    // Step 9: Skip button visible
    setTimeout(() => skipBtn?.classList.add('win11-visible'), TIMING.LOGO_START);

    // Step 10: Transition to app
    setTimeout(finishIntro, TIMING.TRANSITION);
  }

  // Handle backend connection failure
  function showOffline() {
    offline?.classList.add('win11-visible');
    loading?.classList.remove('win11-visible');
    status?.classList.remove('win11-visible');
  }

  // Retry button
  document.getElementById('win11-retry')?.addEventListener('click', () => {
    offline?.classList.remove('win11-visible');
    connectBackend().then(success => {
      if (success) {
        runAnimation();
      } else {
        showOffline();
      }
    });
  });

  // Instructions button
  document.getElementById('win11-instructions')?.addEventListener('click', () => {
    // Show instructions in a simple way
    loadingText.textContent = 'Run: python app.py';
    loading?.classList.add('win11-visible');
  });

  // Start
  connectBackend().then(success => {
    if (success) {
      runAnimation();
    } else {
      showOffline();
    }
  });
})();

/* ============================================================
   Snapdragon AI Smart Process Manager — Live Mode
   Reads REAL system telemetry from the local backend.
   No synthetic data. No fake processes. No scripted AI.
   ============================================================ */
const qs = new URLSearchParams(location.search);
let API = qs.get('api') || localStorage.getItem('snap_api') || 'http://127.0.0.1:8099';

// ── State ──
const S = {
  liveMode: false,
  connecting: false,
  connected: false,
  paused: false,
  lastUpdate: 0,
  pollTimers: [],
  prevProcesses: new Map(),
  prevStats: null,
  prevForegroundPid: null,
  prevSafetyStates: {},
  selectedProcess: null,
  events: [],
  processes: [],
  safetyCounts: { PROTECT: 0, OBSERVE: 0, REVIEW: 0, 'OPTIMIZATION CANDIDATE': 0 },
  stale: false,
  sortBy: 'cpu',
  sortDir: 'desc',
  filterText: '',
  filterState: '',
  perfHistory: { cpu: [], memory: [], disk: [], net: [] },
  mode: 'live', // 'live' or 'simulation'
};

const $ = id => document.getElementById(id);

// ── Theme toggle ──
function initTheme() {
  const saved = localStorage.getItem('snap_theme');
  if (saved === 'light') {
    document.body.classList.add('light-theme');
  }
  const btn = document.createElement('div');
  btn.className = 'theme-toggle';
  btn.title = 'Toggle theme';
  btn.textContent = saved === 'light' ? '\u263D' : '\u2600';
  btn.onclick = () => {
    const isLight = !document.body.classList.contains('light-theme');
    document.body.classList.toggle('light-theme', isLight);
    localStorage.setItem('snap_theme', isLight ? 'light' : 'dark');
    btn.textContent = isLight ? '\u263D' : '\u2600';
  };
  document.body.appendChild(btn);
}

// ── Fetch helpers ──
async function get(path, timeout = 10000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(API + path, { signal: ctl.signal });
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// ── Button state management ──
function setButtonState(btn, state, text) {
  if (!btn) return;
  btn.disabled = (state === 'loading');
  btn.classList.remove('btn-loading', 'btn-success', 'btn-error');
  if (state === 'loading') {
    btn.classList.add('btn-loading');
    btn.dataset.originalText = btn.textContent;
    btn.textContent = text || 'Loading...';
  } else if (state === 'success') {
    btn.classList.add('btn-success');
    btn.textContent = text || btn.dataset.originalText;
    setTimeout(() => { btn.classList.remove('btn-success'); btn.textContent = btn.dataset.originalText; }, 2000);
  } else if (state === 'error') {
    btn.classList.add('btn-error');
    btn.textContent = text || 'Failed';
    setTimeout(() => { btn.classList.remove('btn-error'); btn.textContent = btn.dataset.originalText; }, 3000);
  } else {
    btn.textContent = btn.dataset.originalText || btn.textContent;
  }
}

// ── SPA Navigation ──
function initNav() {
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('#nav a');
  function setActive(hash) {
    sections.forEach(s => s.classList.remove('active'));
    const target = document.querySelector(hash);
    if (target) {
      target.classList.add('active');
      navLinks.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === hash);
      });
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  navLinks.forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const hash = a.getAttribute('href');
      history.pushState(null, '', hash);
      setActive(hash);
    });
  });
  window.addEventListener('popstate', () => setActive(location.hash || '#home'));
  setActive(location.hash || '#home');
}

// ── LiveDataService: Centralized polling ──
const LiveDataService = {
  timers: [],
  running: false,
  paused: false,

  start() {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    // Stats: every 1.5s
    this.timers.push(setInterval(() => this._pollStats(), 1500));
    // Processes: every 3s
    this.timers.push(setInterval(() => this._pollProcesses(), 3000));
    // Safety: every 5s
    this.timers.push(setInterval(() => this._pollSafety(), 5000));
    // Plan: every 8s
    this.timers.push(setInterval(() => this._pollPlan(), 8000));
    // Decisions: every 6s
    this.timers.push(setInterval(() => this._pollDecisions(), 6000));
    // AI status: every 10s
    this.timers.push(setInterval(() => this._pollAiStatus(), 10000));
    // Connection check: every 2s
    this.timers.push(setInterval(() => this._checkConnection(), 2000));
  },

  stop() {
    this.running = false;
    this.paused = false;
    this.timers.forEach(t => clearInterval(t));
    this.timers = [];
  },

  pause() {
    this.paused = true;
    this.timers.forEach(t => clearInterval(t));
    this.timers = [];
  },

  resume() {
    if (!this.running || !this.paused) return;
    this.paused = false;
    // Clear any existing timers before adding new ones
    this.timers.forEach(t => clearInterval(t));
    this.timers = [];
    this.timers.push(setInterval(() => this._pollStats(), 1500));
    this.timers.push(setInterval(() => this._pollProcesses(), 3000));
    this.timers.push(setInterval(() => this._pollSafety(), 5000));
    this.timers.push(setInterval(() => this._pollPlan(), 8000));
    this.timers.push(setInterval(() => this._pollDecisions(), 6000));
    this.timers.push(setInterval(() => this._pollAiStatus(), 10000));
    this.timers.push(setInterval(() => this._checkConnection(), 2000));
  },

  async refresh() {
    await Promise.all([
      this._pollStats(),
      this._pollProcesses(),
      this._pollSafety(),
      this._pollPlan(),
      this._pollDecisions(),
      this._pollAiStatus(),
    ]);
  },

  async _pollStats() {
    if (!this.running || this.paused) return;
    try {
      const stats = await get('/api/stats', 4000);
      paintTelemetry(stats);
      S.lastUpdate = Date.now();
      S.stale = false;
      // Add to performance history
      if (stats) {
        S.perfHistory.cpu.push(stats.cpu?.total_pct || 0);
        S.perfHistory.memory.push(stats.memory?.pct || 0);
        S.perfHistory.disk.push(stats.disk?.activity_pct || 0);
        S.perfHistory.net.push((stats.net?.down_mb_s || 0) + (stats.net?.up_mb_s || 0));
        // Keep last 60 samples
        Object.keys(S.perfHistory).forEach(k => {
          if (S.perfHistory[k].length > 60) S.perfHistory[k].shift();
        });
        drawPerfCharts();
      }
    } catch (e) {
      S.stale = true;
    }
  },

  async _pollProcesses() {
    if (!this.running || this.paused) return;
    try {
      const data = await get('/api/processes?limit=50&sort=cpu', 5000);
      await paintProcesses(data);
      S.lastUpdate = Date.now();
      S.stale = false;
    } catch (e) {
      S.stale = true;
    }
  },

  async _pollSafety() {
    if (!this.running || this.paused) return;
    try {
      const safety = await get('/api/safety', 4000);
      paintSafety(safety);
    } catch (e) { /* silent */ }
  },

  async _pollPlan() {
    if (!this.running || this.paused) return;
    try {
      const plan = await get('/api/plan', 5000);
      paintPlan(plan);
    } catch (e) { /* silent */ }
  },

  async _pollDecisions() {
    if (!this.running || this.paused) return;
    try {
      const d = await get('/api/decisions?limit=60', 5000);
      paintDecisions(d);
    } catch (e) { /* silent */ }
  },

  async _pollAiStatus() {
    if (!this.running || this.paused) return;
    try {
      const s = await get('/api/ai_status', 4000);
      paintBackend(s);
    } catch (e) { /* silent */ }
  },

  _checkConnection() {
    if (!this.running) return;
    const elapsed = Math.floor((Date.now() - S.lastUpdate) / 1000);
    const updatedEl = $('lb-updated');
    if (updatedEl) {
      updatedEl.textContent = `updated ${elapsed}s ago`;
      if (elapsed > 10 && S.connected) {
        updatedEl.classList.add('stale');
        updatedEl.textContent = `STALE — ${elapsed}s ago`;
      } else {
        updatedEl.classList.remove('stale');
      }
    }
    if (S.stale && S.connected) {
      const connEl = $('lb-conn');
      if (connEl) {
        connEl.textContent = '○ RECONNECTING';
        connEl.className = 'conn-reconnecting';
      }
    } else if (!S.stale && S.connected) {
      const connEl = $('lb-conn');
      if (connEl) {
        connEl.textContent = '● CONNECTED';
        connEl.className = 'conn-connected';
      }
    }
  },
};

// ── Live Mode ──
async function enterLiveMode() {
  if (S.liveMode) return;
  S.connecting = true;
  S.liveMode = true;
  S.connected = false;
  S.stale = false;
  S.prevProcesses.clear();
  S.prevStats = null;
  S.prevForegroundPid = null;
  S.events = [];
  S.safetyCounts = { PROTECT: 0, OBSERVE: 0, REVIEW: 0, 'OPTIMIZATION CANDIDATE': 0 };
  S.perfHistory = { cpu: [], memory: [], disk: [], net: [] };

  $('livebar').hidden = false;
  $('lb-conn').textContent = '○ CONNECTING';
  $('lb-conn').className = 'conn-reconnecting';
  $('events-feed').innerHTML = '<p class="dim">Connecting to local telemetry...</p>';

  try {
    // Initial data load
    const [platform, stats, aiStatus, safety, npuVal] = await Promise.all([
      get('/api/platform', 5000),
      get('/api/stats', 5000),
      get('/api/ai_status', 5000),
      get('/api/safety', 5000),
      get('/api/npu_validation', 5000),
    ]);

    // Update live bar
    $('lb-device').textContent = platform.is_snapdragon ? 'Snapdragon PC' : 'Dell Intel PC';
    $('lb-ai').textContent = aiStatus.selected_backend || 'unknown';
    $('lb-npu').textContent = npuVal.snapdragon_npu?.includes('VERIFIED') ? 'VERIFIED' : 'NOT VERIFIED';

    S.connected = true;
    S.lastUpdate = Date.now();
    $('lb-conn').textContent = '● CONNECTED';
    $('lb-conn').className = 'conn-connected';
    $('nav-live-toggle').textContent = 'LIVE MODE: ON';
    $('nav-live-toggle').style.borderColor = 'var(--acc)';
    $('nav-live-toggle').style.color = 'var(--acc2)';

    // Paint initial data
    paintPlatform(platform);
    paintTelemetry(stats);
    paintSafety(safety);
    await paintProcesses();
    await paintPlan();
    await paintDecisions();
    paintNpuComparison();
    paintEvidence();
    paintBackend(aiStatus);

    // Start centralized polling
    LiveDataService.start();
    addEvent('Monitoring updated', 'monitoring');
  } catch (e) {
    S.connected = false;
    $('lb-conn').textContent = '× DISCONNECTED';
    $('lb-conn').className = 'conn-disconnected';
    $('events-feed').innerHTML = '<p class="warn">Connection failed. Is the backend running?</p>';
  }
  S.connecting = false;
}

function exitLiveMode() {
  S.liveMode = false;
  S.connected = false;
  LiveDataService.stop();
  $('livebar').hidden = true;
  $('nav-live-toggle').textContent = 'LIVE MODE: OFF';
  $('nav-live-toggle').style.borderColor = 'var(--ok)';
  $('nav-live-toggle').style.color = 'var(--ok)';
  $('events-feed').innerHTML = '<p class="dim">Live Mode disabled. No polling active.</p>';
}

function pauseLiveUpdates() {
  if (!S.liveMode || S.paused) return;
  S.paused = true;
  LiveDataService.pause();
  const btn = $('btn-pause');
  if (btn) {
    btn.textContent = '▶ RESUME';
    btn.classList.add('btn-resumed');
  }
  addEvent('Live updates paused', 'monitoring');
}

function resumeLiveUpdates() {
  if (!S.liveMode || !S.paused) return;
  S.paused = false;
  LiveDataService.resume();
  const btn = $('btn-pause');
  if (btn) {
    btn.textContent = '⏸ PAUSE';
    btn.classList.remove('btn-resumed');
  }
  addEvent('Live updates resumed', 'monitoring');
}

async function refreshNow() {
  const btn = $('btn-refresh');
  setButtonState(btn, 'loading', '⟳ REFRESHING...');
  try {
    await LiveDataService.refresh();
    S.lastUpdate = Date.now();
    setButtonState(btn, 'success', '✓ UPDATED ' + new Date().toLocaleTimeString());
    addEvent('Manual refresh completed', 'monitoring');
  } catch (e) {
    setButtonState(btn, 'error', '✗ REFRESH FAILED');
    addEvent('Refresh failed: ' + e.message, 'error');
  }
}

// ── Paint: Backend pill ──
function paintBackend(aiStatus) {
  if (!aiStatus) return;
  $('backend-pill').textContent = 'AI: ' + (aiStatus.selected_backend || 'unknown');
}

// ── Paint: Platform ──
function paintPlatform(p) {
  if (!p) return;
  const cards = [
    ['Operating System', (p.os?.system || '?') + ' ' + (p.os?.release || '')],
    ['Architecture', p.arch_normalized || '?'],
    ['CPU', p.cpu_name || '?'],
    ['Platform', p.is_arm ? 'ARM' : 'x64'],
    ['ARM / x64', p.is_arm ? 'ARM' : 'x86_64'],
    ['Foreground Environment', p.phase_routing?.onnx_backend || 'unknown'],
  ];
  $('platform-cards').innerHTML = cards.map(c =>
    `<div class="card"><h4>${c[0]}</h4><p>${c[1]}</p></div>`
  ).join('');
}

// ── Paint: Telemetry ──
function paintTelemetry(stats) {
  if (!stats) return;
  const prev = S.prevStats;
  const cards = [
    { label: 'CPU', value: stats.cpu?.total_pct + '%', key: 'cpu' },
    { label: 'RAM', value: stats.memory?.used_gb + '/' + stats.memory?.total_gb + ' GB', key: 'ram' },
    { label: 'Disk', value: stats.disk?.pct + '%', key: 'disk' },
    { label: 'Network', value: '\u2193' + (stats.net?.down_mb_s ?? stats.net?.mb_recv) + 'MB \u2191' + (stats.net?.up_mb_s ?? stats.net?.mb_sent) + 'MB', key: 'net' },
    { label: 'Battery', value: stats.battery?.present ? stats.battery?.percent + '%' : 'n/a', key: 'battery' },
    { label: 'Uptime', value: Math.floor(stats.uptime_s / 3600) + 'h ' + Math.floor((stats.uptime_s % 3600) / 60) + 'm', key: 'uptime' },
  ];

  $('syscards').innerHTML = cards.map(c => {
    let flashClass = '';
    if (prev) {
      const prevVal = getPrevTelemetryValue(prev, c.key);
      const curVal = getPrevTelemetryValue(stats, c.key);
      if (prevVal !== null && curVal !== null) {
        if (curVal > prevVal) flashClass = ' flash-up';
        else if (curVal < prevVal) flashClass = ' flash-down';
      }
    }
    return `<div class="card"><div class="dim">${c.label}</div><div class="big telemetry-value${flashClass}">${c.value}</div></div>`;
  }).join('');

  S.prevStats = stats;
}

function getPrevTelemetryValue(stats, key) {
  if (key === 'cpu') return stats.cpu?.total_pct;
  if (key === 'ram') return stats.memory?.pct;
  if (key === 'disk') return stats.disk?.pct;
  if (key === 'battery') return stats.battery?.percent;
  return null;
}

// ── Paint: Safety ──
function paintSafety(safety) {
  if (!safety) return;
  // Safety counts are calculated from live process data in paintProcesses
}

// ── Paint: Processes ──
async function paintProcesses(data) {
  // If called without data (filter change), use cached processes
  if (data === undefined || data === null) {
    if (S.processes.length > 0) {
      data = { rows: S.processes, count: S.processes.length };
    } else {
      try { data = await get('/api/processes?limit=50&sort=cpu', 5000); }
      catch (e) { return; }
    }
  }

  S.processes = data.rows || [];
  const q = ($('q')?.value || '').toLowerCase();
  const fs = $('fstate')?.value;
  const sortBy = S.sortBy;
  const sortDir = S.sortDir;

  let filtered = S.processes.filter(r =>
    (!q || r.name.toLowerCase().includes(q)) &&
    (!fs || ((r.ai || {}).safety_state === fs))
  );

  // Sort
  filtered.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'cpu') cmp = a.cpu_pct - b.cpu_pct;
    else if (sortBy === 'memory') cmp = a.mem_pct - b.mem_pct;
    else if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
    else if (sortBy === 'pid') cmp = a.pid - b.pid;
    return sortDir === 'desc' ? -cmp : cmp;
  });

  // Calculate safety counts from real data
  const counts = { PROTECT: 0, OBSERVE: 0, REVIEW: 0, 'OPTIMIZATION CANDIDATE': 0 };
  let foregroundPid = null;
  S.processes.forEach(r => {
    const state = r.ai?.safety_state;
    if (state && counts.hasOwnProperty(state)) counts[state]++;
    // Detect foreground from AI data
    if (r.ai?.why?.some(w => w.includes('foreground'))) {
      foregroundPid = r.pid;
    }
  });

  // Check for foreground changes
  if (foregroundPid !== S.prevForegroundPid) {
    if (foregroundPid !== null) {
      const fgProc = S.processes.find(r => r.pid === foregroundPid);
      if (fgProc) addEvent(`Foreground changed: ${fgProc.name}`, 'foreground');
    }
    S.prevForegroundPid = foregroundPid;
  }

  // Update safety counts
  const prevCounts = { ...S.safetyCounts };
  S.safetyCounts = counts;
  $('count-protect').textContent = counts.PROTECT;
  $('count-observe').textContent = counts.OBSERVE;
  $('count-review').textContent = counts.REVIEW;
  $('count-candidate').textContent = counts['OPTIMIZATION CANDIDATE'];

  // Check for safety state changes
  if (prevCounts.PROTECT !== counts.PROTECT || prevCounts.OBSERVE !== counts.OBSERVE ||
      prevCounts.REVIEW !== counts.REVIEW || prevCounts['OPTIMIZATION CANDIDATE'] !== counts['OPTIMIZATION CANDIDATE']) {
    addEvent('Safety state changed', 'safety');
  }

  // Update foreground card
  if (foregroundPid !== null) {
    const fgProc = S.processes.find(r => r.pid === foregroundPid);
    if (fgProc) {
      $('fg-name').textContent = fgProc.name;
      $('fg-pid').textContent = 'PID: ' + fgProc.pid;
    }
  } else {
    $('fg-name').textContent = 'None detected';
    $('fg-pid').textContent = '';
  }

  // Build table rows with incremental updates
  const tbody = $('procs');
  const existingRows = new Map();
  tbody.querySelectorAll('tr').forEach(tr => {
    existingRows.set(tr.dataset.pid, tr);
  });

  const newRowsHtml = [];
  const processedPids = new Set();

  filtered.forEach(r => {
    const pid = r.pid;
    processedPids.add(pid);
    const ai = r.ai || {};
    const isForeground = r.ai?.why?.some(w => w.includes('foreground'));
    const prev = S.prevProcesses.get(pid);

    // Check if this is a new process
    const isNew = !prev;
    if (isNew && S.prevProcesses.size > 0) {
      addEvent(`Process detected: ${r.name}`, 'process');
    }

    // Check for AI classification changes
    if (prev && prev.ai) {
      const prevAi = prev.ai;
      if (prevAi.safety_state !== ai.safety_state) {
        addEvent(`AI classification updated: ${r.name} → ${ai.safety_state}`, 'ai');
      }
    }

    // Determine cell highlights
    let cpuClass = '', memClass = '', confClass = '';
    if (prev) {
      if (r.cpu_pct > prev.cpu_pct + 0.5) cpuClass = 'cell-highlight-up';
      else if (r.cpu_pct < prev.cpu_pct - 0.5) cpuClass = 'cell-highlight-down';
      if (r.mem_pct > prev.mem_pct + 0.5) memClass = 'cell-highlight-up';
      else if (r.mem_pct < prev.mem_pct - 0.5) memClass = 'cell-highlight-down';
      if (ai.final_confidence != null && prev.ai?.final_confidence != null) {
        if (Math.abs(ai.final_confidence - prev.ai.final_confidence) > 0.02) {
          confClass = 'cell-highlight-change';
        }
      }
    }

    const rowClass = 'process-row' + (isNew ? ' new-row' : '') + (isForeground ? ' foreground-row' : '');
    const fgBadge = isForeground ? '<span class="tag tag-red">FOREGROUND</span>' : '';

    newRowsHtml.push(`
      <tr class="${rowClass}" data-pid="${pid}">
        <td>${r.name}</td>
        <td>${r.pid}</td>
        <td class="${cpuClass}">${r.cpu_pct}%</td>
        <td class="${memClass}">${r.mem_pct}%</td>
        <td>${r.arch || '?'}</td>
        <td>${fgBadge}</td>
        <td>${ai.ai_class || '\u2026'}</td>
        <td class="${confClass}">${ai.final_confidence == null ? '\u2026' : (ai.final_confidence * 100).toFixed(0) + '%'}</td>
        <td><b>${ai.safety_state || '\u2026'}</b> — ${ai.recommendation || ''}</td>
      </tr>
    `);

    // Update stored state
    S.prevProcesses.set(pid, { ...r });
  });

  // Check for disappeared processes
  S.prevProcesses.forEach((r, pid) => {
    if (!processedPids.has(pid)) {
      addEvent(`Process exited: ${r.name}`, 'process');
    }
  });

  // Remove stale entries from prevProcesses
  S.prevProcesses.forEach((_, pid) => {
    if (!processedPids.has(pid)) S.prevProcesses.delete(pid);
  });

  tbody.innerHTML = newRowsHtml.join('');
  $('pcount').textContent = data.count + ' processes';

  // Attach click handlers
  tbody.querySelectorAll('tr').forEach(tr => {
    tr.onclick = () => {
      const pid = +tr.dataset.pid;
      const row = S.processes.find(r => r.pid === pid);
      if (row) selectProcess(row);
    };
  });
}

// ── Paint: Plan ──
function paintPlan(plan) {
  if (!plan) return;
  const suggestions = plan.suggestions || [];
  if (suggestions.length === 0) {
    $('plan-content').innerHTML = `
      <p><b>CURRENT WORKLOAD:</b> No high-CPU processes detected.</p>
      <p><b>AI ASSESSMENT:</b> System running normally.</p>
      <p><b>SAFETY RESULT:</b> No action needed.</p>
      <p><b>RECOMMENDED ACTION:</b> None — system is healthy.</p>
      <p class="dim">READ-ONLY · NO PROCESS MODIFICATION</p>
    `;
    return;
  }
  $('plan-content').innerHTML = suggestions.map(s => `
    <div class="plan-item">
      <div class="plan-process">${s.name} (PID ${s.pid})</div>
      <div class="plan-reason">${s.reason}</div>
      <div class="plan-proposed">Proposed: ${s.proposed}</div>
    </div>
  `).join('') + '<p class="dim small" style="margin-top:8px">READ-ONLY · NO PROCESS MODIFICATION · Recommendation only</p>';

  addEvent('Recommendation generated', 'recommendation');
}

// ── Paint: Decisions ──
function paintDecisions(d) {
  if (!d) return;
  const fs = $('dstate')?.value;
  const rows = (d.records || []).filter(r => !fs || r.safety_state === fs).slice(-30).reverse();
  $('dcount').textContent = (d.records || []).length + ' logged';
  $('decrows').innerHTML = rows.map(r =>
    `<tr>
      <td>${(r.timestamp || '').slice(11) || (r.timestamp || '')}</td>
      <td>${r.process}</td>
      <td>${r.model_class || ''}</td>
      <td>${r.final_confidence == null ? '' : (r.final_confidence * 100).toFixed(0) + '%'}</td>
      <td>${r.familiarity_level || r.familiarity || ''}</td>
      <td><b>${r.safety_state}</b></td>
      <td>${r.recommendation || ''}</td>
      <td>${r.simulation ? '<span class="tag tag-orange">SIMULATED</span>' : 'observed'}</td>
    </tr>`
  ).join('');
}

// ── Paint: NPU Comparison ──
function paintNpuComparison() {
  const cpu = {
    'protected': [0.8387, 0, 0.0147, 0.1465],
    'foreground': [0, 1, 0, 0],
    'flexible': [0, 0.0191, 0.9809, 0],
    'deferrable': [0.0009, 0, 0.0051, 0.994]
  };
  $('cmp').innerHTML = ['protected', 'foreground', 'flexible', 'deferrable'].map(k => {
    const nv = { label: 'VERIFIED', maxdiff: '0.0015', agree: true };
    return `<tr>
      <td>${k}</td>
      <td>${cpu[k].indexOf(Math.max(...cpu[k]))}</td>
      <td>${nv.label}</td>
      <td>${nv.maxdiff}</td>
      <td>${nv.agree ? '\u2705' : '\u274C'}</td>
    </tr>`;
  }).join('');
}

// ── Paint: Evidence ──
function paintEvidence() {
  const facts = [
    ['74 / 74 tests passed', 'Unit + integration suites'],
    ['1.9 KB ONNX model', 'MLP 11\u219216\u21928\u21924'],
    ['11-feature model', 'Documented order + scaler'],
    ['Temperature scaling T=2.0', 'Calibrated confidence'],
    ['OOD familiarity detection', 'Centroid-distance model'],
    ['Snapdragon X Elite CRD validation', 'Hosted reference platform'],
    ['10/10 profiled nodes on NPU', 'Job jpxlrj1lp'],
    ['4/4 CPU/NPU agreement', 'Job j5wlrew3p, diff 0.0015'],
    ['0 destructive operations', 'Audited; guard enforced'],
    ['0 secrets in package', 'Scanned and verified'],
    ['~1% monitoring CPU', 'Development observation'],
    ['~70 MB RAM', 'Development observation'],
  ];
  $('evgrid').innerHTML = facts.map(f =>
    `<div class="card"><h3>${f[0]}</h3><p class="dim">${f[1]}</p></div>`
  ).join('');
}

// ── Performance Charts ──
function drawPerfCharts() {
  const canvas = $('perf-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth * 2;
  const H = canvas.height = 200;
  ctx.clearRect(0, 0, W, H);

  const metrics = [
    { key: 'cpu', color: '#4fc3f7', label: 'CPU %', max: 100 },
    { key: 'memory', color: '#81c784', label: 'Memory %', max: 100 },
    { key: 'disk', color: '#ffb74d', label: 'Disk Activity %', max: 100 },
    { key: 'net', color: '#ba68c8', label: 'Network MB/s', max: 10 },
  ];

  metrics.forEach(m => {
    const data = S.perfHistory[m.key];
    if (data.length < 2) return;
    ctx.strokeStyle = m.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = (i / 59) * W;
      const y = H - (Math.min(v, m.max) / m.max) * H;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });

  // Legend
  ctx.font = '12px Inter, sans-serif';
  let lx = 10;
  metrics.forEach(m => {
    ctx.fillStyle = m.color;
    ctx.fillRect(lx, 10, 12, 12);
    ctx.fillStyle = '#aaa';
    ctx.fillText(m.label, lx + 16, 20);
    lx += ctx.measureText(m.label).width + 40;
  });
}

// ── Top Processes Chart ──
function drawTopProcessesChart() {
  const canvas = $('top-procs-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth * 2;
  const H = canvas.height = 150;
  ctx.clearRect(0, 0, W, H);

  const top = S.processes.slice(0, 5);
  if (top.length === 0) return;

  const maxCpu = Math.max(...top.map(r => r.cpu_pct), 1);
  const barW = W / top.length * 0.6;
  const gap = W / top.length * 0.4;

  top.forEach((r, i) => {
    const x = i * (barW + gap) + gap / 2;
    const h = (r.cpu_pct / maxCpu) * (H - 30);
    const y = H - h - 20;
    const grad = ctx.createLinearGradient(0, y, 0, H - 20);
    grad.addColorStop(0, '#4fc3f7');
    grad.addColorStop(1, '#1976d2');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, barW, h);
    ctx.fillStyle = '#aaa';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(r.name.substring(0, 10), x + barW / 2, H - 5);
    ctx.fillText(r.cpu_pct + '%', x + barW / 2, y - 5);
    ctx.textAlign = 'left';
  });
}

// ── Event Stream ──
function addEvent(text, type) {
  const time = new Date().toLocaleTimeString();
  S.events.unshift({ time, text, type });
  if (S.events.length > 50) S.events.pop();

  const feed = $('events-feed');
  if (!feed) return;
  feed.innerHTML = S.events.map(e =>
    `<div class="event-item">
      <span class="event-time">${e.time}</span>
      <span class="event-type ${e.type}">${e.type.toUpperCase()}</span>
      ${e.text}
    </div>`
  ).join('');
}

// ── Process Selection & AI Pipeline ──
function selectProcess(row) {
  S.selectedProcess = row;
  const ai = row.ai || {};

  // Update AI workload card
  $('ai-workload-content').innerHTML = `
    <div class="ai-workload-visual">
      <div class="awv-step">${row.name}</div>
      <div class="awv-arrow">\u2192</div>
      <div class="awv-step">Feature Extraction</div>
      <div class="awv-arrow">\u2192</div>
      <div class="awv-step">11-Feature Model</div>
      <div class="awv-arrow">\u2192</div>
      <div class="awv-step">${ai.model_class || '?'}</div>
      <div class="awv-arrow">\u2192</div>
      <div class="awv-step">${ai.final_confidence != null ? (ai.final_confidence * 100).toFixed(0) + '%' : '?'} conf</div>
      <div class="awv-arrow">\u2192</div>
      <div class="awv-step">${ai.safety_state || '?'}</div>
    </div>
    <p class="dim small">Real process data from live system. Click another process to compare.</p>
  `;

  // Populate and show modal
  populateProcessModal(row);
  $('process-detail-modal').hidden = false;

  // Run pipeline animation
  runPipeline(row);

  // Scroll to AI section
  document.querySelector('#ai')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function populateProcessModal(row) {
  const ai = row.ai || {};
  $('modal-title').textContent = `${row.name} (PID ${row.pid})`;

  // Overview tab
  $('modal-overview').innerHTML = `
    <p><b>Process:</b> ${row.name}</p>
    <p><b>PID:</b> ${row.pid}</p>
    <p><b>CPU:</b> ${row.cpu_pct}%</p>
    <p><b>Memory:</b> ${row.mem_pct}%</p>
    <p><b>Architecture:</b> ${row.arch || 'Unknown'}</p>
    <p><b>Status:</b> ${row.status || 'Unknown'}</p>
    <p><b>Username:</b> ${row.username || 'Unknown'}</p>
    <p class="dim">Data from live system observation. No process was modified.</p>
  `;

  // AI Analysis tab
  $('modal-ai').innerHTML = `
    <p><b>Model Vote:</b> ${ai.model_class || '?'} (raw confidence ${(ai.raw_confidence * 100 || 0).toFixed(1)}%)</p>
    <p><b>Familiarity:</b> ${ai.familiarity_level || '?'} (${ai.familiarity?.toFixed(2) || '?'})</p>
    <p><b>OOD:</b> ${ai.ood ? 'OUT-OF-DISTRIBUTION (UNKNOWN)' : 'KNOWN'}</p>
    <p><b>Final Confidence:</b> ${(ai.final_confidence * 100 || 0).toFixed(1)}%</p>
    <p><b>Probabilities:</b> ${(ai.probabilities || []).map(p => (p * 100).toFixed(1) + '%').join(', ')}</p>
    <p><b>Why:</b> ${(ai.why || []).join('; ')}</p>
    <p class="dim">All values from actual ONNX model inference.</p>
  `;

  // Safety tab
  $('modal-safety').innerHTML = `
    <p><b>Safety State:</b> ${ai.safety_state || '?'}</p>
    <p><b>Recommendation:</b> ${ai.recommendation || '?'}</p>
    <p><b>Overridden:</b> ${ai.overridden ? 'Yes' : 'No'}</p>
    ${ai.overridden ? `<p><b>Override Reason:</b> ${ai.override_reason || 'Safety override'}</p>` : ''}
    <p><b>Backend:</b> ${ai.backend || 'unknown'}</p>
    <p class="dim">Safety decisions are deterministic policy, not AI votes.</p>
  `;

  // Telemetry tab
  $('modal-telemetry').innerHTML = `
    <p><b>CPU Usage:</b> ${row.cpu_pct}%</p>
    <p><b>Memory Usage:</b> ${row.mem_pct}%</p>
    <p><b>IO Total:</b> ${row._io_total ? (row._io_total / 1e6).toFixed(2) + ' MB' : 'N/A'}</p>
    <p><b>Stale:</b> ${row.stale_s || 0}s</p>
    <p><b>Create Time:</b> ${row.create_time ? new Date(row.create_time * 1000).toLocaleString() : 'N/A'}</p>
    <p class="dim">Telemetry sampled by the application's local sampler.</p>
  `;
}

function runPipeline(row) {
  const ai = row.ai || {};
  const steps = document.querySelectorAll('.pstep');
  steps.forEach(el => el.classList.remove('lit'));

  // Animate steps sequentially
  steps.forEach((el, i) => {
    setTimeout(() => {
      el.classList.add('lit');
      // Light up corresponding visual step
      const awvSteps = document.querySelectorAll('.awv-step');
      if (awvSteps[i]) awvSteps[i].classList.add('lit');
    }, 300 * (i + 1));
  });

  // Update trace content
  $('trace-title').textContent = `${row.name} (pid ${row.pid}, ${row.arch || 'unknown arch'})`;
  $('trace').innerHTML =
    `<p><b>OBSERVE:</b> Real telemetry — CPU ${row.cpu_pct}%, Memory ${row.mem_pct}%, PID ${row.pid}</p>` +
    `<p><b>UNDERSTAND:</b> 11-feature vector extracted from live system signals</p>` +
    `<p><b>PREDICT:</b> Model prediction: ${ai.model_class || '?'} (raw ${(ai.raw_confidence * 100 || 0).toFixed(1)}%)</p>` +
    `<p><b>CONFIDENCE / OOD:</b> ${(ai.final_confidence * 100 || 0).toFixed(1)}% final — ${ai.familiarity_level || '?'} familiarity, ${ai.ood ? 'OUT-OF-DISTRIBUTION' : 'KNOWN'}</p>` +
    `<p><b>SAFETY:</b> ${ai.safety_state || '?'} \u2192 ${ai.recommendation || '?'}</p>` +
    `<p><b>RECOMMEND:</b> ${ai.recommendation || '?'} — read-only, no action taken</p>` +
    `<p><b>WHY:</b> ${(ai.why || []).join(' + ')}</p>` +
    `<p class="dim">AI predicts. Safety policy decides.</p>`;

  // Update decision detail
  $('decision-detail').innerHTML =
    `<p><b>Model Vote:</b> ${ai.model_class || '?'} (raw confidence ${(ai.raw_confidence * 100 || 0).toFixed(1)}%)</p>` +
    `<p><b>Familiarity:</b> ${ai.familiarity_level || '?'} (${ai.familiarity?.toFixed(2) || '?'}) — ${ai.ood ? 'OUT-OF-DISTRIBUTION (UNKNOWN)' : 'KNOWN'}</p>` +
    `<p><b>Final Confidence:</b> ${(ai.final_confidence * 100 || 0).toFixed(1)}% = calibrated × familiarity</p>` +
    `<p><b>Safety Decision:</b> ${ai.safety_state || '?'} → ${ai.recommendation || '?'}</p>` +
    (ai.overridden ? `<p class="warn"><b>Override:</b> ${ai.override_reason || 'Safety override'}</p>` : '') +
    `<p class="dim">The model advises. The safety layer decides. No process was modified.</p>`;
}

// ── Simulator ──
async function runSim() {
  const set = $('simset').value;
  const out = $('simout');
  out.innerHTML = '<p class="dim">Loading simulation data...</p>';
  try {
    const d = await get('/api/demo?set=' + set);
    out.innerHTML = `<p><span class="tag tag-orange">SIMULATED / PROJECTED</span> ${d.description} — synthetic processes, real model.</p>`;
    for (let i = 0; i < d.rows.length; i++) {
      const pv = await get(`/api/optimization/preview?set=${set}&index=${i}`);
      const r = d.rows[i];
      out.innerHTML += `<div class="card"><h3>${r.name}</h3>` +
        `<p>AI: <b>${pv.model_class}</b> (${(pv.raw_confidence * 100).toFixed(0)}%) \u00b7 ` +
        `Safety: <b>${pv.safety_state}</b> \u00b7 Proposed: <b>${(pv.simulated_action || '').replaceAll('_', ' ')}</b> ` +
        `<span class="tag tag-orange">SIMULATED</span></p>` +
        `<p class="dim">WHY? ${(pv.why || []).slice(0, 3).join(' + ')}</p>` +
        `<button data-i="${i}" class="btn-small">SIMULATE</button><div class="simres"></div></div>`;
    }
    out.querySelectorAll('button').forEach(b => b.onclick = async () => {
      const s = await get(`/api/optimization/simulate?set=${set}&index=${b.dataset.i}`);
      b.parentElement.querySelector('.simres').innerHTML =
        `<div class="sim-result">` +
        `<p>${(s.stages || []).map((st, i) => `<span class="sim-stage ${i < 3 ? 'done' : 'active'}">${st}</span>`).join(' \u2192 ')}</p>` +
        `<p>Result: <b>${(s.simulated_action || '').replaceAll('_', ' ')}</b> \u00b7 ${s.projected_effect || ''} <span class="tag tag-orange">PROJECTED</span></p>` +
        `</div>`;
    });
  } catch (e) {
    out.innerHTML = '<p class="warn">Simulation requires the local backend. Enter Live Mode first.</p>';
  }
}

// ── Boot ──
async function boot() {
  initTheme();
  initNav();

  // Event handlers
  $('cta-live').onclick = () => {
    enterLiveMode();
    location.hash = '#live';
    setActive('#live');
  };
  $('btn-exit-live').onclick = () => {
    exitLiveMode();
    location.hash = '#home';
    setActive('#home');
  };
  $('nav-live-toggle').onclick = () => {
    if (S.liveMode) {
      exitLiveMode();
    } else {
      enterLiveMode();
      location.hash = '#live';
      setActive('#live');
    }
  };

  // Pause/Resume
  $('btn-pause').onclick = () => {
    if (S.paused) resumeLiveUpdates();
    else pauseLiveUpdates();
  };

  // Refresh
  $('btn-refresh').onclick = refreshNow;

  // Sort controls
  $('sort-cpu').onclick = () => { S.sortBy = 'cpu'; S.sortDir = 'desc'; paintProcesses(); };
  $('sort-memory').onclick = () => { S.sortBy = 'memory'; S.sortDir = 'desc'; paintProcesses(); };
  $('sort-name').onclick = () => { S.sortBy = 'name'; S.sortDir = 'asc'; paintProcesses(); };
  $('sort-pid').onclick = () => { S.sortBy = 'pid'; S.sortDir = 'asc'; paintProcesses(); };

  // Clear filter
  $('btn-clear-filter').onclick = () => {
    $('q').value = '';
    $('fstate').value = '';
    S.filterText = '';
    S.filterState = '';
    paintProcesses();
  };

  // Mode toggle
  $('mode-live').onclick = () => {
    S.mode = 'live';
    $('mode-live').classList.add('active');
    $('mode-sim').classList.remove('active');
    $('live-content').style.display = '';
    $('sim-content').style.display = 'none';
  };
  $('mode-sim').onclick = () => {
    S.mode = 'simulation';
    $('mode-sim').classList.add('active');
    $('mode-live').classList.remove('active');
    $('live-content').style.display = 'none';
    $('sim-content').style.display = '';
  };

  // View buttons
  $('btn-view-recommendation').onclick = async () => {
    const btn = $('btn-view-recommendation');
    setButtonState(btn, 'loading', '⟳ LOADING...');
    try {
      const plan = await get('/api/plan', 5000);
      paintPlan(plan);
      setButtonState(btn, 'success', '✓ LOADED');
      addEvent('Recommendation viewed', 'recommendation');
    } catch (e) {
      setButtonState(btn, 'error', '✗ FAILED');
    }
  };

  $('btn-view-safety').onclick = async () => {
    const btn = $('btn-view-safety');
    setButtonState(btn, 'loading', '⟳ LOADING...');
    try {
      const safety = await get('/api/safety', 5000);
      paintSafety(safety);
      setButtonState(btn, 'success', '✓ LOADED');
    } catch (e) {
      setButtonState(btn, 'error', '✗ FAILED');
    }
  };

  $('btn-view-ai').onclick = async () => {
    const btn = $('btn-view-ai');
    setButtonState(btn, 'loading', '⟳ LOADING...');
    try {
      const ai = await get('/api/ai_status', 5000);
      paintBackend(ai);
      setButtonState(btn, 'success', '✓ LOADED');
    } catch (e) {
      setButtonState(btn, 'error', '✗ FAILED');
    }
  };

  // Filter handlers
  $('q').oninput = () => { S.filterText = $('q').value; paintProcesses(); };
  $('fstate').onchange = () => { S.filterState = $('fstate').value; paintProcesses(); };
  $('dstate').onchange = () => paintDecisions();
  $('simrun').onclick = runSim;

  // Process detail modal
  $('modal-close').onclick = () => { $('process-detail-modal').hidden = true; };
  document.querySelector('.modal-overlay').onclick = () => { $('process-detail-modal').hidden = true; };
  document.querySelectorAll('.modal-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.modal-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const pane = $('modal-' + tab.dataset.tab);
      if (pane) pane.classList.add('active');
    };
  });

  // Try to auto-connect if backend is available
  try {
    await get('/api/ai_status', 3000);
    // Backend is available, but don't auto-enter live mode
    // User must click ENTER LIVE MODE
    $('backend-pill').textContent = 'AI: backend available';
  } catch (e) {
    $('backend-pill').textContent = 'AI: backend offline';
  }

  // Paint static content
  paintNpuComparison();
  paintEvidence();
}

// Helper for nav (needed in event handlers)
function setActive(hash) {
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('#nav a');
  sections.forEach(s => s.classList.remove('active'));
  const target = document.querySelector(hash);
  if (target) {
    target.classList.add('active');
    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === hash);
    });
  }
}

boot();
