export interface WeatherLevel {
  min: number;
  icon: string;
  label: string;
  color: 'green' | 'yellow' | 'blue' | 'red';
}

export interface MetricResult {
  name: string;
  icon: string;
  score: number;
  weather: WeatherLevel;
  detail: string;
  verbose?: string;
}

export interface AnalysisResult {
  overall: number;
  overallWeather: WeatherLevel;
  metrics: MetricResult[];
  suggestions: string[];
  duration: number;
  version: string;
}

export interface CommitAnalysis {
  totalCommits: number;
  weeklyCommits: number[];
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface ContributorAnalysis {
  totalContributors: number;
  activeContributors: number;
  topContributors: { name: string; commits: number }[];
}

export interface IssueAnalysis {
  openIssues: number;
  closedRecently: number;
  staleIssues: number;
  closeRate: number;
}

export interface DependencyAnalysis {
  total: number;
  healthy: number;
  outdated: number;
  deprecated: number;
  licenseIssues: string[];
}

export interface TestAnalysis {
  framework: string | null;
  testFiles: number;
  sourceFiles: number;
  ratio: number;
  hasCoverage: boolean;
}

export interface BuildAnalysis {
  ciProvider: string | null;
  hasCI: boolean;
  successRate: number;
  recentRuns: number;
}

export interface CliOptions {
  json: boolean;
  verbose: boolean;
  noColor: boolean;
  repoPath: string;
}
