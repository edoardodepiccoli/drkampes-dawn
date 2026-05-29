// Auto-opens the LegalBlink CMP "Impostazioni" (settings) panel as soon as the
// cookie banner renders, instead of the default simple banner.
//
// WARNING: this reaches into a third-party (LegalBlink) shadow DOM. Their markup
// uses obfuscated class names, so the only stable hook is the visible button text
// "Impostazioni". If LegalBlink ships a markup/label change, this silently stops
// working. It does not break the CMP itself, the banner still works without it.
//
// Standalone deferred script (not a Custom Element) because <lb-cookie-banner> is
// defined by LegalBlink's loader.js, so we can't hook its connectedCallback. The
// banner is injected async after loader.js runs, so we watch the DOM with a
// MutationObserver until the button exists, click it once, then stop.

(function () {
  var BUTTON_TEXT = 'impostazioni';
  var clicked = false;

  function tryClick() {
    if (clicked) return true;

    var banner = document.querySelector('lb-cookie-banner');
    // shadowrootmode="open" means shadowRoot is reachable; bail until it exists.
    if (!banner || !banner.shadowRoot) return false;

    var buttons = banner.shadowRoot.querySelectorAll('button');
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].textContent.trim().toLowerCase() === BUTTON_TEXT) {
        buttons[i].click();
        clicked = true;
        return true;
      }
    }
    return false;
  }

  // Try once in case the banner is already present, then observe for late injection.
  if (tryClick()) return;

  var observer = new MutationObserver(function () {
    if (tryClick()) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Safety stop: don't observe forever if the button never shows (e.g. consent
  // already given so no banner, or LegalBlink changed their markup).
  setTimeout(function () {
    observer.disconnect();
  }, 15000);
})();
