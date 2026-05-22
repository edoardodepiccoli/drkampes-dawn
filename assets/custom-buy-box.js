/*
  CUSTOM · Acquista — buy box homepage
  Custom element <custom-buy-box>: selezione variante (colore + taglia),
  aggiornamento prezzo / rata / disponibilita', carousel immagini con filtro
  per colore (metafield custom.variant_gallery), dots su mobile, sticky CTA.
  L'add to cart usa lo snippet ufficiale Dawn `buy-buttons` + product-form.js:
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

      // Mappa variante -> media id della galleria colore (fallback {} = mostra tutto).
      this.vgMap = {};
      var vgEl = this.querySelector('.custom-buy-box__vg');
      if (vgEl) {
        try { this.vgMap = JSON.parse(vgEl.textContent) || {}; } catch (e) { this.vgMap = {}; }
      }

      this.priceEl = this.querySelector('[data-price]');
      this.compareEl = this.querySelector('[data-compare]');
      this.installmentEl = this.querySelector('[data-installment]');
      // Form Dawn (snippet buy-buttons): input variante + bottone submit.
      // product-form.js gestisce il submit; qui si tiene solo sincronizzato l'input.
      this.idInput = this.querySelector('.product-variant-id');
      this.atcBtn = this.querySelector('.product-form__submit');

      // carousel
      this.slidesEl = this.querySelector('[data-slides]');
      this.thumbsEl = this.querySelector('[data-thumbs]');
      this.dotsEl = this.querySelector('[data-dots]');
      // set completo (ordine originale) vs set visibile corrente
      this.allSlides = Array.prototype.slice.call(this.querySelectorAll('.custom-buy-box__slide'));
      this.allThumbs = Array.prototype.slice.call(this.querySelectorAll('[data-thumb]'));
      this.slides = this.allSlides.slice();
      this.thumbs = this.allThumbs.slice();
      this.dots = [];

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
      this.lastColor = undefined; // forza il primo filterGallery in sync()

      this.bind();
      this.paintSelection();
      this.sync();
      this.initStickyCta();
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

      // Thumbnail: delega sul contenitore (resiste al riordino del filtro).
      // Match per media-id, non per indice.
      if (this.thumbsEl) {
        this.thumbsEl.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-thumb]');
          if (!btn) return;
          var idx = self.slides.findIndex(function (s) {
            return s.dataset.mediaId === btn.dataset.mediaId;
          });
          if (idx >= 0) self.goToSlide(idx);
        });
      }

      // Swipe mobile: lo scroll-snap nativo muove il carousel; qui si tiene solo
      // sincronizzata thumbnail/dot attivi con lo slide visibile.
      if (this.slidesEl) {
        this.slidesEl.addEventListener('scroll', function () {
          if (!self.slidesEl.clientWidth) return;
          self.setActive(Math.round(self.slidesEl.scrollLeft / self.slidesEl.clientWidth));
        }, { passive: true });
      }
    }

    goToSlide(idx, behavior) {
      if (!this.slidesEl || idx < 0) return;
      this.slidesEl.scrollTo({ left: idx * this.slidesEl.clientWidth, behavior: behavior || 'smooth' });
      this.setActive(idx);
    }

    setActive(idx) {
      this.thumbs.forEach(function (t, i) { t.classList.toggle('is-active', i === idx); });
      this.dots.forEach(function (d, i) { d.classList.toggle('is-active', i === idx); });
    }

    // Carousel: mostra solo le immagini della galleria del colore selezionato.
    // ids assente/vuoto -> mostra tutte le immagini (ordine originale).
    filterGallery(variant) {
      if (!this.slidesEl) return;
      var ids = this.vgMap[String(variant.id)];
      var self = this;

      if (!ids || !ids.length) {
        // Fallback: ripristina tutte le immagini nell'ordine originale.
        this.allSlides.forEach(function (s) { s.style.display = ''; self.slidesEl.appendChild(s); });
        this.allThumbs.forEach(function (t) {
          t.style.display = '';
          if (self.thumbsEl) self.thumbsEl.appendChild(t);
        });
      } else {
        this.allSlides.forEach(function (s) { s.style.display = 'none'; });
        this.allThumbs.forEach(function (t) { t.style.display = 'none'; });
        ids.forEach(function (id) {
          var sid = String(id);
          var slide = self.allSlides.find(function (s) { return s.dataset.mediaId === sid; });
          var thumb = self.allThumbs.find(function (t) { return t.dataset.mediaId === sid; });
          if (slide) { slide.style.display = ''; self.slidesEl.appendChild(slide); }
          if (thumb && self.thumbsEl) { thumb.style.display = ''; self.thumbsEl.appendChild(thumb); }
        });
      }

      // Ricalcola i set visibili nell'ordine DOM corrente.
      this.slides = this.allSlides.filter(function (s) { return s.style.display !== 'none'; });
      this.thumbs = this.allThumbs.filter(function (t) { return t.style.display !== 'none'; });

      this.renderDots();
      this.goToSlide(0, 'auto');
    }

    // Un dot per slide visibile (solo mobile via CSS). <=1 slide -> nessun dot.
    renderDots() {
      if (!this.dotsEl) return;
      this.dotsEl.innerHTML = '';
      this.dots = [];
      if (this.slides.length <= 1) return;
      var self = this;
      this.slides.forEach(function (slide, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'custom-buy-box__dot';
        dot.setAttribute('aria-label', 'Immagine ' + (i + 1));
        dot.addEventListener('click', function () { self.goToSlide(i); });
        self.dotsEl.appendChild(dot);
        self.dots.push(dot);
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

      // Filtro galleria: solo al cambio colore (cambiare taglia non resetta il carousel).
      var color = this.colorPos >= 0 ? this.selOpts[this.colorPos] : null;
      if (color !== this.lastColor) {
        this.lastColor = color;
        // La galleria e' per colore: vale qualunque variante di quel colore.
        var galleryVariant = match || this.variants.find(function (v) {
          return self.colorPos >= 0 && v.options[self.colorPos] === color;
        });
        if (galleryVariant) this.filterGallery(galleryVariant);
      }

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
