// Sticky CTA mobile per la PDP custom. Barra in basso che scivola su quando il
// bottone "Aggiungi al carrello" (#pdp-buy) esce dalla viewport, e si nasconde
// quando torna in vista. Il tap e' un'ancora che scrolla all'ATC (smooth scroll
// globale, ADR 008): non aggiunge al carrello.
//
// Pattern mutuato dallo sticky del buy-box (custom-buy-box.js initStickyCta):
// IntersectionObserver sul target + listener scroll throttled con rAF. Solo mobile
// (matchMedia + il CSS la nasconde da 750px in su).

class PdpStickyCta extends HTMLElement {
  connectedCallback() {
    var sel = this.getAttribute('data-target');
    this.target = sel ? document.querySelector(sel) : null;
    // Senza target non c'e' modo di sapere quando il punto d'acquisto e' in vista.
    if (!this.target) return;

    this.mq = window.matchMedia('(max-width: 749px)');
    this.scrolledEnough = window.scrollY > 200;
    this.targetInView = false;

    var self = this;

    // Osserva il bottone ATC: targetInView = true quando e' anche solo parzialmente
    // in viewport.
    new IntersectionObserver(function (entries) {
      self.targetInView = entries[0].isIntersecting;
      self.update();
    }).observe(this.target);

    // Scroll throttled: aggiorna la soglia dei 200px senza martellare a ogni evento.
    var ticking = false;
    window.addEventListener(
      'scroll',
      function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          self.scrolledEnough = window.scrollY > 200;
          self.update();
          ticking = false;
        });
      },
      { passive: true }
    );

    this.update(); // stato iniziale
  }

  update() {
    // Visibile solo su mobile, oltre 200px di scroll e con l'ATC fuori dalla viewport.
    var visible = this.mq.matches && this.scrolledEnough && !this.targetInView;
    this.classList.toggle('is-visible', visible);
  }
}

customElements.define('pdp-sticky-cta', PdpStickyCta);
