(function () {
  window.VirtualKeys = { up: false, down: false, left: false, right: false, interact: false };

  function wire(btn) {
    const k = btn && btn.dataset ? btn.dataset.k : null;
    if (!btn || !k) return;
    const press = (e) => { e.preventDefault(); window.VirtualKeys[k] = true; };
    const release = () => { window.VirtualKeys[k] = false; };
    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.touch-controls [data-k]').forEach(wire);
  });
})();