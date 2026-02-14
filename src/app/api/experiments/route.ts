import { NextResponse } from 'next/server'

const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/neill-k/nightly-builds/main/STATUS.md'

export async function GET() {
  try {
    const res = await fetch(GITHUB_RAW_URL, { next: { revalidate: 60 } })
    if (!res.ok) return NextResponse.json([])
    
    const content = await res.text()
    
    const experiments: Array<{
      slug: string
      date: string
      title: string
      description: string
      url: string
    }> = []
    
    // Parse ### YYYY-MM-DD blocks
    const regex = /### (\d{4}-\d{2}-\d{2})\n- Idea: \*\*([^\*]+)\*\* — (.+)\n- Repo: (.+)\n- Vercel URL: (.+)/g
    
    let match
    while ((match = regex.exec(content)) !== null) {
      const [, date, title, description, repo, url] = match
      
      experiments.push({
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        date,
        title: title.trim(),
        description: description.trim(),
        url: url.trim()
      })
    }
    
    // Sort by date descending
    experiments.sort((a, b) => b.date.localeCompare(a.date))
    
    return NextResponse.json(experiments)
  } catch (error) {
    console.error('Error reading experiments:', error)
    return NextResponse.json([])
  }
}
