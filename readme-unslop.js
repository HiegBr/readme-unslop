#!/usr/bin/env node
'use strict';
const fs = require('fs');

const FILLER = ['enterprise-grade','user-friendly','intuitive','lightning fast','seamlessly','seamless','robust','blazing-fast','blazing fast','lightning-fast','cutting-edge','state-of-the-art','game-changing','game changer','revolutionary','leverage','leverages','harness the power','supercharge','effortless','effortlessly','powerful','comprehensive','elevate','unlock the','next-generation','best-in-class','delve','streamline','holistic','world-class'];
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2705}\u{274C}]/u;
const BOILER = {
  roadmap: /^(roadmap|future plans|upcoming features)$/i,
  contributing: /^(contributing|contributions)$/i,
  screenshots: /^(screenshots?|demo|preview)$/i,
};
const CONTRIB_GENERIC = /(contributions are welcome|pull requests are welcome|feel free to (open|submit)|fork the repo|create your feature branch|open a pull request)/i;

function sections(lines) {
  const out = []; let cur = null; let fence = false;
  lines.forEach((l, i) => {
    if (/^\s*(```|~~~)/.test(l)) fence = !fence;
    const m = !fence && /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(l);
    if (m) { cur = { level: m[1].length, title: m[2], line: i + 1, body: [] }; out.push(cur); }
    else if (cur) cur.body.push(l);
  });
  return out;
}
const plain = s => s.replace(/[^\p{L}\p{N}\s]/gu, '').trim();

function lint(text) {
  const lines = text.split(/\r?\n/);
  const f = [];
  const add = (rule, line, points, msg, fix) => f.push({ rule, line, points, message: msg, fix });
  const secs = sections(lines);

  // emoji headings
  const eh = secs.filter(s => EMOJI.test(s.title));
  eh.forEach(s => add('emoji-heading', s.line, eh.length > 2 ? 4 : 2, `Heading "${s.title}" contains an emoji`, 'Drop the emoji; the heading text is enough.'));

  // badge wall
  let badges = 0, first = 0;
  lines.forEach((l, i) => { const n = (l.match(/!\[[^\]]*\]\(https?:[^)]*(shields\.io|badge|badgen)[^)]*\)/gi) || []).length; if (n && !first) first = i + 1; badges += n; });
  if (badges > 4) add('badge-wall', first, Math.min(15, (badges - 4) * 2 + 4), `${badges} badges; more than four reads as decoration`, 'Keep build status and license at most.');

  // filler words
  const fenceless = []; let fence = false;
  lines.forEach((l, i) => { if (/^\s*(```|~~~)/.test(l)) fence = !fence; fenceless.push(fence || /^\s*>/.test(l) ? "" : l.replace(/`[^`]*`/g,"")); });
  let fillerHits = 0;
  fenceless.forEach((l, i) => {
    const low = l.toLowerCase();
    for (const w of FILLER) {
      const re = new RegExp('(^|[^a-z])' + w.replace(/[-\s]/g, '[-\\s]') + '(?![a-z])');
      if (re.test(low)) { fillerHits++; if (fillerHits <= 10) add('filler-word', i + 1, 2, `Marketing filler: "${w}"`, 'Say what it does, with a number or an example.'); break; }
    }
  });

  // boilerplate sections
  secs.forEach((s, idx) => {
    const body = s.body.join('\n').trim();
    const words = body.split(/\s+/).filter(Boolean).length;
    const t = plain(s.title);
    if (BOILER.roadmap.test(t) && (words < 25 || (/^\s*[-*]/m.test(body) && !/(#\d+|issues|http)/i.test(body))))
      add('empty-roadmap', s.line, 4, 'Roadmap is generic or very short', 'Link real issues or delete the section.');
    if (BOILER.contributing.test(t) && (words < 40 && CONTRIB_GENERIC.test(body)))
      add('boilerplate-contributing', s.line, 4, 'Contributing is the stock "fork, branch, PR" text', 'Say how to run tests or delete it.');
    if (BOILER.screenshots.test(t) && !/!\[[^\]]*\]\([^)]+\)|<img\s/i.test(body))
      add('fake-screenshots', s.line, 6, 'Screenshots section contains no image', 'Add a real image or remove the section.');
    else if (BOILER.screenshots.test(t) && /placeholder|your-image|example\.com|screenshot\d*\.png/i.test(body))
      add('fake-screenshots', s.line, 5, 'Screenshot points at a placeholder', 'Use a real image.');
  });

  // over-bulleted
  let bullets = 0, nonEmpty = 0;
  fence = false;
  lines.forEach(l => { if (/^\s*(```|~~~)/.test(l)) { fence = !fence; return; } if (fence || !l.trim()) return; nonEmpty++; if (/^\s*([-*+]|\d+\.)\s/.test(l)) bullets++; });
  if (nonEmpty > 15 && bullets / nonEmpty > 0.55) add('over-bulleted', 1, 6, `${Math.round(100 * bullets / nonEmpty)}% of lines are bullets`, 'Turn some lists into sentences.');
  // bold-label bullets: "- **Fast**: ..."
  const bl = lines.filter(l => /^\s*[-*]\s+(\*\*[^*]+\*\*|[^\w\s]\s*\*\*[^*]+\*\*)\s*[:\-–—]/.test(l)).length;
  if (bl >= 3) add('bold-label-bullets', 1, 4, `${bl} bullets in the "**Label**: blurb" pattern`, 'Write one plain sentence per real feature.');

  // generic section skeleton
  const titles = secs.map(s => plain(s.title).toLowerCase());
  const stock = ['features','installation','usage','contributing','license','roadmap','acknowledgments','acknowledgements','table of contents','prerequisites','getting started','support'];
  const hit = titles.filter(t => stock.includes(t)).length;
  if (secs.length >= 5 && hit / secs.length > 0.7) add('stock-skeleton', 1, 4, 'Nearly every heading is a stock section name', 'Lead with what problem this solves.');

  // em dashes
  const em = (text.match(/—/g) || []).length;
  if (em >= 6) add('em-dash-heavy', 1, 3, `${em} em dashes`, 'Use commas and periods in some places.');

  const raw = f.reduce((a, x) => a + x.points, 0);
  return { score: Math.min(100, raw), findings: f };
}

function main(argv) {
  const files = []; let max = 30, json = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') json = true;
    else if (a === '--max-score') max = Number(argv[++i]);
    else if (a === '-h' || a === '--help') { console.log('usage: readme-unslop [--max-score N] [--json] [README.md ...]\nScore 0-100 (higher = more AI-looking). Exits 1 if any file scores above N (default 30).'); return 0; }
    else files.push(a);
  }
  if (!files.length) files.push('README.md');
  let fail = false; const results = [];
  for (const file of files) {
    let text; try { text = fs.readFileSync(file, 'utf8'); } catch (e) { console.error(`cannot read ${file}`); return 2; }
    const r = lint(text); r.file = file; results.push(r);
    if (r.score > max) fail = true;
    if (!json) {
      console.log(`${file}: score ${r.score}/100 (limit ${max})`);
      r.findings.forEach(x => console.log(`  line ${x.line}  ${x.rule}  ${x.message}\n      fix: ${x.fix}`));
    }
  }
  if (json) console.log(JSON.stringify(results, null, 2));
  return fail ? 1 : 0;
}
if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { lint };
