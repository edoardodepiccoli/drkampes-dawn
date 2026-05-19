/*
  LP — Offerta (B2C landing page)

  Code-only LP element JS. Vanilla, no Dawn dependencies.
  Powers:
   - main product gallery (with per-variant filtering via variant_gallery metafield)
   - color swatch picker + size pill picker
   - psychological stock counter (randomized client-side, NOT real inventory)
   - viewer toast (fake social proof)
   - sticky bottom CTA bar
   - gift-tshirt modal -> POST /cart/add.js -> redirect to /discount/.../?redirect=/checkout?discount=...

  Edit the CFG block below to change discount codes, viewer ranges, etc.
  Variant data is delivered via <script type="application/json"> tags
  inside the snippet so this file stays static and CDN-cacheable.
*/
(function () {
  var CFG = {
    sid: 'lp',
    discountCode: 'SPEDIZIONEGRATIS',
    bundleDiscountCode: 'BUNDLETSHIRT',
    viewerMin: 12,
    viewerMax: 37,
  };

  var sid = CFG.sid;
  var discountCode = CFG.discountCode;
  var bundleDiscountCode = CFG.bundleDiscountCode;
  var viewerMin = CFG.viewerMin;
  var viewerMax = CFG.viewerMax;

  function buildCheckoutUrl() {
    var base = '/checkout?discount=' + encodeURIComponent(discountCode);
    if (bundleDiscountCode) {
      return '/discount/' + encodeURIComponent(bundleDiscountCode) + '?redirect=' + encodeURIComponent(base);
    }
    return base;
  }

  var root = document.querySelector('[data-hps-id="' + sid + '"]');
  if (!root) return;

  var variantsEl = document.getElementById('hps-variants-' + sid);
  var vgEl = document.getElementById('hps-vg-' + sid);
  if (!variantsEl || !vgEl) return;

  var allVariants = JSON.parse(variantsEl.textContent);
  var vgMap       = JSON.parse(vgEl.textContent);

  var slides = Array.from(root.querySelectorAll('.hps__slide'));
  var thumbs = Array.from(root.querySelectorAll('.hps__thumb'));
  var vidInput   = document.getElementById('hps-vid-' + sid);
  var stockEl    = document.getElementById('hps-stock-' + sid);
  var ctaPriceEl = document.getElementById('hps-cta-price-' + sid);
  var viewersEl  = document.getElementById('hps-viewers-' + sid);

  function formatPrice(cents) {
    var n = cents / 100;
    return Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',');
  }

  var initV = allVariants.find(function (v) { return v.available; }) || allVariants[0];
  var selOpts = initV ? initV.options.slice() : [];

  var mainEl   = root.querySelector('.hps__main');
  var thumbsEl = root.querySelector('.hps__thumbs');

  function showByMediaId(mediaId) {
    slides.forEach(function (s) { s.classList.toggle('hps__slide--active', s.dataset.mediaId === mediaId); });
    thumbs.forEach(function (t) { t.classList.toggle('hps__thumb--active', t.dataset.mediaId === mediaId); });
  }

  function filterGallery(variantId) {
    var ids = vgMap[String(variantId)];

    if (!ids || ids.length === 0) {
      slides.forEach(function (s) { s.style.display = ''; });
      thumbs.forEach(function (t) { t.style.display = ''; });
    } else {
      slides.forEach(function (s) { s.style.display = 'none'; });
      thumbs.forEach(function (t) { t.style.display = 'none'; });

      ids.forEach(function (id) {
        var strId = String(id);
        var slide = mainEl.querySelector('.hps__slide[data-media-id="' + strId + '"]');
        var thumb = thumbsEl.querySelector('.hps__thumb[data-media-id="' + strId + '"]');
        if (slide) { slide.style.display = ''; mainEl.appendChild(slide); }
        if (thumb) { thumb.style.display = ''; thumbsEl.appendChild(thumb); }
      });
    }

    slides = Array.from(mainEl.querySelectorAll('.hps__slide'));
    thumbs = Array.from(thumbsEl.querySelectorAll('.hps__thumb'));

    if (ids && ids.length) {
      showByMediaId(String(ids[0]));
    } else {
      var first = slides.find(function (s) { return s.style.display !== 'none'; });
      if (first) showByMediaId(first.dataset.mediaId);
    }
  }

  thumbsEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.hps__thumb');
    if (btn) showByMediaId(btn.dataset.mediaId);
  });

  var swipeStartX = 0;
  var swipeStartY = 0;
  var swipeLock   = null;
  mainEl.addEventListener('pointerdown', function (e) {
    swipeStartX = e.clientX;
    swipeStartY = e.clientY;
    swipeLock   = null;
  });
  mainEl.addEventListener('pointermove', function (e) {
    if (swipeLock === null) {
      var dx = Math.abs(e.clientX - swipeStartX);
      var dy = Math.abs(e.clientY - swipeStartY);
      if (dx > 5 || dy > 5) swipeLock = dx > dy ? 'h' : 'v';
    }
    if (swipeLock === 'h') e.preventDefault();
  }, { passive: false });
  mainEl.addEventListener('pointerup', function (e) {
    if (swipeLock !== 'h') return;
    var delta = e.clientX - swipeStartX;
    if (Math.abs(delta) < 40) return;
    stepGallery(delta < 0 ? 1 : -1);
  });

  function stepGallery(dir) {
    var visible = slides.filter(function (s) { return s.style.display !== 'none'; });
    var activeIdx = visible.findIndex(function (s) { return s.classList.contains('hps__slide--active'); });
    if (activeIdx < 0) return;
    var nextIdx = (activeIdx + dir + visible.length) % visible.length;
    if (nextIdx !== activeIdx) showByMediaId(visible[nextIdx].dataset.mediaId);
  }

  var navPrev = root.querySelector('.hps__nav--prev');
  var navNext = root.querySelector('.hps__nav--next');
  if (navPrev) navPrev.addEventListener('click', function () { stepGallery(-1); });
  if (navNext) navNext.addEventListener('click', function () { stepGallery(1); });

  function syncVariant() {
    var match = allVariants.find(function (v) {
      return v.options.every(function (o, i) { return o === selOpts[i]; });
    }) || allVariants.find(function (v) { return v.options[0] === selOpts[0]; });
    if (!match) return;
    vidInput.value = match.id;
    if (ctaPriceEl) ctaPriceEl.textContent = '€' + formatPrice(match.price);
    if (sSel) {
      sSel.querySelectorAll('.hps__pill').forEach(function (pill) {
        var sizeVal = pill.dataset.value;
        var sPos    = parseInt(pill.dataset.pos, 10);
        var avail   = allVariants.some(function (v) {
          return v.options[sPos] === sizeVal &&
                 selOpts.every(function (opt, i) { return i === sPos || v.options[i] === opt; }) &&
                 v.available;
        });
        pill.classList.toggle('hps__pill--unavail', !avail);
        pill.setAttribute('aria-disabled', avail ? 'false' : 'true');
      });
    }
    filterGallery(match.id);
  }

  var swatches  = root.querySelectorAll('.hps__swatch');
  var cValEl    = document.getElementById('hps-cval-' + sid);

  swatches.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var pos = parseInt(btn.dataset.pos, 10);
      selOpts[pos] = btn.dataset.color;
      swatches.forEach(function (s) { s.classList.remove('hps__swatch--on'); });
      btn.classList.add('hps__swatch--on');
      if (cValEl) cValEl.textContent = btn.dataset.color;
      syncVariant();
    });
  });

  var sSel       = document.getElementById('hps-ssel-' + sid);
  var sValEl     = document.getElementById('hps-sval-' + sid);
  var stockNumEl = stockEl ? stockEl.querySelector('.hps-stock-n') : null;
  var stockMap   = {};
  if (sSel) {
    sSel.querySelectorAll('.hps__pill').forEach(function (pill) {
      stockMap[pill.dataset.value] = 3 + Math.floor(Math.random() * 7);
    });
  }

  if (sSel) {
    sSel.addEventListener('click', function (e) {
      var btn = e.target.closest('.hps__pill');
      if (!btn || btn.getAttribute('aria-disabled') === 'true') return;
      var pos = parseInt(btn.dataset.pos, 10);
      selOpts[pos] = btn.dataset.value;
      sSel.querySelectorAll('.hps__pill').forEach(function (p) { p.classList.remove('hps__pill--on'); });
      btn.classList.add('hps__pill--on');
      if (sValEl) sValEl.textContent = btn.dataset.value;
      if (stockEl) {
        if (stockNumEl) stockNumEl.textContent = stockMap[btn.dataset.value] || 7;
        stockEl.hidden = false;
      }
      syncVariant();
    });
  }

  var qtyEl = document.getElementById('hps-qty-' + sid);

  var bnBtn = document.getElementById('hps-bn-' + sid);
  if (bnBtn) {
    bnBtn.addEventListener('click', function () { openPop('hps-pop-tshirt-' + sid); });
  }

  function openPop(id) {
    var el = document.getElementById(id);
    if (el) { el.hidden = false; document.body.style.overflow = 'hidden'; }
  }
  function closePops() {
    document.querySelectorAll('.hps-pop:not([hidden])').forEach(function (p) { p.hidden = true; });
    document.body.style.overflow = '';
  }

  var techBtn = document.getElementById('hps-tech-' + sid);
  var sizeBtn = document.getElementById('hps-size-' + sid);
  if (techBtn) techBtn.addEventListener('click', function () { openPop('hps-pop-tech-' + sid); });
  if (sizeBtn) sizeBtn.addEventListener('click', function () { openPop('hps-pop-size-' + sid); });

  document.querySelectorAll('[data-pop-close]').forEach(function (el) {
    el.addEventListener('click', closePops);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePops(); });

  var tshirtSel  = document.getElementById('hps-tshirt-sel-' + sid);
  var tshirtPills = document.getElementById('hps-tshirt-pills-' + sid);
  var tshirtValEl = document.getElementById('hps-tshirt-val-' + sid);
  var confirmBtn = document.getElementById('hps-confirm-' + sid);

  if (tshirtPills && tshirtSel) {
    tshirtPills.addEventListener('click', function (e) {
      var btn = e.target.closest('.hps__pill');
      if (!btn || btn.getAttribute('aria-disabled') === 'true') return;
      tshirtPills.querySelectorAll('.hps__pill').forEach(function (p) { p.classList.remove('hps__pill--on'); });
      btn.classList.add('hps__pill--on');
      tshirtSel.value = btn.dataset.variantId;
      if (tshirtValEl) tshirtValEl.textContent = btn.dataset.title;
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', function () {
      var shoeId   = parseInt(vidInput.value, 10);
      var tshirtId = parseInt(tshirtSel ? tshirtSel.value : '0', 10);
      var qty      = parseInt(qtyEl ? qtyEl.value : '1', 10) || 1;

      if (!shoeId || !tshirtId) {
        window.location.href = buildCheckoutUrl();
        return;
      }

      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Aggiunta in corso...';

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            { id: shoeId,   quantity: qty },
            { id: tshirtId, quantity: 1   }
          ]
        })
      }).then(function () {
        window.location.href = buildCheckoutUrl();
      }).catch(function () {
        window.location.href = buildCheckoutUrl();
      });
    });
  }

  var ctaBar = document.getElementById('hps-cta-bar-' + sid);
  var ctaBnBtn = document.getElementById('hps-cta-bn-' + sid);

  if (ctaBar) {
    var ctaState = 'hidden';

    function updateCta() {
      var bnRect = bnBtn ? bnBtn.getBoundingClientRect() : null;
      var bnOffScreen = bnRect && bnRect.bottom < 0;
      var newState = bnOffScreen ? 'after' : 'hidden';
      if (newState === ctaState) return;
      ctaState = newState;

      ctaBar.style.transition = 'none';
      ctaBar.classList.remove('hps-cta-bar--visible');
      ctaBar.classList.toggle('hps-cta-bar--past', newState === 'after');
      ctaBar.offsetHeight;
      ctaBar.style.transition = '';
      if (newState !== 'hidden') ctaBar.classList.add('hps-cta-bar--visible');
    }

    window.addEventListener('scroll', updateCta, { passive: true });
  }

  if (ctaBnBtn) {
    ctaBnBtn.addEventListener('click', function () {
      root.scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (initV) filterGallery(initV.id);

  if (viewersEl && viewerMin > 0 && viewerMax >= viewerMin) {
    var viewerCount = viewerMin + Math.floor(Math.random() * (viewerMax - viewerMin + 1));
    var viewerNumEl = viewersEl.querySelector('.hps-viewers-n');
    function updateViewers() {
      var drift = Math.floor(Math.random() * 5) - 2;
      viewerCount = Math.max(viewerMin, Math.min(viewerMax, viewerCount + drift));
      if (viewerNumEl) viewerNumEl.textContent = viewerCount;
    }
    var viewerTriggered = false;
    function updateViewerToast() {
      if (!viewerTriggered) return;
      var sSelRect = sSel ? sSel.getBoundingClientRect() : null;
      var show = sSelRect ? (sSelRect.top < window.innerHeight && sSelRect.bottom > 0) : false;
      viewersEl.classList.toggle('hps__viewer-toast--visible', show);
    }
    function startViewers() {
      if (viewerTriggered) return;
      viewerTriggered = true;
      if (viewerNumEl) viewerNumEl.textContent = viewerCount;
      updateViewerToast();
      (function scheduleUpdate() {
        setTimeout(function () { updateViewers(); scheduleUpdate(); }, 4000 + Math.random() * 2000);
      })();
    }
    var triggerEl = sSel || root.querySelector('.hps__price-wrap') || root.querySelector('.hps__details');
    if (triggerEl) {
      new IntersectionObserver(function (entries, obs) {
        if (entries[0].isIntersecting) { setTimeout(startViewers, 2000); obs.disconnect(); }
      }, { threshold: 0.5 }).observe(triggerEl);
    } else {
      setTimeout(startViewers, 3500);
    }
    window.addEventListener('scroll', updateViewerToast, { passive: true });
  }
})();
