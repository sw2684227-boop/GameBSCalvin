const MainScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function MainScene() { Phaser.Scene.call(this, 'main'); },

  init() {
    this.locDecor = { trees: [], factories: [], stations: [], paths: [], clouds: [], signs: [], pickups: [] };
    this.ringDecor = [];
  },

  preload() { PixelAssets.generateAll(this); },

  create() {
    GameState.phaserScene = this;
    this._userZoom = 1;
    this.cameras.main.setBounds(0, 0, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor(CONFIG.LOCATIONS.factory.bg);
    this._setupScale();
    document.addEventListener('fullscreenchange', () => this._onResize());
    document.addEventListener('webkitfullscreenchange', () => this._onResize());
    window.addEventListener('resize', () => this._onResize());

    const hadSave = GameState.load();
    if (!hadSave) {
      GameState.electricity = CONFIG.ELECTRICITY.START;
    }

    this.loadMap('factory');
    Player.create(this, CONFIG.WORLD_WIDTH / 2, CONFIG.WORLD_HEIGHT / 2 + 100);
    CalvinCycle.buildInScene(this);
    this.cameras.main.startFollow(Player.sprite, true, 0.08, 0.08);

UI.updateInventory();
    UI.setLocation('factory');
    UI.updatePowerBar();
    UI.updateCycleStats();
    this.time.delayedCall(900, () => {
      if (hadSave) {
        UI.showToast('💾 โหลดเกมเก่าสำเร็จ! (ไฟฟ้า ' + GameState.electricity.toFixed(0) + '%)');
      } else {
        UI.showToast('🌿 WASD เดิน | ฟาร์ม CO₂ → ☀️ขั้นแสงอัตโนมัติ → 🌀คาลวิน | ⚡ไฟเริ่ม ' + CONFIG.ELECTRICITY.START + '%', 3400);
      }
    });

    this._startElectricityLoop();
    if (typeof LightReaction !== 'undefined' && LightReaction.startProducer) {
      LightReaction.startProducer(this);
    }
    window.addEventListener('beforeunload', () => GameState.save());
  },

  _startElectricityLoop() {
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (GameState.isGameOver) return;
        GameState.electricity = Math.max(0, (GameState.electricity || 0) - CONFIG.ELECTRICITY.DRAIN_PER_SEC);
        UI.updatePowerBar();
        if (GameState.electricity <= 0) {
          UI.gameOverCheck();
        }
      }
    });
  },

  _setupScale() {
    if (this.scale) this.scale.refresh();
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
    const prevBg = this.children.list.find(c => c.type === 'Graphics' && c._bgTile);
    if (prevBg) prevBg.destroy();
    this._drawGroundTiles(locKey);
    const blocked = [];
    blocked.push(...this._buildFactoryDecor());
    this._buildLightReactionMachine();
    this._buildWaterPond();
    blocked.push(this._getCycleBlockRect());
    this._buildCo2Collector();
    blocked.push(...this._placeTrees(locKey));
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
    const s = CONFIG.TILE_SIZE;
    const cols = Math.ceil(CONFIG.WORLD_WIDTH / s);
    const rows = Math.ceil(CONFIG.WORLD_HEIGHT / s);
    const bgGfx = this.add.graphics();
    bgGfx._bgTile = true;
    bgGfx.setDepth(0);
    const loc = CONFIG.LOCATIONS[locKey];
    const bgColor = loc.bg;
    const altBg = Phaser.Display.Color.IntegerToColor(bgColor);
    altBg.lighten(10);
    const alt = Phaser.Display.Color.GetColor(altBg.r, altBg.g, altBg.b);
    const darkBg = Phaser.Display.Color.IntegerToColor(bgColor);
    darkBg.darken(10);
    const dark = Phaser.Display.Color.GetColor(darkBg.r, darkBg.g, darkBg.b);
    let tileTexts = [];
    if (locKey === 'factory') tileTexts = ['grass_0','grass_1','grass_2','grass_3'];
    if (locKey === 'sky') tileTexts = ['water_0','water_1','water_2','water_3'];
    if (locKey === 'sun') tileTexts = ['sun_ground_0','sun_ground_1','sun_ground_2'];
    if (locKey === 'water') tileTexts = ['water_0','water_1','water_2','water_3'];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const t = tileTexts[(x * 7 + y * 13) % tileTexts.length];
        const tile = this.add.image(x * s + s/2, y * s + s/2, t).setDepth(0);
        tile.alpha = 0.95;
        this.locDecor.paths.push(tile);
      }
    }
    const border = this.add.graphics();
    border.setDepth(1);
    border.lineStyle(8, dark, 1);
    border.strokeRect(4, 4, CONFIG.WORLD_WIDTH - 8, CONFIG.WORLD_HEIGHT - 8);
    this.locDecor.paths.push(border);
  },

  _buildFactoryDecor() {
    const b = [];
    b.push(...this._buildCentralFactory());
    if (typeof this._buildMapDecorations === 'function') {
      b.push(...this._buildMapDecorations());
    }
    return b;

    const blocked = [];
    const factoryX = 245, factoryY = 270;
    const yard = this.add.graphics().setDepth(2);
    // Paved loading yard, entry road, and safety markings make this feel like a working factory.
    yard.fillStyle(0x172126, 0.92);
    yard.fillRoundedRect(38, 58, 394, 390, 18);
    yard.lineStyle(7, 0x4e5a5a, 1);
    yard.strokeRoundedRect(42, 62, 386, 382, 14);
    yard.fillStyle(0x29343a, 1);
    yard.fillRect(52, 380, 366, 48);
    yard.fillStyle(0xd6ad39, 0.85);
    for (let x = 68; x < 398; x += 44) yard.fillRect(x, 401, 24, 5);
    yard.lineStyle(3, 0x63807d, 0.75);
    yard.lineBetween(404, 222, 500, 222);
    yard.lineBetween(404, 222, 500, 258);
    yard.lineBetween(404, 258, 500, 258);
    yard.fillStyle(0x1d292d, 1);
    yard.fillRect(378, 278, 76, 126);
    yard.lineStyle(3, 0x799391, 0.8);
    yard.strokeRect(378, 278, 76, 126);
    this.locDecor.paths.push(yard);

    const mainFactory = this.add.image(factoryX, factoryY, 'factory_main').setScale(1.58).setDepth(20);
    this.locDecor.factories.push(mainFactory);
    blocked.push({ x: 78, y: 130, w: 332, h: 250 });

    const factoryDetails = this.add.graphics().setDepth(22);
    // Rooftop HVAC units and an external pipe network.
    factoryDetails.fillStyle(0x303b40, 1);
    factoryDetails.fillRect(95, 115, 52, 18);
    factoryDetails.fillRect(158, 105, 46, 18);
    factoryDetails.fillRect(266, 112, 48, 18);
    factoryDetails.lineStyle(3, 0x9aa9a7, 1);
    factoryDetails.strokeRect(95, 115, 52, 18);
    factoryDetails.strokeRect(158, 105, 46, 18);
    factoryDetails.strokeRect(266, 112, 48, 18);
    factoryDetails.lineStyle(10, 0x687b79, 1);
    factoryDetails.lineBetween(375, 178, 425, 178);
    factoryDetails.lineBetween(425, 178, 425, 288);
    factoryDetails.lineStyle(4, 0xb8d3cf, 0.7);
    factoryDetails.lineBetween(375, 176, 423, 176);
    factoryDetails.lineBetween(423, 176, 423, 288);
    factoryDetails.fillStyle(0xc45445, 1);
    factoryDetails.fillCircle(425, 238, 9);
    factoryDetails.lineStyle(3, 0xffc65a, 1);
    factoryDetails.strokeCircle(425, 238, 9);
    this.locDecor.factories.push(factoryDetails);

    const smoke = [];
    for (let i = 0; i < 5; i++) {
      const puff = this.add.circle(295 + (i % 2) * 12, 90 - i * 14, 11 + i * 2, 0xc4d0cd, 0.35).setDepth(24);
      this.tweens.add({ targets: puff, x: puff.x + 20 + i * 4, y: puff.y - 48, alpha: 0, scale: 1.8, duration: 2600 + i * 260, delay: i * 420, repeat: -1, ease: 'Sine.easeOut' });
      smoke.push(puff);
    }
    this.locDecor.clouds.push(...smoke);

    const sign = this.add.image(246, 373, 'sign').setDepth(25).setScale(1.05);
    this.locDecor.signs.push(sign);
    const signText = this.add.text(246, 348, 'GREEN LEAF\nBIO FACTORY', {
      fontFamily: 'Press Start 2P, monospace', fontSize: '8px', color: '#ffd75e',
      align: 'center', stroke: '#1a0f05', strokeThickness: 2
    }).setOrigin(0.5).setDepth(26);
    this.locDecor.signs.push(signText);

    for (let i = 0; i < 4; i++) {
      const crateX = 74 + i * 48;
      const crate = this.add.rectangle(crateX, 395 - (i % 2) * 16, 30, 24, 0x9a6430).setDepth(23);
      crate.setStrokeStyle(3, 0x553218);
      this.locDecor.factories.push(crate);
    }
    const cx = CONFIG.CYCLE_CENTER.x, cy = CONFIG.CYCLE_CENTER.y;
    const R = CONFIG.CYCLE_RADIUS;
    const pathGfx = this.add.graphics().setDepth(1);
    pathGfx.fillStyle(CONFIG.COLORS.path, 0.7);
    pathGfx.fillCircle(cx, cy, R + 80);
    pathGfx.lineStyle(5, CONFIG.COLORS.pathDark, 1);
    pathGfx.strokeCircle(cx, cy, R + 80);
    pathGfx.lineStyle(4, CONFIG.COLORS.woodDark, 0.9);
    pathGfx.strokeCircle(cx, cy, R + 10);
    pathGfx.strokeCircle(cx, cy, R - 80);
    this.locDecor.paths.push(pathGfx);
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const lx = factoryX + Math.cos(ang + 0.2) * 190;
      const ly = factoryY + Math.sin(ang + 0.2) * 145;
      const lampPost = this.add.rectangle(lx, ly, 6, 40, CONFIG.COLORS.woodDark).setDepth(14);
      const lamp = this.add.circle(lx, ly - 22, 8, 0xffd75e).setDepth(15);
      lamp.setStrokeStyle(3, 0xb8860b);
      this.tweens.add({ targets: lamp, alpha: {from: 0.7, to: 1}, duration: 1100 + i*120, yoyo: 1, repeat: -1 });
      this.locDecor.paths.push(lampPost, lamp);
    }
    const road = this.add.graphics().setDepth(1);
    road.fillStyle(CONFIG.COLORS.path, 0.8);
    road.fillRect(100, cy + R + 80, CONFIG.WORLD_WIDTH - 200, 28);
    for (let d = 120; d < CONFIG.WORLD_WIDTH - 120; d += 40) {
      road.fillStyle(0xffd75e, 0.5);
      road.fillRect(d, cy + R + 92, 20, 4);
    }
    this.locDecor.paths.push(road);
    return blocked;
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
    
    this.locDecor.paths.push(factory);

    const title = this.add.text(cx, cy - 340, '⚡ GREEN LEAF BIO POWER 🏭', {
      fontFamily: 'Press Start 2P, monospace', fontSize: '11px', color: '#ffd66a',
      stroke: '#0a1014', strokeThickness: 4
    }).setOrigin(0.5).setDepth(12);
    this.locDecor.signs.push(title);

    // ไม่มี collision - ผู้เล่นเดินทะลุได้
    return [];
  },

  _buildMapDecorations() {
    const blocked = [];
    const cx = CONFIG.CYCLE_CENTER.x, cy = CONFIG.CYCLE_CENTER.y;
    const W = CONFIG.WORLD_WIDTH, H = CONFIG.WORLD_HEIGHT;

    const bigPond = this.add.graphics().setDepth(2);
    const px = 890, py = 190, prx = 156, pry = 106;
    bigPond.fillStyle(0x0a1a22, 0.92);
    bigPond.fillEllipse(px, py + 5, prx + 12, pry + 12);
    bigPond.fillStyle(0x2e5e72, 1);
    bigPond.fillEllipse(px, py, prx, pry);
    bigPond.fillStyle(0x3e8eae, 0.88);
    bigPond.fillEllipse(px, py - 4, prx - 18, pry - 16);
    bigPond.fillStyle(0x66c8e8, 0.42);
    bigPond.fillEllipse(px - 22, py - 24, prx - 74, pry - 74);
    for (let r = 0; r < 3; r++) {
      const wave = this.add.graphics().setDepth(3);
      wave.lineStyle(2, 0x9ae8ff, 0.36 - r * 0.1);
      wave.strokeEllipse(px, py - 6, prx - 32 - r * 14, pry - 30 - r * 12);
      this.locDecor.paths.push(wave);
    }
    const stone = this.add.graphics().setDepth(3);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const rx = (prx + 8) * Math.cos(a), ry = (pry + 6) * Math.sin(a);
      stone.fillStyle(0x6e6e6e, 1);
      stone.fillCircle(px + rx, py + ry, 8 + (i % 3) * 3);
      stone.fillStyle(0x909090, 0.75);
      stone.fillCircle(px + rx - 2, py + ry - 2, 3 + (i % 2));
    }
    const reeds = this.add.graphics().setDepth(3);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const rx = (prx + 16) * Math.cos(a), ry = (pry + 10) * Math.sin(a);
      reeds.fillStyle(0x3a5e2a, 1);
      reeds.fillRoundedRect(px + rx - 1, py + ry - 24, 3, 26, 1);
      reeds.fillStyle(0x5a8e3e, 1);
      reeds.fillRoundedRect(px + rx - 4, py + ry - 30, 9, 8, 3);
    }
    const ft = this.add.graphics().setDepth(4);
    ft.fillStyle(0x5c4a3a, 1);
    ft.fillRect(px - 4, py - 6, 8, pry - 44);
    ft.fillStyle(0x8e6e4e, 1);
    ft.fillRoundedRect(px - 42, py - 70, 84, 14, 3);
    ft.lineStyle(3, 0x3a2a1a, 1);
    ft.strokeRoundedRect(px - 42, py - 70, 84, 14, 3);
    ft.fillStyle(0x4e92b6, 0.96);
    ft.fillEllipse(px, py - 108, 34, 42);
    ft.fillStyle(0x7ed2ff, 0.6);
    ft.fillEllipse(px - 6, py - 116, 17, 22);
    for (let d = 0; d < 3; d++) {
      const s = this.add.circle(px + (d-1)*8, py - 60, 4, 0xfffafa, 0.7).setDepth(5);
      this.tweens.add({ targets: s, y: s.y - 22, alpha: 0, scale: 1.8, duration: 1100 + d*160, repeat: -1, delay: d*260, ease: 'Cubic.easeOut' });
      this.locDecor.clouds.push(s);
    }
    this.locDecor.factories.push(bigPond, stone, reeds, ft);
    const pondLabel = this.add.text(px, py + 132, '💧 BIG POND + FOUNTAIN', {
      fontFamily: 'Press Start 2P, monospace', fontSize: '8px', color: '#9ae8ff',
      stroke: '#0a1420', strokeThickness: 3
    }).setOrigin(0.5).setDepth(8);
    this.locDecor.signs.push(pondLabel);
    blocked.push({ x: px - prx, y: py - pry, w: prx * 2, h: pry * 2 });

    const houses = [
      {x: 280, y: 950, wall: 0xf0e0b6, roof: 0xb8402e, trim: 0x702018, win: 0x7acfff, door: 0x724a28, doorTr: 0x361c0c, chimney: true, label: '🏠 บ้านมิสเตอร์ A'},
      {x: 580, y: 980, wall: 0xffd4b8, roof: 0x36629e, trim: 0x1c3e6a, win: 0xffee80, door: 0x6a3c2a, doorTr: 0x2e1608, chimney: false, label: '🏡 บ้านครอบครัว B'},
      {x: 920, y: 1000, wall: 0xe8d4c8, roof: 0x8b4513, trim: 0x5a2a0a, win: 0xffd75e, door: 0x8b5a3c, doorTr: 0x4a2010, chimney: true, label: '🏠 บ้านคุณยาย C'},
      {x: 1250, y: 950, wall: 0xd4e8d4, roof: 0x2e8b57, trim: 0x1a5a3a, win: 0xaaffaa, door: 0x5a7a3a, doorTr: 0x2a3a1a, chimney: false, label: '🏡 บ้านป้า D'}
    ];
    houses.forEach(h => {
      const hx = h.x, hy = h.y;
      const gh = this.add.graphics().setDepth(6);
      gh.fillStyle(0x1a2018, 0.58);
      gh.fillEllipse(hx, hy + 84, 196, 28);
      gh.fillStyle(h.wall, 1);
      gh.fillRect(hx - 70, hy - 4, 140, 88);
      gh.lineStyle(5, h.trim, 1);
      gh.strokeRect(hx - 70, hy - 4, 140, 88);
      gh.fillStyle(h.roof, 1);
      gh.fillTriangle(hx - 88, hy - 4, hx, hy - 82, hx + 88, hy - 4);
      gh.lineStyle(6, h.trim, 1);
      gh.strokeTriangle(hx - 88, hy - 4, hx, hy - 82, hx + 88, hy - 4);
      if (h.chimney) {
        gh.fillStyle(0x684848, 1);
        gh.fillRect(hx + 32, hy - 78, 22, 46);
        gh.lineStyle(4, 0x3a2020, 1);
        gh.strokeRect(hx + 32, hy - 78, 22, 46);
        const cs = this.add.circle(hx + 43, hy - 88, 10, 0xb8a090, 0.45).setDepth(8);
        this.tweens.add({ targets: cs, x: cs.x + 20, y: cs.y - 44, alpha: 0, scale: 1.75, duration: 2200, repeat: -1, ease: 'Sine.easeOut' });
        this.locDecor.clouds.push(cs);
      }
      const wins = [hx - 40, hx + 40];
      wins.forEach(wx => {
        gh.fillStyle(0x2a4a5c, 1);
        gh.fillRoundedRect(wx - 16, hy + 10, 32, 30, 3);
        gh.lineStyle(3, h.trim, 1);
        gh.strokeRoundedRect(wx - 16, hy + 10, 32, 30, 3);
        gh.fillStyle(h.win, 0.94);
        gh.fillRect(wx - 12, hy + 14, 24, 22);
        gh.fillStyle(h.trim, 0.85);
        gh.fillRect(wx - 2, hy + 14, 4, 22);
        gh.fillRect(wx - 12, hy + 24, 24, 4);
      });
      gh.fillStyle(h.door, 1);
      gh.fillRoundedRect(hx - 14, hy + 38, 28, 46, 4);
      gh.lineStyle(3, h.doorTr, 1);
      gh.strokeRoundedRect(hx - 14, hy + 38, 28, 46, 4);
      gh.fillStyle(0xffd060, 1);
      gh.fillCircle(hx + 6, hy + 62, 3);
      const f = this.add.graphics().setDepth(6);
      const fenceXs = [-90,-70,-50,-30,-10,10,30,50,70,90];
      fenceXs.forEach(fx => {
        f.fillStyle(0x8a6848, 1);
        f.fillRect(hx + fx, hy + 90, 4, 20);
        f.fillStyle(0xa27c58, 1);
        f.fillRoundedRect(hx + fx - 2, hy + 86, 8, 6, 2);
      });
      f.fillStyle(0x8a6848, 1);
      f.fillRect(hx - 92, hy + 96, 184, 3);
      f.fillRect(hx - 92, hy + 104, 184, 3);
      this.locDecor.factories.push(f);
      this.locDecor.factories.push(gh);
      const sign = this.add.text(hx, hy + 120, h.label, {
        fontFamily: 'Press Start 2P, monospace', fontSize: '8px', color: '#ffe8a0',
        stroke: '#1a1008', strokeThickness: 3
      }).setOrigin(0.5).setDepth(8);
      this.locDecor.signs.push(sign);
      blocked.push({ x: hx - 88, y: hy - 82, w: 176, h: 168 });
    });

    const park = { x: 1080, y: 190 };
    const benches = [
      { x: park.x - 42, y: park.y + 50 },
      { x: park.x + 58, y: park.y + 18 },
      { x: park.x - 8, y: park.y - 62 }
    ];
    benches.forEach(b => {
      const bn = this.add.graphics().setDepth(6);
      bn.fillStyle(0x2a1e14, 0.48);
      bn.fillEllipse(b.x, b.y + 16, 68, 8);
      bn.fillStyle(0x8c6240, 1);
      bn.fillRoundedRect(b.x - 26, b.y + 2, 52, 8, 2);
      bn.lineStyle(2, 0x5a3a1a, 1);
      bn.strokeRoundedRect(b.x - 26, b.y + 2, 52, 8, 2);
      bn.fillStyle(0x6e4a2a, 1);
      bn.fillRoundedRect(b.x - 26, b.y - 10, 52, 8, 2);
      bn.lineStyle(2, 0x3a2010, 1);
      bn.strokeRoundedRect(b.x - 26, b.y - 10, 52, 8, 2);
      for (let i = 0; i < 5; i++) {
        bn.fillStyle(0x4c3018, 1);
        bn.fillRect(b.x - 24 + i * 12, b.y - 10, 2, 8);
        bn.fillRect(b.x - 24 + i * 12, b.y + 2, 2, 8);
      }
      bn.fillStyle(0x3a2a1a, 1);
      bn.fillRect(b.x - 24, b.y + 10, 4, 10);
      bn.fillRect(b.x + 20, b.y + 10, 4, 10);
      this.locDecor.factories.push(bn);
    });
    const lamps = [
      { x: 520, y: 510 }, { x: 710, y: 530 }, { x: 910, y: 448 },
      { x: 1108, y: 348 }, { x: 420, y: 628 }
    ];
    lamps.forEach(l => {
      const lp = this.add.graphics().setDepth(7);
      lp.fillStyle(0x2e2e2e, 1);
      lp.fillRect(l.x - 3, l.y - 6, 6, 52);
      lp.fillStyle(0x4a4a4a, 1);
      lp.fillRoundedRect(l.x - 22, l.y - 22, 44, 22, 5);
      lp.lineStyle(3, 0x202020, 1);
      lp.strokeRoundedRect(l.x - 22, l.y - 22, 44, 22, 5);
      lp.fillStyle(0xffe58a, 1);
      lp.fillRoundedRect(l.x - 18, l.y - 18, 36, 14, 3);
      const lg = this.add.graphics().setDepth(2);
      lg.fillStyle(0xffe58a, 0.18);
      lg.fillEllipse(l.x, l.y + 18, 118, 78);
      this.locDecor.paths.push(lg);
      this.locDecor.factories.push(lp);
    });

    const npcDefs = [
      { name: 'ครูกระต่าย', emoji: '👨‍🔧', color: 0xffd060, dialog: ['ไฟฟ้าวันนี้ดูไบร์ทๆ เลยนะ!','ซ่อมเครื่องยนต์เรียบร้อยครับ','ดูแลระบบหมุนเวียนให้ดี!'] },
      { name: 'น้องกระต่าย', emoji: '👧', color: 0xffb0c0, dialog: ['อยากกินขนมปัง!','บ้านเราไฟสว่างมากเลย','ไปดูบ่อน้ำกันไหม~'] },
      { name: 'ช่างไฟ', emoji: '🧑‍🔧', color: 0xffa060, dialog: ['หม้อแปลงร้อนขึ้นเล็กน้อย','สถานะ CO2 เยี่ยมมาก','คาลวินหมุนลื่นมาก!'] },
      { name: 'ปู่กระต่าย', emoji: '👴', color: 0xd0b0ff, dialog: ['โรงงานรุ่นใหม่สวยจัง','สมัยก่อนใช้ถ่านนะ','คุณทำงานดีมากลูก'] },
      { name: 'เด็กเล่น', emoji: '🧒', color: 0x9af090, dialog: ['วิ่งเลย~','อยากเล่นน้ำที่บ่อน้ำ!','ไฟสว่างสนุกมาก'] }
    ];
    const zones = [
      { x1: 360, y1: 380, x2: 760, y2: 460 },
      { x1: 820, y1: 490, x2: 1130, y2: 610 },
      { x1: 920, y1: 90, x2: 1190, y2: 270 },
      { x1: 140, y1: 410, x2: 340, y2: 510 },
      { x1: 560, y1: 150, x2: 780, y2: 270 }
    ];
    const scene = this;
    npcDefs.forEach((n, idx) => {
      const z = zones[idx % zones.length];
      const baseX = z.x1 + Math.random() * (z.x2 - z.x1);
      const baseY = z.y1 + Math.random() * (z.y2 - z.y1);
      const npcBubble = this.add.graphics().setDepth(14);
      npcBubble.visible = false;
      npcBubble.fillStyle(0xffffff, 1);
      npcBubble.fillRoundedRect(-70, -50, 140, 46, 10);
      npcBubble.lineStyle(2, 0x222244, 1);
      npcBubble.strokeRoundedRect(-70, -50, 140, 46, 10);
      npcBubble.fillTriangle(-10, -6, 6, -6, -2, 12);
      const npcText = this.add.text(0, -27, '', {
        fontFamily: 'Prompt, sans-serif', fontSize: '11px', color: '#111133', align: 'center', wordWrap: { width: 128 }
      }).setOrigin(0.5).setDepth(15).setVisible(false);
      const npcBody = this.add.graphics().setDepth(9);
      npcBody.fillStyle(0x1a1a1a, 0.34);
      npcBody.fillEllipse(0, 24, 28, 8);
      npcBody.fillStyle(n.color, 1);
      npcBody.fillRoundedRect(-14, -14, 28, 34, 8);
      npcBody.lineStyle(3, 0x202020, 1);
      npcBody.strokeRoundedRect(-14, -14, 28, 34, 8);
      const npcLabel = this.add.text(0, 36, n.name, {
        fontFamily: 'Prompt, sans-serif', fontSize: '10px', color: '#fff', stroke: '#111', strokeThickness: 3, align: 'center'
      }).setOrigin(0.5).setDepth(10);
      const npcEmoji = this.add.text(0, -26, n.emoji, { fontSize: '22px' }).setOrigin(0.5).setDepth(11);
      const npc = this.add.container(baseX, baseY, [npcBody, npcLabel, npcEmoji, npcBubble, npcText]).setSize(32, 60);
      this.locDecor.factories.push(npc);
      let dirX = (Math.random() < 0.5 ? -1 : 1);
      let dirY = (Math.random() < 0.5 ? -1 : 1);
      const walk = () => {
        if (!npc || !npc.active) return;
        if (Math.random() < 0.26) dirX *= -1;
        if (Math.random() < 0.26) dirY *= -1;
        const spd = 0.4 + Math.random() * 0.5;
        let nx = npc.x + dirX * (18 + Math.random() * 26) * spd;
        let ny = npc.y + dirY * (14 + Math.random() * 18) * spd;
        nx = Math.max(z.x1, Math.min(z.x2, nx));
        ny = Math.max(z.y1, Math.min(z.y2, ny));
        scene.tweens.add({
          targets: npc, x: nx, y: ny, duration: 1300 + Math.random() * 900,
          ease: 'Sine.easeInOut', onComplete: walk
        });
        if (Math.random() < 0.42) {
          const msg = n.dialog[Math.floor(Math.random() * n.dialog.length)];
          npcText.setText(msg);
          npcBubble.visible = true; npcText.visible = true;
          scene.tweens.add({ targets: [npcBubble, npcText], y: '-=4', yoyo: true, duration: 420, repeat: 1 });
          scene.time.delayedCall(2200, () => { if (npcBubble) { npcBubble.visible = false; npcText.visible = false; }});
        }
      };
      this.time.delayedCall(600 + idx * 380, walk);
    });

    return blocked;
  },

  _getCycleBlockRect() {
    const cx = CONFIG.CYCLE_CENTER.x, cy = CONFIG.CYCLE_CENTER.y;
    return { x: cx - 30, y: cy - 30, w: 60, h: 60 };
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
      fontFamily: 'Press Start 2P, VT323, monospace', fontSize: '10px', color: '#ffe78a',
      align: 'center', stroke: '#1a0f05', strokeThickness: 3
    }).setOrigin(0.5).setDepth(11);

    const zone = this.add.zone(x, y + 14, width, height).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => UI.openMachinePanel('light'));
    zone.on('pointerover', () => this.cameras.main.flash(70, 255, 231, 74));
    this.locDecor.paths.push(g, label, status, zone);
    this.lightMachineZone = zone;
    this.lightMachineStatus = status;
    this.lightMachineTankLabel = this.add.text(tankX + tankW / 2, y + tankH + 34, '📦 น้ำในกล่อง 0/20', {
      fontFamily: 'Press Start 2P, monospace', fontSize: '8px', color: '#aadcff',
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
    source.on('pointerdown', () => this._collectWaterFromPond());
    this.locDecor.pickups.push(source);
    this.waterPondZone = source;
    this.waterPondGfx = g;

    const hint = this.add.text(cfg.x, cfg.y - cfg.radius - 28, '🌊 บ่อน้ำ H₂O\nกด SPACE หรือแตะตักน้ำ', {
      fontFamily: 'Press Start 2P, monospace', fontSize: '9px', color: '#aadcff',
      stroke: '#0a1530', strokeThickness: 2, align: 'center'
    }).setOrigin(0.5).setDepth(15);
    this.locDecor.signs.push(hint);

  },

  _collectWaterFromPond() {
    if (!this || GameState.isGameOver) return;
    const pond = CONFIG.WATER_POND;
    if (!Player.sprite || Phaser.Math.Distance.Between(Player.sprite.x, Player.sprite.y, pond.x, pond.y) > pond.radius + 24) {
      UI.showToast('💡 เดินไปที่บ่อน้ำก่อน แล้วกด SPACE เพื่อตักน้ำ', 1500);
      return;
    }
    const amt = 1;
    const cap = CONFIG.RESOURCES.WATER.max || 999;
    GameState.res.WATER = Math.min(cap, (GameState.res.WATER || 0) + amt);
    this.cameras.main.flash(120, 120, 220, 255);
    this.tweens.add({
      targets: this.waterPondZone, alpha: { from: 0.72, to: 1 }, scale: { from: 0.96, to: 1 },
      duration: 220, yoyo: true
    });
    UI.updateInventory();
    GameState.save();
    UI.showToast('✨ ตัก H₂O +1 → เอาไปใส่เครื่องขั้นแสง', 1300);
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
    zone.on('pointerdown', () => this._collectCo2FromStation());
    const label = this.add.text(cfg.x, cfg.y - 72, '🌿 เครื่องดูด CO₂\nผลิต 1CO₂/วิ | SPACE รับ', {
      fontFamily: 'Press Start 2P, monospace', fontSize: '9px', color: '#c8eeff',
      stroke: '#0a1530', strokeThickness: 2, align: 'center'
    }).setOrigin(0.5).setDepth(15);
    
    // เริ่มการผลิต CO₂ อัตโนมัติ
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (GameState.isGameOver) return;
        this._co2MachineAmount = Math.min(99, (this._co2MachineAmount || 0) + 1);
        this._updateCo2MachineBar();
      }
    });
    
    this.locDecor.paths.push(g, zone);
    this.locDecor.signs.push(label);
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
    
    // ข้อความจำนวน
    if (this._co2MachineText) this._co2MachineText.destroy();
    this._co2MachineText = this.add.text(cfg.x, cfg.y + 50, `CO₂: ${this._co2MachineAmount}`, {
      fontFamily: 'Press Start 2P, monospace', fontSize: '8px', color: '#c8eeff',
      stroke: '#0a1530', strokeThickness: 2
    }).setOrigin(0.5).setDepth(16);
  },

  _collectCo2FromStation() {
    if (!this || GameState.isGameOver) return;
    const cfg = CONFIG.CO2_COLLECTOR;
    if (!Player.sprite || Phaser.Math.Distance.Between(Player.sprite.x, Player.sprite.y, cfg.x, cfg.y) > cfg.radius + 24) {
      UI.showToast('💡 เดินไปที่เครื่องดูด CO₂ ก่อน แล้วกด SPACE', 1500);
      return;
    }
    
    const amount = this._co2MachineAmount || 0;
    if (amount === 0) {
      UI.showToast('⏳ เครื่องยังไม่มี CO₂ รอสักครู่...', 1300);
      return;
    }
    
    GameState.res.CO2 = Math.min(CONFIG.RESOURCES.CO2.max, (GameState.res.CO2 || 0) + amount);
    this._co2MachineAmount = 0;
    this._updateCo2MachineBar();
    this.cameras.main.flash(120, 180, 230, 255);
    UI.updateInventory();
    GameState.save();
    UI.showToast(`🌿 รับ CO₂ +${amount} จากเครื่องดูดอากาศ`, 1300);
  },

  _placeTrees(locKey) {
    const blocked = [];
    const isWater = (locKey === 'water');
    const isSky = (locKey === 'sky');
    const count = (locKey === 'factory') ? 28 : (isSky ? 4 : (isWater ? 8 : 10));
    const positions = [];
    for (let t = 0; t < count; t++) {
      let x, y, ok = false, tries = 0;
      while (!ok && tries < 30) {
        tries++;
        x = 80 + Math.random() * (CONFIG.WORLD_WIDTH - 160);
        y = 120 + Math.random() * (CONFIG.WORLD_HEIGHT - 220);
        ok = true;
        if (locKey === 'factory') {
          const dc = Math.hypot(x - CONFIG.CYCLE_CENTER.x, y - CONFIG.CYCLE_CENTER.y);
          if (dc < CONFIG.CYCLE_RADIUS + 140) ok = false;
          const df = Math.hypot(x - 220, y - 260);
          if (df < 220) ok = false;
        }
        for (const p of positions) {
          if (Math.hypot(x - p.x, y - p.y) < 110) { ok = false; break; }
        }
      }
      if (!ok) continue;
      positions.push({ x, y });
      const variant = t % 3;
      const tree = this.add.image(x, y, `tree_${variant}`).setDepth(Math.floor(y / 2)).setScale(0.95 + Math.random()*0.25);
      this.locDecor.trees.push(tree);
      blocked.push({ x: x - 14, y: y + 8, w: 28, h: 18 });
    }
    const cornerOffsets = [
      [60, 60], [CONFIG.WORLD_WIDTH - 80, 80],
      [60, CONFIG.WORLD_HEIGHT - 120], [CONFIG.WORLD_WIDTH - 100, CONFIG.WORLD_HEIGHT - 120]
    ];
    cornerOffsets.forEach(([cx, cy]) => {
      for (let i = 0; i < 4; i++) {
        const vx = cx + (i % 2) * 50 - 25;
        const vy = cy + Math.floor(i / 2) * 50 - 25;
        const t = this.add.image(vx, vy, `tree_${i%3}`).setDepth(Math.floor(vy/2)).setScale(1.05);
        this.locDecor.trees.push(t);
      }
    });
    return blocked;
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
    resizeInterval: 16
  },
  backgroundColor: '#1a2e1a',
  pixelArt: false,
  roundPixels: false,
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
  }
};
