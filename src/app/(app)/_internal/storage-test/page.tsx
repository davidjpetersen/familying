import { SignedIn } from '@clerk/nextjs'
import { uploadFile, createSignedUrl } from '@/lib/storage'

export default async function Page() {
  const bucket = 'temp'
  const path = `test-${Date.now()}.txt`
  const content = Buffer.from('storage test')

  await uploadFile(bucket, path, content, 'text/plain')
  const url = await createSignedUrl(bucket, path)

  return (
    <SignedIn>
      <div className="p-4 space-y-2">
        <p>Uploaded {path}</p>
        <p>Signed URL: {url}</p>
      </div>
    </SignedIn>
  )
}

