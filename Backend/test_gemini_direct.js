const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testSum() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("API Key found:", apiKey ? `${apiKey.substring(0, 7)}...` : "NONE");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    console.log("Testing direct SDK call...");
    try {
        const result = await model.generateContent("Hello, can you summarize this: He is a boy.");
        console.log("Response:", result.response.text());
    } catch (err) {
        console.error("Direct SDK Error:", err);
    }
}

testSum();
