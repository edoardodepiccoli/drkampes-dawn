// Auto-opens the LegalBlink CMP settings panel as soon as the cookie banner
// renders, instead of the default simple banner.
//
// WARNING: this reaches into a third-party (LegalBlink) shadow DOM. LegalBlink
// has already changed this markup/label once silently (see decisions/026 and
// decisions/028): the button text moved from Italian "Impostazioni" to English
// "Settings" and the classes were rebuilt entirely. There is no stable hook, so
// this uses two heuristics, in order, and gives up quietly if both miss -- it
// does not break the CMP itself, the banner still works without it.
//
// Standalone deferred script (not a Custom Element) because <lb-cookie-banner> is
// defined by LegalBlink's loader.js, so we can't hook its connectedCallback. The
// banner is injected async after loader.js runs, so we watch the DOM with a
// MutationObserver until the button exists, click it once, then stop.

(function () {
  // Known "open settings" labels across the locales this theme ships
  // (locales/*.schema.json). Matched as a substring so wording tweaks like
  // "Cookie settings" or "Manage preferences" still hit.
  var SETTINGS_TEXT_HINTS = [
    'impostazioni', 'settings', 'preferenze', 'preferences', 'personalizza',
    'configuración', 'configurar', 'einstellungen', 'paramètres',
    'instellingen', 'ustawienia', 'inställningar', 'nastavení',
    'indstillinger', 'asetukset', 'ayarlar', 'nastavenia'
  ];
  var clicked = false;

  function findSettingsButton(root) {
    var buttons = root.querySelectorAll('button');

    // 1) Text match against known labels, any supported language.
    for (var i = 0; i < buttons.length; i++) {
      var text = buttons[i].textContent.trim().toLowerCase();
      for (var j = 0; j < SETTINGS_TEXT_HINTS.length; j++) {
        if (text.indexOf(SETTINGS_TEXT_HINTS[j]) !== -1) return buttons[i];
      }
    }

    // 2) Fallback: LegalBlink styles "accept all" as the primary CTA
    // (bg-primary) and "open settings" as the secondary action (bg-secondary).
    // This survives a label/language change even when the text list above
    // misses, as long as the same primary/secondary convention holds.
    for (var k = 0; k < buttons.length; k++) {
      var cls = buttons[k].className || '';
      if (cls.indexOf('bg-primary') !== -1) continue;
      if (cls.indexOf('bg-secondary') !== -1) return buttons[k];
    }

    return null;
  }

  function tryClick() {
    if (clicked) return true;

    var banner = document.querySelector('lb-cookie-banner');
    // shadowrootmode="open" means shadowRoot is reachable; bail until it exists.
    if (!banner || !banner.shadowRoot) return false;

    var button = findSettingsButton(banner.shadowRoot);
    if (!button) return false;

    button.click();
    clicked = true;
    // Host starts at opacity 0 (see inline <style> in theme.liquid) to avoid the
    // simple banner flashing. Reveal once the settings panel is open. rAF lets the
    // panel render first so the fade applies to the final view, not the banner.
    requestAnimationFrame(function () {
      banner.style.opacity = '1';
    });
    return true;
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
    // Failsafe: if we never clicked (e.g. LegalBlink changed the button label) but a
    // banner is present, reveal it anyway so it isn't stuck invisible and unusable.
    if (!clicked) {
      var banner = document.querySelector('lb-cookie-banner');
      if (banner) banner.style.opacity = '1';
    }
  }, 15000);
})();
