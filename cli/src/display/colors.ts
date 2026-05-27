import chalk from 'chalk';
import type { WeatherLevel } from '../types.js';

export function enableNoColor(): void {
  chalk.level = 0;
}

export function colorForWeather(weather: WeatherLevel): typeof chalk {
  switch (weather.color) {
    case 'green':
      return chalk.green;
    case 'yellow':
      return chalk.yellow;
    case 'blue':
      return chalk.blue;
    case 'red':
      return chalk.red;
    default:
      return chalk.white;
  }
}

export function colorForScore(score: number): typeof chalk {
  if (score >= 80) return chalk.green;
  if (score >= 60) return chalk.yellow;
  if (score >= 40) return chalk.hex('#FFA500');
  if (score >= 20) return chalk.blue;
  return chalk.red;
}

export { chalk };
