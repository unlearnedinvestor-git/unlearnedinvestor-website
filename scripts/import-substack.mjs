import Parser from 'rss-parser';
import fs from 'node:fs/promises';
import path from 'node:path';
const url=process.env.SUBSTACK_FEED_URL||'https://unlearnedinvestor.substack.com/feed';
const out=path.resolve('src/content/posts');
const parser=new Parser({customFields:{item:['content:encoded']}});
const slugify=s=>s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);
const clean=s=>String(s||'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,'').replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,'');

// Substack's cover art is often in page metadata, not the RSS article body.
const coverFor = async (link) => {
  try {
    const response = await fetch(link, { signal: AbortSignal.timeout(12000), headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UnlearnedInvestorImporter/1.0)' } });
    if (!response.ok) return '';
    const html = await response.text();
    const tags = html.match(/<meta\b[^>]*>/gi) || [];
    for (const name of ['og:image', 'twitter:image']) {
      const tag = tags.find(t => new RegExp('(?:property|name)\\s*=\\s*["\\x27]' + name + '["\\x27]', 'i').test(t));
      const value = tag?.match(/content\s*=\s*["']([^"']+)["']/i)?.[1];
      if (value?.startsWith('https://')) return value.replace(/&amp;/g, '&');
    }
  } catch (e) { console.warn('Could not retrieve cover image:', link, e.message); }
  return '';
};

await fs.mkdir(out,{recursive:true});
let feed;try{feed=await parser.parseURL(url)}catch(e){console.warn('Substack feed unavailable; continuing with existing articles:',e.message);process.exit(0)}
let count=0;
for(const item of feed.items||[]){if(!item.title||!item.link)continue;const date=new Date(item.isoDate||item.pubDate||Date.now());if(Number.isNaN(+date))continue;const name=date.toISOString().slice(0,10)+'-'+slugify(item.title)+'.md';const target=path.join(out,name);try{await fs.access(target);continue}catch{}
const body=clean(item['content:encoded']||item.content||item.contentSnippet||'');const desc=String(item.contentSnippet||item.summary||'').replace(/\s+/g,' ').slice(0,240);
const coverImage=item.enclosure?.url || item['media:content']?.url || await coverFor(item.link);const front=['---','coverImage: '+JSON.stringify(coverImage),'title: '+JSON.stringify(item.title),'description: '+JSON.stringify(desc),'pubDate: '+date.toISOString(),'sourceUrl: '+JSON.stringify(item.link),'category: Investing','draft: false','---',''].join('\n');
await fs.writeFile(target,front+'\n'+body+'\n');count++}
console.log('Imported '+count+' new posts');

// Backfill cover images for already-imported posts without changing their URLs or text.
for (const filename of await fs.readdir(out)) {
  if (!filename.endsWith('.md')) continue;
  const file = path.join(out, filename);
  const original = await fs.readFile(file, 'utf8');
  if (/^coverImage:\s*"https?:/m.test(original)) continue;
  const link = original.match(/^sourceUrl:\s*"([^"]+)"/m)?.[1];
  if (!link) continue;
  const coverImage = await coverFor(link);
  if (!coverImage) continue;
  const updated = /^coverImage:/m.test(original)
    ? original.replace(/^coverImage:.*$/m, 'coverImage: ' + JSON.stringify(coverImage))
    : original.replace(/^---\s*\n/, '---\ncoverImage: ' + JSON.stringify(coverImage) + '\n');
  if (updated !== original) await fs.writeFile(file, updated);
}
