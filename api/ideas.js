// /api/ideas — personalized build-idea generator (Claude Haiku).
// mode "individual": 3 tools a person could build in the 2-week program.
// mode "team": instant sketch of a private 3-day workshop agenda.
// Requires ANTHROPIC_API_KEY (shared with /api/chat).

const STACK = 'Claude, Claude Code, Claude Skills, Supabase, Vercel, Composio, Playwright, Whisper, ElevenLabs, GitHub';

const PROMPTS = {
  individual: `You suggest what a specific person could build during MakerSquare's 2-week in-person AI program in Austin. Students are non-technical professionals; they ship real deployed tools using: ${STACK}.
Given the person's description, return STRICT JSON only — an array of exactly 3 objects: {"title": "...", "what": "...", "tools": "..."}.
FIRST, silently identify what actually constrains their business (demand, time, errors, follow-up) and pick the 3 tools that attack those constraints — analyzing their existing data and automating their outreach usually beat customer-facing chatbots; never suggest a chatbot unless inbound volume is clearly their pain.
Rules: each tool must be realistic for a non-engineer to build in 2 weeks with instructor help; "what" is one concrete sentence about what it does for THEIR work (use their industry's language); "tools" lists 2-4 tool names from the stack; no revenue or outcome promises, no percentages; no markdown; JSON only.`,
  team: `You sketch a draft agenda for MakerSquare's private 3-day AI workshop for a specific company team. Non-technical teams build real working automation with: ${STACK}.
FIRST, silently diagnose their actual business problem from the description: what genuinely drives it? (e.g., a taproom struggling for foot traffic has a demand problem — the levers are analyzing their own sales/POS data for patterns, event marketing, and outreach — NOT answering inquiries faster.) Then design the 3 days around the HIGHEST-LEVERAGE workflow for that root problem.
NEVER default to a customer-facing chatbot unless high inbound volume is explicitly their stated pain. Prefer: analyzing the data they already have, automating their marketing/outreach, and removing their biggest manual time sink.
Return STRICT JSON only: {"day1": "...", "day2": "...", "day3": "...", "outcome": "..."}.
Rules: day1 = map their real workflows/data and first hands-on build; day2 = build the main system on their actual data/tools; day3 = harden, connect outputs, live demo to their own team; each day is 1-2 concrete sentences in their industry's language; "outcome" is one sentence on what runs by Friday — no percentages, no dollar figures, no numeric promises; realistic; no markdown; JSON only.`,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const { mode, input } = req.body || {};
    if (!PROMPTS[mode] || typeof input !== 'string' || input.trim().length < 5 || input.length > 400)
      return res.status(400).json({ error: 'bad request' });

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': (process.env.ANTHROPIC_API_KEY || '').replace(/\s+/g, ''),
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 900,
        system: PROMPTS[mode],
        messages: [{ role: 'user', content: input.trim() }],
      }),
    });
    if (!r.ok) { const err = new Error('upstream ' + r.status); err.code = 'api_' + r.status; throw err; }
    const data = await r.json();
    let text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
    text = text.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    const first = Math.min(...['{', '['].map(c => { const i = text.indexOf(c); return i === -1 ? Infinity : i; }));
    const last = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
    if (first === Infinity || last <= first) throw new Error('no json');
    const parsed = JSON.parse(text.slice(first, last + 1));
    return res.status(200).json({ result: parsed });
  } catch (e) {
    console.error('ideas error:', e && e.message);
    const code = (e && e.code) || (e instanceof SyntaxError || String(e && e.message).includes('json') ? 'parse' : 'unknown');
    return res.status(200).json({ error: 'unavailable', code });
  }
}
