export const parseKoreanDate = (dateStr) => {
  const parts = dateStr.replace(/\./g, '').trim().split(' ').filter(p => p)
  if (parts.length >= 3) {
    const date = new Date(parts[0], parts[1] - 1, parts[2])
    date.setHours(0, 0, 0, 0)
    return date
  }
  return new Date(dateStr)
}