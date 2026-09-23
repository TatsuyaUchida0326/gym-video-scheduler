import { useState } from 'react';
import type { AppConfig, DayOfWeek, PlaybackLogEntry, Poster, Schedule } from '../../types';
import { findNextSchedule } from '../../lib/findNextSchedule';
import { countRecentFailures } from '../../lib/playbackLog';
import { getDayOfWeek, getTimeString } from '../../utils/timeUtils';
import { useNow } from '../../hooks/useNow';
import { ScheduleList } from './ScheduleList';
import { PosterManager } from './PosterManager';
import { PlaybackLogTab } from './PlaybackLogTab';
import { ConfigTab } from './ConfigTab';

interface Props {
  schedules: Schedule[];
  posters: Poster[];
  config: AppConfig;
  playbackLog: PlaybackLogEntry[];
  onAddSchedule: (schedule: Schedule) => void;
  onUpdateSchedule: (schedule: Schedule) => void;
  onDeleteSchedule: (id: string) => void;
  hasDuplicate: (day: DayOfWeek, time: string, excludeId?: string) => boolean;
  onAddPoster: (file: File) => Promise<void>;
  onDeletePoster: (id: string) => void;
  onUpdateConfig: (partial: Partial<AppConfig>) => void;
  onBack: () => void;
}

type Tab = 'schedules' | 'posters' | 'history' | 'config';

const TABS: { key: Tab; label: string }[] = [
  { key: 'schedules', label: '動画スケジュール' },
  { key: 'posters', label: 'CM素材' },
  { key: 'history', label: '再生履歴' },
  { key: 'config', label: '設定' },
];

const NOW_REFRESH_MS = 30_000;
const FAILURE_WINDOW_DAYS = 7;

function formatStartsAt(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}（${getDayOfWeek(date)}） ${getTimeString(date)}`;
}

export function SettingsScreen({
  schedules, posters, config, playbackLog,
  onAddSchedule, onUpdateSchedule, onDeleteSchedule, hasDuplicate,
  onAddPoster, onDeletePoster,
  onUpdateConfig,
  onBack,
}: Props) {
  const [tab, setTab] = useState<Tab>('schedules');
  const now = useNow(NOW_REFRESH_MS);
  const next = findNextSchedule(schedules, now);
  const recentFailures = countRecentFailures(playbackLog, now, FAILURE_WINDOW_DAYS);

  return (
    <div className="w-full min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-100">設定</h1>
          <button
            onClick={onBack}
            className="text-sm px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
          >
            ← 戻る（再生へ）
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          次の予約：
          {next ? (
            <span className="text-gray-100 font-semibold ml-1">
              {formatStartsAt(next.startsAt)} {next.schedule.name}
            </span>
          ) : (
            <span className="ml-1">有効な予約がありません</span>
          )}
        </p>

        {recentFailures > 0 && (
          <p className="alert-error mb-4">
            直近{FAILURE_WINDOW_DAYS}日で再生に失敗した予約が {recentFailures} 件あります。「再生履歴」タブで確認してください。
          </p>
        )}

        <div className="flex gap-1 mb-6 bg-gray-900 p-1 rounded-xl">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === key ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'schedules' && (
          <ScheduleList
            schedules={schedules}
            onAdd={onAddSchedule}
            onUpdate={onUpdateSchedule}
            onDelete={onDeleteSchedule}
            hasDuplicate={hasDuplicate}
          />
        )}

        {tab === 'posters' && (
          <PosterManager posters={posters} onAdd={onAddPoster} onDelete={onDeletePoster} />
        )}

        {tab === 'history' && <PlaybackLogTab entries={playbackLog} />}

        {tab === 'config' && <ConfigTab config={config} onUpdateConfig={onUpdateConfig} />}
      </div>
    </div>
  );
}
