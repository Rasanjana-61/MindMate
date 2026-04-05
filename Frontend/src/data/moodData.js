import { Frown, Meh, Smile, Sparkles } from 'lucide-react'

export function formatDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// Empty  all data is loaded from the backend API
export const moodData = {}

export function getMoodMeta(mood) {
  if (mood <= 2) {
    return {
      Icon: Frown,
      label: 'Low mood',
      className: 'text-dusty-rose',
    }
  }

  if (mood === 3) {
    return {
      Icon: Meh,
      label: 'Neutral mood',
      className: 'text-stone',
    }
  }

  if (mood === 4) {
    return {
      Icon: Smile,
      label: 'Good mood',
      className: 'text-sage',
    }
  }

  return {
    Icon: Sparkles,
    label: 'Great mood',
    className: 'text-amber',
  }
}

export function getMoodEmoji(mood) {
  return getMoodMeta(mood).Icon
}

export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

export function getFirstDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}
