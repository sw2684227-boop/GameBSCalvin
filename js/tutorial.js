/* ================================================================
 * tutorial.js — ระบบเนื้อเรื่อง + ฝึกสอนสำหรับผู้เล่นครั้งแรก
 * - คัทซีนสวยๆ (ตัดจอ, ฝนดาว, นัดซีน) + วิธีเล่นเป็นขั้นตอน
 * - ระหว่างฝึกสอน ไฟฟ้าจะถูกล็อกไม่ให้ลด (สำเร็จ/หมดแล้วค่อยปล่อย)
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
    return `
      <div class="art-sunset">
        <div class="sun-disc"></div>
        <div class="village-line">
          <div class="house h1"><span class="win" style="left:28%;bottom:12px"></span></div>
          <div class="house h2"><span class="win" style="left:16%;bottom:12px"></span><span class="win" style="left:52%;bottom:12px"></span></div>
          <div class="house h3"><span class="win" style="left:30%;bottom:12px"></span></div>
          <div class="house h4"><span class="win" style="left:18%;bottom:12px"></span><span class="win" style="left:55%;bottom:12px"></span></div>
          <div class="house h5"><span class="win" style="left:28%;bottom:12px"></span></div>
        </div>
        ${this._sparks(8)}
      </div>`;
  },

  _artNight(useFace) {
    const faces = useFace
      ? '<span class="vill">😭</span><span class="vill">😰</span><span class="vill">😨</span><span class="vill">😥</span>'
      : '<span class="vill">😨</span><span class="vill">😰</span><span class="vill">😢</span><span class="vill">😱</span>';
    return `
      <div class="art-night">
        <div class="moon"></div>
        <div class="night-houses">
          <div class="nh n1"><span class="win" style="left:16px"></span><span class="win" style="left:42px"></span></div>
          <div class="nh n2"><span class="win" style="left:20px"></span><span class="win" style="left:52px"></span></div>
          <div class="nh n3"><span class="win" style="left:18px"></span><span class="win" style="left:48px"></span></div>
          <div class="nh n4"><span class="win" style="left:62px"></span><span class="win" style="left:88px"></span></div>
        </div>
        <div class="grieved">${faces}</div>
        ${this._sparks(3)}
      </div>`;
  },

  _artProtest() {
    return `
      <div class="art-protest">
        <div class="factory-sil"></div>
        <div class="shout-bubble">⚠️ "ไฟหายไปหมดเลย!!" ⚠️</div>
        <div class="crowd">
          <span class="p">😠</span><span class="p">😡</span><span class="p">😤</span><span class="p">😱</span>
        </div>
        ${this._sparks(2)}
      </div>`;
  },

  _artMission() {
    return `
      <div class="art-mission">
        <div class="big-engineer">👷</div>
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
          <div class="flow-node n-calv"><span class="fn-icon">🌀</span><span class="fn-tag">คาลวิน</span><span class="fn-sub">น้ำตาล</span></div>
          <span class="flow-arrow">→</span>
          <div class="flow-node n-rabbit"><span class="fn-icon">🐰</span><span class="fn-tag">กระต่ายปั่นไฟ</span><span class="fn-sub">⚡ ไฟฟ้า</span></div>
          <span class="flow-arrow">→</span>
          <div class="flow-node n-village"><span class="fn-icon">🏘️</span><span class="fn-tag">หมู่บ้าน</span><span class="fn-sub">สว่างทั้งสิ้น</span></div>
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

  _artRabbit() {
    const wheels = Array.from({ length: 6 }, (_, i) => `<div class="spoke s${i + 1}"></div>`).join('');
    return `
      <div class="art-rabbit">
        <div class="rabbit-scene">
          <div class="running-rabbit">🐰</div>
          <div class="wheel">⚙️<span style="position:absolute;font-size:30px;line-height:1;top:50%;left:50%;transform:translate(-50%,-50%)">⚡</span></div>
        </div>
        ${this._sparks(5)}
      </div>`;
  },

  _artCelebrate() {
    const confetti = Array.from({ length: 22 }, (_, i) => {
      const c = ['#ffd75e', '#5fff8a', '#ff9ec4', '#7ec8ff', '#ffb36a', '#c7a0ff'][i % 6];
      return `<i style="left:${(i * 4.5 + 2)}%;background:${c};animation-delay:${(i % 7) * 0.2}s;animation-duration:${2 + (i % 3) * 0.5}s"></i>`;
    }).join('');
    return `
      <div class="art-celebrate">
        <div class="firework"></div><div class="firework fw2"></div><div class="firework fw3"></div>
        <div class="confetti">${confetti}</div>
        <div class="lit-houses">
          <div class="lh" style="left:8%"><span class="win" style="left:16px"></span><span class="win" style="left:44px"></span></div>
          <div class="lh" style="left:33%"><span class="win" style="left:18px"></span><span class="win" style="left:48px"></span></div>
          <div class="lh" style="left:58%"><span class="win" style="left:20px"></span><span class="win" style="left:52px"></span></div>
          <div class="lh" style="left:82%"><span class="win" style="left:18px"></span><span class="win" style="left:46px"></span></div>
        </div>
        <div class="happy">
          <span class="p">🎉</span><span class="p">🥳</span><span class="p">😄</span><span class="p">😆</span>
        </div>
        ${this._sparks(6)}
      </div>`;
  },

  _artWarning() {
    return `
      <div class="art-mission">
        <div class="warning-glow"></div>
        <div class="big-engineer">👷</div>
        <div class="sunrise"></div>
        ${this._sparks(4)}
      </div>`;
  },

  /* ───────────── สคริปต์ขั้นตอนทั้งหมด ───────────── */
  _buildSteps() {
    return [
      /* ── คัดซีนเปิดเรื่อง (ฉาก sunset) ── */
      {
        k: 'cut', artFn: () => this._artSunset(), speaker: 'ผู้เล่าเรื่อง',
        text: '**ค่ำๆ** ในหมู่บ้านกรีนลีฟ 🌳\nทุกบ้านส่องแสงสว่าง...\nเพราะมี "โรงงานไฟฟ้ากระต่าย" 🏭 อยู่กลางหมู่บ้าน',
        next: 'ไปต่อ ▶'
      },
      {
        k: 'cut', artFn: () => this._artSunset(), speaker: 'ผู้เล่าเรื่อง',
        text: 'ทุกคืน ครอบครัวทั้ง 4 ครอบครัว\nนั่งดูทีวี เปิดไฟ ทำการบ้าน...\nด้วยไฟจากโรงงาน 🐰กระต่ายวิ่งปั่นวงล้อให้พลังงาน⚡',
        next: 'ไปต่อ ▶'
      },

      /* ── เช้าพ่อขาดวัยเยาว์ → ไฟดับ ── */
      {
        k: 'cut', artFn: () => this._artNight(false), speaker: 'ผู้เล่าเรื่อง',
        text: 'แต่แล้ว!! คืนหนึ่ง **พายุฟ้าคะนอง** โหมกระหน่ำ ☇\nหม้อแปลงใหญ่ **ระเบิด**!! ไฟทั้งหมู่บ้าน **ดับลงพร้อมกัน**...',
        next: 'ไปต่อ ▶'
      },
      {
        k: 'cut', artFn: () => this._artNight(true), speaker: 'ผู้เล่าเรื่อง',
        text: 'ความมืดมิดกลืนกินทุกอย่าง\nเด็กน้อยร้องไห้กลางดึก  แม่ครัวหุงข้าวไม่เห็น  พ่อเปิดทีวีดูไม่ออก!!',
        next: 'ไปต่อ ▶'
      },

      /* ── ชาวบ้านประท้วง ── */
      {
        k: 'cut', artFn: () => this._artProtest(), speaker: 'เสียงชาวบ้าน',
        text: 'เช้าวันรุ่งขึ้น ชาวบ้าน **บุกมาหน้าโรงงาน** 💢\n"ไอ้วิศวกร!! ไฟหายไปไหนหมด!!"  "ลูกเราเรียนทำการบ้านไม่ได้!!"',
        next: 'ไปต่อ ▶'
      },

      /* ── ภารกิจขอล่อง ── */
      {
        k: 'cut', artFn: () => this._artMission(), speaker: 'หัวหน้าโรงงาน',
        text: '"ทุกคนใจเย็นๆ! นี่คือ **วิศวกรคนใหม่** ของเรา 👷\nลงมือได้เลย — **ผลิตไฟฟ้าให้ชาวบ้านกลับมาสว่าง** อีกครั้ง!"',
        next: 'รับหน้าที่! 💪'
      },

      /* ── วิธีเล่น (แผนภาพสายพาน) ── */
      {
        k: 'cut', artFn: () => this._artHowto(), speaker: '📖 วิธีเล่น',
        text: 'โรงงานของเราผลิตไฟเป็น **สายพาน** แบบนี้:\n\n_(ดูแผนภาพด้านบน)_',
        next: 'ต่อไป ▶'
      },
      {
        k: 'cut', artFn: () => this._artHowto(), speaker: '📖 วิธีเล่น',
        text: 'วิธีเล่นรวดเร็ว:\n① เก็บ **CO₂** ② ตัก **น้ำ** ③ ปั่น**เครื่องขั้นแสง** ได้ **ATP+NADPH**\n④ เปิด **วัฏจักรคาลวิน** ได้ **น้ำตาล** ⑤ ให้ **กระต่าย** กินเพื่อปั่นไฟ ⚡',
        next: 'เริ่มฝึก! 🎓'
      },

      /* ── ก่อนเริ่มฝึก: ล็อกไฟฟ้า ── */
      {
        k: 'cut', artFn: () => this._artMission(), speaker: 'หัวหน้าโรงงาน',
        text: 'โอเค! ระหว่างฝึก ฉันจะ **ล็อกไฟไม่ให้ลด** ⚡\nฝึกให้ **ครบทุกขั้น** ก่อน แล้วค่อยปล่อยให้ไฟทำงานจริง!',
        next: 'ลงมือ! 🚀'
      },

      /* ══════════════ ภารกิจที่ 1: CO₂ ══════════════ */
      {
        k: 'obj',
        title: '🌿 ภารกิจ 1 : เก็บ CO₂',
        desc: 'เดินไปที่ **จุดรับ CO₂** (ฟ้า ☁️ ด้านซ้ายบน) แล้วกด <b>SPACE / E</b> (มือถือกดปุ่ม ⚡)\nจนได้ <b>CO₂ ≥ 3</b>',
        check: () => (GameState.res.CO2 || 0) >= 3,
        onDone: () => { GameState.res.CO2 = Math.max(GameState.res.CO2 || 0, 5); },
        doneText: 'เก็บ CO₂ สำเร็จ! 🎉'
      },

      /* ── ขั้นต่อไป: น้ำ ── */
      {
        k: 'cut', artFn: () => this._artPond(), speaker: 'หัวหน้าโรงงาน',
        text: 'CO₂ พร้อมแล้ว! ต่อไป...\nไป ตัก **น้ำ** มาสิ 💧',
        next: 'ไปบ่อน้ำ! 🌊'
      },

      /* ══════════════ ภารกิจที่ 2: น้ำ ══════════════ */
      {
        k: 'obj',
        title: '💧 ภารกิจ 2 : ตักน้ำ',
        desc: 'เดินไปที่ **บ่อน้ำ** (มุมขวาบน 💧) แล้วกด <b>SPACE / E</b> ซ้ำๆ\nจนได้ <b>H₂O ≥ 4</b>',
        check: () => (GameState.res.WATER || 0) >= 4,
        onDone: () => { GameState.res.WATER = Math.max(GameState.res.WATER || 0, 6); },
        doneText: 'น้ำเต็มถัง! 💦'
      },

      /* ── ขั้นต่อไป: แสง ── */
      {
        k: 'cut', artFn: () => this._artSun(), speaker: 'หัวหน้าโรงงาน',
        text: 'ตอนนี้เรามีน้ำแล้ว!\nแต่ เครื่องขั้นแสง ยังขาด **แสงแดด** ☀️ ไป **จับโฟตอน** กัน!',
        next: 'ไปหาแสง! ☀️'
      },

      /* ══════════════ ภารกิจที่ 3: แสง ══════════════ */
      {
        k: 'obj',
        title: '☀️ ภารกิจ 3 : หาแสง',
        desc: 'กดที่กล่อง **⚡ATP** หรือ **☀️แสง** ในแถบด้านบน 📱 เพื่อเล่นมินิเกมหาแสง\nจับโฟตอนให้ได้อย่างน้อย <b>1 ☀️</b> (มีแสง = เร็วนะ!)',
        check: () => (GameState.res.LIGHT || 0) >= 1 || GameState.playedLightMini === true,
        onDone: () => { GameState.res.LIGHT = Math.max(GameState.res.LIGHT || 0, 6); },
        doneText: 'ได้แสงมาแล้ว! ✨'
      },

      /* ══════════════ ภารกิจที่ 4: เครื่องขั้นแสง ══════════════ */
      {
        k: 'obj',
        title: '💦 ภารกิจ 4 : ปั่นเครื่องขั้นแสง',
        desc: 'เดินไปที่ **เครื่องขั้นแสง** 🟡 แล้วกด <b>SPACE / E</b> เพื่อใส่น้ำเข้าเครื่อง\nเครื่องจะเปลี่ยนน้ำเป็น <b>ATP + NADPH</b> ให้อัตโนมัติ  ทำซ้ำจน <b>ATP ≥ 9</b>',
        check: () => (GameState.res.ATP || 0) >= 9,
        onDone: () => { GameState.res.ATP = Math.max(GameState.res.ATP || 0, 9); GameState.res.NADPH = Math.max(GameState.res.NADPH || 0, 6); },
        doneText: 'ATP + NADPH พร้อม! ⚡'
      },

      /* ── ขั้นต่อไป: คาลวิน ── */
      {
        k: 'cut', artFn: () => this._artCalvin(), speaker: 'หัวหน้าโรงงาน',
        text: 'เก่งมาก! ตอนนี้เรามี **ATP + NADPH + CO₂** ครบแล้ว\nเปิด **วัฏจักรคาลวิน** 🌀 กันเถอะ!',
        next: 'ไปปั่นคาลวิน! 🌀'
      },

      /* ══════════════ ภารกิจที่ 5: คาลวิน ══════════════ */
      {
        k: 'obj',
        title: '🌀 ภารกิจ 5 : เริ่มวัฏจักรคาลวิน',
        desc: 'เดินไปที่กลาง **วงคาลวิน** 🌀 แล้วกด <b>SPACE</b>\nเครื่องจะหมุนรอบ **G3P** และสะสมเป็น **น้ำตาล**',
        check: () => (GameState.totalCycles || 0) >= 1,
        onDone: () => {},
        doneText: 'หมุนคาลวินสำเร็จ! 🌀'
      },

      /* ── ขั้นต่อไป: กระต่าย ── */
      {
        k: 'cut', artFn: () => this._artRabbit(), speaker: 'หัวหน้าโรงงาน',
        text: 'คาลวินผลิต **น้ำตาล** ออกมาแล้ว!!\nสุดท้ายนี้.. ให้ **กระต่าย** 🐰 กินน้ำตาล\nแล้ววิ่งปั่นวงล้อสร้าง **ไฟฟ้า** ⚡ ให้ชาวบ้าน!',
        next: 'ป้อนน้ำตาล! 🥕',
        onDone: () => { GameState.res.SUGAR = Math.max(GameState.res.SUGAR || 0, 1); }
      },

      /* ══════════════ ภารกิจที่ 6: กระต่าย ══════════════ */
      {
        k: 'obj',
        title: '🐰 ภารกิจ 6 : ให้กระต่ายปั่นไฟ',
        desc: 'กดปุ่มสีส้ม **"🥕 ให้น้ำตาล (+15⚡)"** ในแถบซ้าย\nแล้วดูเจ้ากระต่ายวิ่งปั่นวงล้อ!!',
        check: () => (GameState.lastFeedAt || 0) > this._objStart,
        onDone: () => {},
        doneText: 'กระต่ายปั่นไฟ! ⚡🐰'
      },

      /* ══════════════ จบ: ฉลอง ── ══════════════ */
      {
        k: 'cut', artFn: () => this._artCelebrate(), speaker: 'ชาวบ้านทั้ง 4 ครอบครัว',
        text: '🎉 **ไฟกลับมาแล้ว!!!** 🎉\nบ้านเราสว่างอีกครั้ง!\nขอบคุณมากนะคะคุณวิศวกร!',
        next: 'ต่อไป ▶'
      },
      {
        k: 'cut', artFn: () => this._artWarning(), speaker: 'หัวหน้าโรงงาน',
        text: 'สุดท้าย... จำไว้นะ!  ⚡ **ไฟฟ้าจะค่อยๆ ลดลงทุกวินาที**\nต้อง **ขยันฟาร์ม**: เก็บ CO₂ → ปั่นขั้นแสง → คาลวิน → **ให้น้ำตาลกระต่าย**\n_อย่าปล่อยให้ไฟหมด!  ไม่งั้นชาวบ้านจะบุกมาด่าอีก!_',
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
    if (this._ov) this._ov.classList.remove('hidden');
    if (this._hud) this._hud.classList.add('hidden');
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
    if (this._hudTitle) this._hudTitle.innerText = st.title;
    if (this._hudDesc) this._hudDesc.innerHTML = st.desc;
    if (this._hudStep) this._hudStep.innerText = `ขั้น ${this._stepIdx + 1}/${this._steps.length} · กำลังฝึก`;
    if (this._hudSkip) this._hudSkip.onclick = () => this._skip();
    this._objStart = Date.now();
    this._currentStep = st;
    this._raf = requestAnimationFrame(() => this._checkStep(st));
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
    UI.updatePowerBar();
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
    UI.updatePowerBar();

    // ล็อกไฟฟ้าไม่ให้ลดระหว่างฝึก
    GameState.electricity = CONFIG.ELECTRICITY.MAX;

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
    GameState.tutorialActive = false;
    GameState.cutsceneActive = false;
    this.active = false;
    if (this._ov) this._ov.classList.add('hidden');
    if (this._hud) this._hud.classList.add('hidden');

    // ปล่อยไฟฟ้าเริ่มต้น หลังจบฝึกสอน
    GameState.electricity = CONFIG.ELECTRICITY.START;
    UI.updatePowerBar();
    UI.showToast('🎓 ฝึกสอนจบ! เหลือไฟตั้งต้น — อย่าปล่อยให้ไฟหมดนะ!', 5000);
  }
};