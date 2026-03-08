/**
 * Fetch solution code from a public GitHub repository.
 * Expects a solution.py file in the repo root.
 */

/**
 * Parse a GitHub repo URL into owner/repo.
 * Supports: https://github.com/owner/repo, https://github.com/owner/repo.git,
 * https://github.com/owner/repo/tree/branch/path
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url)
    if (u.hostname !== 'github.com') return null
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts.length < 2) return null
    return {
      owner: parts[0],
      repo: parts[1].replace(/\.git$/, ''),
    }
  } catch {
    return null
  }
}

/**
 * Fetch solution.py from a public GitHub repo's default branch.
 * Uses the GitHub raw content URL (no auth required for public repos).
 */
export async function fetchSolutionFromRepo(
  repoUrl: string,
): Promise<{ code: string; username: string } | { error: string }> {
  const parsed = parseGitHubUrl(repoUrl)
  if (!parsed) {
    return { error: 'Invalid GitHub URL. Expected format: https://github.com/owner/repo' }
  }

  const { owner, repo } = parsed

  // Try fetching solution.py from main, then master
  for (const branch of ['main', 'master']) {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/solution.py`
    try {
      const res = await fetch(rawUrl, {
        headers: { 'User-Agent': 'OnoBot/1.0' },
      })
      if (res.ok) {
        const code = await res.text()
        if (!code.trim()) {
          return { error: 'solution.py is empty.' }
        }
        return { code, username: owner }
      }
    } catch {
      // Try next branch
    }
  }

  return {
    error:
      'Could not find solution.py in repository root. Make sure the file exists on the main or master branch.',
  }
}
