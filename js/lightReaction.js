const LightReaction = {
  isRunning: false,
  _scene: null,
  _waterTank: 0,
  _notified: false,

  // One load of water is processed in about one second.
  BASE_TICK_MS: 1000,
  WATER_PER_TICK: 1,
  WATER_TANK_CAPACITY: 20,
  GAIN_ATP: 2,
  GAIN_NADPH: 2,

  startProducer(scene) {
    this._scene = scene;
    this._waterTank = 0;
    this._notified = false;
    if (UI && UI.updateChalkboard) {
      UI.updateChalkboard(
        'LIGHT: READY',
        '🌊 นำน้ำ H₂O ไปใส่กล่องน้ำของเครื่องขั้นแสง',
        'บ่อน้ำ → กล่องน้ำเครื่อง Light Reaction → ATP + NADPH → คาลวิน',
        'H₂O ในกล่อง 0/' + this.WATER_TANK_CAPACITY,
        `ATP +${this.GAIN_ATP} + NADPH +${this.GAIN_NADPH}`,
        'O₂ ปล่อยออกสู่บรรยากาศ'
      );
    }
    this._updateTankDisplay();
  },

  stopProducer() {
    this.isRunning = false;
    this._waterTank = 0;
    this._updateTankDisplay();
  },

  loadWater(scene) {
    if (!scene) return;
    const availableSpace = this.WATER_TANK_CAPACITY - this._waterTank;
    if (availableSpace <= 0) {
      if (UI && UI.showToast) {
        UI.showToast('📦 กล่องน้ำเต็มแล้ว รอให้เครื่องใช้น้ำก่อน', 1600);
      }
      return;
    }

    const moved = Math.min(GameState.res.WATER || 0, availableSpace);
    if (moved <= 0) {
      if (UI && UI.showToast) UI.showToast('⚠️ ตักน้ำจากบ่อน้ำก่อน แล้วนำมาใส่กล่อง', 1600);
      return;
    }

    GameState.res.WATER -= moved;
    this._waterTank += moved;
    this._notified = false;
    this._updateTankDisplay();
    UI.updateInventory();
    GameState.save();
    UI.showToast(`📦 ใส่น้ำ ${moved} หน่วยในกล่อง (${this._waterTank}/${this.WATER_TANK_CAPACITY})`, 1500);
    if (!this.isRunning) this._startNextTick(scene);
  },

  _startNextTick(scene) {
    if (!scene || this._waterTank < this.WATER_PER_TICK) {
      this.isRunning = false;
      this._updateTankDisplay();
      return;
    }
    this.isRunning = true;
    this._updateTankDisplay();
    scene.time.delayedCall(this.BASE_TICK_MS, () => this._tick(scene));
  },

  _tick(scene) {
    if (this._waterTank < this.WATER_PER_TICK) {
      this.isRunning = false;
      this._updateTankDisplay();
      return;
    }
    try {
      this._waterTank -= this.WATER_PER_TICK;
      const res = GameState.res;
      const gainAtP = this.GAIN_ATP;
      const gainNadph = this.GAIN_NADPH;
      res.ATP = Math.min(CONFIG.RESOURCES.ATP.max, (res.ATP || 0) + gainAtP);
      res.NADPH = Math.min(CONFIG.RESOURCES.NADPH.max, (res.NADPH || 0) + gainNadph);
      GameState.atpMade = (GameState.atpMade || 0) + gainAtP;
      UI.updateInventory();
      GameState.save();

      this._updateTankDisplay();
      if (!this._notified && UI && UI.showToast) {
        this._notified = true;
        UI.showToast('🌊 Light Reaction ผลิต ATP + NADPH แล้ว', 1800);
      }
      if (typeof SFX !== 'undefined' && SFX.play) SFX.play('produce');

      if (!scene) return;
      const cfg = CONFIG.LIGHT_MACHINE_WORLD;
      const cx = cfg.x;
      const cy = cfg.y - 12;
      const tx = scene.add.text(cx, cy - 24, `+${gainAtP} ⚡ATP  +${gainNadph} 💧NADPH`, {
        fontFamily: 'Prompt, Sarabun, sans-serif', fontSize: '11px', color: '#d0ffb0',
        stroke: '#12240f', strokeThickness: 3
      }).setOrigin(0.5).setDepth(200);
      scene.tweens.add({
        targets: tx, y: cy - 110, alpha: 0, scale: 1.3,
        duration: 700, ease: 'Cubic.easeOut', onComplete: () => tx.destroy()
      });
      for (let b = 0; b < 2; b++) {
        const bub = scene.add.text(cx + (Math.random() - 0.5) * 60, cy - 6, 'O₂', {
          fontFamily: 'Prompt, Sarabun, sans-serif', fontSize: '15px', color: '#ff8a8a',
          stroke: '#1a0f05', strokeThickness: 2
        }).setDepth(200);
        scene.tweens.add({
          targets: bub, y: cy - 130 - b * 18, alpha: 0, scale: 1.4,
          duration: 700 + b * 80, ease: 'Cubic.easeOut', onComplete: () => bub.destroy()
        });
      }
      // ไม่ flash จอบนี้ — ใช้ flash ตอนหยิบ/เก็บของแทน (player.js)
    } catch (err) {
      if (console && console.error) console.error('[LightReaction] tick error:', err);
    } finally {
      this._startNextTick(scene);
    }
  },

  _updateTankDisplay() {
    if (this._scene && this._scene.updateLightMachineTank) {
      this._scene.updateLightMachineTank(this._waterTank, this.WATER_TANK_CAPACITY, this.isRunning);
    }
    if (UI && UI.updateChalkboard) {
      UI.updateChalkboard(
        this.isRunning ? 'LIGHT: RUNNING' : 'LIGHT: WAITING FOR WATER',
        this.isRunning ? 'เครื่องกำลังใช้น้ำจากกล่องเพื่อผลิต ATP + NADPH' : 'เติมน้ำลงกล่องของเครื่องขั้นแสงเพื่อเริ่มทำงาน',
        'บ่อน้ำ → กล่องน้ำเครื่อง Light Reaction → ATP + NADPH → คาลวิน',
        `H₂O ในกล่อง ${this._waterTank}/${this.WATER_TANK_CAPACITY}`,
        `ATP +${this.GAIN_ATP} + NADPH +${this.GAIN_NADPH} ต่อ H₂O 1 หน่วย`,
        this.isRunning ? 'กล่องน้ำลดลงทุก 1 วินาที' : 'น้ำหมด — เครื่องหยุดทำงาน'
      );
    }
  }
};
