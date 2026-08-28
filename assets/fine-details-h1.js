if (!customElements.get('fine-details-h1')) {
  customElements.define(
    'fine-details-h1',
    class FineDetailsH1 extends HTMLElement {
      connectedCallback() {
        this.modal = this.querySelector('x-modal');
        this.tabs = Array.from(this.querySelectorAll('[data-fine-details-tab]'));
        this.views = Array.from(this.querySelectorAll('[data-fine-details-view]'));
        this.titleEl = this.modal?.querySelector('[data-fine-details-title]');
        this.textEl = this.modal?.querySelector('[data-fine-details-text]');
        this.imageEl = this.modal?.querySelector('[data-fine-details-image]');
        this.prevBtn = this.modal?.querySelector('[data-fine-details-prev]');
        this.nextBtn = this.modal?.querySelector('[data-fine-details-next]');
        this.index = Math.max(
          0,
          this.tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true')
        );

        this.onTabClick = this.onTabClick.bind(this);
        this.onPrev = this.onPrev.bind(this);
        this.onNext = this.onNext.bind(this);

        this.tabs.forEach((tab) => tab.addEventListener('click', this.onTabClick));
        this.prevBtn?.addEventListener('click', this.onPrev);
        this.nextBtn?.addEventListener('click', this.onNext);

        const hideNav = this.views.length < 2;
        if (this.prevBtn) this.prevBtn.hidden = hideNav;
        if (this.nextBtn) this.nextBtn.hidden = hideNav;

        this.activate(this.index, { open: false });
      }

      disconnectedCallback() {
        this.tabs.forEach((tab) => tab.removeEventListener('click', this.onTabClick));
        this.prevBtn?.removeEventListener('click', this.onPrev);
        this.nextBtn?.removeEventListener('click', this.onNext);
      }

      onTabClick(event) {
        event.preventDefault();
        const index = this.tabs.indexOf(event.currentTarget);
        if (index < 0) return;
        this.activate(index, { open: true, trigger: event.currentTarget });
      }

      onPrev(event) {
        event.preventDefault();
        event.stopPropagation();
        this.activate(this.wrap(this.index - 1), { open: true });
      }

      onNext(event) {
        event.preventDefault();
        event.stopPropagation();
        this.activate(this.wrap(this.index + 1), { open: true });
      }

      wrap(index) {
        const total = this.views.length;
        if (total < 1) return 0;
        return (index + total) % total;
      }

      activate(index, { open = false, trigger = null } = {}) {
        if (!this.views[index]) return;
        this.index = index;

        this.tabs.forEach((tab, i) => {
          const selected = i === index;
          tab.setAttribute('aria-selected', selected ? 'true' : 'false');
          tab.tabIndex = selected ? 0 : -1;
        });

        this.views.forEach((view, i) => {
          view.hidden = i !== index;
        });

        this.syncModal();

        if (open && this.modal) {
          if (this.modal.open) return;
          this.modal.show(trigger || this.tabs[index] || this);
        }
      }

      syncModal() {
        const view = this.views[this.index];
        if (!view) return;

        const title = view.dataset.title || '';
        const text = view.querySelector('[data-fine-details-copy]')?.innerHTML || '';
        const image = this.popupImage(view);
        const alt = view.dataset.imageAlt || title;

        if (this.titleEl) this.titleEl.textContent = title;
        if (this.textEl) this.textEl.innerHTML = text;
        if (this.imageEl) {
          if (image) {
            this.imageEl.hidden = false;
            this.imageEl.src = image;
            this.imageEl.alt = alt;
          } else {
            this.imageEl.hidden = true;
            this.imageEl.removeAttribute('src');
            this.imageEl.alt = '';
          }
        }

        this.modal?.setAttribute('aria-label', title);
      }

      popupImage(view) {
        const mobile = window.matchMedia('(max-width: 767px)').matches;
        if (mobile) {
          return view.dataset.popupImageMobile || view.dataset.popupImage || view.dataset.imageMobile || view.dataset.image || '';
        }
        return view.dataset.popupImage || view.dataset.image || view.dataset.imageMobile || '';
      }
    }
  );
}
