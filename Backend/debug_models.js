const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function checkModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    try {
        console.log("Checking API key with a simple prompt...");
        const genAI = new GoogleGenerativeAI(apiKey);
        // Try a different model name format
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hi");
        console.log("Success with gemini-1.5-flash!");
        console.log(result.response.text());
    } catch (err) {
        console.log("Failed with gemini-1.5-flash:", err.message || err);
        
        try {
            console.log("Trying gemini-pro (1.0)...");
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent("Hi");
            console.log("Success with gemini-pro!");
        } catch (err2) {
            console.log("Failed with gemini-pro:", err2.message || err2);
        }
    }
}

checkModels();
