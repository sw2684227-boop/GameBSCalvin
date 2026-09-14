const PixelAssets = {
  generateAll(scene) {
    this.genGrounds(scene);
    this.genPlayer(scene);
    this.genGrass(scene);
    this.genPath(scene);
    this.genTree(scene);
    this.genFactory(scene);
    this.genCycleStation(scene);
    this.genMolecules(scene);
    this.genClouds(scene);
    this.genSunTiles(scene);
    this.genWaterTiles(scene);
    this.genCollectibles(scene);
    this.genSigns(scene);
  },

  /* ── ชุดรูปวาดสไตล์การ์ตูน (โค้งมน, รอยยิ้ม, outline) ── */
  _rr(g, x, y, w, h, r, c, a = 1) { g.fillStyle(c, a); g.fillRoundedRect(x, y, w, h, r); },
  _ol(g, x, y, w, h, r, c, t = 3, a = 1) { g.lineStyle(t, c, a); g.strokeRoundedRect(x, y, w, h, r); },
  _ell(g, cx, cy, rx, ry, c, a = 1) { g.fillStyle(c, a); g.fillEllipse(cx, cy, rx * 2, ry * 2); },
  _circ(g, cx, cy, r, c, a = 1) { g.fillStyle(c, a); g.fillCircle(cx, cy, r); },
  _oc(g, cx, cy, r, c, t = 3, a = 1) { g.lineStyle(t, c, a); g.strokeCircle(cx, cy, r); },

  /* ── พื้นสนาม/น้ำ/ทราย แบบ seamless (1 texture ซ้ำทั้งฉาก ไม่มีรอยต่อ) ── */
  genGrounds(scene) {
    const S = 192;
    const mk = (key, base, patches, extras) => {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(base, 1);
      g.fillRoundedRect(0, 0, S, S, 6);
      (patches || []).forEach(p => { g.fillStyle(p[3], p[4]); g.fillCircle(p[0], p[1], p[2]); });
      (extras || []).forEach(e => {
        if (e.type === 'blade') {
          const a = e.a, x = e.x, y = e.y;
          g.fillStyle(e.c, e.oa || 0.8);
          g.fillEllipse(x, y, 3.5 * a, 7 * a);
        } else if (e.type === 'dot') {
          g.fillStyle(e.c, e.oa || 0.8);
          g.fillCircle(e.x, e.y, e.r);
        } else if (e.type === 'arc') {
          g.fillStyle(e.c, e.oa || 0.5);
          g.fillEllipse(e.x, e.y, e.w, e.h);
        } else if (e.type === 'spark') {
          g.fillStyle(e.c, e.oa || 0.9);
          g.fillCircle(e.x, e.y, e.r);
          g.fillCircle(e.x + 3, e.y - 3, e.r * 0.6);
        }
      });
      g.generateTexture(key, S, S);
    };

    // สนามหญ้าเขียวขจี — ป้ายกลมๆ โทนเขียวอ่อน + ดอกหญ้าเล็กๆ
    const lawnPatches = [
      [44, 52, 27, 0x3f8f3f, 0.5], [122, 44, 23, 0x459545, 0.45],
      [66, 128, 22, 0x357c35, 0.5], [142, 126, 26, 0x3a863a, 0.45],
      [20, 150, 15, 0x459545, 0.4], [100, 92, 15, 0x54a854, 0.45],
      [170, 30, 14, 0x357c35, 0.4]
    ];
    const lawnExtras = [];
    for (let i = 0; i < 16; i++) {
      lawnExtras.push({
        type: 'blade', x: 12 + Math.random() * 168, y: 12 + Math.random() * 158, a: 0.6 + Math.random() * 0.8,
        c: Math.random() > 0.5 ? 0x6ac06a : 0x245f24
      });
    }
    for (let i = 0; i < 4; i++) {
      lawnExtras.push({ type: 'dot', x: 30 + Math.random() * 135, y: 28 + Math.random() * 130, r: 2.2, c: Math.random() > 0.5 ? 0xfff4b8 : 0xffd3e8 });
    }
    mk('ground_factory', CONFIG.COLORS.grass1, lawnPatches, lawnExtras);

    // ท้องฟ้า / ชั้นบรรยากาศ — เมฆปุย
    const skyPatches = [];
    for (let i = 0; i < 7; i++) {
      skyPatches.push([20 + Math.random() * 155, 25 + Math.random() * 140, 14 + Math.random() * 14, 0xffffff, 0.16]);
    }
    for (let i = 0; i < 6; i++) {
      skyPatches.push([30 + Math.random() * 135, 30 + Math.random() * 130, 10, 0x7ab8df, 0.25]);
    }
    mk('ground_sky', 0x3a5f96, skyPatches, null);

    // ทุ่งแสงแดดทราย
    const sunPatches = [
      [50, 55, 30, 0xffd97a, 0.45], [130, 50, 26, 0xffcf6a, 0.4],
      [60, 130, 24, 0xffd97a, 0.4], [140, 135, 28, 0xf6c45c, 0.45],
      [98, 100, 16, 0xffe298, 0.5], [22, 24, 14, 0xffcf6a, 0.35],
      [172, 152, 14, 0xffcf6a, 0.35]
    ];
    const sunExtras = [];
    for (let i = 0; i < 10; i++) {
      sunExtras.push({ type: 'spark', x: 25 + Math.random() * 145, y: 20 + Math.random() * 150, r: 2.4, c: 0xffffb8 });
    }
    mk('ground_sun', 0xe0b64a, sunPatches, sunExtras);

    // น้ำทะเลสาบ
    const waterPatches = [];
    for (let i = 0; i < 8; i++) {
      waterPatches.push([18 + Math.random() * 158, 20 + Math.random() * 152, 16 + Math.random() * 18, 0x5aa8ef, 0.3]);
    }
    for (let i = 0; i < 5; i++) {
      waterPatches.push([30 + Math.random() * 130, 30 + Math.random() * 130, 12, 0x2c64ad, 0.35]);
    }
    const waterExtras = [];
    for (let i = 0; i < 8; i++) {
      waterExtras.push({ type: 'dot', x: 15 + Math.random() * 160, y: 15 + Math.random() * 160, r: 1.8, c: 0xcfeaff });
    }
    mk('ground_water', CONFIG.COLORS.water, waterPatches, waterExtras);
  },

  genPlayer(scene) {
    const s = 32;
    const dirs = ['down', 'up', 'left', 'right'];
    const skin = 0xffd7a0, hat = 0xffd75e, hatD = 0xf0b33a, shirt = 0xff6a4a, overalls = 0x3a6acf, boot = 0x3a2a1a, hairC = 0x5a3a1a;
    dirs.forEach(dir => {
      for (let f = 0; f < 4; f++) {
        const g = scene.make.graphics({ add: false });
        const legA = (f % 2 === 1) ? 0xffde9e : boot;   // สลับขาที่ "ก้าว"
        const armBias = (f % 2 === 1) ? 1 : 0;
        const mirrorL = dir === 'left';

        // เงาใต้เท้า
        this._ell(g, 16, 31, 8, 2, 0x000000, 0.2);

        // ขา & รองเท้า
        this._rr(g, 10, 25, 5, 5, 2, overalls);
        this._rr(g, 17, 25, 5, 5, 2, overalls);
        this._rr(g, 9, 29, 7, 2, 1, legA);
        this._rr(g, 16, 29, 7, 2, 1, boot);

        // แขน
        this._rr(g, 6 + armBias, 19, 4, 8, 2, shirt);
        this._rr(g, 22 - armBias, 19, 4, 8, 2, shirt);
        this._circ(g, 8 + armBias, 27, 2, skin);

        // ลำตัว (เสื้อ + เอี๊ยม)
        this._rr(g, 8, 17, 16, 10, 4, shirt);
        this._rr(g, 10, 19, 12, 8, 3, overalls);
        this._rr(g, 9, 18, 14, 2, 1, 0xfff0c0);

        // หัว (กลม)
        this._circ(g, 16, 12, 8, skin);
        // ผมด้านข้าง
        this._rr(g, 6, 6, 4, 8, 2, hairC);
        this._rr(g, 22, 6, 4, 8, 2, hairC);
        // ปาก
        this._rr(g, 13, 16, 6, 2, 1, 0xd9986a);

        // ตา ตามทิศทาง
        if (dir === 'up') {
          // ด้านหลังศีรษะ — เต็มด้วยขน
          this._circ(g, 16, 12, 8, hairC);
        } else if (dir === 'left' || dir === 'right') {
          const ex = mirrorL ? 11 : 19;
          this._circ(g, ex, 11, 1.6, 0x1a0a0a);
          this._circ(g, ex + (mirrorL ? -3 : 3), 11, 1.6, 0x1a0a0a);
        } else {
          this._circ(g, 12, 11, 1.7, 0x1a0a0a);
          this._circ(g, 20, 11, 1.7, 0x1a0a0a);
        }

        // หมวกนิรภัย
        this._rr(g, 8, 0, 16, 7, 3, hat);
        this._rr(g, 5, 4, 22, 3, 1, hatD);
        this._rr(g, 8, 2, 16, 2, 1, 0xfff0c0);

        g.generateTexture(`player_${dir}_${f}`, s, s);
      }
    });
  },

  genGrass(scene) {
    const s = CONFIG.TILE_SIZE;
    for (let v = 0; v < 4; v++) {
      const g = scene.make.graphics({ add: false });
      this._rr(g, 0, 0, s, s, 4, CONFIG.COLORS.grass1);
      for (let i = 0; i < 8; i++) {
        const x = 4 + Math.random() * (s - 8);
        const y = 4 + Math.random() * (s - 8);
        const c = Math.random() > 0.5 ? CONFIG.COLORS.grass2 : 0x3f843f;
        this._circ(g, x, y, 2.4, c, 0.9);
      }
      for (let i = 0; i < 5; i++) {
        const x = 5 + Math.random() * (s - 10);
        const y = 5 + Math.random() * (s - 10);
        this._ell(g, x, y, 1.8, 3.4, 0x6ac06a, 0.8);
      }
      g.generateTexture(`grass_${v}`, s, s);
    }
  },

  genPath(scene) {
    const s = CONFIG.TILE_SIZE;
    const g = scene.make.graphics({ add: false });
    this._rr(g, 0, 0, s, s, 5, CONFIG.COLORS.path);
    for (let i = 0; i < 7; i++) {
      const x = 4 + Math.random() * (s - 8);
      const y = 4 + Math.random() * (s - 8);
      const c = Math.random() > 0.5 ? CONFIG.COLORS.pathDark : 0xa8885f;
      this._circ(g, x, y, 2.8, c, 0.9);
    }
    for (let i = 0; i < 4; i++) {
      const x = 5 + Math.random() * (s - 10);
      const y = 5 + Math.random() * (s - 10);
      this._ell(g, x, y, 3, 1.6, CONFIG.COLORS.pathDark, 0.7);
    }
    g.generateTexture('path', s, s);
  },

  genTree(scene) {
    const s = 64;
    for (let v = 0; v < 3; v++) {
      const g = scene.make.graphics({ add: false });
      this._ell(g, 34, 62, 16, 5, 0x0a2a0a, 0.3); // เงา
      // ลำต้น
      this._rr(g, 26, 38, 13, 22, 4, CONFIG.COLORS.wood);
      this._ol(g, 26, 38, 13, 22, 4, CONFIG.COLORS.woodDark, 2);
      this._rr(g, 29, 40, 4, 18, 2, 0x7a4a24);
      // พุ่มใบ (วงกลมเรียง)
      const leaf = [0x3a8a3a, 0x4aaa4a, 0x2f7a2f][v];
      const leafH = [0x5ab85a, 0x6aca6a, 0x4aa04a][v];
      this._circ(g, 30, 20, 16, leaf);
      this._circ(g, 46, 22, 15, leaf);
      this._circ(g, 38, 14, 17, leaf);
      this._circ(g, 36, 24, 17, leafH);
      this._ol(g, 20, 6, 34, 30, 18, 0x1f551f, 2.5);
      // ไฮไลต์
      this._circ(g, 26, 10, 5, 0x7ade7a, 0.9);
      // แอปเปิ้ล
      this._circ(g, 33, 16, 3, 0xff5940);
      this._circ(g, 45, 27, 3, 0xff5940);
      this._circ(g, 26, 28, 3, 0xff5940);
      this._circ(g, 34, 31, 3, 0xffb340);
      g.generateTexture(`tree_${v}`, s, s);
    }
  },

  genFactory(scene) {
    const s = 288;
    const g = scene.make.graphics({ add: false });
    const wall = 0x8a5a38, wallL = 0xa06a40, dark = 0x4a2a18;

    this._ell(g, 144, 280, 130, 26, 0x000000, 0.25); // เงา
    // ปล่องควัน
    const stacks = [
      { x: 48, w: 16, h: 78, top: 34 },
      { x: 88, w: 18, h: 92, top: 14 },
      { x: 182, w: 16, h: 70, top: 40 },
      { x: 226, w: 18, h: 96, top: 12 }
    ];
    stacks.forEach(sk => {
      this._rr(g, sk.x, sk.top, sk.w, sk.h, 5, 0x8a8a8a);
      this._ol(g, sk.x, sk.top, sk.w, sk.h, 5, 0x555, 2.5);
      this._rr(g, sk.x + 2, sk.top + 4, sk.w - 4, 8, 4, 0xc94a4a); // แถบสีแดง
      this._rr(g, sk.x + 3, sk.top + 14, sk.w - 6, 6, 3, 0xaaa);
      this._rr(g, sk.x + 3, sk.top + 24, sk.w - 6, 4, 2, 0x999, 0.8);
    });
    // ตัวโรงงาน (โค้งมน)
    this._rr(g, 24, 92, 240, 190, 16, wall);
    this._ol(g, 24, 92, 240, 190, 16, dark, 5);
    // ผนังสองโทน
    this._rr(g, 24, 92, 240, 190, 16, wallL, 0.35);
    // หลังคาแดง
    this._rr(g, 20, 46, 248, 54, 12, 0xbf4a3a);
    this._ol(g, 20, 46, 248, 54, 12, 0x7a2418, 5);
    this._rr(g, 30, 54, 228, 10, 5, 0xd96a5a, 0.8);
    this._rr(g, 30, 70, 228, 10, 5, 0xd96a5a, 0.5);
    // ยอดหลังคากลาง
    this._rr(g, 122, 32, 44, 20, 8, 0x8b3a3a);
    this._ol(g, 122, 32, 44, 20, 8, 0x5a1f1f, 3);
    // หน้าต่างแถวบน
    const win = 0x7ec8f0, winD = 0x2a5a8a;
    [[44, 108], [96, 108], [148, 108], [200, 108]].forEach(([x, y]) => {
      this._rr(g, x, y, 34, 26, 8, win);
      this._ol(g, x, y, 34, 26, 8, winD, 3);
      this._rr(g, x + 6, y + 6, 8, 8, 4, 0xffffff, 0.7);
    });
    // หน้าต่างแถวล่าง
    [[44, 152], [96, 152], [148, 152], [200, 152]].forEach(([x, y]) => {
      this._rr(g, x, y, 34, 26, 8, win);
      this._ol(g, x, y, 34, 26, 8, winD, 3);
      this._rr(g, x + 6, y + 6, 8, 8, 4, 0xffffff, 0.7);
    });
    // หน้าต่างโค้งใหญ่กลาง
    this._rr(g, 110, 128, 68, 56, 12, 0x8fd4ff);
    this._ol(g, 110, 128, 68, 56, 12, winD, 4);
    this._rr(g, 122, 136, 44, 26, 6, 0xffffff, 0.35);
    this._rr(g, 124, 140, 8, 8, 4, 0xffffff, 0.9);
    // ประตูทางเข้า
    this._rr(g, 126, 224, 36, 58, 8, 0x5c3a1a);
    this._ol(g, 126, 224, 36, 58, 8, dark, 4);
    this._rr(g, 132, 230, 24, 48, 6, 0x8b5a2b);
    // ทางเข้าลาดยาง
    this._rr(g, 110, 274, 68, 8, 4, 0xd8b070, 0.9);
    // ป้ายชื่อ + หลอดไฟ
    this._rr(g, 116, 250, 56, 16, 6, 0xfff0c0);
    this._ol(g, 116, 250, 56, 16, 6, dark, 3);
    g.generateTexture('factory_main', s, s);
  },

  genCycleStation(scene) {
    const s = 96;
    for (let i = 0; i < CONFIG.CYCLE_STATIONS; i++) {
      const g = scene.make.graphics({ add: false });
      const col = CONFIG.STATION_COLORS[i];
      const darkC = Phaser.Display.Color.IntegerToColor(col);
      darkC.darken(25);
      const dc = Phaser.Display.Color.GetColor(darkC.r, darkC.g, darkC.b);
      const lightC = Phaser.Display.Color.IntegerToColor(col);
      lightC.lighten(22);
      const lc = Phaser.Display.Color.GetColor(lightC.r, lightC.g, lightC.b);

      this._ell(g, 48, 90, 40, 10, 0x000000, 0.25); // เงา
      // ตู้เครื่องกลมมน
      this._rr(g, 12, 28, 72, 58, 14, col);
      this._ol(g, 12, 28, 72, 58, 14, dc, 4);
      // จอแสดงผล
      this._rr(g, 24, 42, 48, 22, 6, 0x0a2a1a);
      this._ol(g, 24, 42, 48, 22, 6, dc, 2);
      this._rr(g, 28, 46, 40, 6, 3, lc, 0.9);
      this._circ(g, 52, 59, 4, lc);
      // ปุ่ม/หน้าปัดเล็ก
      this._circ(g, 26, 74, 6, 0xffffff);
      this._oc(g, 26, 74, 6, dc, 2);
      this._rr(g, 26, 72, 5, 4, 1, 0x333);
      this._circ(g, 70, 76, 3, 0xff5a5a);
      this._circ(g, 78, 76, 3, 0x5aff5a);
      // ฝาโดมบน
      this._rr(g, 28, 18, 40, 18, 9, lc);
      this._ol(g, 28, 18, 40, 18, 9, dc, 3);
      this._circ(g, 48, 14, 4, col);
      g.generateTexture(`station_${i}`, s, s);
    }
    const g2 = scene.make.graphics({ add: false });
    this._ell(g2, 40, 76, 34, 8, 0x000000, 0.25);
    this._rr(g2, 10, 20, 60, 54, 12, 0x4a2a4a);
    this._ol(g2, 10, 20, 60, 54, 12, 0x2a122a, 4);
    this._rr(g2, 20, 30, 40, 34, 8, 0x7a4a8a);
    // แกนเรืองแสง
    this._circ(g2, 40, 46, 14, 0xd0a0ff, 0.55);
    this._circ(g2, 40, 46, 9, 0xffe8a0, 0.8);
    this._circ(g2, 40, 46, 5, 0xffffff);
    // วงโคจรจุด
    for (let p = 0; p < 10; p++) {
      const rad = (p / 10) * Math.PI * 2;
      this._circ(g2, 40 + Math.cos(rad) * 27, 46 + Math.sin(rad) * 25, 3, p % 2 ? 0x5fff5f : 0x7ec8f0);
    }
    g2.generateTexture('cycle_core', 80, 80);
  },

  genMolecules(scene) {
    const sizes = [[32,'carbon'],[28,'phosphate'],[64,'atp'],[40,'nadph'],[60,'g3p'],[72,'rubp'],[96,'robot']];

    // carbon — ลูกกลมคาร์บอน
    (() => {
      const g = scene.make.graphics({ add: false });
      this._circ(g, 16, 16, 11, 0x4a4a4a);
      this._oc(g, 16, 16, 11, 0x1a1a1a, 3);
      this._circ(g, 13, 12, 4, 0xb8b8b8, 0.8);
      this._circ(g, 16, 16, 2, 0x222);
      // พันธะ
      this._rr(g, 3, 6, 6, 4, 2, 0x666);
      this._rr(g, 24, 10, 6, 4, 2, 0x666);
      g.generateTexture('mol_carbon', 32, 32);
    })();

    // phosphate — ฟอสฟอรัสสีทอง
    (() => {
      const g = scene.make.graphics({ add: false });
      this._circ(g, 14, 14, 10, 0xb8860b);
      this._oc(g, 14, 14, 10, 0x5c3a1a, 3);
      this._circ(g, 12, 11, 4, 0xffd700, 0.9);
      this._circ(g, 16, 17, 2, 0xfff0a0);
      g.generateTexture('mol_phosphate', 28, 28);
    })();

    // ATP — เหรียญทองรูปแคปซูล
    (() => {
      const g = scene.make.graphics({ add: false });
      this._rr(g, 6, 8, 52, 24, 12, 0xb8860b);
      this._ol(g, 6, 8, 52, 24, 12, 0x5c3a1a, 3);
      this._rr(g, 10, 12, 44, 16, 8, 0xffd700);
      this._rr(g, 14, 14, 30, 4, 2, 0xfff6b0, 0.8);
      // สายฟ้า
      g.fillStyle(0xfff6b0, 1);
      g.fillTriangle(33, 12, 42, 12, 38, 17);
      g.fillTriangle(31, 20, 40, 20, 36, 26);
      g.generateTexture('mol_atp', 64, 64);
    })();

    // NADPH — หยดเขียวมรกต
    (() => {
      const g = scene.make.graphics({ add: false });
      this._circ(g, 20, 22, 13, 0x1b5e20);
      this._oc(g, 20, 22, 13, 0x0a3010, 3);
      this._circ(g, 16, 18, 5, 0x9effb0, 0.85);
      this._rr(g, 11, 3, 3, 8, 1, 0x2f8f3f);
      g.generateTexture('mol_nadph', 40, 40);
    })();

    // G3P — โครง 3 อะตอม
    (() => {
      const g = scene.make.graphics({ add: false });
      this._rr(g, 4, 10, 52, 26, 12, 0x3a5a3a);
      this._ol(g, 4, 10, 52, 26, 12, 0x1a2a1a, 3);
      this._circ(g, 17, 23, 7, 0x7a5c1a);
      this._circ(g, 30, 23, 7, 0x3a3a3a);
      this._circ(g, 43, 23, 7, 0x5c3a1a);
      this._circ(g, 15, 21, 2, 0xffd780);
      this._circ(g, 28, 21, 2, 0x888);
      this._circ(g, 41, 21, 2, 0xffd780);
      g.generateTexture('mol_g3p', 60, 60);
    })();

    // RuBP — โซ่ 5 อะตอม
    (() => {
      const g = scene.make.graphics({ add: false });
      this._rr(g, 4, 12, 60, 28, 13, 0x3a3a5a);
      this._ol(g, 4, 12, 60, 28, 13, 0x1a1a2a, 3);
      const xs = [15, 26, 37, 48, 57];
      xs.forEach((x, i) => {
        const c = i === 2 || i === 3 ? 0x3a3a3a : 0x5c3a1a;
        this._circ(g, x, 26, 6.5, c);
        this._circ(g, x - 2, 24, 2, 0xffd780, 0.8);
      });
      g.generateTexture('mol_rubp', 72, 72);
    })();

    // Robot — โมเลกุลหุ่นยนต์ ruBisCO
    (() => {
      const g = scene.make.graphics({ add: false });
      this._rr(g, 14, 14, 44, 34, 10, 0x4a6acf);
      this._ol(g, 14, 14, 44, 34, 10, 0x1a2a5a, 4);
      this._rr(g, 20, 30, 12, 8, 3, 0x0a1a4a);   // ตา
      this._rr(g, 40, 30, 12, 8, 3, 0x0a1a4a);
      this._circ(g, 24, 34, 2, 0x6aff6a);
      this._circ(g, 44, 34, 2, 0x6aff6a);
      this._rr(g, 16, 48, 40, 5, 3, 0x8a9adf);  // ปาก
      this._circ(g, 18, 58, 10, 0x2a2a2a);        // ล้อ
      this._circ(g, 48, 58, 10, 0x2a2a2a);
      this._oc(g, 18, 58, 10, 0x111, 3);
      this._oc(g, 48, 58, 10, 0x111, 3);
      this._rr(g, 34, 2, 8, 10, 3, 0xaaa);        // เสาอากาศ
      this._circ(g, 38, 2, 4, 0xff5a5a);
      g.generateTexture('mol_robot', 96, 96);
    })();
  },

  genClouds(scene) {
    const g = scene.make.graphics({ add: false });
    for (let i = 0; i < 6; i++) {
      const cx = 10 + i * 20;
      const cy = 14 + (i % 2) * 6;
      this._circ(g, cx, cy, 11, 0xffffff);
      this._circ(g, cx + 12, cy + 3, 9, 0xffffff);
      this._circ(g, cx + 22, cy + 5, 6, 0xffffff);
      this._ell(g, cx + 10, cy + 10, 15, 4, 0xddddff, 0.9);
    }
    for (let i = 0; i < 6; i++) {
      const x = 8 + Math.random() * 110;
      const y = 6 + Math.random() * 26;
      this._circ(g, x, y, 1.8, 0xeeffff, 0.9);
    }
    g.generateTexture('cloud', 128, 40);
  },

  genSunTiles(scene) {
    const s = CONFIG.TILE_SIZE;
    for (let v = 0; v < 3; v++) {
      const g = scene.make.graphics({ add: false });
      const base = [0xe8c44a, 0xf0d068, 0xd4a428][v];
      this._rr(g, 0, 0, s, s, 5, base);
      for (let i = 0; i < 7; i++) {
        const x = 4 + Math.random() * (s - 8);
        const y = 4 + Math.random() * (s - 8);
        const c = Math.random() > 0.5 ? 0xffec8a : 0xc49422;
        this._circ(g, x, y, 2.8, c, 0.9);
      }
      this._circ(g, 16 + Math.random() * 6, 12, 2, 0xfff6b8);
      g.generateTexture(`sun_ground_${v}`, s, s);
    }
    const sg = scene.make.graphics({ add: false });
    for (let a = 0; a < 12; a++) {
      const rad = (a / 12) * Math.PI * 2;
      const rx = 46 + Math.cos(rad) * 40;
      const ry = 58 + Math.sin(rad) * 40;
      this._ell(sg, rx, ry, 8, 5, 0xffaa00, 0.55);
    }
    this._circ(sg, 46, 58, 26, 0xffd700);
    this._oc(sg, 46, 58, 26, 0xe8a400, 4);
    this._circ(sg, 46, 58, 20, 0xffea00);
    this._circ(sg, 36, 50, 5, 0xffffff, 0.85);
    // ตาหวานๆ
    this._circ(sg, 40, 56, 2.5, 0x5a3a00);
    this._circ(sg, 52, 56, 2.5, 0x5a3a00);
    this._circ(sg, 46, 62, 4, 0xd09020);
    sg.generateTexture('sun_big', 96, 120);
  },

  genWaterTiles(scene) {
    const s = CONFIG.TILE_SIZE;
    for (let v = 0; v < 4; v++) {
      const g = scene.make.graphics({ add: false });
      this._rr(g, 0, 0, s, s, 5, CONFIG.COLORS.water);
      for (let i = 0; i < 3; i++) {
        const y = 5 + Math.random() * (s - 10);
        const x = 5 + Math.random() * (s - 12);
        const c = Math.random() > 0.5 ? CONFIG.COLORS.water2 : 0x5a9adf;
        this._ell(g, x + 6, y, 8, 2.2, c, 0.75);
      }
      const sx = 6 + Math.random() * (s - 10);
      const sy = 6 + Math.random() * (s - 10);
      this._circ(g, sx, sy, 1.6, 0xcfeaff, 0.9);
      g.generateTexture(`water_${v}`, s, s);
    }
    const fg = scene.make.graphics({ add: false });
    this._ell(fg, 32, 52, 26, 14, 0x2f8f3f, 0.95);
    this._ell(fg, 32, 50, 22, 11, 0x4aaa4a, 1);
    this._ell(fg, 24, 44, 7, 4, 0x7ade7a, 0.9);
    this._rr(fg, 30, 62, 4, 10, 2, 0x5c3a1a);
    fg.generateTexture('lily_pad', 64, 72);
  },

  genCollectibles(scene) {
    // pickle_co2 — grouping ตาม key เดิม
    const blobs = {
      pickup_co2: { base: 0x87ceeb, dark: 0x4a7abf },
      pickup_atp: { base: 0xffd700, dark: 0xb8860b },
      pickup_nadph: { base: 0x4ade80, dark: 0x1b5e20 },
      pickup_h2o: { base: 0x5ad3ff, dark: 0x2a5a9f }
    };
    Object.keys(blobs).forEach((key, ki) => {
      const g = scene.make.graphics({ add: false });
      const d = blobs[key];
      const isDroplet = key === 'pickup_h2o' || key === 'pickup_nadph';
      if (isDroplet) {
        this._circ(g, 16, 18, 10.5, d.base);
        this._oc(g, 16, 18, 10.5, d.dark, 3);
        this._circ(g, 12, 14, 4, 0xffffff, 0.8);
        this._rr(g, 14, 3, 3, 8, 1, d.dark, 0.9);
      } else {
        this._circ(g, 16, 14, 8, d.base);
        this._circ(g, 22, 10, 6.5, d.base);
        this._oc(g, 15, 14, 8, d.dark, 3);
        this._oc(g, 21, 10, 6.5, d.dark, 3);
        this._circ(g, 16, 13, 2.5, 0xffffff, 0.9);
      }
      if (key === 'pickup_atp') {
        g.fillStyle(0xfff6b0, 1);
        g.fillTriangle(20, 12, 27, 12, 24, 16);
        g.fillTriangle(19, 22, 26, 22, 22, 27);
      }
      if (key === 'pickup_co2') {
        this._circ(g, 13, 10, 2, 0x1a2a4a);
        this._circ(g, 22, 8, 2, 0x1a2a4a);
      }
      g.generateTexture(key, 32, 32);
    });
  },

  genSigns(scene) {
    const g = scene.make.graphics({ add: false });
    this._rr(g, 14, 48, 6, 28, 3, 0x5c3a1a);
    this._ol(g, 14, 48, 6, 28, 3, 0x3a2a1a, 2);
    this._rr(g, 2, 10, 28, 44, 7, 0xa87840);
    this._ol(g, 2, 10, 28, 44, 7, 0x5c3a1a, 3);
    this._rr(g, 6, 15, 20, 34, 5, 0xd8b878);
    for (let i = 0; i < 3; i++) {
      this._rr(g, 4, 22 + i * 9, 24, 4, 2, 0x8a6a3a, 0.8);
    }
    g.generateTexture('sign', 32, 80);
  }
};