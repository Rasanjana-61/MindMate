import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Clock3, ChevronDown, ChevronUp, NotebookPen, PencilLine, Sprout, Lightbulb, TriangleAlert, Smile, Frown, Zap, FilePenLine } from 'lucide-react'
import { getMoodEmoji, getMoodMeta } from '../data/moodData'
import { getToken } from '../lib/auth'

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"

function getAuthHeaders(extraHeaders = {}) {
  const token = getToken()
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  }
}

function getTodayInputValue() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateInputValue(value) {
  if (!value) return null

  const parsed = new Date(`${value}T12:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatReadableDate(value) {
  const parsed = parseDateInputValue(value)

  if (!parsed) return ''

  return parsed.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function isSameCalendarDay(left, right) {
  if (!left || !right) return false
  return left.toDateString() === right.toDateString()
}

function validateJournalContent(text) {
  const trimmed = text.trim()

  // Soft Warnings
  const lettersOnly = trimmed.replace(/[^a-zA-Z]/g, '')
  const vowelsCount = (lettersOnly.match(/[aeiouyAEIOUY]/g) || []).length
  const vowelRatio = lettersOnly.length > 0 ? vowelsCount / lettersOnly.length : 0

  if (!trimmed) {
    return { status: 'hard', message: 'Entry cannot be empty.' }
  }

  const words = trimmed.toLowerCase().split(/\s+/)

  if (
    trimmed.length < 10 ||
    !/[a-zA-Z]/.test(trimmed) ||
    /^(.)\1+$/.test(trimmed.replace(/\s/g, '')) ||
    (words.length >= 4 && words.every(w => w === words[0]))
  ) {
    return {
      status: 'hard',
      message: 'This entry looks unclear. Try writing one or two meaningful sentences.'
    }
  }

  return { status: 'valid', message: '' }
}

const containerVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
}

function EntryCard({ entry, index, defaultExpanded = false, hideToggle = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const moodMeta = getMoodMeta(entry.moodScore)

  const emotionScores =
    entry.emotionScores && typeof entry.emotionScores === 'object'
      ? Object.entries(entry.emotionScores).sort((a, b) => b[1] - a[1])
      : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-cream/60 rounded-xl border border-sage-light/20 overflow-hidden"
    >
      {/* Always-visible header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {(() => {
              const MoodIcon = getMoodEmoji(entry.moodScore)
              return <MoodIcon className={`w-5 h-5 ${moodMeta.className}`} />
            })()}
            {entry.emotion && (
              <span className="text-xs bg-sage-wash px-2 py-0.5 rounded-full text-sage font-medium capitalize">
                {entry.emotion}
              </span>
            )}
          </div>
          <span className="text-xs text-stone flex items-center gap-1">
            <Clock3 className="w-3 h-3" />
            {new Date(entry.entryDate).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        <p className={`text-sm text-forest leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
          {entry.text}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-olive">
          <span className="inline-flex items-center gap-1"><Smile className="w-3.5 h-3.5" /> Mood: {entry.moodScore}/5</span>
          <span className="inline-flex items-center gap-1"><Frown className="w-3.5 h-3.5" /> Stress: {entry.stressScore}/5</span>
          <span className="inline-flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Energy: {entry.energyScore}/5</span>
        </div>

        {!hideToggle && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 w-full flex items-center justify-center gap-1 text-xs text-sage font-medium py-1.5 rounded-lg bg-sage-wash/60 hover:bg-sage-wash transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" /> Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" /> View full analysis
              </>
            )}
          </button>
        )}
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-sage-light/30 pt-3">


              {/* Emotion Scores */}
              {emotionScores.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-olive uppercase tracking-wide mb-2">
                    Emotion Breakdown
                  </p>
                  <div className="space-y-1.5">
                    {emotionScores.map(([emotion, score], idx) => {
                      const percentStr = (score * 100).toFixed(1)
                      const isZero = parseFloat(percentStr) === 0

                      return (
                        <div key={`${String(emotion || 'emotion')}-${idx}`} className={`flex items-center gap-2 ${isZero ? 'opacity-40 grayscale' : 'font-medium'}`}>
                          <span className={`text-xs capitalize w-20 shrink-0 ${isZero ? 'text-forest' : 'text-forest font-bold'}`}>{emotion || 'unknown'}</span>
                          <div className="flex-1 bg-sage-light/20 rounded-full h-1.5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentStr}%` }}
                              transition={{ duration: 0.4, ease: 'easeOut' }}
                              className={`h-full rounded-full ${isZero ? 'bg-sage-light' : 'bg-sage shadow-sm'}`}
                            />
                          </div>
                          <span className={`text-xs w-10 text-right shrink-0 ${isZero ? 'text-stone' : 'text-ink font-bold'}`}>
                            {percentStr}%
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {entry.suggestions && entry.suggestions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-olive uppercase tracking-wide mb-2">
                    Suggestions
                  </p>
                  <ul className="space-y-1.5">
                    {entry.suggestions.map((s, si) => (
                      <li key={si} className="flex items-start gap-2 text-xs text-forest leading-relaxed">
                        <span className="text-sage mt-0.5 shrink-0">✦</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function TodayEntriesSidebar({ entries, loading, onEditEntry }) {
  const latestEntry = entries.find((entry) =>
    isSameCalendarDay(new Date(entry.entryDate), new Date())
  ) ?? null

  return (
    <div className="bg-warm-white rounded-card shadow-card p-6 flex flex-col h-full min-h-0 overflow-hidden">
      <h2 className="font-lora text-xl font-semibold text-ink mb-1 flex items-center gap-2">
        <NotebookPen className="w-5 h-5 text-sage" />
        Today's Entries
      </h2>
      <p className="text-xs text-stone mb-4">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>

      <div className="mb-4 p-3 bg-amber/15 border border-amber/35 rounded-lg">
        <p className="text-xs text-amber-900 leading-relaxed">
          AI-generated scores may contain inaccuracies. Use as a general guide, not a definitive psychological assessment.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                className="w-2 h-2 bg-sage rounded-full"
              />
            ))}
          </div>
        </div>
      ) : !latestEntry ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center py-8">
          <Sprout className="w-12 h-12 mb-3 text-sage" />
          <p className="text-olive text-sm font-medium">No entries yet today</p>
          <p className="text-stone text-xs mt-1">
            Write your first entry and it will appear here.
          </p>
        </div>
      ) : (
        <div className="today-entries-scroll flex-1 min-h-0 overflow-y-auto w-full pb-4 pr-1">
          <EntryCard entry={latestEntry} index={0} defaultExpanded={true} hideToggle={true} />
          
          <div className="flex justify-end mt-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onEditEntry(latestEntry)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sage-wash/40 border border-sage/30 text-sage hover:bg-sage-wash rounded-lg text-xs font-medium transition-colors shadow-sm"
            >
              <PencilLine className="w-3.5 h-3.5" /> Modify Entry
            </motion.button>
          </div>
        </div>
      )}
    </div>
  )
}

export function JournalEntry({ onAnalysisComplete, initialEntryDate }) {
  const [journalText, setJournalText] = useState('')
  const [originalText, setOriginalText] = useState('')
  const [editingEntryId, setEditingEntryId] = useState(null)
  const [selectedDate, setSelectedDate] = useState(() => initialEntryDate || getTodayInputValue())
  const [historyEntries, setHistoryEntries] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState(null)
  const [warning, setWarning] = useState(null)
  const [forceSubmit, setForceSubmit] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const todayInputValue = getTodayInputValue()
  const selectedDateLabel = formatReadableDate(selectedDate)
  const selectedDateObject = parseDateInputValue(selectedDate)
  const selectedDateEntry = selectedDateObject
    ? historyEntries.find((entry) => isSameCalendarDay(new Date(entry.entryDate), selectedDateObject)) ?? null
    : null
  const selectedDateLocked = !!selectedDateEntry && !editingEntryId
  const isFutureSelectedDate = selectedDate > todayInputValue

  useEffect(() => {
    const fetchHistory = async () => {
      setHistoryLoading(true)

      try {
        const response = await fetch(`${API_URL}/history`, {
          headers: getAuthHeaders(),
        })
        if (!response.ok) {
          throw new Error(`Failed to load history (${response.status})`)
        }

        const data = await response.json()
        setHistoryEntries(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Failed to load journal history:', err)
        setHistoryEntries([])
      } finally {
        setHistoryLoading(false)
      }
    }

    fetchHistory()
  }, [refreshKey])

  useEffect(() => {
    setSelectedDate(initialEntryDate || getTodayInputValue())
  }, [initialEntryDate])

  const handleEditEntry = (entry) => {
    setJournalText(entry.text)
    setOriginalText(entry.text)
    setEditingEntryId(entry.entryId)
    setSelectedDate(getTodayInputValue())
    setError(null)
    setWarning(null)
    setForceSubmit(false)
  }

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value)
    if (error) setError(null)
    if (warning) {
      setWarning(null)
      setForceSubmit(false)
    }
  }

  const handleTextChange = (e) => {
    setJournalText(e.target.value.slice(0, 2000))
    if (error) setError(null)
    if (warning) {
      setWarning(null)
      setForceSubmit(false)
    }
  }

  const handleAnalyze = async () => {
    if (!journalText.trim()) return

    if (isFutureSelectedDate) {
      setError('You can only write entries for today or earlier dates.')
      return
    }

    const validation = validateJournalContent(journalText)

    if (validation.status === 'hard') {
      setError(validation.message)
      return
    }

    if (validation.status === 'soft' && !forceSubmit) {
      setWarning(validation.message)
      setForceSubmit(true)
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setWarning(null)
    setForceSubmit(false)

    try {
      const submittedText = journalText
      let response;
      if (editingEntryId) {
        response = await fetch(`${API_URL}/entries/${editingEntryId}`, {
          method: 'PUT',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ text: journalText }),
        })
      } else {
        response = await fetch(`${API_URL}/entries`, {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ text: journalText, entryDate: selectedDate }),
        })
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.message || `Server error ${response.status}`)
      }

      const data = await response.json()
      setJournalText('')
      setEditingEntryId(null)
      setSelectedDate(getTodayInputValue())
      setRefreshKey((k) => k + 1)
      onAnalysisComplete({ ...data, text: submittedText, entryDate: selectedDate })
    } catch (err) {
      console.error('Error submitting entry:', err)
      setError(err.message || 'Failed to analyze. Please try again.')
      setIsAnalyzing(false)
    }
  }

  const characterCount = journalText.length
  const maxCharacters = 2000

  return (
    <AnimatePresence mode="wait">
      {isAnalyzing ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex items-center justify-center min-h-[60vh]"
        >
          <div className="bg-sage-wash/50 rounded-card p-12 text-center max-w-md">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                ease: 'easeInOut',
              }}
              className="mb-6"
            >
              <Sprout className="w-16 h-16 text-sage mx-auto" />
            </motion.div>

            <p className="font-lora italic text-xl text-forest mb-4">
              Analyzing your emotions...
            </p>

            <div className="flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -8, 0],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="w-2 h-2 bg-sage rounded-full"
                />
              ))}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="form"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
        >
          {/* Left Column — Write Entry */}
          <div className="space-y-5">
            <motion.div variants={itemVariants}>
              <h1 className="font-lora text-2xl font-semibold text-ink mb-1 flex items-center gap-2">
                <FilePenLine className="w-6 h-6 text-sage" />
                How was your day?
              </h1>
              <p className="text-olive text-sm">
                Write freely about your feelings, experiences, and thoughts...
              </p>
            </motion.div>

            {/* Journal Card */}
            <motion.div
              variants={itemVariants}
              className="bg-warm-white rounded-card shadow-card p-6"
            >
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone mb-1">
                    Entry Date
                  </p>
                  <p className="font-lora text-lg text-ink">
                    {selectedDateLabel || 'Select a date'}
                  </p>
                </div>

                <div className="flex flex-col items-start gap-1 md:items-end">
                  <label htmlFor="journal-entry-date" className="text-xs font-medium text-olive">
                    Write for a different day
                  </label>
                  <input
                    id="journal-entry-date"
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    max={todayInputValue}
                    disabled={!!editingEntryId}
                    className="rounded-lg border border-sage-light/40 bg-cream/60 px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-sage/30 disabled:cursor-not-allowed disabled:opacity-70"
                  />
                </div>
              </div>

              {selectedDateLocked && (
                <div className="mb-4 rounded-xl border border-sage-light/30 bg-sage-wash/40 px-4 py-3 text-sm text-olive">
                  You already have an entry for {selectedDateLabel}. Open it from History to review or edit.
                </div>
              )}

              <div className="relative">
                <textarea
                  value={journalText}
                  onChange={handleTextChange}
                  disabled={selectedDateLocked}
                  placeholder={selectedDateLocked ? `You already have an entry for ${selectedDateLabel}.` : `On ${selectedDateLabel || 'this day'} I felt... I noticed... Something that made me smile was... I'm grateful for...`}
                  className={`w-full min-h-64 p-5 bg-cream/50 border-2 border-transparent focus:border-sage-light rounded-xl resize-none text-forest placeholder:text-stone/60 focus:outline-none transition-colors font-sans leading-relaxed ${selectedDateLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
                <div className="absolute bottom-3 right-3 text-xs text-stone">
                  {characterCount}/{maxCharacters}
                </div>
              </div>

              {/* Tips */}
              <div className="mt-4 p-4 bg-sage-wash/30 rounded-xl">
                <p className="text-sm text-olive">
                  <span className="font-medium inline-flex items-center gap-1"><Lightbulb className="w-4 h-4" /> Tip:</span> Be honest and
                  specific. Describe what happened, how you felt, and what you
                  noticed about yourself today.
                </p>
              </div>
            </motion.div>

            {/* Warning / Error messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-blush/30 border border-dusty-rose/40 rounded-xl text-dusty-rose text-sm text-center"
                >
                  <span className="inline-flex items-center gap-1"><TriangleAlert className="w-4 h-4" /> {error}</span>
                </motion.div>
              )}
              {warning && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-amber/20 border-l-4 border-amber rounded-xl text-amber-900 text-sm"
                >
                  <span className="inline-flex items-center gap-1"><Lightbulb className="w-4 h-4" /> {warning}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.div variants={itemVariants} className="flex justify-center">
              {(() => {
                const isUnchanged = editingEntryId && journalText.trim() === originalText.trim();
                const isDisabled = !journalText.trim() || isUnchanged || selectedDateLocked || isFutureSelectedDate;

                return (
                  <motion.button
                    onClick={handleAnalyze}
                    disabled={isDisabled}
                    whileHover={
                      !isDisabled
                        ? { scale: 1.02, boxShadow: '0 8px 24px rgba(127, 175, 138, 0.25)' }
                        : {}
                    }
                    whileTap={!isDisabled ? { scale: 0.98 } : {}}
                    className={`
                      flex items-center gap-3 px-8 py-4 rounded-full font-medium text-lg shadow-card transition-all
                      ${isDisabled
                        ? 'bg-stone-300 text-stone/80 cursor-not-allowed opacity-70'
                        : forceSubmit ? 'bg-amber text-white hover:bg-amber/90 cursor-pointer' : 'bg-sage text-white hover:bg-sage/90 cursor-pointer'
                      }
                    `}
                  >
                    <Send className="w-5 h-5" />
                    {forceSubmit ? 'Submit Anyway' : (editingEntryId ? 'Update Entry' : 'Analyze My Entry')}
                  </motion.button>
                );
              })()}
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-center text-stone text-xs"
            >
              Your entries are private and help you understand your emotional
              patterns
            </motion.p>
          </div>

          {/* Right Column — Today's Entries */}
          <motion.div variants={itemVariants} className="h-full min-h-0 md:h-[calc(100vh-6rem)]">
            <TodayEntriesSidebar 
              entries={historyEntries}
              loading={historyLoading}
              onEditEntry={handleEditEntry} 
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}