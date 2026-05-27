import { getRemoteUrl, parseGitHubRemote } from './git.js';

interface GitHubIssue {
  state: string;
  created_at: string;
  updated_at: string;
  pull_request?: unknown;
}

interface GitHubWorkflowRun {
  conclusion: string;
  created_at: string;
}

export function getGitHubInfo(repoPath: string): { owner: string; repo: string } | null {
  const url = getRemoteUrl(repoPath);
  return parseGitHubRemote(url);
}

export async function fetchIssues(
  owner: string,
  repo: string
): Promise<{ open: number; closedRecently: number; stale: number; closeRate: number } | null> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'code-weather',
    };

    const token = process.env.GITHUB_TOKEN;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const openRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=100`,
      { headers }
    );

    if (!openRes.ok) return null;

    const openIssues: GitHubIssue[] = await openRes.json();
    const realOpenIssues = openIssues.filter((i) => !i.pull_request);

    const now = new Date();
    const staleThreshold = 14 * 24 * 60 * 60 * 1000;
    const stale = realOpenIssues.filter(
      (i) => now.getTime() - new Date(i.updated_at).getTime() > staleThreshold
    ).length;

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const closedRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=closed&since=${thirtyDaysAgo}&per_page=100`,
      { headers }
    );

    let closedRecently = 0;
    if (closedRes.ok) {
      const closedIssues: GitHubIssue[] = await closedRes.json();
      closedRecently = closedIssues.filter((i) => !i.pull_request).length;
    }

    const total = realOpenIssues.length + closedRecently;
    const closeRate = total > 0 ? closedRecently / total : 0;

    return {
      open: realOpenIssues.length,
      closedRecently,
      stale,
      closeRate,
    };
  } catch {
    return null;
  }
}

export async function fetchWorkflowRuns(
  owner: string,
  repo: string
): Promise<{ successRate: number; totalRuns: number } | null> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'code-weather',
    };

    const token = process.env.GITHUB_TOKEN;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=10`,
      { headers }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const runs: GitHubWorkflowRun[] = data.workflow_runs || [];

    if (runs.length === 0) return null;

    const successful = runs.filter((r) => r.conclusion === 'success').length;
    return {
      successRate: successful / runs.length,
      totalRuns: runs.length,
    };
  } catch {
    return null;
  }
}
