import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar } from '../components/Calender'
import { RecentDaysFeed } from '../components/RecentDaysFeed'

const API_URL = import.meta.env.VITE_API_BASE_URL

const USER_ID = 'testUser123'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function MoodHistory() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  const handleEntryDeleted = (entryId) => {
    setEntries((prev) => prev.filter((entry) => entry.entryId !== entryId))
  }

  useEffect(() => {
    fetch(`${API_URL}/api/history/${USER_ID}`)
      .then(r => r.json())
      .then(data => { setEntries(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Page Title */}
      <motion.div variants={itemVariants}>
        <h1 className="font-lora text-2xl md:text-3xl font-semibold text-ink flex items-center gap-3">
          <span>📈</span>
          Mood History
        </h1>
        <p className="text-olive mt-1">
          Track your emotional journey over time
        </p>
      </motion.div>

      {/* Two Column Layout */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Left Column - Calendar */}
        <div>
          <Calendar entries={entries} loading={loading} onEntryDeleted={handleEntryDeleted} />
        </div>

        {/* Right Column - Recent Days Feed */}
        <div>
          <RecentDaysFeed entries={entries} loading={loading} />
        </div>
      </motion.div>
    </motion.div>
  )
}