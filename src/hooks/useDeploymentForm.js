import { useState } from 'react'

export function useDeploymentForm() {
  const [deploymentFile, setDeploymentFile] = useState('')
  const [deploymentChanges, setDeploymentChanges] = useState('')
  const [deploymentTarget, setDeploymentTarget] = useState('운영')
  const [deploymentStatus, setDeploymentStatus] = useState('진행중')

  const resetForm = () => {
    setDeploymentFile('')
    setDeploymentChanges('')
    setDeploymentTarget('운영')
    setDeploymentStatus('진행중')
  }

  const setFormData = (item) => {
    setDeploymentFile(item.title)
    setDeploymentChanges(item.content)
    setDeploymentTarget(item.target)
    setDeploymentStatus(item.status)
  }

  const getFormData = () => ({
    title: deploymentFile,
    content: deploymentChanges,
    target: deploymentTarget,
    status: deploymentStatus
  })

  return {
    file: deploymentFile,
    changes: deploymentChanges,
    target: deploymentTarget,
    status: deploymentStatus,
    
    setFile: setDeploymentFile,
    setChanges: setDeploymentChanges,
    setTarget: setDeploymentTarget,
    setStatus: setDeploymentStatus,
    
    resetForm,
    setFormData,
    getFormData
  }
}