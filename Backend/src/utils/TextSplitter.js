class TextSplitter {
    /**
     * Splits an array of transcript segments into larger semantic chunks by word count.
     * @param {Array} segments - Array of {text, offset, duration}
     * @param {number} maxWordsPerChunk - Approximate words per chunk
     * @returns {Array} - Array of chunked segments
     */
    static splitByWords(segments, maxWordsPerChunk = 50) {
        if (!segments || segments.length === 0) return [];

        const chunks = [];
        let currentChunk = {
            text: '',
            offset: segments[0].offset,
            duration: 0
        };
        let wordCount = 0;

        segments.forEach((seg, index) => {
            const words = seg.text.split(' ').length;

            if (wordCount + words > maxWordsPerChunk && currentChunk.text.length > 0) {
                chunks.push(currentChunk);
                currentChunk = {
                    text: seg.text,
                    offset: seg.offset,
                    duration: seg.duration
                };
                wordCount = words;
            } else {
                currentChunk.text += (currentChunk.text ? ' ' : '') + seg.text;
                currentChunk.duration += seg.duration;
                wordCount += words;
            }

            // Push last chunk
            if (index === segments.length - 1) {
                chunks.push(currentChunk);
            }
        });

        return chunks;
    }

    /**
     * Splits an array of transcript segments into fixed time-based chunks.
     * @param {Array} segments - Array of {text, offset, duration}
     * @param {number} intervalMs - Time interval in milliseconds (e.g., 30000 for 30s)
     * @returns {Array} - Array of chunked segments
     */
    static splitByTime(segments, intervalMs = 30000) {
        if (!segments || segments.length === 0) return [];

        const chunks = [];
        let currentInterval = 0;
        let currentChunk = {
            text: '',
            offset: segments[0].offset,
            duration: 0
        };

        segments.forEach((seg, index) => {
            const segmentEnd = seg.offset + seg.duration;

            // If this segment belongs to a new interval
            if (seg.offset >= currentInterval + intervalMs && currentChunk.text.length > 0) {
                chunks.push(currentChunk);
                currentInterval = Math.floor(seg.offset / intervalMs) * intervalMs;
                currentChunk = {
                    text: seg.text,
                    offset: seg.offset,
                    duration: seg.duration
                };
            } else {
                currentChunk.text += (currentChunk.text ? ' ' : '') + seg.text;
                currentChunk.duration = segmentEnd - currentChunk.offset;
            }

            // Push last chunk
            if (index === segments.length - 1) {
                chunks.push(currentChunk);
            }
        });

        return chunks;
    }
}

module.exports = TextSplitter;
