if (!customElements.get('search-drawer')) {
  customElements.define(
    'search-drawer',
    class SearchDrawer extends DrawerElement {
      get shouldAppendToBody() {
        return false;
      }

      get input() {
        return this.querySelector('input[type="search"]');
      }

      get focusElement() {
        return this.querySelector('input[type="search"]');
      }
    }
  );
}

if (!customElements.get('search-typed')) {
  customElements.define(
    'search-typed',
    class SearchTyped extends BaseElement {
      constructor() {
        super();

        Motion.inView(this, this.init.bind(this));
      }

      connectedCallback() {
        super.connectedCallback();

        const input = this.input;
        if (!input) return;

        const hide = this.hide.bind(this);
        ['pointerdown', 'input'].forEach((event) => this.on(input, event, hide));
      }

      get input() {
        return this.closest('form')?.querySelector('input[type="search"]');
      }

      get startDelay() {
        return this.hasAttribute('data-delay') ? parseFloat(this.getAttribute('data-delay')) : 0;
      }

      hide() {
        if (this.parentElement.hasAttribute('hidden')) return;
        this.parentElement.setAttribute('hidden', '');
      }

      async init() {
        if (this.initialized) return;
        this.initialized = true;

        this.insertCursor();
        await this.start(this.getAttribute('data-first-text'), this.startDelay);

        setTimeout(async () => {
          await this.reset();
          await this.start(this.getAttribute('data-last-text'), 0);
        }, 600);
      }

      async start(text, delay) {
        this.textContent = text;
        if (!this.scrollWidth) {
          this.style.removeProperty('width');
          this.cursor.classList.add('blink');
          return;
        }

        await Motion.animate(this, { width: [0, `${this.scrollWidth}px`] }, { duration: 1, delay }).finished;
        this.cursor.classList.add('blink');
      }

      async reset() {
        this.cursor.classList.remove('blink');
        if (!this.scrollWidth) return;

        await Motion.animate(this, { width: 0 }, { duration: 0.25 }).finished;
      }

      insertCursor() {
        if (this.cursor) return;

        this.cursor = document.createElement('span');
        this.cursor.className = 'typed-cursor';
        this.cursor.setAttribute('aria-hidden', true);
        this.cursor.textContent = '|';
        this.parentElement.insertBefore(this.cursor, this.nextSibling);
      }
    }
  );
}

if (!customElements.get('predictive-search')) {
  customElements.define(
    'predictive-search',
    class PredictiveSearch extends BaseElementMixin(HTMLFormElement) {
      constructor() {
        super();

        this.cachedMap = new Map();
      }

      connectedCallback() {
        super.connectedCallback();

        this.focusElement = this.input;
        this.on(this.resetButton, 'click', this.clear.bind(this));
        this.on(this.input, 'input', theme.utils.debounce(this.onChange.bind(this), 300));
        this.on(this.input, 'focus', this.onFocus.bind(this));
        this.on(document, 'keydown', this.onKeydown.bind(this));
        this.on(this.input, 'input', this.updateResetButton.bind(this));
        this.updateResetButton();
      }

      disconnectedCallback() {
        super.disconnectedCallback();

        this.renderAbortController?.abort();
      }

      get input() {
        return this.querySelector('input[type="search"]');
      }

      get resetButton() {
        return this.querySelector('button[type="reset"]');
      }

      get dropdownParent() {
        return this.closest('.collection') || this.closest('.search-inline');
      }

      get statusElement() {
        return this.querySelector('.search__status');
      }

      updateResetButton() {
        if (this.resetButton) this.resetButton.hidden = this.input.value.length === 0;
      }

      onFocus() {
        if (!this.dropdownParent) return;

        this.open();

        if (this.getQuery().length === 0) return;
        this.renderSection(this.buildUrl().toString());
      }

      onKeydown(event) {
        if (event.key !== 'Escape') return;

        if (event.target === this.input) event.preventDefault();

        if (!this.dropdownParent || !this.dropdownParent.classList.contains('search-active')) return;

        this.close();
        this.input.blur();
      }

      open() {
        if (!this.dropdownParent) return;

        document.querySelectorAll('.search-active').forEach((el) => {
          if (el !== this.dropdownParent) el.classList.remove('search-active');
        });
        this.dropdownParent.classList.add('search-active');
        document.body.classList.add('predictive-search-open');
      }

      close() {
        if (!this.dropdownParent) return;

        this.dropdownParent.classList.remove('search-active');
        document.body.classList.remove('predictive-search-open');
      }

      clear(event = null) {
        if (event) event.preventDefault();

        this.input.value = '';
        this.updateResetButton();
        if (this.statusElement) this.statusElement.textContent = '';
        this.input.focus();
        this.removeAttribute('results');
      }

      getQuery() {
        return this.input.value.trim();
      }

      buildUrl() {
        const url = new URL(`${theme.routes.shop_url}${theme.routes.predictive_search_url}`);

        url.searchParams.set('q', this.getQuery());
        url.searchParams.set('resources[limit]', this.hasAttribute('data-limit') ? parseInt(this.getAttribute('data-limit')) : 3);
        url.searchParams.set('resources[limit_scope]', 'each');
        url.searchParams.set('section_id', theme.utils.sectionId(this));
        return url;
      }

      onChange() {
        if (this.getQuery().length === 0) {
          this.clear();
          return;
        }

        this.open();

        const url = this.buildUrl().toString();
        this.renderSection(url);
      }

      renderUnsupportedHint() {
        if (!theme.strings.searchUnsupportedLocale?.length) {
          this.close();
          this.removeAttribute('results');
          return;
        }

        const target = this.querySelector('[id^="PredictiveSearchResults-"]');
        if (target) {
          target.replaceChildren();
          const p = document.createElement('p');
          p.className = 'predictive-search__hint text-sm leading-tight';
          p.textContent = theme.strings.searchUnsupportedLocale;
          target.appendChild(p);
        }

        this.setAttribute('results', '');
      }

      renderSection(url) {
        // Unsupported locale: show hint instead of fetching, while keeping search listeners intact.
        if (!theme.config.predictiveSearch) {
          this.renderUnsupportedHint();
          return;
        }

        this.cachedMap.has(url)
          ? this.renderSectionFromCache(url)
          : this.renderSectionFromFetch(url);
      }

      renderSectionFromCache(url) {
        const responseText = this.cachedMap.get(url);
        this.renderSearchResults(responseText);

        this.setAttribute('results', '');
      }

      renderSectionFromFetch(url) {
        this.renderAbortController?.abort();
        this.renderAbortController = new AbortController();

        this.setAttribute('loading', '');

        fetch(url, { signal: this.renderAbortController.signal })
          .then((response) => {
            if (!response.ok) throw new Error(`Predictive search ${response.status}`);
            return response.text();
          })
          .then((responseText) => {
            this.renderSearchResults(responseText);
            this.cachedMap.set(url, responseText);
            if (this.cachedMap.size > 30) {
              this.cachedMap.delete(this.cachedMap.keys().next().value);
            }

            this.removeAttribute('loading');
            this.setAttribute('results', '');
          })
          .catch((error) => {
            if (error.message.includes('417')) {
              theme.config.predictiveSearch = false;
              this.removeAttribute('loading');
              this.renderUnsupportedHint();
              return;
            }
            if (error.name !== 'AbortError') console.error(error);
          });
      }

      renderSearchResults(responseText) {
        const target = this.querySelector('[id^="PredictiveSearchResults-"]');
        if (!target) return;

        const parsed = new DOMParser().parseFromString(responseText, 'text/html').getElementById(target.id);
        if (parsed) target.replaceChildren(...parsed.childNodes);

        this.announceResults(target);
      }

      announceResults(target) {
        if (!this.statusElement) return;

        const count = target.querySelectorAll(':scope > div > ul > li, .horizontal-product').length;
        const template = count === 0 ? theme.strings.searchNoResults : (count === 1 ? theme.strings.searchResultsOne : theme.strings.searchResultsOther);
        this.statusElement.textContent = template.replace('[count]', count).replace('[terms]', this.getQuery());
      }
    }, { extends: 'form' }
  );
}

if (!customElements.get('predictive-search-overlay')) {
  customElements.define(
    'predictive-search-overlay',
    class PredictiveSearchOverlay extends OverlayElement {
      connectedCallback() {
        super.connectedCallback();

        this.on(this, 'click', this.onClick);
      }

      onClick() {
        setTimeout(() => {
          const region = this.closest('.search-active');
          if (!region) return;

          region.classList.remove('search-active');
          document.body.classList.remove('predictive-search-open');
        });
      }
    }
  );
}

if (!customElements.get('voice-search')) {
  customElements.define(
    'voice-search',
    class VoiceSearch extends MagnetButton {
      constructor() {
        super();

        this.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      }

      connectedCallback() {
        super.connectedCallback();

        if (!this.SpeechRecognition) return;

        this.input = this.closest('form')?.querySelector('input[type="search"]');
        if (!this.input) return;

        // Safari: OS voice service is unavailable — keep the icon hidden this session
        if (theme.config.hasSessionStorage && window.sessionStorage.getItem(`${theme.settings.themeName}:voice-unavailable`)) {
          this.setAttribute('hidden', '');
          return;
        }

        this.syncMicrophonePermission();
        this.on(this, 'click', this.onClick.bind(this));

      }

      disconnectedCallback() {
        super.disconnectedCallback();

        this.recognition?.abort?.();
      }

      async syncMicrophonePermission() {
        try {
          const status = await navigator.permissions.query({ name: 'microphone' });
          const sync = () => this.toggleAttribute('hidden', status.state === 'denied' || this.unavailable === true);
          sync();
          this.on(status, 'change', sync);
        } catch (e) {
          this.removeAttribute('hidden');
        }
      }

      onClick(event) {
        event.preventDefault();

        if (this.listening) {
          this.recognition?.stop();
          return;
        }

        this.recognition = new this.SpeechRecognition();
        this.recognition.lang = document.documentElement.lang || 'en';
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;

        this.recognition.addEventListener('result', this.onResult.bind(this));
        this.recognition.addEventListener('end', this.onEnd.bind(this));
        this.recognition.addEventListener('error', this.onEnd.bind(this));

        this.listening = true;
        this.classList.add('listening');
        this.recognition.start();
      }

      onResult(event) {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('');

        this.input.value = transcript;
        this.input.focus();
        this.input.dispatchEvent(new Event('input', { bubbles: true }));
      }

      onEnd(event) {
        this.listening = false;
        this.classList.remove('listening');

        // Safari: the OS voice service is unavailable
        if (event.error === 'service-not-allowed') this.markUnavailable();
      }

      markUnavailable() {
        this.unavailable = true;
        if (theme.config.hasSessionStorage) {
          window.sessionStorage.setItem(`${theme.settings.themeName}:voice-unavailable`, 'true');
        }

        this.closest('form')?.querySelector('[data-voice-unavailable]')?.removeAttribute('hidden');
        this.setAttribute('hidden', '');
      }
    }, { extends: 'button' }
  );
}
