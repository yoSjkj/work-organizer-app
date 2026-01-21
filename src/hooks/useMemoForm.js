import { useState } from 'react'

export function useMemoForm() {
  const [inputRequestMethod, setInputRequestMethod] = useState('전화')
  const [inputInquiryType, setInputInquiryType] = useState('')
  const [inputRequesterType, setInputRequesterType] = useState('대리점')
  const [inputContactInfo, setInputContactInfo] = useState('')
  const [inputDealerCode, setInputDealerCode] = useState('')
  const [inputDealerName, setInputDealerName] = useState('')
  const [inputTeam, setInputTeam] = useState('')
  const [inputName, setInputName] = useState('')
  const [inputPosition, setInputPosition] = useState('')
  const [inputFreeText, setInputFreeText] = useState('')
  const [inputTitle, setInputTitle] = useState('')
  const [inputContent, setInputContent] = useState('')
  const [inputStatus, setInputStatus] = useState('임시')

  // 폼 초기화
  const resetForm = () => {
    setInputRequestMethod('전화')
    setInputInquiryType('')
    setInputRequesterType('대리점')
    setInputContactInfo('')
    setInputDealerCode('')
    setInputDealerName('')
    setInputTeam('')
    setInputName('')
    setInputPosition('')
    setInputFreeText('')
    setInputTitle('')
    setInputContent('')
    setInputStatus('임시')
  }

  // 폼 데이터 설정 (수정 시)
  const setFormData = (item) => {
    setInputRequestMethod(item.requestMethod)
    setInputInquiryType(item.inquiryType)
    setInputRequesterType(item.requesterType)
    setInputContactInfo(item.contactInfo || '')
    
    if (item.requester) {
      setInputDealerCode(item.requester.dealerCode || '')
      setInputDealerName(item.requester.dealerName || '')
      setInputTeam(item.requester.team || '')
      setInputName(item.requester.name || '')
      setInputPosition(item.requester.position || '')
      setInputFreeText(item.requester.freeText || '')
    }
    
    setInputTitle(item.title || '')
    setInputContent(item.content)
    setInputStatus(item.status)
  }

  // 폼 데이터 가져오기
  const getFormData = () => {
    let requesterInfo = {}
    switch(inputRequesterType) {
      case '대리점':
        requesterInfo = {
          dealerCode: inputDealerCode,
          dealerName: inputDealerName
        }
        break
      case '현업':
        requesterInfo = {
          team: inputTeam,
          name: inputName,
          position: inputPosition
        }
        break
      default:
        requesterInfo = {
          freeText: inputFreeText
        }
    }

    return {
      requestMethod: inputRequestMethod,
      inquiryType: inputInquiryType,
      requesterType: inputRequesterType,
      contactInfo: inputContactInfo,
      requester: requesterInfo,
      title: inputTitle,
      content: inputContent,
      status: inputStatus
    }
  }

  return {
    // 상태들
    requestMethod: inputRequestMethod,
    inquiryType: inputInquiryType,
    requesterType: inputRequesterType,
    contactInfo: inputContactInfo,
    dealerCode: inputDealerCode,
    dealerName: inputDealerName,
    team: inputTeam,
    name: inputName,
    position: inputPosition,
    freeText: inputFreeText,
    title: inputTitle,
    content: inputContent,
    status: inputStatus,
    
    // 세터들
    setRequestMethod: setInputRequestMethod,
    setInquiryType: setInputInquiryType,
    setRequesterType: setInputRequesterType,
    setContactInfo: setInputContactInfo,
    setDealerCode: setInputDealerCode,
    setDealerName: setInputDealerName,
    setTeam: setInputTeam,
    setName: setInputName,
    setPosition: setInputPosition,
    setFreeText: setInputFreeText,
    setTitle: setInputTitle,
    setContent: setInputContent,
    setStatus: setInputStatus,
    
    // 메서드들
    resetForm,
    setFormData,
    getFormData
  }
}