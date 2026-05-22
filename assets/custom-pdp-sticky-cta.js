/*
  CUSTOM · CTA prodotto — sticky CTA slide-up per la PDP.
  Custom element <custom-pdp-sticky-cta>: la barra scivola su dopo 200px di
  scroll e si nasconde quando #acquista e' in viewport.
  Il click sul bottone e' un <a href="#acquista"> nativo (smooth scroll gia'
  attivo sul sito). Vedi decision 013.
*/
(function () {
  if (customElements.get('custom-pdp-sticky-cta')) return;

  class CustomPdpStickyCta extends HTMLElement {
    connectedCallback() {
      this.bar = this.querySelector('[data-bar]');
      if (!this.bar) return;

      this.scrolledEnough = window.scrollY > 200;
      this.targetInView = false;

      var self = this;

      // Osserva #acquista (div ancora creato a parte): barra nascosta quando in vista.
      var target = document.querySelector('#acquista');
      if (target) {
        new IntersectionObserver(function (entries) {
          self.targetInView = entries[0].isIntersecting;
          self.update();
        }).observe(target);
      }

      var ticking = false;
      window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          self.scrolledEnough = window.scrollY > 200;
          self.update();
          ticking = false;
        });
      }, { passive: true });

      this.update(); // stato iniziale
    }

    update() {
      if (!this.bar) return;
      // Visibile solo se scrollato oltre 200px E #acquista non e' in vista.
      var visible = this.scrolledEnough && !this.targetInView;
      this.bar.classList.toggle('is-visible', visible);
    }
  }

  customElements.define('custom-pdp-sticky-cta', CustomPdpStickyCta);
})();
