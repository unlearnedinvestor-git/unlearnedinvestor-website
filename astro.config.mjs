import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
export default defineConfig({ site: 'https://unlearnedinvestor.com', base: '/', integrations: [sitemap()] });
