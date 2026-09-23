import { CONFIG_KEY, POSTER_KEY, SCHEDULE_KEY } from '../types';
import { createBackupBlob, readBackup } from './backupFormat';
import type { BackupFile } from './backupFormat';
import { deleteFile, getFile, listFileKeys, putFile } from './fileStore';
import { parsePosters, parseSchedules } from './records';
import { readJson } from './storage';

// バックアップに含める保存データ。再生済みの記録と再生履歴はその PC での記録なので含めない
const BACKUP_STORAGE_KEYS = [SCHEDULE_KEY, POSTER_KEY, CONFIG_KEY];

export async function exportBackup(now: Date): Promise<Blob> {
  const storage = Object.fromEntries(BACKUP_STORAGE_KEYS.map(key => [key, localStorage.getItem(key)]));

  const fileKeys = new Set([
    ...parseSchedules(readJson(SCHEDULE_KEY)).map(schedule => schedule.videoKey),
    ...parsePosters(readJson(POSTER_KEY)).map(poster => poster.imageKey),
  ]);
  const files: BackupFile[] = [];
  for (const key of fileKeys) {
    const blob = await getFile(key);
    if (blob) files.push({ key, blob });
  }

  return createBackupBlob(storage, files, now);
}

// 今のデータをすべてバックアップの内容に置き換える。呼び出し側は完了後に画面を読み込み直すこと。
// 先に動画・画像を書き込み、全部成功してから一覧を差し替える（途中で失敗しても今の一覧は壊れない）
export async function importBackup(file: Blob): Promise<void> {
  const { manifest, files } = await readBackup(file);

  for (const { key, blob } of files) {
    await putFile(key, blob);
  }

  for (const key of BACKUP_STORAGE_KEYS) {
    const value = manifest.storage[key];
    if (typeof value === 'string') localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  }

  // 差し替え後の一覧から参照されなくなった動画・画像を消して容量を空ける
  const keep = new Set(files.map(({ key }) => key));
  for (const key of await listFileKeys()) {
    if (!keep.has(key)) await deleteFile(key);
  }
}
