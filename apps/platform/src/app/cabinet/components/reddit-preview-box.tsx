import React from 'react';

interface RedditPreviewBoxProps {
  bookmark: any;
  hostname: string;
}

export function RedditPreviewBox({ bookmark }: RedditPreviewBoxProps) {
  const metadata = bookmark.metadata?.reddit || {};
  const subreddit = metadata.subreddit?.name || extractSubreddit(bookmark.url);
  const selftext =
    bookmark.description && !bookmark.description.includes('• Posted by')
      ? bookmark.description
      : metadata.post?.selftext || '';
  const postTitle = metadata.post?.title || bookmark.title || 'Reddit Post';

  function extractSubreddit(url: string): string {
    try {
      const match = new URL(url).pathname.match(/\/r\/([^/]+)/i);
      const sub = match?.[1];
      return sub || 'reddit';
    } catch {
      return 'reddit';
    }
  }

  return (
    <div className="relative flex h-full w-full flex-col justify-between bg-white p-4 text-brand-charcoal overflow-hidden select-none">
      {/* Subreddit Header + Reddit Logo */}
      <div className="flex items-center justify-between gap-2 pb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-[9px]">
            {subreddit.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-xs text-neutral-800 tracking-tight truncate">
            {subreddit}
          </span>
        </div>

        {/* Reddit Orange Icon */}
        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#FF4500]">
          <svg
            className="size-3.5 fill-white"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.196-.491.956 0 1.733.777 1.733 1.733 0 .658-.363 1.226-.897 1.52.01.144.017.29.017.435 0 3.057-3.55 5.534-7.931 5.534-4.382 0-7.932-2.477-7.932-5.534 0-.14.006-.28.016-.423C3.655 14.85 3.3 14.288 3.3 13.636c0-.956.777-1.733 1.733-1.733.468 0 .89.183 1.198.494 1.192-.857 2.846-1.418 4.668-1.489l.915-4.29 3.197.674a1.25 1.25 0 0 1 1.25-.993zm-8.878 7.37a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm6.368 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm-5.067 3.99a.53.53 0 0 0-.084.743A5.452 5.452 0 0 0 12 17.8c1.558 0 2.91-.703 3.653-1.953a.53.53 0 0 0-.898-.564c-.58.972-1.637 1.517-2.755 1.517-1.118 0-2.175-.545-2.755-1.517a.53.53 0 0 0-.743-.083z" />
          </svg>
        </div>
      </div>

      {/* Post Title */}
      <h3 className="text-sm font-bold leading-snug tracking-tight text-neutral-900 line-clamp-2">
        {postTitle}
      </h3>

      {/* Post Description with Subtle Bottom Fade */}
      {selftext ? (
        <div className="relative mt-1 max-h-16 overflow-hidden">
          <p className="text-[11px] leading-relaxed text-neutral-600 font-normal line-clamp-3">
            {selftext}
          </p>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent" />
        </div>
      ) : null}
    </div>
  );
}
