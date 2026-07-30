import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name);

  async extract(url: string): Promise<{ title: string; description?: string; imageUrl?: string }> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        timeout: 5000,
      });

      const html = response.data;
      if (typeof html !== 'string') {
        return { title: this.getDomain(url) };
      }

      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : this.getDomain(url);

      const descriptionMatch = 
        html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
        html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i) ||
        html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
      const description = descriptionMatch ? descriptionMatch[1].trim() : undefined;

      const imageMatch = 
        html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
        html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
      let imageUrl = imageMatch ? imageMatch[1].trim() : undefined;

      // Handle relative image URL
      if (imageUrl && imageUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.origin}${imageUrl}`;
      }

      return {
        title,
        description,
        imageUrl,
      };
    } catch (error) {
      this.logger.warn(`Failed to extract metadata for ${url}: ${(error as any).message}`);
      return { title: this.getDomain(url) };
    }
  }

  async generateTags(title: string, description?: string): Promise<string[]> {
    // Local Tag Extraction
    const stopWords = new Set([
      'the', 'and', 'or', 'a', 'an', 'to', 'in', 'of', 'for', 'with', 'is', 'on', 'that', 'this',
      'these', 'those', 'it', 'its', 'code', 'web', 'site', 'home', 'page', 'app', 'application',
      'welcome', 'official', 'online', 'free', 'best', 'new', 'how', 'why', 'what', 'who', 'where'
    ]);
    const words = `${title} ${description || ''}`
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .map(w => w.trim())
      .filter(w => w.length > 3 && !stopWords.has(w));

    const uniqueWords = Array.from(new Set(words)).slice(0, 4);
    return uniqueWords;
  }

  private getDomain(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.startsWith('www.') ? domain.slice(4) : domain;
    } catch {
      return url;
    }
  }
}
