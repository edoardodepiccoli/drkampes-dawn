/*
  LP B2B — System carousel

  Horizontal scroll-snap track + dot pagination. No deps.
  Reads data-id from the section root to scope queries.
*/
(function () {
  var root = document.querySelector('[data-lp-b2b-system]');
  if (!root) return;
  var track = root.querySelector('.lp-b2b-system__track');
  var dots = root.querySelectorAll('.lp-b2b-system__dot');
  if (!track || dots.length === 0) return;

  function getCardStep() {
    var first = track.firstElementChild;
    if (!first) return 0;
    var rect = first.getBoundingClientRect();
    var cs = getComputedStyle(track);
    var gap = parseFloat(cs.columnGap);
    if (isNaN(gap)) gap = parseFloat(cs.gap);
    if (isNaN(gap)) gap = 0;
    return rect.width + gap;
  }

  function activeIndex() {
    var step = getCardStep();
    if (!step || isNaN(step)) return 0;
    var idx = Math.round(track.scrollLeft / step);
    if (idx < 0) idx = 0;
    if (idx > dots.length - 1) idx = dots.length - 1;
    return idx;
  }

  function update() {
    var idx = activeIndex();
    for (var i = 0; i < dots.length; i++) {
      if (i === idx) dots[i].classList.add('is-active');
      else dots[i].classList.remove('is-active');
    }
  }

  var raf;
  track.addEventListener('scroll', function () {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(update);
  }, { passive: true });

  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      var idx = parseInt(dot.dataset.index, 10) || 0;
      track.scrollTo({ left: idx * getCardStep(), behavior: 'smooth' });
    });
  });

  window.addEventListener('resize', function () {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(update);
  });

  update();
})();
