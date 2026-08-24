import { Injectable, Logger } from '@nestjs/common';
import { BookmarkContentType, BookmarkProvider } from '@prisma/client';
import axios from 'axios';
import { MetadataService } from '../services/metadata.service';
import {
  BookmarkEnrichmentProvider,
  EnrichmentContext,
  EnrichmentResult,
} from './enrichment-provider.interface';

@Injectable()
export class RedditProvider implements BookmarkEnrichmentProvider {
  readonly name = BookmarkProvider.REDDIT;
  private readonly logger = new Logger(RedditProvider.name);

  constructor(private readonly metadataService: MetadataService) {}

  supports(url: URL): boolean {
    // ponytail: regex matches reddit comment permalinks across standard domains
    const host = url.hostname.toLowerCase();
    const isRedditHost =
      host === 'reddit.com' ||
      host === 'www.reddit.com' ||
      host === 'old.reddit.com' ||
      host === 'm.reddit.com';
    return isRedditHost && /\/r\/[^/]+\/comments\/[^/]+/i.test(url.pathname);
  }

  async enrich(context: EnrichmentContext): Promise<EnrichmentResult> {
    const match = context.url.pathname.match(/\/r\/([^/]+)\/comments\/([^/]+)/i);
    if (!match) {
      throw new Error('Invalid Reddit comment URL structure');
    }

    const [, subreddit, postId] = match;

    // ponytail: try direct reddit json endpoint first, fallback to OpenGraph metadata on HTTP errors
    try {
      const jsonUrl = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json`;
      const response = await axios.get(jsonUrl, {
        headers: {
          'User-Agent': 'web:atlas-bookmark-enrichment:v1.0.0 (by /u/atlas_app)',
          Accept: 'application/json',
        },
        timeout: 6000,
      });

      if (Array.isArray(response.data) && response.data[0]?.data?.children?.[0]?.data) {
        const post = response.data[0].data.children[0].data;

        let rawPostType = 'link';
        if (post.is_gallery) {
          rawPostType = 'gallery';
        } else if (post.post_hint === 'image' || /\.(jpg|jpeg|png|gif|webp)$/i.test(post.url || '')) {
          rawPostType = 'image';
        } else if (post.is_video || post.post_hint?.includes('video')) {
          rawPostType = 'video';
        } else if (post.is_self) {
          rawPostType = 'text';
        }

        let imageUrl: string | undefined;
        if (rawPostType === 'image') {
          imageUrl = post.url;
        } else if (post.preview?.images?.[0]?.source?.url) {
          imageUrl = post.preview.images[0].source.url.replace(/&amp;/g, '&');
        } else if (typeof post.thumbnail === 'string' && post.thumbnail.startsWith('http')) {
          imageUrl = post.thumbnail;
        }

        const description = post.selftext
          ? post.selftext.slice(0, 300)
          : undefined;

        let contentType: BookmarkContentType = BookmarkContentType.SOCIAL_POST;
        if (rawPostType === 'image' || rawPostType === 'gallery') {
          contentType = BookmarkContentType.IMAGE;
        } else if (rawPostType === 'video') {
          contentType = BookmarkContentType.VIDEO;
        }

        return {
          provider: BookmarkProvider.REDDIT,
          contentType,
          title: post.title,
          description,
          imageUrl,
          siteName: 'Reddit',
          faviconUrl: 'https://www.redditstatic.com/shreddit/assets/favicon/192x192.png',
          canonicalUrl: `https://www.reddit.com${post.permalink}`,
          metadata: {
            reddit: {
              postId: post.id || postId,
              subreddit: {
                name: post.subreddit,
                displayName: `r/${post.subreddit}`,
              },
              author: {
                username: post.author,
                profileUrl: post.author ? `https://www.reddit.com/user/${post.author}` : undefined,
              },
              post: {
                title: post.title,
                type: rawPostType,
                permalink: `https://www.reddit.com${post.permalink}`,
                externalUrl: post.is_self ? undefined : post.url,
                createdAt: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : undefined,
              },
              media: imageUrl
                ? {
                    type: rawPostType === 'gallery' ? 'gallery' : rawPostType === 'video' ? 'video' : 'image',
                    url: imageUrl,
                    thumbnailUrl: post.thumbnail?.startsWith('http') ? post.thumbnail : undefined,
                  }
                : undefined,
              stats: {
                score: post.score,
                commentCount: post.num_comments,
              },
            },
          },
        };
      }
    } catch (error: any) {
      this.logger.warn(
        `Reddit JSON endpoint failed for ${context.url.pathname} (${error.message}). Executing OpenGraph fallback.`,
      );
    }

    // ponytail: fallback to HTML OpenGraph extraction if Reddit JSON endpoint is blocked
    const extracted = await this.metadataService.extract(context.url.toString());
    const pathParts = context.url.pathname.split('/').filter(Boolean);
    const titleSlug = pathParts.length >= 4 ? pathParts[3].replace(/_/g, ' ') : undefined;
    const fallbackTitle =
      extracted.title && !extracted.title.includes('reddit.com')
        ? extracted.title
        : titleSlug
        ? `${titleSlug} : r/${subreddit}`
        : `r/${subreddit} Post`;

    return {
      provider: BookmarkProvider.REDDIT,
      contentType: BookmarkContentType.SOCIAL_POST,
      title: fallbackTitle,
      description: extracted.description || undefined,
      imageUrl: extracted.imageUrl,
      siteName: 'Reddit',
      faviconUrl: 'https://www.redditstatic.com/shreddit/assets/favicon/192x192.png',
      canonicalUrl: context.url.toString(),
      metadata: {
        reddit: {
          postId,
          subreddit: { name: subreddit },
          post: {
            title: fallbackTitle,
            type: 'link',
            permalink: context.url.pathname,
          },
          fallbackMode: true,
        },
      },
    };
  }
}
