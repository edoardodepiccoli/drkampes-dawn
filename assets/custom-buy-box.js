/*
  CUSTOM · Acquista — buy box homepage
  Custom element <custom-buy-box>: selezione variante (colore + taglia),
  aggiornamento prezzo / rata / disponibilita', carousel foto fisso con
  thumbnail (decision 035), sticky CTA, popup <dialog>.
  L'add to cart usa `custom-buy-buttons` (clone di buy-buttons) + product-form.js:
  questo JS aggiorna solo l'input name="id" del form al cambio variante.
  Nessuna modifica a product-form.js / cart-notification.js / cart.js.
*/
(function () {
  if (customElements.get('custom-buy-box')) return;

  // Store italiano (EUR). Formattazione coerente su prezzo, compare-at e rata.
  function formatMoney(cents) {
    return (cents / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
  }

  class CustomBuyBox extends HTMLElement {
    connectedCallback() {
      var dataEl = this.querySelector('.custom-buy-box__data');
      if (!dataEl) return;
      try {
        this.variants = JSON.parse(dataEl.textContent);
      } catch (e) {
        return;
      }
      if (!this.variants || !this.variants.length) return;

      this.priceEl = this.querySelector('[data-price]');
      this.compareEl = this.querySelector('[data-compare]');
      this.installmentEl = this.querySelector('[data-installment]');
      // Form Dawn (snippet buy-buttons): input variante + bottone submit.
      // product-form.js gestisce il submit; qui si tiene solo sincronizzato l'input.
      this.idInput = this.querySelector('.product-variant-id');
      this.atcBtn = this.querySelector('.product-form__submit');

      var colorOpt = this.querySelector('[data-color-opt]');
      var sizeOpt = this.querySelector('[data-size-opt]');
      this.colorPos = colorOpt ? parseInt(colorOpt.dataset.pos, 10) : -1;
      this.sizePos = sizeOpt ? parseInt(sizeOpt.dataset.pos, 10) : -1;
      this.colorValueEl = this.querySelector('[data-color-value]');
      this.sizeValueEl = this.querySelector('[data-size-value]');
      this.swatches = Array.prototype.slice.call(this.querySelectorAll('[data-swatch]'));
      this.pills = Array.prototype.slice.call(this.querySelectorAll('[data-pill]'));

      // Stato iniziale = prima variante disponibile (= selected_or_first_available_variant).
      var current = this.variants.find(function (v) { return v.available; }) || this.variants[0];
      this.selOpts = current.options.slice();

      this.bind();
      this.paintSelection();
      this.sync();
      this.initStickyCta();
      this.initPhotoCarousel();
    }

    // Carousel foto fisso (pdp-1/pdp-2), indipendente da colore/taglia: click
    // su una thumbnail scrolla il suo slide, lo scroll sincronizza la thumbnail attiva.
    initPhotoCarousel() {
      var self = this;
      this.photoSlidesEl = this.querySelector('[data-photo-slides]');
      this.photoThumbs = Array.prototype.slice.call(this.querySelectorAll('[data-photo-thumb]'));
      if (!this.photoSlidesEl || !this.photoThumbs.length) return;

      this.photoThumbs.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var idx = parseInt(btn.dataset.photoThumb, 10);
          var slide = self.photoSlidesEl.children[idx];
          if (!slide) return;
          self.photoSlidesEl.scrollTo({ left: slide.offsetLeft - self.photoSlidesEl.offsetLeft, behavior: 'smooth' });
        });
      });

      this.photoSlidesEl.addEventListener('scroll', function () {
        // Slide piu' vicino al bordo sinistro del contenitore = quello attivo.
        var containerLeft = self.photoSlidesEl.getBoundingClientRect().left;
        var closest = 0;
        var closestDist = Infinity;
        Array.prototype.forEach.call(self.photoSlidesEl.children, function (slide, i) {
          var dist = Math.abs(slide.getBoundingClientRect().left - containerLeft);
          if (dist < closestDist) {
            closestDist = dist;
            closest = i;
          }
        });
        self.photoThumbs.forEach(function (btn, i) {
          btn.classList.toggle('is-active', i === closest);
        });
      }, { passive: true });
    }

    bind() {
      var self = this;

      this.swatches.forEach(function (btn) {
        btn.addEventListener('click', function () {
          // Lo swatch e' sempre cliccabile: scelto un colore, le taglie si ricalcolano.
          if (self.colorPos < 0) return;
          self.selOpts[self.colorPos] = btn.dataset.value;
          self.paintSelection();
          self.sync();
        });
      });

      this.pills.forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (self.sizePos < 0) return;
          if (btn.classList.contains('is-unavailable')) return;
          self.selOpts[self.sizePos] = btn.dataset.value;
          self.paintSelection();
          self.sync();
        });
      });

      this.bindDialogs();
    }

    // Popup guida taglie / schede tecniche: <dialog> nativi (ESC e top-layer gratis).
    // I trigger [data-open-dialog] aprono il <dialog> con [data-dialog] corrispondente.
    bindDialogs() {
      var dialogs = {};

      Array.prototype.forEach.call(this.querySelectorAll('[data-dialog]'), function (d) {
        dialogs[d.dataset.dialog] = d;

        // Chiudi al click sul backdrop: con showModal() il target del click sullo
        // sfondo e' il <dialog> stesso (il contenuto e' dentro .__dialog-box).
        d.addEventListener('click', function (e) {
          if (e.target === d) d.close();
        });

        var closeBtn = d.querySelector('[data-close-dialog]');
        if (closeBtn) {
          closeBtn.addEventListener('click', function () { d.close(); });
        }

        // L'evento 'close' copre ogni chiusura (X, backdrop, ESC nativo):
        // qui si sblocca lo scroll del body.
        d.addEventListener('close', function () {
          document.body.classList.remove('overflow-hidden');
        });
      });

      Array.prototype.forEach.call(this.querySelectorAll('[data-open-dialog]'), function (btn) {
        btn.addEventListener('click', function () {
          var d = dialogs[btn.dataset.openDialog];
          if (!d || typeof d.showModal !== 'function') return;
          document.body.classList.add('overflow-hidden');
          d.showModal();
        });
      });
    }

    // Evidenzia swatch/pill selezionati e aggiorna le label "Colore:/Taglia:".
    paintSelection() {
      var self = this;
      this.swatches.forEach(function (btn) {
        btn.classList.toggle('is-on', self.colorPos >= 0 && btn.dataset.value === self.selOpts[self.colorPos]);
      });
      this.pills.forEach(function (btn) {
        btn.classList.toggle('is-on', self.sizePos >= 0 && btn.dataset.value === self.selOpts[self.sizePos]);
      });
      if (this.colorValueEl && this.colorPos >= 0) this.colorValueEl.textContent = this.selOpts[this.colorPos];
      if (this.sizeValueEl && this.sizePos >= 0) this.sizeValueEl.textContent = this.selOpts[this.sizePos];
    }

    // Variante che combacia esattamente con le opzioni selezionate.
    findVariant() {
      var self = this;
      return this.variants.find(function (v) {
        return v.options.every(function (o, i) { return o === self.selOpts[i]; });
      });
    }

    sync() {
      var self = this;

      // Swatch: colore acquistabile se esiste una variante disponibile con quel colore.
      this.swatches.forEach(function (btn) {
        if (self.colorPos < 0) return;
        var ok = self.variants.some(function (v) {
          return v.available && v.options[self.colorPos] === btn.dataset.value;
        });
        btn.classList.toggle('is-unavailable', !ok);
      });

      // Pill: taglia disponibile per il colore correntemente selezionato.
      this.pills.forEach(function (btn) {
        if (self.sizePos < 0) return;
        var ok = self.variants.some(function (v) {
          if (!v.available) return false;
          if (v.options[self.sizePos] !== btn.dataset.value) return false;
          if (self.colorPos >= 0 && v.options[self.colorPos] !== self.selOpts[self.colorPos]) return false;
          return true;
        });
        btn.classList.toggle('is-unavailable', !ok);
      });

      var match = this.findVariant();

      if (match) {
        // Sincronizza l'input del form Dawn: product-form.js lo legge al submit.
        if (this.idInput) this.idInput.value = match.id;
        if (this.priceEl) this.priceEl.textContent = formatMoney(match.price);
        if (this.compareEl) {
          if (match.compare_at_price && match.compare_at_price > match.price) {
            this.compareEl.textContent = formatMoney(match.compare_at_price);
            this.compareEl.hidden = false;
          } else {
            this.compareEl.hidden = true;
          }
        }
        if (this.installmentEl) {
          this.installmentEl.textContent = formatMoney(Math.round(match.price / 3));
        }
        this.setButton(match.available);
      } else {
        // Combo colore+taglia inesistente come variante: blocca l'acquisto.
        this.setButton(false);
      }
    }

    setButton(available) {
      // Abilita/disabilita il bottone submit del form Dawn. Il testo resta quello
      // di Dawn (locale). product-form.js gestisce loading/errori al submit.
      if (this.atcBtn) this.atcBtn.disabled = !available;
    }

    // Sticky CTA: bottone flottante che scivola su dopo 200px di scroll e si
    // nasconde quando questa sezione (#acquista) e' in viewport.
    initStickyCta() {
      var self = this;
      this.stickyCta = this.querySelector('[data-sticky-cta]');
      if (!this.stickyCta) return;

      this.scrolledEnough = window.scrollY > 200;
      this.selfInView = false;

      // IntersectionObserver su questa sezione (l'elemento = #acquista).
      new IntersectionObserver(function (entries) {
        self.selfInView = entries[0].isIntersecting;
        self.updateStickyCta();
      }).observe(this);

      var ticking = false;
      window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          self.scrolledEnough = window.scrollY > 200;
          self.updateStickyCta();
          ticking = false;
        });
      }, { passive: true });

      this.updateStickyCta(); // stato iniziale
    }

    updateStickyCta() {
      if (!this.stickyCta) return;
      // Visibile solo se scrollato oltre 200px E la sezione #acquista non e' in vista.
      var visible = this.scrolledEnough && !this.selfInView;
      this.stickyCta.classList.toggle('is-visible', visible);
    }
  }

  customElements.define('custom-buy-box', CustomBuyBox);
})();
