const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY NOT FOUND");
        return;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
        const data = await response.json();
        console.log("AVAILABLE MODELS (v1):");
        if (data.models) {
            data.models.forEach(m => console.log(`- ${m.name}`));
        } else {
            console.log("No models returned for v1:", data);
        }

        const responseBeta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const dataBeta = await responseBeta.json();
        console.log("\nAVAILABLE MODELS (v1beta):");
        if (dataBeta.models) {
            dataBeta.models.forEach(m => console.log(`- ${m.name}`));
        } else {
            console.log("No models returned for v1beta:", dataBeta);
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
