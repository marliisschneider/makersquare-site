// /api/chat — MakerSquare site assistant (Claude Haiku, grounded on /llms.txt)
// Facts come from the live llms.txt so there is ONE source of truth.
// Requires ANTHROPIC_API_KEY in Vercel env vars.

let factsCache = { text: null, at: 0 };
const FACTS_TTL_MS = 10 * 60 * 1000;

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&amp;/g, '&').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
    .replace(/&middot;/g, '·').replace(/&#8217;|&rsquo;/g, "'").replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&nbsp;/g, ' ').replace(/&rarr;/g, '→')
    .split('\n').map(l => l.trim()).filter(l => l.length > 2).join('\n');
}

async function getFacts(origin) {
  const now = Date.now();
  if (factsCache.text && now - factsCache.at < FACTS_TTL_MS) return factsCache.text;
  const [llms, faq] = await Promise.all([
    fetch(`${origin}/llms.txt`).then(r => r.ok ? r.text() : ''),
    fetch(`${origin}/faq`).then(r => r.ok ? r.text() : '').catch(() => ''),
  ]);
  if (!llms) { const err = new Error('facts unavailable'); err.code = 'facts_fetch'; throw err; }
  const faqText = faq ? `\n\n=== FULL FAQ (published answers) ===\n${stripHtml(faq).slice(0, 18000)}` : '';
  factsCache = { text: llms + faqText, at: now };
  return factsCache.text;
}

const SYSTEM_RULES = `You are the website assistant for MakerSquare, Austin's school of applied AI.

STRICT RULES:
- Answer ONLY from the FACTS document below. If the answer is not in the facts, say you're not certain and suggest booking an intro call for a direct answer.
- Never invent, estimate, or negotiate prices, discounts, dates, or policies. Quote them exactly as written.
- Never promise outcomes, jobs, or specific results.
- Keep answers to 2-4 short sentences, warm and direct, no corporate filler, no emoji.\n- PLAIN TEXT ONLY: no markdown, no asterisks, no bullet formatting — the widget renders raw text.
- If someone asks about training for their company/team, mention private 3-day team workshops and custom programs, and point them to the For Companies page (/corporate) and booking a call.
- If asked something off-topic (not about MakerSquare, AI training, or enrollment), politely steer back in one sentence.
- End answers that show buying intent with a gentle suggestion to book an intro call.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 12)
      return res.status(400).json({ error: 'bad request' });
    for (const m of messages) {
      if (!m || typeof m.content !== 'string' || m.content.length > 1000 ||
          !['user', 'assistant'].includes(m.role))
        return res.status(400).json({ error: 'bad message' });
    }
    const origin = `https://${req.headers['x-forwarded-host'] || req.headers.host}`;
    const facts = await getFacts(origin);

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': (process.env.ANTHROPIC_API_KEY || '').replace(/\s+/g, ''),
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: `${SYSTEM_RULES}\n\n=== FACTS ===\n${facts}`,
        messages,
      }),
    });
    if (!r.ok) { const err = new Error(`upstream ${r.status}`); err.code = 'api_' + r.status; throw err; }
    const data = await r.json();
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    return res.status(200).json({ reply: text || "I'm not sure — the fastest way to get that answered is a quick 15-minute call." });
  } catch (e) {
    console.error('chat error:', e && e.message);
    const code = (e && e.code) || (String(e && e.message).includes('Headers') ? 'key_format' : 'unknown');
    return res.status(200).json({ reply: "I'm having trouble right now. The fastest way to get answers is booking an intro call — the button is right below.", code });
  }
}
