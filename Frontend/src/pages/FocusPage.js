import { FaRegClock } from 'react-icons/fa6';
import FocusTimer from '../components/focus/FocusTimer';
import '../styles/dashboard.css';

function FocusPage({ tasks, stats, onUpdateFocusSettings, onSessionComplete }) {
  const openTasksCount = tasks.filter((task) => task.status !== 'Completed').length;

  return (
    <div className="page">
      <section className="page__hero">
        <div className="page__hero-copy">
          
          <h1>Run a study session with a simple timer.</h1>
        </div>

        <div className="page__hero-highlight">
          <span className="page__eyebrow">Open Tasks</span>
          <strong>{openTasksCount}</strong>
          <span>tasks remaining</span>
        </div>
      </section>

      <FocusTimer
        focusDuration={stats.focusDuration}
        breakDuration={stats.breakDuration}
        onUpdateSettings={onUpdateFocusSettings}
        onSessionComplete={onSessionComplete}
      />
    </div>
  );
}

export default FocusPage;
