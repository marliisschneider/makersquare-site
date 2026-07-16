/*
 * Lazy loader for Zoho SalesIQ (chat widget + its GDPR cookie banner).
 *
 * Why: SalesIQ + its injected #gdpr_banner were the mobile LCP element and
 * covered the hero CTA on first paint (PageSpeed audit, Jul 2026). The widget
 * is now loaded on the first user interaction, with an idle fallback ~5s
 * after window load — so nothing SalesIQ renders can be the LCP candidate.
 *
 * Consent semantics are unchanged: the exact same Zoho banner, text, and
 * buttons (Accept All / Preferences) render — just later and visually
 * compact on mobile via the injected CSS below.
 */
(function () {
  'use strict';
  if (window.__msqSiqLazy) { return; }
  window.__msqSiqLazy = true;

  var WIDGET_SRC = 'https://salesiq.zohopublic.com/widget?wc=siq885ea214ffc25f4f452068cc9bc1cec4353b0ff61817b77233444928d383fe96';

  /* Compact styling for the SalesIQ GDPR banner (div#gdpr_banner inside
     #consent_container). Injected before the widget loads so the banner
     never paints at full size. Same DOM, same buttons — smaller footprint. */
  var css =
    '#consent_container{padding:0!important;}' +
    '#gdpr_banner{display:flex!important;align-items:center!important;gap:10px!important;' +
      'padding:8px 12px!important;font-size:11px!important;line-height:1.35!important;}' +
    '#gdpr_banner>span.dib-mid{flex:1 1 auto!important;min-width:0!important;display:block!important;' +
      'font-size:11px!important;line-height:1.35!important;text-align:left!important;}' +
    '#gdpr_banner .zoho-clkoptn{flex:0 0 auto!important;display:flex!important;align-items:center!important;' +
      'gap:6px!important;margin:0!important;padding:0!important;}' +
    '#gdpr_banner .zoho-okbtn{font-size:11px!important;padding:6px 10px!important;margin:0!important;' +
      'white-space:nowrap!important;}';
  var style = document.createElement('style');
  style.id = 'msq-gdpr-compact';
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);

  var EVENTS = ['scroll', 'pointerdown', 'touchstart', 'keydown'];
  var loaded = false;

  function load() {
    if (loaded) { return; }
    loaded = true;
    EVENTS.forEach(function (ev) {
      window.removeEventListener(ev, load, { passive: true });
    });
    var s = document.createElement('script');
    s.id = 'zsiqscript';
    s.defer = true;
    s.src = WIDGET_SRC;
    document.body.appendChild(s);
  }

  EVENTS.forEach(function (ev) {
    window.addEventListener(ev, load, { passive: true, once: true });
  });

  /* Fallback: if the user never interacts, load at browser idle ~5s after
     window load so the chat is still available. */
  function armFallback() {
    setTimeout(function () {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(load, { timeout: 2000 });
      } else {
        load();
      }
    }, 5000);
  }

  if (document.readyState === 'complete') {
    armFallback();
  } else {
    window.addEventListener('load', armFallback, { once: true });
  }
})();
