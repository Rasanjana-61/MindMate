import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import './App.css';

function Typewriter({ text, speed = 50 }) {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        setDisplayedText('');
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayedText((prev) => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(timer);
            }
        }, speed);
        return () => clearInterval(timer);
    }, [text, speed]);

    return <span>{displayedText}</span>;
}

function VideoSummary() {
    const [videoLink, setVideoLink] = useState('');
    const [summary, setSummary] = useState('');
    const [transcriptData, setTranscriptData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('summary');
    const [chatMessage, setChatMessage] = useState('');
    const [currentTime, setCurrentTime] = useState(0);
    const [player, setPlayer] = useState(null);
    const transcriptContainerRef = useRef(null);

    const extractYoutubeId = (url) => {
        try {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = url.match(regExp);
            if (match && match[2]) {
                return match[2];
            }
            return null;
        } catch (e) {
            return null;
        }
    };

    const videoId = extractYoutubeId(videoLink);

    // Poll player time every 500ms
    useEffect(() => {
        let interval;
        if (player) {
            interval = setInterval(() => {
                try {
                    const time = player.getCurrentTime();
                    const roundedTime = Math.floor(time * 1000); // offset is in ms
                    if (roundedTime !== currentTime) {
                        setCurrentTime(roundedTime);
                    }
                } catch (e) {
                    // Player might not be ready or destroyed
                }
            }, 500);
        }
        return () => clearInterval(interval);
    }, [player, currentTime]);

    // Auto-scroll transcript
    useEffect(() => {
        if (transcriptContainerRef.current) {
            const activeElement = transcriptContainerRef.current.querySelector('.transcript-row.active');
            if (activeElement) {
                activeElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }
    }, [currentTime]);

    const handleSummarize = async () => {
        if (!videoLink) {
            alert('Please enter a video link');
            return;
        }

        setIsLoading(true);
        setSummary('');
        setTranscriptData([]);

        try {
            // 1. Fetch Summary
            const summaryResponse = await fetch('http://localhost:5001/api/video/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoLink }),
            });

            const summaryData = await summaryResponse.json();
            if (!summaryResponse.ok) {
                throw new Error(summaryData.error || 'Failed to fetch summary');
            }
            setSummary(summaryData.summary);

            // 2. Fetch Real Transcript
            const transcriptResponse = await fetch('http://localhost:5001/api/video/transcript', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoLink }),
            });

            const tData = await transcriptResponse.json();
            if (!transcriptResponse.ok) {
                throw new Error(tData.error || 'Failed to fetch transcript');
            }

            if (tData.transcript) {
                setTranscriptData(tData.transcript);
            }

            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            alert(`Error: ${error.message}`);
            setIsLoading(false);
        }
    };

    const onPlayerReady = (event) => {
        setPlayer(event.target);
    };

    const opts = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 0,
        },
    };

    // Format time for display (ms to MM:SS)
    const formatTime = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="video-summary-page">
            <nav className="video-summary-nav">
                <button onClick={() => window.history.back()} className="nav-back-btn">
                    ← Dashboard
                </button>
                <div className="video-link-input-group">
                    <input
                        type="text"
                        placeholder="Paste YouTube video link here"
                        value={videoLink}
                        onChange={(e) => setVideoLink(e.target.value)}
                        className="nav-video-input"
                    />
                    <button
                        onClick={handleSummarize}
                        className="nav-summarize-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : 'Summarize'}
                    </button>
                </div>
            </nav>

            <main className="video-summary-layout">
                {/* Left Side: Video Player */}
                <section className="player-section">
                    <div className="player-container">
                        {videoId ? (
                            <YouTube
                                videoId={videoId}
                                opts={opts}
                                onReady={onPlayerReady}
                                className="youtube-player"
                            />
                        ) : (
                            <div className="player-placeholder">
                                <p>Paste a YouTube link above to see the video</p>
                            </div>
                        )}
                    </div>
                    <div className="video-info-mock">
                        <h2 className="video-title">Live Transcript Session</h2>
                        <div className="video-actions">
                            <button className="video-action-btn">📚 Chapters</button>
                            <button className="video-action-btn">📝 Transcripts</button>
                            <button className="video-action-btn">🔄 Auto Scroll</button>
                        </div>
                        <div className="mock-transcript">
                            <div className="transcript-list" ref={transcriptContainerRef}>
                                {transcriptData.length > 0 ? (
                                    transcriptData.map((seg, index) => {
                                        const isActive = currentTime >= seg.offset && currentTime <= (seg.offset + seg.duration);
                                        return (
                                            <div
                                                key={index}
                                                className={`transcript-row ${isActive ? 'active' : ''}`}
                                            >
                                                <span className="timestamp">{formatTime(seg.offset)}</span>
                                                <p className="transcript-text">{seg.text}</p>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="waiting-text" style={{ textAlign: 'center', opacity: 0.6 }}>
                                        Click Summarize to load live transcript history
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Right Side: Workspace */}
                <section className="workspace-section">
                    <div className="workspace-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                            onClick={() => setActiveTab('chat')}
                        >
                            💬 Chat
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                            onClick={() => setActiveTab('summary')}
                        >
                            📜 Summary
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
                            onClick={() => setActiveTab('notes')}
                        >
                            📓 Notes
                        </button>
                    </div>

                    <div className="workspace-content">
                        {activeTab === 'summary' && (
                            <div className="tab-pane summary-pane">
                                <div className="summary-section">
                                    <h3>AI Summary</h3>
                                    {isLoading ? (
                                        <div className="loading-state">Generating summary...</div>
                                    ) : summary ? (
                                        <p className="summary-text-display">{summary}</p>
                                    ) : (
                                        <p className="empty-state">No summary generated yet. Click "Summarize" above.</p>
                                    )}
                                </div>

                                <div className="script-section">
                                    <h3>Full Video Script</h3>
                                    <div className="script-content">
                                        {transcriptData.length > 0 ? (
                                            transcriptData.map((seg, index) => (
                                                <div key={index} className="script-line">
                                                    <span className="script-time">{formatTime(seg.offset)}</span>
                                                    <span className="script-text">{seg.text}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="empty-state">Script will be available after summarizing.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'chat' && (
                            <div className="tab-pane chat-pane">
                                <div className="chat-messages">
                                    <p className="chat-welcome">Ask anything about the video content!</p>
                                </div>
                                <div className="chat-input-area">
                                    <input
                                        type="text"
                                        placeholder="Ask anything..."
                                        value={chatMessage}
                                        onChange={(e) => setChatMessage(e.target.value)}
                                    />
                                    <button className="send-chat-btn">发送</button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notes' && (
                            <div className="tab-pane notes-pane">
                                <h3>My Notes</h3>
                                <textarea placeholder="Take your notes here while watching..."></textarea>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default VideoSummary;
