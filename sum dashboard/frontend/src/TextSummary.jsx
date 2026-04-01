import React, { useState, useEffect } from 'react';
import './App.css';

function TextSummary() {
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
        if (!inputText.trim()) {
            alert('Please enter some text to summarize');
            return;
        }

        setIsLoading(true);
        setSummary('');

        try {
            const response = await fetch('http://localhost:5001/api/text/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: inputText, language }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch summary');
            }
            setSummary(data.summary);
        } catch (error) {
            console.error('Error fetching text summary:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="text-summary-page">
            <nav className="text-summary-nav">
                <button onClick={() => window.history.back()} className="nav-back-btn">
                    ← Dashboard
                </button>
            </nav>

            <header className="text-summary-header">
                <h1 className="text-summary-title">AI Text Summarizer</h1>
                <p className="text-summary-subtitle">
                    Use our AI text summarizer to create concise, accurate summaries of your documents, articles, and reports. Ideal for students, professionals, and writers.
                </p>
            </header>

            <main className="text-summary-container">
                <div className="text-summary-panels">
                    <div className="input-panel">
                        <textarea
                            placeholder="Enter your text to summarize"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            className="summary-textarea"
                        ></textarea>
                    </div>

                    <div className="output-panel">
                        <div className="output-tabs">
                            <div className="output-tab active">Summarized Text</div>
                        </div>
                        <div className="output-content">
                            {isLoading ? (
                                <div className="loading-state">Generating summary...</div>
                            ) : summary ? (
                                <div className="summary-result-text">{summary}</div>
                            ) : (
                                <div className="output-placeholder">
                                    Your generated results will be shown here!
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="text-summary-footer">
                    <button
                        onClick={handleSummarize}
                        className="summarize-btn-purple"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Summarizing...' : 'Summarize'}
                    </button>
                    
                    <div className="footer-controls">
                        <span className="word-count">Words: {wordCount}</span>
                        <select 
                            value={language} 
                            onChange={(e) => setLanguage(e.target.value)}
                            className="language-selector"
                        >
                            <option value="English">English</option>
                            <option value="Sinhala">Sinhala</option>
                            <option value="Tamil">Tamil</option>
                        </select>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default TextSummary;
