
export type RootResponse = {
    records: string,
}

export type RootData = {
    records: RootResponse | null,
    error: string | null
}