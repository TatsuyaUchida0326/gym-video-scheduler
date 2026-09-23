import { useCallback } from 'react';
import { PLAYBACK_LOG_KEY } from '../types';
import type { PlaybackOutcome, Schedule } from '../types';
import { createLogEntry, prependLogEntry } from '../lib/playbackLog';
import { parsePlaybackLog } from '../lib/records';
import { usePersistentState } from './usePersistentState';

export function usePlaybackLog() {
  const [entries, setEntries] = usePersistentState(PLAYBACK_LOG_KEY, parsePlaybackLog);

  const recordPlayback = useCallback((schedule: Schedule, outcome: PlaybackOutcome) => {
    const entry = createLogEntry(schedule, outcome, new Date(), crypto.randomUUID());
    setEntries(prev => prependLogEntry(prev, entry));
  }, [setEntries]);

  return { entries, recordPlayback };
}
