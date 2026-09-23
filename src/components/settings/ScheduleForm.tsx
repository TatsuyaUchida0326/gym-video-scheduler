import { useState } from 'react';
import type { Schedule, DayOfWeek } from '../../types';
import { putFile } from '../../lib/fileStore';

interface Props {
  day: DayOfWeek;
  initial?: Schedule;
  onSave: (schedule: Schedule) => void;
  onCancel: () => void;
  hasDuplicate: (day: DayOfWeek, time: string, excludeId?: string) => boolean;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, '0'));

export function ScheduleForm({ day, initial, onSave, onCancel, hasDuplicate }: Props) {
  const [initialHour, initialMinute] = initial ? initial.time.split(':') : ['10', '00'];
  const [name, setName] = useState(initial?.name ?? '');
  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) { setError('スケジュール名を入力してください'); return; }
    if (!videoFile && !initial) { setError('動画ファイルを選択してください'); return; }

    const time = `${hour}:${minute}`;
    if (hasDuplicate(day, time, initial?.id)) {
      setError('同じ曜日・時刻のスケジュールがすでに存在します');
      return;
    }

    setSaving(true);
    try {
      // 動画を差し替えるときは同じキーに上書きする（古い動画を残さない）
      const videoKey = initial?.videoKey ?? `video_${crypto.randomUUID()}`;
      if (videoFile) await putFile(videoKey, videoFile);

      onSave({
        id: initial?.id ?? crypto.randomUUID(),
        name: name.trim(),
        day,
        time,
        videoKey,
        videoName: videoFile?.name ?? initial?.videoName ?? '',
        enabled: initial?.enabled ?? true, // 無効化した予約を編集しても有効に戻さない
      });
    } catch {
      setError('保存に失敗しました。ストレージの空き容量を確認してください');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="form-label">スケジュール名</label>
        <input
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); setError(''); }}
          placeholder="例：火曜ストレッチ"
          className="input-dark w-full placeholder:text-gray-600"
        />
      </div>

      <div>
        <label className="form-label">曜日</label>
        <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-700/40 text-blue-200 text-sm font-semibold">
          {day}曜日
        </span>
      </div>

      <div>
        <label className="form-label">時刻</label>
        <div className="flex items-center gap-2">
          <select value={hour} onChange={e => setHour(e.target.value)} className="input-dark">
            {HOUR_OPTIONS.map(hourOption => <option key={hourOption} value={hourOption}>{hourOption}</option>)}
          </select>
          <span className="text-gray-500 font-bold text-lg">:</span>
          <select value={minute} onChange={e => setMinute(e.target.value)} className="input-dark">
            {MINUTE_OPTIONS.map(minuteOption => <option key={minuteOption} value={minuteOption}>{minuteOption}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="form-label">
          動画ファイル
          {initial?.videoName && (
            <span className="normal-case ml-2 text-gray-500">（現在: {initial.videoName}）</span>
          )}
        </label>
        <input
          type="file"
          accept="video/*"
          onChange={e => { setVideoFile(e.target.files?.[0] ?? null); setError(''); }}
          className="text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-700 file:text-gray-200 hover:file:bg-gray-600 file:cursor-pointer file:transition-colors"
        />
        {videoFile && <p className="text-xs text-green-400 mt-1">{videoFile.name} を選択中</p>}
      </div>

      {error && <p className="alert-error">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary">
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? '保存中...' : '保存する'}
        </button>
      </div>
    </div>
  );
}
