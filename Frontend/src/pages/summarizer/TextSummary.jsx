import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, FileText, Send, Loader2, Sparkles, Languages, Clipboard } from 'lucide-react';
import { request } from '../../lib/auth';
import './Summarizer.css';

export function TextSummary({ setPage }) {
    const [inputText, setInputText] = useState('');
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [language, setLanguage] = useState('English');
    const [wordCount, setWordCount] = useState(0);

    useEffect(() => {
        const words = inputText.trim().split(/\s+/).filter(word => word.length > 0).length;
        setWordCount(words);
    }, [inputText]);

    const handleSummarize = async () => {
        if (!inputText.trim()) return;

        setIsLoading(true);
        setSummary('');

        try {
            const response = await request('/summarizer/summarize', {
                method: 'POST',
                body: JSON.stringify({ type: 'text', content: inputText, language })
            });

            if (response.success) {
                setSummary(response.summary);
            } else {
                throw new Error(response.message || 'Failed to generate summary');
            }
        } catch (error) {
            console.error('Error fetching text summary:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="text-summary-page bg-[#FBF8F3]">
            <nav className="text-summary-nav">
                <button onClick={() => setPage('summarizer')} className="nav-back-btn inline-flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Dashboard
                </button>
                <div className="flex-grow text-center">
                    <h2 className="text-xl font-bold text-slate-800">AI Text Summarizer</h2>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg text-emerald-600 font-bold text-sm">
                        <Sparkles className="w-4 h-4" /> 1.5 Flash
                    </div>
                </div>
            </nav>

            <main className="text-summary-container max-w-7xl mx-auto py-12">
                <div className="mb-12 text-center max-w-3xl mx-auto">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Condense Any Text</h1>
                    <p className="text-lg text-slate-600 leading-relaxed">
                        Create concise, accurate summaries of your documents, articles, and reports instantly. Perfect for researchers, students, and busy professionals.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 min-h-[500px]">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Clipboard className="w-4 h-4" /> Source Content
                            </span>
                            <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100">{wordCount} Words</span>
                        </div>
                        <textarea
                            placeholder="Paste your long text here..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            className="flex-1 w-full p-8 rounded-3xl bg-white border border-slate-100 shadow-sm outline-none focus:border-emerald-500 focus:shadow-xl focus:shadow-emerald-500/5 transition-all resize-none text-lg leading-relaxed text-slate-700"
                        />
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <FileText className="w-4 h-4" /> AI Result
                            </span>
                        </div>
                        <div className="flex-1 rounded-3xl bg-white border border-slate-100 shadow-sm p-8 overflow-y-auto">
                            <AnimatePresence mode="wait">
                                {isLoading ? (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col items-center justify-center h-full gap-4 text-slate-400"
                                    >
                                        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
                                        <p className="font-medium">Distilling context...</p>
                                    </motion.div>
                                ) : summary ? (
                                    <motion.div
                                        key="result"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-lg leading-relaxed text-slate-700 whitespace-pre-wrap"
                                    >
                                        {summary}
                                    </motion.div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 opacity-50">
                                        <FileText className="w-16 h-16" />
                                        <p className="text-center">Your generated summary will appear here!</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center gap-6">
                    <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 pl-4 text-slate-500 font-bold text-sm">
                            <Languages className="w-4 h-4" /> Language:
                        </div>
                        <select 
                            value={language} 
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-semibold outline-none text-slate-700"
                        >
                            <option value="English">English</option>
                            <option value="Sinhala">Sinhalese</option>
                            <option value="Tamil">Tamil</option>
                        </select>
                        <button
                            onClick={handleSummarize}
                            disabled={isLoading || !inputText.trim()}
                            className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Summarize Now</>}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
