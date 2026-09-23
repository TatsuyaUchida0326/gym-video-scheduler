import { CONFIG_LIMITS, DEFAULT_CONFIG } from '../types/index.ts';
import type { AppConfig } from '../types/index.ts';

// 空欄や数値でない値は既定値、範囲外なら端に丸める
export function clampConfigValue(key: keyof AppConfig, value: unknown): number {
  const isBlank = value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
  const number = isBlank ? NaN : Number(value);
  if (!Number.isFinite(number)) return DEFAULT_CONFIG[key];
  const { min, max } = CONFIG_LIMITS[key];
  return Math.min(max, Math.max(min, number));
}

export function parseConfig(raw: unknown): AppConfig {
  const source = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<Record<keyof AppConfig, unknown>>;
  return {
    slideIntervalSec: clampConfigValue('slideIntervalSec', source.slideIntervalSec),
    fadeSec: clampConfigValue('fadeSec', source.fadeSec),
  };
}
