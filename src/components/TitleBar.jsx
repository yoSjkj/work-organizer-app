import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { isTauri } from '../stores/tauriStorage'

function TitleBar() {
  const minimize = () => {
    if (!isTauri()) return
    try { getCurrentWebviewWindow().minimize() } catch { /* ignore */ }
  }

  const hide = () => {
    if (!isTauri()) return
    try { getCurrentWebviewWindow().hide() } catch { /* ignore */ }
  }

  return (
    <div className="titlebar" data-tauri-drag-region>
      <div className="titlebar-buttons">
        <button
          className="titlebar-btn titlebar-minimize"
          onClick={minimize}
          title="최소화"
        >
          &#x2212;
        </button>
        <button
          className="titlebar-btn titlebar-close"
          onClick={hide}
          title="닫기 (트레이로)"
        >
          &#x2715;
        </button>
      </div>
    </div>
  )
}

export default TitleBar
