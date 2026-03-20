const { Innertube } = require('youtubei.js');

async function test() {
    const videoId = 'fWqGMBu66n8'; // Introduction to Rust
    console.log(`Testing youtubei.js for: ${videoId}`);

    try {
        const youtube = await Innertube.create();
        const info = await youtube.getInfo(videoId);
        const transcript_data = await info.getTranscript();

        console.log('Transcript data keys:', Object.keys(transcript_data));
        if (transcript_data.transcript && transcript_data.transcript.content) {
            const bodies = transcript_data.transcript.content.body.initial_segments;
            console.log(`Fetched ${bodies.length} segments.`);
            console.log('Sample segment:', bodies[0]);
        } else {
            console.log('No transcript content found.');
        }
    } catch (error) {
        console.error('Test failed with error:', error.message);
    }
}

test();
