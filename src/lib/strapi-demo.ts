/**
 * Demo content for builds without a Strapi server (STRAPI_URL not set), e.g. the
 * theme's live demo. It reads the same data the Strapi seed script imports
 * (strapi/data/seed.json) and returns it in the shape of the Strapi REST API.
 * The images are served from /cms-demo/ (see integrations/strapi-media.mjs).
 */
import fs from 'node:fs';
import path from 'node:path';

export const DEMO_MEDIA_PATH = '/cms-demo/';

interface Seed {
  media: Record<string, { file: string; alt: string; width?: number; height?: number }>;
  works: Array<Record<string, any>>;
  programs: Array<Record<string, any>>;
}

let seed: Seed | undefined;
function loadSeed(): Seed {
  seed ??= JSON.parse(fs.readFileSync(path.join(process.cwd(), 'strapi', 'data', 'seed.json'), 'utf8')) as Seed;
  return seed;
}

export function demoCollection(pluralApiId: string): any[] {
  const s = loadSeed();
  const media = (key?: string | null) => {
    if (!key) return null;
    const { file, alt, width = null, height = null } = s.media[key];
    return { id: 0, url: DEMO_MEDIA_PATH + file, alternativeText: alt, width, height, mime: '' };
  };
  const blocks = (nodes: any[] = []) => nodes.map((n) => (n.type === 'image' ? { ...n, image: media(n.image.$media) } : n));
  // The seed lists entries oldest first, like the order the seed script creates them in Strapi
  const meta = (index: number) => ({ id: index + 1, createdAt: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString() });

  switch (pluralApiId) {
    case 'works':
      return s.works.map((w, i) => ({ ...meta(i), ...w, image: media(w.image), content: blocks(w.content) }));
    case 'programs':
      return s.programs.map((p, i) => ({
        ...meta(i),
        ...p,
        image: media(p.image),
        content: blocks(p.content),
        details: blocks(p.details),
      }));
    default:
      throw new Error(`No demo content for "${pluralApiId}"`);
  }
}
