'use strict'

const { app, BrowserWindow, dialog, powerSaveBlocker } = require('electron')
const path = require('path')

// 二重起動を防ぐ。同じ保存先（userData）を 2 つのウィンドウが奪い合うと読み書きが壊れる
if (!app.requestSingleInstanceLock()) {
  app.quit()
  return
}

let mainWindow = null
// true のときは確認なしで閉じる（アプリの終了処理中・Windows のシャットダウン中）
let allowClose = false

// 会社の Windows PC が停電や更新で再起動しても、誰も触らずに予約が動くよう、ログイン時に自動で起動する。
// 開発中（electron:dev）と Mac では登録しない
function enableAutoStart() {
  if (!app.isPackaged || process.platform !== 'win32') return
  // portable 版は起動のたびに一時フォルダへ展開されるので、展開先ではなく元の exe を登録する
  const exePath = process.env.PORTABLE_EXECUTABLE_FILE || process.execPath
  app.setLoginItemSettings({ openAtLogin: true, path: exePath })
}

function confirmClose(win) {
  const choice = dialog.showMessageBoxSync(win, {
    type: 'warning',
    buttons: ['閉じない', '閉じる'],
    defaultId: 0,
    cancelId: 0,
    title: 'GymVideoScheduler',
    message: 'アプリを閉じますか？',
    detail: '閉じている間は、予約した動画が再生されません。',
  })
  return choice === 1
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // ウィンドウが隠れたと判定されてもタイマーを間引かない（予約チェックの取りこぼし防止）
      backgroundThrottling: false,
    },
  })
  mainWindow = win

  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))

  // F11 で全画面/ウィンドウを切り替える。
  // globalShortcut は他アプリの F11 まで奪うので、このウィンドウにフォーカスがあるときだけ効かせる
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen())
      event.preventDefault()
    }
  })

  // × や Alt+F4 で誤って閉じないよう確認する
  win.on('close', (event) => {
    if (allowClose) return
    if (!confirmClose(win)) event.preventDefault()
  })
  // Windows のシャットダウン・再起動を確認ダイアログで止めない
  win.on('query-session-end', () => {
    allowClose = true
  })

  // 描画プロセスが落ちたり固まったりしても、無人のまま真っ白で止まらないよう読み込み直す
  win.webContents.on('render-process-gone', (_event, details) => {
    console.error('renderer gone:', details.reason)
    win.reload()
  })
  win.on('unresponsive', () => {
    console.error('renderer unresponsive, reloading')
    win.reload()
  })

  win.on('closed', () => {
    mainWindow = null
  })
}

app.on('before-quit', () => {
  allowClose = true
})

app.whenReady().then(() => {
  enableAutoStart()
  // 画面消灯・スリープを防ぐ（消えた画面の裏で動画が流れる／スリープ中の予約が飛ぶのを防ぐ）
  powerSaveBlocker.start('prevent-display-sleep')

  createWindow()

  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => app.quit())
