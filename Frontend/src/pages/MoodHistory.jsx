import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar } from '../components/Calender'
import { RecentDaysFeed } from '../components/RecentDaysFeed'
import { ChartColumn } from 'lucide-react'
import { getToken } from '../lib/auth'

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"

function getAuthHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function MoodHistory({ onNavigate }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  const handleEntryDeleted = (entryId) => {
    setEntries((prev) => prev.filter((entry) => entry.entryId !== entryId))
  }

  useEffect(() => {
    fetch(`${API_URL}/history`, {
      headers: getAuthHeaders(),
    })
      .then(r => r.json())
      .then(data => { setEntries(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-[calc(100vh-7.5rem)] lg:h-[calc(100vh-6.5rem)] flex flex-col overflow-hidden"
    >
      {/* Page Title */}
      <motion.div variants={itemVariants}>
        <h1 className="font-lora text-2xl md:text-3xl font-semibold text-ink flex items-center gap-3">
          <ChartColumn className="w-7 h-7 text-sage" />
          Mood History
        </h1>
        <p className="text-olive mt-1">
          Track your emotional journey over time
        </p>
      </motion.div>

      {/* Two Column Layout */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0"
      >
        {/* Left Column - Calendar */}
        <div className="h-full min-h-0">
          <Calendar
            entries={entries}
            loading={loading}
            onEntryDeleted={handleEntryDeleted}
            onDateSelect={(date) => onNavigate?.('journal', { entryDate: date })}
          />
        </div>

        {/* Right Column - Recent Days Feed */}
        <div className="h-full min-h-0">
          <RecentDaysFeed
            entries={entries}
            loading={loading}
            onAddEntry={(entryDate) => onNavigate?.('journal', { entryDate })}
          />
        </div>
      </motion.div>
    </motion.div>
  )
}