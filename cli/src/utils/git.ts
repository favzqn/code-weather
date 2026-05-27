import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

export function isGitRepo(repoPath: string): boolean {
  try {
    const gitDir = path.join(repoPath, '.git');
    return existsSync(gitDir);
  } catch {
    return false;
  }
}

export function runGit(args: string, repoPath: string): string {
  try {
    return execSync(`git ${args}`, {
      cwd: repoPath,
      encoding: 'utf-8',
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return '';
  }
}

export function getGitLog(since: string, repoPath: string): string {
  return runGit(`log --oneline --since="${since}"`, repoPath);
}

export function getGitLogWithFormat(format: string, since: string, repoPath: string): string {
  return runGit(`log --format="${format}" --since="${since}"`, repoPath);
}

export function getContributors(repoPath: string): string {
  return runGit('shortlog -sn --all', repoPath);
}

export function getRecentContributors(days: number, repoPath: string): string {
  return runGit(`shortlog -sn --since="${days} days ago"`, repoPath);
}

export function getRemoteUrl(repoPath: string): string {
  return runGit('remote get-url origin', repoPath);
}

export function parseGitHubRemote(url: string): { owner: string; repo: string } | null {
  if (!url) return null;

  const sshMatch = url.match(/git@github\.com[:/](.+?)\/(.+?)(?:\.git)?$/);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  const httpsMatch = url.match(/github\.com[:/](.+?)\/(.+?)(?:\.git)?$/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  return null;
}

export function getCommitCountByWeek(weeks: number, repoPath: string): number[] {
  const counts: number[] = [];
  const now = new Date();

  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - i * 7);

    const since = weekStart.toISOString().split('T')[0];
    const until = weekEnd.toISOString().split('T')[0];

    const output = runGit(
      `log --oneline --since="${since}" --until="${until}"`,
      repoPath
    );
    counts.unshift(output ? output.split('\n').length : 0);
  }

  return counts;
}
