import type { UserResponsePublic } from "./userResponse";

export type MediaRetrieve = {
  id: number;
  file_path: string;
  media_type: string;
  collection_id: number;
  uploaded_at: string;
  uploaded_by: UserResponsePublic | null;
  media_url: string;
};

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

export type CommentRetrieve = {
  id: number;
  content: string;
  created_at: string;
  author: UserResponsePublic | null;
};

export type ReactionRetrieve = {
  id: number;
  type: ReactionType;
  user: UserResponsePublic;
};

export type MediaRetrieveDetailed = MediaRetrieve & {
  comments: CommentRetrieve[];
  reactions: ReactionRetrieve[];
};

export type CollectionRetrieve = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  cover_image: MediaRetrieve | null;
};

export type PaginatedResponse<T> = {
  total_items: number;
  page: number;
  per_page: number;
  total_pages: number;
  items: T[];
};

export type CollectionDetailedRetrieve = CollectionRetrieve & {
  created_by_id: number;
  created_by: UserResponsePublic;
  current_user_role: 'moderator' | 'contributor';
  members_count: number;
  members: UserResponsePublic[];
  media: MediaRetrieve[]
};