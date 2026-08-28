if (!customElements.get('carry-it-h1')) {
  customElements.define(
    'carry-it-h1',
    class CarryItH1 extends HTMLElement {
      connectedCallback() {
        this.scroller = this.querySelector('[data-carry-it-h1-scroller]');
        this.modal = this.querySelector('x-modal');
        this.media = this.modal?.querySelector('[data-carry-it-h1-media]');
        this.poster = this.modal?.querySelector('[data-carry-it-h1-poster]');
        this.player = this.modal?.querySelector('[data-carry-it-h1-player]');
        this.playButton = this.modal?.querySelector('[data-carry-it-h1-play]');
        this.variantInput = this.modal?.querySelector('[data-carry-it-h1-variant]');
        this.productImage = this.modal?.querySelector('.carry-it-h1-modal__thumb img');
        this.addButton = this.modal?.querySelector('[data-carry-it-h1-add]');
        this.addLabel = this.modal?.querySelector('[data-carry-it-h1-add-label]');
        this.cards = this.querySelectorAll('[data-carry-it-h1-card]');

        this.onCardClick = this.onCardClick.bind(this);
        this.onPlay = this.onPlay.bind(this);
        this.onModalHide = this.onModalHide.bind(this);
        this.onVariantChange = this.onVariantChange.bind(this);
        this.centerTrack = this.centerTrack.bind(this);

        this.cards.forEach((card) => card.addEventListener('click', this.onCardClick));
        this.playButton?.addEventListener('click', this.onPlay);
        this.modal?.addEventListener('modal:afterHide', this.onModalHide);
        document.addEventListener('variant:change', this.onVariantChange, true);
        window.addEventListener('resize', this.centerTrack);

        this.centerTrack();
        requestAnimationFrame(this.centerTrack);
      }

      disconnectedCallback() {
        this.cards.forEach((card) => card.removeEventListener('click', this.onCardClick));
        this.playButton?.removeEventListener('click', this.onPlay);
        this.modal?.removeEventListener('modal:afterHide', this.onModalHide);
        document.removeEventListener('variant:change', this.onVariantChange, true);
        window.removeEventListener('resize', this.centerTrack);
      }

      centerTrack() {
        if (!this.scroller || window.matchMedia('(min-width: 768px)').matches) return;
        const maxScroll = this.scroller.scrollWidth - this.scroller.clientWidth;
        if (maxScroll > 0) this.scroller.scrollLeft = maxScroll / 2;
      }

      onCardClick(event) {
        event.preventDefault();
        this.open(event.currentTarget);
      }

      open(card) {
        if (!this.modal) return;
        this.activeCard = card;

        if (this.poster && card.dataset.cover) {
          this.poster.src = card.dataset.cover;
          this.poster.hidden = false;
        }

        this.resetPlayer();
        this.modal.show(card);
      }

      onPlay(event) {
        event.preventDefault();
        event.stopPropagation();
        if (!this.activeCard || !this.player) return;

        const template = this.activeCard.querySelector('[data-carry-it-h1-video]');
        const host = this.activeCard.dataset.videoHost;
        const id = this.activeCard.dataset.videoId;

        if (template) {
          this.player.replaceChildren(template.content.cloneNode(true));
          const video = this.player.querySelector('video');
          if (video) {
            video.setAttribute('playsinline', '');
            video.controls = true;
            video.play().catch(() => {});
          }
        } else if (id && (host === 'youtube' || host === 'vimeo')) {
          const iframe = document.createElement('iframe');
          iframe.setAttribute('allow', 'autoplay; encrypted-media; fullscreen; picture-in-picture');
          iframe.setAttribute('allowfullscreen', '');
          iframe.title = this.activeCard.dataset.heading || '';
          iframe.src =
            host === 'youtube'
              ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
              : `https://player.vimeo.com/video/${id}?autoplay=1`;
          this.player.replaceChildren(iframe);
        } else {
          return;
        }

        this.media?.classList.add('is-playing');
      }

      onModalHide() {
        this.resetPlayer();
        this.activeCard = null;
      }

      resetPlayer() {
        this.media?.classList.remove('is-playing');
        if (!this.player) return;
        this.player.querySelectorAll('video').forEach((video) => {
          video.pause();
          video.removeAttribute('src');
          video.load();
        });
        this.player.replaceChildren();
      }

      onVariantChange(event) {
        const variant = event.detail?.variant;
        if (!variant) return;

        if (this.variantInput) this.variantInput.value = variant.id;

        if (this.addButton) {
          const available = variant.available !== false;
          this.addButton.disabled = !available;
          if (this.addLabel) {
            this.addLabel.textContent = available
              ? this.addButton.dataset.addLabel
              : this.addButton.dataset.soldOutLabel;
          }
        }

        const image = variant.featured_image;
        if (this.productImage && image?.src) {
          const separator = image.src.includes('?') ? '&' : '?';
          this.productImage.src = `${image.src}${separator}width=240`;
        }
      }
    }
  );
}
