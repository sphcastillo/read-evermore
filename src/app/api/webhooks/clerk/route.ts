import {NextRequest, NextResponse} from 'next/server'
import {Webhook} from 'svix'
import {writeClient} from '@/sanity/client'

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({error: 'CLERK_WEBHOOK_SECRET is not configured'}, {status: 501})
  }

  const payload = await req.text()
  const headers = {
    'svix-id': req.headers.get('svix-id') || '',
    'svix-timestamp': req.headers.get('svix-timestamp') || '',
    'svix-signature': req.headers.get('svix-signature') || '',
  }

  try {
    const wh = new Webhook(secret)
    const event = wh.verify(payload, headers) as {type?: string; data?: {id?: string}}
    if (event.type === 'user.deleted' && event.data?.id) {
      const clerkUserId = event.data.id
      const client = writeClient()
      const profile = await client.fetch<{_id: string} | null>(
        `*[_type == "readerProfile" && clerkUserId == $clerkUserId][0]{_id}`,
        {clerkUserId},
      )
      if (profile?._id) {
        const related = await client.fetch<{_id: string}[]>(
          `*[references($id) && _type in ["rating","review","shelf","shelfEntry","readingProgress","clubMembership","vote","discussionPost"]]{_id}`,
          {id: profile._id},
        )
        for (const doc of related) {
          await client.delete(doc._id)
        }
        await client.delete(profile._id)
      }
    }
    return NextResponse.json({ok: true})
  } catch {
    return NextResponse.json({error: 'Invalid webhook signature'}, {status: 400})
  }
}
