/* ================================================================
 * sfx.js — เสียงที่สังเคราะห์ด้วย WebAudio (ไม่ต้องใช้ไฟล์เสียง)
 * API: SFX.init(), SFX.play(name), SFX.toggleMute(), SFX.isMuted()
 * ================================================================ */
const SFX = {
  _ctx: null,
  _master: null,
  _muted: false,

  init() {
    if (this._ctx) return this;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return this;
    const ctx = new AC();
    const master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);
    this._ctx = ctx;
    this._master = master;
    try { this._muted = localStorage.getItem('calvin_sfx_muted') === '1'; } catch (e) { this._muted = false; }
    master.gain.value = this._muted ? 0 : 0.35;
    // เบราว์เซอร์บังคับ: เริ่มเสียงได้หลัง user gesture แรกเท่านั้น
    const unlock = () => {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchend', unlock, { passive: true });
    return this;
  },

  resume() {
    if (this._ctx && this._ctx.state === 'suspended') this._ctx.resume().catch(() => {});
  },

  isMuted() { return this._muted; },

  toggleMute() {
    this._muted = !this._muted;
    try { localStorage.setItem('calvin_sfx_muted', this._muted ? '1' : '0'); } catch (e) {}
    if (this._master) this._master.gain.value = this._muted ? 0 : 0.35;
    return this._muted;
  },

  _tone(f0, dur, type, vol, delay, f1) {
    if (!this._ctx || this._muted || !this._master) return;
    if (this._ctx.state === 'suspended') this._ctx.resume().catch(() => {});
    const ctx = this._ctx;
    const t = ctx.currentTime + (delay || 0);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(Math.max(20, f0), t);
    if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + Math.max(0.02, dur));
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, Math.min(1, vol || 0.5)), t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this._master);
    o.start(t);
    o.stop(t + dur + 0.03);
  },

  _seq(notes, gap) {
    notes.forEach((n, i) => this._tone(n[0], n[1] || 0.08, n[2] || 'square', n[3] || 0.35, i * (gap || 0.07), n[4]));
  },

  play(name) {
    this.init();
    switch (name) {
      case 'pickup':
        // เก็บทรัพยากร — บลิปสว่างขึ้น
        this._tone(520, 0.09, 'square', 0.3, 0, 880);
        break;
      case 'water':
        // ตักน้ำ
        this._tone(300, 0.1, 'triangle', 0.4, 0, 470);
        break;
      case 'insert':
        // ใส่ CO₂ เข้าเครื่อง
        this._tone(262, 0.1, 'square', 0.3, 0, 392);
        break;
      case 'boost':
        // เปิดบูสต์แสง
        this._tone(523, 0.12, 'square', 0.28, 0);
        this._tone(784, 0.14, 'square', 0.28, 0.06);
        break;
      case 'produce':
        // Light Reaction ผลิต ATP+NADPH
        this._tone(220, 0.12, 'triangle', 0.4, 0, 330);
        break;
      case 'produceBoost':
        this._seq([[523, 0.08, 'square', 0.3], [659, 0.08, 'square', 0.3], [784, 0.1, 'square', 0.3]], 0.05);
        break;
      case 'phase':
        // ก้าวเฟสของคาลวิน
        this._tone(440, 0.07, 'square', 0.25, 0);
        this._tone(660, 0.07, 'square', 0.22, 0.07);
        break;
      case 'cycleDone':
        // จบรอบ — arpeggio C-E-G-C
        this._seq([[523, 0.09, 'square', 0.3], [659, 0.09, 'square', 0.3], [784, 0.09, 'square', 0.3], [1046, 0.14, 'square', 0.34]], 0.07);
        break;
      case 'sugar':
        // ประกอบน้ำตาลเสร็จ
        this._tone(392, 0.1, 'square', 0.3, 0, 523);
        this._tone(659, 0.12, 'square', 0.28, 0.1);
        break;
      case 'feed':
        // ป้อนน้ำตาลต้นไม้
        this._tone(494, 0.09, 'square', 0.3, 0, 659);
        break;
      case 'levelup':
        // ต้นไม้โต — คอร์ดขึ้น
        this._seq([[523, 0.11, 'triangle', 0.4], [659, 0.11, 'triangle', 0.4], [784, 0.2, 'triangle', 0.44]], 0.06);
        break;
      case 'catch':
        // จับโฟตอนในมินิเกม
        this._tone(880, 0.06, 'sawtooth', 0.3, 0, 1100);
        break;
      case 'catchBig':
        this._tone(1150, 0.08, 'sawtooth', 0.34, 0, 1500);
        break;
      case 'win':
        this._seq([[660, 0.1, 'square', 0.32], [880, 0.1, 'square', 0.32], [1100, 0.18, 'square', 0.36]], 0.07);
        break;
      case 'lose':
        this._tone(240, 0.28, 'sawtooth', 0.3, 0, 120);
        break;
      case 'click':
        this._tone(500, 0.045, 'square', 0.2, 0, 620);
        break;
      case 'complete':
        // ป่าอุดมสมบูรณ์ — แฟนแฟร์
        this._seq([[523, 0.1, 'square', 0.32], [659, 0.1, 'square', 0.32], [784, 0.1, 'square', 0.32], [1046, 0.22, 'square', 0.4]], 0.08);
        this._seq([[1046, 0.18, 'square', 0.32], [784, 0.18, 'square', 0.32], [659, 0.22, 'square', 0.34]], 0.09);
        break;
      case 'error':
        this._tone(180, 0.18, 'sawtooth', 0.25, 0, 120);
        break;
      default:
        break;
    }
  }
};

window.SFX = SFX;