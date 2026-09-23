import { useCallback } from 'react';
import { CONFIG_KEY } from '../types';
import type { AppConfig } from '../types';
import { parseConfig } from '../lib/config';
import { usePersistentState } from './usePersistentState';

export function useConfig() {
  const [config, setConfig] = usePersistentState(CONFIG_KEY, parseConfig);

  const updateConfig = useCallback((partial: Partial<AppConfig>) => {
    setConfig(prev => parseConfig({ ...prev, ...partial }));
  }, [setConfig]);

  return { config, updateConfig };
}
