// Match podcast entries to imported Substack posts without relying on titles.
// Substack audio feed URLs are preferred; an exact normalized title is a fallback
// for older episodes whose podcast feed points to Apple Podcasts.
import episodes from '../data/podcast.json';

const norm = value => String(value || '').trim().toLowerCase().replace(/&amp;/g, '&').replace(/[^a-z0-9]+/g, ' ').trim();
const normalizeUrl = value => {
  try {
    const u = new URL(value);
    return (u.hostname.toLowerCase() + u.pathname.replace(/\/$/, '')).toLowerCase();
  } catch { return ''; }
};
const episodeUrls = new Set(episodes.map(episode => normalizeUrl(episode.source)).filter(Boolean));
const episodeTitles = new Set(episodes.map(episode => norm(episode.title)).filter(Boolean));

export function isPodcastPost(post) {
  const source = normalizeUrl(post.data.sourceUrl);
  return Boolean(
    post.data.podcast ||
    (source && episodeUrls.has(source)) ||
    episodeTitles.has(norm(post.data.title))
  );
}
