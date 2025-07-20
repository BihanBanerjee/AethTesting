// Shared utilities that work in both frontend and backend
import { getIntentConfig } from './config';

export function getIntentColor(intent?: string | null): string {
  const config = getIntentConfig(intent);
  return config.colorClasses;
}

export function getIntentEmoji(intent?: string | null): string {
  const config = getIntentConfig(intent);
  return config.emoji;
}

export function getIntentLabel(intent?: string | null): string {
  const config = getIntentConfig(intent);
  return config.label;
}