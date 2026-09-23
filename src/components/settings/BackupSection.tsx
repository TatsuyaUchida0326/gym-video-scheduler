import { useState } from 'react';
import { exportBackup, importBackup } from '../../lib/backup';
import { BackupFormatError } from '../../lib/backupFormat';
import { getDateString } from '../../utils/timeUtils';

// 保存ダイアログで場所を選ぶ時間を見込んで、ダウンロード用 URL はしばらく残してから解放する
const DOWNLOAD_URL_LIFETIME_MS = 10 * 60_000;
const BACKUP_EXTENSION = '.gymbak';

type Status = 'idle' | 'exporting' | 'importing';

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), DOWNLOAD_URL_LIFETIME_MS);
}

export function BackupSection() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const busy = status !== 'idle';

  async function handleExport() {
    setStatus('exporting');
    setError('');
    try {
      const now = new Date();
      downloadBlob(await exportBackup(now), `gym-backup-${getDateString(now)}${BACKUP_EXTENSION}`);
    } catch (exportError) {
      console.error(exportError);
      setError('書き出しに失敗しました');
    } finally {
      setStatus('idle');
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!window.confirm('今の動画・CM素材・スケジュール・設定を、すべてバックアップの内容に置き換えます。続けますか？')) return;

    setStatus('importing');
    setError('');
    try {
      await importBackup(file);
      window.location.reload();
    } catch (importError) {
      console.error(importError);
      setError(
        importError instanceof BackupFormatError
          ? importError.message
          : '読み込みに失敗しました。ストレージの空き容量を確認してください',
      );
      setStatus('idle');
    }
  }

  return (
    <div>
      <h2 className="section-title">バックアップ</h2>
      <p className="text-xs text-gray-500 mb-3">
        動画・CM素材・スケジュール・設定を1つのファイルに書き出します。PC の故障や入れ替えのときに読み込むと元に戻せます。
      </p>
      <div className="flex gap-3">
        <button onClick={handleExport} disabled={busy} className="btn-secondary">
          {status === 'exporting' ? '書き出し中...' : '書き出す'}
        </button>
        <label className={`btn-secondary ${busy ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
          <input type="file" accept={BACKUP_EXTENSION} onChange={handleImport} disabled={busy} className="hidden" />
          {status === 'importing' ? '読み込み中...' : '読み込む'}
        </label>
      </div>
      {error && <p className="alert-error mt-3">{error}</p>}
    </div>
  );
}
