const TranscriptLoader = require('./services/TranscriptLoader');

async function test() {
    const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Never Gonna Give You Up (Has transcripts)
    console.log(`Testing transcript for: ${videoUrl}`);

    try {
        const transcript = await TranscriptLoader.load(videoUrl);
        console.log(`Fetched ${transcript.length} segments.`);
        if (transcript.length > 0) {
            console.log('Sample segment:', transcript[0]);
            if (transcript[0].text.includes('Welcome to this AI-powered video session')) {
                console.log('Result: FALLBACK GENERATED (Scraper failed)');
            } else {
                console.log('Result: SUCCESS (Real transcript fetched)');
            }
        } else {
            console.log('Result: EMPTY TRANSCRIPT');
        }
    } catch (error) {
        console.error('Test failed with error:', error);
    }
}

test();
