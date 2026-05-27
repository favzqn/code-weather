import type { AnalysisResult, MetricResult, CliOptions } from '../types.js';
import { chalk, colorForWeather, colorForScore } from './colors.js';

const BAR_WIDTH = 20;

function renderBar(score: number): string {
  const filled = Math.round((score / 100) * BAR_WIDTH);
  const empty = BAR_WIDTH - filled;
  const colorFn = colorForScore(score);
  return colorFn('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

function padRight(str: string, len: number): string {
  const visible = str.replace(/\x1b\[[0-9;]*m/g, '');
  const padding = Math.max(0, len - visible.length);
  return str + ' '.repeat(padding);
}

function renderMetric(metric: MetricResult, verbose: boolean): string {
  const weatherColor = colorForWeather(metric.weather);
  const scoreColor = colorForScore(metric.score);

  const icon = metric.icon;
  const name = padRight(metric.name, 18);
  const weather = padRight(`${metric.weather.icon} ${metric.weather.label}`, 18);
  const score = padRight(scoreColor(`${metric.score}/100`), 10);
  const bar = renderBar(metric.score);
  const detail = chalk.gray(metric.detail);

  const line = `  ${icon} ${name} ${weather} ${score} ${bar}  ${detail}`;

  if (verbose && metric.verbose) {
    return line + '\n' + chalk.gray(`     └─ ${metric.verbose}`);
  }

  return line;
}

export function renderDashboard(result: AnalysisResult, options: CliOptions): string {
  const lines: string[] = [];
  const { overall, overallWeather, metrics, suggestions, duration, version } = result;

  const weatherColor = colorForWeather(overallWeather);
  const scoreColor = colorForScore(overall);

  lines.push('');
  lines.push(
    `  ${chalk.bold(overallWeather.icon + '  Project Health Report')}`
  );
  lines.push(chalk.gray('  ' + '━'.repeat(56)));
  lines.push(
    `  ${chalk.bold('Overall:')} ${scoreColor.bold(overall + '/100')}  ${weatherColor.bold(
      overallWeather.icon + ' ' + overallWeather.label
    )}`
  );
  lines.push('');

  for (const metric of metrics) {
    lines.push(renderMetric(metric, options.verbose));
  }

  lines.push('');
  lines.push(chalk.bold('  💡 Suggestions:'));
  for (const suggestion of suggestions) {
    lines.push(chalk.yellow(`  → ${suggestion}`));
  }

  lines.push('');
  lines.push(
    chalk.gray(`  Generated in ${(duration / 1000).toFixed(1)}s | code-weather v${version}`)
  );
  lines.push('');

  return lines.join('\n');
}

export function renderJson(result: AnalysisResult): string {
  return JSON.stringify(
    {
      overall: result.overall,
      weather: {
        icon: result.overallWeather.icon,
        label: result.overallWeather.label,
      },
      metrics: result.metrics.map((m) => ({
        name: m.name,
        score: m.score,
        weather: { icon: m.weather.icon, label: m.weather.label },
        detail: m.detail,
      })),
      suggestions: result.suggestions,
      duration: result.duration,
      version: result.version,
    },
    null,
    2
  );
}
