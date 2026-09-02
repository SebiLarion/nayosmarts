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
})();
