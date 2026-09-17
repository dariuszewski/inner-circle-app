
import type { RootData, RootResponse } from '../types/rootResponse'

const homeLoader = async (): Promise<RootData> => {
    try {
        const response = await fetch('/api/')

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
        }
        
        const data = await response.json() as RootResponse
        return { records: data, error: null } as RootData
    } catch (error) {
        console.error('Error fetching home data:', error)
        return {
            records: null,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        } as RootData
    }
}

export default homeLoader;