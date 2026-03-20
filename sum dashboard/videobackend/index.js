const express = require('express');
const cors = require('cors');
require('dotenv').config();

const TranscriptLoader = require('./services/TranscriptLoader');
const GeminiService = require('./services/GeminiService');
const TextSplitter = require('./utils/TextSplitter');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Video Summary Backend with Modular Pipeline is running');
});

// Professional Modular Transcript Endpoint
app.post('/api/video/transcript', async (req, res) => {
    const { videoLink } = req.body;
    console.log(`[API] Transcript request:`, videoLink);

    try {
        // 1. 📜 Transcript Loader: Fetches the video transcript
        const rawSegments = await TranscriptLoader.load(videoLink);

        // 2. ✂️ Return raw segments for live-sync (removed 30s chunking)
        console.log(`[API] Success: Returned ${rawSegments.length} raw segments.`);
        res.json({ transcript: rawSegments });
    } catch (error) {
        console.error('[API] Error:', error.message);
        res.json({
            transcript: [{ text: "Transcript temporarily unavailable. Synchronizing...", offset: 0, duration: 5000 }]
        });
    }
});

app.post('/api/video/summarize', async (req, res) => {
    const { videoLink } = req.body;
    console.log(`[API] Summarize request for:`, videoLink);

    try {
        // 1. Fetch transcript segments
        const rawSegments = await TranscriptLoader.load(videoLink);
        console.log(`[API] Transcript fetched: ${rawSegments.length} segments found.`);
        const fullText = rawSegments.map(s => s.text).join(' ');

        // 2. Generate AI summary
        const summary = await GeminiService.generateSummary(fullText);

        res.json({ summary });
    } catch (error) {
        console.error('[API] Summarize Error:', error.message);
        res.status(500).json({ error: "Failed to generate summary: " + error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Video backend server (Modular) is running on port ${PORT}`);
});
