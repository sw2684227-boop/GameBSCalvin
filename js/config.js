const CONFIG = {
  TILE_SIZE: 32,
  WORLD_WIDTH: 1600,
  WORLD_HEIGHT: 1200,
  PLAYER_SPEED: 4.2,
  ANIM_SPEED: 140,

  RESOURCES: {
    CO2: { name: 'CO₂', icon: '🌫️', max: 999, color: 0x87ceeb },
    WATER: { name: 'H₂O', icon: '💧', max: 999, color: 0x5ad3ff },
    ATP: { name: 'ATP', icon: '⚡', max: 999, color: 0xffd700 },
    NADPH: { name: 'NADPH', icon: '💧', max: 999, color: 0x5fff5f },
    SUGAR: { name: 'น้ำตาล', icon: '🍬', max: 999, color: 0xffaa55 }
  },

  LIGHT_MACHINE_WORLD: {
    x: 500,
    y: 260,
    width: 180,
    height: 150,
    label: 'เครื่องขั้นแสง · Light Reaction'
  },

  WATER_POND: {
    // บ่อน้ำอยู่มุมขวาบน ห่างจากบ้าน
    x: 1380,
    y: 280,
    radius: 80,
    label: 'บ่อน้ำ H₂O'
  },

  CO2_COLLECTOR: {
    // เครื่อง CO2 อยู่มุมซ้ายบน ห่างจากบ้าน
    x: 280,
    y: 250,
    radius: 62,
    label: 'จุดรับ CO₂',
    produceMs: 3000,
    produceMsFast: 2000,
    earlyCollects: 6,
    earlyAmount: 1,
    earlyInserts: 6
  },

  SUGAR_MACHINE: {
    x: 500,
    y: 780,
    radius: 70,
    label: 'เครื่องบรรจุน้ำตาล',
    id: 'sugar',
    name: 'เครื่องบรรจุน้ำตาล: Sugar Packing',
    icon: '🧪➡️🍬',
    shortName: '4. Sugar Packing',
    color: '#ffaa55',
    bg: 0xffaa55,
    steps: [
      { icon: '📥', label: 'รอและรับ G3P ตัวที่ 1', text: 'เครื่องเริ่มว่าง — รับ G3P ×1 (จากเครื่องที่ 3 ผ่านสายพาน) เข้าแท่นพัก แล้วรอโมเลกุลที่ 2' },
      { icon: '⏳', label: 'รอ G3P ตัวที่ 2', text: 'สะสมครบ 2 รอบคาลวิน = G3P ×2 (C₃+P แต่ละตัว) — ตัวที่ 2 วิ่งตามมาจอดข้างตัวแรก' },
      { icon: '🔢', label: 'รวม 2 G3P → น้ำตาล', text: 'G3P ×2 รวมคาร์บอนเป็นกลูโคส C₆H₁₂O₆ — dehydration synthesis ปล่อยน้ำ ได้น้ำตาล 1 โมเลกุล' },
      { icon: '🍬', label: 'แพ็กใส่กล่อง', text: 'น้ำตาลถูกบรรจุลงกล่องพร้อมส่ง — แถบสถานะบนเครื่องขึ้น "มีน้ำตาลรอเก็บ"' },
      { icon: '✅', label: 'ตรวจบัญชีและส่งออก', text: 'G3P ×2 (6C+2P) → น้ำตาล ×1 (C₆) ✓ | กด SPACE ใกล้เครื่องเก็บน้ำตาลไปป้อนต้นกล้า 🌱' }
    ],
    detail: {
      title: 'เครื่องบรรจุน้ำตาล: Sugar Packing (G3P → น้ำตาล)',
      breakWhat: 'ปล่อย Pi จาก G3P + dehydration (เสียน้ำ) เชื่อมพันธะระหว่าง 2 G3P',
      fillWhat: 'G3P ×1 แล้วรอ G3P ×1 อีกตัว (สะสมจากคาลวิน 2 รอบ — 1 G3P/รอบ ถูกแยกจากเครื่องที่ 3)',
      remainWhat: 'ไม่มีของเหลือ — คาร์บอนทุกตัวเข้าน้ำตาล',
      outputWhat: 'น้ำตาล/กลูโคส (C₆H₁₂O₆) ×1 โมเลกุล 🍬',
      nextFillWhat: 'กด SPACE ใกล้เครื่องเก็บน้ำตาล → เดินไปใกล้ต้นกล้าแล้วกด SPACE ป้อนให้ป่าโต!'
    }
  },

  LOCATIONS: {
    factory: {
      name: '🌳 สวนป่ากรมป่าไม้ (ศูนย์ฟื้นฟูป่า)',
      bg: 0x3f9e3f,
      accent: 0x66bb6a,
      resources: null
    },
    sky: {
      name: '🌫️ ชั้นบรรยากาศ',
      bg: 0x1a2e4a,
      accent: 0x5a8abf,
      resources: { CO2: 3 },
      respawnMs: 1200
    },
    sun: {
      name: '☀️ ทุ่งแสงแดด',
      bg: 0x4a3a1a,
      accent: 0xbf8a3a,
      resources: null
    },
    water: {
      name: '💧 น้ำพุไทลาคอยด์',
      bg: 0x1a3a4a,
      accent: 0x3a9abf,
      resources: null
    }
  },

  CYCLE_CENTER: { x: 800, y: 580 },
  CALVIN_CYCLE_MS: 8000,
  CALVIN_CYCLE_FAST_MS: 5000,
  CO2_PER_CYCLE: 3,
  CYCLE_RADIUS: 200,
  CYCLE_STATIONS: 6,
  STATION_NAMES: [
    'FIXATION', 'SPLIT', 'PHOSPHO', 'REDUCE', 'YIELD', 'REGEN'
  ],
  STATION_COLORS: [
    0x5a9abf, 0xbf5a5a, 0xbf8a3a, 0x5abf7a, 0xbf5abf, 0xbfa53a
  ],
  THREE_MACHINE_LAYOUT: [
    {
      key: 'fixation', pair: [0, 1], col: '#5a9abf', colInt: 0x5a9abf, darkCol: 0x2a5a7f,
      label: 'เครื่องที่ 1 · ตรึง CO₂', sub: 'Carbon Fixation',
      portLabels: ['รับ RuBP', 'RuBP + CO₂'],
      inputs: [{ res: 'CO2', icon: '🌫️', color: '#9a9a9a', n: 3 }]
    },
    {
      key: 'reduction', pair: [2, 3], col: '#5abf7a', colInt: 0x5abf7a, darkCol: 0x2a7f3f,
      label: 'เครื่องที่ 2 · เติมพลังงาน', sub: 'Reduction  ATP+NADPH',
      portLabels: ['ชาร์จ +P', 'ลด NADPH'],
      inputs: [
        { res: 'ATP', icon: '⚡', color: '#ffd700', n: 6 },
        { res: 'NADPH', icon: '💧', color: '#5fff5f', n: 6 }
      ]
    },
    {
      key: 'regeneration', pair: [4, 5], col: '#bfa53a', colInt: 0xbfa53a, darkCol: 0x7f6f2a,
      label: 'เครื่องที่ 3 · ฟื้นฟู RuBP', sub: 'Regeneration  +ATP',
      portLabels: ['รวบ G3P', 'สร้าง RuBP'],
      inputs: [{ res: 'ATP', icon: '⚡', color: '#ffd700', n: 3 }]
    }
  ],

  ATOM_TYPES: {
    C: { name: 'คาร์บอน (C)', color: '#9a9a9a', short: 'C' },
    P: { name: 'ฟอสฟอรัส (P)', color: '#ff8c00', short: 'P' },
    O: { name: 'ออกซิเจน (O)', color: '#ff4444', short: 'O' },
    H: { name: 'ไฮโดรเจน (H)', color: '#f0f0f0', short: 'H' },
    A: { name: 'อะดีนีน (A)', color: '#c49bff', short: 'A' },
    N: { name: 'ตัวพา NAD', color: '#35e08a', short: 'N' },
    L: { name: 'โฟตอน/แสง', color: '#ffe74a', short: 'L' },
    G: { name: 'คลอโรฟิลล์', color: '#2e8b57', short: 'G' },
    E: { name: 'อิเล็กตรอน', color: '#5ad3ff', short: 'e' }
  },

  MOLECULES: {
    rubp:  { atoms: 'CCCCCPP', r: 6.5, label: 'RuBP' },
    co2:   { atoms: 'COO',     r: 5.5, label: 'CO₂' },
    c6:    { atoms: 'CCCCCCPP', r: 6.0, label: 'สาร 6C' },
    pga:   { atoms: 'CCCP',    r: 6,   label: '3-PGA' },
    bpg:   { atoms: 'CCCPP',   r: 6,   label: '1,3-BPG' },
    atp:   { atoms: 'APPP',    r: 5.5, label: 'ATP' },
    adp:   { atoms: 'APP',     r: 5.5, label: 'ADP' },
    pi:    { atoms: 'P',       r: 6,   label: 'Pi' },
    nadph: { atoms: 'N',       r: 9,   label: 'NADPH' },
    nadp:  { atoms: 'N',       r: 8,   label: 'NADP⁺' },
    g3p:   { atoms: 'CCCP',    r: 6,   label: 'G3P' },
    sugar: { atoms: 'CCCCCCCCOOOPPP', r: 4.5, label: 'น้ำตาล 🍬' },
    photon: { atoms: 'L',      r: 7,   label: 'โฟตอน' },
    chl:    { atoms: 'GG',     r: 6.5, label: 'คลอโรฟิลล์' },
    h2o:    { atoms: 'OHH',    r: 5.5, label: 'H₂O' },
    o2:     { atoms: 'OO',     r: 5,   label: 'O₂' },
    prot:   { atoms: 'H',      r: 5,   label: 'H⁺' },
    et:     { atoms: 'E',      r: 4.5, label: 'e⁻' }
  },

  THREE_MACHINES: {
    fixation: {
      id: 'fixation',
      name: 'เครื่องจักรที่ 1: การตรึงคาร์บอน',
      icon: '🌫️➡️🧩',
      shortName: '1. Carbon Fixation',
      color: '#5a9abf',
      bg: 0x5a9abf,
      steps: [
        { icon: '🌱', label: 'วัตถุดิบเข้าเครื่อง', text: 'RuBP (Ribulose-1,5-Bisphosphate) 3 โมเลกุล — แต่ละตัวมี 5C + 2P เป็น "กรอบดักจับ" CO₂' },
        { icon: '🌫️', label: 'เติม CO₂', text: 'CO₂ 3 โมเลกุล (แต่ละตัวมี 1C + 2O) ถูกดึงเข้าด้วยเอนไซม์ RuBisCo จากรูปากใบ' },
        { icon: '⚗️', label: 'รวมตัว → สาร 6C', text: 'RuBP (5C) + CO₂ (1C) → สาร 6C ชั่วคราว ×3 ตัว (ไม่เสถียร แตกทันที)' },
        { icon: '✂️', label: 'แตกออกเป็น 3-PGA', text: 'สาร 6C แต่ละตัวแตกครึ่ง → 3-PGA (3-Phosphoglycerate, C₃+P) ×2 → รวมได้ 3-PGA ×6 โมเลกุล' },
        { icon: '✅', label: 'ตรวจบัญชีคาร์บอน', text: '3×(C₅) + 3×(C₁) = 18C เข้า → 6×(C₃) = 18C ออก ✓ ไม่มีสูญหาย ส่งต่อเครื่องที่ 2' }
      ],
      detail: {
        title: 'เครื่องจักรที่ 1: Carbon Fixation (ตรึง CO₂)',
        breakWhat: 'RuBP (C₅+2P) + CO₂ (C₁) → สาร 6C ชั่วคราว (ไม่เสถียร) → แตกเป็น 3-PGA (C₃+1P) ×2 ตัว',
        fillWhat: 'RuBP 3 โมเลกุล (5C+2P) + CO₂ 3 โมเลกุล (1C+2O)',
        remainWhat: 'ไม่มีของเหลือ — คาร์บอนทุกตัวถูกแปลงเป็น 3-PGA ทั้งหมด',
        outputWhat: '3-PGA (C₃+P) จำนวน 6 โมเลกุล',
        nextFillWhat: 'ส่ง 3-PGA ×6 → เครื่องที่ 2 เพื่อชาร์จด้วย ATP + NADPH'
      },
      costs: { CO2: 3 },
      outputs: { '3PGA': 6 }
    },
    reduction: {
      id: 'reduction',
      name: 'เครื่องจักรที่ 2: การลดพละกำลัง',
      icon: '⚡💧➡️🧪',
      shortName: '2. Reduction',
      color: '#5abf7a',
      bg: 0x5abf7a,
      steps: [
        { icon: '📥', label: 'รับ 3-PGA จากเครื่องที่ 1', text: '3-PGA ×6 โมเลกุล (C₃+P แต่ละตัว) เข้าสายพานชาร์จพลังงาน' },
        { icon: '⚡', label: 'ชาร์จด้วย ATP', text: 'ATP ×6 แตกเป็น ADP + Pi → Pi ถ่ายโอนให้ 3-PGA → กลายเป็น 1,3-BPG (C₃+2P) ที่มีพลังสูง (ADP ×6 กลับสู่แสง)' },
        { icon: '💧', label: 'ลดด้วย NADPH', text: 'NADPH ×6 ให้ H⁻ + อิเล็กตรอน → 1,3-BPG ถูกลด (reduce) → กลายเป็น G3P (Glyceraldehyde-3-phosphate, C₃+P) (NADP⁺ ×6 กลับสู่แสง)' },
        { icon: '🧪', label: 'ได้ G3P ×6', text: 'G3P (C₃+P) ×6 โมเลกุล — โมเลกุล 3 คาร์บอนสำหรับฟื้นฟู RuBP หรือสะสมทบทำน้ำตาล 🍬' },
        { icon: '✅', label: 'ตรวจบัญชีพลังงาน', text: 'ATP ×6 → ADP ×6 + Pi ×6 ✓ | NADPH ×6 → NADP⁺ ×6 ✓ | 3-PGA ×6 → G3P ×6 ✓' }
      ],
      detail: {
        title: 'เครื่องจักรที่ 2: Reduction (ชาร์จด้วย ATP + NADPH)',
        breakWhat: 'ATP แตกเป็น ADP + Pi | NADPH แตกเป็น NADP⁺ + H⁻ (อิเล็กตรอน)',
        fillWhat: '3-PGA ×6 + ATP ×6 + NADPH ×6',
        remainWhat: 'ADP ×6, NADP⁺ ×6, Pi ×12 → รีไซเคิลกลับขั้นตอนแสง (Light Reactions)',
        outputWhat: 'G3P (C₃+P) ×6 โมเลกุล',
        nextFillWhat: 'ส่ง G3P ×6 → เครื่องที่ 3: แยก 1 ตัวทำน้ำตาล + 5 ตัวฟื้นฟู RuBP'
      },
      costs: { ATP: 6, NADPH: 6 },
      outputs: { 'G3P': 6 }
    },
    regeneration: {
      id: 'regeneration',
      name: 'เครื่องจักรที่ 3: การฟื้นฟู RuBP',
      icon: '🧬🔄➡️RuBP',
      shortName: '3. Regeneration',
      color: '#bfa53a',
      bg: 0xbfa53a,
      steps: [
        { icon: '📦', label: 'รับ G3P ×6 จากเครื่องที่ 2', text: 'G3P ×6 โมเลกุล (C₃+P แต่ละตัว) เข้าเครื่อง — แยก 1 ตัวออกไปทำน้ำตาล เหลือ G3P ×5' },
        { icon: '🔢', label: 'นับ Carbon ที่เหลือ', text: 'G3P ×5 = คาร์บอน 5×3C = 15C + 5P รวมกัน เตรียมจัดเรียงใหม่เป็น RuBP (C₅+2P)' },
        { icon: '⚡', label: 'เติม ATP ×3', text: 'ATP ×3 แตกเป็น ADP ×3 + Pi ×3 → Pi เพิ่มฟอสเฟตให้โมเลกุลช่วยจัดเรียง C₅ (ADP ×3 กลับสู่แสง)' },
        { icon: '🔄', label: 'จัดเรียงใหม่เป็น RuBP', text: 'เอนไซม์จัดเรียงคาร์บอน 15C + ฟอสเฟต 6P → 3 กลุ่ม × (5C+2P) = RuBP ×3 โมเลกุล พร้อมใช้งานใหม่' },
        { icon: '✅', label: 'ตรวจบัญชีและวนซ้ำ', text: 'G3P ×5 (15C+5P) + ATP ×3 (3P) → RuBP ×3 (15C+6P) + ADP ×3 ✓ | RuBP กลับไปเครื่องที่ 1 | สะสม G3P ×2 = น้ำตาล ×1!' }
      ],
      detail: {
        title: 'เครื่องจักรที่ 3: Regeneration (ฟื้นฟู RuBP เพื่อวนซ้ำ)',
        breakWhat: 'ATP ×3 แตกเป็น ADP ×3 + Pi ×3 (ฟอสเฟตช่วยจัดโครงสร้าง RuBP)',
        fillWhat: 'G3P ×5 + ATP ×3 (G3P ×1 ถูกแยกออกทำน้ำตาล)',
        remainWhat: 'ADP ×3 + Pi บางส่วน → ส่งกลับขั้นตอนแสง',
        outputWhat: 'RuBP (C₅+2P) ×3 โมเลกุล พร้อมตรึง CO₂ รอบถัดไป',
        nextFillWhat: 'RuBP ×3 → กลับเครื่องที่ 1 | G3P สะสม 2 รอบ = น้ำตาล ×1 → เอาไปให้ต้นกล้าในสวนป่า!'
      },
      costs: { ATP: 3 },
      outputs: { 'RuBP': 3 }
    }
  },

  LIGHT_MACHINE: {
    id: 'light',
    name: 'เครื่องขั้นแสง: Light Reaction',
    icon: '☀️💧➡️⚡💧',
    shortName: '0. Light Reaction',
    color: '#ffe74a',
    bg: 0xffe74a,
    steps: [
      { icon: '☀️', label: 'โฟตอนฟาดคลอโรฟิลล์', text: 'โฟตอนระดับพลังงานสูงทำปฏิกิริยากับคลอโรฟิลล์ที่ PSII → อิเล็กตรอนตื่นเต้นขึ้น (เครื่องทำงานเมื่อตักน้ำแล้ว)' },
      { icon: '📦', label: 'ใส่น้ำ H₂O ลงกล่อง', text: 'นำ H₂O จากบ่อมาใส่กล่องน้ำของเครื่อง แล้วเครื่องจะใช้น้ำทีละ 1 หน่วย' },
      { icon: '⚡', label: 'แสงแยกน้ำและสร้างพลังงาน', text: 'คลอโรฟิลล์ดูดโฟตอน → H₂O แตกตัวเป็น O₂ + H⁺ + e⁻ และสร้าง ATP จาก ADP + Pi' },
      { icon: '🔋', label: 'สร้าง NADPH', text: 'NADP⁺ รับอิเล็กตรอนกับ H⁺ → NADPH พร้อมส่งให้เครื่องที่ 2 ในวัฏจักรคาลวิน' },
      { icon: '✅', label: 'ตรวจบัญชี', text: 'น้ำ 1 หน่วยในกล่อง → ATP +1 + NADPH +1 และปล่อย O₂ สู่บรรยากาศ ✓' }
    ],
    detail: {
      title: 'เครื่องจักรกระบวนการ Light Reaction',
      breakWhat: 'H₂O แตกตัว: 2H₂O → O₂ + 4H⁺ + 4e⁻ | NADP⁺ + H⁺ + e⁻ → NADPH | ADP + Pi → ATP',
      fillWhat: 'ตักน้ำ H₂O จากบ่อไปใส่กล่องน้ำของเครื่องจักร เครื่องทำงานต่อเนื่องตราบใดที่ยังมีน้ำ',
      remainWhat: 'O₂ ปล่อยออกสู่บรรยากาศ',
      outputWhat: 'ATP +1 + NADPH +1 (ถ้ามีแสงจะได้ ATP/NADPH 4 ต่อครั้ง)',
      nextFillWhat: 'นำ ATP + NADPH ไปเครื่องที่ 2 เพื่อลด 3-PGA ให้เป็น G3P'
    },
    costs: { WATER: 1 },
    outputs: { ATP: 1, NADPH: 1 }
  },

  // ระบบสวนป่ากรมป่าไม้ — ต้นกล้าพร้อมไว้แล้ว เอาน้ำตาลจากคาลวินมาให้เติบโตจนครบ 5 ต้น
  FOREST: {
    PLOTS: 5,          // จำนวนต้นกล้าในสวนป่า (เริ่มเป็นต้นกล้าพร้อมโต)
    STAGES: 5,         // ระยะการเติบโต: 1=เมล็ด 2=กล้า 3=ต้นอ่อน 4=กำลังโต 5=สมบูรณ์ (เริ่มที่ 1 เสมอ)
    SUGAR_PER_FEED: 1, /* น้ำตาลที่ใช้ป้อนต่อ 1 ครั้ง */
    INITIAL_LEVEL: 1,  // ระดับเริ่มต้น — เป็นต้นกล้าเลยตั้งแต่แรก
    MEDAL_NAME: '🏅 เหรียญขยัน' // รางวัลเมื่อป่าครบ 5 ต้นสมบูรณ์
  },

  COLORS: {
    grass1: 0x4caf50,
    grass2: 0x43a047,
    grassDark: 0x2e7d32,
    path: 0x8b6f47,
    pathDark: 0x6b5537,
    water: 0x3a7abf,
    water2: 0x2a5a9f,
    sand: 0xd9b87a,
    stone: 0x808080,
    stoneDark: 0x5a5a5a,
    wood: 0x8b5a2b,
    woodDark: 0x5c3a1a,
    leaf: 0x4caf50,
    leafDark: 0x388e3c,
    factoryBase: 0x5c4030,
    factoryWall: 0x7a5a40,
    factoryRoof: 0x8b3a3a,
    sky1: 0x4a7abf,
    sky2: 0x7ab8df,
    sun1: 0xffd700,
    sun2: 0xffa500
  }
};

const GameState = {
  res: { CO2: 0, WATER: 0, ATP: 0, NADPH: 0, G3P: 0, SUGAR: 0 },
  co2Loaded: 0,
  co2Collects: 0,
  co2Inserts: 0,
  sugarReady: 0,
  currentLocation: 'factory',
  isCycleRunning: false,
  cycleStage: -1,
  pendingAction: null,
  phaserGame: null,
  phaserScene: null,

  // ระบบฝึกสอนครั้งแรก
  tutorialActive: false,
  tutorialDone: false,
  cutsceneActive: false,

  // สวนป่ากรมป่าไม้ — ต้นกล้าพร้อมอยู่แล้ว level 1..STAGES (เริ่มเป็นต้นอ่อน)
  forest: {
    trees: Array(CONFIG.FOREST.PLOTS).fill(CONFIG.FOREST.INITIAL_LEVEL),
    fed: 0,
    medals: 0 // จำนวนเหรียญขยันที่ได้รับเมื่อป่าครบสมบูรณ์
  },

  cycleTimer: null,
  autoCycle: false,

  totalCycles: 0,
  totalGlucose: 0,
  startedAt: Date.now(),

  // ── ระบบเซฟหลายช่อง + ระบบความสำเร็จ ──
  currentSlot: 0,
  waterGathers: 0,
  atpMade: 0,
  achievements: [],

  stateJSON() {
    return {
      res: this.res,
      forest: this.forest,
      totalCycles: this.totalCycles,
      totalGlucose: this.totalGlucose,
      co2Loaded: this.co2Loaded,
      co2Collects: this.co2Collects,
      co2Inserts: this.co2Inserts,
      sugarReady: this.sugarReady,
      startedAt: this.startedAt,
      waterGathers: this.waterGathers,
      atpMade: this.atpMade,
      achievements: this.achievements,
      autoCycle: this.autoCycle
    };
  },

  applyJSON(s) {
    if (!s) return false;
    try {
      Object.assign(this.res, s.res || {});
      if (s.forest && Array.isArray(s.forest.trees)) {
        this.forest.trees = s.forest.trees.map(v => {
          const clamped = Math.max(CONFIG.FOREST.INITIAL_LEVEL, Math.min(CONFIG.FOREST.STAGES, v | 0));
          return Number.isFinite(clamped) ? clamped : CONFIG.FOREST.INITIAL_LEVEL;
        });
        if (typeof s.forest.fed === 'number') this.forest.fed = s.forest.fed;
        if (typeof s.forest.medals === 'number') this.forest.medals = s.forest.medals;
      }
      while (this.forest.trees.length < CONFIG.FOREST.PLOTS) this.forest.trees.push(CONFIG.FOREST.INITIAL_LEVEL);
      this.forest.trees.length = CONFIG.FOREST.PLOTS;
      if (typeof s.totalCycles === 'number') this.totalCycles = s.totalCycles;
      if (typeof s.totalGlucose === 'number') this.totalGlucose = s.totalGlucose;
      if (typeof s.co2Loaded === 'number') this.co2Loaded = Math.max(0, Math.min(CONFIG.CO2_PER_CYCLE, s.co2Loaded | 0));
      if (typeof s.co2Collects === 'number') this.co2Collects = Math.max(0, s.co2Collects | 0);
      if (typeof s.co2Inserts === 'number') this.co2Inserts = Math.max(0, s.co2Inserts | 0);
      if (typeof s.sugarReady === 'number') this.sugarReady = Math.max(0, s.sugarReady | 0);
      if (typeof s.startedAt === 'number' && isFinite(s.startedAt)) this.startedAt = s.startedAt;
      if (typeof s.waterGathers === 'number') this.waterGathers = Math.max(0, s.waterGathers | 0);
      if (typeof s.atpMade === 'number') this.atpMade = Math.max(0, s.atpMade | 0);
      if (typeof s.autoCycle === 'boolean') this.autoCycle = s.autoCycle;
      if (Array.isArray(s.achievements)) this.achievements = s.achievements.filter(a => typeof a === 'string');
      return true;
    } catch (e) {}
    return false;
  },

  save() {
    if (typeof SaveManager !== 'undefined' && SaveManager && typeof SaveManager.write === 'function') {
      SaveManager.write(this.currentSlot, this.stateJSON());
    }
  },

  load() {
    if (typeof SaveManager !== 'undefined' && SaveManager && typeof SaveManager.read === 'function') {
      return this.applyJSON(SaveManager.read(this.currentSlot));
    }
    return false;
  },

  resetAll() {
    this.res = { CO2: 0, WATER: 0, ATP: 0, NADPH: 0, G3P: 0, SUGAR: 0 };
    this.co2Loaded = 0;
    this.co2Collects = 0;
    this.co2Inserts = 0;
    this.sugarReady = 0;
    this.isCycleRunning = false;
    this.cycleStage = -1;
    this.pendingAction = null;
    this.currentLocation = 'factory';
    this.cycleTimer = null;
    this.forest = { trees: Array(CONFIG.FOREST.PLOTS).fill(CONFIG.FOREST.INITIAL_LEVEL), fed: 0, medals: 0 };
    this.totalCycles = 0;
    this.totalGlucose = 0;
    this.waterGathers = 0;
    this.atpMade = 0;
    this.achievements = [];
    this.autoCycle = false;
    this.startedAt = Date.now();
  }
};
