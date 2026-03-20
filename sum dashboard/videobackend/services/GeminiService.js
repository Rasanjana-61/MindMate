const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

class GeminiService {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("WARNING: GEMINI_API_KEY is not set in environment variables.");
        }
        this.genAI = new GoogleGenerativeAI(apiKey || "DUMMY_KEY");
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }

    async generateSummary(transcript) {
        try {
            if (!process.env.GEMINI_API_KEY) {
                return "AI Summary is ready to be activated. Please add your GEMINI_API_KEY to the .env file to see real results!";
            }

            const prompt = `
                You are a professional video summarizer. 
                Below is a transcript of a video. 
                Please provide a concise, high-quality summary of the main points discussed.
                Use bullet points for key takeaways.
                
                Transcript:
                ${transcript}
            `;

            console.log(`[Gemini] Generating content with transcript length: ${transcript.length}`);
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            console.log(`[Gemini] Successfully generated summary (${text.length} chars).`);
            return text;
        } catch (error) {
            console.error("Gemini API Error details:", error);
            return "Failed to generate AI summary. Please check your connection or try again later.";
        }
    }
}

module.exports = new GeminiService();
