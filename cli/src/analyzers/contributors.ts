import { getContributors, getRecentContributors } from '../utils/git.js';
import type { MetricResult } from '../types.js';
import { getWeatherForScore } from '../display/weather.js';

export async function analyzeContributors(repoPath: string): Promise<MetricResult> {
  const allContributorsRaw = getContributors(repoPath);
  const recentContributorsRaw = getRecentContributors(30, repoPath);

  const allLines = allContributorsRaw
    .split('\n')
    .filter((l) => l.trim())
    .map((line) => {
      const match = line.trim().match(/^(\d+)\s+(.+)$/);
      if (!match) return null;
      return { commits: parseInt(match[1], 10), name: match[2].trim() };
    })
    .filter(Boolean) as { name: string; commits: number }[];

  const recentLines = recentContributorsRaw
    .split('\n')
    .filter((l) => l.trim())
    .map((line) => {
      const match = line.trim().match(/^(\d+)\s+(.+)$/);
      if (!match) return null;
      return { commits: parseInt(match[1], 10), name: match[2].trim() };
    })
    .filter(Boolean) as { name: string; commits: number }[];

  const totalContributors = allLines.length;
  const activeContributors = recentLines.length;

  let score: number;
  if (activeContributors >= 5) score = 85;
  else if (activeContributors >= 3) score = 70;
  else if (activeContributors >= 2) score = 50;
  else if (activeContributors >= 1) score = 30;
  else score = 10;

  const topContributors = recentLines.slice(0, 5);
  const topNames = topContributors.map((c) => c.name).join(', ');

  return {
    name: 'Contributors',
    icon: '👥',
    score,
    weather: getWeatherForScore(score),
    detail: `${activeContributors} active, ${totalContributors} total`,
    verbose: `Active contributors: ${topNames || 'none'} | Top overall: ${allLines
      .slice(0, 3)
      .map((c) => `${c.name} (${c.commits})`)
      .join(', ')}`,
  };
}
