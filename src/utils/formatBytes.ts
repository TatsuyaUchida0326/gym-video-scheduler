const KB = 1024;
const MB = KB * 1024;
const GB = MB * 1024;

export function formatBytes(bytes: number): string {
  if (bytes < MB) return `${(bytes / KB).toFixed(1)} KB`;
  if (bytes < GB) return `${(bytes / MB).toFixed(1)} MB`;
  return `${(bytes / GB).toFixed(2)} GB`;
}
