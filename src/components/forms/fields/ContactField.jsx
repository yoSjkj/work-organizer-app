import TextField from './TextField'

/**
 * 요청 방식에 따른 연락처 입력 필드
 * - 전화: 전화번호 입력
 * - 이메일: 이메일 입력
 * - CSR: CSR 처리번호 입력
 * - 직접방문: 필드 없음
 */
function ContactField({ requestMethod, value, onChange }) {
  switch (requestMethod) {
    case '전화':
      return (
        <div className="contact-field">
          <TextField
            type="tel"
            placeholder="전화번호 (예: 010-1234-5678)"
            value={value}
            onChange={onChange}
          />
        </div>
      )

    case '이메일':
      return (
        <div className="contact-field">
          <TextField
            type="email"
            placeholder="이메일 주소"
            value={value}
            onChange={onChange}
          />
        </div>
      )

    case 'CSR':
      return (
        <div className="contact-field">
          <TextField
            type="text"
            placeholder="CSR 처리번호 (예: RITM1234567)"
            value={value}
            onChange={onChange}
          />
        </div>
      )

    case '직접방문':
      return null

    default:
      return null
  }
}

export default ContactField
