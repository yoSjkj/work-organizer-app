/**
 * 범용 TextArea 필드
 */
function TextArea({ value, onChange, placeholder, required, className, rows = 5 }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className={className}
      rows={rows}
    />
  )
}

export default TextArea
