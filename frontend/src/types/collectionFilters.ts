export type CollectionFilters = {
  sort: 'created_at' | 'last_activity' | 'number_items' | 'number_members' | 'name'
  order: 'asc' | 'desc'
  from: string
  to: string
  search: string
  memberIds: number[]
}

export const defaultCollectionFilters: CollectionFilters = {
  sort: 'created_at',
  order: 'desc',
  from: '',
  to: '',
  search: '',
  memberIds: [],
}
