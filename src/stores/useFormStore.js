import { create } from 'zustand'

// 초기 상태
const initialMemoForm = {
  requestMethod: '전화',
  inquiryType: '',
  requesterType: '대리점',
  contactInfo: '',
  dealerCode: '',
  dealerName: '',
  team: '',
  name: '',
  position: '',
  freeText: '',
  title: '',
  content: '',
  status: '임시'
}

const getTodayDate = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const initialDeploymentForm = {
  date: getTodayDate(),
  description: '',
  changes: '',
  status: '임시',
  backupPath: '',
  newPath: '',
  fileList: '',
  checklist: {
    backup: false,
    diff: false,
    upload: false,
    verify: false
  }
}

const initialTemplateForm = {
  title: '',
  content: ''
}

const initialDocumentForm = {
  docCategory: '전체',
  title: '',
  content: '',
  isMarkdown: false
}

export const useFormStore = create((set, get) => ({
  // 폼 상태
  memo: { ...initialMemoForm },
  deployment: { ...initialDeploymentForm },
  template: { ...initialTemplateForm },
  document: { ...initialDocumentForm },

  // 메모 폼 업데이트
  setMemoField: (field, value) => set((state) => ({
    memo: { ...state.memo, [field]: value }
  })),

  // 배포 폼 업데이트
  setDeploymentField: (field, value) => set((state) => ({
    deployment: { ...state.deployment, [field]: value }
  })),

  // 양식 폼 업데이트
  setTemplateField: (field, value) => set((state) => ({
    template: { ...state.template, [field]: value }
  })),

  // 문서 폼 업데이트
  setDocumentField: (field, value) => set((state) => ({
    document: { ...state.document, [field]: value }
  })),

  // 폼 초기화
  resetForm: (type) => {
    switch (type) {
      case 'memo':
        set({ memo: { ...initialMemoForm } })
        break
      case 'deployment':
        set({ deployment: { ...initialDeploymentForm } })
        break
      case 'template':
        set({ template: { ...initialTemplateForm } })
        break
      case 'document':
        set({ document: { ...initialDocumentForm } })
        break
      case 'all':
        set({
          memo: { ...initialMemoForm },
          deployment: { ...initialDeploymentForm },
          template: { ...initialTemplateForm },
          document: { ...initialDocumentForm }
        })
        break
    }
  },

  // 폼 데이터 설정 (수정 시)
  setFormData: (type, data) => {
    switch (type) {
      case 'memo':
        set({
          memo: {
            requestMethod: data.requestMethod,
            inquiryType: data.inquiryType,
            requesterType: data.requesterType,
            contactInfo: data.contactInfo || '',
            dealerCode: data.requester?.dealerCode || '',
            dealerName: data.requester?.dealerName || '',
            team: data.requester?.team || '',
            name: data.requester?.name || '',
            position: data.requester?.position || '',
            freeText: data.requester?.freeText || '',
            title: data.title || '',
            content: data.content,
            status: data.status
          }
        })
        break
      case 'deployment':
        set({
          deployment: {
            date: data.deploymentDate || getTodayDate(),
            description: data.description || '',
            changes: data.changes || '',
            status: data.status || '임시',
            backupPath: data.backupPath || '',
            newPath: data.newPath || '',
            fileList: data.fileList || '',
            checklist: data.checklist || {
              backup: false,
              diff: false,
              upload: false,
              verify: false
            }
          }
        })
        break
      case 'template':
        set({
          template: {
            title: data.title || '',
            content: data.content || ''
          }
        })
        break
      case 'document':
        set({
          document: {
            docCategory: data.docCategory || '전체',
            title: data.title || '',
            content: data.content || '',
            isMarkdown: data.isMarkdown || false
          }
        })
        break
    }
  },

  // 폼 데이터 가져오기 (저장 시)
  getFormData: (type) => {
    const state = get()

    switch (type) {
      case 'memo': {
        const { memo } = state
        let requesterInfo = {}

        switch (memo.requesterType) {
          case '대리점':
            requesterInfo = {
              dealerCode: memo.dealerCode,
              dealerName: memo.dealerName
            }
            break
          case '현업':
            requesterInfo = {
              team: memo.team,
              name: memo.name,
              position: memo.position
            }
            break
          default:
            requesterInfo = {
              freeText: memo.freeText
            }
        }

        return {
          requestMethod: memo.requestMethod,
          inquiryType: memo.inquiryType,
          requesterType: memo.requesterType,
          contactInfo: memo.contactInfo,
          requester: requesterInfo,
          title: memo.title,
          content: memo.content,
          status: memo.status
        }
      }
      case 'deployment':
        return {
          deploymentDate: state.deployment.date,
          title: state.deployment.description,
          content: state.deployment.changes,
          description: state.deployment.description,
          changes: state.deployment.changes,
          status: state.deployment.status,
          backupPath: state.deployment.backupPath,
          newPath: state.deployment.newPath,
          fileList: state.deployment.fileList,
          checklist: state.deployment.checklist
        }
      case 'template':
        return {
          title: state.template.title,
          content: state.template.content
        }
      case 'document':
        return {
          docCategory: state.document.docCategory,
          title: state.document.title,
          content: state.document.content,
          isMarkdown: state.document.isMarkdown
        }
      default:
        return {}
    }
  }
}))
