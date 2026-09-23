// バックアップファイルの形式（読み書きの純粋な部分。IndexedDB / localStorage には触らない）
//
//   [8 bytes]  "GYMBAK01"                    … 形式の目印と版
//   [12 bytes] 目録の長さ（10進数・0埋め）
//   [n bytes]  目録 JSON（UTF-8）
//   [...]      目録の files の順に、各ファイルの中身をそのまま連結
//
// 動画は数百MB〜GBになりうるので、Blob を連結・切り出しするだけで中身をメモリへ読み込まない

const MAGIC = 'GYMBAK01';
const LENGTH_DIGITS = 12;
const HEADER_LENGTH = MAGIC.length + LENGTH_DIGITS;

export type BackupFileEntry = { key: string; type: string; size: number };

export type BackupManifest = {
  version: 1;
  createdAt: string;
  storage: Record<string, string | null>;
  files: BackupFileEntry[];
};

export type BackupFile = { key: string; blob: Blob };

export class BackupFormatError extends Error {}

export function createBackupBlob(storage: Record<string, string | null>, files: BackupFile[], createdAt: Date): Blob {
  const manifest: BackupManifest = {
    version: 1,
    createdAt: createdAt.toISOString(),
    storage,
    files: files.map(({ key, blob }) => ({ key, type: blob.type, size: blob.size })),
  };
  const manifestBytes = new TextEncoder().encode(JSON.stringify(manifest));
  const header = MAGIC + String(manifestBytes.length).padStart(LENGTH_DIGITS, '0');
  return new Blob([header, manifestBytes, ...files.map(({ blob }) => blob)], { type: 'application/octet-stream' });
}

function isFileEntry(value: unknown): value is BackupFileEntry {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.key === 'string' &&
    typeof entry.type === 'string' &&
    Number.isInteger(entry.size) &&
    (entry.size as number) >= 0
  );
}

function parseManifest(json: string): BackupManifest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new BackupFormatError('バックアップファイルが壊れています');
  }
  const manifest = parsed as Partial<BackupManifest> | null;
  if (
    manifest?.version !== 1 ||
    typeof manifest.storage !== 'object' || manifest.storage === null ||
    !Array.isArray(manifest.files) || !manifest.files.every(isFileEntry)
  ) {
    throw new BackupFormatError('対応していないバックアップファイルです');
  }
  return manifest as BackupManifest;
}

export async function readBackup(file: Blob): Promise<{ manifest: BackupManifest; files: BackupFile[] }> {
  const header = await file.slice(0, HEADER_LENGTH).text();
  if (!header.startsWith(MAGIC)) throw new BackupFormatError('バックアップファイルではありません');

  const manifestLength = Number(header.slice(MAGIC.length));
  if (!Number.isInteger(manifestLength) || manifestLength <= 0) {
    throw new BackupFormatError('バックアップファイルが壊れています');
  }

  const manifestEnd = HEADER_LENGTH + manifestLength;
  const manifest = parseManifest(await file.slice(HEADER_LENGTH, manifestEnd).text());

  let offset = manifestEnd;
  const files = manifest.files.map(({ key, type, size }) => {
    const blob = file.slice(offset, offset + size, type);
    offset += size;
    return { key, blob };
  });
  if (offset !== file.size) throw new BackupFormatError('バックアップファイルが途中で切れています');

  return { manifest, files };
}
