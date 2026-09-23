import { useState } from 'react';
import { CONFIG_KEY, PLAYBACK_LOG_KEY, PLAYED_KEY, POSTER_KEY, SCHEDULE_KEY } from '../../types';
import { resetDatabase } from '../../lib/fileStore';
import { useStorageEstimate } from '../../hooks/useStorageEstimate';
import { formatBytes } from '../../utils/formatBytes';

const WARNING_PERCENT = 50;
const DANGER_PERCENT = 80;
const ALL_STORAGE_KEYS = [SCHEDULE_KEY, POSTER_KEY, CONFIG_KEY, PLAYED_KEY, PLAYBACK_LOG_KEY];

function usageBarColor(percent: number): string {
  if (percent >= DANGER_PERCENT) return 'bg-red-500';
  if (percent >= WARNING_PERCENT) return 'bg-yellow-500';
  return 'bg-blue-500';
}

export function StorageSection() {
  const estimate = useStorageEstimate();
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    if (!window.confirm('全データ（動画・画像・スケジュール・設定）を削除してストレージを完全に解放します。この操作は元に戻せません。続けますか？')) return;
    setResetting(true);
    await resetDatabase();
    ALL_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
    window.location.reload();
  }

  const usage = estimate?.usage;
  const quota = estimate?.quota;
  const usagePercent = usage != null && quota ? Math.min((usage / quota) * 100, 100) : null;

  return (
    <>
      <div>
        <h2 className="section-title">ストレージ管理</h2>
        <p className="text-xs text-gray-500 mb-3">
          削除しても容量が減らない場合はリセットで完全に解放できます。全データが削除されます。
        </p>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="px-4 py-2 rounded-lg bg-red-900/60 hover:bg-red-800 text-sm text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resetting ? 'リセット中...' : 'ストレージを完全にリセット'}
        </button>
      </div>

      <div>
        <h2 className="section-title">ストレージ使用量</h2>
        {usage != null && quota != null && usagePercent != null ? (
          <div className="bg-gray-900 rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">使用中</span>
              <span className="text-gray-200 font-semibold">{formatBytes(usage)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">上限</span>
              <span className="text-gray-200">{formatBytes(quota)}</span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${usageBarColor(usagePercent)}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="text-xs text-right text-gray-500">{usagePercent.toFixed(1)}% 使用</p>
            {usagePercent >= DANGER_PERCENT && (
              <p className="alert-error text-xs">
                ストレージが残り少なくなっています。不要なスケジュールやCM素材を削除してください。
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-600">取得中...</p>
        )}
      </div>
    </>
  );
}
