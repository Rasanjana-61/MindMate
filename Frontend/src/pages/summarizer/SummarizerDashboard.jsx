import React from 'react';
import { motion } from 'framer-motion';
import { Video, FileText, File, Grid, ArrowRight } from 'lucide-react';

export function SummarizerDashboard({ setPage }) {
  const categories = [
    { 
      title: 'Video Summarizer', 
      id: 'video-summary', 
      desc: 'Transform YouTube videos into concise, actionable summaries in seconds.',
      icon: <Video className="w-8 h-8" />,
      color: 'from-blue-500/20 to-indigo-500/20',
      iconColor: 'text-blue-500'
    },
    { 
      title: 'Text Summarizer', 
      id: 'text-summary',
      desc: 'Extract key takeaways and highlights instantly from any text or article with AI.',
      icon: <FileText className="w-8 h-8" />,
      color: 'from-emerald-500/20 to-teal-500/20',
      iconColor: 'text-emerald-500'
    },
    { 
      title: 'File Summarizer', 
      id: 'file-summary',
      desc: 'Upload PDFs and Word documents to extract essential information effortlessly.',
      icon: <File className="w-8 h-8" />,
      color: 'from-purple-500/20 to-pink-500/20',
      iconColor: 'text-purple-500'
    },
    { 
      title: 'Resource hub', 
      id: 'resources',
      desc: 'Explore a curated collection of materials to master any subject.',
      icon: <Grid className="w-8 h-8" />,
      color: 'from-orange-500/20 to-amber-500/20',
      iconColor: 'text-orange-500'
    }
  ];

  return (
    <div className="min-h-screen p-8 bg-[#FBF8F3]">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wider text-emerald-600 uppercase bg-emerald-50 rounded-full"
          >
            AI-Powered Intelligence
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-extrabold text-slate-900 mb-6"
          >
            Your Summarizer & Resource Hub
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed"
          >
            Don't let a wall of text slow you down. Our AI-powered tools distill complex information into clear insights, helping you learn faster and master any topic at a glance.
          </motion.p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col h-full group cursor-pointer transition-all hover:shadow-xl hover:shadow-emerald-500/5"
              onClick={() => setPage(category.id)}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center ${category.iconColor} mb-6 group-hover:scale-110 transition-transform`}>
                {category.icon}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">{category.title}</h3>
              <p className="text-slate-600 mb-8 flex-grow leading-relaxed">{category.desc}</p>
              <button
                className="inline-flex items-center gap-2 font-bold text-emerald-600 group-hover:gap-3 transition-all"
              >
                {category.id === 'resource-hub' ? 'Visit Now' : 'Get Started'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </div>

        <section className="bg-white rounded-[40px] p-12 border border-slate-100">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Efficiency Redefined</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { num: '1', title: 'Input Content', desc: 'Paste text, a URL, or upload a document to begin.' },
              { num: '2', title: 'AI Analysis', desc: 'Our advanced AI processes and extracts key information.' },
              { num: '3', title: 'Instant Insights', desc: 'Download or read your concise, actionable summary.' }
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white font-bold text-xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                  {step.num}
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h4>
                <p className="text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
