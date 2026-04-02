export function formatDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// Empty  all data is loaded from the backend API
export const moodData = {}

export function getMoodEmoji(mood) {
  if (mood <= 1) return '😔'
  if (mood === 2) return '😔'
  if (mood === 3) return '😐'
  if (mood === 4) return '😊'
  return '🌟'
}

export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

export function getFirstDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}
