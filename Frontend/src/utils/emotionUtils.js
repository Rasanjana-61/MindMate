import {
  Biohazard,
  Brain,
  CloudFog,
  Droplets,
  Flame,
  Leaf,
  Meh,
  PartyPopper,
  ShieldQuestion,
  Sparkles,
  Zap,
  CircleHelp,
} from 'lucide-react'

const EMOTION_CATEGORIES = [
  {
    key: 'anxiety',
    label: 'Anxiety / Overwhelm',
    Icon: CloudFog,
    className: 'bg-sky-100 text-sky-700 border-sky-300',
    fillClass: 'bg-sky-400',
    hints: ['anxiety', 'anxious', 'overwhelm', 'overwhelmed', 'worry', 'worried', 'nervous', 'panic', 'tense', 'stress', 'stressed', 'pressure'],
  },
  {
    key: 'anger',
    label: 'Anger / Frustration',
    Icon: Flame,
    className: 'bg-rose-100 text-rose-700 border-rose-300',
    fillClass: 'bg-rose-400',
    hints: ['anger', 'angry', 'frustration', 'frustrated', 'irritated', 'annoyed', 'upset', 'resentful', 'rage'],
  },
  {
    key: 'sadness',
    label: 'Sadness / Loss',
    Icon: Droplets,
    className: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    fillClass: 'bg-indigo-400',
    hints: ['sad', 'sadness', 'down', 'hopeless', 'hurt', 'lonely', 'loneliness', 'grief', 'mourning', 'disappointed'],
  },
  {
    key: 'calm',
    label: 'Calm / Relief',
    Icon: Leaf,
    className: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    fillClass: 'bg-emerald-400',
    hints: ['calm', 'peace', 'peaceful', 'relief', 'relieved', 'grounded', 'stable', 'content', 'ease'],
  },
  {
    key: 'joy',
    label: 'Joy / Gratitude',
    Icon: Sparkles,
    className: 'bg-amber-100 text-amber-700 border-amber-300',
    fillClass: 'bg-amber-400',
    hints: ['joy', 'happy', 'happiness', 'grateful', 'gratitude', 'excited', 'excitement', 'proud', 'love', 'loving', 'hopeful'],
  },
  {
    key: 'fear',
    label: 'Fear / Uncertainty',
    Icon: ShieldQuestion,
    className: 'bg-violet-100 text-violet-700 border-violet-300',
    fillClass: 'bg-violet-400',
    hints: ['fear', 'afraid', 'scared', 'frightened', 'uncertain', 'uncertainty', 'uneasy', 'apprehensive'],
  },
  {
    key: 'surprise',
    label: 'Surprise / Curiosity',
    Icon: PartyPopper,
    className: 'bg-cyan-100 text-cyan-700 border-cyan-300',
    fillClass: 'bg-cyan-400',
    hints: ['surprise', 'surprised', 'astonished', 'amazed', 'curious', 'curiosity', 'intrigued', 'shocked'],
  },
  {
    key: 'disgust',
    label: 'Disgust / Aversion',
    Icon: Biohazard,
    className: 'bg-lime-100 text-lime-700 border-lime-300',
    fillClass: 'bg-lime-400',
    hints: ['disgust', 'disgusted', 'repulsed', 'revolted', 'gross', 'grossed'],
  },
  {
    key: 'neutral',
    label: 'Neutral / Mixed',
    Icon: Meh,
    className: 'bg-stone-100 text-stone-700 border-stone-300',
    fillClass: 'bg-stone-400',
    hints: ['neutral', 'mixed', 'meh', 'okay', 'ok', 'steady', 'flat'],
  },
]

function normalizeEmotionText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

export function formatEmotionLabel(emotion) {
  return String(emotion || 'unknown')
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function getEmotionCategoryMeta(emotion) {
  const normalizedEmotion = normalizeEmotionText(emotion)

  for (const category of EMOTION_CATEGORIES) {
    if (category.hints.some((hint) => normalizedEmotion.includes(hint))) {
      return category
    }
  }

  if (!normalizedEmotion) {
    return EMOTION_CATEGORIES.find((category) => category.key === 'neutral')
  }

  return {
    key: normalizedEmotion,
    label: formatEmotionLabel(emotion),
    Icon: CircleHelp,
    className: 'bg-slate-100 text-slate-700 border-slate-300',
    fillClass: 'bg-slate-400',
    hints: [],
  }
}

export function getEmotionEmoji(emotion) {
  return getEmotionCategoryMeta(emotion).Icon
}

export function groupEmotionScores(emotionScores) {
  const sourceEntries = Array.isArray(emotionScores)
    ? emotionScores.map((item) => {
        if (Array.isArray(item)) {
          return item
        }

        return [item?.emotion, item?.score]
      })
    : Object.entries(emotionScores || {})

  const grouped = new Map()

  sourceEntries.forEach(([emotion, score]) => {
    const numericScore = Number(score)
    if (!Number.isFinite(numericScore) || numericScore <= 0) {
      return
    }

    const category = getEmotionCategoryMeta(emotion)
    const existing = grouped.get(category.key) ?? {
      ...category,
      score: 0,
      examples: [],
    }

    existing.score += numericScore

    const normalizedEmotion = normalizeEmotionText(emotion)
    if (normalizedEmotion && !existing.examples.includes(normalizedEmotion)) {
      existing.examples.push(normalizedEmotion)
    }

    grouped.set(category.key, existing)
  })

  return Array.from(grouped.values())
    .sort((a, b) => b.score - a.score)
}

export function getEmotionLegendIcon() {
  return Brain
}

export function getEmotionTrendIcon() {
  return Zap
}