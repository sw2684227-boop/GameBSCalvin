const CalvinCycle = {
  stationObjs: [],
  molObjects: [],
  machineObjs: [],
  dockItems: [],
  coreGlow: null,
  currentFocus: null,
  actionInProgress: false,

  cycleStartTime: 0,
  cycleDuration: 10000,
  cycleProgressTween: null,

  buildInScene(scene) {
    const cx = CONFIG.CYCLE_CENTER.x;
    const cy = CONFIG.CYCLE_CENTER.y;
    const R = CONFIG.CYCLE_RADIUS;
    this.machineObjs = [];
    this.dockItems = [];
    this.coreGlow = scene.add.image(cx, cy, 'cycle_core').setScale(1.2).setDepth(5);
    scene.tweens.add({
      targets: this.coreGlow,
      scale: { from: 1.1, to: 1.35 },
      alpha: { from: 0.8, to: 1 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this._buildLoadingDock(scene, cx, cy);
    for (let m = 0; m < 3; m++) {
      const lay = CONFIG.THREE_MACHINE_LAYOUT[m];
      const a1 = (lay.pair[0] / CONFIG.CYCLE_STATIONS) * Math.PI * 2 - Math.PI / 2;
      const a2 = (lay.pair[1] / CONFIG.CYCLE_STATIONS) * Math.PI * 2 - Math.PI / 2;
      const midA = (a1 + a2) / 2;
      const mx = cx + Math.cos(midA) * R;
      const my = cy + Math.sin(midA) * R;
      this._buildMachineBuilding(scene, mx, my, m, lay, midA);
      lay.pair.forEach((si) => {
        const ang = (si / CONFIG.CYCLE_STATIONS) * Math.PI * 2 - Math.PI / 2;
        const sx = cx + Math.cos(ang) * R;
        const sy = cy + Math.sin(ang) * R;
        this.stationObjs.push({ img: null, halo: null, label: null, x: sx, y: sy, zone: null, mIdx: m });
      });
    }
    this._drawConveyorRing(scene, cx, cy, R - 40);
    this._drawReturnRing(scene, cx, cy, R + 50);
    this.cycleDuration = this.getCycleDuration();
    const lr = (typeof LightReaction !== 'undefined' && LightReaction) ? LightReaction : { GAIN_ATP: 2, GAIN_NADPH: 2, BOOST_GAIN_ATP: 4 };
    UI.updateChalkboard(
      'LIGHT: READY',
      '🌊 นำน้ำ H₂O ไปใส่กล่องของเครื่องขั้นแสงเพื่อผลิต ATP + NADPH',
      'บ่อน้ำ → กล่องน้ำเครื่อง Light Reaction → ATP + NADPH → คาลวิน',
      'เติมน้ำลงกล่องเครื่องขั้นแสง',
      `ATP +${lr.GAIN_ATP} + NADPH +${lr.GAIN_NADPH} (มีแสง = ×${lr.BOOST_GAIN_ATP / lr.GAIN_ATP})`,
      'O₂ ปล่อยออกสู่บรรยากาศ'
    );
    UI.setActionButton('▶ เริ่มวัฏจักรคาลวิน (' + (this.cycleDuration / 1000).toFixed(1) + ' วิ/รอบ)', true, () => this.startCycle());
  },

  _drawConveyorRing(scene, cx, cy, R) {
    const isMobile = (typeof window !== 'undefined' && window.innerWidth) <= 768;
    const pts = isMobile ? 48 : 80;
    const base = scene.add.graphics().setDepth(2);
    base.lineStyle(16, 0x120a05, 0.95);
    base.strokeCircle(cx, cy, R);
    base.lineStyle(12, 0x6b4423, 1);
    base.strokeCircle(cx, cy, R);
    base.lineStyle(3, 0xc89050, 0.85);
    base.strokeCircle(cx, cy, R + 5);
    base.strokeCircle(cx, cy, R - 5);
    base.lineStyle(2, 0xffd75e, 0.2);
    base.strokeCircle(cx, cy, R);

    const tileSprites = [];
    const rails = [];
    for (let i = 0; i < pts; i++) {
      const ang = (i / pts) * Math.PI * 2;
      const px = cx + Math.cos(ang) * R;
      const py = cy + Math.sin(ang) * R;
      const seg = scene.add.rectangle(px, py, 18, 14, 0x5c3a1a).setDepth(3);
      seg.setStrokeStyle(2, 0x2a1a0a, 1);
      seg.rotation = ang + Math.PI / 2;
      tileSprites.push(seg);
      if (i % 4 === 0) {
        const nx = Math.cos(ang), ny = Math.sin(ang);
        const tick = scene.add.rectangle(cx + nx * (R + 10), cy + ny * (R + 10), 4, 10, 0xc89050, 0.75).setDepth(3);
        tick.rotation = ang;
        rails.push(tick);
      }
    }
    const glints = [];
    for (let i = 0; i < 5; i++) {
      const core = scene.add.circle(cx + R, cy, 5.5, 0xffd75e, 0.85).setDepth(5);
      const ring = scene.add.circle(cx + R, cy, 10, 0xffd75e, 0.18).setDepth(5);
      glints.push({ core, ring });
    }
    scene.tweens.addCounter({
      from: 0, to: 1, duration: 18000, repeat: -1, ease: 'Linear',
      onUpdate: (tw) => {
        const v = tw.getValue();
        const off = (v * 2 * Math.PI) / pts;
        const stripes = [0x7a5a3a, 0x5c3a1a, 0x8b6538, 0x4a3220];
        tileSprites.forEach((s, i) => {
          const ang = (i / pts) * Math.PI * 2 + off;
          s.x = cx + Math.cos(ang) * R;
          s.y = cy + Math.sin(ang) * R;
          s.rotation = ang + Math.PI / 2;
          s.fillColor = stripes[Math.floor(i + v * pts) % stripes.length];
          s.alpha = 0.72 + 0.28 * Math.sin(ang * 3 + v * Math.PI * 2);
        });
        glints.forEach((g, gi) => {
          const ang = v * Math.PI * 2 + (gi / glints.length) * Math.PI * 2;
          g.core.x = cx + Math.cos(ang) * R;
          g.core.y = cy + Math.sin(ang) * R;
          g.ring.x = g.core.x;
          g.ring.y = g.core.y;
          const pulse = 0.4 + 0.6 * Math.abs(Math.sin(ang * 3));
          g.core.alpha = pulse;
          g.ring.alpha = 0.1 + 0.22 * pulse;
          g.ring.scale = 0.85 + 0.4 * pulse;
        });
      }
    });
  },

  _drawReturnRing(scene, cx, cy, R) {
    const isMobile = (typeof window !== 'undefined' && window.innerWidth) <= 768;
    const pts = isMobile ? 40 : 64;
    const path = scene.add.graphics().setDepth(1);
    path.lineStyle(10, 0x1a1008, 0.85);
    path.strokeCircle(cx, cy, R);
    path.lineStyle(5, 0x3a2814, 1);
    path.strokeCircle(cx, cy, R);
    path.lineStyle(2, 0x8b6538, 0.5);
    path.strokeCircle(cx, cy, R + 3);

    const segs = [];
    for (let i = 0; i < pts; i++) {
      const ang = (i / pts) * Math.PI * 2;
      const px = cx + Math.cos(ang) * R;
      const py = cy + Math.sin(ang) * R;
      const seg = scene.add.rectangle(px, py, 12, 7, 0x2a1a0a).setDepth(2);
      seg.setStrokeStyle(1, 0x1a0a05, 1);
      seg.rotation = ang + Math.PI / 2;
      segs.push(seg);
    }
    scene.tweens.addCounter({
      from: 0, to: 1, duration: 24000, repeat: -1, ease: 'Linear',
      onUpdate: (tw) => {
        const off = (tw.getValue() * 2 * Math.PI) / pts;
        segs.forEach((s, i) => {
          const ang = (i / pts) * Math.PI * 2 - off;
          s.x = cx + Math.cos(ang) * R;
          s.y = cy + Math.sin(ang) * R;
          s.rotation = ang + Math.PI / 2;
          s.alpha = 0.55 + 0.35 * Math.abs(Math.sin(ang * 2));
        });
      }
    });
  },

  _shade(hex, pct) {
    const c = Phaser.Display.Color.IntegerToColor(hex);
    if (pct >= 0) c.lighten(pct); else c.darken(-pct);
    return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
  },

  _buildMachineBuilding(scene, mx, my, mIdx, lay, angle) {
    const col = lay.colInt;
    const dark = lay.darkCol;
    const top = this._shade(col, 20);
    const bot = this._shade(col, -30);
    const g = scene.add.graphics().setDepth(6);
    g.fillStyle(0x1a0f08, 1);
    g.fillRect(mx - 82, my + 24, 164, 22);
    g.fillStyle(0x3a2a1a, 1);
    g.fillRect(mx - 72, my + 16, 14, 10);
    g.fillRect(mx + 58, my + 16, 14, 10);
    g.fillStyle(0x241407, 1);
    g.fillRect(mx - 80, my - 54, 160, 78);
    g.fillStyle(col, 1);
    g.fillRect(mx - 74, my - 50, 148, 70);
    g.fillStyle(top, 1);
    g.fillRect(mx - 74, my - 50, 148, 10);
    g.fillStyle(bot, 1);
    g.fillRect(mx - 74, my - 32, 148, 18);
    g.lineStyle(2, 0x0a0a0a, 0.6);
    g.strokeRect(mx - 74, my - 50, 148, 70);
    g.fillStyle(0x8b3a3a, 1);
    g.fillRect(mx - 84, my - 62, 168, 10);
    g.fillStyle(0x5a2a2a, 1);
    g.fillRect(mx - 88, my - 66, 176, 6);
    g.fillStyle(0x5c3a1a, 1);
    g.fillRect(mx - 62, my - 70, 14, 10);
    g.fillRect(mx - 10, my - 70, 14, 10);
    g.fillStyle(0x0a0a0a, 1);
    g.fillRect(mx - 56, my - 38, 112, 30);
    const winC = this._shade(col, -20);
    g.fillStyle(winC, 1);
    g.fillRect(mx - 52, my - 34, 104, 22);
    g.lineStyle(2, 0x0a0a0a, 1);
    g.strokeRect(mx - 52, my - 34, 104, 22);
    g.beginPath();
    g.moveTo(mx, my - 34);
    g.lineTo(mx, my - 12);
    g.stroke();
    const lampX = mx + 62, lampY = my - 50;
    g.fillStyle(0x0a0a0a, 1);
    g.fillRect(lampX - 6, lampY - 6, 12, 12);
    const lamp = scene.add.circle(lampX, lampY, 5, 0x444444, 1).setDepth(10);
    g.fillStyle(0x3a2a1a, 1);
    g.fillRect(mx - 78, my - 8, 156, 36);
    g.fillStyle(this._shade(col, 40), 1);
    g.fillRect(mx - 74, my - 4, 148, 28);
    const nameText = scene.add.text(mx, my - 78, lay.label, {
      fontFamily: 'Prompt, Sarabun, sans-serif', fontSize: '15px', color: lay.col,
      stroke: '#1a0f05', strokeThickness: 3
    }).setOrigin(0.5).setDepth(11);
    const subText = scene.add.text(mx, my + 40, lay.sub, {
      fontFamily: 'Prompt, Sarabun, sans-serif', fontSize: '13px', color: '#ffd75e',
      stroke: '#1a0f05', strokeThickness: 2
    }).setOrigin(0.5).setDepth(11);
    const inputDesc = lay.inputs.map(inp => `${inp.icon} ×${inp.n}`).join('  +  ');
    const inputText = scene.add.text(mx, my + 62, inputDesc, {
      fontFamily: 'Prompt, Sarabun, sans-serif', fontSize: '14px', color: '#ffffff',
      stroke: '#1a0f05', strokeThickness: 2
    }).setOrigin(0.5).setDepth(11);
    lay.inputs.forEach((inp, k) => {
      const hx = mx - 38 + k * 44;
      g.fillStyle(0x5c3a1a, 1);
      g.fillRect(hx - 12, my - 76, 24, 8);
      g.fillStyle(0x8b6f47, 1);
      g.fillRect(hx - 8, my - 68, 16, 6);
      const dot = scene.add.circle(hx, my - 64, 5, Phaser.Display.Color.HexStringToColor(inp.color).color, 1).setDepth(10);
      const cnt = scene.add.text(hx, my - 56, `${inp.n}`, {
        fontFamily: 'Prompt, Sarabun, sans-serif', fontSize: '15px', color: '#ffd75e',
        stroke: '#1a0f05', strokeThickness: 1
      }).setOrigin(0.5).setDepth(11);
    });
    const windowAtoms = [];
    for (let j = 0; j < 3; j++) {
      const ax = mx - 30 + j * 30;
      const ay = my - 24 + (j % 2) * 8;
      const ac = scene.add.circle(ax, ay, 4, 0xffffff, 0.4).setDepth(11);
      windowAtoms.push(ac);
      scene.tweens.add({
        targets: ac, x: ax + (j % 2 === 0 ? 8 : -8), y: ay - 6,
        duration: 1200 + j * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    }
    const zone = scene.add.zone(mx, my + 10, 160, 130).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => { if (window.TouchBlockedByUI) return; UI.openMachinePanel(lay.key); });
    this.machineObjs.push({
      key: lay.key, x: mx, y: my, mIdx, g, lamp, lampTween: null,
      windowAtoms, zone, nameText
    });
  },

  _buildLoadingDock(scene, cx, cy) {
    const dockG = scene.add.graphics().setDepth(6);
    dockG.lineStyle(2, 0xffd75e, 0.3);
    dockG.strokeCircle(cx, cy, 42);
    const dockItems = [
      { key: 'pickup_co2', label: 'CO₂ ×3', a: -Math.PI / 2, r: 68, color: 0x9a9a9a },
      { key: 'pickup_atp', label: 'ATP ×9', a: Math.PI / 6, r: 68, color: 0xffd700 },
      { key: 'pickup_nadph', label: 'NADPH ×6', a: 5 * Math.PI / 6, r: 68, color: 0x5fff5f }
    ];
    dockItems.forEach(it => {
      const px = cx + Math.cos(it.a) * it.r;
      const py = cy + Math.sin(it.a) * it.r;
      dockG.fillStyle(0x241407, 0.9);
      dockG.fillCircle(px, py, 22);
      dockG.fillStyle(0x3a2a1a, 1);
      dockG.fillCircle(px, py, 18);
      dockG.lineStyle(2, it.color, 0.5);
      dockG.strokeCircle(px, py, 22);
      const ic = scene.add.image(px, py - 2, it.key).setDepth(9).setScale(1.1);
      scene.tweens.add({ targets: ic, y: py - 6, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const t = scene.add.text(px, py + 26, it.label, {
        fontFamily: 'Prompt, Sarabun, sans-serif', fontSize: '15px', color: '#ffd75e',
        stroke: '#1a0f05', strokeThickness: 2
      }).setOrigin(0.5).setDepth(9);
      this.dockItems.push({ ic, t, x: px, y: py, key: it.key });
    });
    this._updateDockLabels();
  },

  _updateDockLabels() {
    const need = CONFIG.CO2_PER_CYCLE;
    const loaded = GameState.co2Loaded || 0;
    this.dockItems.forEach(it => {
      if (it.key === 'pickup_co2' && it.t) {
        it.t.setText(`CO₂ ${loaded}/${need}`);
        it.t.setColor(loaded >= need ? '#8dff8d' : '#ffd75e');
      }
    });
  },

  _setDock(show) {
    this.dockItems.forEach(it => {
      if (it.ic) {
        if (show) {
          it.ic.setAlpha(1).setScale(1.1);
        } else {
          it.ic.setAlpha(0).setScale(0.3);
        }
      }
      if (it.t) it.t.setAlpha(show ? 1 : 0.2);
    });
  },

  _highlightMachine(idx, on) {
    const m = this.machineObjs[idx];
    if (!m) return;
    const scene = GameState.phaserScene;
    if (on) {
      if (m.lampTween) m.lampTween.remove();
      m.lamp.setFillStyle(0xff4444, 1);
      m.lampTween = scene.tweens.add({
        targets: m.lamp, scale: { from: 1, to: 1.8 }, alpha: { from: 1, to: 0.3 },
        duration: 340, yoyo: true, repeat: -1
      });
      scene.tweens.add({
        targets: m.windowAtoms, alpha: { from: 0.4, to: 1 },
        duration: 300, yoyo: true, repeat: -1
      });
    } else {
      if (m.lampTween) { m.lampTween.remove(); m.lampTween = null; }
      scene.tweens.killTweensOf(m.lamp);
      m.lamp.setScale(1).setAlpha(1).setFillStyle(0x444444, 1);
      m.windowAtoms.forEach(wa => {
        scene.tweens.killTweensOf(wa);
        wa.setAlpha(0.4);
      });
    }
  },

  _deliverResources(onDone) {
    const scene = GameState.phaserScene;
    const cx = CONFIG.CYCLE_CENTER.x;
    const cy = CONFIG.CYCLE_CENTER.y;
    const groups = [
      { key: 'pickup_co2', n: CONFIG.CO2_PER_CYCLE, target: this.machineObjs[0], spread: 28 },
      { key: 'pickup_atp', n: 9, target: this.machineObjs[1], spread: 42 },
      { key: 'pickup_nadph', n: 6, target: this.machineObjs[1], spread: 42 }
    ];
    let total = 0;
    groups.forEach(g => total += g.n);
    let doneCount = 0;
    const resolve = () => { doneCount++; if (doneCount >= total) onDone(); };
    this._setDock(false);
    groups.forEach(g => {
      for (let i = 0; i < g.n; i++) {
        const a = (i / g.n) * Math.PI * 2;
        const sx = cx + Math.cos(a) * 14;
        const sy = cy + Math.sin(a) * 10;
        const ic = scene.add.image(sx, sy, g.key).setDepth(22).setScale(0.9);
        this.molObjects.push(ic);
        scene.tweens.add({
          targets: ic,
          x: g.target.x + Math.cos(a) * g.spread * 0.5,
          y: g.target.y + Math.sin(a) * g.spread * 0.5,
          scale: 0.5, alpha: 0.3,
          delay: 120, duration: 950 + i * 50, ease: 'Cubic.easeIn',
          onComplete: () => { ic.destroy(); resolve(); }
        });
      }
    });
    UI.updateChalkboard(
      'DELIVERY', '🚚 กำลังส่งสารเข้าเครื่องจักร...',
      'CO₂ → เครื่องที่ 1 · ATP+NADPH → เครื่องที่ 2',
      'CO2 ' + CONFIG.CO2_PER_CYCLE + ', ATP 9, NADPH 6', 'กำลังวางสาร...', '-'
    );
  },

  triggerAction() {
    if (GameState.isCycleRunning || this.actionInProgress) return;
    const need = CONFIG.CO2_PER_CYCLE;
    const loaded = GameState.co2Loaded || 0;
    if (loaded < need) {
      if ((GameState.res.CO2 || 0) <= 0) {
        UI.showToast(`⚠️ ต้องการคาร์บอนเพิ่ม ${need - loaded} — ไปเก็บ CO₂ จากเครื่องดูดก่อน`, 2200);
        return;
      }
      const inTeaching = (GameState.totalCycles || 0) < 6;
      let put = inTeaching ? 1 : Math.min(GameState.res.CO2, need - loaded);
      if (put <= 0) return;
      GameState.res.CO2 -= put;
      GameState.co2Loaded = loaded + put;
      GameState.co2Inserts = (GameState.co2Inserts || 0) + 1;
      UI.updateInventory();
      if (typeof SFX !== 'undefined' && SFX.play) SFX.play('insert');
      this._updateDockLabels();
      GameState.save();
      const left = need - GameState.co2Loaded;
      if (left > 0) {
        if (inTeaching) {
          UI.showToast(`🌫️ ใส่คาร์บอนแล้ว ${GameState.co2Loaded}/${need} — ต้องการเพิ่มอีก ${left} (ทีละ 1 เฉพาะ 6 รอบแรก)`, 2400);
        } else {
          UI.showToast(`🌫️ ใส่คาร์บอน +${put} → ${GameState.co2Loaded}/${need} — ต้องการเพิ่มอีก ${left}`, 2200);
        }
        UI.updateChalkboard(
          'CO₂ LOADING',
          `🌫️ ใส่ CO₂ แล้ว ${GameState.co2Loaded}/${need}`,
          inTeaching ? 'ช่วงสอน (6 รอบแรก): เก็บ CO₂ ทีละ 1 แล้วกด SPACE ใส่ทีละครั้ง' : 'ใส่ CO₂ ทีเดียวได้ตามจำนวนที่มี',
          `CO₂ ${GameState.co2Loaded}/${need}`,
          `ยังต้องการอีก ${left} คาร์บอน`,
          '-'
        );
      } else {
        UI.showToast(`✅ CO₂ ครบ ${need} แล้ว! ถ้ามี ATP ≥9 + NADPH ≥6 กด SPACE เริ่ม Calvin ได้เลย`, 2600);
        UI.updateChalkboard(
          'CO₂ READY',
          `✅ CO₂ ครบ ${need}/${need} — พร้อมเริ่มวัฏจักร`,
          'ต่อไปเช็ค ATP + NADPH แล้วกด SPACE ที่กลางวง',
          `CO₂ ${need}, ATP ${GameState.res.ATP || 0}, NADPH ${GameState.res.NADPH || 0}`,
          'กด SPACE เริ่ม Calvin',
          '-'
        );
      }
      return;
    }
    if (GameState.pendingAction) {
      const cb = GameState.pendingAction;
      GameState.pendingAction = null;
      cb();
    } else {
      this.startCycle();
    }
  },

  getCycleDuration() {
    let tutDone = false;
    try { tutDone = !!localStorage.getItem('calvin_tutorial_done'); } catch (e) { tutDone = false; }
    return (tutDone && CONFIG.CALVIN_CYCLE_FAST_MS) ? CONFIG.CALVIN_CYCLE_FAST_MS : CONFIG.CALVIN_CYCLE_MS;
  },

  canStart() {
    const r = GameState.res;
    return (GameState.co2Loaded || 0) >= CONFIG.CO2_PER_CYCLE && r.ATP >= 9 && r.NADPH >= 6;
  },

  startCycle() {
    if (GameState.isCycleRunning || this.actionInProgress) return;
    this._pendingAutoRestart = false;
    const need = CONFIG.CO2_PER_CYCLE;
    if ((GameState.co2Loaded || 0) < need) {
      const tip = ((GameState.totalCycles || 0) < 6)
        ? 'เดินมากด SPACE ใส่ CO₂ ทีละ 1 (เฉพาะ 6 รอบแรก)'
        : 'เดินมากด SPACE ใส่ CO₂ จากที่เก็บไว้';
      UI.showToast(`⚠️ ต้องการคาร์บอนเพิ่ม ${need - (GameState.co2Loaded || 0)} — ${tip}`, 2200);
      return;
    }
    if (!this.canStart()) {
      UI.showToast('⚠️ วัตถุดิบไม่เพียงพอ! ต้องการ CO₂ ที่ใส่เครื่องแล้ว ≥3, ATP ≥9, NADPH ≥6', 2400);
      return;
    }
    GameState.isCycleRunning = true;
    this.actionInProgress = true;
    this.cycleDuration = this.getCycleDuration();
    this.cycleStartTime = performance.now();

    GameState.co2Loaded = 0;
    GameState.res.ATP -= 9;
    GameState.res.NADPH -= 6;
    UI.updateInventory();
    this._updateDockLabels();
    GameState.save();

    UI.setActionButton('⏳ กำลังส่งสารเข้าเครื่องจักร...', false, null);
    this._setDock(false);
    this._highlightMachine(0, true);

    const afterDelivery = () => {
      UI.setMachineStatus(1, 'run');
      this._highlightStation(0, true);
      this._highlightStation(1, true);
      GameState.cycleStage = 0;
      if (typeof SFX !== 'undefined' && SFX.play) SFX.play('phase');
      UI.updateChalkboard(
        'PHASE 1: FIXATION',
        '🌫️➡️🧩 เครื่องที่ 1: Carbon Fixation',
        '3 RuBP (5C) + 3 CO2 (1C) → สาร 6C ×3 → แตก → 3-PGA ×6 (3C)',
        '3 RuBP + 3 CO2',
        '3-PGA ×6 (ส่งให้เครื่องที่ 2)',
        'ไม่มี (ทุกอย่างแปลง)'
      );
      UI.setActionButton('⏳ วัฏจักรกำลังทำงาน...', false, null);
      this._clearMols();
      this._runPhase0();
      UI.showAutoButton(true);
    };

    this._deliverResources(afterDelivery);
  },

  _clearMols() {
    this.molObjects.forEach(m => { if (m && m.destroy) m.destroy(); });
    this.molObjects = [];
  },

  _spawnMol(scene, key, x, y, scale = 1) {
    const img = scene.add.image(x, y, `mol_${key}`).setScale(scale).setDepth(20);
    this.molObjects.push(img);
    return img;
  },

  _moveMolRing(img, fromAng, toAng, R, duration, onDone) {
    const scene = GameState.phaserScene;
    const cx = CONFIG.CYCLE_CENTER.x, cy = CONFIG.CYCLE_CENTER.y;
    scene.tweens.addCounter({
      from: 0, to: 1, duration, ease: 'Cubic.easeInOut',
      onUpdate: (tw) => {
        const t = tw.getValue();
        const ang = fromAng + (toAng - fromAng) * t;
        img.x = cx + Math.cos(ang) * R;
        img.y = cy + Math.sin(ang) * R;
        img.rotation = ang + Math.PI / 2;
      },
      onComplete: () => { if (onDone) onDone(); }
    });
  },

  _highlightStation(idx, on) {
    const s = this.stationObjs[idx];
    if (!s || !s.img || !s.halo) return;
    if (on) {
      GameState.phaserScene.tweens.add({
        targets: [s.halo, s.img],
        scale: { from: 1, to: 1.18 },
        duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    } else {
      GameState.phaserScene.tweens.killTweensOf([s.halo, s.img]);
      GameState.phaserScene.tweens.add({
        targets: [s.img], scale: 1, duration: 300, ease: 'Power2'
      });
      GameState.phaserScene.tweens.add({
        targets: [s.halo], scale: 1, duration: 300, ease: 'Power2'
      });
    }
  },

  _updateProgress() {
    const elapsed = performance.now() - this.cycleStartTime;
    const pct = Math.min(100, (elapsed / this.cycleDuration) * 100);
    UI.updateCycleProgress(pct, this.cycleDuration - elapsed);
    return pct;
  },

  _runPhase0() {
    const scene = GameState.phaserScene;
    this._clearMols();
    const cx = CONFIG.CYCLE_CENTER.x, cy = CONFIG.CYCLE_CENTER.y;
    const R = CONFIG.CYCLE_RADIUS - 40;
    const s5 = this.stationObjs[5];
    for (let i = 0; i < 3; i++) {
      const m = this._spawnMol(scene, 'rubp', s5.x + (i-1)*26, s5.y, 0.65);
      scene.tweens.add({
        targets: m, y: s5.y - 18, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        delay: i * 60
      });
    }

    const stageDur = this.cycleDuration * 0.33;
    this._phaseTimer = scene.time.delayedCall(stageDur, () => this._runPhase1());

    scene.time.addEvent({
      delay: 60,
      loop: Math.ceil(stageDur / 60) - 1,
      callback: () => this._updateProgress()
    });
  },

  _runPhase1() {
    const scene = GameState.phaserScene;
    const cx = CONFIG.CYCLE_CENTER.x, cy = CONFIG.CYCLE_CENTER.y;
    const R = CONFIG.CYCLE_RADIUS - 40;
    this._highlightStation(0, true);
    this._highlightStation(1, true);

    let done = 0;
    const startCount = this.molObjects.length;
    for (let i = 0; i < Math.min(3, startCount); i++) {
      const mol = this.molObjects[i];
      const from = (5 / 6) * Math.PI * 2 - Math.PI / 2;
      const to = (1 / 6) * Math.PI * 2 - Math.PI / 2 + Math.PI * 2;
      this._moveMolRing(mol, from, to, R, 900, () => {
        scene.cameras.main.shake(80, 0.006);
        mol.alpha = 0.3;
        const ang = to;
        const halfOffsets = [-16, 16];
        halfOffsets.forEach((ox, k) => {
          const piece = this._spawnMol(scene, 'g3p', mol.x + ox, mol.y, 0.5);
          piece.setTint(k === 0 ? 0xffaaaa : 0xffccaa);
          const finalAng = ang + (k === 0 ? -0.16 : 0.16);
          scene.tweens.add({
            targets: piece,
            x: cx + Math.cos(finalAng) * R,
            y: cy + Math.sin(finalAng) * R,
            duration: 600, ease: 'Back.easeOut'
          });
        });
        scene.tweens.add({ targets: mol, alpha: 0, scale: 0.2, duration: 400, onComplete: () => mol.destroy() });
        done++;
        if (done === Math.min(3, startCount)) {
          this._highlightStation(0, false);
          this._highlightStation(1, false);
          this._highlightMachine(0, false);
          this.molObjects = this.molObjects.filter(m => m.active && m.alpha > 0.1);
          UI.setMachineStatus(1, 'wait');
          UI.setMachineStatus(2, 'run');
          this._highlightMachine(1, true);
          this._highlightStation(2, true);
          this._highlightStation(3, true);
          GameState.cycleStage = 1;
          UI.updateChalkboard(
            'PHASE 2: REDUCTION',
            '⚡💧➡️🧪 เครื่องที่ 2: Reduction (ชาร์จพลังงาน)',
            '3-PGA×6 + ATP×6 → 1,3-BPG×6 แล้ว + NADPH×6 → G3P×6',
            '3-PGA 6 + ATP 6 + NADPH 6',
            'G3P ×6 (ส่งเครื่องที่ 3)',
            'ADP 6, NADP+ 6, Pi 12 (รีไซเคิลที่ขั้นตอนแสง)'
          );
          this._runPhase2();
        }
      });
    }
  },

  _runPhase2() {
    const scene = GameState.phaserScene;
    const R = CONFIG.CYCLE_RADIUS - 40;
    const items = this.molObjects.slice(0, 6);
    const stageDur = this.cycleDuration * 0.34;
    let done = 0;
    items.forEach((mol, i) => {
      const from = (1 / 6) * Math.PI * 2 - Math.PI / 2 + (i % 2 === 0 ? -0.16 : 0.16);
      const to = (3 / 6) * Math.PI * 2 - Math.PI / 2;
      this._moveMolRing(mol, from, to, R, 1000, () => {
        mol.setTint(0x5fff5f);
        done++;
        if (done === items.length) {
          this._highlightStation(2, false);
          this._highlightStation(3, false);
          this._highlightMachine(1, false);
          UI.setMachineStatus(2, 'wait');
          UI.setMachineStatus(3, 'run');
          this._highlightMachine(2, true);
          this._highlightStation(4, true);
          this._highlightStation(5, true);
          GameState.cycleStage = 2;
          UI.updateChalkboard(
            'PHASE 3: YIELD + REGENERATION',
            '🧬🔄➡️RuBP เครื่องที่ 3: ผลิตน้ำตาล + ฟื้นฟู',
            'G3P 6 → 1 ตัวทำน้ำตาล + 5 ตัวฟื้นฟู RuBP ด้วย ATP 3',
            'G3P 5 + ATP 3',
            'RuBP 3 (พร้อมรอบใหม่) + G3P 1 ออกผลิต',
            'ADP 3 (รีไซเคิล)'
          );
          this._runPhase3();
        }
      });
    });
    scene.time.addEvent({
      delay: 60,
      loop: Math.ceil(stageDur / 60) - 1,
      callback: () => this._updateProgress()
    });
  },

  _runPhase3() {
    const scene = GameState.phaserScene;
    const R = CONFIG.CYCLE_RADIUS - 40;
    const cx = CONFIG.CYCLE_CENTER.x, cy = CONFIG.CYCLE_CENTER.y;
    const stageDur = this.cycleDuration * 0.33;
    const items = this.molObjects.filter(m => m.active);
    let done = 0;
    const moved = [];
    items.slice(0, 6).forEach((mol, i) => {
      const from = (3 / 6) * Math.PI * 2 - Math.PI / 2;
      const to = (5 / 6) * Math.PI * 2 - Math.PI / 2;
      this._moveMolRing(mol, from, to, R, 900, () => {
        moved.push(mol);
        done++;
        if (done === Math.min(6, items.length)) {
          const picked = moved[0];
          scene.tweens.add({
            targets: picked,
            x: cx,
            y: cy - 160,
            scale: 1.05,
            duration: 900,
            ease: 'Cubic.easeOut',
            onComplete: () => {
              GameState.res.G3P += 1;
              UI.updateInventory();
              if (GameState.phaserScene && GameState.phaserScene._updateSugarMachineStatus) {
                GameState.phaserScene._updateSugarMachineStatus();
              }
              scene.cameras.main.flash(400, 255, 220, 120);
              scene.tweens.add({ targets: picked, alpha: 0, scale: 0.2, duration: 700, onComplete: () => picked.destroy() });
              moved.splice(0, 1);

              if (GameState.res.G3P >= 2) {
                this._assembleSugar();
              } else if (GameState.res.G3P === 1) {
                UI.showToast('🧪 ได้ G3P 1 โมเลกุล — ต้องการเข้าคาลวินอีก 1 ครั้ง เพื่อสร้างน้ำตาล 🍬', 2600);
              }

              GameState.totalCycles += 1;
              UI.updateCycleStats();

              const regenItems = moved.filter(m => m.active);
              const s5 = this.stationObjs[5];
              regenItems.forEach((m, idx) => {
                scene.tweens.add({
                  targets: m,
                  x: s5.x + (idx - 1) * 26,
                  y: s5.y,
                  duration: 900,
                  delay: idx * 60,
                  ease: 'Cubic.easeInOut',
                  onComplete: () => {
                    m.clearTint();
                    if (idx === regenItems.length - 1) {
                      this._finishCycle();
                    }
                  }
                });
              });
            }
          });
        }
      });
    });

    scene.time.addEvent({
      delay: 60,
      loop: Math.ceil(stageDur / 60) - 1,
      callback: () => this._updateProgress()
    });
  },

  _assembleSugar() {
    const scene = GameState.phaserScene;
    const fx = CONFIG.CYCLE_CENTER.x;
    const fy = CONFIG.CYCLE_CENTER.y + 140;
    const robot = this._spawnMol(scene, 'robot', fx, fy - 200, 0.1);
    robot.alpha = 0;
    scene.tweens.add({
      targets: robot,
      scale: 1.05, alpha: 1, y: fy,
      duration: 1400, ease: 'Back.easeOut',
      onComplete: () => {
        GameState.res.G3P = 0;
        GameState.sugarReady = (GameState.sugarReady || 0) + 1;
        GameState.totalGlucose += 1;
        UI.updateInventory();
        UI.updateCycleStats();
        if (GameState.phaserScene && GameState.phaserScene._updateSugarMachineStatus) {
          GameState.phaserScene._updateSugarMachineStatus();
        }
        scene.cameras.main.flash(500, 255, 255, 180);
        UI.showToast('🍬 ประกอบน้ำตาลเสร็จ! น้ำตาลไหลไปที่เครื่องบรรจุ → เดินไปกด SPACE เก็บ', 2600);
        if (typeof SFX !== 'undefined' && SFX.play) SFX.play('sugar');
        GameState.save();
        scene.time.delayedCall(2400, () => {
          scene.tweens.add({ targets: robot, alpha: 0, scale: 0.3, y: fy - 80, duration: 1000, onComplete: () => robot.destroy() });
        });
      }
    });
  },

  _finishCycle() {
    UI.updateCycleProgress(100, 0);
    UI.setMachineStatus(3, 'wait');
    this._highlightStation(4, false);
    this._highlightStation(5, false);
    this._highlightMachine(2, false);
    this._setDock(true);
    GameState.isCycleRunning = false;
    this.actionInProgress = false;
    GameState.cycleStage = -1;

    this._clearMols();

    GameState.save();

    UI.updateChalkboard('DONE ✓', '✅ วัฏจักรเสร็จสิ้น! RuBP กลับมาพร้อม',
      'RuBP 3 ตัวพร้อม สามารถเริ่มรอบใหม่ได้ทันที',
      '-', 'RuBP ×3 พร้อมใช้', '-');

    const dur = this.getCycleDuration();
    UI.setActionButton('▶ เริ่มวัฏจักรคาลวิน (' + (dur/1000).toFixed(2) + ' วิ/รอบ)', true, () => this.startCycle());
    if (typeof SFX !== 'undefined' && SFX.play) SFX.play('cycleDone');

    if (GameState.autoCycle) {
      const need = CONFIG.CO2_PER_CYCLE;
      const missing = need - (GameState.co2Loaded || 0);
      const have = GameState.res.CO2 || 0;
      if (missing > 0 && have >= missing) {
        GameState.res.CO2 -= missing;
        GameState.co2Loaded = need;
        UI.updateInventory();
        this._updateDockLabels();
        GameState.save();
      }
      if (this.canStart()) {
        this._pendingAutoRestart = true;
        GameState.phaserScene.time.delayedCall(400, () => {
          this._pendingAutoRestart = false;
          if (GameState.autoCycle) this.startCycle();
        });
      } else {
        this._pendingAutoRestart = false;
        if (GameState.res.CO2 || 0) {
          UI.showToast('🔁 AUTO: CO₂ ที่มีไม่พอเต็มรอบ — AUTO จะวนต่อเองทันทีที่ CO₂ ครบ', 2400);
        }
      }
    }
  },

  // เตรียมเครื่องคาลวินให้พร้อมก่อนโหลดเซฟ/เริ่มใหม่ (ล้างสถานะกลางรอบให้ปลอดภัย)
  resetForLoad() {
    const scene = GameState.phaserScene;
    GameState.isCycleRunning = false;
    GameState.cycleStage = -1;
    GameState.pendingAction = null;
    this.actionInProgress = false;
    this._pendingAutoRestart = false;
    if (this._phaseTimer && this._phaseTimer.remove) {
      try { this._phaseTimer.remove(); } catch (e) {}
      this._phaseTimer = null;
    }
    if (scene && scene.tweens) {
      (this.molObjects || []).forEach(m => { if (scene.tweens.killTweensOf) scene.tweens.killTweensOf(m); });
      (this.stationObjs || []).forEach((s, i) => { try { this._highlightStation(i, false); } catch (e) {} });
      (this.machineObjs || []).forEach((m, i) => { try { this._highlightMachine(i, false); } catch (e) {} });
    }
    this._clearMols();
    this._setDock(true);
    this._updateDockLabels();
    if (typeof UI !== 'undefined' && UI) {
      if (typeof UI.updateCycleProgress === 'function') UI.updateCycleProgress(0, 0);
      if (typeof UI.setMachineStatus === 'function') UI.setMachineStatus(0, 'wait');
      if (typeof UI.updateChalkboard === 'function') {
        UI.updateChalkboard('READY', 'เครื่องคาลวินพร้อมทำงาน',
          'บ่อน้ำ → Light Reaction → ATP + NADPH → คาลวิน → น้ำตาล',
          '-', 'RuBP ×3 พร้อมใช้', '-');
      }
      const dur = this.getCycleDuration();
      if (typeof UI.setActionButton === 'function') {
        UI.setActionButton('▶ เริ่มวัฏจักรคาลวิน (' + (dur / 1000).toFixed(2) + ' วิ/รอบ)', true, () => this.startCycle());
      }
    }
  }
};
