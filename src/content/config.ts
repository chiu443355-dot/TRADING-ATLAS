import { defineCollection, z } from 'astro:content';

const chapters = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    chapterNum: z.number(),
    description: z.string().optional(),
  }),
});

export const collections = { chapters };
