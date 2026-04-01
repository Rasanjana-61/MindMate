import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import VideoSummary from './VideoSummary'
import TextSummary from './TextSummary'
import FileSummary from './FileSummary'
import ResourceHub from './ResourceHub'
import './App.css'

function Dashboard() {
  const navigate = useNavigate()
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode')
    } else {
      document.body.classList.remove('light-mode')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }
  const categories = [
    { 
      title: 'Video Summarizer', 
      id: 'video', 
      desc: 'Transform long YouTube videos and podcasts into concise, actionable summaries in seconds.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
        </svg>
      )
    },
    { 
      title: 'Text Summarizer', 
      id: 'text',
      desc: 'Paste any text, article, or URL to extract key takeaways and highlights instantly with AI.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
        </svg>
      )
    },
    { 
      title: 'File Summarizer', 
      id: 'file',
      desc: 'Upload PDFs, Word documents, and text files to extract essential information effortlessly.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8c.4 0 .8-.2 1.1-.5.3-.3.5-.7.5-1.1V6.5L15.5 2z"/><path d="M3 7.6v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8"/><path d="M15 2v5h5"/>
        </svg>
      )
    },
    { 
      title: 'Resource hub', 
      id: 'resource-hub',
      desc: 'Explore a curated collection of E-books, video tutorials, and guides to master any subject.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
      )
    }
  ]

  const handleTryNow = (id) => {
    if (id === 'video') {
      navigate('/video-summary')
    } else if (id === 'text') {
      navigate('/text-summary')
    } else if (id === 'file') {
      navigate('/file-summary')
    } else if (id === 'resource-hub') {
      navigate('/resource-hub')
    }
  }

  return (
    <div className="dashboard-container">
      <header className="hero-section">
        <button 
          className="theme-toggle" 
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
        <div className="hero-content">
          <h1 className="hero-title">Your Summarizer & Resource hub</h1>
          <p className="hero-subtitle">
            Don't let a wall of text slow you down. Our AI-powered tools distill complex information into clear insights, helping you learn faster and master any topic at a glance.
          </p>
          <div className="hero-badge">AI-Powered Intelligence</div>
        </div>
      </header>

      <main className="content-wrapper">
        <section className="cards-section">
          <h2 className="section-title">Explore Our AI Suite</h2>
          <div className="cards-container">
            {categories.map((category) => (
              <div key={category.id} className="card">
                <div className="card-icon">{category.icon}</div>
                <h3 className="card-title">{category.title}</h3>
                <p className="card-desc">{category.desc}</p>
                <button
                  className="action-btn"
                  onClick={() => handleTryNow(category.id)}
                >
                  {category.id === 'resource-hub' ? 'Visit Now' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="workflow-section">
          <h2 className="section-title text-center">Efficiency Redefined</h2>
          <div className="workflow-grid">
            <div className="workflow-step">
              <div className="step-number">1</div>
              <h4>Input Content</h4>
              <p>Paste text, a URL, or upload a document to begin.</p>
            </div>
            <div className="workflow-step">
              <div className="step-number">2</div>
              <h4>AI Analysis</h4>
              <p>Our advanced AI processes and extracts key information.</p>
            </div>
            <div className="workflow-step">
              <div className="step-number">3</div>
              <h4>Instant Insights</h4>
              <p>Download or read your concise, actionable summary.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer-section">
        <div className="footer-content">
          <div className="footer-logo">Summarizer & Hub</div>
          <p>© 2026 Your Summarizer AI. All rights reserved.</p>
          <div className="footer-links">
            <span>Privacy Policy</span> • <span>Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/video-summary" element={<VideoSummary />} />
      <Route path="/text-summary" element={<TextSummary />} />
      <Route path="/file-summary" element={<FileSummary />} />
      <Route path="/resource-hub" element={<ResourceHub />} />
    </Routes>
  )
}

export default App
