import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react'
import {
  getMoodEmoji,
  getDaysInMonth,
  getFirstDayOfMonth,
  formatDate,
} from '../data/moodData'

const API_URL = import.meta.env.VITE_API_BASE_URL

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
    entryId: entry.entryId,
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

function CalendarPopup({ entry, onClose, onDelete, isDeleting }) {
  const date = new Date(entry.date)
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  // Sort emotion scores descending
  const sortedEmotions = Object.entries(entry.emotionScores ?? {})
    .sort((a, b) => b[1] - a[1])

  const displayedSuggestions = Array.isArray(entry.suggestions) ? entry.suggestions : []

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
        className="relative bg-warm-white rounded-card shadow-popup w-full max-w-5xl border border-sage-light/30 max-h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-h-[95vh] overflow-y-auto p-8 md:p-10">
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

        <div className="mb-6 p-3 bg-amber/15 border border-amber/35 rounded-lg">
          <p className="text-xs text-amber-900 leading-relaxed">
            AI-generated scores may contain inaccuracies. Use as a general guide, not a definitive psychological assessment.
          </p>
        </div>

        {/* Main content grid: left detail + right suggestions */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-7 items-start">
          <div className="md:col-span-7 space-y-4">
            {/* Journal Text */}
            <div className="bg-sage-wash/25 rounded-xl p-4 border border-sage-light/30">
              <p className="text-xs font-medium text-stone uppercase tracking-wide mb-2">Journal Entry</p>
              <p className="font-lora italic text-forest/85 text-[15px] leading-relaxed whitespace-pre-wrap max-h-[44vh] overflow-y-auto pr-1">
                "{entry.text}"
              </p>
            </div>

            {/* Emotion score breakdown */}
            {sortedEmotions.length > 0 && (
              <div className="bg-warm-white rounded-xl p-4 border border-sage-light/30">
                <p className="text-xs font-medium text-stone uppercase tracking-wide mb-2">Emotion Breakdown</p>
                <div className="space-y-2">
                  {sortedEmotions.slice(0, 8).map(([emotion, score], index) => (
                    <div key={`${String(emotion || 'emotion')}-${index}`} className="flex items-center gap-2">
                      <span className="text-sm w-5 text-center">{EMOTION_EMOJI[emotion] ?? '💭'}</span>
                      <span className="text-xs text-stone capitalize w-20 truncate">{emotion || 'unknown'}</span>
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
          </div>

          {/* Wellness Suggestions */}
          {displayedSuggestions.length > 0 && (
            <div className="md:col-span-5 bg-sage-wash/50 rounded-xl p-4 md:p-5 border border-sage-light/40">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-stone uppercase tracking-wide">Wellness Suggestions</p>
                <span className="text-[11px] text-stone">{displayedSuggestions.length} tips</span>
              </div>
              <ul className="space-y-2.5 max-h-[58vh] overflow-y-auto pr-1">
                {displayedSuggestions.map((s, idx) => (
                  <li key={idx} className="bg-warm-white/95 border border-sage-light/30 rounded-lg p-3.5 text-sm text-forest leading-relaxed">
                    <span className="mr-1.5 text-sage font-semibold">{idx + 1}.</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-sage-light/30 flex justify-end">
          <button
            onClick={() => onDelete(entry.entryId)}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blush/20 text-dusty-rose border border-dusty-rose/40 hover:bg-blush/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete Entry'}
          </button>
        </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function DeleteConfirmPopup({ onCancel, onConfirm, isDeleting }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        className="relative w-full max-w-md rounded-2xl bg-warm-white p-6 border border-sage-light/40 shadow-popup"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-lora text-lg font-semibold text-ink mb-2">Confirm Delete</h3>
        <p className="text-sm text-olive mb-5">
          This action is permanent, and you will lose all data related to this entry.
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-sage-light/60 text-forest hover:bg-sage-wash/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-dusty-rose text-white hover:bg-dusty-rose/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function Calendar({ entries = [], loading = false, onEntryDeleted }) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [deleteEntryId, setDeleteEntryId] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleDeleteEntry = async () => {
    if (!deleteEntryId || isDeleting) return

    try {
      setIsDeleting(true)
      const response = await fetch(`${API_URL}/api/entries/${deleteEntryId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Delete failed with status ${response.status}`)
      }

      if (onEntryDeleted) onEntryDeleted(deleteEntryId)
      setSelectedEntry(null)
      setDeleteEntryId(null)
    } catch (err) {
      console.error('Failed to delete entry:', err)
      window.alert('Failed to delete entry. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col h-full items-start min-h-0">
      <div className="bg-warm-white border border-sage-light/50 rounded-card shadow-card p-4 md:p-5 flex-1 w-full max-w-165 overflow-y-auto min-h-0">

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

        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="text-center text-[11px] font-medium text-stone py-1.5">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
            <div key={idx} className="aspect-square max-h-14" />
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
                className={`relative aspect-square max-h-14 rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-200 z-0
                  ${hasEntry
                    ? 'bg-sage text-white hover:bg-sage/90 cursor-pointer shadow-sm hover:scale-105 hover:z-50 hover:shadow-md active:scale-95'
                    : isTodayDate
                      ? 'bg-olive text-white'
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
            onDelete={(entryId) => setDeleteEntryId(entryId)}
            isDeleting={isDeleting}
          />
        )}
        {deleteEntryId && (
          <DeleteConfirmPopup
            onCancel={() => setDeleteEntryId(null)}
            onConfirm={handleDeleteEntry}
            isDeleting={isDeleting}
          />
        )}
      </AnimatePresence>
    </div>
  )
}