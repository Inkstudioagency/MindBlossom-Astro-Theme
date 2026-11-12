/**
 * Content collections backed by Strapi (see ./strapi).
 *
 * Each loader fetches the published entries at build time (or when the dev server
 * syncs content), normalises Strapi's response and validates it with a schema.
 * Entry ids are the slugs, so pages can use getEntry('works', slug).
 */
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { fetchCollection, mediaUrl, type StrapiMedia } from './lib/strapi';

// ---------- shared shapes

const imageSchema = z.object({
  url: z.string(),
  alt: z.string(),
  width: z.number().nullable(),
  height: z.number().nullable(),
});

// Strapi "Blocks" rich text, rendered by src/components/RichText.astro
const blocksSchema = z.array(z.any()).default([]);

const seoSchema = z.object({
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
});

function image(media: StrapiMedia | null | undefined, fallbackAlt = '') {
  if (!media) return null;
  return {
    url: mediaUrl(media.url),
    alt: media.alternativeText || fallbackAlt,
    width: media.width ?? null,
    height: media.height ?? null,
  };
}

function blocks(nodes: any[] | null | undefined) {
  return (nodes ?? []).map((node) =>
    node.type === 'image' && node.image ? { ...node, image: { ...node.image, url: mediaUrl(node.image.url) } } : node,
  );
}

function seo(value: any) {
  return { metaTitle: value?.metaTitle || null, metaDescription: value?.metaDescription || null };
}

// ---------- collections

const works = defineCollection({
  loader: async () => {
    const works = await fetchCollection<any>('works', { image: true, stats: true, seo: true });
    return works.map((w) => ({
      id: w.slug,
      name: w.name,
      slug: w.slug,
      createdAt: w.createdAt,
      order: w.id,
      image: image(w.image, w.name),
      tagline: w.tagline ?? '',
      shortDescription: w.shortDescription ?? '',
      category: w.category ?? '',
      focus: w.focus ?? '',
      programLead: w.programLead ?? '',
      stats: (w.stats ?? []).map((s: any) => ({ value: s.value, label: s.label })),
      content: blocks(w.content),
      seo: seo(w.seo),
    }));
  },
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    createdAt: z.coerce.date(),
    order: z.number(),
    image: imageSchema,
    tagline: z.string(),
    shortDescription: z.string(),
    category: z.string(),
    focus: z.string(),
    programLead: z.string(),
    stats: z.array(z.object({ value: z.string(), label: z.string() })),
    content: blocksSchema,
    seo: seoSchema,
  }),
});

const programs = defineCollection({
  loader: async () => {
    const programs = await fetchCollection<any>('programs', { image: true, schedule: true, seo: true });
    return programs.map((p) => ({
      id: p.slug,
      name: p.name,
      slug: p.slug,
      createdAt: p.createdAt,
      order: p.id,
      image: image(p.image, p.name),
      tag: p.tag ?? '',
      date: p.date,
      time: p.time ?? '',
      location: p.location ?? '',
      availability: p.availability ?? '',
      content: blocks(p.content),
      schedule: (p.schedule ?? []).map((s: any) => ({ time: s.time, activity: s.activity })),
      details: blocks(p.details),
      seo: seo(p.seo),
    }));
  },
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    createdAt: z.coerce.date(),
    order: z.number(),
    image: imageSchema,
    tag: z.string(),
    date: z.coerce.date(),
    time: z.string(),
    location: z.string(),
    availability: z.string(),
    content: blocksSchema,
    schedule: z.array(z.object({ time: z.string(), activity: z.string() })),
    details: blocksSchema,
    seo: seoSchema,
  }),
});

export const collections = { works, programs };
