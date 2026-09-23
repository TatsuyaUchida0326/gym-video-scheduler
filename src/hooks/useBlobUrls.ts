import { useState, useEffect, useRef } from 'react';
import { getFile } from '../lib/fileStore';

export function useBlobUrls(items: Array<{ imageKey: string }>): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const urlsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const next: Record<string, string> = {};
      const created: string[] = [];
      for (const item of items) {
        const cached = urlsRef.current[item.imageKey];
        if (cached) {
          next[item.imageKey] = cached;
          continue;
        }
        const blob = await getFile(item.imageKey);
        if (cancelled) break;
        if (blob) {
          const url = URL.createObjectURL(blob);
          next[item.imageKey] = url;
          created.push(url);
        }
      }
      if (cancelled) {
        // 途中で打ち切られたら、この回で作った URL は誰にも渡らないので解放する
        for (const url of created) URL.revokeObjectURL(url);
        return;
      }
      for (const [key, url] of Object.entries(urlsRef.current)) {
        if (!next[key]) URL.revokeObjectURL(url);
      }
      urlsRef.current = next;
      setUrls({ ...next });
    }
    load().catch(console.error);
    return () => { cancelled = true; };
  }, [items]);

  useEffect(() => {
    return () => {
      for (const url of Object.values(urlsRef.current)) {
        URL.revokeObjectURL(url);
      }
      urlsRef.current = {};
    };
  }, []);

  return urls;
}
