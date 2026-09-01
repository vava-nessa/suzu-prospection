import { writeFileSync } from "fs";
const KEY = process.env.EXA_API_KEY;
if (!KEY) { console.error("EXA_API_KEY manquant"); process.exit(1); }

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const BAD_EMAIL = /your|example|test|placeholder|noreply|no-reply/i;
const BAD_DOMAINS = ["example.com", "yourdomain.com", "yopmail.com"];

function isBadEmail(e) {
  const low = e.toLowerCase();
  if (BAD_EMAIL.test(low.split("@")[0])) return true;
  if (BAD_DOMAINS.some(d => low.endsWith(d))) return true;
  if (low.includes("your_email") || low.includes("your.email")) return true;
  // single letter or generic
  if (/^(info|contact|hello|support)@/i.test(low)) {
    // allow info/contact if it's clearly a personal site? but keep for now if unique - we'll allow contact@ only if site is personal portfolio
    // keep it but flag?
  }
  return false;
}

function extractGithubUsername(url, text) {
  const m = url.match(/github\.com\/([A-Za-z0-9_-]+)(?:\/|$)/);
  if (m && m[1] && !["search", "login", "features", "marketplace"].includes(m[1].toLowerCase())) return m[1];
  const m2 = text.match(/github\.com\/([A-Za-z0-9_-]+)/);
  return m2 ? m2[1] : undefined;
}

function extractWebsite(text, hitUrl) {
  // Prefer Homepage: line
  const hm = text.match(/Homepage:\s*(https?:\/\/[^\s|]+)/i);
  if (hm) return hm[1].replace(/[|,]+$/, "");
  if (hitUrl.includes("github.com")) {
    // no personal site, fallback to github profile url
    const u = extractGithubUsername(hitUrl, text);
    if (u) return `https://github.com/${u}`;
    return hitUrl;
  }
  return hitUrl;
}

function extractName(author, title, text) {
  let raw = (author || "").trim();
  if (!raw || raw.length < 2) {
    // try title: "Carlos Tarmeno - Portfolio"
    const t = title.split(" - ")[0].split(" | ")[0].split(" — ")[0].trim();
    if (t && t.split(" ").length <= 3 && !t.toLowerCase().includes("portfolio")) raw = t;
  }
  // cleanup: remove "Hi, I'm" prefix
  raw = raw.replace(/^hi,?\s*i'?m\s+/i, "").trim();
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
  if (parts.length === 1 && parts[0].length >= 2) return { firstName: parts[0] };
  return {};
}

function detectCountry(text, url) {
  const t = text.toLowerCase();
  const urlLow = url.toLowerCase();
  if (urlLow.endsWith(".fr") || t.includes("france") || t.includes(" paris")) return "FR";
  if (urlLow.endsWith(".de") || t.includes("germany") || t.includes(" berlin") || t.includes(" munich")) return "DE";
  if (t.includes("spain") || t.includes(" madrid") || t.includes(" barcelona")) return "ES";
  if (t.includes("italy") || t.includes(" rome") || t.includes(" milan")) return "IT";
  if (t.includes("united kingdom") || t.includes(" london") || t.includes(" uk ")) return "GB";
  if (t.includes("netherlands") || t.includes(" amsterdam")) return "NL";
  if (t.includes("belgium") || t.includes(" brussels")) return "BE";
  if (t.includes("switzerland") || t.includes(" zurich")) return "CH";
  if (t.includes("canada") || t.includes(" toronto") || t.includes(" montreal")) return "CA";
  if (t.includes("pakistan") || t.includes(" lahore") || t.includes(" karachi")) return "PK";
  if (t.includes("india") || t.includes(" delhi") || t.includes(" mumbai") || t.includes(" bangalore")) return "IN";
  if (t.includes("united states") || t.includes(" new york") || t.includes(" san francisco") || t.includes(" california") || t.includes(" texas")) return "US";
  return undefined;
}

async function exaSearch(query, opts = {}) {
  const body = {
    query,
    numResults: opts.numResults ?? 15,
    contents: { text: true },
    ...opts,
  };
  const r = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": KEY },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok) { console.error("Exa error", query, j); return []; }
  return j.results ?? [];
}

async function main() {
  const queries = [
    'developer portfolio contact email "gmail.com" OR "outlook.com" OR "proton.me"',
    'freelance developer portfolio "contact" email site',
    'software engineer portfolio contact email github linkedin',
    'indie hacker portfolio email contact',
  ];

  const all = [];
  for (const q of queries) {
    console.log(`\n🔎 Exa: ${q}`);
    const hits = await exaSearch(q, { numResults: 12 });
    console.log(`  → ${hits.length} hits`);
    all.push(...hits);
    await new Promise(r => setTimeout(r, 400));
  }

  // dedup by url
  const byUrl = new Map();
  for (const h of all) if (!byUrl.has(h.url)) byUrl.set(h.url, h);
  const unique = [...byUrl.values()];
  console.log(`\nTotal unique hits: ${unique.length}`);

  const prospects = [];
  const seenEmail = new Set();

  for (const hit of unique) {
    const text = hit.text ?? "";
    const emails = [...new Set((text.match(EMAIL_RE) ?? []).map((e) => e.toLowerCase().trim()))]
      .filter((e) => !isBadEmail(e))
      .filter((e) => e.includes("@") && e.split("@")[1].includes("."))
      .slice(0, 2);

    if (emails.length === 0) continue;

    const title = hit.title ?? "";
    // must look like dev
    const devHint = /developer|engineer|software|frontend|full.?stack|portfolio|indie|programmer/i.test(title + " " + text.slice(0, 1200));
    if (!devHint) continue;

    for (const email of emails) {
      if (seenEmail.has(email)) continue;
      // skip generic role emails unless we have a personal name
      const local = email.split("@")[0];
      if (/^(info|contact|hello|support|admin)$/i.test(local)) {
        // require author name exists to justify keeping
        if (!hit.author || hit.author.length < 2) continue;
      }

      const githubUsername = extractGithubUsername(hit.url, text);
      const website = extractWebsite(text, hit.url);
      const { firstName, lastName } = extractName(hit.author, title, text);
      const country = detectCountry(text, website);

      // at least website or github
      if (!website && !githubUsername) continue;

      seenEmail.add(email);
      prospects.push({
        email,
        emailNormalized: email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        website: website || undefined,
        country: country || undefined,
        githubUsername: githubUsername || undefined,
        sourceType: hit.url.includes("github.com") ? "github" : "website",
        sourceUrl: hit.url,
        status: "not_contacted",
        replied: false,
        emailVerified: false,
        createdAt: Date.now() + prospects.length,
        notes: `exa:${hit.url}`,
      });
      break; // one email per hit
    }

    if (prospects.length >= 15) break;
  }

  console.log(`\n✅ Candidates extracted: ${prospects.length}`);
  for (const p of prospects) {
    console.log(` - ${p.firstName ?? "?"} ${p.lastName ?? ""} <${p.email}> github:${p.githubUsername ?? "—"} site:${p.website?.slice(0,40)} country:${p.country ?? "—"} source:${p.sourceUrl.slice(0,60)}`);
  }

  const picked = prospects.slice(0, 10);
  if (picked.length < 10) console.warn(`⚠️ Only ${picked.length}/10 found — will import what we have`);

  const jsonl = picked.map(p => JSON.stringify(p)).join("\n");
  writeFileSync("/tmp/real10.jsonl", jsonl);
  console.log(`\nWrote ${picked.length} to /tmp/real10.jsonl`);
  writeFileSync("/tmp/real_candidates.json", JSON.stringify(picked, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
