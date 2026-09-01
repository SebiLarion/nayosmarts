if (!customElements.get('product-fits-h1')) {
  class ProductFitsH1 extends HTMLElement {
    connectedCallback() {
      this.onClick = this.onClick.bind(this);
      this.onVariantChange = this.onVariantChange.bind(this);
      this.addEventListener('click', this.onClick);

      if (window.theme?.pubsub?.subscribe) {
        this.unsubscribeVariant = theme.pubsub.subscribe(
          theme.pubsub.PUB_SUB_EVENTS.variantChange,
          this.onVariantChange
        );
      }
    }

    disconnectedCallback() {
      this.removeEventListener('click', this.onClick);
      this.unsubscribeVariant?.();
    }

    onClick(event) {
      const button = event.target.closest('[data-fits-option]');
      if (!button || !this.contains(button)) return;
      this.select(button.dataset.fitsOption, { applyVariant: true });
    }

    onVariantChange(event) {
      const variant = event?.data?.variant;
      if (!variant) return;

      const sectionId = event.data.sectionId;
      if (sectionId && this.dataset.sectionId && sectionId !== this.dataset.sectionId) return;

      const optionValues = [variant.option1, variant.option2, variant.option3].filter(Boolean);
      const match = Array.from(this.querySelectorAll('[data-fits-option]')).find((button) =>
        optionValues.includes(button.dataset.optionValue)
      );
      if (match) this.select(match.dataset.fitsOption);
    }

    select(optionId, { applyVariant = false } = {}) {
      if (!optionId) return;

      this.querySelectorAll('[data-fits-option]').forEach((button) => {
        const selected = button.dataset.fitsOption === optionId;
        button.classList.toggle('is-active', selected);
        button.setAttribute('aria-pressed', selected ? 'true' : 'false');
        if (selected) this.updateFooter(button);
      });

      this.querySelectorAll('[data-fits-image]').forEach((panel) => {
        panel.hidden = panel.dataset.fitsImage !== optionId;
      });

      if (applyVariant) this.applyVariant(optionId);
    }

    updateFooter(button) {
      const price = this.querySelector('[data-fits-price]');
      if (price && button.dataset.price) price.textContent = button.dataset.price;

      const add = this.querySelector('.fits-modal-h1__add');
      if (add) add.disabled = button.dataset.available === 'false';
    }

    applyVariant(optionId) {
      const button = this.querySelector(`[data-fits-option="${this.cssEscape(optionId)}"]`);
      const radio = this.getVariantRadio(button);
      if (!radio || radio.checked) return;

      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
    }

    getVariantRadio(button) {
      if (!button) return null;

      const section = document.getElementById('shopify-section-' + this.dataset.sectionId);
      if (!section) return null;

      const valueId = button.dataset.optionValueId;
      if (valueId) {
        const byId = section.querySelector(
          'variant-picker input[data-option-value-id="' + this.cssEscape(valueId) + '"]'
        );
        if (byId) return byId;
      }

      const value = button.dataset.optionValue;
      if (!value) return null;
      return section.querySelector(
        'variant-picker input[data-option-value="' + this.cssEscape(value) + '"]'
      );
    }

    cssEscape(value) {
      if (window.CSS?.escape) return CSS.escape(value);
      return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }
  }

  customElements.define('product-fits-h1', ProductFitsH1);
}
