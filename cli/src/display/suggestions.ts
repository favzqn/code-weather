import type { MetricResult } from '../types.js';

export function generateSuggestions(metrics: MetricResult[]): string[] {
  const suggestions: string[] = [];
  const sorted = [...metrics].sort((a, b) => a.score - b.score);

  for (const metric of sorted) {
    if (suggestions.length >= 5) break;
    if (metric.score >= 70) continue;

    switch (metric.name) {
      case 'Commit Activity':
        if (metric.score < 40) {
          suggestions.push('Increase commit frequency — try smaller, more frequent commits');
        } else if (metric.score < 60) {
          suggestions.push('Keep development momentum — aim for regular commits');
        }
        break;

      case 'Contributors':
        if (metric.score < 40) {
          suggestions.push('Encourage more contributors — review pending PRs and issues');
        }
        break;

      case 'Open Issues':
        if (metric.detail.includes('stale')) {
          const staleMatch = metric.detail.match(/(\d+) stale/);
          const staleCount = staleMatch ? staleMatch[1] : 'several';
          suggestions.push(`Triage ${staleCount} stale issues — close or update them`);
        }
        if (metric.score < 40) {
          suggestions.push('Reduce open issue count — prioritize bug fixes and closings');
        }
        break;

      case 'Dependencies':
        if (metric.detail.includes('deprecated')) {
          const depMatch = metric.detail.match(/(\d+) deprecated/);
          const depCount = depMatch ? depMatch[1] : 'some';
          suggestions.push(`Replace ${depCount} deprecated dependencies`);
        }
        if (metric.detail.includes('GPL')) {
          const gplMatch = metric.detail.match(/(\d+) GPL/);
          const gplCount = gplMatch ? gplMatch[1] : 'some';
          suggestions.push(`Replace ${gplCount} GPL dependencies (license compatibility risk)`);
        }
        if (metric.detail.includes('unmaintained')) {
          suggestions.push('Review unmaintained dependencies — consider alternatives');
        }
        break;

      case 'Test Coverage':
        if (metric.score < 30) {
          suggestions.push('Add tests — no test framework detected');
        } else if (metric.score < 60) {
          suggestions.push('Increase test coverage — add tests to untested modules');
        }
        break;

      case 'Build Status':
        if (metric.detail.includes('No CI')) {
          suggestions.push('Set up CI/CD — add GitHub Actions or similar workflow');
        } else if (metric.score < 60) {
          suggestions.push('Fix failing CI builds — check recent workflow failures');
        }
        break;
    }
  }

  if (suggestions.length === 0) {
    suggestions.push('Looking good! Keep maintaining your project health.');
  }

  return suggestions;
}
