/* ================================================================
 * tutorial.js — ระบบเนื้อเรื่อง + ฝึกสอนสำหรับผู้เล่นครั้งแรก (กรมป่าไม้)
 * - คัทซีน + วิธีเล่นเป็นขั้นตอน
 * - Theme: ฟื้นฟูป่า — เอาน้ำตาลจากคาลวินไปป้อนต้นกล้าให้โต
 * ================================================================ */
const Tutorial = {
  active: false,

  _stepIdx: 0,
  _steps: [],
  _cutIdxList: [],
  _finalIdx: 0,
  _objStart: 0,
  _currentStep: null,

  // DOM refs
  _ov: null,
  _art: null,
  _speaker: null,
  _text: null,
  _nextBtn: null,
  _skipBtn: null,
  _progress: null,
  _hud: null,
  _hudTitle: null,
  _hudDesc: null,
  _hudStep: null,
  _hudSkip: null,

  _typeTimer: null,
  _raf: 0,

  // ผู้เล่นผ่านขั้นสอนมาแล้วหรือยัง (localStorage)
  checkShouldAutoStart() {
    return !localStorage.getItem('calvin_tutorial_done');
  },

  /* ───────────── helpers: DOM + typewriter ───────────── */
  _ids() {
    this._ov = document.getElementById('tutorial-overlay');
    this._art = document.getElementById('tut-art');
    this._speaker = document.getElementById('tut-speaker');
    this._text = document.getElementById('tut-text');
    this._nextBtn = document.getElementById('tut-next');
    this._skipBtn = document.getElementById('tut-skip');
    this._progress = document.getElementById('tut-progress');
    this._hud = document.getElementById('tutorial-hud');
    this._hudTitle = document.getElementById('tut-hud-title');
    this._hudDesc = document.getElementById('tut-hud-desc');
    this._hudStep = document.getElementById('tut-hud-step');
    this._hudSkip = document.getElementById('tut-hud-skip');
  },

  _sparks(n) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = (i * 37 + 13) % 92;
      const y = (i * 53 + 9) % 62;
      s += `<span class="spark" style="left:${x}%;top:${y}%;animation-duration:${2 + (i % 5) * 0.4}s;animation-delay:${i * 0.23}s"></span>`;
    }
    return s;
  },

  _decorate(t) {
    return t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/__(.+?)__/g, '<em>$1</em>');
  },
  _plain(t) {
    return t.replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1');
  },

  _type(raw) {
    if (this._typeTimer) clearInterval(this._typeTimer);
    const el = this._text;
    el.classList.add('typing');
    el.innerText = '';
    const chars = Array.from(raw);
    let i = 0;
    const tick = () => {
      i = Math.min(chars.length, i + 5);
      el.innerText = chars.slice(0, i).join('');
      if (i >= chars.length) {
        clearInterval(this._typeTimer);
        el.classList.remove('typing');
        el.innerHTML = this._decorate(raw);
      }
    };
    tick();
    this._typeTimer = setInterval(tick, 32);
  },

  /* ───────────── ฉากคัทซีน (art) ───────────── */
  _artSunset() {
    const trees = ['🌳', '🌲', '🌳', '🌴', '🌲', '🌳', '🌲'];
    const line = trees.map((t, i) => `<div class="ftree t${i + 1}">${t}</div>`).join('');
    return `
      <div class="art-forest">
        <div class="forest-sun-big"></div>
        <div class="bird b1">🐦</div><div class="bird b2">🕊️</div>
        <div class="tree-line">${line}</div>
        ${this._sparks(8)}
      </div>`;
  },

  _artNight(useFace) {
    const faces = useFace
      ? '<span class="g">🪵</span><span class="g">😭</span><span class="g">😰</span><span class="g">😢</span>'
      : '<span class="g">🪓</span><span class="g">🪵</span><span class="g">😔</span><span class="g">😢</span>';
    return `
      <div class="art-wasteland">
        <div class="dry-sun">☀️</div>
        <div class="stump-line">
          <span class="stump">🪵</span><span class="stump">🪵</span>
          <span class="stump sad">🌳</span>
          <span class="stump">🪵</span><span class="stump sad">🌳</span>
        </div>
        <div class="grievers">${faces}</div>
        ${this._sparks(4)}
      </div>`;
  },

  _artProtest() {
    return `
      <div class="art-rangers">
        <div class="big-ranger">🧑‍🌾</div>
        <div class="shout-bubble">⚠️ "ป่ากำลังจะตาย!!" ⚠️</div>
        <div class="crowd-team">
          <span class="p">😭</span><span class="p">😠</span><span class="p">😤</span><span class="p">🌳</span>
        </div>
        ${this._sparks(4)}
      </div>`;
  },

  _artMission() {
    return `
      <div class="art-mission">
        <div class="big-ranger">🧑‍🌾</div>
        <div class="sunrise"></div>
        ${this._sparks(6)}
      </div>`;
  },

  _artHowto() {
    return `
      <div class="art-howto">
        <div class="tut-flow">
          <div class="flow-node n-co2"><span class="fn-icon">🌫️</span><span class="fn-tag">CO₂</span><span class="fn-sub">จุดรับ CO₂</span></div>
          <span class="flow-arrow">→</span>
          <div class="flow-node n-light"><span class="fn-icon">☀️</span><span class="fn-tag">ขั้นแสง</span><span class="fn-sub">น้ำ+แสง</span></div>
          <span class="flow-arrow">→</span>
          <div class="flow-node n-atp"><span class="fn-icon">⚡</span><span class="fn-tag">ATP+NADPH</span><span class="fn-sub">พลังงาน</span></div>
          <span class="flow-arrow">→</span>
          <div class="flow-node n-calv"><span class="fn-icon">🌀</span><span class="fn-tag">คาลวิน</span><span class="fn-sub">ทำ G3P</span></div>
          <span class="flow-arrow">→</span>
          <div class="flow-node n-sugar"><span class="fn-icon">🍬</span><span class="fn-tag">เครื่องน้ำตาล</span><span class="fn-sub">คลิกดู · SPACE เก็บ</span></div>
          <span class="flow-arrow">→</span>
          <div class="flow-node n-tree"><span class="fn-icon">🌱</span><span class="fn-tag">ต้นกล้า</span><span class="fn-sub">ป้อนน้ำตาล</span></div>
          <span class="flow-arrow">→</span>
          <div class="flow-node n-forest"><span class="fn-icon">🌳</span><span class="fn-tag">ป่าอุดมสมบูรณ์</span><span class="fn-sub">ครบ 5 ต้น</span></div>
        </div>
        ${this._sparks(7)}
      </div>`;
  },

  _artPond() {
    return `
      <div class="art-pond-inner">
        <div class="pond">
          <div class="ripple r1"></div><div class="ripple r2"></div><div class="ripple r3"></div>
          <div class="lily l1">🌸</div><div class="lily l2">🪷</div><div class="lily l3">🪷</div>
        </div>
        ${this._sparks(5)}
      </div>`;
  },

  _artSun() {
    return `
      <div class="art-sun">
        <div class="big-sun">☀️</div>
        <div class="photon p1">✨</div><div class="photon p2">✨</div>
        <div class="photon p3">✨</div><div class="photon p4">✨</div>
        ${this._sparks(8)}
      </div>`;
  },

  _artCalvin() {
    return `
      <div class="art-calvin">
        <div class="big-calvin">🌀</div>
        <div class="orbit-dot o1">ATP</div>
        <div class="orbit-dot o2">NADPH</div>
        <div class="orbit-dot o3">CO₂</div>
        <div class="orbit-dot o4">G3P</div>
        ${this._sparks(5)}
      </div>`;
  },

  _artTree() {
    return `
      <div class="art-tree-big">
        <div class="growing-tree">🌳</div>
        <div class="sugar-lump">🍬</div>
        <div class="sapling-note">🌱 +🍬 = 🌳</div>
        ${this._sparks(5)}
      </div>`;
  },

  _artCelebrate() {
    const confetti = Array.from({ length: 22 }, (_, i) => {
      const c = ['#ffd75e', '#5fff8a', '#ff9ec4', '#7ec8ff', '#ffb36a', '#c7a0ff'][i % 6];
      return `<i style="left:${(i * 4.5 + 2)}%;background:${c};animation-delay:${(i % 7) * 0.2}s;animation-duration:${2 + (i % 3) * 0.5}s"></i>`;
    }).join('');
    const winTrees = ['🌳', '🌲', '🌳', '🌴', '🌲', '🌳', '🌲', '🌳'];
    const line = winTrees.map((t, i) => `<div class="fw" style="left:${6 + i * 12}%">${t}</div>`).join('');
    return `
      <div class="art-celebrate">
        <div class="firework"></div><div class="firework fw2"></div><div class="firework fw3"></div>
        <div class="confetti">${confetti}</div>
        <div class="forest-line">${line}</div>
        <div class="happy">
          <span class="p">🎉</span><span class="p">🥳</span><span class="p">😄</span><span class="p">🌳</span>
        </div>
        ${this._sparks(6)}
      </div>`;
  },

  _artSustain() {
    return `
      <div class="art-sustain">
        <div class="big-emblem">🌳</div>
        <div class="sustain-glow"></div>
        <div class="sunrise"></div>
        ${this._sparks(6)}
      </div>`;
  },

  /* ───────────── สคริปต์ขั้นตอนทั้งหมด ───────────── */
  _buildSteps() {
    const t = new Date().getTime();
    return [
      /* ── คัดซีนเปิดเรื่อง (ป่าอุดมสมบูรณ์) ── */
      {
        k: 'cut', artFn: () => this._artSunset(), speaker: 'ผู้เล่าเรื่อง',
        text: 'ที่ GREEN LEAF FORESTRY CENTER มี **ต้นกล้า 5 ต้น** 🌱\nเรียงรายอยู่ในแปลงเพาะชำ\nคอยดูด CO₂ แล้วปล่อย **ออกซิเจน** ให้ทุกคนหายใจ 🌬️',
        next: 'ไปต่อ ▶'
      },
      {
        k: 'cut', artFn: () => this._artSunset(), speaker: 'ผู้เล่าเรื่อง',
        text: 'แค่ต้นกล้าเล็กๆ 5 ต้น\nก็ผลิดอกออกใบกลายเป็น **ป่าใหม่ที่อุดมสมบูรณ์** ทีละนิด\nเมื่อโตเต็มที่ครบทั้ง 5 ต้น = **ปอดสีเขียวของเรา** 🍃',
        next: 'ไปต่อ ▶'
      },

      /* ── ป่าถูกโค่น → โล่งเตียน ── */
      {
        k: 'cut', artFn: () => this._artNight(false), speaker: 'ผู้เล่าเรื่อง',
        text: 'แต่ก่อนหน้านั้น!! ไม่นานมานี้เอง ที่ป่าแห่งนี้ถูก **โค่นล้ม** อย่างหนัก 🪓\nต้นใหญ่ล้มครืนไปทีละต้น ลำต้นถูกตัดเป็นท่อนขนออกไป\nเหลือแค่ **ตอไม้แห้งเหี่ยว** กลางดินรกร้าง…',
        next: 'ไปต่อ ▶'
      },
      {
        k: 'cut', artFn: () => this._artNight(true), speaker: 'ผู้เล่าเรื่อง',
        text: 'หน้าดินพังทลาย น้ำสะอาดหายาก\nสรรพสัตว์ต่างพากัน **จากไป** 🕊️\nเหลือทางรอดเดียวคือ **ต้นกล้า 5 ต้น** ต้องโตให้ทัน!',
        next: 'ไปต่อ ▶'
      },

      /* ── เจ้าหน้าที่ป่าไม้ห่วงป่า ── */
      {
        k: 'cut', artFn: () => this._artProtest(), speaker: 'ทีมกรมป่าไม้',
        text: 'เจ้าหน้าที่ป่าไม้รวมตัวกันด้วยความเครียด 💢\n"ต้นไม้ถูกตัดหายไปหมด!! ป่าไม่เหลือร่มเงาเลย!!"\n"ใครสักคนช่วย **ฟื้นฟูป่า** ให้กลับมาเขียวทีเถอะ!!"',
        next: 'ไปต่อ ▶'
      },

      /* ── ภารกิจ ── */
      {
        k: 'cut', artFn: () => this._artMission(), speaker: 'หัวหน้ากรมป่าไม้',
        text: '"ใจเย็นๆ ทุกคน! นี่คือ **เจ้าหน้าที่ป่าไม้คนใหม่** ของเรา 🧑‍🌾\nลงมือได้เลย — **ฟื้นฟูป่าให้กลับมาเขียวชอุ่ม** ให้สมบูรณ์อีกครั้ง!"',
        next: 'รับหน้าที่! 💪'
      },

      /* ── วิธีเล่น (แผนภาพสายพาน) ── */
      {
        k: 'cut', artFn: () => this._artHowto(), speaker: '📖 วิธีเล่น',
        text: 'การฟื้นป่าของเราเป็น **สายพาน** แบบนี้:\n\n_(ดูแผนภาพด้านบน)_',
        next: 'ต่อไป ▶'
      },
      {
        k: 'cut', artFn: () => this._artHowto(), speaker: '📖 วิธีเล่น',
        text: 'วิธีเล่นรวดเร็ว:\n① เก็บ **CO₂ ทีละ 1** แล้วกด SPACE ใส่กลางวงซ้ำๆ จนครบ 3\n② ตัก **น้ำ** ปั่น **ขั้นแสง** ได้ **ATP+NADPH**\n③ เปิด **คาลวิน** → น้ำตาลไหลไป **เครื่องบรรจุ** → ไปกด SPACE **เก็บน้ำตาล** 🍬\n④ **เดินไปใกล้ต้นกล้า** แล้วกด SPACE ให้น้ำตาล 🌱',
        next: 'เริ่มฝึก! 🎓'
      },

      /* ── ก่อนเริ่มฝึก: ไม่มีการแข่งเวลา ── */
      {
        k: 'cut', artFn: () => this._artSustain(), speaker: 'หัวหน้ากรมป่าไม้',
        text: 'โอเค! เกมนี้เป็นเกม **ผ่อนคลาย** 🌤️\n**ไม่มีเวลาจำกัด** ไม่มีไฟเหลือ ไม่มีเกมโอเวอร์\nค่อยๆ ฟาร์ม แล้วเอาน้ำตาลไปป้อนต้นไม้ **ให้ครบ 5 ต้น** จนป่าอุดมสมบูรณ์!',
        next: 'ลงมือ! 🚀'
      },

      /* ══════════════ ภารกิจที่ 1: CO₂ ══════════════ */
      {
        k: 'obj',
        title: '🌿 ภารกิจ 1 : เก็บ CO₂ (ทีละ 1)',
        desc: 'เดินไปที่ **จุดรับ CO₂** (ฟ้า ☁️ ด้านซ้ายบน) แล้วกด <b>SPACE / E</b> (มือถือกดปุ่ม ⚡)\nช่วงสอน **เก็บทีละ 1 โมเลกุล (6 ครั้งแรก)** — ทำซ้ำจนได้ <b>CO₂ ≥ 3</b>\nจากนั้นเดินไป **กลางวงคาลวิน** แล้วกด SPACE **ทีละครั้ง** ใส่คาร์บอน (ทีละ 1 เฉพาะ **6 รอบแรก** หลังจากนั้นใส่ทีเดียวได้)',
        base: () => GameState.res.CO2 || 0,
        check: () => (GameState.res.CO2 || 0) >= this._objStart + 3,
        onDone: () => { GameState.res.CO2 = Math.max(GameState.res.CO2 || 0, 3); },
        doneText: 'เก็บ CO₂ สำเร็จ! 🎉 → ต่อไปใส่เครื่องแล้วทำน้ำ'
      },

      /* ── ขั้นต่อไป: น้ำ ── */
      {
        k: 'cut', artFn: () => this._artPond(), speaker: 'หัวหน้ากรมป่าไม้',
        text: 'CO₂ พร้อมแล้ว! ต่อไป...\nไปตัก **น้ำ** มาสิ 💧 (ต้นไม้ก็ต้องกินน้ำเองแหละ!)',
        next: 'ไปบ่อน้ำ! 🌊'
      },

      /* ══════════════ ภารกิจที่ 2: น้ำ ══════════════ */
      {
        k: 'obj',
        title: '💧 ภารกิจ 2 : ตักน้ำ',
        desc: 'เดินไปที่ **บ่อน้ำ** (มุมขวาบน 💧) แล้วกด <b>SPACE / E</b> ซ้ำๆ\nจนได้ <b>H₂O ≥ 4</b>',
        base: () => GameState.res.WATER || 0,
        check: () => (GameState.res.WATER || 0) >= this._objStart + 4,
        onDone: () => { GameState.res.WATER = Math.max(GameState.res.WATER || 0, 6); },
        doneText: 'น้ำเต็มถัง! 💦'
      },

      /* ── ขั้นต่อไป: เครื่องขั้นแสง ── */
      {
        k: 'cut', artFn: () => this._artSun(), speaker: 'หัวหน้ากรมป่าไม้',
        text: 'ตอนนี้เรามีน้ำแล้ว! 💧\nไปที่ **เครื่องขั้นแสง** 🟡 แล้วกด SPACE เพื่อ**ใส่น้ำ**เข้าเครื่อง\nเครื่องจะเปลี่ยน H₂O เป็น **ATP + NADPH** ให้อัตโนมัติ!',
        next: 'ไปเครื่องขั้นแสง! 🟡'
      },

      /* ══════════════ ภารกิจที่ 3: เครื่องขั้นแสง ══════════════ */
      {
        k: 'obj',
        title: '💦 ภารกิจ 3 : ปั่นเครื่องขั้นแสง',
        desc: 'เดินไปที่ **เครื่องขั้นแสง** 🟡 แล้วกด <b>SPACE / E</b> เพื่อใส่น้ำเข้าเครื่อง\nเครื่องจะเปลี่ยนน้ำเป็น <b>ATP + NADPH</b> ให้อัตโนมัติ  ทำซ้ำจน <b>ATP ≥ 9</b>',
        base: () => GameState.res.ATP || 0,
        check: () => (GameState.res.ATP || 0) >= this._objStart + 9,
        onDone: () => { GameState.res.ATP = Math.max(GameState.res.ATP || 0, 9); GameState.res.NADPH = Math.max(GameState.res.NADPH || 0, 6); },
        doneText: 'ATP + NADPH พร้อม! ⚡'
      },

      /* ── ขั้นต่อไป: คาลวิน ── */
      {
        k: 'cut', artFn: () => this._artCalvin(), speaker: 'หัวหน้ากรมป่าไม้',
        text: 'เก่งมาก! ตอนนี้เรามี **ATP + NADPH + CO₂** ครบแล้ว\nเปิด **วัฏจักรคาลวิน** 🌀 กันเถอะ!',
        next: 'ไปปั่นคาลวิน! 🌀'
      },

      /* ══════════════ ภารกิจที่ 5: คาลวิน ══════════════ */
      {
        k: 'obj',
        title: '🌀 ภารกิจ 5 : เริ่มวัฏจักรคาลวิน',
        desc: 'เดินไปที่กลาง **วงคาลวิน** 🌀 แล้วกด <b>SPACE</b>\n• ถ้ายังไม่ใส่ CO₂ → กดใส่เครื่อง (ทีละ 1 เฉพาะ **6 รอบแรก** หลังจากนั้นใส่ทีเดียวได้) จน **3/3**\n• ครบแล้วกด <b>SPACE</b> อีกครั้งเพื่อ **เริ่มวัฏจักร**\nได้ **G3P** → ครบ 2 = น้ำตาล 🍬 ไหลไปเครื่องบรรจุ',
        base: () => GameState.totalCycles || 0,
        check: () => (GameState.totalCycles || 0) >= this._objStart + 1,
        onDone: () => {},
        doneText: 'หมุนคาลวินสำเร็จ! 🌀'
      },

      /* ── ขั้นต่อไป: ต้นไม้ ── */
      {
        k: 'cut', artFn: () => this._artTree(), speaker: 'หัวหน้ากรมป่าไม้',
        text: 'น้ำตาลถูกส่งออกไปที่ **เครื่องบรรจุน้ำตาล** แล้ว!! 🍬\n**เดินไปที่เครื่องบรรจุ** (ล่างซ้ายของโรงงาน) แล้วกด <b>SPACE</b> เก็บน้ำตาล\nจากนั้นเอาไปให้ **ต้นกล้า** ในสวน — กด SPACE ใกล้ต้นไม้ ให้มันโตทีละระยะ!',
        next: 'ไปเก็บน้ำตาล! 🍬',
        onDone: () => { GameState.sugarReady = Math.max(GameState.sugarReady || 0, 1); }
      },

      /* ══════════════ ภารกิจที่ 6: เก็บน้ำตาลจากเครื่อง ══════════════ */
      {
        k: 'obj',
        title: '🍬 ภารกิจ 6 : เก็บน้ำตาลจากเครื่อง',
        desc: 'เดินไปที่ **เครื่องบรรจุน้ำตาล** 🍬 (ล่างซ้ายของโรงงาน) แล้วกด <b>SPACE / E</b> เก็บ\nหรือ **คลิกเครื่อง** เพื่อดูกระบวนการภายใน (G3P → น้ำตาล)\nดูแถบสถานะบนเครื่อง — ถ้ามี G3P 1/2 ขึ้นว่า "ต้องการเข้าคาลวินอีก 1 ครั้ง"',
        base: () => GameState.res.SUGAR || 0,
        check: () => (GameState.res.SUGAR || 0) > this._objStart,
        onDone: () => {},
        doneText: 'เก็บน้ำตาลจากเครื่องสำเร็จ! 🍬'
      },

      /* ══════════════ ภารกิจที่ 7: ต้นไม้ ══════════════ */
      {
        k: 'obj',
        title: '🌱 ภารกิจ 7 : ป้อนน้ำตาลต้นไม้',
        desc: 'เดินไป **ใกล้ต้นไม้** ในฉาก (รอบโรงงาน 🏭) แล้วกด <b>SPACE / E</b>\nดูต้นกล้าค่อยๆ โตทีละระยะ จนครบ 5 ต้นสมบูรณ์\n**ป่าครบสมบูรณ์จะได้รับ 🏅 เหรียญขยัน!**',
        base: () => GameState.forest.fed || 0,
        check: () => (GameState.forest.fed || 0) > this._objStart,
        onDone: () => {},
        doneText: 'เลี้ยงต้นไม้สำเร็จ! 🌳'
      },

      /* ══════════════ จบ: ฉลอง ── ══════════════ */
      {
        k: 'cut', artFn: () => this._artCelebrate(), speaker: 'ทีมกรมป่าไม้',
        text: '🎉 **ต้นไม้เริ่มโต! ป่าค่อยๆ กลับมา!!!** 🎉\nใบเขียวชอุ่ม ร่มเย็น นกเริ่มกลับมาร้องเพลงอีกครั้ง\nขอบคุณมากนะคะคุณเจ้าหน้าที่!',
        next: 'ต่อไป ▶'
      },
      {
        k: 'cut', artFn: () => this._artSustain(), speaker: 'หัวหน้ากรมป่าไม้',
        text: 'สุดท้าย... จำไว้นะ! 🌤️ เกมนี้ **ไม่มีเวลาจำกัด** ไม่มีแรงกดดันใดๆ\nแค่ฟาร์มไปเรื่อยๆ: เก็บ CO₂ ทีละ 1 → ใส่กลางวง → ขั้นแสง → คาลวิน → **เก็บน้ำตาลที่เครื่องบรรจุ** → **เดินไปใกล้ต้นไม้แล้วกด SPACE**\nจนครบ **5 ต้น** ป่าจะกลับมาอุดมสมบูรณ์!  ตั้งใจทำนะเจ้าหน้าที่!',
        next: 'เริ่มงานจริง! 🚀'
      }
    ];
  },

  /* ───────────── เลื่อนขั้น / ตรวจภารกิจ ───────────── */
  _renderStep() {
    if (!this.active) return;
    this._cancelLoop();
    this._currentStep = null;
    const st = this._steps[this._stepIdx];
    if (!st) { this._finish(); return; }
    if (st.k === 'cut') this._renderCut(st);
    else this._renderObjective(st);
  },

  _renderCut(st) {
    GameState.cutsceneActive = true;
    if (typeof GameView !== 'undefined' && GameView.clearGuide) GameView.clearGuide();
    if (this._ov) this._ov.classList.remove('hidden');
    if (this._hud) this._hud.classList.add('hidden');
    document.body.classList.add('ui-modal-open');
    if (this._art && st.artFn) this._art.innerHTML = st.artFn();
    if (this._speaker) this._speaker.innerText = st.speaker || 'ผู้เล่าเรื่อง';
    this._renderProgress();
    this._type(st.text);
    if (this._nextBtn) {
      this._nextBtn.innerText = st.next || 'ต่อไป ▶';
      this._nextBtn.classList.remove('hidden');
      this._nextBtn.onclick = () => {
        if (st.onDone) st.onDone();
        this._stepIdx++;
        this._renderStep();
      };
    }
    if (this._skipBtn) {
      this._skipBtn.classList.remove('hidden');
      this._skipBtn.onclick = () => this._skip();
    }
  },

  _renderObjective(st) {
    GameState.cutsceneActive = false;
    if (this._ov) this._ov.classList.add('hidden');
    if (this._hud) this._hud.classList.remove('hidden');
    document.body.classList.remove('ui-modal-open');
    UI.updateInventory();
    if (this._hudTitle) this._hudTitle.innerText = st.title;
    if (this._hudDesc) this._hudDesc.innerHTML = st.desc;
    if (this._hudStep) this._hudStep.innerText = `ขั้น ${this._stepIdx + 1}/${this._steps.length} · กำลังฝึก`;
    if (this._hudSkip) this._hudSkip.onclick = () => this._skip();
    this._objStart = (typeof st.base === 'function' ? st.base() : Date.now());
    this._currentStep = st;
    this._applyGuide(st);
    this._raf = requestAnimationFrame(() => this._checkStep(st));
  },

  _guideForStep(st) {
    const t = (st && st.title) || '';
    const C = CONFIG;
    if (t.indexOf('เก็บ CO₂') >= 0) {
      return { x: C.CO2_COLLECTOR.x, y: C.CO2_COLLECTOR.y, label: '🌫️ จุดรับ CO₂ (กด SPACE)' };
    }
    if (t.indexOf('ตักน้ำ') >= 0) {
      return { x: C.WATER_POND.x, y: C.WATER_POND.y, label: '💧 บ่อน้ำ H₂O (กด SPACE)' };
    }
    if (t.indexOf('ขั้นแสง') >= 0) {
      return { x: C.LIGHT_MACHINE_WORLD.x, y: C.LIGHT_MACHINE_WORLD.y, label: '🟡 เครื่องขั้นแสง (ใส่น้ำ)' };
    }
    if (t.indexOf('เริ่มวัฏจักร') >= 0) {
      return { x: C.CYCLE_CENTER.x, y: C.CYCLE_CENTER.y, label: '🌀 กด SPACE กลางวงคาลวิน' };
    }
    if (t.indexOf('เก็บน้ำตาล') >= 0) {
      return { x: C.SUGAR_MACHINE.x, y: C.SUGAR_MACHINE.y, label: '🍬 เครื่องบรรจุน้ำตาล (กด SPACE)' };
    }
    if (t.indexOf('ป้อนน้ำตาล') >= 0) {
      const cx = C.CYCLE_CENTER.x, cy = C.CYCLE_CENTER.y;
      const trees = (GameState.forest && GameState.forest.trees) || [];
      let idx = trees.findIndex(v => v < C.FOREST.STAGES);
      if (idx < 0) return null;
      const a = (idx / 5) * Math.PI * 2 - Math.PI / 2;
      return { x: cx + Math.cos(a) * 440, y: cy + Math.sin(a) * 440, label: `🌱 ต้นที่ ${idx + 1} (กด SPACE)` };
    }
    return null;
  },

  _applyGuide(st) {
    if (typeof GameView === 'undefined' || !GameView) return;
    const g = this._guideForStep(st);
    if (g) GameView.setGuide(g.x, g.y, g.label);
    else GameView.clearGuide();
  },

  _checkStep(st) {
    if (!this.active || this._currentStep !== st) return;
    let ok = false;
    try { ok = !!st.check(); } catch (e) {}
    if (ok) {
      this._onObjectiveDone(st);
      return;
    }
    this._raf = requestAnimationFrame(() => this._checkStep(st));
  },

  _onObjectiveDone(st) {
    this._cancelLoop();
    if (st.onDone) st.onDone();
    UI.renderForest();
    UI.updateInventory();
    UI.showToast(st.doneText || 'ผ่าน! ✅', 1600);
    this._stepIdx++;
    setTimeout(() => this._renderStep(), 1100);
  },

  _renderProgress() {
    if (!this._progress) return;
    if (this._steps[this._stepIdx] && this._steps[this._stepIdx].k === 'cut') {
      let html = '';
      for (let i = 0; i < this._cutIdxList.length; i++) {
        const ci = this._cutIdxList[i];
        const cls = ci < this._stepIdx ? 'done' : (ci === this._stepIdx ? 'on' : '');
        html += `<span class="pdot ${cls}"></span>`;
      }
      this._progress.innerHTML = html;
    } else {
      this._progress.innerHTML = '';
    }
  },

  _cancelLoop() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
  },

  _skip() {
    this._cancelLoop();
    if (typeof GameView !== 'undefined' && GameView.clearGuide) GameView.clearGuide();
    if (this._typeTimer) clearInterval(this._typeTimer);
    if (this._stepIdx >= this._finalIdx) {
      // อยู่แล้วในฉากท้าย → จบเลย
      this._stepIdx = this._steps.length;
      this._renderStep();
      return;
    }
    // ข้าม → กระโดดไปฉากฉลอง (ก่อนฉากจบ)
    this._stepIdx = this._finalIdx;
    this._renderStep();
  },

  /* ───────────── เริ่ม / จบ ───────────── */
  start() {
    if (this.active) return;
    this._ids();
    if (!this._ov || !this._hud) return;
    this.active = true;
    GameState.tutorialActive = true;
    GameState.cutsceneActive = false;

    this._steps = this._buildSteps();
    this._cutIdxList = [];
    for (let i = 0; i < this._steps.length; i++) {
      if (this._steps[i].k === 'cut') this._cutIdxList.push(i);
    }
    this._finalIdx = this._cutIdxList[this._cutIdxList.length - 2];
    this._stepIdx = 0;
    this._renderStep();
  },

  _finish() {
    this._cancelLoop();
    if (this._typeTimer) clearInterval(this._typeTimer);
    localStorage.setItem('calvin_tutorial_done', '1');
    const _s = (typeof GameState !== 'undefined') ? GameState.phaserScene : null;
    if (_s && typeof _s._setCo2ProduceSpeed === 'function') _s._setCo2ProduceSpeed();
    GameState.tutorialActive = false;
    GameState.cutsceneActive = false;
    this.active = false;
    if (this._ov) this._ov.classList.add('hidden');
    if (this._hud) this._hud.classList.add('hidden');
    document.body.classList.remove('ui-modal-open');
    if (typeof GameView !== 'undefined' && GameView.clearGuide) GameView.clearGuide();
    UI.renderForest();
    UI.showToast('🎓 ฝึกสอนจบ! ฟาร์มน้ำตาลให้ป้อนต้นกล้า ครบ 5 ต้น ป่าสมบูรณ์ 🌳', 5000);
  }
};