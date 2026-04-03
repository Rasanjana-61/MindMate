import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts'
import { PenLineIcon, ChevronDownIcon } from 'lucide-react'
import { getMoodEmoji } from '../data/moodData'

const API_URL = import.meta.env.VITE_API_BASE_URL
const USER_ID = 'testUser123'

const EMOTION_EMOJI = {
  joy: '😊', anger: '😠', disgust: '🤢', fear: '😨',
  sadness: '😢', surprise: '😲', neutral: '😐',
}
const EMOTION_KEYS = ["joy", "anger", "disgust", "fear", "sadness", "surprise", "neutral"]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatTodayDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function Dashboard({ onNavigate }) {
  const [dashboardData, setDashboardData] = useState(null)
  const [timeRange, setTimeRange] = useState('7D')
  const [isEmotionsExpanded, setIsEmotionsExpanded] = useState(false)
  const [activeChart, setActiveChart] = useState('trend')

  useEffect(() => {
    fetch(`${API_URL}/api/dashboard/${USER_ID}?timeRange=${timeRange}`)
      .then((r) => r.json())
      .then((data) => {
        setDashboardData(data)
      })
      .catch((err) => console.error("Failed to fetch dashboard stats:", err))
  }, [timeRange])

  const stats = dashboardData?.stats || { avgMood: 0, avgStress: 0, avgEnergy: 0 }
  const emotionStats = dashboardData?.emotionStats || {}
  const chartData = dashboardData?.chartData || []
  const streakCount = dashboardData?.streakCount || 0

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Welcome Header */}
      <motion.div variants={itemVariants} className="bg-warm-white rounded-card shadow-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-lora text-2xl md:text-3xl font-semibold text-ink mb-1">
              {getGreeting()}, Asitha 🌱
            </h1>
            <p className="text-olive">{formatTodayDate()}</p>
          </div>
          <motion.button
            onClick={() => onNavigate('journal')}
            whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(127, 175, 138, 0.25)' }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 bg-sage text-white px-6 py-3 rounded-full font-medium shadow-card hover:bg-sage/90 transition-colors"
          >
            <PenLineIcon className="w-5 h-5" />
            Write Today's Entry
          </motion.button>
        </div>
      </motion.div>

      {/* Encouragement */}
      <motion.div variants={itemVariants} className="bg-sage-light/40 rounded-card p-5 flex items-start gap-4">
        <span className="text-2xl shrink-0">🌿</span>
        <p className="font-lora italic text-forest leading-relaxed">
          {streakCount > 0
            ? `You've logged your mood ${streakCount} days in a row - wonderful consistency! Keep nurturing your growth.`
            : 'Start your wellness journey today by writing your first entry. Every step counts!'}
        </p>
      </motion.div>

      {/* Overview Section */}
      <motion.div variants={itemVariants} className="bg-warm-white rounded-card shadow-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <h2 className="font-lora text-xl font-semibold text-ink">
            Wellness Overview
          </h2>
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none bg-sage-wash/50 text-forest font-medium rounded-lg px-4 py-2 pr-10 border border-sage-light/50 focus:outline-none focus:ring-2 focus:ring-sage/50 cursor-pointer transition-colors hover:bg-sage-wash"
            >
              <option value="7D">Last 7 Days</option>
              <option value="30D">Last 30 Days</option>
              <option value="1Y">Last Year</option>
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest pointer-events-none" />
          </div>
        </div>

        {/* Dynamic Nav Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-sage-wash/30 rounded-xl p-4 border-l-4 border-sage flex flex-wrap justify-between items-center gap-4 transition-all hover:bg-sage-wash/50 hover:shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getMoodEmoji(Math.round(stats.avgMood))}</span>
              <div>
                <p className="font-lora text-3xl font-semibold text-ink">{stats.avgMood || '—'}</p>
                <p className="text-sm text-stone uppercase tracking-wide">Avg Mood</p>
              </div>
            </div>
            {chartData.some(d => d.mood > 0) && (
              <div className="w-16 h-10 md:w-20 md:h-12 opacity-80">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <LineChart data={chartData}>
                    <Line type="monotone" dataKey="mood" stroke="#7FAF8A" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-sage-wash/30 rounded-xl p-4 border-l-4 border-blush flex flex-wrap justify-between items-center gap-4 transition-all hover:bg-sage-wash/50 hover:shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-3xl">😰</span>
              <div>
                <p className="font-lora text-3xl font-semibold text-ink">{stats.avgStress || '—'}</p>
                <p className="text-sm text-stone uppercase tracking-wide">Avg Stress</p>
              </div>
            </div>
            {chartData.some(d => d.stress > 0) && (
              <div className="w-16 h-10 md:w-20 md:h-12 opacity-80">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <LineChart data={chartData}>
                    <Line type="monotone" dataKey="stress" stroke="#E6B8B5" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-sage-wash/30 rounded-xl p-4 border-l-4 border-amber flex flex-wrap justify-between items-center gap-4 transition-all hover:bg-sage-wash/50 hover:shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚡</span>
              <div>
                <p className="font-lora text-3xl font-semibold text-ink">{stats.avgEnergy || '—'}</p>
                <p className="text-sm text-stone uppercase tracking-wide">Avg Energy</p>
              </div>
            </div>
            {chartData.some(d => d.energy > 0) && (
              <div className="w-16 h-10 md:w-20 md:h-12 opacity-80">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <LineChart data={chartData}>
                    <Line type="monotone" dataKey="energy" stroke="#E7C46A" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Emotion Breakdown Toggle Section */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setIsEmotionsExpanded(prev => !prev)}
            className="flex items-center gap-2 text-sm font-medium text-forest bg-sage-wash/50 hover:bg-sage-wash px-4 py-2 rounded-full transition-colors"
          >
            {isEmotionsExpanded ? 'Hide Emotion Breakdown' : 'Show Emotion Breakdown'}
            <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${isEmotionsExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <AnimatePresence>
          {isEmotionsExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-10 pt-2">
                {EMOTION_KEYS.map(emotion => {
                  const score = emotionStats[emotion] || 0
                  const percentage = (score * 100).toFixed(1)
                  return (
                    <div key={emotion} className="bg-sage-wash/20 rounded-xl p-4 border border-sage-light/30 flex flex-col items-center justify-center gap-2 transition-all hover:bg-sage-wash/40 hover:shadow-sm">
                      <span className="text-3xl">{EMOTION_EMOJI[emotion]}</span>
                      <span className="text-xs text-stone uppercase tracking-wide">{emotion}</span>
                      <span className="font-lora text-lg font-semibold text-ink">{percentage}%</span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chart Switcher */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex p-1 rounded-full bg-sage-wash/50 border border-sage-light/40">
            <button
              onClick={() => setActiveChart('trend')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeChart === 'trend' ? 'bg-warm-white text-forest shadow-sm' : 'text-olive hover:text-forest'
              }`}
            >
              Trend Lines
            </button>
            <button
              onClick={() => setActiveChart('bars')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeChart === 'bars' ? 'bg-warm-white text-forest shadow-sm' : 'text-olive hover:text-forest'
              }`}
            >
              Frequency Bars
            </button>
          </div>
        </div>

        {/* Full-Width Active Chart */}
        <AnimatePresence mode="wait">
          {activeChart === 'trend' ? (
            <motion.div
              key="trend-chart"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-sage-wash/20 rounded-xl border border-sage-light/30 p-4"
            >
              <h3 className="text-sm text-stone uppercase tracking-wide mb-3 font-medium">Trend Lines</h3>
              <div className="h-72 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#CFE3D2" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#5F705F', fontSize: 11 }} />
                    <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: '#5F705F', fontSize: 11 }} ticks={[1, 2, 3, 4, 5]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FBF8F3', border: '1px solid #CFE3D2', borderRadius: '12px', boxShadow: '0 4px 12px rgba(47, 62, 47, 0.1)' }}
                      labelStyle={{ color: '#2F3E2F', fontWeight: 600 }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '15px' }} formatter={(value) => <span className="text-olive text-sm capitalize">{value}</span>} />
                    <Line type="monotone" dataKey="mood" name="Mood" stroke="#7FAF8A" strokeWidth={3} dot={{ strokeWidth: 2, r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="stress" name="Stress" stroke="#E6B8B5" strokeWidth={3} dot={{ strokeWidth: 2, r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="energy" name="Energy" stroke="#E7C46A" strokeWidth={3} dot={{ strokeWidth: 2, r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="bars-chart"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-sage-wash/20 rounded-xl border border-sage-light/30 p-4"
            >
              <h3 className="text-sm text-stone uppercase tracking-wide mb-3 font-medium">Frequency Bars</h3>
              <div className="h-72 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#CFE3D2" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#5F705F', fontSize: 11 }} />
                    <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: '#5F705F', fontSize: 11 }} ticks={[1, 2, 3, 4, 5]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FBF8F3', border: '1px solid #CFE3D2', borderRadius: '12px', boxShadow: '0 4px 12px rgba(47, 62, 47, 0.1)' }}
                      labelStyle={{ color: '#2F3E2F', fontWeight: 600 }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '15px' }} formatter={(value) => <span className="text-olive text-sm capitalize">{value}</span>} />
                    <Bar dataKey="mood" name="Mood" fill="#7FAF8A" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="stress" name="Stress" fill="#E6B8B5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="energy" name="Energy" fill="#E7C46A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}