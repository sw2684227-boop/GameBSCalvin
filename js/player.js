const Player = {
  sprite: null,
  keys: null,
  dir: 'down',
  frame: 0,
  animTimer: 0,
  isMoving: false,
  blockedRects: [],

  create(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.add.image(x, y, 'player_down_0').setDepth(100).setScale(1);
    this.keys = scene.input.keyboard.addKeys({
      up: 'W', up2: 'UP',
      down: 'S', down2: 'DOWN',
      left: 'A', left2: 'LEFT',
      right: 'D', right2: 'RIGHT',
      interact: 'SPACE', interact2: 'E'
    });
    return this.sprite;
  },

  setBlockedRects(rects) { this.blockedRects = rects || []; },

  _isBlocked(nx, ny) {
    // ปิดการชนทั้งหมด - ให้ผู้เล่นเดินทะลุได้หมด
    // เก็บเฉพาะขอบแมพเท่านั้น
    const margin = 20;
    if (nx < margin || nx > CONFIG.WORLD_WIDTH - margin) return true;
    if (ny < margin || ny > CONFIG.WORLD_HEIGHT - margin) return true;
    return false;
  },

  update(dt, scene) {
    if (!this.sprite) return;
    let vx = 0, vy = 0;
    const k = this.keys;
    const vk = window.VirtualKeys;
    if (k.up.isDown || k.up2.isDown || (vk && vk.up)) vy -= 1;
    if (k.down.isDown || k.down2.isDown || (vk && vk.down)) vy += 1;
    if (k.left.isDown || k.left2.isDown || (vk && vk.left)) vx -= 1;
    if (k.right.isDown || k.right2.isDown || (vk && vk.right)) vx += 1;
    this.isMoving = (vx !== 0 || vy !== 0);
    if (this.isMoving) {
      const len = Math.sqrt(vx*vx + vy*vy) || 1;
      vx /= len; vy /= len;
      if (Math.abs(vx) > Math.abs(vy)) this.dir = (vx > 0) ? 'right' : 'left';
      else this.dir = (vy > 0) ? 'down' : 'up';
      
      // ใช้ delta time แท้จริงเพื่อ smooth movement
      const actualDt = Math.min(dt, 32); // จำกัดไม่ให้กระโดดมากเกินไป
      const spd = CONFIG.PLAYER_SPEED * (actualDt / 16.67);
      const nx = this.sprite.x + vx * spd;
      const ny = this.sprite.y + vy * spd;
      if (!this._isBlocked(nx, this.sprite.y)) this.sprite.x = nx;
      if (!this._isBlocked(this.sprite.x, ny)) this.sprite.y = ny;
      this.animTimer += actualDt;
      if (this.animTimer > CONFIG.ANIM_SPEED) {
        this.animTimer = 0;
        this.frame = (this.frame + 1) % 4;
      }
    } else {
      this.frame = 0;
    }
    const tex = `player_${this.dir}_${this.frame}`;
    if (this.sprite.texture.key !== tex) this.sprite.setTexture(tex);
    if (k.interact.isDown || k.interact2.isDown) this._tryInteract(scene);
    if (vk && vk.interact) {
      vk.interact = false;
      this._tryInteract(scene);
    }
  },

  _tryInteract(scene) {
    if (this._interactCd && Date.now() - this._interactCd < 400) return;
    this._interactCd = Date.now();
    // ระหว่างคัทซีนเต็มจอให้ล็อกปุ่มกดทั้งหมด
    if (GameState.cutsceneActive || GameState.tutorialActive && document.getElementById('tutorial-overlay') && !document.getElementById('tutorial-overlay').classList.contains('hidden')) {
      return;
    }
    if (GameState.currentLocation === 'factory') {
      const pond = CONFIG.WATER_POND;
      const pondDistance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, pond.x, pond.y);
      if (pondDistance < pond.radius + 18) {
        this.scene._collectWaterFromPond();
        this.scene.cameras.main.flash(160, 120, 220, 255);
        return;
      }

      const co2Station = CONFIG.CO2_COLLECTOR;
      if (co2Station) {
        const co2Distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, co2Station.x, co2Station.y);
        if (co2Distance < co2Station.radius + 24) {
          this.scene._collectCo2FromStation();
          return;
        }
      }

      const machine = CONFIG.LIGHT_MACHINE_WORLD;
      const machineDistance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, machine.x, machine.y);
      if (machineDistance < 130) {
        LightReaction.loadWater(this.scene);
        this.scene.cameras.main.flash(160, 255, 231, 74);
        return;
      }

      const d = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        CONFIG.CYCLE_CENTER.x, CONFIG.CYCLE_CENTER.y
      );
      if (d < 300) {
        CalvinCycle.triggerAction();
        scene.cameras.main.flash(200, 120, 200, 80);
        return;
      }
    }
    UI.showToast('💡 ใกล้เคียงเครื่องจักรแล้วกด SPACE หรือกดปุ่มด้านล่าง', 1400);
  }
};
