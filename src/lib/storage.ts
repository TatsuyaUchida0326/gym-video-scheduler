// localStorage の JSON 読み書き。
// 壊れたデータや容量超過でアプリが落ちないよう失敗は握りつぶし、形の確認と既定値は呼び出し側に任せる
export function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save ${key}`, error);
  }
}
