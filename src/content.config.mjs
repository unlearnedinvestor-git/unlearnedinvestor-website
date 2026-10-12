import { defineCollection, z } from 'astro:content';
const posts = defineCollection({ type: 'content', schema: z.object({ title: z.string(), description: z.string().optional(), coverImage: z.string().optional(), pubDate: z.coerce.date(), sourceUrl: z.string().url().optional(), category: z.string().default('Investing'), podcast: z.boolean().default(false), draft: z.boolean().default(false) }) });
export const collections = { posts };
