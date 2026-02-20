import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'

const appWindow = getCurrentWebviewWindow()

function TitleBar() {
  return (
    <div className="titlebar" data-tauri-drag-region>
      <div className="titlebar-buttons">
        <button
          className="titlebar-btn titlebar-minimize"
          onClick={() => appWindow.minimize()}
          title="최소화"
        >
          &#x2212;
        </button>
        <button
          className="titlebar-btn titlebar-close"
          onClick={() => appWindow.hide()}
          title="닫기 (트레이로)"
        >
          &#x2715;
        </button>
      </div>
    </div>
  )
}

export default TitleBar
