/*
  CUSTOM · Acquista — buy box homepage
  Custom element <custom-buy-box>: selezione variante (colore + taglia),
  aggiornamento prezzo / rata / disponibilita', e carousel immagini.
  L'add to cart resta nativo Dawn: questo JS aggiorna solo input[name=id];
  product-form.js gestisce il submit e il cart drawer. Nessuna modifica a
  product-form.js / cart.js / cart-drawer.js.
*/
(function () {
  if (customElements.get('custom-buy-box')) return;

  // Store italiano (EUR). Formattazione coerente su prezzo, compare-at e rata.
  function formatMoney(cents) {
    return (cents / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
  }

  // Chiave immagine = path senza query, per confrontare URL a width diverse.
  function imgKey(url) {
    return (url || '').split('?')[0];
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

      this.idInput = this.querySelector('input[name="id"]');
      this.priceEl = this.querySelector('[data-price]');
      this.compareEl = this.querySelector('[data-compare]');
      this.installmentEl = this.querySelector('[data-installment]');
      this.stockEl = this.querySelector('[data-stock]');
      this.atcBtn = this.querySelector('.custom-buy-box__atc');
      this.atcText = this.atcBtn ? this.atcBtn.querySelector('span') : null;

      // carousel
      this.slidesEl = this.querySelector('[data-slides]');
      this.slides = Array.prototype.slice.call(this.querySelectorAll('.custom-buy-box__slide'));
      this.thumbs = Array.prototype.slice.call(this.querySelectorAll('[data-thumb]'));

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
      this.sizeTouched = false; // la riga stock compare solo dopo scelta taglia

      this.bind();
      this.paintSelection();
      this.sync();
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
          self.sizeTouched = true;
          self.paintSelection();
          self.sync();
        });
      });

      // Thumbnail (solo desktop): click -> scorre il carousel allo slide i-esimo.
      this.thumbs.forEach(function (btn, i) {
        btn.addEventListener('click', function () { self.goToSlide(i); });
      });

      // Swipe mobile: lo scroll-snap nativo muove il carousel; qui si tiene solo
      // sincronizzata la thumbnail attiva con lo slide visibile.
      if (this.slidesEl) {
        this.slidesEl.addEventListener('scroll', function () {
          if (!self.slidesEl.clientWidth) return;
          self.setActiveThumb(Math.round(self.slidesEl.scrollLeft / self.slidesEl.clientWidth));
        }, { passive: true });
      }
    }

    goToSlide(idx) {
      if (!this.slidesEl || idx < 0) return;
      this.slidesEl.scrollTo({ left: idx * this.slidesEl.clientWidth, behavior: 'smooth' });
      this.setActiveThumb(idx);
    }

    setActiveThumb(idx) {
      this.thumbs.forEach(function (t, i) { t.classList.toggle('is-active', i === idx); });
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
        // Carousel: scorre all'immagine della variante selezionata (match per path).
        if (match.featured_image && match.featured_image.src && this.slides.length) {
          var key = imgKey(match.featured_image.src);
          for (var i = 0; i < this.slides.length; i++) {
            if (imgKey(this.slides[i].src) === key) { this.goToSlide(i); break; }
          }
        }
        this.setButton(match.available);
      } else {
        // Combo colore+taglia inesistente come variante: blocca l'acquisto.
        this.setButton(false);
      }

      if (this.stockEl) this.stockEl.hidden = !this.sizeTouched;
    }

    setButton(available) {
      if (!this.atcBtn) return;
      this.atcBtn.disabled = !available;
      if (this.atcText) {
        this.atcText.textContent = available ? 'Aggiungi al carrello' : 'Non disponibile';
      }
    }
  }

  customElements.define('custom-buy-box', CustomBuyBox);
})();
