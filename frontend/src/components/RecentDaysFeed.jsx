import React from 'react'
import { motion } from 'framer-motion'
import { PlusIcon } from 'lucide-react'
import { getMoodEmoji } from '../data/moodData'

function DayCard({ date, entry, isLatest, index }) {
  const dayName = date
    .toLocaleDateString('en-US', { weekday: 'short' })
    .toUpperCase()

  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  if (!entry) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.04 }}
        className="bg-warm-white border border-dashed border-sage-light/60 rounded-xl px-4 py-2.5 flex items-center gap-3"
      >
        <div className="text-center w-10 shrink-0">
          <p className="text-[10px] font-bold text-stone uppercase tracking-wide">{dayName}</p>
          <p className="text-xs text-stone/60">{dateStr}</p>
        </div>
        <span className="text-lg opacity-30">📝</span>
        <p className="text-stone/50 text-xs flex-1">No entry logged</p>
        <button className="inline-flex items-center gap-1 text-sage text-xs font-medium hover:text-sage/80 transition-colors shrink-0">
          <PlusIcon className="w-3 h-3" />
          Add
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ x: 2 }}
      className={`
        rounded-xl px-4 py-2.5 border-l-4 border-sage flex items-center gap-3 transition-shadow duration-200
        ${isLatest ? 'bg-sage-wash/50 shadow-elevated' : 'bg-warm-white shadow-card hover:shadow-card-hover'}
      `}
    >
      <div className="text-center w-10 shrink-0">
        <p className="text-[10px] font-bold text-stone uppercase tracking-wide">{dayName}</p>
        <p className="text-xs text-stone/60">{dateStr}</p>
      </div>
      <span className="text-xl shrink-0">{getMoodEmoji(entry.moodScore)}</span>
      {entry.text && (
        <p className="font-lora text-forest/90 text-sm font-medium flex-1 truncate">
          "{entry.text}"
        </p>
      )}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-sage-wash text-olive">
          M {entry.moodScore}
        </span>
        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blush/60 text-dusty-rose">
          S {entry.stressScore}
        </span>
        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber/50 text-olive">
          E {entry.energyScore}
        </span>
      </div>
    </motion.div>
  )
}

export function RecentDaysFeed({ entries = [], loading = false }) {
  const today = new Date()
  const recentDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    return date
  })

  const entryByDate = {}
  entries.forEach(entry => {
    const d = new Date(entry.entryDate)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!entryByDate[key] || new Date(entry.entryDate) > new Date(entryByDate[key].entryDate)) {
      entryByDate[key] = entry
    }
  })

  return (
    <div className="flex flex-col h-full">
      <h2 className="font-lora text-xl font-semibold text-ink mb-4 flex items-center gap-2">
        <span>🌿</span>
        Recent 7 Days
      </h2>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-stone/50 text-sm">
          Loading entries…
        </div>
      ) : (
        <div className="space-y-2">
          {recentDays.map((date, idx) => {
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
            return (
              <DayCard
                key={key}
                date={date}
                entry={entryByDate[key] ?? null}
                isLatest={idx === 0}
                index={idx}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}