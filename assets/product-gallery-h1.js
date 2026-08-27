if (!customElements.get('product-gallery-h1')) {
  customElements.define(
    'product-gallery-h1',
    class ProductGalleryH1 extends HTMLElement {
      connectedCallback() {
        this.toggleButton = this.querySelector('[data-gallery-toggle]');
        this.viewport = this.querySelector('.product-gallery-h1__viewport');
        this.list = this.querySelector('.product-gallery-h1__list');
        if (!this.toggleButton || !this.viewport || !this.list) return;

        this.mediaQuery = window.matchMedia('(min-width: 1024px)');
        this.onResize = this.onResize.bind(this);
        this.mediaQuery.addEventListener('change', this.onResize);
        window.addEventListener('resize', this.onResize);

        this.syncToggleVisibility();
        this.applyDesktopHeight(false);
        this.toggleButton.addEventListener('click', () => this.toggle());
        this.addEventListener('variant:change', () => {
          this.syncToggleVisibility();
          this.applyDesktopHeight(false);
        });
      }

      disconnectedCallback() {
        this.mediaQuery?.removeEventListener('change', this.onResize);
        window.removeEventListener('resize', this.onResize);
      }

      get expanded() {
        return this.getAttribute('data-expanded') === 'true';
      }

      get collapsedCount() {
        return Number(this.dataset.collapsedCount || 4);
      }

      get prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      }

      get isDesktop() {
        return this.mediaQuery?.matches;
      }

      get visibleMedia() {
        return Array.from(this.querySelectorAll('.product-gallery-h1__list .product__media')).filter(
          (media) => !media.hasAttribute('hidden') && !media.classList.contains('xl:hidden')
        );
      }

      syncToggleVisibility() {
        if (!this.toggleButton) return;

        const shouldShowToggle = this.visibleMedia.length > this.collapsedCount;
        this.toggleButton.hidden = !shouldShowToggle;

        if (!shouldShowToggle) {
          this.setAttribute('data-expanded', 'true');
          this.updateLabels(true);
        }
      }

      measureCollapsedHeight() {
        const media = this.visibleMedia[0];
        if (!media) return 0;

        const styles = getComputedStyle(this.list);
        const gap = parseFloat(styles.rowGap || styles.gap) || 24;
        const overlay = parseFloat(getComputedStyle(this).getPropertyValue('--gallery-h1-overlay')) || 87;
        const rows = parseFloat(getComputedStyle(this).getPropertyValue('--gallery-h1-collapsed-rows')) || 2;

        return media.getBoundingClientRect().height * rows + gap * (rows - 1) + overlay;
      }

      measureExpandedHeight() {
        return this.list.scrollHeight + 48 + this.toggleButton.offsetHeight;
      }

      setViewportHeight(height, animate = true) {
        if (!animate || this.prefersReducedMotion) {
          this.viewport.style.transition = 'none';
          this.viewport.style.height = `${height}px`;
          this.viewport.offsetHeight;
          this.viewport.style.transition = '';
          return;
        }

        this.viewport.style.height = `${height}px`;
      }

      applyDesktopHeight(animate) {
        if (!this.viewport) return;

        if (!this.isDesktop || this.toggleButton?.hidden) {
          this.viewport.style.height = '';
          return;
        }

        const height = this.expanded ? this.measureExpandedHeight() : this.measureCollapsedHeight();
        this.setViewportHeight(height, animate);
      }

      onResize() {
        if (this.isAnimating) return;
        this.applyDesktopHeight(false);
      }

      toggle() {
        if (this.isAnimating) return;

        const next = !this.expanded;

        if (!this.isDesktop || this.prefersReducedMotion) {
          this.setAttribute('data-expanded', String(next));
          this.updateLabels(next);
          this.applyDesktopHeight(false);
          if (!next && this.isDesktop) this.scrollIntoView({ behavior: 'auto', block: 'start' });
          return;
        }

        const from = this.viewport.getBoundingClientRect().height;
        this.setAttribute('data-expanded', String(next));
        this.updateLabels(next);
        const to = next ? this.measureExpandedHeight() : this.measureCollapsedHeight();

        this.isAnimating = true;
        this.setViewportHeight(from, false);
        requestAnimationFrame(() => {
          this.setViewportHeight(to, true);
        });

        if (!next) {
          this.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        const done = (event) => {
          if (event && event.propertyName !== 'height') return;
          this.viewport.removeEventListener('transitionend', done);
          clearTimeout(this.animationTimeout);
          this.isAnimating = false;
        };

        this.viewport.addEventListener('transitionend', done);
        this.animationTimeout = setTimeout(done, 800);
      }

      updateLabels(expanded) {
        if (!this.toggleButton) return;

        this.toggleButton.setAttribute('aria-expanded', String(expanded));

        const moreLabel = this.toggleButton.querySelector('[data-label-more]');
        const lessLabel = this.toggleButton.querySelector('[data-label-less]');
        if (moreLabel) moreLabel.hidden = expanded;
        if (lessLabel) lessLabel.hidden = !expanded;
      }
    }
  );
}
