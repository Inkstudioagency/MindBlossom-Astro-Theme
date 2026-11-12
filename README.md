# MindBlossom — Astro theme with Strapi CMS

MindBlossom is a daycare, preschool and childcare theme for [Astro](https://astro.build). Care programs ("Work") and family events ("Programs") are managed in [Strapi](https://strapi.io), which is included in the `strapi/` folder with demo content.

- 11 pages: Home, About, Work, Programs, Daily Routine, Documents, The First Day Guide, Gallery, Contact Us, Style Guide and 404
- Detail pages generated from Strapi: `/work/[slug]` and `/programs/[slug]`, plus paginated program lists (`/programs/page/2`...)
- Page-load, scroll and hover animations, smooth scrolling, sliders, tabs, FAQ accordions, a mega menu, background videos, a Lottie marquee and a mobile menu
- Static output: no server needed in production, the site is rebuilt when content changes

## Requirements

- Node.js 22.23.4 or newer (Strapi supports Node 20 to 26)
- npm (any package manager works; the scripts below use npm)

## Quick start

```bash
# 1. Install the theme and the CMS
npm install
npm run cms:install

# 2. Configure Strapi (replace every "tobemodified" value with a random secret)
cp strapi/.env.example strapi/.env

# 3. Load the demo content into Strapi (works, programs and their images)
npm run cms:seed

# 4. Start Strapi on http://localhost:1337 (create your admin user at /admin)
npm run cms:dev

# 5. In a second terminal: configure and start Astro on http://localhost:4321
cp .env.example .env
npm run dev
```

`npm run build` writes the static site to `dist/`. The content is fetched from Strapi at build time, so Strapi must be reachable while building.

### Demo mode (no Strapi)

When `STRAPI_URL` is not set, the site is built from the demo content bundled in `strapi/data/seed.json` (the same data `npm run cms:seed` imports), and its images are served from `/cms-demo/`. This lets you preview the theme with just `npm install && npm run build`. Set `STRAPI_URL` to switch to your Strapi content.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `STRAPI_URL` | yes, for your own content | Base URL of the Strapi server, e.g. `http://localhost:1337`. Leave it unset to build with the demo content. |
| `STRAPI_TOKEN` | no | Read-only API token. Leave empty if the Public role can read the content (the seed script allows `find` and `findOne`). |
| `STRAPI_MEDIA` | no | By default the build downloads every Strapi image it uses into `dist/cms/`, so the deployed site does not depend on Strapi. Set it to `remote` to link to the Strapi URLs instead (e.g. when Strapi serves media from a CDN). |
| `PUBLIC_FORM_ENDPOINT` | no | URL that receives the contact and newsletter forms (Formspree, Basin, Getform or your own API). Without it, forms show their success message but send nothing. |

The Strapi server has its own `strapi/.env` (secrets, database, `MCP_ENABLED`); see `strapi/.env.example`.

## Project structure

```text
├── public/
│   ├── images/            # theme images, icons and favicons
│   ├── videos/            # background videos (mp4 + webm + poster)
│   ├── documents/         # Lottie animation
│   └── js/                # interaction runtime (webflow.js) and jQuery
├── integrations/          # CMS media in the build (demo images, Strapi downloads)
├── src/
│   ├── components/
│   │   ├── cards/         # WorkCard, ProgramCard, related cards, EmptyState
│   │   ├── layout/        # Header, Footer
│   │   ├── sections/      # page sections, one folder per page (+ shared)
│   │   ├── ui/            # PrimaryButton, EventMeta, SocialIcon
│   │   ├── RichText.astro # Strapi rich text
│   │   └── SeoMeta.astro
│   ├── config/            # config.json, menu.json, social.json
│   ├── layouts/           # BaseLayout
│   ├── lib/               # Strapi client, content queries, pagination, rich text renderer
│   ├── pages/             # routes, including work/ and programs/ [slug] pages
│   ├── scripts/           # animations and forms (client side)
│   ├── styles/            # theme CSS
│   └── content.config.ts  # Strapi-backed content collections
└── strapi/                # Strapi 5 project (content types, seed data and script)
```

## Content model (Strapi)

| Collection | Fields | Used on |
| --- | --- | --- |
| **Work** | name, slug, image, tagline, short description, category, focus, program lead, stats (up to 3 × value + label), content (rich text), SEO | Home slider, `/work`, `/work/[slug]` |
| **Program** | name, slug, image, tag, date, time, location, availability, content (rich text), schedule (time + activity), details (rich text), SEO | Home slider, `/programs`, `/programs/[slug]` |

Shared components: `shared.stat`, `shared.schedule-item`, `shared.seo`. Rich text uses Strapi's Blocks editor and is rendered with the template's rich text styles (`src/lib/blocks.ts`). On program pages, images in **Content** are shown full width and images in **Details** (such as the map) at the template's smaller default size.

Which entries appear where (newest first, like the original template):

- `/work`: every work. Home slider: the three earliest works. Work pages: three other works under "Read More".
- `/programs`: every program, 6 per page (`collections.programs_per_page` in `src/config/config.json`). Home slider: the four newest programs. Program pages: three other programs under "More Events".
- The footer's "Work Details" and "Programs Details" links point to the newest entry of each collection.

The queries live in `src/lib/content.ts`.

### Publishing changes

The site is static, so published changes appear after the next build. In production, add a webhook in Strapi (Settings > Webhooks) that calls your host's deploy hook on entry publish/unpublish.

### Strapi MCP server

The [Strapi MCP server](https://docs.strapi.io/cms/features/strapi-mcp-server) is enabled in `strapi/config/server.ts`, so AI assistants can list, create, update and publish works and programs and browse the Media Library. Create an admin token in the Strapi admin (Settings > Admin tokens), then connect, for example with Claude Code:

```bash
claude mcp add strapi-mcp --transport http http://localhost:1337/mcp -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

See `strapi/README.md` for token permissions and caveats. Set `MCP_ENABLED=false` in `strapi/.env` to turn it off.

## Customization

- **Site settings, SEO defaults, announcement bar, footer texts, privacy link**: `src/config/config.json`
- **Footer links**: `src/config/menu.json`; **social links**: `src/config/social.json`
- **Page titles and descriptions**: the `BaseLayout` props in each file in `src/pages`
- **Colors, spacing and typography**: the CSS variables at the top of `src/styles/mindblossom.css`
- **Fonts** (Parkinsans, Instrument Serif): `fonts` in `astro.config.mjs` (self-hosted by Astro)
- **Forms**: set `PUBLIC_FORM_ENDPOINT`; the handler is `src/scripts/forms.ts`

### Animations

Animations are attached with attributes such as `heading-rebuild`, `to-top-2`, `scroll-rotate` and `parallax`, and played by the interaction runtime in `public/js/webflow.js`, which also runs the sliders, tabs, dropdowns, mobile menu, background videos and the Lottie marquee. Each page passes its `wfPage` id to `BaseLayout` and the header gets its `instance` id; keep them when you edit a page, because the runtime uses them to find that page's animations. Elements with `data-counter` count up when scrolled into view (`src/scripts/animations.ts`).

## Deployment

Build with `npm run build` and deploy `dist/` to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages...). Set `STRAPI_URL` (and `STRAPI_TOKEN` if used) in the host's build settings, and set `site.base_url` in `src/config/config.json` to your domain.

Deploy Strapi separately (Strapi Cloud, a VPS or a container), with a production database such as PostgreSQL; see `strapi/config/database.ts`.

## Troubleshooting

- **Build fails with "Could not reach Strapi"**: start Strapi (`npm run cms:dev`) or check `STRAPI_URL` in `.env`.
- **Build fails with a 401/403 from Strapi**: run `npm run cms:seed` (it allows public read access) or set `STRAPI_TOKEN`.
- **`An Application Control policy has blocked this file` on Windows**: Windows Smart App Control can block newly published native modules (Astro's compiler, sharp). Install the WebAssembly build of the blocked module without saving it, e.g. `npm install --no-save --force @astrojs/compiler-binding-wasm32-wasi` (repeat after each `npm install`), or run the project in WSL.

## Credits

Designed by [Ink Studio](https://www.inks.studio/).
