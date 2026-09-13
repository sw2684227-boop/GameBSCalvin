(function () {
  window.VirtualKeys = { up: false, down: false, left: false, right: false, interact: false };

  // flag บอก Phaser ว่า touch ถูก HTML button จับไปแล้ว อย่า trigger game zones
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
      // เช็คว่าปุ่มทั้งหมดปล่อยแล้วค่อย unblock
      const anyPressed = Object.values(window.VirtualKeys).some(Boolean);
      if (!anyPressed) setBlocked(false);
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

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.touch-controls [data-k]').forEach(wire);
  });
})();
