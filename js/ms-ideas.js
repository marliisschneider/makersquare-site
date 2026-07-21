/* MakerSquare "What would you build?" widgets. Mount points:
   <div data-ms-ideas="individual"> (homepage) · <div data-ms-ideas="team"> (/corporate)
   Backend: /api/ideas. Self-contained styles. */
(function () {
  var css = ''
  + '@keyframes miPop{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}'
  + '.mi-form{display:flex;gap:10px;max-width:640px;margin:0 auto;flex-wrap:wrap}'
  + '.mi-in{flex:1;min-width:240px;border:1.5px solid rgba(24,24,73,.15);border-radius:12px;padding:13px 16px;font-size:.95rem;font-family:inherit;outline:none;transition:border-color .15s,box-shadow .15s}'
  + '.mi-in:focus{border-color:#403DD8;box-shadow:0 0 0 3px rgba(64,61,216,.12)}'
  + '.mi-btn{background:linear-gradient(135deg,#403DD8,#5a57e8);color:#fff;border:none;border-radius:12px;padding:13px 24px;font-weight:700;cursor:pointer;font-size:.95rem;font-family:inherit;transition:transform .15s;box-shadow:0 6px 18px rgba(64,61,216,.35);white-space:nowrap}'
  + '.mi-btn:hover{transform:translateY(-1px)}'
  + '.mi-btn[disabled]{opacity:.6;cursor:wait}'
  + '.mi-note{text-align:center;font-size:.75rem;color:var(--text-muted,#6b6b8f);margin-top:10px}'
  + '.mi-out{margin-top:26px}'
  + '.mi-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}'
  + '.mi-card{background:#fff;border:1px solid rgba(64,61,216,.16);border-radius:16px;padding:20px;animation:miPop .35s cubic-bezier(.34,1.56,.64,1) both;box-shadow:0 6px 24px rgba(24,24,73,.08);text-align:left}'
  + '.mi-card:nth-child(2){animation-delay:.08s}.mi-card:nth-child(3){animation-delay:.16s}'
  + '.mi-card h4{font-family:Fustat,Inter,sans-serif;font-size:1rem;font-weight:800;color:#181849;margin:0 0 6px}'
  + '.mi-card p{font-size:.84rem;color:#4b4b6a;line-height:1.6;margin:0 0 10px}'
  + '.mi-tools{font-size:.68rem;font-weight:700;color:#403DD8;text-transform:uppercase;letter-spacing:.06em}'
  + '.mi-day{background:#fff;border:1px solid rgba(64,61,216,.16);border-radius:16px;padding:18px 20px;animation:miPop .35s cubic-bezier(.34,1.56,.64,1) both;box-shadow:0 6px 24px rgba(24,24,73,.08);text-align:left;margin-bottom:12px}'
  + '.mi-day:nth-child(2){animation-delay:.08s}.mi-day:nth-child(3){animation-delay:.16s}.mi-day:nth-child(4){animation-delay:.24s}'
  + '.mi-day b{font-family:Fustat,Inter,sans-serif;color:#403DD8;font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:4px}'
  + '.mi-day span{font-size:.87rem;color:#33334f;line-height:1.6}'
  + '.mi-outcome{background:linear-gradient(135deg,#181849,#23237a);border-radius:16px;padding:18px 20px;color:#fff}'
  + '.mi-outcome b{color:#81AAFB}'
  + '.mi-cta{text-align:center;margin-top:22px}'
  + '.mi-err{text-align:center;color:#6b6b8f;font-size:.88rem;margin-top:16px}'
  + '@media(max-width:820px){.mi-cards{grid-template-columns:1fr}}';
  var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  document.querySelectorAll('[data-ms-ideas]').forEach(function (root) {
    var mode = root.getAttribute('data-ms-ideas');
    var placeholder = mode === 'team'
      ? 'e.g. 8-person ops team at a title company — drowning in document review'
      : 'e.g. I run a small property management company in Austin';
    root.innerHTML = ''
      + '<form class="mi-form"><input class="mi-in" type="text" maxlength="300" placeholder="' + placeholder + '" autocomplete="off">'
      + '<button class="mi-btn" type="submit">' + (mode === 'team' ? 'Sketch our 3 days' : 'Show me') + ' &rarr;</button></form>'
      + '<div class="mi-note">Generated live by Claude from our real curriculum &mdash; the same way you&#8217;ll learn to build.</div>'
      + '<div class="mi-out"></div>';
    var form = root.querySelector('form'), input = root.querySelector('.mi-in'),
        btn = root.querySelector('.mi-btn'), out = root.querySelector('.mi-out');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim(); if (v.length < 5 || btn.disabled) return;
      btn.disabled = true; btn.textContent = 'Building…';
      out.innerHTML = '';
      if (window.dataLayer) window.dataLayer.push({ event: 'ms_ideas_submit', ideas_mode: mode });
      fetch('/api/ideas', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: mode, input: v }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.error || !d.result) throw new Error('bad');
        if (mode === 'team') {
          var t = d.result;
          out.innerHTML = '<div class="mi-day"><b>Day 1</b><span>' + esc(t.day1) + '</span></div>'
            + '<div class="mi-day"><b>Day 2</b><span>' + esc(t.day2) + '</span></div>'
            + '<div class="mi-day"><b>Day 3</b><span>' + esc(t.day3) + '</span></div>'
            + '<div class="mi-day mi-outcome"><b>By Friday</b><span>' + esc(t.outcome) + '</span></div>'
            + '<div class="mi-cta"><a href="#contact" class="btn btn-primary btn-arrow">Get the real proposal &mdash; within 24 hours </a></div>';
        } else {
          var cards = d.result.map(function (c) {
            return '<div class="mi-card"><h4>' + esc(c.title) + '</h4><p>' + esc(c.what) + '</p><div class="mi-tools">' + esc(c.tools) + '</div></div>';
          }).join('');
          var cta = document.getElementById('lt-modal')
            ? '<button type="button" class="btn btn-primary btn-arrow" data-mi-call>Want to build these for real? Book an intro call </button>'
            : '<a href="/corporate#contact" class="btn btn-primary btn-arrow">Want to build these for real? Book an intro call </a>';
          out.innerHTML = '<div class="mi-cards">' + cards + '</div><div class="mi-cta">' + cta + '</div>';
          var callBtn = out.querySelector('[data-mi-call]');
          if (callBtn) callBtn.addEventListener('click', function () {
            var t = document.querySelector('[data-lt-trigger]'); if (t) t.click();
          });
        }
      })
      .catch(function () {
        out.innerHTML = '<div class="mi-err">Couldn&#8217;t generate right now &mdash; but a human can: book an intro call and we&#8217;ll sketch it together.</div>';
      })
      .finally(function () { btn.disabled = false; btn.textContent = (mode === 'team' ? 'Sketch our 3 days' : 'Show me') + ' →'; });
    });
  });

  function esc(s) { var d = document.createElement('div'); d.textContent = String(s || ''); return d.innerHTML; }
})();
