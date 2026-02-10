import { useState } from 'react'
import { useFormStore } from '../stores/useFormStore'
import { useUIStore } from '../stores/useUIStore'
import { isTauri } from '../stores/tauriStorage'
import { readTextFile } from '@tauri-apps/plugin-fs'

const DOCUMENT_CATEGORIES = ['전체', '주문', '처리중', '조직이관', '인수인계', '기타']

function DocumentForm({ onSubmit }) {
  const document = useFormStore((state) => state.document)
  const setDocumentField = useFormStore((state) => state.setDocumentField)
  const editingId = useUIStore((state) => state.editingId)
  const cancelEdit = useUIStore((state) => state.cancelEdit)
  const resetForm = useFormStore((state) => state.resetForm)

  const [isDragging, setIsDragging] = useState(false)

  const handleCancel = () => {
    cancelEdit()
    resetForm('document')
  }

  const handleDragOver = (e) => {
    console.log('DragOver!')
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    console.log('DragLeave!')
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e) => {
    console.log('Drop 이벤트 발생!')
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    console.log('dataTransfer:', e.dataTransfer)
    console.log('files:', e.dataTransfer.files)
    console.log('files.length:', e.dataTransfer.files.length)

    try {
      let fileContent = ''
      let fileName = ''

      const files = e.dataTransfer.files
      console.log('파일 개수:', files.length)

      if (files.length > 0) {
        const file = files[0]
        fileName = file.name
        console.log('파일명:', fileName)

        // 텍스트 파일만 허용
        if (!fileName.endsWith('.txt') && !fileName.endsWith('.md')) {
          alert('텍스트 파일(.txt, .md)만 지원합니다.')
          return
        }

        console.log('파일 읽기 시작...')
        const text = await file.text()
        fileContent = text
        console.log('파일 내용 길이:', fileContent.length)
      } else {
        console.log('파일이 없습니다!')
      }

      if (fileContent) {
        console.log('폼에 입력 중...')
        // 파일 내용을 폼에 입력
        setDocumentField('content', fileContent)

        // 파일명을 제목으로 (확장자 제거)
        const titleFromFile = fileName.replace(/\.(txt|md)$/, '')
        if (!document.title) {
          setDocumentField('title', titleFromFile)
        }

        // .md 파일이면 마크다운 렌더링 자동 체크
        if (fileName.endsWith('.md')) {
          setDocumentField('isMarkdown', true)
        }

        console.log('완료!')
      }
    } catch (error) {
      console.error('파일 읽기 실패:', error)
      alert('파일을 읽을 수 없습니다.')
    }
  }

  return (
    <>
      {/* 마크다운 체크박스 */}
      <label className="markdown-checkbox-wrapper">
        <input
          type="checkbox"
          checked={document.isMarkdown}
          onChange={(e) => setDocumentField('isMarkdown', e.target.checked)}
        />
        <span className="markdown-checkbox-label">마크다운으로 렌더링</span>
      </label>

      <div className="document-form-top">
        <select
          value={document.docCategory}
          onChange={(e) => setDocumentField('docCategory', e.target.value)}
          className="doc-category-select"
        >
          {DOCUMENT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="제목"
          value={document.title}
          onChange={(e) => setDocumentField('title', e.target.value)}
          className="doc-title-input"
        />
      </div>

      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <textarea
          placeholder="내용을 입력하세요 (또는 .txt/.md 파일을 드래그하세요)"
          value={document.content}
          onChange={(e) => setDocumentField('content', e.target.value)}
          style={{ minHeight: '400px' }}
        />
        {isDragging && (
          <div className="drop-overlay">
            <div className="drop-message">파일을 놓으세요</div>
          </div>
        )}
      </div>

      <div className="form-controls">
        <div className="button-group">
          {editingId && (
            <button onClick={handleCancel} className="cancel-btn">
              취소
            </button>
          )}
          <button onClick={onSubmit} className="add-btn">
            {editingId ? '저장' : '추가'}
          </button>
        </div>
      </div>
    </>
  )
}

export default DocumentForm
