import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const work = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/work' }),
  schema: z.object({
    order: z.number(),
    title: z.string(),
    summary: z.string(),
    role: z.string(),
    timeframe: z.string(),
    team: z.string(),
    metric: z.object({ value: z.string(), label: z.string() }),
    totem: z.enum(['compass', 'knot', 'stones']),
    process: z
      .array(z.object({ stage: z.string(), title: z.string(), body: z.string(), note: z.string().optional() }))
      .length(6),
    led: z.array(z.string()).min(1),
    outcomes: z.array(z.object({ value: z.string(), label: z.string() })),
  }),
});

export const collections = { work };
