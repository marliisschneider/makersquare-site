/* ms-workshops.js — single source of truth for which workshop is "next up".
 *
 * Why this exists: the Sep workshop's early-bird deadline was extended three
 * times (Aug 21 -> Aug 26 -> Aug 30) and every extension meant hand-editing
 * ~17 places across workshops.html, index.html and workshop-register.html.
 * On Sep 3 2026 the site was still advertising the expired $999 while Stripe
 * charged $1,199. This rolls forward on its own instead.
 *
 * It drives the /workshops spotlight and the homepage fall-workshops bar.
 * It does NOT drive workshop-register.html — that page owns the Stripe links
 * and has its own date logic. Keep the dates below in sync with the WS2 /
 * WSOCT / WSNOV consts there; those remain the payment source of truth.
 */
(function () {
  'use strict';

  var WORKSHOPS = [
    {
      key: 'sep',
      titleA: 'Build Your First', titleB: 'AI Agent.',
      dates: 'Sep 11&ndash;13', startLabel: 'Sep 11',
      start: '2026-09-11T09:00:00-05:00',
      finish: '2026-09-13T23:59:59-05:00',
      earlyBirdEnds: '2026-08-30T23:59:59-05:00', earlyBirdLabel: 'Aug 30',
      desc: 'One weekend &mdash; Sep 11&ndash;13, Fri to Sun in Austin. Walk out Sunday with a working agent running on your own data. No time off work, no boss to ask.',
      bullet: 'Your first agent deployed on a schedule &mdash; by 5pm Day 1'
    },
    {
      key: 'oct',
      titleA: 'Automate Your Ops', titleB: 'with AI.',
      dates: 'Oct 16&ndash;18', startLabel: 'Oct 16',
      start: '2026-10-16T09:00:00-05:00',
      finish: '2026-10-18T23:59:59-05:00',
      earlyBirdEnds: '2026-09-25T23:59:59-05:00', earlyBirdLabel: 'Sep 25',
      desc: 'One weekend &mdash; Oct 16&ndash;18, Fri to Sun in Austin. Walk out Sunday with your recurring ops work running itself. No time off work, no boss to ask.',
      bullet: 'A weekly report that writes itself from your live sources'
    },
    {
      key: 'nov',
      titleA: 'Build Your First', titleB: 'App with AI.',
      dates: 'Nov 6&ndash;8', startLabel: 'Nov 6',
      start: '2026-11-06T09:00:00-06:00',
      finish: '2026-11-08T23:59:59-06:00',
      earlyBirdEnds: '2026-10-16T23:59:59-05:00', earlyBirdLabel: 'Oct 16',
      desc: 'One weekend &mdash; Nov 6&ndash;8, Fri to Sun in Austin. Walk out Sunday with a live app and a real database behind it. No time off work, no boss to ask.',
      bullet: 'A real database behind it &mdash; live forms writing real rows'
    }
  ];

  var EARLY_BIRD = '$999';
  var REGULAR = '$1,199';

  // The next workshop that hasn't finished yet.
  function nextUp(now) {
    for (var i = 0; i < WORKSHOPS.length; i++) {
      if (new Date(WORKSHOPS[i].finish) > now) return WORKSHOPS[i];
    }
    return null;
  }

  function state(w, now) {
    var ebActive = now < new Date(w.earlyBirdEnds);
    return {
      w: w,
      ebActive: ebActive,
      price: ebActive ? EARLY_BIRD : REGULAR,
      // Count to the price deadline while one is live; otherwise to the
      // workshop itself, which is a date that never needs editing.
      target: ebActive ? new Date(w.earlyBirdEnds) : new Date(w.start),
      label: ebActive
        ? '&#9201; until the ' + EARLY_BIRD + ' early bird ends (' + w.earlyBirdLabel + ')'
        : '&#9201; until the workshop begins (' + w.startLabel + ')'
    };
  }

  function set(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
    return el;
  }
  function hide(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  /* ---------------------------------------------------------------- /workshops */
  function spotlight() {
    if (!document.getElementById('sps-countdown')) return;
    var s = state(nextUp(new Date()) || WORKSHOPS[WORKSHOPS.length - 1], new Date());

    if (!nextUp(new Date())) {           // season over: don't advertise a past date
      hide('sep-spotlight');
      return;
    }

    set('sps-title', s.w.titleA + '<br><span style="color:#81AAFB;">' + s.w.titleB + '</span>');
    set('sps-desc', s.w.desc);
    set('sps-price', s.price);
    set('sps-price-note', s.ebActive ? REGULAR + ' after ' + s.w.earlyBirdLabel : '3 days &middot; Fri&ndash;Sun');
    set('sps-b1', '<span>&#10003;</span>' + s.w.bullet);
    set('sps-cd-label', s.label);

    (function tick() {
      var d = s.target - Date.now();
      var D = document.getElementById('sps-d');
      if (!D) return;
      if (d <= 0) {                       // never sit on 0 0 0 — that was the bug
        hide('sps-countdown');
        hide('sps-cd-label');
        return;
      }
      D.textContent = Math.floor(d / 864e5);
      document.getElementById('sps-h').textContent = pad(Math.floor(d % 864e5 / 36e5));
      document.getElementById('sps-m').textContent = pad(Math.floor(d % 36e5 / 6e4));
      setTimeout(tick, 60000);
    })();
  }

  /* ------------------------------------------------------------- homepage bar */
  function homepageBar() {
    var el = document.getElementById('fw-cd');
    if (!el) return;
    var w = nextUp(new Date());
    if (!w) { el.textContent = 'Workshops return in 2027'; return; }
    var s = state(w, new Date());

    (function tick() {
      var d = s.target - Date.now();
      if (d <= 0) {
        el.innerHTML = s.w.dates + ' &middot; ' + REGULAR + ' &middot; Austin';
        return;
      }
      var days = Math.floor(d / 864e5), hrs = Math.floor(d % 864e5 / 36e5);
      el.innerHTML = s.ebActive
        ? s.w.dates + ' early bird ' + EARLY_BIRD + ' &mdash; ' + days + 'd ' + hrs + 'h left'
        : s.w.titleB.replace('.', '') + ' workshop &mdash; ' + days + 'd ' + hrs + 'h away';
      setTimeout(tick, 60000);
    })();

    var card = document.getElementById('fw-next-price');
    if (card) card.innerHTML = s.price + ' &middot; ' + s.w.dates + ' &rarr;';

    // This card names a price and a date together, so it goes stale the same
    // way the banner did. Roll it too.
    var bento = document.getElementById('fw-bento-price');
    if (bento) bento.innerHTML = s.price + ' \u00b7 next ' + s.w.dates + '.';
  }

  function init() { spotlight(); homepageBar(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
