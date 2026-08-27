if (!customElements.get('bundle-card-h1')) {
  customElements.define(
    'bundle-card-h1',
    class BundleCardH1 extends HTMLElement {
      connectedCallback() {
        this.select = this.querySelector('[data-bundle-variants]');
        this.idInput = this.querySelector('input[name="id"]');
        this.priceEl = this.querySelector('[data-bundle-price]');
        this.button = this.querySelector('[data-bundle-add]');
        this.onChange = this.onChange.bind(this);
        this.select?.addEventListener('change', this.onChange);
      }

      disconnectedCallback() {
        this.select?.removeEventListener('change', this.onChange);
      }

      onChange() {
        const option = this.select.selectedOptions[0];
        if (!option) return;

        if (this.idInput) this.idInput.value = option.value;
        if (this.priceEl && option.dataset.price) this.priceEl.textContent = option.dataset.price;

        if (this.button) {
          const unavailable = option.dataset.available === 'false';
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
