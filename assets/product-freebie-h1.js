if (!customElements.get('product-freebie-h1')) {
  customElements.define(
    'product-freebie-h1',
    class ProductFreebieH1 extends HTMLElement {
      connectedCallback() {
        this.titleEl = this.querySelector('[data-freebie-title]');
        this.colorEl = this.querySelector('[data-freebie-color]');
        this.imageEl = this.querySelector('[data-freebie-image]');
        this.compareEl = this.querySelector('[data-freebie-compare]');
        this.bundleInput = this.querySelector('[data-freebie-bundle]');
        this.swatches = this.querySelectorAll('[data-bundle-swatch]');
        this.thumbGroups = Array.from(this.querySelectorAll('[data-freebie-thumb-group]'));

        this.onSwatchClick = this.onSwatchClick.bind(this);
        this.swatches.forEach((swatch) => {
          swatch.addEventListener('click', this.onSwatchClick);
        });

        this.onThumbClick = this.onThumbClick.bind(this);
        this.addEventListener('click', this.onThumbClick);
      }

      disconnectedCallback() {
        this.swatches.forEach((swatch) => {
          swatch.removeEventListener('click', this.onSwatchClick);
        });
        this.removeEventListener('click', this.onThumbClick);
      }

      onSwatchClick(event) {
        event.preventDefault();
        this.select(event.currentTarget);
      }

      onThumbClick(event) {
        const thumb = event.target.closest('[data-freebie-thumb]');
        if (!thumb) return;

        event.preventDefault();
        this.showImage(thumb.dataset.image, thumb.dataset.imageSrcset);
        this.markActiveThumb(thumb);
      }

      showImage(src, srcset) {
        if (!this.imageEl || !src) return;

        this.imageEl.hidden = false;
        this.imageEl.src = src;
        if (srcset) this.imageEl.srcset = srcset;
      }

      markActiveThumb(active) {
        this.querySelectorAll('[data-freebie-thumb]').forEach((thumb) => {
          thumb.setAttribute('aria-current', thumb === active ? 'true' : 'false');
        });
      }

      /**
       * Each colour product ships its own thumb group. With a single group the
       * images are shared across every swatch, so only the active thumb moves.
       */
      syncThumbs(variantId) {
        if (this.thumbGroups.length > 1) {
          const next = this.thumbGroups.find((group) => group.dataset.variantId === variantId);
          if (next) this.thumbGroups.forEach((group) => { group.hidden = group !== next; });
        }

        const current = this.imageEl && this.imageEl.getAttribute('src');
        const visible = this.querySelectorAll('[data-freebie-thumb-group]:not([hidden]) [data-freebie-thumb]');
        let matched = null;
        visible.forEach((thumb) => {
          if (thumb.dataset.image === current) matched = thumb;
        });
        this.markActiveThumb(matched);
      }

      select(swatch) {
        if (!swatch) return;

        this.swatches.forEach((item) => {
          item.setAttribute('aria-current', item === swatch ? 'true' : 'false');
        });

        if (this.titleEl && swatch.dataset.title) {
          this.titleEl.textContent = swatch.dataset.title;
        }

        if (this.colorEl && swatch.dataset.color) {
          this.colorEl.textContent = swatch.dataset.color;
        }

        if (this.imageEl) {
          if (swatch.dataset.image) {
            this.imageEl.hidden = false;
            this.imageEl.src = swatch.dataset.image;
            if (swatch.dataset.imageSrcset) {
              this.imageEl.srcset = swatch.dataset.imageSrcset;
            }
            this.imageEl.alt = swatch.dataset.title || '';
          } else {
            this.imageEl.hidden = true;
          }
        }

        this.syncThumbs(swatch.dataset.variantId);

        if (this.compareEl) {
          const strikePrice = swatch.dataset.strikePrice || swatch.dataset.price || '';
          const strikeCents = Number(swatch.dataset.strikeCents || 0);
          if (strikePrice && strikeCents > 0) {
            this.compareEl.hidden = false;
            this.compareEl.textContent = strikePrice;
          } else {
            this.compareEl.hidden = true;
            this.compareEl.textContent = '';
          }
        }

        if (this.bundleInput && swatch.dataset.variantId) {
          this.bundleInput.value = swatch.dataset.variantId;
        }

        if (this.bundleInput) {
          this.bundleInput.disabled = swatch.dataset.available === 'false';
          this.bundleInput.checked = swatch.dataset.available !== 'false';
        }
      }
    }
  );
}
