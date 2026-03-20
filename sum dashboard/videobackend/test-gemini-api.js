const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY is not set.");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        console.log("Listing available models...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        if (data.models) {
            console.log("Available models:");
            data.models.forEach(m => console.log(` - ${m.name}`));
        } else {
            console.log("No models found or error in response:", JSON.stringify(data));
        }
    } catch (e) {
        console.error("Failed to list models:", e.message);
    }


    const modelsToTry = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest"];

    for (let modelName of modelsToTry) {
        try {
            console.log(`Testing model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello, are you working?");
            const response = await result.response;
            console.log(`Success with ${modelName}! Response:`, response.text());
            return; // Stop after first success
        } catch (error) {
            console.error(`Failed with ${modelName}: STATUS ${error.status} - ${error.message}`);
        }
    }

    console.error("All models failed. Please check your API key, model availability, and network connection.");
}

testGemini();
