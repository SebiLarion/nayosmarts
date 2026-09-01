if (!customElements.get('product-gallery-h1')) {
  customElements.define(
    'product-gallery-h1',
    class ProductGalleryH1 extends HTMLElement {
      connectedCallback() {
        this.initVideoModal();

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
        this.teardownVideoModal();
      }

      initVideoModal() {
        this.videoDialog = this.querySelector('[data-video-modal-dialog-h1]');
        this.videoPlayer = this.querySelector('[data-video-modal-player-h1]');
        if (!this.videoDialog || !this.videoPlayer) return;

        this.onVideoTriggerClick = this.onVideoTriggerClick.bind(this);
        this.onVideoDialogClick = this.onVideoDialogClick.bind(this);
        this.onVideoDialogClose = this.onVideoDialogClose.bind(this);

        this.addEventListener('click', this.onVideoTriggerClick);
        this.videoDialog.addEventListener('click', this.onVideoDialogClick);
        this.videoDialog.addEventListener('close', this.onVideoDialogClose);
      }

      teardownVideoModal() {
        this.removeEventListener('click', this.onVideoTriggerClick);
        if (this.videoDialog) {
          this.videoDialog.removeEventListener('click', this.onVideoDialogClick);
          this.videoDialog.removeEventListener('close', this.onVideoDialogClose);
        }
        this.clearVideoPlayer();
      }

      onVideoTriggerClick(event) {
        const trigger = event.target.closest('[data-video-modal-h1]');
        if (!trigger || !this.contains(trigger)) return;

        event.preventDefault();
        this.openVideoModal(trigger);
      }

      onVideoDialogClick(event) {
        if (event.target.closest('[data-video-modal-close-h1]') || event.target === this.videoDialog) {
          this.closeVideoModal();
        }
      }

      onVideoDialogClose() {
        this.clearVideoPlayer();
      }

      openVideoModal(trigger) {
        if (!this.videoDialog || !this.videoPlayer) return;

        this.clearVideoPlayer();
        const media = this.createVideoMedia(trigger);
        if (!media) return;

        this.videoPlayer.appendChild(media);

        if (typeof this.videoDialog.showModal === 'function') {
          this.videoDialog.showModal();
        } else {
          this.videoDialog.setAttribute('open', '');
        }

        if (media.play) {
          const playPromise = media.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () {});
          }
        }
      }

      closeVideoModal() {
        if (!this.videoDialog) return;

        if (typeof this.videoDialog.close === 'function' && this.videoDialog.open) {
          this.videoDialog.close();
          return;
        }

        this.videoDialog.removeAttribute('open');
        this.clearVideoPlayer();
      }

      clearVideoPlayer() {
        if (!this.videoPlayer) return;

        this.videoPlayer.querySelectorAll('video').forEach(function (video) {
          video.pause();
          video.removeAttribute('src');
          video.load();
        });
        this.videoPlayer.innerHTML = '';
      }

      createVideoMedia(trigger) {
        const type = trigger.dataset.videoType;
        const src = trigger.dataset.videoSrc;
        const poster = trigger.dataset.videoPoster;
        const host = trigger.dataset.videoHost;
        const id = trigger.dataset.videoId;

        if (type === 'video' && src) {
          const video = document.createElement('video');
          video.controls = true;
          video.autoplay = true;
          video.playsInline = true;
          if (poster) video.poster = poster;

          const source = document.createElement('source');
          source.src = src;
          source.type = 'video/mp4';
          video.appendChild(source);
          return video;
        }

        if (host === 'youtube' && id) {
          const iframe = document.createElement('iframe');
          iframe.src = 'https://www.youtube.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
          iframe.allow = 'autoplay; encrypted-media; fullscreen';
          iframe.allowFullscreen = true;
          iframe.title = 'Product video';
          return iframe;
        }

        return null;
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
