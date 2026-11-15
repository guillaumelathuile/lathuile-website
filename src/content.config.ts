import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Un parcours = un fichier .md dans src/content/parcours
const parcours = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/parcours' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    summary: z.string(),
  }),
});

// Un module = un fichier .md dans src/content/modules (voir _modele.md)
const modules = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/modules' }),
  schema: z.object({
    title: z.string(),
    parcours: z.string(),
    order: z.number(),
    access: z.enum(['gratuit', 'payant']).default('gratuit'),
    summary: z.string().optional(),
  }),
});

export const collections = { parcours, modules };
