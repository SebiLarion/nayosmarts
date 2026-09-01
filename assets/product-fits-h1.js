if (!customElements.get('product-fits-h1')) {
  class ProductFitsH1 extends HTMLElement {
    connectedCallback() {
      this.onClick = this.onClick.bind(this);
      this.addEventListener('click', this.onClick);
    }

    disconnectedCallback() {
      this.removeEventListener('click', this.onClick);
    }

    onClick(event) {
      const button = event.target.closest('[data-fits-option]');
      if (!button || !this.contains(button)) return;
      this.select(button.dataset.fitsOption);
    }

    select(optionId) {
      this.querySelectorAll('[data-fits-option]').forEach((button) => {
        const selected = button.dataset.fitsOption === optionId;
        button.classList.toggle('is-active', selected);
        button.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });

      this.querySelectorAll('[data-fits-image]').forEach((panel) => {
        panel.hidden = panel.dataset.fitsImage !== optionId;
      });
    }
  }

  customElements.define('product-fits-h1', ProductFitsH1);
}
