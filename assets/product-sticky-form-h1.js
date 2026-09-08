/**
 * H1 sticky ATC: size dropdown stays in sync with the main variant-picker radios.
 * Color swatches reuse product-color-swap-h1.js via data-color-swap.
 */
(function () {
  if (window.__productStickyFormH1) return;
  window.__productStickyFormH1 = true;

  function escapeValue(value) {
    if (window.CSS && typeof CSS.escape === 'function') return CSS.escape(value);
    return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  function findSizeRadio(value) {
    var picker = document.querySelector('variant-picker');
    if (!picker || !value) return null;
    var safe = escapeValue(value);
    return (
      picker.querySelector('input[data-option-value="' + safe + '"]') ||
      picker.querySelector('input[value="' + safe + '"]')
    );
  }

  document.addEventListener('change', function (event) {
    var select = event.target.closest && event.target.closest('[data-sticky-size-select]');
    if (!select) return;

    var radio = findSizeRadio(select.value);
    if (!radio || radio.checked) return;

    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
  });

  document.addEventListener('variant:change', function (event) {
    var variant = event.detail && event.detail.variant;
    if (!variant || !variant.options) return;

    document.querySelectorAll('[data-sticky-size-select]').forEach(function (select) {
      var optionIndex = parseInt(select.getAttribute('data-option-index'), 10) || 0;
      var next = variant.options[optionIndex];
      if (next && select.value !== next) select.value = next;
    });
  });

  /**
   * Hide the bar on a fast flick upwards, bring it back as soon as the reader
   * scrolls down again. The theme only hides it above the fold or at the footer.
   */
  var HIDE_CLASS = 'is-scroll-hidden';
  var FLICK_DISTANCE = 200; // px travelled up
  var FLICK_WINDOW = 300; // within this many ms

  var lastY = window.scrollY;
  var lastTime = 0;
  var flickStart = 0;
  var flickDistance = 0;
  var queued = false;

  function measure() {
    queued = false;

    var bar = document.querySelector('.product-sticky-form-h1');
    if (!bar) return;

    var y = window.scrollY;
    var now = performance.now();
    var delta = y - lastY;
    lastY = y;

    if (delta >= 0) {
      flickDistance = 0;
      if (delta > 0) bar.classList.remove(HIDE_CLASS);
      lastTime = now;
      return;
    }

    // A pause between upward moves starts a new flick.
    if (now - lastTime > FLICK_WINDOW || now - flickStart > FLICK_WINDOW) {
      flickStart = now;
      flickDistance = 0;
    }
    lastTime = now;

    flickDistance += -delta;
    if (flickDistance >= FLICK_DISTANCE) bar.classList.add(HIDE_CLASS);
  }

  window.addEventListener(
    'scroll',
    function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(measure);
    },
    { passive: true }
  );
})();
