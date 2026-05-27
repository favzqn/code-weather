import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import type { MetricResult } from '../types.js';
import { getWeatherForScore } from '../display/weather.js';

interface TestFramework {
  name: string;
  configFiles: string[];
}

const FRAMEWORKS: TestFramework[] = [
  { name: 'Jest', configFiles: ['jest.config.js', 'jest.config.ts', 'jest.config.mjs', 'jest.config.cjs'] },
  { name: 'Vitest', configFiles: ['vitest.config.ts', 'vitest.config.js', 'vitest.config.mjs'] },
  { name: 'Mocha', configFiles: ['.mocharc.yml', '.mocharc.js', '.mocharc.json'] },
  { name: 'Pytest', configFiles: ['pytest.ini', 'pyproject.toml', 'setup.cfg'] },
  { name: 'Cargo', configFiles: ['Cargo.toml'] },
];

const TEST_PATTERNS = ['.test.', '.spec.', '_test.', 'test_'];
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'vendor', '.next', '__pycache__']);

function countFilesRecursive(
  dir: string,
  predicate: (file: string) => boolean,
  maxDepth: number = 8
): number {
  let count = 0;
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry)) continue;
      const fullPath = path.join(dir, entry);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          if (maxDepth > 0) {
            count += countFilesRecursive(fullPath, predicate, maxDepth - 1);
          }
        } else if (predicate(fullPath)) {
          count++;
        }
      } catch {
        // Skip inaccessible files
      }
    }
  } catch {
    // Skip inaccessible directories
  }
  return count;
}

function isTestFile(file: string): boolean {
  const basename = path.basename(file);
  return TEST_PATTERNS.some((p) => basename.includes(p));
}

function isSourceFile(file: string): boolean {
  const ext = path.extname(file);
  return ['.ts', '.tsx', '.js', '.jsx', '.py', '.rs', '.go'].includes(ext);
}

function hasCoverageConfig(repoPath: string): boolean {
  const coverageIndicators = [
    '.nycrc', '.nycrc.json', '.nycrc.yml',
    'coverage/', '.coverage',
    'jest.config.js', 'jest.config.ts',
    'vitest.config.ts', 'vitest.config.js',
    'codecov.yml', '.codecov.yml',
  ];

  return coverageIndicators.some((indicator) => {
    const fullPath = path.join(repoPath, indicator);
    return existsSync(fullPath);
  });
}

export async function analyzeTests(repoPath: string): Promise<MetricResult> {
  let detectedFramework: string | null = null;
  for (const fw of FRAMEWORKS) {
    for (const config of fw.configFiles) {
      if (existsSync(path.join(repoPath, config))) {
        detectedFramework = fw.name;
        break;
      }
    }
    if (detectedFramework) break;
  }

  const testDirExists =
    existsSync(path.join(repoPath, '__tests__')) ||
    existsSync(path.join(repoPath, 'tests')) ||
    existsSync(path.join(repoPath, 'test'));

  const testFiles = countFilesRecursive(repoPath, isTestFile);
  const sourceFiles = countFilesRecursive(repoPath, isSourceFile);
  const ratio = sourceFiles > 0 ? testFiles / sourceFiles : 0;
  const hasCoverage = hasCoverageConfig(repoPath);

  let score = 0;

  if (detectedFramework) score += 25;
  if (testDirExists) score += 15;
  if (testFiles > 0) score += 20;

  if (ratio >= 0.8) score += 30;
  else if (ratio >= 0.5) score += 20;
  else if (ratio >= 0.2) score += 10;
  else if (ratio > 0) score += 5;

  if (hasCoverage) score += 10;

  const clamped = Math.max(0, Math.min(100, score));

  const ratioPercent = (ratio * 100).toFixed(0);

  return {
    name: 'Test Coverage',
    icon: '🧪',
    score: clamped,
    weather: getWeatherForScore(clamped),
    detail: detectedFramework
      ? `${detectedFramework}, ${testFiles} test files (${ratioPercent}% ratio)`
      : `No framework detected, ${testFiles} test files found`,
    verbose: `Framework: ${detectedFramework || 'none'} | Test files: ${testFiles} | Source files: ${sourceFiles} | Ratio: ${ratioPercent}% | Coverage config: ${hasCoverage ? 'yes' : 'no'}`,
  };
}
