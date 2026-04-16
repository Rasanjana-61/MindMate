import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, FileDigit, Upload, Loader2, FileCheck, X, AlertCircle, FileText } from 'lucide-react';
import { request } from '../../lib/auth';
import './Summarizer.css';

export function FileSummary({ setPage }) {
    const [file, setFile] = useState(null);
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState('');

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
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (selectedFile) => {
        setError('');
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(selectedFile.type)) {
            setError('Please upload a PDF or Word (.docx) file.');
            return;
        }
        setFile(selectedFile);
    };

    const handleSummarize = async () => {
        if (!file) return;

        setIsLoading(true);
        setSummary('');
        setError('');

        const formData = new FormData();
        formData.append('type', 'file');
        formData.append('file', file);

        try {
            const response = await request('/summarizer/summarize', {
                method: 'POST',
                body: formData,
            });

            if (response.success) {
                setSummary(response.summary);
            } else {
                throw new Error(response.message || 'Failed to summarize file');
            }
        } catch (err) {
            console.error('Error summarizing file:', err);
            setError(`Error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="file-summary-page bg-[#FBF8F3]">
            <nav className="text-summary-nav">
                <button onClick={() => setPage('summarizer')} className="nav-back-btn inline-flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Dashboard
                </button>
                <div className="flex-grow text-center">
                    <h2 className="text-xl font-bold text-slate-800">AI File Summarizer</h2>
                </div>
            </nav>

            <main className="file-summary-container max-w-7xl mx-auto py-12">
                <div className="mb-12 text-center max-w-3xl mx-auto">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Analyze Documents</h1>
                    <p className="text-lg text-slate-600 leading-relaxed">
                        Upload your PDF or Word documents and let our AI extract the most important information for you. Save time and get straight to the point.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 min-h-[500px]">
                    <div className="flex flex-col gap-6">
                        <div 
                            className={`file-upload-panel h-full flex flex-col items-center justify-center border-2 border-dashed rounded-[40px] transition-all p-12 ${dragActive ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200'} shadow-sm`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <AnimatePresence mode="wait">
                                {file ? (
                                    <motion.div 
                                        key="selected"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center text-center"
                                    >
                                        <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
                                            <FileCheck className="w-10 h-10" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2 truncate max-w-[250px]">{file.name}</h3>
                                        <p className="text-sm text-slate-500 mb-8">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        <button 
                                            onClick={() => setFile(null)}
                                            className="text-red-500 text-sm font-bold flex items-center gap-1 hover:underline"
                                        >
                                            <X className="w-4 h-4" /> Remove File
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center text-center"
                                    >
                                        <div className="w-20 h-20 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center mb-8">
                                            <Upload className="w-10 h-10" />
                                        </div>
                                        <label htmlFor="file-upload" className="cursor-pointer bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 mb-4">
                                            Choose File
                                        </label>
                                        <input 
                                            id="file-upload" 
                                            type="file" 
                                            onChange={handleChange} 
                                            style={{ display: 'none' }}
                                            accept=".pdf,.docx"
                                        />
                                        <p className="text-slate-500 font-medium">or drop file here</p>
                                        <p className="text-xs text-slate-400 mt-4 uppercase tracking-widest font-bold">PDF, DOCX up to 10MB</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100"
                            >
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm font-semibold">{error}</span>
                            </motion.div>
                        )}

                        <button 
                            onClick={handleSummarize} 
                            disabled={isLoading || !file}
                            className="w-full bg-emerald-500 text-white py-4 rounded-3xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-xl shadow-emerald-500/20 text-lg"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><FileDigit className="w-6 h-6" /> Summarize Document</>}
                        </button>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <FileText className="w-4 h-4" /> AI Analysis Result
                            </span>
                        </div>
                        <div className="flex-1 rounded-[40px] bg-white border border-slate-100 shadow-sm p-10 overflow-y-auto min-h-[400px]">
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
                                        <p className="font-medium text-lg">Extracting key points...</p>
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
                                    <div className="flex flex-col items-center justify-center h-full gap-6 text-slate-400 opacity-50 text-center">
                                        <FileText className="w-20 h-20" />
                                        <p className="text-lg">Upload a document to see the AI-generated summary here.</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
