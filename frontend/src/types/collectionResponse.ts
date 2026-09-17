export type MediaRetrieve = {
  id: number;
  file_path: string;
  media_type: string;
  collection_id: number;
  uploaded_at: string;
  uploaded_by: unknown | null;
  media_url: string;
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
