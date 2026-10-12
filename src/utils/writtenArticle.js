// Keep substantial written podcast companions in the article archive.
// Audio-only posts and short episode blurbs belong only in the podcast section.
export function hasWrittenArticle(body) {
  const text = String(body || '')
    .replace(/<(script|style|audio|iframe)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:#\d+|#x[\da-f]+|[a-z]+);/gi, ' ')
    .replace(/\s+/g, ' ').trim();
  return text.split(/\s+/).filter(Boolean).length >= 100;
}
