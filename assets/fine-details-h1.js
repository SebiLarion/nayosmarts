function collectFineDetailsHotspots(root, views) {
  const all = Array.from(root.querySelectorAll('[data-fine-details-hotspot]'));
  const viewOrder = ['front', 'interior', 'back'];
  const extraKeys = views
    .map((view) => view.dataset.viewKey)
    .filter((key) => key && !viewOrder.includes(key));
  const ordered = [];
  const used = new Set();

  viewOrder.concat(extraKeys).forEach((key) => {
    all
      .filter((hotspot) => hotspot.dataset.viewKey === key)
      .sort((a, b) => Number(a.dataset.hotspotIndex) - Number(b.dataset.hotspotIndex))
      .forEach((hotspot) => {
        used.add(hotspot);
        ordered.push(hotspot);
      });
  });

  all.forEach((hotspot) => {
    if (!used.has(hotspot)) ordered.push(hotspot);
  });

  ordered.forEach((hotspot, index) => {
    hotspot.dataset.hotspotIndex = String(index);
  });

  return ordered;
}

if (!customElements.get('fine-details-h1')) {
  class FineDetailsH1 extends HTMLElement {
    connectedCallback() {
      if (this.initialized) return;
      this.initialized = true;

      this.modal = this.querySelector('.fine-details-h1-modal');
      this.tabs = Array.from(this.querySelectorAll('[data-fine-details-tab]'));
      this.views = Array.from(this.querySelectorAll('[data-fine-details-view]'));
      this.prevBtn = this.modal?.querySelector('[data-fine-details-prev]');
      this.nextBtn = this.modal?.querySelector('[data-fine-details-next]');
      this.hotspots = collectFineDetailsHotspots(this, this.views);
      this.viewIndex = Math.max(
        0,
        this.tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true')
      );
      this.hotspotIndex = 0;

      this.onTabClick = this.onTabClick.bind(this);
      this.onPrev = this.onPrev.bind(this);
      this.onNext = this.onNext.bind(this);
      this.onHotspotClick = this.onHotspotClick.bind(this);

      this.tabs.forEach((tab) => tab.addEventListener('click', this.onTabClick));
      this.hotspots.forEach((hotspot) => hotspot.addEventListener('click', this.onHotspotClick));
      this.prevBtn?.addEventListener('click', this.onPrev);
      this.nextBtn?.addEventListener('click', this.onNext);

      const hideNav = this.hotspots.length < 2;
      if (this.prevBtn) this.prevBtn.hidden = hideNav;
      if (this.nextBtn) this.nextBtn.hidden = hideNav;

      this.activateView(this.viewIndex);
    }

    disconnectedCallback() {
      this.tabs.forEach((tab) => tab.removeEventListener('click', this.onTabClick));
      this.hotspots.forEach((hotspot) => hotspot.removeEventListener('click', this.onHotspotClick));
      this.prevBtn?.removeEventListener('click', this.onPrev);
      this.nextBtn?.removeEventListener('click', this.onNext);
    }

    onTabClick(event) {
      event.preventDefault();
      const index = this.tabs.indexOf(event.currentTarget);
      if (index < 0) return;
      this.activateView(index);
    }

    onHotspotClick(event) {
      event.preventDefault();
      event.stopPropagation();
      const index = Number(event.currentTarget.dataset.hotspotIndex);
      if (Number.isNaN(index)) return;
      this.openHotspot(index);
    }

    onPrev(event) {
      event.preventDefault();
      event.stopPropagation();
      this.openHotspot(this.wrap(this.hotspotIndex - 1));
    }

    onNext(event) {
      event.preventDefault();
      event.stopPropagation();
      this.openHotspot(this.wrap(this.hotspotIndex + 1));
    }

    wrap(index) {
      const total = this.hotspots.length;
      if (total < 1) return 0;
      return (index + total) % total;
    }

    activateView(index) {
      if (!this.views[index]) return;
      this.viewIndex = index;

      this.tabs.forEach((tab, i) => {
        const selected = i === index;
        tab.setAttribute('aria-selected', selected ? 'true' : 'false');
        tab.tabIndex = selected ? 0 : -1;
      });

      this.views.forEach((view, i) => {
        view.hidden = i !== index;
      });
    }

    openHotspot(index) {
      const hotspot = this.hotspots.find((item) => Number(item.dataset.hotspotIndex) === index);
      if (!hotspot) return;

      this.hotspotIndex = index;

      const viewIndex = this.views.findIndex((view) => view.dataset.viewKey === hotspot.dataset.viewKey);
      if (viewIndex >= 0) this.activateView(viewIndex);

      this.syncModal(hotspot);

      if (this.modal && !this.modal.open) {
        this.modal.show(hotspot);
      }
    }

    syncModal(hotspot) {
      const title = hotspot.dataset.title || '';
      const text = hotspot.querySelector('[data-hotspot-copy]')?.innerHTML || '';
      const image = this.popupImage(hotspot);
      const alt = hotspot.dataset.imageAlt || title;
      const titleEl = this.modal?.querySelector('[data-fine-details-title]');
      const textEl = this.modal?.querySelector('[data-fine-details-text]');
      const imageEl = this.modal?.querySelector('[data-fine-details-image]');

      if (titleEl) titleEl.textContent = title;
      if (textEl) textEl.innerHTML = text;
      if (imageEl) {
        if (image) {
          imageEl.hidden = false;
          imageEl.src = image;
          imageEl.alt = alt;
        } else {
          imageEl.hidden = true;
          imageEl.removeAttribute('src');
          imageEl.alt = '';
        }
      }

      this.modal?.setAttribute('aria-label', title);
    }

    popupImage(hotspot) {
      const mobile = window.matchMedia('(max-width: 767px)').matches;
      if (mobile) {
        return hotspot.dataset.imageMobile || hotspot.dataset.image || '';
      }
      return hotspot.dataset.image || hotspot.dataset.imageMobile || '';
    }
  }

  customElements.define('fine-details-h1', FineDetailsH1);
}
