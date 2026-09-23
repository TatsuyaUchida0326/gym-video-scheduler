import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { readJson, writeJson } from '../lib/storage';

// localStorage と同期する state。
// 読み込み時は parse で形を確かめて直し、値が変わるたびに書き戻す（保存処理を state 更新関数の中に書かずに済む）
export function usePersistentState<T>(key: string, parse: (raw: unknown) => T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => parse(readJson(key)));

  useEffect(() => {
    writeJson(key, value);
  }, [key, value]);

  return [value, setValue];
}
