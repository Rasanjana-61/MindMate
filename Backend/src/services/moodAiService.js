const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_MODEL = process.env.GEMINI_MODEL_FOR_JOURNAL || process.env.GEMINI_MODEL || "gemini-3-flash-preview";

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY_FOR_JOURNAL || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY_FOR_JOURNAL in environment variables");
  }

  return new GoogleGenerativeAI(apiKey);
}

function parseGeminiJSON(text) {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Gemini returned an empty response text");
  }

  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const codeFenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

    if (!codeFenceMatch) {
      throw new Error("Gemini returned non-JSON content");
    }

    return JSON.parse(codeFenceMatch[1]);
  }
}

function normalizeEmotionKey(key) {
  return String(key || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function normalizeEmotionScores(rawScores) {
  if (!rawScores || typeof rawScores !== "object") {
    throw new Error("Gemini emotion output is not a JSON object");
  }

  const normalized = {};
  let total = 0;

  for (const [key, value] of Object.entries(rawScores)) {
    const normalizedKey = normalizeEmotionKey(key);

    if (!normalizedKey) {
      continue;
    }

    const safeValue = Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
    normalized[normalizedKey] = (normalized[normalizedKey] || 0) + safeValue;
    total += safeValue;
  }

  if (total <= 0) {
    throw new Error("Gemini emotion output has zero total score");
  }

  for (const emotion of Object.keys(normalized)) {
    normalized[emotion] = Number((normalized[emotion] / total).toFixed(6));
  }

  return normalized;
}

function sanitizeScalarScore(value, fieldName) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    throw new Error(`Gemini ${fieldName} must be a number`);
  }

  return Math.min(5, Math.max(1, Number(numeric.toFixed(1))));
}

function sanitizeSuggestions(rawSuggestions) {
  const fromArray = Array.isArray(rawSuggestions)
    ? rawSuggestions
    : Array.isArray(rawSuggestions?.suggestions)
      ? rawSuggestions.suggestions
      : [];

  const clean = fromArray
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  if (clean.length === 0) {
    throw new Error("Gemini suggestions output must contain at least 1 non-empty string");
  }

  return clean;
}

function getDetectedEmotion(emotionScores) {
  return Object.entries(emotionScores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "neutral";
}

async function getAnalysisFromGemini(note) {
  const ai = getGeminiClient();
  const prompt = `Analyze the journal text and return ONLY valid JSON with this exact shape:\n{\n  "emotion": "string",\n  "emotionScores": {\n    "emotion_label": number\n  },\n  "moodScore": number,\n  "stressScore": number,\n  "energyScore": number,\n  "suggestions": ["string", "string", ...]\n}\n\nRules:\n- emotionScores can contain ANY relevant emotion labels, not fixed labels\n- each emotionScores value must be between 0 and 1\n- emotionScores values should sum to 1\n- emotion should match the highest score emotion\n- moodScore, stressScore, energyScore must be on a 1 to 5 scale\n- suggestions can be any number of items (at least 1)\n- each suggestion must be detailed, practical, and actionable (2-3 sentences recommended)\n- output JSON only, no markdown\n\nJournal text:\n"""${note}"""`;

  const model = ai.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });
  const result = await model.generateContent(prompt);

  const response = await result.response;
  const text = typeof response?.text === "function" ? await response.text() : String(response?.text || "");
  const parsed = parseGeminiJSON(text);

  const emotionScores = normalizeEmotionScores(parsed?.emotionScores);
  const detectedEmotion = getDetectedEmotion(emotionScores);
  const explicitEmotion = normalizeEmotionKey(parsed?.emotion || detectedEmotion) || detectedEmotion;

  return {
    emotion: explicitEmotion,
    emotionScores,
    moodScore: sanitizeScalarScore(parsed?.moodScore, "moodScore"),
    stressScore: sanitizeScalarScore(parsed?.stressScore, "stressScore"),
    energyScore: sanitizeScalarScore(parsed?.energyScore, "energyScore"),
    suggestions: sanitizeSuggestions(parsed?.suggestions),
  };
}

async function analyzeEmotion(note) {
  const inputText = typeof note === "string" ? note.trim() : "";

  if (!inputText) {
    throw new Error("Journal text is required for Gemini analysis");
  }

  const {
    emotion,
    emotionScores,
    moodScore,
    stressScore,
    energyScore,
    suggestions,
  } = await getAnalysisFromGemini(inputText);

  return {
    emotion,
    emotionScores,
    moodScore,
    stressScore,
    energyScore,
    suggestions,
    sentiment:
      moodScore >= 3.5 && stressScore <= 2.5
        ? "Positive"
        : moodScore <= 2.5 || stressScore >= 3.5
          ? "Negative"
          : "Neutral",
  };
}

module.exports = {
  analyzeEmotion,
};
