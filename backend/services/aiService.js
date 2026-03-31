import { GoogleGenAI } from "@google/genai";

const EMOTIONS = ["anger", "disgust", "fear", "joy", "neutral", "sadness", "surprise"];

// Weighted per-emotion contribution to moodScore, stressScore, energyScore (all 1–5 scale)
const emotionWeights = {
  //          mood  stress  energy
  joy:      [  5,     1,     5  ],
  neutral:  [  3,     2,     3  ],
  surprise: [  3,     3,     4  ],
  anger:    [  2,     5,     3  ],
  disgust:  [  2,     4,     3  ],
  fear:     [  2,     5,     2  ],
  sadness:  [  1,     3,     2  ],
};

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY in environment variables");
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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

function normalizeEmotionScores(rawScores) {
  if (!rawScores || typeof rawScores !== "object") {
    throw new Error("Gemini emotion output is not a JSON object");
  }

  const normalized = {};
  let total = 0;
  for (const emotion of EMOTIONS) {
    const value = Number(rawScores[emotion]);
    const safeValue = Number.isFinite(value) && value >= 0 ? value : 0;
    normalized[emotion] = safeValue;
    total += safeValue;
  }

  if (total <= 0) {
    throw new Error("Gemini emotion output has zero total score");
  }

  for (const emotion of EMOTIONS) {
    normalized[emotion] = Number((normalized[emotion] / total).toFixed(6));
  }

  return normalized;
}

function sanitizeSuggestions(rawSuggestions) {
  const fromArray = Array.isArray(rawSuggestions)
    ? rawSuggestions
    : Array.isArray(rawSuggestions?.suggestions)
      ? rawSuggestions.suggestions
      : [];

  const clean = fromArray
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 3);

  if (clean.length === 3) {
    return clean;
  }

  throw new Error("Gemini suggestions output must contain exactly 3 non-empty strings");
}

function getDetectedEmotion(emotionScores) {
  return Object.entries(emotionScores).sort((a, b) => b[1] - a[1])[0][0] ?? "neutral";
}

async function getAnalysisFromGemini(note) {
  const ai = getGeminiClient();
  const prompt = `Analyze the journal text and return ONLY valid JSON with this exact shape:\n{\n  "emotionScores": {\n    "anger": number,\n    "disgust": number,\n    "fear": number,\n    "joy": number,\n    "neutral": number,\n    "sadness": number,\n    "surprise": number\n  },\n  "suggestions": ["string", "string", "string"]\n}\n\nRules:\n- emotionScores values must be between 0 and 1\n- emotionScores values should sum to 1\n- suggestions must be exactly 3 short, supportive, practical lines\n- output JSON only, no markdown\n\nJournal text:\n"""${note}"""`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const text = typeof response?.text === "function" ? response.text() : (response?.text || "");
  const parsed = parseGeminiJSON(text);

  return {
    emotionScores: normalizeEmotionScores(parsed?.emotionScores),
    suggestions: sanitizeSuggestions(parsed?.suggestions),
  };
}

/**
 * Compute weighted mood/stress/energy scores from all emotion scores.
 * Each score is the probability-weighted average across all 7 emotions.
 * Output range: 1–5 (clamped and rounded to 1 decimal place).
 */
function computeScores(emotionScores) {
  let mood = 0, stress = 0, energy = 0;
  for (const [emotion, score] of Object.entries(emotionScores)) {
    const [m, s, e] = emotionWeights[emotion] ?? [3, 3, 3];
    mood   += m * score;
    stress += s * score;
    energy += e * score;
  }
  const clamp = v => Math.min(5, Math.max(1, +v.toFixed(1)));
  return {
    moodScore:   clamp(mood),
    stressScore: clamp(stress),
    energyScore: clamp(energy),
  };
}

// Main function to analyze emotion and get suggestions + emotion scores
export async function analyzeEmotion(note) {
  const inputText = typeof note === "string" ? note.trim() : "";
  if (!inputText) {
    throw new Error("Journal text is required for Gemini analysis");
  }

  // Single Gemini call returns both emotion scores and suggestions from the same input.
  const { emotionScores, suggestions } = await getAnalysisFromGemini(inputText);

  const detectedEmotion = getDetectedEmotion(emotionScores);

  // Step 4: Compute moodScore, stressScore, energyScore from weighted emotion map
  const { moodScore, stressScore, energyScore } = computeScores(emotionScores);

  return {
    emotion: detectedEmotion,   // Most likely emotion (string)
    emotionScores,              // Probability scores for all 7 emotions
    moodScore,                  // Weighted mood score (1–5)
    stressScore,                // Weighted stress score (1–5)
    energyScore,                // Weighted energy score (1–5)
    suggestions,                // Array of 3 wellness suggestions
  };
}