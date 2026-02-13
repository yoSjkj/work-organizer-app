import TextField from './TextField'

/**
 * 요청자 유형에 따른 입력 필드
 * - 대리점: 대리점코드 + 대리점명
 * - 현업: 팀명 + 이름 + 직위
 * - 기타: 자유 입력
 */
function RequesterFields({ requesterType, values, onChange }) {
  switch (requesterType) {
    case '대리점':
      return (
        <div className="requester-fields requester-fields-inline">
          <TextField
            placeholder="대리점코드"
            value={values.dealerCode || ''}
            onChange={(val) => onChange('dealerCode', val)}
            className="field-flex1"
          />
          <TextField
            placeholder="대리점명"
            value={values.dealerName || ''}
            onChange={(val) => onChange('dealerName', val)}
            className="field-flex1"
          />
        </div>
      )

    case '현업':
      return (
        <div className="requester-fields requester-fields-inline">
          <TextField
            placeholder="팀명"
            value={values.team || ''}
            onChange={(val) => onChange('team', val)}
            className="field-flex2"
          />
          <TextField
            placeholder="이름"
            value={values.name || ''}
            onChange={(val) => onChange('name', val)}
            className="field-flex1"
          />
          <TextField
            placeholder="직위"
            value={values.position || ''}
            onChange={(val) => onChange('position', val)}
            className="field-flex1"
          />
        </div>
      )

    default:
      return (
        <div className="requester-fields">
          <TextField
            placeholder="요청자 정보"
            value={values.freeText || ''}
            onChange={(val) => onChange('freeText', val)}
            className="full-width"
          />
        </div>
      )
  }
}

export default RequesterFields
