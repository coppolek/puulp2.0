export interface Article {
  id: string;
  title: string;
  category: string;
  content: string; // Content will be split by newlines for the chunked reading experience
  createdAt: number;
  author?: string;
  imageUrl?: string;
  tags?: string[];
}

export interface ReadingProgress {
  articleId: string;
  currentChunk: number;
  totalChunks: number;
  lastReadAt: number;
}

export interface RssFeed {
  id: string;
  category: string;
  url: string;
  active: boolean;
  lastFetched?: number;
}

export interface Comment {
  id: string;
  articleId: string;
  chunkIndex: number;
  authorId: string;
  authorName: string;
  authorPhotoUrl?: string;
  content: string;
  createdAt: number;
}
