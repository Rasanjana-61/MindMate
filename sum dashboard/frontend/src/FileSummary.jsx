import React, { useState } from 'react';
import './App.css';

function FileSummary() {
    const [file, setFile] = useState(null);
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSummarize = async () => {
        if (!file) {
            alert('Please select a file first');
            return;
        }

        setIsLoading(true);
        setSummary('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:5001/api/file/summarize', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to summarize file');
            }
            setSummary(data.summary);
        } catch (error) {
            console.error('Error summarizing file:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="file-summary-page">
            <nav className="text-summary-nav">
                <button onClick={() => window.history.back()} className="nav-back-btn">
                    ← Dashboard
                </button>
            </nav>

            <header className="file-summary-header">
                <h1 className="file-summary-title">File summarizer</h1>
                <p className="file-summary-subtitle">
                    Summarize PDFs, word file Generate summary text
                </p>
            </header>

            <main className="file-summary-container">
                <div className="file-summary-panels">
                    <div 
                        className={`file-upload-panel ${dragActive ? 'drag-active' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <div className="upload-content">
                            <div className="file-icon">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#C7D2FE" />
                                    <path d="M14 2V8H20L14 2Z" fill="#818CF8" />
                                    <path d="M12 18V12M12 12L15 15M12 12L9 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            
                            <div className="upload-actions">
                                <label htmlFor="file-upload" className="choose-file-btn">
                                    Choose File
                                </label>
                                <input 
                                    id="file-upload" 
                                    type="file" 
                                    onChange={handleChange} 
                                    style={{ display: 'none' }}
                                    accept=".pdf,.docx"
                                />
                                <div className="upload-icon-small">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                </div>
                            </div>
                            
                            <p className="drop-text">or drop files here</p>
                            {file && <p className="selected-filename">Selected: {file.name}</p>}
                        </div>

                        <div className="summary-action-container">
                            <button 
                                onClick={handleSummarize} 
                                className="summary-btn-orange"
                                disabled={isLoading || !file}
                            >
                                {isLoading ? 'Processing...' : 'Summary'}
                            </button>
                        </div>
                    </div>

                    <div className="output-panel">
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
            </main>
        </div>
    );
}

export default FileSummary;
