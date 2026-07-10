// Auto-accepts the LegalBlink cookie banner for every visitor: finds the
// "Accept all" button in <lb-cookie-banner>'s shadow DOM and clicks it once,
// so LegalBlink records a real "granted" consent event (Google Consent Mode /
// Shopify Customer Privacy API) instead of leaving consent state unset.
//
// The banner itself is never shown (layout/theme.liquid, decisions/029:
// `lb-cookie-banner { display: none; }`). A script-triggered .click() still
// fires the button's own event handlers even while its ancestor is
// display:none, so hiding it first and clicking it after both work together.
//
// WARNING: this is a deliberate, confirmed decision to record consent that no
// visitor actually gave -- see decisions/030 for the compliance trade-off.
// It also reuses the same shadow-DOM matching approach that broke silently
// twice in decisions/026/028 when LegalBlink changed its markup/labels. If
// neither heuristic below matches, this does nothing: no accepted event is
// recorded, but nothing else breaks (banner stays hidden, tracking stays
// unblocked via data-blocking-mode=manual regardless).

(function () {
  var ACCEPT_TEXT_HINTS = [
    'accetta tutto', 'accetta',
    'accept all', 'accept',
    'aceptar todo', 'aceptar',
    'alle akzeptieren', 'akzeptieren',
    'tout accepter', 'accepter',
    'alles accepteren', 'accepteren',
    'aceitar tudo', 'aceitar',
    'zaakceptuj wszystko',
    'acceptera alla'
  ];
  var clicked = false;

  function findAcceptButton(root) {
    var buttons = root.querySelectorAll('button');

    // 1) Text match against known "accept all" labels, any supported language.
    for (var i = 0; i < buttons.length; i++) {
      var text = buttons[i].textContent.trim().toLowerCase();
      for (var j = 0; j < ACCEPT_TEXT_HINTS.length; j++) {
        if (text.indexOf(ACCEPT_TEXT_HINTS[j]) !== -1) return buttons[i];
      }
    }

    // 2) Fallback: LegalBlink styles "Accept all" as the primary CTA
    // (bg-primary), distinct from the secondary "Settings" action
    // (bg-secondary). Survives a label/language change on its own.
    for (var k = 0; k < buttons.length; k++) {
      var cls = buttons[k].className || '';
      if (cls.indexOf('bg-primary') !== -1) return buttons[k];
    }

    return null;
  }

  function tryClick() {
    if (clicked) return true;

    var banner = document.querySelector('lb-cookie-banner');
    if (!banner || !banner.shadowRoot) return false;

    var button = findAcceptButton(banner.shadowRoot);
    if (!button) return false;

    button.click();
    clicked = true;
    return true;
  }

  // Try once in case the banner is already present, then observe for late injection.
  if (tryClick()) return;

  var observer = new MutationObserver(function () {
    if (tryClick()) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Stop observing after 15s if the banner never appears (e.g. consent already
  // recorded from a previous visit) or LegalBlink's markup changed again --
  // no reveal fallback needed, the banner stays hidden either way.
  setTimeout(function () {
    observer.disconnect();
  }, 15000);
})();
