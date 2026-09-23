/* ระบบความสำเร็จ (Achievements)
   ถูกโหลดหลัง config.js — ใช้ GameState, CONFIG, UI, SFX
   check: ฟังก์ชันตรวจเงื่อนไข รับ GameState กลับ true เมื่อสำเร็จ
*/

const Achievements = {
  list: [
    { id: 'opening', icon: '🎬', name: 'เริ่มภารกิจ', desc: 'เริ่มเล่นเกมครั้งแรก', check: () => false },
    { id: 'water_1', icon: '💧', name: 'นักตักน้ำใหม่', desc: 'ตักน้ำจากหนองได้ครั้งแรก', check: s => (s.waterGathers || 0) >= 1 },
    { id: 'water_50', icon: '🚰', name: 'คูน้ำกว้างใหญ่', desc: 'ตักน้ำครบ 50 ครั้ง', check: s => (s.waterGathers || 0) >= 50 },
    { id: 'co2_1', icon: '☁️', name: 'หายใจเข้าวันแรก', desc: 'เก็บ CO₂ ได้ครั้งแรก', check: s => (s.co2Collects || 0) >= 1 },
    { id: 'co2_50', icon: '🌫️', name: 'นักเสาะคาร์บอน', desc: 'เก็บ CO₂ ครบ 50 ครั้ง', check: s => (s.co2Collects || 0) >= 50 },
    { id: 'insert_1', icon: '🧫', name: 'เข้าเครื่องแล้ว', desc: 'ใส่ CO₂ เข้าเครื่องคาลวินครั้งแรก', check: s => (s.co2Inserts || 0) >= 1 },
    { id: 'rn_1', icon: '🌀', name: 'ครบวงจรแรก', desc: 'เริ่มวัฏจักรคาลวินครั้งแรก', check: s => (s.totalCycles || 0) >= 1 },
    { id: 'rn_10', icon: '🔄', name: 'คุ้นเคยกับวงจร', desc: 'หมุนคาลวินครบ 10 รอบ', check: s => (s.totalCycles || 0) >= 10 },
    { id: 'rn_50', icon: '♻️', name: 'เครื่องจักรสังเคราะห์แสง', desc: 'หมุนคาลวินครบ 50 รอบ', check: s => (s.totalCycles || 0) >= 50 },
    { id: 'sugar_1', icon: '🍬', name: 'น้ำตาลก้อนแรก', desc: 'ผลิตน้ำตาลสำเร็จ 1 ชิ้น', check: s => (s.totalGlucose || 0) >= 1 },
    { id: 'sugar_20', icon: '🍭', name: 'โรงงานน้ำตาล', desc: 'ผลิตน้ำตาลครบ 20 ชิ้น', check: s => (s.totalGlucose || 0) >= 20 },
    { id: 'atp_100', icon: '🔋', name: 'สะสมพลังงาน', desc: 'ปั่น ATP ครบ 100 หน่วย', check: s => (s.atpMade || 0) >= 100 },
    { id: 'auto_1', icon: '🤖', name: 'กดแล้วลุยเลย', desc: 'เปิดคาลวิน AUTO', check: s => s.autoCycle === true },
    { id: 'tree_1', icon: '🌱', name: 'ป้อนต้นกล้า', desc: 'ให้น้ำตาลต้นแรกต้นกระทั่ง', check: s => ((s.forest && s.forest.fed) || 0) >= 1 },
    { id: 'tree_full_1', icon: '🌳', name: 'ต้นไม้สมบูรณ์ต้นแรก', desc: 'มีต้นแรกที่โตเต็ม 5 ระดับ', check: s => !!((s.forest && s.forest.trees) || []).find(v => v >= CONFIG.FOREST.STAGES) },
    { id: 'tree_25', icon: '🌟', name: 'ปุ๋ยเร่งโต', desc: 'ป้อนต้นไม้ครบ 25 ครั้ง', check: s => ((s.forest && s.forest.fed) || 0) >= 25 },
    { id: 'forest_win', icon: '🏅', name: 'ป่าอุดมสมบูรณ์', desc: 'ป่า 5 ต้นสมบูรณ์ครบทุกต้น', check: s => ((s.forest && s.forest.medals) || 0) >= 1 || ((s.forest && s.forest.trees) || []).every(v => v >= CONFIG.FOREST.STAGES) },
    { id: 'cycle_100', icon: '🏆', name: '100 รอบคาลวิน', desc: 'หมุนคาลวินครบ 100 รอบ', check: s => (s.totalCycles || 0) >= 100 },
    { id: 'forest_5', icon: '🎉', name: 'จอมกว่านักปลูก', desc: 'ป้อนต้นไม้ครบ 100 ครั้ง', check: s => ((s.forest && s.forest.fed) || 0) >= 100 }
  ],

  has(id) {
    return (GameState.achievements || []).indexOf(id) >= 0;
  },

  get(id) {
    return this.list.find(a => a.id === id) || null;
  },

  count() {
    return (GameState.achievements || []).length;
  },

  unlock(id, showToast) {
    GameState.achievements = GameState.achievements || [];
    if (this.has(id)) return;
    GameState.achievements.push(id);
    GameState.save();
    if (showToast !== false) this._toast(id);
    this.syncPanel();
  },

  _toast(id) {
    const a = this.get(id);
    if (!a) return;
    const msg = '🏆 ความสำเร็จใหม่: ' + a.icon + ' ' + a.name;
    if (typeof UI !== 'undefined' && UI && typeof UI.showToast === 'function') UI.showToast(msg, 3200);
    if (typeof SFX !== 'undefined' && SFX && typeof SFX.play === 'function') SFX.play('complete');
  },

  // ตรวจเงื่อนไขทั้งหมดที่ยังไม่ปลดล็อก (เรียกทุก ~2.5 วิ + หลังป้อนต้นไม้)
  checkAll() {
    const arr = (GameState.achievements = GameState.achievements || []);
    let n = 0;
    for (const a of this.list) {
      if (arr.indexOf(a.id) >= 0) continue;
      let ok = false;
      try { ok = a.check(GameState); } catch (e) {}
      if (ok) { arr.push(a.id); GameState.save(); this._toast(a.id); n++; }
    }
    if (n) this.syncPanel();
  },

  render() {
    const wrap = document.getElementById('ach-list');
    if (!wrap) return;
    wrap.innerHTML = this.list.map(a => {
      const on = this.has(a.id);
      return '<div class="ach-tile' + (on ? ' ach-on' : ' ach-off') + '" title="' + a.desc + '">' +
        '<span class="ach-ico">' + (on ? a.icon : '🔒') + '</span>' +
        '<span class="ach-name">' + a.name + '</span></div>';
    }).join('');
    const c = document.getElementById('ach-count');
    if (c) c.innerText = this.count() + '/' + this.list.length;
  },

  syncPanel() {
    const ov = document.getElementById('achievement-overlay');
    if (ov && !ov.classList.contains('hidden')) this.render();
  },

  open() {
    const ov = document.getElementById('achievement-overlay');
    if (!ov) return;
    this.render();
    ov.classList.remove('hidden');
    document.body.classList.add('ui-modal-open');
  },

  close() {
    const ov = document.getElementById('achievement-overlay');
    if (ov) ov.classList.add('hidden');
    document.body.classList.remove('ui-modal-open');
  }
};