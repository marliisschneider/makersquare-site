/* MakerSquare site assistant widget. Backend: /api/chat (Claude, grounded on /llms.txt).
   Self-contained: injects its own styles. Booking CTA uses the page's lt-modal if present. */
(function () {
  var css = ''
  + '#msc-bubble{position:fixed;right:20px;bottom:20px;z-index:9000;width:56px;height:56px;border-radius:50%;background:#403DD8;border:none;cursor:pointer;box-shadow:0 8px 24px rgba(64,61,216,.45);display:flex;align-items:center;justify-content:center;transition:transform .15s}'
  + '#msc-bubble:hover{transform:scale(1.06)}'
  + '#msc-panel{position:fixed;right:20px;bottom:88px;z-index:9001;width:min(370px,calc(100vw - 32px));max-height:min(560px,calc(100vh - 120px));background:#fff;border-radius:16px;box-shadow:0 24px 64px rgba(24,24,73,.35);display:none;flex-direction:column;overflow:hidden;font-family:Inter,system-ui,sans-serif}'
  + '#msc-panel.open{display:flex}'
  + '#msc-head{background:#181849;color:#fff;padding:14px 16px;font-weight:700;font-size:.95rem;display:flex;justify-content:space-between;align-items:center}'
  + '#msc-head small{display:block;font-weight:500;font-size:.7rem;color:#81AAFB;margin-top:2px}'
  + '#msc-close{background:none;border:none;color:rgba(255,255,255,.6);font-size:1.2rem;cursor:pointer;padding:4px}'
  + '#msc-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#F5F4F0}'
  + '.msc-m{max-width:85%;padding:9px 12px;border-radius:12px;font-size:.85rem;line-height:1.5;white-space:pre-wrap}'
  + '.msc-bot{background:#fff;color:#181849;border:1px solid rgba(24,24,73,.08);align-self:flex-start;border-bottom-left-radius:4px}'
  + '.msc-user{background:#403DD8;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}'
  + '#msc-chips{display:flex;gap:6px;flex-wrap:wrap;padding:0 14px 10px;background:#F5F4F0}'
  + '.msc-chip{font-size:.72rem;font-weight:600;color:#403DD8;background:#fff;border:1px solid rgba(64,61,216,.3);border-radius:999px;padding:6px 12px;cursor:pointer}'
  + '.msc-chip:hover{background:rgba(64,61,216,.06)}'
  + '#msc-form{display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(24,24,73,.08);background:#fff}'
  + '#msc-in{flex:1;border:1px solid rgba(24,24,73,.15);border-radius:10px;padding:9px 12px;font-size:.85rem;font-family:inherit;outline:none}'
  + '#msc-in:focus{border-color:#403DD8}'
  + '#msc-send{background:#403DD8;color:#fff;border:none;border-radius:10px;padding:0 14px;font-weight:700;cursor:pointer;font-size:.85rem}'
  + '#msc-foot{padding:10px 14px;background:#fff;border-top:1px solid rgba(24,24,73,.06);text-align:center}'
  + '#msc-foot button,#msc-foot a{background:none;border:none;color:#403DD8;font-weight:700;font-size:.8rem;cursor:pointer;text-decoration:none;font-family:inherit}'
  + '.msc-typing{opacity:.55;font-style:italic}'
  + '@media (max-width:480px){#msc-panel{right:8px;bottom:80px}}';
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
  + '<button id="msc-bubble" aria-label="Ask MakerSquare a question"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>'
  + '<div id="msc-panel" role="dialog" aria-label="MakerSquare assistant">'
  +   '<div id="msc-head"><div>Ask MakerSquare<small>Answers from our real program info</small></div><button id="msc-close" aria-label="Close">&times;</button></div>'
  +   '<div id="msc-msgs"></div>'
  +   '<div id="msc-chips"></div>'
  +   '<form id="msc-form"><input id="msc-in" type="text" maxlength="500" placeholder="Type a question&hellip;" autocomplete="off"><button id="msc-send" type="submit">Ask</button></form>'
  +   '<div id="msc-foot"></div>'
  + '</div>';
  document.body.appendChild(root);

  var panel = document.getElementById('msc-panel'), msgs = document.getElementById('msc-msgs'),
      input = document.getElementById('msc-in'), history = [], busy = false;

  // Footer CTA: use the booking modal when the page has it, else link to the corporate contact form
  var foot = document.getElementById('msc-foot');
  if (document.getElementById('lt-modal')) {
    foot.innerHTML = '<button type="button" data-msc-call>Prefer a human? Book a 15-min call &rarr;</button>';
    foot.firstChild.addEventListener('click', function () {
      var t = document.querySelector('[data-lt-trigger]'); if (t) t.click();
    });
  } else {
    foot.innerHTML = '<a href="/corporate#contact">Prefer a human? Book a 15-min call &rarr;</a>';
  }

  var chipRow = document.getElementById('msc-chips');
  CHIPS.forEach(function (c) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'msc-chip'; b.textContent = c[0];
    b.addEventListener('click', function () { send(c[1]); });
    chipRow.appendChild(b);
  });

  function add(role, text) {
    var d = document.createElement('div');
    d.className = 'msc-m ' + (role === 'user' ? 'msc-user' : 'msc-bot');
    d.textContent = text; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d;
  }

  function send(text) {
    if (busy || !text.trim()) return;
    busy = true; add('user', text);
    history.push({ role: 'user', content: text });
    var typing = add('bot', 'Thinking…'); typing.classList.add('msc-typing');
    fetch('/api/chat', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-8) })
    }).then(function (r) { return r.json(); }).then(function (d) {
      typing.remove();
      var reply = d.reply || 'Something went wrong — try the Book a Call button below.';
      add('bot', reply); history.push({ role: 'assistant', content: reply });
    }).catch(function () {
      typing.remove(); add('bot', 'I’m having trouble right now — the Book a Call button below is the fastest path.');
    }).finally(function () { busy = false; });
  }

  document.getElementById('msc-form').addEventListener('submit', function (e) {
    e.preventDefault(); var v = input.value; input.value = ''; send(v);
  });
  document.getElementById('msc-bubble').addEventListener('click', function () {
    var open = panel.classList.toggle('open');
    if (open && !msgs.children.length)
      add('bot', 'Hi! Ask me anything about MakerSquare — the 2-week program, team training, workshops, pricing, dates. Or tap a question below.');
    if (open) input.focus();
    if (window.dataLayer) window.dataLayer.push({ event: 'msc_chat_open' });
  });
  document.getElementById('msc-close').addEventListener('click', function () { panel.classList.remove('open'); });
})();
