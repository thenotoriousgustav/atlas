# PRD --- Atlas Reddit Bookmark Enrichment

**Product:** Atlas\
**Feature:** Reddit Bookmark Enrichment\
**Status:** Proposed\
**Version:** 1.0.0\
**Date:** 2026-08-10

## 1. Overview

Reddit Bookmark Enrichment mengubah URL Reddit menjadi bookmark dengan
rich preview seperti aplikasi bookmark manager modern.

Contoh:

`https://www.reddit.com/r/mac/comments/abc123/need_help_mac/`

Preview yang diharapkan:

``` text
┌──────────────────────────────────────────────┐
│ Reddit icon                    r/mac         │
│                                              │
│              [ POST IMAGE ]                  │
│                                              │
│  ↑ 0                         💬 8             │
├──────────────────────────────────────────────┤
│  need help : mac                             │
│  reddit.com · 11:24                          │
└──────────────────────────────────────────────┘
```

Versi ini **khusus Reddit**. GitHub, YouTube, npm, dan generic
enrichment berada di luar scope.

## 2. Problem Statement

URL Reddit yang disimpan sebagai string tidak memberikan konteks yang
cukup. Atlas harus mengubah URL menjadi data terstruktur:

``` text
Reddit URL
    ↓
Identify post
    ↓
Enrich Reddit metadata
    ↓
Normalize data
    ↓
Persist bookmark
    ↓
Render Reddit Preview
```

Preview harus dapat menampilkan title, subreddit, author bila tersedia,
media bila tersedia, score/upvotes, comment count, post type,
favicon/branding, timestamp, dan permalink.

## 3. Goals

### Primary

-   Mendeteksi URL Reddit.
-   Mengidentifikasi subreddit dan post ID.
-   Mengambil metadata melalui jalur Reddit yang diizinkan.
-   Menormalisasi metadata.
-   Menampilkan Reddit-specific bookmark preview.
-   Mendukung text, image, video, gallery, dan link post sejauh data
    tersedia.
-   Menyimpan URL media eksternal tanpa R2.
-   Menjalankan enrichment secara asynchronous.
-   Menangani error, timeout, dan rate limit.
-   Memisahkan Reddit provider dari core Bookmark domain.

### Secondary

-   Manual refresh metadata.
-   Metadata provenance.
-   Fondasi AI summarization di masa depan.
-   Fondasi provider lain di masa depan.

## 4. Non-Goals

Tidak termasuk:

-   Reddit client lengkap.
-   Login Reddit untuk user.
-   Posting, commenting, voting.
-   Private user data.
-   Crawling subreddit/Reddit massal.
-   Scraping Reddit HTML sebagai mekanisme utama.
-   Bypass anti-bot/rate limit.
-   Cloudflare R2.
-   Screenshot generation.
-   AI summarization.
-   Semantic search.
-   Provider selain Reddit.

## 5. Reddit API / Policy Constraint

Reddit menyediakan Data API untuk developer, tetapi akses tunduk pada
Developer Terms, Data API Terms, Responsible Builder Policy, dan
persyaratan akses yang berlaku.

Dokumentasi Reddit Data API yang diperbarui Mei 2026 menyatakan Reddit
Data API menggunakan OAuth untuk authentication. Reddit juga menyatakan
bahwa scraping Reddit atau layanannya tanpa authorized agreement tidak
diperbolehkan.

Karena kebijakan Reddit dapat berubah, Atlas **tidak boleh menjadikan
scraping HTML, undocumented JSON endpoints, atau bypass protection
sebagai fondasi production integration**.

Gunakan abstraction agar transport dapat diganti jika kebijakan/API
Reddit berubah.

Referensi: -
https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki -
https://support.reddithelp.com/hc/en-us/articles/14945211791892-Developer-Platform-Accessing-Reddit-Data -
https://support.reddithelp.com/hc/en-us/articles/360043512931-Don-t-break-the-site

## 6. User Stories

### Save Reddit Post

Sebagai pengguna Atlas, saya ingin menempelkan URL Reddit dan
mendapatkan preview post secara otomatis.

### View Reddit Preview

Sebagai pengguna Atlas, saya ingin melihat subreddit, title, image,
upvotes, dan jumlah komentar.

### Refresh

Sebagai pengguna Atlas, saya ingin memperbarui metadata ketika score,
komentar, atau media berubah.

### Failed Enrichment

Sebagai pengguna Atlas, saya tetap ingin bookmark tersimpan walaupun
Reddit tidak dapat diakses.

## 7. Supported URLs

MVP:

``` text
https://www.reddit.com/r/{subreddit}/comments/{postId}/{slug}/
https://reddit.com/r/{subreddit}/comments/{postId}/{slug}/
```

Future:

``` text
https://redd.it/{postId}
```

Parser menghasilkan:

``` typescript
interface RedditUrlInfo {
  postId: string;
  subreddit?: string;
  slug?: string;
  originalUrl: string;
}
```

## 8. Architecture

``` text
┌───────────────┐
│ Atlas Web     │
│ Next.js       │
└───────┬───────┘
        │ POST /bookmarks
        ▼
┌──────────────────┐
│ Bookmark API     │
│ NestJS           │
└────────┬─────────┘
         ▼
┌──────────────────┐
│ PostgreSQL/Prisma│
└────────┬─────────┘
         │ enqueue
         ▼
┌─────────────────────────┐
│ Reddit Enrichment Worker│
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Reddit Provider         │
│ URL Parser              │
│ RedditClient            │
│ Normalizer              │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Reddit Metadata         │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Reddit Bookmark Card    │
└─────────────────────────┘
```

## 9. Enrichment Lifecycle

``` text
User submits URL
        ↓
Validate URL
        ↓
Create bookmark
        ↓
PENDING
        ↓
Queue enrichment
        ↓
PROCESSING
        ↓
Parse Reddit URL
        ↓
Request authorized Reddit data
        ↓
Normalize
        ↓
Persist
        ↓
COMPLETED
```

Failure:

``` text
PROCESSING → RETRY → PROCESSING
PROCESSING → FAILED
```

Bookmark tetap ada walaupun enrichment gagal.

## 10. Data Source Strategy

### Preferred

``` text
Reddit URL
    ↓
Reddit Data API / authorized access
    ↓
Post metadata
```

### Fallback

Jika Reddit-specific API access tidak tersedia untuk use case Atlas:

``` text
Reddit URL
    ↓
Allowed page metadata
    ↓
OG/Twitter metadata
    ↓
Basic preview
```

Fallback hanya boleh menyediakan metadata yang memang tersedia. Jangan
scrape score/comment count dari HTML.

## 11. Reddit Metadata Model

``` typescript
interface RedditBookmarkMetadata {
  postId: string;

  subreddit?: {
    name: string;
    displayName?: string;
    url?: string;
    iconUrl?: string;
  };

  author?: {
    username: string;
    profileUrl?: string;
    avatarUrl?: string;
  };

  post: {
    title: string;
    type: 'text' | 'image' | 'video' | 'gallery' | 'link' | 'unknown';
    permalink: string;
    externalUrl?: string;
    createdAt?: string;
    editedAt?: string | null;
  };

  media?: {
    type: 'image' | 'video' | 'gallery';
    url?: string;
    thumbnailUrl?: string;
    items?: Array<{
      url: string;
      thumbnailUrl?: string;
    }>;
  };

  stats?: {
    score?: number;
    commentCount?: number;
  };
}
```

## 12. Required Fields

Minimum:

``` text
postId
title
permalink
subreddit
```

Preferred:

``` text
author
score
commentCount
createdAt
postType
media
```

Optional:

``` text
subreddit icon
author avatar
editedAt
externalUrl
gallery items
```

## 13. Post Types

### Text

Render title, subreddit, stats, timestamp without large media.

### Image

Use returned Reddit media/thumbnail as card cover.

### Video

Use thumbnail when available and display play indicator. Do not
download/transcode video.

### Gallery

Use first image as card cover. Store gallery metadata if available. Full
gallery viewer is optional.

### Link

Store `externalUrl`. Nested provider enrichment is out of scope for MVP.

## 14. Preview View Model

``` typescript
interface RedditBookmarkPreview {
  source: {
    name: 'Reddit';
    domain: 'reddit.com';
    iconUrl?: string;
  };

  subreddit?: {
    name: string;
    iconUrl?: string;
  };

  title: string;

  media?: {
    type: 'image' | 'video' | 'gallery';
    previewUrl: string;
  };

  stats?: {
    score?: number;
    comments?: number;
  };

  timestamp?: string;
}
```

## 15. Frontend Components

``` text
RedditBookmarkCard
├── RedditHeader
│   ├── RedditIcon
│   └── Subreddit
├── MediaPreview
│   ├── Image
│   ├── VideoThumbnail
│   └── GalleryPreview
├── PostStats
│   ├── Score
│   └── Comments
└── BookmarkFooter
    ├── Title
    ├── Domain
    └── Timestamp
```

## 16. Image Handling --- No R2

MVP **tidak menggunakan Cloudflare R2**.

Simpan URL eksternal:

``` text
media.url
media.thumbnailUrl
subreddit.iconUrl
author.avatarUrl
```

Frontend mengambil asset langsung dari sumber.

Requirements:

-   broken-image fallback;
-   placeholder;
-   lazy loading;
-   stable dimensions;
-   no server-side image proxy;
-   no video download/transcoding.

Image persistence dapat ditambahkan kemudian tanpa mengubah Reddit
metadata contract.

## 17. Database Schema

``` prisma
model Bookmark {
  id String @id @default(cuid())

  url          String
  canonicalUrl String?

  title       String?
  description String?

  imageUrl   String?
  faviconUrl String?
  siteName   String?

  provider    BookmarkProvider?
  contentType BookmarkContentType?

  metadataStatus MetadataStatus @default(PENDING)
  metadataError  String?

  metadata Json?

  lastEnrichedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([canonicalUrl])
  @@index([provider])
  @@index([metadataStatus])
  @@index([createdAt])
}

enum BookmarkProvider {
  REDDIT
}

enum BookmarkContentType {
  SOCIAL_POST
  IMAGE
  VIDEO
  ARTICLE
  LINK
  UNKNOWN
}

enum MetadataStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

Contoh `metadata`:

``` json
{
  "reddit": {
    "postId": "abc123",
    "subreddit": { "name": "mac" },
    "post": {
      "title": "need help : mac",
      "type": "image"
    },
    "stats": {
      "score": 0,
      "commentCount": 8
    }
  }
}
```

## 18. Metadata Provenance

Field penting dapat menyimpan source:

``` json
{
  "title": {
    "value": "need help : mac",
    "source": "reddit_data_api"
  },
  "image": {
    "value": "https://i.redd.it/...",
    "source": "reddit_media"
  }
}
```

Fallback:

``` json
{
  "title": {
    "value": "need help : mac",
    "source": "og:title"
  }
}
```

## 19. API

### Create

``` http
POST /bookmarks
```

``` json
{
  "url": "https://www.reddit.com/r/mac/comments/abc123/need_help_mac/"
}
```

Response:

``` json
{
  "id": "bookmark_123",
  "url": "https://www.reddit.com/r/mac/comments/abc123/need_help_mac/",
  "provider": "REDDIT",
  "metadataStatus": "PENDING"
}
```

### Get

``` http
GET /bookmarks/:id
```

### Refresh

``` http
POST /bookmarks/:id/enrichment/refresh
```

Existing preview remains visible while refresh runs.

## 20. Reddit Client Abstraction

Do not couple the provider to raw HTTP.

``` typescript
interface RedditClient {
  getPost(postId: string): Promise<RedditPostData>;
}
```

Implementation:

``` typescript
class RedditDataApiClient implements RedditClient {
  async getPost(postId: string) {
    // authorized Reddit API request
  }
}
```

This isolates authentication and future Reddit API changes.

## 21. Authentication

If Reddit Data API access requires OAuth/application approval,
credentials remain server-side.

Never expose:

``` text
client secret
access token
refresh token
```

to the browser.

Recommended:

``` text
Atlas Worker
    ↓
RedditClient
    ↓
OAuth credentials
    ↓
Reddit API
```

Environment secrets:

``` text
REDDIT_CLIENT_ID
REDDIT_CLIENT_SECRET
REDDIT_USER_AGENT
REDDIT_ACCESS_TOKEN
```

The exact credential/access flow must follow current Reddit
requirements.

## 22. Rate Limiting

Respect Reddit's current rate limits and response headers.

Worker must implement:

``` text
request queue
concurrency limit
429 handling
Retry-After handling when available
backoff
```

Never immediately retry a rate-limited request.

## 23. Retry

Transient:

``` text
429
5xx
timeout
network error
```

Suggested:

``` text
Attempt 1
↓ 30s
Attempt 2
↓ 2m
Attempt 3
↓ 10m
FAILED
```

Permanent:

``` text
invalid URL
deleted post
private/unavailable post
unauthorized
unsupported access
```

must not retry indefinitely.

## 24. Error States

``` text
INVALID_REDDIT_URL
POST_NOT_FOUND
POST_DELETED
POST_PRIVATE
UNAUTHORIZED
RATE_LIMITED
REDDIT_UNAVAILABLE
TIMEOUT
NETWORK_ERROR
MEDIA_UNAVAILABLE
PROVIDER_ERROR
UNKNOWN
```

## 25. Security

### SSRF

Only:

``` text
http://
https://
```

Allowed hosts must be validated before Reddit-specific processing.

### Redirects

For shortened URLs:

``` text
maxRedirects = 5
```

Every redirect target must be validated.

### External Media

Treat Reddit media URLs as untrusted external resources. Do not execute,
proxy, or download arbitrary content server-side.

## 26. Caching

MVP:

``` text
No aggressive global cache.
```

Persist enriched metadata in PostgreSQL.

Normal bookmark rendering reads PostgreSQL and does not call Reddit.

Refresh only when:

``` text
user explicitly requests refresh
```

Automatic polling is out of scope.

## 27. Performance

  Metric                           Target
  --------------------------- -----------
  Create bookmark API           \< 500 ms
  Queue creation                \< 200 ms
  Reddit enrichment                \< 5 s
  API timeout                        10 s
  Preview render after data     \< 100 ms

Create bookmark must not wait for enrichment.

## 28. Acceptance Criteria

### AC-01 Reddit Detection

Given a valid Reddit post URL, `provider = REDDIT` and
`metadataStatus = PENDING`.

### AC-02 URL Parsing

Given:

``` text
https://www.reddit.com/r/mac/comments/abc123/need_help_mac/
```

Parser returns:

``` json
{
  "postId": "abc123",
  "subreddit": "mac",
  "slug": "need_help_mac"
}
```

### AC-03 Successful Enrichment

When authorized Reddit data is available, store title, subreddit, post
ID, post type, permalink and available author/stats/media.

Status becomes `COMPLETED`.

### AC-04 Image Preview

Image post displays the external Reddit media/thumbnail URL directly. No
R2 upload occurs.

### AC-05 Text Post

Text post renders without a large media area.

### AC-06 Video Post

Video post displays thumbnail and play indicator when available. Atlas
does not download/transcode video.

### AC-07 Gallery

Gallery uses first image as card cover and does not require a gallery
viewer for MVP.

### AC-08 Unavailable Post

Deleted/private/unavailable post remains saved and becomes `FAILED` with
graceful fallback.

### AC-09 API Failure

Timeout/5xx keeps bookmark intact, retries according to policy, and
records failure if retries are exhausted.

### AC-10 Rate Limit

429 does not trigger immediate retry. Backoff is applied.

### AC-11 Fallback Metadata

If Reddit-specific enrichment cannot be performed but allowed page
metadata is available, Atlas may render a basic OG/Twitter preview.
Reddit-specific stats are omitted.

## 29. MVP Scope

### Must Have

-   Reddit URL detection.
-   Reddit URL parser.
-   Reddit provider.
-   RedditClient abstraction.
-   Authorized Reddit data access integration.
-   OAuth/credential handling where required.
-   Title.
-   Subreddit.
-   Post ID.
-   Post type.
-   Permalink.
-   Media URL.
-   Score when available.
-   Comment count when available.
-   Async enrichment.
-   PostgreSQL persistence.
-   Prisma model.
-   Retry.
-   Timeout.
-   Rate-limit handling.
-   Error states.
-   Reddit bookmark card.
-   Manual refresh.
-   No R2.

### Should Have

-   Subreddit icon.
-   Author avatar.
-   Gallery metadata.
-   Video thumbnail.
-   Metadata provenance.
-   Canonical URL.
-   Duplicate detection.

### Could Have

-   Nested external URL enrichment.
-   AI summary.
-   Automatic tags.
-   Full content extraction.
-   Gallery viewer.
-   Scheduled metadata refresh.

### Won't Have

-   R2.
-   Image proxy.
-   Video storage.
-   Reddit crawling.
-   Subreddit monitoring.
-   Reddit login.
-   Posting/commenting.
-   Voting.
-   AI summarization.
-   Semantic search.
-   Other providers.

## 30. Implementation Phases

### Phase 1 --- Foundation

``` text
Bookmark model
↓
Reddit URL parser
↓
Reddit provider
↓
RedditClient abstraction
```

### Phase 2 --- Reddit Integration

``` text
OAuth / authorized access
↓
Get post data
↓
Normalize
↓
Persist
```

### Phase 3 --- Async Worker

``` text
Create bookmark
↓
Queue
↓
Reddit worker
↓
Retry / timeout
```

### Phase 4 --- UI

``` text
RedditBookmarkCard
├── subreddit
├── title
├── media
├── score
├── comments
└── timestamp
```

### Phase 5 --- Reliability

``` text
Rate limits
Error classification
Observability
Manual refresh
Fallback metadata
```

## 31. Recommended Project Structure

``` text
src/
└── modules/
    └── bookmark/
        ├── application/
        │   └── commands/
        │       └── enrich-reddit-bookmark/
        ├── domain/
        │   └── enrichment/
        │       └── bookmark-enrichment-provider.ts
        ├── infrastructure/
        │   └── reddit/
        │       ├── reddit-client.ts
        │       ├── reddit-data-api.client.ts
        │       ├── reddit-url.parser.ts
        │       └── reddit.mapper.ts
        └── presentation/
            └── bookmark.controller.ts
```

Frontend:

``` text
features/
└── bookmarks/
    ├── components/
    │   ├── bookmark-card.tsx
    │   └── reddit-bookmark-card.tsx
    ├── types/
    │   └── reddit-bookmark.ts
    └── utils/
        └── format-reddit-stats.ts
```

## 32. Design Principles

### Reddit-specific logic stays isolated

Gunakan:

``` text
RedditProvider
RedditClient
RedditNormalizer
RedditBookmarkCard
```

Jangan memasukkan Reddit-specific logic ke core `BookmarkService`.

### API response is not the domain model

Gunakan:

``` text
Reddit API
↓
Mapper
↓
RedditBookmarkMetadata
↓
PostgreSQL
```

### Enrichment is asynchronous

User tidak menunggu Reddit API saat membuat bookmark.

### Failure is graceful

``` text
Bookmark ≠ Enrichment
```

Bookmark tetap berguna walaupun enrichment gagal.

### External media stays external

Tidak ada R2 pada MVP. Jika media persistence ditambahkan kemudian,
kontrak metadata tidak perlu berubah.

## 33. Future Extension

Setelah Reddit MVP stabil:

``` text
Reddit Provider
      ↓
Provider Registry
      ↓
┌──────────┬──────────┬──────────┐
│ Reddit   │ GitHub   │ YouTube  │
└──────────┴──────────┴──────────┘
```

Reddit menjadi provider pertama dari Bookmark Enrichment Engine Atlas.

## 34. Definition of Done

-   [ ] Reddit URL detection works.
-   [ ] Reddit post URL parser works.
-   [ ] Reddit provider isolated from core bookmark domain.
-   [ ] RedditClient abstraction exists.
-   [ ] Authorized Reddit data access configured where required.
-   [ ] Post title extracted.
-   [ ] Subreddit extracted.
-   [ ] Post ID extracted.
-   [ ] Post type detected.
-   [ ] Permalink stored.
-   [ ] Score stored when available.
-   [ ] Comment count stored when available.
-   [ ] Media URL stored when available.
-   [ ] Subreddit icon stored when available.
-   [ ] Author data stored when available.
-   [ ] Enrichment runs asynchronously.
-   [ ] Retry implemented.
-   [ ] Timeout implemented.
-   [ ] Rate limits respected.
-   [ ] Failed enrichment does not delete bookmark.
-   [ ] Manual refresh implemented.
-   [ ] Reddit Bookmark Card implemented.
-   [ ] Text posts render correctly.
-   [ ] Image posts render correctly.
-   [ ] Video posts render correctly.
-   [ ] Gallery posts have defined fallback.
-   [ ] Link posts render correctly.
-   [ ] No R2 is used.
-   [ ] No Reddit scraping/bypass mechanism is used.
-   [ ] Metadata persisted in PostgreSQL.
