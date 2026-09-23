// 実行環境の判定。画面の出し分けに使う。
// 使わない側の処理をビルドから消したいときは、ここを経由せず import.meta.env.MODE を直接比べる（main.tsx 参照）

// Electron は起動時点で全画面かつ自動再生が許可されている
export const IS_ELECTRON = navigator.userAgent.includes('Electron');

// GitHub Pages で公開するデモ版（npm run build:demo）。見本の CM 素材と予約を入れて起動する
export const IS_DEMO = import.meta.env.MODE === 'demo';
