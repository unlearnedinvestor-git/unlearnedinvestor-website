import Parser from 'rss-parser';
import fs from 'node:fs/promises';
import path from 'node:path';

const url = 'https://api.substack.com/feed/podcast/8662485.rss';
const target = path.resolve('src/data/podcast.json');
const parser = new Parser();
const clean = text => String(text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
try {
  const feed = await parser.parseURL(url);
  const episodes = (feed.items || []).filter(item => item.title && item.enclosure?.url && /^https:\/\//.test(item.enclosure.url)).map(item => ({
    title: item.title,
    description: clean(item.contentSnippet || item.summary || item.content || '').slice(0, 550),
    published: item.isoDate || item.pubDate || '',
    audio: item.enclosure.url,
    source: /^https:\/\//.test(item.link || '') ? item.link : '',
    duration: item.itunes?.duration || ''
  }));
  if (!episodes.length) throw new Error('Feed contains no playable episodes');
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify(episodes, null, 2) + '\n');
  console.log('Imported ' + episodes.length + ' podcast episodes');
} catch (err) {
  console.warn('Podcast feed unavailable; retaining last successful import:', err.message);
  try { await fs.access(target); } catch { throw err; }
}
