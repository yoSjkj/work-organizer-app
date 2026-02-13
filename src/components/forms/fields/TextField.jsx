/**
 * 범용 Text Input 필드
 */
function TextField({
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  className
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className={className}
    />
  )
}

export default TextField
