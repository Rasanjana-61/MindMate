const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Summarize text using Gemini AI
 * @param {string} text - The text to be summarized
 * @returns {Promise<string>} - The summarized text
 */
const summarizeText = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Please Provide a concise and high-quality summary of the following text. 
      Focus on the main points and key takeaways. 
      Use bullet points if appropriate.
      
      Text to summarize:
      ${text}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return await response.text();
  } catch (error) {
    console.error("Error in Gemini summarization service:", error);
    throw new Error("Failed to generate summary from AI");
  }
};

module.exports = {
  summarizeText,
};
