function getCarryItModals() {
  return document.querySelectorAll('.carry-it-h1-modal');
}

function shopifyImageUrl(src, width) {
  if (!src) return '';
  try {
    const url = new URL(src, window.location.origin);
    url.searchParams.set('width', String(width || 240));
    return url.toString();
  } catch (error) {
    const separator = src.includes('?') ? '&' : '?';
    return src + separator + 'width=' + (width || 240);
  }
}

function readMainProduct(variant) {
  const info = document.querySelector('product-info');
  const idInput = info?.querySelector('form[data-type="add-to-cart-form"] input[name="id"]');
  const addButton = info?.querySelector('form[data-type="add-to-cart-form"] [type="submit"][name="add"]');
  const titleEl = document.querySelector('.product-title-h1__heading');
  const stickyImg = document.querySelector('[data-sticky-product-media] img');
  const galleryImg = document.querySelector(
    '.product__media img, .product-gallery img, product-gallery img, .product__gallery img'
  );

  let image = '';
  const featured = variant?.featured_image || variant?.featured_media;
  if (featured) {
    image = featured.src || featured.preview_image?.src || '';
  }
  if (!image) image = stickyImg?.currentSrc || stickyImg?.src || '';
  if (!image) image = galleryImg?.currentSrc || galleryImg?.src || '';

  return {
    variantId: variant?.id || idInput?.value || '',
    available: typeof variant?.available === 'boolean' ? variant.available : addButton ? !addButton.disabled : true,
    title: titleEl?.textContent.replace(/\s+/g, ' ').trim() || '',
    image: image,
  };
}

function applyCarryItProduct(modal, state) {
  if (!modal || !state) return;

  const variantInput = modal.querySelector('[data-carry-it-h1-variant]');
  const titleEl = modal.querySelector('[data-carry-it-h1-title]');
  const thumb = modal.querySelector('[data-carry-it-h1-thumb]');
  let imageEl = thumb?.querySelector('img');
  const addButton = modal.querySelector('[data-carry-it-h1-add]');
  const addLabel = modal.querySelector('[data-carry-it-h1-add-label]');

  if (variantInput && state.variantId) variantInput.value = state.variantId;
  if (titleEl && state.title) titleEl.textContent = state.title;

  if (thumb && state.image) {
    if (!imageEl) {
      imageEl = document.createElement('img');
      imageEl.alt = state.title || '';
      imageEl.loading = 'lazy';
      thumb.appendChild(imageEl);
    }
    imageEl.src = shopifyImageUrl(state.image, 240);
    imageEl.alt = state.title || imageEl.alt || '';
  }

  if (addButton) {
    addButton.disabled = !state.available;
    if (addLabel) {
      addLabel.textContent = state.available
        ? addButton.dataset.addLabel
        : addButton.dataset.soldOutLabel;
    }
  }
}

function syncCarryItProduct(variant) {
  const state = readMainProduct(variant);
  getCarryItModals().forEach((modal) => applyCarryItProduct(modal, state));
}

if (!window.__carryItH1ProductSync) {
  window.__carryItH1ProductSync = true;

  document.addEventListener(
    'variant:change',
    (event) => {
      syncCarryItProduct(event.detail?.variant);
    },
    true
  );

  document.addEventListener('shopify:section:load', (event) => {
    const section = event.target;
    if (!section?.querySelector?.('product-info')) return;
    syncCarryItProduct();
  });

  if (window.theme?.pubsub?.subscribe && theme.pubsub.PUB_SUB_EVENTS?.variantChange) {
    theme.pubsub.subscribe(theme.pubsub.PUB_SUB_EVENTS.variantChange, (event) => {
      syncCarryItProduct(event?.data?.variant);
    });
  }
}

if (!customElements.get('carry-it-h1')) {
  customElements.define(
    'carry-it-h1',
    class CarryItH1 extends HTMLElement {
      connectedCallback() {
        this.scroller = this.querySelector('[data-carry-it-h1-scroller]');
        this.modal = this.querySelector('x-modal');
        this.media = this.modal?.querySelector('[data-carry-it-h1-media]');
        this.poster = this.modal?.querySelector('[data-carry-it-h1-poster]');
        this.player = this.modal?.querySelector('[data-carry-it-h1-player]');
        this.playButton = this.modal?.querySelector('[data-carry-it-h1-play]');
        this.cards = this.querySelectorAll('[data-carry-it-h1-card]');

        this.onCardClick = this.onCardClick.bind(this);
        this.onPlay = this.onPlay.bind(this);
        this.onModalHide = this.onModalHide.bind(this);
        this.centerTrack = this.centerTrack.bind(this);

        this.cards.forEach((card) => card.addEventListener('click', this.onCardClick));
        this.playButton?.addEventListener('click', this.onPlay);
        this.modal?.addEventListener('modal:afterHide', this.onModalHide);
        window.addEventListener('resize', this.centerTrack);

        this.centerTrack();
        requestAnimationFrame(this.centerTrack);
      }

      disconnectedCallback() {
        this.cards.forEach((card) => card.removeEventListener('click', this.onCardClick));
        this.playButton?.removeEventListener('click', this.onPlay);
        this.modal?.removeEventListener('modal:afterHide', this.onModalHide);
        window.removeEventListener('resize', this.centerTrack);
      }

      centerTrack() {
        if (!this.scroller || window.matchMedia('(min-width: 768px)').matches) return;
        const maxScroll = this.scroller.scrollWidth - this.scroller.clientWidth;
        if (maxScroll > 0) this.scroller.scrollLeft = maxScroll / 2;
      }

      onCardClick(event) {
        event.preventDefault();
        this.open(event.currentTarget);
      }

      open(card) {
        if (!this.modal) return;
        this.activeCard = card;

        if (this.poster && card.dataset.cover) {
          this.poster.src = card.dataset.cover;
          this.poster.hidden = false;
        }

        this.resetPlayer();
        syncCarryItProduct();
        this.modal.show(card);
      }

      onPlay(event) {
        event.preventDefault();
        event.stopPropagation();
        if (!this.activeCard || !this.player) return;

        const template = this.activeCard.querySelector('[data-carry-it-h1-video]');
        const host = this.activeCard.dataset.videoHost;
        const id = this.activeCard.dataset.videoId;

        if (template) {
          this.player.replaceChildren(template.content.cloneNode(true));
          const video = this.player.querySelector('video');
          if (video) {
            video.setAttribute('playsinline', '');
            video.controls = true;
            video.play().catch(() => {});
          }
        } else if (id && (host === 'youtube' || host === 'vimeo')) {
          const iframe = document.createElement('iframe');
          iframe.setAttribute('allow', 'autoplay; encrypted-media; fullscreen; picture-in-picture');
          iframe.setAttribute('allowfullscreen', '');
          iframe.title = this.activeCard.dataset.heading || '';
          iframe.src =
            host === 'youtube'
              ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
              : `https://player.vimeo.com/video/${id}?autoplay=1`;
          this.player.replaceChildren(iframe);
        } else {
          return;
        }

        this.media?.classList.add('is-playing');
      }

      onModalHide() {
        this.resetPlayer();
        this.activeCard = null;
      }

      resetPlayer() {
        this.media?.classList.remove('is-playing');
        if (!this.player) return;
        this.player.querySelectorAll('video').forEach((video) => {
          video.pause();
          video.removeAttribute('src');
          video.load();
        });
        this.player.replaceChildren();
      }
    }
  );
}
