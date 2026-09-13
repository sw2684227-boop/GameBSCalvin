const LightMiniGame = {
  W: 720,
  H: 420,
  DURATION_MS: 15000,
  WIN_LIGHT: 5,
  MAX_GAUGE: 80,
  CATCH_DY: 44,
  SPAWN_START_MS: 850,

  active: false,
  _ov: null,
  _cnv: null,
  _ctx: null,
  _gaugeEl: null,
  _timerEl: null,
  _msgEl: null,
  _raf: 0,
  _targetX: 0,
  _catcherX: 0,
  _photons: [],
  _gauge: 0,
  _timeLeftMs: 0,
  _lastT: 0,
  _nextSpawnT: 0,
  _spawnGap: 0,

  open() {
    if (this.active) return;
    this._ov = document.getElementById('light-minigame-overlay');
    this._cnv = document.getElementById('lm-canvas');
    this._ctx = this._cnv.getContext('2d');
    this._gaugeEl = document.getElementById('lm-gauge');
    this._timerEl = document.getElementById('lm-timer');
    this._msgEl = document.getElementById('lm-msg');
    if (!this._ov || !this._cnv || !this._ctx) return;

    this._ov.classList.remove('hidden');
    this._ov.scrollTop = 0;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this._cnv.width = this.W * dpr;
    this._cnv.height = this.H * dpr;
    this._cnv.style.width = Math.round(this.W) + 'px';
    this._cnv.style.height = Math.round(this.H) + 'px';
    this._cnv.style.touchAction = 'none';

    this._targetX = this.W / 2;
    this._catcherX = this.W / 2;
    this._photons = [];
    this._gauge = 0;
    this._timeLeftMs = this.DURATION_MS;
    this._lastT = performance.now();
    this._nextSpawnT = this._lastT;
    this._spawnGap = this.SPAWN_START_MS;
    this.active = true;

    this._gaugeEl.style.width = '0%';
    this._msgEl.innerText = 'ขยับเมาส์/นิ้วให้อุปกรณ์จับโฟตอนที่ตกลงมา';
    this._msgEl.classList.remove('lm-flash');

    this._cnv.onpointermove = (e) => {
      const p = this._point(e);
      if (p) this._targetX = p.x;
    };
    this._cnv.onpointerdown = (e) => {
      const p = this._point(e);
      if (p) this._targetX = p.x;
      e.preventDefault();
    };

    const loop = (now) => {
      this._update(now);
      if (this.active) this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  },

  _point(e) {
    const rect = this._cnv.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const rawX = (e.clientX - rect.left) / rect.width;
    const rawY = (e.clientY - rect.top) / rect.height;
    if (rawX < 0 || rawX > 1 || rawY < 0 || rawY > 1) return null;
    return { x: rawX * this.W, y: rawY * this.H };
  },

  _update(now) {
    const dt = Math.min(0.05, (now - this._lastT) / 1000);
    this._lastT = now;
    this._timeLeftMs -= dt * 1000;
    this._timerEl.innerText = '⏱ ' + Math.max(0, this._timeLeftMs / 1000).toFixed(1) + ' วิ';

    while (now >= this._nextSpawnT) {
      this._spawnPhoto();
      this._nextSpawnT = now + this._spawnGap;
      this._spawnGap = Math.max(300, this._spawnGap - 30);
    }

    this._catcherX += (this._targetX - this._catcherX) * Math.min(1, dt * 12);

    for (let i = this._photons.length - 1; i >= 0; i--) {
      const ph = this._photons[i];
      if (ph.g) {
        ph.y += dt * 90;
        ph.g *= 1.02;
        if (ph.g > 16) this._photons.splice(i, 1);
        continue;
      }
      ph.wob += dt * ph.spin;
      ph.x += (ph.toX - ph.x) * dt * 0.8;
      ph.y += ph.vy * dt;
      const fx = ph.x + Math.sin(ph.wob) * 14;

      const rel = (this.H - this.CATCH_DY) - ph.y;
      if (rel < 0) {
        this._photons.splice(i, 1);
        continue;
      }
      const fly = ph.big ? ph.y + 8 : ph.y + 10;
      const d2 = Math.abs(fx - this._catcherX);
      const reach = ph.big ? 34 : 30;
      if (d2 < reach && rel < (ph.big ? 60 : 28)) {
        this._gauge = Math.min(this.MAX_GAUGE, this._gauge + (ph.big ? 18 : 6));
        this._gaugeEl.style.width = Math.min(100, (this._gauge / this.MAX_GAUGE) * 100) + '%';
        this._flash('+' + (ph.big ? 18 : 6), ph.big ? '#ffb84d' : '#ffe873');
        const trail = { x: fx, y: this.H - this.CATCH_DY + 4, g: 3 };
        this._photons.push(trail);
        this._photons.splice(i, 1);
      }
    }

    if (this._timeLeftMs <= 0) {
      this._finish();
      return;
    }
    this._draw();
  },

  _spawnPhoto() {
    const big = Math.random() < 0.2;
    const fromX = 24 + Math.random() * (this.W - 48);
    this._photons.push({
      x: fromX,
      y: -24,
      toX: fromX + (Math.random() * 140 - 70),
      big: big,
      vy: 85 + Math.random() * 65,
      wob: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 9
    });
  },

  _flash(txt, color) {
    const sp = document.createElement('span');
    sp.className = 'lm-lbl';
    sp.innerText = txt;
    sp.style.color = color;
    sp.style.left = ((this._catcherX / this.W) * 100) + '%';
    sp.style.top = '62%';
    this._ov.querySelector('.lm-frame').appendChild(sp);
    setTimeout(() => sp.remove(), 600);
  },

  _draw() {
    const ctx = this._ctx;
    const dpr = this._cnv.width / this.W;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const sky = ctx.createLinearGradient(0, 0, 0, this.H);
    sky.addColorStop(0, '#0a1530');
    sky.addColorStop(0.6, '#16224a');
    sky.addColorStop(1, '#0d1b3d');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.W, this.H);

    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 46; i++) {
      const sx = (i * 97.3) % this.W;
      const sy = (i * 61.7) % (this.H - this.CATCH_DY);
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    for (const ph of this._photons) {
      if (ph.g) {
        ctx.fillStyle = 'rgba(255,140,140,0.6)';
        ctx.beginPath();
        ctx.arc(ph.x, ph.y, ph.g, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      ctx.save();
      ctx.translate(ph.x + Math.sin(ph.wob) * 14, ph.y);
      ctx.rotate(Math.sin(ph.wob) * 0.35);
      ctx.shadowColor = '#ffd660';
      ctx.shadowBlur = 18;
      ctx.fillStyle = ph.big ? '#ffb84d' : '#ffe873';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(13, 4);
      ctx.lineTo(0, ph.big ? 16 : 9);
      ctx.lineTo(-13, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, this.H - this.CATCH_DY, this.W, this.CATCH_DY);
    ctx.fillStyle = '#2b3a5a';
    ctx.fillRect(0, this.H - this.CATCH_DY, this.W, 4);

    ctx.save();
    ctx.shadowColor = '#ffd660';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#ffd660';
    ctx.beginPath();
    ctx.moveTo(this._catcherX - 30, this.H - this.CATCH_DY);
    ctx.quadraticCurveTo(this._catcherX, this.H - this.CATCH_DY - 40, this._catcherX + 30, this.H - this.CATCH_DY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8a6a1a';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    if (this._gauge >= this.MAX_GAUGE) {
      ctx.fillStyle = 'rgba(255,232,115,0.08)';
      ctx.fillRect(0, 0, this.W, this.H);
    }
  },

  _finish() {
    this.active = false;
    cancelAnimationFrame(this._raf);
    const full = this._gauge >= this.MAX_GAUGE;
    const gained = full ? this.WIN_LIGHT : Math.floor(this._gauge / 25);
    GameState.res.LIGHT = Math.min(CONFIG.RESOURCES.LIGHT.max, (GameState.res.LIGHT || 0) + gained);
    UI.updateInventory();
    GameState.save();

    this._timerEl.innerText = '⏱ 0.0 วิ';
    this._wc = (this._wc || 0) + (full ? 1 : 0);
    this._msgEl.classList.add('lm-flash');
    if (full) {
      this._msgEl.innerText = '✨ เก็บแสงครบถัง! +' + gained + ' ☀️ (มีแสง = เร็ว ×4 ทุก 5 วิ)';
    } else {
      this._msgEl.innerText = '+' + gained + ' ☀️แสง — เติมถังให้เต็มเพื่อโบนัส +' + this.WIN_LIGHT + ' ☀️ (กดเปิดใหม่เพื่อเล่นอีก)';
    }
    setTimeout(() => { if (this._msgEl) this._msgEl.classList.remove('lm-flash'); }, 900);
    this._draw();
    this._cnv.onpointermove = null;
    this._cnv.onpointerdown = null;
  },

  close() {
    this.active = false;
    cancelAnimationFrame(this._raf);
    if (this._cnv) {
      this._cnv.onpointermove = null;
      this._cnv.onpointerdown = null;
    }
    if (this._ov) this._ov.classList.add('hidden');
  }
};