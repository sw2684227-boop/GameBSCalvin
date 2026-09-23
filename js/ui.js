const UI = {
  init() {
    if (typeof SFX !== 'undefined' && SFX.init) SFX.init();
    document.addEventListener('click', (e) => {
      if (e.target.closest && e.target.closest('#zoom-wrap')) return;
      const menu = document.getElementById('zoom-menu');
      if (menu && !menu.classList.contains('hidden')) menu.classList.add('hidden');
      if (e.target.closest && e.target.closest('.btn-pixel') && typeof SFX !== 'undefined' && SFX.play) SFX.play('click');
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 960) this.closeSidebars();
    });
    this.syncSfxButton();
    this.initFullscreenGate();
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
      if (visible) {
        btn.classList.remove('hidden');
        btn.style.display = 'inline-block';
      } else {
        btn.classList.add('hidden');
        btn.style.display = 'none';
      }
      btn.disabled = !visible;
      btn.onclick = () => {
        if (GameState.pendingAction) {
          const cb = GameState.pendingAction;
          GameState.pendingAction = null;
          cb();
        }
      };
    }
    GameState.pendingAction = visible ? callback : null;
  },

  triggerActionButton() {
    if (GameState.pendingAction) {
      const cb = GameState.pendingAction;
      GameState.pendingAction = null;
      cb();
    } else if (typeof CalvinCycle !== 'undefined' && CalvinCycle.triggerAction) {
      CalvinCycle.triggerAction();
    }
  },

  toggleSfx() {
    if (typeof SFX === 'undefined' || !SFX) return;
    SFX.toggleMute();
    this.syncSfxButton();
  },

  syncSfxButton() {
    const btn = document.getElementById('sfx-toggle-btn');
    if (!btn) return;
    const muted = (typeof SFX !== 'undefined' && SFX.isMuted) ? SFX.isMuted() : false;
    btn.innerText = muted ? '🔇' : '🔊';
    btn.classList.toggle('muted', muted);
    btn.title = muted ? 'เปิดเสียง' : 'ปิดเสียง';
  },

  showToast(text, duration = 1500) {
    const t = document.getElementById('travel-toast');
    const el = document.getElementById('toast-text');
    if (!t || !el) return;
    el.innerText = text;
    t.classList.remove('hidden');
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.add('hidden'), duration);
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

  /* ── หน้าจอ "แตะ 1 ครั้ง เข้าเต็มจอ" ตอนเข้าเว็บ ── */
  initFullscreenGate() {
    const ov = document.getElementById('fullscreen-overlay');
    if (!ov) return;
    if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement) {
      ov.classList.add('hidden');
      return;
    }
    ov.classList.remove('hidden');
    document.body.classList.add('ui-modal-open');
  },

  requestFullscreenEnter() {
    const el = document.documentElement;
    const done = () => this.closeFullscreenGate();
    let ret = null;
    try {
      if (el.requestFullscreen) ret = el.requestFullscreen();
      else if (el.webkitRequestFullscreen) ret = el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen) ret = el.mozRequestFullScreen();
    } catch (e) { ret = null; }
    // ถึงเต็มจอไม่ได้ (เช่น iOS) ก็ปิดเกทให้เล่นต่อได้
    if (ret && typeof ret.catch === 'function') ret.then(done).catch(done);
    else done();
  },

  skipFullscreenEnter() {
    this.closeFullscreenGate();
  },

  // เข้าเต็มจอตรงๆ โดยไม่แตะ overlay (ใช้จากปุ่มในหน้าเริ่มเกม/แถบบน)
  enterFullscreen() {
    const el = document.documentElement;
    try {
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
    } catch (e) { /* นักเบราเซอร์ไม่อนุญาต เช่น iOS */ }
  },

  closeFullscreenGate() {
    const ov = document.getElementById('fullscreen-overlay');
    if (ov) ov.classList.add('hidden');
    const so = document.getElementById('start-overlay');
    const startOpen = so && !so.classList.contains('hidden');
    if (startOpen) document.body.classList.add('ui-modal-open');
    else document.body.classList.remove('ui-modal-open');
  },

  resetGame(force = false) {
    if (!force && !confirm('ต้องการเริ่มเกมใหม่ในช่องนี้ทั้งหมดหรือไม่?')) return;
    if (typeof SaveManager !== 'undefined' && SaveManager && typeof SaveManager.selectSlot === 'function') {
      SaveManager.deleteSlot(SaveManager.currentSlot());
      SaveManager.selectSlot(SaveManager.currentSlot());
    } else {
      location.reload();
    }
  },

  /* ── หน้าจอเริ่มเกม / เมนูเซฟ / ความสำเร็จ ── */
  showStartScreen() {
    const el = document.getElementById('start-overlay');
    if (el) el.classList.remove('hidden');
    document.body.classList.add('ui-modal-open');
    this.renderSaveMenu();
  },

  hideStartScreen() {
    const el = document.getElementById('start-overlay');
    if (el) el.classList.add('hidden');
    document.body.classList.remove('ui-modal-open');
  },

  renderSaveMenu() {
    if (typeof SaveManager === 'undefined' || !SaveManager || typeof SaveManager.list !== 'function') return;
    const wrap = document.getElementById('save-slot-list');
    if (!wrap) return;
    const rows = SaveManager.list();
    const cur = SaveManager.currentSlot();
    wrap.innerHTML = rows.map(s => {
      const cls = s.idx === cur ? 'save-slot slot-current' : 'save-slot';
      const btnLoad = s.exists
        ? `<button class="btn-pixel btn-slot" onclick="SaveManager.selectSlot(${s.idx})">📂 โหลด</button>`
        : `<button class="btn-pixel btn-slot btn-new" onclick="SaveManager.selectSlot(${s.idx})">▶ เริ่มเกมใหม่</button>`;
      const btnSave = s.exists ? `<button class="btn-pixel btn-slot" onclick="SaveManager.saveSlot(${s.idx})">💾 บันทึก</button>` : '';
      const btnDel = s.exists ? `<button class="btn-pixel btn-slot btn-slot-del" onclick="SaveManager.deleteSlotUI(${s.idx})">🗑 ลบ</button>` : '';
      const stat = s.exists
        ? `<span class="slot-stat">🌀 ${s.summary.cycles} รอบ</span><span class="slot-stat">🍬 ${s.summary.sugars}</span><span class="slot-stat">🌳 ${s.summary.complete}/${CONFIG.FOREST.PLOTS} ต้น</span>`
        : '<span class="slot-stat slot-empty-txt">ยังไม่มีข้อมูล — กดเริ่มเกมใหม่เพื่อสร้างช่องนี้</span>';
      return `<div class="${cls}">
        <div class="slot-head"><span class="slot-name">ช่อง ${s.idx + 1}</span><span class="slot-ago">${s.exists && s.ago ? s.ago : (s.exists ? 'บันทึกไว้แล้ว' : 'ว่าง')}</span></div>
        <div class="slot-body">${stat}</div>
        <div class="slot-actions">${btnLoad}${btnSave}${btnDel}</div>
      </div>`;
    }).join('');
  },

  openSaveMenu() {
    const ov = document.getElementById('save-menu-overlay');
    if (!ov) return;
    this.renderSaveMenu();
    ov.classList.remove('hidden');
    document.body.classList.add('ui-modal-open');
  },

  hideSaveMenu() {
    const ov = document.getElementById('save-menu-overlay');
    if (ov) ov.classList.add('hidden');
    const so = document.getElementById('start-overlay');
    const startOpen = so && !so.classList.contains('hidden');
    if (startOpen) document.body.classList.add('ui-modal-open');
    else document.body.classList.remove('ui-modal-open');
  },

  toggleSaveMenu() {
    const ov = document.getElementById('save-menu-overlay');
    if (ov && !ov.classList.contains('hidden')) this.hideSaveMenu();
    else this.openSaveMenu();
  },

  openAch() {
    if (typeof Achievements !== 'undefined' && Achievements && typeof Achievements.open === 'function') Achievements.open();
  },

  // ปุ่ม "เริ่มเกมใหม่ทันที" — ใช้ช่องว่างช่องแรก
  startFreshNow() {
    if (typeof SaveManager === 'undefined' || !SaveManager || typeof SaveManager.list !== 'function') return;
    const rows = SaveManager.list();
    const empty = rows.find(s => !s.exists);
    if (empty) SaveManager.selectSlot(empty.idx);
    else {
      this.showToast('ไม่มีช่องว่าง — ลบช่องของเก่าเพื่อเริ่มใหม่', 2400);
      this.openSaveMenu();
    }
  },

  _fmtDuration(ms) {
    let s = Math.max(0, Math.floor((ms || 0) / 1000));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return h + ' ชม. ' + m + ' นาที ' + sec + ' วิ';
    if (m > 0) return m + ' นาที ' + sec + ' วิ';
    return sec + ' วิ';
  },

  showEnding() {
    const el = document.getElementById('ending-overlay');
    if (!el) return;
    const t = document.getElementById('end-time');
    if (t) t.innerText = this._fmtDuration(Date.now() - (GameState.startedAt || Date.now()));
    const c = document.getElementById('end-cycles');
    if (c) c.innerText = GameState.totalCycles || 0;
    const g = document.getElementById('end-glucose');
    if (g) g.innerText = GameState.totalGlucose || 0;
    const tr = document.getElementById('end-trees');
    if (tr) tr.innerText = (GameState.forest.trees || []).filter(v => v >= CONFIG.FOREST.STAGES).length + '/' + CONFIG.FOREST.PLOTS;
    const conf = el.querySelector('.end-confetti');
    if (conf) {
      let html = '';
      const colors = ['#ffd75e', '#5fff8a', '#ff9ec4', '#7ec8ff', '#ffb36a', '#c7a0ff'];
      for (let i = 0; i < 28; i++) {
        html += `<i style="left:${(i * 4.2 + 2) % 100}%;background:${colors[i % colors.length]};animation-delay:${(i % 7) * 0.3}s;animation-duration:${2.8 + (i % 4) * 0.7}s"></i>`;
      }
      conf.innerHTML = html;
    }
    el.classList.remove('hidden');
    document.body.classList.add('ui-modal-open');
    if (GameState.phaserScene && GameState.phaserScene.cameras) {
      GameState.phaserScene.cameras.main.flash(500, 255, 240, 170);
    }
  },

  hideEnding() {
    const el = document.getElementById('ending-overlay');
    if (el) el.classList.add('hidden');
    document.body.classList.remove('ui-modal-open');
  },

  restartFromEnding() {
    this.hideEnding();
    this.resetGame(true);
  },

  openMachinePanel(id) {
    const m = (id === 'light') ? CONFIG.LIGHT_MACHINE : (id === 'sugar' ? CONFIG.SUGAR_MACHINE : CONFIG.THREE_MACHINES[id]);
    if (!m || !m.detail || !m.steps) return;
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
    const cardMap = { light: 0, fixation: 1, reduction: 2, regeneration: 3, sugar: 4 };
    const all = document.querySelectorAll('.machine-card');
    if (all[cardMap[id]]) all[cardMap[id]].classList.add('active');
    document.getElementById('machine-panel-overlay').classList.remove('hidden');
    document.body.classList.add('ui-modal-open');
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
    document.body.classList.remove('ui-modal-open');
    document.querySelectorAll('.machine-card').forEach(c => c.classList.remove('active'));
    MachineAnim.stop();
  },

  setMachineStatus(n, status) {
    const el = document.getElementById('mp-status');
    if (!el) return;
    const names = {
      1: 'เครื่องที่ 1: Fixation',
      2: 'เครื่องที่ 2: Reduction',
      3: 'เครื่องที่ 3: Regeneration'
    };
    const prefix = names[n] ? names[n] + ' — ' : '';
    el.classList.remove('wait', 'run', 'boost', 'yield');
    if (status === 'run') {
      el.textContent = prefix + '⚙ ทำงาน';
      el.classList.add('run');
    } else if (status === 'boost') {
      el.textContent = prefix + '⚡เร็ว ×2 (มีแสง)';
      el.classList.add('boost');
    } else if (status === 'yield') {
      el.textContent = prefix + '⏳ ผลิต';
      el.classList.add('yield');
    } else {
      el.textContent = prefix + '● รอทำงาน';
      el.classList.add('wait');
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
          this.showToast('⚠️ คาลวิน AUTO: วัตถุดิบไม่พอ (ใส่ CO₂ ในเครื่องแล้ว ≥3, ATP ≥9, NADPH ≥6) → เก็บ CO₂ ทีละ 1 แล้วกด SPACE ใส่กลางวงก่อน!', 2800);
        }
      }
    } else if (GameState.autoCycle && GameState.isCycleRunning) {
      this.showToast('🌀 คาลวิน AUTO: ON — รอบนี้จบแล้วจะเริ่มอัตโนมัติต่อ', 1800);
    }
    GameState.save();
  },

  feedTree(idx) {
    if (this.forestComplete()) {
      this.showToast('🌳 ป่าอุดมสมบูรณ์ครบ 5 ต้นแล้ว! ฟาร์มต่อได้ไม่จำกัดเวลา', 1800);
      return;
    }
    if ((GameState.res.SUGAR || 0) < CONFIG.FOREST.SUGAR_PER_FEED) {
      if ((GameState.sugarReady || 0) > 0) {
        this.showToast('🍬 มีน้ำตาลรอที่เครื่องบรรจุ! เดินไปกด SPACE เก็บก่อน', 2200);
      } else {
        this.showToast('⚠️ น้ำตาลไม่พอ! เก็บจากเครื่องบรรจุน้ำตาล (ปั่นคาลวิน 2 รอบ = น้ำตาล 1)', 2400);
      }
      return;
    }
    const trees = GameState.forest.trees;
    let target = typeof idx === 'number' ? idx : -1;
    if (target >= 0 && target < trees.length && trees[target] >= CONFIG.FOREST.STAGES) {
      this.showToast('🌳 ต้นนี้โตเต็มที่แล้ว! ไปให้น้ำตาลต้นอื่นต่อ', 1600);
      return;
    }
    if (target < 0 || target >= trees.length) {
      target = trees.findIndex(v => v < CONFIG.FOREST.STAGES);
      if (target === -1) {
        this.showToast('🌳 ป่าครบสมบูรณ์ทุกต้นแล้ว!', 1600);
        return;
      }
    }
    GameState.res.SUGAR -= CONFIG.FOREST.SUGAR_PER_FEED;
    GameState.forest.fed += 1;
    trees[target] = Math.min(CONFIG.FOREST.STAGES, trees[target] + 1);
    this.renderForest();
    if (GameState.phaserScene && GameState.phaserScene.updateFieldForest) GameState.phaserScene.updateFieldForest();
    this.updateInventory();
    GameState.save();
    if (typeof Achievements !== 'undefined' && Achievements && typeof Achievements.checkAll === 'function') Achievements.checkAll();
    const stageNames = ['', 'เมล็ด', 'กล้า', 'ต้นอ่อน', 'กำลังโต', 'สมบูรณ์'];
    const lv = Math.min(CONFIG.FOREST.STAGES, trees[target]);
    if (typeof SFX !== 'undefined' && SFX.play) SFX.play(lv >= CONFIG.FOREST.STAGES ? 'levelup' : 'feed');
    this.showToast(`🌱 ต้นที่ ${target + 1} เติบโตเป็น"${stageNames[lv]}"แล้ว!`, 1600);
if (this.forestComplete()) {
      GameState.forest.medals = (GameState.forest.medals || 0) + 1;
      this.renderMedal();
      this.hideEnding();
      GameState.save();
      if (typeof SFX !== 'undefined' && SFX.play) SFX.play('complete');
      this.showToast(`🎉🌳 ป่าอุดมสมบูรณ์ครบ 5 ต้นแล้ว! ได้รับ ${CONFIG.FOREST.MEDAL_NAME} 🏅`, 3600);
      const self = this;
      setTimeout(() => self.showEnding(), 1500);
    }
  },

  forestComplete() {
    return (GameState.forest.trees || []).every(t => t >= CONFIG.FOREST.STAGES);
  },

  renderMedal() {
    const el = document.getElementById('forest-medal');
    if (!el) return;
    const n = GameState.forest.medals || 0;
    if (n > 0) {
      el.classList.remove('hidden');
      el.innerHTML = `${CONFIG.FOREST.MEDAL_NAME} × ${n}`;
    } else {
      el.classList.add('hidden');
    }
  },

  _treeSvg(lv) {
    const canopy = (blobs) =>
      blobs.map(b => `<circle cx="${b[0]}" cy="${b[1]}" r="${b[2] + 3}" fill="#0e3d12"/>`).join('') +
      blobs.map(b => `<circle cx="${b[0]}" cy="${b[1]}" r="${b[2]}" fill="${b[3]}"/>`).join('');
    const trunk = (x, yTop, w, h) =>
      `<rect x="${x - w / 2}" y="${yTop}" width="${w}" height="${h}" rx="${w * 0.3}" fill="#8b5a2b" stroke="#5c3a1a" stroke-width="2.5"/>` +
      `<rect x="${x - w / 2 + 2}" y="${yTop + 4}" width="${Math.max(2, w * 0.28)}" height="${h - 8}" rx="2" fill="#a0722f" opacity="0.85"/>`;
    if (lv <= 1) {
      return `<ellipse cx="48" cy="90" rx="15" ry="4" fill="#0a2a0a" opacity="0.3"/>` +
        trunk(48, 62, 8, 28) +
        canopy([[40, 56, 11, '#2e7d32'], [56, 58, 10, '#388e3c'], [48, 48, 13, '#43a047'], [44, 52, 10, '#4caf50']]) +
        `<circle cx="44" cy="44" r="4" fill="#a5d6a7" opacity="0.8"/>`;
    }
    if (lv === 2) {
      return `<ellipse cx="48" cy="91" rx="19" ry="5" fill="#0a2a0a" opacity="0.32"/>` +
        `<ellipse cx="48" cy="90" rx="18" ry="6" fill="#5c3a1a"/><ellipse cx="48" cy="88" rx="14" ry="5" fill="#8b5a2b"/>` +
        trunk(48, 52, 11, 38) +
        canopy([
          [30, 46, 14, '#1b5e20'], [66, 48, 13, '#1b5e20'],
          [34, 38, 16, '#2e7d32'], [62, 40, 15, '#2e7d32'],
          [48, 30, 18, '#388e3c'], [42, 42, 15, '#43a047'],
          [54, 34, 14, '#4caf50'], [44, 24, 13, '#4caf50'], [54, 26, 12, '#66bb6a']
        ]) +
        `<circle cx="42" cy="22" r="5" fill="#a5d6a7" opacity="0.8"/>`;
    }
    let art = `<ellipse cx="48" cy="92" rx="25" ry="6" fill="#0a2a0a" opacity="0.35"/>` +
      `<ellipse cx="48" cy="91" rx="24" ry="7" fill="#5c3a1a"/><ellipse cx="48" cy="89" rx="18" ry="5" fill="#8b5a2b"/>` +
      trunk(48, 44, 15, 46) +
      canopy([
        [22, 42, 15, '#1b5e20'], [74, 44, 14, '#1b5e20'],
        [30, 34, 17, '#256b28'], [66, 36, 16, '#2e7d32'],
        [38, 26, 18, '#388e3c'], [58, 28, 17, '#43a047'],
        [48, 34, 19, '#43a047'], [48, 18, 18, '#4caf50'],
        [38, 22, 14, '#4caf50'], [58, 22, 14, '#4caf50'],
        [44, 12, 13, '#66bb6a'], [54, 14, 12, '#66bb6a']
      ]) +
      [[28, 38], [68, 40], [44, 42], [58, 32], [40, 30]].map(([fx, fy], i) =>
        `<circle cx="${fx}" cy="${fy}" r="4.5" fill="#8b1a1a"/><circle cx="${fx}" cy="${fy}" r="3.5" fill="${i % 2 ? '#ff5940' : '#ff7043'}"/>`
      ).join('');
    if (lv >= 4) {
      art += [[70, 26], [30, 22], [52, 18], [40, 14], [60, 24]].map(([fx, fy], i) =>
        `<circle cx="${fx}" cy="${fy}" r="3.6" fill="#7f0000"/><circle cx="${fx}" cy="${fy}" r="2.6" fill="#ff8a65"/>`
      ).join('');
    }
    art += `<circle cx="42" cy="12" r="5" fill="#a5d6a7" opacity="0.8"/>`;
    if (lv >= 5) {
      art += `<circle cx="48" cy="6" r="5" fill="#fff59d" opacity="0.9"/>`;
    }
    return art;
  },

  renderForest() {
    const wrap = document.getElementById('tree-plots');
    const trees = GameState.forest.trees || [];
    if (wrap) {
      let html = '';
      for (let i = 0; i < CONFIG.FOREST.PLOTS; i++) {
        const lv = Math.max(CONFIG.FOREST.INITIAL_LEVEL, Math.min(CONFIG.FOREST.STAGES, trees[i] || CONFIG.FOREST.INITIAL_LEVEL));
        const spark = lv >= CONFIG.FOREST.STAGES ? '<span class="sparkle">✨</span>' : '';
        html += `<div class="tree-plot lv${lv}" title="ต้นที่ ${i + 1} — ระยะ ${lv}/${CONFIG.FOREST.STAGES}">
          <span class="tree-emoji"><svg class="tree-svg" viewBox="0 0 96 96" aria-hidden="true">${this._treeSvg(lv)}</svg>${spark}</span>
          <span class="mound"></span>
        </div>`;
      }
      wrap.innerHTML = html;
    }
    const done = trees.filter(t => t >= CONFIG.FOREST.STAGES).length;
    const pct = Math.round(done / CONFIG.FOREST.PLOTS * 100);
    const pctEl = document.getElementById('forest-percent');
    const bar = document.getElementById('forest-bar-inner');
    const stripes = document.getElementById('forest-bar-stripes');
    const status = document.getElementById('forest-status');
    if (pctEl) pctEl.innerText = pct + '%';
    if (bar) {
      bar.style.width = pct + '%';
      bar.classList.remove('ok', 'warn', 'crit', 'out');
      bar.classList.add(pct >= 100 ? 'out' : 'ok');
    }
    if (stripes) {
      stripes.style.width = pct + '%';
      stripes.classList.remove('ok', 'warn', 'crit', 'out');
      stripes.classList.add(pct >= 100 ? 'out' : 'ok');
    }
    let text = '🌱 เริ่มเพาะต้นกล้า... เดินไปใกล้ต้นไม้แล้วกด SPACE ให้น้ำตาล';
    if (pct >= 100) text = '🌳 ป่าอุดมสมบูรณ์! ขอบคุณเจ้าหน้าที่กรมป่าไม้ 🌳';
    else if (pct >= 75) text = '🌲 ป่ากำลังกลับมาเขียวขจีเกือบเต็มพื้นที่!';
    else if (pct >= 50) text = '🌿 ต้นไม้โตขึ้นเรื่อยๆ ป่าค่อยๆ ฟื้นตัว';
    else if (pct >= 25) text = '🌱 ต้นกล้าเริ่มแตกใบ ป่าจะกลับมาแน่นอน';
    if (status) {
      status.classList.remove('ok', 'warn', 'crit', 'out');
      status.classList.add(pct >= 100 ? 'out' : 'ok');
      status.innerText = `${text} (${done}/${CONFIG.FOREST.PLOTS} ต้น)`;
    }
    this.renderMedal();
  },

  updateButtonsEnabled() {
    const auto = document.getElementById('auto-toggle-btn');
    if (auto) {
      const canAuto = (GameState.co2Loaded || 0) >= CONFIG.CO2_PER_CYCLE && (GameState.res.ATP || 0) >= 9 && (GameState.res.NADPH || 0) >= 6;
      auto.disabled = !canAuto && !GameState.autoCycle && !GameState.isCycleRunning;
    }
  }
};

const MachineAnim = (() => {
  let canvas = null, ctx = null;
  let W = 700, H = 300;
  let running = false, raf = 0, lastT = 0, elapsed = 0;
  let kind = 'fixation';
  let lightScene = false;
  let lightSys = null;
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

  function setupSugar() {
    plates = ['รอ G3P', 'รวมเป็นน้ำตาล', 'แพ็กส่งออก'];
    cap('เครื่องบรรจุ · ยังว่าง — รอรับ G3P จากเครื่องที่ 3', 0);
    after(400, () => {
      cap('STEP 1: รับ G3P ตัวที่ 1 (1/2) เข้าแท่นพัก', 0);
      const g1 = spawnM('g3p', lane.beltX0 - 90, lane.beltY, 1);
      sendOnBelt(g1, lane.stA, () => {
        after(700, () => {
          cap('STEP 2: มี G3P 1/2 แล้ว — รอโมเลกุลที่ 2 จากอีก 1 รอบคาลวิน', 0);
          after(900, () => {
            cap('STEP 3: รับ G3P ตัวที่ 2 (2/2) ผ่านสายพาน', 1);
            const g2 = spawnM('g3p', lane.beltX0 - 90, lane.beltY, 1);
            sendOnBelt(g2, lane.stA + 52, () => {
              after(600, () => {
                cap('STEP 4: ครบ 2 G3P (C₃+C₃) → เตรียมรวมพันธะ', 1);
                go(g1, lane.stB, lane.beltY, 120, null);
                go(g2, lane.stB, lane.beltY, 120, () => {
                  after(500, () => {
                    flash();
                    swap(g1, 'sugar', 1);
                    g2.alpha = 0; g2.hide = true;
                    cap('STEP 5: dehydration synthesis → น้ำตาล C₆ 🍬', 2);
                    after(1000, () => {
                      cap('STEP 6: แพ็กใส่กล่อง — ขึ้นแถบ "มีน้ำตาลรอเก็บ"', 3);
                      sendOnBelt(g1, lane.stC, () => {
                        after(500, () => {
                          cap('STEP 7 ✓: ส่งออก — กด SPACE ใกล้เครื่องเก็บน้ำตาล', 4);
                          sendOutOfBelt(g1);
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
    loopAt = 14000;
  }

  function setupLightReaction() {
    const caps = [
      '☀️ โฟตอนจากแสงฟาด PSII และ PSI — ปลุกอิเล็กตรอน e⁻ ขึ้นสู่ระดับพลังงานสูง',
      '💧 น้ำ H₂O จากกล่องไหลเข้าทางท่อ ไปยังด้านลูเมนของ Photosystem II',
      '💥 H₂O แตกตัว (photolysis): H₂O → ½O₂ + 2H⁺ + e⁻ — H⁺ เกรเดียนต์ในลูเมน',
      '⚡ H⁺ ไหลผ่าน ATP synthase → ปั่น ADP + Pi → ATP | e⁻ ถึง NADP⁺ Reductase',
      '✅ ATP + NADPH ส่งเข้าวัฏจักรคาลวิน ✓ | O₂ ระบายออกสู่บรรยากาศ'
    ];
    const key = Math.round(W) + 'x' + Math.round(H);
    if (!lightSys || lightSys.key !== key) {
      lightSys = newLightSys();
      lightSys.key = key;
    }
    cap(caps[0], 0);
    let ci = 1;
    const nextCap = () => {
      const idx = ci % caps.length;
      cap(caps[idx], idx);
      ci++;
      after(2800, nextCap);
    };
    after(2800, nextCap);
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

  function newLightSys() {
    return {
      key: Math.round(W) + 'x' + Math.round(H),
      L: null, t: 0,
      drops: [], elecs: [], hplus: [], hflow: [], o2s: [],
      photons: [], adps: [], atps: [], nadps: [], nadphs: [],
      bursts: [], ftexts: [], ambient: null, ambKey: '',
      eWater: 120, ePhoton: 150, eFlow: 250, eAdp: 600, eNadp: 800,
      synth: 0, psiiFlash: 0, psiFlash: 0, cytFlash: 0, nadpFlash: 0, splitFlash: 0,
      pendingNadph: 0
    };
  }

  function lightLayout() {
    const small = H < 200;
    const memTop = Math.round(H * 0.20);
    const outerBot = Math.round(H * 0.86);
    const structure = Math.max(60, outerBot - memTop);
    const mH = Math.max(22, Math.min(40, Math.round(structure * 0.17)));
    const memBot = memTop + mH;
    const bBot = outerBot;
    const bTop = bBot - mH;
    const ryOut = structure / 2;
    const rxOut = Math.max(mH + 16, Math.round(ryOut * 0.55));
    const tipX = Math.round(W * 0.865);
    const centerX = tipX - rxOut;
    const centerY = memTop + ryOut;
    const rxIn = Math.max(8, rxOut - mH);
    const ryIn = Math.max(10, ryOut - mH);
    const frac = small
      ? { psii: 0.14, pq: 0.24, cyt: 0.34, pc: 0.44, psi: 0.55 }
      : { psii: 0.155, pq: 0.255, cyt: 0.355, pc: 0.455, psi: 0.56 };
    const pw = W < 340
      ? { psii: 22, pq: 12, cyt: 22, pc: 12, psi: 22, fd: 8, nadp: 20 }
      : (small || W < 560)
        ? { psii: 26, pq: 14, cyt: 26, pc: 14, psi: 26, fd: 10, nadp: 24 }
        : { psii: 44, pq: 18, cyt: 36, pc: 18, psi: 44, fd: 17, nadp: 44 };
    const nadpHalf = pw.nadp / 2;
    const fdHalf = pw.fd / 2;
    const gap = W < 340 ? 4 : 6;
    const nadpX = Math.min(W * 0.745, centerX - (nadpHalf + 6));
    const fdX = Math.min(W * 0.66, nadpX - nadpHalf - fdHalf - gap);
    const psiX = Math.min(W * frac.psi, fdX - fdHalf - pw.psi / 2 - gap);
    const pcX = Math.min(W * frac.pc, psiX - pw.psi / 2 - pw.pc / 2 - gap);
    const cytX = Math.min(W * frac.cyt, pcX - pw.pc / 2 - pw.cyt / 2 - gap);
    const pqX = Math.min(W * frac.pq, cytX - pw.cyt / 2 - pw.pq / 2 - gap);
    const psiiX = Math.max(
      Math.min(W * frac.psii, pqX - pw.pq / 2 - pw.psii / 2 - gap),
      pw.psii / 2 + 16
    );
    const calvinSpace = W - tipX;
    const calvinR = Math.max(9, Math.min(small ? 13 : 20, (calvinSpace - 12) / 2));
    const calvinX = Math.max(
      Math.min(W - (small ? 26 : 34), W * 0.93),
      tipX + 6 + calvinR
    );
    return {
      small, W, H, pw,
      memTop, memH: mH, memBot, bTop, bH: mH, bBot, outerBot,
      structure, ryOut, rxOut, rxIn, ryIn, centerX, centerY, tipX,
      lumenTop: memBot, lumenBot: bTop,
      lumenMid: (memBot + bTop) / 2,
      psiiX, pqX, cytX, pcX, psiX, fdX, nadpX,
      synX: W * 0.50,
      sun0X: psiiX + (small ? 40 : 52), sun0Y: H * 0.07,
      sun1X: psiX + (small ? 34 : 46), sun1Y: H * 0.07,
      sunR: small ? 11 : 15,
      calvinX,
      calvinY: H - (small ? 16 : 26),
      calvinR
    };
  }

  function ensureAmbient(s, L) {
    const key = Math.round(L.W) + 'x' + Math.round(L.H);
    if (s.ambKey === key && s.ambient) return;
    s.ambKey = key;
    const lumen = [], n = L.small ? 6 : 10;
    const lx1 = Math.max(40, L.centerX - L.W * 0.04);
    for (let i = 0; i < n; i++) {
      lumen.push({
        x: L.W * 0.06 + Math.random() * Math.max(20, lx1 - L.W * 0.1),
        y: L.lumenTop + 10 + Math.random() * Math.max(10, L.lumenBot - L.lumenTop - 20),
        ph: Math.random() * 6.28, sp: 0.7 + Math.random() * 0.8
      });
    }
    const stroma = [], m = L.small ? 3 : 5;
    for (let i = 0; i < m; i++) {
      stroma.push({
        x: L.W * 0.08 + Math.random() * Math.max(20, L.W * 0.75),
        y: 6 + Math.random() * Math.max(6, L.memTop - 18),
        ph: Math.random() * 6.28, sp: 0.5 + Math.random() * 0.6
      });
    }
    s.ambient = { lumen, stroma };
  }

  function mvTo(p, tx, ty, sp, dt) {
    const dx = tx - p.x, dy = ty - p.y;
    const d = Math.hypot(dx, dy);
    const step = sp * dt / 1000;
    if (d <= step || d === 0) { p.x = tx; p.y = ty; return true; }
    p.x += dx / d * step;
    p.y += dy / d * step;
    return false;
  }

  function capsulePath(L, inner) {
    const rx = inner ? L.rxIn : L.rxOut;
    const ry = inner ? L.ryIn : L.ryOut;
    const top = inner ? L.lumenTop : L.memTop;
    const bot = inner ? L.lumenBot : L.outerBot;
    ctx.moveTo(0, top);
    ctx.lineTo(L.centerX, top);
    ctx.ellipse(L.centerX, L.centerY, rx, ry, 0, -Math.PI / 2, Math.PI / 2, false);
    ctx.lineTo(0, bot);
    ctx.closePath();
  }

  function roundRectFull(x, y, w, h, r) {
    const rr = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  function burst(s, x, y, color, max) {
    s.bursts.push({ x, y, color, max: max || 30, t: 420, life: 420 });
  }

  function ftext(s, x, y, txt, color, size) {
    s.ftexts.push({ x, y, txt, color, size: size || 10, t: 1500, life: 1500, vy: -18 });
  }

  function spawnWaterDrop(s, L) {
    const ly = L.lumenMid + (Math.random() - 0.5) * Math.min(20, (L.lumenBot - L.lumenTop) * 0.3);
    s.drops.push({
      r: 7 + Math.random() * 3,
      x: -16, y: ly, rot: 0, alpha: 0, pi: 0,
      sp: L.W * 0.28 + Math.random() * 40,
      path: [
        { x: Math.max(14, L.W * 0.03), y: ly },
        { x: L.psiiX * 0.5, y: L.lumenMid + (Math.random() - 0.5) * 12 },
        { x: L.psiiX - 20, y: L.lumenTop + 10 + Math.random() * 8 },
        { x: L.psiiX, y: L.lumenTop + 3 }
      ]
    });
  }

  function splitWater(s, L, x, y) {
    s.splitFlash = 340;
    burst(s, x, y, '#8fe3ff', 40);
    ftext(s, x + 6, y - 8, 'H₂O → ½O₂ + 2H⁺ + e⁻', '#0d4f86', L.small ? 8 : 11);
    s.o2s.push({
      x: x + 10, y: y - 8, r: L.small ? 6 : 8,
      life: 3800, wob: Math.random() * 6,
      vy: -16 - Math.random() * 8, vx: -5 - Math.random() * 8, label: '½ O₂'
    });
    for (let i = 0; i < 4; i++) {
      s.hplus.push({
        x: x + (Math.random() - 0.5) * 18,
        y: y + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 30,
        life: 3600, r: 5.5
      });
    }
    s.elecs.push(makeElec(L, x, y - 4));
  }

  function makeElec(L, x, y) {
    const mid = L.memTop + L.memH * 0.5;
    return {
      x, y, life: 7000, trail: [{ x, y }], pi: 0,
      sp: Math.max(130, L.W * 0.4),
      path: [
        { x: L.psiiX, y: L.memTop + 6 },
        { x: L.pqX, y: mid + 4 },
        { x: L.cytX, y: mid - 3 },
        { x: L.pcX, y: mid + 4 },
        { x: L.psiX, y: mid },
        { x: L.fdX, y: L.memTop - 6 },
        { x: L.nadpX, y: L.memTop - 12 }
      ]
    };
  }

  function onElecWay(e, i, s, L) {
    if (i === 0) s.psiiFlash = 420;
    else if (i === 1) spawnPumpH(s, L);
    else if (i === 2) { s.cytFlash = 380; spawnPumpH(s, L); spawnPumpH(s, L); }
    else if (i === 4) s.psiFlash = 420;
    else if (i === e.path.length - 1) {
      s.nadpFlash = 520;
      burst(s, L.nadpX, L.memTop - 14, '#b98aff', 34);
      ftext(s, L.nadpX, L.memTop - 22, 'e⁻ ถึง NADP⁺ reductase — รอแปลงเป็น NADPH', '#1f6b3a', L.small ? 8 : 10);
      s.pendingNadph++;
    }
  }

  function spawnPumpH(s, L) {
    const x0 = L.pqX + Math.random() * 14 - 4;
    const x1 = L.cytX + Math.random() * 8 - 4;
    s.hflow.push({
      x: x0, y: L.memTop - 14, pi: 0,
      sp: Math.max(95, L.W * 0.24), life: 3000, r: 5.5,
      path: [
        { x: x0, y: L.memTop - 14 },
        { x: x0 + 6, y: L.memTop + L.memH * 0.35 },
        { x: x1, y: L.memBot - 2 },
        { x: x1, y: L.lumenTop + 8 + Math.random() * 8 }
      ]
    });
  }

  function spawnSynH(s, L) {
    const off = (Math.random() - 0.5) * 10;
    const y0 = L.lumenMid + (Math.random() - 0.5) * 10;
    s.hflow.push({
      x: L.synX - 26 + off, y: y0, pi: 0,
      sp: Math.max(110, L.W * 0.3), life: 3000, r: 5.5,
      path: [
        { x: L.synX - 26 + off, y: y0 },
        { x: L.synX + off * 0.5, y: L.bTop - 4 },
        { x: L.synX + off * 0.5, y: L.bBot + 8 },
        { x: L.synX + off * 2.2, y: Math.min(L.H - 8, L.bBot + 20) }
      ]
    });
  }

  function spawnAdp(s, L) {
    s.adps.push({
      x: L.synX - (L.small ? 52 : 78),
      y: Math.min(L.H - 12, L.bBot + (L.small ? 11 : 15)),
      path: [{ x: L.synX - (L.small ? 9 : 13), y: Math.min(L.H - 14, L.bBot + (L.small ? 10 : 13)) }],
      pi: 0, sp: Math.max(70, L.W * 0.16), label: 'ADP + Pi', alpha: 1, flash: 0
    });
  }

  function spawnNadp(s, L) {
    s.nadps.push({
      x: L.W + 16, y: L.memTop - 16,
      path: [{ x: L.nadpX + 16, y: L.memTop - 14 }],
      pi: 0, sp: Math.max(90, L.W * 0.22), label: 'NADP⁺', alpha: 1, hold: 0, flash: 0
    });
  }

  function spawnNadph(s, L) {
    s.nadphs.push({
      x: L.nadpX, y: L.memTop - 14,
      path: [
        { x: L.nadpX + 26, y: L.memTop - 18 },
        { x: L.W - 14, y: Math.max(L.memBot + 10, L.H * 0.5) },
        { x: L.calvinX, y: L.calvinY }
      ],
      pi: 0, sp: Math.max(120, L.W * 0.32), label: 'NADPH', flash: 500, alpha: 1
    });
  }

  function moveProducts(arr, s, L, dt, color) {
    for (const a of arr) {
      const wp = a.path[a.pi];
      if (wp && mvTo(a, wp.x, wp.y, a.sp, dt)) {
        a.pi++;
        if (a.pi >= a.path.length) {
          a.done = true;
          burst(s, a.x, a.y, color, 26);
        }
      }
      if (a.flash > 0) a.flash -= dt;
    }
    return arr.filter(a => !a.done);
  }

  function updateLight(dt) {
    const s = lightSys;
    if (!s) return;
    const L = lightLayout();
    s.L = L;
    s.t += dt;
    ensureAmbient(s, L);

    s.eWater -= dt;
    if (s.eWater <= 0) { s.eWater = 470; spawnWaterDrop(s, L); }
    s.ePhoton -= dt;
    if (s.ePhoton <= 0) {
      s.ePhoton = 540;
      s.photons.push({ bi: 0, t: 0, dur: 720 });
      s.photons.push({ bi: 1, t: -180, dur: 720 });
    }
    s.eFlow -= dt;
    if (s.eFlow <= 0) { s.eFlow = 190; spawnSynH(s, L); }
    s.eAdp -= dt;
    if (s.eAdp <= 0) { s.eAdp = 2400; spawnAdp(s, L); }
    s.eNadp -= dt;
    if (s.eNadp <= 0) { s.eNadp = 2600; spawnNadp(s, L); }

    s.synth += dt;
    if (s.psiiFlash > 0) s.psiiFlash = Math.max(0, s.psiiFlash - dt);
    if (s.psiFlash > 0) s.psiFlash = Math.max(0, s.psiFlash - dt);
    if (s.cytFlash > 0) s.cytFlash = Math.max(0, s.cytFlash - dt);
    if (s.nadpFlash > 0) s.nadpFlash = Math.max(0, s.nadpFlash - dt);
    if (s.splitFlash > 0) s.splitFlash = Math.max(0, s.splitFlash - dt);

    for (const d of s.drops) {
      d.alpha = Math.min(1, d.alpha + dt / 260);
      const wp = d.path[d.pi];
      if (wp && mvTo(d, wp.x, wp.y, d.sp, dt)) {
        d.pi++;
        if (d.pi >= d.path.length) { d.done = true; splitWater(s, L, d.x, d.y); }
      }
      d.rot = Math.sin(s.t / 240 + d.r) * 0.3;
    }
    s.drops = s.drops.filter(d => !d.done);

    for (const e of s.elecs) {
      e.life -= dt;
      const wp = e.path[e.pi];
      if (wp && mvTo(e, wp.x, wp.y, e.sp, dt)) {
        onElecWay(e, e.pi, s, L);
        e.pi++;
        if (e.pi >= e.path.length) e.done = true;
      }
      const last = e.trail[e.trail.length - 1];
      if (!last || Math.abs(last.x - e.x) + Math.abs(last.y - e.y) > 2) e.trail.push({ x: e.x, y: e.y });
      if (e.trail.length > 18) e.trail.shift();
      if (e.life <= 0) e.done = true;
    }
    s.elecs = s.elecs.filter(e => !e.done);

    for (const p of s.hplus) {
      p.life -= dt;
      p.x += p.vx * dt / 1000;
      p.y += p.vy * dt / 1000;
      p.vx *= 0.985;
      p.vy = p.vy * 0.985 - 4 * dt / 1000;
      const dyr = (p.y - L.centerY) / L.ryIn;
      const half = Math.max(0, L.rxIn * Math.sqrt(Math.max(0, 1 - dyr * dyr)));
      p.x = Math.max(6, Math.min(L.centerX + half - 6, p.x));
      p.y = Math.max(L.lumenTop + 4, Math.min(L.lumenBot - 4, p.y));
    }
    s.hplus = s.hplus.filter(p => p.life > 0);

    for (const p of s.hflow) {
      p.life -= dt;
      const wp = p.path[p.pi];
      if (wp && mvTo(p, wp.x, wp.y, p.sp, dt)) {
        p.pi++;
        if (p.pi >= p.path.length) p.done = true;
      }
    }
    s.hflow = s.hflow.filter(p => !p.done && p.life > 0);

    for (const o of s.o2s) {
      o.life -= dt;
      o.wob += dt / 300;
      o.y += o.vy * dt / 1000;
      o.x += (o.vx + Math.sin(o.wob) * 9) * dt / 1000;
      if (o.y < -20) o.done = true;
    }
    s.o2s = s.o2s.filter(o => !o.done && o.life > 0);

    for (const ph of s.photons) ph.t += dt;
    s.photons = s.photons.filter(ph => ph.t < ph.dur);

    for (const a of s.adps) {
      const wp = a.path[a.pi];
      if (wp && mvTo(a, wp.x, wp.y, a.sp, dt)) {
        a.pi++;
        if (a.pi >= a.path.length) {
          a.done = true;
          burst(s, a.x, a.y, '#ffd75e', 30);
          s.atps.push({
            x: L.synX, y: Math.min(L.H - 12, L.bBot + 12),
            path: [
              { x: L.synX + 34, y: Math.min(L.H - 8, L.bBot + 20) },
              { x: L.calvinX - L.calvinR - 14, y: L.calvinY - 4 },
              { x: L.calvinX, y: L.calvinY }
            ],
            pi: 0, sp: Math.max(110, L.W * 0.3), label: 'ATP', flash: 500, alpha: 1
          });
          if (s.pendingNadph > 0) {
            s.pendingNadph--;
            spawnNadph(s, L);
          }
        }
      }
      if (a.flash > 0) a.flash -= dt;
    }
    s.adps = s.adps.filter(a => !a.done);

    s.atps = moveProducts(s.atps, s, L, dt, '#ffd75e');
    s.nadphs = moveProducts(s.nadphs, s, L, dt, '#5fff8f');

    for (const n of s.nadps) {
      const wp = n.path[n.pi];
      if (wp && !n.hold && mvTo(n, wp.x, wp.y, n.sp, dt)) {
        n.pi++;
        if (n.pi >= n.path.length) n.hold = 700;
      }
      if (n.hold > 0) {
        n.hold -= dt;
        n.alpha -= dt / 500;
        if (n.alpha <= 0) n.done = true;
      }
    }
    s.nadps = s.nadps.filter(n => !n.done);

    for (const b of s.bursts) b.t -= dt;
    s.bursts = s.bursts.filter(b => b.t > 0);
    for (const f of s.ftexts) {
      f.t -= dt;
      f.y += f.vy * dt / 1000;
    }
    s.ftexts = s.ftexts.filter(f => f.t > 0);
  }

  function drawHead(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#f4d480';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(130,90,25,0.8)';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - r * 0.28, y - r * 0.28, r * 0.34, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,244,200,0.85)';
    ctx.fill();
  }

  function bilayerHeadR(h) {
    return Math.max(3.2, Math.min(6, h * 0.17));
  }

  function bilayerTails(hx, hy, ix, iy, hr) {
    const mx = (hx + ix) / 2, my = (hy + iy) / 2;
    ctx.strokeStyle = 'rgba(150,105,30,0.9)';
    ctx.lineWidth = Math.max(1.2, hr * 0.34);
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(mx, my);
    ctx.moveTo(ix, iy);
    ctx.lineTo(mx, my);
    ctx.stroke();
  }

  function bilayerStraight(y, h, x1) {
    const hr = bilayerHeadR(h);
    const sp = hr * 2 + 3.4;
    const topY = y + hr + 1;
    const botY = y + h - hr - 1;
    const mid = y + h / 2;
    for (let x = hr + 4; x < x1 + sp * 0.25; x += sp) {
      bilayerTails(x - hr * 0.3, topY + hr * 0.7, x - hr * 0.4, mid - 1.5, hr);
      bilayerTails(x + hr * 0.3, topY + hr * 0.7, x + hr * 0.4, mid - 1.5, hr);
      bilayerTails(x - hr * 0.4, mid + 1.5, x - hr * 0.3, botY - hr * 0.7, hr);
      bilayerTails(x + hr * 0.4, mid + 1.5, x + hr * 0.3, botY - hr * 0.7, hr);
      drawHead(x, topY, hr);
      drawHead(x, botY, hr);
    }
  }

  function ellipseNorm(cx, cy, rx, ry) {
    let nx = cx / (rx * rx), ny = cy / (ry * ry);
    const len = Math.hypot(nx, ny) || 1;
    return { x: nx / len, y: ny / len };
  }

  function bilayerArc(L) {
    const hr = bilayerHeadR(L.memH);
    const rAvg = (L.rxOut + L.ryOut) / 2;
    const dTheta = (hr * 2 + 3.4) / Math.max(8, rAvg);
    for (let a = -Math.PI / 2 + dTheta * 0.6; a < Math.PI / 2; a += dTheta) {
      const cosA = Math.cos(a), sinA = Math.sin(a);
      const ox = L.centerX + L.rxOut * cosA, oy = L.centerY + L.ryOut * sinA;
      const ix = L.centerX + L.rxIn * cosA, iy = L.centerY + L.ryIn * sinA;
      const nO = ellipseNorm(L.rxOut * cosA, L.ryOut * sinA, L.rxOut, L.ryOut);
      const nI = ellipseNorm(L.rxIn * cosA, L.ryIn * sinA, L.rxIn, L.ryIn);
      const hx = ox - nO.x * hr, hy = oy - nO.y * hr;
      const tx = ix + nI.x * hr, ty = iy + nI.y * hr;
      bilayerTails(hx, hy, tx, ty, hr);
      drawHead(hx, hy, hr);
      drawHead(tx, ty, hr);
    }
  }

  function drawLightBg(L) {
    const sky = ctx.createLinearGradient(0, 0, 0, L.H);
    sky.addColorStop(0, '#d9f1fd');
    sky.addColorStop(0.5, '#b8e2f5');
    sky.addColorStop(1, '#cdeaf9');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, L.W, L.H);

    ctx.fillStyle = '#d9a945';
    ctx.beginPath();
    capsulePath(L, false);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,80,20,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const lum = ctx.createLinearGradient(0, L.lumenTop, 0, L.lumenBot);
    lum.addColorStop(0, '#f0e2c4');
    lum.addColorStop(0.55, '#e7d4ac');
    lum.addColorStop(1, '#dcc89a');
    ctx.fillStyle = lum;
    ctx.beginPath();
    capsulePath(L, true);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,80,20,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    bilayerStraight(L.memTop, L.memH, L.centerX);
    bilayerStraight(L.bTop, L.bH, L.centerX);
    bilayerArc(L);

    const py = L.lumenMid;
    ctx.fillStyle = '#2f6f9a';
    ctx.fillRect(0, py - 9, 16, 18);
    ctx.fillStyle = '#7fc0ef';
    ctx.fillRect(0, py - 6, 12, 12);
    ctx.strokeStyle = 'rgba(10,40,70,0.8)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0.5, py - 9, 15, 18);
  }

  function drawProteinBlob(x, w, yTop, yBot, fill, line) {
    const h = yBot - yTop;
    const r = Math.min(w / 2, h / 2);
    if (!(r > 0)) return;
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + r, yTop);
    ctx.arcTo(x - w / 2, yTop, x - w / 2, yTop + r, r);
    ctx.lineTo(x - w / 2, yBot - r);
    ctx.arcTo(x - w / 2, yBot, x - w / 2 + r, yBot, r);
    ctx.lineTo(x + w / 2 - r, yBot);
    ctx.arcTo(x + w / 2, yBot, x + w / 2, yBot - r, r);
    ctx.lineTo(x + w / 2, yTop + r);
    ctx.arcTo(x + w / 2, yTop, x + w / 2 - r, yTop, r);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = line;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, yTop + h * 0.2, w * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, yBot - h * 0.18, w * 0.36, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.stroke();
  }

  function drawComplex(x, w, yTop, yBot, flash, L) {
    drawProteinBlob(x, w, yTop, yBot, flash > 0 ? '#8ee89a' : '#5fb56c', '#2f6f42');
    const h = yBot - yTop;
    const dots = [[-0.22, 0.3], [0.2, 0.28], [-0.18, 0.62], [0.22, 0.6], [0.0, 0.45]];
    dots.forEach((d, i) => {
      ctx.beginPath();
      ctx.arc(x + d[0] * w, yTop + d[1] * h, Math.max(2.2, w * 0.1), 0, Math.PI * 2);
      ctx.fillStyle = i % 2 ? '#f07ab4' : '#c8f2b8';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(20,70,40,0.7)';
      ctx.stroke();
    });
    if (flash > 0) {
      const g = ctx.createRadialGradient(x, yTop + h * 0.4, 2, x, yTop + h * 0.4, w);
      g.addColorStop(0, 'rgba(255,255,220,' + (0.55 * flash / 420) + ')');
      g.addColorStop(1, 'rgba(255,255,220,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - w, yTop - 10, w * 2, h + 20);
    }
  }

  function drawSynthase(s, L) {
    const x = L.synX;
    const y0 = L.bTop - (L.small ? 6 : 10);
    const y1 = L.bBot;
    const w = L.small ? 12 : 16;
    ctx.beginPath();
    ctx.arc(x, L.bTop - (L.small ? 5 : 8), w * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#5aa8e0';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#2f6fa8';
    ctx.stroke();
    ctx.fillStyle = '#5aa8e0';
    ctx.fillRect(x - w / 2, y0, w, y1 - y0);
    ctx.strokeRect(x - w / 2, y0, w, y1 - y0);
    const hr = L.small ? 11 : 16;
    const hy = y1 + hr * 0.75;
    ctx.save();
    ctx.translate(x, hy);
    ctx.beginPath();
    ctx.arc(0, 0, hr, 0, Math.PI * 2);
    ctx.fillStyle = '#69b6ec';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#2f6fa8';
    ctx.stroke();
    ctx.rotate((s.synth / 1000) * 3.6);
    ctx.fillStyle = '#2f6fa8';
    for (let b = 0; b < 5; b++) {
      ctx.save();
      ctx.rotate(b * Math.PI * 2 / 5);
      ctx.beginPath();
      ctx.ellipse(hr * 0.55, 0, hr * 0.42, hr * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, hr * 0.24, 0, Math.PI * 2);
    ctx.fillStyle = '#dff2ff';
    ctx.fill();
    ctx.restore();
  }

  function drawLightProteins(s, L) {
    const mTop = L.memTop, mBot = L.memBot, mH = L.memH;
    const pw = L.pw;
    drawProteinBlob(L.pqX, pw.pq, mTop + 3, mTop + mH * 0.62, '#a478e0', '#5f3fa0');
    drawProteinBlob(L.pcX, pw.pc, mTop + 3, mTop + mH * 0.62, '#a478e0', '#5f3fa0');
    drawProteinBlob(L.fdX, pw.fd, mTop - (L.small ? 7 : 12), mTop + mH * 0.4, '#a478e0', '#5f3fa0');
    drawProteinBlob(L.cytX, pw.cyt, mTop - (L.small ? 4 : 7), mBot - 2, s.cytFlash > 0 ? '#b48cff' : '#8a5fd0', '#4f2f9a');
    drawProteinBlob(L.nadpX, pw.nadp, mTop - (L.small ? 14 : 24), mBot - 4, s.nadpFlash > 0 ? '#c9a2ff' : '#7d52cc', '#4a2a96');
    drawComplex(L.psiiX, pw.psii, mTop + 2, mBot + 3, s.psiiFlash, L);
    drawComplex(L.psiX, pw.psi, mTop + 2, mBot + 3, s.psiFlash, L);
    drawSynthase(s, L);
  }

  function arrowHead(x1, y1, x2, y2, size, color) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.save();
    ctx.translate(x2, y2);
    ctx.rotate(a);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size * 0.55);
    ctx.lineTo(-size, size * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function dashRoute(pts, color, width, t, speed) {
    ctx.save();
    ctx.setLineDash([7, 7]);
    ctx.lineDashOffset = -((t * speed) % 14);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    ctx.setLineDash([]);
    const a = pts[pts.length - 2], b = pts[pts.length - 1];
    arrowHead(a.x, a.y, b.x, b.y, width * 3, color);
    ctx.restore();
  }

  function drawLightRoutes(s, L) {
    const t = s.t;
    dashRoute([
      { x: L.pqX + 6, y: L.memTop - 18 },
      { x: L.pqX + 12, y: L.memTop + L.memH * 0.3 },
      { x: L.cytX + 4, y: L.memBot - 4 },
      { x: L.cytX + 4, y: L.lumenTop + 12 }
    ], 'rgba(226,70,40,0.9)', 3, t, 0.045);
    dashRoute([
      { x: L.psiiX + 12, y: L.lumenMid - 2 },
      { x: L.synX - 34, y: L.lumenMid + 8 },
      { x: L.synX, y: L.bTop - 8 },
      { x: L.synX, y: Math.min(L.H - 6, L.bBot + 26) }
    ], 'rgba(226,70,40,0.95)', 3.4, t, 0.05);
    ctx.font = '700 ' + (L.small ? 8 : 10) + "px 'Sarabun', sans-serif";
    ctx.fillStyle = '#c2411e';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('4H⁺', L.pqX + 12, L.memTop - 24);
    ctx.fillText('H⁺', L.synX + 9, Math.min(L.H - 14, L.bBot + 16));
    ctx.fillText('H⁺ ในลูเมน', L.synX - 62, L.lumenMid + 20);
  }

  function drawGuideArrows(L) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const ends = [];
    ctx.strokeStyle = 'rgba(30,80,130,0.28)';
    ctx.lineWidth = L.small ? 6 : 8;
    ctx.beginPath();
    ctx.moveTo(L.nadpX + 22, L.memTop - 6);
    const c1x = L.W - 10, c1y = L.H * 0.45;
    const e1x = L.calvinX - L.calvinR - 8, e1y = L.calvinY - L.calvinR * 0.4;
    ctx.quadraticCurveTo(c1x, c1y, e1x, e1y);
    ends.push([c1x, c1y, e1x, e1y]);
    const s0x = L.synX + 30, s0y = Math.min(L.H - 6, L.bBot + 22);
    const c2x = (L.synX + L.calvinX) / 2, c2y = L.H - 8;
    const e2x = L.calvinX - L.calvinR - 10, e2y = L.calvinY + 4;
    ctx.moveTo(s0x, s0y);
    ctx.quadraticCurveTo(c2x, c2y, e2x, e2y);
    ends.push([c2x, c2y, e2x, e2y]);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = L.small ? 3.5 : 5.5;
    ctx.beginPath();
    ctx.moveTo(L.nadpX + 22, L.memTop - 6);
    ctx.quadraticCurveTo(c1x, c1y, e1x, e1y);
    ctx.moveTo(s0x, s0y);
    ctx.quadraticCurveTo(c2x, c2y, e2x, e2y);
    ctx.stroke();
    ends.forEach(e2 => arrowHead(e2[0], e2[1], e2[2], e2[3], L.small ? 9 : 13, 'rgba(255,255,255,0.9)'));
    ctx.restore();
  }

  function drawSun(x, y, r, t) {
    const pulse = 1 + Math.sin(t / 320) * 0.06;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = 'rgba(255,214,40,0.85)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + t / 1400;
      const rr = r + 3;
      const re = r + 7 + Math.sin(t / 200 + i) * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      ctx.lineTo(Math.cos(a) * re, Math.sin(a) * re);
      ctx.stroke();
    }
    const g = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * pulse);
    g.addColorStop(0, '#fff8c8');
    g.addColorStop(0.7, '#ffe14a');
    g.addColorStop(1, '#ffb824');
    ctx.beginPath();
    ctx.arc(0, 0, r * pulse, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#e09a00';
    ctx.stroke();
    ctx.fillStyle = '#6b4a00';
    ctx.font = '700 ' + Math.max(8, Math.round(r * 0.62)) + "px 'Sarabun', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Light', 0, 0.5);
    ctx.restore();
  }

  function drawWaveBeam(x0, y0, x1, y1, t) {
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const trace = (amp, width, alpha) => {
      ctx.beginPath();
      for (let i = 0; i <= 26; i++) {
        const k = i / 26;
        const w = Math.sin(k * Math.PI) * amp * Math.sin(k * 9 - t / 110);
        const px = x0 + dx * k + nx * w;
        const py = y0 + dy * k + ny * w;
        if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.lineWidth = width;
      ctx.strokeStyle = 'rgba(255,222,70,' + alpha + ')';
      ctx.lineCap = 'round';
      ctx.stroke();
    };
    trace(7, 9, 0.2);
    trace(7, 3, 0.85);
    trace(7, 1.2, 0.7);
  }

  function drawLightBeams(s, L) {
    const t = s.t;
    drawSun(L.sun0X, L.sun0Y, L.sunR, t);
    drawSun(L.sun1X, L.sun1Y, L.sunR, t + 500);
    const from0 = { x: L.sun0X, y: L.sun0Y + L.sunR };
    const to0 = { x: L.psiiX + 10, y: L.memTop - 2 };
    const from1 = { x: L.sun1X, y: L.sun1Y + L.sunR };
    const to1 = { x: L.psiX + 6, y: L.memTop - 2 };
    drawWaveBeam(from0.x, from0.y, to0.x, to0.y, t);
    drawWaveBeam(from1.x, from1.y, to1.x, to1.y, t + 300);
    for (const ph of s.photons) {
      const from = ph.bi === 0 ? from0 : from1;
      const to = ph.bi === 0 ? to0 : to1;
      const k = Math.max(0, Math.min(1, ph.t / ph.dur));
      const px = from.x + (to.x - from.x) * k;
      const py = from.y + (to.y - from.y) * k;
      ctx.save();
      ctx.shadowColor = '#ffef9a';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(px, py, L.small ? 3 : 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff6b0';
      ctx.fill();
      ctx.restore();
    }
  }

  function drawLightLabels(s, L) {
    ctx.textBaseline = 'alphabetic';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.88)';
    const fs = L.small ? 8 : 10;
    ctx.font = '600 ' + fs + "px 'Sarabun', sans-serif";
    const put = (txt, x, y, align) => {
      ctx.textAlign = align || 'center';
      ctx.strokeText(txt, x, y);
      ctx.fillStyle = '#173f63';
      ctx.fillText(txt, x, y);
    };
    const above = L.memTop - (L.small ? 7 : 10);
    put(L.small ? 'PSII' : 'Photosystem II', L.psiiX - (L.small ? 15 : 22), above, 'right');
    put(L.small ? 'PSI' : 'Photosystem I', L.psiX - (L.small ? 15 : 22), above, 'right');
    put('Pq', L.pqX, above);
    put(L.small ? 'Cyt' : 'Cyt b₆f', L.cytX, above);
    put('Pc', L.pcX, above);
    put('Fd', L.fdX - L.pw.fd / 2 - 3,
      Math.max(L.memTop - 3, L.sun1Y + L.sunR + 10), 'right');
    if (L.small || L.W < 400) {
      const bx0 = L.tipX - 40, bx1 = L.tipX - 4;
      const by0 = L.memTop - 15, by1 = L.memTop - 6;
      const sx0 = L.sun1X - L.sunR, sx1 = L.sun1X + L.sunR;
      const sy0 = L.sun1Y - L.sunR, sy1 = L.sun1Y + L.sunR;
      if (bx0 < sx1 && bx1 > sx0 && by0 < sy1 && by1 > sy0)
        put('NADPᴿ', L.nadpX, L.lumenTop + 12);
      else put('NADPᴿ', L.tipX - 4, L.memTop - 6, 'right');
    } else if (L.nadpX - 46 < L.sun1X + L.sunR + 6)
      put('NADP⁺ Reductase', L.nadpX + L.pw.nadp / 2 + 6, L.memTop - 28, 'left');
    else put('NADP⁺ Reductase', L.nadpX, L.memTop - 28);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(90,50,10,0.72)';
    ctx.font = '600 ' + (L.small ? 8 : 11) + "px 'Sarabun', sans-serif";
    ctx.fillText('Thylakoid Space · H⁺ สูง', Math.min(L.synX - 70, L.W * 0.33), L.lumenMid + 4);
    ctx.fillStyle = 'rgba(90,50,10,0.9)';
    ctx.font = '600 ' + (L.small ? 8 : 10) + "px 'Sarabun', sans-serif";
    ctx.fillText('ATP synthase', L.synX, L.bTop - 10);

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(107,68,16,0.9)';
    ctx.font = '600 ' + (L.small ? 7 : 9) + "px 'Sarabun', sans-serif";
    ctx.fillText('Thylakoid Membrane', 8, L.bTop + L.bH / 2 + 3);
    ctx.fillStyle = 'rgba(20,80,126,0.95)';
    ctx.font = '600 ' + (L.small ? 8 : 10) + "px 'Sarabun', sans-serif";
    ctx.fillText('STROMA · H⁺ ต่ำ', 8, L.H - 7);
    ctx.fillStyle = 'rgba(13,79,134,0.9)';
    ctx.font = '600 ' + (L.small ? 7 : 9) + "px 'Sarabun', sans-serif";
    ctx.fillText('💧 จากกล่องน้ำ', 4, L.lumenMid + (L.small ? 17 : 21));
  }

  function drawCalvinMini(s, L) {
    const x = L.calvinX, y = L.calvinY, r = L.calvinR;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((s.t / 1000) * 0.9);
    ctx.setLineDash([7, 5]);
    ctx.lineWidth = L.small ? 2.5 : 3.4;
    ctx.strokeStyle = '#2f7fd0';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.save();
    ctx.rotate(Math.PI * 0.42);
    ctx.translate(r, 0);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = '#2f7fd0';
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(9, 0);
    ctx.lineTo(0, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '700 ' + (L.small ? 8 : 10) + "px 'Sarabun', sans-serif";
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.strokeText('Calvin Cycle', x, y - r - 6);
    ctx.fillStyle = '#14497a';
    ctx.fillText('Calvin Cycle', x, y - r - 6);
    ctx.font = '700 ' + (L.small ? 7 : 9) + "px 'Sarabun', sans-serif";
    ctx.fillStyle = '#1d5fa0';
    ctx.fillText('คาลวิน', x, y + 3);
  }

  function drawDrop(d) {
    const r = d.r;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, d.alpha));
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rot);
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.55);
    ctx.bezierCurveTo(r * 1.05, -r * 0.35, r * 0.95, r * 0.95, 0, r * 0.95);
    ctx.bezierCurveTo(-r * 0.95, r * 0.95, -r * 1.05, -r * 0.35, 0, -r * 1.55);
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.2, r * 0.15, 0, 0, r * 1.4);
    g.addColorStop(0, '#c8f0ff');
    g.addColorStop(0.5, '#5ec8f5');
    g.addColorStop(1, '#1f8fd0');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = 'rgba(15,80,140,0.85)';
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-r * 0.3, r * 0.1, r * 0.26, r * 0.36, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fill();
    ctx.restore();
  }

  function drawElec(e, L) {
    if (e.trail.length > 1) {
      ctx.save();
      ctx.lineCap = 'round';
      for (let i = 1; i < e.trail.length; i++) {
        const k = i / e.trail.length;
        ctx.beginPath();
        ctx.moveTo(e.trail[i - 1].x, e.trail[i - 1].y);
        ctx.lineTo(e.trail[i].x, e.trail[i].y);
        ctx.strokeStyle = 'rgba(90,211,255,' + (k * 0.55) + ')';
        ctx.lineWidth = 1 + k * 3;
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.save();
    ctx.shadowColor = '#5ad3ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(e.x, e.y, L.small ? 3.6 : 4.6, 0, Math.PI * 2);
    ctx.fillStyle = '#d8f6ff';
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = '#1f8fd0';
    ctx.stroke();
    ctx.restore();
    ctx.font = '700 ' + (L.small ? 7 : 8) + "px 'Sarabun', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#0d5f8a';
    ctx.fillText('e⁻', e.x + 6, e.y - 4);
  }

  function drawO2(o, L) {
    const al = Math.max(0, Math.min(1, o.life / 900)) * (o.y < L.memTop ? 0.85 : 1);
    ctx.save();
    ctx.globalAlpha = al;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(o.x - o.r * 0.3, o.y - o.r * 0.35, o.r * 0.15, o.x, o.y, o.r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.4, '#cfe9ff');
    g.addColorStop(1, '#7fc0ef');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(40,110,170,0.8)';
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(o.x - o.r * 0.32, o.y - o.r * 0.3, o.r * 0.24, o.r * 0.3, -0.6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();
    ctx.font = '700 ' + (L.small ? 7 : 9) + "px 'Sarabun', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.88)';
    ctx.strokeText(o.label, o.x, o.y - o.r - 6);
    ctx.fillStyle = '#14507e';
    ctx.fillText(o.label, o.x, o.y - o.r - 6);
    ctx.restore();
  }

  function drawProtDot(x, y, r, alpha, withLabel) {
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ff9066';
    ctx.fill();
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = '#c2411e';
    ctx.stroke();
    if (withLabel) {
      ctx.fillStyle = '#6b1f08';
      ctx.font = '700 7px \'Sarabun\', sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('H⁺', x, y + 0.5);
    }
    ctx.globalAlpha = 1;
  }

  function drawOrbList(arr, color) {
    for (const a of arr) {
      ctx.globalAlpha = typeof a.alpha === 'number' ? Math.max(0, Math.min(1, a.alpha)) : 1;
      ctx.save();
      if (a.flash > 0) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 14;
      }
      ctx.beginPath();
      ctx.arc(a.x, a.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = 'rgba(60,40,0,0.75)';
      ctx.stroke();
      ctx.restore();
      ctx.font = '700 9px \'Sarabun\', sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.strokeText(a.label, a.x, a.y + 9);
      ctx.fillStyle = '#243208';
      ctx.fillText(a.label, a.x, a.y + 9);
      ctx.globalAlpha = 1;
    }
  }

  function drawLightParticles(s, L) {
    if (s.ambient) {
      ctx.font = '700 ' + (L.small ? 8 : 10) + "px 'Sarabun', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(196,64,26,0.85)';
      for (const a of s.ambient.lumen) {
        const yy = a.y + Math.sin(s.t / 600 * a.sp + a.ph) * 3;
        const xx = a.x + Math.cos(s.t / 800 * a.sp + a.ph) * 3;
        ctx.globalAlpha = 0.5 + 0.35 * Math.sin(s.t / 500 + a.ph);
        ctx.fillText('H⁺', xx, yy);
      }
      ctx.fillStyle = 'rgba(30,90,150,0.7)';
      for (const a of s.ambient.stroma) {
        const yy = a.y + Math.sin(s.t / 700 * a.sp + a.ph) * 2.5;
        ctx.globalAlpha = 0.45 + 0.3 * Math.sin(s.t / 600 + a.ph);
        ctx.fillText('H⁺', a.x, yy);
      }
      ctx.globalAlpha = 1;
    }

    for (const p of s.hplus) drawProtDot(p.x, p.y, p.r, Math.min(1, p.life / 700), !L.small);
    for (const p of s.hflow) drawProtDot(p.x, p.y, p.r, Math.min(1, p.life / 600), !L.small);
    for (const d of s.drops) drawDrop(d);
    for (const o of s.o2s) drawO2(o, L);
    for (const e of s.elecs) drawElec(e, L);
    drawOrbList(s.adps, '#ffb84a');
    drawOrbList(s.atps, '#ffd75e');
    drawOrbList(s.nadps, '#9adf7a');
    drawOrbList(s.nadphs, '#5fff8f');

    for (const b of s.bursts) {
      const k = 1 - b.t / b.life;
      ctx.globalAlpha = (1 - k) * 0.9;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4 + k * b.max, 0, Math.PI * 2);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 3 * (1 - k) + 1;
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2 + 0.4;
        const r0 = 4 + k * b.max * 0.7;
        const r1 = r0 + 5 * (1 - k);
        ctx.beginPath();
        ctx.moveTo(b.x + Math.cos(a) * r0, b.y + Math.sin(a) * r0);
        ctx.lineTo(b.x + Math.cos(a) * r1, b.y + Math.sin(a) * r1);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    for (const f of s.ftexts) {
      ctx.globalAlpha = Math.min(1, f.t / 500);
      ctx.font = '700 ' + f.size + "px 'Sarabun', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.strokeText(f.txt, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.txt, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawLightHud(s, L) {
    let txt = '⚙ —';
    const lr = (typeof LightReaction !== 'undefined' && LightReaction) ? LightReaction : null;
    if (lr && typeof lr._waterTank === 'number') {
      txt = '💧 ' + lr._waterTank + '/' + lr.WATER_TANK_CAPACITY + ' ' + (lr.isRunning ? '⚙' : '⏸');
    }
    const fs = L.small ? 9 : 11;
    ctx.font = '700 ' + fs + "px 'Sarabun', sans-serif";
    const w = ctx.measureText(txt).width + 14;
    const h = fs + 9;
    const x = 6, y = 5;
    ctx.fillStyle = 'rgba(8,30,55,0.72)';
    roundRectFull(x, y, w, h, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,200,255,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#cdefff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(txt, x + 7, y + h / 2 + 0.5);
  }

  function drawLightScene() {
    const s = lightSys;
    if (!s) return;
    const L = lightLayout();
    s.L = L;
    ensureAmbient(s, L);
    drawLightBg(L);
    drawLightProteins(s, L);
    drawLightRoutes(s, L);
    drawGuideArrows(L);
    drawLightBeams(s, L);
    drawLightLabels(s, L);
    drawCalvinMini(s, L);
    drawLightParticles(s, L);
    drawLightHud(s, L);
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
    if (lightScene) {
      drawLightScene();
      return;
    }
    ctx.fillStyle = '#0b170b';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (let gy = 0; gy < H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

    drawBelt(0.05, 0.96, lane.beltY, 24, '#2a4a2a', 1);
    drawStations();

    const list = entities.slice().sort((a, b) => a.y - b.y);
    for (const m of list) drawMol(m);
  }

  /* ---------------- loop ---------------- */

  function update(dt) {
    elapsed += dt;
    for (const t of timers) {
      if (!t.fired && elapsed >= t.at) { t.fired = true; t.fn(); }
    }
    timers = timers.filter(t => !t.fired);
    if (reactor.active > 0) reactor.active = Math.max(0, reactor.active - dt);
    if (lightScene) {
      updateLight(dt);
      return;
    }

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
    else if (kind === 'sugar') setupSugar();
    else setupRegeneration();
    lightScene = kind === 'light';
    if (!lightScene) lightSys = null;
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
    if (kind === 'light') lightSys = null;
    if (kind === 'fixation') setupFixation();
    else if (kind === 'reduction') setupReduction();
    else if (kind === 'light') setupLightReaction();
    else if (kind === 'sugar') setupSugar();
    else setupRegeneration();
    lightScene = kind === 'light';
    if (!lightScene) lightSys = null;
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
