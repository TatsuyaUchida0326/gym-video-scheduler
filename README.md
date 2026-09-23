# ジム動画スケジューラー

ジムの画面で CM 素材（画像）をスライドショー表示し、決まった曜日・時刻になると登録した動画を自動再生するアプリ。
会社の Windows PC（ネット接続なし）で、Electron の portable exe として無人運用している。

**デモ版:** https://tatsuyauchida0326.github.io/gym-video-scheduler/
見本の CM 素材と予約が入った状態で起動し、「全画面で開始」から約1分後にサンプル動画が自動再生される（音が出る）。
登録した内容は見た人のブラウザの中にだけ保存される。

## 動き

- **スライドショー:** 登録した画像を一定間隔（5〜300 秒）で切り替える
- **予約再生:** 10 秒ごとに予約を確認し、予約時刻から 5 分以内なら動画を再生する。再生が終わるとスライドショーに戻る
- **再生できないとき:** 形式が非対応・ファイル破損・20 秒以内に始まらない、などの場合は諦めてスライドショーに戻り、再生履歴に「失敗」と理由を残す
- **停止:** 右下の停止ボタンを長押し（1.5 秒）するか Esc キー。画面に触れただけでは止まらない
- **設定画面:** 右下の半透明の「⚙ 設定」から開く。3 分操作しないとスライドショーに戻る
- **休館日:** 月曜は予約一覧に出さない（`src/types/index.ts` の `CLOSED_DAYS`）

## Electron 版だけの動き（`electron/main.cjs`）

- exe を開くと起動画面を飛ばしてスライドショーから始まる
- Windows のログイン時に自動で起動する（portable exe の置き場所を登録する。exe を移動したら一度手で開けば登録し直される）
- × や Alt+F4 で閉じるときは確認を出す。Windows のシャットダウン時は確認しない
- 画面消灯・スリープを防ぐ。描画が落ちたり固まったりしたら自動で読み込み直す
- 二重起動しない
- F11 で全画面を切り替える（Mac は緑のボタンか Control+Command+F）

## データ

すべて PC の中に保存する。ネットには送らない。

| 内容 | 保存先 |
|---|---|
| 動画・画像 | IndexedDB（`gym-scheduler-db`） |
| 予約・CM 素材の一覧・設定・再生履歴 | localStorage（`gym_` で始まるキー） |

設定画面の「設定」タブの「バックアップ」で、動画・画像・予約・設定を 1 つの `.gymbak` ファイルに書き出し・読み込みできる。形式は `src/lib/backupFormat.ts` の先頭コメントを参照。

## 開発

```bash
npm install
npm run dev                # 開発サーバー（http://localhost:5173）
npm test                   # 予約判定・保存データ・バックアップ形式のテスト（Node 22.18 以降）
npm run lint
npm run build              # 型チェック＋ビルド（dist/）
npm run build:demo         # デモ版のビルド（dist-demo/。見本の素材と予約入り）
node scripts/gen-demo-assets.mjs  # デモ版の見本素材を作り直す（ffmpeg が必要）
npm run electron:build:win # Windows 用 portable exe（release/GymVideoScheduler 0.0.0.exe）
```

main に push すると GitHub Actions（`.github/workflows/deploy-demo.yml`）がテスト・lint の後にデモ版をビルドし、GitHub Pages に公開する。

会社の PC へは、`release/GymVideoScheduler 0.0.0.exe` を USB などで持ち込み、古い exe と置き換える。データは PC 側に残るので消えない。

## 構成

```
electron/main.cjs            Electron 本体（ウィンドウ・自動起動・閉じる確認・省電力対策）
src/App.tsx                  画面の切り替えと予約・履歴のつなぎ込み
src/components/              スライドショー・再生・起動画面
src/components/settings/     設定画面（予約・CM 素材・再生履歴・設定の各タブ）
src/hooks/                   状態と保存（usePersistentState が localStorage との同期を担う）
src/lib/                     画面に依存しない処理（予約判定・保存データの検証・バックアップ）
src/demo/                    デモ版だけで使う見本データと素材（通常版のビルドには入らない）
tests/                       src/lib と src/utils のテスト（node:test）
```

`src/lib` と `src/utils` のうちテストから読むファイルは、Node で直接読み込めるよう、値を import するときに `.ts` 拡張子を付けている。
