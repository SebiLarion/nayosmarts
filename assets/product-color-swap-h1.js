/**
 * H1 product template: swap between sibling colour products without a page reload.
 *
 * Each colour is a separate product linked through a metafield, so the theme's
 * ProductInfo variant pipeline does not apply (it forces a full navigation when
 * the product URL changes). Instead we re-render the whole main product section
 * for the sibling product through the Section Rendering API and replace it in
 * place. The swatches stay real links, so this is progressive enhancement.
 */
(function () {
  if (window.__productColorSwapH1) return;
  window.__productColorSwapH1 = true;

  var SWATCH_SELECTOR = 'a[data-color-swap]';
  var cache = new Map();
  var controllers = new Map();

  function getSectionId(el) {
    var row = el.closest('[data-section-id]');
    if (row) return row.getAttribute('data-section-id');

    var nested = el.closest('.shopify-section');
    return nested ? nested.id.replace('shopify-section-', '') : null;
  }

  function getSection(el) {
    var nested = el.closest('.shopify-section');
    if (nested) return nested;

    var sectionId = getSectionId(el);
    return sectionId ? document.getElementById('shopify-section-' + sectionId) : null;
  }

  function buildRequestUrl(productUrl, sectionId) {
    var url = new URL(productUrl, window.location.origin);
    url.searchParams.set('section_id', sectionId);
    return url.toString();
  }

  function fetchSection(productUrl, sectionId) {
    var requestUrl = buildRequestUrl(productUrl, sectionId);
    if (cache.has(requestUrl)) return Promise.resolve(cache.get(requestUrl));

    controllers.get(sectionId)?.abort();
    var controller = new AbortController();
    controllers.set(sectionId, controller);

    return fetch(requestUrl, { signal: controller.signal })
      .then(function (response) {
        if (!response.ok) throw new Error('Section request failed: ' + response.status);
        return response.text();
      })
      .then(function (html) {
        cache.set(requestUrl, html);
        return html;
      });
  }

  // innerHTML does not execute <script>, so re-create every script node.
  function setInnerHTML(element, html) {
    element.innerHTML = html;

    element.querySelectorAll('script').forEach(function (oldScript) {
      var newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(function (attribute) {
        newScript.setAttribute(attribute.name, attribute.value);
      });
      newScript.appendChild(document.createTextNode(oldScript.innerHTML));
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }

  function updateHead(productUrl, pageTitle) {
    if (pageTitle) document.title = pageTitle;

    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      var canonicalUrl = new URL(canonical.href);
      var target = new URL(productUrl, window.location.origin);
      canonicalUrl.pathname = target.pathname;
      canonicalUrl.search = '';
      canonical.href = canonicalUrl.toString();
    }
  }

  /**
   * The Delivery/ETA app takes its product context from globals published by its app embed
   * in the layout, which a section-only swap never re-renders. Point those at the new
   * product, clear the sticky rule-match flags, then let the app resolve its rules and
   * redraw. Without the reset, the previous product's match short-circuits the new one.
   */
  function reinitDeliveryApp(section) {
    var dataNode = section.querySelector('script[data-edd-product-h1]');
    if (!dataNode || typeof window.findSpecificEDDMsg !== 'function') return;

    var data;
    try {
      data = JSON.parse(dataNode.textContent);
    } catch (error) {
      console.warn('[color-swap-h1] could not read delivery app product data', error);
      return;
    }

    window.edd_sb_product_id = data.id;
    window.edd_sb_product_title = data.title;
    window.edd_sb_product_handle = data.handle;
    window.edd_sb_product_type = data.type;
    window.edd_sb_product_vendor = data.vendor;
    window.edd_sb_product_tag = data.tags || [];
    window.edd_sb_collection_id = data.collections || [];
    window.edd_check_sb_collection_id = data.collections || [];
    window.edd_sb_product_qty = data.quantity;

    window.sb_is_exclude_product = '0';
    window.sb_set_specific_msg = 0;
    window.is_set_msg_for_sb_collection = '0';
    window.is_set_msg_for_sb_product_tag = '0';

    try {
      window.findSpecificEDDMsg();

      var jq = window.jQuery191 || window.jQuery || window.$;
      if (typeof jq === 'function' && typeof window.OrderDeliveryEstimationLogic === 'function') {
        window.OrderDeliveryEstimationLogic(jq);
      }
    } catch (error) {
      console.warn('[color-swap-h1] delivery app re-init failed', error);
    }
  }

  function getOpenFitsModal() {
    return document.querySelector('body > x-modal.fits-modal-h1[open], x-modal.fits-modal-h1[open]');
  }

  /**
   * x-modal moves the fits drawer to document.body. A section innerHTML swap
   * would leave that open drawer on the old product, and hide() would try to
   * put it back on a detached parent. Copy the new product's drawer panels
   * into the live modal and retarget it at the new section slot.
   */
  function syncOpenFitsModal(section) {
    var openModal = getOpenFitsModal();
    var incoming = section.querySelector('x-modal.fits-modal-h1');
    if (!openModal || !incoming || openModal === incoming) return;

    var selected = openModal.querySelector('[data-fits-option].is-active');
    var optionId = selected ? selected.dataset.fitsOption : '';
    var incomingFits = incoming.querySelector('product-fits-h1');
    var openFits = openModal.querySelector('product-fits-h1');

    if (incomingFits && openFits) {
      ['[data-fits-swap="body"]', '[data-fits-swap="footer"]'].forEach(function (selector) {
        var next = incomingFits.querySelector(selector);
        var prev = openFits.querySelector(selector);
        if (next && prev) prev.replaceWith(next);
      });

      if (incomingFits.hasAttribute('data-section-id')) {
        openFits.setAttribute('data-section-id', incomingFits.getAttribute('data-section-id'));
      }
    }

    var newId = incoming.id;
    openModal.id = newId;
    openModal.querySelectorAll('[aria-controls]').forEach(function (el) {
      el.setAttribute('aria-controls', newId);
    });

    openModal.originalParentBeforeAppend = incoming.parentNode;
    incoming.remove();

    if (openFits && typeof openFits.select === 'function') {
      var hasSavedSize = optionId && openFits.querySelector('[data-fits-option="' + (window.CSS && CSS.escape ? CSS.escape(optionId) : optionId) + '"]');
      if (hasSavedSize) {
        openFits.select(optionId, { applyVariant: true });
      } else {
        var fallback = openFits.querySelector('[data-fits-option].is-active') || openFits.querySelector('[data-fits-option]');
        if (fallback) openFits.select(fallback.dataset.fitsOption);
      }
    }

    var trigger = section.querySelector('.product-title-h1__fits');
    if (trigger) {
      trigger.setAttribute('aria-controls', newId);
      trigger.setAttribute('aria-expanded', 'true');
    }
  }

  function swap(section, html) {
    var parsed = new DOMParser().parseFromString(html, 'text/html');
    var incoming = parsed.querySelector('.shopify-section');
    if (!incoming) throw new Error('No section found in response');

    setInnerHTML(section, incoming.innerHTML);
    syncOpenFitsModal(section);
    reinitDeliveryApp(section);

    // Apps and theme components that hook the theme editor lifecycle re-init here.
    section.dispatchEvent(
      new CustomEvent('shopify:section:load', {
        bubbles: true,
        detail: { sectionId: section.id.replace('shopify-section-', '') }
      })
    );

    if (window.Shopify && window.Shopify.PaymentButton) {
      try {
        window.Shopify.PaymentButton.init();
      } catch (error) {
        /* dynamic checkout is optional */
      }
    }
  }

  function render(section, productUrl, pageTitle, options) {
    var sectionId = section.id.replace('shopify-section-', '');
    var openFits = getOpenFitsModal();
    section.classList.add('is-swapping');
    if (openFits) openFits.classList.add('is-swapping');

    return fetchSection(productUrl, sectionId)
      .then(function (html) {
        if (!options || options.updateHistory !== false) {
          var target = new URL(productUrl, window.location.origin);
          window.history.pushState({ colorSwapH1: true, url: target.pathname }, '', target.pathname);
        }

        updateHead(productUrl, pageTitle);
        swap(section, html);
        section.classList.remove('is-swapping');
        if (openFits) openFits.classList.remove('is-swapping');
      })
      .catch(function (error) {
        if (error.name === 'AbortError') return;
        console.error('[color-swap-h1]', error);
        section.classList.remove('is-swapping');
        if (openFits) openFits.classList.remove('is-swapping');
        window.location.href = productUrl;
      });
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest(SWATCH_SELECTOR);
    if (!link) return;

    // Let the browser handle new-tab / download / modified clicks normally.
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    if (link.getAttribute('aria-current') === 'true') {
      event.preventDefault();
      return;
    }

    var section = getSection(link);
    var sectionId = getSectionId(link);
    var productUrl = link.getAttribute('data-product-url') || link.getAttribute('href');
    if (!section || !sectionId || !productUrl) return;

    event.preventDefault();
    render(section, productUrl, link.getAttribute('data-page-title'));
  });

  function prefetch(event) {
    var link = event.target.closest && event.target.closest(SWATCH_SELECTOR);
    if (!link || link.getAttribute('aria-current') === 'true') return;

    var sectionId = getSectionId(link);
    var productUrl = link.getAttribute('data-product-url') || link.getAttribute('href');
    if (!sectionId || !productUrl) return;

    var requestUrl = buildRequestUrl(productUrl, sectionId);
    if (cache.has(requestUrl)) return;

    fetch(requestUrl)
      .then(function (response) {
        return response.ok ? response.text() : null;
      })
      .then(function (html) {
        if (html) cache.set(requestUrl, html);
      })
      .catch(function () {
        /* prefetch is best effort */
      });
  }

  document.addEventListener('pointerenter', prefetch, true);
  document.addEventListener('focusin', prefetch);

  window.addEventListener('popstate', function () {
    var swatch = document.querySelector(SWATCH_SELECTOR);
    if (!swatch) return;

    var section = getSection(swatch);
    if (!section) return;

    var current = document.querySelector(SWATCH_SELECTOR + '[aria-current="true"]');
    var currentPath = current
      ? new URL(current.getAttribute('data-product-url'), window.location.origin).pathname
      : null;
    if (currentPath === window.location.pathname) return;

    var target = document.querySelector(
      SWATCH_SELECTOR + '[data-product-url="' + window.location.pathname + '"]'
    );
    if (!target) {
      window.location.reload();
      return;
    }

    render(section, window.location.pathname, target.getAttribute('data-page-title'), {
      updateHistory: false
    });
  });
})();
