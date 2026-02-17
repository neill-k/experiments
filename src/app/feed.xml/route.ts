import { experiments } from '@/lib/experiments'

const SITE_URL = 'https://experiments.neillkillgore.com'
const SITE_TITLE = 'Experiments — Neill Killgore'
const SITE_DESCRIPTION =
  'Daily shipped prototypes — interactive tools, creative canvases, and AI utilities built overnight by an autonomous pipeline.'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function GET() {
  const items = experiments
    .map((exp) => {
      const url = `${SITE_URL}/e/${exp.slug}`
      const pubDate = new Date(exp.date + 'T06:00:00Z').toUTCString()
      const tags = exp.tags.map((t) => `<category>${escapeXml(t)}</category>`).join('\n        ')

      return `    <item>
      <title>${exp.icon ? `${exp.icon} ` : ''}${escapeXml(exp.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(exp.description)}</description>
      ${tags}
    </item>`
    })
    .join('\n')

  const lastBuildDate = experiments.length > 0
    ? new Date(experiments[0].date + 'T06:00:00Z').toUTCString()
    : new Date().toUTCString()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
