import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

export interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export function parsePackageJson(repoPath: string): PackageJson | null {
  try {
    const pkgPath = path.join(repoPath, 'package.json');
    if (!existsSync(pkgPath)) return null;
    const content = readFileSync(pkgPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export function detectProjectType(repoPath: string): 'npm' | 'pip' | 'go' | 'cargo' | 'unknown' {
  if (existsSync(path.join(repoPath, 'package.json'))) return 'npm';
  if (existsSync(path.join(repoPath, 'requirements.txt')) || existsSync(path.join(repoPath, 'pyproject.toml'))) return 'pip';
  if (existsSync(path.join(repoPath, 'go.mod'))) return 'go';
  if (existsSync(path.join(repoPath, 'Cargo.toml'))) return 'cargo';
  return 'unknown';
}
