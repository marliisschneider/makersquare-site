#!/usr/bin/env node
/*
 * cohorts.mjs — stamp cohort dates from cohorts.json into every page.
 *
 * WHY: cohort dates used to be hand-copied into 5 pages' JSON-LD + the homepage
 * banner, and they drifted (index.html once advertised a 4-week, already-started
 * cohort while every other surface said 2 weeks). This makes cohorts.json the
 * single source of truth. Edit cohorts.json, then run:
 *
 *     node scripts/cohorts.mjs            # write changes
 *     node scripts/cohorts.mjs --check    # dry-run, non-zero exit if stale (CI)
 *
 * No dependencies, no build step, no Vercel config — pure Node built-ins so it
 * never runs on deploy and can't break the static build.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const SCHEMA = { InStock: 'https://schema.org/InStock', SoldOut: 'https://schema.org/SoldOut' };
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// --- load source of truth -------------------------------------------------
const data = JSON.parse(readFileSync(join(ROOT, 'cohorts.json'), 'utf8'));
const prog = data.program;
const today = new Date(new Date().toISOString().slice(0, 10)); // date-only, UTC
const asDate = (s) => new Date(s);

// enrolling = enrollment window still open; upcoming = not yet finished
const enrolling = (c) => asDate(c.enrollClose) >= today;
const upcoming = (c) => asDate(c.end) >= today;
const availabilityOf = (c) => (enrolling(c) ? 'InStock' : 'SoldOut');

// the "next open" cohort drives the single-instance schema + homepage banner
const nextOpen = data.cohorts.find(enrolling) || data.cohorts[data.cohorts.length - 1];
// the soonest demo day (= a cohort's end date) not yet passed drives the homepage Event
const nextDemo = data.cohorts.find((c) => asDate(c.end) >= today) || data.cohorts[data.cohorts.length - 1];
const demoStart = prog.demoStartSuffix, demoEnd = prog.demoEndSuffix;

// --- date formatting -------------------------------------------------------
const short = (iso) => { const d = asDate(iso); return `${MONTHS[d.getUTCMonth()].slice(0,3)} ${d.getUTCDate()}`; };
const long = (iso) => { const d = asDate(iso); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`; };
const monthDay = (iso) => { const d = asDate(iso); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`; };

const TOKENS = {
  name: nextOpen.name,
  startShort: short(nextOpen.start),
  startLong: long(nextOpen.start),
  enrollCloseShort: monthDay(nextOpen.enrollClose),
  endShort: short(nextOpen.end),
  startLong2: long(nextOpen.start),
};

// --- helpers ---------------------------------------------------------------
let changed = false;
const results = [];

function edit(file, fn) {
  const path = join(ROOT, file);
  const before = readFileSync(path, 'utf8');
  const after = fn(before);
  if (after !== before) {
    changed = true;
    results.push(`${CHECK ? 'STALE' : 'wrote'}: ${file}`);
    if (!CHECK) writeFileSync(path, after);
  }
}

// Replace the balanced {..} or [..] value that follows a `"key":` marker.
function replaceBalanced(src, key, newInner) {
  const at = src.indexOf(`"${key}"`);
  if (at === -1) return src;
  // find first { or [ after the key
  let open = -1, openCh = '';
  for (let j = at; j < src.length; j++) {
    if (src[j] === '{' || src[j] === '[') { open = j; openCh = src[j]; break; }
  }
  if (open === -1) return src;
  const closeCh = openCh === '{' ? '}' : ']';
  let depth = 0, end = -1;
  for (let j = open; j < src.length; j++) {
    if (src[j] === openCh) depth++;
    else if (src[j] === closeCh) { depth--; if (depth === 0) { end = j; break; } }
  }
  if (end === -1) return src;
  return src.slice(0, open) + newInner + src.slice(end + 1);
}

// Rewrite the date/workload/availability fields *inside* a single hasCourseInstance
// object, leaving indentation and unrelated fields (e.g. a sibling Event startDate) intact.
function stampSingleInstance(src) {
  const before = src.indexOf('"hasCourseInstance"');
  if (before === -1) return src;
  // isolate the object so sibling Event.startDate is never touched
  let open = src.indexOf('{', before), depth = 0, end = -1;
  for (let j = open; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) { end = j; break; } }
  }
  if (open === -1 || end === -1) return src;
  let block = src.slice(open, end + 1);
  block = block.replace(/"startDate":\s*"[^"]*"/, `"startDate": "${nextOpen.start}"`);
  block = block.replace(/"endDate":\s*"[^"]*"/, `"endDate": "${nextOpen.end}"`);
  block = block.replace(/"courseWorkload":\s*"[^"]*"/, `"courseWorkload": "${prog.workload}"`);
  block = block.replace(/"availability":\s*"[^"]*"/g, `"availability": "${SCHEMA.InStock}"`);
  return src.slice(0, open) + block + src.slice(end + 1);
}

// --- 1. single-instance schema pages --------------------------------------
for (const f of ['index.html', 'pricing.html', 'curriculum.html', 'scholarship.html']) {
  edit(f, stampSingleInstance);
}

// --- 2. enroll.html — full cohort array -----------------------------------
edit('enroll.html', (src) => {
  const items = data.cohorts.filter(upcoming).map((c) =>
    `    {"@type": "CourseInstance", "name": "${c.name}", "courseMode": "Onsite", ` +
    `"startDate": "${c.start}", "endDate": "${c.end}", "courseWorkload": "${prog.workload}", ` +
    `"offers": {"@type": "Offer", "price": "${prog.priceUSD}", "priceCurrency": "USD", ` +
    `"availability": "${SCHEMA[availabilityOf(c)]}"}}`
  ).join(',\n');
  return replaceBalanced(src, 'hasCourseInstance', `[\n${items}\n  ]`);
});

// --- 2b. demo-day.html — full Demo Day ItemList (demo day = cohort end date)
function demoListItem(c, i) {
  return `        {
          "@type": "ListItem", "position": ${i + 1},
          "item": {
            "@type": "Event",
            "name": "MakerSquare Demo Day — ${c.name}",
            "startDate": "${c.end}${demoStart}",
            "endDate": "${c.end}${demoEnd}",
            "eventStatus": "https://schema.org/EventScheduled",
            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
            "location": {"@type": "Place", "name": "MakerSquare Austin", "address": {"@type": "PostalAddress", "addressLocality": "${prog.locality}", "addressRegion": "${prog.region}", "addressCountry": "${prog.country}"}},
            "organizer": {"@type": "EducationalOrganization", "name": "MakerSquare", "url": "https://www.makersquare.ai/"},
            "performer": {"@type": "PerformingGroup", "name": "MakerSquare ${c.name} graduates"},
            "image": ["${prog.ogImage}"],
            "url": "${prog.demoUrl}",
            "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD", "availability": "https://schema.org/InStock", "validFrom": "${c.start}", "name": "Free admission", "url": "${prog.demoUrl}"},
            "description": "${c.name} graduates present their capstone AI products live to Austin's tech community, investors, and operators."
          }
        }`;
}
edit('demo-day.html', (src) => {
  const items = data.cohorts.filter(upcoming).map(demoListItem).join(',\n');
  return replaceBalanced(src, 'itemListElement', `[\n${items}\n      ]`);
});

// --- 2c. index.html homepage Event → next upcoming demo day ----------------
edit('index.html', (src) => {
  const t = src.indexOf('"@type": "Event"');
  if (t === -1) return src;
  const open = src.lastIndexOf('{', t);
  let depth = 0, end = -1;
  for (let j = open; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) { end = j; break; } }
  }
  if (end === -1) return src;
  let b = src.slice(open, end + 1);
  b = b.replace(/"name": "MakerSquare Demo Day[^"]*"/, `"name": "MakerSquare Demo Day — ${nextDemo.name}"`);
  b = b.replace(/"startDate": "[^"]*"/, `"startDate": "${nextDemo.end}${demoStart}"`);
  b = b.replace(/"endDate": "[^"]*"/, `"endDate": "${nextDemo.end}${demoEnd}"`);
  if (!b.includes('"image"'))
    b = b.replace(/(\n(\s*))"eventStatus":/, `$1"image": ["${prog.ogImage}"],$1"url": "${prog.demoUrl}",$1"performer": {"@type": "PerformingGroup", "name": "MakerSquare ${nextDemo.name} graduates"},$1"eventStatus":`);
  if (!b.includes('"validFrom"'))
    b = b.replace('"availability": "https://schema.org/InStock", "name": "Free admission"', `"availability": "https://schema.org/InStock", "validFrom": "${nextDemo.start}", "name": "Free admission"`);
  return src.slice(0, open) + b + src.slice(end + 1);
});

// --- 3. visible banner markers --------------------------------------------
for (const f of ['index.html', 'immersive.html', 'demo-ppc.html', 'demo-ppc-legal.html', 'demo-ppc-pm.html', 'corporate.html', 'ai-training-austin.html', 'enroll.html']) {
  edit(f, (src) =>
    src.replace(/(<!--COHORT:(\w+)-->)([\s\S]*?)(<!--\/-->)/g, (m, openTag, tok, _inner, closeTag) =>
      TOKENS[tok] !== undefined ? `${openTag}${TOKENS[tok]}${closeTag}` : m)
  );
}

// --- 3b. countdown deadline = next open cohort's enroll close (23:59 Central)
for (const f of ['index.html', 'immersive.html']) {
  edit(f, (src) => src.replace(
    /var deadline = new Date\('[^']*'\);/,
    `var deadline = new Date('${nextOpen.enrollClose}T23:59:59-06:00');`
  ));
}

// --- report ----------------------------------------------------------------
console.log(`next open cohort: ${nextOpen.name} (${nextOpen.start} → ${nextOpen.end}), enroll closes ${nextOpen.enrollClose}`);
if (results.length) results.forEach((r) => console.log('  ' + r));
else console.log('  all pages already in sync');

if (CHECK && changed) {
  console.error('\n✗ cohort dates are stale — run `node scripts/cohorts.mjs`');
  process.exit(1);
}
