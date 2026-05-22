/*
  CUSTOM · Prodotto — sincronizzazione galleria al cambio variante.

  La sezione custom-product-information filtra la galleria immagini per variante
  via il metafield custom.variant_gallery (lato Liquid). Al cambio variante Dawn
  ri-renderizza la sezione (Section Rendering API) e product-info.js -> updateMedia()
  sincronizza SOLO il viewer principale (`media-gallery ul`, la prima <ul>), non la
  striscia thumbnail. Questo script colma quel buco: alla pubblicazione di
  `variantChange` ricostruisce le thumbnail dall'HTML ri-renderizzato e ne
  riaggancia i click.

  Nessuna modifica a product-info.js / media-gallery.js: usati solo per contratto
  (evento variantChange, metodo pubblico setActiveMedia).
*/
(function () {
  if (window.__customPdpGallerySync) return;
  window.__customPdpGallerySync = true;

  // subscribe / PUB_SUB_EVENTS sono globali (pubsub.js + constants.js, caricati
  // da theme.liquid). Gli script defer eseguono in ordine: <head> prima di <body>.
  if (typeof subscribe !== 'function' || typeof PUB_SUB_EVENTS === 'undefined') return;

  subscribe(PUB_SUB_EVENTS.variantChange, function (event) {
    var data = event && event.data;
    if (!data || !data.html || !data.sectionId) return;

    var sectionId = data.sectionId;
    var liveGallery = document.getElementById('MediaGallery-' + sectionId);
    if (!liveGallery) return;

    // Limita l'effetto alla sola sezione custom: altre <product-info> in pagina
    // (es. quick-add) restano gestite da Dawn stock.
    if (!liveGallery.closest('.custom-product-information-section')) return;

    var liveThumbs = liveGallery.querySelector('#Slider-Thumbnails-' + sectionId);
    var freshThumbs = data.html.querySelector('#Slider-Thumbnails-' + sectionId);
    if (!liveThumbs || !freshThumbs) return;

    // Rimpiazza il contenuto della <ul> thumbnail mantenendo lo stesso elemento,
    // cosi' il riferimento cache-ato da media-gallery.js (this.elements.thumbnails)
    // resta valido.
    liveThumbs.innerHTML = freshThumbs.innerHTML;

    // media-gallery.js aggancia i click thumbnail nel constructor: le thumbnail
    // appena inserite non li hanno. Li riaggancio via il metodo pubblico setActiveMedia.
    liveThumbs.querySelectorAll('[data-target]').forEach(function (item) {
      var btn = item.querySelector('button');
      if (!btn) return;
      btn.addEventListener('click', function () {
        if (typeof liveGallery.setActiveMedia === 'function') {
          liveGallery.setActiveMedia(item.dataset.target, false);
        }
      });
    });

    // Evidenzia la thumbnail della media attiva della nuova variante (updateMedia
    // aveva chiamato setActiveMedia sulle vecchie thumbnail, ora sostituite).
    if (data.variant && data.variant.featured_media && typeof liveGallery.setActiveMedia === 'function') {
      liveGallery.setActiveMedia(sectionId + '-' + data.variant.featured_media.id, false);
    }
  });
})();
