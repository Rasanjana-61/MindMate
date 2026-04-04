import { FaListCheck } from 'react-icons/fa6';
import TaskManager from '../components/tasks/TaskManager';
import '../styles/dashboard.css';

function TasksPage({ tasks, stats, onSaveTask, onDeleteTask, onToggleTaskCompletion }) {
  return (
    <div className="page">
      <section className="page__hero">
        <div className="page__hero-copy">
          <h1>View, add, and update your study tasks.</h1>
        </div>

        <div className="page__hero-highlight">
          <span className="page__eyebrow">Completed</span>
          <strong>{stats.completedTasksCount}</strong>
          <span>tasks done</span>
        </div>
      </section>

      <TaskManager
        tasks={tasks}
        onSaveTask={onSaveTask}
        onDeleteTask={onDeleteTask}
        onToggleTaskCompletion={onToggleTaskCompletion}
      />
    </div>
  );
}

export default TasksPage;
