/* MakerSquare site assistant widget v2 — showcase edition.
   Backend: /api/chat (Claude, grounded on live /llms.txt + /faq).
   Self-contained; booking CTA uses the page's lt-modal when present. */
(function () {
  var css = ''
  + '@keyframes mscSpin{to{transform:rotate(360deg)}}'
  + '@keyframes mscIn{from{opacity:0;transform:translateY(18px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}'
  + '@keyframes mscMsg{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}'
  + '@keyframes mscDot{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-4px);opacity:1}}'
  + '@keyframes mscLive{0%,100%{opacity:1}50%{opacity:.35}}'
  + '@keyframes mscRule{0%{background-position:0% 0}100%{background-position:200% 0}}'
  + '#msc-bubble{position:fixed;right:20px;bottom:20px;z-index:9000;width:62px;height:62px;border-radius:50%;background:linear-gradient(135deg,#1d1d5c,#403DD8);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .2s cubic-bezier(.34,1.56,.64,1);box-shadow:0 8px 26px rgba(64,61,216,.4)}'
  + '#msc-bubble::before{content:"";position:absolute;inset:-2px;border-radius:50%;background:conic-gradient(from 0deg,#403DD8,#81AAFB,#e8ecff,#403DD8);animation:mscSpin 5s linear infinite;z-index:-1;filter:blur(1.5px);opacity:.85}'
  + '#msc-bubble:hover{transform:scale(1.1) rotate(-4deg)}'
  + '#msc-panel{position:fixed;right:20px;bottom:94px;z-index:9001;width:min(392px,calc(100vw - 32px));max-height:min(610px,calc(100vh - 126px));background:linear-gradient(180deg,#16164a 0%,#0e0e2e 100%);border-radius:20px;box-shadow:0 0 0 1px rgba(129,170,251,.28),0 34px 90px rgba(5,5,25,.7),0 0 70px rgba(64,61,216,.3);display:none;flex-direction:column;overflow:hidden;font-family:Inter,system-ui,sans-serif}'
  + '#msc-panel::before{content:"";position:absolute;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,.035) 1px,transparent 1px);background-size:18px 18px;pointer-events:none}'
  + '#msc-panel.open{display:flex;animation:mscIn .35s cubic-bezier(.34,1.56,.64,1)}'
  + '#msc-head{padding:16px 18px 13px;position:relative;z-index:1}'
  + '#msc-head::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;background:linear-gradient(90deg,#403DD8,#81AAFB,#403DD8,#81AAFB);background-size:200% 100%;animation:mscRule 4s linear infinite}'
  + '#msc-head-row{display:flex;align-items:center;gap:10px}'
  + '#msc-logo{width:36px;height:36px;border-radius:11px;background:linear-gradient(135deg,#403DD8,#5a57e8);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:Fustat,Inter,sans-serif;font-weight:800;font-size:1.05rem;color:#fff;box-shadow:0 0 18px rgba(64,61,216,.6)}'
  + '#msc-title{font-weight:800;font-size:1rem;font-family:Fustat,Inter,sans-serif;letter-spacing:-.01em;color:#fff}'
  + '#msc-sub{font-size:.68rem;color:#81AAFB;font-weight:600;margin-top:2px;display:flex;align-items:center;gap:5px}'
  + '#msc-sub i{width:6px;height:6px;border-radius:50%;background:#22c55e;display:inline-block;animation:mscLive 2s ease-in-out infinite;font-style:normal;box-shadow:0 0 8px rgba(34,197,94,.8)}'
  + '#msc-close{background:none;border:none;color:rgba(255,255,255,.5);font-size:1.3rem;cursor:pointer;padding:4px;margin-left:auto;transition:color .15s}'
  + '#msc-close:hover{color:#fff}'
  + '#msc-msgs{flex:1;overflow-y:auto;padding:16px 14px;display:flex;flex-direction:column;gap:12px;position:relative;z-index:1;scrollbar-width:thin;scrollbar-color:rgba(129,170,251,.3) transparent}'
  + '.msc-row{display:flex;gap:8px;align-items:flex-end;animation:mscMsg .25s ease-out}'
  + '.msc-row.user{flex-direction:row-reverse}'
  + '.msc-av{width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,#403DD8,#5a57e8);color:#fff;display:flex;align-items:center;justify-content:center;font-size:.62rem;font-weight:800;font-family:Fustat,Inter,sans-serif;flex-shrink:0;box-shadow:0 0 10px rgba(64,61,216,.5)}'
  + '.msc-m{max-width:82%;padding:10px 13px;border-radius:14px;font-size:.86rem;line-height:1.55;white-space:pre-wrap}'
  + '.msc-bot .msc-m{background:rgba(255,255,255,.055);color:#E8EAF8;border:1px solid rgba(129,170,251,.18);border-bottom-left-radius:4px}'
  + '.msc-user .msc-m{background:linear-gradient(135deg,#403DD8,#4f4ce2);color:#fff;border-bottom-right-radius:4px;box-shadow:0 4px 16px rgba(64,61,216,.4)}'
  + '.msc-typing{display:inline-flex;gap:4px;padding:12px 14px}'
  + '.msc-typing i{width:6px;height:6px;border-radius:50%;background:#81AAFB;animation:mscDot 1.1s infinite;font-style:normal}'
  + '.msc-typing i:nth-child(2){animation-delay:.15s}.msc-typing i:nth-child(3){animation-delay:.3s}'
  + '#msc-chips{display:flex;gap:6px;flex-wrap:wrap;padding:2px 14px 12px;position:relative;z-index:1}'
  + '.msc-chip{font-size:.72rem;font-weight:700;color:#A8C2FA;background:rgba(129,170,251,.08);border:1px solid rgba(129,170,251,.3);border-radius:999px;padding:7px 13px;cursor:pointer;transition:all .15s}'
  + '.msc-chip:hover{transform:translateY(-1px);border-color:#81AAFB;color:#fff;box-shadow:0 0 16px rgba(129,170,251,.35)}'
  + '#msc-form{display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(129,170,251,.12);position:relative;z-index:1}'
  + '#msc-in{flex:1;border:1.5px solid rgba(129,170,251,.22);border-radius:12px;padding:10px 13px;font-size:.86rem;font-family:inherit;outline:none;background:rgba(255,255,255,.06);color:#fff;transition:border-color .15s,box-shadow .15s}'
  + '#msc-in::placeholder{color:rgba(255,255,255,.35)}'
  + '#msc-in:focus{border-color:#81AAFB;box-shadow:0 0 0 3px rgba(129,170,251,.18)}'
  + '#msc-send{background:linear-gradient(135deg,#403DD8,#5a57e8);color:#fff;border:none;border-radius:12px;padding:0 16px;font-weight:700;cursor:pointer;font-size:.86rem;transition:transform .15s;box-shadow:0 4px 14px rgba(64,61,216,.4)}'
  + '#msc-send:hover{transform:translateY(-1px)}'
  + '#msc-foot{padding:11px 14px;border-top:1px solid rgba(129,170,251,.1);text-align:center;position:relative;z-index:1}'
  + '#msc-foot button,#msc-foot a{background:none;border:none;color:#81AAFB;font-weight:700;font-size:.8rem;cursor:pointer;text-decoration:none;font-family:inherit}'
  + '#msc-foot button:hover,#msc-foot a:hover{color:#fff}'
  + '@media (max-width:480px){#msc-panel{right:8px;bottom:86px}}'
  + '@media (prefers-reduced-motion:reduce){#msc-bubble::before,#msc-panel.open,.msc-row,#msc-head::after,#msc-sub i{animation:none}}';
  var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  var CHIPS = [
    ['Price', 'How much does the 2-week program cost?'],
    ['Next dates', 'When does the next cohort start and when does enrollment close?'],
    ['For my team', 'Do you offer AI training for company teams?'],
    ['Workshops', 'What 3-day workshops are coming up?'],
    ['No coding?', 'Do I need a coding background to join?']
  ];

  var root = document.createElement('div');
  root.innerHTML = ''
  + '<button id="msc-bubble" aria-label="Ask MakerSquare a question"><svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>'
  + '<div id="msc-panel" role="dialog" aria-label="MakerSquare assistant">'
  +   '<div id="msc-head"><div id="msc-head-row"><div id="msc-logo">M</div><div><div id="msc-title">Ask MakerSquare</div><div id="msc-sub"><i></i>Built with Claude &mdash; the way we teach it</div></div><button id="msc-close" aria-label="Close">&times;</button></div></div>'
  +   '<div id="msc-msgs"></div>'
  +   '<div id="msc-chips"></div>'
  +   '<form id="msc-form"><input id="msc-in" type="text" maxlength="500" placeholder="Type a question&hellip;" autocomplete="off"><button id="msc-send" type="submit">Ask</button></form>'
  +   '<div id="msc-foot"></div>'
  + '</div>';
  document.body.appendChild(root);

  var panel = document.getElementById('msc-panel'), msgs = document.getElementById('msc-msgs'),
      input = document.getElementById('msc-in'), history = [], busy = false;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var foot = document.getElementById('msc-foot');
  if (document.getElementById('lt-modal')) {
    foot.innerHTML = '<button type="button">Prefer a human? Book an intro call &rarr;</button>';
    foot.firstChild.addEventListener('click', function () {
      var t = document.querySelector('[data-lt-trigger]'); if (t) t.click();
    });
  } else {
    foot.innerHTML = '<a href="/corporate#contact">Prefer a human? Book an intro call &rarr;</a>';
  }

  var chipRow = document.getElementById('msc-chips');
  CHIPS.forEach(function (c) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'msc-chip'; b.textContent = c[0];
    b.addEventListener('click', function () { send(c[1]); });
    chipRow.appendChild(b);
  });

  function row(role) {
    var r = document.createElement('div'); r.className = 'msc-row ' + (role === 'user' ? 'user msc-user' : 'msc-bot');
    if (role !== 'user') { var av = document.createElement('div'); av.className = 'msc-av'; av.textContent = 'M'; r.appendChild(av); }
    var m = document.createElement('div'); m.className = 'msc-m'; r.appendChild(m);
    msgs.appendChild(r); msgs.scrollTop = msgs.scrollHeight;
    return m;
  }

  function typewriter(el, text) {
    if (reduced) { el.textContent = text; msgs.scrollTop = msgs.scrollHeight; return; }
    var i = 0, step = Math.max(1, Math.round(text.length / 90));
    (function tick() {
      i = Math.min(text.length, i + step);
      el.textContent = text.slice(0, i);
      msgs.scrollTop = msgs.scrollHeight;
      if (i < text.length) setTimeout(tick, 16);
    })();
  }

  function send(text) {
    if (busy || !text.trim()) return;
    busy = true;
    row('user').textContent = text;
    history.push({ role: 'user', content: text });
    var t = document.createElement('div'); t.className = 'msc-row msc-bot';
    t.innerHTML = '<div class="msc-av">M</div><div class="msc-m msc-typing"><i></i><i></i><i></i></div>';
    msgs.appendChild(t); msgs.scrollTop = msgs.scrollHeight;
    fetch('/api/chat', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-8) })
    }).then(function (r) { return r.json(); }).then(function (d) {
      t.remove();
      var reply = d.reply || 'Something went wrong — try the Book a Call button below.';
      typewriter(row('bot'), reply);
      history.push({ role: 'assistant', content: reply });
    }).catch(function () {
      t.remove(); row('bot').textContent = 'I’m having trouble right now — the Book a Call button below is the fastest path.';
    }).finally(function () { busy = false; });
  }

  document.getElementById('msc-form').addEventListener('submit', function (e) {
    e.preventDefault(); var v = input.value; input.value = ''; send(v);
  });
  document.getElementById('msc-bubble').addEventListener('click', function () {
    var open = panel.classList.toggle('open');
    if (open && !msgs.children.length)
      typewriter(row('bot'), 'Hi! Ask me anything about MakerSquare — the 2-week program, team training, workshops, pricing, dates. Or tap a question below.');
    if (open) input.focus();
    if (window.dataLayer) window.dataLayer.push({ event: 'msc_chat_open' });
  });
  document.getElementById('msc-close').addEventListener('click', function () { panel.classList.remove('open'); });
})();
