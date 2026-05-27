import { getGitHubInfo, fetchIssues } from '../utils/github.js';
import type { MetricResult } from '../types.js';
import { getWeatherForScore } from '../display/weather.js';

export async function analyzeIssues(repoPath: string): Promise<MetricResult> {
  const ghInfo = getGitHubInfo(repoPath);

  if (!ghInfo) {
    return {
      name: 'Open Issues',
      icon: '🐛',
      score: 50,
      weather: getWeatherForScore(50),
      detail: 'No GitHub remote detected',
      verbose: 'Cannot analyze issues without a GitHub remote URL.',
    };
  }

  const issues = await fetchIssues(ghInfo.owner, ghInfo.repo);

  if (!issues) {
    return {
      name: 'Open Issues',
      icon: '🐛',
      score: 50,
      weather: getWeatherForScore(50),
      detail: 'Could not fetch issues (API limit or private repo)',
      verbose: 'Set GITHUB_TOKEN environment variable for private repos or to increase rate limits.',
    };
  }

  const { open, closedRecently, stale, closeRate } = issues;

  const volumeScore = Math.max(0, 100 - open * 2);
  const closeRateScore = closeRate * 100;
  const staleScore = Math.max(0, 100 - stale * 5);

  const score = Math.round(volumeScore * 0.3 + closeRateScore * 0.5 + staleScore * 0.2);
  const clamped = Math.max(0, Math.min(100, score));

  return {
    name: 'Open Issues',
    icon: '🐛',
    score: clamped,
    weather: getWeatherForScore(clamped),
    detail: `${open} open, ${stale} stale, ${closedRecently} closed recently`,
    verbose: `Close rate: ${(closeRate * 100).toFixed(0)}% | Open: ${open} | Stale (14d+): ${stale} | Closed (30d): ${closedRecently}`,
  };
}
