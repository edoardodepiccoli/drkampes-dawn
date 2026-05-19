/*
  LP — Reviews

  Shows the first N reviews; the "Mostra le altre …" button reveals
  the rest. Initial visible count is set by the .lp-rev--hidden classes
  applied in lp-reviews.liquid.
*/
(function () {
  var root = document.querySelector('[data-lp-reviews-id="lp"]');
  if (!root) return;
  var moreBtn = root.querySelector('[data-lp-reviews-more]');
  if (!moreBtn) return;
  moreBtn.addEventListener('click', function () {
    root.querySelectorAll('.lp-rev--hidden').forEach(function (el) {
      el.classList.remove('lp-rev--hidden');
    });
    moreBtn.style.display = 'none';
  });
})();
