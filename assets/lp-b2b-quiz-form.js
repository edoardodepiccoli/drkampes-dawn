/*
  LP B2B — Quiz Form

  Modal + multi-step form. POSTs to Make.com webhook (URL read from
  data-webhook on the modal root, set by the snippet from Horizon JSON).

  IMPORTANT: field names (ruolo, azienda, provincia, camion, autisti,
  fornitore, problema, vantaggio, soluzione, test, nome, whatsapp, email,
  messaggio) are a contract with the Make.com automation. Do not rename.

  Two IIFEs: quiz modal + sticky CTA controller.
*/
(function () {
  if (window.__lpB2bQuizFormInit) return;
  window.__lpB2bQuizFormInit = true;

  const STORAGE_KEY = 'lpB2bQuiz:state';
  const QUEUE_KEY   = 'lpB2bQuiz:queue';
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [5000, 10000, 20000];
  const REQUEST_TIMEOUT = 15000;

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^[0-9]{6,15}$/;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(init);

  function init() {
    const modal = document.getElementById('lpQuizModal');
    if (!modal) return;

    const webhookUrl = modal.dataset.webhook;
    const form       = modal.querySelector('[data-quiz-form]');
    const steps      = Array.from(modal.querySelectorAll('[data-quiz-step]'));
    const nextBtn    = modal.querySelector('[data-quiz-next]');
    const nextLabel  = modal.querySelector('[data-quiz-next-label]');
    const backBtn    = modal.querySelector('[data-quiz-back]');
    const startBtn   = modal.querySelector('[data-quiz-start]');
    const progressFill  = modal.querySelector('[data-quiz-progress-fill]');
    const progressLabel = modal.querySelector('[data-quiz-progress-label]');
    const retryBanner   = modal.querySelector('[data-quiz-retry]');
    const retryN        = modal.querySelector('[data-quiz-retry-n]');
    const retrySec      = modal.querySelector('[data-quiz-retry-s]');
    const errorBanner   = modal.querySelector('[data-quiz-error]');
    const errorMsg      = modal.querySelector('[data-quiz-error-msg]');

    const TOTAL_STEPS = 5;
    let currentStep = 'intro';
    let lastFocused = null;
    let retryTimer  = null;
    let countdownTimer = null;
    let inFlightAbort = null;

    // Phone input (prefix dropdown + digits-only national)
    const phonePrefix = modal.querySelector('#lpQuizWhatsappPrefix');
    const phoneNumber = modal.querySelector('#lpQuizWhatsappNumber');
    const phoneHidden = modal.querySelector('#lpQuizWhatsapp');

    function sanitizeNational(raw) {
      let digits = String(raw || '').replace(/\D+/g, '');
      digits = digits.replace(/^0+/, '');
      return digits;
    }

    function syncWhatsapp() {
      if (!phonePrefix || !phoneNumber || !phoneHidden) return;
      const dial = phonePrefix.value.replace(/\D+/g, '');
      const national = sanitizeNational(phoneNumber.value);
      phoneHidden.value = national ? (dial + national) : '';
    }

    function applyPhoneRestore(combined) {
      if (!phonePrefix || !phoneNumber || !phoneHidden) return;
      const all = String(combined || '').replace(/\D+/g, '').replace(/^0+/, '');
      if (!all) { phoneNumber.value = ''; phoneHidden.value = ''; return; }
      const codes = Array.from(phonePrefix.options)
        .map(function (o) { return o.value; })
        .sort(function (a, b) { return b.length - a.length; });
      let matched = '';
      for (let i = 0; i < codes.length; i++) {
        if (all.indexOf(codes[i]) === 0) { matched = codes[i]; break; }
      }
      if (matched) {
        phonePrefix.value = matched;
        phoneNumber.value = all.slice(matched.length);
      } else {
        phoneNumber.value = all;
      }
      syncWhatsapp();
    }

    if (phoneNumber) {
      phoneNumber.addEventListener('input', function () {
        const cleaned = sanitizeNational(phoneNumber.value);
        if (phoneNumber.value !== cleaned) phoneNumber.value = cleaned;
        syncWhatsapp();
      });
      phoneNumber.addEventListener('blur', syncWhatsapp);
    }
    if (phonePrefix) {
      phonePrefix.addEventListener('change', function () {
        syncWhatsapp();
        saveState();
      });
    }

    // Restore saved state
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && saved.values) restoreValues(saved.values);
    } catch (e) { /* ignore */ }
    syncWhatsapp();

    // Trigger binding (delegated)
    document.addEventListener('click', function (e) {
      const trigger = e.target.closest('[data-quiz-trigger]');
      if (trigger) {
        e.preventDefault();
        openModal();
        return;
      }
      if (e.target.closest('[data-quiz-close]') && modal.contains(e.target)) {
        e.preventDefault();
        closeModal();
      }
    });

    // Multi-select max enforcement
    modal.addEventListener('change', function (e) {
      const t = e.target;
      if (t.type === 'checkbox') {
        const group = t.closest('[data-multi-max]');
        if (group) {
          const max = parseInt(group.dataset.multiMax, 10) || 99;
          const checked = group.querySelectorAll('input[type="checkbox"]:checked');
          if (checked.length >= max) {
            group.querySelectorAll('input[type="checkbox"]:not(:checked)').forEach(c => c.disabled = true);
          } else {
            group.querySelectorAll('input[type="checkbox"]').forEach(c => c.disabled = false);
          }
        }
      }
      const q = t.closest('.lp-b2b-quiz-form__q');
      if (q) q.classList.remove('is-invalid');
      if (t.classList.contains('lp-b2b-quiz-form__input')) t.classList.remove('is-invalid');
      saveState();
    });

    modal.addEventListener('input', function (e) {
      if (e.target.classList.contains('lp-b2b-quiz-form__input')) {
        e.target.classList.remove('is-invalid');
        const q = e.target.closest('.lp-b2b-quiz-form__q');
        if (q) q.classList.remove('is-invalid');
        saveState();
      }
    });

    // Nav buttons
    if (startBtn) startBtn.addEventListener('click', function () {
      goToStep(1);
    });

    nextBtn.addEventListener('click', function () {
      if (currentStep === 'success') return;
      if (!validateStep(currentStep)) return;
      if (currentStep === TOTAL_STEPS) {
        submitForm();
      } else {
        goToStep(currentStep + 1);
      }
    });

    backBtn.addEventListener('click', function () {
      if (typeof currentStep === 'number' && currentStep > 1) goToStep(currentStep - 1);
      else if (currentStep === 1) goToStep('intro');
    });

    // Online listener: drain queue
    window.addEventListener('online', drainQueue);
    setTimeout(drainQueue, 1500);

    function openModal() {
      lastFocused = document.activeElement;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lp-b2b-quiz-open');
      if (currentStep === 'intro' && !hasAnyAnswer()) goToStep('intro');
      else if (currentStep === 'success') goToStep('intro');
      trapFocus();
    }

    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lp-b2b-quiz-open');
      if (inFlightAbort) inFlightAbort.abort();
      clearRetry();
      if (lastFocused && typeof lastFocused.focus === 'function') {
        try { lastFocused.focus(); } catch (e) { /* ignore */ }
      }
    }

    function goToStep(step) {
      currentStep = step;
      steps.forEach(s => s.classList.remove('is-active'));
      const target = modal.querySelector('[data-quiz-step="' + step + '"]');
      if (target) target.classList.add('is-active');

      modal.classList.toggle('is-step-active', typeof step === 'number');
      modal.classList.remove('is-step-1','is-step-2','is-step-3','is-step-4','is-step-5');
      if (typeof step === 'number') modal.classList.add('is-step-' + step);

      if (typeof step === 'number') {
        const pct = (step / TOTAL_STEPS) * 100;
        progressFill.style.width = pct + '%';
        progressLabel.textContent = 'Step ' + step + ' di ' + TOTAL_STEPS;
      }

      if (typeof step === 'number') {
        nextLabel.textContent = step === TOTAL_STEPS ? 'INVIA CANDIDATURA' : 'Avanti';
      }

      if (target) {
        target.scrollTop = 0;
        setTimeout(function () {
          const f = target.querySelector('input:not([disabled]), textarea, select, button');
          if (f && step !== 'intro' && step !== 'success') { try { f.focus({ preventScroll: true }); } catch (e) {} }
        }, 60);
      }
    }

    function validateStep(step) {
      if (typeof step !== 'number') return true;
      const stepEl = modal.querySelector('[data-quiz-step="' + step + '"]');
      if (!stepEl) return true;
      let valid = true;
      let firstInvalid = null;

      stepEl.querySelectorAll('[data-required]').forEach(function (input) {
        const name = input.name;
        const q = input.closest('.lp-b2b-quiz-form__q');
        if (input.type === 'radio') {
          const any = stepEl.querySelector('input[name="' + name + '"]:checked');
          if (!any) { if (q) q.classList.add('is-invalid'); valid = false; if (!firstInvalid) firstInvalid = q; }
        } else {
          const v = (input.value || '').trim();
          if (!v) { input.classList.add('is-invalid'); if (q) q.classList.add('is-invalid'); valid = false; if (!firstInvalid) firstInvalid = input; }
          else if (input.dataset.validate === 'email' && !EMAIL_RE.test(v)) {
            input.classList.add('is-invalid'); if (q) q.classList.add('is-invalid'); valid = false; if (!firstInvalid) firstInvalid = input;
          } else if (input.dataset.validate === 'phone' && !PHONE_RE.test(v)) {
            input.classList.add('is-invalid'); if (q) q.classList.add('is-invalid'); valid = false; if (!firstInvalid) firstInvalid = input;
          }
        }
      });

      const seenGroups = new Set();
      stepEl.querySelectorAll('[data-required-multi]').forEach(function (input) {
        const name = input.name;
        if (seenGroups.has(name)) return;
        seenGroups.add(name);
        const any = stepEl.querySelector('input[name="' + name + '"]:checked');
        if (!any) {
          const q = input.closest('.lp-b2b-quiz-form__q');
          if (q) q.classList.add('is-invalid');
          valid = false;
          if (!firstInvalid) firstInvalid = q;
        }
      });

      if (firstInvalid && firstInvalid.scrollIntoView) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return valid;
    }

    function collectValues() {
      const data = {};
      const fd = new FormData(form);
      ['ruolo','azienda','provincia','camion','autisti','fornitore','soluzione','test','nome','whatsapp','email','messaggio'].forEach(function (k) {
        const v = fd.get(k);
        data[k] = v ? String(v).trim() : '';
      });
      data.problema  = fd.getAll('problema');
      data.vantaggio = fd.getAll('vantaggio');
      return data;
    }

    function restoreValues(v) {
      if (!v) return;
      Object.keys(v).forEach(function (name) {
        const value = v[name];
        if (Array.isArray(value)) {
          value.forEach(function (val) {
            const el = form.querySelector('input[name="' + name + '"][value="' + cssEscape(val) + '"]');
            if (el) el.checked = true;
          });
          const grp = form.querySelector('input[name="' + name + '"]');
          if (grp) {
            const wrap = grp.closest('[data-multi-max]');
            if (wrap) {
              const max = parseInt(wrap.dataset.multiMax, 10) || 99;
              const ch = wrap.querySelectorAll('input[type="checkbox"]:checked');
              if (ch.length >= max) wrap.querySelectorAll('input[type="checkbox"]:not(:checked)').forEach(c => c.disabled = true);
            }
          }
        } else if (typeof value === 'string') {
          if (name === 'whatsapp') {
            applyPhoneRestore(value);
            return;
          }
          const radios = form.querySelectorAll('input[name="' + name + '"]');
          if (radios.length && (radios[0].type === 'radio' || radios[0].type === 'checkbox')) {
            radios.forEach(function (r) { if (r.value === value) r.checked = true; });
          } else {
            const txt = form.querySelector('[name="' + name + '"]');
            if (txt) txt.value = value;
          }
        }
      });
    }

    function cssEscape(s) {
      return String(s).replace(/(["\\])/g, '\\$1');
    }

    function hasAnyAnswer() {
      const v = collectValues();
      return Object.values(v).some(function (val) {
        if (Array.isArray(val)) return val.length > 0;
        return !!val;
      });
    }

    function saveState() {
      try {
        const values = collectValues();
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ values: values, ts: Date.now() }));
      } catch (e) { /* quota or private mode */ }
    }

    function clearState() {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    }

    // Submission with retry
    function submitForm() {
      const payload = buildPayload(collectValues());
      hideError();
      doSubmit(payload, 0);
    }

    function buildPayload(values) {
      return {
        ruolo: values.ruolo,
        azienda: values.azienda,
        provincia: values.provincia,
        camion: values.camion,
        autisti: values.autisti,
        fornitore: values.fornitore,
        problema: values.problema,
        vantaggio: values.vantaggio,
        soluzione: values.soluzione,
        test: values.test,
        nome: values.nome,
        whatsapp: values.whatsapp,
        email: values.email,
        messaggio: values.messaggio,
        meta: {
          submittedAt: new Date().toISOString(),
          pageUrl: location.href,
          pageTitle: document.title,
          userAgent: navigator.userAgent,
          referrer: document.referrer || '',
          source: 'lp-b2b-quiz'
        }
      };
    }

    function doSubmit(payload, attempt) {
      modal.classList.add('is-submitting');
      hideError();
      if (attempt === 0) hideRetry();

      if (typeof navigator.onLine === 'boolean' && navigator.onLine === false) {
        queueAndNotify(payload, 'Sei offline. Salviamo le risposte: verranno inviate appena torna la connessione.');
        return;
      }

      inFlightAbort = new AbortController();
      const tId = setTimeout(function () { try { inFlightAbort.abort(); } catch (e) {} }, REQUEST_TIMEOUT);

      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: inFlightAbort.signal,
        keepalive: true,
        mode: 'cors',
        credentials: 'omit'
      })
        .then(function (res) {
          clearTimeout(tId);
          if (!res.ok) throw new Error('http_' + res.status);
          return res;
        })
        .then(function () {
          modal.classList.remove('is-submitting');
          clearState();
          goToStep('success');
        })
        .catch(function (err) {
          clearTimeout(tId);
          handleFailure(payload, attempt, err);
        });
    }

    function handleFailure(payload, attempt, err) {
      if (attempt < MAX_RETRIES - 1) {
        const delayMs = RETRY_DELAYS[attempt];
        showRetry(attempt + 2, Math.round(delayMs / 1000));
        let remaining = Math.round(delayMs / 1000);
        countdownTimer = setInterval(function () {
          remaining -= 1;
          if (remaining < 0) remaining = 0;
          retrySec.textContent = String(remaining);
        }, 1000);
        retryTimer = setTimeout(function () {
          clearRetry();
          doSubmit(payload, attempt + 1);
        }, delayMs);
      } else {
        modal.classList.remove('is-submitting');
        queueAndNotify(payload, 'Invio non riuscito dopo 3 tentativi. Le risposte sono state salvate localmente: riproveremo automaticamente. Puoi anche ritentare ora.');
      }
    }

    function showRetry(n, s) {
      hideError();
      retryBanner.hidden = false;
      retryN.textContent = '(' + n + '/' + MAX_RETRIES + ')';
      retrySec.textContent = String(s);
    }

    function hideRetry() {
      retryBanner.hidden = true;
    }

    function clearRetry() {
      if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
      if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
      hideRetry();
    }

    function showError(msg) {
      errorMsg.textContent = msg;
      errorBanner.hidden = false;
    }
    function hideError() { errorBanner.hidden = true; }

    function queueAndNotify(payload, msg) {
      queuePayload(payload);
      modal.classList.remove('is-submitting');
      clearRetry();
      showError(msg);
      nextLabel.textContent = 'Riprova invio';
    }

    function queuePayload(payload) {
      try {
        const list = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
        list.push({ payload: payload, ts: Date.now() });
        localStorage.setItem(QUEUE_KEY, JSON.stringify(list));
      } catch (e) { /* ignore */ }
    }

    function drainQueue() {
      let list;
      try { list = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch (e) { list = []; }
      if (!list.length) return;
      if (typeof navigator.onLine === 'boolean' && navigator.onLine === false) return;

      const next = list[0];
      const ac = new AbortController();
      const tId = setTimeout(function () { try { ac.abort(); } catch (e) {} }, REQUEST_TIMEOUT);

      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next.payload),
        signal: ac.signal,
        keepalive: true,
        mode: 'cors',
        credentials: 'omit'
      })
        .then(function (res) {
          clearTimeout(tId);
          if (!res.ok) throw new Error('http_' + res.status);
          list.shift();
          try { localStorage.setItem(QUEUE_KEY, JSON.stringify(list)); } catch (e) {}
          if (list.length) setTimeout(drainQueue, 800);
        })
        .catch(function () {
          clearTimeout(tId);
        });
    }

    // Focus trap
    function trapFocus() {
      const focusable = modal.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      modal.addEventListener('keydown', function trapHandler(e) {
        if (!modal.classList.contains('is-open')) {
          modal.removeEventListener('keydown', trapHandler);
          return;
        }
        if (e.key !== 'Tab') return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      });
      setTimeout(function () {
        try {
          const initial = modal.querySelector('[data-quiz-start]') || modal.querySelector('input, button:not([data-quiz-close])');
          if (initial) initial.focus();
        } catch (e) {}
      }, 50);
    }

  }
})();

(function () {
  if (window.__lpB2bStickyCtaInit) return;
  window.__lpB2bStickyCtaInit = true;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    var btn = document.getElementById('lpB2bStickyCta');
    if (!btn) return;

    // Sticky CTA is visible only when BOTH the hero CTA and the quiz section CTA
    // are off-screen (matches Horizon UX). IntersectionObserver tracks both.
    var triggers = Array.from(document.querySelectorAll('.lp-b2b-hero__cta, .lp-b2b-quiz__cta'));
    if (!triggers.length) return;

    if (!('IntersectionObserver' in window)) {
      setTimeout(function () { btn.classList.add('lp-b2b-sticky-cta--visible'); }, 1200);
      return;
    }

    var visible = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      });
      btn.classList.toggle('lp-b2b-sticky-cta--visible', visible.size === 0);
    }, { threshold: 0.01 });

    triggers.forEach(function (t) { io.observe(t); });
  });
})();
