(function () {
  window.VirtualKeys = { up: false, down: false, left: false, right: false, interact: false };

  // flag บอก Phaser ว่า touch ถูก HTML control จับไปแล้ว อย่า trigger game zones
  window.TouchBlockedByUI = false;
  let _blockTimer = null;

  const HAS_POINTER = ('PointerEvent' in window);

  function setBlocked(val) {
    window.TouchBlockedByUI = val;
    if (_blockTimer) clearTimeout(_blockTimer);
    if (val) {
      // safety fallback: คืนค่าเป็น false หลัง 2.5 วิ กรณี pointerup หายไป
      _blockTimer = setTimeout(() => { window.TouchBlockedByUI = false; }, 2500);
    }
  }

  function anyKeyPressed() {
    var v = window.VirtualKeys;
    return !!(v.up || v.down || v.left || v.right || v.interact);
  }

  function clearDpad(alsoUnblock) {
    window.VirtualKeys.up = window.VirtualKeys.down =
      window.VirtualKeys.left = window.VirtualKeys.right = false;
    if (alsoUnblock && !anyKeyPressed()) setBlocked(false);
  }

  /* ── ปุ่มกด (⚡ ฯลฯ) — ใช้ pointer หรือ touch อย่างใดอย่างหนึ่ง ป้องกัน double-fire ── */
  function wire(btn) {
    const k = btn && btn.dataset ? btn.dataset.k : null;
    if (!btn || !k) return;

    const press = (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.VirtualKeys[k] = true;
      setBlocked(true);
    };

    const release = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      window.VirtualKeys[k] = false;
      if (!anyKeyPressed()) setBlocked(false);
    };

    btn.addEventListener('contextmenu', (e) => e.preventDefault());

    if (HAS_POINTER) {
      btn.addEventListener('pointerdown', press, { passive: false });
      btn.addEventListener('pointerup', release, { passive: false });
      btn.addEventListener('pointercancel', release, { passive: false });
      btn.addEventListener('pointerleave', release, { passive: false });
    } else {
      btn.addEventListener('touchstart', press, { passive: false });
      btn.addEventListener('touchend', release, { passive: false });
      btn.addEventListener('touchcancel', release, { passive: false });
    }
  }

  /* ── Virtual Joystick: วงกลมลาก เดิน 8 ทิศ ── */
  function initJoystick() {
    const joy = document.getElementById('joypad');
    if (!joy) return;
    const base = joy.querySelector('.joy-base');
    const knob = joy.querySelector('.joy-knob');
    if (!base || !knob) return;

    const DEADZONE = 16;
    let active = false;
    let pid = null;
    let touchId = null;
    let cx = 0, cy = 0, radius = 48;

    function travelMax() { return radius * 0.85; }

    function readRect() {
      const r = base.getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
      radius = r.width / 2;
    }

    function setKeys(dx, dy) {
      const adx = Math.abs(dx), ady = Math.abs(dy);
      window.VirtualKeys.up    = (dy < -DEADZONE && ady >= adx);
      window.VirtualKeys.down  = (dy >  DEADZONE && ady >= adx);
      window.VirtualKeys.left  = (dx < -DEADZONE && adx >= ady);
      window.VirtualKeys.right = (dx >  DEADZONE && adx >= ady);
    }

    function move(dx, dy) {
      const max = travelMax();
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const kx = dist > max ? (dx / dist) * max : dx;
      const ky = dist > max ? (dy / dist) * max : dy;
      knob.style.transform = 'translate(' + kx + 'px, ' + ky + 'px)';
      setKeys(dx, dy);
    }

    function stop(resetKeys) {
      active = false;
      pid = null;
      touchId = null;
      knob.style.transition = 'transform 0.18s cubic-bezier(0.2, 0.8, 0.3, 1)';
      knob.style.transform = 'translate(0, 0)';
      joy.classList.remove('joy-active');
      if (resetKeys) clearDpad(true);
    }

    function startDrag(x, y) {
      readRect();
      active = true;
      setBlocked(true);
      joy.classList.add('joy-active');
      knob.style.transition = 'transform 0.04s linear';
      move(x - cx, y - cy);
    }

    /* --- Pointer path --- */
    base.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      pid = e.pointerId;
      startDrag(e.clientX, e.clientY);
      try { base.setPointerCapture(e.pointerId); } catch (err) { /* some browsers */ }
    });
    base.addEventListener('pointermove', (e) => {
      if (!active || e.pointerId !== pid) return;
      e.preventDefault();
      e.stopPropagation();
      move(e.clientX - cx, e.clientY - cy);
    });
    const ptrEnd = (e) => {
      if (!active || e.pointerId !== pid) return;
      if (e) { e.preventDefault(); e.stopPropagation(); }
      stop(true);
    };
    base.addEventListener('pointerup', ptrEnd);
    base.addEventListener('pointercancel', ptrEnd);

    /* --- Touch fallback (บราวเซอร์ที่ไม่มี PointerEvent) --- */
    if (!HAS_POINTER) {
      base.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const t = e.changedTouches && e.changedTouches[0];
        if (!t) return;
        touchId = t.identifier;
        startDrag(t.clientX, t.clientY);
      }, { passive: false });
      base.addEventListener('touchmove', (e) => {
        if (!active) return;
        e.preventDefault();
        e.stopPropagation();
        const t = e.changedTouches && e.changedTouches[0];
        if (!t || t.identifier !== touchId) return;
        move(t.clientX - cx, t.clientY - cy);
      }, { passive: false });
      const tchEnd = (e) => {
        if (!active) return;
        const t = e.changedTouches && e.changedTouches[0];
        if (t && t.identifier !== touchId) return;
        e.preventDefault();
        e.stopPropagation();
        stop(true);
      };
      base.addEventListener('touchend', tchEnd, { passive: false });
      base.addEventListener('touchcancel', tchEnd, { passive: false });
    }

    base.addEventListener('contextmenu', (e) => e.preventDefault());
    return { stop: function(){ stop(true); } };
  }

  function init() {
    document.querySelectorAll('.touch-controls [data-k]').forEach(wire);
    var joy = initJoystick();

    // safety: ถ้า pointer/touch หลุดหายจากหน้าจอ (เช่น พับจอ/สลับแท็บ) ให้หยุดเดินทันที
    function globalStop() {
      if (joy) joy.stop();
      clearDpad(true);
    }
    window.addEventListener('blur', globalStop);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') globalStop(); });
    if (HAS_POINTER) {
      document.addEventListener('pointerup', (e) => {
        // จอยที่ capture หลุด (capture ล้มเหลว) → pointerup ขึ้นที่ document ให้หยุดเอง
        if (joy && window.VirtualKeys && (window.VirtualKeys.up || window.VirtualKeys.down || window.VirtualKeys.left || window.VirtualKeys.right)) {
          // เดินค้างไว้ = จอย active: reset ให้จอยจอด
          joy.stop();
        }
        void e;
      });
    } else {
      document.addEventListener('touchend', (e) => {
        var anyMove = !!(window.VirtualKeys.up || window.VirtualKeys.down || window.VirtualKeys.left || window.VirtualKeys.right);
        if (joy && anyMove && e.touches.length === 0) joy.stop();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();