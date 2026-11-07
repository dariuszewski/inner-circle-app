export type MediaFilters = {
  sort: 'uploaded_at' | 'popularity_score'
  order: 'asc' | 'desc'
  from: string
  to: string
  authorIds: number[]
  mediaType: MediaTypeFilter | null
}

export type MediaTypeFilter = 'image' | 'video'

export const defaultMediaFilters: MediaFilters = {
  sort: 'uploaded_at',
  order: 'desc',
  from: '',
  to: '',
  authorIds: [],
  mediaType: null,
}
