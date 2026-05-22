/*
  CUSTOM · Gallery — gallery editoriale.
  Custom element <custom-gallery>:
   - reveal: gli item compaiono entrando in viewport (IntersectionObserver);
   - parallax allo scroll:
       desktop -> le 3 colonne driftano a velocita' diverse;
       mobile  -> ogni foto drifta per conto suo (drift contenuto, niente overlap).
  Rispetta prefers-reduced-motion (niente reveal, niente parallax).
  Self-contained: nessuna dipendenza da animations.js di Dawn.
*/
(function () {
  if (customElements.get('custom-gallery')) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktopMQ = window.matchMedia('(min-width: 750px)');

  // Velocita' parallax per le foto su mobile, ciclata sugli item. Ampiezza
  // contenuta (max ~10px): col gap di 2.4rem due foto adiacenti non si toccano.
  var MOBILE_SPEEDS = [0.5, -0.45, 0.4, -0.5, 0.45, -0.4];
  var MOBILE_BASE = 40;
  var DESKTOP_BASE = 100;

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  class CustomGallery extends HTMLElement {
    connectedCallback() {
      this.cols = Array.prototype.slice.call(this.querySelectorAll('[data-gallery-col]'));
      this.items = Array.prototype.slice.call(this.querySelectorAll('[data-gallery-item]'));
      if (reduceMotion) return; // niente animazioni: item visibili (no is-reveal)

      this.initReveal();
      this.initParallax();
    }

    // Reveal: stato nascosto iniziale via `is-reveal` (CSS), poi `is-visible`
    // sugli item che entrano in viewport.
    initReveal() {
      this.classList.add('is-reveal');
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -10% 0px' }
      );
      this.items.forEach(function (item) { io.observe(item); });
    }

    // Parallax: sempre attivo, target diversi per breakpoint.
    initParallax() {
      var self = this;
      this.ticking = false;
      this.mode = desktopMQ.matches ? 'desktop' : 'mobile';

      this.onScroll = function () {
        if (self.ticking) return;
        self.ticking = true;
        requestAnimationFrame(function () {
          self.applyParallax();
          self.ticking = false;
        });
      };
      window.addEventListener('scroll', this.onScroll, { passive: true });

      desktopMQ.addEventListener('change', function (e) {
        var next = e.matches ? 'desktop' : 'mobile';
        if (next === self.mode) return;
        // Azzera i transform del modo precedente prima di cambiare target.
        self.cols.forEach(function (c) { c.style.transform = ''; });
        self.items.forEach(function (i) { i.style.transform = ''; });
        self.mode = next;
        self.applyParallax();
      });

      this.applyParallax(); // posizione iniziale, niente salto
    }

    applyParallax() {
      var vh = window.innerHeight || document.documentElement.clientHeight;

      if (this.mode === 'desktop') {
        // Desktop: le colonne driftano in base al progresso della sezione.
        var rect = this.getBoundingClientRect();
        var center = rect.top + rect.height / 2;
        var progress = clamp((vh / 2 - center) / vh, -1, 1);
        this.cols.forEach(function (col) {
          var speed = parseFloat(col.dataset.speed) || 0;
          col.style.transform = 'translate3d(0,' + (progress * speed * DESKTOP_BASE).toFixed(1) + 'px,0)';
        });
      } else {
        // Mobile: ogni foto drifta col proprio progresso nel viewport.
        this.items.forEach(function (item, i) {
          var r = item.getBoundingClientRect();
          var p = clamp((vh - r.top) / (vh + r.height), 0, 1);
          var speed = MOBILE_SPEEDS[i % MOBILE_SPEEDS.length];
          var y = (p - 0.5) * speed * MOBILE_BASE;
          item.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
        });
      }
    }
  }

  customElements.define('custom-gallery', CustomGallery);
})();
