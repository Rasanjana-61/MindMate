import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Download, FileText, MessageSquare, Edit3, Loader2, PlayCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { request } from '../../lib/auth';
import './Summarizer.css';

export function VideoSummary({ setPage }) {
    const [videoLink, setVideoLink] = useState('');
    const [summary, setSummary] = useState('');
    const [transcriptData, setTranscriptData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('summary');
    const [chatMessage, setChatMessage] = useState('');
    const [currentTime, setCurrentTime] = useState(0);
    const [player, setPlayer] = useState(null);
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('English');
    const transcriptContainerRef = useRef(null);

    const extractYoutubeId = (url) => {
        try {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = url.match(regExp);
            return match && match[2] ? match[2] : null;
        } catch (e) {
            return null;
        }
    };

    const videoId = extractYoutubeId(videoLink);

    useEffect(() => {
        let interval;
        if (player) {
            interval = setInterval(() => {
                try {
                    const time = player.getCurrentTime();
                    const roundedTime = Math.floor(time * 1000);
                    if (roundedTime !== currentTime) {
                        setCurrentTime(roundedTime);
                    }
                } catch (e) {}
            }, 500);
        }
        return () => clearInterval(interval);
    }, [player, currentTime]);

    useEffect(() => {
        if (transcriptContainerRef.current) {
            const activeElement = transcriptContainerRef.current.querySelector('.transcript-row.active');
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [currentTime]);

    const handleSummarize = async (lang = selectedLanguage) => {
        if (!videoLink.trim() || !videoId) {
            setError('Please enter a valid YouTube link.');
            return;
        }

        setError('');
        setIsLoading(true);
        setSummary('');
        setTranscriptData([]);

        try {
            // 1. Fetch Transcript
            const tResponse = await request(`/summarizer/video/transcript?videoLink=${encodeURIComponent(videoLink)}`);
            if (tResponse.success) {
                setTranscriptData(tResponse.transcript);
                
                // 2. Fetch Summary using the transcript text
                const fullText = tResponse.transcript.map(s => s.text).join(' ');
                const sResponse = await request('/summarizer/summarize', {
                    method: 'POST',
                    body: JSON.stringify({ type: 'video', content: fullText, language: lang })
                });
                
                if (sResponse.success) {
                    setSummary(sResponse.summary);
                } else {
                    setError(sResponse.message || 'Failed to generate AI summary.');
                }
            } else {
                throw new Error(tResponse.message || 'Failed to fetch transcript');
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(`Error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleDownloadNotes = () => {
        if (!notes.trim()) return;
        const element = document.createElement("a");
        const file = new Blob([notes], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = "video_notes.txt";
        document.body.appendChild(element); 
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="video-summary-page">
            <nav className="video-summary-nav">
                <button onClick={() => setPage('summarizer')} className="nav-back-btn inline-flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Dashboard
                </button>
                <div className="flex-1 max-w-2xl relative flex gap-2">
                    <input
                        type="text"
                        placeholder="Paste YouTube video link here"
                        value={videoLink}
                        onChange={(e) => {
                            setVideoLink(e.target.value);
                            if (error) setError('');
                        }}
                        className={`flex-1 px-4 py-2 rounded-xl bg-slate-50 border ${error ? 'border-red-500' : 'border-slate-200'} outline-none focus:border-emerald-500 transition-all`}
                    />
                    <button
                        onClick={() => handleSummarize()}
                        disabled={isLoading}
                        className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Summarize'}
                    </button>
                    {error && <div className="absolute -bottom-6 left-2 text-red-500 text-xs font-medium">{error}</div>}
                </div>
            </nav>

            <main className="video-summary-layout">
                <section className="player-section bg-slate-50">
                    <div className="player-container">
                        {videoId ? (
                            <YouTube
                                videoId={videoId}
                                opts={{ height: '100%', width: '100%', playerVars: { autoplay: 0 } }}
                                onReady={(e) => setPlayer(e.target)}
                                className="youtube-player"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                                <PlayCircle className="w-16 h-16 opacity-20" />
                                <p>Paste a YouTube link above to see the video</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-white rounded-3xl p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Live Transcript</h2>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-wider">Sync Active</span>
                            </div>
                        </div>
                        <div className="transcript-list" ref={transcriptContainerRef}>
                            {transcriptData.length > 0 ? (
                                transcriptData.map((seg, index) => {
                                    const isActive = currentTime >= seg.offset && currentTime <= (seg.offset + seg.duration);
                                    return (
                                        <div key={index} 
                                            className={`transcript-row ${isActive ? 'active' : ''}`}
                                            onClick={() => player?.seekTo(seg.offset / 1000)}
                                        >
                                            <span className="timestamp">{formatTime(seg.offset)}</span>
                                            <p className="transcript-text">{seg.text}</p>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-center text-slate-400 py-12">Click "Summarize" to load the transcript</p>
                            )}
                        </div>
                    </div>
                </section>

                <section className="workspace-section border-l border-slate-200">
                    <div className="workspace-tabs">
                        {[
                            { id: 'summary', name: 'Summary', icon: <FileText className="w-4 h-4" /> },
                            { id: 'notes', name: 'Notes', icon: <Edit3 className="w-4 h-4" /> },
                            { id: 'chat', name: 'Chat', icon: <MessageSquare className="w-4 h-4" /> }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                className={`tab-btn flex items-center justify-center gap-2 ${activeTab === tab.id ? 'active text-emerald-600' : 'text-slate-500'}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.icon} {tab.name}
                            </button>
                        ))}
                    </div>

                    <div className="workspace-content">
                        <AnimatePresence mode="wait">
                            {activeTab === 'summary' && (
                                <motion.div
                                    key="summary"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                >
                                    <h3 className="text-lg font-bold mb-4">AI Summary</h3>
                                    {isLoading ? (
                                        <div className="flex flex-col items-center py-20 gap-4 text-slate-400">
                                            <Loader2 className="w-8 h-8 animate-spin" />
                                            <p>Generating summary...</p>
                                        </div>
                                    ) : summary ? (
                                        <div className="bg-slate-50 rounded-2xl p-6 text-slate-700 leading-relaxed shadow-inner markdown-summary">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
                                            
                                            <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-200/60">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Language:</p>
                                                <button 
                                                    onClick={() => { setSelectedLanguage('English'); handleSummarize('English'); }}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedLanguage === 'English' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-500'}`}
                                                >
                                                    English
                                                </button>
                                                <button 
                                                    onClick={() => { setSelectedLanguage('Sinhala'); handleSummarize('Sinhala'); }}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedLanguage === 'Sinhala' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-500'}`}
                                                >
                                                    Sinhala
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-slate-400 text-center py-20">Summary will appear here after processing.</p>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'notes' && (
                                <motion.div
                                    key="notes"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="h-full flex flex-col"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold">My Personal Notes</h3>
                                        <button 
                                            onClick={handleDownloadNotes}
                                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                                            title="Download Notes"
                                        >
                                            <Download className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <textarea 
                                        className="flex-1 w-full p-6 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 outline-none focus:border-emerald-500 transition-all resize-none shadow-inner"
                                        placeholder="Jot down important points while watching..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </motion.div>
                            )}

                            {activeTab === 'chat' && (
                                <motion.div
                                    key="chat"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="h-full flex flex-col"
                                >
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50">
                                        <MessageSquare className="w-12 h-12" />
                                        <p className="text-center px-8">Video AI Chat is currently being synchronized. Soon you'll be able to ask anything!</p>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Ask anything..."
                                            className="flex-1 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500"
                                            disabled
                                        />
                                        <button className="p-2 bg-emerald-500 text-white rounded-xl opacity-50" disabled>
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>
            </main>
        </div>
    );
}
