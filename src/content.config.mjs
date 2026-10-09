import { defineCollection, z } from 'astro:content';
const posts = defineCollection({ type: 'content', schema: z.object({ title: z.string(), description: z.string().optional(), pubDate: z.coerce.date(), sourceUrl: z.string().url().optional(), category: z.string().default('Investing'), draft: z.boolean().default(false) }) });
export const collections = { posts };
