import { getCommitCountByWeek, getGitLog } from '../utils/git.js';
import type { MetricResult } from '../types.js';
import { getWeatherForScore } from '../display/weather.js';

export async function analyzeCommits(repoPath: string): Promise<MetricResult> {
  const weeklyCommits = getCommitCountByWeek(4, repoPath);
  const totalCommits = weeklyCommits.reduce((a, b) => a + b, 0);

  const recentLog = getGitLog('30 days ago', repoPath);
  const recentCount = recentLog ? recentLog.split('\n').length : 0;

  const avgWeekly = totalCommits / 4;
  const frequencyScore = Math.min(100, avgWeekly * 5);

  let consistencyScore = 100;
  if (weeklyCommits.length >= 2) {
    const variance = weeklyCommits.reduce((sum, count) => {
      return sum + Math.pow(count - avgWeekly, 2);
    }, 0) / weeklyCommits.length;
    const stdDev = Math.sqrt(variance);
    consistencyScore = Math.max(0, 100 - stdDev * 10);
  }

  const score = Math.round(frequencyScore * 0.6 + consistencyScore * 0.4);
  const clamped = Math.max(0, Math.min(100, score));

  let trend: string;
  if (weeklyCommits.length >= 2) {
    const recent = weeklyCommits[weeklyCommits.length - 1];
    const older = weeklyCommits[weeklyCommits.length - 2];
    if (recent > older * 1.2) trend = 'increasing';
    else if (recent < older * 0.8) trend = 'decreasing';
    else trend = 'stable';
  } else {
    trend = 'stable';
  }

  return {
    name: 'Commit Activity',
    icon: '📊',
    score: clamped,
    weather: getWeatherForScore(clamped),
    detail: `${recentCount} commits this month, ${trend} trend`,
    verbose: `Weekly breakdown: ${weeklyCommits.join(', ')} | Avg: ${avgWeekly.toFixed(1)}/week`,
  };
}
