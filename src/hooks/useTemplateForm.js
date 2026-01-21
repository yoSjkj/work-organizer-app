import { useState } from 'react'

export function useTemplateForm() {
  const [inputTitle, setInputTitle] = useState('')
  const [inputContent, setInputContent] = useState('')

  const resetForm = () => {
    setInputTitle('')
    setInputContent('')
  }

  const setFormData = (template) => {
    setInputTitle(template.title || '')
    setInputContent(template.content || '')
  }

  const getFormData = () => ({
    title: inputTitle,
    content: inputContent
  })

  return {
    title: inputTitle,
    content: inputContent,
    
    setTitle: setInputTitle,
    setContent: setInputContent,
    
    resetForm,
    setFormData,
    getFormData
  }
}