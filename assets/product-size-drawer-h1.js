if (!customElements.get('size-drawer-h1')) {
  customElements.define(
    'size-drawer-h1',
    class SizeDrawerH1 extends HTMLElement {
      connectedCallback() {
        this.onCardClick = this.onCardClick.bind(this);
        this.addEventListener('click', this.onCardClick);
      }

      disconnectedCallback() {
        this.removeEventListener('click', this.onCardClick);
      }

      onCardClick(event) {
        const card = event.target.closest('label.size-card-h1');
        if (!card || !this.contains(card)) return;

        this.querySelectorAll('label.size-card-h1').forEach((label) => {
          label.classList.toggle('is-selected', label === card);
        });

        // Hide this modal instance directly. A delayed close-button click races
        // the variant-picker HTML swap and can reopen the replacement popup.
        const modal = this.closest('x-modal');
        if (typeof modal?.hide === 'function') {
          modal.hide();
        }

        document.querySelectorAll('x-modal.size-drawer-h1-modal[open]').forEach((openModal) => {
          if (openModal !== modal && typeof openModal.hide === 'function') {
            openModal.hide();
          }
        });
      }
    }
  );
}
