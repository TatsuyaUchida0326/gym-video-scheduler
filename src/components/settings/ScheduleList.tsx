import { useState, useRef, useEffect } from 'react';
import { CLOSED_DAYS, DAY_LABELS } from '../../types';
import type { Schedule, DayOfWeek } from '../../types';
import { ScheduleForm } from './ScheduleForm';
import { getFile } from '../../lib/fileStore';
import { getDayOfWeek } from '../../utils/timeUtils';

interface Props {
  schedules: Schedule[];
  onAdd: (schedule: Schedule) => void;
  onUpdate: (schedule: Schedule) => void;
  onDelete: (id: string) => void;
  hasDuplicate: (day: DayOfWeek, time: string, excludeId?: string) => boolean;
}

const OPEN_DAYS = DAY_LABELS.filter(day => !CLOSED_DAYS.includes(day));

function getDefaultDay(): DayOfWeek {
  const today = getDayOfWeek();
  return OPEN_DAYS.includes(today) ? today : OPEN_DAYS[0];
}

export function ScheduleList({ schedules, onAdd, onUpdate, onDelete, hasDuplicate }: Props) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getDefaultDay);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Schedule | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState('');
  // 試聴中の URL は ref で持ち、作る直前と閉じるとき・画面を離れるときに必ず解放する
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function releasePreviewUrl() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
  }

  async function handlePreview(schedule: Schedule) {
    const blob = await getFile(schedule.videoKey);
    if (!blob) {
      alert('動画ファイルが見つかりません');
      return;
    }
    releasePreviewUrl();
    const url = URL.createObjectURL(blob);
    previewUrlRef.current = url;
    setPreviewUrl(url);
    setPreviewName(schedule.name);
  }

  function closePreview() {
    releasePreviewUrl();
    setPreviewUrl(null);
    setPreviewName('');
  }

  function closeForm() {
    setShowForm(false);
    setEditTarget(null);
  }

  function handleSave(schedule: Schedule) {
    if (editTarget) onUpdate(schedule);
    else onAdd(schedule);
    closeForm();
  }

  const schedulesOfDay = schedules
    .filter(schedule => schedule.day === selectedDay)
    .sort((a, b) => a.time.localeCompare(b.time));

  const countPerDay = (day: DayOfWeek) => schedules.filter(schedule => schedule.day === day).length;

  return (
    <div>
      {/* 曜日タブ */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {OPEN_DAYS.map(day => {
          const count = countPerDay(day);
          return (
            <button
              key={day}
              onClick={() => { setSelectedDay(day); closeForm(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedDay === day ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {day}曜
              {count > 0 && <span className="ml-1.5 opacity-70">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* 一覧 */}
      {schedulesOfDay.length === 0 && !showForm && (
        <p className="text-gray-600 text-sm mb-4">{selectedDay}曜日のスケジュールはありません</p>
      )}

      <div className="space-y-1.5 mb-4">
        {schedulesOfDay.map(schedule => (
          <div
            key={schedule.id}
            className="flex items-center gap-3 bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3"
          >
            <span className="text-lg font-bold text-white tabular-nums w-14 flex-shrink-0">{schedule.time}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{schedule.name}</p>
              <p className="text-xs text-gray-600 truncate mt-0.5">{schedule.videoName}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onUpdate({ ...schedule, enabled: !schedule.enabled })}
                title={schedule.enabled ? '有効 — クリックで無効化' : '無効 — クリックで有効化'}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  schedule.enabled ? 'bg-emerald-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                    schedule.enabled ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <button
                onClick={() => handlePreview(schedule)}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800/60 text-emerald-300 transition-colors"
              >
                ▶ 試聴
              </button>
              <button
                onClick={() => { setEditTarget(schedule); setShowForm(true); }}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
              >
                編集
              </button>
              <button
                onClick={() => { if (confirm(`「${schedule.name}」を削除しますか？`)) onDelete(schedule.id); }}
                className="btn-danger-sm"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 追加・編集フォーム */}
      {showForm ? (
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">
            {editTarget ? 'スケジュールを編集' : `${selectedDay}曜日にスケジュールを追加`}
          </h3>
          <ScheduleForm
            key={editTarget?.id ?? 'new'}
            day={editTarget ? editTarget.day : selectedDay}
            initial={editTarget ?? undefined}
            onSave={handleSave}
            onCancel={closeForm}
            hasDuplicate={hasDuplicate}
          />
        </div>
      ) : (
        <button
          onClick={() => { setEditTarget(null); setShowForm(true); }}
          className="flex items-center justify-center gap-2 w-full text-sm text-blue-400 hover:text-blue-300 px-3 py-3 rounded-xl border border-dashed border-gray-700 hover:border-blue-600 transition-colors"
        >
          ＋ {selectedDay}曜日にスケジュールを追加
        </button>
      )}

      {/* 試聴 */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/85 flex flex-col items-center justify-center z-50" onClick={closePreview}>
          <div className="relative w-full max-w-3xl mx-4" onClick={e => e.stopPropagation()}>
            <p className="text-white text-sm mb-2 text-center">{previewName}</p>
            <video
              src={previewUrl}
              autoPlay
              controls
              className="w-full max-h-[70vh] object-contain bg-black rounded-lg"
              onEnded={closePreview}
            />
            <button
              onClick={closePreview}
              className="absolute -top-2 -right-2 bg-gray-700 hover:bg-gray-600 text-white w-8 h-8 rounded-full text-sm flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
