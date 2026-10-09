import Parser from 'rss-parser';
import fs from 'node:fs/promises';
import path from 'node:path';
const url=process.env.SUBSTACK_FEED_URL||'https://unlearnedinvestor.substack.com/feed';
const out=path.resolve('src/content/posts');
const parser=new Parser({customFields:{item:['content:encoded']}});
const slugify=s=>s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);
const clean=s=>String(s||'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,'').replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,'');
await fs.mkdir(out,{recursive:true});
let feed;try{feed=await parser.parseURL(url)}catch(e){console.warn('Substack feed unavailable; continuing with existing articles:',e.message);process.exit(0)}
let count=0;
for(const item of feed.items||[]){if(!item.title||!item.link)continue;const date=new Date(item.isoDate||item.pubDate||Date.now());if(Number.isNaN(+date))continue;const name=date.toISOString().slice(0,10)+'-'+slugify(item.title)+'.md';const target=path.join(out,name);try{await fs.access(target);continue}catch{}
const body=clean(item['content:encoded']||item.content||item.contentSnippet||'');const desc=String(item.contentSnippet||item.summary||'').replace(/\s+/g,' ').slice(0,240);
const front=['---','title: '+JSON.stringify(item.title),'description: '+JSON.stringify(desc),'pubDate: '+date.toISOString(),'sourceUrl: '+JSON.stringify(item.link),'category: Investing','draft: false','---',''].join('\n');
await fs.writeFile(target,front+'\n'+body+'\n');count++}
console.log('Imported '+count+' new posts');
