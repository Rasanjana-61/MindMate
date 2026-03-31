import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, CalendarDaysIcon, LightbulbIcon, BrainIcon } from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const EMOTION_EMOJI = {
  joy:      '😊',
  neutral:  '😐',
  sadness:  '😢',
  anger:    '😠',
  fear:     '😰',
  disgust:  '🤢',
  surprise: '😲',
}

const EMOTION_COLOR = {
  joy:      'bg-amber/20 text-amber border-amber',
  neutral:  'bg-mist-teal/30 text-deep-teal border-deep-teal',
  sadness:  'bg-blush/30 text-dusty-rose border-dusty-rose',
  anger:    'bg-red-100 text-red-600 border-red-400',
  fear:     'bg-purple-100 text-purple-600 border-purple-400',
  disgust:  'bg-lime-100 text-lime-700 border-lime-500',
  surprise: 'bg-sky-100 text-sky-600 border-sky-400',
}

function deriveSentiment(emotion, moodScore) {
  const normalizedEmotion = String(emotion || '').toLowerCase()

  const negativeHints = ['overwhelmed', 'anxious', 'anxiety', 'stress', 'stressed', 'sad', 'anger', 'angry', 'fear', 'afraid', 'upset', 'frustrated', 'lonely', 'guilty', 'burnout', 'tired']
  const positiveHints = ['joy', 'happy', 'calm', 'grateful', 'hopeful', 'excited', 'proud', 'content', 'relieved', 'peaceful', 'motivated']
  const neutralHints = ['neutral', 'mixed', 'meh', 'okay', 'ok', 'stable']

  if (negativeHints.some((hint) => normalizedEmotion.includes(hint))) return 'Negative'
  if (positiveHints.some((hint) => normalizedEmotion.includes(hint))) return 'Positive'
  if (neutralHints.some((hint) => normalizedEmotion.includes(hint))) return 'Neutral'

  if (moodScore >= 3.5) return 'Positive'
  if (moodScore >= 2.5) return 'Neutral'
  return 'Negative'
}

const sentimentColors = {
  Positive: { bg: 'bg-sage-light/40', text: 'text-sage' },
  Neutral:  { bg: 'bg-mist-teal/40',  text: 'text-deep-teal' },
  Negative: { bg: 'bg-blush/40',      text: 'text-dusty-rose' },
}

export function Results({ analysisResult, onNavigate }) {
  // Fallback if navigated here without data
  if (!analysisResult) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <p className="text-olive text-lg">No analysis data yet.</p>
          <button
            onClick={() => onNavigate('journal')}
            className="px-6 py-3 bg-sage text-white rounded-full font-medium hover:bg-sage/90 transition-colors"
          >
            Write a Journal Entry
          </button>
        </div>
      </div>
    )
  }

  const {
    emotion,
    emotionScores = {},
    moodScore,
    stressScore,
    energyScore,
    suggestions = [],
  } = analysisResult
  const entryText = analysisResult.text || analysisResult.journalText || ''

  const sentiment = deriveSentiment(emotion, moodScore)
  const sentColor = sentimentColors[sentiment]

  // Sort emotion scores descending for display
  const sortedEmotions = Object.entries(emotionScores)
    .sort((a, b) => b[1] - a[1])

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Emotional Insight Card */}
      <motion.div
        variants={itemVariants}
        className="bg-warm-white rounded-card shadow-card p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, delay: 0.2 }}
          className="text-7xl mb-4"
        >
          {EMOTION_EMOJI[emotion] ?? '🌿'}
        </motion.div>

        <h2 className="font-lora text-2xl font-semibold text-ink mb-2">
          Emotional Insight
        </h2>

        <p className="text-olive capitalize text-base mb-4">
          Primary emotion detected: <span className="font-semibold text-forest">{emotion}</span>
        </p>

        <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium ${sentColor.bg} ${sentColor.text}`}>
          {sentiment}
        </span>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="bg-amber/15 border border-amber/40 rounded-card p-4"
      >
        <p className="text-sm text-amber-900">
          AI-generated scores may contain inaccuracies. Use as a general guide, not a definitive psychological assessment.
        </p>
      </motion.div>

      {/* Journal Entry Text */}
      {entryText.trim() && (
        <motion.div
          variants={itemVariants}
          className="bg-warm-white rounded-card shadow-card p-6"
        >
          <h3 className="font-lora text-lg font-semibold text-ink mb-3">
            Your Journal Entry
          </h3>
          <p className="text-forest leading-relaxed whitespace-pre-wrap">
            {entryText}
          </p>
        </motion.div>
      )}

      {/* Emotion Breakdown */}
      {sortedEmotions.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-warm-white rounded-card shadow-card p-6"
        >
          <h3 className="font-lora text-lg font-semibold text-ink mb-5 flex items-center gap-2">
            <BrainIcon className="w-5 h-5 text-sage" />
            Emotion Breakdown
          </h3>

          <div className="space-y-3">
            {sortedEmotions.map(([em, score], idx) => (
              <div key={`${String(em || 'emotion')}-${idx}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-olive capitalize flex items-center gap-1.5">
                    <span>{EMOTION_EMOJI[em] ?? '💭'}</span> {em || 'unknown'}
                  </span>
                  <span className="text-xs text-stone">{(score * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-sage-wash rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score * 100}%` }}
                    transition={{ duration: 0.7, delay: 0.1 + idx * 0.07, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      em === emotion ? 'bg-sage' : 'bg-sage-light/60'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Scores Section */}
      <motion.div
        variants={itemVariants}
        className="bg-warm-white rounded-card shadow-card p-6"
      >
        <h3 className="font-lora text-lg font-semibold text-ink mb-5">
          Your Scores
        </h3>

        <div className="space-y-5">
          {/* Mood */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-olive uppercase tracking-wide">Mood</span>
              <span className="text-sm font-semibold text-forest">{moodScore}/5</span>
            </div>
            <div className="h-3 bg-sage-wash rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(moodScore / 5) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                className="h-full bg-sage rounded-full"
              />
            </div>
          </div>

          {/* Stress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-olive uppercase tracking-wide">Stress</span>
              <span className="text-sm font-semibold text-forest">{stressScore}/5</span>
            </div>
            <div className="h-3 bg-blush/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(stressScore / 5) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                className="h-full bg-blush rounded-full"
              />
            </div>
          </div>

          {/* Energy */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-olive uppercase tracking-wide">Energy</span>
              <span className="text-sm font-semibold text-forest">{energyScore}/5</span>
            </div>
            <div className="h-3 bg-amber/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(energyScore / 5) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
                className="h-full bg-amber rounded-full"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Wellness Suggestions */}
      {suggestions.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-sage-wash/30 rounded-card p-6"
        >
          <h3 className="font-lora text-lg font-semibold text-ink mb-4 flex items-center gap-2">
            <LightbulbIcon className="w-5 h-5 text-amber" />
            Wellness Suggestions
          </h3>

          <div className="space-y-3">
            {suggestions.map((suggestion, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + idx * 0.1 }}
                className="bg-warm-white rounded-xl p-4 border-l-4 border-sage"
              >
                <p className="text-forest">{suggestion}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row gap-3 justify-center"
      >
        <motion.button
          onClick={() => onNavigate('dashboard')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-warm-white border border-sage-light rounded-full text-olive font-medium hover:bg-sage-wash transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Dashboard
        </motion.button>

        <motion.button
          onClick={() => onNavigate('history')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-sage text-white rounded-full font-medium hover:bg-sage/90 transition-colors"
        >
          <CalendarDaysIcon className="w-4 h-4" />
          View History
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
