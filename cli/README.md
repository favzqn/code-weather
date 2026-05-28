# 🌤️ code-weather

> See your project's health forecast

[![npm version](https://img.shields.io/npm/v/code-weather.svg)](https://npm.im/code-weather)
[![license](https://img.shields.io/npm/l/code-weather.svg)](https://npm.im/code-weather)

Run one command. Get a beautiful weather report for your codebase.

## Install

```bash
npm install -g code-weather
```

## Usage

```bash
cd your-project
code-weather
```

## Example Output

```
  🌤️  Project Health Report
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Overall: 72/100  ⛅ Partly Cloudy

  📊 Commit Activity    ☀️  Sunny           85/100  █████████████████░░░  14 commits this week, increasing trend
  👥 Contributors       🌤️  Mostly Sunny    70/100  ██████████████░░░░░░  3 active, 12 total
  🐛 Open Issues        🌧️  Rainy           35/100  ███████░░░░░░░░░░░░░  23 open, 8 stale, 15 closed recently
  🧪 Test Coverage      ⛅  Cloudy           55/100  ███████████░░░░░░░░░  Jest, 42 test files (52% ratio)
  📦 Dependencies       🌩️  Stormy          25/100  █████░░░░░░░░░░░░░░░  48 total, 33 healthy, 3 deprecated
  ⚡ Build Status       ☀️  Sunny           90/100  ██████████████████░░  9/10 recent builds passed

  💡 Suggestions:
  → Triage 8 stale issues — close or update them
  → Replace 3 deprecated dependencies
  → Increase test coverage — add tests to untested modules

  Generated in 1.2s | code-weather v1.0.0
```

## Options

```
code-weather [repo-path]    Run in specific directory
code-weather --json         Output as JSON
code-weather --verbose      Detailed breakdown per metric
code-weather --no-color     No colors (for piping)
code-weather --version      Show version
code-weather --help         Show help
```

## What It Checks

- 📊 **Commit Activity** — Tracks weekly commit frequency and trend
- 👥 **Contributors** — Counts active vs total contributors
- 🐛 **Open Issues** — Analyzes issue volume, staleness, and close rate (GitHub API)
- 🧪 **Test Coverage** — Detects test frameworks and file ratios
- 📦 **Dependencies** — Checks for deprecated, unmaintained, and GPL packages
- ⚡ **CI/CD Status** — Detects CI config and checks build success rate

## Weather Scale

| Score | Weather | Meaning |
|-------|---------|---------|
| 80-100 | ☀️ Sunny | Healthy and active |
| 60-79 | 🌤️ Mostly Sunny | Good, minor issues |
| 40-59 | ⛅ Cloudy | Needs attention |
| 20-39 | 🌧️ Rainy | Significant concerns |
| 0-19 | 🌩️ Stormy | Critical issues |

## GitHub API

For full functionality (issues and CI/CD analysis), set a GitHub token:

```bash
export GITHUB_TOKEN=ghp_your_token_here
code-weather
```

Without a token, the tool works but skips GitHub-specific analysis.

## License

MIT
