const UI = {
  init() {
    document.addEventListener('click', (e) => {
      if (e.target.closest && e.target.closest('#zoom-wrap')) return;
      const menu = document.getElementById('zoom-menu');
      if (menu && !menu.classList.contains('hidden')) menu.classList.add('hidden');
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 960) this.closeSidebars();
    });
  },

  toggleSidebar(side) {
    const game = document.getElementById('game-container');
    if (!game || !['left', 'right'].includes(side)) return;
    const className = 'sidebar-' + side + '-open';
    const wasOpen = game.classList.contains(className);
    this.closeSidebars();
    if (!wasOpen) game.classList.add(className);
  },

  closeSidebars() {
    const game = document.getElementById('game-container');
    if (game) game.classList.remove('sidebar-left-open', 'sidebar-right-open');
  },

  updateInventory() {
    const r = GameState.res;
    const maxC = CONFIG.RESOURCES.CO2.max;
    const maxA = CONFIG.RESOURCES.ATP.max;
    const maxN = CONFIG.RESOURCES.NADPH.max;
    const maxS = CONFIG.RESOURCES.SUGAR.max;
    document.getElementById('stat-c').innerText = `${r.CO2 || 0}`;
    const elW = document.getElementById('stat-water');
    if (elW) elW.innerText = `${r.WATER || 0}`;
    const elL = document.getElementById('stat-light');
    if (elL) elL.innerText = `${r.LIGHT || 0}`;
    document.getElementById('stat-atp').innerText = `${r.ATP || 0}`;
    document.getElementById('stat-nadph').innerText = `${r.NADPH || 0}`;
    const statSugar = document.getElementById('stat-sugar');
    if (statSugar) statSugar.innerText = `${r.SUGAR || 0}`;
    this.syncAutoButton();
    this.updateButtonsEnabled();
  },

  setLocation(locKey) {
    const loc = CONFIG.LOCATIONS[locKey];
    document.getElementById('loc-name').innerText = loc.name;
    const boxes = ['box-co2', 'box-atp', 'box-nadph'];
    boxes.forEach(b => { const el = document.getElementById(b); if (el) el.style.boxShadow = ''; });
    if (loc.resources) {
      if (loc.resources.CO2) document.getElementById('box-co2').style.boxShadow = '0 0 16px #5a8abf, inset -2px -2px 0 #0a150a, inset 2px 2px 0 #2d5a2d';
    }
    if (locKey === 'factory') {
      const waterBox = document.getElementById('box-water');
      if (waterBox) waterBox.style.boxShadow = '0 0 16px #5ad3ff, inset -2px -2px 0 #0a150a, inset 2px 2px 0 #1a3a4a';
    }
  },

  updateChalkboard(stage, entity, analogy, inputStr, outputStr, wasteStr) {
    const s = document.getElementById('board-stage');
    if (s) s.innerText = stage;
    const e = document.getElementById('board-entity');
    if (e) e.innerText = entity;
    const a = document.getElementById('board-analogy');
    if (a) a.innerText = `เปรียบเทียบ: ${analogy}`;
    const fi = document.getElementById('flow-in');
    if (fi) fi.innerText = inputStr;
    const fo = document.getElementById('flow-out');
    if (fo) fo.innerText = outputStr;
    const fw = document.getElementById('flow-waste');
    if (fw) fw.innerText = wasteStr;
  },

  setActionButton(label, visible, callback) {
    const btn = document.getElementById('action-trigger-btn');
    if (btn) {
      btn.innerText = label;
      btn.style.display = visible ? 'inline-block' : 'none';
      btn.disabled = !visible;
    }
    GameState.pendingAction = visible ? callback : null;
  },

  showToast(text, duration = 1500) {
    const t = document.getElementById('travel-toast');
    document.getElementById('toast-text').innerText = text;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), duration);
  },

  toggleZoomMenu(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    if (e && e.preventDefault) e.preventDefault();
    const menu = document.getElementById('zoom-menu');
    if (menu) menu.classList.toggle('hidden');
  },

  toggleFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement) {
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
    }
  },

  resetGame(force = false) {
    if (!force && !confirm('ต้องการเริ่มเกมใหม่ทั้งหมดหรือไม่?')) return;
    GameState.res = { CO2: 0, WATER: 0, LIGHT: 0, ATP: 0, NADPH: 0, G3P: 0, SUGAR: 0 };
    GameState.isCycleRunning = false;
    GameState.cycleStage = -1;
    GameState.pendingAction = null;
    GameState.currentLocation = 'factory';
    GameState.electricity = CONFIG.ELECTRICITY.START;
    GameState.isGameOver = false;
    GameState.totalCycles = 0;
    GameState.totalGlucose = 0;
    localStorage.clear();
    location.reload();
  },

  openMachinePanel(id) {
    const m = (id === 'light') ? CONFIG.LIGHT_MACHINE : CONFIG.THREE_MACHINES[id];
    if (!m) return;
    this._currentMachineId = id;
    document.getElementById('mp-icon').innerText = m.icon;
    document.getElementById('mp-title').innerText = m.detail.title;

    const stepsEl = document.getElementById('mp-steps');
    stepsEl.innerHTML = '';
    m.steps.forEach((step, idx) => {
      const li = document.createElement('li');
      // รองรับทั้ง step แบบ object { icon, label, text } และแบบ string เดิม
      if (typeof step === 'object' && step !== null) {
        li.classList.add('step-has-icon');
        li.innerHTML =
          `<span class="step-icon">${step.icon || '▶'}</span>` +
          `<span class="step-body"><span class="step-label">${step.label}</span>` +
          `<span class="step-text">${step.text}</span></span>`;
      } else {
        li.innerText = step;
      }
      // ไฮไลต์ step สุดท้าย (✅ ตรวจบัญชี) ต่างสี
      const isCheck = typeof step === 'object' ? (step.icon === '✅') : (typeof step === 'string' && step.startsWith('✔'));
      if (isCheck) li.classList.add('step-check');
      stepsEl.appendChild(li);
    });

    document.getElementById('mp-fill').innerText = m.detail.fillWhat;
    document.getElementById('mp-break').innerText = m.detail.breakWhat;
    document.getElementById('mp-remain').innerText = m.detail.remainWhat;
    document.getElementById('mp-output').innerText = m.detail.outputWhat;
    document.getElementById('mp-next').innerText = m.detail.nextFillWhat;
    document.querySelectorAll('.machine-card').forEach(c => c.classList.remove('active'));
    const cardMap = { light: 0, fixation: 1, reduction: 2, regeneration: 3 };
    const all = document.querySelectorAll('.machine-card');
    if (all[cardMap[id]]) all[cardMap[id]].classList.add('active');
    document.getElementById('machine-panel-overlay').classList.remove('hidden');
    MachineAnim.play(id);
  },

  replayMachineAnim() {
    if (this._currentMachineId) MachineAnim.play(this._currentMachineId);
  },

  closeMachinePanel(e) {
    if (e && e.target && !e.target.classList.contains('panel-overlay') && e.type === 'click') {
      if (!e.currentTarget.classList.contains('panel-overlay')) return;
    }
    document.getElementById('machine-panel-overlay').classList.add('hidden');
    document.querySelectorAll('.machine-card').forEach(c => c.classList.remove('active'));
    MachineAnim.stop();
  },

  setMachineStatus(n, status) {
    const el = document.getElementById('mc-status-' + n);
    if (!el) return;
    const card = el.closest('.machine-card');
    if (status === 'run') {
      el.innerText = '⚙ ทำงาน';
      el.classList.remove('wait');
      el.classList.add('run');
      if (card) card.classList.add('active');
    } else if (status === 'boost') {
      el.innerText = '⚡เร็ว ×4 (มีแสง)';
      el.classList.remove('wait', 'run');
      el.classList.add('yield', 'boost');
      if (card) card.classList.add('active');
    } else if (status === 'yield') {
      el.innerText = '⏳ ผลิต (ทีละ 1)';
      el.classList.remove('wait', 'run');
      el.classList.add('yield');
      if (card) card.classList.add('active');
    } else {
      el.innerText = '⏸ รอ';
      el.classList.remove('run', 'yield');
      el.classList.add('wait');
      if (card) card.classList.remove('active');
    }
  },

  updateCycleProgress(pct, msLeft) {
    const inner = document.getElementById('cycle-bar-inner');
    const lbl = document.getElementById('cycle-timer-label');
    if (inner) inner.style.width = Math.max(0, Math.min(100, pct)) + '%';
    if (lbl) {
      if (msLeft <= 0) msLeft = 0;
      lbl.innerText = (msLeft / 1000).toFixed(1) + ' วิ';
    }
  },

  updateCycleStats() {
    const cEl = document.getElementById('stat-cycles');
    const gEl = document.getElementById('stat-total-sugar');
    if (cEl) cEl.innerText = GameState.totalCycles || 0;
    if (gEl) gEl.innerText = GameState.totalGlucose || 0;
  },

  showAutoButton(visible) {
    const btn = document.getElementById('auto-toggle-btn');
    if (!btn) return;
    if (visible) btn.classList.remove('hidden');
    else btn.classList.add('hidden');
  },

  syncAutoButton() {
    const btn = document.getElementById('auto-toggle-btn');
    if (!btn) return;
    btn.classList.remove('hidden');
    btn.innerText = GameState.autoCycle ? '🔁 คาลวิน AUTO: ON (กดหยุด)' : '🔁 คาลวิน AUTO: OFF';
  },

  toggleAutoCycle() {
    GameState.autoCycle = !GameState.autoCycle;
    const btn = document.getElementById('auto-toggle-btn');
    if (btn) btn.innerText = GameState.autoCycle ? '🔁 คาลวิน AUTO: ON (กดหยุด)' : '🔁 คาลวิน AUTO: OFF';
    if (GameState.autoCycle && !GameState.isCycleRunning) {
      if (CalvinCycle && CalvinCycle.canStart && CalvinCycle.startCycle) {
        if (CalvinCycle.canStart()) {
          CalvinCycle.startCycle();
        } else {
          this.showToast('⚠️ คาลวิน AUTO: วัตถุดิบไม่พอ (CO2 ≥3, ATP ≥9, NADPH ≥6) → ฟาร์ม CO₂ ก่อน!', 2400);
        }
      }
    } else if (GameState.autoCycle && GameState.isCycleRunning) {
      this.showToast('🌀 คาลวิน AUTO: ON — รอบนี้จบแล้วจะเริ่มอัตโนมัติต่อ', 1800);
    }
    GameState.save();
  },

  feedRabbit() {
    if (GameState.isGameOver) return;
    if (GameState.rabbit.isRunning) {
      this.showToast('🐰 กระต่ายยังปั่นอยู่ รอสักครู่...', 1200);
      return;
    }
    if ((GameState.res.SUGAR || 0) < CONFIG.RABBIT.SUGAR_PER_RUN) {
      this.showToast('⚠️ น้ำตาลไม่พอ! ผลิตน้ำตาลจากวัฏจักรคาลวินก่อน (2 รอบ = 1 น้ำตาล)', 1800);
      return;
    }
    GameState.res.SUGAR -= CONFIG.RABBIT.SUGAR_PER_RUN;
    GameState.rabbit.isRunning = true;
    const wheel = document.getElementById('rabbit-wheel');
    const sprite = document.getElementById('rabbit-sprite');
    const statusEl = document.getElementById('rabbit-status');
    if (wheel) wheel.classList.add('spinning');
    if (sprite) sprite.classList.add('running');
    if (statusEl) statusEl.innerText = '🏃‍♂️ วิ่งปั่นไฟ!';
    const gain = CONFIG.RABBIT.ELECTRICITY_PER_RUN;
    GameState.electricity = Math.min(CONFIG.ELECTRICITY.MAX, GameState.electricity + gain);
    this.updatePowerBar();
    this.updateInventory();
    GameState.save();
    this.showToast(`🐰 +${gain}% ไฟฟ้าจากการวิ่งของกระต่าย!`, 1600);
    setTimeout(() => {
      GameState.rabbit.isRunning = false;
      if (wheel) wheel.classList.remove('spinning');
      if (sprite) sprite.classList.remove('running');
      if (statusEl) statusEl.innerText = '😴 กำลังหลับ';
    }, CONFIG.RABBIT.RUN_DURATION);
  },

  updatePowerBar() {
    const pctEl = document.getElementById('power-percent');
    const bar = document.getElementById('power-bar-inner');
    const stripes = document.getElementById('power-bar-stripes');
    const status = document.getElementById('power-status');
    const houseLight = document.getElementById('house-light');
    const ppLight = document.getElementById('pp-light');
    const windows = document.querySelectorAll('.house-light-window');
    const people = document.querySelectorAll('.village-house .person');
    const pct = Math.max(0, Math.min(CONFIG.ELECTRICITY.MAX, GameState.electricity || 0));
    if (pctEl) pctEl.innerText = pct.toFixed(0) + '%';
    if (bar) bar.style.width = pct + '%';
    if (stripes) stripes.style.width = pct + '%';
    let level = 'ok';
    let text = '😀 ประชาชนมีความสุข ไฟฟ้าเพียงพอ';
    const citizenMsgs = {
      ok:   '😀 ประชาชนมีความสุข ไฟฟ้าเพียงพอ',
      warn: '😒 ชาวบ้านเริ่มบ่น: \"ไฟค่อยๆ ดับนะ? กระต่ายขี้เกียจหรือ!\"',
      crit: '😡 ประชาชนโกรธแค้น: \"ไอ้วิศวกรทำไมไฟดังกล่าว! แก้เดี๋ยวนี้!\"',
      out:  '💀 ไฟดับทั้งหมู่บ้าน! ชาวบ้านรวมกันด่ากันเป็นเสียงดัง!'
    };
    if (pct <= CONFIG.ELECTRICITY.OUT) {
      level = 'out';
      text = citizenMsgs.out;
    } else if (pct <= CONFIG.ELECTRICITY.CRITICAL) {
      level = 'crit';
      text = citizenMsgs.crit;
    } else if (pct <= 50) {
      level = 'warn';
      text = citizenMsgs.warn;
    } else {
      text = citizenMsgs.ok;
    }
    if (bar) {
      bar.classList.remove('ok', 'warn', 'crit', 'out');
      bar.classList.add(level);
    }
    if (stripes) {
      stripes.classList.remove('ok', 'warn', 'crit', 'out');
      stripes.classList.add(level);
    }
    if (status) {
      status.classList.remove('ok', 'warn', 'crit', 'out');
      status.classList.add(level);
      status.innerText = text;
    }
    const isOut = level === 'out';
    const isDark = pct < 12 || isOut;
    const isDim = level === 'warn' || level === 'crit';
    if (houseLight) {
      if (isDark) houseLight.classList.add('dark');
      else houseLight.classList.remove('dark');
    }
    if (ppLight) {
      if (isDark) ppLight.classList.add('dark');
      else ppLight.classList.remove('dark');
    }
    if (windows) {
      windows.forEach(w => {
        w.classList.remove('on', 'dark');
        if (isOut) w.classList.add('dark');
        else if (!isDim) w.classList.add('on');
      });
    }
    if (people) {
      people.forEach(p => {
        if (isOut) p.innerText = '😤';
        else if (level === 'crit') p.innerText = '😠';
        else if (level === 'warn') p.innerText = '😕';
      });
    }
  },

  updateButtonsEnabled() {
    const feed = document.getElementById('btn-feed');
    if (feed) {
      const canFeed = (GameState.res.SUGAR || 0) >= CONFIG.RABBIT.SUGAR_PER_RUN && !GameState.rabbit.isRunning;
      feed.disabled = !canFeed;
    }
  },

  gameOverCheck() {
    if (GameState.isGameOver) return;
    if ((GameState.electricity || 0) <= CONFIG.ELECTRICITY.OUT) {
      GameState.isGameOver = true;
      GameState.autoCycle = false;
      const goCycles = document.getElementById('go-cycles');
      const goSugar = document.getElementById('go-sugar');
      if (goCycles) goCycles.innerText = GameState.totalCycles || 0;
      if (goSugar) goSugar.innerText = GameState.totalGlucose || 0;
      const autoBtn = document.getElementById('auto-toggle-btn');
      if (autoBtn) {
        autoBtn.innerText = '🔁 คาลวิน AUTO: OFF';
        autoBtn.classList.add('hidden');
      }
      document.getElementById('game-over-overlay').classList.remove('hidden');
      GameState.save();
    }
  }
};

const MachineAnim = (() => {
  let canvas = null, ctx = null;
  let W = 700, H = 300;
  let running = false, raf = 0, lastT = 0, elapsed = 0;
  let kind = 'fixation';
  let lightScene = false;
  let entities = [];
  let timers = [];
  let loopAt = 8000;
  let loopFn = null;
  const reactor = { active: 0 };

  const lane = { beltY: 0, beltX0: 0, beltX1: 0, stA: 0, stB: 0, stC: 0 };
  let plates = ['แท่นที่ 1', 'แท่นที่ 2', 'แท่นที่ 3'];

  function layout() {
    lane.beltY = H * 0.58;
    lane.beltX0 = W * 0.05;
    lane.beltX1 = W * 0.96;
    lane.stA = W * 0.28;
    lane.stB = W * 0.56;
    lane.stC = W * 0.84;
  }

  function initCanvas() {
    canvas = document.getElementById('mp-canvas');
    if (!canvas || typeof canvas.getContext !== 'function') return false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    W = Math.max(320, rect.width);
    H = Math.max(240, rect.height);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout();
    return true;
  }

  function spawnM(type, x, y, count) {
    const def = CONFIG.MOLECULES[type] || { atoms: 'C', r: 6, label: type };
    const m = {
      type, def, x, y, count: count || 1,
      target: null, speed: 150, wait: 0,
      _onArrive: null, alpha: 1, scale: 1, flash: 0, bob: Math.random() * 6.28,
      hide: false
    };
    entities.push(m);
    return m;
  }

  function go(m, tx, ty, speed, onArrive) {
    m.target = { tx, ty };
    if (speed) m.speed = speed;
    m._onArrive = onArrive || null;
  }

  function cap(text, stepIdx) {
    const el = document.getElementById('mp-caption');
    if (el) el.innerText = '▶ ' + text;
    const lis = document.querySelectorAll('#mp-steps li');
    lis.forEach((li, i) => li.classList.toggle('active', i === (stepIdx === undefined ? 0 : stepIdx)));
  }

  function after(ms, fn) { timers.push({ at: elapsed + ms, fn }); }
  function clearEntities() { entities = []; }
  function flash() { reactor.active = 900; }

  function atomOffsets(atoms, r) {
    const gap = r * 2 + 2;
    const parts = atoms.split('');
    const pCount = parts.filter(t => t === 'P').length;
    let order = parts.slice();

    if (pCount === 2 && parts[0] !== 'A') {
      const core = parts.filter(t => t !== 'P');
      order = ['P'].concat(core, ['P']);
    } else if (pCount === 1) {
      const core = parts.filter(t => t !== 'P');
      order = core.concat(['P']);
    }

    return order.map((t, i) => ({ t, ox: (i - (order.length - 1) / 2) * gap, oy: 0 }));
  }

  function tryTransform(m, newType) {
    m.type = newType;
    m.def = CONFIG.MOLECULES[newType] || m.def;
    m.flash = 600;
    m.scale = 1.25;
  }

  /* ---------------- scenes (สายพานค่อยๆ เดินทาง) ---------------- */

  function sendOnBelt(m, fx, cb) {
    go(m, fx, lane.beltY, 100, cb || null);
  }

  function sendOutOfBelt(m) {
    go(m, lane.beltX1 + 70, lane.beltY, 130, () => { m.alpha = 0; m.hide = true; });
  }

  function dropFromTop(type, x, count) {
    const s = spawnM(type, x, -36, count || 1);
    go(s, x, lane.beltY + 8, 260, null);
    return s;
  }

  function recycle(type, x) {
    const r = spawnM(type, x, lane.beltY - 16, 6);
    go(r, W * 0.10, H * 0.09, 130, () => { r.alpha = 0; r.hide = true; });
  }

  function swap(m, type, count) {
    m.type = type;
    m.def = CONFIG.MOLECULES[type] || m.def;
    if (count) m.count = count;
    m.flash = 600;
    m.scale = 1;
  }

  function setupFixation() {
    plates = ['เติม CO₂', 'ตัดแบ่ง', 'ส่งออก'];
    cap('เครื่อง 1 · RuBP ×3 → 3-PGA ×6', 0);
    const rubp = spawnM('rubp', lane.beltX0 - 80, lane.beltY, 3);
    cap('STEP 1: RuBP ×3 อยู่บนสายพาน', 0);
    sendOnBelt(rubp, lane.stA, () => {
      after(500, () => {
        cap('STEP 2: CO₂ ×3 เติม → 6C ×3', 1);
        const co2 = dropFromTop('co2', lane.stA, 3);
        after(1200, () => {
          flash();
          swap(rubp, 'c6', 3);
          co2.alpha = 0; co2.hide = true;
          after(600, () => {
            cap('STEP 3: 6C ×3 → ไปตัดแบ่ง', 2);
            sendOnBelt(rubp, lane.stB, () => {
              after(400, () => {
                cap('STEP 4 ✓: 6C ×3 แตก → 3-PGA ×6', 3);
                flash();
                swap(rubp, 'pga', 6);
                after(1000, () => {
                  cap('STEP 5: 3-PGA ×6 ส่งต่อเครื่อง 2', 4);
                  sendOutOfBelt(rubp);
                });
              });
            });
          });
        });
      });
    });
    loopAt = 12500;
  }

  function setupReduction() {
    plates = ['เดิม ATP', 'เดิม NADPH', 'ส่งออก'];
    cap('เครื่อง 2 · 3-PGA ×6 → G3P ×6', 0);
    const pga = spawnM('pga', lane.beltX0 - 90, lane.beltY, 6);
    cap('STEP 1: 3-PGA ×6 อยู่บนสายพาน', 0);
    sendOnBelt(pga, lane.stA, () => {
      after(500, () => {
        cap('STEP 2: ATP ×6 เติม → 1,3-BPG ×6', 1);
        const atp = dropFromTop('atp', lane.stA, 6);
        after(1200, () => {
          flash();
          swap(pga, 'bpg', 6);
          atp.alpha = 0; atp.hide = true;
          recycle('adp', lane.stA);
          after(600, () => {
            cap('STEP 3: 1,3-BPG ×6 → ไปรับ NADPH', 2);
            sendOnBelt(pga, lane.stB, () => {
              after(500, () => {
                cap('STEP 4: NADPH ×6 ให้ H⁻ → G3P ×6', 3);
                const nadph = dropFromTop('nadph', lane.stB, 6);
                after(1200, () => {
                  flash();
                  swap(pga, 'g3p', 6);
                  nadph.alpha = 0; nadph.hide = true;
                  recycle('nadp', lane.stB);
                  cap('STEP 5 ✓: G3P ×6 ส่งต่อเครื่อง 3', 4);
                  sendOutOfBelt(pga);
                });
              });
            });
          });
        });
      });
    });
    loopAt = 13000;
  }

  function setupRegeneration() {
    plates = ['แยก G3P', 'เดิม ATP', 'ส่งออก'];
    cap('เครื่อง 3 · G3P ×6 → แยก 1 โมเลกุล + RuBP ×3', 0);
    const g3p = spawnM('g3p', lane.beltX0 - 90, lane.beltY, 6);
    cap('STEP 1: G3P ×6 อยู่บนสายพาน', 0);
    sendOnBelt(g3p, lane.stA, () => {
      after(500, () => {
        cap('STEP 2: แยก 1 โมเลกุล (C C C P) ไปทำน้ำตาล', 1);
        const outs = spawnM('g3p', lane.stA, lane.beltY, 1);
        outs.scale = 0.9;
        go(outs, W * 0.27, H * 0.08, 130, () => { outs.alpha = 0; outs.hide = true; });
        swap(g3p, 'g3p', 5);
        after(800, () => {
          cap('STEP 3: G3P ×5 → เติม ATP ×3', 2);
          sendOnBelt(g3p, lane.stB, () => {
            after(500, () => {
              cap('STEP 4: ATP ×3 → RuBP ×3', 3);
              const atp = dropFromTop('atp', lane.stB, 3);
              after(1200, () => {
                flash();
                swap(g3p, 'rubp', 3);
                atp.alpha = 0; atp.hide = true;
                cap('STEP 5 ✓: RuBP ×3 พร้อมรอบใหม่', 4);
                sendOutOfBelt(g3p);
              });
            });
          });
        });
      });
    });
    loopAt = 12000;
  }

  function setupLightReaction() {
    plates = ['PSII · คลอโรฟิลล์', 'ETC · b₆f / PC', 'PSI · NADP⁺'];
    cap('ขั้นแสง · ต่อเนื่องทีละ 1 (ทุก 20 วิ)', 0);
    const chl = spawnM('chl', lane.beltX0 - 70, lane.beltY, 1);
    cap('STEP 1: โฟตอน ×2 ฟาดคลอโรฟิลล์ (PSII) — ปลุก e⁻', 0);
    sendOnBelt(chl, lane.stA, () => {
      after(400, () => {
        cap('STEP 2: H₂O ×1 แตก: O₂ ปล่อย + 2H⁺ + e⁻', 1);
        const photon = dropFromTop('photon', lane.stA, 2);
        after(900, () => {
          const h2o = dropFromTop('h2o', lane.stA - 45, 1);
          after(1100, () => {
            flash();
            photon.alpha = 0; photon.hide = true;
            h2o.alpha = 0; h2o.hide = true;
            const o2 = spawnM('o2', lane.stA + 20, lane.beltY, 1);
            go(o2, lane.stA + 10, H * 0.05, 160, () => { o2.alpha = 0; o2.hide = true; });
            const p1 = spawnM('prot', lane.stA - 25, lane.beltY - 12, 2);
            go(p1, lane.stB, lane.beltY - 26, 150, () => { p1.alpha = 0; p1.hide = true; });
            after(350, () => {
              const e1 = spawnM('et', lane.stA, lane.beltY, 1);
              cap('STEP 3: e⁻ วิ่ง ETC → ดัน H⁺ เกรเดียนต์ (b₆f)', 2);
              go(e1, lane.stB, lane.beltY, 150, () => {
                after(450, () => {
                  flash();
                  cap('STEP 4: H⁺ ไหลผ่าน ATP synthase → ปั่น ATP', 2);
                  const p2 = spawnM('prot', lane.stB, lane.beltY - 20, 2);
                  go(p2, lane.stC - 40, lane.beltY - 34, 150, () => { p2.alpha = 0; p2.hide = true; });
                  go(e1, lane.stC - 20, lane.beltY, 150, () => {
                    after(400, () => {
                      cap('STEP 5: ADP + Pi → ATP +1 (ATP synthase)', 3);
                      const adp = dropFromTop('adp', lane.stC - 45, 1);
                      after(1200, () => {
                        flash();
                        swap(adp, 'atp', 1);
                        cap('STEP 6: NADP⁺ + 2e⁻ + H⁺ → NADPH +1 (PSI)', 3);
                        const nadp = dropFromTop('nadp', lane.stC + 35, 1);
                        after(1200, () => {
                          flash();
                          swap(nadp, 'nadph', 1);
                          cap('STEP 7 ✓: ATP +1 + NADPH +1 → เครื่องที่ 2 (Reduction)', 4);
                          sendOutOfBelt(adp);
                          sendOutOfBelt(nadp);
                          sendOutOfBelt(e1);
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
    loopAt = 15000;
  }

  /* ---------------- rendering ---------------- */

  function drawBelt(x0f, x1f, y, h, fill, dir) {
    const x0 = W * x0f, x1 = W * x1f;
    const d = dir || 1;
    ctx.fillStyle = fill;
    ctx.fillRect(x0, y - h / 2, x1 - x0, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.65)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x0, y - h / 2, x1 - x0, h);
    ctx.fillStyle = '#3f3f46';
    for (const rx of [x0, x1]) {
      ctx.beginPath(); ctx.arc(rx, y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#666'; ctx.stroke();
    }
    const off = ((elapsed * 30 / 1000) % 22) * (d < 0 ? -1 : 1);
    ctx.save();
    ctx.beginPath(); ctx.rect(x0, y - h / 2, x1 - x0, h); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.13)';
    for (let x = x0 - 22 + off; x < x1 + 22; x += 22) {
      ctx.fillRect(x + 2, y - h / 2 + 3, 11, h - 6);
    }
    ctx.restore();
  }

  function drawStations() {
    const st = [
      { x: lane.stA, t: plates[0] || 'แท่นที่ 1' },
      { x: lane.stB, t: plates[1] || 'แท่นที่ 2' },
      { x: lane.stC, t: plates[2] || 'แท่นที่ 3' }
    ];
    st.forEach(s => {
      ctx.font = 'bold 12px VT323, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#4a7c4a';
      ctx.lineWidth = 2;
      ctx.strokeRect(s.x - 58, lane.beltY - 42, 116, 26);
      ctx.fillStyle = 'rgba(60,100,60,0.28)';
      ctx.fillRect(s.x - 56, lane.beltY - 40, 112, 22);
      ctx.fillStyle = '#b8e0b8';
      ctx.fillText(s.t, s.x, lane.beltY - 29);
      const glow = reactor.active > 0;
      if (glow) {
        const g = ctx.createRadialGradient(s.x, lane.beltY, 5, s.x, lane.beltY, 70);
        g.addColorStop(0, 'rgba(255,215,94,0.45)');
        g.addColorStop(1, 'rgba(255,215,94,0)');
        ctx.fillStyle = g;
        ctx.fillRect(s.x - 70, lane.beltY - 60, 140, 120);
      }
    });
    ctx.font = 'bold 13px VT323, monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(135,206,235,0.9)';
    ctx.fillText('▶ INPUT', lane.beltX0, lane.beltY - 46);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(95,255,95,0.9)';
    ctx.fillText('OUTPUT', lane.beltX1, lane.beltY - 46);
  }

  function drawThylakoid() {
    const x0 = W * 0.03, x1 = W * 0.97;
    ctx.fillStyle = 'rgba(40,110,70,0.55)';
    ctx.fillRect(x0, lane.beltY - 38, x1 - x0, 5);
    ctx.fillStyle = 'rgba(28,78,52,0.55)';
    ctx.fillRect(x0, lane.beltY - 30, x1 - x0, 4);
    ctx.fillStyle = 'rgba(66,140,90,0.35)';
    for (let i = 0; i < 10; i++) {
      const gx = x0 + 30 + i * ((x1 - x0 - 60) / 9);
      ctx.beginPath(); ctx.ellipse(gx, lane.beltY - 40, 13, 5, 0, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.ellipse(gx - 6, lane.beltY - 46, 13, 5, 0, Math.PI, 0); ctx.fill();
    }
    const hx0 = lane.stB - 62, hx1 = lane.stC - 24;
    ctx.fillStyle = 'rgba(170,110,255,0.14)';
    ctx.fillRect(hx0, lane.beltY - 58, hx1 - hx0, 12);
    ctx.font = 'bold 9px VT323, monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#d3b0ff';
    ctx.fillText('H⁺ เกรเดียนต์ → ลูเมน', (hx0 + hx1) / 2, lane.beltY - 60);
    ctx.font = 'bold 10px VT323, monospace';
    ctx.fillStyle = 'rgba(255,231,74,0.95)';
    ctx.fillText('PSII', lane.stA - 32, lane.beltY - 68);
    ctx.fillStyle = 'rgba(90,211,255,0.95)';
    ctx.fillText('PSI', lane.stC - 32, lane.beltY - 68);
  }

  function drawSunBeam() {
    const gx = lane.beltX0 - 20, gy = H * 0.06;
    const g = ctx.createLinearGradient(gx, gy, lane.stA - 10, lane.beltY - 18);
    g.addColorStop(0, 'rgba(255,240,150,0.32)');
    g.addColorStop(1, 'rgba(255,240,150,0.02)');
    ctx.save();
    ctx.strokeStyle = g;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(lane.stA - 10, lane.beltY - 18);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(gx + 8, gy + 6);
    ctx.lineTo(lane.stA - 6, lane.beltY - 20);
    ctx.stroke();
    ctx.restore();
  }

  function drawATPSynthase() {
    const cx = lane.stC - 20, cy = lane.beltY - 26;
    ctx.strokeStyle = 'rgba(120,80,40,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, lane.beltY - 8); ctx.stroke();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((elapsed / 1000) * 3.5);
    ctx.fillStyle = '#b07a2a';
    for (let b = 0; b < 4; b++) {
      ctx.save();
      ctx.rotate(b * Math.PI / 2);
      ctx.beginPath(); ctx.ellipse(9, 0, 9, 3.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#e0b34a';
    ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.font = 'bold 8px VT323, monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#ffd75e';
    ctx.fillText('ATP synthase', cx, lane.beltY - 44);
  }

  function drawMol(m) {
    if (m.hide || m.alpha <= 0.03) return;
    const def = m.def;
    const offsets = atomOffsets(def.atoms, def.r);
    const n = m.count || 1;
    ctx.save();
    ctx.globalAlpha = m.alpha;
    ctx.translate(m.x, m.y);
    ctx.scale(m.scale, m.scale);
    if (m.flash > 0) {
      ctx.shadowColor = 'rgba(255,255,255,0.95)';
      ctx.shadowBlur = 16;
    }
    offsets.forEach(a => {
      const col = (CONFIG.ATOM_TYPES[a.t] && CONFIG.ATOM_TYPES[a.t].color) || '#888';
      ctx.beginPath();
      ctx.arc(a.ox, a.oy, def.r, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.stroke();
      if (m.flash > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath(); ctx.arc(a.ox, a.oy, def.r * 0.55, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#121212';
      ctx.font = 'bold ' + Math.max(5, def.r * 0.85) + 'px monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(a.t, a.ox, a.oy + 0.5);
    });
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = Math.min(1, m.alpha + 0.25);
    ctx.font = 'bold 12px VT323, monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    const ly = m.y - (offsets.length ? def.r - 2 : 22);
    const lbl = def.label + (n > 1 ? ' ×' + n : '');
    ctx.strokeStyle = 'rgba(5,10,5,0.85)';
    ctx.lineWidth = 3;
    ctx.strokeText(lbl, m.x, ly);
    ctx.fillStyle = '#ffe8a0';
    ctx.fillText(lbl, m.x, ly);
    ctx.restore();
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0b170b';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (let gy = 0; gy < H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

    drawBelt(0.05, 0.96, lane.beltY, 24, '#2a4a2a', 1);
    if (lightScene) drawThylakoid();
    drawStations();
    if (lightScene) drawSunBeam();

    const list = entities.slice().sort((a, b) => a.y - b.y);
    for (const m of list) drawMol(m);

    if (lightScene) drawATPSynthase();
  }

  /* ---------------- loop ---------------- */

  function update(dt) {
    elapsed += dt;
    for (const t of timers) {
      if (!t.fired && elapsed >= t.at) { t.fired = true; t.fn(); }
    }
    timers = timers.filter(t => !t.fired);
    if (reactor.active > 0) reactor.active = Math.max(0, reactor.active - dt);

    for (const m of entities) {
      if (m.wait > 0) { m.wait -= dt; continue; }
      if (m.target) {
        const dx = m.target.tx - m.x, dy = m.target.ty - m.y;
        const d = Math.hypot(dx, dy);
        const step = (m.speed || 150) * dt / 1000;
        if (d <= step) {
          m.x = m.target.tx; m.y = m.target.ty;
          const cb = m._onArrive;
          m.target = null; m._onArrive = null;
          if (cb) cb();
        } else {
          m.x += dx / d * step; m.y += dy / d * step;
        }
      }
      m.alpha = Math.min(1, m.alpha + dt / 140);
      m.scale += (1 - m.scale) * Math.min(1, dt / 160);
      if (m.flash > 0) m.flash = Math.max(0, m.flash - dt);
      m.bob += dt / 1000;
    }
  }

  function frame(t) {
    if (!running) return;
    const dt = Math.min(60, t - lastT);
    lastT = t;
    update(dt);
    draw();
    raf = requestAnimationFrame(frame);
  }

  function restart() {
    timers = [];
    clearEntities();
    reactor.active = 0;
    elapsed = 0;
    if (kind === 'fixation') setupFixation();
    else if (kind === 'reduction') setupReduction();
    else if (kind === 'light') setupLightReaction();
    else setupRegeneration();
    lightScene = kind === 'light';
    after(loopAt, restart);
  }

  function play(newKind) {
    kind = newKind || kind;
    if (!initCanvas()) return;
    running = true;
    timers = [];
    clearEntities();
    reactor.active = 0;
    elapsed = 0;
    if (kind === 'fixation') setupFixation();
    else if (kind === 'reduction') setupReduction();
    else if (kind === 'light') setupLightReaction();
    else setupRegeneration();
    lightScene = kind === 'light';
    after(loopAt, restart);
    if (raf) cancelAnimationFrame(raf);
    lastT = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  return { play, stop, restart };
})();
