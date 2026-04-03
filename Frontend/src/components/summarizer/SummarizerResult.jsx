import { Copy, Download, Share2, Sparkles, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function SummarizerResult({ summary, error, isLoading }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success('Summary copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([summary], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `MindMate_Summary_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(element); 
    element.click();
    toast.success('Summary downloaded as text file!');
  };

  if (isLoading) {
    return (
      <div className="card p-8 bg-white/50 backdrop-blur border border-wellness-border rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-app-primary/10 border-t-app-primary rounded-full animate-spin" />
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-app-primary w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text font-semibold text-app-text-primary">Generating your AI summary...</h3>
          <p className="text-xs text-app-text-secondary">This might take a few seconds.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 bg-app-stress/5 border border-app-stress/20 rounded-2xl flex items-start gap-4">
        <div className="bg-white p-2 rounded-xl text-app-stress shadow-sm shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-app-stress mb-1 text-sm">Failed to generate summary</h3>
          <p className="text-xs text-app-text-secondary leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="card p-12 bg-wellness-bg/30 border border-wellness-border border-dashed rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
        <div className="bg-white p-4 rounded-full shadow-sm text-app-text-secondary/30">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-app-text-secondary">Awaiting Input</p>
          <p className="text-xs text-app-text-secondary/70">Once you submit text, the AI summary will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-white shadow-sm border border-wellness-border rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-r from-app-mood/10 to-transparent px-6 py-4 border-b border-wellness-border flex items-center justify-between">
        <h2 className="text font-semibold flex items-center gap-2 text-app-text-primary">
          <Sparkles className="w-4 h-4 text-app-mood" /> AI Generated Summary
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-app-text-secondary transition-all"
            title="Copy to clipboard"
          >
            <Copy className={`w-4 h-4 ${copied ? 'text-app-primary' : ''}`} />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-app-text-secondary transition-all"
            title="Download as text"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="prose prose-sm max-w-none text-app-text-primary leading-relaxed whitespace-pre-wrap">
          {summary}
        </div>
        
        <div className="mt-8 pt-6 border-t border-wellness-border flex items-center justify-between">
          <p className="text-[10px] text-app-text-secondary italic">
            Summarized by Gemini AI Pro. Verify important details.
          </p>
          <button className="text-[10px] uppercase font-bold tracking-widest text-app-primary hover:text-app-primary-dark transition-colors flex items-center gap-1">
            <Share2 className="w-3 h-3" /> Share Summary
          </button>
        </div>
      </div>
    </div>
  );
}
