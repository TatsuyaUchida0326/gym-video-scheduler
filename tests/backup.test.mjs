import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBackupBlob, readBackup, BackupFormatError } from '../src/lib/backupFormat.ts';

const storage = { gym_schedules: '[{"id":"a"}]', gym_posters: null, gym_config: '{"slideIntervalSec":30}' };
const files = [
  { key: 'video_1', blob: new Blob(['動画のデータ'], { type: 'video/mp4' }) },
  { key: 'image_1', blob: new Blob([new Uint8Array([0, 1, 2, 255])], { type: 'image/png' }) },
  { key: 'empty', blob: new Blob([]) },
];

test('書き出したファイルを読み込むと、保存データとファイルの中身が元どおりになる', async () => {
  const backup = createBackupBlob(storage, files, new Date('2026-09-23T00:00:00Z'));
  const { manifest, files: restored } = await readBackup(backup);

  assert.deepEqual(manifest.storage, storage);
  assert.equal(manifest.createdAt, '2026-09-23T00:00:00.000Z');
  assert.deepEqual(restored.map(file => file.key), ['video_1', 'image_1', 'empty']);
  assert.equal(await restored[0].blob.text(), '動画のデータ');
  assert.equal(restored[0].blob.type, 'video/mp4');
  assert.deepEqual([...new Uint8Array(await restored[1].blob.arrayBuffer())], [0, 1, 2, 255]);
  assert.equal(restored[2].blob.size, 0);
});

test('別のファイル・途中で切れたファイル・壊れた目録は読み込まない', async () => {
  await assert.rejects(readBackup(new Blob(['hello world, not a backup'])), BackupFormatError);

  const backup = createBackupBlob(storage, files, new Date());
  await assert.rejects(readBackup(backup.slice(0, backup.size - 1)), BackupFormatError);

  const brokenManifest = new Blob(['GYMBAK01' + '000000000005' + '{oops']);
  await assert.rejects(readBackup(brokenManifest), BackupFormatError);
});
