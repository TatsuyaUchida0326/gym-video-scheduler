import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppErrorBoundary } from './components/AppErrorBoundary.tsx'

async function start() {
  // デモ版は見本データを入れてから描画する。
  // 判定をここに直接書くと、通常版のビルドではこの分岐ごと消え、見本の素材もビルドに入らない
  // （env.ts の IS_DEMO 経由だと消えない）
  if (import.meta.env.MODE === 'demo') {
    const { seedDemo } = await import('./demo/seedDemo.ts')
    await seedDemo().catch(console.error)
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </StrictMode>,
  )
}

start()
