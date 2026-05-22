/*
  CUSTOM · Acquista — buy box homepage
  Custom element <custom-buy-box>: selezione variante (colore + taglia),
  aggiornamento prezzo / rata / disponibilita', carousel immagini con filtro
  per colore (metafield custom.variant_gallery), dots su mobile, e add to cart.
  Add to cart: fetch /cart/add.js poi apertura del popup carrello nativo Dawn
  (cart-notification). Niente <form> / <product-form>: nessun reload possibile.
  Nessuna modifica a cart.js / cart-notification.js / product-form.js.
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
      this.stockEl = this.querySelector('[data-stock]');
      this.atcBtn = this.querySelector('[data-atc]');
      this.atcText = this.atcBtn ? this.atcBtn.querySelector('span') : null;
      this.atcSpinner = this.atcBtn ? this.atcBtn.querySelector('.loading__spinner') : null;
      this.errorEl = this.querySelector('[data-error]');
      this.currentVariantId = null;
      this.adding = false;

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
      this.sizeTouched = false; // la riga stock compare solo dopo scelta taglia
      this.lastColor = undefined; // forza il primo filterGallery in sync()

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

      // Add to cart.
      if (this.atcBtn) {
        this.atcBtn.addEventListener('click', function () { self.addToCart(); });
      }
    }

    // Aggiunge la variante corrente al carrello via Ajax e apre il popup nativo
    // Dawn (cart-notification). Niente form -> nessun reload, mai.
    addToCart() {
      var self = this;
      if (!this.atcBtn || this.atcBtn.disabled || this.adding) return;
      if (!this.currentVariantId) return;

      this.adding = true;
      this.setLoading(true);
      this.clearError();

      // cart_type del tema = notification; fallback a cart-drawer per sicurezza.
      var cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');

      var body = new FormData();
      body.append('id', this.currentVariantId);
      body.append('quantity', '1');
      // Section Rendering API: il popup ha bisogno dell'HTML carrello aggiornato.
      if (cart && typeof cart.getSectionsToRender === 'function') {
        body.append('sections', cart.getSectionsToRender().map(function (s) { return s.id; }).join(','));
        body.append('sections_url', window.location.pathname);
      }

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: body,
      })
        .then(function (r) { return r.json(); })
        .then(function (response) {
          if (response.status) {
            // Errore Shopify (es. variante esaurita).
            self.showError(response.description || response.message || 'Impossibile aggiungere al carrello.');
            return;
          }
          if (cart && typeof cart.renderContents === 'function') {
            cart.renderContents(response); // apre il popup carrello nativo Dawn
          } else {
            window.location = '/cart'; // fallback se cart_type = page
          }
        })
        .catch(function () {
          self.showError('Impossibile aggiungere al carrello. Riprova.');
        })
        .finally(function () {
          self.adding = false;
          self.setLoading(false);
        });
    }

    setLoading(on) {
      if (!this.atcBtn) return;
      this.atcBtn.classList.toggle('loading', on);
      this.atcBtn.setAttribute('aria-busy', on ? 'true' : 'false');
      if (this.atcSpinner) this.atcSpinner.classList.toggle('hidden', !on);
    }

    showError(msg) {
      if (!this.errorEl) return;
      this.errorEl.textContent = msg;
      this.errorEl.hidden = false;
    }

    clearError() {
      if (!this.errorEl) return;
      this.errorEl.textContent = '';
      this.errorEl.hidden = true;
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
        this.currentVariantId = match.id;
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
        this.currentVariantId = null;
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
