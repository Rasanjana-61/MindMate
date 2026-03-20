import React from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import VideoSummary from './VideoSummary'
import './App.css'

function Dashboard() {
  const navigate = useNavigate()
  const categories = [
    { title: 'Text', id: 'text' },
    { title: 'Word', id: 'word' },
    { title: 'Video', id: 'video' }
  ]

  const handleTryNow = (id) => {
    if (id === 'video') {
      navigate('/video-summary')
    } else {
      alert(`${id} summarization coming soon!`)
    }
  }

  return (
    <div className="dashboard-container">
      <header className="hero-section">
        <h1 className="hero-title">Your Summarizer</h1>
        <p className="hero-subtitle">
          Don't let a wall of text slow you down. Our AI extracts key points and highlights so you can master any topic at a glance.
        </p>
      </header>

      <main className="cards-container">
        {categories.map((category) => (
          <div key={category.id} className="card">
            <h2 className="card-title">{category.title}</h2>
            <button
              className="try-now-btn"
              onClick={() => handleTryNow(category.id)}
            >
              Try now
            </button>
          </div>
        ))}
      </main>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/video-summary" element={<VideoSummary />} />
    </Routes>
  )
}

export default App
