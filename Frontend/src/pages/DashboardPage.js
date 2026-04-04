import { FaChartLine, FaLeaf } from 'react-icons/fa6';
import SummaryCards from '../components/common/SummaryCards';
import '../styles/dashboard.css';

function DashboardPage({ tasks, stats }) {
  return (
    <div className="page">
      <section className="page__hero page__hero--dashboard">
        <div className="page__hero-copy page__hero-copy--wide">
          
          <h1>Focus, tasks, and progress in one place.</h1>

          <div className="page__hero-metrics">
            <div className="page__hero-metric">
              <span>Focus momentum</span>
              <strong>{stats.todayMinutes} min today</strong>
            </div>
            <div className="page__hero-metric">
              <span>Task progress</span>
              <strong>{stats.completedTasksCount} tasks completed</strong>
            </div>
          </div>
        </div>

        <div className="page__hero-visual">
          <div className="page__hero-highlight page__hero-highlight--primary">
            <span className="page__eyebrow">Focus</span>
            <strong>Keep it simple</strong>
            <span>One task at a time.</span>
          </div>

          <div className="page__hero-spotlight">
            <div className="page__hero-spotlight-orb">
              <div>
                <span>Weekly focus</span>
                <strong>{stats.weekMinutes} min</strong>
              </div>
            </div>
            <div className="page__hero-spotlight-grid">
              <div className="page__hero-spotlight-card">
                <span className="page__eyebrow">Current streak</span>
                <strong>{stats.streak} days</strong>
              </div>
              <div className="page__hero-spotlight-card">
                <span className="page__eyebrow">Upcoming tasks</span>
                <strong>{stats.upcomingTasksCount}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SummaryCards stats={stats} />

      <section className="dashboard-grid">
        <div className="dashboard-grid__side panel dashboard-grid__side--elevated">
          <div className="section-heading">
            <div>
              <h2>Quick Notes</h2>
            </div>
            <span className="pill">
              <FaLeaf />
              Focus
            </span>
          </div>

          <div className="dashboard-note">
            <strong>Next task</strong>
            <p>
              {tasks.find((task) => task.status !== 'Completed')?.title ||
                'All tasks done.'}
            </p>
          </div>

          <div className="dashboard-note">
            <strong>Break reminder</strong>
            <p>Drink water and stretch.</p>
          </div>
        </div>
        <div className="dashboard-grid__side panel dashboard-grid__side--elevated">
          <div className="section-heading">
            <div>
              <h2>Pages</h2>
            </div>
          </div>

          <div className="dashboard-note">
            <strong>Focus Timer Page</strong>
            <p>Open the timer from the left navigation.</p>
          </div>

          <div className="dashboard-note">
            <strong>Tasks Page</strong>
            <p>Manage your tasks on the separate tasks page.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
