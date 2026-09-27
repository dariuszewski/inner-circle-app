export async function uploadMedia({
  collectionId,
  files,
  accessToken,
}: {
  collectionId: string | number
  files: File[]
  accessToken: string
}) {
  const formData = new FormData()

  for (const file of files) {
    formData.append('files', file)
  }

  const response = await fetch(
    `/api/media?collection_id=${collectionId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    },
  )

  if (!response.ok) {
    const error = await response.json().catch(() => null)

    throw new Error(
      error?.detail ?? `HTTP error! Status: ${response.status}`,
    )
  }
  return response.json()
}