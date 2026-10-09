import Parser from 'rss-parser';
import fs from 'node:fs/promises';
import path from 'node:path';

const feedUrl = process.env.SUBSTACK_FEED_URL || 'https://unlearnedinvestor.substack.com/feed';
const out = path.resolve('src/content/posts');
const parser = new Parser({
  customFields: { item: [
    ['content:encoded', 'encodedContent'],
    ['media:content', 'mediaContent', { keepArray: true }],
    ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
    ['itunes:image', 'itunesImage']
  ] }
});
const slugify = s => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
const clean = s => String(s || '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '').replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
const validImage = u => typeof u === 'string' && /^https:\/\//i.test(u) && !/\.(mp3|mp4|m4a|wav|pdf)(\?|$)/i.test(u);
const asArray = v => v ? Array.isArray(v) ? v : [v] : [];
const decode = s => String(s || '').replace(/&amp;/g, '&').replace(/&#38;/g, '&');
function mediaUrl(v) {
  if (typeof v === 'string') return v;
  return v?.$?.url || v?.url || v?.href || '';
}
function rssCover(item) {
  const candidates = [
    ...asArray(item.mediaContent).filter(x => !x?.$?.medium || x.$.medium === 'image').map(mediaUrl),
    ...asArray(item.mediaThumbnail).map(mediaUrl),
    item.enclosure?.type?.startsWith('image/') ? item.enclosure.url : '',
    mediaUrl(item.itunesImage),
    ...asArray(item['media:content']).map(mediaUrl),
    ...asArray(item['media:thumbnail']).map(mediaUrl)
  ];
  return decode(candidates.find(validImage) || '');
}
async function pageCover(link) {
  try {
    const response = await fetch(link, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) return '';
    const html = await response.text();
    for (const name of ['og:image', 'twitter:image']) {
      const tags = html.match(/<meta\b[^>]*>/gi) || [];
      for (const tag of tags) {
        if (!new RegExp('(?:property|name)\\s*=\\s*["\\x27]' + name + '["\\x27]', 'i').test(tag)) continue;
        const url = decode(tag.match(/content\s*=\s*["']([^"']+)["']/i)?.[1]);
        if (validImage(url)) return url;
      }
    }
  } catch (e) { console.warn('Cover metadata unavailable:', link, e.message); }
  return '';
}
await fs.mkdir(out, { recursive: true });
let feed;
try { feed = await parser.parseURL(feedUrl); }
catch (e) { console.warn('Substack feed unavailable; deploying existing articles:', e.message); }
if (feed) {
  const byUrl = new Map((feed.items || []).filter(i => i.link).map(i => [i.link.replace(/\/$/, ''), i]));
  let imported = 0, recovered = 0, missing = 0;
  for (const item of feed.items || []) {
    if (!item.title || !item.link) continue;
    const date = new Date(item.isoDate || item.pubDate || Date.now());
    if (Number.isNaN(+date)) continue;
    const filename = date.toISOString().slice(0, 10) + '-' + slugify(item.title) + '.md';
    const target = path.join(out, filename);
    try { await fs.access(target); continue; } catch {}
    const body = clean(item.encodedContent || item.content || item.contentSnippet || '');
    const description = String(item.contentSnippet || item.summary || '').replace(/\s+/g, ' ').slice(0, 240);
    const coverImage = rssCover(item) || await pageCover(item.link);
    const front = ['---', 'title: ' + JSON.stringify(item.title), 'description: ' + JSON.stringify(description), 'pubDate: ' + date.toISOString(), 'sourceUrl: ' + JSON.stringify(item.link), 'coverImage: ' + JSON.stringify(coverImage), 'category: Investing', 'draft: false', '---', ''].join('\n');
    await fs.writeFile(target, front + '\n' + body + '\n');
    imported++;
  }
  // Existing posts were previously skipped entirely. Match their source URLs to the RSS entries.
  for (const filename of await fs.readdir(out)) {
    if (!filename.endsWith('.md')) continue;
    const file = path.join(out, filename);
    const original = await fs.readFile(file, 'utf8');
    if (/^coverImage:\s*["']https?:/m.test(original)) continue;
    const link = original.match(/^sourceUrl:\s*["']([^"']+)["']/m)?.[1];
    if (!link) continue;
    const item = byUrl.get(link.replace(/\/$/, ''));
    const coverImage = (item && rssCover(item)) || await pageCover(link);
    if (!coverImage) { missing++; console.warn('NO COVER IMAGE:', filename, link); continue; }
    const updated = /^coverImage:/m.test(original)
      ? original.replace(/^coverImage:.*$/m, 'coverImage: ' + JSON.stringify(coverImage))
      : original.replace(/^---\s*\n/, '---\ncoverImage: ' + JSON.stringify(coverImage) + '\n');
    if (updated !== original) { await fs.writeFile(file, updated); recovered++; }
  }
  console.log(JSON.stringify({ imported, recovered, missing, rssItems: feed.items.length }));
}
