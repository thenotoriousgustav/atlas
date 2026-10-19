# Cabinet

Cabinet is a personal library for bookmarks, notes, and saved reading. It is one product, not a portal for multiple applications.

## Features

- Save links with generic page metadata and image previews.
- Write notes on a dedicated page with an Editorcn/Tiptap block editor, slash commands, draggable blocks, rich text, checklists, code blocks, resizable tables, and URL-based images.
- Autosave note changes to the account, with visible save errors, retries, and a browser-local draft backup.
- Organize bookmarks and notes with folders and tags.
- Share any folder as a read-only public bookmark collection at `/share/[token]`, and revoke the link at any time without exposing notes, archived items, or subfolders.
- Search, favorite, archive, and reorder saved items.
- Import and export bookmarks.
- Check broken links and duplicate bookmarks.
- Open saved links in a browser tab.
- Download supported media.
- Sign in with GitHub, Google, or email and password.
- Automatically create accounts for new OAuth users with verified email addresses.
- Keep folders, bookmarks, and tags private to each user.

## Structure

```text
apps/
  web/              Next.js Cabinet frontend and web-only UI
  api/              NestJS Cabinet API and background workers
packages/
  api-client/       Shared API client and types
  eslint-config/    Lint configuration
  typescript-config/ TypeScript configuration
```

Web UI components, hooks, and styles live in `apps/web/src`. Better Auth handles browser authentication through `apps/web/src/lib/auth-client.ts` and runs in the NestJS API with Prisma-backed sessions. The web API adapter at `apps/web/src/lib/api-client.ts` configures cookie requests, expired-session redirects, and browser downloads. Shared API code has no DOM access or browser authentication policy, so a future React Native application can configure its own transport.

The API contains only the Cabinet feature module. Authentication, user profiles, health checks, and database services support Cabinet.

One Next.js frontend serves all routes:

- `/` is the public landing page, rendered as a Server Component and prerendered for SEO.
- `/login` handles authentication and redirects signed-in users to `/cabinet`.
- `/share/[token]` renders an unindexed, read-only public collection of direct bookmarks in a shared folder.
- `/cabinet` runs the dashboard entirely in the browser using `next/dynamic` with `ssr: false`. Only its loading shell is prerendered; user data is fetched from the separate NestJS API after the dashboard loads.

Query, tooltip, confirmation, and toast providers are scoped to login and Cabinet routes. The landing page does not load the dashboard or make authentication requests. Private routes are excluded from search indexing. API guards remain responsible for authorization; client-side rendering is not a security boundary.

## Notes

Creating or opening a note navigates to `/cabinet/notes/[id]`. The editor is dynamically loaded with server rendering disabled, independently of the dashboard. Blank new pages are not saved until the first change. The API's authenticated `PUT /v1/bookmarks/:id/note` uses a stable UUID so retrying a creation does not create another note. Requests are debounced and serialized; leaving through the Cabinet button flushes outstanding changes.

Structured content is stored in the optional `Bookmark.noteDocument` JSON column. `Bookmark.notes` remains a plain-text preview for the library and search. Legacy text is loaded as literal paragraphs, not HTML, and retains blank lines and markup. Existing folders and tags remain attached. The additive migration does not rewrite old records.

Pending changes are backed up in localStorage under the current user and note ID. A recovered draft for an existing server-backed note requires an explicit restore choice before it can replace the saved content. Clearing browser storage removes this local backup, not account data. Images use public HTTP(S) URLs; file upload is not enabled.

Editor components are installed from the [Editorcn registry](https://editorcn.vercel.app) and use its Phosphor icon preset. Core editor, table, image-placeholder, and extension UI styles load only with the note editor.

## Data compatibility

Reader View, Live Web View, article extraction, reading progress, and Wayback backup requests are removed. Existing article records remain in the database but are no longer fetched or updated.

The existing database name and migration history remain unchanged. The rename does not delete stored bookmarks, notes, articles, or credentials. Passkey endpoints are disabled; legacy credential records remain stored. Verified Google and GitHub identities automatically link to an existing account with the same email; user records are never merged.

See [how-to-run.md](./how-to-run.md) for setup and development commands.
