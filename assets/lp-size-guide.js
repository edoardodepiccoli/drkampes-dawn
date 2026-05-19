/*
  LP — Size Guide

  Clicking "Consulta la tabella taglie" opens the size-guide popup
  that lives inside lp-offerta. We trigger it by simulating a click
  on the offerta's size-guide button (#hps-size-lp).
*/
(function () {
  document.querySelectorAll('[data-lp-sg-open-popup]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = document.getElementById('hps-size-lp');
      if (target) target.click();
    });
  });
})();
