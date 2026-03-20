const { YoutubeTranscript } = require('@playzone/youtube-transcript');

async function test() {
    const videoId = 'fWqGMBu66n8'; // Introduce to Rust
    console.log(`Testing @playzone/youtube-transcript for: ${videoId}`);

    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        console.log(`Fetched ${transcript.length} segments.`);
        console.log('Sample segment:', transcript[0]);
    } catch (error) {
        console.error('Test failed with error:', error.message);
    }
}

test();
