const { exec } = require('child_process');
const path = require('path');


/**
 * 📜 Transcript Loader: Simplified and robust transcript fetching using a Python bridge.
 */
class TranscriptLoader {
    /**
     * Extracts YouTube Video ID from various URL formats.
     */
    static extractVideoId(url) {
        try {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = url.match(regExp);
            if (match && match[2].length === 11) {
                return match[2];
            }
            if (url.includes('v=')) return url.split('v=')[1].split('&')[0];
            if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
            return url.split('/').pop().split('?')[0];
        } catch (e) {
            return url;
        }
    }

    /**
     * Runs the Python bridge script to fetch transcripts reliably.
     */
    static fetchWithPython(videoId) {
        return new Promise((resolve, reject) => {
            const scriptPath = path.join(__dirname, 'fetch_transcript.py');
            // Using 'py' as confirmed available on user system
            exec(`py "${scriptPath}" ${videoId}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`[PYTHON] Error: ${error.message}`);
                    return reject(error);
                }
                if (stderr) {
                    console.warn(`[PYTHON] Stderr: ${stderr}`);
                }
                try {
                    const data = JSON.parse(stdout);
                    if (data.error) {
                        return reject(new Error(data.error));
                    }
                    resolve(data);
                } catch (e) {
                    reject(new Error("Failed to parse Python output"));
                }
            });
        });
    }

    /**
     * Fallback mechanism
     */
    static generateFallback(videoId) {
        console.log(`[LOADER] Generating fallback for:`, videoId);
        return [{
            text: "The transcript for this video is currently unavailable. This might be due to disabled captions or temporary API restrictions. You can still ask questions about general video topics!",
            offset: 0,
            duration: 10000
        }];
    }

    /**
     * Main load function
     */
    static async load(videoLink) {
        const videoId = this.extractVideoId(videoLink);
        console.log(`[LOADER] Fetching transcript for ID: ${videoId}`);

        // Strategy 1: Python Bridge (Most robust, requested by user)
        try {
            const pythonData = await this.fetchWithPython(videoId);
            if (pythonData && pythonData.length > 0) {
                console.log(`[LOADER] Success (Python): Fetched ${pythonData.length} segments.`);
                return pythonData.map(s => ({
                    text: s.text.replace(/&amp;#39;/g, "'").replace(/&amp;quot;/g, '"'),
                    offset: Math.floor((s.start || 0) * 1000),
                    duration: Math.floor((s.duration || 0) * 1000)
                }));
            }
        } catch (error) {
            console.warn(`[LOADER] Python bridge failed:`, error.message);
        }

        // Strategy 2: JS Scraper (Backup)
        try {
            const { YoutubeTranscript } = await import('youtube-transcript');
            let transcript;
            try {
                // Try Sinhala first
                transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'si' });
            } catch (e) {
                // Fallback to English
                transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
            }
            
            if (transcript && transcript.length > 0) {
                console.log(`[LOADER] Success (JS): Fetched ${transcript.length} segments.`);
                return transcript.map(s => ({
                    text: s.text.replace(/&amp;#39;/g, "'").replace(/&amp;quot;/g, '"'),
                    offset: Math.floor((s.offset || s.start || 0) * 1000),
                    duration: Math.floor((s.duration || 0) * 1000)
                }));
            }
        } catch (error) {
            console.warn(`[LOADER] JS scraper failed:`, error.message);
        }

        return this.generateFallback(videoId);
    }
}

module.exports = TranscriptLoader;
