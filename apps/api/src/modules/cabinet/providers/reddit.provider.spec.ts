import { Test, TestingModule } from '@nestjs/testing';
import { BookmarkContentType, BookmarkProvider } from '@prisma/client';
import { RedditProvider } from './reddit.provider';
import { MetadataService } from '../services/metadata.service';

describe('RedditProvider', () => {
  let provider: RedditProvider;
  let metadataService: MetadataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedditProvider,
        {
          provide: MetadataService,
          useValue: {
            extract: jest.fn().mockResolvedValue({
              title: 'Fallback Title : r/mac',
              description: 'Fallback description',
              imageUrl: 'https://example.com/fallback.png',
            }),
          },
        },
      ],
    }).compile();

    provider = module.get<RedditProvider>(RedditProvider);
    metadataService = module.get<MetadataService>(MetadataService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
    expect(provider.name).toBe(BookmarkProvider.REDDIT);
  });

  describe('supports', () => {
    it('should return true for valid Reddit post URLs', () => {
      const validUrls = [
        'https://www.reddit.com/r/mac/comments/abc123/need_help_mac/',
        'https://reddit.com/r/technology/comments/xyz789/some_news/',
        'https://old.reddit.com/r/programming/comments/123456/title/',
        'https://m.reddit.com/r/askreddit/comments/654321/question/',
      ];

      for (const urlStr of validUrls) {
        expect(provider.supports(new URL(urlStr))).toBe(true);
      }
    });

    it('should return false for non-Reddit or invalid post URLs', () => {
      const invalidUrls = [
        'https://github.com/nestjs/nest',
        'https://www.reddit.com/r/mac/',
        'https://www.reddit.com/user/somebody',
        'https://google.com',
      ];

      for (const urlStr of invalidUrls) {
        expect(provider.supports(new URL(urlStr))).toBe(false);
      }
    });
  });

  describe('enrich fallback', () => {
    it('should fallback to MetadataService on network failure', async () => {
      const targetUrl = 'https://www.reddit.com/r/mac/comments/abc123/need_help_mac/';
      const result = await provider.enrich({
        url: new URL(targetUrl),
        rawUrl: targetUrl,
      });

      expect(result.provider).toBe(BookmarkProvider.REDDIT);
      expect(result.contentType).toBe(BookmarkContentType.SOCIAL_POST);
      expect(result.title).toBe('Fallback Title : r/mac');
      expect(result.metadata.reddit.fallbackMode).toBe(true);
    });
  });
});
