const PixelAssets = {
  generateAll(scene) {
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

  _pixelRect(g, x, y, w, h, color) {
    g.fillStyle(color, 1);
    g.fillRect(x, y, w, h);
  },

  genPlayer(scene) {
    const s = 32;
    const dirs = ['down', 'up', 'left', 'right'];
    dirs.forEach(dir => {
      for (let f = 0; f < 4; f++) {
        const g = scene.make.graphics({ add: false });
        const baseX = 0, baseY = 0;
        this._pixelRect(g, baseX+12, baseY+2, 8, 6, 0xffd7a0);
        this._pixelRect(g, baseX+10, baseY+4, 2, 4, 0xffd7a0);
        this._pixelRect(g, baseX+20, baseY+4, 2, 4, 0xffd7a0);
        this._pixelRect(g, baseX+12, baseY, 8, 2, 0x5a3a1a);
        this._pixelRect(g, baseX+10, baseY+2, 2, 2, 0x5a3a1a);
        this._pixelRect(g, baseX+20, baseY+2, 2, 2, 0x5a3a1a);
        if (dir === 'down') {
          this._pixelRect(g, baseX+13, baseY+5, 2, 2, 0x1a0a0a);
          this._pixelRect(g, baseX+17, baseY+5, 2, 2, 0x1a0a0a);
        } else if (dir === 'up') {
        } else if (dir === 'left') {
          this._pixelRect(g, baseX+12, baseY+5, 2, 2, 0x1a0a0a);
        } else {
          this._pixelRect(g, baseX+18, baseY+5, 2, 2, 0x1a0a0a);
        }
        this._pixelRect(g, baseX+10, baseY+8, 12, 4, 0xffcfa0);
        this._pixelRect(g, baseX+8, baseY+12, 16, 12, 0x3a7a3a);
        this._pixelRect(g, baseX+6, baseY+14, 2, 8, 0x3a7a3a);
        this._pixelRect(g, baseX+24, baseY+14, 2, 8, 0x3a7a3a);
        this._pixelRect(g, baseX+14, baseY+13, 4, 2, 0x8b5a2b);
        this._pixelRect(g, baseX+10, baseY+24, 4, 6, 0x2a4a7a);
        this._pixelRect(g, baseX+18, baseY+24, 4, 6, 0x2a4a7a);
        if (f % 2 === 1) {
          this._pixelRect(g, baseX+10, baseY+26, 4, 4, 0x5a3a1a);
        } else {
          this._pixelRect(g, baseX+18, baseY+26, 4, 4, 0x5a3a1a);
        }
        if (f >= 2) {
          this._pixelRect(g, baseX+10, baseY+24, 4, 2, 0x2a4a7a);
        } else {
          this._pixelRect(g, baseX+18, baseY+24, 4, 2, 0x2a4a7a);
        }
        this._pixelRect(g, baseX+10, baseY+29, 5, 3, 0x3a2a1a);
        this._pixelRect(g, baseX+17, baseY+29, 5, 3, 0x3a2a1a);
        g.generateTexture(`player_${dir}_${f}`, s, s);
      }
    });
  },

  genGrass(scene) {
    const s = CONFIG.TILE_SIZE;
    for (let v = 0; v < 4; v++) {
      const g = scene.make.graphics({ add: false });
      this._pixelRect(g, 0, 0, s, s, CONFIG.COLORS.grass1);
      for (let i = 0; i < 18; i++) {
        const x = Math.floor(Math.random() * s);
        const y = Math.floor(Math.random() * s);
        const c = (Math.random() > 0.5) ? CONFIG.COLORS.grass2 : CONFIG.COLORS.grassDark;
        this._pixelRect(g, x, y, 2, 2, c);
      }
      for (let i = 0; i < 10; i++) {
        const x = Math.floor(Math.random() * (s-2));
        const y = Math.floor(Math.random() * (s-4));
        this._pixelRect(g, x, y, 1, 3, 0x5aaa3a);
        this._pixelRect(g, x+1, y+1, 1, 2, 0x4a9a2a);
      }
      g.generateTexture(`grass_${v}`, s, s);
    }
  },

  genPath(scene) {
    const s = CONFIG.TILE_SIZE;
    const g = scene.make.graphics({ add: false });
    this._pixelRect(g, 0, 0, s, s, CONFIG.COLORS.path);
    for (let i = 0; i < 20; i++) {
      const x = Math.floor(Math.random() * s);
      const y = Math.floor(Math.random() * s);
      const c = (Math.random() > 0.5) ? CONFIG.COLORS.pathDark : 0xa8885f;
      this._pixelRect(g, x, y, 2, 2, c);
    }
    for (let i = 0; i < 6; i++) {
      const x = Math.floor(Math.random() * (s-3));
      const y = Math.floor(Math.random() * (s-3));
      this._pixelRect(g, x, y, 3, 1, CONFIG.COLORS.pathDark);
      this._pixelRect(g, x, y+2, 3, 1, CONFIG.COLORS.pathDark);
    }
    g.generateTexture('path', s, s);
  },

  genTree(scene) {
    const s = 64;
    for (let v = 0; v < 3; v++) {
      const g = scene.make.graphics({ add: false });
      this._pixelRect(g, 26, 42, 12, 20, CONFIG.COLORS.wood);
      this._pixelRect(g, 28, 44, 8, 16, CONFIG.COLORS.woodDark);
      this._pixelRect(g, 24, 40, 16, 4, CONFIG.COLORS.woodDark);
      const cx = 32, cy = 26;
      const layers = [
        { r: 22, c1: CONFIG.COLORS.leaf, c2: CONFIG.COLORS.leafDark },
        { r: 17, c1: 0x4aaa4a, c2: CONFIG.COLORS.leaf },
        { r: 11, c1: 0x6aca6a, c2: 0x4aaa4a }
      ];
      layers.forEach((L, li) => {
        for (let a = 0; a < 360; a += 15) {
          const rad = (a * Math.PI) / 180;
          const rx = cx + Math.cos(rad) * L.r;
          const ry = cy + Math.sin(rad) * L.r * 0.7;
          const sz = 7 - li;
          this._pixelRect(g, Math.floor(rx-sz/2), Math.floor(ry-sz/2), sz, sz, (a%30===0)?L.c2:L.c1);
        }
      });
      this._pixelRect(g, cx-3, cy-3, 6, 6, 0x7aea7a);
      for (let i = 0; i < 5; i++) {
        const fx = 20 + Math.floor(Math.random() * 24);
        const fy = 18 + Math.floor(Math.random() * 16);
        this._pixelRect(g, fx, fy, 2, 1, 0xff4444);
      }
      g.generateTexture(`tree_${v}`, s, s);
    }
  },

  genFactory(scene) {
    const s = 288;
    const g = scene.make.graphics({ add: false });
    this._pixelRect(g, 0, 180, 288, 96, CONFIG.COLORS.factoryBase);
    for (let b = 0; b < 10; b++) {
      for (let a = 0; a < 29; a++) {
        const c = (a + b) % 2 === 0 ? CONFIG.COLORS.factoryBase : CONFIG.COLORS.stoneDark;
        this._pixelRect(g, a*10, 180 + b*10, 10, 10, c);
      }
    }
    this._pixelRect(g, 0, 168, 288, 14, CONFIG.COLORS.factoryWall);
    this._pixelRect(g, 4, 164, 10, 20, CONFIG.COLORS.stoneDark);
    this._pixelRect(g, 40, 164, 10, 20, CONFIG.COLORS.stoneDark);
    this._pixelRect(g, 76, 164, 10, 20, CONFIG.COLORS.stoneDark);
    this._pixelRect(g, 112, 164, 10, 20, CONFIG.COLORS.stoneDark);
    this._pixelRect(g, 148, 164, 10, 20, CONFIG.COLORS.stoneDark);
    this._pixelRect(g, 184, 164, 10, 20, CONFIG.COLORS.stoneDark);
    this._pixelRect(g, 220, 164, 10, 20, CONFIG.COLORS.stoneDark);
    this._pixelRect(g, 256, 164, 10, 20, CONFIG.COLORS.stoneDark);
    this._pixelRect(g, 0, 52, 288, 116, CONFIG.COLORS.factoryWall);
    for (let b = 0; b < 12; b++) {
      for (let a = 0; a < 29; a++) {
        if ((a + b) % 4 === 0) {
          this._pixelRect(g, a*10, 52 + b*10, 10, 10, CONFIG.COLORS.woodDark);
        }
      }
    }
    const windowRows = [
      { y: 64, xs: [12, 58, 104, 196, 242] },
      { y: 104, xs: [12, 58, 104, 150, 196, 242] }
    ];
    windowRows.forEach(row => {
      row.xs.forEach(x => {
        this._pixelRect(g, x, row.y, 30, 26, 0x2a4a6a);
        this._pixelRect(g, x + 2, row.y + 2, 26, 22, 0x4a7aaa);
        this._pixelRect(g, x + 14, row.y, 2, 26, CONFIG.COLORS.wood);
        this._pixelRect(g, x, row.y + 12, 30, 2, CONFIG.COLORS.wood);
      });
    });
    this._pixelRect(g, 148, 72, 32, 26, 0x2a4a6a);
    this._pixelRect(g, 150, 74, 28, 22, 0x6a9adf);
    this._pixelRect(g, 164, 72, 4, 26, CONFIG.COLORS.wood);
    this._pixelRect(g, 148, 84, 32, 2, CONFIG.COLORS.wood);
    this._pixelRect(g, 8, 14, 272, 40, CONFIG.COLORS.factoryRoof);
    this._pixelRect(g, 0, 6, 288, 10, 0x5a2a2a);
    for (let i = 0; i < 29; i++) {
      this._pixelRect(g, i*10, 50, 10, 4, 0x5a2a2a);
    }
    this._pixelRect(g, 118, 188, 72, 54, 0x3a2a1a);
    this._pixelRect(g, 122, 192, 64, 46, 0x5a4a2a);
    this._pixelRect(g, 118, 184, 72, 6, 0x7a5a3a);
    this._pixelRect(g, 150, 194, 8, 42, 0xffd75e);
    this._pixelRect(g, 30, 200, 32, 58, 0x3a2a1a);
    this._pixelRect(g, 34, 204, 24, 50, 0x5a4a2a);
    this._pixelRect(g, 30, 196, 32, 6, 0x7a5a3a);
    this._pixelRect(g, 44, 206, 4, 46, 0xffec8a);
    this._pixelRect(g, 226, 200, 32, 58, 0x3a2a1a);
    this._pixelRect(g, 230, 204, 24, 50, 0x5a4a2a);
    this._pixelRect(g, 226, 196, 32, 6, 0x7a5a3a);
    this._pixelRect(g, 240, 206, 4, 46, 0xffec8a);
    const smokestacks = [
      { x: 42, w: 18, h: 68, top: -14 },
      { x: 90, w: 22, h: 92, top: -36 },
      { x: 160, w: 18, h: 60, top: -6 },
      { x: 208, w: 24, h: 100, top: -44 },
      { x: 252, w: 16, h: 54, top: 0 }
    ];
    smokestacks.forEach(sk => {
      this._pixelRect(g, sk.x, sk.top + 14, sk.w, sk.h, CONFIG.COLORS.stoneDark);
      this._pixelRect(g, sk.x + 2, sk.top + 16, sk.w - 4, 8, 0x7a7a7a);
      this._pixelRect(g, sk.x + 2, sk.top + 10, sk.w - 4, 6, 0x3a3a3a);
      this._pixelRect(g, sk.x - 2, sk.top + 12, sk.w + 4, 4, 0x4a4a4a);
      for (let p = 0; p < 4; p++) {
        const px = sk.x + 2 + (p % 2) * 4;
        this._pixelRect(g, px, sk.top + 4 - p * 6, sk.w - 8, 5, 0xaaaaaa - p * 0x222222);
      }
    });
    this._pixelRect(g, 140, -6, 8, 22, 0x8a8a8a);
    this._pixelRect(g, 134, -10, 20, 6, 0xaa3a3a);
    this._pixelRect(g, 138, -2, 12, 4, 0x5a5a5a);
    this._pixelRect(g, 0, 272, 288, 6, 0x2a1a0a);
    this._pixelRect(g, 0, 266, 288, 8, 0x4a3a2a);
    for (let i = 0; i < 29; i += 3) {
      this._pixelRect(g, i * 10, 268, 8, 4, 0x3a2a1a);
    }
    g.generateTexture('factory_main', s, s);
  },

  genCycleStation(scene) {
    const s = 96;
    for (let i = 0; i < CONFIG.CYCLE_STATIONS; i++) {
      const g = scene.make.graphics({ add: false });
      const col = CONFIG.STATION_COLORS[i];
      this._pixelRect(g, 0, 20, 96, 76, CONFIG.COLORS.woodDark);
      this._pixelRect(g, 4, 24, 88, 68, CONFIG.COLORS.wood);
      this._pixelRect(g, 8, 28, 80, 60, 0x5a3a1a);
      const darkCol = Phaser.Display.Color.IntegerToColor(col);
      darkCol.darken(20);
      const dc = Phaser.Display.Color.GetColor(darkCol.r, darkCol.g, darkCol.b);
      this._pixelRect(g, 12, 32, 72, 52, col);
      this._pixelRect(g, 16, 36, 64, 44, dc);
      const lightCol = Phaser.Display.Color.IntegerToColor(col);
      lightCol.lighten(20);
      const lc = Phaser.Display.Color.GetColor(lightCol.r, lightCol.g, lightCol.b);
      this._pixelRect(g, 20, 40, 56, 4, lc);
      this._pixelRect(g, 20, 40, 4, 36, lc);
      this._pixelRect(g, 12, 28, 4, 64, 0x3a2a1a);
      this._pixelRect(g, 80, 28, 4, 64, 0x3a2a1a);
      this._pixelRect(g, 36, 0, 24, 24, CONFIG.COLORS.factoryRoof);
      this._pixelRect(g, 32, 4, 32, 16, CONFIG.COLORS.factoryRoof);
      this._pixelRect(g, 42, 52, 12, 18, CONFIG.COLORS.stone);
      this._pixelRect(g, 44, 54, 8, 14, CONFIG.COLORS.stoneDark);
      this._pixelRect(g, 44, 54, 8, 2, 0xcccccc);
      for (let s2 = 0; s2 < 3; s2++) {
        this._pixelRect(g, 62, 44 + s2*8, 14, 5, 0x3a3a3a);
        this._pixelRect(g, 64, 44 + s2*8, 10, 5, 0x5a5a5a);
      }
      g.generateTexture(`station_${i}`, s, s);
    }
    const g2 = scene.make.graphics({ add: false });
    this._pixelRect(g2, 0, 0, 80, 80, CONFIG.COLORS.woodDark);
    this._pixelRect(g2, 4, 4, 72, 72, CONFIG.COLORS.factoryBase);
    this._pixelRect(g2, 8, 8, 64, 64, 0x3a2a3a);
    for (let r = 4; r < 32; r += 6) {
      const pts = 12 + r/2;
      for (let p = 0; p < pts; p++) {
        const ang = (p / pts) * Math.PI * 2;
        const rx = 40 + Math.cos(ang) * r;
        const ry = 40 + Math.sin(ang) * r * 0.75;
        this._pixelRect(g2, rx-1, ry-1, 3, 3, (r%12===4)?0x5fff5f:0x3a7a3a);
      }
    }
    this._pixelRect(g2, 36, 36, 8, 8, 0xffd75e);
    this._pixelRect(g2, 38, 38, 4, 4, 0xffffff);
    g2.generateTexture('cycle_core', 80, 80);
  },

  genMolecules(scene) {
    const sizes = [[32,'carbon'],[28,'phosphate'],[64,'atp'],[40,'nadph'],[60,'g3p'],[72,'rubp'],[96,'robot']];
    const defs = {
      carbon: [
        [0,0,0x1a1a1a,18,18],[2,2,0x3a3a3a,14,14],[5,5,0x6a6a6a,8,8],
        [1,1,0x4a4a4a,3,3],[14,8,0x6a6a6a,2,2],[8,1,0x4a4a4a,2,2]
      ],
      phosphate: [
        [0,0,0x5c3a1a,16,16],[2,2,0xb8860b,12,12],[5,5,0xffd700,6,6]
      ],
      atp: [
        [0,0,0x2a1508,64,30],[3,3,58,24,0xb8860b],[14,7,38,16,0xffd700],
        [14,7,38,4,0xffec8a]
      ],
      nadph: [
        [0,0,0x10281b,18,18],[2,2,0x1b5e20,14,14],[5,5,0x00ff7f,8,8]
      ],
      g3p: [
        [0,0,0x1a2a1a,56,28],[4,4,48,20,0x3a5a3a],[8,8,12,12,0x1a1a1a],
        [24,8,12,12,0x1a1a1a],[40,8,12,12,0x5c3a1a]
      ],
      rubp: [
        [0,0,0x1a1a2a,68,28],[4,4,60,20,0x3a3a5a],[8,8,12,12,0x5c3a1a],
        [24,8,12,12,0x1a1a1a],[40,8,12,12,0x1a1a1a],[56,8,12,12,0x5c3a1a]
      ],
      robot: [
        [0,0,0x4a2912,64,64],[14,14,36,8,0x3a2a1a],[20,22,24,28,0x1a3a1a],
        [24,26,6,6,0x5fff5f],[42,26,6,6,0x5fff5f],[28,36,20,6,0xffd75e],
        [16,52,12,8,0x2a2a2a],[68,52,12,8,0x2a2a2a]
      ]
    };
    sizes.forEach(([s, key]) => {
      const g = scene.make.graphics({ add: false });
      (defs[key] || []).forEach(([x, y, a, b, colOrH]) => {
        let color, w, h;
        if (a >= 256) {
          color = a; w = b; h = colOrH;
        } else {
          w = a; h = b; color = colOrH;
        }
        this._pixelRect(g, x, y, w, h, color);
      });
      g.generateTexture(`mol_${key}`, s, s);
    });
  },

  genClouds(scene) {
    const g = scene.make.graphics({ add: false });
    for (let i = 0; i < 8; i++) {
      const cx = 6 + (i * 14);
      const cy = 14 + (i % 2) * 6;
      this._pixelRect(g, cx, cy, 16, 10, 0xffffff);
      this._pixelRect(g, cx+2, cy-4, 12, 8, 0xffffff);
      this._pixelRect(g, cx+4, cy+10, 10, 4, 0xddddff);
    }
    for (let i = 0; i < 12; i++) {
      const x = Math.floor(Math.random() * 120);
      const y = Math.floor(Math.random() * 30) + 8;
      this._pixelRect(g, x, y, 2, 2, 0xeeffff);
    }
    g.generateTexture('cloud', 128, 40);
  },

  genSunTiles(scene) {
    const s = CONFIG.TILE_SIZE;
    for (let v = 0; v < 3; v++) {
      const g = scene.make.graphics({ add: false });
      const base = [0xe8c44a, 0xf0d068, 0xd4a428][v];
      this._pixelRect(g, 0, 0, s, s, base);
      for (let i = 0; i < 24; i++) {
        const x = Math.floor(Math.random() * s);
        const y = Math.floor(Math.random() * s);
        const c = (Math.random() > 0.5) ? 0xffec8a : 0xc49422;
        this._pixelRect(g, x, y, 3, 3, c);
      }
      const rayX = Math.floor(Math.random() * (s-6));
      for (let i = 0; i < 4; i++) {
        this._pixelRect(g, rayX + i*2, 10 - i, 2, 14 + i*2, 0xffffaa);
      }
      g.generateTexture(`sun_ground_${v}`, s, s);
    }
    const sg = scene.make.graphics({ add: false });
    this._pixelRect(sg, 8, 48, 48, 48, 0xffd700);
    this._pixelRect(sg, 12, 52, 40, 40, 0xffea00);
    for (let a = 0; a < 12; a++) {
      const rad = (a / 12) * Math.PI * 2;
      const rx = 32 + Math.cos(rad) * 44;
      const ry = 72 + Math.sin(rad) * 44;
      this._pixelRect(sg, rx-3, ry-3, 6, 6, 0xffaa00);
      this._pixelRect(sg, rx-1, ry-1, 2, 2, 0xffee88);
    }
    this._pixelRect(sg, 16, 56, 8, 8, 0xffffff);
    sg.generateTexture('sun_big', 96, 120);
  },

  genWaterTiles(scene) {
    const s = CONFIG.TILE_SIZE;
    for (let v = 0; v < 4; v++) {
      const g = scene.make.graphics({ add: false });
      this._pixelRect(g, 0, 0, s, s, CONFIG.COLORS.water);
      for (let i = 0; i < 20; i++) {
        const x = Math.floor(Math.random() * s);
        const y = Math.floor(Math.random() * s);
        const c = (Math.random() > 0.5) ? CONFIG.COLORS.water2 : 0x5a9adf;
        this._pixelRect(g, x, y, 2, 2, c);
      }
      for (let w = 0; w < 3; w++) {
        const wy = Math.floor(Math.random() * (s-8)) + 2;
        for (let wx = 2; wx < s-4; wx += 6) {
          this._pixelRect(g, wx, wy, 4, 1, 0xaadcff);
        }
      }
      g.generateTexture(`water_${v}`, s, s);
    }
    const fg = scene.make.graphics({ add: false });
    this._pixelRect(fg, 12, 60, 40, 8, 0x8b5a2b);
    this._pixelRect(fg, 14, 56, 36, 6, 0x5c3a1a);
    for (let i = 0; i < 7; i++) {
      const fx = 16 + i*5;
      this._pixelRect(fg, fx, 52, 2, 6, 0x3a8a3a);
      this._pixelRect(fg, fx-1, 50, 4, 2, 0x5aaa5a);
    }
    fg.generateTexture('lily_pad', 64, 72);
  },

  genCollectibles(scene) {
    const items = {
      pickup_co2: [
        [8,4,16,24,0x5a8abf],[10,6,12,20,0x87ceeb],
        [11,8,4,4,0xffffff],[13,14,6,6,0x5a8abf]
      ],
      pickup_atp: [
        [0,10,32,12,0x8b5a2b],[2,12,28,8,0xb8860b],
        [8,13,16,6,0xffd700],[10,14,3,3,0xffffff]
      ],
      pickup_nadph: [
        [8,4,16,24,0x1b5e20],[10,6,12,20,0x4ade80],
        [11,8,5,5,0x9effa0],[14,16,6,6,0x00ff7f]
      ],
      pickup_h2o: [
        [10,4,12,24,0x1a3a5a],[12,6,8,20,0x3a7abf],
        [14,10,4,12,0x5ad3ff],[12,14,8,4,0xaadcff]
      ]
    };
    Object.entries(items).forEach(([key, parts]) => {
      const g = scene.make.graphics({ add: false });
      parts.forEach(([x,y,w,h,c]) => this._pixelRect(g, x, y, w, h, c));
      this._pixelRect(g, 10, 2, 2, 2, 0xffffaa);
      this._pixelRect(g, 2, 16, 2, 2, 0xffffaa);
      g.generateTexture(key, 32, 32);
    });
  },

  genSigns(scene) {
    const g = scene.make.graphics({ add: false });
    this._pixelRect(g, 14, 48, 4, 28, 0x5c3a1a);
    this._pixelRect(g, 0, 12, 32, 40, CONFIG.COLORS.wood);
    this._pixelRect(g, 2, 14, 28, 36, 0xa87840);
    this._pixelRect(g, 2, 14, 28, 2, 0x5c3a1a);
    this._pixelRect(g, 2, 48, 28, 2, 0x5c3a1a);
    for (let i = 0; i < 4; i++) {
      this._pixelRect(g, 6, 20 + i*6, 20, 3, 0x6a4a2a);
    }
    g.generateTexture('sign', 32, 80);
  }
};
