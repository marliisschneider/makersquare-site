// /api/ideas — personalized build-idea generator (Claude Haiku).
// mode "individual": 3 tools a person could build in the 2-week program.
// mode "team": instant sketch of a private 3-day workshop agenda.
// Requires ANTHROPIC_API_KEY (shared with /api/chat).

const STACK = 'Claude, Claude Code, Claude Skills, Supabase, Vercel, Lovable, Composio, Playwright, Whisper, ElevenLabs, GitHub';

const PROMPTS = {
  individual: `You suggest what a specific person could build during MakerSquare's 2-week in-person AI program in Austin. Students are non-technical professionals; they ship real deployed tools using: ${STACK}.
Given the person's description, return STRICT JSON only — an array of exactly 3 objects: {"title": "...", "what": "...", "tools": "..."}.
Rules: each tool must be realistic for a non-engineer to build in 2 weeks with instructor help; "what" is one concrete sentence about what it does for THEIR work (use their industry's language); "tools" lists 2-4 tool names from the stack; no revenue or outcome promises; no markdown; JSON only.`,
  team: `You sketch a draft agenda for MakerSquare's private 3-day AI workshop for a specific company team. Non-technical teams build real working automation with: ${STACK}.
Given the team's description, return STRICT JSON only: {"day1": "...", "day2": "...", "day3": "...", "outcome": "..."}.
Rules: day1 = map their real workflows and first hands-on build; day2 = build the main automation on their actual data/tools; day3 = harden, connect outputs, live demo to their own team; each day is 1-2 concrete sentences in their industry's language; "outcome" is one sentence on what runs by Friday; realistic, no pricing, no promises of specific dollar results; no markdown; JSON only.`,
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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: PROMPTS[mode],
        messages: [{ role: 'user', content: input.trim() }],
      }),
    });
    if (!r.ok) throw new Error('upstream ' + r.status);
    const data = await r.json();
    let text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
    text = text.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(text);
    return res.status(200).json({ result: parsed });
  } catch (e) {
    console.error('ideas error:', e && e.message);
    return res.status(200).json({ error: 'unavailable' });
  }
}
