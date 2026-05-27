import { parsePackageJson, detectProjectType } from '../utils/package-json.js';
import type { MetricResult } from '../types.js';
import { getWeatherForScore } from '../display/weather.js';

interface DepCheckResult {
  name: string;
  lastPublish: string | null;
  deprecated: boolean;
  license: string | null;
}

const depCache = new Map<string, DepCheckResult>();

async function checkNpmDep(name: string): Promise<DepCheckResult> {
  const cached = depCache.get(name);
  if (cached) return cached;

  const result: DepCheckResult = {
    name,
    lastPublish: null,
    deprecated: false,
    license: null,
  };

  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      const latest = data['dist-tags']?.latest;
      if (latest && data.versions?.[latest]) {
        result.lastPublish = data.time?.[latest] || null;
        result.deprecated = !!data.versions[latest].deprecated;
        result.license = data.versions[latest].license || data.license || null;
      }
    }
  } catch {
    // Ignore fetch errors
  }

  depCache.set(name, result);
  return result;
}

function isGplLicense(license: string | null): boolean {
  if (!license) return false;
  const l = license.toLowerCase();
  return l.includes('gpl') && !l.includes('lgpl');
}

export async function analyzeDependencies(repoPath: string): Promise<MetricResult> {
  const projectType = detectProjectType(repoPath);

  if (projectType !== 'npm') {
    const pkg = parsePackageJson(repoPath);
    if (!pkg) {
      return {
        name: 'Dependencies',
        icon: '📦',
        score: 50,
        weather: getWeatherForScore(50),
        detail: `No package.json detected (${projectType} project)`,
        verbose: `Detected project type: ${projectType}. Dependency analysis currently supports npm projects.`,
      };
    }
  }

  const pkg = parsePackageJson(repoPath);
  if (!pkg) {
    return {
      name: 'Dependencies',
      icon: '📦',
      score: 50,
      weather: getWeatherForScore(50),
      detail: 'No package.json found',
      verbose: 'Could not find or parse package.json in the repository root.',
    };
  }

  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  const depNames = Object.keys(allDeps);
  if (depNames.length === 0) {
    return {
      name: 'Dependencies',
      icon: '📦',
      score: 90,
      weather: getWeatherForScore(90),
      detail: '0 dependencies',
      verbose: 'No dependencies found — minimal dependency footprint.',
    };
  }

  const checks = await Promise.all(depNames.map((name) => checkNpmDep(name)));

  const deprecated = checks.filter((c) => c.deprecated);
  const gplIssues = checks.filter((c) => isGplLicense(c.license));
  const stale = checks.filter((c) => {
    if (!c.lastPublish) return true;
    const lastPub = new Date(c.lastPublish);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    return lastPub < twoYearsAgo;
  });

  const healthyCount = depNames.length - deprecated.length - gplIssues.length;
  const maintenanceScore = ((depNames.length - deprecated.length - stale.length) / depNames.length) * 100;
  const licenseScore = ((depNames.length - gplIssues.length) / depNames.length) * 100;
  const deprecationScore = ((depNames.length - deprecated.length) / depNames.length) * 100;

  const score = Math.round(maintenanceScore * 0.4 + licenseScore * 0.3 + deprecationScore * 0.3);
  const clamped = Math.max(0, Math.min(100, score));

  const issues: string[] = [];
  if (deprecated.length > 0) issues.push(`${deprecated.length} deprecated`);
  if (gplIssues.length > 0) issues.push(`${gplIssues.length} GPL`);
  if (stale.length > 0) issues.push(`${stale.length} unmaintained`);

  return {
    name: 'Dependencies',
    icon: '📦',
    score: clamped,
    weather: getWeatherForScore(clamped),
    detail: `${depNames.length} total, ${healthyCount} healthy${issues.length ? ', ' + issues.join(', ') : ''}`,
    verbose: `Total: ${depNames.length} | Healthy: ${healthyCount} | Deprecated: ${deprecated.length} | GPL: ${gplIssues.length} | Stale (2yr+): ${stale.length}`,
  };
}
