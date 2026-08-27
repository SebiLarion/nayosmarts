if (!customElements.get('product-fits-h1')) {
  class ProductFitsH1 extends HTMLElement {
    connectedCallback() {
      this.buttons = this.querySelectorAll('[data-fits-option]');
      this.panels = this.querySelectorAll('[data-fits-image]');
      this.buttons.forEach((button) => {
        button.addEventListener('click', () => this.select(button.dataset.fitsOption));
      });
    }

    select(optionId) {
      this.buttons.forEach((button) => {
        const selected = button.dataset.fitsOption === optionId;
        button.classList.toggle('is-active', selected);
        button.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });

      this.panels.forEach((panel) => {
        panel.hidden = panel.dataset.fitsImage !== optionId;
      });
    }
  }

  customElements.define('product-fits-h1', ProductFitsH1);
}
