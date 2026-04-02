import { useState } from 'react';
import { Send, Eraser, Loader2 } from 'lucide-react';

export function SummarizerInput({ onSummarize, isLoading }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSummarize(text);
    }
  };

  const handleClear = () => {
    setText('');
  };

  return (
    <div className="card p-6 bg-white shadow-sm border border-wellness-border rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-app-text-primary">Paste your content</h2>
        <button
          onClick={handleClear}
          className="text-xs text-app-text-secondary hover:text-app-stress flex items-center gap-1 transition-colors"
          disabled={!text || isLoading}
        >
          <Eraser className="w-3.5 h-3.5" /> Clear All
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the text you want to summarize here (e.g., lecture notes, articles, or research papers)..."
          className="w-full h-64 p-4 rounded-xl border border-app-primary-light/50 focus:border-app-primary focus:ring-1 focus:ring-app-primary outline-none transition-all resize-none text-app-text-primary placeholder:text-app-text-secondary/50 text-sm leading-relaxed"
          disabled={isLoading}
        />

        <div className="flex justify-between items-center">
          <span className="text-xs text-app-text-secondary">
            {text.length} characters {text.length > 30000 && <span className="text-app-stress">(Max 30,000 characters)</span>}
          </span>
          <button
            type="submit"
            disabled={!text.trim() || text.length > 30000 || isLoading}
            className={`btn-primary px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-app-primary/20 ${
              (!text.trim() || text.length > 30000 || isLoading) ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Summarizing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Summarize Now
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
