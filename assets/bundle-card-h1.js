if (!customElements.get('bundle-card-h1')) {
  customElements.define(
    'bundle-card-h1',
    class BundleCardH1 extends HTMLElement {
      connectedCallback() {
        this.idInput = this.querySelector('input[name="id"]');
        this.priceEl = this.querySelector('[data-bundle-price]');
        this.titleEl = this.querySelector('[data-bundle-title]');
        this.colorEl = this.querySelector('[data-bundle-color]');
        this.imageEl = this.querySelector('[data-bundle-image]');
        this.button = this.querySelector('[data-bundle-add]');
        this.sizeSelect = this.querySelector('[data-bundle-size]');
        this.legacySelect = this.querySelector('[data-bundle-variants]');
        this.swatches = Array.from(this.querySelectorAll('[data-bundle-swatch]'));
        this.colorOptionIndex = Number(this.dataset.colorOptionIndex);
        this.sizeOptionIndex = Number(this.dataset.sizeOptionIndex);

        const json = this.querySelector('[data-bundle-variants-json]');
        this.variants = [];
        if (json) {
          try {
            this.variants = JSON.parse(json.textContent);
          } catch (error) {
            this.variants = [];
          }
        }

        this.onSwatchClick = this.onSwatchClick.bind(this);
        this.onSizeChange = this.onSizeChange.bind(this);
        this.onLegacyChange = this.onLegacyChange.bind(this);

        this.swatches.forEach((swatch) => {
          swatch.addEventListener('click', this.onSwatchClick);
        });
        this.sizeSelect?.addEventListener('change', this.onSizeChange);
        this.legacySelect?.addEventListener('change', this.onLegacyChange);
      }

      disconnectedCallback() {
        this.swatches.forEach((swatch) => {
          swatch.removeEventListener('click', this.onSwatchClick);
        });
        this.sizeSelect?.removeEventListener('change', this.onSizeChange);
        this.legacySelect?.removeEventListener('change', this.onLegacyChange);
      }

      onSwatchClick(event) {
        event.preventDefault();
        this.selectSwatch(event.currentTarget);
      }

      onSizeChange() {
        const swatch = this.querySelector('[data-bundle-swatch][aria-current="true"]');
        const color = swatch?.dataset.color || null;
        const variant = this.findVariant(color, this.sizeSelect?.value);
        if (variant) {
          this.applyVariant(variant);
          return;
        }
        if (swatch) this.applyFromSwatch(swatch);
      }

      onLegacyChange() {
        const option = this.legacySelect?.selectedOptions?.[0];
        if (!option) return;

        if (this.idInput) this.idInput.value = option.value;
        if (this.priceEl && option.dataset.price) {
          this.priceEl.textContent = option.dataset.price.replace(/<[^>]*>/g, '').trim();
        }
        this.updateButton(option.dataset.available !== 'false');
      }

      selectSwatch(swatch) {
        if (!swatch) return;

        this.swatches.forEach((item) => {
          item.setAttribute('aria-current', item === swatch ? 'true' : 'false');
        });

        if (this.colorEl && swatch.dataset.color) {
          this.colorEl.textContent = swatch.dataset.color;
        }

        if (this.variants.length && this.colorOptionIndex >= 0) {
          const variant =
            this.findVariant(swatch.dataset.color, this.sizeSelect?.value) ||
            this.findVariant(swatch.dataset.color, null);
          if (variant) {
            this.applyVariant(variant, swatch);
            return;
          }
        }

        this.applyFromSwatch(swatch);
      }

      findVariant(color, size) {
        return this.variants.find((variant) => {
          const options = variant.options || [];
          const colorOk =
            this.colorOptionIndex < 0 || !color || options[this.colorOptionIndex] === color;
          const sizeOk =
            this.sizeOptionIndex < 0 || !size || options[this.sizeOptionIndex] === size;
          return colorOk && sizeOk;
        });
      }

      applyVariant(variant, swatch) {
        if (this.idInput) this.idInput.value = String(variant.id);
        if (this.priceEl && variant.price) this.priceEl.textContent = variant.price;
        if (this.titleEl && swatch?.dataset.title) this.titleEl.textContent = swatch.dataset.title;
        this.updateImage(variant.image, variant.imageSrcset, swatch?.dataset.title);
        this.updateButton(variant.available !== false);
      }

      applyFromSwatch(swatch) {
        if (this.titleEl && swatch.dataset.title) this.titleEl.textContent = swatch.dataset.title;
        if (this.priceEl && swatch.dataset.price) {
          this.priceEl.textContent = swatch.dataset.price.replace(/<[^>]*>/g, '').trim();
        }
        this.updateImage(swatch.dataset.image, swatch.dataset.imageSrcset, swatch.dataset.title);
        if (this.idInput && swatch.dataset.variantId) this.idInput.value = swatch.dataset.variantId;
        this.updateButton(swatch.dataset.available !== 'false');
      }

      updateImage(src, srcset, alt) {
        if (!this.imageEl) return;
        if (!src) {
          this.imageEl.hidden = true;
          return;
        }
        this.imageEl.hidden = false;
        this.imageEl.src = src;
        if (srcset) this.imageEl.srcset = srcset;
        if (alt) this.imageEl.alt = alt;
      }

      updateButton(available) {
        if (!this.button) return;
        this.button.disabled = !available;
        const label = this.button.querySelector('[data-bundle-add-label]');
        if (label) {
          label.textContent = available ? this.button.dataset.addLabel : this.button.dataset.soldOutLabel;
        }
      }
    }
  );
}
