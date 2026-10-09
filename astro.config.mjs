import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
export default defineConfig({ site: 'https://unlearnedinvestor-git.github.io', base: '/unlearnedinvestor-website', integrations: [sitemap()] });
