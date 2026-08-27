if (!customElements.get('size-drawer-h1')) {
  customElements.define(
    'size-drawer-h1',
    class SizeDrawerH1 extends HTMLElement {
      connectedCallback() {
        this.onChange = this.onChange.bind(this);
        this.addEventListener('change', this.onChange);
      }

      disconnectedCallback() {
        this.removeEventListener('change', this.onChange);
      }

      onChange(event) {
        if (!event.target.matches('input[type="radio"]')) return;

        const closeButton = this.querySelector('[data-size-drawer-close]');
        if (closeButton) {
          setTimeout(() => closeButton.click(), 200);
        }
      }
    }
  );
}
