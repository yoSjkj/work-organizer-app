import { useFormStore } from '../../stores/useFormStore'
import { useUIStore } from '../../stores/useUIStore'
import {
  SelectField,
  TextField,
  TextArea,
  ContactField,
  RequesterFields
} from './fields'

// 옵션 데이터
const OPTIONS = {
  requestMethods: ['전화', '이메일', 'CSR', '메신저', '직접방문'],
  inquiryTypes: [
    '암호 초기화',
    '시스템 문의',
    'PC환경 문의',
    '계정 문의',
    '주문 문의',
    '조직이관 문의',
    '기능 CSR',
    '통제자재 등록 요청',
    '부자재코드 생성 요청',
    '기타'
  ],
  requesterTypes: ['대리점', '현업', '시공사', 'IT담당자', '기타'],
  statuses: ['임시', '진행', '완료']
}

function MemoForm({ onSubmit }) {
  const memo = useFormStore((state) => state.memo)
  const setMemoField = useFormStore((state) => state.setMemoField)
  const editingId = useUIStore((state) => state.editingId)
  const cancelEdit = useUIStore((state) => state.cancelEdit)
  const resetForm = useFormStore((state) => state.resetForm)

  const handleCancel = () => {
    cancelEdit()
    resetForm('memo')
  }

  // 문의유형 변경 핸들러 (자동 입력 기능 포함)
  const handleInquiryTypeChange = (value) => {
    setMemoField('inquiryType', value)

    if (value === '부자재코드 생성 요청') {
      setMemoField('requestMethod', 'CSR')
      setMemoField('requesterType', '현업')
      setMemoField('team', '창호.지인스퀘어 수원')
      setMemoField('name', '장동희')
      setMemoField('position', '책임')
    } else if (value === '암호 초기화') {
      setMemoField('title', '대리점 마스터 계정 비밀번호 초기화 요청')
      setMemoField('content', '대리점 : [대리점명] (0000)\n마스터 계정 비밀번호 초기화 요청')
    } else if (value === '통제자재 등록 요청') {
      setMemoField('requestMethod', '메신저')
      setMemoField('requesterType', '현업')
      setMemoField('team', '창호.상품개발팀')
      setMemoField('name', '박범석')
      setMemoField('position', '선임')
      setMemoField('title', '통제자재 등록 요청')
    }
  }

  // 요청자 필드 변경 핸들러
  const handleRequesterChange = (field, value) => {
    setMemoField(field, value)
  }

  return (
    <>
      {/* 상단: 요청방식, 문의유형, 요청자유형 */}
      <div className="memo-form-top">
        <SelectField
          value={memo.requestMethod}
          onChange={(val) => setMemoField('requestMethod', val)}
          options={OPTIONS.requestMethods}
        />

        <input
          type="text"
          placeholder="문의유형"
          value={memo.inquiryType}
          onChange={(e) => handleInquiryTypeChange(e.target.value)}
          list="inquiry-types"
        />
        <datalist id="inquiry-types">
          {OPTIONS.inquiryTypes.map((type) => (
            <option key={type} value={type} />
          ))}
        </datalist>

        <SelectField
          value={memo.requesterType}
          onChange={(val) => setMemoField('requesterType', val)}
          options={OPTIONS.requesterTypes}
        />
      </div>

      {/* 연락 정보 (문의 방식별) */}
      <ContactField
        requestMethod={memo.requestMethod}
        value={memo.contactInfo}
        onChange={(val) => setMemoField('contactInfo', val)}
      />

      {/* 요청자 정보 (유형별로 다름) */}
      <RequesterFields
        requesterType={memo.requesterType}
        values={memo}
        onChange={handleRequesterChange}
      />

      {/* 제목 */}
      <TextField
        placeholder="제목"
        value={memo.title}
        onChange={(val) => setMemoField('title', val)}
        required
      />

      {/* 내용 */}
      <TextArea
        placeholder="문의 내용을 입력하세요"
        value={memo.content}
        onChange={(val) => setMemoField('content', val)}
        rows={4}
        required
      />

      {/* 하단: 상태 선택, 추가/취소 버튼 */}
      <div className="form-controls">
        <SelectField
          value={memo.status}
          onChange={(val) => setMemoField('status', val)}
          options={OPTIONS.statuses}
        />
        <div className="button-group">
          {editingId && (
            <button type="button" onClick={handleCancel} className="cancel-btn">
              취소
            </button>
          )}
          <button type="submit" className="add-btn">
            {editingId ? '저장' : '추가'}
          </button>
        </div>
      </div>
    </>
  )
}

export default MemoForm
