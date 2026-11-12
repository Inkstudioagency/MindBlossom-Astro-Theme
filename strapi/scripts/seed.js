'use strict';

/**
 * Seeds the MindBlossom demo content (works, programs and their images) from data/seed.json.
 *
 *   npm run seed            # only when the database has no content yet
 *   npm run seed -- --force # wipe both collections and seed again
 *
 * It also allows the Public role to read (find / findOne) both collections,
 * so the Astro site can fetch published content without a token.
 */

const fs = require('fs');
const path = require('path');
const { compileStrapi, createStrapi } = require('@strapi/strapi');

const DATA_DIR = path.join(__dirname, '..', 'data');
const seed = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'seed.json'), 'utf8'));
const force = process.argv.includes('--force');

const UIDS = {
  work: 'api::work.work',
  program: 'api::program.program',
};

const MIME = { webp: 'image/webp', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };

/** media key -> uploaded file entity */
const uploaded = new Map();

async function uploadMedia(key) {
  if (!key) return null;
  if (uploaded.has(key)) return uploaded.get(key);
  const { file, alt } = seed.media[key];
  const filepath = path.join(DATA_DIR, 'uploads', file);
  const ext = path.extname(file).slice(1).toLowerCase();
  const [entity] = await strapi
    .plugin('upload')
    .service('upload')
    .upload({
      files: { filepath, originalFilename: file, mimetype: MIME[ext], size: fs.statSync(filepath).size },
      data: { fileInfo: { name: file, alternativeText: alt, caption: '' } },
    });
  uploaded.set(key, entity);
  return entity;
}

const mediaId = async (key) => (key ? (await uploadMedia(key)).id : null);

/** Replaces `{ $media: key }` placeholders inside Blocks image nodes with the uploaded file */
async function resolveBlocks(blocks = []) {
  const out = [];
  for (const block of blocks) {
    if (block.type === 'image' && block.image?.$media) out.push({ ...block, image: await uploadMedia(block.image.$media) });
    else out.push(block);
  }
  return out;
}

async function isEmpty() {
  for (const uid of Object.values(UIDS)) {
    if ((await strapi.documents(uid).count({})) > 0) return false;
  }
  return true;
}

async function wipe() {
  for (const uid of Object.values(UIDS)) {
    const docs = await strapi.documents(uid).findMany({ fields: ['documentId'], status: 'draft' });
    for (const { documentId } of docs) await strapi.documents(uid).delete({ documentId });
  }
}

async function allowPublicRead() {
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
  for (const uid of Object.values(UIDS)) {
    for (const verb of ['find', 'findOne']) {
      const action = `${uid}.${verb}`;
      const exists = await strapi.db.query('plugin::users-permissions.permission').findOne({ where: { action, role: role.id } });
      if (!exists) await strapi.db.query('plugin::users-permissions.permission').create({ data: { action, role: role.id } });
    }
  }
}

async function create(uid, data) {
  return strapi.documents(uid).create({ data, status: 'published' });
}

async function run() {
  if (!(await isEmpty())) {
    if (!force) {
      console.log('Content already exists, skipping seed (use --force to replace it).');
      return;
    }
    console.log('Removing existing content...');
    await wipe();
  }

  // Entries are created oldest first; the site lists them newest first, like the original template
  for (const w of seed.works) {
    await create(UIDS.work, { ...w, image: await mediaId(w.image), content: await resolveBlocks(w.content) });
  }
  console.log(`works: ${seed.works.length}`);

  for (const p of seed.programs) {
    await create(UIDS.program, {
      ...p,
      image: await mediaId(p.image),
      content: await resolveBlocks(p.content),
      details: await resolveBlocks(p.details),
    });
  }
  console.log(`programs: ${seed.programs.length}`);
  console.log(`media files: ${uploaded.size}`);
}

async function main() {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();
  app.log.level = 'error';
  try {
    await run();
    await allowPublicRead();
    console.log('Public read access enabled for works and programs.');
  } finally {
    await app.destroy();
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
