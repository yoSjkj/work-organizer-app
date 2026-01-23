import { useState } from 'react'

export function useDocumentForm() {
  const [docCategory, setDocCategory] = useState('전체')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isMarkdown, setIsMarkdown] = useState(false)  // ← 추가
  
  const resetForm = () => {
    setDocCategory('전체')
    setTitle('')
    setContent('')
    setIsMarkdown(false)
  }
  
  const setFormData = (data) => {
    setDocCategory(data.docCategory || '전체')
    setTitle(data.title || '')
    setContent(data.content || '')
    setIsMarkdown(data.isMarkdown || false)
  }
  
  const getFormData = () => ({
    docCategory,
    title,
    content,
    isMarkdown
  })
  
  return {
    docCategory,
    title,
    content,
    isMarkdown,
    setDocCategory,
    setTitle,
    setContent,
    setIsMarkdown,
    resetForm,
    setFormData,
    getFormData
  }
}