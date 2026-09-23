import { useCallback } from 'react';
import { SCHEDULE_KEY } from '../types';
import type { DayOfWeek, Schedule } from '../types';
import { deleteFile } from '../lib/fileStore';
import { parseSchedules } from '../lib/records';
import { usePersistentState } from './usePersistentState';

export function useSchedules() {
  const [schedules, setSchedules] = usePersistentState(SCHEDULE_KEY, parseSchedules);

  const addSchedule = useCallback((schedule: Schedule) => {
    setSchedules(prev => [...prev, schedule]);
  }, [setSchedules]);

  const updateSchedule = useCallback((updated: Schedule) => {
    setSchedules(prev => prev.map(schedule => (schedule.id === updated.id ? updated : schedule)));
  }, [setSchedules]);

  const deleteSchedule = useCallback((id: string) => {
    const target = schedules.find(schedule => schedule.id === id);
    if (target) deleteFile(target.videoKey).catch(console.error);
    setSchedules(prev => prev.filter(schedule => schedule.id !== id));
  }, [schedules, setSchedules]);

  const hasDuplicate = useCallback(
    (day: DayOfWeek, time: string, excludeId?: string): boolean =>
      schedules.some(schedule => schedule.id !== excludeId && schedule.day === day && schedule.time === time),
    [schedules],
  );

  return { schedules, addSchedule, updateSchedule, deleteSchedule, hasDuplicate };
}
