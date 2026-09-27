
type CreateCollectionRequest = {
  name: string
  description?: string | null
  accessToken?: string | null
}


async function parseError(response: Response, fallback: string): Promise<Error> {
    try {
        const body = await response.json();
        if (typeof body?.detail === 'string') {
            return new Error(body.detail);
        }
    } catch {
        // response body was not JSON, fall through to the generic message
    }
    return new Error(fallback);
}

async function createCollection({ name, description, accessToken }: CreateCollectionRequest) {
  const response = await fetch('/api/collections', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      name,
      description,
    }),
  })

  if (!response.ok) {
    throw await parseError(response, `HTTP error! Status: ${response.status}`)
  }

  return await response.json()
}

export { createCollection }