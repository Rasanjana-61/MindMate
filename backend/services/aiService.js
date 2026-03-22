import fetch from "node-fetch";

// Default wellness suggestions fallback
const defaultSuggestions = {
  anger:    ["Take a short break and step outside", "Try a calming breathing exercise", "Write down what triggered your anger"],
  disgust:  ["Take a short walk to clear your mind", "Focus on something you appreciate", "Listen to calming music"],
  fear:     ["Try deep breathing for 5 minutes", "Talk to a trusted friend or family member", "Ground yourself with the 5-4-3-2-1 technique"],
  joy:      ["Keep up the great mood!", "Share your happiness with someone you love", "Write down what made you feel joyful today"],
  neutral:  ["Maintain your daily routine", "Reflect on small wins from today", "Try a 10-minute mindfulness session"],
  sadness:  ["Go for a short walk in nature", "Listen to uplifting music", "Reach out to a friend for a chat"],
  surprise: ["Take a moment to process what surprised you", "Journal about the experience", "Talk it through with someone you trust"],
};

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
  // Step 2: Extract scores for all 7 emotions
  const emotionScores = {
    anger: 0,
    disgust: 0,
    fear: 0,
    joy: 0,
    neutral: 0,
    sadness: 0,
    surprise: 0
  };

  let detectedEmotion = "neutral"; // default

  // Step 1: Call HF emotion detection model via direct fetch (confirmed working)
  try {
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/j-hartmann/emotion-english-distilroberta-base",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: note }),
      }
    );

    const result = await response.json();
    const scoresArray = Array.isArray(result[0]) ? result[0] : result; // handle nested or flat
    scoresArray.forEach(item => {
      const label = item.label.toLowerCase();
      if (Object.prototype.hasOwnProperty.call(emotionScores, label)) {
        emotionScores[label] = item.score;
      }
    });
    detectedEmotion = Object.entries(emotionScores).sort((a, b) => b[1] - a[1])[0][0];
  } catch (err) {
    console.error("HF emotion detection failed, using neutral fallback:", err.message);
  }

  // Step 4: Compute moodScore, stressScore, energyScore from weighted emotion map
  const { moodScore, stressScore, energyScore } = computeScores(emotionScores);

  // Step 5: Get suggestions from static map based on detected emotion
  const suggestions = defaultSuggestions[detectedEmotion] ?? defaultSuggestions["neutral"];

  return {
    emotion: detectedEmotion,   // Most likely emotion (string)
    emotionScores,              // Probability scores for all 7 emotions
    moodScore,                  // Weighted mood score (1–5)
    stressScore,                // Weighted stress score (1–5)
    energyScore,                // Weighted energy score (1–5)
    suggestions,                // Array of 3 wellness suggestions
  };
}