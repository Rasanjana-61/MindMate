const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

class GeminiService {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("WARNING: GEMINI_API_KEY is not set in environment variables.");
        }
        this.genAI = new GoogleGenerativeAI(apiKey || "DUMMY_KEY");
        // Using Gemini 2.0 Flash as primary as it is available in user's model list
        this.modelName = "gemini-2.0-flash";
        this.model = this.genAI.getGenerativeModel({ model: this.modelName });
    }

    async callGeminiApi(prompt, modelName = "gemini-2.0-flash") {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not configured.");
        }

        console.log(`[Gemini] Calling raw API with model: ${modelName}`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: prompt }],
                        },
                    ],
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                console.warn(`[Gemini Raw API Error] Model ${modelName} failed:`, data.error?.message);
                throw new Error(data.error?.message || `Gemini request failed with status ${response.status}`);
            }

            return this.extractTextFromResponse(data);
        } catch (error) {
            console.error(`[Gemini] API Call failed for ${modelName}:`, error.message);
            throw error;
        }
    }

    extractTextFromResponse(data) {
        const text = data.candidates?.[0]?.content?.parts
            ?.map((part) => part.text || "")
            .join("")
            .trim();

        if (!text) {
            throw new Error("Gemini returned an empty summary.");
        }

        return text;
    }

    truncateText(text, maxLength = 30000) {
        if (!text || text.length <= maxLength) {
            return text;
        }
        return `${text.slice(0, maxLength)}\n\n[Transcript truncated for stability]`;
    }

    async generateSummary(transcript) {
        try {
            if (!process.env.GEMINI_API_KEY) {
                return "AI Summary is ready to be activated. Please add your GEMINI_API_KEY to the .env file to see real results!";
            }

            const safeTranscript = this.truncateText(transcript, 28000);
            const prompt = `
                You are a professional video summarizer.
                Below is a transcript of a video.
                Please provide a concise, high-quality summary of the main points discussed.
                Use bullet points for key takeaways.

                Transcript:
                ${safeTranscript}
            `;

            console.log(`[Gemini] Generating summary with transcript length: ${safeTranscript.length}`);

            try {
                // Try SDK first with primary model
                const result = await this.model.generateContent(prompt);
                const text = result.response.text();
                console.log(`[Gemini] Successfully generated summary (${text.length} chars).`);
                return text;
            } catch (sdkError) {
                console.warn("[Gemini] SDK error with primary model:", sdkError.message || sdkError);

                // Fallback sequence: 
                // 1. gemini-flash-latest
                // 2. gemini-1.5-flash
                // 3. gemini-pro

                try {
                    return await this.callGeminiApi(prompt, "gemini-flash-latest");
                } catch (e1) {
                    try {
                        return await this.callGeminiApi(prompt, "gemini-1.5-flash");
                    } catch (e2) {
                        return await this.callGeminiApi(prompt, "gemini-pro");
                    }
                }
            }
        } catch (error) {
            console.error("Gemini API Error details:", error.message || error);
            return "Failed to generate AI summary. Please check your connection or try again later.";
        }
    }

    async summarizeGeneralText(text, language = "English") {
        try {
            if (!process.env.GEMINI_API_KEY) {
                return "AI Summary is ready to be activated. Please add your GEMINI_API_KEY to the .env file to see real results!";
            }

            const safeText = this.truncateText(text, 28000);
            const prompt = `
                You are a professional text summarizer.
                Below is a text document/article.
                Please provide a concise, accurate, and high-quality summary in ${language}.
                Maintain the core message and key details.
                Use bullet points for key takeaways if appropriate.

                Text:
                ${safeText}
            `;

            console.log(`[Gemini] Summarizing general text (${safeText.length} chars) in ${language}.`);

            try {
                const result = await this.model.generateContent(prompt);
                const summary = result.response.text();
                console.log(`[Gemini] Successfully generated summary (${summary.length} chars).`);
                return summary;
            } catch (sdkError) {
                console.warn("[Gemini] SDK error, trying fallbacks for general text...");
                try {
                    return await this.callGeminiApi(prompt, "gemini-flash-latest");
                } catch (e1) {
                    try {
                        return await this.callGeminiApi(prompt, "gemini-1.5-flash");
                    } catch (e2) {
                        return await this.callGeminiApi(prompt, "gemini-pro");
                    }
                }
            }
        } catch (error) {
            console.error("Gemini General Text API Error:", error.message || error);
            return "Failed to generate AI summary. Please check your connection or try again later.";
        }
    }
}

module.exports = new GeminiService();
