import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Ensure images imported from Substack always have an alt attribute.
// Empty alt is appropriate for images without trustworthy descriptive text.
function imageAltAttributes() {
  return (tree) => {
    const visit = (node) => {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'html' && typeof node.value === 'string') {
        node.value = node.value.replace(/<img\b[^>]*>/gi, tag => /\s+alt\s*=/i.test(tag) ? tag : tag.replace(/\s*\/?>(?=$)/, end => ` alt=""${end}`));
      }
      if (node.type === 'element' && node.tagName === 'img') {
        node.properties ||= {};
        if (node.properties.alt == null) node.properties.alt = '';
      }
      for (const child of node.children || []) visit(child);
    };
    visit(tree);
  };
}

export default defineConfig({
  site: 'https://unlearnedinvestor.com',
  base: '/',
  markdown: { rehypePlugins: [imageAltAttributes] },
  integrations: [sitemap({ filter: page => !new URL(page).pathname.startsWith('/blank/') })]
});
