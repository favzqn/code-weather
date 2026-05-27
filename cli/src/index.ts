import { Command } from 'commander';
import ora from 'ora';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isGitRepo } from './utils/git.js';
import { analyzeCommits } from './analyzers/commits.js';
import { analyzeContributors } from './analyzers/contributors.js';
import { analyzeIssues } from './analyzers/issues.js';
import { analyzeDependencies } from './analyzers/dependencies.js';
import { analyzeTests } from './analyzers/tests.js';
import { analyzeBuild } from './analyzers/build.js';
import { calculateOverallScore, getOverallWeather } from './display/weather.js';
import { renderDashboard, renderJson } from './display/dashboard.js';
import { generateSuggestions } from './display/suggestions.js';
import { enableNoColor } from './display/colors.js';
import type { AnalysisResult, CliOptions, MetricResult } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getVersion(): string {
  try {
    const pkgPath = path.resolve(__dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

const program = new Command();

program
  .name('code-weather')
  .description('🌤️ Project health dashboard — see your repo\'s weather forecast')
  .version(getVersion())
  .argument('[repo-path]', 'Path to git repository', '.')
  .option('--json', 'Output as JSON')
  .option('--verbose', 'Show detailed breakdown')
  .option('--no-color', 'Disable colors')
  .action(async (repoPathArg: string, opts: { json?: boolean; verbose?: boolean; color?: boolean }) => {
    const startTime = Date.now();

    const options: CliOptions = {
      json: opts.json || false,
      verbose: opts.verbose || false,
      noColor: opts.color === false,
      repoPath: path.resolve(repoPathArg),
    };

    if (options.noColor) {
      enableNoColor();
    }

    if (!isGitRepo(options.repoPath)) {
      console.error(`Error: ${options.repoPath} is not a git repository`);
      process.exit(1);
    }

    const spinner = opts.json
      ? null
      : ora({ text: 'Analyzing project health...', spinner: 'dots' }).start();

    try {
      const results: MetricResult[] = [];

      const analyzers = [
        { name: 'commits', fn: () => analyzeCommits(options.repoPath) },
        { name: 'contributors', fn: () => analyzeContributors(options.repoPath) },
        { name: 'issues', fn: () => analyzeIssues(options.repoPath) },
        { name: 'dependencies', fn: () => analyzeDependencies(options.repoPath) },
        { name: 'tests', fn: () => analyzeTests(options.repoPath) },
        { name: 'build', fn: () => analyzeBuild(options.repoPath) },
      ];

      for (const analyzer of analyzers) {
        if (spinner) spinner.text = `Analyzing ${analyzer.name}...`;
        try {
          const result = await analyzer.fn();
          results.push(result);
        } catch {
          results.push({
            name: analyzer.name,
            icon: '❓',
            score: 0,
            weather: { min: 0, icon: '🌩️', label: 'Error', color: 'red' },
            detail: 'Analysis failed',
          });
        }
      }

      if (spinner) spinner.stop();

      const overall = calculateOverallScore(results);
      const overallWeather = getOverallWeather(overall);
      const suggestions = generateSuggestions(results);
      const duration = Date.now() - startTime;

      const analysisResult: AnalysisResult = {
        overall,
        overallWeather,
        metrics: results,
        suggestions,
        duration,
        version: getVersion(),
      };

      if (options.json) {
        console.log(renderJson(analysisResult));
      } else {
        console.log(renderDashboard(analysisResult, options));
      }
    } catch (error) {
      if (spinner) spinner.stop();
      console.error(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      process.exit(1);
    }
  });

program.parse();
