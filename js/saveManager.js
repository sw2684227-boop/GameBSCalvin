/* ระบบเซฟหลายช่อง (Save Slots)
   - ข้อมูลเซฟ: calvin_slot_0..2
   - เมต้า (ช่องล่าสุด, เวลา): calvin_meta
   - ทำข้ามจาก legacy 'calvin_save' ช่องแรกเต็มือ
   - UI: #save-menu-overlay + #save-slot-list (สร้างใน index.html)
*/

const SaveManager = {
  SLOTS: 3,
  KEY_META: 'calvin_meta',
  KEY_PREFIX: 'calvin_slot_',

  _meta() {
    try { return JSON.parse(localStorage.getItem(this.KEY_META) || '{}') || {}; } catch (e) { return {}; }
  },
  _setMeta(m) {
    try { localStorage.setItem(this.KEY_META, JSON.stringify(m)); } catch (e) {}
  },

  currentSlot() {
    const m = this._meta();
    return Number.isInteger(m.current) && m.current >= 0 && m.current < this.SLOTS ? m.current : 0;
  },

  setCurrentSlot(n) {
    GameState.currentSlot = n;
    const m = this._meta();
    m.current = n;
    this._setMeta(m);
  },

  key(n) { return this.KEY_PREFIX + n; },

  read(n) {
    try { return JSON.parse(localStorage.getItem(this.key(n)) || 'null'); } catch (e) { return null; }
  },

  write(n, obj) {
    try {
      const m = this._meta();
      const d = m.dates || {};
      const now = Date.now();
      const old = this.read(n) || {};
      const data = Object.assign({}, obj, { savedAt: now, createdAt: old.createdAt || now });
      localStorage.setItem(this.key(n), JSON.stringify(data));
      d[n] = now;
      m.dates = d;
      this._setMeta(m);
    } catch (e) {}
  },

  deleteSlot(n) {
    try { localStorage.removeItem(this.key(n)); } catch (e) {}
    const m = this._meta();
    const d = m.dates || {};
    delete d[n];
    m.dates = d;
    this._setMeta(m);
  },

  slotDates() {
    const m = this._meta();
    return m.dates || {};
  },

  list() {
    const dates = this.slotDates();
    const now = Date.now();
    const arr = [];
    for (let i = 0; i < this.SLOTS; i++) {
      const s = this.read(i);
      arr.push({
        idx: i,
        exists: !!s,
        savedAt: dates[i] || null,
        ago: s ? this._ago(dates[i], now) : '',
        t: s ? (s.forest && s.forest.trees || []) : [],
        summary: s ? {
          cycles: s.totalCycles || 0,
          sugars: s.totalGlucose || 0,
          fed: (s.forest && s.forest.fed) || 0,
          medals: (s.forest && s.forest.medals) || 0,
          complete: ((s.forest && s.forest.trees) || []).filter(v => v >= CONFIG.FOREST.STAGES).length
        } : null
      });
    }
    return arr;
  },

  _ago(ts, now) {
    if (!ts) return '';
    const sec = Math.max(0, Math.floor((now - (ts | 0)) / 1000));
    if (sec < 60) return sec + ' วิที่แล้ว';
    const min = Math.floor(sec / 60);
    if (min < 60) return min + ' นาทีที่แล้ว';
    const h = Math.floor(min / 60);
    if (h < 24) return h + ' ชม.ที่แล้ว';
    return Math.floor(h / 24) + ' วันที่แล้ว';
  },

  init() {
    try {
      const legacy = JSON.parse(localStorage.getItem('calvin_save') || 'null');
      if (legacy && !this.read(0)) this.write(0, legacy);
    } catch (e) {}
    GameState.currentSlot = this.currentSlot();
  },

  /* โยนสถานะที่โหลดแล้วลงสู่เกมที่กำลังรันอยู่ */
  applyToScene() {
    const sc = GameState.phaserScene;
    if (sc && typeof sc.updateFieldForest === 'function') sc.updateFieldForest();
    if (typeof CalvinCycle !== 'undefined' && CalvinCycle && typeof CalvinCycle.resetForLoad === 'function') CalvinCycle.resetForLoad();
    if (typeof UI !== 'undefined' && UI) {
      UI.updateInventory();
      UI.renderForest();
      UI.updateCycleStats();
    }
    if (typeof Achievements !== 'undefined' && Achievements && typeof Achievements.render === 'function') Achievements.render();
  },

  /* โหลดช่อง (หรือสร้างใหม่ถ้าโล่ง) */
  selectSlot(n) {
    const s = this.read(n);
    this.setCurrentSlot(n);
    GameState.resetAll();
    if (s) {
      GameState.applyJSON(s);
      GameState.currentLocation = 'factory';
      GameState.isCycleRunning = false;
      GameState.cycleStage = -1;
      GameState.pendingAction = null;
      GameState.tutorialActive = false;
      GameState.cutsceneActive = false;
      if (typeof CalvinCycle !== 'undefined' && CalvinCycle) CalvinCycle._pendingAutoRestart = false;
    }
    this.applyToScene();
    if (typeof UI !== 'undefined' && UI && typeof UI.hideStartScreen === 'function') UI.hideStartScreen();
    if (typeof UI !== 'undefined' && UI && typeof UI.hideSaveMenu === 'function') UI.hideSaveMenu();
    GameState.save();

    if (typeof Achievements !== 'undefined' && Achievements && typeof Achievements.unlock === 'function') {
      Achievements.unlock('opening');
    }
    if (!s) {
      try { localStorage.removeItem('calvin_tutorial_done'); } catch (e) {}
      GameState.tutorialDone = false;
      if (typeof Tutorial !== 'undefined' && Tutorial && typeof Tutorial.start === 'function') {
        setTimeout(function () { Tutorial.start(); }, 400);
      }
    } else if (typeof UI !== 'undefined' && UI && typeof UI.showToast === 'function') {
      UI.showToast('📂 โหลดช่อง ' + (n + 1) + ' แล้ว', 1600);
    }
  },

  saveSlot(n) {
    this.setCurrentSlot(n);
    GameState.save();
    if (typeof UI !== 'undefined' && UI && typeof UI.renderSaveMenu === 'function') UI.renderSaveMenu();
    if (typeof UI !== 'undefined' && UI && typeof UI.showToast === 'function') UI.showToast('💾 บันทึกลงช่อง ' + (n + 1) + ' แล้ว', 1600);
  },

  deleteSlotUI(n) {
    if (typeof confirm !== 'function' || !confirm('🗑 ลบข้อมูลช่อง ' + (n + 1) + ' ทิ้งแน่นอน?\n(เริ่มเกมใหม่ในช่องนี้ได้เสมอ)')) return;
    this.deleteSlot(n);
    if (typeof UI !== 'undefined' && UI && typeof UI.renderSaveMenu === 'function') UI.renderSaveMenu();
    if (typeof UI !== 'undefined' && UI && typeof UI.showToast === 'function') UI.showToast('🗑 ลบช่อง ' + (n + 1) + ' แล้ว', 1500);
  }
};

SaveManager.init();