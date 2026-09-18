if (!customElements.get('faq-h1-variant-specs')) {
  customElements.define(
    'faq-h1-variant-specs',
    class FaqH1VariantSpecs extends HTMLElement {
      connectedCallback() {
        this.onVariantChange = this.onVariantChange.bind(this);
        document.addEventListener('variant:change', this.onVariantChange);

        if (window.theme?.pubsub?.subscribe && theme.pubsub.PUB_SUB_EVENTS?.variantChange) {
          this.variantChangeUnsubscriber = theme.pubsub.subscribe(
            theme.pubsub.PUB_SUB_EVENTS.variantChange,
            ({ data }) => this.updateVariant(data?.variant?.id)
          );
        }
      }

      disconnectedCallback() {
        document.removeEventListener('variant:change', this.onVariantChange);
        this.variantChangeUnsubscriber?.();
      }

      onVariantChange(event) {
        this.updateVariant(event.detail?.variant?.id);
      }

      updateVariant(variantId) {
        if (!variantId) return;

        const template = this.querySelector(
          `[data-faq-h1-variant-specs-template="${CSS.escape(String(variantId))}"]`
        );
        const content = this.querySelector('[data-faq-h1-variant-specs-content]');
        if (!template || !content) return;

        content.replaceChildren(template.content.cloneNode(true));
      }
    }
  );
}
