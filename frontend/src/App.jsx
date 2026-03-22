import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { JournalEntry } from './pages/JournalEntry'
import { Results } from './pages/Results'
import { MoodHistory } from './pages/MoodHistory'

const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -10,
  },
}

function App() {
  const [activeScreen, setActiveScreen] = useState('dashboard')
  const [analysisResult, setAnalysisResult] = useState(null)

  const handleNavigate = (screen) => {
    setActiveScreen(screen)
  }

  const handleAnalysisComplete = (result) => {
    setAnalysisResult(result)
    setActiveScreen('results')
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />
      case 'journal':
        return <JournalEntry onAnalysisComplete={handleAnalysisComplete} />
      case 'results':
        return <Results analysisResult={analysisResult} onNavigate={handleNavigate} />
      case 'history':
        return <MoodHistory />
      case 'encouragement':
        return <Encouragement />
      default:
        return <Dashboard onNavigate={handleNavigate} />
    }
  }

  return (
    <div className="min-h-screen w-full bg-cream flex">
      <Sidebar activeScreen={activeScreen} onNavigate={handleNavigate} />

      {/* Main Content */}
      <main
        className="flex-1 lg:ml-60 min-h-screen pb-20 lg:pb-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20%, rgba(127, 175, 138, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(207, 230, 230, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(207, 227, 210, 0.08) 0%, transparent 70%),
            linear-gradient(180deg, #F4EFE7 0%, #FBF8F3 100%)
          `,
        }}
      >
        {/* Full width container */}
        <div className="w-full px-6 pt-10 pb-6 md:px-8 md:pt-12 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScreen}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

export default App