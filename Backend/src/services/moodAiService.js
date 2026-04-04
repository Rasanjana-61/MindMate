const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

const POSITIVE_HINTS = [
  "happy",
  "calm",
  "good",
  "great",
  "excited",
  "grateful",
  "proud",
  "relaxed",
  "motivated",
  "hopeful",
  "peaceful",
  "content",
];

const NEGATIVE_HINTS = [
  "sad",
  "anxious",
  "stressed",
  "stress",
  "overwhelmed",
  "angry",
  "afraid",
  "fear",
  "lonely",
  "tired",
  "drained",
  "burnout",
  "upset",
  "frustrated",
];

function parseGeminiJSON(text) {
  const raw = typeof text === "string" ? text.trim() : "";

  if (!raw) {
    throw new Error("Gemini returned an empty response.");
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

    if (!fenced) {
      throw new Error("Gemini returned non-JSON content.");
    }

    return JSON.parse(fenced[1]);
  }
}

function normalizeEmotionKey(key) {
  return String(key || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function clampScore(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 3;
  }

  return Math.min(5, Math.max(1, Number(numeric.toFixed(1))));
}

function normalizeEmotionScores(rawScores) {
  if (!rawScores || typeof rawScores !== "object") {
    return { neutral: 1 };
  }

  const normalized = {};
  let total = 0;

  for (const [key, value] of Object.entries(rawScores)) {
    const safeKey = normalizeEmotionKey(key);
    const safeValue = Number(value);

    if (!safeKey || !Number.isFinite(safeValue) || safeValue < 0) {
      continue;
    }

    normalized[safeKey] = (normalized[safeKey] || 0) + safeValue;
    total += safeValue;
  }

  if (total <= 0) {
    return { neutral: 1 };
  }

  Object.keys(normalized).forEach((key) => {
    normalized[key] = Number((normalized[key] / total).toFixed(6));
  });

  return normalized;
}

function deriveSentiment({ moodScore, stressScore, emotion }) {
  const loweredEmotion = String(emotion || "").toLowerCase();

  if (moodScore >= 3.5 && stressScore <= 2.5) {
    return "Positive";
  }

  if (
    moodScore <= 2.5 ||
    stressScore >= 3.5 ||
    NEGATIVE_HINTS.some((hint) => loweredEmotion.includes(hint))
  ) {
    return "Negative";
  }

  return "Neutral";
}

function fallbackAnalysis(text) {
  const lowered = String(text || "").toLowerCase();
  const positiveHits = POSITIVE_HINTS.filter((hint) => lowered.includes(hint)).length;
  const negativeHits = NEGATIVE_HINTS.filter((hint) => lowered.includes(hint)).length;

  let emotion = "neutral";
  let moodScore = 3;
  let stressScore = 3;
  let energyScore = 3;

  if (positiveHits > negativeHits) {
    emotion = "joy";
    moodScore = 4;
    stressScore = 2;
    energyScore = 4;
  } else if (negativeHits > positiveHits) {
    emotion = "sadness";
    moodScore = 2;
    stressScore = 4;
    energyScore = 2;
  }

  const emotionScores =
    emotion === "joy"
      ? { joy: 0.7, neutral: 0.2, sadness: 0.1 }
      : emotion === "sadness"
        ? { sadness: 0.7, anxiety: 0.2, neutral: 0.1 }
        : { neutral: 0.7, calm: 0.2, sadness: 0.1 };

  return {
    emotion,
    emotionScores,
    moodScore,
    stressScore,
    energyScore,
    suggestions: [
      "Take a short check-in break: 3 deep breaths and one minute to prioritize your next small task.",
      "Write one supportive sentence to yourself about what went well and what you can control next.",
    ],
  };
}

async function analyzeWithGemini(text) {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const prompt = `Analyze the following journal text and return JSON only with this exact structure:\n{\n  "emotion": "string",\n  "emotionScores": { "emotion_label": number },\n  "moodScore": number,\n  "stressScore": number,\n  "energyScore": number,\n  "suggestions": ["string"]\n}\nRules:\n- emotionScores values must be between 0 and 1 and sum close to 1\n- moodScore, stressScore, energyScore must be between 1 and 5\n- suggestions must contain at least 1 practical suggestion\nJournal:\n\"\"\"${text}\"\"\"`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const parsed = parseGeminiJSON(response.text());

  const emotionScores = normalizeEmotionScores(parsed?.emotionScores);
  const detectedEmotion =
    Object.entries(emotionScores).sort((a, b) => b[1] - a[1])[0]?.[0] || "neutral";
  const emotion = normalizeEmotionKey(parsed?.emotion || detectedEmotion) || detectedEmotion;
  const suggestions = Array.isArray(parsed?.suggestions)
    ? parsed.suggestions.filter((item) => typeof item === "string" && item.trim())
    : [];

  return {
    emotion,
    emotionScores,
    moodScore: clampScore(parsed?.moodScore),
    stressScore: clampScore(parsed?.stressScore),
    energyScore: clampScore(parsed?.energyScore),
    suggestions:
      suggestions.length > 0
        ? suggestions
        : ["Try one short grounding activity and break your next task into a 15-minute step."],
  };
}

async function analyzeEmotion(text) {
  const cleanText = typeof text === "string" ? text.trim() : "";

  if (!cleanText) {
    throw new Error("Journal text is required.");
  }

  let analysis;

  try {
    analysis = (await analyzeWithGemini(cleanText)) || fallbackAnalysis(cleanText);
  } catch (error) {
    analysis = fallbackAnalysis(cleanText);
  }

  return {
    ...analysis,
    moodScore: clampScore(analysis.moodScore),
    stressScore: clampScore(analysis.stressScore),
    energyScore: clampScore(analysis.energyScore),
    sentiment: deriveSentiment(analysis),
  };
}

module.exports = {
  analyzeEmotion,
};
