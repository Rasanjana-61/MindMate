import { motion, AnimatePresence } from 'framer-motion';
import { MoodTrackerSidebar } from './MoodTrackerSidebar';
import { Dashboard as OverviewContent } from '../pages/Overview';
import { JournalEntry } from '../pages/JournalEntry';
import { MoodHistory } from '../pages/MoodHistory';
import { Results as MoodResults } from '../pages/Results';

export function MoodTrackerDashboard({
  currentPage,
  onNavigate,
  user,
  onLogout,
  moodAnalysisResult,
  moodSelectedJournalDate,
}) {
  const handlePageChange = (page) => {
    if (!onNavigate) {
      return;
    }

    switch (page) {
      case 'mood-dashboard':
        onNavigate('dashboard');
        return;
      case 'mood-journal':
        onNavigate('journal');
        return;
      case 'mood-history':
        onNavigate('history');
        return;
      case 'mood-results':
        onNavigate('results');
        return;
      default:
        onNavigate('dashboard');
    }
  };

  const handleMoodNavigate = (screen, options = {}) => {
    if (onNavigate) {
      onNavigate(screen, options);
    }
  };

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'mood-dashboard':
        return <OverviewContent onNavigate={handleMoodNavigate} />;
      case 'mood-journal':
        return (
          <JournalEntry
            onAnalysisComplete={(result) => {
              if (onNavigate) {
                onNavigate('results', { analysisResult: result });
              }
            }}
            initialEntryDate={moodSelectedJournalDate}
          />
        );
      case 'mood-history':
        return <MoodHistory onNavigate={handleMoodNavigate} />;
      case 'mood-results':
        return <MoodResults analysisResult={moodAnalysisResult} onNavigate={handleMoodNavigate} />;
      default:
        return <OverviewContent onNavigate={handleMoodNavigate} />;
    }
  };

  return (
    <div className="mood-tracker-app min-h-screen bg-warm-sand flex">
      {/* Sidebar */}
      <MoodTrackerSidebar
        currentPage={currentPage}
        setPage={handlePageChange}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Main content area */}
        <main className="flex-1 pb-24 md:pb-8 pt-6 md:pt-8 px-4 md:px-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
