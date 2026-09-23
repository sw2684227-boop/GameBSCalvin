(function () {
  window.VirtualKeys = { up: false, down: false, left: false, right: false, interact: false };

  // flag บอก Phaser ว่า touch ถูก HTML control จับไปแล้ว อย่า trigger game zones
  window.TouchBlockedByUI = false;
  let _blockTimer = null;

  function setBlocked(val) {
    window.TouchBlockedByUI = val;
    if (_blockTimer) clearTimeout(_blockTimer);
    if (val) {
      // safety fallback: คืนค่าเป็น false หลัง 2 วิ กรณี pointerup หายไป
      _blockTimer = setTimeout(() => { window.TouchBlockedByUI = false; }, 2000);
    }
  }

  function anyKeyPressed() {
    var v = window.VirtualKeys;
    return !!(v.up || v.down || v.left || v.right || v.interact);
  }

  function wire(btn) {
    const k = btn && btn.dataset ? btn.dataset.k : null;
    if (!btn || !k) return;

    const press = (e) => {
      e.preventDefault();
      e.stopPropagation();   // ← บล็อกไม่ให้ event ส่งต่อไป Phaser canvas
      window.VirtualKeys[k] = true;
      setBlocked(true);
    };

    const release = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      window.VirtualKeys[k] = false;
      if (!anyKeyPressed()) setBlocked(false);
    };

    btn.addEventListener('pointerdown',   press,   { passive: false });
    btn.addEventListener('pointerup',     release, { passive: false });
    btn.addEventListener('pointercancel', release, { passive: false });
    btn.addEventListener('pointerleave',  release, { passive: false });
    btn.addEventListener('touchstart',    press,   { passive: false });
    btn.addEventListener('touchend',      release, { passive: false });
    btn.addEventListener('touchcancel',   release, { passive: false });
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /* ── Virtual Joystick: วงกลมลาก เดิน 8 ทิศ ── */
  function initJoystick() {
    const joy = document.getElementById('joypad');
    if (!joy) return;
    const base = joy.querySelector('.joy-base');
    const knob = joy.querySelector('.joy-knob');
    if (!base || !knob) return;

    const DEADZONE = 16;            // px ที่ไม่เดิน (zone กลาง)
    let active = false;
    let pid = null;
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
      const dist = Math.sqrt(dx * dx + dy * dy);
      const kx = dist > max ? (dx / dist) * max : dx;
      const ky = dist > max ? (dy / dist) * max : dy;
      knob.style.transform = 'translate(' + kx + 'px, ' + ky + 'px)';
      setKeys(dx, dy);
    }

    function reset(resetKeys) {
      active = false;
      pid = null;
      knob.style.transition = 'transform 0.18s cubic-bezier(0.2, 0.8, 0.3, 1)';
      knob.style.transform = 'translate(0, 0)';
      joy.classList.remove('joy-active');
      if (resetKeys) {
        window.VirtualKeys.up = window.VirtualKeys.down =
          window.VirtualKeys.left = window.VirtualKeys.right = false;
      }
      if (!anyKeyPressed()) setBlocked(false);
    }

    base.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      readRect();
      active = true;
      pid = e.pointerId;
      setBlocked(true);
      joy.classList.add('joy-active');
      knob.style.transition = 'transform 0.04s linear';
      try { base.setPointerCapture(e.pointerId); } catch (err) {}
      move(e.clientX - cx, e.clientY - cy);
    });

    base.addEventListener('pointermove', (e) => {
      if (!active || e.pointerId !== pid) return;
      e.preventDefault();
      e.stopPropagation();
      move(e.clientX - cx, e.clientY - cy);
    });

    const end = (e) => {
      if (!active || (e && e.pointerId !== pid)) return;
      if (e) { e.preventDefault(); e.stopPropagation(); }
      reset(true);
    };
    base.addEventListener('pointerup', end);
    base.addEventListener('pointercancel', end);
    base.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.touch-controls [data-k]').forEach(wire);
    initJoystick();
  });
})();