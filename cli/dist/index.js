// src/index.ts
import { Command } from "commander";
import ora from "ora";
import path5 from "path";
import { readFileSync as readFileSync2 } from "fs";
import { fileURLToPath } from "url";

// src/utils/git.ts
import { execSync } from "child_process";
import { existsSync } from "fs";
import path from "path";
function isGitRepo(repoPath) {
  try {
    const gitDir = path.join(repoPath, ".git");
    return existsSync(gitDir);
  } catch {
    return false;
  }
}
function runGit(args, repoPath) {
  try {
    return execSync(`git ${args}`, {
      cwd: repoPath,
      encoding: "utf-8",
      timeout: 3e4,
      stdio: ["pipe", "pipe", "pipe"]
    }).trim();
  } catch {
    return "";
  }
}
function getGitLog(since, repoPath) {
  return runGit(`log --oneline --since="${since}"`, repoPath);
}
function getContributors(repoPath) {
  return runGit("shortlog -sn --all", repoPath);
}
function getRecentContributors(days, repoPath) {
  return runGit(`shortlog -sn --since="${days} days ago"`, repoPath);
}
function getRemoteUrl(repoPath) {
  return runGit("remote get-url origin", repoPath);
}
function parseGitHubRemote(url) {
  if (!url) return null;
  const sshMatch = url.match(/git@github\.com[:/](.+?)\/(.+?)(?:\.git)?$/);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }
  const httpsMatch = url.match(/github\.com[:/](.+?)\/(.+?)(?:\.git)?$/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }
  return null;
}
function getCommitCountByWeek(weeks, repoPath) {
  const counts = [];
  const now = /* @__PURE__ */ new Date();
  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    const since = weekStart.toISOString().split("T")[0];
    const until = weekEnd.toISOString().split("T")[0];
    const output = runGit(
      `log --oneline --since="${since}" --until="${until}"`,
      repoPath
    );
    counts.unshift(output ? output.split("\n").length : 0);
  }
  return counts;
}

// src/display/weather.ts
var WEATHER_LEVELS = [
  { min: 80, icon: "\u2600\uFE0F", label: "Sunny", color: "green" },
  { min: 60, icon: "\u{1F324}\uFE0F", label: "Mostly Sunny", color: "yellow" },
  { min: 40, icon: "\u26C5", label: "Cloudy", color: "yellow" },
  { min: 20, icon: "\u{1F327}\uFE0F", label: "Rainy", color: "blue" },
  { min: 0, icon: "\u{1F329}\uFE0F", label: "Stormy", color: "red" }
];
var OVERALL_WEATHER = [
  { min: 80, icon: "\u2600\uFE0F", label: "Sunny", color: "green" },
  { min: 60, icon: "\u{1F324}\uFE0F", label: "Mostly Sunny", color: "yellow" },
  { min: 40, icon: "\u26C5", label: "Partly Cloudy", color: "yellow" },
  { min: 20, icon: "\u{1F327}\uFE0F", label: "Rainy", color: "blue" },
  { min: 0, icon: "\u{1F329}\uFE0F", label: "Stormy", color: "red" }
];
function getWeatherForScore(score) {
  for (const level of WEATHER_LEVELS) {
    if (score >= level.min) return level;
  }
  return WEATHER_LEVELS[WEATHER_LEVELS.length - 1];
}
function getOverallWeather(score) {
  for (const level of OVERALL_WEATHER) {
    if (score >= level.min) return level;
  }
  return OVERALL_WEATHER[OVERALL_WEATHER.length - 1];
}
function calculateOverallScore(metrics) {
  const weights = {
    "Commit Activity": 0.2,
    "Contributors": 0.15,
    "Open Issues": 0.2,
    "Dependencies": 0.25,
    "Test Coverage": 0.15,
    "Build Status": 0.05
  };
  let totalWeight = 0;
  let weightedSum = 0;
  for (const metric of metrics) {
    const weight = weights[metric.name] ?? 0.1;
    weightedSum += metric.score * weight;
    totalWeight += weight;
  }
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

// src/analyzers/commits.ts
async function analyzeCommits(repoPath) {
  const weeklyCommits = getCommitCountByWeek(4, repoPath);
  const totalCommits = weeklyCommits.reduce((a, b) => a + b, 0);
  const recentLog = getGitLog("30 days ago", repoPath);
  const recentCount = recentLog ? recentLog.split("\n").length : 0;
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
  let trend;
  if (weeklyCommits.length >= 2) {
    const recent = weeklyCommits[weeklyCommits.length - 1];
    const older = weeklyCommits[weeklyCommits.length - 2];
    if (recent > older * 1.2) trend = "increasing";
    else if (recent < older * 0.8) trend = "decreasing";
    else trend = "stable";
  } else {
    trend = "stable";
  }
  return {
    name: "Commit Activity",
    icon: "\u{1F4CA}",
    score: clamped,
    weather: getWeatherForScore(clamped),
    detail: `${recentCount} commits this month, ${trend} trend`,
    verbose: `Weekly breakdown: ${weeklyCommits.join(", ")} | Avg: ${avgWeekly.toFixed(1)}/week`
  };
}

// src/analyzers/contributors.ts
async function analyzeContributors(repoPath) {
  const allContributorsRaw = getContributors(repoPath);
  const recentContributorsRaw = getRecentContributors(30, repoPath);
  const allLines = allContributorsRaw.split("\n").filter((l) => l.trim()).map((line) => {
    const match = line.trim().match(/^(\d+)\s+(.+)$/);
    if (!match) return null;
    return { commits: parseInt(match[1], 10), name: match[2].trim() };
  }).filter(Boolean);
  const recentLines = recentContributorsRaw.split("\n").filter((l) => l.trim()).map((line) => {
    const match = line.trim().match(/^(\d+)\s+(.+)$/);
    if (!match) return null;
    return { commits: parseInt(match[1], 10), name: match[2].trim() };
  }).filter(Boolean);
  const totalContributors = allLines.length;
  const activeContributors = recentLines.length;
  let score;
  if (activeContributors >= 5) score = 85;
  else if (activeContributors >= 3) score = 70;
  else if (activeContributors >= 2) score = 50;
  else if (activeContributors >= 1) score = 30;
  else score = 10;
  const topContributors = recentLines.slice(0, 5);
  const topNames = topContributors.map((c) => c.name).join(", ");
  return {
    name: "Contributors",
    icon: "\u{1F465}",
    score,
    weather: getWeatherForScore(score),
    detail: `${activeContributors} active, ${totalContributors} total`,
    verbose: `Active contributors: ${topNames || "none"} | Top overall: ${allLines.slice(0, 3).map((c) => `${c.name} (${c.commits})`).join(", ")}`
  };
}

// src/utils/github.ts
function getGitHubInfo(repoPath) {
  const url = getRemoteUrl(repoPath);
  return parseGitHubRemote(url);
}
async function fetchIssues(owner, repo) {
  try {
    const headers = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "code-weather"
    };
    const token = process.env.GITHUB_TOKEN;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const openRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=100`,
      { headers }
    );
    if (!openRes.ok) return null;
    const openIssues = await openRes.json();
    const realOpenIssues = openIssues.filter((i) => !i.pull_request);
    const now = /* @__PURE__ */ new Date();
    const staleThreshold = 14 * 24 * 60 * 60 * 1e3;
    const stale = realOpenIssues.filter(
      (i) => now.getTime() - new Date(i.updated_at).getTime() > staleThreshold
    ).length;
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
    const closedRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=closed&since=${thirtyDaysAgo}&per_page=100`,
      { headers }
    );
    let closedRecently = 0;
    if (closedRes.ok) {
      const closedIssues = await closedRes.json();
      closedRecently = closedIssues.filter((i) => !i.pull_request).length;
    }
    const total = realOpenIssues.length + closedRecently;
    const closeRate = total > 0 ? closedRecently / total : 0;
    return {
      open: realOpenIssues.length,
      closedRecently,
      stale,
      closeRate
    };
  } catch {
    return null;
  }
}
async function fetchWorkflowRuns(owner, repo) {
  try {
    const headers = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "code-weather"
    };
    const token = process.env.GITHUB_TOKEN;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=10`,
      { headers }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const runs = data.workflow_runs || [];
    if (runs.length === 0) return null;
    const successful = runs.filter((r) => r.conclusion === "success").length;
    return {
      successRate: successful / runs.length,
      totalRuns: runs.length
    };
  } catch {
    return null;
  }
}

// src/analyzers/issues.ts
async function analyzeIssues(repoPath) {
  const ghInfo = getGitHubInfo(repoPath);
  if (!ghInfo) {
    return {
      name: "Open Issues",
      icon: "\u{1F41B}",
      score: 50,
      weather: getWeatherForScore(50),
      detail: "No GitHub remote detected",
      verbose: "Cannot analyze issues without a GitHub remote URL."
    };
  }
  const issues = await fetchIssues(ghInfo.owner, ghInfo.repo);
  if (!issues) {
    return {
      name: "Open Issues",
      icon: "\u{1F41B}",
      score: 50,
      weather: getWeatherForScore(50),
      detail: "Could not fetch issues (API limit or private repo)",
      verbose: "Set GITHUB_TOKEN environment variable for private repos or to increase rate limits."
    };
  }
  const { open, closedRecently, stale, closeRate } = issues;
  const volumeScore = Math.max(0, 100 - open * 2);
  const closeRateScore = closeRate * 100;
  const staleScore = Math.max(0, 100 - stale * 5);
  const score = Math.round(volumeScore * 0.3 + closeRateScore * 0.5 + staleScore * 0.2);
  const clamped = Math.max(0, Math.min(100, score));
  return {
    name: "Open Issues",
    icon: "\u{1F41B}",
    score: clamped,
    weather: getWeatherForScore(clamped),
    detail: `${open} open, ${stale} stale, ${closedRecently} closed recently`,
    verbose: `Close rate: ${(closeRate * 100).toFixed(0)}% | Open: ${open} | Stale (14d+): ${stale} | Closed (30d): ${closedRecently}`
  };
}

// src/utils/package-json.ts
import { readFileSync, existsSync as existsSync2 } from "fs";
import path2 from "path";
function parsePackageJson(repoPath) {
  try {
    const pkgPath = path2.join(repoPath, "package.json");
    if (!existsSync2(pkgPath)) return null;
    const content = readFileSync(pkgPath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}
function detectProjectType(repoPath) {
  if (existsSync2(path2.join(repoPath, "package.json"))) return "npm";
  if (existsSync2(path2.join(repoPath, "requirements.txt")) || existsSync2(path2.join(repoPath, "pyproject.toml"))) return "pip";
  if (existsSync2(path2.join(repoPath, "go.mod"))) return "go";
  if (existsSync2(path2.join(repoPath, "Cargo.toml"))) return "cargo";
  return "unknown";
}

// src/analyzers/dependencies.ts
var depCache = /* @__PURE__ */ new Map();
async function checkNpmDep(name) {
  const cached = depCache.get(name);
  if (cached) return cached;
  const result = {
    name,
    lastPublish: null,
    deprecated: false,
    license: null
  };
  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5e3)
    });
    if (res.ok) {
      const data = await res.json();
      const latest = data["dist-tags"]?.latest;
      if (latest && data.versions?.[latest]) {
        result.lastPublish = data.time?.[latest] || null;
        result.deprecated = !!data.versions[latest].deprecated;
        result.license = data.versions[latest].license || data.license || null;
      }
    }
  } catch {
  }
  depCache.set(name, result);
  return result;
}
function isGplLicense(license) {
  if (!license) return false;
  const l = license.toLowerCase();
  return l.includes("gpl") && !l.includes("lgpl");
}
async function analyzeDependencies(repoPath) {
  const projectType = detectProjectType(repoPath);
  if (projectType !== "npm") {
    const pkg2 = parsePackageJson(repoPath);
    if (!pkg2) {
      return {
        name: "Dependencies",
        icon: "\u{1F4E6}",
        score: 50,
        weather: getWeatherForScore(50),
        detail: `No package.json detected (${projectType} project)`,
        verbose: `Detected project type: ${projectType}. Dependency analysis currently supports npm projects.`
      };
    }
  }
  const pkg = parsePackageJson(repoPath);
  if (!pkg) {
    return {
      name: "Dependencies",
      icon: "\u{1F4E6}",
      score: 50,
      weather: getWeatherForScore(50),
      detail: "No package.json found",
      verbose: "Could not find or parse package.json in the repository root."
    };
  }
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies
  };
  const depNames = Object.keys(allDeps);
  if (depNames.length === 0) {
    return {
      name: "Dependencies",
      icon: "\u{1F4E6}",
      score: 90,
      weather: getWeatherForScore(90),
      detail: "0 dependencies",
      verbose: "No dependencies found \u2014 minimal dependency footprint."
    };
  }
  const checks = await Promise.all(depNames.map((name) => checkNpmDep(name)));
  const deprecated = checks.filter((c) => c.deprecated);
  const gplIssues = checks.filter((c) => isGplLicense(c.license));
  const stale = checks.filter((c) => {
    if (!c.lastPublish) return true;
    const lastPub = new Date(c.lastPublish);
    const twoYearsAgo = /* @__PURE__ */ new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    return lastPub < twoYearsAgo;
  });
  const healthyCount = depNames.length - deprecated.length - gplIssues.length;
  const maintenanceScore = (depNames.length - deprecated.length - stale.length) / depNames.length * 100;
  const licenseScore = (depNames.length - gplIssues.length) / depNames.length * 100;
  const deprecationScore = (depNames.length - deprecated.length) / depNames.length * 100;
  const score = Math.round(maintenanceScore * 0.4 + licenseScore * 0.3 + deprecationScore * 0.3);
  const clamped = Math.max(0, Math.min(100, score));
  const issues = [];
  if (deprecated.length > 0) issues.push(`${deprecated.length} deprecated`);
  if (gplIssues.length > 0) issues.push(`${gplIssues.length} GPL`);
  if (stale.length > 0) issues.push(`${stale.length} unmaintained`);
  return {
    name: "Dependencies",
    icon: "\u{1F4E6}",
    score: clamped,
    weather: getWeatherForScore(clamped),
    detail: `${depNames.length} total, ${healthyCount} healthy${issues.length ? ", " + issues.join(", ") : ""}`,
    verbose: `Total: ${depNames.length} | Healthy: ${healthyCount} | Deprecated: ${deprecated.length} | GPL: ${gplIssues.length} | Stale (2yr+): ${stale.length}`
  };
}

// src/analyzers/tests.ts
import { existsSync as existsSync3, readdirSync, statSync } from "fs";
import path3 from "path";
var FRAMEWORKS = [
  { name: "Jest", configFiles: ["jest.config.js", "jest.config.ts", "jest.config.mjs", "jest.config.cjs"] },
  { name: "Vitest", configFiles: ["vitest.config.ts", "vitest.config.js", "vitest.config.mjs"] },
  { name: "Mocha", configFiles: [".mocharc.yml", ".mocharc.js", ".mocharc.json"] },
  { name: "Pytest", configFiles: ["pytest.ini", "pyproject.toml", "setup.cfg"] },
  { name: "Cargo", configFiles: ["Cargo.toml"] }
];
var TEST_PATTERNS = [".test.", ".spec.", "_test.", "test_"];
var IGNORE_DIRS = /* @__PURE__ */ new Set(["node_modules", ".git", "dist", "build", "vendor", ".next", "__pycache__"]);
function countFilesRecursive(dir, predicate, maxDepth = 8) {
  let count = 0;
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry)) continue;
      const fullPath = path3.join(dir, entry);
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
      }
    }
  } catch {
  }
  return count;
}
function isTestFile(file) {
  const basename = path3.basename(file);
  return TEST_PATTERNS.some((p) => basename.includes(p));
}
function isSourceFile(file) {
  const ext = path3.extname(file);
  return [".ts", ".tsx", ".js", ".jsx", ".py", ".rs", ".go"].includes(ext);
}
function hasCoverageConfig(repoPath) {
  const coverageIndicators = [
    ".nycrc",
    ".nycrc.json",
    ".nycrc.yml",
    "coverage/",
    ".coverage",
    "jest.config.js",
    "jest.config.ts",
    "vitest.config.ts",
    "vitest.config.js",
    "codecov.yml",
    ".codecov.yml"
  ];
  return coverageIndicators.some((indicator) => {
    const fullPath = path3.join(repoPath, indicator);
    return existsSync3(fullPath);
  });
}
async function analyzeTests(repoPath) {
  let detectedFramework = null;
  for (const fw of FRAMEWORKS) {
    for (const config of fw.configFiles) {
      if (existsSync3(path3.join(repoPath, config))) {
        detectedFramework = fw.name;
        break;
      }
    }
    if (detectedFramework) break;
  }
  const testDirExists = existsSync3(path3.join(repoPath, "__tests__")) || existsSync3(path3.join(repoPath, "tests")) || existsSync3(path3.join(repoPath, "test"));
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
    name: "Test Coverage",
    icon: "\u{1F9EA}",
    score: clamped,
    weather: getWeatherForScore(clamped),
    detail: detectedFramework ? `${detectedFramework}, ${testFiles} test files (${ratioPercent}% ratio)` : `No framework detected, ${testFiles} test files found`,
    verbose: `Framework: ${detectedFramework || "none"} | Test files: ${testFiles} | Source files: ${sourceFiles} | Ratio: ${ratioPercent}% | Coverage config: ${hasCoverage ? "yes" : "no"}`
  };
}

// src/analyzers/build.ts
import { existsSync as existsSync4, readdirSync as readdirSync2 } from "fs";
import path4 from "path";
var CI_CONFIGS = [
  { provider: "GitHub Actions", configFile: ".github/workflows" },
  { provider: "GitLab CI", configFile: ".gitlab-ci.yml" },
  { provider: "Jenkins", configFile: "Jenkinsfile" },
  { provider: "CircleCI", configFile: ".circleci/config.yml" },
  { provider: "Travis CI", configFile: ".travis.yml" },
  { provider: "Azure Pipelines", configFile: "azure-pipelines.yml" },
  { provider: "Docker", configFile: "Dockerfile" }
];
function detectCI(repoPath) {
  for (const ci of CI_CONFIGS) {
    const fullPath = path4.join(repoPath, ci.configFile);
    if (existsSync4(fullPath)) {
      if (ci.provider === "GitHub Actions") {
        try {
          const files = readdirSync2(fullPath);
          if (files.length > 0 && files.some((f) => f.endsWith(".yml") || f.endsWith(".yaml"))) {
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
async function analyzeBuild(repoPath) {
  const ciConfig = detectCI(repoPath);
  if (!ciConfig) {
    return {
      name: "Build Status",
      icon: "\u26A1",
      score: 20,
      weather: getWeatherForScore(20),
      detail: "No CI/CD configuration detected",
      verbose: "No CI configuration files found. Consider setting up GitHub Actions, GitLab CI, or another CI provider."
    };
  }
  if (ciConfig.provider !== "GitHub Actions") {
    return {
      name: "Build Status",
      icon: "\u26A1",
      score: 65,
      weather: getWeatherForScore(65),
      detail: `${ciConfig.provider} detected (status check not available)`,
      verbose: `Detected ${ciConfig.provider} configuration. API-based status checking is only available for GitHub Actions.`
    };
  }
  const ghInfo = getGitHubInfo(repoPath);
  if (!ghInfo) {
    return {
      name: "Build Status",
      icon: "\u26A1",
      score: 60,
      weather: getWeatherForScore(60),
      detail: `${ciConfig.provider} detected (no remote URL)`,
      verbose: "GitHub Actions config found but cannot determine remote repository URL."
    };
  }
  const runs = await fetchWorkflowRuns(ghInfo.owner, ghInfo.repo);
  if (!runs) {
    return {
      name: "Build Status",
      icon: "\u26A1",
      score: 60,
      weather: getWeatherForScore(60),
      detail: `${ciConfig.provider} detected (could not fetch runs)`,
      verbose: "Could not fetch workflow runs. Set GITHUB_TOKEN for better API access."
    };
  }
  const score = Math.round(runs.successRate * 100);
  const passCount = Math.round(runs.successRate * runs.totalRuns);
  const failCount = runs.totalRuns - passCount;
  return {
    name: "Build Status",
    icon: "\u26A1",
    score,
    weather: getWeatherForScore(score),
    detail: `${passCount}/${runs.totalRuns} recent builds passed`,
    verbose: `Success rate: ${(runs.successRate * 100).toFixed(0)}% | Passed: ${passCount} | Failed: ${failCount} | Provider: GitHub Actions`
  };
}

// src/display/colors.ts
import chalk from "chalk";
function enableNoColor() {
  chalk.level = 0;
}
function colorForWeather(weather) {
  switch (weather.color) {
    case "green":
      return chalk.green;
    case "yellow":
      return chalk.yellow;
    case "blue":
      return chalk.blue;
    case "red":
      return chalk.red;
    default:
      return chalk.white;
  }
}
function colorForScore(score) {
  if (score >= 80) return chalk.green;
  if (score >= 60) return chalk.yellow;
  if (score >= 40) return chalk.hex("#FFA500");
  if (score >= 20) return chalk.blue;
  return chalk.red;
}

// src/display/dashboard.ts
var BAR_WIDTH = 20;
function renderBar(score) {
  const filled = Math.round(score / 100 * BAR_WIDTH);
  const empty = BAR_WIDTH - filled;
  const colorFn = colorForScore(score);
  return colorFn("\u2588".repeat(filled)) + chalk.gray("\u2591".repeat(empty));
}
function padRight(str, len) {
  const visible = str.replace(/\x1b\[[0-9;]*m/g, "");
  const padding = Math.max(0, len - visible.length);
  return str + " ".repeat(padding);
}
function renderMetric(metric, verbose) {
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
    return line + "\n" + chalk.gray(`     \u2514\u2500 ${metric.verbose}`);
  }
  return line;
}
function renderDashboard(result, options) {
  const lines = [];
  const { overall, overallWeather, metrics, suggestions, duration, version } = result;
  const weatherColor = colorForWeather(overallWeather);
  const scoreColor = colorForScore(overall);
  lines.push("");
  lines.push(
    `  ${chalk.bold(overallWeather.icon + "  Project Health Report")}`
  );
  lines.push(chalk.gray("  " + "\u2501".repeat(56)));
  lines.push(
    `  ${chalk.bold("Overall:")} ${scoreColor.bold(overall + "/100")}  ${weatherColor.bold(
      overallWeather.icon + " " + overallWeather.label
    )}`
  );
  lines.push("");
  for (const metric of metrics) {
    lines.push(renderMetric(metric, options.verbose));
  }
  lines.push("");
  lines.push(chalk.bold("  \u{1F4A1} Suggestions:"));
  for (const suggestion of suggestions) {
    lines.push(chalk.yellow(`  \u2192 ${suggestion}`));
  }
  lines.push("");
  lines.push(
    chalk.gray(`  Generated in ${(duration / 1e3).toFixed(1)}s | code-weather v${version}`)
  );
  lines.push("");
  return lines.join("\n");
}
function renderJson(result) {
  return JSON.stringify(
    {
      overall: result.overall,
      weather: {
        icon: result.overallWeather.icon,
        label: result.overallWeather.label
      },
      metrics: result.metrics.map((m) => ({
        name: m.name,
        score: m.score,
        weather: { icon: m.weather.icon, label: m.weather.label },
        detail: m.detail
      })),
      suggestions: result.suggestions,
      duration: result.duration,
      version: result.version
    },
    null,
    2
  );
}

// src/display/suggestions.ts
function generateSuggestions(metrics) {
  const suggestions = [];
  const sorted = [...metrics].sort((a, b) => a.score - b.score);
  for (const metric of sorted) {
    if (suggestions.length >= 5) break;
    if (metric.score >= 70) continue;
    switch (metric.name) {
      case "Commit Activity":
        if (metric.score < 40) {
          suggestions.push("Increase commit frequency \u2014 try smaller, more frequent commits");
        } else if (metric.score < 60) {
          suggestions.push("Keep development momentum \u2014 aim for regular commits");
        }
        break;
      case "Contributors":
        if (metric.score < 40) {
          suggestions.push("Encourage more contributors \u2014 review pending PRs and issues");
        }
        break;
      case "Open Issues":
        if (metric.detail.includes("stale")) {
          const staleMatch = metric.detail.match(/(\d+) stale/);
          const staleCount = staleMatch ? staleMatch[1] : "several";
          suggestions.push(`Triage ${staleCount} stale issues \u2014 close or update them`);
        }
        if (metric.score < 40) {
          suggestions.push("Reduce open issue count \u2014 prioritize bug fixes and closings");
        }
        break;
      case "Dependencies":
        if (metric.detail.includes("deprecated")) {
          const depMatch = metric.detail.match(/(\d+) deprecated/);
          const depCount = depMatch ? depMatch[1] : "some";
          suggestions.push(`Replace ${depCount} deprecated dependencies`);
        }
        if (metric.detail.includes("GPL")) {
          const gplMatch = metric.detail.match(/(\d+) GPL/);
          const gplCount = gplMatch ? gplMatch[1] : "some";
          suggestions.push(`Replace ${gplCount} GPL dependencies (license compatibility risk)`);
        }
        if (metric.detail.includes("unmaintained")) {
          suggestions.push("Review unmaintained dependencies \u2014 consider alternatives");
        }
        break;
      case "Test Coverage":
        if (metric.score < 30) {
          suggestions.push("Add tests \u2014 no test framework detected");
        } else if (metric.score < 60) {
          suggestions.push("Increase test coverage \u2014 add tests to untested modules");
        }
        break;
      case "Build Status":
        if (metric.detail.includes("No CI")) {
          suggestions.push("Set up CI/CD \u2014 add GitHub Actions or similar workflow");
        } else if (metric.score < 60) {
          suggestions.push("Fix failing CI builds \u2014 check recent workflow failures");
        }
        break;
    }
  }
  if (suggestions.length === 0) {
    suggestions.push("Looking good! Keep maintaining your project health.");
  }
  return suggestions;
}

// src/index.ts
var __dirname = path5.dirname(fileURLToPath(import.meta.url));
function getVersion() {
  try {
    const pkgPath = path5.resolve(__dirname, "..", "package.json");
    const pkg = JSON.parse(readFileSync2(pkgPath, "utf-8"));
    return pkg.version || "1.0.0";
  } catch {
    return "1.0.0";
  }
}
var program = new Command();
program.name("code-weather").description("\u{1F324}\uFE0F Project health dashboard \u2014 see your repo's weather forecast").version(getVersion()).argument("[repo-path]", "Path to git repository", ".").option("--json", "Output as JSON").option("--verbose", "Show detailed breakdown").option("--no-color", "Disable colors").action(async (repoPathArg, opts) => {
  const startTime = Date.now();
  const options = {
    json: opts.json || false,
    verbose: opts.verbose || false,
    noColor: opts.color === false,
    repoPath: path5.resolve(repoPathArg)
  };
  if (options.noColor) {
    enableNoColor();
  }
  if (!isGitRepo(options.repoPath)) {
    console.error(`Error: ${options.repoPath} is not a git repository`);
    process.exit(1);
  }
  const spinner = opts.json ? null : ora({ text: "Analyzing project health...", spinner: "dots" }).start();
  try {
    const results = [];
    const analyzers = [
      { name: "commits", fn: () => analyzeCommits(options.repoPath) },
      { name: "contributors", fn: () => analyzeContributors(options.repoPath) },
      { name: "issues", fn: () => analyzeIssues(options.repoPath) },
      { name: "dependencies", fn: () => analyzeDependencies(options.repoPath) },
      { name: "tests", fn: () => analyzeTests(options.repoPath) },
      { name: "build", fn: () => analyzeBuild(options.repoPath) }
    ];
    for (const analyzer of analyzers) {
      if (spinner) spinner.text = `Analyzing ${analyzer.name}...`;
      try {
        const result = await analyzer.fn();
        results.push(result);
      } catch {
        results.push({
          name: analyzer.name,
          icon: "\u2753",
          score: 0,
          weather: { min: 0, icon: "\u{1F329}\uFE0F", label: "Error", color: "red" },
          detail: "Analysis failed"
        });
      }
    }
    if (spinner) spinner.stop();
    const overall = calculateOverallScore(results);
    const overallWeather = getOverallWeather(overall);
    const suggestions = generateSuggestions(results);
    const duration = Date.now() - startTime;
    const analysisResult = {
      overall,
      overallWeather,
      metrics: results,
      suggestions,
      duration,
      version: getVersion()
    };
    if (options.json) {
      console.log(renderJson(analysisResult));
    } else {
      console.log(renderDashboard(analysisResult, options));
    }
  } catch (error) {
    if (spinner) spinner.stop();
    console.error(
      `Error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    process.exit(1);
  }
});
program.parse();
