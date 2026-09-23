const MainScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function MainScene() { Phaser.Scene.call(this, 'main'); },

  init() {
    this.locDecor = { trees: [], factories: [], stations: [], paths: [], clouds: [], signs: [], pickups: [] };
    this.ringDecor = [];
  },

  preload() { 
    PixelAssets.generateAll(this); 
  },

  create() {
    GameState.phaserScene = this;
    this._userZoom = 1;
    this.cameras.main.setBounds(0, 0, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor(CONFIG.LOCATIONS.factory.bg);
    this.cameras.main.roundPixels = true;
    this._setupScale();
    document.addEventListener('fullscreenchange', () => this._onResize());
    document.addEventListener('webkitfullscreenchange', () => this._onResize());
    window.addEventListener('resize', () => this._onResize());

    GameState.load();

    this.loadMap('factory');
    Player.create(this, CONFIG.WORLD_WIDTH / 2, CONFIG.WORLD_HEIGHT / 2 + 100);
    CalvinCycle.buildInScene(this);
    this.guideGfx = this.add.graphics().setDepth(300);
    this.guideText = this.add.text(0, 0, '', {
      fontFamily: 'Prompt, Sarabun, sans-serif', fontSize: '13px', color: '#ffe873',
      stroke: '#0a150a', strokeThickness: 3
    }).setOrigin(0.5).setDepth(301);
    this.guideTarget = null;
    this._autoCheckNext = 0;
    this.cameras.main.startFollow(Player.sprite, true, 0.08, 0.08);

UI.updateInventory();
    UI.setLocation('factory');
    UI.renderForest();
    UI.updateCycleStats();
    this.time.delayedCall(300, () => {
      if (typeof UI !== 'undefined' && UI && typeof UI.showStartScreen === 'function') UI.showStartScreen();
    });

    if (typeof LightReaction !== 'undefined' && LightReaction.startProducer) {
      LightReaction.startProducer(this);
    }
    window.addEventListener('beforeunload', () => GameState.save());
  },

  _setupScale() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    if (this.scale) {
      this.scale.resolution = dpr;
      this.scale.refresh();
      const canvas = this.game && this.game.canvas;
      if (canvas) {
        canvas.style.imageRendering = 'auto';
        canvas.style.touchAction = 'none';
      }
    }
    const cam = this.cameras.main;
    cam.setBounds(0, 0, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT);
    const zoom = Math.max(
      this.scale.width / CONFIG.WORLD_WIDTH,
      this.scale.height / CONFIG.WORLD_HEIGHT
    ) * (this._userZoom || 1);
    cam.setZoom(zoom);
  },

  zoomBy(delta) {
    this._userZoom = Math.min(4, Math.max(0.5, (this._userZoom || 1) + delta));
    this._setupScale();
    if (UI && UI.showToast) {
      UI.showToast('🔍 ซูม ' + Math.round(this._userZoom * 100) + '%', 700);
    }
  },

  _onResize() {
    setTimeout(() => this._setupScale(), 120);
    setTimeout(() => this._setupScale(), 420);
  },

  _clearDecor() {
    if (this.sugarConveyorTween) {
      this.sugarConveyorTween.destroy();
      this.sugarConveyorTween = null;
    }
    if (this._bgTileObj) { this._bgTileObj = null; }
    if (this._machineLinkTweens) {
      this._machineLinkTweens.forEach(t => { if (t && t.destroy) t.destroy(); });
      this._machineLinkTweens = [];
    }
    const all = [
      ...this.locDecor.trees, ...this.locDecor.factories,
      ...this.locDecor.stations, ...this.locDecor.paths,
      ...this.locDecor.clouds, ...this.locDecor.signs,
      ...this.locDecor.pickups, ...this.ringDecor
    ];
    all.forEach(o => { if (o && o.destroy) o.destroy(); });
    this.locDecor = { trees: [], factories: [], stations: [], paths: [], clouds: [], signs: [], pickups: [] };
    this.ringDecor = [];
  },

  loadMap(locKey) {
    this._clearDecor();
    const loc = CONFIG.LOCATIONS[locKey];
    if (!loc) return;
    this.cameras.main.shake(400, 0.004);
    this.cameras.main.flash(500, 255, 255, 230);
    if (this._bgTileObj) { this._bgTileObj.destroy(); this._bgTileObj = null; }
    this._drawGroundTiles(locKey);
    this._buildScenery();
    const blocked = [];
    blocked.push(...this._buildFactoryDecor());
    this._buildLightReactionMachine();
    this._buildWaterPond();
    blocked.push(this._getCycleBlockRect());
    this._buildCo2Collector();
    this._buildSugarMachine();
    Player.setBlockedRects(blocked);
    if (Player.sprite) {
      this.tweens.killTweensOf(Player.sprite);
      Player.sprite.x = CONFIG.WORLD_WIDTH / 2;
      Player.sprite.y = CONFIG.WORLD_HEIGHT / 2 + 120;
      Player.sprite.alpha = 0;
      this.tweens.add({ targets: Player.sprite, alpha: 1, duration: 500, ease: 'Cubic.easeOut' });
      this.cameras.main.startFollow(Player.sprite, true, 0.08, 0.08);
    }
  },

  _drawGroundTiles(locKey) {
    const W = CONFIG.WORLD_WIDTH, H = CONFIG.WORLD_HEIGHT;
    const loc = CONFIG.LOCATIONS[locKey] || CONFIG.LOCATIONS.factory;
    // พื้นหญ้าลวดลาย TileSprite — เท็กซ์เจอร์ 1 ชิ้น กันซ้ำทั้งฉาก (โหลดเบามาก ไม่กินสเปก)
    if (this.textures && this.textures.exists('ground_factory')) {
      const ground = this.add.tileSprite(0, 0, W, H, 'ground_factory').setOrigin(0).setDepth(0);
      ground._bgTile = true;
      this._bgTileObj = ground;
      this.locDecor.paths.push(ground);
      return;
    }
    const ground = this.add.graphics().setDepth(0);
    ground._bgTile = true;
    this._bgTileObj = ground;
    ground.fillStyle(loc.bg, 1);
    ground.fillRect(0, 0, W, H);
    this.locDecor.paths.push(ground);
  },

  /* อบลวดลายนิ่งของแมพเป็นเท็กซ์เจอร์เดียว (วาดครั้งเดียว ทั้งฉาก = 1 draw call)
     พาท/เส้นเดิน, ดอกไม้, ก้อนหิน, พุ่มไม้, เห็ด, กอไม้, ขอบป่า, รังสีแสง */
  _buildScenery() {
    const W = CONFIG.WORLD_WIDTH, H = CONFIG.WORLD_HEIGHT;
    if (!this.textures.exists('map_scenery')) this._bakeSceneryTexture();
    const sp = this.add.image(0, 0, 'map_scenery').setOrigin(0).setDepth(1);
    this.locDecor.paths.push(sp);
  },

  _bakeSceneryTexture() {
    const W = CONFIG.WORLD_WIDTH, H = CONFIG.WORLD_HEIGHT;
    const cx = CONFIG.CYCLE_CENTER.x, cy = CONFIG.CYCLE_CENTER.y;
    const g = this.make.graphics({ add: false });

    // seeded random → ลวดลายเดิมทุกครั้ง ไม่เปลืองหน่วยความจำ
    let seed = 20240817;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

    const treePts = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      treePts.push({ x: cx + Math.cos(a) * 440, y: cy + Math.sin(a) * 440 });
    }
    const KEEPOUT = [
      { x: cx, y: cy, r: 415 },
      { x: 500, y: 260, r: 135 },
      { x: 1380, y: 280, r: 135 },
      { x: 280, y: 250, r: 115 },
      { x: 500, y: 780, r: 125 }
    ].concat(treePts.map(p => ({ x: p.x, y: p.y, r: 90 })));

    // ── 1. ขอบป่า: ดินคล้ำ + ยอดไม้เรียงรอบฉาก ──
    g.fillStyle(0x14381a, 0.6);
    g.fillRect(0, 0, W, 30); g.fillRect(0, H - 30, W, 30);
    g.fillRect(0, 0, 30, H); g.fillRect(W - 30, 0, 30, H);
    const canopy = (x, y, r) => {
      g.fillStyle(0x0e3d12, 1); g.fillCircle(x, y, r);
      g.fillStyle(0x1b5e20, 1); g.fillCircle(x, y - 2, r * 0.82);
      g.fillStyle(0x2e7d32, 0.9); g.fillCircle(x - r * 0.2, y - r * 0.3, r * 0.5);
      g.fillStyle(0x43a047, 0.7); g.fillCircle(x - r * 0.32, y - r * 0.46, r * 0.26);
    };
    for (let x = -8; x <= W + 8; x += 32) {
      const r1 = 22 + rnd() * 14;
      canopy(x + rnd() * 8, 8 + rnd() * 8, r1);
      canopy(x + rnd() * 8, H - 8 - rnd() * 8, r1);
    }
    for (let y = 34; y <= H - 34; y += 32) {
      const r1 = 22 + rnd() * 14;
      const pushed = rnd() * 6;
      canopy(8 + pushed, y, r1);
      canopy(W - 8 - pushed, y, r1);
    }

    // ── 2. รังสีแสงผ่านใบไม้ (จางๆ ทำให้แมพมีมิติ) ──
    for (let i = 0; i < 26; i++) {
      const x = 70 + rnd() * (W - 140), y = 70 + rnd() * (H - 140);
      g.fillStyle(0xfff9c4, 0.06 + rnd() * 0.04);
      g.fillEllipse(x, y, 70 + rnd() * 80, 44 + rnd() * 42);
    }

    // ── 4. กอหญ้า / ดอกไม้ / หิน / พุ่ม / ขอนไม้ / เห็ด ──
    const ok = (x, y, pad) => {
      if (x < 44 || y < 44 || x > W - 44 || y > H - 44) return false;
      for (let i = 0; i < KEEPOUT.length; i++) {
        const k = KEEPOUT[i];
        const dx = x - k.x, dy = y - k.y;
        if (dx * dx + dy * dy < (k.r + pad) * (k.r + pad)) return false;
      }
      return true;
    };

    const grassCols = [0x2e7d32, 0x388e3c, 0x43a047, 0x4caf50, 0x66bb6a];
    for (let tries = 0, placed = 0; tries < 300 && placed < 150; tries++) {
      const x = 50 + rnd() * (W - 100), y = 50 + rnd() * (H - 100);
      if (!ok(x, y, 8)) continue;
      const gc = grassCols[Math.floor(rnd() * grassCols.length)];
      for (let b = 0; b < 3; b++) {
        g.fillStyle(gc, 0.85);
        g.fillEllipse(x + (b - 1) * 3.6, y + b * 0.6, 3, 7 + (b % 2) * 2.5);
      }
      placed++;
    }

    const fcols = [0xffd3e8, 0xfff4b8, 0xffe873, 0xd0a0ff, 0xff9ec4, 0xaadcff];
    for (let tries = 0, placed = 0; tries < 110 && placed < 48; tries++) {
      const x = 50 + rnd() * (W - 100), y = 50 + rnd() * (H - 100);
      if (!ok(x, y, 10)) continue;
      const col = fcols[Math.floor(rnd() * fcols.length)];
      const r = 3.4 + rnd() * 1.8;
      g.lineStyle(1.5, 0x2e7d32, 0.9);
      g.beginPath(); g.moveTo(x, y + 2); g.lineTo(x, y + 9); g.strokePath();
      for (let a = 0; a < 5; a++) {
        const ang = (a / 5) * Math.PI * 2;
        g.fillStyle(col, 0.95);
        g.fillCircle(x + Math.cos(ang) * r, y + Math.sin(ang) * r, r * 0.72);
      }
      g.fillStyle(0xfff59d, 1);
      g.fillCircle(x, y, r * 0.55);
      placed++;
    }

    for (let tries = 0, placed = 0; tries < 60 && placed < 17; tries++) {
      const x = 60 + rnd() * (W - 120), y = 60 + rnd() * (H - 120);
      if (!ok(x, y, 14)) continue;
      const rw = 15 + rnd() * 13, rh = 10 + rnd() * 8;
      g.fillStyle(0x5a5a5a, 1); g.fillEllipse(x, y, rw, rh);
      g.fillStyle(0x767676, 1); g.fillEllipse(x - 3, y - 3, rw * 0.72, rh * 0.7);
      g.fillStyle(0xffffff, 0.3); g.fillEllipse(x - 4, y - 5, rw * 0.3, rh * 0.26);
      placed++;
    }

    for (let tries = 0, placed = 0; tries < 70 && placed < 20; tries++) {
      const x = 55 + rnd() * (W - 110), y = 55 + rnd() * (H - 110);
      if (!ok(x, y, 16)) continue;
      const r = 15 + rnd() * 10;
      g.fillStyle(0x0e3d12, 1); g.fillCircle(x, y, r);
      g.fillCircle(x + r * 0.85, y + r * 0.15, r * 0.8);
      g.fillStyle(0x1b5e20, 1); g.fillCircle(x, y - 2, r * 0.85);
      g.fillStyle(0x2e7d32, 0.95); g.fillCircle(x - r * 0.2, y - r * 0.25, r * 0.6);
      g.fillStyle(0x43a047, 0.85); g.fillCircle(x - r * 0.3, y - r * 0.4, r * 0.28);
      g.fillStyle(0x66bb6a, 0.7); g.fillCircle(x - r * 0.34, y - r * 0.48, r * 0.13);
      placed++;
    }

    for (let tries = 0, placed = 0; tries < 22 && placed < 5; tries++) {
      const x = 70 + rnd() * (W - 140), y = 70 + rnd() * (H - 140);
      if (!ok(x, y, 18)) continue;
      g.fillStyle(0x4a2e12, 1); g.fillRoundedRect(x, y, 44 + rnd() * 16, 13, 6);
      g.fillStyle(0x8b5a2b, 1); g.fillRoundedRect(x + 2, y + 2, 40 + rnd() * 16, 9, 5);
      g.fillStyle(0xa0722f, 0.9); g.fillEllipse(x + 10 + rnd() * 4, y + 4, 12, 4);
      g.lineStyle(1.5, 0x5c3a1a, 0.85);
      for (let ri = 0; ri < 3; ri++) {
        g.strokeEllipse(x + 12 + ri * 12, y + 6, 7, 4);
      }
      placed++;
    }

    for (let tries = 0, placed = 0; tries < 40 && placed < 9; tries++) {
      const x = 70 + rnd() * (W - 140), y = 70 + rnd() * (H - 140);
      if (!ok(x, y, 12)) continue;
      g.fillStyle(0xf5e6c8, 1); g.fillRoundedRect(x - 2.5, y - 2, 5, 9, 2);
      g.fillStyle(0xc62828, 1); g.fillEllipse(x, y - 4, 15, 9);
      g.fillStyle(0xe57373, 0.9); g.fillEllipse(x - 2, y - 5, 9, 5);
      g.fillStyle(0xffffff, 0.9); g.fillCircle(x - 3, y - 5, 1.7); g.fillCircle(x + 3, y - 3, 1.4);
      placed++;
    }

    // ── 5. กอต้นกก/แคทเทลรอบบ่อน้ำ ──
    const pond = CONFIG.WATER_POND;
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + rnd() * 0.5;
      const rr = pond.radius + 26 + rnd() * 16;
      const x = pond.x + Math.cos(a) * rr;
      const y = pond.y + 24 + Math.sin(a) * rr * 0.8;
      if (x < 40 || y < 40 || x > W - 40 || y > H - 40) continue;
      const h = 20 + rnd() * 12;
      g.lineStyle(2, 0x3a7a3a, 1);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 1, y - h); g.strokePath();
      g.fillStyle(0x6b4423, 1);
      g.fillEllipse(x + 1, y - h - 4, 7, 14);
      g.lineStyle(1.5, 0x2e7d32, 0.9);
      g.beginPath(); g.moveTo(x, y - h * 0.4); g.lineTo(x + 9, y - h * 0.75); g.strokePath();
      g.beginPath(); g.moveTo(x, y - h * 0.35); g.lineTo(x - 7, y - h * 0.6); g.strokePath();
    }

    g.generateTexture('map_scenery', W, H);
    g.destroy();
  },

  _buildFactoryDecor() {
    const b = [];
    b.push(...this._buildCentralFactory());
    if (typeof this._buildMapDecorations === 'function') {
      b.push(...this._buildMapDecorations());
    }
    return b;
  },

  _buildCentralFactory() {
    const cx = CONFIG.CYCLE_CENTER.x;
    const cy = CONFIG.CYCLE_CENTER.y;
    
    // พื้นที่โรงงานแบบเรียบง่าย - พื้นหลังสี่เหลี่ยมสีเทา
    const factory = this.add.graphics().setDepth(1);
    factory.fillStyle(0x3a3a3a, 1);
    factory.fillRect(cx - 350, cy - 305, 700, 610);
    factory.lineStyle(8, 0x5a5a5a, 1);
    factory.strokeRect(cx - 350, cy - 305, 700, 610);
    factory.fillStyle(0x2a2a2a, 1);
    factory.fillRect(cx - 40, cy - 400, 80, 100);
    factory.fillStyle(0x4a4a4a, 1);
    factory.fillRect(cx - 25, cy - 420, 50, 24);

    this.locDecor.paths.push(factory);

    // ไม่มี collision - ผู้เล่นเดินทะลุได้
    return [];
  },

  _buildMapDecorations() {
    const blocked = [];

    this._buildFireflies();
    this._buildFieldTrees();
    this.updateFieldForest();
    this._buildAmbientLife();
    return blocked;
  },

  // หิ่งห้อย/ละอองเรืองแสงลอยล่องช้าๆ ให้ภาพลื่นสบายตา
  _buildFireflies() {
    const spots = [
      { x: 360, y: 210, c: 0xffe27a }, { x: 760, y: 170, c: 0x9dff96 },
      { x: 1140, y: 190, c: 0xffe27a }, { x: 1440, y: 480, c: 0x9dff96 },
      { x: 200, y: 470, c: 0xffe27a }, { x: 1460, y: 700, c: 0xffe27a },
      { x: 170, y: 700, c: 0x9dff96 }, { x: 430, y: 760, c: 0x9dff96 },
      { x: 1200, y: 760, c: 0xffe27a }, { x: 640, y: 1020, c: 0x9dff96 },
      { x: 980, y: 1040, c: 0xffe27a }, { x: 300, y: 900, c: 0x9dff96 },
      { x: 1360, y: 1040, c: 0x9dff96 }, { x: 520, y: 340, c: 0xffe27a },
      { x: 900, y: 250, c: 0x9dff96 }, { x: 760, y: 640, c: 0xffe27a }
    ];
    spots.forEach((p, i) => {
      const f = this.add.circle(p.x, p.y, 2.6, p.c, 0.75).setDepth(16);
      const dx = 26 + (i % 4) * 10, dy = 18 + (i % 3) * 9;
      this.tweens.add({ targets: f, x: p.x + dx, duration: 2600 + (i % 5) * 430, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: f, y: p.y - dy, duration: 3100 + (i % 4) * 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: f, alpha: { from: 0.2, to: 0.95 }, duration: 1500 + (i % 6) * 270, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.locDecor.clouds.push(f);
    });
  },

  _getCycleBlockRect() {
    const cx = CONFIG.CYCLE_CENTER.x, cy = CONFIG.CYCLE_CENTER.y;
    return { x: cx - 30, y: cy - 30, w: 60, h: 60 };
  },

  // สิ่งมีชีวิต/บรรยากาศ: ผีเสื้อ 2 ตัว + เมฆลอยช้าๆ (tween น้อยที่สุด)
  _buildAmbientLife() {
    const butterflies = [
      { x: 430, y: 500, tex: 'butterfly_a' },
      { x: 1140, y: 720, tex: 'butterfly_b' }
    ];
    butterflies.forEach((s, i) => {
      const b = this.add.image(s.x, s.y, s.tex).setDepth(30);
      this.tweens.add({ targets: b, x: s.x + 90 + i * 40, duration: 5200 + i * 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: b, y: s.y - 60 + i * 30, duration: 4300 + i * 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: b, scaleX: { from: 1, to: 0.35 }, duration: 340 + i * 60, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.locDecor.clouds.push(b);
    });

    const clouds = [
      { x: 300, y: 170, s: 1.5, a: 0.32 },
      { x: 1090, y: 150, s: 1.15, a: 0.28 },
      { x: 640, y: 980, s: 1.35, a: 0.3 },
      { x: 1360, y: 860, s: 1.05, a: 0.26 }
    ];
    clouds.forEach((c, i) => {
      const sp = this.add.image(c.x, c.y, 'cloud').setDepth(30).setScale(c.s).setAlpha(c.a);
      this.tweens.add({ targets: sp, x: c.x + 70 + i * 18, duration: 16000 + i * 4500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.locDecor.clouds.push(sp);
    });
  },

  _buildLightReactionMachine() {
    const cfg = CONFIG.LIGHT_MACHINE_WORLD;
    const x = cfg.x;
    const y = cfg.y;
    const width = cfg.width;
    const height = cfg.height;
    const g = this.add.graphics().setDepth(6);

    g.fillStyle(0x1a0f08, 1);
    g.fillRect(x - width / 2, y + 22, width, height - 18);
    g.fillStyle(0x3a2a1a, 1);
    g.fillRect(x - width / 2 + 10, y + 12, width - 20, 12);
    g.fillStyle(0x2a1f08, 1);
    g.fillRect(x - width / 2 + 8, y + 10, width - 16, height - 28);
    g.fillStyle(0xffe74a, 0.12);
    g.fillRect(x - width / 2 + 16, y + 18, width - 32, height - 38);

    const panelW = width * 0.52;
    const panelH = height * 0.34;
    const panelX = x - width / 2 + 18;
    const panelY = y + 18;
    g.fillStyle(0x1a3a5a, 1);
    g.fillRect(panelX, panelY, panelW, panelH);
    g.lineStyle(2, 0xffe74a, 0.9);
    g.strokeRect(panelX, panelY, panelW, panelH);
    g.lineStyle(1, 0x5ad3ff, 0.75);
    for (let i = 1; i < 4; i++) {
      g.lineBetween(panelX + panelW * i / 4, panelY, panelX + panelW * i / 4, panelY + panelH);
    }
    for (let i = 1; i < 3; i++) {
      g.lineBetween(panelX, panelY + panelH * i / 3, panelX + panelW, panelY + panelH * i / 3);
    }

    const tankX = x + width * 0.58;
    const tankW = width * 0.3;
    const tankH = height * 0.52;
    g.fillStyle(0x16324a, 1);
    g.fillRect(tankX, y + 18, tankW, tankH);
    g.lineStyle(3, 0x5ad3ff, 1);
    g.strokeRect(tankX, y + 18, tankW, tankH);
    g.fillStyle(0x3a9abf, 0.82);
    g.fillRect(tankX + 5, y + tankH * 0.42, tankW - 10, tankH * 0.48);
    g.lineStyle(1, 0xaadcff, 0.7);
    g.lineBetween(tankX + 10, y + tankH * 0.52, tankX + tankW - 10, y + tankH * 0.52);
    g.lineBetween(tankX + 10, y + tankH * 0.68, tankX + tankW - 10, y + tankH * 0.68);

    g.fillStyle(0x5c3a1a, 1);
    g.fillRect(x - 22, y + height - 16, 44, 10);
    g.fillStyle(0xffe74a, 1);
    g.fillRect(x - 14, y + height - 12, 28, 4);

    const status = this.add.circle(x + width / 2, y + height * 0.72, 8, 0xff4444, 1).setDepth(7);
    this.tweens.add({
      targets: status, alpha: { from: 0.35, to: 1 }, duration: 850, yoyo: true, repeat: -1
    });

    const label = this.add.text(x, y - height / 2 - 20, cfg.label, {
      fontFamily: 'Prompt, Sarabun, sans-serif', fontSize: '12px', color: '#ffe78a',
      align: 'center', stroke: '#1a0f05', strokeThickness: 3
    }).setOrigin(0.5).setDepth(11);

    const zone = this.add.zone(x, y + 14, width, height).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => { if (window.TouchBlockedByUI) return; UI.openMachinePanel('light'); });
    zone.on('pointerover', () => { if (window.TouchBlockedByUI) return; this.cameras.main.flash(70, 255, 231, 74); });
    this.locDecor.paths.push(g, label, status, zone);
    this.lightMachineZone = zone;
    this.lightMachineStatus = status;
    this.lightMachineTankLabel = this.add.text(tankX + tankW / 2, y + tankH + 34, '📦 น้ำในกล่อง 0/20', {
      fontFamily: 'Prompt, Sarabun, sans-serif', fontSize: '12px', color: '#aadcff',
      stroke: '#0a1530', strokeThickness: 2, align: 'center'
    }).setOrigin(0.5).setDepth(12);
    this.locDecor.signs.push(this.lightMachineTankLabel);
  },

  updateLightMachineTank(amount, capacity, isRunning) {
    if (!this.lightMachineTankLabel) return;
    this.lightMachineTankLabel.setText(`📦 น้ำในกล่อง ${amount}/${capacity}`);
    this.lightMachineTankLabel.setColor(isRunning ? '#d0ffb0' : '#aadcff');
    if (this.lightMachineStatus) this.lightMachineStatus.setFillStyle(isRunning ? 0x5fff5f : 0xff4444, 1);
  },

  setGuide(x, y, label) {
    this.guideTarget = (x === null || x === undefined) ? null : { x, y, label: label || '' };
    if (this.guideText) this.guideText.setText(this.guideTarget ? (this.guideTarget.label || '') : '');
  },

  clearGuide() {
    this.setGuide(null, null, null);
  },

  _updateGuide(time) {
    const g = this.guideGfx;
    if (!g) return;
    g.clear();
    const modalOpen = typeof document !== 'undefined' && document.body && document.body.classList.contains('ui-modal-open');
    if (!this.guideTarget || !Player.sprite || modalOpen) return;
    const tx = this.guideTarget.x;
    const ty = this.guideTarget.y;
    const px = Player.sprite.x;
    const py = Player.sprite.y;
    const d = Phaser.Math.Distance.Between(px, py, tx, ty);
    if (d > 130) {
      const ang = Math.atan2(ty - py, tx - px);
      const bob = Math.sin(time / 170) * 7;
      const ax = px + Math.cos(ang) * 70;
      const ay = py - 24 + Math.sin(ang) * 70 + bob;
      const s = 14;
      g.save();
      g.translateCanvas(ax, ay);
      g.rotateCanvas(ang);
      g.fillStyle(0xffe873, 0.95);
      g.fillTriangle(0, -s, s * 0.9, s * 0.72, -s * 0.9, s * 0.72);
      g.lineStyle(3, 0x2a1a05, 1);
      g.strokeTriangle(0, -s, s * 0.9, s * 0.72, -s * 0.9, s * 0.72);
      g.restore();
      const pulse = 0.5 + 0.5 * Math.sin(time / 280);
      g.lineStyle(3, 0xffe873, 0.3 + pulse * 0.45);
      g.strokeCircle(tx, ty, 34 + pulse * 12);
    }
  },

  _updateAutoCycle(time) {
    if (!GameState.autoCycle) return;
    const tutBusy = (typeof Tutorial !== 'undefined' && Tutorial && Tutorial.active) || (typeof GameState !== 'undefined' && GameState.tutorialActive);
    if (tutBusy) return;
    if (!this._autoCheckNext || time > this._autoCheckNext) {
      this._autoCheckNext = time + 700;
      if (GameState.isCycleRunning || (CalvinCycle && CalvinCycle.actionInProgress)) return;
      if (CalvinCycle && CalvinCycle._pendingAutoRestart) return;
      if ((GameState.co2Loaded || 0) < CONFIG.CO2_PER_CYCLE) {
        const missing = CONFIG.CO2_PER_CYCLE - (GameState.co2Loaded || 0);
        const have = GameState.res.CO2 || 0;
        if (have >= missing) {
          GameState.res.CO2 -= missing;
          GameState.co2Loaded = CONFIG.CO2_PER_CYCLE;
          UI.updateInventory();
          if (CalvinCycle && CalvinCycle._updateDockLabels) CalvinCycle._updateDockLabels();
        }
      }
      if (CalvinCycle && CalvinCycle.canStart && CalvinCycle.canStart()) {
        if (typeof SFX !== 'undefined' && SFX.play) SFX.play('phase');
        CalvinCycle.startCycle();
      }
    }
  },

  _updateFreeGuide(time) {
    const tutBusy = (typeof Tutorial !== 'undefined' && Tutorial && Tutorial.active) || (typeof GameState !== 'undefined' && GameState.tutorialActive);
    if (tutBusy) return;
    if (typeof UI !== 'undefined' && UI.forestComplete && UI.forestComplete()) {
      if (this.guideTarget) this.clearGuide();
      return;
    }
    if (!this._guideFreeNext || time > this._guideFreeNext) {
      this._guideFreeNext = time + 800;
      const res = GameState.res || {};
      if ((GameState.sugarReady || 0) > 0) {
        const s = CONFIG.SUGAR_MACHINE;
        this.setGuide(s.x, s.y, '🍬 เก็บน้ำตาลที่เครื่องบรรจุ');
        return;
      }
      if (CONFIG.FOREST && (res.SUGAR || 0) >= (CONFIG.FOREST.SUGAR_PER_FEED || 1)) {
        const trees = GameState.forest.trees || [];
        let best = -1, bd = Infinity;
        for (let i = 0; i < trees.length; i++) {
          if (trees[i] >= CONFIG.FOREST.STAGES) continue;
          const h = (this.fieldTreeObjs && this.fieldTreeObjs[i]) ? this.fieldTreeObjs[i].holder : null;
          if (!h) continue;
          const d = Phaser.Math.Distance.Between(Player.sprite.x, Player.sprite.y, h.x, h.y);
          if (d < bd) { bd = d; best = i; }
        }
        if (best >= 0) {
          const h = this.fieldTreeObjs[best].holder;
          this.setGuide(h.x, h.y, '🌱 ให้ต้นที่ ' + (best + 1) + ' กินน้ำตาล');
          return;
        }
      }
      this.clearGuide();
    }
  },

  _buildWaterPond() {
    const cfg = CONFIG.WATER_POND;
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(0x2a5a3a, 1);
    g.fillEllipse(cfg.x, cfg.y + 8, cfg.radius * 2 + 22, cfg.radius * 1.8 + 22);
    g.fillStyle(CONFIG.COLORS.water, 1);
    g.fillEllipse(cfg.x, cfg.y + 8, cfg.radius * 2, cfg.radius * 1.6);
    g.lineStyle(4, 0x2a5a9f, 1);
    g.strokeEllipse(cfg.x, cfg.y + 8, cfg.radius * 2, cfg.radius * 1.6);
    g.lineStyle(2, 0xaadcff, 0.8);
    for (let i = 0; i < 7; i++) {
      const wx = cfg.x - cfg.radius + i * 22;
      g.lineBetween(wx, cfg.y - 14 + (i % 2) * 10, wx + 14, cfg.y - 20 + (i % 2) * 10);
    }
    for (let i = 0; i < 5; i++) {
      const lx = cfg.x + (i - 2) * 24;
      const ly = cfg.y + (i % 2 === 0 ? -18 : 16);
      this.add.image(lx, ly, 'lily_pad').setScale(0.75 + (i % 2) * 0.12).setDepth(6);
    }

    const source = this.add.zone(cfg.x, cfg.y, cfg.radius * 2, cfg.radius * 1.6).setInteractive({ useHandCursor: true });
    source.on('pointerdown', () => { if (window.TouchBlockedByUI) return; this._collectWaterFromPond(); });
    this.locDecor.pickups.push(source);
    this.waterPondZone = source;
    this.waterPondGfx = g;

    const hint = this.add.text(cfg.x, cfg.y - cfg.radius - 28, '🌊 บ่อน้ำ H₂O\nกด SPACE หรือแตะตักน้ำ', {
      fontFamily: 'Prompt, Sarabun, sans-serif', fontSize: '15px', color: '#aadcff',
      stroke: '#0a1530', strokeThickness: 2, align: 'center'
    }).setOrigin(0.5).setDepth(15);
    this.locDecor.signs.push(hint);

  },

  _collectWaterFromPond() {
    if (!this) return;
    const pond = CONFIG.WATER_POND;
    if (!Player.sprite || Phaser.Math.Distance.Between(Player.sprite.x, Player.sprite.y, pond.x, pond.y) > pond.radius + 24) {
      UI.showToast('💡 เดินไปที่บ่อน้ำก่อน แล้วกด SPACE เพื่อตักน้ำ', 1500);
      return;
    }
    const amt = 2;
    const cap = CONFIG.RESOURCES.WATER.max || 999;
    GameState.res.WATER = Math.min(cap, (GameState.res.WATER || 0) + amt);
    GameState.waterGathers = (GameState.waterGathers || 0) + 1;
    this.cameras.main.flash(120, 120, 220, 255);
    this.tweens.add({
      targets: this.waterPondZone, alpha: { from: 0.72, to: 1 }, scale: { from: 0.96, to: 1 },
      duration: 220, yoyo: true
    });
    UI.updateInventory();
    GameState.save();
    if (typeof SFX !== 'undefined' && SFX.play) SFX.play('water');
    UI.showToast(`✨ ตัก H₂O +${amt} → เอาไปใส่เครื่องขั้นแสง`, 1300);
  },

  _buildCo2Collector() {
    const cfg = CONFIG.CO2_COLLECTOR;
    const g = this.add.graphics().setDepth(5);

    // เครื่องจักรดูด CO₂ จากอากาศ
    g.fillStyle(0x263b4d, 1);
    g.fillRoundedRect(cfg.x - 58, cfg.y - 44, 116, 88, 10);
    g.lineStyle(3, 0x87ceeb, 1);
    g.strokeRoundedRect(cfg.x - 58, cfg.y - 44, 116, 88, 10);
    g.fillStyle(0x87ceeb, 0.24);
    g.fillCircle(cfg.x, cfg.y - 4, 26);
    g.lineStyle(3, 0xc8eeff, 0.9);
    g.strokeCircle(cfg.x, cfg.y - 4, 26);

    // เพิ่มแถบสถานะ CO₂ ในเครื่อง
    this._co2MachineBar = this.add.graphics().setDepth(6);
    this._co2MachineAmount = 0;
    this._updateCo2MachineBar();

    const zone = this.add.zone(cfg.x, cfg.y, 116, 88).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => { if (window.TouchBlockedByUI) return; this._collectCo2FromStation(); });
    const secs = Math.round(this._co2ProduceMs() / 1000);
    const label = this.add.text(cfg.x, cfg.y - 72, `🌿 เครื่องดูด CO₂\nผลิต 1CO₂/${secs} วิ | SPACE รับ`, {
      fontFamily: 'Prompt, Sarabun, sans-serif', fontSize: '15px', color: '#c8eeff',
      stroke: '#0a1530', strokeThickness: 2, align: 'center'
    }).setOrigin(0.5).setDepth(15);
    this._co2MachineLabel = label;

    this._setCo2ProduceSpeed();

    this.locDecor.paths.push(g, zone);
    this.locDecor.signs.push(label);
  },

  _co2ProduceMs() {
    const cfg = CONFIG.CO2_COLLECTOR;
    let tutDone = false;
    try { tutDone = !!localStorage.getItem('calvin_tutorial_done'); } catch (e) { tutDone = false; }
    return (tutDone && cfg.produceMsFast) ? cfg.produceMsFast : (cfg.produceMs || 3000);
  },

  _setCo2ProduceSpeed() {
    if (this._co2ProduceEvent) { this._co2ProduceEvent.remove(); this._co2ProduceEvent = null; }
    if (this._co2MachineLabel) {
      const secs = Math.round(this._co2ProduceMs() / 1000);
      this._co2MachineLabel.setText(`🌿 เครื่องดูด CO₂\nผลิต 1CO₂/${secs} วิ | SPACE รับ`);
    }
    this._co2ProduceEvent = this.time.addEvent({
      delay: this._co2ProduceMs(),
      loop: true,
      callback: () => {
        this._co2MachineAmount = Math.min(99, (this._co2MachineAmount || 0) + 1);
        this._updateCo2MachineBar();
      }
    });
  },

  _updateCo2MachineBar() {
    if (!this._co2MachineBar) return;
    const cfg = CONFIG.CO2_COLLECTOR;
    this._co2MachineBar.clear();
    
    // พื้นหลังแถบ
    this._co2MachineBar.fillStyle(0x1a1a1a, 0.8);
    this._co2MachineBar.fillRoundedRect(cfg.x - 50, cfg.y + 30, 100, 12, 4);
    
    // แถบเต็ม
    const fillWidth = Math.floor((this._co2MachineAmount / 99) * 94);
    if (fillWidth > 0) {
      this._co2MachineBar.fillStyle(0x87ceeb, 1);
      this._co2MachineBar.fillRoundedRect(cfg.x - 47, cfg.y + 33, fillWidth, 6, 3);
    }
    
    // ข้อความจำนวน (reuse ตัวเดิม ไม่สร้างใหม่ทุกวินาที เพื่อลด lag)
    if (!this._co2MachineText) {
      this._co2MachineText = this.add.text(cfg.x, cfg.y + 50, '', {
        fontFamily: 'Prompt, Sarabun, sans-serif', fontSize: '12px', color: '#c8eeff',
        stroke: '#0a1530', strokeThickness: 2
      }).setOrigin(0.5).setDepth(16);
    }
    this._co2MachineText.setText(`CO₂: ${this._co2MachineAmount}`);
  },

  _collectCo2FromStation() {
    if (!this) return;
    const cfg = CONFIG.CO2_COLLECTOR;
    if (!Player.sprite || Phaser.Math.Distance.Between(Player.sprite.x, Player.sprite.y, cfg.x, cfg.y) > cfg.radius + 24) {
      UI.showToast('💡 เดินไปที่เครื่องดูด CO₂ ก่อน แล้วกด SPACE', 1500);
      return;
    }
    
    const earlyLeft = (CONFIG.CO2_COLLECTOR.earlyCollects || 6) - (GameState.co2Collects || 0);
    let amount;
    if (earlyLeft > 0) {
      amount = Math.min(this._co2MachineAmount || 0, CONFIG.CO2_COLLECTOR.earlyAmount || 1);
    } else {
      amount = this._co2MachineAmount || 0;
    }
    if (amount === 0) {
      UI.showToast('⏳ เครื่องยังไม่มี CO₂ รอสักครู่...', 1300);
      return;
    }

    GameState.res.CO2 = Math.min(CONFIG.RESOURCES.CO2.max, (GameState.res.CO2 || 0) + amount);
    GameState.co2Collects = (GameState.co2Collects || 0) + 1;
    this._co2MachineAmount = Math.max(0, (this._co2MachineAmount || 0) - amount);
    this._updateCo2MachineBar();
    this.cameras.main.flash(120, 180, 230, 255);
    UI.updateInventory();
    GameState.save();
    if (typeof SFX !== 'undefined' && SFX.play) SFX.play('pickup');
    const earlyAfter = (CONFIG.CO2_COLLECTOR.earlyCollects || 6) - (GameState.co2Collects || 0);
    if (earlyAfter > 0) {
      UI.showToast(`🌿 เก็บ CO₂ +${amount} (ทีละ 1 · เหลืออีก ${earlyAfter} ครั้งในช่วงสอน) → เอาไปใส่เครื่องคาลวิน`, 2000);
    } else {
      UI.showToast(`🌿 รับ CO₂ +${amount} จากเครื่องดูดอากาศ`, 1300);
    }
  },

  _buildFieldTrees() {
    this.fieldTreeObjs = [];
    const cx = CONFIG.CYCLE_CENTER.x, cy = CONFIG.CYCLE_CENTER.y;
    const pentagon = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      pentagon.push({ x: cx + Math.cos(a) * 440, y: cy + Math.sin(a) * 440 });
    }
    pentagon.forEach((p, i) => {
      const rscale = 0.85 + Math.random() * 0.3; // สุ่มขนาดต้นไม้แต่ละต้น 85%-115%
      const mound = this.add.graphics().setDepth(7);
      mound.fillStyle(0x3a5a20, 0.65);
      mound.fillEllipse(0, 28, 78, 16);
      const tree = this.add.image(0, 26, 'tree_0').setOrigin(0.5, 1).setDepth(8).setScale(0.5 * rscale);
      const spk = this.add.text(0, -54, '', { fontSize: '16px' }).setOrigin(0.5).setDepth(10);
      const hint = this.add.text(0, -78, '🍬 กด SPACE ให้น้ำตาล', {
        fontFamily: 'Prompt, Sarabun, sans-serif', fontSize: '13px', color: '#ffe873',
        stroke: '#0a150a', strokeThickness: 3, align: 'center'
      }).setOrigin(0.5).setDepth(10).setAlpha(0);
      const label = this.add.text(0, 54, `ต้นที่ ${i + 1}`, {
        fontFamily: 'Prompt, Sarabun, sans-serif', fontSize: '12px', color: '#ffe873',
        stroke: '#0a150a', strokeThickness: 3
      }).setOrigin(0.5).setDepth(9);
      const zone = this.add.zone(p.x, p.y, 110, 120).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        if (window.TouchBlockedByUI) return;
        UI.feedTree(i);
      });
      const holder = this.add.container(p.x, p.y, [mound, tree, spk, hint, label]).setDepth(8);
      this.locDecor.factories.push(holder, zone);
      this.fieldTreeObjs.push({ holder, tree, spk, hint, zone, idx: i, rscale, mound });
    });
  },

  updateFieldForest() {
    const trees = GameState.forest.trees || [];
    const stageStyle = [
      null,
      { t: 'tree_0', s: 0.4 },  // 1 เมล็ด
      { t: 'tree_0', s: 0.52 }, // 2 กล้า
      { t: 'tree_1', s: 0.72 }, // 3 ต้นอ่อน
      { t: 'tree_2', s: 0.95 }, // 4 กำลังโต
      { t: 'tree_2', s: 1.18 }  // 5 สมบูรณ์
    ];
    let done = 0;
    (this.fieldTreeObjs || []).forEach((t, i) => {
      const lv = Math.max(CONFIG.FOREST.INITIAL_LEVEL, Math.min(CONFIG.FOREST.STAGES, trees[i] || CONFIG.FOREST.INITIAL_LEVEL));
      const st = stageStyle[lv] || stageStyle[CONFIG.FOREST.STAGES];
      t.tree.setTexture(st.t).setScale(st.s * (t.rscale || 1));
      if (t.mound) t.mound.setScale(0.5 + st.s * 0.6);
      t.spk.setText(lv >= CONFIG.FOREST.STAGES ? '✨' : '');
      if (t.hint) {
        const canFeed = !UI.forestComplete() && lv < CONFIG.FOREST.STAGES;
        t.hint.setVisible(canFeed);
      }
      if (lv >= CONFIG.FOREST.STAGES) done++;
    });
  },

  updateFieldTreeHints() {
    if (!Player.sprite || !this.fieldTreeObjs) return;
    const sugarOk = (GameState.res.SUGAR || 0) >= CONFIG.FOREST.SUGAR_PER_FEED;
    (this.fieldTreeObjs || []).forEach(t => {
      if (!t.hint) return;
      const d = Phaser.Math.Distance.Between(Player.sprite.x, Player.sprite.y, t.holder.x, t.holder.y);
      const show = d < 95 && sugarOk && !UI.forestComplete();
      t.hint.setAlpha(show ? 1 : 0);
    });
  },

  _buildSugarMachine() {
    const cfg = CONFIG.SUGAR_MACHINE;
    this._buildSugarConveyor();
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(0x4a3018, 1);
    g.fillRoundedRect(cfg.x - 70, cfg.y - 50, 140, 100, 10);
    g.lineStyle(3, 0xffaa55, 1);
    g.strokeRoundedRect(cfg.x - 70, cfg.y - 50, 140, 100, 10);
    g.fillStyle(0x2a1a0a, 1);
    g.fillRect(cfg.x - 50, cfg.y - 30, 100, 40);
    g.lineStyle(2, 0xffcc88, 0.7);
    g.strokeRect(cfg.x - 50, cfg.y - 30, 100, 40);
    g.fillStyle(0xffaa55, 0.35);
    g.fillCircle(cfg.x, cfg.y - 10, 14);
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(cfg.x - 58, cfg.y + 36, 20, 14);
    g.fillRect(cfg.x + 38, cfg.y + 36, 20, 14);

    const label = this.add.text(cfg.x, cfg.y - 74, '🍬 ' + cfg.label + '\nแตะเพื่อดูภายใน | ⚡ เก็บ', {
      fontFamily: 'Prompt, Sarabun, sans-serif', fontSize: '14px', color: '#ffcc88',
      stroke: '#1a0f05', strokeThickness: 3, align: 'center',
      wordWrap: { width: 180, useAdvancedWrap: true }
    }).setOrigin(0.5).setDepth(15);
    const status = this.add.text(cfg.x, cfg.y + 72, '', {
      fontFamily: 'Prompt, Sarabun, sans-serif', fontSize: '12px', color: '#ffe873',
      stroke: '#1a0f05', strokeThickness: 2, align: 'center',
      wordWrap: { width: 170, useAdvancedWrap: true }
    }).setOrigin(0.5).setDepth(15);
    this.sugarMachineStatus = status;
    this._updateSugarMachineStatus();

    const zone = this.add.zone(cfg.x, cfg.y, 140, 110).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => { if (window.TouchBlockedByUI) return; UI.openMachinePanel('sugar'); });
    zone.on('pointerover', () => { if (window.TouchBlockedByUI) return; this.cameras.main.flash(70, 255, 170, 80); });
    this.locDecor.paths.push(g, zone);
    this.locDecor.signs.push(label, status);
    this.sugarMachineZone = zone;
  },

  _buildConveyor(from, to, opts) {
    opts = opts || {};
    const depth = opts.depth != null ? opts.depth : 4;
    const hw = opts.hw != null ? opts.hw : 14;
    const speedMs = opts.speedMs != null ? opts.speedMs : 16000;
    const accent = opts.accent != null ? opts.accent : 0xc89050;
    const glow = opts.glow != null ? opts.glow : 0xffd75e;
    const dx = to.x - from.x, dy = to.y - from.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 8) return null;
    const ang = Math.atan2(dy, dx);
    const nx = -Math.sin(ang), ny = Math.cos(ang);
    const pts = Math.max(12, Math.floor(dist / 20));
    const objs = [];

    const frame = this.add.graphics().setDepth(depth - 1);
    frame.fillStyle(0x0e0804, 0.6);
    frame.fillRoundedRect(from.x - hw - 10, from.y - hw - 6, (hw + 10) * 2, (hw + 10) * 2 + 10, 9);
    frame.fillRoundedRect(to.x - hw - 10, to.y - hw - 6, (hw + 10) * 2, (hw + 10) * 2 + 10, 9);
    objs.push(frame);

    const rail = this.add.graphics().setDepth(depth);
    const e1 = { x: from.x + nx * hw, y: from.y + ny * hw };
    const e2 = { x: to.x + nx * hw, y: to.y + ny * hw };
    const e3 = { x: from.x - nx * hw, y: from.y - ny * hw };
    const e4 = { x: to.x - nx * hw, y: to.y - ny * hw };
    rail.lineStyle(10, 0x120a05, 1);
    rail.beginPath(); rail.moveTo(e1.x, e1.y); rail.lineTo(e2.x, e2.y); rail.strokePath();
    rail.beginPath(); rail.moveTo(e3.x, e3.y); rail.lineTo(e4.x, e4.y); rail.strokePath();
    rail.lineStyle(7, 0x6b4423, 1);
    rail.beginPath(); rail.moveTo(e1.x, e1.y); rail.lineTo(e2.x, e2.y); rail.strokePath();
    rail.beginPath(); rail.moveTo(e3.x, e3.y); rail.lineTo(e4.x, e4.y); rail.strokePath();
    rail.lineStyle(3, accent, 0.95);
    rail.beginPath(); rail.moveTo(e1.x - nx, e1.y - ny); rail.lineTo(e2.x - nx, e2.y - ny); rail.strokePath();
    rail.beginPath(); rail.moveTo(e3.x + nx, e3.y + ny); rail.lineTo(e4.x + nx, e4.y + ny); rail.strokePath();
    rail.lineStyle(9, 0x1a0f08, 1);
    rail.beginPath(); rail.moveTo(from.x, from.y); rail.lineTo(to.x, to.y); rail.strokePath();
    rail.lineStyle(4, 0x4a3220, 1);
    rail.beginPath(); rail.moveTo(from.x, from.y); rail.lineTo(to.x, to.y); rail.strokePath();
    rail.lineStyle(1, accent, 0.35);
    rail.beginPath(); rail.moveTo(from.x, from.y); rail.lineTo(to.x, to.y); rail.strokePath();
    objs.push(rail);

    [from, to].forEach((p) => {
      const e = this.add.circle(p.x, p.y, hw + 6, 0x5c3a1a).setDepth(depth);
      e.setStrokeStyle(3, accent, 0.95);
      objs.push(e);
      const hub = this.add.circle(p.x, p.y, 7, 0x2a1808).setDepth(depth + 1);
      hub.setStrokeStyle(2, glow, 0.8);
      objs.push(hub);
      const hubTw = this.tweens.add({ targets: hub, scale: { from: 1, to: 1.18 }, alpha: { from: 0.7, to: 1 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      objs.push({ destroy: () => { if (hubTw) hubTw.destroy(); } });
    });

    const postCount = Math.max(2, Math.min(6, Math.floor(dist / 90)));
    for (let i = 1; i <= postCount; i++) {
      const t = i / (postCount + 1);
      const px = from.x + dx * t, py = from.y + dy * t;
      const side = i % 2 === 0 ? 1 : -1;
      const post = this.add.rectangle(px + nx * (hw + 7) * side, py + ny * (hw + 7) * side, 7, 18, 0x3a2410).setDepth(depth - 1);
      post.rotation = ang;
      objs.push(post);
      const cap = this.add.circle(px + nx * (hw + 7) * side, py + ny * (hw + 7) * side, 4, accent, 0.85).setDepth(depth);
      objs.push(cap);
    }

    const tileSprites = [];
    for (let i = 0; i < pts; i++) {
      const t = i / (pts - 1);
      const px = from.x + dx * t;
      const py = from.y + dy * t;
      const seg = this.add.rectangle(px, py, 16, hw * 2 - 5, 0x5c3a1a).setDepth(depth + 1);
      seg.setStrokeStyle(2, 0x2a1a0a, 1);
      seg.rotation = ang;
      tileSprites.push(seg);
      objs.push(seg);
    }

    const glints = [];
    for (let i = 0; i < 4; i++) {
      const g = this.add.circle(from.x, from.y, 5.5, glow, 0.8).setDepth(depth + 2);
      const ring = this.add.circle(from.x, from.y, 9, glow, 0.18).setDepth(depth + 2);
      glints.push({ core: g, ring });
      objs.push(g, ring);
    }

    const stripes = [0x7a5a3a, 0x5c3a1a, 0x8b6538, 0x4a3220];
    const tween = this.tweens.addCounter({
      from: 0, to: 1, duration: speedMs, repeat: -1, ease: 'Linear',
      onUpdate: (tw) => {
        const off = tw.getValue();
        tileSprites.forEach((s, i) => {
          if (!s || !s.scene) return;
          const t = ((i / pts) + off) % 1;
          s.x = from.x + dx * t;
          s.y = from.y + dy * t;
          s.fillColor = stripes[(Math.floor(i + off * pts)) % stripes.length];
          s.alpha = 0.72 + 0.28 * Math.sin((t + off) * Math.PI * 2);
        });
        glints.forEach((g, gi) => {
          if (!g.core || !g.core.scene) return;
          const t = (off + gi / glints.length) % 1;
          const px = from.x + dx * t, py = from.y + dy * t;
          g.core.x = px; g.core.y = py;
          g.ring.x = px; g.ring.y = py;
          const pulse = 0.4 + 0.6 * Math.abs(Math.sin((t + off) * Math.PI * 3));
          g.core.alpha = pulse;
          g.ring.alpha = 0.12 + 0.25 * pulse;
          g.ring.scale = 0.85 + 0.45 * pulse;
        });
      }
    });
    objs.push({ destroy: () => { if (tween) tween.destroy(); } });

    if (opts.label) {
      const midX = (from.x + to.x) / 2 + nx * (hw + 28);
      const midY = (from.y + to.y) / 2 + ny * (hw + 28);
      const beltLabel = this.add.text(midX, midY, opts.label, {
        fontFamily: 'Prompt, Sarabun, sans-serif', fontSize: opts.labelSize || '13px',
        color: opts.labelColor || '#ffd75e',
        stroke: '#1a0f05', strokeThickness: 3, align: 'center'
      }).setOrigin(0.5).setDepth(depth + 8);
      objs.push(beltLabel);
      if (opts.signs !== false) {
        this.locDecor.signs.push(beltLabel);
        beltLabel._beltOwned = true;
      }
    }

    objs.forEach(o => { if (o && !o._beltOwned) this.locDecor.paths.push(o); });
    return { tween, objs };
  },

  _cycleMachinePos(mIdx) {
    const cx = CONFIG.CYCLE_CENTER.x, cy = CONFIG.CYCLE_CENTER.y, R = CONFIG.CYCLE_RADIUS;
    const lay = CONFIG.THREE_MACHINE_LAYOUT[mIdx];
    const a1 = (lay.pair[0] / CONFIG.CYCLE_STATIONS) * Math.PI * 2 - Math.PI / 2;
    const a2 = (lay.pair[1] / CONFIG.CYCLE_STATIONS) * Math.PI * 2 - Math.PI / 2;
    let midA = (a1 + a2) / 2;
    return { x: cx + Math.cos(midA) * R, y: cy + Math.sin(midA) * R };
  },

  _buildAllConveyors() {
    if (this._machineLinkTweens) {
      this._machineLinkTweens.forEach(t => { if (t && t.destroy) t.destroy(); });
    }
    this._machineLinkTweens = [];

    const m3 = this._cycleMachinePos(2);
    const sugar = { x: CONFIG.SUGAR_MACHINE.x, y: CONFIG.SUGAR_MACHINE.y };
    const ang = Math.atan2(sugar.y - m3.y, sugar.x - m3.x);
    const from = { x: m3.x + Math.cos(ang) * 70, y: m3.y + Math.sin(ang) * 70 };
    const to = { x: sugar.x, y: sugar.y - 55 };
    const r = this._buildConveyor(from, to, {
      label: 'G3P → 🍬', depth: 4, accent: 0xc89050, glow: 0xffd75e, speedMs: 16000
    });
    if (r && r.tween) this._machineLinkTweens.push(r.tween);
  },

  _buildSugarConveyor() {
    this._buildAllConveyors();
  },

  _updateSugarMachineStatus() {
    if (!this.sugarMachineStatus) return;
    const ready = GameState.sugarReady || 0;
    const g3p = GameState.res.G3P || 0;
    const collected = GameState.res.SUGAR || 0;
    const count = ready + collected;
    let status = '', color = '#c8b89a';
    if (ready > 0) {
      status = 'กด ⚡ เก็บได้เลย';
      color = '#8dff8d';
    } else if (g3p >= 1) {
      status = `🧪 G3P ${g3p}/2 · เข้ารอบอีก ${2 - g3p} ครั้ง`;
      color = '#ffe873';
    } else {
      status = '⏳ รอ G3P (ครบ 2 = น้ำตาล 1)';
    }
    this.sugarMachineStatus.setText(`🍬 มีน้ำตาล ${count} (รอเก็บ ${ready})\n${status}`);
    this.sugarMachineStatus.setColor(color);
  },

  _collectSugarFromMachine() {
    if (!this) return;
    const cfg = CONFIG.SUGAR_MACHINE;
    if (!Player.sprite || Phaser.Math.Distance.Between(Player.sprite.x, Player.sprite.y, cfg.x, cfg.y) > cfg.radius + 30) {
      UI.showToast('💡 เดินไปที่เครื่องบรรจุน้ำตาลก่อน แล้วกด SPACE', 1500);
      return;
    }
    const ready = GameState.sugarReady || 0;
    if (ready === 0) {
      const g3p = GameState.res.G3P || 0;
      if (g3p >= 1) {
        UI.showToast(`🧪 ยังมี G3P ${g3p}/2 — ต้องการเข้าคาลวินอีก ${2 - g3p} ครั้ง เพื่อสร้างน้ำตาล`, 2200);
      } else {
        UI.showToast('⏳ ยังไม่มีน้ำตาล — ปั่นคาลวินให้ครบ 2 รอบก่อน (ได้ G3P 2 = น้ำตาล 1)', 2200);
      }
      return;
    }
    GameState.res.SUGAR = Math.min(CONFIG.RESOURCES.SUGAR.max, (GameState.res.SUGAR || 0) + ready);
    GameState.sugarReady = 0;
    this.cameras.main.flash(140, 255, 180, 80);
    this.tweens.add({
      targets: this.sugarMachineZone, alpha: { from: 0.7, to: 1 }, scale: { from: 0.96, to: 1 },
      duration: 220, yoyo: true
    });
    this._updateSugarMachineStatus();
    UI.updateInventory();
    GameState.save();
    if (typeof SFX !== 'undefined' && SFX.play) SFX.play('pickup');
    UI.showToast(`🍬 เก็บน้ำตาล +${ready} จากเครื่องบรรจุ → เอาไปป้อนต้นไม้ได้เลย!`, 2000);
  },

  spawnPickupAnim(key, amount) {
    const iconMap = { CO2: 'pickup_co2', WATER: 'pickup_h2o', ATP: 'pickup_atp', NADPH: 'pickup_nadph' };
    const tex = iconMap[key];
    if (!tex || !Player.sprite) return;
    for (let i = 0; i < amount; i++) {
      const px = Player.sprite.x + (Math.random() - 0.5) * 60;
      const py = Player.sprite.y - 10;
      const p = this.add.image(px, py, tex).setDepth(200).setScale(1);
      this.tweens.add({
        targets: p,
        y: py - 100,
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0.5 },
        duration: 900 + i * 60,
        delay: i * 60,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy()
      });
    }
  },

  update(time, delta) {
    Player.update(delta, this);
    this.updateFieldTreeHints();
    this._updateGuide(time);
    this._updateAutoCycle(time);
    this._updateFreeGuide(time);
    this._updateAchCheck(time);
  },

  // ตรวจความสำเร็จเป็นระยะ
  _updateAchCheck(time) {
    if (!this._achNext || time > this._achNext) {
      this._achNext = time + 2500;
      if (typeof Achievements !== 'undefined' && Achievements && typeof Achievements.checkAll === 'function') Achievements.checkAll();
    }
  }
});

const phaserConfig = {
  type: Phaser.AUTO,
  parent: 'center-panel',
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: CONFIG.WORLD_WIDTH,
    height: CONFIG.WORLD_HEIGHT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    resizeInterval: 16,
    resolution: Math.min(window.devicePixelRatio || 1, 3),
    autoRound: true
  },
  backgroundColor: '#2e7d32',
  powerPreference: 'high-performance',
  pixelArt: false,
  roundPixels: true,
  antialias: true,
  render: {
    antialias: true,
    roundPixels: true,
    powerPreference: 'high-performance'
  },
  scene: [MainScene]
};

window.addEventListener('load', () => {
  if (UI && UI.init) UI.init();
  GameState.phaserGame = new Phaser.Game(phaserConfig);
});

window.GameView = {
  zoomIn() {
    const s = GameState.phaserScene;
    if (s && s.zoomBy) s.zoomBy(0.25);
  },
  zoomOut() {
    const s = GameState.phaserScene;
    if (s && s.zoomBy) s.zoomBy(-0.25);
  },
  zoomReset() {
    const s = GameState.phaserScene;
    if (s) { s._userZoom = 1; s._setupScale(); }
  },
  setGuide(x, y, label) {
    const s = GameState.phaserScene;
    if (s && s.setGuide) s.setGuide(x, y, label);
  },
  clearGuide() {
    const s = GameState.phaserScene;
    if (s && s.clearGuide) s.clearGuide();
  }
};
