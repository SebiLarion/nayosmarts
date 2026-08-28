if (!customElements.get('compare-card-h1')) {
  class CompareCardH1 extends HTMLElement {
    connectedCallback() {
      this.button = this.querySelector('[data-compare-inside]');
      this.outside = this.querySelector('[data-compare-image="outside"]');
      this.inside = this.querySelector('[data-compare-image="inside"]');
      if (!this.button || !this.inside) return;

      this.labelInside = this.button.getAttribute('data-label-inside') || 'Show Inside';
      this.labelOutside = this.button.getAttribute('data-label-outside') || 'Show Outside';
      this.onToggle = this.onToggle.bind(this);
      this.button.addEventListener('click', this.onToggle);
    }

    disconnectedCallback() {
      if (this.button && this.onToggle) this.button.removeEventListener('click', this.onToggle);
    }

    onToggle() {
      const showing = !this.classList.contains('is-inside');
      this.classList.toggle('is-inside', showing);
      this.button.setAttribute('aria-pressed', showing ? 'true' : 'false');
      this.button.textContent = showing ? this.labelOutside : this.labelInside;
      if (this.outside) this.outside.hidden = showing;
      if (this.inside) this.inside.hidden = !showing;
    }
  }

  customElements.define('compare-card-h1', CompareCardH1);
}
