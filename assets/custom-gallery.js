/*
  CUSTOM · Gallery — gallery editoriale.
  Custom element <custom-gallery>:
   - reveal: gli item compaiono entrando in viewport (IntersectionObserver);
   - parallax: le colonne driftano a velocita' diverse allo scroll (solo desktop).
  Rispetta prefers-reduced-motion (niente reveal, niente parallax).
  Self-contained: nessuna dipendenza da animations.js di Dawn.
*/
(function () {
  if (customElements.get('custom-gallery')) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktop = window.matchMedia('(min-width: 750px)');

  class CustomGallery extends HTMLElement {
    connectedCallback() {
      this.cols = Array.prototype.slice.call(this.querySelectorAll('[data-gallery-col]'));
      this.items = Array.prototype.slice.call(this.querySelectorAll('[data-gallery-item]'));
      if (reduceMotion) return; // niente animazioni: gli item restano visibili (no is-reveal)

      this.initReveal();
      this.initParallax();
    }

    // Reveal: stato nascosto iniziale via classe `is-reveal` (CSS), poi `is-visible`
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

    // Parallax colonne: solo desktop. Si attiva/disattiva al cambio breakpoint.
    initParallax() {
      var self = this;
      this.ticking = false;
      this.parallaxOn = false;

      this.onScroll = function () {
        if (self.ticking) return;
        self.ticking = true;
        requestAnimationFrame(function () {
          self.applyParallax();
          self.ticking = false;
        });
      };

      if (desktop.matches) this.enableParallax();

      desktop.addEventListener('change', function (e) {
        if (e.matches) self.enableParallax();
        else self.disableParallax();
      });
    }

    enableParallax() {
      if (this.parallaxOn) return;
      this.parallaxOn = true;
      window.addEventListener('scroll', this.onScroll, { passive: true });
      this.applyParallax(); // posizione iniziale, niente salto
    }

    disableParallax() {
      if (!this.parallaxOn) return;
      this.parallaxOn = false;
      window.removeEventListener('scroll', this.onScroll);
      this.cols.forEach(function (col) { col.style.transform = ''; });
    }

    applyParallax() {
      var rect = this.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      // progress: ~-1 (sezione sotto il viewport) .. +1 (sopra), 0 = centrata.
      var sectionCenter = rect.top + rect.height / 2;
      var progress = (vh / 2 - sectionCenter) / vh;
      progress = Math.max(-1, Math.min(1, progress));

      var BASE = 100; // ampiezza massima del drift, in px, prima del moltiplicatore
      this.cols.forEach(function (col) {
        var speed = parseFloat(col.dataset.speed) || 0;
        var y = progress * speed * BASE;
        col.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
      });
    }
  }

  customElements.define('custom-gallery', CustomGallery);
})();
