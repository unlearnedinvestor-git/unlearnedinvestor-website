// Extract the first illustration already included in each imported Substack article.
const sources = import.meta.glob('/src/content/posts/*.md', { query: '?raw', import: 'default', eager: true });
const images = new Map();
for (const [path, markdown] of Object.entries(sources)) {
  const match = markdown.match(/<img\\b[^>]*?\\bsrc=["']([^"']+)["']/i);
  if (match) images.set(path.split('/').pop().replace(/\\.md$/, ''), match[1].replace(/&amp;/g, '&'));
}
export function postImage(post) {
  return images.get(post.id) || images.get(post.slug) || null;
}
