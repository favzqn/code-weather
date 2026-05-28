# 🌤️ code-weather

> See your project's health forecast

A CLI tool that analyzes a git repository and displays a beautiful weather-themed health report. Plus a landing page to showcase it.

## Project Structure

```
code-weather/
├── cli/          # The CLI tool (npm package)
└── landing/      # Landing page (Next.js)
```

## CLI (`cli/`)

### Install

```bash
npm install -g code-weather
```

### Usage

```bash
cd your-project
code-weather
```

### Options

```
code-weather [repo-path]     Run in specific directory
code-weather --json          Output as JSON
code-weather --verbose       Detailed breakdown
code-weather --no-color      No colors (for piping)
code-weather --version       Show version
code-weather --help          Show help
```

### What It Checks

- 📊 **Commit Activity** — Track development pace
- 👥 **Contributors** — See team diversity
- 🐛 **Open Issues** — Monitor open issues (GitHub API)
- 🧪 **Test Coverage** — Detect test presence
- 📦 **Dependencies** — Find risky packages
- ⚡ **CI/CD Status** — Check build health

### Weather Scale

| Score | Weather | Meaning |
|-------|---------|---------|
| 80-100 | ☀️ Sunny | Healthy and active |
| 60-79 | 🌤️ Mostly Sunny | Good, minor issues |
| 40-59 | ⛅ Cloudy | Needs attention |
| 20-39 | 🌧️ Rainy | Significant concerns |
| 0-19 | 🌩️ Stormy | Critical issues |

### Development

```bash
cd cli
npm install
npm run build
npm run dev        # Run with tsx
npm test           # Run tests
```

## Landing Page (`landing/`)

### Development

```bash
cd landing
npm install
npm run dev        # Start dev server
npm run build      # Build static export
```

### Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS

## License

MIT
