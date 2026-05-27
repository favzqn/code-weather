import type { WeatherLevel, MetricResult } from '../types.js';

export const WEATHER_LEVELS: WeatherLevel[] = [
  { min: 80, icon: '☀️', label: 'Sunny', color: 'green' },
  { min: 60, icon: '🌤️', label: 'Mostly Sunny', color: 'yellow' },
  { min: 40, icon: '⛅', label: 'Cloudy', color: 'yellow' },
  { min: 20, icon: '🌧️', label: 'Rainy', color: 'blue' },
  { min: 0, icon: '🌩️', label: 'Stormy', color: 'red' },
];

export const OVERALL_WEATHER: WeatherLevel[] = [
  { min: 80, icon: '☀️', label: 'Sunny', color: 'green' },
  { min: 60, icon: '🌤️', label: 'Mostly Sunny', color: 'yellow' },
  { min: 40, icon: '⛅', label: 'Partly Cloudy', color: 'yellow' },
  { min: 20, icon: '🌧️', label: 'Rainy', color: 'blue' },
  { min: 0, icon: '🌩️', label: 'Stormy', color: 'red' },
];

export function getWeatherForScore(score: number): WeatherLevel {
  for (const level of WEATHER_LEVELS) {
    if (score >= level.min) return level;
  }
  return WEATHER_LEVELS[WEATHER_LEVELS.length - 1];
}

export function getOverallWeather(score: number): WeatherLevel {
  for (const level of OVERALL_WEATHER) {
    if (score >= level.min) return level;
  }
  return OVERALL_WEATHER[OVERALL_WEATHER.length - 1];
}

export function calculateOverallScore(metrics: MetricResult[]): number {
  const weights: Record<string, number> = {
    'Commit Activity': 0.20,
    'Contributors': 0.15,
    'Open Issues': 0.20,
    'Dependencies': 0.25,
    'Test Coverage': 0.15,
    'Build Status': 0.05,
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
