-- Before this change every link on a video platform was labelled VIDEO, including Pinterest pins,
-- Reddit threads and Instagram photos. Clear the label from links that are not themselves a video;
-- the next metadata refresh classifies them from the page. Same rules as isVideoUrl.
UPDATE "bookmarks"
SET "contentType" = NULL
WHERE "contentType" = 'VIDEO'
  AND "url" IS NOT NULL
  AND "url" !~* '^https?://([^/]+\.)?(youtube\.com/(watch|shorts|live|embed)|youtu\.be/.|vimeo\.com/.|tiktok\.com/.*/video/|instagram\.com/(reel|reels|tv)/|fb\.watch/.|facebook\.com/(watch|reel|.*/videos/))';
