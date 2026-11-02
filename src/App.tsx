import type { CardData } from './lib/types'
import { createEffect } from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'
import Editor from './components/Editor'
import Preview from './components/Preview'
import { defaultData } from './data'
import { clearData, loadData, saveData } from './lib/data'
import './App.css'

export default function App() {
  const [data, setData] = createStore<CardData>(loadData())

  let timer: number | undefined
  createEffect(() => {
    const snapshot = JSON.parse(JSON.stringify(data)) as CardData
    window.clearTimeout(timer)
    timer = window.setTimeout(saveData, 250, snapshot)
  })

  const reset = () => {
    // eslint-disable-next-line no-alert -- 恢复示例不可逆，需要原生二次确认
    if (!window.confirm('恢复示例数据？当前编辑会丢失。'))
      return
    clearData()
    setData(reconcile(defaultData()))
  }

  return (
    <div class="app">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark" />
          <div>
            <h1>CARD CAST</h1>
            <p>把社交主页做成一枚会轮播的动图名片</p>
          </div>
        </div>
        <button type="button" class="btn ghost small" onClick={reset}>恢复示例</button>
      </header>

      <main class="layout">
        <Editor data={data} setData={setData} />
        <Preview data={data} />
      </main>
    </div>
  )
}
