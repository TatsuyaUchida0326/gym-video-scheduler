import { useState } from 'react';
import type { Poster } from '../../types';
import { useBlobUrls } from '../../hooks/useBlobUrls';

interface Props {
  posters: Poster[];
  onAdd: (file: File) => Promise<void>;
  onDelete: (id: string) => void;
}

export function PosterManager({ posters, onAdd, onDelete }: Props) {
  const thumbnails = useBlobUrls(posters);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setAdding(true);
    setError('');
    try {
      for (const file of Array.from(files)) {
        await onAdd(file);
      }
    } catch {
      setError('追加に失敗しました。ストレージの空き容量を確認してください');
    } finally {
      setAdding(false);
      e.target.value = '';
    }
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        登録枚数: <span className="text-gray-300 font-semibold">{posters.length}</span> 枚
      </p>

      {posters.length === 0 && (
        <p className="text-gray-600 text-sm mb-4">CM素材がまだ登録されていません</p>
      )}

      <div className="space-y-2 mb-4">
        {posters.map(poster => (
          <div
            key={poster.id}
            className="flex items-center gap-3 bg-gray-800/60 border border-gray-700/50 rounded-xl p-3"
          >
            {thumbnails[poster.imageKey] ? (
              <img
                src={thumbnails[poster.imageKey]}
                alt={poster.name}
                className="w-16 h-12 object-contain bg-gray-900 rounded-lg flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-12 bg-gray-900 rounded-lg flex items-center justify-center text-gray-600 text-xs flex-shrink-0">
                ...
              </div>
            )}
            <span className="flex-1 text-sm text-gray-300 truncate min-w-0">{poster.name}</span>
            <button
              onClick={() => {
                if (!confirm(`「${poster.name}」を削除しますか？`)) return;
                setError('');
                onDelete(poster.id);
              }}
              className="btn-danger-sm flex-shrink-0"
            >
              削除
            </button>
          </div>
        ))}
      </div>

      {error && (
        <p className="alert-error mb-3">{error}</p>
      )}

      <label
        className={`flex items-center justify-center gap-2 w-full text-sm px-3 py-3 rounded-xl border border-dashed transition-colors cursor-pointer ${
          adding
            ? 'border-gray-700 text-gray-600 cursor-not-allowed'
            : 'border-gray-700 text-blue-400 hover:text-blue-300 hover:border-blue-600'
        }`}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={adding}
          className="hidden"
        />
        {adding ? '追加中...' : '＋ CM素材を追加（複数選択可）'}
      </label>
    </div>
  );
}
