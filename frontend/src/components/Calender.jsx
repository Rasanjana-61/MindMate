import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react'
import {
  getMoodEmoji,
  getDaysInMonth,
  getFirstDayOfMonth,
  formatDate,
} from '../data/moodData'

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const EMOTION_EMOJI = {
  joy: '😊', anger: '😠', disgust: '🤢', fear: '😨',
  sadness: '😢', surprise: '😲', neutral: '😐',
}

const SENTIMENT_COLORS = {
  Positive: 'bg-sage-wash text-sage',
  Neutral: 'bg-mist-teal text-forest',
  Negative: 'bg-blush text-dusty-rose',
}

// Map a backend entry to the shape CalendarPopup needs
function toPopupEntry(entry) {
  return {
    date: entry.entryDate,
    mood: entry.moodScore,
    stress: entry.stressScore,
    energy: entry.energyScore,
    text: entry.text,
    emotion: entry.emotion,
    emotionScores: entry.emotionScores ?? {},
    sentiment: entry.sentiment ?? (entry.moodScore >= 4 ? 'Positive' : entry.moodScore <= 2 ? 'Negative' : 'Neutral'),
    summaryText: entry.summaryText,
    suggestions: entry.suggestions ?? [],
  }
}

function CalendarPopup({ entry, onClose }) {
  const date = new Date(entry.date)
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  // Sort emotion scores descending
  const sortedEmotions = Object.entries(entry.emotionScores ?? {})
    .sort((a, b) => b[1] - a[1])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative bg-warm-white rounded-card shadow-popup p-8 w-full max-w-3xl border border-sage-light/30 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-sage-wash transition-colors text-stone hover:text-forest"
        >
          <XIcon className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div className="text-center md:text-left">
            <p className="font-lora text-lg text-ink font-semibold">{formattedDate}</p>
            <div className="text-5xl mt-3 mb-2 flex items-center justify-center md:justify-start">
              {getMoodEmoji(entry.mood)}
              {entry.emotion && (
                <span className="ml-4 flex items-center gap-1.5">
                  <span className="text-lg">{EMOTION_EMOJI[entry.emotion] ?? '💭'}</span>
                  <span className="capitalize font-medium text-forest text-sm">{entry.emotion}</span>
                  <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${SENTIMENT_COLORS[entry.sentiment] ?? 'bg-sage-wash text-sage'}`}>
                    {entry.sentiment ?? '—'}
                  </span>
                </span>
              )}
            </div>
          </div>
          {/* Mood/Stress/Energy bars side by side */}
          <div className="flex flex-col gap-2 min-w-55 md:min-w-65 md:w-1/2">
            {[
              { key: 'mood',   label: 'Mood',   track: 'bg-sage-wash',   fill: 'bg-sage' },
              { key: 'stress', label: 'Stress', track: 'bg-blush/30',    fill: 'bg-dusty-rose' },
              { key: 'energy', label: 'Energy', track: 'bg-amber/20',    fill: 'bg-amber' },
            ].map(({ key, label, track, fill }, index) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs font-medium text-stone uppercase tracking-wide w-14">{label}</span>
                <div className={`flex-1 h-2.5 ${track} rounded-full overflow-hidden`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(entry[key] / 5) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                    className={`h-full ${fill} rounded-full`}
                  />
                </div>
                <span className="text-xs font-medium text-forest w-8 text-right">{entry[key]}/5</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main content grid: Journal, Emotion breakdown, Suggestions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Journal Text */}
          <div className="bg-sage-wash/30 rounded-xl p-4 h-fit">
            <p className="text-xs font-medium text-stone uppercase tracking-wide mb-1.5">Journal Entry</p>
            <p className="font-lora italic text-forest/80 text-sm leading-relaxed">
              "{entry.text}"
            </p>
          </div>

          {/* Emotion score breakdown */}
          {sortedEmotions.length > 0 && (
            <div className="mb-0 bg-sage-wash/30 rounded-xl p-4 h-fit">
              <p className="text-xs font-medium text-stone uppercase tracking-wide mb-2">Emotion Breakdown</p>
              <div className="space-y-2">
                {sortedEmotions.map(([emotion, score], index) => (
                  <div key={emotion} className="flex items-center gap-2">
                    <span className="text-sm w-5 text-center">{EMOTION_EMOJI[emotion] ?? '💭'}</span>
                    <span className="text-xs text-stone capitalize w-16">{emotion}</span>
                    <div className="flex-1 h-1.5 bg-sage-wash rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score * 100}%` }}
                        transition={{ duration: 0.4, delay: 0.05 * index }}
                        className="h-full bg-forest/50 rounded-full"
                      />
                    </div>
                    <span className="text-xs text-stone w-10 text-right">{(score * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wellness Suggestions */}
          {entry.suggestions?.length > 0 && (
            <div className="bg-sage-wash/50 rounded-xl p-4 h-fit">
              <p className="text-xs font-medium text-stone uppercase tracking-wide mb-2">Wellness Suggestions</p>
              <ul className="space-y-1.5">
                {entry.suggestions.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-forest">
                    <span className="text-sage mt-0.5">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export function Calendar({ entries = [], loading = false }) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedEntry, setSelectedEntry] = useState(null)

  // Build a map: "YYYY-MM-DD" -> latest entry for that day
  const entryMap = {}
  entries.forEach(entry => {
    const d = new Date(entry.entryDate)
    const key = formatDate(d.getFullYear(), d.getMonth(), d.getDate())
    if (!entryMap[key] || new Date(entry.entryDate) > new Date(entryMap[key].entryDate)) {
      entryMap[key] = entry
    }
  })

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth)

  const goToPrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }
  const goToNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  const isToday = (day) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear()

  const handleDayClick = (day) => {
    const key = formatDate(currentYear, currentMonth, day)
    const entry = entryMap[key]
    if (entry) setSelectedEntry(toPopupEntry(entry))
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-warm-white border border-sage-light/50 rounded-card shadow-card p-5 flex-1">

        <div className="flex items-center justify-between mb-4">
          <button onClick={goToPrevMonth} className="p-2 rounded-lg hover:bg-sage-wash">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>

          <h2 className="font-lora text-xl font-semibold text-ink">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>

          <button onClick={goToNextMonth} className="p-2 rounded-lg hover:bg-sage-wash">
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-stone py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
            <div key={idx} className="aspect-square" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1
            const key = formatDate(currentYear, currentMonth, day)
            const hasEntry = !!entryMap[key]
            const isTodayDate = isToday(day)

            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                disabled={!hasEntry}
                title={hasEntry ? `View entry for ${key}` : undefined}
                className={`relative aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-200 z-0
                  ${hasEntry
                    ? 'bg-sage text-white hover:bg-sage/90 cursor-pointer shadow-sm hover:scale-105 hover:z-50 hover:shadow-md active:scale-95'
                    : isTodayDate
                      ? 'bg-ink text-white'
                      : 'text-stone/40 cursor-default'
                  }
                `}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedEntry && (
          <CalendarPopup
            entry={selectedEntry}
            onClose={() => setSelectedEntry(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}