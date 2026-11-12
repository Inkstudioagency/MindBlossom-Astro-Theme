# MindBlossom CMS (Strapi 5)

The content backend of the MindBlossom Astro theme. It stores the care programs ("Work") and family events ("Programs"); the Astro site reads them through the REST API at build time.

## Setup

```bash
npm install
cp .env.example .env   # then replace every "tobemodified" value with a random secret
npm run seed           # demo content + public read access
npm run develop        # http://localhost:1337/admin
```

`npm run seed` only runs on an empty database. Use `npm run seed -- --force` to delete both collections and import the demo content again.

## Content types

| Type | API | Notes |
| --- | --- | --- |
| Work | `/api/works` | `stats` is a repeatable `shared.stat` component (max 3); `content` uses the Blocks editor |
| Program | `/api/programs` | `schedule` is a repeatable `shared.schedule-item` component; `content` (above the schedule) and `details` (below it) use the Blocks editor |

Both types have an optional `seo` component (`shared.seo`: meta title and description) and use Draft & Publish; the site only shows published entries, newest first. Schemas live in `src/api/*/content-types/*/schema.json` and `src/components/shared`.

## Demo data

`data/seed.json` and `data/uploads/` hold the demo content. Each image is uploaded with its own alternative text, which the theme uses as the `alt` attribute. The Astro site also reads `data/seed.json` directly when it is built without a Strapi server (demo mode).

## MCP server

The Strapi MCP server is enabled (`config/server.ts`, `MCP_ENABLED` in `.env`). It listens on `POST /mcp` (Streamable HTTP) and authenticates with an **admin token** (Settings > Admin tokens), not an API token.

```bash
claude mcp add strapi-mcp --transport http http://localhost:1337/mcp -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

The tools a client sees follow the token's permissions. A token with read, create, update and publish on Work and Program plus Media Library read exposes `list_work`, `get_work`, `create_work`, `update_work`, `publish_work`, `unpublish_work`, `discard_work_draft`, the same for `program`, and `media_list_assets`, `media_get_asset`, `media_list_folders`. Grant delete only if the assistant should be able to delete entries.

Good to know:

- `update_*` validates the whole entry, so an update must include the type's required fields (Work: `name`, `slug`, `image`, `tagline`, `shortDescription`, `category`; Program: `name`, `slug`, `image`, `tag`, `date`, `time`, `location`), not only the field being changed. Fields you leave out keep their values.
- Media fields take the numeric id of an existing asset (find it with `media_list_assets`). The MCP server cannot upload files: upload images in the Media Library first.
- Created and updated entries are drafts until `publish_*` is called. The site shows them after the next build.
- Content types themselves are edited in the Content-Type Builder or in the schema files, not through MCP.

## Troubleshooting

- **`Could not load the "sharp" module` / `An Application Control policy has blocked this file` on Windows**: Windows Smart App Control is blocking the native image library that Strapi's Media Library uses. Run Strapi in Docker or WSL, or install sharp's WebAssembly build (`npm install --no-save @img/sharp-wasm32`, repeat after each `npm install`).
- **`Too many requests` on admin login**: Strapi rate-limits admin logins; wait a few minutes or restart the server.

## Production

- Use PostgreSQL or MySQL instead of SQLite (`config/database.ts`, `DATABASE_*` variables).
- Run `npm run build` then `npm run start`.
- Add a webhook (Settings > Webhooks) that triggers a rebuild of the Astro site when entries are published or unpublished.
- If you prefer not to expose the API publicly, remove the Public role's `find`/`findOne` permissions and give the site a read-only API token (`STRAPI_TOKEN`).
