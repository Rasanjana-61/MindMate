const { YoutubeTranscriptApi } = require('youtube-transcript-api');

async function test() {
    const videoId = 'aqz-KE-bpKQ';
    console.log(`Testing youtube-transcript-api for: ${videoId}`);

    try {
        const transcript = await YoutubeTranscriptApi.listTranscripts(videoId);
        console.log('Available transcripts found.');
        const enTranscript = transcript.findTranscript(['en']);
        const data = await enTranscript.fetch();
        console.log(`Fetched ${data.length} segments.`);
        console.log('Sample segment:', data[0]);
    } catch (error) {
        console.error('Test failed with error:', error.message);
    }
}

test();
