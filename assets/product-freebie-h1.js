if (!customElements.get('product-freebie-h1')) {
  customElements.define(
    'product-freebie-h1',
    class ProductFreebieH1 extends HTMLElement {
      connectedCallback() {
        this.titleEl = this.querySelector('[data-freebie-title]');
        this.colorEl = this.querySelector('[data-freebie-color]');
        this.imageEl = this.querySelector('[data-freebie-image]');
        this.bundleInput = this.querySelector('[data-freebie-bundle]');
        this.button = this.querySelector('[data-freebie-add]');
        this.swatches = this.querySelectorAll('[data-bundle-swatch]');

        this.onSwatchClick = this.onSwatchClick.bind(this);
        this.swatches.forEach((swatch) => {
          swatch.addEventListener('click', this.onSwatchClick);
        });
      }

      disconnectedCallback() {
        this.swatches.forEach((swatch) => {
          swatch.removeEventListener('click', this.onSwatchClick);
        });
      }

      onSwatchClick(event) {
        event.preventDefault();
        this.select(event.currentTarget);
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

        if (this.bundleInput && swatch.dataset.variantId) {
          this.bundleInput.value = swatch.dataset.variantId;
        }

        if (this.button) {
          const unavailable = swatch.dataset.available === 'false';
          this.button.disabled = unavailable || this.button.hasAttribute('data-main-unavailable');
          const label = this.button.querySelector('[data-freebie-add-label]');
          if (label) {
            label.textContent = unavailable
              ? this.button.dataset.soldOutLabel
              : this.button.dataset.addLabel;
          }
        }

        if (this.bundleInput) {
          this.bundleInput.disabled = swatch.dataset.available === 'false';
          this.bundleInput.checked = swatch.dataset.available !== 'false';
        }
      }
    }
  );
}
