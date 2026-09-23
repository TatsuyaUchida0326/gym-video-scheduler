import type { PlaybackLogEntry } from '../../types';
import { getTimeString } from '../../utils/timeUtils';

interface Props {
  entries: PlaybackLogEntry[];
}

const STATUS_BADGES: Record<PlaybackLogEntry['status'], { label: string; className: string }> = {
  completed: { label: '完了', className: 'bg-emerald-900/60 text-emerald-300' },
  stopped: { label: '停止', className: 'bg-gray-700 text-gray-300' },
  failed: { label: '失敗', className: 'bg-red-900/60 text-red-300' },
};

function formatFinishedAt(iso: string): string {
  const date = new Date(iso);
  return `${date.getMonth() + 1}/${date.getDate()} ${getTimeString(date)}`;
}

export function PlaybackLogTab({ entries }: Props) {
  if (entries.length === 0) {
    return <p className="text-gray-600 text-sm">まだ再生の記録がありません</p>;
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-gray-500 mb-3">新しい順に最大100件まで残ります</p>
      {entries.map(entry => {
        const badge = STATUS_BADGES[entry.status];
        return (
          <div key={entry.id} className="bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md flex-shrink-0 ${badge.className}`}>
                {badge.label}
              </span>
              <span className="text-sm text-white truncate flex-1 min-w-0">
                {entry.day}曜 {entry.time} {entry.scheduleName}
              </span>
              <span className="text-xs text-gray-500 flex-shrink-0">終了 {formatFinishedAt(entry.finishedAt)}</span>
            </div>
            {entry.reason && <p className="text-xs text-red-400 mt-1.5">{entry.reason}</p>}
          </div>
        );
      })}
    </div>
  );
}
