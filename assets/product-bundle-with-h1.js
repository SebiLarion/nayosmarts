if (!customElements.get('product-bundle-with-h1')) {
  customElements.define(
    'product-bundle-with-h1',
    class ProductBundleWithH1 extends HTMLElement {
      connectedCallback() {
        this.titleEl = this.querySelector('[data-bundle-title]');
        this.priceEl = this.querySelector('[data-bundle-price]');
        this.colorEl = this.querySelector('[data-bundle-color]');
        this.imageEl = this.querySelector('[data-bundle-image]');
        this.idInput = this.querySelector('input[name="id"]');
        this.button = this.querySelector('[data-bundle-add]');
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
          const selected = item === swatch;
          item.setAttribute('aria-current', selected ? 'true' : 'false');
        });

        if (this.titleEl && swatch.dataset.title) {
          this.titleEl.textContent = swatch.dataset.title;
        }

        if (this.priceEl && swatch.dataset.price) {
          this.priceEl.textContent = swatch.dataset.price;
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

        if (this.idInput && swatch.dataset.variantId) {
          this.idInput.value = swatch.dataset.variantId;
        }

        if (this.button) {
          const unavailable = swatch.dataset.available === 'false';
          this.button.disabled = unavailable;
          const label = this.button.querySelector('[data-bundle-add-label]');
          if (label) {
            label.textContent = unavailable
              ? this.button.dataset.soldOutLabel
              : this.button.dataset.addLabel;
          }
        }
      }
    }
  );
}
