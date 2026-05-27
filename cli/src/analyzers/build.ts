import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { getGitHubInfo, fetchWorkflowRuns } from '../utils/github.js';
import type { MetricResult } from '../types.js';
import { getWeatherForScore } from '../display/weather.js';

interface CIConfig {
  provider: string;
  configFile: string;
}

const CI_CONFIGS: CIConfig[] = [
  { provider: 'GitHub Actions', configFile: '.github/workflows' },
  { provider: 'GitLab CI', configFile: '.gitlab-ci.yml' },
  { provider: 'Jenkins', configFile: 'Jenkinsfile' },
  { provider: 'CircleCI', configFile: '.circleci/config.yml' },
  { provider: 'Travis CI', configFile: '.travis.yml' },
  { provider: 'Azure Pipelines', configFile: 'azure-pipelines.yml' },
  { provider: 'Docker', configFile: 'Dockerfile' },
];

function detectCI(repoPath: string): CIConfig | null {
  for (const ci of CI_CONFIGS) {
    const fullPath = path.join(repoPath, ci.configFile);
    if (existsSync(fullPath)) {
      if (ci.provider === 'GitHub Actions') {
        try {
          const files = readdirSync(fullPath);
          if (files.length > 0 && files.some((f) => f.endsWith('.yml') || f.endsWith('.yaml'))) {
            return ci;
          }
        } catch {
          continue;
        }
      } else {
        return ci;
      }
    }
  }
  return null;
}

export async function analyzeBuild(repoPath: string): Promise<MetricResult> {
  const ciConfig = detectCI(repoPath);

  if (!ciConfig) {
    return {
      name: 'Build Status',
      icon: '⚡',
      score: 20,
      weather: getWeatherForScore(20),
      detail: 'No CI/CD configuration detected',
      verbose: 'No CI configuration files found. Consider setting up GitHub Actions, GitLab CI, or another CI provider.',
    };
  }

  if (ciConfig.provider !== 'GitHub Actions') {
    return {
      name: 'Build Status',
      icon: '⚡',
      score: 65,
      weather: getWeatherForScore(65),
      detail: `${ciConfig.provider} detected (status check not available)`,
      verbose: `Detected ${ciConfig.provider} configuration. API-based status checking is only available for GitHub Actions.`,
    };
  }

  const ghInfo = getGitHubInfo(repoPath);
  if (!ghInfo) {
    return {
      name: 'Build Status',
      icon: '⚡',
      score: 60,
      weather: getWeatherForScore(60),
      detail: `${ciConfig.provider} detected (no remote URL)`,
      verbose: 'GitHub Actions config found but cannot determine remote repository URL.',
    };
  }

  const runs = await fetchWorkflowRuns(ghInfo.owner, ghInfo.repo);

  if (!runs) {
    return {
      name: 'Build Status',
      icon: '⚡',
      score: 60,
      weather: getWeatherForScore(60),
      detail: `${ciConfig.provider} detected (could not fetch runs)`,
      verbose: 'Could not fetch workflow runs. Set GITHUB_TOKEN for better API access.',
    };
  }

  const score = Math.round(runs.successRate * 100);
  const passCount = Math.round(runs.successRate * runs.totalRuns);
  const failCount = runs.totalRuns - passCount;

  return {
    name: 'Build Status',
    icon: '⚡',
    score,
    weather: getWeatherForScore(score),
    detail: `${passCount}/${runs.totalRuns} recent builds passed`,
    verbose: `Success rate: ${(runs.successRate * 100).toFixed(0)}% | Passed: ${passCount} | Failed: ${failCount} | Provider: GitHub Actions`,
  };
}
