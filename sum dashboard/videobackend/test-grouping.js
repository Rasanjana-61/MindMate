const TextSplitter = require('./utils/TextSplitter');

const mockSegments = [
    { text: "Segment 1", offset: 0, duration: 5000 },
    { text: "Segment 2", offset: 10000, duration: 5000 },
    { text: "Segment 3", offset: 25000, duration: 2000 },
    { text: "Segment 4", offset: 31000, duration: 5000 }, // New interval (>30s)
    { text: "Segment 5", offset: 40000, duration: 5000 },
    { text: "Segment 6", offset: 62000, duration: 5000 }, // New interval (>60s)
];

console.log('Testing splitByTime with 30s interval:');
const chunks = TextSplitter.splitByTime(mockSegments, 30000);

chunks.forEach((chunk, i) => {
    console.log(`Chunk ${i}: Start=${chunk.offset}ms, Duration=${chunk.duration}ms, Text="${chunk.text}"`);
});

if (chunks.length === 3) {
    console.log('Test PASSED: Correct number of chunks.');
} else {
    console.log(`Test FAILED: Expected 3 chunks, got ${chunks.length}`);
}
