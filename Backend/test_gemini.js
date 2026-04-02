const GeminiService = require("./src/services/GeminiService");
require('dotenv').config();

async function testSum() {
    console.log("Testing Gemini summary...");
    console.log("API Key found:", process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 5)}...` : "NONE");
    const transcript = "This is a test transcript for summarizing. It is very short.";
    try {
        const summary = await GeminiService.generateSummary(transcript);
        console.log("Summary Result:", summary);
    } catch (err) {
        console.error("Test Error:", err);
    }
}

testSum();
