import { BookmarkContentType, BookmarkProvider } from '@prisma/client';

export interface EnrichmentContext {
  url: URL;
  rawUrl: string;
}

export interface EnrichmentResult {
  provider: BookmarkProvider;
  contentType: BookmarkContentType;
  title: string;
  description?: string;
  imageUrl?: string;
  faviconUrl?: string;
  siteName?: string;
  canonicalUrl?: string;
  metadata: Record<string, any>;
}

export interface BookmarkEnrichmentProvider {
  readonly name: BookmarkProvider;
  supports(url: URL): boolean;
  enrich(context: EnrichmentContext): Promise<EnrichmentResult>;
}
